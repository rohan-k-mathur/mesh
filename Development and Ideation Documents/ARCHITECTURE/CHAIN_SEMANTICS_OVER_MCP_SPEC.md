# Chain Semantics over MCP — Dev Spec

**Status:** proposed (dev spec)
**Owner:** Isonomia MCP / argument-write surface
**Part of:** the MCP scheme-ontology alignment sequence — PART 5 (chain semantics).
**Covers two of the PART-3 v1 deferrals:** hypothetical/counterfactual scopes and per-link evidence beyond what `quick-structured` accepts today.
**Derived from:**
- [CHAIN_CREATION_OVER_MCP_SPEC.md](CHAIN_CREATION_OVER_MCP_SPEC.md) §2.2 (the v1 deferrals) and §6 (the per-link `epistemicMode` already on the write path).
- [CHAIN_TOPOLOGY_OVER_MCP_SPEC.md](CHAIN_TOPOLOGY_OVER_MCP_SPEC.md) — the companion PART-4 spec; scopes apply *across* whatever topology PART 4 produced.
- [SCHEMES_MCP_ALIGNMENT_ROADMAP.md](SCHEMES_MCP_ALIGNMENT_ROADMAP.md) Phase B (per-link health gate, unchanged).

**Companion substrate (all rows/enums already exist — this spec writes them, no migration):**
- [lib/models/schema.prisma](../../lib/models/schema.prisma):
  - `model ArgumentScope` — `chainId`, `scopeType ScopeType @default(HYPOTHETICAL)`, `assumption String @db.Text`, `description`, `parentScopeId` + self-relation (`ScopeNesting`), `depth @default(0)`, `color`, `collapsed`, `nodes ArgumentChainNode[] @relation("ScopeNodes")`. Cascades on chain delete.
  - `enum ScopeType` (`HYPOTHETICAL | COUNTERFACTUAL | CONDITIONAL | OPPONENT | MODAL`).
  - `enum EpistemicStatus` (`ASSERTED | HYPOTHETICAL | COUNTERFACTUAL | CONDITIONAL | QUESTIONED | DENIED | SUSPENDED`).
  - `enum DialecticalRole` (`THESIS | ANTITHESIS | SYNTHESIS | OBJECTION | RESPONSE | CONCESSION`).
  - `model ArgumentChainNode` — already carries `epistemicStatus EpistemicStatus @default(ASSERTED)`, `scopeId String?` (`null` = actual/assertoric world), `dialecticalRole DialecticalRole?`, plus the `scope … @relation("ScopeNodes")`.
  - `enum EpistemicMode` (`FACTUAL | HYPOTHETICAL | COUNTERFACTUAL`) — the **argument-level** mode already wired through `quick-structured`/`quick-chain`.
  - `model Citation` — `targetType`/`targetId`/`sourceId`/`locator`/`quote`/`note`/`relevance`, `anchorType CitationAnchorType?`, `anchorId`, `anchorData Json?`, `intent CitationIntent?`. `@@unique([targetType, targetId, sourceId, locator])`.
  - `enum CitationAnchorType` (`annotation | text_range | timestamp | page | coordinates`).
  - `enum CitationIntent` (`supports | refutes | context | defines | method | background | acknowledges | example`).
  - `model ClaimEvidence` — `claimId`, `uri`, `title`, `citation` + provenance (`contentSha256`, `byteSize`, `contentType`, `httpStatus`, `fetchedAt`, `archivedUrl`).
- [app/api/argument-chains/quick-chain/route.ts](../../app/api/argument-chains/quick-chain/route.ts) — the PART-3 surface whose `EvidenceItem` today is `{ url, title?, quote?, summary? }` (capped 5/premise, 10/conclusion) and which writes `ClaimEvidence` rows, never `Citation` rows, never any scope/epistemicStatus.

---

## 1. Motivation and the reframed precondition

PART 3 ships chains in the **actual, assertoric world**: every node is implicitly
`ASSERTED`, no node belongs to a scope, and evidence is a bare URL + optional quote.
That was the correct v1 — it kept the write path honest about *what was actually
claimed* before letting agents author *supposed* or *contrary-to-fact* claims, which
are easy to confuse with assertions if the substrate doesn't keep them apart.

As with PART 4, grounding against the substrate shows neither deferral needs a
migration:

1. **Scopes are a shipped model.** `ArgumentScope` exists with full nesting
   (`parentScopeId`/`depth`), and `ArgumentChainNode` already carries the
   `scopeId` FK + `epistemicStatus` + `dialecticalRole`. The write path simply never
   creates a scope and never sets a node's status to anything but the `ASSERTED`
   default. The gap is a **scope authoring path**, not schema.

2. **Executable, intent-typed citations are a shipped model.** `Citation` carries
   four-plus `anchorType` kinds and eight `intent` kinds; `quick-chain` writes the
   poorer `ClaimEvidence` (URL + quote) and never touches `Citation`. The gap is
   **upgrading the evidence write surface**, not schema.

So the real gap is two write-side capabilities:

- **(a) scope authoring** — let an agent open a `HYPOTHETICAL`/`COUNTERFACTUAL`/
  `CONDITIONAL` scope ("Suppose the carbon tax passes…"), place links inside it,
  and have those nodes carry the right `epistemicStatus` and `scopeId` so the
  reader (and the standing evaluator) can tell *supposed* reasoning from *asserted*
  reasoning; and
- **(b) richer per-link evidence** — let each link's evidence carry an executable
  **anchor** (page / passage / timestamp / region) and a semantic **intent**
  (supports / refutes / context / …), materialised as `Citation` rows, instead of
  the current bare URL+quote `ClaimEvidence`.

**Goal.** Let MCP callers author **scoped, suppositional argument structure** and
**executable, intent-typed evidence** in the same one-shot chain call, inheriting
every PART-3 / PART-4 guarantee (per-link health gate, atomicity, worst-link
standing, fork-proof threading, DAG validity) and adding two honesty guarantees of
its own: **scope containment** (a supposition cannot silently leak into the actual
world) and **evidence well-formedness** (an anchor's `anchorData` must match its
`anchorType`).

---

## 2. Scope

### 2.1 In scope (this spec)

- **Hypothetical / counterfactual scopes.** Create `ArgumentScope` rows
  (`scopeType` ∈ `HYPOTHETICAL | COUNTERFACTUAL | CONDITIONAL | OPPONENT | MODAL`)
  with an `assumption` string, assign links to a scope (`ArgumentChainNode.scopeId`),
  set each scoped node's `epistemicStatus`, and support **nested scopes**
  (`parentScopeId`/`depth`). **(Implementation priority 2 — built after PART-4
  non-serial types, before PART-4 edge attacks.)**
- **`epistemicStatus` per node** beyond the `ASSERTED` default — `HYPOTHETICAL`,
  `COUNTERFACTUAL`, `CONDITIONAL`, `QUESTIONED`, `SUSPENDED`.
- **`dialecticalRole` per node** — `THESIS` / `ANTITHESIS` / `SYNTHESIS` /
  `OBJECTION` / `RESPONSE` / `CONCESSION` — so a scoped reductio or a
  thesis/antithesis pair is legible.
- **Per-link evidence upgrade.** Each link's `evidence[]` may carry `anchorType` +
  `anchorData` (executable anchor) and `intent` (semantic relationship),
  materialised as `Citation` rows against the link's conclusion claim, **in addition
  to** the existing `ClaimEvidence` snapshot. **(Implementation priority 4 — the
  last of the four deferrals.)**
- **Scope-actual-world relationship to `Argument.epistemicMode`.** The
  argument-level `epistemicMode` (already wired in PART 3 §6) and the node-level
  `epistemicStatus` are reconciled (§4.4) so they cannot contradict.

### 2.2 Out of scope (explicit deferrals)

- **Non-serial chain types and recursive edge attacks** — covered by the companion
  **PART 4 / Chain Topology** spec. Scopes apply *on top of* whatever topology PART 4
  produced; this spec does not re-specify edges.
- **Scope-conditioned standing semantics.** v1 records that a node is hypothetical;
  it does **not** re-derive `chainStanding` to "discharge" a hypothetical
  (conditional-proof: if everything inside scope S holds, then C). A sound
  discharge semantics needs the Ludics conditional/CONDITIONAL machinery and is its
  own spec — see **CHAIN-Q-S-C**.
- **Cross-chain / cross-deliberation evidence dedup.** `Citation` is written per
  chain link; sharing a `Source` across links is fine, but no global evidence graph
  is built here.
- **New `Source` ingestion.** Evidence URLs resolve to existing `Source` rows (or
  create them via the existing source-resolver); this spec does not change source
  ingestion, enrichment, or trust scoring.
- **Editing scopes** of an existing chain via MCP.

---

## 3. Data-model mapping

A chain with S scopes, N links, and E pieces of evidence materialises as:

| Semantics concept | Substrate row(s) | Notes |
|---|---|---|
| A supposition ("Suppose X…") | one `ArgumentScope` (`scopeType`, `assumption`, optional `parentScopeId`/`depth`) | nesting via the `ScopeNesting` self-relation |
| A link asserted plainly | `ArgumentChainNode` with `epistemicStatus = ASSERTED`, `scopeId = null` | the PART-3 default — unchanged |
| A link inside a supposition | `ArgumentChainNode` with `scopeId = <scope.id>`, `epistemicStatus` matching the scope (§4.4) | "actual world" = `scopeId null` |
| A thesis / antithesis / objection role | `ArgumentChainNode.dialecticalRole` | independent of `epistemicStatus` |
| The argument's modal flavour | `Argument.epistemicMode` (already set by PART 3 §6) | reconciled with node status (§4.4) |
| A piece of evidence (today) | `ClaimEvidence` (`uri`, `title`, `citation`) | the PART-3 snapshot — retained |
| A piece of evidence (this spec) | additionally a `Citation` (`sourceId`, `locator`, `anchorType`, `anchorData`, `intent`, `quote`, `note`) against `targetType="claim"`, `targetId=<conclusion claim id>` | executable + intent-typed |

**`scopeId null` is the actual world, and the spec keeps it that way.** A node with
no scope is asserted; a node in a scope is suppositional. The two are never
conflated, which is the core honesty property: an agent cannot accidentally promote
"suppose the tax passes → revenue rises" into the claim "revenue rises."

---

## 4. The semantics mechanism

### 4.1 Scope declaration

The chain request gains an optional `scopes[]` declaration; links reference a scope
by index:

```ts
scopes?: Array<{
  scopeType: "HYPOTHETICAL"|"COUNTERFACTUAL"|"CONDITIONAL"|"OPPONENT"|"MODAL",
  assumption: string,          // required, ≤ 1000 chars: "If the carbon tax passes"
  description?: string,
  parentScope?: number,        // index into scopes[] for nesting; omit = top-level (depth 0)
}>

// each mint-and-link link (or composed node) may carry:
// links[i].scope?: number               → index into scopes[]; omit = actual world (scopeId null)
// links[i].epistemicStatus?: EpistemicStatus   → overrides the scope-derived default (§4.4)
// links[i].dialecticalRole?: DialecticalRole
```

When `scopes[]` is omitted the route behaves **exactly as PART 3** (every node
`ASSERTED`, `scopeId null`), so this spec is strictly backward-compatible.

### 4.2 Scope nesting & containment validator

Before commit:

- `parentScope` indices must form a **forest** (no cycle) → `SCOPE_CYCLE_DETECTED`;
  `depth` is computed (root = 0, child = parent.depth + 1) and capped at a v1 max of
  4 → `SCOPE_TOO_DEEP`.
- A link's `scope` index must be valid → `SCOPE_INVALID_INDEX`.
- **Containment:** if link `b` threads a claim from link `a` (a PART-4 support edge),
  then `b`'s scope must be `a`'s scope **or a descendant of it**. You may reason
  *into* a deeper supposition but a conclusion drawn inside scope S may not be used
  as an asserted premise outside S without an explicit discharge (out of scope, §2.2)
  → `SCOPE_LEAK` if violated. This is the structural guard that keeps suppositions
  from leaking into the actual world.

### 4.3 Dialectical roles

`dialecticalRole` is orthogonal to `epistemicStatus` and `scopeId`: an `ANTITHESIS`
node may be `ASSERTED` (a real opposing position) or `HYPOTHETICAL` (entertained for
argument). v1 stores the role as supplied with no cross-field constraint beyond
"valid enum value"; it exists so a thesis/antithesis/synthesis or
objection/response/concession structure is **legible** to readers and downstream
rendering, not (yet) to drive standing.

### 4.4 Reconciling node `epistemicStatus` with argument `epistemicMode`

PART 3 already sets `Argument.epistemicMode` (`FACTUAL`/`HYPOTHETICAL`/
`COUNTERFACTUAL`) from the per-link payload. This spec sets the **node**'s
`epistemicStatus`. They must not contradict:

- If a link is placed in a `HYPOTHETICAL` scope but omits `epistemicStatus`, the node
  defaults to `HYPOTHETICAL` (scope-derived) and the argument's `epistemicMode` is
  coerced to `HYPOTHETICAL` if it was `FACTUAL`, with a `scope_mode_coerced` warning.
- If a link is in a `COUNTERFACTUAL` scope, the node defaults to `COUNTERFACTUAL` and
  `epistemicMode` to `COUNTERFACTUAL`.
- An explicit `epistemicStatus` that contradicts its scope (e.g. `ASSERTED` inside a
  `COUNTERFACTUAL` scope) → `SCOPE_STATUS_CONFLICT` (error) — an asserted claim
  cannot live inside a contrary-to-fact supposition.
- `CONDITIONAL`/`QUESTIONED`/`SUSPENDED` statuses are allowed in any scope and leave
  `epistemicMode` as supplied.

The mapping table (scope-default → node status → coerced argument mode):

| Scope `scopeType` | default node `epistemicStatus` | coerced `Argument.epistemicMode` |
|---|---|---|
| (none / actual world) | `ASSERTED` | as supplied (`FACTUAL` default) |
| `HYPOTHETICAL` | `HYPOTHETICAL` | `HYPOTHETICAL` |
| `COUNTERFACTUAL` | `COUNTERFACTUAL` | `COUNTERFACTUAL` |
| `CONDITIONAL` | `CONDITIONAL` | as supplied |
| `OPPONENT` | `HYPOTHETICAL` | `HYPOTHETICAL` |
| `MODAL` | `HYPOTHETICAL` | as supplied |

### 4.5 Per-link evidence upgrade

The `EvidenceItem` zod schema gains optional executable-anchor + intent fields,
**superset of the PART-3 shape** (every PART-3 evidence item stays valid):

```ts
EvidenceItem = {
  url: string,                 // (PART 3) resolves to a Source
  title?: string,              // (PART 3)
  quote?: string,              // (PART 3) excerpt
  summary?: string,            // (PART 3) → citationText
  // NEW (this spec):
  locator?: string,            // "p. 13", "fig. 2", "08:14", "§3.2"
  anchorType?: "annotation"|"text_range"|"timestamp"|"page"|"coordinates",
  anchorData?: Json,           // shape MUST match anchorType (§4.6)
  intent?: "supports"|"refutes"|"context"|"defines"|"method"|"background"|"acknowledges"|"example",
}
```

For each evidence item the route now writes **both**:

1. the existing `ClaimEvidence` snapshot (unchanged — preserves provenance
   enrichment), **and**
2. a `Citation` row: `targetType = "claim"`, `targetId = <link conclusion claim id>`,
   `sourceId = <resolved Source>`, plus `locator`/`quote`/`note`/`anchorType`/
   `anchorData`/`intent`. The `@@unique([targetType, targetId, sourceId, locator])`
   constraint makes re-supplying the same citation idempotent (`skipDuplicates`).

`intent` is **advisory, not gating** in v1: an evidence item marked `refutes` on a
support link is allowed (it may be a steelman) but emits an
`evidence_intent_contrary` warning so the mismatch is visible.

### 4.6 Anchor well-formedness validator

`anchorData` must match `anchorType` or the item is rejected
(`EVIDENCE_ANCHOR_MALFORMED`):

| `anchorType` | required `anchorData` shape |
|---|---|
| `page` | none (page-level reference; `locator` carries the page) |
| `text_range` | `{ start: number, end: number }` (or a selector object) |
| `timestamp` | `{ start: number, end?: number }` (seconds) |
| `coordinates` | `{ x, y, width, height }` |
| `annotation` | resolves to an existing `Annotation.id` via `anchorId` |

This is the evidence analogue of PART 3's claim-fork guard: a citation cannot claim
to anchor at a coordinate it doesn't carry the data for.

---

## 5. API surface

### 5.1 Extended endpoint — `POST /api/argument-chains/quick-chain`

Extends the PART-3/PART-4 endpoint; all new fields optional, defaulting to PART-3
behaviour.

**Request additions:**

```ts
{
  // … all PART-3/PART-4 fields …
  scopes?: Array<{ scopeType, assumption, description?, parentScope? }>,
  // links[i].scope?: number
  // links[i].epistemicStatus?: EpistemicStatus
  // links[i].dialecticalRole?: DialecticalRole
  // links[i].evidence[].{ locator?, anchorType?, anchorData?, intent? }   (superset of PART 3)
}
```

**Response additions:**

```ts
{
  // … PART-3/PART-4 chain/links/edges/attacks/chainStanding/warnings …
  scopes: Array<{
    id, scopeType, assumption, parentScopeId, depth, nodeIds: string[],
  }>,
  links: Array<{
    // … PART-3/PART-4 link fields …
    epistemicStatus: EpistemicStatus,
    scopeId: string | null,
    dialecticalRole: DialecticalRole | null,
    citations: Array<{ id, sourceId, locator, anchorType, intent }>,  // the NEW executable evidence
  }>,
}
```

### 5.2 MCP tool — `propose_argument_chain` (extended)

Gains optional `scopes[]`, per-link `scope` / `epistemicStatus` / `dialecticalRole`,
and the richer `evidence[]` anchor/intent fields. Default behaviour (omit `scopes[]`,
supply only `{url, quote}` evidence) is unchanged. **Description additions (draft):**

> …(PART-3/4 text)… To reason **under a supposition**, declare `scopes[]` (e.g.
> `{ scopeType: "HYPOTHETICAL", assumption: "If the carbon tax passes" }`) and put
> links inside one with `scope: <index>`; those nodes are recorded as hypothetical
> and cannot leak into the asserted world (`SCOPE_LEAK`). Use `epistemicStatus` /
> `dialecticalRole` for finer epistemic and thesis/antithesis labelling. Evidence
> may now carry an executable `anchorType` + `anchorData` (page / passage /
> timestamp / region) and a semantic `intent` (supports / refutes / context / …),
> stored as a resolvable citation against the link's claim.

---

## 6. Reusing the Phase B health gate (unchanged)

Per-link scheme-health selection, the verifier verdict, Carneades `premiseType`, and
`epistemicMode` run **exactly as PART 3 §6**. Semantics-specific notes:

- **A scope does not exempt a link from the health gate.** A hypothetical argument is
  still a real argument instance: it must name an argument-pattern scheme that passes
  health selection. "Suppose X, then by [non-argument scheme]…" is rejected with
  `SCHEME_NOT_ARGUMENT_PATTERN` like any other link.
- **Worst-element `chainStanding`** is unchanged in v1: it ranges over the chain's
  `Argument` rows regardless of scope. Whether *hypothetical* nodes should be
  excluded from (or differently weighted in) the worst-link computation is
  **CHAIN-Q-S-C** — v1 includes them but tags the `weakestLink` with its
  `epistemicStatus` so a reader can see if the weakest link is merely supposed.

---

## 7. Transaction boundary

Extends the PART-3/PART-4 atomic pattern; one `prisma.$transaction`.

1. Pre-flight (outside txn): Phase B health-gate every link; PART-4 edge/topology
   resolution + DAG check.
2. Pre-flight: **scope validation** — forest check (`SCOPE_CYCLE_DETECTED`), depth
   cap (`SCOPE_TOO_DEEP`), link scope indices (`SCOPE_INVALID_INDEX`), containment
   over support edges (`SCOPE_LEAK`), status/scope reconciliation
   (`SCOPE_STATUS_CONFLICT`, §4.4).
3. Pre-flight: **evidence validation** — anchor well-formedness
   (`EVIDENCE_ANCHOR_MALFORMED`, §4.6); resolve each `url` to a `Source` (reusing the
   existing resolver). Any failure → 400, **nothing written.**
4. Begin txn. Mint each link's argument (PART 3 step 3), now setting
   `Argument.epistemicMode` per the reconciliation table (§4.4).
5. Create `ArgumentChain` + (PART-4) `ArgumentChainNode[]` / `ArgumentChainEdge[]`.
6. **Create `ArgumentScope[]`** (parents before children, so `parentScopeId`
   resolves); capture ids.
7. **Update nodes** with `scopeId`, `epistemicStatus`, `dialecticalRole` (a second
   pass, since scope ids are now known — mirrors PART-4's edge-attack second pass).
8. **Write evidence:** for each evidence item, upsert `ClaimEvidence` (PART 3) **and**
   `Citation` (`skipDuplicates` on the unique key, §4.5).
9. Commit.
10. Outside txn: worst-element `chainStanding` (tagging weakest link's
    `epistemicStatus`); fire-and-forget provenance enrichment on the new
    `ClaimEvidence`/`Source` (as PART 3).

---

## 8. Validation & error codes

Extends the PART-3/PART-4/Phase-B enum. Semantics-specific additions:

| Code | Cause | Severity |
|---|---|---|
| `SCOPE_INVALID_INDEX` | a link's `scope` (or a scope's `parentScope`) index is out of range | error |
| `SCOPE_CYCLE_DETECTED` | `parentScope` references form a cycle (§4.2) | error |
| `SCOPE_TOO_DEEP` | nesting exceeds the v1 depth cap (4) | error |
| `SCOPE_LEAK` | a claim drawn inside scope S is threaded as an asserted premise outside S (§4.2) | error |
| `SCOPE_STATUS_CONFLICT` | an explicit `epistemicStatus` contradicts its scope (e.g. `ASSERTED` in a `COUNTERFACTUAL` scope, §4.4) | error |
| `EVIDENCE_ANCHOR_MALFORMED` | `anchorData` doesn't match `anchorType` (§4.6) | error |
| `EVIDENCE_SOURCE_UNRESOLVED` | an evidence `url` could not be resolved/created as a `Source` | error |
| `scope_mode_coerced` | `Argument.epistemicMode` coerced to match scope (§4.4) | warning |
| `evidence_intent_contrary` | evidence `intent` contradicts the link's role (e.g. `refutes` on a support link, §4.5) | warning |
| `scope_empty` | a declared scope has no links assigned | warning |

Field caps: `scopes[]` ≤ 12; `assumption` ≤ 1000 chars; nesting depth ≤ 4; evidence
caps inherited from PART 3 (≤5/premise, ≤10/conclusion). All PART-3/PART-4 codes
inherited unchanged.

---

## 9. Test plan

- **Backward-compat:** a PART-3 payload (no `scopes[]`, `{url, quote}` evidence) →
  identical result; every node `ASSERTED`, `scopeId null`; `ClaimEvidence` written;
  no `Citation` rows. (Regression guard.)
- **Single hypothetical scope:** declare `{ HYPOTHETICAL, "If the tax passes" }`,
  put two links in it → both nodes `epistemicStatus: HYPOTHETICAL`, `scopeId` set;
  their `Argument.epistemicMode` coerced to `HYPOTHETICAL` with `scope_mode_coerced`.
- **Counterfactual scope:** `COUNTERFACTUAL` → nodes `COUNTERFACTUAL`,
  `epistemicMode COUNTERFACTUAL`.
- **Nested scopes:** scope B with `parentScope` = scope A → B.`depth = 1`,
  `parentScopeId` = A.id; a link in B is allowed to thread a claim from a link in A
  (descendant containment).
- **Scope leak rejected:** link in actual world threads a claim drawn by a link
  inside a `HYPOTHETICAL` scope → `SCOPE_LEAK`, nothing written.
- **Status conflict rejected:** a link with explicit `epistemicStatus: ASSERTED`
  placed in a `COUNTERFACTUAL` scope → `SCOPE_STATUS_CONFLICT`, nothing written.
- **Scope cycle / too deep:** `parentScope` cycle → `SCOPE_CYCLE_DETECTED`; depth 5 →
  `SCOPE_TOO_DEEP`.
- **Dialectical roles:** a thesis link + an antithesis link → `dialecticalRole`
  stored as supplied, orthogonal to scope.
- **Evidence with page anchor + intent:** `{ url, anchorType: "page", locator: "p.13",
  intent: "supports" }` → a `Citation` row (`targetType "claim"`, the conclusion
  claim id, `intent supports`) **and** a `ClaimEvidence` row; response `citations[]`
  lists it.
- **Evidence with timestamp anchor:** `{ anchorType: "timestamp", anchorData:
  { start: 494 } }` → accepted; malformed `{ anchorType: "coordinates", anchorData:
  { start: 1 } }` → `EVIDENCE_ANCHOR_MALFORMED`.
- **Citation idempotency:** the same `{url, locator}` supplied twice → one `Citation`
  row (unique key), no error.
- **Contrary intent warning:** `intent: "refutes"` on a `SUPPORTS` link →
  `evidence_intent_contrary` warning, still written.
- **Atomicity:** any pre-flight failure (scope leak, malformed anchor, unresolved
  source) → entire chain rolls back.
- **MCP smoke (Claude Desktop):** "Suppose the carbon tax passes — then revenue
  rises (per this report, page 13) and emissions fall. But note this is
  hypothetical." → assert a `HYPOTHETICAL` scope with both links inside, a `page`
  citation on the revenue link, and no leak into the asserted world.

---

## 10. Phasing

| Step | Deliverable | Blocker |
|---|---|---|
| 0 | **PART 3 ships** (serial chain + threading + per-link gate) | CHAIN_CREATION_OVER_MCP_SPEC (✅) |
| 1 | `scopes[]` authoring + nesting + containment validator (§4.1–4.2); per-node `scopeId`/`epistemicStatus`/`dialecticalRole`; reconciliation with `epistemicMode` (§4.4) | Step 0 + PART-4 Step 1 (topology, so containment runs over real support edges) |
| 2 | `weakestLink` epistemic-status tagging in the standing echo | Step 1 |
| 3 | Per-link evidence upgrade: `EvidenceItem` superset, `Citation` write, anchor validator (§4.5–4.6) | Step 0 |
| 4 | MCP tool extension + orientation recipe; bump `ORIENTATION_VERSION` | Steps 1–3 |
| 5 | Jest integration (backward-compat, scopes, nesting, leak/conflict, evidence anchors/intent, idempotency, atomicity) | Steps 1–3 |
| 6 | Claude Desktop smoke + trigger-phrase tuning | Step 4 |

**Cross-spec sequencing (agreed):** the four PART-3 deferrals build in the order
**(1) non-serial chain types [PART 4 Steps 1–2] → (2) hypothetical/counterfactual
scopes [this spec, Steps 1–2] → (3) recursive edge attacks [PART 4 Steps 3–4] →
(4) per-link evidence [this spec, Step 3]**. So this spec's two halves are **not**
built together: ship the scope half (Steps 1–2) after PART-4's non-serial types,
then return for the evidence half (Step 3) only after PART-4's edge attacks land.
The evidence half (Step 3) is independent of the scope half and could move earlier
if priorities shift, but the agreed order puts it last.

**Note on the Step-1 PART-4 dependency.** Scope **containment** (`SCOPE_LEAK`) is
defined over *support edges*, which only exist once PART-4 Step 1 (the topology
builder) is in. If scopes are attempted on a pure serial chain before PART 4, the
containment check degenerates to the linear order — workable, but the validator is
cleaner once edges are explicit, hence the sequencing.

---

## 11. Open questions

- **CHAIN-Q-S-A (default status strictness).** v1 *coerces* `epistemicMode` to match
  a scope and only errors on an explicit contradiction. Should placing a link in a
  `HYPOTHETICAL` scope with a stated `epistemicMode: FACTUAL` be an error rather than
  a silent coercion + warning? Lean: warn-and-coerce for v1 (agents will routinely
  omit the mode), revisit if it causes confusion.
- **CHAIN-Q-S-B (intent gating).** v1 treats `intent` as advisory (`refutes` on a
  support link is a warning, not an error). Should a hard mismatch ever block? Lean:
  never gate on intent — steelmanning and "evidence the other side cites" are
  legitimate; the warning is enough.
- **CHAIN-Q-S-C (conditional-proof discharge).** The big one: v1 records hypothetical
  structure but does not *discharge* it (derive "if S then C" as an asserted
  conditional once a scoped sub-proof closes). A sound discharge needs the Ludics
  `CONDITIONAL` semantics and a standing model that distinguishes
  asserted-conditional from asserted-categorical. Deferred to a dedicated spec;
  flagged because it is the natural next capability scopes unlock.
- **CHAIN-Q-S-D (evidence on premises vs conclusion).** v1 writes the `Citation`
  against the link's **conclusion** claim (matching where `ClaimEvidence` already
  attaches). Should per-premise evidence also get executable citations (against the
  premise claim)? The substrate allows it (`targetId` is any claim id); deferred to
  keep v1's write surface small.
- **CHAIN-Q-S-E (scope-level evidence).** Should a *scope's `assumption`* itself
  carry evidence (the supposition is grounded in a real source)? Out of v1; the
  `assumption` is free text today.
- **CHAIN-Q-S-F (passage/quote anchor for evidence — surfaced by the 2026-06-01
  smoke test).** v1's executable anchor kinds are `page` / `text_range` /
  `timestamp` / `coordinates` / `annotation`. In the smoke test the LLM *wanted*
  to anchor textual evidence but reported "`text_range` needs numeric offsets I
  don't have" and fell back to human-readable `locator`s — because an LLM working
  from a PDF/report knows the **quoted passage** (and page/figure) but not
  character offsets into a canonical text. `text_range` is therefore the wrong
  primitive for the most common LLM affordance. Proposed: add a `quote`/`passage`
  anchor kind whose `anchorData` is the verbatim snippet (+ optional page), and
  let the **server** resolve it to offsets against the resolved `Source` when it
  can (degrading to a stored quote when it can't). Degradation in v1 was graceful
  (the citation still landed via `locator`), so this is an ergonomics upgrade, not
  a correctness fix. Pairs naturally with CHAIN-Q-S-D (per-premise citations).

---

## 12. Where this fits

```
SCHEMES_MCP_TOOL_ALIGNMENT.md           (design note; §3.5 chains-as-consumer)
  └─ SCHEMES_MCP_ALIGNMENT_ROADMAP.md        (impl roadmap; Phase B gate)
       └─ CHAIN_CREATION_OVER_MCP_SPEC.md         (PART 3; serial spine + threading)
            ├─ CHAIN_TOPOLOGY_OVER_MCP_SPEC.md       (PART 4 — branching + edge attacks)
            └─ CHAIN_SEMANTICS_OVER_MCP_SPEC.md   ← (this file; PART 5 — scopes + per-link evidence)
```

This spec lifts the PART-3 *actual-world, bare-URL* chain into the suppositional and
evidential structure the substrate already models — `ArgumentScope` + the
`EpistemicStatus`/`DialecticalRole` node columns, and the `Citation`
anchor/intent vocabulary — without a single migration, writing columns that have
shipped since the Phase-4 hypotheticals design but that no write surface populates.
The two honesty guarantees it adds — **scope containment** (no supposition leaks into
the asserted world) and **anchor well-formedness** (no citation lies about where it
points) — are the semantics-layer analogues of PART 3's fork-proof claim threading.
