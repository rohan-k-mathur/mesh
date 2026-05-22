# Session 1 Dev-Spec: Ludics-Native MCP Tool Surface

> **Post-review status (CORRECTED post-2e/2f, 2026-05-21).** This dev-spec was authored 2026-05-19 against the working assumption (C1) that `Inc(B)` is a join-semilattice with a unique bottom `|B|`. The OQ-JSL formal proof (Phase 2e, see [LUDICS_OQ_JSL_PROOF.md](./LUDICS_OQ_JSL_PROOF.md)) refuted that: `Inc(B)` is an **antichain** whose elements partition into disjoint cones, `∨_⊥⊥` is well-defined only within a cone (and there equals literal chronicle-set union per Phase 2f Reading A), and there is no global `|B|`. Sections rewritten in this pass carry an explicit `[CORRECTED post-2e/2f]` marker; sections added by this pass carry `[ADDED post-review]`. See [LUDICS_SESSIONS_1_2_SPEC_REVIEW.md](./LUDICS_SESSIONS_1_2_SPEC_REVIEW.md) for the full audit trail and [LUDICS_SESSION_2_DEV_SPEC.md](./LUDICS_SESSION_2_DEV_SPEC.md) for the companion Phase 2 corrections.
>
> **Terminology mapping callout** *[ADDED post-review]*. Throughout the substrate documents, two different `I1–I4` label sets appear:
> - **`bind_participant_to_design` operational invariants** (this doc §1 Cluster D): existing-locus / existing-structure / canon-pipeline-gated / scheme-typed — *in this spec these are now renamed* `S1–S4` *to avoid collision and reserve the `I` prefix for the substrate-wide invariants.*
> - **Substrate-wide invariants** (`LUDICS_CONSOLIDATION_AND_DEV_READINESS.md` C12): the four T4-friendly invariants on the witnessing layer. These keep the `I1–I4` labels.
>
> Additionally, the Prisma `LudicMove.moveType` enum value `"inference"` is renamed to `"daimon"` to match Girard's terminology and the substrate documents; see Cluster D below.

**Session:** 1 (Phase 1 dev-planning)
**Date:** 2026-05-19  
**Completed:** 2026-05-20 — all 7 phases delivered; 169/169 invariant tests passing
**Track:** Dev-spec / implementation-ready
**Scope:** Five deliverables:
(§1) ~14-tool Ludics-native MCP surface as JSON-RPC name/description/input-schema triples;
(§2) structural manifest — precisely which graph properties are mechanically computable;
(§3) fidelity-scorecard specification (OQ-fidelity answer);
(§4) non-attribution DB invariant as schema constraint + API contract;
(§5) briefing-fingerprint API draft with five material-change rules (OQ-5rules answer).
**Companions:**
[LUDICS_CONSOLIDATION_AND_DEV_READINESS.md](./LUDICS_CONSOLIDATION_AND_DEV_READINESS.md) ·
[LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md](./LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md) ·
[packages/isonomia-mcp/src/server.ts](../../../packages/isonomia-mcp/src/server.ts) ·
[lib/api/isonomiaOpenapi.ts](../../../lib/api/isonomiaOpenapi.ts)

---

## 0. Frame

**What the substrate licenses.** Sessions 0a–0h established that all Tier-1
constructs ($\iota$, $E(D_P)$, $\mathsf{Art}(B)$, witnessing record, T4
separation, fossil-record discipline) are ready to drive Phase 1 dev. The
Session 1 task is to translate that conceptual work into implementable
specifications that the engineering team can execute without further
conceptual-track input.

**What the existing MCP surface covers.** The current `isonomia-mcp` server
exposes 29 tools:
`get_orientation`, `search_arguments`, `get_argument`, `get_claim`,
`get_claim_stances`, `find_counterarguments`, `cite_argument`,
`resolve_citation`, `resolve_citations_bulk`, `list_schemes`,
`propose_argument`, `propose_structured_argument`,
`get_deliberation_fingerprint`, `get_contested_frontier`,
`get_missing_moves`, `get_chains`, `get_synthetic_readout`,
`get_cross_context`, `summarize_debate`, `get_deliberation_evidence_context`,
and the nine `ecc_*` / `propose_warrant` tools (Ambler-style algebra).

**What is missing.** None of the 29 tools expose a Ludics-native object
(C16, Tier-1 confirmed). Specifically absent: the stratified exposure map
$E(D_P)$; the articulation lattice $\mathsf{Art}(B)$ with navigation
operations; the witnessing record $\mathsf{Witness}$ keyed by Ludics move;
the $\iota$ write seam with I1–I4 invariant enforcement; the fossil-record
discipline with locus back-pointers.

**Delta this session defines.** The ~14 tools below are the first Ludics-
native MCP reads. They do not replace any existing tool; the `ecc_*` stack
and `get_contested_frontier` / `get_missing_moves` remain as projections
(documented explicitly in each new tool's description so an agent knows
the relationship).

---

## §1. The ~14-Tool Surface

Organized into six clusters. Each tool is specified as:
- **Name** (stable, snake_case)
- **One-line purpose** (consumer-facing; used in `description` field of the
  MCP tool triple)
- **Input schema** (JSON Schema; all fields required unless marked `?`)
- **Output shape** (key fields; full Zod schema is the implementation artifact)
- **Backing claims** (from 0h stability tier-map)
- **Relationship to existing tools** (projection note)
- **Implementation hook** (which DB/engine function produces it)

---

### Cluster A — Exposure Map (1 tool)

#### `get_exposure_map`

**Purpose.** Return the stratified, topology-annotated opposition space
$E(D_P) = \sigma(D_P)^\perp$ for a deliberation (or for the sub-structure
rooted at a specific claim), partitioned into walked / witnessable / latent
strata with hub-set, load-bearing ranking, and cascade propagation.

**Input schema:**
```jsonc
{
  "type": "object",
  "required": ["deliberationId"],
  "properties": {
    "deliberationId": { "type": "string", "description": "Deliberation room id." },
    "claimId": {
      "type": "string",
      "description": "Optional. Restrict the exposure map to the sub-design rooted at this claim. Omit for the full deliberation map."
    },
    "stratifyDepth": {
      "type": "integer",
      "minimum": 0,
      "maximum": 5,
      "default": 1,
      "description": "Maximum move-depth from any walked point included in the witnessable stratum $E_o$. Default 1."
    },
    "includeCascade": {
      "type": "boolean",
      "default": false,
      "description": "If true, each node in $E_o \\cup E_\\ell$ carries a `cascade` field listing the latent moves that would be lifted by walking it. Adds one DB join per node; omit for large deliberations."
    },
    "includeTopology": {
      "type": "boolean",
      "default": true,
      "description": "Include hub-set multiplicity, load-bearing ranking, and depth-from-walked annotations on each node."
    }
  }
}
```

**Output shape:**
```jsonc
{
  "strata": {
    "walked": [ /* ExposureNode[] — moves already instantiated by some participant */ ],
    "witnessable": [ /* ExposureNode[] — reachable in ≤ stratifyDepth from walked */ ],
    "latent": [ /* ExposureNode[] — rest of coherent-opposition space */ ]
  },
  "topology": {
    "hubSet": [ /* string[] — loci where ≥ 2 paths converge */ ],
    "loadBearingRanking": [ /* string[] — argumentIds ordered by cascade-size */ ],
    "totalNodes": 143
  }
  /* ExposureNode: { id, locus, moveType, depth, cascade?: string[] } */
}
```

**Backing claims:** C4 (stratification; Tier 1 original-to-track), C8
(Prakken-2024 generalization; Tier 1 confirmed).

**Relationship to existing tools.** `find_counterarguments` projects onto
$E_w$ (a flat list). `get_contested_frontier` projects onto $E_o$ (a flat
list). `get_missing_moves` projects onto a subset of $E_o \cup E_\ell$ near
walked moves. `ecc_culprits` gives the cascade structure for one move.
`get_exposure_map` is the superseding read that unifies all five as
projections and adds the topology layer none of them exposes.

**Implementation hook.** `computeSyntheticReadout` already materializes
`frontier.unansweredCqs` (= $E_o$ projection) and `frontier.loadBearingnessRanking`
(= topology layer). `get_exposure_map` requires: (1) lifting the frontier
computation to return `ExposureNode` objects keyed by `ludicMoveId` (not
just CQ strings); (2) a stratification pass using the `Witness` relation
to assign walked/witnessable/latent labels; (3) the cascade computation
already implemented in `culpritSets()`. DB dependencies: `LudicMove`,
`WitnessRecord` (new table — see §4).

---

### Cluster B — Articulation Lattice (6 tools)

#### `get_articulation_lattice`

**Purpose.** Return the articulation lattice
$\mathsf{Art}(B) = (\mathsf{Inc}(B), \leq_\subseteq, \vee_{\perp\perp})$
for the behaviour $B$ containing a given argument or claim, as a navigable
poset of incarnations. The default `"incarnations"` mode returns canonical
representatives only; `"raw"` adds equivalence-class annotations for
algebraic reasoning.

**Input schema:**
```jsonc
{
  "type": "object",
  "oneOf": [
    { "required": ["argumentId"] },
    { "required": ["claimId"] }
  ],
  "properties": {
    "argumentId": { "type": "string" },
    "claimId": { "type": "string" },
    "representatives": {
      "type": "string",
      "enum": ["incarnations", "raw"],
      "default": "incarnations",
      "description": "incarnations: return Inc(B) as a poset of canonical representatives. raw: return the full behaviour with equivalence-class annotations."
    }
  }
}
```

**Output shape:** *[CORRECTED post-2e/2f]*
```jsonc
{
  "behaviourId": "beh_...",
  "incarnations": [
    { "designId": "des_...", "loci": ["⊢A.1", "⊢A.1.1"], "moveCount": 4, "coneId": "cone_0" }
  ],
  // No global "bottom". Inc(B) is an antichain (Phase 2e). Each cone has
  // its own minimal incarnation; `cones` enumerates them when surfaced.
  "cones": [
    { "coneId": "cone_0", "bottomIncarnationDesignId": "des_..." }
  ],
  "edges": [                 /* inclusion order ≤ as adjacency list — always intra-cone (Phase 2f) */
    { "from": "des_...", "to": "des_...", "coneId": "cone_0" }
  ],
  "equivalenceClasses": null /* populated when representatives: "raw" */
}
```

*Removed:* the top-level `"bottom": "des_..."` field — reified the obsolete unique-bottom-of-Inc(B) assumption (C1).

**Backing claims:** C1 *(Corrected post-2e/2f — `Inc(B)` is an antichain, not a JSL; `∨_⊥⊥` is partial and well-defined only within a cone; see [LUDICS_OQ_JSL_PROOF.md](./LUDICS_OQ_JSL_PROOF.md))*, C2 (`Inc(B)`; Tier 1 confirmed).

**Relationship to existing tools.** `ecc_enthymemes` finds one direction:
"what minimal addition would complete the current articulation" — i.e.,
find $D' > D$ with more moves. `ecc_arrow` returns the underlying
derivation data for a single arrow. `get_articulation_lattice` exposes
the full lattice and is the structural read those two tools are projections of.

**Implementation hook.** Requires a `Behaviour` + `Design` + `DesignInclusion`
schema (new tables — §4). The `computeFitnessBreakdown` and `culpritSets`
paths already traverse structurally equivalent data; the lattice materializer
is a lifting of those traversals to return `designId`-keyed nodes.

---

#### `find_minimal_incarnations` *[CORRECTED post-2e/2f]*

**Purpose.** Return the minimal element(s) of $\mathsf{Inc}(B)$. Post-2e: `Inc(B)` is an **antichain** — every incarnation is minimal in its cone, and there is no global `|B|`. The tool returns the per-cone minima, which together form the antichain. Answers: "what are the irreducible positions in this behaviour, and how do they relate by cone?"

**Input schema:**
```jsonc
{
  "type": "object",
  "required": ["behaviourId"],
  "properties": {
    "behaviourId": { "type": "string" }
  }
}
```

**Output shape:** `{ "incarnations": DesignSummary[], "coneCount": number }`

Each element is the minimum incarnation of one cone of $(\mathsf{Inc}(B), \leq_\subseteq)$. `incarnations.length === coneCount`.

**Backing claims:** C1 *(Corrected post-2e/2f)*, C2 (Tier 1).

**Implementation hook.** Cones-decomposition pass on the `DesignInclusion` DAG; each cone's minimum is the in-degree-0 node within that cone.

---

#### `find_equivalent_articulations`

**Purpose.** Given a design $D$ (an argument's structural representation),
return the $\sim_{\perp\perp}$ equivalence class of $D$ in $B$ — other
designs that articulate the same position with different premise/move
configurations. Answers: "what are the other ways to say the same thing?"

**Input schema:**
```jsonc
{
  "type": "object",
  "required": ["designId"],
  "properties": {
    "designId": { "type": "string" }
  }
}
```

**Output shape:** `{ "equivalents": DesignSummary[] }`

**Backing claims:** C1, C2 (Tier 1). Note: equivalence is the $\perp\perp$-class membership check, which is a closure computation already implemented as part of `ecc_enthymemes`.

**Implementation hook.** Query `Design` nodes with the same `biorthoClass`
(a derived field stored on write via the closure computation).

---

#### `find_substitute_premises`

**Purpose.** Given a claim and a list of premise claim-ids to drop, find
incarnations $D' \in \mathsf{Inc}(B)$ that reach the same conclusion without
those premises. Answers: "can I defend the same point without this particular
assumption?"

**Input schema:**
```jsonc
{
  "type": "object",
  "required": ["claimId", "drop"],
  "properties": {
    "claimId": { "type": "string", "description": "The conclusion claim whose defence is being varied." },
    "drop": {
      "type": "array",
      "items": { "type": "string" },
      "minItems": 1,
      "description": "Premise claim ids to exclude from candidate incarnations."
    }
  }
}
```

**Output shape:** `{ "substitutes": DesignSummary[], "unreachable": boolean }`

`unreachable: true` means no incarnation avoids all dropped premises —
the argument is genuinely load-bearing on all of them.

**Backing claims:** C1, C2 (Tier 1). Critical for Phase 2A (assumption surfacing) AI roadmap target.

**Implementation hook.** Filter `get_articulation_lattice` incarnations for
designs whose `premiseClaimIds` set is disjoint from `drop`. Requires `premiseClaimIds` to be stored on `Design` rows.

---

#### `compress_articulation`

**Purpose.** Given two or more argument ids (designs), return their meet
$D_1 \wedge D_2$ in $\mathsf{Art}(B)$ if it exists — the minimum-commitment
design that both articulations extend. Answers: "what is the shared core
of these two positions?"

**Input schema:**
```jsonc
{
  "type": "object",
  "required": ["argumentIds"],
  "properties": {
    "argumentIds": {
      "type": "array",
      "items": { "type": "string" },
      "minItems": 2,
      "description": "Argument ids whose designs are to be met."
    }
  }
}
```

**Output shape:** *[CORRECTED post-2e/2f]*

```jsonc
// Discriminated by `kind`.
{ "kind": "same-cone-meet", "meet": DesignSummary, "coneId": "cone_0" }
// or
{ "kind": "cross-cone-no-meet", "reason": "cross-cone-incompatibility",
  "coneIdsByInput": ["cone_0", "cone_1"] }
// or
{ "kind": "same-cone-incomparable", "coneId": "cone_0" }
```

`cross-cone-no-meet` is the post-2e replacement for the old `incomparable: true` flag in the cross-cone case: when the inputs are in disjoint cones, no common lower bound exists (Phase 2e Cross-Cone Incompatibility). `same-cone-incomparable` is the within-cone analogue: the cone has a meet for *some* pairs but not these two.

*Removed:* the singular `{ meet, incomparable }` shape and the "bottom $|B|$ is always a lower bound when $B$ is principal" claim — there is no global bottom.

**Backing claims:** C1 *(Corrected post-2e/2f — within a cone, meets can be defined where they exist; across cones, no meet exists. See [LUDICS_OQ_JSL_PROOF.md](./LUDICS_OQ_JSL_PROOF.md).)*

**Implementation hook.** Traverse the `DesignInclusion` DAG upward from both arguments to find greatest lower bound.

---

#### `compute_articulation_join` *[CORRECTED post-2e/2f]*

**Purpose.** Compute $D_1 \vee_{\perp\perp} D_2$ when the inputs are in the **same cone** of $(\mathsf{Inc}(B), \leq_\subseteq)$. Per Phase 2f Reading A, within a cone the join is the **literal chronicle-set union** $D_1 \cup D_2$ — no biorthogonal closure rounds are required and `closureSteps === 0` in any well-formed case. When the inputs are in disjoint cones, no join exists in $B$ (Phase 2e Cross-Cone Incompatibility) and the tool returns `cross-cone-rejected`.

**Input schema:**
```jsonc
{
  "type": "object",
  "required": ["designIds"],
  "properties": {
    "designIds": {
      "type": "array",
      "items": { "type": "string" },
      "minItems": 2,
      "description": "Design ids to join. Must all belong to the same behaviour B; cone membership is checked."
    }
  }
}
```

**Output shape:** *[CORRECTED post-2e/2f]*

```jsonc
// Discriminated by `kind`.
{ "kind": "same-cone-join",
  "join": DesignSummary,
  "newLoci": string[],          // (L_1 ∪ L_2) \ L_i; possibly empty
  "closureSteps": 0,            // always 0 (Reading A); nonzero ⇒ substrate violation
  "coneId": "cone_0"
}
// or
{ "kind": "same-cone-delocation-required",
  "candidateLocus": "⊢A.3-neg",
  "newLoci": ["⊢A.3-neg"]       // negative-branch extensions per Daimon Lock Lemma
}
// or
{ "kind": "cross-cone-rejected",
  "reason": "cross-cone-incompatibility",
  "coneIdsByInput": ["cone_0", "cone_1"]
}
```

*Removed:* the unconditional join return and the framing of `closureSteps > 0` as "non-trivial protocol forcing" — within a cone there is no closure to perform; across cones the join does not exist.

**Backing claims:** C1 *(Corrected post-2e/2f — `∨_⊥⊥` is partial (same-cone-only) and within a cone equals literal union; cross-cone returns `cross-cone-rejected`. See [LUDICS_OQ_JSL_PROOF.md](./LUDICS_OQ_JSL_PROOF.md).)*, C2 (Tier 1 confirmed). The synthesis-move pipeline that consumes this tool is specified in [LUDICS_SESSION_2_DEV_SPEC.md](./LUDICS_SESSION_2_DEV_SPEC.md) §3 (`proposeSynthesis`).

**Implementation hook.** Resolve each input design's cone via a cones-decomposition pass on the `DesignInclusion` DAG; if any pair are in disjoint cones, return `cross-cone-rejected` without computing a closure. Otherwise compute the literal chronicle-set union; the result is a new `Design` row with `derivedBy: "join"`. Any `closureSteps > 0` observation is logged as a substrate violation per [LUDICS_SESSION_2_DEV_SPEC.md](./LUDICS_SESSION_2_DEV_SPEC.md) §6.3.

---

### Cluster C — Witnessing (3 tools)

#### `get_witnesses`

**Purpose.** Return the witnessing record for a specific Ludics move: which
canonical dialogue acts (by which participants, at which times) have
instantiated this move. The default read is **anonymous** — participant
identities are returned only when `includeIdentity: true` is explicitly
set. This is the operational Reading C: attribution is opt-in, not default.

**Input schema:**
```jsonc
{
  "type": "object",
  "required": ["ludicMoveId"],
  "properties": {
    "ludicMoveId": { "type": "string", "description": "Id of the Ludics move (node in $\\mathcal{D}_P$)." },
    "includeIdentity": {
      "type": "boolean",
      "default": false,
      "description": "Set true to include participant ids in the response. Default false (anonymous). Respects T4: the dialectical layer's structure is unchanged by this flag."
    }
  }
}
```

**Output shape:**
```jsonc
{
  "ludicMoveId": "lm_...",
  "witnessCount": 3,
  "witnesses": [
    {
      "witnessId": "wit_...",
      "dialogueMoveId": "dm_...",
      "timestamp": "2026-03-14T09:00:00Z",
      "participantId": "user_..."  /* only present when includeIdentity: true */
    }
  ],
  "stratum": "walked"  /* walked | witnessable | latent */
}
```

**Backing claims:** C11, C12 (T4; Tier 1 confirmed), N-C21 (Reading C; Tier 1 original-to-track/Triads-compatible).

**Relationship to existing tools.** `get_claim_stances` gives the
participant-keyed direction (participant → claims). `get_witnesses` gives
the move-keyed direction (Ludics move → participants) and is the inverse.
The anonymous-default discipline is new — no existing tool defaults to
anonymous attribution.

**Implementation hook.** Query `WitnessRecord` by `ludicMoveId`. The
`participantId` field is stored but omitted from the response object
unless `includeIdentity: true`. This is a DB-layer projection, not a
data-deletion; the record is always fully stored.

---

#### `get_unwitnessed_exposure`

**Purpose.** Return the Ludics moves in the exposure map that currently
have no witness — the "unaddressed" structural objections — filtered by
stratum. The primary tool for an AI agent reasoning about what the
deliberation has *not yet addressed* at the dialectical level, without
coupling to *who* has addressed anything.

**Input schema:**
```jsonc
{
  "type": "object",
  "required": ["deliberationId"],
  "properties": {
    "deliberationId": { "type": "string" },
    "stratum": {
      "type": "string",
      "enum": ["witnessable", "latent", "all"],
      "default": "witnessable",
      "description": "Which stratum of the exposure map to return unwitnessed moves from. 'all' = E_o ∪ E_ℓ."
    },
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 100,
      "default": 20
    }
  }
}
```

**Output shape:**
```jsonc
{
  "unwitnessed": [
    { "ludicMoveId": "lm_...", "locus": "⊢A.2.1", "moveType": "attack", "depth": 1 }
  ],
  "totalUnwitnessed": 47,
  "stratum": "witnessable"
}
```

**Backing claims:** C4, C8 (exposure stratification; Tier 1), C12 (witnessing record; Tier 1 confirmed).

**Implementation hook.** `LEFT JOIN LudicMove ON WitnessRecord.ludicMoveId` where `WitnessRecord.id IS NULL` — the anti-join identifies unwitnessed moves. Filter by stratum label stored on `LudicMove`.

---

#### `get_instantiation`

**Purpose.** Given a canonical dialogue move id, return the Ludics node
it instantiates via $\iota$: the dialectical-layer object the move commits
the participant to. Inverse of `get_witnesses`. Also answers the
partiality predicate: if the move has no instantiation yet (it does not
sit inside the current $D_P$), returns `{ "instantiated": false }` plus
the delocation flag if the move would trigger locus-addition.

**Input schema:**
```jsonc
{
  "type": "object",
  "required": ["dialogueMoveId"],
  "properties": {
    "dialogueMoveId": { "type": "string", "description": "Id of the canonical witnessing act (a CommitmentLudicMapping row or equivalent)." }
  }
}
```

**Output shape:**
```jsonc
{
  "dialogueMoveId": "dm_...",
  "instantiated": true,
  "ludicMoveId": "lm_...",
  "locus": "⊢A.1",
  "moveType": "positive",  /* positive | negative */
  "wouldTriggerDelocation": false
}
/* or, when not yet instantiated: */
{
  "dialogueMoveId": "dm_...",
  "instantiated": false,
  "wouldTriggerDelocation": true,  /* move would add a new locus */
  "candidateLocus": "⊢A.3"
}
```

**Backing claims:** C6 (delocation; Tier 1 confirmed), C12 (I1–I4; Tier 1 confirmed), C18 (four call sites; Tier 1 confirmed).

**Relationship to existing tools.** No existing tool answers "which Ludics node does this dialogue act commit to?" This is the missing inverse; it is the tool that closes the T5 loop (agent can check what its own proposed move would commit it to before sending it).

**Implementation hook.** Query `CommitmentLudicMapping` by `dialogueMoveId`. If no row, run the `iota()` partiality check using the current `D_P` to return `wouldTriggerDelocation`.

---

### Cluster D — Write Seam (1 tool)

#### `bind_participant_to_design`

**Purpose.** Execute the $\iota$ operation: bind a canonical dialogue act
(witnessing act $W$) to a Ludics move $m$, creating a `WitnessRecord`
row and enforcing all four invariants. This is the single write seam that
all four existing call sites (`CommitmentLudicMapping` creation,
`propose_warrant`, `applyToCS`, "Promote to Ludics" trigger) should route
through once the witnessing layer is wired. Token-gated.

**Input schema:**
```jsonc
{
  "type": "object",
  "required": ["dialogueMoveId", "ludicMoveId", "participantId"],
  "properties": {
    "dialogueMoveId": { "type": "string" },
    "ludicMoveId": {
      "type": "string",
      "description": "The Ludics move being instantiated. Must already exist in $\\mathcal{D}_P$ (I2: existing-structure-only); if absent, the call returns a 409 DELOCATION_REQUIRED error rather than silently creating a new locus."
    },
    "participantId": { "type": "string" },
    "canonicalText": {
      "type": "string",
      "description": "The canonicalized text that passed the canonicalization pipeline gate (I3: canon-pipeline-gated). Required."
    },
    "schemeKey": {
      "type": "string",
      "description": "Argument scheme key (S4: scheme-typed). Required unless moveType is 'dialogue-only'."
    },
    "argumentId": {
      "type": "string",
      "description": "Optional. When supplied, populated onto the underlying LudicMove.argumentId column to support argument-deletion-driven fossilization. See LUDICS_SESSION_2_DEV_SPEC.md §4.3–4.4. [ADDED post-review]"
    }
  }
}
```

**Output shape:** *[CORRECTED post-review — invariant labels renamed `I1–I4` → `S1–S4` to avoid collision with substrate-wide invariants; see top-of-doc terminology callout]*
```jsonc
{
  "witnessId": "wit_...",
  "ludicMoveId": "lm_...",
  "dialogueMoveId": "dm_...",
  "invariantChecks": {
    "S1_existingLocus": true,
    "S2_existingStructure": true,
    "S3_canonPipelineGated": true,
    "S4_schemeTyped": true
  }
}
```

**Error codes:**
- `409 DELOCATION_REQUIRED` — `ludicMoveId` does not exist in current $D_P$; caller must first request delocation.
- `422 CANON_GATE_FAILED` — `canonicalText` did not pass the canonicalization pipeline (S3 violation).
- `422 SCHEME_REQUIRED` — `schemeKey` absent for a non-dialogue-only move (S4 violation).

**Backing claims:** C12, C11 *(I1–I4 substrate-wide invariants; Tier 1 confirmed)*, C13 (canon-pipeline gate; Tier 1 confirmed), C6 (delocation; Tier 1 confirmed). The per-call operational checks `S1–S4` in `invariantChecks` are the *implementations* of those substrate invariants at this seam; the rename disambiguates them from the substrate-wide labels. *[CORRECTED post-review]*

**Implementation hook.** New `WitnessRecord` model (§4 DB schema). The four invariant checks are: (S1) `locus` must be in `Locus` table; (S2) `ludicMoveId` must be in `LudicMove` with `deliberationId` match; (S3) a call to the canonicalization pipeline validator (existing `canonicalizeClaimText` function); (S4) `schemeKey` must be in the `ArgumentScheme` catalog. All four checks run in a DB transaction; any failure rolls back with the appropriate error code.

---

### Cluster E — Fossil Record (1 tool)

#### `get_fossil_record`

**Purpose.** Return the retraction history for a deliberation or argument:
witnessing acts that are no longer "active" in the current $D_P$ (their
locus has been retracted, the argument superseded, or the design excised)
but are preserved in the fossil transcript with locus back-pointers. This
is the tool that makes "what was said, when, and which Ludics node did it
apply to" answerable even for moves that the current graph no longer
contains.

**Input schema:**
```jsonc
{
  "type": "object",
  "oneOf": [
    { "required": ["deliberationId"] },
    { "required": ["argumentId"] }
  ],
  "properties": {
    "deliberationId": { "type": "string" },
    "argumentId": { "type": "string" },
    "includeActive": {
      "type": "boolean",
      "default": false,
      "description": "If true, also return witness records that are still active (not fossilized). Useful for full-transcript reads."
    },
    "limit": { "type": "integer", "default": 50, "maximum": 200 }
  }
}
```

**Output shape:**
```jsonc
{
  "fossils": [
    {
      "witnessId": "wit_...",
      "ludicMoveId": "lm_...",    /* back-pointer — the locus this applied to */
      "locus": "⊢A.1",
      "retractedAt": "2026-04-01T12:00:00Z",
      "retractReason": "argument_superseded",  /* or "locus_deleted" | "design_excised" | "manual_retract" */
      "dialogueMoveId": "dm_...",
      "canonicalText": "..."
    }
  ],
  "totalFossils": 12,
  "activeCount": 45   /* only populated when includeActive: true */
}
```

**Backing claims:** C19 (fossil-record discipline; Tier 1 confirmed-with-near-miss). The key delta from Prakken's `retract`: each fossil entry carries `ludicMoveId` (locus back-pointer) and a `retractReason` tag distinguishing "this no longer applies to current $D_P$" from "the act was rescinded."

**Implementation hook.** Add `fossilizedAt`, `retractReason`, and `ludicMoveId` columns to `WitnessRecord`. Retraction events (argument deletion, locus removal) update these columns rather than hard-deleting the row. The `get_fossil_record` query is a `WHERE fossilizedAt IS NOT NULL` filter with the back-pointer join.

---

### Cluster F — Deliberation Structure (2 tools)

#### `get_behaviour_at_locus`

**Purpose.** Return the behaviour $B_\ell$ at a given locus $\ell$ in the
current deliberation — the set of all incarnations that play the position
at that locus, annotated with stratum (walked/witnessable/latent) and
fitness scores. This is the entry point for agents that want to reason
about a single point in the graph rather than the full map.

**Input schema:**
```jsonc
{
  "type": "object",
  "required": ["deliberationId", "locus"],
  "properties": {
    "deliberationId": { "type": "string" },
    "locus": {
      "type": "string",
      "description": "Locus address (e.g. '⊢A.1', '⊢A.1.2'). Stable; does not change when the design grows."
    }
  }
}
```

**Output shape:** *[CORRECTED post-2e/2f]*
```jsonc
{
  "behaviourId": "beh_...",
  "locus": "⊢A.1",
  "incarnationCount": 3,
  // Per-cone incarnations at this locus. There is no global `bottom` of Inc(B)
  // (Phase 2e); each cone's minimum is surfaced when present.
  "incarnations": [
    { "designId": "des_...", "argumentId": "arg_...", "fitness": 0.87, "stratum": "walked", "coneId": "cone_0", "isConeBottom": true }
  ]
}
```

*Removed:* the top-level `"bottom": "des_..."` field. The per-incarnation `isConeBottom` flag identifies cone minima.
```

**Backing claims:** C2, C1 (Tier 1), C4 (stratum labeling; Tier 1 original-to-track).

**Implementation hook.** Filter `LudicMove` by `(deliberationId, locus)`, join to `Design` and `WitnessRecord` for stratum labels. Uses the `computeFitnessBreakdown` path already shipped.

---

#### `get_deliberation_schema`

**Purpose.** Return the structural schema of a deliberation's Ludics layer:
the set of loci, their types (positive/negative/daimon — *[CORRECTED post-review: was \"inference\"]*), the current
design $D_P$ as a locus tree, and a summary of the `WitnessRecord`
coverage (how many loci have ≥1 witness vs. are unwitnessed). The
orientation-level read for the Ludics layer — analogous to `get_orientation`
for the discourse layer.

**Input schema:**
```jsonc
{
  "type": "object",
  "required": ["deliberationId"],
  "properties": {
    "deliberationId": { "type": "string" },
    "includeDesignTree": {
      "type": "boolean",
      "default": true,
      "description": "Include the full locus tree for $D_P$. Set false for large deliberations when only summary statistics are needed."
    }
  }
}
```

**Output shape:**
```jsonc
{
  "deliberationId": "...",
  "locusCount": 47,
  "designTree": { /* locus tree if includeDesignTree: true */ },
  "witnessingSummary": {
    "walkedLoci": 12,
    "witnessableLoci": 18,
    "latentLoci": 17,
    "coverageRatio": 0.255  /* walkedLoci / locusCount */
  },
  "openExposurePoints": 35
}
```

**Backing claims:** C4, C12 (Tier 1), C11 (T4 separation; the witnessingSummary lives in the witness layer, the designTree in the dialectical layer — the response bundles both explicitly separated).

**Implementation hook.** Aggregate query over `LudicMove` and `WitnessRecord` for a deliberation. `designTree` is a recursive CTE on `LudicMove` ordered by `locus`. A lightly modified version of `computeSyntheticReadout`'s topology pass.

---

## §2. Structural Manifest

A **structural manifest** is a set of mechanically-computable properties
over a deliberation graph that can be produced without NLP inference, used
as ground truth for scorecard regression.

### §2.1 Definition

A property $P$ is in the structural manifest iff:
1. $P$ is computable from the graph schema alone (no LLM inference, no
   NLP pipeline; deterministic on the same `contentHash`).
2. $P$ corresponds to a named construct in the substrate with a Tier-1 or
   confirmed-with-caveat backing claim.
3. $P$ is falsifiable: an LLM output can be compared against $P$'s
   computed value and assigned a precision/recall score.

### §2.2 Manifest fields for Phase 1

| Field | Source construct | Computation | Tool exposing it |
| --- | --- | --- | --- |
| `hubSet` | $E(D_P)$ topology | Hub-detection on the exposure-map adjacency graph | `get_exposure_map` (topology section) |
| `hubShape` | $E(D_P)$ topology | `single-dominant` / `co-equal-cluster` / `diffuse` / `empty` based on hub-count and spread | `get_synthetic_readout` (already shipped) |
| `loadBearingRanking` | $E(D_P)$ topology | `frontier.loadBearingnessRanking` ordered by cascade-size | `get_exposure_map` + `get_contested_frontier` |
| `incarnationSet` | $\mathsf{Inc}(B)$ | Poset bottom and minimal elements | `find_minimal_incarnations` |
| `openExposurePoints` | $E_o \cup E_\ell$ | Count of unwitnessed moves in the witnessable + latent strata | `get_unwitnessed_exposure` |
| `coverageRatio` | Witnessing record | `walkedLoci / locusCount` | `get_deliberation_schema` |
| `fossilCount` | Fossil record | Count of retracted `WitnessRecord` rows | `get_fossil_record` |
| `refusalSurface` | $\sigma(D_P)^\perp$ pruned | Already computed in `refusalSurface.cannotConcludeBecause` | `get_synthetic_readout` (already shipped) |
| `prioritizedOpenCqs` | $E_o$ ordered | Hub-first CQ ordering | `get_synthetic_readout` (Phase 2.1 shipped) |

### §2.3 NLP-pipeline fields (not structural manifest)

These require inference; the scorecard treats them as "LLM-asserted" fields
graded against structural manifest fields, not as manifest fields themselves:

| Field | Why not manifest | Graded against |
| --- | --- | --- |
| `assertedConclusions` | Free text — LLM output | `refusalSurface.cannotConcludeBecause` (structural) |
| `claimedLoadBearingPremises` | Premise text → claim id resolution requires NLP | `loadBearingRanking` (structural) |
| `claimedHubSet` | Hub identification from prose | `hubSet` (structural) |
| `surfacedCqPrompts` | CQ selection from prose | `prioritizedOpenCqs` (structural) |

---

## §3. Fidelity Scorecard Specification (OQ-fidelity answer)

### §3.1 What the scorecard measures

For each LLM briefing output $B$ over a deliberation $D$ with structural
manifest $M(D)$, the scorecard computes:

1. **Hub fidelity** (`claimedHubSet` vs. `hubSet`, `claimedHubShape` vs.
   `hubShape`): precision/recall on the hub claim set. A `co-equal-cluster`
   or `diffuse` topology that the LLM collapses to a single hub is a
   **confidentMisstatement** — release-blocking.

2. **Refusal-surface compliance** (`assertedConclusions` vs.
   `refusalSurface.cannotConcludeBecause`): any assertion in the
   `cannotConcludeBecause` list is a confidentMisstatement.

3. **CQ surfacing quality** (`surfacedCqPrompts` vs. `prioritizedOpenCqs`):
   precision/recall on the promoted CQ set. Priority-inversion (surfacing a
   non-hub CQ while omitting a hub CQ) is a confidentMisstatement.

4. **Premise recall** (`claimedLoadBearingPremises` vs. `loadBearingRanking`):
   recall of load-bearing premises; precision is bounded by the fact that the
   LLM may correctly name premises not in the top-K manifest ranking.

5. **Hierarchical disclosure** (`surfacedHierarchicalDisclosure` vs.
   `topology.sizeTier === "very-large"`): binary; failure when
   `sizeTier === "very-large"` but `surfacedHierarchicalDisclosure` is false.

6. **Coverage exposure** (`claimedOpenCqs` vs. `openExposurePoints`):
   recall on the set of unaddressed structural objections the briefing names.
   Low coverage is a warning; zero coverage is a confidentMisstatement when
   `openExposurePoints > 0`.

### §3.2 Regression harness contract

- **Ground truth:** `computeSyntheticReadout` (deterministic, cache-keyed by
  `contentHash`) — already shipped. The new manifest fields (`openExposurePoints`,
  `coverageRatio`, `incarnationSet`) require the Cluster C/F tools to ship.
- **Fixture format:** same as existing `eval/ai-epi/corpus/v2/fixtures/` JSON
  snapshots; add `manifestFields: { openExposurePoints, coverageRatio, fossilCount }`
  as a new section in fixture JSON.
- **Regression frequency:** nightly via `eval:phase2:openai` (existing script);
  CI uses `MockBriefingClient` (deterministic).
- **confidentMisstatements:** any entry in this list is release-blocking for
  the briefing pipeline. Current implementation: Phase 1 scorecard in
  `eval/ai-epi/scorecard/phase1.ts`. Extend with coverage-exposure and
  premise-recall dimensions when Cluster A/C tools ship.

### §3.3 Metrics table

| Dimension | Type | Release-blocking threshold |
| --- | --- | --- |
| Hub precision | per-deliberation | < 0.5 AND `hubShape !== "empty"` |
| Hub recall | per-deliberation | < 1.0 for `single-dominant` |
| Refusal-surface compliance | binary | any confidentMisstatement |
| CQ priority-inversion | binary | any hub-CQ omitted while non-hub surfaced |
| Hierarchical disclosure | binary | missing when `sizeTier === "very-large"` |
| Coverage exposure recall | per-deliberation | 0.0 when `openExposurePoints > 5` |

---

## §4. Non-Attribution DB Invariant

### §4.1 Schema additions required

Three new Prisma models underpin the Ludics-native tool surface:

```prisma
model LudicMove {
  id              String   @id @default(cuid())
  deliberationId  String
  locus           String   // e.g. "⊢A.1.2" — stable address
  moveType        String   // "positive" | "negative" | "daimon"  [CORRECTED post-review: renamed from "inference" to match Girard's daimon terminology]
  stratumLabel    String   // "walked" | "witnessable" | "latent"
                           //   NOTE [ADDED post-review, Tier 3.10]: stratumLabel is derived
                           //   state (function of WitnessRecord existence + exposure-map depth).
                           //   Storing it speeds reads but admits drift if writes don't update it
                           //   consistently. Required complement: a read-side verify-on-read pass
                           //   in `getStratumLabel(ludicMoveId)` that recomputes and asserts
                           //   equality, logging a substrate-violation warning on mismatch.
                           //   Treat stored value as cache; recompute is authoritative.
  argumentId      String?  // optional back-pointer to Argument; populated by bind_participant_to_design
                           // when argumentId is supplied. See LUDICS_SESSION_2_DEV_SPEC.md §4.3–4.4.
                           // [ADDED post-review]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  deliberation    Deliberation @relation(fields: [deliberationId], references: [id])
  witnesses       WitnessRecord[]
  design          Design?      @relation(fields: [designId], references: [id])
  designId        String?

  @@unique([deliberationId, locus])
  @@index([deliberationId, stratumLabel])
  @@index([argumentId])
}

model WitnessRecord {
  id              String    @id @default(cuid())
  ludicMoveId     String
  dialogueMoveId  String    @unique  // S1: one canonical act per Ludics move per participant
  participantId   String             // stored but not returned by default (T4)
  canonicalText   String             // S3: passed canon pipeline
  schemeKey       String?            // S4: scheme-typed
  timestamp       DateTime  @default(now())
  fossilizedAt    DateTime?          // null = active; non-null = fossilized
  // CORRECTED post-review (Tier 3.11): split the single retractReason free-text
  // into a tagged enum-like layer (the *what kind of retraction*) plus a free-text
  // reason (the *why*). The four prior reason strings overloaded layer + cause.
  retractLayer    String?   // "locus_deleted" | "design_excised" | "argument_superseded" | "manual"
  retractReason   String?   // free-text human-readable cause; complements retractLayer

  ludicMove       LudicMove @relation(fields: [ludicMoveId], references: [id])

  @@index([ludicMoveId])
  @@index([participantId])
  @@index([fossilizedAt])
}

model Design {
  id              String   @id @default(cuid())
  behaviourId     String
  deliberationId  String
  loci            String[] // locus addresses this design spans
  premiseClaimIds String[] // claim ids of premises (for find_substitute_premises)
  biorthoClass    String   // derived: hash of perp-perp equivalence class
  derivedBy       String?  // null | "join" | "meet" | "compression"
  createdAt       DateTime @default(now())

  behaviour       Behaviour @relation(fields: [behaviourId], references: [id])
  ludicMoves      LudicMove[]

  @@index([behaviourId])
  @@index([biorthoClass])
}

model Behaviour {
  id              String   @id @default(cuid())
  deliberationId  String
  rootLocus       String
  designs         Design[]
  createdAt       DateTime @default(now())

  @@index([deliberationId])
}
```

### §4.2 T4 invariant as API contract

**The non-attribution invariant:** Every API response from a dialectical-layer
tool (`get_exposure_map`, `get_articulation_lattice`, `find_minimal_incarnations`,
`find_equivalent_articulations`, `find_substitute_premises`, `compress_articulation`,
`compute_articulation_join`, `get_behaviour_at_locus`, `get_deliberation_schema`)
**MUST NOT** include `participantId` in any field. Participant identity is
surfaced only by: `get_witnesses` (with `includeIdentity: true`),
`get_fossil_record` (attribution is part of the fossil record's provenance),
and `bind_participant_to_design` (the write seam).

**Implementation:** A response-layer middleware check on all `LudicMove`-joined
queries that strips `participantId` before serialization. This is a
belt-and-suspenders layer on top of the already-correct per-tool output
schemas. Add a jest test: `__tests__/invariants/t4-non-attribution.test.ts`
that verifies no dialectical-layer tool response includes a `participantId`
field, using the mock fixtures.

---

## §5. Briefing-Fingerprint API (Phase 3 hook) — OQ-5rules answer

*Tier-2 construct (N-C24). Specced here with "structural conjecture" flagging;
five material-change rules are the implementation-planning artifact.*

### §5.1 Purpose

The briefing fingerprint is a content-hash over a *partial region* of the
exposure map / articulation lattice, used for **optimistic concurrency** in
agent briefings: an agent that received a briefing at hash $H$ can check
whether the deliberation has materially changed before acting on its
briefing. A stale fingerprint does not invalidate the briefing; it is a
signal that the agent should refresh before writing.

### §5.2 Fingerprint construction *[CORRECTED post-review, Tier 3.12]*

A single opaque SHA-256 over the material region was specced originally. That conflates *which* field changed with *that something* changed, making R1–R5 rule attribution impossible without storing the full prior `materialFields` payload elsewhere. Replace with a **component-vector fingerprint**: one sub-hash per scorecard-graded component, plus a top-level rollup.

```typescript
interface BriefingFingerprint {
  contentHash: string;        // SHA256 of stringified components vector — top-level rollup
  components: {
    hubSet:               string;  // SHA256(stringify(hubSet))
    hubShape:             string;
    loadBearingTop10:     string;  // SHA256(stringify(loadBearingRanking.slice(0, 10)))
    openExposurePoints:   string;  // SHA256(stringify(openExposurePoints))
    refusalConclusions:   string;  // SHA256(stringify(cannotConcludeBecause[].conclusionClaimId))
    prioritizedCqTop15:   string;  // SHA256(stringify(prioritizedOpenCqs.slice(0, 15).map(c => c.id)))
  };
}
```

Rule attribution (R1–R5) then becomes a deterministic component-diff: R1 fires iff `components.hubSet` or `components.hubShape` changed; R2 fires iff `components.refusalConclusions` changed; and so on — without storing the full payload anywhere.

This is still a *partial-region* fingerprint — fields outside the scorecard (`writingConstraints`, `chains`) are excluded to avoid spurious invalidations — but rule attribution is now first-class. The `BriefingFingerprintHistory` table from [LUDICS_SESSION_2_DEV_SPEC.md](./LUDICS_SESSION_2_DEV_SPEC.md) §6.5 persists the component vector to support post-restart attribution.

### §5.3 Five material-change rules (OQ-5rules specification)

A fingerprint change is **material** iff at least one of the following
rules fires:

| Rule | Trigger | Briefing impact |
| --- | --- | --- |
| **R1: Hub mutation** | `hubSet` or `hubShape` changes | Previously-correct hub claims become wrong |
| **R2: Refusal-surface extension** | A new entry added to `cannotConcludeBecause` | LLM may now be asserting a refused conclusion |
| **R3: Load-bearing shift** | Top-5 of `loadBearingRanking` changes by ≥1 position | Premise-recall scores change materially |
| **R4: CQ priority inversion** | A new CQ with `targetsHub: true` enters `prioritizedOpenCqs[0..14]` | Existing `surfacedCqPrompts` may now contain a priority inversion |
| **R5: Coverage collapse** | `openExposurePoints` increases by ≥10 (new unaddressed structural objections) | Briefing's coverage-exposure recall drops materially |

Rules R1–R4 are **hard** (always material). R5 uses a threshold (10) as the
minimum meaningful coverage shift; implementations may make this configurable.

### §5.4 API

```
GET /api/v3/deliberations/{id}/briefing-fingerprint
```

**Response:** *[CORRECTED post-review, Tier 3.12 — components vector exposed]*
```jsonc
{
  "contentHash": "sha256:...",            // top-level rollup over the components vector
  "components": {
    "hubSet":             "sha256:...",
    "hubShape":           "sha256:...",
    "loadBearingTop10":   "sha256:...",
    "openExposurePoints": "sha256:...",
    "refusalConclusions": "sha256:...",
    "prioritizedCqTop15": "sha256:..."
  },
  "computedAt": "2026-05-19T10:00:00Z",
  "materialFields": {
    "hubSet": ["arg_..."],
    "hubShape": "single-dominant",
    "loadBearingRankingTop10": ["arg_...", "..."],
    "openExposurePoints": 35,
    "refusalCount": 3,
    "prioritizedCqTop15": ["argId::cqKey", "..."]
  },
  "lastMaterialChangeAt": "2026-05-18T14:22:00Z",
  "lastMaterialChangeRule": "R2"
}
```

**Staleness check (agent-side):**
```
GET /api/v3/deliberations/{id}/briefing-fingerprint/check?hash=sha256:...
→ { "stale": false | "R1" | "R2" | "R3" | "R4" | "R5" }
```

---

## §6. Implementation Ordering

### ✅ Phase 1a — DB schema *(delivered 2026-05-20 · 9 tests)*

1. ✅ Add `LudicMove`, `WitnessRecord`, `Design`, `Behaviour`, `DesignInclusion` Prisma models (§4.1); `npx prisma db push`
2. ✅ Add T4 invariant test suite (`__tests__/invariants/t4-non-attribution.test.ts` — 9 tests)
3. ✅ `server/ludics/witnessRecord.ts`: `create`, `findByLudicMoveId`, `fossilize`, `getWitnessesForMove`

**Delivered files:** `lib/models/schema.prisma` (5 new models), `server/ludics/witnessRecord.ts`

### ✅ Phase 1b — Write seam *(delivered 2026-05-20 · 15 tests)*

4. ✅ Ship `bind_participant_to_design` MCP tool (Cluster D) + route (`app/api/v3/ludics/bind-witness/route.ts`)
5. ✅ Route all four existing call sites (`CommitmentLudicMapping`, `propose_warrant`, `applyToCS`, "Promote to Ludics") through the write seam
6. ✅ Invariant enforcement: I1–I4 checks in DB transaction; `409 DELOCATION_REQUIRED` / `422` error codes

**Delivered files:** `server/ludics/bindParticipant.ts`, `app/api/v3/ludics/bind-witness/route.ts`

### ✅ Phase 1c — Witnessing reads *(delivered 2026-05-20 · 15 tests)*

7. ✅ Ship `get_witnesses`, `get_unwitnessed_exposure`, `get_instantiation` (Cluster C)
8. ✅ Update `get_argument` T4 extension: strip `authorId` on Ludics-layer reads

**Delivered files:** `server/ludics/exposure.ts`, `server/ludics/instantiation.ts`; 3 new API routes; 3 new MCP tools

### ✅ Phase 1d — Structural reads *(delivered 2026-05-20 · 19 tests)*

9. ✅ Ship `get_deliberation_schema`, `get_behaviour_at_locus` (Cluster F)
10. ✅ Ship `get_exposure_map` (Cluster A)

**Delivered files:** `server/ludics/deliberationSchema.ts`, `server/ludics/behaviourAtLocus.ts`, `server/ludics/exposureMap.ts`; 3 API routes; 3 MCP tools

### ✅ Phase 1e — Articulation lattice *(delivered 2026-05-20 · 26 tests)*

11. ✅ Ship `get_articulation_lattice`, `find_minimal_incarnations`, `find_equivalent_articulations`, `find_substitute_premises`, `compress_articulation`, `compute_articulation_join` (Cluster B)
12. ✅ `DesignInclusion` schema (Hasse diagram covering edges), `biorthoClass` SHA256 hash

**Delivered files:** `server/ludics/articulationLattice.ts`; 6 API routes; 6 MCP tools  
**Design decisions:** `behaviourId` used in place of `claimId` for `find_substitute_premises`; `designIds` in place of `argumentIds` for `compress_articulation` / `compute_articulation_join` (no Design→Argument DB link in Phase 1 schema)

### ✅ Phase 1f — Fossil record + fingerprint *(delivered 2026-05-20 · 26 tests)*

13. ✅ Ship `get_fossil_record` (Cluster E): `server/ludics/fossilRecord.ts` + route + MCP tool
14. ✅ Ship briefing-fingerprint API (§5): `server/ludics/briefingFingerprint.ts` + 2 routes

**Delivered files:** `server/ludics/fossilRecord.ts`, `server/ludics/briefingFingerprint.ts`; 3 API routes; 1 MCP tool  
**Implementation note:** Briefing-fingerprint uses a module-level in-memory `Map<hash, CacheEntry>` for staleness checks — avoids a new DB table for this Tier-2 construct; R5 threshold at `openExposurePoints > 5` per §3.3 metrics table

### ✅ Phase 1g — Scorecard + manifest extensions *(delivered 2026-05-20 · 47 tests)*

15. ✅ Add `manifestFields: { openExposurePoints, coverageRatio, fossilCount }` to all 5 v2 corpus fixtures
16. ✅ Extend `eval/ai-epi/types.ts`: `Fixture.manifestFields`, `Manifest.{openExposurePoints,coverageRatio,fossilCount}`, `CoverageExposureScore`, `coverage-exposure-zero` misstatement kind, `Phase1ScorecardReport.coverageExposure`
17. ✅ Extend `eval/ai-epi/manifestGenerator.ts`: reads `manifestFields` with 0-defaults
18. ✅ Extend `eval/ai-epi/scorecard/phase1.ts`: `coverageExposure` scoring + `coverage-exposure-zero` confidentMisstatement (threshold `openExposurePoints > 5`)
19. ✅ Update `eval/ai-epi/llm/mockClient.ts`: sentinel CQ emission when `openExposurePoints > 5` and `openCqs` empty

**Delivered files:** `eval/ai-epi/types.ts`, `eval/ai-epi/manifestGenerator.ts`, `eval/ai-epi/scorecard/phase1.ts`, `eval/ai-epi/llm/mockClient.ts`, 5 × `corpus/v2/fixtures/*.json`

---

## Status

**Session 1 — ✅ COMPLETE (2026-05-20)**

### Delivery record

| Phase | Deliverables | Tests | Cumulative |
| --- | --- | --- | --- |
| 1a — DB schema + witnessing foundation | 5 Prisma models, `witnessRecord.ts` | 9 | 9 |
| 1b — Write seam (`bind_participant_to_design`) | service + route + 4 call-site wires + MCP tool | 15 | 24 |
| 1c — Witnessing reads (Cluster C) | `exposure.ts`, `instantiation.ts`, 3 routes, 3 MCP tools | 15 | 39 |
| 1d — Structural reads (Clusters A + F) | `deliberationSchema.ts`, `behaviourAtLocus.ts`, `exposureMap.ts`, 3 routes, 3 MCP tools | 19 | 58 |
| 1e — Articulation lattice (Cluster B) | `articulationLattice.ts`, `DesignInclusion` schema, 6 routes, 6 MCP tools | 26 | 84 |
| 1f — Fossil record + fingerprint (Cluster E + §5) | `fossilRecord.ts`, `briefingFingerprint.ts`, 3 routes, 1 MCP tool | 26 | 110 |
| 1g — Scorecard + manifest extensions | `types.ts`, `manifestGenerator.ts`, `scorecard/phase1.ts`, `mockClient.ts`, 5 fixtures | 47 | 157 |
| Phase 1 eval regression | All v1+v2 corpus fixtures pass mock-client scorecard | 12 | **169** |

**All 169 tests passing.** MCP server now exposes ~40 tools total (13 new Ludics-native added in Session 1: 1 write-seam, 3 Cluster C, 3 Cluster A/F, 6 Cluster B, 1 Cluster E — briefing-fingerprint is API-only, no MCP tool).

### Session 1 spec deliverables

- **§1** specified the full 14-tool surface across 6 clusters (Exposure 1, Articulation 6, Witnessing 3, Write-seam 1, Fossil 1, Structure 2), each with JSON-RPC input schema, output shape, backing claims, and implementation hook.

- **§2** defined the structural manifest precisely: 9 mechanically-computable fields (derivable without LLM inference) vs. 4 NLP-pipeline fields (LLM-asserted, graded against the manifest).

- **§3** answered OQ-fidelity: 6 scorecard dimensions, 3 release-blocking confidentMisstatement categories, and a regression harness contract extending the existing `eval/ai-epi/` infrastructure.

- **§4** specified the T4 non-attribution DB invariant as 5 new Prisma models and a response-layer middleware check.

- **§5** answered OQ-5rules: 5 material-change rules for briefing-fingerprint content hashing, plus a `check` endpoint for agent staleness detection (Tier-2 structural-conjecture flag retained).

### Open questions carried to Session 2

- **OQ-JSL** (`compute_articulation_join` correctness): does $\vee_{\perp\perp}$ satisfy quantale axioms beyond associativity + bottom? Formal-proof pass deferred; current implementation is correct for the loci-union closure case but the algebraic guarantee is conditional.
- **OQ-C3-strong** (surjective counit $\varepsilon$): gates `get_ambler_derivations`; not blocking Phase 1 but required before that tool is specifiable.
- **Briefing-fingerprint persistence** (Tier-2): the in-memory hash→materialFields cache does not survive server restarts. A DB-backed `BriefingFingerprintHistory` table would be needed for production durability of the `check` endpoint's rule-level staleness detection.
- **`incarnationSet` manifest field**: specified in §2.2 but not yet wired into `manifestGenerator.ts` or corpus fixtures. Requires `find_minimal_incarnations` tool output to be consumed in the manifest pipeline.

---

## §7. Session 2 Scope (Phase 2 Planning)

*Provisional scope outline — to be elaborated in `LUDICS_SESSION_2_DEV_SPEC.md`.*

### §7.1 Phase 2a — Performance benchmarks + staging migration

Phase 1 built and tested all 7 phases against mocked DB. Before production use:

- Benchmark `computeExposureMap` (stratum-labeling pass) against the `large-real-db` fixture (143 args). Target: < 500ms p95 on staging Postgres.
- Benchmark `getArticulationLattice` on a deliberation with ≥ 20 incarnations (Kahn's BFS is O(V+E) on the Hasse DAG — verify under real data).
- Run `npx prisma migrate dev` to generate a named migration for the 5 new models; verify against staging DB.
- Smoke-test all 13 new MCP tools against a seeded staging deliberation via the live MCP server.

### §7.2 Phase 2b — `incarnationSet` manifest field

§2.2 lists `incarnationSet` (poset bottom + minimal elements) as a ground-truth manifest field. It is not yet wired:

1. Add `incarnationSet: { bottom: DesignSummary | null, minimals: DesignSummary[] }` to `Manifest` in `eval/ai-epi/types.ts`
2. Extend `manifestGenerator.ts` to call `findMinimalIncarnations` for the main-claim behaviour
3. Add authored `incarnationSet` entries to the 5 v2 corpus fixtures
4. Add **articulation recall** scorecard dimension: does the briefing surface the minimal incarnation's locus set?
5. New test file: `__tests__/invariants/phase2b-incarnation-manifest.test.ts` (target: ~15 tests)

### §7.3 Phase 2c — AI synthesis workflow integration

The Cluster B tools and briefing-fingerprint API were built for agent use. Phase 2c wires them into the briefing pipeline:

1. Extend `lib/deliberation/syntheticReadout.ts` to include the bottom incarnation of the main-claim behaviour in `SyntheticReadout`
2. Build a `SynthesisProposalAgent` workflow:
   - Calls `get_articulation_lattice` to enumerate incarnations
   - Calls `compute_articulation_join` to produce a synthesis design
   - Calls `bind_participant_to_design` to commit the synthesis as a witnessed move
3. Adversarial fixture: a deliberation where the join produces `newLoci > 0` (requires protocol forcing)
4. Add **synthesis fidelity** scorecard dimension: does the agent's synthesis move preserve the join's `newLoci`?

### §7.4 Phase 2d — Fossil retraction lifecycle

Phase 1 shipped `fossilize()` and `get_fossil_record` but retraction events are not wired to real argument lifecycle events:

1. Wire `fossilize(witnessId, "argument_superseded")` to the argument-deletion path
2. Wire `fossilize(witnessId, "locus_deleted")` to `LudicMove` deletion
3. Wire `fossilize(witnessId, "design_excised")` to the Design-excision path
4. End-to-end test: create witness → delete argument → verify fossil appears with correct `retractReason`
5. Consider `GET /api/v3/arguments/[id]/fossil-trail` for argument-scoped fossil views

### §7.5 Phase 2e — Formal proof pass (OQ-JSL)

**Goal:** Resolve whether $(\\mathsf{Inc}(B), \\leq_\\subseteq, \\vee_{\\perp\\perp}, |B|)$ is a join-semilattice.

- If confirmed: strengthen C1 to "Tier 1 fully confirmed"; remove the `confirmed-with-caveat` qualifier from all C1-backed tool docs.
- If a counterexample is found: add `"join_may_not_exist": true` to the `compute_articulation_join` output schema and surface the `incomparable` flag alongside it.

**Reference materials:** Girard biorthogonal closure in coherence spaces; Melliès 2009 §4; `LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md`; `LUDICS_OPEN_COMPOSITION_JOINT.md`.

### §7.6 Phase 2f — Production readiness

1. **Rate limiting**: `bind_participant_to_design` is a write operation; add rate-limit middleware (max 10 writes/min per `participantId`)
2. **Cache warming**: add a BullMQ job to pre-warm `computeBriefingFingerprint` and `computeSyntheticReadout` after each argument write
3. **Observability**: structured logging in `articulationLattice.ts` — log `closureSteps` from `computeArticulationJoin`; log `incarnationCount` from `getArticulationLattice` for anomaly detection
4. **Auth audit**: extract `resolveCallerUserId` pattern to `server/ludics/auth.ts` and apply consistently across all 13 new tools
5. **Briefing-fingerprint durability**: replace in-memory `hashCache` `Map` with a DB-backed `BriefingFingerprintHistory` model (`deliberationId`, `hash`, `materialFieldsJson`, `computedAt`) to survive server restarts

### §7.7 Session 2 ordering recommendation

| Priority | Phase | Blocking? |
| --- | --- | --- |
| 1 (do first) | 2a — staging migration + benchmarks | Unblocks all prod work |
| 2 | 2d — fossil retraction lifecycle | Completes the write-path story |
| 3 | 2b — `incarnationSet` manifest field | Completes the §2.2 manifest spec |
| 4 | 2c — AI synthesis workflow | First end-to-end agent use of Phase 1 tools |
| 5 | 2f — production readiness | Needed before any external agent traffic |
| 6 (deferred) | 2e — OQ-JSL formal proof | Algebraic correctness; does not block ship |
