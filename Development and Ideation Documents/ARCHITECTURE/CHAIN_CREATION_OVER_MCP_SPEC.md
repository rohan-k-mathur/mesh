# Chain Creation over MCP — Dev Spec

**Status:** proposed (dev spec)
**Owner:** Isonomia MCP / argument-write surface
**Part of:** the 3-part MCP scheme-ontology alignment sequence — PART 3.
**Derived from:**
- [SCHEMES_MCP_TOOL_ALIGNMENT.md](SCHEMES_MCP_TOOL_ALIGNMENT.md) §3.5 (chain creation as ontology consumer) — the design rationale this spec implements.
- [SCHEMES_MCP_ALIGNMENT_ROADMAP.md](SCHEMES_MCP_ALIGNMENT_ROADMAP.md) Phase B (the single-argument health-selection gate this reuses verbatim) and Phase F (chains, deferred to here).
- [docs/MCP_STRUCTURED_ARGUMENT_ROADMAP.md](../../docs/MCP_STRUCTURED_ARGUMENT_ROADMAP.md) §6 / decision #8 (the `mint_claim` deferral this spec resolves).

**Companion substrate:**
- [app/api/arguments/quick-structured/route.ts](../../app/api/arguments/quick-structured/route.ts) — single-argument write; the per-link engine.
- [app/api/argument-chains/route.ts](../../app/api/argument-chains/route.ts) + [app/api/argument-chains/from-prong/route.ts](../../app/api/argument-chains/from-prong/route.ts) — the canonical chain-materialisation transaction pattern.
- [lib/ids/mintMoid.ts](../../lib/ids/mintMoid.ts) — `mintClaimMoid` (content-hash claim identity).
- [packages/isonomia-mcp/src/server.ts](../../packages/isonomia-mcp/src/server.ts) — `get_chains` (read-only today), `propose_structured_argument`.

---

## 1. Motivation and the reframed precondition

The MCP write surface mints **single** structured arguments. There is no
write path for **chains** — composing arguments where one argument's conclusion
feeds the next's premise. Both prior roadmaps named a `mint_claim` /
reusable-claim-id primitive as the *blocking precondition* for chains
(MCP_STRUCTURED_ARGUMENT_ROADMAP decision #8; alignment §3.5).

**That precondition is softer than assumed.** Grounding the spec against the
substrate surfaced two facts that change the design:

1. **Claims already dedup by content hash.** `quick-structured` mints every claim
   via `claim.upsert({ where: { moid } })` where `moid = mintClaimMoid(text)`
   (NFC-normalise → collapse whitespace → trim → sha256;
   [mintMoid.ts](../../lib/ids/mintMoid.ts)). So if link *k*'s conclusion text is
   byte-identical (after canonicalisation) to link *k+1*'s premise text, they
   **already resolve to the same `Claim` row** — no new primitive required. Claim
   reuse across arguments is *already* the default behaviour; what's missing is a
   way to make it **intentional and fork-proof** rather than accidental.

2. **Chains reference existing `Argument` rows by id.** `ArgumentChainNode`
   carries `argumentId` with `@@unique([chainId, argumentId])`; the chain is
   nodes (existing arguments) + typed edges (`SUPPORTS` / `ENABLES` / `UNDERCUTS`)
   + `rootNodeId`. The [from-prong route](../../app/api/argument-chains/from-prong/route.ts)
   is the canonical atomic pattern: one `$transaction` creating chain → nodes
   (dedup on `[chainId, argumentId]`) → edges (serial `SUPPORTS` over the
   mainline, `UNDERCUTS` for objections) → `rootNodeId`.

So the real gap is not a missing claim primitive; it is:

- **(a) explicit, fork-proof claim threading** — let an agent declare "link *k+1*'s
  premise *is* claim `clX` (link *k*'s conclusion)" by **id**, so a near-miss
  paraphrase can't silently fork the chain into two disconnected claims; and
- **(b) an atomic chain-creation endpoint** that mints N arguments *and* wires the
  conclusion→premise reuse *and* the `ArgumentChain` nodes/edges in one
  transaction, applying the Phase B health gate at **link granularity**.

**Goal.** Give MCP callers a single-call path to author a serial argument chain
with intentional claim reuse between links, inheriting every honesty guarantee of
the single-argument write tool (scheme-health selection, verifier verdict,
no-silent-merge), and surfacing the worst-link `chainStanding` that `get_chains`
already computes on read.

---

## 2. Scope

### 2.1 In scope (v1)

- **Serial chains** (`chainType: SERIAL`): a linear premise→conclusion spine where
  each link is a structured argument and link *k*'s conclusion claim is reused as
  one of link *k+1*'s premises.
- **Two authoring modes:**
  - **compose** — chain *existing* arguments by `argumentId` (no minting).
  - **mint-and-link** — mint each link via the `quick-structured` engine *and*
    chain them, threading claim reuse, in one transaction.
- **Intentional claim threading** by explicit claim id *or* by the existing MOID
  content-hash default, with a fork guard.
- **Link-granularity health gate** (Phase B reused verbatim per link).
- **Worst-link `chainStanding`** echoed in the response (read-side already exists).

### 2.2 Out of scope (v1 — explicit deferrals)

- **Scheme-net composition** (`SchemeNetStep`) — composing *schemes* rather than
  *arguments*. Separate, harder; the scheme-layer T003 fibration is involved.
- **Recursive edge attacks** (`ArgumentChainNode.targetEdgeType = EDGE`),
  **objection/rebuttal** links, and non-serial `chainType` (`CONVERGENT`,
  `DIVERGENT`, `TREE`). v1 is a clean spine.
- **Hypothetical/counterfactual scopes** (`ArgumentScope`, `epistemicStatus`).
- **Editing existing chains** via MCP (add/remove nodes, re-order, delete).
- **`ThesisChainReference` back-linking** — the from-prong concern; not MCP.
- **Per-link evidence beyond what `quick-structured` already accepts.**

---

## 3. Data-model mapping

A v1 serial chain of N links materialises as:

| Chain concept | Substrate row(s) | Notes |
|---|---|---|
| The chain | one `ArgumentChain` (`chainType=SERIAL`, `rootNodeId`→first link's node) | created in the txn |
| Link *k* (an argument) | one `Argument` + its `Claim`s + `ArgumentPremise[]` + `ArgumentSchemeInstance` | **mint-and-link** mode mints via the `quick-structured` engine; **compose** mode references an existing `argumentId` |
| Link *k* in the chain | one `ArgumentChainNode` (`argumentId`, `nodeOrder=k`, `role`) | dedup on `[chainId, argumentId]` |
| The spine edge *k → k+1* | one `ArgumentChainEdge` (`edgeType=SUPPORTS`) | source = node *k*, target = node *k+1* |
| Claim reuse *k.conclusion = (k+1).premise* | a **single shared `Claim` row** | by MOID identity (default) or explicit claim id (fork-proof) |

**The reuse seam is the `Claim`, not the `Argument`.** Two arguments are "linked"
at the substrate level precisely because they share a `Claim`: link *k*'s
`conclusionClaimId` equals one of link *k+1*'s `ArgumentPremise.claimId`. The
`ArgumentChainEdge` is the *editorial* assertion of that link; the shared claim is
the *logical* one. v1 creates both: the shared claim makes the reuse real in the
argument graph, the chain edge makes it navigable in `get_chains`.

---

## 4. The claim-threading mechanism (the heart of the spec)

### 4.1 Default: MOID identity (already works)

If the author supplies link *k+1*'s reused premise as **text** that canonicalises
to the same MOID as link *k*'s conclusion, the `claim.upsert({ where:{ moid } })`
already collapses them. v1 keeps this as the zero-config path **but verifies it**:
after minting link *k*, the engine records `conclusionMoid`; when link *k+1*
declares a `reusePremise`, the engine asserts the resolved claim id matches link
*k*'s conclusion claim id. If they diverge (a paraphrase produced a different
MOID), v1 **does not silently fork** — it returns `CHAIN_LINK_BROKEN` naming the
two claim ids and the offending text, so the author can fix the wording or switch
to explicit-id threading (§4.2).

### 4.2 Explicit: reuse by claim id (fork-proof)

To make threading robust against paraphrase, a link may reference a prior link's
conclusion **by claim id** instead of re-supplying text:

```ts
premises: [
  { reuseClaimId: "<link k conclusionClaimId>" },   // threaded link, no text
  { text: "Additional fresh premise for this link" } // ordinary minted premise
]
```

`reuseClaimId` skips minting: the engine looks up the existing `Claim` (must be in
the same deliberation, must be a prior link's conclusion **within this chain
request** — not an arbitrary claim from elsewhere, to prevent cross-deliberation
smuggling) and wires `ArgumentPremise.claimId` directly to it. This is the
explicit form of the `mint_claim` reusable-id primitive, scoped narrowly to
*intra-chain* reuse so it cannot be abused as a general "attach my argument to any
claim" backdoor.

**Fork guard (non-negotiable, mirrors `decideImportResolution`'s no-silent-merge
posture).** The engine reuses a claim id **only** when (a) it was minted earlier
*in the same chain request* as a conclusion, or (b) MOID-identity resolves it
exactly. It never merges two distinct claims on textual *similarity*. Anything
short of exact MOID identity or an in-request id is a `CHAIN_LINK_BROKEN` error,
not a merge.

### 4.3 Why not a standalone `mint_claim` tool

MCP_STRUCTURED_ARGUMENT_ROADMAP decision #8 deferred a standalone `mint_claim`
tool. v1 **does not** add one. A free-floating claim with no argument is a
dangling node (no scheme, no standing, no CQs) and invites exactly the
orphan-claim pollution the ontology programme is trying to avoid. Intra-chain
`reuseClaimId` gives the threading benefit without the orphan risk: every claim is
born as some link's conclusion. If a future use case genuinely needs
standalone-claim minting, it is a separate spec.

---

## 5. API surface

### 5.1 New endpoint — `POST /api/argument-chains/quick-chain`

Mirrors the `quick-structured` auth/rate-limit/provenance patterns exactly
(cookie → MCP bearer fallback, shared rate-limit prefix, AI-author flagging,
fire-and-forget provenance enrichment), and the from-prong **atomic transaction**
pattern for the chain rows.

**Request schema:**

```ts
{
  name: string,                          // chain name (≤255)
  description?: string,
  purpose?: string,
  deliberationId?: string,               // omitted → "My Arguments" fallback (as quick-structured)
  isPublic?: boolean,                    // default false (matches ArgumentChain default)
  mode: "mint-and-link" | "compose",     // default "mint-and-link"

  // mint-and-link: each link is a quick-structured payload + a thread declaration
  links?: Array<{
    conclusion: string,
    premises: Array<
      | { text: string, isAxiom?: boolean, premiseType?: "ordinary"|"assumption"|"exception", evidence?: EvidenceItem[] }
      | { reuseClaimId: string }         // §4.2 — thread a prior link's conclusion
    >,                                    // 1..10
    reasoning?: string,
    schemeKey?: string,                  // Phase B health gate applies per link
    ruleType?: "STRICT" | "DEFEASIBLE",
    implicitWarrant?: string,
    epistemicMode?: "factual"|"hypothetical"|"counterfactual",
    evidence?: EvidenceItem[],           // conclusion-level
  }>,                                     // 2..12 links (a chain needs ≥2)

  // compose: reference existing arguments; spine edges inferred by order
  argumentIds?: string[],                // 2..20, in spine order
}
```

**Response shape:**

```ts
{
  ok: true,
  chain: { id, name, chainType: "SERIAL", rootNodeId, deliberationId, permalink },
  links: Array<{
    nodeId, argumentId, conclusionClaimId, nodeOrder,
    schemeInstance: { id, schemeKey, schemeName } | null,
    // per-link Phase B verdicts:
    schemeHealth: "ok" | "canonicalized" | "rejected",
    verifierVerdict: "equal"|"subset"|"incomparable"|"inconclusive"|"skipped",
  }>,
  edges: Array<{ id, sourceNodeId, targetNodeId, edgeType: "SUPPORTS" }>,
  threading: Array<{ fromLink: number, toLink: number, sharedClaimId: string, mode: "moid"|"explicit" }>,
  chainStanding: StandingState,  // worst-link, from chainExposure evaluator (e.g. "untested-default" | "tested-survived" | "tested-undermined" | …)
  weakestLink: { argumentId: string, reason: string } | null,
  warnings: Array<{ code, detail }>,
  provenancePending: boolean,
  retryAfterMs: number,
}
```

### 5.2 New MCP tool — `propose_argument_chain`

Thin wrapper over the endpoint, same MCP-bearer auth as `propose_structured_argument`.

**Description (draft):**
> WRITE TOOL — author a **serial argument chain**: a sequence of structured
> arguments where each link's conclusion becomes the next link's premise. **Use
> this when the user lays out multi-step reasoning** ("A, therefore B; and B,
> therefore C") rather than a single argument. Each link is committed as a full
> structured argument (per-premise `Claim` rows, an assigned scheme with its
> critical questions); consecutive links are wired by **reusing the prior link's
> conclusion claim** — pass `reuseClaimId` from the previous link's
> `conclusionClaimId` in the response, or repeat the exact conclusion text and the
> server threads it by content hash. The server runs the same scheme-health gate
> as `propose_structured_argument` **on every link** and refuses unhealthy scheme
> keys. Returns the chain id, per-link standing, and the worst-link
> `chainStanding` — a chain is only as citable as its weakest link. Call
> `list_schemes(excludeUnhealthy:true)` first if unsure of scheme keys. → next:
> `get_chains` to verify the chain's standing before citing its terminal conclusion.

---

## 6. Reusing the Phase B health gate at link granularity

Every minted link runs the **exact Phase B pipeline** from
[SCHEMES_MCP_ALIGNMENT_ROADMAP.md](SCHEMES_MCP_ALIGNMENT_ROADMAP.md) B.1 — there is
no chain-specific scheme logic. Per link:

1. **Scheme-health selection** — reject `isDialogueMeta` / `isTestPlaceholder`
   (`SCHEME_NOT_ARGUMENT_PATTERN`); auto-redirect `duplicateOf` → `canonicalKey`
   with a `scheme_canonicalized` warning (never silent).
2. **Carneades `premiseType`** accepted per premise (shipped column).
3. **`epistemicMode`** accepted (fingerprint-domain participant; Q-020).
4. **Verifier verdict** against same-fingerprint candidates, written for the
   Phase 4d audit's drift tracking.

**Chain-specific additions on top of Phase B:**

- **Intra-chain redundancy radar (MCP-Q-E).** When two links in the same chain
  resolve to behaviourally-`equal` schemes, emit `chain_link_scheme_repeat`
  (advisory, not an error). This is a *signal* — a serial chain whose links all
  use the same scheme may be a single argument inflated into a chain, or genuine
  iterated reasoning. v1 surfaces it; it does not block. (MCP-Q-E in the design
  note tracks the eventual taxonomy of repeat-vs-circular.)
- **Worst-link `chainStanding`.** Computed by the **already-shipped** chain-exposure
  evaluator ([lib/deliberation/chainExposure.ts](../../lib/deliberation/chainExposure.ts) —
  `chainStanding` is the worst `StandingState` across the chain's arguments;
  `weakestLink` keys on `argumentId`) immediately after creation, echoed in the
  response. The author learns at write-time that their chain is, e.g.,
  `tested-undermined` because link 2's premise is contested.
- **Inconclusive routing (MCP-Q-B at chain scope).** Per-link `inconclusive`
  verdicts route to warn-and-ship-with-flag, identical to single-argument writes,
  persisting each verdict. A chain multiplies the verdict count, so v1 aggregates:
  if **any** link is `inconclusive`/`subset`/`equal`, the chain response carries a
  top-level `chainRedundancyFlag` so downstream the Phase 4d audit can find it.

---

## 7. Transaction boundary

Following the from-prong atomic pattern. All-or-nothing in one `prisma.$transaction`:

**mint-and-link mode:**

1. Pre-flight (outside txn): resolve + health-gate every link's `schemeKey`
   (Phase B selection). Any `SCHEME_NOT_ARGUMENT_PATTERN` → 400, nothing written.
2. Pre-flight: validate threading topology — every `reuseClaimId` must reference a
   **prior** link's conclusion *in this request* (forward references and cycles →
   `CHAIN_LINK_INVALID_THREAD`, 400).
3. Begin txn. For each link in order:
   a. Mint conclusion claim (`upsert` by MOID); record `conclusionClaimId` and
      `conclusionMoid` in an in-txn thread map keyed by link index.
   b. Resolve premises: `reuseClaimId` premises look up the threaded claim from the
      map (assert it's a prior conclusion); `text` premises mint by MOID. Apply the
      §4.1 fork guard — if a `text` premise's MOID collides with a *non-threaded*
      prior conclusion unexpectedly, surface `chain_link_autothreaded` warning
      (benign: the content hash did the threading the author could have declared).
   c. Create `Argument`, `ArgumentPremise[]`, `ArgumentSchemeInstance` (resolved /
      canonicalised scheme), `markArgumentAsComposedInTx`, `ensureArgumentSupportInTx`
      — identical to `quick-structured` step order.
4. Create `ArgumentChain` (`chainType=SERIAL`).
5. Create `ArgumentChainNode[]` (one per link, `nodeOrder=index`, dedup on
   `[chainId, argumentId]`).
6. Create `ArgumentChainEdge[]` — serial `SUPPORTS` from node *k* → node *k+1*
   (`createMany`, `skipDuplicates`).
7. Set `rootNodeId` = first link's node.
8. Commit.
9. Outside txn: worst-link `chainStanding` eval; fire-and-forget provenance
   enrichment for all minted evidence links.

**compose mode:** skip 3; step 1 validates each `argumentId` exists, belongs to the
target deliberation, and re-checks its existing scheme's health (a previously-minted
argument may reference a since-deprecated scheme → `compose_link_scheme_unhealthy`
warning, non-fatal — we don't rewrite history, we flag it). Steps 4–8 as above.

---

## 8. Validation & error codes

Extends the Phase B / E.1 shared error enum. Chain-specific additions:

| Code | Cause | Severity |
|---|---|---|
| `CHAIN_TOO_SHORT` | < 2 links / argumentIds | error |
| `CHAIN_TOO_LONG` | > 12 links (mint) / > 20 (compose) | error |
| `CHAIN_LINK_INVALID_THREAD` | `reuseClaimId` is a forward ref, cycle, or not a prior conclusion | error |
| `CHAIN_LINK_BROKEN` | declared reuse text forked into a distinct claim (MOID mismatch) | error |
| `CHAIN_LINK_NOT_FOUND` | compose `argumentId` missing / wrong deliberation | error |
| `chain_link_autothreaded` | a `text` premise content-hash-collapsed onto a prior conclusion | warning |
| `chain_link_scheme_repeat` | two links use behaviourally-equal schemes (MCP-Q-E) | warning |
| `compose_link_scheme_unhealthy` | composed argument references a now-unhealthy scheme | warning |
| `chainRedundancyFlag` | ≥1 link verifier-verdict in {equal,subset,inconclusive} | top-level flag |

Reuse all Phase B per-link codes (`SCHEME_NOT_ARGUMENT_PATTERN`,
`scheme_canonicalized`, `epistemic_mode_changed_fingerprint`, etc.) unchanged.

Field caps: `name` ≤255; links 2..12; compose `argumentIds` 2..20; per-link
premises 1..10; text caps inherited from `quick-structured` (conclusion 2000,
premise 1000, reasoning 5000).

---

## 9. Test plan

- **Threading (MOID default):** two links where link 1's conclusion text equals
  link 2's reused premise text → assert a **single** shared `Claim` row; assert
  `threading[0].mode === "moid"` and `sharedClaimId` equals link 1's
  `conclusionClaimId`.
- **Threading (explicit id):** link 2 uses `reuseClaimId` from link 1's response →
  same shared-claim assertion; `mode === "explicit"`; link 2 mints no new claim for
  that premise.
- **Fork guard:** link 2 declares a reuse via *paraphrased* text that mis-hashes →
  `CHAIN_LINK_BROKEN`, **zero** rows written (txn rollback).
- **Invalid thread topology:** `reuseClaimId` forward-references link 3 from link 1
  → `CHAIN_LINK_INVALID_THREAD`, nothing written.
- **Health gate per link:** middle link uses a dialogue-meta `schemeKey` →
  `SCHEME_NOT_ARGUMENT_PATTERN`, whole chain rolled back (atomicity).
- **Canonicalisation:** a link's `schemeKey` is a seeded duplicate → auto-redirect,
  `scheme_canonicalized` warning, chain still created.
- **Worst-link standing:** build a chain whose link-2 premise is independently
  undermined → `chainStanding: "tested-undermined"`, `weakestLink.argumentId` = link 2's argument.
- **Intra-chain repeat:** all links same scheme → `chain_link_scheme_repeat` warning,
  chain still created.
- **Compose mode:** chain three existing arguments by id → nodes + SUPPORTS edges,
  no new claims/arguments; wrong-deliberation id → `CHAIN_LINK_NOT_FOUND`.
- **MCP smoke (Claude Desktop):** "Build a 3-step argument chain: caffeine disrupts
  adolescent sleep; disrupted sleep impairs neurodevelopment; therefore adolescents
  should avoid caffeine." → assert the agent threads link 1→2→3 conclusions as
  premises and the final `chainStanding` renders.

---

## 10. Phasing

| Step | Deliverable | Effort | Blocker |
|---|---|---|---|
| 0 | **Roadmap Phase B must ship first** — the link health gate is reused verbatim | — | SCHEMES_MCP_ALIGNMENT_ROADMAP B.1 |
| 1 | `POST /api/argument-chains/quick-chain` — compose mode (existing args → chain rows) | ~3–4 h | from-prong pattern (✅) |
| 2 | mint-and-link mode — per-link `quick-structured` engine + MOID threading + fork guard | ~5–7 h | Step 1; quick-structured (✅) |
| 3 | Explicit `reuseClaimId` threading + topology validation | ~2–3 h | Step 2 |
| 4 | Worst-link `chainStanding` echo (reuse chainExposure evaluator) | ~1.5 h | Step 1 |
| 5 | `propose_argument_chain` MCP tool + orientation recipe; bump `ORIENTATION_VERSION` | ~1 h | Steps 1–4 |
| 6 | Jest integration (threading, fork guard, health gate, atomicity, compose) | ~3 h | Steps 1–4 |
| 7 | Claude Desktop smoke + trigger-phrase tuning | iterative | Step 5 |

**Critical path:** Roadmap Phase B → Step 2 (mint-and-link + threading is the core).
Total v1 estimate: **~16–21 h**, dominated by the mint-and-link transaction and the
fork-guard correctness.

---

## 11. Open questions

- **CHAIN-Q-A (thread by id vs text — default).** Should the MCP tool *description*
  push agents toward explicit `reuseClaimId` (robust) or toward repeating text
  (simpler for the model to emit in one shot)? The fork guard makes text-threading
  safe-but-failable; explicit id is safe-and-robust but needs the agent to thread
  the response. Lean: describe **both**, recommend explicit-id for chains > 3 links.
- **CHAIN-Q-B (compose health flags).** When a composed argument references a
  since-deprecated scheme, is a warning enough, or should compose refuse? Lean:
  warn (don't rewrite history); a deprecated-scheme argument that already exists is
  the catalogue's problem, not the chain author's.
- **CHAIN-Q-C (intra-chain equal schemes — promote MCP-Q-E).** Does
  `chain_link_scheme_repeat` need a circularity sub-check (does link *k* reuse link
  *k+1*'s conclusion, forming a logical loop)? v1 detects forward-thread cycles
  structurally (§7 step 2); semantic circularity via the verifier is a follow-up.
- **CHAIN-Q-D (non-serial chains).** `CONVERGENT`/`TREE` chains need multiple
  premises-of-one-conclusion threading and a DAG validator — deferred, but the
  `links[].premises[]` array already admits multiple `reuseClaimId`s, so the
  request shape is forward-compatible.

---

## 12. Where this fits

```
SCHEMES_MCP_TOOL_ALIGNMENT.md      (design note; §3.5 chains-as-consumer)
  └─ SCHEMES_MCP_ALIGNMENT_ROADMAP.md   (impl roadmap; Phase B gate, Phase F→here)
       └─ CHAIN_CREATION_OVER_MCP_SPEC.md  ← (this file; PART 3 dev spec)
```

This spec is the third of the three-part sequence: the design note established the
*why* (chains as ontology consumers, inheriting the no-silent-merge posture), the
roadmap shipped the *substrate gate* (per-link scheme health), and this spec wires
the *chain write surface* on top — resolving the `mint_claim` deferral via
intra-chain claim threading rather than a standalone orphan-claim primitive.
