/**
 * orchestrator/isonomia-client.ts
 *
 * Typed wrapper over every Isonomia REST call the orchestrator makes.
 *
 * Responsibilities:
 *   • Auth header switching per agent role
 *   • Retry policy:
 *       - 5xx: exponential backoff, 3 retries
 *       - 4xx: no retry (caller decides)
 *       - network/timeout: exponential backoff, 3 retries
 *   • Request/response logging via the supplied RoundLogger (optional)
 *   • JSON serialization
 *
 * Design notes:
 *   • The client itself is stateless — auth is supplied per call (or via
 *     `withAgent()` for ergonomics).
 *   • We use the agent's bearer ID token. Refresh is the orchestrator's
 *     responsibility (call `npm run refresh:agents` between phases).
 */

import type { OrchestratorConfig, AgentIdentity } from "./config";
import { agentByRole } from "./config";
import type { RoundLogger } from "./log/round-logger";

const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;

export interface IsonomiaCallContext {
  /** Agent role whose bearer token should sign this call. */
  role: string;
  /** Optional logger to emit `isonomia_call` / `isonomia_error` events. */
  logger?: RoundLogger;
}

export class IsonomiaError extends Error {
  status: number;
  body: string;
  path: string;
  method: string;
  constructor(method: string, path: string, status: number, body: string) {
    super(`Isonomia ${method} ${path} → ${status}: ${body.slice(0, 300)}`);
    this.method = method;
    this.path = path;
    this.status = status;
    this.body = body;
  }
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function isRetryableStatus(status: number): boolean {
  return status >= 500 && status < 600;
}

export class IsonomiaClient {
  constructor(private cfg: OrchestratorConfig) {}

  private agent(role: string): AgentIdentity {
    return agentByRole(this.cfg, role);
  }

  private async raw(
    method: string,
    pathStr: string,
    init: { body?: unknown; ctx: IsonomiaCallContext; query?: Record<string, string | number | undefined> },
  ): Promise<{ status: number; bodyText: string; bodyJson: unknown }> {
    const agent = this.agent(init.ctx.role);
    const qs = init.query
      ? "?" +
        Object.entries(init.query)
          .filter(([, v]) => v !== undefined && v !== null)
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
          .join("&")
      : "";
    const url = `${this.cfg.isonomiaBaseUrl}${pathStr}${qs}`;

    let attempt = 0;
    let lastErr: unknown = null;
    while (attempt < MAX_RETRIES) {
      attempt++;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
      try {
        const res = await fetch(url, {
          method,
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${agent.idToken}`,
            "User-Agent": "polarization-1-orchestrator/0.1",
          },
          body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
        });
        const bodyText = await res.text();
        let bodyJson: unknown = null;
        if (bodyText) {
          try { bodyJson = JSON.parse(bodyText); } catch { bodyJson = bodyText; }
        }

        init.ctx.logger?.event("isonomia_call", {
          agent: init.ctx.role,
          method,
          path: pathStr,
          status: res.status,
          requestBody: init.body ?? null,
          responseBody: bodyJson,
          attempt,
        });

        if (!res.ok) {
          if (isRetryableStatus(res.status) && attempt < MAX_RETRIES) {
            await sleep(250 * 2 ** (attempt - 1));
            continue;
          }
          throw new IsonomiaError(method, pathStr, res.status, bodyText);
        }
        return { status: res.status, bodyText, bodyJson };
      } catch (err) {
        if (err instanceof IsonomiaError) {
          // Already non-retryable or out of retries — propagate.
          init.ctx.logger?.event("isonomia_error", {
            agent: init.ctx.role,
            method,
            path: pathStr,
            status: err.status,
            error: err.body.slice(0, 500),
            attempt,
          });
          throw err;
        }
        lastErr = err;
        init.ctx.logger?.event("isonomia_error", {
          agent: init.ctx.role,
          method,
          path: pathStr,
          status: 0,
          error: (err as Error)?.message ?? String(err),
          attempt,
        });
        if (attempt >= MAX_RETRIES) break;
        await sleep(250 * 2 ** (attempt - 1));
      } finally {
        clearTimeout(timer);
      }
    }
    throw new Error(
      `Isonomia ${method} ${pathStr} failed after ${MAX_RETRIES} attempts: ${
        (lastErr as Error)?.message ?? String(lastErr)
      }`,
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // Identity
  // ─────────────────────────────────────────────────────────────────

  async getMe(role: string, logger?: RoundLogger): Promise<{ uid: string; userId: string | number }> {
    const r = await this.raw("GET", "/api/me", { ctx: { role, logger } });
    return r.bodyJson as { uid: string; userId: string | number };
  }

  // ─────────────────────────────────────────────────────────────────
  // Schemes (read-only; no auth required but we send it anyway)
  // ─────────────────────────────────────────────────────────────────

  async getSchemes(role: string, logger?: RoundLogger): Promise<unknown> {
    const r = await this.raw("GET", "/api/schemes", { ctx: { role, logger } });
    return r.bodyJson;
  }

  // ─────────────────────────────────────────────────────────────────
  // Claim minting
  // ─────────────────────────────────────────────────────────────────

  async createClaim(
    body: { deliberationId: string; text: string; claimType?: string },
    ctx: IsonomiaCallContext,
  ): Promise<{ id: string; moid: string; text: string }> {
    const r = await this.raw("POST", "/api/claims", { body, ctx });
    const j = r.bodyJson as any;
    // POST /api/claims returns the claim under various shapes depending on
    // the path; normalize to {id, moid, text}.
    const claim = j?.claim ?? j?.data ?? j;
    return { id: claim.id, moid: claim.moid, text: claim.text };
  }

  // ─────────────────────────────────────────────────────────────────
  // Claim edges (topology)
  // ─────────────────────────────────────────────────────────────────

  async createClaimEdge(
    fromClaimId: string,
    body: {
      toClaimId: string;
      type: "supports" | "rebuts";
      attackType?: "REBUTS" | "UNDERCUTS" | "UNDERMINES";
      targetScope?: string;
    },
    ctx: IsonomiaCallContext,
  ): Promise<unknown> {
    const r = await this.raw(
      "POST",
      `/api/claims/${encodeURIComponent(fromClaimId)}/edges`,
      { body, ctx },
    );
    return r.bodyJson;
  }

  // ─────────────────────────────────────────────────────────────────
  // Representative claim (Stage-2 prereq endpoint)
  // ─────────────────────────────────────────────────────────────────

  async setRepresentativeClaim(
    deliberationId: string,
    claimId: string | null,
    ctx: IsonomiaCallContext,
  ): Promise<{ deliberationId: string; representativeClaimId: string | null }> {
    const r = await this.raw(
      "PATCH",
      `/api/deliberations/${encodeURIComponent(deliberationId)}/representative-claim`,
      { body: { claimId }, ctx },
    );
    return r.bodyJson as { deliberationId: string; representativeClaimId: string | null };
  }

  // ─────────────────────────────────────────────────────────────────
  // Evidence context
  // ─────────────────────────────────────────────────────────────────

  async createStack(
    body: { name: string; slug?: string; visibility?: "public_open" | "public_closed" | "private" | "unlisted"; description?: string | null },
    ctx: IsonomiaCallContext,
  ): Promise<{ id: string; slug: string }> {
    const r = await this.raw("POST", "/api/stacks", { body, ctx });
    const j = r.bodyJson as { id: string; slug: string };
    return { id: j.id, slug: j.slug };
  }

  async addStackItem(
    stackId: string,
    body: {
      itemKind: "url" | "doi";
      url?: string;
      doi?: string;
      title?: string;
      authors?: string[];
      publishedAt?: string;
      abstract?: string;
      keyFindings?: string[];
      tags?: string[];
    },
    ctx: IsonomiaCallContext,
  ): Promise<{ stackItemId: string; sourceId: string; contentSha256?: string | null; archive?: { url: string; capturedAt: string } | null }> {
    const r = await this.raw("POST", `/api/stacks/${encodeURIComponent(stackId)}/items`, { body, ctx });
    return r.bodyJson as any;
  }

  async ensureDeliberation(
    body: { hostType: "library_stack" | "article" | "post" | "room_thread" | "site" | "inbox_thread"; hostId: string },
    ctx: IsonomiaCallContext,
  ): Promise<{ id: string; created: boolean }> {
    const r = await this.raw("POST", "/api/deliberations/ensure", { body, ctx });
    const j = r.bodyJson as { id: string; created: boolean };
    return { id: j.id, created: !!j.created };
  }

  async bindEvidenceStack(
    deliberationId: string,
    stackId: string,
    ctx: IsonomiaCallContext,
  ): Promise<unknown> {
    const r = await this.raw(
      "POST",
      `/api/deliberations/${encodeURIComponent(deliberationId)}/evidence-context`,
      { body: { stackId }, ctx },
    );
    return r.bodyJson;
  }

  async getEvidenceContext(
    deliberationId: string,
    ctx: IsonomiaCallContext,
  ): Promise<{
    stack: { id: string; name: string; sourceCount: number };
    sources: Array<{
      sourceId: string;
      url: string | null;
      doi: string | null;
      title: string | null;
      authors: string[];
      publishedAt: string | null;
      abstract: string | null;
      keyFindings: string[];
      tags: string[];
      contentSha256: string | null;
      archiveUrl: string | null;
      citationToken: string;
    }>;
  }> {
    const r = await this.raw(
      "GET",
      `/api/deliberations/${encodeURIComponent(deliberationId)}/evidence-context`,
      { ctx },
    );
    return r.bodyJson as any;
  }

  // ─────────────────────────────────────────────────────────────────
  // State (composed from existing v3 endpoints — H2 not yet built)
  // ─────────────────────────────────────────────────────────────────

  async getFingerprint(deliberationId: string, ctx: IsonomiaCallContext): Promise<unknown> {
    const r = await this.raw(
      "GET",
      `/api/v3/deliberations/${encodeURIComponent(deliberationId)}/fingerprint`,
      { ctx },
    );
    return r.bodyJson;
  }

  async getFrontier(deliberationId: string, ctx: IsonomiaCallContext): Promise<unknown> {
    const r = await this.raw(
      "GET",
      `/api/v3/deliberations/${encodeURIComponent(deliberationId)}/frontier`,
      { ctx },
    );
    return r.bodyJson;
  }

  async getMissingMoves(deliberationId: string, ctx: IsonomiaCallContext): Promise<unknown> {
    const r = await this.raw(
      "GET",
      `/api/v3/deliberations/${encodeURIComponent(deliberationId)}/missing-moves`,
      { ctx },
    );
    return r.bodyJson;
  }

  async getChains(deliberationId: string, ctx: IsonomiaCallContext): Promise<unknown> {
    const r = await this.raw(
      "GET",
      `/api/v3/deliberations/${encodeURIComponent(deliberationId)}/chains`,
      { ctx },
    );
    return r.bodyJson;
  }

  /**
   * List claims in a deliberation. Used by Phase 1 finalize audit.
   * Returns up to 500 claims with `id` and `text`.
   */
  async listClaims(
    deliberationId: string,
    ctx: IsonomiaCallContext,
  ): Promise<Array<{ id: string; text: string }>> {
    const r = await this.raw(
      "GET",
      `/api/claims/search`,
      { ctx, query: { deliberationId } },
    );
    const body = r.bodyJson as { ok?: boolean; claims?: Array<{ id: string; text: string }> } | null;
    return body?.claims ?? [];
  }
}
