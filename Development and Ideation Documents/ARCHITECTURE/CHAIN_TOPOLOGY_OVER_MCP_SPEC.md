# Chain Topology over MCP — Dev Spec

**Status:** proposed (dev spec)
**Owner:** Isonomia MCP / argument-write surface
**Part of:** the MCP scheme-ontology alignment sequence — PART 4 (chain topology).
**Covers two of the PART-3 v1 deferrals:** non-serial chain types and recursive edge attacks.
**Derived from:**
- [CHAIN_CREATION_OVER_MCP_SPEC.md](CHAIN_CREATION_OVER_MCP_SPEC.md) §2.2 (the explicit v1 deferrals this spec picks up) and §7 (the atomic transaction boundary it extends).
- [SCHEMES_MCP_ALIGNMENT_ROADMAP.md](SCHEMES_MCP_ALIGNMENT_ROADMAP.md) Phase B (the per-link scheme-health gate, reused verbatim and unchanged).

**Companion substrate (all rows/enums already exist — this spec writes them, it does not migrate them):**
- [lib/models/schema.prisma](../../lib/models/schema.prisma) — `enum ArgumentChainType` (`SERIAL | CONVERGENT | DIVERGENT | TREE | GRAPH`), `enum ChainNodeRole` (`PREMISE | EVIDENCE | CONCLUSION | OBJECTION | REBUTTAL | QUALIFIER | COMMENT`), `enum ArgumentChainEdgeType` (`SUPPORTS | ENABLES | PRESUPPOSES | REFUTES | QUALIFIES | EXEMPLIFIES | GENERALIZES | REBUTS | UNDERCUTS | UNDERMINES`), `enum ChainAttackTargetType` (`NODE | EDGE`).
- `model ArgumentChainNode` — already carries `role`, `nodeOrder`, `targetType ChainAttackTargetType @default(NODE)`, `targetEdgeId String?`, and the self-relation `targetEdge … @relation("EdgeAttacks")`.
- `model ArgumentChainEdge` — already carries `edgeType`, `strength @default(1.0)`, `description`, `slotMapping Json?`, and the back-relation `attackingNodes ArgumentChainNode[] @relation("EdgeAttacks")`.
- [app/api/argument-chains/quick-chain/route.ts](../../app/api/argument-chains/quick-chain/route.ts) — the PART-3 write surface that today hardcodes `chainType: "SERIAL"`, node `role` ∈ `{PREMISE, CONCLUSION}`, and a serial `SUPPORTS` spine.
- [app/api/argument-chains/from-prong/route.ts](../../app/api/argument-chains/from-prong/route.ts) — the canonical pattern that already writes `UNDERCUTS` objection edges, i.e. proof that non-`SUPPORTS` edges materialise cleanly.

---

## 1. Motivation and the reframed precondition

PART 3 shipped a **clean spine**: a `SERIAL` chain whose every edge is `SUPPORTS`,
every node is `PREMISE` or `CONCLUSION`, and every attack is implicit (a node can
only be threaded forward, never made to *attack* a prior link). That was the right
v1 — it isolated the hard part (fork-proof claim threading) from the topology.

The deferrals this spec resolves are **not blocked on new tables**. Grounding
against the substrate surfaces the same reframing PART 3 found for `mint_claim`:

1. **The chain-type enum is already five-valued.** `ArgumentChainType` ships
   `CONVERGENT`, `DIVERGENT`, `TREE`, and `GRAPH` alongside `SERIAL`. The PART-3
   route simply never emits anything but `SERIAL` and never builds an edge set
   richer than a single spine. The gap is a **write-side topology builder**, not a
   schema change.

2. **Recursive edge attacks are already a first-class relation.** `ArgumentChainNode`
   carries `targetType` (`NODE | EDGE`) and a nullable `targetEdgeId` with a real
   FK (`@relation("EdgeAttacks")`), and `ArgumentChainEdge` carries the inverse
   `attackingNodes`. An `UNDERCUTS`-style attack on an *inference* (an edge) rather
   than a *claim* (a node) is fully modelled; nothing on the write path ever sets
   `targetType = EDGE`.

So the real gap is two write-side capabilities, both layered on the PART-3 atomic
transaction with **zero migration**:

- **(a) a topology builder** that accepts a declared edge set (or a recognised
  shape) and materialises `CONVERGENT` / `DIVERGENT` / `TREE` / `GRAPH` chains with
  a DAG validator and a typed-edge vocabulary, instead of the hardcoded serial
  `SUPPORTS` spine; and
- **(b) recursive edge-attack authoring** — let a node declare it *attacks an edge*
  (an inference step) rather than a node, populating `targetType = EDGE` +
  `targetEdgeId`, so an agent can object to the reasoning link "A therefore B"
  itself, not merely to A or to B.

**Goal.** Give MCP callers a single-call path to author **branching and attacking**
argument structures — convergent support, divergent inference, trees, and
objections that target either a claim or an inference — inheriting every honesty
guarantee of PART 3 (per-link scheme-health gate, fork-proof claim threading,
worst-link `chainStanding`, atomicity) and adding a **graph-acyclicity guarantee**
for the support spine.

---

## 2. Scope

### 2.1 In scope (this spec)

- **Non-serial chain types:** `CONVERGENT` (many premises → one conclusion),
  `DIVERGENT` (one premise → many conclusions), `TREE` (hierarchical
  premise-conclusion tree), and `GRAPH` (general DAG). **(Implementation priority 1
  — the first thing built per the agreed sequencing.)**
- **An explicit edge declaration** on the chain request: instead of inferring a
  serial spine from `links[]` order, the caller may declare typed edges between
  links by index, drawn from the full `ArgumentChainEdgeType` vocabulary.
- **Recursive edge attacks:** a node (objection/rebuttal link) may target an
  *edge* (`targetType = EDGE`, `targetEdgeId`) rather than a node, with `UNDERCUTS`
  as the canonical inference-attack edge type. **(Implementation priority 3.)**
- **Objection / rebuttal roles:** `ChainNodeRole.OBJECTION` and `REBUTTAL`, and the
  attack edge types `REBUTS` / `UNDERCUTS` / `UNDERMINES` / `REFUTES`, on the write
  surface (PART 3 only ever wrote `SUPPORTS`).
- **A DAG / acyclicity validator** over the support sub-graph, replacing PART 3's
  trivially-acyclic linear spine.
- **Worst-element `chainStanding`** unchanged: still computed by the already-shipped
  [chainExposure.ts](../../lib/deliberation/chainExposure.ts) evaluator over the
  chain's arguments; topology does not change how standing is derived, only what the
  graph looks like.

### 2.2 Out of scope (explicit deferrals)

- **Hypothetical / counterfactual scopes** (`ArgumentScope`, `EpistemicStatus`,
  `DialecticalRole`) — covered by the companion **PART 5 / Chain Semantics** spec.
- **Per-link evidence beyond what `quick-structured` accepts** — also PART 5.
- **Scheme-net composition** (`SchemeNetStep`) — still out, as in PART 3 §2.2.
- **Editing existing chains** via MCP (add/remove/re-order nodes after creation).
- **`GRAPH` chains with cycles.** Cyclic argument graphs (mutual support, dialectical
  loops) are deliberately rejected by the v1 validator; a sound treatment needs the
  Ludics/ASPIC+ loop semantics and is its own spec. `GRAPH` here means **DAG**.
- **Edge-on-edge attacks** (a node attacking an edge that itself attacks an edge,
  2nd-order). v1 supports node→edge attacks (1st-order); the schema admits deeper
  nesting but the validator caps at depth 1 to keep the standing evaluation
  tractable.

---

## 3. Data-model mapping

A topology chain of N links + M declared edges + K edge-attacks materialises as:

| Topology concept | Substrate row(s) | Notes |
|---|---|---|
| The chain | one `ArgumentChain` with `chainType` ∈ {`CONVERGENT`,`DIVERGENT`,`TREE`,`GRAPH`} | type is **derived from the declared edge set** (§4.3) unless explicitly pinned |
| Link *k* (an argument) | one `Argument` (+ claims/premises/scheme instance) + one `ArgumentChainNode` | minted (mint-and-link) or referenced (compose), exactly as PART 3 |
| A typed relation *i → j* | one `ArgumentChainEdge` (`edgeType` from the full vocabulary, `strength`, optional `description`) | replaces PART 3's implicit serial `SUPPORTS` |
| Claim reuse on a support edge | a **single shared `Claim` row** | unchanged from PART 3 §4 — support edges still imply conclusion→premise claim threading |
| An attack on a claim | a node with `role` ∈ {`OBJECTION`,`REBUTTAL`} + an edge `REBUTS`/`UNDERMINES` targeting the node | node→node attack (already expressible; now on the write path) |
| An attack on an inference | a node with `targetType = EDGE`, `targetEdgeId` → the attacked edge; edge `UNDERCUTS` | **the recursive-attack capability**; `attackingNodes` back-relation makes it navigable |

**The type is a read-off of the edge set, not an independent claim.** A chain is
`CONVERGENT` because two support edges share a target node; `DIVERGENT` because one
source node has two support targets; `TREE` because the support sub-graph is a
branching tree with a single root; `GRAPH` otherwise (and acyclic). v1 **computes**
`chainType` from the materialised edge set and stores it, rather than trusting a
caller-supplied label — so the stored type can never lie about the structure
(§4.3). A caller *may* pin an expected type and get a `CHAIN_TYPE_MISMATCH` error if
the edges disagree, which is the honest analogue of PART 3's fork guard.

---

## 4. The topology mechanism (the heart of the spec)

### 4.1 Edge declaration

PART 3 infers edges from `links[]` order (`k → k+1`, all `SUPPORTS`). This spec adds
an optional `edges[]` declaration that, when present, **replaces** the implicit
spine:

```ts
edges?: Array<{
  from: number,                 // link index (0-based) — the source node
  to: number,                   // link index — the target node
  edgeType?: ArgumentChainEdgeType,  // default "SUPPORTS"
  strength?: number,            // 0..1, default 1.0
  description?: string,
}>
```

When `edges[]` is omitted the route behaves **exactly as PART 3** (serial
`SUPPORTS` spine), so this spec is strictly backward-compatible: every existing
`quick-chain` payload keeps its meaning.

**Support edges still thread claims.** A `SUPPORTS` / `ENABLES` / `PRESUPPOSES`
edge `from → to` carries the same semantics PART 3 gave the serial spine: link
`from`'s conclusion claim is reused as a premise of link `to`, via MOID identity or
explicit `reuseClaimId` (PART 3 §4), with the same fork guard. The topology builder
does not weaken threading; it generalises *which* links thread into *which*.

### 4.2 Recursive edge attacks

An attacking link declares the **edge** it attacks rather than (or in addition to)
threading a claim:

```ts
links: [
  // … the arguments whose inference is being attacked …
  {
    conclusion: "The inference from the survey to the policy claim is invalid",
    premises: [ … ],
    schemeKey: "…",
    attacksEdge: { from: 0, to: 1 },   // ← attacks the inference edge 0→1
  }
]
```

The builder resolves `attacksEdge: { from, to }` to the materialised
`ArgumentChainEdge` id, then writes the attacking node with
`targetType = "EDGE"`, `targetEdgeId = <that edge id>`, and lays an `UNDERCUTS`
edge from the attacking node to the **target edge's source node** (so the attack is
both reachable via `attackingNodes` and visible as a standing-bearing edge). An
attack on a *node* (the ordinary case) uses `attacksNode: <index>` and an edge of
type `REBUTS` (contradicts the conclusion) or `UNDERMINES` (attacks a premise).

**Attack edges never thread claims.** A `REBUTS`/`UNDERCUTS`/`UNDERMINES`/`REFUTES`
edge is dialectical, not inferential: it carries no conclusion→premise claim reuse
and is excluded from the support sub-graph the DAG validator (§4.4) and the
claim-threading guard operate over. This mirrors the PART-3 `reuseClaimId` SSRF/fork
posture: only support relations move claims.

### 4.3 Type derivation (the no-lying-label guard)

After the edge set is materialised, the builder computes `chainType` from the
**support sub-graph** (edges in {`SUPPORTS`,`ENABLES`,`PRESUPPOSES`}):

- exactly one path through all nodes, each node ≤1 in/out support → `SERIAL`;
- some node has ≥2 incoming support edges, none has ≥2 outgoing → `CONVERGENT`;
- some node has ≥2 outgoing support edges, none has ≥2 incoming → `DIVERGENT`;
- branching but a single root and no node with ≥2 incoming (a forest reduced to one
  tree) → `TREE`;
- otherwise (a general DAG: both fan-in and fan-out) → `GRAPH`.

If the caller supplied `expectChainType` and it disagrees with the derived type →
`CHAIN_TYPE_MISMATCH` (400, nothing written), echoing the derived type so the caller
can correct the declaration. This is the topology analogue of PART 3's
`CHAIN_LINK_BROKEN` honesty guard: **the stored label always matches the wires.**

### 4.4 DAG / acyclicity validator

Before the transaction commits, the builder runs a Kahn topological sort over the
support sub-graph. A back-edge (cycle) → `CHAIN_CYCLE_DETECTED` (400, nothing
written), naming the offending edge set. Attack edges are excluded from this check
(a rebuttal pointing "back" at an earlier node is legitimate and common). The
`rootNodeId` is set to the unique support-source with in-degree 0; if there are
several (a `DIVERGENT`/`GRAPH` shape with multiple roots) → the lowest-index one is
chosen and a `chain_multiple_roots` warning is emitted (advisory, not an error).

---

## 5. API surface

### 5.1 Extended endpoint — `POST /api/argument-chains/quick-chain`

This spec **extends the existing PART-3 endpoint** rather than adding a new one;
the new fields are all optional and default to PART-3 serial behaviour.

**Request additions (everything else as PART 3 §5.1):**

```ts
{
  // … all PART-3 fields (name, deliberationId, mode, links[], argumentIds[], requestId) …

  expectChainType?: "SERIAL"|"CONVERGENT"|"DIVERGENT"|"TREE"|"GRAPH",  // optional pin; else derived

  edges?: Array<{                       // optional; omitted → serial SUPPORTS spine (PART 3)
    from: number, to: number,
    edgeType?: ArgumentChainEdgeType,   // default "SUPPORTS"
    strength?: number,                  // 0..1, default 1.0
    description?: string,
  }>,

  // per-link attack declarations (mint-and-link links[] gain these; mutually exclusive with a support thread)
  // links[i].attacksNode?: number      → node→node attack (edge REBUTS|UNDERMINES)
  // links[i].attacksEdge?: { from, to } → node→edge attack (targetType=EDGE, edge UNDERCUTS)
}
```

**Response additions (everything else as PART 3 §5.1):**

```ts
{
  // … PART-3 chain/links/threading/chainStanding/weakestLink/warnings …
  chain: { …, chainType: "SERIAL"|"CONVERGENT"|"DIVERGENT"|"TREE"|"GRAPH" },  // the DERIVED type
  edges: Array<{
    id, sourceNodeId, targetNodeId,
    edgeType: ArgumentChainEdgeType,    // now the full vocabulary, not just SUPPORTS
    strength: number,
  }>,
  attacks: Array<{                      // the recursive/edge-attack register
    attackerNodeId: string,
    targetType: "NODE"|"EDGE",
    targetNodeId?: string,              // when targetType=NODE
    targetEdgeId?: string,              // when targetType=EDGE
    edgeType: "REBUTS"|"UNDERCUTS"|"UNDERMINES"|"REFUTES",
  }>,
  topology: { derivedChainType, rootNodeId, isDag: true, supportEdgeCount, attackEdgeCount },
}
```

### 5.2 MCP tool — `propose_argument_chain` (extended, not new)

The PART-3 tool gains optional `edges[]`, `expectChainType`, and per-link
`attacksNode` / `attacksEdge`. The default one-shot behaviour (omit `edges[]`) is
unchanged, so existing agent usage keeps working. **Description additions (draft):**

> …(PART-3 text)… To author a **branching** structure, supply `edges[]` declaring
> typed relations between links by index (`SUPPORTS` threads a claim forward;
> `CONVERGENT`/`DIVERGENT`/`TREE` shapes emerge from the edge set and the server
> reports the derived `chainType`). To **object to an argument**, give a link
> `attacksNode: <i>` (rebut a conclusion / undermine a premise) or
> `attacksEdge: { from, to }` (**undercut the inference itself** — the reasoning
> link, not the claims). The server validates the support graph is acyclic
> (`CHAIN_CYCLE_DETECTED`) and that the declared and derived chain types agree
> (`CHAIN_TYPE_MISMATCH`). Attacks do not thread claims; only support edges do.

---

## 6. Reusing the Phase B health gate (unchanged)

Per-link scheme-health selection, Carneades `premiseType`, `epistemicMode`, and
the verifier verdict run **exactly as PART 3 §6** — topology adds no scheme logic.
Two topology-specific notes:

- **Attack links are still full arguments.** An `OBJECTION`/`REBUTTAL` link is
  minted through the same `quick-structured` engine and gated the same way; an
  objection that names a dialogue-meta scheme key is rejected with
  `SCHEME_NOT_ARGUMENT_PATTERN` like any other link.
- **Worst-element `chainStanding`** is unchanged: the chain-exposure evaluator
  already ranges over the chain's `Argument` rows irrespective of edge shape, so a
  `CONVERGENT`/`TREE` chain's standing is the worst standing among its arguments,
  and `weakestLink` still keys on `argumentId`. (Whether an *edge attack* should
  itself depress the standing of the inference it undercuts is **CHAIN-Q-T-C**
  below — v1 records the attack structurally but does not re-weight standing on it.)

---

## 7. Transaction boundary

Extends the PART-3 from-prong atomic pattern. All-or-nothing in one
`prisma.$transaction`:

**mint-and-link mode:**

1. Pre-flight (outside txn): Phase B health-gate every link (as PART 3 step 1).
2. Pre-flight: **resolve the edge set.** If `edges[]` omitted, synthesise the serial
   spine. Validate every `from`/`to` is a valid link index; validate `attacksNode`/
   `attacksEdge` indices resolve. Run the §4.4 DAG check over support edges
   (`CHAIN_CYCLE_DETECTED`) and the §4.3 type derivation (`CHAIN_TYPE_MISMATCH` if
   `expectChainType` disagrees). Any failure → 400, **nothing written.**
3. Pre-flight: claim-threading topology (PART 3 step 2) now runs over **support
   edges** rather than the linear order — every `reuseClaimId` must reference a
   support-predecessor's conclusion (`CHAIN_LINK_INVALID_THREAD` on forward-ref /
   cycle / non-support edge).
4. Begin txn. Mint each link's argument exactly as PART 3 step 3 (conclusion claim,
   premises with fork guard, `Argument`, `ArgumentPremise[]`, scheme instance,
   support/compose helpers).
5. Create `ArgumentChain` with the **derived** `chainType`.
6. Create `ArgumentChainNode[]` (one per link). Attacking links additionally set
   `targetType` + `targetEdgeId` — but `targetEdgeId` references an edge row that
   does not exist yet, so node-attack wiring is a **second pass** after edges
   (step 8).
7. Create `ArgumentChainEdge[]` from the resolved edge set (`createMany`,
   `skipDuplicates`), capturing the id of each so attacks can reference them.
8. **Second pass:** for each edge-attack link, `update` its node to set
   `targetType = "EDGE"` and `targetEdgeId` = the resolved edge id, and create the
   `UNDERCUTS` edge attacker→source. Node-attacks create their `REBUTS`/`UNDERMINES`
   edge here too.
9. Set `rootNodeId` = the support-root (§4.4).
10. Commit.
11. Outside txn: worst-element `chainStanding` eval; fire-and-forget provenance
    enrichment (as PART 3).

**compose mode:** as PART 3, but the spine is replaced by the declared `edges[]`
(indices map into `argumentIds[]`). Each composed argument's existing scheme health
is re-checked (`compose_link_scheme_unhealthy`, non-fatal). Edge-attacks in compose
mode reference existing arguments as the attackers.

---

## 8. Validation & error codes

Extends the PART-3 / Phase-B / E.1 shared enum. Topology-specific additions:

| Code | Cause | Severity |
|---|---|---|
| `CHAIN_EDGE_INVALID_INDEX` | an `edges[]` / `attacksNode` / `attacksEdge` index is out of range | error |
| `CHAIN_CYCLE_DETECTED` | the support sub-graph has a cycle (§4.4) | error |
| `CHAIN_TYPE_MISMATCH` | `expectChainType` disagrees with the derived type (§4.3) | error |
| `CHAIN_ATTACK_TARGET_NOT_FOUND` | `attacksEdge` names a `(from,to)` pair with no declared edge | error |
| `CHAIN_ATTACK_ON_ATTACK` | an `attacksEdge` targets an attack edge (depth-2, out of scope §2.2) | error |
| `chain_multiple_roots` | support sub-graph has >1 in-degree-0 node; lowest index chosen as root | warning |
| `chain_self_attack` | an attack link's argument shares its conclusion claim with its target (self-counter) | warning |

Reuse all PART-3 codes unchanged (`CHAIN_TOO_SHORT`/`CHAIN_TOO_LONG`,
`CHAIN_LINK_INVALID_THREAD`, `CHAIN_LINK_BROKEN`, `CHAIN_LINK_NOT_FOUND`,
`chain_link_autothreaded`, `chain_link_scheme_repeat`, `compose_link_scheme_unhealthy`,
`chainRedundancyFlag`) and all Phase-B per-link codes.

Field caps: `edges[]` ≤ 60 (a 12-node DAG is densely 66 edges; 60 is a sane cap for
v1); per-link at most one of {support thread, `attacksNode`, `attacksEdge`}; all
PART-3 caps inherited.

---

## 9. Test plan

- **Backward-compat:** a PART-3 payload with no `edges[]` → identical result, stored
  `chainType: "SERIAL"`, serial `SUPPORTS` spine. (Guards against regression.)
- **Convergent:** two links both `SUPPORTS`-edge a third → derived
  `chainType: "CONVERGENT"`, the third node has in-degree 2, threading shares both
  premises' claims.
- **Divergent:** one link `SUPPORTS`-edges two others → `chainType: "DIVERGENT"`,
  root has out-degree 2.
- **Tree:** a branching support tree with single root → `chainType: "TREE"`,
  `rootNodeId` = the root; `isDag: true`.
- **Graph (DAG):** mixed fan-in/fan-out, acyclic → `chainType: "GRAPH"`.
- **Cycle rejected:** declare edges A→B→C→A (support) → `CHAIN_CYCLE_DETECTED`,
  zero rows written.
- **Type mismatch:** `expectChainType: "SERIAL"` with convergent edges →
  `CHAIN_TYPE_MISMATCH` echoing `"CONVERGENT"`, nothing written.
- **Node attack:** link 2 `attacksNode: 1` with `REBUTS` → an edge `REBUTS`
  attacker→node-1; standing register lists it under `attacks[]` with
  `targetType: "NODE"`.
- **Edge attack (the headline):** link 2 `attacksEdge: { from: 0, to: 1 }` →
  attacker node has `targetType: "EDGE"`, `targetEdgeId` = the 0→1 edge id, an
  `UNDERCUTS` edge exists, and the target edge's `attackingNodes` includes the
  attacker. Round-trip via a read confirms navigability.
- **Edge-attack on missing edge:** `attacksEdge: { from: 0, to: 3 }` where no 0→3
  edge was declared → `CHAIN_ATTACK_TARGET_NOT_FOUND`.
- **Depth-2 attack rejected:** `attacksEdge` pointing at an `UNDERCUTS` edge →
  `CHAIN_ATTACK_ON_ATTACK`.
- **Atomicity:** any pre-flight failure (cycle, bad index, health gate) → the whole
  chain rolls back; `$transaction` not entered / fully reverted.
- **Compose topology:** three existing arguments + a declared convergent `edges[]`
  → nodes + typed edges, no new claims/arguments.
- **MCP smoke (Claude Desktop):** "Argument A and argument B both support C, and
  here's an objection that the inference from A to C doesn't hold." → assert a
  `CONVERGENT` chain with an `UNDERCUTS` edge-attack on the A→C edge, and the
  derived `chainType` renders.

---

## 10. Phasing

| Step | Deliverable | Blocker |
|---|---|---|
| 0 | **PART 3 must ship** (serial chain + threading + per-link gate) | CHAIN_CREATION_OVER_MCP_SPEC (✅) |
| 1 | `edges[]` declaration + type-derivation (§4.3) + DAG validator (§4.4); CONVERGENT/DIVERGENT/TREE/GRAPH materialise; backward-compat preserved | Step 0 |
| 2 | Worst-element `chainStanding` echo over non-serial shapes (reuse chainExposure; verify it is edge-shape-agnostic) | Step 1 |
| 3 | Node→node attacks (`attacksNode`, `REBUTS`/`UNDERMINES`, `OBJECTION`/`REBUTTAL` roles) | Step 1 |
| 4 | Recursive **edge** attacks (`attacksEdge`, `targetType=EDGE`, `targetEdgeId`, `UNDERCUTS`, depth-1 cap) | Step 3 |
| 5 | MCP tool extension + orientation recipe; bump `ORIENTATION_VERSION` | Steps 1–4 |
| 6 | Jest integration (backward-compat, each type, cycle/mismatch, node & edge attacks, atomicity, compose) | Steps 1–4 |
| 7 | Claude Desktop smoke + trigger-phrase tuning | Step 5 |

**Cross-spec sequencing (agreed):** within the four PART-3 deferrals the build
order is **(1) non-serial chain types [this spec, Steps 1–2] → (2) hypothetical/
counterfactual scopes [PART 5] → (3) recursive edge attacks [this spec, Steps 3–4]
→ (4) per-link evidence [PART 5]**. So this spec is authored as one document but its
steps interleave with PART 5 at implementation time: ship Steps 1–2 here, then PART
5's scope work, then return for Steps 3–4.

**Critical path:** Step 1 (the topology builder + DAG validator) is the core; edge
attacks (Step 4) are the correctness-sensitive tail.

---

## 11. Open questions

- **CHAIN-Q-T-A (derive vs declare the type).** v1 *derives* `chainType` from the
  edge set and treats a caller pin as an assertion to verify. Should a caller ever
  be allowed to *force* a type that disagrees with the wires? Lean: **no** — the
  no-lying-label guard is the whole point; a mismatch is an error, not an override.
- **CHAIN-Q-T-B (`GRAPH` cycles).** v1 rejects cycles outright. Some legitimate
  dialectical structures are mutually supporting (coherentist bundles). Admitting
  them needs a fixpoint standing semantics (Ludics/ASPIC+), so it is deferred — but
  should the validator distinguish "support cycle" (reject) from "attack cycle"
  (already allowed)? v1 already excludes attack edges from the cycle check; the open
  part is whether support cycles ever get a green-lit mode.
- **CHAIN-Q-T-C (does an edge attack depress standing?).** v1 records a node→edge
  `UNDERCUTS` structurally but the chain-exposure evaluator does not yet re-weight
  the undercut inference's standing. Wiring edge-attacks into `chainStanding` (an
  undercut inference should drag the conclusion toward `tested-undermined`) is a
  follow-up that touches [chainExposure.ts](../../lib/deliberation/chainExposure.ts),
  tracked against the existing `CHAINEXPOSURE_WEAKEST_LINK_FOLLOWUP.md` note.
- **CHAIN-Q-T-D (edge-attack depth).** The schema admits node→edge→edge nesting; v1
  caps at depth 1 (`CHAIN_ATTACK_ON_ATTACK`). Is 2nd-order undercutting ("your
  objection to my inference is itself unsound") worth the standing-evaluation
  complexity? Deferred; flagged because the cap is a v1 choice, not a schema limit.

---

## 12. Where this fits

```
SCHEMES_MCP_TOOL_ALIGNMENT.md           (design note; §3.5 chains-as-consumer)
  └─ SCHEMES_MCP_ALIGNMENT_ROADMAP.md        (impl roadmap; Phase B gate)
       └─ CHAIN_CREATION_OVER_MCP_SPEC.md         (PART 3; serial spine + threading)
            ├─ CHAIN_TOPOLOGY_OVER_MCP_SPEC.md    ← (this file; PART 4 — branching + edge attacks)
            └─ CHAIN_SEMANTICS_OVER_MCP_SPEC.md      (PART 5 — scopes + per-link evidence)
```

This spec lifts the PART-3 *clean spine* into the full chain topology the substrate
already models — branching support and recursive attacks — without a single
migration, by writing columns (`chainType`, `targetType`, `targetEdgeId`, the full
`edgeType` vocabulary) that have shipped since the Phase-6 ArgumentChain design but
that no write surface has ever populated.
