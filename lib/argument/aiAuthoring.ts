/**
 * AI-authored argument drafting — Track AI-EPI Pt. 3 §5.
 *
 * This module is the only sanctioned path for creating arguments whose
 * `authorKind` is `AI` or `HYBRID`. Two non-negotiable invariants:
 *
 *   1. AI drafts are *not* auto-published. They land in a review state
 *      that requires a human editor to approve before they appear in
 *      public retrieval surfaces.
 *
 *   2. Once approved, AI drafts always enter the graph at standing
 *      `untested-default`, regardless of structural completeness. The
 *      standing system already makes "untested-default" mean exactly what
 *      it should — *no human dialectical engagement yet* — so this
 *      invariant prevents AI-bootstrapped articulation from inflating the
 *      record.
 *
 * The actual model call is left as an injected `generate` function so
 * different providers can be slotted in (and so unit tests can run
 * deterministically without an LLM round-trip).
 */

import { prisma } from "@/lib/prismaclient";
import { mintClaimMoid } from "@/lib/ids/mintMoid";

export interface AiDraftSource {
  url: string;
  title?: string;
  quote?: string;
}

export interface AiDraftRequest {
  topicId?: string;
  /** Free-text "what should the AI argue?" hint provided by the editor. */
  hint?: string;
  /** ASPIC scheme key the draft should target (e.g. "expert_opinion"). */
  schemeKey: string;
  /** External sources the draft must cite. Bounded; not validated here. */
  sources: AiDraftSource[];
  /** Display name of the model that produced the draft (e.g. "claude-opus-4.5"). */
  model: string;
  /** Stable hash of the prompt + sources, for reproducibility. */
  promptHash: string;
  /** Pre-generated content — caller is responsible for the actual model call. */
  generated: {
    conclusion: string;
    /** Optional argument body / reasoning text. */
    reasoning?: string;
    /** Premises, in order. */
    premises: Array<{ text: string; isImplicit?: boolean }>;
  };
  /** Auth_id of the editor who initiated the draft (audit trail). */
  initiatedByAuthId: string;
  /** Deliberation the draft should land in. */
  deliberationId: string;
}

export interface AiDraftResult {
  argumentId: string;
  conclusionClaimId: string;
  authorKind: "AI";
  /** Always "untested-default" \u2014 see invariant #2. */
  initialStanding: "untested-default";
  /** Whether the row is awaiting human approval. */
  awaitingReview: boolean;
}

/**
 * Persist an AI-authored draft as a non-public Argument row. The row is
 * hidden from the public retrieval surfaces by *not* creating an
 * `ArgumentPermalink` until an editor approves. This re-uses the
 * permalink-gating already enforced by the search route
 * (`where: { permalink: { isNot: null } }`) so we don't need a separate
 * "is_public" flag.
 */
export async function createAiDraft(req: AiDraftRequest): Promise<AiDraftResult> {
  if (!req.generated?.conclusion?.trim()) {
    throw new Error("AI draft is missing a conclusion");
  }
  if (!req.schemeKey) {
    throw new Error("AI draft requires a schemeKey");
  }
  if (!req.deliberationId) {
    throw new Error("AI draft requires a deliberationId");
  }

  const conclusionText = req.generated.conclusion.trim();
  const moid = mintClaimMoid(conclusionText);

  const claim = await prisma.claim.upsert({
    where: { moid },
    create: {
      text: conclusionText,
      moid,
      createdById: req.initiatedByAuthId,
      deliberationId: req.deliberationId,
    },
    update: {},
    select: { id: true },
  });

  const aiProvenance = {
    model: req.model,
    promptHash: req.promptHash,
    sourceUrls: req.sources.map((s) => s.url),
    generatedAt: new Date().toISOString(),
    hint: req.hint ?? null,
    schemeKey: req.schemeKey,
  };

  const argument = await prisma.argument.create({
    data: {
      deliberationId: req.deliberationId,
      authorId: req.initiatedByAuthId,
      // Cast: forward-compatible with the Pt. 3 \u00a75 schema additions in
      // case the generated client is momentarily stale on the dev box.
      ...({
        authorKind: "AI",
        aiProvenance,
      } as any),
      text: req.generated.reasoning?.trim() || conclusionText,
      conclusionClaimId: claim.id,
    },
    select: { id: true },
  });

  // Permise rows for traceability (so editors see what was drafted).
  // Same upsert-by-moid pattern the quick-arg flow uses.
  for (let i = 0; i < req.generated.premises.length; i++) {
    const p = req.generated.premises[i];
    const text = p.text.trim();
    if (!text) continue;
    const pMoid = mintClaimMoid(text);
    const pClaim = await prisma.claim.upsert({
      where: { moid: pMoid },
      create: {
        text,
        moid: pMoid,
        createdById: req.initiatedByAuthId,
        deliberationId: req.deliberationId,
      },
      update: {},
      select: { id: true },
    });
    await prisma.argumentPremise.create({
      data: {
        argumentId: argument.id,
        claimId: pClaim.id,
        isImplicit: !!p.isImplicit,
      },
    });
  }

  return {
    argumentId: argument.id,
    conclusionClaimId: claim.id,
    authorKind: "AI",
    initialStanding: "untested-default",
    awaitingReview: true, // no permalink yet
  };
}

/**
 * Approve an AI draft and make it publicly retrievable by minting a
 * permalink for it. The standing-state invariant (untested-default) is
 * preserved automatically because no human dialectical engagement has
 * been recorded; the standing-state classifier reads from inbound
 * traffic, not from authoring metadata.
 */
export async function approveAiDraft(opts: {
  argumentId: string;
  approvingEditorAuthId: string;
}): Promise<{ argumentId: string; shortCode: string }> {
  const arg = await prisma.argument.findUnique({
    where: { id: opts.argumentId },
    select: { id: true, permalink: true, ...({ authorKind: true } as any) } as any,
  });
  if (!arg) throw new Error("AI draft not found");
  if ((arg as any).authorKind === "HUMAN") {
    throw new Error("approveAiDraft only applies to AI/HYBRID rows");
  }
  if ((arg as any).permalink) {
    return {
      argumentId: arg.id,
      shortCode: (arg as any).permalink.shortCode,
    };
  }
  // Lazy-import to avoid a circular dep with the permalink service.
  const { getOrCreatePermalink } = await import("@/lib/citations/permalinkService");
  const pl = await getOrCreatePermalink(arg.id);
  return { argumentId: arg.id, shortCode: pl.shortCode };
}

// ============================================================
// AI-EPI Pt. 4 §8 — engagement telemetry
// ============================================================

/** Engagement event kinds recorded against AI-authored arguments. */
export type AiDraftEngagementKind = "attack" | "support" | "cqAnswer" | "concede";

/**
 * Record one human dialectical action against an AI-authored argument.
 *
 *   - Looks up the target argument's `authorKind`. If it is HUMAN (or
 *     missing), the call is a no-op — engagement against human authors
 *     is the default state, not telemetry.
 *   - Skips when `actorAuthId` matches the argument's own `authorId`
 *     (self-engagement does not count).
 *   - Fire-and-forget: never throws to the caller. A failed insert
 *     undercounts engagement (graceful degradation), it does not block
 *     the original action.
 *
 * The row feeds `fingerprint.extraction.humanEngagementRateOnAiSeeds`
 * (rolling 30-day window), which gates the `articulationOnly` chip on
 * the DeliberationStateCard.
 */
export async function recordAiDraftEngagement(opts: {
  argumentId: string;
  actorAuthId: string;
  kind: AiDraftEngagementKind;
}): Promise<void> {
  const { argumentId, actorAuthId, kind } = opts;
  if (!argumentId || !actorAuthId) return;
  try {
    const arg = await prisma.argument.findUnique({
      where: { id: argumentId },
      select: { authorKind: true, authorId: true },
    });
    if (!arg) return;
    if (arg.authorKind !== "AI" && arg.authorKind !== "HYBRID") return;
    if (arg.authorId && arg.authorId === actorAuthId) return;
    await prisma.aiDraftEngagement.create({
      data: { argumentId, actorAuthId, kind },
    });
  } catch {
    /* telemetry failures are non-fatal */
  }
}
