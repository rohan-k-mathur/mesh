/**
 * agents/rebuttal-schema.ts
 *
 * Zod contract for Advocate A and Advocate B Phase-3 (Dialectical Testing)
 * output. Each advocate symmetrically:
 *   1. Raises or waives one or more critical questions on each opposing
 *      argument that has open CQs in its scheme catalog. (`cqResponses[]`)
 *   2. Mints rebuttal arguments against opposing arguments it judges
 *      materially flawed. Each rebuttal is REBUT (attacks conclusion),
 *      UNDERMINE (attacks a specific premise), or UNDERCUT (attacks the
 *      warrant). (`rebuttals[]`)
 *
 * Per-target cap: ≤ 4 rebuttals against any single opposing argument.
 * Per-advocate global cap: see Phase-3 prompt §5 for tunable budgets.
 *
 * Defenses (3c) are deferred to Phase 4. This schema does not include them.
 *
 * Hard-validation rules mirror `prompts/4-rebuttal-a.md` §5 and the
 * identical block in `prompts/5-rebuttal-b.md` §5. Soft-track checks
 * (attack-targeting, scheme-cq-validity, mutual-rebut detection,
 * evidence fidelity) live in `review/phase-3-checks.ts`.
 */

import { z } from "zod";
import { EXPERIMENT_SCHEME_KEYS, type ExperimentSchemeKey } from "../scheme-catalog";
import {
  CitationTokenZ,
  SchemeKeyZ,
  isSchemeAllowedForLayer,
  type AdvocateLayer,
} from "./advocate-schema";

// ─────────────────────────────────────────────────────────────────
// Per-element schemas
// ─────────────────────────────────────────────────────────────────

/** Same premise constraints as Phase-2 (capital-start, period-end, no leading conjunction, declarative). */
const RebuttalPremiseZ = z.object({
  text: z
    .string()
    .min(1)
    .max(400)
    .refine((s) => /^[A-Z(\u201c"\u2018']/.test(s.trim()), {
      message: "premise text must begin with a capital letter (declarative sentence)",
    })
    .refine((s) => /[.!?]\s*$/.test(s.trim()), {
      message: "premise text must end with a sentence-terminating punctuation mark",
    })
    .refine((s) => !/^(and|or|but|so|because|therefore|thus|hence)\b/i.test(s.trim()), {
      message: "premise text must not begin with a leading conjunction",
    })
    .refine((s) => !/\?\s*$/.test(s.trim()), {
      message: "premise text must be declarative, not a question",
    }),
  citationToken: CitationTokenZ.nullable(),
});

/** Attack types map onto ArgumentEdge.attackType. */
export const AttackTypeZ = z.enum(["REBUT", "UNDERMINE", "UNDERCUT"]);
export type AttackType = z.infer<typeof AttackTypeZ>;

/**
 * A CQ raise OR waive against an opposing argument. Action `raise` opens
 * the CQ (sets `CQStatus.statusEnum = OPEN` if absent); `waive` records
 * the advocate's affirmative concession that the CQ is non-blocking
 * (sets `CQStatus.statusEnum = SATISFIED` with `responses` empty —
 * advocate marks the question moot rather than challenging it).
 */
const CqResponseZ = z.object({
  /** Argument-id of the opposing argument this CQ targets. */
  targetArgumentId: z.string().min(4),
  /** Critical-question key from the target argument's scheme. */
  cqKey: z.string().min(1).max(80),
  action: z.enum(["raise", "waive"]),
  /**
   * Why this CQ is being raised (or waived). 40–400 chars.
   * For `raise`: state the specific weakness the CQ exposes.
   * For `waive`: state why the CQ is non-blocking in this case.
   * 400 ceiling: anything longer is rebuttal-shaped reasoning that
   * belongs in `rebuttals[]`, not in a CQ rationale.
   */
  rationale: z.string().min(40).max(400),
});
export type CqResponse = z.infer<typeof CqResponseZ>;

/**
 * A single rebuttal argument. Same structural shape as a Phase-2
 * advocate argument (premises + scheme + warrant), plus the targeting
 * fields that turn it into an attack.
 *
 * Targeting rules (validated in superRefine):
 *   - REBUT: targetPremiseIndex MUST be null. The rebuttal's conclusion
 *     contradicts the target argument's conclusion.
 *   - UNDERMINE: targetPremiseIndex REQUIRED, in [0, target.premises.length).
 *     The rebuttal's conclusion contradicts that premise.
 *   - UNDERCUT: targetPremiseIndex MUST be null. The rebuttal's
 *     conclusion is "the inference from premises to conclusion fails"
 *     (warrant attack); premises and conclusion-text describe why.
 */
const RebuttalArgumentZ = z.object({
  /** Argument-id of the opposing argument being attacked. */
  targetArgumentId: z.string().min(4),
  attackType: AttackTypeZ,
  /** 0-based premise index in the target argument; required iff attackType === "UNDERMINE". */
  targetPremiseIndex: z.number().int().nonnegative().nullable(),
  /**
   * The rebuttal's conclusion text. Will be minted as a Claim and used as
   * the rebuttal Argument's `conclusionClaimId`. Same shape constraints as
   * a premise (declarative sentence).
   */
  conclusionText: z
    .string()
    .min(1)
    .max(400)
    .refine((s) => /^[A-Z(\u201c"\u2018']/.test(s.trim()), {
      message: "conclusionText must begin with a capital letter",
    })
    .refine((s) => /[.!?]\s*$/.test(s.trim()), {
      message: "conclusionText must end with a sentence-terminating punctuation mark",
    }),
  premises: z.array(RebuttalPremiseZ).min(1).max(4),
  schemeKey: SchemeKeyZ,
  warrant: z.string().min(1).max(300).nullable(),
  /**
   * Optional `cqKey` to attach to the resulting `ArgumentEdge.cqKey`. When
   * provided, the rebuttal also auto-marks that CQ as `answered` on the
   * target argument. Must be a real CQ on the target argument's scheme.
   */
  cqKey: z.string().min(1).max(80).nullable(),
});
export type RebuttalArgument = z.infer<typeof RebuttalArgumentZ>;

// ─────────────────────────────────────────────────────────────────
// Top-level Phase-3 output
// ─────────────────────────────────────────────────────────────────

export const REBUTTAL_PER_TARGET_MAX = 4;

const RebuttalOutputZ = z.object({
  phase: z.literal("3"),
  advocateRole: z.enum(["A", "B"]),
  cqResponses: z.array(CqResponseZ).default([]),
  rebuttals: z.array(RebuttalArgumentZ).default([]),
});

export type RebuttalOutput = z.infer<typeof RebuttalOutputZ>;

// ─────────────────────────────────────────────────────────────────
// Refusal (mirrors AdvocateRefusal but with Phase-3-appropriate codes)
// ─────────────────────────────────────────────────────────────────

export const RebuttalRefusalZ = z.object({
  error: z.enum([
    /** No materially flawed opposing arguments to attack and no CQs worth raising. */
    "NO_DEFENSIBLE_ATTACKS",
    /** Opposing arguments are evidence-grounded and scheme-appropriate; principled disagreement only. */
    "OPPONENT_CASE_SOUND",
    /** The framing rules out this advocate's position so completely that even targeted attacks would re-litigate established items. */
    "FRAMING_BLOCKS_ATTACKS",
  ]),
  details: z.string().max(500),
  targetArgumentIdsAttempted: z.array(z.string()).default([]),
});
export type RebuttalRefusal = z.infer<typeof RebuttalRefusalZ>;

export function isRebuttalRefusal(r: unknown): r is RebuttalRefusal {
  return typeof (r as any)?.error === "string" && !Array.isArray((r as any)?.rebuttals);
}

// ─────────────────────────────────────────────────────────────────
// Targeting binding: opposing arguments + CQ catalog per scheme
// ─────────────────────────────────────────────────────────────────

/**
 * Information about each opposing argument needed for hard validation:
 * the argument's scheme's CQ keys (so cqResponses.cqKey is bounded), the
 * argument's premise count (so UNDERMINE.targetPremiseIndex is bounded),
 * and the conclusion sub-claim's layer (so the rebuttal's schemeKey is
 * checked for layer-plausibility against what it ATTACKS — same rule as
 * Phase 2).
 */
export interface OpposingArgumentBinding {
  argumentId: string;
  /** Scheme key of the opposing argument. Used to look up its CQ catalog. */
  schemeKey: ExperimentSchemeKey;
  /** Number of premises in the opposing argument; bounds UNDERMINE.targetPremiseIndex. */
  premiseCount: number;
  /** Layer of the conclusion sub-claim the opposing argument concludes to. */
  conclusionLayer: AdvocateLayer;
}

export interface RebuttalSchemaOpts {
  advocateRole: "A" | "B";
  /** Keyed by argumentId. The Zod schema uses this to validate targeting. */
  opposingArguments: ReadonlyMap<string, OpposingArgumentBinding>;
  /** Per-scheme valid CQ keys (loaded from `CriticalQuestion` table). */
  cqKeysByScheme: ReadonlyMap<ExperimentSchemeKey, ReadonlySet<string>>;
  /** Bound evidence corpus tokens (same source as Phase 2). */
  allowedCitationTokens: ReadonlySet<string>;
  /** Defaults from prompt §5; override only for testing. */
  cqResponsesMax?: number; // default 16
  rebuttalsMax?: number; // default 16
  rebuttalsPerTargetMax?: number; // default 4 (REBUTTAL_PER_TARGET_MAX)
}

/**
 * Build the parameterized Zod schema for a Phase-3 rebuttal output.
 * Apply the result with `.safeParse(json)`. Failures contain the precise
 * §5 rule that fired in `error.issues[i].message`.
 */
export function buildRebuttalOutputSchema(opts: RebuttalSchemaOpts) {
  const {
    advocateRole,
    opposingArguments,
    cqKeysByScheme,
    allowedCitationTokens,
    cqResponsesMax = 16,
    rebuttalsMax = 16,
    rebuttalsPerTargetMax = REBUTTAL_PER_TARGET_MAX,
  } = opts;

  return RebuttalOutputZ.superRefine((data, ctx) => {
    if (data.advocateRole !== advocateRole) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `advocateRole must equal "${advocateRole}" (got "${data.advocateRole}")`,
        path: ["advocateRole"],
      });
    }

    // Global budget caps.
    if (data.cqResponses.length > cqResponsesMax) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `cqResponses.length (${data.cqResponses.length}) exceeds max (${cqResponsesMax})`,
        path: ["cqResponses"],
      });
    }
    if (data.rebuttals.length > rebuttalsMax) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `rebuttals.length (${data.rebuttals.length}) exceeds max (${rebuttalsMax})`,
        path: ["rebuttals"],
      });
    }

    // Per-target rebuttal cap.
    const rebuttalsByTarget = new Map<string, number>();
    for (let i = 0; i < data.rebuttals.length; i++) {
      const r = data.rebuttals[i];
      const n = (rebuttalsByTarget.get(r.targetArgumentId) ?? 0) + 1;
      rebuttalsByTarget.set(r.targetArgumentId, n);
      if (n > rebuttalsPerTargetMax) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `rebuttals against target ${r.targetArgumentId} exceed per-target cap (${rebuttalsPerTargetMax}); collapse multi-flaw critiques into a single argument with multiple premises`,
          path: ["rebuttals", i, "targetArgumentId"],
        });
      }
    }

    // CQ-response validation.
    for (let i = 0; i < data.cqResponses.length; i++) {
      const c = data.cqResponses[i];
      const target = opposingArguments.get(c.targetArgumentId);
      if (!target) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `cqResponses[${i}].targetArgumentId "${c.targetArgumentId}" is not a known opposing argument`,
          path: ["cqResponses", i, "targetArgumentId"],
        });
        continue;
      }
      const cqs = cqKeysByScheme.get(target.schemeKey);
      if (!cqs) {
        // Scheme has no registered CQs in the catalog. Skip with a soft
        // note — the soft-checks layer will surface this if it matters.
        continue;
      }
      if (!cqs.has(c.cqKey)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `cqResponses[${i}].cqKey "${c.cqKey}" is not a valid CQ for scheme "${target.schemeKey}". Valid keys: [${[...cqs].join(", ")}]`,
          path: ["cqResponses", i, "cqKey"],
        });
      }
    }

    // Rebuttal validation.
    for (let i = 0; i < data.rebuttals.length; i++) {
      const r = data.rebuttals[i];
      const target = opposingArguments.get(r.targetArgumentId);
      if (!target) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `rebuttals[${i}].targetArgumentId "${r.targetArgumentId}" is not a known opposing argument`,
          path: ["rebuttals", i, "targetArgumentId"],
        });
        continue;
      }

      // Targeting consistency.
      if (r.attackType === "UNDERMINE") {
        if (r.targetPremiseIndex === null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `rebuttals[${i}]: UNDERMINE requires targetPremiseIndex`,
            path: ["rebuttals", i, "targetPremiseIndex"],
          });
        } else if (r.targetPremiseIndex >= target.premiseCount) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `rebuttals[${i}]: targetPremiseIndex ${r.targetPremiseIndex} out of range; target argument has ${target.premiseCount} premises`,
            path: ["rebuttals", i, "targetPremiseIndex"],
          });
        }
      } else if (r.targetPremiseIndex !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `rebuttals[${i}]: targetPremiseIndex must be null for ${r.attackType} (only UNDERMINE targets a specific premise)`,
          path: ["rebuttals", i, "targetPremiseIndex"],
        });
      }

      // Citation tokens resolve.
      for (let p = 0; p < r.premises.length; p++) {
        const tok = r.premises[p].citationToken;
        if (tok !== null && !allowedCitationTokens.has(tok)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `rebuttals[${i}].premises[${p}].citationToken "${tok}" does not resolve in EVIDENCE_CORPUS`,
            path: ["rebuttals", i, "premises", p, "citationToken"],
          });
        }
      }

      // Scheme-layer plausibility — checked against the LAYER OF THE
      // OPPOSING ARGUMENT's conclusion sub-claim (since the rebuttal's
      // conclusion lives in the same epistemic register as what it
      // attacks: an empirical-causal claim is rebutted by empirical-causal
      // counter-evidence; a normative claim by normative counter-reasons).
      if (!isSchemeAllowedForLayer(r.schemeKey, target.conclusionLayer)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `rebuttals[${i}]: schemeKey "${r.schemeKey}" is not appropriate for layer "${target.conclusionLayer}" (the layer of the opposing argument's conclusion)`,
          path: ["rebuttals", i, "schemeKey"],
        });
      }

      // Optional cqKey on rebuttal: must be a real CQ for the target's scheme.
      if (r.cqKey !== null) {
        const cqs = cqKeysByScheme.get(target.schemeKey);
        if (cqs && !cqs.has(r.cqKey)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `rebuttals[${i}].cqKey "${r.cqKey}" is not a valid CQ for scheme "${target.schemeKey}"`,
            path: ["rebuttals", i, "cqKey"],
          });
        }
      }
    }
  });
}

export type RebuttalSchema = ReturnType<typeof buildRebuttalOutputSchema>;
