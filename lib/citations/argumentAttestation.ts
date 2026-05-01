/**
 * Argument Attestation Envelope
 *
 * Track A.2 of the AI-Epistemic-Infrastructure Roadmap.
 *
 * Builds a canonical, content-addressed "attestation envelope" for an
 * argument permalink. The envelope is the unit an LLM (or any external
 * citer) should embed when referencing an Isonomia argument. It includes:
 *   - The stable permalink + version
 *   - A sha256 content hash over the canonical AIF-relevant fields
 *   - The dialectical status (attacks / supports / CQ counters / standing)
 *   - Evidence provenance pointers
 *
 * Re-used by:
 *   - The rich JSON-LD on the public argument page (/a/[identifier])
 *   - The AIF-JSON-LD content-negotiated endpoint
 *   - The MCP server (Track B.2)
 *   - The future public REST API (Track B.3)
 */

import crypto from "crypto";
import { prisma } from "@/lib/prismaclient";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://isonomia.app";

// ============================================================
// TYPES
// ============================================================

export type Testedness = "untested" | "lightly_tested" | "well_tested";

export interface DialecticalStatus {
  /** Inbound conflict applications targeting this argument or its conclusion */
  incomingAttacks: number;
  /** Inbound argument-edges of type SUPPORT */
  incomingSupports: number;
  /** Inbound argument-edges of type ATTACK (rebut/undercut/undermine) */
  incomingAttackEdges: number;
  /** Critical questions defined for the primary scheme */
  criticalQuestionsRequired: number;
  /** Critical questions answered/satisfied for this argument */
  criticalQuestionsAnswered: number;
  /** Critical questions currently OPEN */
  criticalQuestionsOpen: number;
  /**
   * Heuristic standing score in [0, 1]. Combines CQ satisfaction and
   * attack-resistance. Intended as a quick orientation signal only — not
   * a formal Dung-style acceptability label.
   *
   * `null` when there is no scheme attached (no CQ structure to score
   * against) and no inbound traffic. Reading a non-null score implies the
   * argument has at least one CQ slot defined or has received dialectical
   * pressure. This avoids the "0 CQs required → standing 1.0" artifact
   * that misled clients in early MCP transcripts.
   */
  standingScore: number | null;
  /** True if the argument has crossed the "dialectically tested" threshold */
  isTested: boolean;
  /**
   * Coarse human/LLM-readable testedness label derived from CQ counts and
   * inbound traffic. Saves clients from reverse-engineering it from raw
   * counters.
   *   - "untested"        — no CQs answered, no incoming attacks/supports
   *   - "lightly_tested"  — 1 CQ answered OR 1 attack OR 1 support
   *   - "well_tested"     — isTested === true
   */
  testedness: Testedness;
}

export interface EvidenceProvenance {
  evidenceId: string;
  uri: string | null;
  title: string | null;
  citation: string | null;
  /** sha256 of the source body, when archived (Track A.4) */
  contentSha256: string | null;
  /** Wayback / archive.org snapshot URL, when archived (Track A.4) */
  archivedUrl: string | null;
  archivedAt: string | null;
}

export interface ArgumentAttestation {
  /** The canonical short-code permalink path component (or argument id fallback) */
  identifier: string;
  /** Argument record id */
  argumentId: string;
  /** Stable permalink URL */
  permalink: string;
  /** Permalink version (bumps on substantive edits) */
  version: number;
  /** sha256 over the canonical attested payload (see canonicalPayload below) */
  contentHash: string;
  /** Immutable URL pinned to the current contentHash (server-stable address) */
  immutablePermalink: string;
  /** ISO timestamp when this attestation was generated */
  retrievedAt: string;
  /** ISO timestamp the underlying argument was created */
  createdAt: string | null;
  /** ISO timestamp the underlying argument was last updated */
  updatedAt: string | null;

  /** Conclusion claim (if any) */
  conclusion: {
    claimId: string;
    moid: string | null;
    text: string;
  } | null;

  /** Premises (claim id + text), in declared order */
  premises: Array<{
    claimId: string;
    moid: string | null;
    text: string;
    isImplicit: boolean;
  }>;

  /** Primary argumentation scheme (if assigned) */
  scheme: {
    id: string;
    key: string | null;
    name: string | null;
    title: string | null;
  } | null;

  /** Evidence with provenance pointers */
  evidence: EvidenceProvenance[];

  /** Confidence in [0, 1] (author-supplied) */
  confidence: number | null;

  /** Dialectical status counters and standing score */
  dialecticalStatus: DialecticalStatus;

  /** Deliberation context */
  deliberation: {
    id: string;
    title: string | null;
  } | null;

  /** Author info (display only — not a signature; Track D.1 is future work) */
  author: {
    id: string | null;
    displayName: string | null;
  } | null;

  /**
   * The exact serialized payload over which contentHash was computed. Useful
   * for debugging or for clients that want to re-verify the hash locally.
   * Always a string of canonical (sorted-keys) JSON.
   */
  canonicalPayload: string;
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Stringify an object with deterministically sorted keys at every depth.
 * Required for stable content hashing across runs / hosts.
 */
function canonicalStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return "[" + value.map(canonicalStringify).join(",") + "]";
  }
  const keys = Object.keys(value as Record<string, unknown>).sort();
  return (
    "{" +
    keys
      .map(
        (k) =>
          JSON.stringify(k) +
          ":" +
          canonicalStringify((value as Record<string, unknown>)[k])
      )
      .join(",") +
    "}"
  );
}

function sha256(s: string): string {
  return "sha256:" + crypto.createHash("sha256").update(s, "utf8").digest("hex");
}

/**
 * Threshold rule for "dialectically tested": at least 2 critical questions
 * answered, OR at least one inbound attack with at least one inbound support.
 *
 * Activates the ClaimReview JSON-LD emission. Conservative on purpose —
 * the goal is to mark only arguments that have been pressure-tested.
 */
function computeIsTested(input: {
  criticalQuestionsAnswered: number;
  incomingAttacks: number;
  incomingSupports: number;
}): boolean {
  if (input.criticalQuestionsAnswered >= 2) return true;
  if (input.incomingAttacks >= 1 && input.incomingSupports >= 1) return true;
  return false;
}

/**
 * Heuristic standing score in [0, 1]. Not a Dung label — a quick orientation
 * signal for retrieval / ranking. Components:
 *   - CQ satisfaction ratio (weight 0.5)
 *   - Attack resistance: 1 / (1 + incomingAttackPressure) (weight 0.5)
 *
 * Returns `null` when the argument has neither a scheme defining CQs nor
 * any inbound dialectical traffic. This prevents a free-pass 1.0 for
 * arguments that simply have no apparatus attached — a real
 * misrepresentation surfaced by the first round of MCP transcripts.
 */
function computeStandingScore(input: {
  criticalQuestionsRequired: number;
  criticalQuestionsAnswered: number;
  incomingAttacks: number;
  incomingAttackEdges: number;
  incomingSupports: number;
}): number | null {
  const {
    criticalQuestionsRequired,
    criticalQuestionsAnswered,
    incomingAttacks,
    incomingAttackEdges,
    incomingSupports,
  } = input;

  const totalInbound =
    incomingAttacks + incomingAttackEdges + incomingSupports;

  // No scheme attached AND no dialectical traffic → we have no signal.
  if (criticalQuestionsRequired === 0 && totalInbound === 0) return null;

  // No scheme attached BUT we have inbound traffic → score on attack-resistance
  // alone (treat CQ component as neutral 0.5).
  const cqRatio =
    criticalQuestionsRequired > 0
      ? Math.min(1, criticalQuestionsAnswered / criticalQuestionsRequired)
      : 0.5;

  const attackPressure = Math.max(
    0,
    incomingAttacks + incomingAttackEdges - incomingSupports
  );
  const attackResistance = 1 / (1 + attackPressure);

  return Math.round((0.5 * cqRatio + 0.5 * attackResistance) * 1000) / 1000;
}

/**
 * Coarse testedness label — see `DialecticalStatus.testedness` for semantics.
 */
function computeTestedness(input: {
  criticalQuestionsAnswered: number;
  incomingAttacks: number;
  incomingSupports: number;
  incomingAttackEdges: number;
  isTested: boolean;
}): Testedness {
  if (input.isTested) return "well_tested";
  const anyTraffic =
    input.criticalQuestionsAnswered > 0 ||
    input.incomingAttacks > 0 ||
    input.incomingSupports > 0 ||
    input.incomingAttackEdges > 0;
  return anyTraffic ? "lightly_tested" : "untested";
}

// ============================================================
// MAIN BUILDER
// ============================================================

/**
 * Build an attestation envelope for an argument by id, using a chosen
 * `identifier` (shortCode preferred) for permalink construction.
 */
export async function buildArgumentAttestation(
  argumentId: string,
  identifier: string
): Promise<ArgumentAttestation | null> {
  const argument = await prisma.argument.findUnique({
    where: { id: argumentId },
    select: {
      id: true,
      text: true,
      confidence: true,
      createdAt: true,
      lastUpdatedAt: true,
      authorId: true,
      conclusionClaimId: true,
      conclusion: {
        select: {
          id: true,
          text: true,
          moid: true,
          ClaimEvidence: {
            select: {
              id: true,
              title: true,
              uri: true,
              citation: true,
              contentSha256: true,
              byteSize: true,
              contentType: true,
              httpStatus: true,
              lastModifiedAt: true,
              fetchedAt: true,
              archivedUrl: true,
              archivedAt: true,
            } as any,
            take: 25,
          },
        },
      },
      premises: {
        select: {
          isImplicit: true,
          claim: { select: { id: true, text: true, moid: true } },
        },
        orderBy: { claimId: "asc" },
        take: 50,
      },
      argumentSchemes: {
        select: {
          isPrimary: true,
          order: true,
          scheme: {
            select: {
              id: true,
              key: true,
              name: true,
              title: true,
              cqs: { select: { id: true, cqKey: true } },
            },
          },
        },
        orderBy: [{ isPrimary: "desc" }, { order: "asc" }],
      },
      deliberation: { select: { id: true, title: true } },
      permalink: { select: { shortCode: true, version: true } },
    },
  });

  if (!argument) return null;

  const primarySchemeRow =
    argument.argumentSchemes.find((s) => s.isPrimary) ||
    argument.argumentSchemes[0] ||
    null;

  const scheme = primarySchemeRow
    ? {
        id: primarySchemeRow.scheme.id,
        key: primarySchemeRow.scheme.key ?? null,
        name: primarySchemeRow.scheme.name ?? null,
        title: primarySchemeRow.scheme.title ?? null,
      }
    : null;

  const criticalQuestionsRequired = primarySchemeRow?.scheme.cqs.length ?? 0;

  // ---- Dialectical pressure: CAs and ArgumentEdges targeting this argument ----
  const conclusionClaimId = argument.conclusionClaimId;
  const [
    incomingAttackCAs,
    incomingAttackEdgeRows,
    incomingSupportEdgeRows,
    cqStatuses,
  ] = await Promise.all([
    prisma.conflictApplication.count({
      where: {
        OR: [
          { conflictedArgumentId: argument.id },
          conclusionClaimId ? { conflictedClaimId: conclusionClaimId } : undefined,
        ].filter(Boolean) as any[],
      },
    }),
    prisma.argumentEdge.count({
      where: {
        toArgumentId: argument.id,
        type: { in: ["rebut", "undercut"] as any },
      },
    }),
    prisma.argumentEdge.count({
      where: { toArgumentId: argument.id, type: "support" as any },
    }),
    prisma.cQStatus.findMany({
      where: {
        OR: [
          { argumentId: argument.id },
          { targetType: "argument" as any, targetId: argument.id },
        ],
      },
      select: { statusEnum: true, status: true },
    }),
  ]);

  const criticalQuestionsAnswered = cqStatuses.filter((s) => {
    const e = (s.statusEnum as unknown as string) || "";
    if (e === "ANSWERED" || e === "SATISFIED" || e === "RESOLVED") return true;
    const legacy = (s.status || "").toLowerCase();
    return legacy === "answered" || legacy === "satisfied" || legacy === "resolved";
  }).length;
  const criticalQuestionsOpen = Math.max(
    0,
    criticalQuestionsRequired - criticalQuestionsAnswered
  );

  const isTestedFlag = computeIsTested({
    criticalQuestionsAnswered,
    incomingAttacks: incomingAttackCAs,
    incomingSupports: incomingSupportEdgeRows,
  });

  const dialecticalStatus: DialecticalStatus = {
    incomingAttacks: incomingAttackCAs,
    incomingSupports: incomingSupportEdgeRows,
    incomingAttackEdges: incomingAttackEdgeRows,
    criticalQuestionsRequired,
    criticalQuestionsAnswered,
    criticalQuestionsOpen,
    standingScore: computeStandingScore({
      criticalQuestionsRequired,
      criticalQuestionsAnswered,
      incomingAttacks: incomingAttackCAs,
      incomingAttackEdges: incomingAttackEdgeRows,
      incomingSupports: incomingSupportEdgeRows,
    }),
    isTested: isTestedFlag,
    testedness: computeTestedness({
      criticalQuestionsAnswered,
      incomingAttacks: incomingAttackCAs,
      incomingSupports: incomingSupportEdgeRows,
      incomingAttackEdges: incomingAttackEdgeRows,
      isTested: isTestedFlag,
    }),
  };

  // ---- Author lookup (best-effort; non-fatal) ----
  // Argument.authorId is a Firebase auth_id string. Resolve via User.auth_id.
  let author: ArgumentAttestation["author"] = null;
  if (argument.authorId) {
    try {
      const u = await prisma.user.findUnique({
        where: { auth_id: argument.authorId },
        select: { name: true, username: true },
      });
      author = {
        id: argument.authorId,
        displayName: u ? u.name || u.username || null : null,
      };
    } catch {
      author = { id: argument.authorId, displayName: null };
    }
  }

  const evidence: EvidenceProvenance[] = (argument.conclusion?.ClaimEvidence ?? []).map(
    (e: any) => ({
      evidenceId: e.id,
      uri: e.uri ?? null,
      title: e.title ?? null,
      citation: e.citation ?? null,
      contentSha256: e.contentSha256 ?? null,
      archivedUrl: e.archivedUrl ?? null,
      archivedAt: e.archivedAt ? new Date(e.archivedAt).toISOString() : null,
    })
  );

  const conclusion = argument.conclusion
    ? {
        claimId: argument.conclusion.id,
        moid: argument.conclusion.moid ?? null,
        text: argument.conclusion.text ?? "",
      }
    : null;

  const premises = argument.premises.map((p) => ({
    claimId: p.claim.id,
    moid: p.claim.moid ?? null,
    text: p.claim.text ?? "",
    isImplicit: !!p.isImplicit,
  }));

  // ---- Canonical payload + content hash ----
  // We hash a *minimal, stable* projection: the conclusion text + ordered
  // premise MOIDs (or claim ids if MOID missing) + scheme key + ordered
  // evidence URIs + permalink version. This keeps the hash robust to
  // cosmetic reorderings while changing whenever the *substance* changes.
  const canonicalShape = {
    v: 1,
    permalinkVersion: argument.permalink?.version ?? 1,
    conclusion: conclusion?.text ?? null,
    conclusionMoid: conclusion?.moid ?? null,
    premises: premises.map((p) => ({
      moid: p.moid ?? p.claimId,
      text: p.text,
      isImplicit: p.isImplicit,
    })),
    schemeKey: scheme?.key ?? null,
    evidence: evidence.map((e) => ({
      uri: e.uri,
      title: e.title,
      sha256: e.contentSha256,
    })),
  };
  const canonicalPayload = canonicalStringify(canonicalShape);
  const contentHash = sha256(canonicalPayload);

  const permalink = `${BASE_URL}/a/${identifier}`;
  const immutablePermalink = `${permalink}@${contentHash.replace("sha256:", "")}`;

  return {
    identifier,
    argumentId: argument.id,
    permalink,
    version: argument.permalink?.version ?? 1,
    contentHash,
    immutablePermalink,
    retrievedAt: new Date().toISOString(),
    createdAt: argument.createdAt ? argument.createdAt.toISOString() : null,
    updatedAt: argument.lastUpdatedAt ? argument.lastUpdatedAt.toISOString() : null,
    conclusion,
    premises,
    scheme,
    evidence,
    confidence:
      argument.confidence !== null && argument.confidence !== undefined
        ? Number(argument.confidence)
        : null,
    dialecticalStatus,
    deliberation: argument.deliberation
      ? {
          id: argument.deliberation.id,
          title: argument.deliberation.title ?? null,
        }
      : null,
    author,
    canonicalPayload,
  };
}

// ============================================================
// CONVENIENCE
// ============================================================

/**
 * Convenience helper that returns just the public-facing summary used by
 * cite-style tools (omits the canonicalPayload to keep responses tight).
 */
export function toAttestationSummary(att: ArgumentAttestation) {
  const { canonicalPayload, ...rest } = att;
  return rest;
}
