# Scheme-Ontology MCP Alignment — Implementation Roadmap

**Status:** proposed
**Owner:** Isonomia MCP / scheme-ontology consumer surface
**Derived from:** [SCHEMES_MCP_TOOL_ALIGNMENT.md](SCHEMES_MCP_TOOL_ALIGNMENT.md) (design note) — specifically the §1.5 substrate capability ledger and the §1.4 write-seam distinction.
**Companion docs:**
- [SCHEMES_MCP_TOOL_ALIGNMENT.md](SCHEMES_MCP_TOOL_ALIGNMENT.md) — the design note this roadmap promotes to work items
- [FROM_FOLKSONOMY_TO_ONTOLOGY_SCHEMES.md](FROM_FOLKSONOMY_TO_ONTOLOGY_SCHEMES.md) — substrate-side checklist (Phases 0–7)
- [docs/MCP_STRUCTURED_ARGUMENT_ROADMAP.md](../../docs/MCP_STRUCTURED_ARGUMENT_ROADMAP.md) — the single-argument write roadmap this extends (and whose §6 chain-creation deferral PART 3 picks up)
- [SCHEMES_IMPL_VERIFIER.md](SCHEMES_IMPL_VERIFIER.md) — Spec 4 (verifier + fingerprint + AIF round-trip)
- [packages/isonomia-mcp/src/server.ts](../../packages/isonomia-mcp/src/server.ts) — MCP tool registry
- [packages/isonomia-mcp/src/orientation.ts](../../packages/isonomia-mcp/src/orientation.ts) — `ORIENTATION_VERSION` (currently `1.10.0`) + routing recipes

---

## 1. Motivation

The substrate-side ontology programme (Specs 2–5) has shipped. The MCP surface —
the way external agents consume the catalogue — has not moved with it. The
alignment design note's §1.5 ledger pins the asymmetry: the *honesty machinery*
(behaviour-equality verifier, materialised `ArgumentScheme.fingerprint`,
`resolveSchemeByFingerprint` / `decideImportResolution`, AIF
`mesh:behaviourFingerprint` round-trip, WF1–WF3 error-level scheme writes,
Carneades `premiseType`, Q-022 provenance, Q-024 timestamps, the Phase 4d
catalogue audit) is all ✅. But MCP tools still expose the *folksonomy-era*
surface: `list_schemes` returns no health/fingerprint signal, and
`propose_structured_argument` accepts any `schemeKey` — including dialogue-meta
and test-placeholder rows — without a health gate.

**This roadmap mechanically promotes each ✅ ledger row to a concrete MCP surface
change**, and identifies the two ⏳ ledger gaps that are *new substrate work* on
the critical path. It deliberately stops short of chain creation, which is PART 3
(its own dev spec, scaffolded in alignment §3.5).

---

## 2. Derivation principle

Each work item below is traceable to exactly one ledger row and respects the
§1.4 seam:

- **The MCP write boundary is `Argument` writes, not scheme-definition writes.**
  WF1–WF3 already gate scheme authoring on the admin path; the MCP tool's job is
  **scheme-health *selection*** (reject unhealthy `schemeKey`) + **per-instance
  soundness state**, never re-running WF.
- **The canonical write posture is `decideImportResolution`'s:** pre-filter by
  fingerprint, confirm with the verifier, **never silently merge**. MCP tools
  reuse this verbatim — at argument granularity in this roadmap, and at link
  granularity in PART 3.

An item is **buildable now** iff its ledger prerequisite is ✅. The two ⏳ rows
("catalogue-health projection", "`SchemeInstance` state read API") are promoted
to first-class **substrate enablers** (§3) because multiple MCP items depend on
them.

---

## 3. Critical-path substrate enablers

These are *not* MCP work — they are the two substrate gaps from the ledger that
the MCP surface cannot fake. They gate Phases A, B, and the read side of C.

### E1 — Catalogue-health projection (queryable)

**Gap (ledger ⏳).** Today the health signals exist only as derivable heuristics
(`kind`, key-naming conventions, fingerprint collisions) plus an audit JSON.
There is no single queryable field an MCP tool can read to decide "is this
`schemeKey` an argument-pattern row, a duplicate-candidate, a test placeholder,
or a dialogue-meta entry?".

**Deliverable.** A derived `catalogueHealth` projection on the scheme read path
([GET /api/schemes](../../app/api/schemes/route.ts) and the per-scheme endpoint),
computed (not stored as truth) from existing columns:

```ts
catalogueHealth: {
  isArgumentPattern: boolean,      // kind === "argument-scheme"
  isDialogueMeta: boolean,         // kind === "dialogue-meta"
  isTestPlaceholder: boolean,      // key matches test/placeholder naming heuristic
  duplicateOf: string | null,      // canonical key if this row collides on fingerprint
  canonicalKey: string | null,     // self, or the duplicateOf target
  clusterTagMissing: boolean,      // clusterTag == null
  fingerprintMaterialised: boolean // fingerprint != null
}
```

Duplicate detection composes the **already-shipped** primitives: bucket by
`fingerprint` (materialised column), confirm with `verifyBehaviourEquality`
([lib/schemes/verifier](../../lib/schemes/verifier)). The Phase 4d audit baseline
(0 equal / 0 subset — [audits/catalogue-redundancy-20260531.md](../../audits/catalogue-redundancy-20260531.md))
means `duplicateOf` is `null` for every current row; the field is forward-looking
insurance for imports.

**Effort.** ~3–4 h (projection helper + wire into both read endpoints + unit
tests over a fixture catalogue with one seeded duplicate). No migration —
derived, not stored.

**Blocker.** none (all inputs ✅).

### E2 — `SchemeInstance` state read API

**Gap (ledger ⏳ partial).** Spec 3 close-gate logic ships, but there is no
endpoint projecting a `SchemeInstance`'s obligation state to a consumer. MCP
read tools (`get_argument`, the proposed `get_scheme_instance_state`) and the
write tool's return shape all need it.

**Deliverable.** `GET /api/scheme-instances/[id]/state` returning:

```ts
{
  id, schemeId, schemeKey, status,           // "open" | "closed"
  openObligations: Array<{ cqId, cqKey, text, attackKind, premiseType, isSchemeRequired, inheritedFromParentScheme }>,
  dischargedObligations: Array<{ cqId, dischargedByMoveId, dischargedAt }>,
  closeHookEligible: boolean,
  lastTransitionAt: string | null
}
```

Reuses the Spec 3 close-gate evaluator; the `premiseType` field is read straight
from the shipped `CriticalQuestion.premiseType` column.

**Effort.** ~3–5 h (read endpoint projecting the close-gate evaluator's already-
computed obligation set + tests). No migration.

**Blocker.** Spec 3 close-gate evaluator (✅ shipped); only the read projection
is new.

---

## 4. MCP surface phases

### Phase A — Read-tool enrichment (honest discovery)

Makes the §1 four jobs' **#1 discover** and **#3 read-back** honest. Depends on
E1 (and E2 for `get_argument`'s instance block).

#### A.1 — `list_schemes` health + fingerprint projection

**Ledger rows:** materialised fingerprint ✅, `catalogueHealth` (via E1).

**Today** ([server.ts](../../packages/isonomia-mcp/src/server.ts) L1593): projects
`clusterTag`, `epistemicMode`, CQ counts — **no** health or fingerprint.

**Change.** Add `behaviourFingerprint` and `catalogueHealth` to the per-item
projection. Add an `excludeUnhealthy` input param (default `true` once E1 lands;
documented as filtering `isDialogueMeta` + `isTestPlaceholder`, **not**
`duplicateOf` — duplicates are advisory, see MCP-Q-D). Add `catalogueOntologyState`
to the top-level response.

**Effort.** ~1 h (projection fields + param; the endpoint does the work in E1).
**Blocker:** E1.

#### A.2 — `get_argument` scheme-health + instance block

**Ledger rows:** materialised fingerprint ✅, AIF round-trip ✅, `catalogueHealth`
(E1), `SchemeInstance` state (E2).

**Change.**
- `scheme: { key, name, canonicalKey?, catalogueHealth, behaviourFingerprint }`.
- `criticalQuestions[]` gains `.premiseType`, `.attackKind`, `.isSchemeRequired`,
  `.inheritedFromParentScheme` (all from shipped columns).
- New `schemeInstance` block mirroring E2's shape.
- In `format: "aif"`: the export already emits `mesh:behaviourFingerprint`
  ([lib/aif/jsonld.ts](../../lib/aif/jsonld.ts)); add the per-field-group
  `mesh:roundTripSoundness` annotation surfacing the Q-020 exposed-vs-absent
  classification.

**Effort.** ~2–3 h. **Blocker:** E1, E2.

### Phase B — Write-tool health-selection gate

The honesty-critical phase. Makes job **#4 refuse** real. Depends on E1.

#### B.1 — `propose_structured_argument` rejects unhealthy `schemeKey`

**Ledger rows:** `kind` discriminator ✅, `catalogueHealth` (E1),
`resolveSchemeByFingerprint` ✅ pattern.

**Change** (server-side, in [POST /api/arguments/quick-structured](../../app/api/arguments/quick-structured/route.ts),
mirrored in the MCP tool input/description):
- Resolve `schemeKey` → reject `isTestPlaceholder` / `isDialogueMeta` with typed
  error `SCHEME_NOT_ARGUMENT_PATTERN` + pointer to
  `list_schemes(excludeUnhealthy: true)`.
- When `duplicateOf` is set, **auto-redirect to `canonicalKey`** and return a
  `scheme_canonicalized` warning preserving the original key for audit (never a
  silent merge — §1.4 / decideImportResolution posture).
- Accept `premises[i].premiseType: "ordinary" | "assumption" | "exception"`
  (Carneades column ✅; default `ordinary`).
- Accept top-level `epistemicMode` (participates in the fingerprint domain per
  Q-020); default copied from the scheme's catalogue value; emit
  `epistemic_mode_changed_fingerprint` warning if the agent overrides it.
- Return `verifierVerdict` against same-fingerprint candidates (`equal | subset |
  incomparable | inconclusive | skipped`) using the shipped verifier;
  `inconclusive`/`subset`/`equal` route to **warn-and-ship-with-flag** (MCP-Q-B),
  persisting the verdict so the Phase 4d audit can track drift.
- Return `schemeInstance` block (E2 shape).

**Effort.** ~4–6 h (server resolution rewrite + warning surface + verifier call +
tests). **Blocker:** E1 (health gate); E2 (instance block in response — can ship
the gate first and add the block when E2 lands).

### Phase C — New verifier read tools (structural radar)

All ledger ✅ (verifier + fingerprint shipped). No substrate blocker.

#### C.1 — `verify_scheme_equality(keyA, keyB)`

Direct read-only exposure of `verifyBehaviourEquality`. Returns `{ verdict,
witnessOrCounter, runtimeMs, fingerprintsMatched }`. Description frames the result
as **necessary-but-not-sufficient** (P3 / Q-021 foreclose canonical form) so
consumers never read `inconclusive` as `incomparable`.
**Effort.** ~1 h (thin endpoint wrapper + MCP tool). Reuses the verifier.

#### C.2 — `compute_scheme_fingerprint(schemeKey)`

Read the materialised `fingerprint` column (recompute via
[computeFingerprint.ts](../../lib/schemes/verifier/computeFingerprint.ts) if null).
Documented as pre-filter only. **Effort.** ~30 min.

#### C.3 — `find_behaviourally_similar_schemes(schemeKey, k=5)`

Fingerprint-bucket (indexed) → verifier-confirm. The redundancy radar an agent
uses before proposing. **Effort.** ~1.5 h. Composes C.1 + the materialised index.

### Phase D — Provenance tools

Ledger ✅ (Q-022 + Q-024 columns shipped).

#### D.1 — `get_scheme_provenance(schemeKey)`

Returns `{ sourceCatalogue, sourceId, sourceVersion, importedAt, importerVersion,
createdBy, createdAt }` straight from the shipped columns. **Effort.** ~45 min.

#### D.2 — `compare_scheme_provenance(keyA, keyB)`

Returns `{ sameSource, sourceDelta, behaviourFingerprintEqual }` — composes D.1 +
C.1. The "same scheme under two presentations?" diagnostic. **Effort.** ~1 h.

### Phase E — Error-code discipline + orientation

Cross-cutting; lands alongside B and C.

#### E.1 — Typed error/warning codes

Introduce the alignment §4.1 code table as a shared enum across write tools, with
a top-level `error.code` + `error.canonical` (the redirected key / fixed value):

| Code | Cause | Severity | Phase |
|---|---|---|---|
| `SCHEME_UNKNOWN` | key not in `list_schemes` | error | A/B |
| `SCHEME_NOT_ARGUMENT_PATTERN` | dialogue-meta / test placeholder | error | B |
| `SCHEME_CANONICALIZED` | duplicate auto-redirected | warning | B |
| `PREMISE_TYPE_INCONSISTENT` | premiseType conflicts w/ scheme default | warning | B |
| `EPISTEMIC_MODE_CHANGED_FINGERPRINT` | agent override shifts fingerprint | warning | B |
| `VERIFIER_INCONCLUSIVE` | verdict inconclusive on same-fingerprint check | warning | B/C |

`WF1_VIOLATED` / `WF2_CLUSTER_MISMATCH` / `WF3_INHERIT_CQS_MISUSE` are **omitted
from the MCP write surface** by design (§1.4 — they belong to the admin
scheme-definition path, not argument writes). They reappear only if/when an MCP
scheme-*authoring* surface is specced (out of scope here).

**Effort.** ~1.5 h (shared enum + wiring into B's responses).

#### E.2 — Orientation bump + routing recipes

Add discovery/refusal recipes for the new tools to
[orientation.ts](../../packages/isonomia-mcp/src/orientation.ts); document the
health-selection gate so agents call `list_schemes(excludeUnhealthy: true)`
before writing. Bump `ORIENTATION_VERSION` `1.10.0` → `1.11.0`.
**Effort.** ~45 min. **Blocker:** Phases A–D tool surface finalised.

### Phase F — Chain creation → PART 3 (out of scope here)

Deferred to the chain-creation dev spec
([CHAIN_CREATION_OVER_MCP_SPEC.md](CHAIN_CREATION_OVER_MCP_SPEC.md), alignment §3.5).
That spec reframes the precondition: claim reuse **already** works via MOID
content-hash dedup, so the standalone `mint_claim` primitive is *not* a hard
blocker — the spec uses *intra-chain claim threading* (reuse by id or content
hash, with a no-silent-fork guard) instead. The single-argument health-selection
gate (Phase B) **is** the prerequisite chains reuse verbatim, so PART 3 sequences
strictly after Phase B.

---

## 5. Sequencing summary

| Item | Deliverable | Effort | Blocker | Ledger row |
| --- | --- | --- | --- | --- |
| E1 | Catalogue-health projection (queryable) | ~3–4 h | none | ⏳→✅ |
| E2 | `SchemeInstance` state read API | ~3–5 h | none (Spec 3 evaluator ✅) | ⏳→✅ |
| A.1 | `list_schemes` health + fingerprint | ~1 h | E1 | ✅ |
| A.2 | `get_argument` scheme-health + instance block | ~2–3 h | E1, E2 | ✅ |
| B.1 | `propose_structured_argument` health gate | ~4–6 h | E1 (E2 for instance block) | ✅ |
| C.1 | `verify_scheme_equality` | ~1 h | none | ✅ |
| C.2 | `compute_scheme_fingerprint` | ~30 min | none | ✅ |
| C.3 | `find_behaviourally_similar_schemes` | ~1.5 h | C.1 | ✅ |
| D.1 | `get_scheme_provenance` | ~45 min | none | ✅ |
| D.2 | `compare_scheme_provenance` | ~1 h | D.1, C.1 | ✅ |
| E.1 | Typed error/warning codes | ~1.5 h | B.1 | ✅ |
| E.2 | Orientation bump + recipes | ~45 min | A–D | ✅ |

**Critical path:** E1 → A.1 / B.1 (health gate is the honesty payload). E2 → A.2 +
B.1's instance block. C/D are independent and parallelisable (pure verifier/column
reads). Total v1 estimate: **~20–26 h**, dominated by the two substrate enablers
and the write-gate rewrite.

**Recommended order:** E1 → B.1 (gate, the honesty win) → A.1 → C.* (cheap radar)
→ E2 → A.2 → D.* → E.1 → E.2.

---

## 6. Test plan

- **E1 unit:** fixture catalogue with one seeded fingerprint-colliding pair →
  assert `duplicateOf`/`canonicalKey` resolve symmetrically; dialogue-meta and
  test-placeholder rows flagged; healthy argument-pattern row clean.
- **E2 integration:** create a `SchemeInstance` with N open CQs → assert
  `openObligations` count, `closeHookEligible: false`; discharge all → assert
  `status: "closed"`, `closeHookEligible: true`.
- **B.1 integration:** (a) `schemeKey` = dialogue-meta → `SCHEME_NOT_ARGUMENT_PATTERN`
  error, no row written; (b) `schemeKey` = seeded duplicate → `scheme_canonicalized`
  warning + argument attached to canonical key; (c) `premiseType` round-trips onto
  the CQ obligation set; (d) `epistemicMode` override emits the fingerprint warning;
  (e) verifier `inconclusive` ships with flag persisted.
- **A.1/A.2 contract:** snapshot the new projection fields; assert backward compat
  (existing consumers ignore additive fields).
- **C/D unit:** `verify_scheme_equality` verdict matches `verifyBehaviourEquality`
  directly; provenance fields echo the columns verbatim.
- **MCP smoke (Claude Desktop):** "Record an argument from expert opinion …" →
  confirm the agent calls `list_schemes(excludeUnhealthy:true)` then writes with a
  healthy key; deliberately suggest a dialogue-meta key and confirm the refusal is
  honest and actionable.

---

## 7. Success criteria

- An agent can no longer mint an `ArgumentSchemeInstance` against a dialogue-meta
  or test-placeholder scheme via MCP (B.1 hard-refuses with an actionable code).
- `list_schemes` exposes `catalogueHealth` + `behaviourFingerprint`; agents can
  triage before writing.
- A duplicate `schemeKey` is auto-redirected to canonical with an auditable
  `scheme_canonicalized` warning — never silently merged.
- `get_argument` surfaces the live `SchemeInstance` obligation state and per-CQ
  `premiseType`/`attackKind`.
- `verify_scheme_equality` returns the shipped verifier's verdict, framed as
  necessary-but-not-sufficient.
- Verifier verdicts written by MCP are persisted so the Phase 4d catalogue audit
  can track drift (catalogue stays at the 0 equal / 0 subset baseline).
- `ORIENTATION_VERSION` bumped; routing recipes teach the health-selection gate.

---

## 8. Out of scope (this roadmap)

- **Chain / argument-net / scheme-net creation** — [CHAIN_CREATION_OVER_MCP_SPEC.md](CHAIN_CREATION_OVER_MCP_SPEC.md)
  (PART 3 dev spec; alignment §3.5). Resolves the `mint_claim` deferral via
  intra-chain claim threading rather than a standalone primitive.
- **MCP scheme-*authoring* surface** (WF1–WF3 over MCP) — no MCP tool writes
  scheme *definitions*; if ever needed, separately specced (§1.4).
- **Wagemans PTA `subjectType` (Q-026)** — Phase 6 open question, no column.
- **Machine-generated tool descriptions** (alignment §4.2) — MCP-Q-C, empirical;
  not on this path.
- **`bind_participant_to_design` health gate** (alignment MCP-Q-D) — follow-up
  once B.1's health check is factored into a shared helper both seams can call.
