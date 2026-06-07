// scripts/plexus-topology-probe.ts
//
// Direction 4 (distributed semantics) — phase 0b seed+measure harness.
// See RESEARCH_PROGRAMME/10_IDEATION_SESSIONS/07-distributed-semantics-sheaf-cohomology-2026-06-07.md
//
// WHY: the sheaf-cohomology sub-program is vacuous if the live Plexus
// transport graph is a forest (β1 = 0 ⇒ H¹ trivial). The Plexus features
// have barely been exercised, so the live `RoomFunctor` /
// `RoomTransportSnapshot` tables are likely empty. This harness:
//
//   1. SEED   — builds a 3-room functor cycle (A→B→C→A) with *supported*
//               mapped claims, so the transport snapshots are non-empty and
//               the cycle actually carries evidence (necessary for a
//               non-trivial H¹, not just a graph cycle).
//   2. MEASURE— read-only topology report over the WHOLE Plexus: connectivity,
//               cyclomatic number β1 (= candidate graph-level H¹ rank),
//               directed 3-cycle count, per-functor claim-overlap density,
//               snapshot payload sizes, and a five-table meta-edge census.
//   3. CLEAN  — removes all probe data (probe deliberations cascade; the
//               loose `RoomFunctor` / `RoomTransportSnapshot` rows, which have
//               no FK cascade, are deleted explicitly).
//
// Snapshots are written via the PURE aggregator lib (computeTransportPayload /
// computeTransportHash), NOT `workers/transport-aggregator.ts`, to avoid that
// module's import-time setInterval keeping the process alive.
//
// Usage:
//   tsx --env-file=.env scripts/plexus-topology-probe.ts seed
//   tsx --env-file=.env scripts/plexus-topology-probe.ts measure
//   tsx --env-file=.env scripts/plexus-topology-probe.ts holonomy
//   tsx --env-file=.env scripts/plexus-topology-probe.ts clean
//   tsx --env-file=.env scripts/plexus-topology-probe.ts          # seed → measure → holonomy

import "dotenv/config";
import { prisma } from "../lib/prismaclient";
import { mintClaimMoid } from "../lib/ids/mintMoid";
import {
  computeTransportPayload,
  computeTransportHash,
  type TransportSource,
} from "../lib/argumentation/transportAggregator";
import { weight, prob } from "../lib/argumentation/logodds";

const PROBE_TAG = "plexus-probe";
const PROBE_AUTH = "plexus-probe-user";
const ROOM_KEYS = ["A", "B", "C"] as const;
type RoomKey = (typeof ROOM_KEYS)[number];

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

// ─────────────────────────────────────────────────────────────────────────
// SEED
// ─────────────────────────────────────────────────────────────────────────

async function ensureProbeUser(): Promise<{ id: string; auth_id: string }> {
  // User.id is a BigInt; every `createdById`/`authorId` FK is a String, so
  // stringify once here.
  const existing = await prisma.user.findUnique({ where: { auth_id: PROBE_AUTH } });
  if (existing) return { id: String(existing.id), auth_id: existing.auth_id };
  const u = await prisma.user.create({
    data: { auth_id: PROBE_AUTH, username: "plexus_probe", name: "Plexus Probe" },
  });
  return { id: String(u.id), auth_id: u.auth_id };
}

interface SeededRoom {
  key: RoomKey;
  deliberationId: string;
  sharedClaimId: string; // participates in the cycle, supported
  localClaimId: string; // also supported (overlap-density numerator)
  danglingClaimId: string; // NO support (demonstrates "mapped but empty")
}

async function seedRoom(key: RoomKey, user: { id: string; auth_id: string }): Promise<SeededRoom> {
  const hostId = `${PROBE_TAG}-${key}`;
  const delib = await prisma.deliberation.create({
    data: {
      hostType: "free",
      hostId,
      createdById: user.id,
      title: `[${PROBE_TAG}] Room ${key}`,
      tags: [PROBE_TAG],
    },
    select: { id: true },
  });

  // Three claims per room. Text is salted with the room key so the global
  // `Claim.moid` unique constraint never collides across rooms — semantic
  // identity is carried by the functor's claimMap, not by text equality
  // (which is exactly how real cross-room alignment works).
  async function mkClaim(label: string, supported: boolean): Promise<string> {
    const text = `${label} (room ${key})`;
    const moid = mintClaimMoid(`${text}::${hostId}`);
    const claim = await prisma.claim.create({
      data: { deliberationId: delib.id, text, createdById: String(user.id), moid },
      select: { id: true },
    });
    const arg = await prisma.argument.create({
      data: {
        deliberationId: delib.id,
        authorId: user.auth_id,
        text: `Argument concluding: ${text}`,
        claimId: claim.id,
        mediaType: "text",
      },
      select: { id: true },
    });
    if (supported) {
      await prisma.argumentSupport.create({
        data: {
          deliberationId: delib.id,
          claimId: claim.id,
          argumentId: arg.id,
          mode: "product",
          base: 0.7,
          strength: 0.7,
        },
      });
    }
    return claim.id;
  }

  const sharedClaimId = await mkClaim("Shared proposition P", true);
  const localClaimId = await mkClaim("Local proposition Q", true);
  const danglingClaimId = await mkClaim("Unsupported proposition R", false);

  return { key, deliberationId: delib.id, sharedClaimId, localClaimId, danglingClaimId };
}

/**
 * Mirror `recomputeSnapshotForFunctor` using the PURE lib, so no worker
 * import (and thus no dangling setInterval). Reduces source-side support
 * per claim with product noisy-OR, exactly like `loadSourceSupport`.
 */
async function writeSnapshot(fromRoomId: string, toRoomId: string): Promise<number> {
  const functor = await prisma.roomFunctor.findFirst({
    where: { fromRoomId, toRoomId },
    select: { claimMapJson: true },
  });
  if (!functor) return 0;
  const claimMap =
    functor.claimMapJson && typeof functor.claimMapJson === "object"
      ? (functor.claimMapJson as Record<string, string>)
      : {};

  const supports = await prisma.argumentSupport.findMany({
    where: { deliberationId: fromRoomId },
    select: { claimId: true, base: true },
  });
  const byClaim = new Map<string, number[]>();
  for (const s of supports) {
    const list = byClaim.get(s.claimId) ?? [];
    list.push(clamp01(s.base ?? 0.6));
    byClaim.set(s.claimId, list);
  }
  const reduced = Array.from(byClaim, ([claimId, xs]) => ({
    claimId,
    score: +(1 - xs.reduce((a, x) => a * (1 - x), 1)).toFixed(4),
  }));

  const source: TransportSource = { fromRoomId, claimMap, supports: reduced };
  const hash = computeTransportHash(source);
  const payload = computeTransportPayload(source);

  await prisma.roomTransportSnapshot.upsert({
    where: { transport_snapshot_pair: { toRoomId, fromRoomId } },
    create: { fromRoomId, toRoomId, claimMapHash: hash, payloadJson: payload as any },
    update: { claimMapHash: hash, payloadJson: payload as any, computedAt: new Date() },
  });
  return Object.keys(payload.byClaim).length;
}

async function seed(): Promise<void> {
  console.log("🌱 SEED — clearing any prior probe data first…");
  await clean(true);

  const user = await ensureProbeUser();
  const rooms: Record<RoomKey, SeededRoom> = {} as any;
  for (const key of ROOM_KEYS) {
    rooms[key] = await seedRoom(key, user);
    console.log(`   ✅ Room ${key}: ${rooms[key].deliberationId}`);
  }

  // The cycle A→B→C→A. Each claimMap aligns:
  //   - shared → shared   (supported on source ⇒ non-empty transport)
  //   - local  → local    (supported ⇒ raises overlap density)
  //   - dangling → dangling (UNsupported on source ⇒ silently dropped;
  //                          makes overlap density < 100%, the realistic case)
  const cycle: Array<[RoomKey, RoomKey]> = [
    ["A", "B"],
    ["B", "C"],
    ["C", "A"],
  ];
  for (const [from, to] of cycle) {
    const f = rooms[from];
    const t = rooms[to];
    const claimMap: Record<string, string> = {
      [f.sharedClaimId]: t.sharedClaimId,
      [f.localClaimId]: t.localClaimId,
      [f.danglingClaimId]: t.danglingClaimId,
    };
    await prisma.roomFunctor.create({
      data: { fromRoomId: f.deliberationId, toRoomId: t.deliberationId, claimMapJson: claimMap, notes: PROBE_TAG },
    });
    const n = await writeSnapshot(f.deliberationId, t.deliberationId);
    console.log(`   ↳ functor ${from}→${to} written; snapshot byClaim targets = ${n}`);
  }
  console.log("🌱 SEED complete — a 3-room supported cycle now exists.\n");
}

// ─────────────────────────────────────────────────────────────────────────
// MEASURE (read-only, whole-Plexus)
// ─────────────────────────────────────────────────────────────────────────

class UnionFind {
  private parent = new Map<string, string>();
  find(x: string): string {
    if (!this.parent.has(x)) this.parent.set(x, x);
    let root = x;
    while (this.parent.get(root) !== root) root = this.parent.get(root)!;
    let cur = x;
    while (this.parent.get(cur) !== root) {
      const next = this.parent.get(cur)!;
      this.parent.set(cur, root);
      cur = next;
    }
    return root;
  }
  union(a: string, b: string): void {
    this.parent.set(this.find(a), this.find(b));
  }
}

async function measure(): Promise<void> {
  console.log("📐 MEASURE — whole-Plexus topology report\n");

  const functors = await prisma.roomFunctor.findMany({
    select: { fromRoomId: true, toRoomId: true, claimMapJson: true },
  });

  if (functors.length === 0) {
    console.log("   ⚠️  No RoomFunctor rows exist. The Plexus transport graph is EMPTY.");
    console.log("   → H¹ is trivially 0. Run `seed` first, or exercise the transport features.\n");
    return;
  }

  // --- connectivity / cyclomatic number ---
  const rooms = new Set<string>();
  const directed = new Set<string>();
  const undirected = new Set<string>();
  const uf = new UnionFind();
  for (const f of functors) {
    rooms.add(f.fromRoomId);
    rooms.add(f.toRoomId);
    directed.add(`${f.fromRoomId}→${f.toRoomId}`);
    const [a, b] = [f.fromRoomId, f.toRoomId].sort();
    undirected.add(`${a}|${b}`);
    uf.union(f.fromRoomId, f.toRoomId);
  }
  const V = rooms.size;
  const Eund = undirected.size;
  const components = new Set(Array.from(rooms, (r) => uf.find(r))).size;
  // First Betti number of the undirected 1-complex: β1 = E − V + C.
  const beta1 = Eund - V + components;

  // --- directed 3-cycles A→B→C→A ---
  const adj = new Map<string, Set<string>>();
  for (const key of directed) {
    const [a, b] = key.split("→");
    if (!adj.has(a)) adj.set(a, new Set());
    adj.get(a)!.add(b);
  }
  let threeCycles = 0;
  const roomList = Array.from(rooms);
  for (const a of roomList) {
    for (const b of adj.get(a) ?? []) {
      if (b === a) continue;
      for (const c of adj.get(b) ?? []) {
        if (c === a || c === b) continue;
        if (adj.get(c)?.has(a)) threeCycles++;
      }
    }
  }
  threeCycles = Math.round(threeCycles / 3); // each cycle counted once per start vertex

  // --- directed 2-cycles A⇄B (mutual functors) ---
  let twoCycles = 0;
  for (const key of directed) {
    const [a, b] = key.split("→");
    if (a < b && directed.has(`${b}→${a}`)) twoCycles++;
  }

  console.log("   ── Functor graph (RoomFunctor) ──");
  console.log(`   rooms (V)                = ${V}`);
  console.log(`   directed functors        = ${directed.size}`);
  console.log(`   undirected edges (E)     = ${Eund}`);
  console.log(`   connected components (C) = ${components}`);
  console.log(`   cyclomatic number β1=E−V+C = ${beta1}   ← candidate graph-level H¹ rank`);
  console.log(`   directed 2-cycles (A⇄B)  = ${twoCycles}`);
  console.log(`   directed 3-cycles (A→B→C→A) = ${threeCycles}`);
  console.log(`   forest?                  = ${beta1 === 0 ? "YES (acyclic)" : "NO (has cycles)"}`);

  // --- per-functor claim-overlap density ---
  // A functor can be "present but empty": claimMap keys whose source claim has
  // no ArgumentSupport are silently dropped by the aggregator, so the cycle
  // carries no evidence even though the graph edge exists.
  console.log("\n   ── Claim-overlap density (per functor) ──");
  let totalKeys = 0;
  let totalSupported = 0;
  for (const f of functors) {
    const map =
      f.claimMapJson && typeof f.claimMapJson === "object" ? (f.claimMapJson as Record<string, string>) : {};
    const keys = Object.keys(map);
    if (keys.length === 0) continue;
    const supportedClaimIds = new Set(
      (
        await prisma.argumentSupport.findMany({
          where: { deliberationId: f.fromRoomId, claimId: { in: keys } },
          select: { claimId: true },
        })
      ).map((s) => s.claimId)
    );
    totalKeys += keys.length;
    totalSupported += supportedClaimIds.size;
    const pct = ((supportedClaimIds.size / keys.length) * 100).toFixed(0);
    console.log(
      `   ${short(f.fromRoomId)}→${short(f.toRoomId)}: ${supportedClaimIds.size}/${keys.length} mapped claims supported (${pct}%)`
    );
  }
  if (totalKeys > 0) {
    console.log(
      `   overall: ${totalSupported}/${totalKeys} (${((totalSupported / totalKeys) * 100).toFixed(0)}%) of mapped claims carry evidence`
    );
  }

  // --- snapshot payload sizes ---
  const snaps = await prisma.roomTransportSnapshot.findMany({
    select: { fromRoomId: true, toRoomId: true, payloadJson: true },
  });
  console.log("\n   ── Materialized transport snapshots ──");
  console.log(`   RoomTransportSnapshot rows = ${snaps.length}`);
  let nonEmptySnaps = 0;
  for (const s of snaps) {
    const byClaim = (s.payloadJson as any)?.byClaim ?? {};
    const n = Object.keys(byClaim).length;
    if (n > 0) nonEmptySnaps++;
  }
  console.log(`   non-empty snapshots        = ${nonEmptySnaps}/${snaps.length}`);

  // --- five-table meta-edge census (the full Plexus topology) ---
  const [xref, stackRef, argImport, sharedAuthor] = await Promise.all([
    prisma.xRef.count().catch(() => -1),
    prisma.stackReference.count().catch(() => -1),
    prisma.argumentImport.count().catch(() => -1),
    prisma.sharedAuthorRoomEdge.count().catch(() => -1),
  ]);
  // overlap edges = canonical claims spanning >1 deliberation
  const canonRows = await prisma.claim.findMany({
    where: { canonicalClaimId: { not: null } },
    select: { canonicalClaimId: true, deliberationId: true },
  });
  const delibsByCanon = new Map<string, Set<string>>();
  for (const r of canonRows) {
    if (!r.canonicalClaimId || !r.deliberationId) continue;
    const set = delibsByCanon.get(r.canonicalClaimId) ?? new Set();
    set.add(r.deliberationId);
    delibsByCanon.set(r.canonicalClaimId, set);
  }
  const overlapCanon = Array.from(delibsByCanon.values()).filter((s) => s.size > 1).length;

  console.log("\n   ── Meta-edge census (five Plexus edge kinds) ──");
  console.log(`   xref           = ${fmtCount(xref)}`);
  console.log(`   overlap        = ${overlapCanon}   (canonical claims spanning >1 room)`);
  console.log(`   stack_ref      = ${fmtCount(stackRef)}`);
  console.log(`   imports        = ${fmtCount(argImport)}`);
  console.log(`   shared_author  = ${fmtCount(sharedAuthor)}`);

  // --- verdict ---
  console.log("\n   ══ VERDICT ══");
  if (beta1 === 0) {
    console.log("   The live functor graph is a FOREST (β1 = 0) ⇒ H¹ is trivial on current data.");
    console.log("   Sub-program B (sheaf-cohomology) is VACUOUS until cycles exist. Seed or use transport.");
  } else if (nonEmptySnaps === 0) {
    console.log(`   Graph has cycles (β1 = ${beta1}) but NO snapshot carries evidence.`);
    console.log("   The cycle is 'present but empty' ⇒ H¹ still trivial in the evidence sheaf. Map SUPPORTED claims.");
  } else {
    console.log(`   Graph has cycles (β1 = ${beta1}, 3-cycles = ${threeCycles}) AND ${nonEmptySnaps} snapshot(s) carry evidence.`);
    console.log("   ⇒ Candidate NON-TRIVIAL H¹. Sub-program B is well-posed on current data; proceed to the");
    console.log("     ℝ-valued discrete-holonomy framing (sum log-odds shifts around each 3-cycle).");
  }
  console.log("");
}

function short(id: string): string {
  return id.length > 8 ? id.slice(0, 8) : id;
}
function fmtCount(n: number): string {
  return n < 0 ? "n/a (table missing)" : String(n);
}

// ─────────────────────────────────────────────────────────────────────────
// HOLONOMY (phase B2b) — ℝ-valued log-odds holonomy + claim-map monodromy
// ─────────────────────────────────────────────────────────────────────────
//
// Two layers (see session doc §2, §3.1):
//
//   1. CLAIM-MAP MONODROMY — the schema-supported obstruction. Track a claim
//      through the claimMap composite around a directed cycle. CLOSED (returns
//      to itself) vs DRIFTED (returns to a different claim) vs DROPPED (a
//      partial functor has no image). Drift/drop is a genuine H¹ carrier on
//      current data AND is exactly sub-program A's coherence failure.
//
//   2. ℝ-HOLONOMY — only well-posed for CLAIM-CLOSED loops (you can only sum
//      log-odds for a proposition that survives the round trip). With the only
//      datum the schema carries (per-node local log-odds), the connection is a
//      coboundary δw, so the holonomy telescopes to 0 (EXACT — no global
//      class). The log-odds SPREAD (max−min) is reported instead as the LOCAL
//      disagreement magnitude — which has a locus, so it belongs to Direction
//      2, not to a global cohomology class.
//
// FINDING this makes precise: on current data Direction 4's global obstruction
// collapses onto the claim-map monodromy (= coherence), and a genuinely
// QUANTITATIVE ℝ-class distinct from monodromy would require an independent
// per-edge transport datum (a RoomFunctor confidence weight) the schema does
// not yet carry. This vindicates the "coherence first" sequencing.

interface CycleFunctor {
  fromRoomId: string;
  toRoomId: string;
  claimMap: Record<string, string>;
}

const EDGE = (a: string, b: string) => `${a}\u0000${b}`;

/** Reduce local support per (deliberation, claim) to a probability via the
 *  same product noisy-OR the aggregator uses, for the rooms in play. */
async function loadLocalProbs(delibIds: string[]): Promise<Map<string, number>> {
  const supports = await prisma.argumentSupport.findMany({
    where: { deliberationId: { in: delibIds } },
    select: { deliberationId: true, claimId: true, base: true },
  });
  const byKey = new Map<string, number[]>();
  for (const s of supports) {
    const key = EDGE(s.deliberationId, s.claimId);
    const list = byKey.get(key) ?? [];
    list.push(clamp01(s.base ?? 0.6));
    byKey.set(key, list);
  }
  const out = new Map<string, number>();
  for (const [key, xs] of byKey) {
    out.set(key, 1 - xs.reduce((a, x) => a * (1 - x), 1));
  }
  return out;
}

/** Enumerate canonical simple directed 2- and 3-cycles. */
function enumerateDirectedCycles(functors: CycleFunctor[]): string[][] {
  const edgeSet = new Set(functors.map((f) => EDGE(f.fromRoomId, f.toRoomId)));
  const adj = new Map<string, string[]>();
  const rooms = new Set<string>();
  for (const f of functors) {
    rooms.add(f.fromRoomId);
    rooms.add(f.toRoomId);
    if (!adj.has(f.fromRoomId)) adj.set(f.fromRoomId, []);
    adj.get(f.fromRoomId)!.push(f.toRoomId);
  }
  const cycles: string[][] = [];
  const seen = new Set<string>();
  // 2-cycles A⇄B
  for (const f of functors) {
    if (edgeSet.has(EDGE(f.toRoomId, f.fromRoomId))) {
      const canon = "2:" + [f.fromRoomId, f.toRoomId].sort().join("|");
      if (!seen.has(canon)) {
        seen.add(canon);
        cycles.push([f.fromRoomId, f.toRoomId]);
      }
    }
  }
  // 3-cycles A→B→C→A
  for (const a of rooms) {
    for (const b of adj.get(a) ?? []) {
      if (b === a) continue;
      for (const c of adj.get(b) ?? []) {
        if (c === a || c === b) continue;
        if (edgeSet.has(EDGE(c, a))) {
          const canon = "3:" + [a, b, c].sort().join("|");
          if (!seen.has(canon)) {
            seen.add(canon);
            cycles.push([a, b, c]);
          }
        }
      }
    }
  }
  return cycles;
}

type ClaimFate = "closed" | "drifted" | "dropped";

interface ClaimTrace {
  fate: ClaimFate;
  /** [(room, claim)] visited; last entry is the round-trip landing at start room. */
  steps: Array<{ room: string; claim: string | null }>;
}

/** Follow a start claim through the claimMap composite around the cycle. */
function traceClaim(cycle: string[], mapOf: (a: string, b: string) => Record<string, string>, start: string): ClaimTrace {
  const n = cycle.length;
  const steps: Array<{ room: string; claim: string | null }> = [{ room: cycle[0], claim: start }];
  let cur: string | null = start;
  for (let i = 0; i < n; i++) {
    const from = cycle[i];
    const to = cycle[(i + 1) % n];
    if (cur === null) {
      steps.push({ room: to, claim: null });
      continue;
    }
    const next = mapOf(from, to)[cur] ?? null;
    steps.push({ room: to, claim: next });
    cur = next;
  }
  const landing = steps[steps.length - 1].claim;
  const fate: ClaimFate = landing === null ? "dropped" : landing === start ? "closed" : "drifted";
  return { fate, steps };
}

async function holonomy(): Promise<void> {
  console.log("🌀 HOLONOMY (B2b) — claim-map monodromy + ℝ-valued log-odds holonomy\n");

  const rawFunctors = await prisma.roomFunctor.findMany({
    select: { fromRoomId: true, toRoomId: true, claimMapJson: true },
  });
  const functors: CycleFunctor[] = rawFunctors.map((f) => ({
    fromRoomId: f.fromRoomId,
    toRoomId: f.toRoomId,
    claimMap:
      f.claimMapJson && typeof f.claimMapJson === "object" ? (f.claimMapJson as Record<string, string>) : {},
  }));
  if (functors.length === 0) {
    console.log("   ⚠️  No RoomFunctor rows. Run `seed` first.\n");
    return;
  }
  const mapIndex = new Map<string, Record<string, string>>();
  for (const f of functors) mapIndex.set(EDGE(f.fromRoomId, f.toRoomId), f.claimMap);
  const mapOf = (a: string, b: string) => mapIndex.get(EDGE(a, b)) ?? {};

  const cycles = enumerateDirectedCycles(functors);
  if (cycles.length === 0) {
    console.log("   The functor graph is a FOREST (no directed 2-/3-cycles). H¹ trivial. Nothing to do.\n");
    return;
  }

  const roomsInCycles = new Set<string>();
  cycles.forEach((c) => c.forEach((r) => roomsInCycles.add(r)));
  const localProbs = await loadLocalProbs([...roomsInCycles]);
  const probOf = (room: string, claim: string) => localProbs.get(EDGE(room, claim)); // undefined ⇒ no local support

  // Aggregate tallies.
  let totClosed = 0;
  let totDrifted = 0;
  let totDropped = 0;
  let nonTrivialMonodromy = 0;
  let nonZeroHolonomy = 0;
  const EPS = 1e-9;

  for (const cycle of cycles) {
    const label = cycle.map(short).join("→") + "→" + short(cycle[0]);
    const firstMap = mapOf(cycle[0], cycle[1 % cycle.length]);
    const starts = Object.keys(firstMap);
    console.log(`   ── cycle ${label}  (len ${cycle.length}, ${starts.length} start claims) ──`);
    if (starts.length === 0) {
      console.log("      (first edge has an empty claimMap — nothing tracked)\n");
      continue;
    }

    let closed = 0;
    let drifted = 0;
    let dropped = 0;

    for (const start of starts) {
      const trace = traceClaim(cycle, mapOf, start);
      if (trace.fate === "closed") {
        closed++;
        // ℝ-holonomy: sum the coboundary shifts w_{i+1} − w_i around the loop.
        // Telescopes to 0 by construction; we COMPUTE it to confirm exactness,
        // and report the log-odds SPREAD as the local-disagreement magnitude.
        const ws: number[] = [];
        let missing = false;
        for (let i = 0; i < cycle.length; i++) {
          const room = trace.steps[i].room;
          const claim = trace.steps[i].claim!;
          const p = probOf(room, claim);
          if (p === undefined) {
            missing = true;
            break;
          }
          ws.push(weight(p));
        }
        if (missing) {
          // closed in claim-identity but a node lacks local support ⇒ no metric.
          console.log(`      ✓ closed  "${short(start)}"  (no ℝ-metric: a node has no local support for the tracked claim)`);
          continue;
        }
        let holo = 0;
        for (let i = 0; i < ws.length; i++) holo += ws[(i + 1) % ws.length] - ws[i];
        const spread = Math.max(...ws) - Math.min(...ws);
        if (Math.abs(holo) > EPS) nonZeroHolonomy++;
        const probs = ws.map((w) => prob(w).toFixed(2)).join(", ");
        console.log(
          `      ✓ closed  "${short(start)}"  holonomy=${holo.toFixed(6)} (exact≈0)  spread(log-odds)=${spread.toFixed(3)}  local p=[${probs}]`
        );
      } else if (trace.fate === "drifted") {
        drifted++;
        nonTrivialMonodromy++;
        const land = trace.steps[trace.steps.length - 1].claim;
        console.log(`      ✗ DRIFTED "${short(start)}" → "${short(land ?? "∅")}"  (monodromy ≠ id ⇒ genuine H¹ carrier / coherence failure)`);
      } else {
        dropped++;
        nonTrivialMonodromy++;
        const at = trace.steps.findIndex((s) => s.claim === null);
        console.log(`      ✗ DROPPED "${short(start)}" at hop ${at} (partial functor ⇒ no image; obstruction)`);
      }
    }
    console.log(`      subtotal: ${closed} closed, ${drifted} drifted, ${dropped} dropped\n`);
    totClosed += closed;
    totDrifted += drifted;
    totDropped += dropped;
  }

  console.log("   ══ HOLONOMY VERDICT ══");
  console.log(`   cycles examined            = ${cycles.length}`);
  console.log(`   claims: closed=${totClosed}  drifted=${totDrifted}  dropped=${totDropped}`);
  console.log(`   non-trivial monodromy (drift+drop) = ${nonTrivialMonodromy}   ← genuine H¹ carriers on current data`);
  console.log(`   non-zero ℝ-holonomy (closed loops) = ${nonZeroHolonomy}   ← expected 0: coboundary is exact`);
  console.log("");
  if (nonTrivialMonodromy > 0) {
    console.log("   ⇒ The live Plexus carries NON-TRIVIAL obstructions, but they are CLAIM-MAP MONODROMY:");
    console.log("     the 'same' proposition is not tracked consistently around the loop. This is exactly a");
    console.log("     sub-program A (coherence) failure — vindicating the 'coherence first' sequencing.");
  } else if (totClosed > 0) {
    console.log("   ⇒ All tracked claims are claim-CLOSED and the ℝ-holonomy is exact (≈0). On current data the");
    console.log("     only disagreement is LOCAL (log-odds spread, which has a locus ⇒ Direction 2), not a global class.");
  }
  console.log("   NOTE: a QUANTITATIVE ℝ-class distinct from monodromy needs an independent per-edge datum");
  console.log("   (a RoomFunctor transport weight). The schema carries none today — that is the concrete B2c/schema ask.");
  console.log("");
}

// ─────────────────────────────────────────────────────────────────────────
// CLEAN
// ─────────────────────────────────────────────────────────────────────────

async function clean(quiet = false): Promise<void> {
  const probes = await prisma.deliberation.findMany({
    where: { tags: { has: PROBE_TAG } },
    select: { id: true },
  });
  const ids = probes.map((p) => p.id);
  if (ids.length === 0) {
    if (!quiet) console.log("🧹 CLEAN — no probe deliberations found.\n");
    return;
  }
  // RoomFunctor / RoomTransportSnapshot have no FK cascade — delete by room id.
  await prisma.roomTransportSnapshot.deleteMany({
    where: { OR: [{ fromRoomId: { in: ids } }, { toRoomId: { in: ids } }] },
  });
  await prisma.roomFunctor.deleteMany({
    where: { OR: [{ fromRoomId: { in: ids } }, { toRoomId: { in: ids } }] },
  });
  // Deliberation delete cascades claims, arguments, supports.
  await prisma.deliberation.deleteMany({ where: { id: { in: ids } } });
  if (!quiet) console.log(`🧹 CLEAN — removed ${ids.length} probe deliberation(s) and their functors/snapshots.\n`);
}

// ─────────────────────────────────────────────────────────────────────────
// CLI
// ─────────────────────────────────────────────────────────────────────────

async function main() {
  const cmd = (process.argv[2] ?? "all").toLowerCase();
  switch (cmd) {
    case "seed":
      await seed();
      break;
    case "measure":
      await measure();
      break;
    case "holonomy":
      await holonomy();
      break;
    case "clean":
      await clean();
      break;
    case "all":
      await seed();
      await measure();
      await holonomy();
      break;
    default:
      console.error(`Unknown command "${cmd}". Use: seed | measure | holonomy | clean | (none = seed+measure+holonomy).`);
      process.exit(1);
  }
}

main()
  .catch((err) => {
    console.error("❌ plexus-topology-probe failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
