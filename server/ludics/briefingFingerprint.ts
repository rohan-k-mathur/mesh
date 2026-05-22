/**
 * Briefing-fingerprint service — §5 (Phase 1f).
 *
 * Computes a content-hash over the *material fields* that the AI-EPI
 * fidelity scorecard grades: hubSet, loadBearingRankingTop10,
 * openExposurePoints, refusal-surface conclusions, and top-15 CQ ids.
 *
 * Five material-change rules (R1–R5) determine whether a previously
 * issued hash is stale:
 *   R1 — hubSet or hubShape changed
 *   R2 — new entry added to cannotConcludeBecause
 *   R3 — top-5 of loadBearingRanking shifted by ≥1 position
 *   R4 — a hub-targeting CQ entered prioritizedOpenCqs[0..14]
 *   R5 — openExposurePoints increased by ≥ R5_THRESHOLD (default 10)
 *
 * The staleness check (checkBriefingFingerprint) requires material
 * fields from the previously-issued hash. We keep a module-level
 * in-memory cache (Map<hash, MaterialFields>) for this purpose.
 * This is intentionally lightweight: the Tier-2 feature does not
 * warrant a new DB table for Phase 1f.
 */

import crypto from "crypto";
import {
  computeSyntheticReadout,
  type SyntheticReadout,
} from "@/lib/deliberation/syntheticReadout";
import { derivePrioritizedOpenCqs } from "@/lib/deliberation/cqPrioritizer";
import { getDeliberationSchema } from "@/server/ludics/deliberationSchema";

const R5_THRESHOLD = 10;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MaterialFields {
  hubSet: string[];
  hubShape: string;
  loadBearingRankingTop10: string[];
  openExposurePoints: number;
  refusalCount: number;
  /** Stable CQ ids (`argId::cqKey`) for the top-15 prioritized open CQs. */
  prioritizedCqTop15: string[];
  /** Refusal-surface conclusion claim ids for hash computation. */
  refusalConclusionIds: string[];
}

export interface BriefingFingerprintResult {
  contentHash: string;
  /**
   * B5 component hash vector. Four disjoint per-aspect digests over
   * the same MaterialFields the combined `contentHash` covers:
   *
   *   - `hubs`       — over `{ hubSet (sorted), hubShape }`
   *   - `frontier`   — over `{ loadBearingRankingTop10, prioritizedCqTop15 }`
   *   - `refusal`    — over `{ refusalConclusionIds (sorted) }`
   *   - `witnessing` — over `{ openExposurePoints }`
   *
   * Cheap rule attribution: a component digest changes iff its scope
   * fields changed, so callers can short-circuit the R1–R5 scan by
   * inspecting `diffComponents(prev, curr)` first.
   *
   * Consistency invariant (pinned in tests): whenever `contentHash`
   * changes between two computations, at least one component digest
   * also changes. The four components fully cover every field that
   * flows into `contentHash`.
   */
  components: ComponentHashVector;
  computedAt: string; // ISO-8601
  materialFields: MaterialFields;
  /**
   * ISO-8601 timestamp of the last hash rotation. null when this is the
   * first computation for the deliberation.
   */
  lastMaterialChangeAt: string | null;
  /**
   * Rule that caused the last hash rotation. null when this is the first
   * computation or no rule has fired.
   */
  lastMaterialChangeRule: "R1" | "R2" | "R3" | "R4" | "R5" | null;
}

/**
 * B5 component-hash vector. See `BriefingFingerprintResult.components`
 * for scope semantics. All values are `sha256:<hex>` strings.
 */
export interface ComponentHashVector {
  hubs: string;
  frontier: string;
  refusal: string;
  witnessing: string;
}

export type ComponentName = keyof ComponentHashVector;

export type StalenessResult = { stale: false } | { stale: "R1" | "R2" | "R3" | "R4" | "R5" };

// ── In-memory cache ───────────────────────────────────────────────────────────
// Key: SHA256 hash string. Value: { deliberationId, fields, computedAt }

interface CacheEntry {
  deliberationId: string;
  fields: MaterialFields;
  components: ComponentHashVector;
  computedAt: string;
}

const hashCache = new Map<string, CacheEntry>();

// Per-deliberation history of (hash, computedAt, rule)
// used to surface lastMaterialChangeAt/Rule
interface HistoryEntry {
  hash: string;
  computedAt: string;
  rule: "R1" | "R2" | "R3" | "R4" | "R5" | null;
}

const deliberationHistory = new Map<string, HistoryEntry[]>();

// ── Hash computation ──────────────────────────────────────────────────────────

function sha256(s: string): string {
  return "sha256:" + crypto.createHash("sha256").update(s, "utf8").digest("hex");
}

function computeHash(fields: MaterialFields): string {
  const payload = JSON.stringify({
    hubSet: [...fields.hubSet].sort(),
    loadBearingRankingTop10: fields.loadBearingRankingTop10,
    openExposurePoints: fields.openExposurePoints,
    refusalConclusionIds: [...fields.refusalConclusionIds].sort(),
    prioritizedCqTop15: fields.prioritizedCqTop15,
  });
  return sha256(payload);
}

/**
 * B5: compute the four-way component digest vector over disjoint
 * subsets of `MaterialFields`. Pure function — same input ⇒ same
 * output. Used both for diff-based rule attribution and as a
 * consistency check against the combined `contentHash`.
 *
 * Disjointness matters: each material field appears in exactly one
 * component, so a field change toggles exactly one component digest.
 * `refusalCount` is omitted (derivable from `refusalConclusionIds`).
 */
export function computeComponentHashes(
  fields: MaterialFields,
): ComponentHashVector {
  const hubs = sha256(
    JSON.stringify({
      hubSet: [...fields.hubSet].sort(),
      hubShape: fields.hubShape,
    }),
  );
  const frontier = sha256(
    JSON.stringify({
      loadBearingRankingTop10: fields.loadBearingRankingTop10,
      prioritizedCqTop15: fields.prioritizedCqTop15,
    }),
  );
  const refusal = sha256(
    JSON.stringify({
      refusalConclusionIds: [...fields.refusalConclusionIds].sort(),
    }),
  );
  const witnessing = sha256(
    JSON.stringify({ openExposurePoints: fields.openExposurePoints }),
  );
  return { hubs, frontier, refusal, witnessing };
}

/**
 * B5: per-component change set. Returns the components whose digest
 * differs between `prev` and `curr`. O(4) string comparison —
 * intended as a cheap precheck before invoking the full R1–R5 scan.
 */
export function diffComponents(
  prev: ComponentHashVector,
  curr: ComponentHashVector,
): Set<ComponentName> {
  const out = new Set<ComponentName>();
  if (prev.hubs !== curr.hubs) out.add("hubs");
  if (prev.frontier !== curr.frontier) out.add("frontier");
  if (prev.refusal !== curr.refusal) out.add("refusal");
  if (prev.witnessing !== curr.witnessing) out.add("witnessing");
  return out;
}

// ── Material field extraction ─────────────────────────────────────────────────

async function extractMaterialFields(
  deliberationId: string,
  readout: SyntheticReadout,
): Promise<MaterialFields> {
  // Hub set: argumentIds of topology hubs
  const hubSet = (readout.topology?.hubs?.set ?? []).map((h) => h.argumentId);
  const hubShape = readout.topology?.hubs?.shape ?? "empty";

  // Load-bearing ranking top-10
  const loadBearingRankingTop10 =
    readout.frontier?.loadBearingnessRanking?.slice(0, 10) ?? [];

  // Refusal surface
  const refusalEntries = readout.refusalSurface?.cannotConcludeBecause ?? [];
  const refusalConclusionIds = refusalEntries
    .map((e) => e.conclusionClaimId)
    .filter(Boolean) as string[];
  const refusalCount = refusalEntries.length;

  // Prioritized open CQs top-15
  const prioritizedCqs = derivePrioritizedOpenCqs(readout);
  const prioritizedCqTop15 = prioritizedCqs.slice(0, 15).map((cq) => cq.id);

  // openExposurePoints from the Ludics layer (witnessable + latent)
  let openExposurePoints = 0;
  try {
    const schema = await getDeliberationSchema(deliberationId, false);
    if (schema) {
      openExposurePoints =
        schema.witnessingSummary.witnessableLoci + schema.witnessingSummary.latentLoci;
    }
  } catch {
    // Ludics layer not yet populated — openExposurePoints stays 0
  }

  return {
    hubSet,
    hubShape,
    loadBearingRankingTop10,
    openExposurePoints,
    refusalCount,
    prioritizedCqTop15,
    refusalConclusionIds,
  };
}

// ── Rule evaluation ───────────────────────────────────────────────────────────

/**
 * Check which rule (if any) fired between `prev` and `curr`.
 * Returns the first rule that fires, in R1–R5 order.
 *
 * B5: when `prevComponents`/`currComponents` are supplied, components
 * whose digest is unchanged skip their owning rules (R1→hubs,
 * R2→refusal, R3/R4→frontier, R5→witnessing). Same return value;
 * just fewer field comparisons on the hot path.
 */
export function evaluateStalenessRules(
  prev: MaterialFields,
  curr: MaterialFields,
  prevComponents?: ComponentHashVector,
  currComponents?: ComponentHashVector,
): "R1" | "R2" | "R3" | "R4" | "R5" | null {
  const changed =
    prevComponents && currComponents
      ? diffComponents(prevComponents, currComponents)
      : null;

  // R1: hubSet or hubShape changed
  if (!changed || changed.has("hubs")) {
    const prevHubKey = [...prev.hubSet].sort().join(",") + "|" + prev.hubShape;
    const currHubKey = [...curr.hubSet].sort().join(",") + "|" + curr.hubShape;
    if (prevHubKey !== currHubKey) return "R1";
  }

  // R2: new entry added to cannotConcludeBecause
  if (!changed || changed.has("refusal")) {
    const prevRefusal = new Set(prev.refusalConclusionIds);
    const hasNewRefusal = curr.refusalConclusionIds.some(
      (id) => !prevRefusal.has(id),
    );
    if (hasNewRefusal) return "R2";
  }

  // R3 + R4 share the frontier component.
  if (!changed || changed.has("frontier")) {
    // R3: top-5 of loadBearingRanking changed by ≥1 position
    const prevTop5 = prev.loadBearingRankingTop10.slice(0, 5);
    const currTop5 = curr.loadBearingRankingTop10.slice(0, 5);
    const top5Changed =
      prevTop5.length !== currTop5.length ||
      prevTop5.some((id, i) => currTop5[i] !== id);
    if (top5Changed) return "R3";

    // R4: a hub-targeting CQ entered the top-15 that wasn't there before
    // (We mark hub-targeting by checking if the CQ's targetArgumentId is in hubSet)
    const prevCqSet = new Set(prev.prioritizedCqTop15);
    const currHubSet = new Set(curr.hubSet);
    // A new hub-targeting CQ = in curr top-15 but not in prev top-15,
    // where the targetArgumentId is in the current hubSet.
    const hasNewHubCq = curr.prioritizedCqTop15.some((cqId) => {
      if (prevCqSet.has(cqId)) return false;
      const targetArgId = cqId.split("::")[0];
      return currHubSet.has(targetArgId);
    });
    if (hasNewHubCq) return "R4";
  }

  // R5: openExposurePoints increased by ≥ R5_THRESHOLD
  if (!changed || changed.has("witnessing")) {
    if (curr.openExposurePoints - prev.openExposurePoints >= R5_THRESHOLD)
      return "R5";
  }

  return null;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Compute and return the current briefing fingerprint for a deliberation.
 */
export async function computeBriefingFingerprint(
  deliberationId: string,
): Promise<BriefingFingerprintResult | null> {
  const readout = await computeSyntheticReadout(deliberationId);
  if (!readout) return null;

  const fields = await extractMaterialFields(deliberationId, readout);
  const contentHash = computeHash(fields);
  const components = computeComponentHashes(fields);
  const computedAt = new Date().toISOString();

  // Store in cache
  hashCache.set(contentHash, { deliberationId, fields, components, computedAt });

  // Update history
  const history = deliberationHistory.get(deliberationId) ?? [];
  const prevEntry = history[history.length - 1];

  let lastMaterialChangeAt: string | null = null;
  let lastMaterialChangeRule: "R1" | "R2" | "R3" | "R4" | "R5" | null = null;

  if (prevEntry && prevEntry.hash !== contentHash) {
    // Hash changed — determine which rule fired. Pass component vectors
    // so unchanged components skip their owning rules (B5 fast path).
    const prevCache = hashCache.get(prevEntry.hash);
    const rule = prevCache
      ? evaluateStalenessRules(
          prevCache.fields,
          fields,
          prevCache.components,
          components,
        )
      : "R1";
    lastMaterialChangeAt = computedAt;
    lastMaterialChangeRule = rule;
    history.push({ hash: contentHash, computedAt, rule });
  } else if (prevEntry) {
    // Hash unchanged — surface last change
    const lastChange = history.slice().reverse().find((h) => h.rule !== null);
    lastMaterialChangeAt = lastChange?.computedAt ?? null;
    lastMaterialChangeRule = lastChange?.rule ?? null;
    history.push({ hash: contentHash, computedAt, rule: null });
  } else {
    // First computation
    history.push({ hash: contentHash, computedAt, rule: null });
  }

  // Keep history bounded
  if (history.length > 100) history.splice(0, history.length - 100);
  deliberationHistory.set(deliberationId, history);

  return {
    contentHash,
    components,
    computedAt,
    materialFields: fields,
    lastMaterialChangeAt,
    lastMaterialChangeRule,
  };
}

/**
 * Check whether a previously issued hash is stale.
 * Returns { stale: false } if the hash matches the current fingerprint,
 * otherwise returns the first rule that fired.
 */
export async function checkBriefingFingerprint(
  deliberationId: string,
  hash: string,
): Promise<StalenessResult> {
  const current = await computeBriefingFingerprint(deliberationId);
  if (!current) return { stale: "R1" };

  if (current.contentHash === hash) return { stale: false };

  // Try to find the cached material fields for the provided hash
  const prevCached = hashCache.get(hash);
  if (!prevCached) {
    // No cached state for this hash — conservative: signal R1
    return { stale: "R1" };
  }

  const rule = evaluateStalenessRules(
    prevCached.fields,
    current.materialFields,
    prevCached.components,
    current.components,
  );
  return { stale: rule ?? "R1" };
}
