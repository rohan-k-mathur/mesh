// lib/argumentation/transportAggregator.ts
// Sprint C2 — pure transport aggregation. Given a `RoomFunctor` (one-hop
// claim map) and the source room's per-claim support, produce the imported
// contribution band the destination room should add.
//
// Pure / no Prisma. The DB-side worker `workers/transport-aggregator.ts`
// fetches inputs, calls into here, and writes a `RoomTransportSnapshot`.
//
// Citations: ECC plan §0.5.7 (Isonomia extension, not Ambler), §C1–C3,
// §4 row 2 (one-hop only).

import { createHash } from "crypto";
import { corroborateProbs } from "./logodds";

/** Per-claim support produced by the source room. */
export interface SourceClaimSupport {
  claimId: string;
  /** Aggregate (joined) support for this claim in the source room, 0..1. */
  score: number;
}

export interface TransportSource {
  fromRoomId: string;
  /** Object-level functor: `{ [fromClaimId]: toClaimId }`. */
  claimMap: Record<string, string>;
  supports: SourceClaimSupport[];
}

export interface ImportedContribution {
  fromRoomId: string;
  fromClaimId: string;
  /** Per-source raw score. The total is computed at read time per `mode`. */
  score: number;
}

/** What gets persisted in `RoomTransportSnapshot.payloadJson`. */
export interface TransportSnapshotPayload {
  /** `{ [toClaimId]: { sources: ImportedContribution[] } }`. */
  byClaim: Record<string, { sources: ImportedContribution[] }>;
}

/**
 * Compute the snapshot payload for a single (from → to) functor.
 *
 * @invariant Pure: same inputs ⇒ same output, no I/O.
 * @invariant One-hop (ECC plan §4 row 2): no transitive chasing of further
 *   `RoomFunctor` rows. Multi-hop is a deliberate non-goal.
 * @invariant Empty / partial functor: claims without an image in `claimMap`
 *   are silently dropped (the functor is partial; we don't fabricate
 *   targets).
 */
export function computeTransportPayload(source: TransportSource): TransportSnapshotPayload {
  const byClaim: Record<string, { sources: ImportedContribution[] }> = {};
  for (const s of source.supports) {
    const toClaimId = source.claimMap[s.claimId];
    if (!toClaimId) continue;
    const slot = byClaim[toClaimId] ?? { sources: [] };
    slot.sources.push({
      fromRoomId: source.fromRoomId,
      fromClaimId: s.claimId,
      score: s.score,
    });
    byClaim[toClaimId] = slot;
  }
  return { byClaim };
}

/**
 * SHA-1 of `(fromRoomId, claimMap, sorted supports)` — the cache key for
 * `RoomTransportSnapshot.claimMapHash`. A worker run that produces the same
 * hash as the existing snapshot is a no-op.
 */
export function computeTransportHash(source: TransportSource): string {
  const sorted = [...source.supports].sort((a, b) => a.claimId.localeCompare(b.claimId));
  const mapEntries = Object.entries(source.claimMap).sort(([a], [b]) => a.localeCompare(b));
  const payload = JSON.stringify({
    fromRoomId: source.fromRoomId,
    map: mapEntries,
    supports: sorted.map((s) => [s.claimId, +s.score.toFixed(6)]),
  });
  return createHash("sha1").update(payload).digest("hex");
}

/**
 * Reduce a target claim's imported contributions to a single scalar using
 * the same join semantics as the local pipeline.
 *
 * @invariant Mode parity with `lib/argumentation/eccAdapter.ts`:
 *   - `min`     → max (the join in the min-monoid)
 *   - `logodds` → log-odds corroboration (the join in the weight-of-evidence
 *                monoid — imported support stacks as signed evidence)
 *   - `product` → noisy-OR (the join in the product monoid)
 * @invariant Empty list ⇒ 0 (no imports = no imported contribution). NOTE:
 *   `0` is the "no imports" sentinel for **every** mode (even though `0.5`,
 *   not `0`, is the log-odds identity) so the `imported === 0` short-circuit
 *   in `combineLocalAndImported` keeps working under `logodds`.
 */
export function reduceImportedScores(scores: number[], mode: "min" | "product" | "logodds"): number {
  if (scores.length === 0) return 0;
  if (mode === "min") return Math.max(...scores);
  if (mode === "logodds") return corroborateProbs(scores);
  return 1 - scores.reduce((a, x) => a * (1 - x), 1);
}

/**
 * Combine local + imported into the `total` band shown in the UI.
 *
 * @invariant Identity: `combineLocalAndImported(local, 0) === local` (the
 *   `imported === 0` sentinel means "no imports", honoured in every mode).
 * @invariant Monotone for `min`/`product` (Ambler p. 171, ECC plan §0.5.6):
 *   `combineLocalAndImported(local, imported) >= local`. `logodds` is the
 *   deliberate signed-evidence exception — corroboration with below-neutral
 *   (`< 0.5`) imported support *lowers* the total, matching the log-odds
 *   semantics (`0.3 ⊕ 0.3 < 0.3`).
 */
export function combineLocalAndImported(
  local: number,
  imported: number,
  mode: "min" | "product" | "logodds"
): number {
  if (imported === 0) return local;
  if (mode === "min") return Math.max(local, imported);
  if (mode === "logodds") return corroborateProbs([local, imported]);
  return 1 - (1 - local) * (1 - imported);
}
