# Schemes Implementation — Spec 4: Behaviour-Equality Verifier (C006 surface)

- **status:** draft
- **owner:** schemes track
- **depends-on:** [`SCHEMES_IMPL_OVERVIEW.md`](SCHEMES_IMPL_OVERVIEW.md), [Spec 5 — Audit Protocols](SCHEMES_IMPL_AUDIT_PROTOCOLS.md) (Q-020 output), [Spec 2 — Admin Tightening](SCHEMES_IMPL_ADMIN_TIGHTENING.md) phase 2a+ (stable presentations), [Spec 3 — Protocol Soundness](SCHEMES_IMPL_PROTOCOL_SOUNDNESS.md) phase 3a+ (stable protocols), [T003](../../RESEARCH_PROGRAMME/02_THEOREMS_AND_PROOFS/T003-schemes-layered-coherence.md), [Q-021](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md)
- **last-reviewed:** 2026-05-27

## §1 Problem statement

T003's coherence theorem establishes that the presentation→behaviour
map $\mathcal{B}$ is many-to-one: multiple presentations
$\mathcal{S}_S, \mathcal{S}_{S'}$ can denote the same behaviour
$\llbracket S \rrbracket = \llbracket S' \rrbracket$. This makes
**behaviour-equality decidability** ([Q-021](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md))
an engineering problem with three immediate consequences:

1. **The admin can silently mint duplicates.** Two admins
   independently authoring the same scheme under different
   presentations will produce two `ArgumentScheme` rows that the
   catalogue treats as distinct but that are behaviourally
   identical. As the catalogue grows, this corrodes the catalogue
   itself.
2. **AIF round-tripping can silently merge or split schemes.**
   [`lib/aif/syncArgument.ts`](../../lib/aif/syncArgument.ts)
   currently has no identity discipline that distinguishes
   "presentations of the same behaviour" from "different
   behaviours". Round-trip through AIF and back can drop the
   distinction the substrate intended.
3. **There is no canonical-form route.** Q-021 forecloses
   canonical-form equality (canonicalisation would require
   $\mathcal{B}$ to admit a section, which T003's non-injectivity
   argument denies). The substrate must use **certificate-based
   equality**: assert + verify, with a discriminating design or a
   CQ-counterexample as the verifier's output for failures.

This spec specifies the verifier (the assert + verify mechanism),
the admin's non-redundancy UI built on top of it, and the AIF
round-trip identity discipline.

**Two-tier separation (read this before §3).** This spec carries a
**behaviour fingerprint** (§3.5, §4.3) *and* a **behaviour-equality
verifier** (§3.1). They are not alternatives and not redundant:

- the **fingerprint** is a cheap necessary-but-not-sufficient
  pre-filter — two schemes with different fingerprints cannot be
  behaviourally equal, but two schemes with the same fingerprint
  may or may not be;
- the **verifier** is the sufficient check — it returns a typed
  certificate (`equal | subset | incomparable | inconclusive`) and
  its output is what the catalogue acts on.

The fingerprint **never decides equality on its own**. P3 and Q-021
explicitly foreclose any canonical-form route, so the fingerprint is
not a canonical form (which would be a sufficient check) but a hash
over structural digest data (a necessary check only). Any reader who
catches a code path that treats fingerprint match as equality is
looking at a bug.

**Premises inherited:** P1, P3 (non-injectivity is a UX problem),
P5 (no schema materialisation in this phase).

## §2 Goals and non-goals

**Goals.**

- Implement a **behaviour-equality verifier** that, given two
  schemes $S$ and $S'$ (each represented by a `SchemeDraft`-shaped
  C007 presentation plus its CQ-bundle), returns one of:
  - `equal`: a certificate of behaviour-equality (a structural
    correspondence between the CQ-bundles that the verifier checked
    holds).
  - `subset`: a one-direction inclusion certificate
    ($\llbracket S \rrbracket \subseteq \llbracket S' \rrbracket$
    or the reverse).
  - `incomparable`: a discriminating design or CQ-counterexample
    showing the behaviours differ.
  - `inconclusive`: the verifier exhausted its search bound without
    a result.
- Implement a **non-redundancy admin UI**: when the admin creates or
  saves a scheme, the UI runs the verifier against the existing
  catalogue (gated, since the catalogue may be large — see §3.4) and
  surfaces "this scheme appears behaviourally equal to [existing
  scheme]" with the certificate.
- Implement an **AIF round-trip identity discipline**:
  round-tripping a scheme through AIF and back preserves the
  scheme's identity (no silent merge into an existing AIF scheme
  with the same behaviour; no silent split into multiple AIF
  schemes for the same presentation).
- Establish the verifier as a **named module with a tested public
  API** that future specs (Q-015's soundness-of-concatenation,
  Q-014's catalogue-ontology decision) can build on.

**Non-goals.**

- A general behaviour-equality oracle for arbitrary Ludics
  behaviours; the verifier targets *scheme behaviours* (CQ-bundle-
  fibred) only.
- Termination guarantees for the verifier in full generality (Q-021
  leaves this open). The verifier ships with a documented search
  bound and an `inconclusive` return value.
- Catalogue-wide deduplication actions (merge / split rows). This
  spec gives the admin information; deduplication actions are a
  follow-on driven by the verifier's findings.
- New AIF import paths beyond the existing round-trip.
- Composition-level identity (whether $S_1; S_2$ and $S_3$ denote
  the same behaviour) — that's Q-015 territory.

## §3 API contract

### §3.1 Verifier module: `lib/schemes/verifier/`

**Public entry point:** `lib/schemes/verifier/behaviourEquality.ts`

```ts
import type { ArgumentScheme, CriticalQuestion } from "@prisma/client";

export type SchemeWithCqs = ArgumentScheme & { cqs: CriticalQuestion[] };

export type EqualityCertificate = {
  cqMapping: Array<{ leftCqKey: string; rightCqKey: string }>;
  // The verifier asserts:
  // - every CQ in left's bundle has a matching CQ in right's bundle (same attackType, targetScope, equivalent text under a normalising function)
  // - the converse holds
  // - the presentations' premise/conclusion variable structures unify under a witnessed renaming
  premiseRenaming: Record<string, string>;
  inheritanceRespected: boolean; // i.e. if one scheme inherits from a parent the other's bundle includes the inherited CQs
};

export type InclusionCertificate = {
  direction: "left-subset-right" | "right-subset-left";
  cqMapping: Array<{ leftCqKey: string; rightCqKey: string }>;
  extraCqs: string[]; // CQ keys in the superset side that the subset side lacks
  // Inclusion certificate semantics:
  //   ⟦S⟧ ⊆ ⟦S'⟧ iff CQ(S') ⊆ CQ(S) (more CQs on the right ⇒ smaller behaviour on the right ⇒ subset on the left)
  // The verifier's "subset" direction labels follow ⟦S⟧, not CQ(S).
};

export type IncomparableCertificate = {
  // At least one of these is populated:
  discriminatingCqOnLeft?: { cqKey: string; rationale: string };
  discriminatingCqOnRight?: { cqKey: string; rationale: string };
  conflictingCqs?: Array<{
    leftCqKey: string;
    rightCqKey: string;
    conflict: "different-attack-type" | "different-target-scope" | "incompatible-burden" | "incompatible-evidence-requirement";
  }>;
};

export type VerifierVerdict =
  | { kind: "equal"; certificate: EqualityCertificate }
  | { kind: "subset"; certificate: InclusionCertificate }
  | { kind: "incomparable"; certificate: IncomparableCertificate }
  | { kind: "inconclusive"; reason: "search-bound-exceeded" | "text-normalisation-ambiguous" | "premise-unification-undecided" };

export type VerifierOptions = {
  searchBoundMs?: number;       // default: 250
  textNormalisation?: "exact" | "case-trim" | "fuzzy"; // default: "case-trim"
  cqKeyMatching?: "exact" | "by-attack-type-and-scope"; // default: "by-attack-type-and-scope"
};

export async function verifyBehaviourEquality(
  left: SchemeWithCqs,
  right: SchemeWithCqs,
  options?: VerifierOptions
): Promise<VerifierVerdict>;
```

### §3.2 Verifier algorithm sketch

The verifier is **certificate-driven**, not exhaustive-search:

1. **CQ-bundle matching.** Build a bipartite matching between
   `left.cqs` and `right.cqs` using `cqKeyMatching` policy. If a
   perfect matching exists where each pair has the same
   `attackType` and `targetScope` and equivalent `text` under
   `textNormalisation`: candidate `equal` verdict; build
   `EqualityCertificate`.
2. **Inheritance closure.** Walk parent chains and verify the
   matching survives under inherited-CQ closure (Spec 2's
   WF3 / phase 2b guarantees no inheritance shenanigans on either
   side, so this step terminates).
3. **Premise-unification check.** Attempt to unify left's premise/
   conclusion `variables` with right's under a renaming. If
   unification succeeds and steps 1–2 produced a match: confirm
   `equal`. If unification fails on a structural mismatch (different
   arity, different premise count, incompatible types): downgrade to
   `incomparable` with the unification failure as discriminating
   evidence.
4. **One-sided extra-CQ detection.** If matching succeeded for the
   intersection but one side has additional CQs the other lacks:
   `subset` verdict.
5. **Conflict detection.** If any matched pair has incompatible
   structural fields (different `attackType`, etc.):
   `incomparable` with `conflictingCqs` populated.
6. **Time bound.** If the matching search exceeds `searchBoundMs`:
   `inconclusive` with `"search-bound-exceeded"`.

The verifier is **complete on the easy cases** (clean structural
matches and clean structural mismatches) and **inconclusive on the
hard cases** (text-normalisation ambiguity, deep premise
unification). It does *not* attempt to enumerate the
$\perp\!\perp$-closure or to construct a discriminating design at
the Ludics-design level — that machinery exists in the substrate but
is out of scope for the certificate-based verifier this spec ships.

### §3.3 Verifier service endpoint

**New route:** `app/api/schemes/verify-equality/route.ts`

```ts
// POST /api/schemes/verify-equality
// Body: { leftSchemeId: string; rightSchemeId: string; options?: VerifierOptions }
// Returns: VerifierVerdict | { error: "unauthorized" | "scheme-not-found" }
```

Authenticated; respects existing admin / scheme-read scopes.

### §3.4 Non-redundancy admin UI

**New component:** `components/admin/SchemeNonRedundancyPanel.tsx`

Mounted inside [`SchemeCreator.tsx`](../../components/admin/SchemeCreator.tsx)
beside the Submit button. Behaviour:

- On user request (button-driven, **not** auto-fired on every
  keystroke — catalogue-sized N calls are expensive), the panel
  invokes `POST /api/schemes/verify-equality` against a *candidate
  set* of existing schemes filtered by `clusterTag` and overlapping
  premise-variable signature.
- For each verifier verdict that is `equal` or `subset`, the panel
  renders an entry: "This scheme appears behaviourally [equal to /
  a subset of] **[existing scheme key]**. Certificate: [link to
  certificate view]."
- The panel **does not block submission**. The admin can submit a
  behaviourally-equivalent scheme with a one-paragraph rationale
  (audit-logged); the rationale is recorded on a new field
  `nonRedundancyJustification String?` on `ArgumentScheme`.

**Candidate set.** For a draft scheme $S$, candidates are existing
schemes $S'$ satisfying:

- `S'.clusterTag === S.clusterTag` OR `S'.clusterTag` is unset
- `count(intersect(S.premiseVariables, S'.premiseVariables)) >= 1`
- `count(S'.cqs) ∈ [max(1, |S.cqs| - 2), |S.cqs| + 2]`

This keeps the candidate set typically O(10), bounding total
verifier latency.

### §3.5 AIF round-trip identity discipline

**Modified:** [`lib/aif/syncArgument.ts`](../../lib/aif/syncArgument.ts)

The existing round-trip code currently maps `ArgumentScheme` ↔ AIF
scheme by `key`. The discipline this spec adds:

- On **export to AIF**: include a `mesh:behaviourFingerprint` field
  in the AIF-extension namespace whose value is a stable digest of
  the scheme's CQ-bundle structure (not text — only `cqKey`,
  `attackType`, `targetScope`, sorted; plus premise variable arity,
  conclusion variable count, and `epistemicMode`).
  *Fingerprint scope widened 2026-05-28 by [Q-020 audit](../../audits/q020-external-fields-20260528.md) §4: `epistemicMode` (factual / hypothetical / counterfactual) **changes the play-time behaviour** of the scheme — two schemes identical in CQ-bundle but differing in `epistemicMode` are behaviourally distinct and must not fingerprint-collide.*
- On **import from AIF**: if the incoming AIF scheme carries a
  `mesh:behaviourFingerprint`, look up existing `ArgumentScheme`
  rows by that fingerprint; if a candidate exists, invoke the
  verifier; if `equal`, attach the new presentation as a *variant*
  ([`SchemeVariant`](../../lib/models/schema.prisma) already
  exists as a relation on `ArgumentScheme`) rather than minting a
  new top-level scheme.
- **Conservative default:** if the verifier returns `inconclusive`,
  the import path defaults to minting a new scheme and logs the
  inconclusive verdict. *No silent merge.*

The fingerprint is **necessary but not sufficient** for behaviour
equality. The verifier is the sufficient check; the fingerprint is
just a cheap pre-filter to keep the verifier's candidate set small
on import. On the AIF wire the fingerprint is **only** a candidate-
set hint; the import-side verifier call is what decides whether to
merge as a variant or mint a new scheme.

## §4 Data model

### §4.1 New optional field on `ArgumentScheme`

```diff
 model ArgumentScheme {
   // ...
+  nonRedundancyJustification String? // populated when admin submits a behaviourally-equivalent scheme; audit trail
   // ...
 }
```

### §4.2 No new tables

The verifier is stateless; the non-redundancy panel reads via the
endpoint; the AIF discipline extends an existing field map.

The behaviourFingerprint can be **computed on demand** (a pure
function of the scheme's CQ-bundle); no need to materialise it as a
column unless catalogue-scan performance forces it (see R3 below).

### §4.3 Reserved name: `BehaviourFingerprint` (computed)

```ts
export type BehaviourFingerprint = string; // sha256 hex of canonical CQ-bundle digest

export function computeBehaviourFingerprint(scheme: SchemeWithCqs): BehaviourFingerprint;
```

The fingerprint is **not a canonical form for behaviour equality**
(P3 / Q-021 foreclose canonical-form route). It is a *necessary
condition* — two schemes with different fingerprints cannot be
behaviourally equal; two schemes with the same fingerprint may or
may not be (the verifier decides).

## §5 Migration plan

Four phases. Phase 4a is foundational; 4b, 4c, 4d are largely
independent.

### Phase 4a — Verifier module + endpoint

1. Land `lib/schemes/verifier/behaviourEquality.ts` with the
   algorithm in §3.2.
2. Land `lib/schemes/verifier/computeFingerprint.ts`.
3. Land `POST /api/schemes/verify-equality`.
4. Unit tests: ≥ 3 per verdict kind (`equal`, `subset`,
   `incomparable`, `inconclusive`), drawn from real production
   schemes where possible.

**Acceptance gate to 4b/4c/4d:** test suite green; manual cross-
check against ≥ 5 production scheme pairs (chosen to span
`clusterTag` diversity) shows the verdicts match a human
classification.

### Phase 4b — Non-redundancy admin UI

1. Land `SchemeNonRedundancyPanel.tsx`.
2. Land `nonRedundancyJustification` field migration.
3. Wire panel into `SchemeCreator.tsx` with the candidate-set
   filter from §3.4.
4. Soak: one calendar month; collect telemetry on how often the
   panel surfaces a non-empty result and how often admins proceed
   despite the warning.

**Acceptance:** panel renders; telemetry confirms latency < 2s for
the typical candidate set; ≥ 1 real duplicate found and the admin
took action on it (this is the "did we ship something useful"
acceptance, not a numerical bar).

### Phase 4c — AIF round-trip identity discipline

1. Add `mesh:behaviourFingerprint` to AIF export.
2. Add fingerprint-based pre-filter to AIF import.
3. Wire the verifier into the import path per §3.5.
4. Soak: one calendar month with import logs reviewed.

**Soundness predicate (refined 2026-05-28 by [Q-020 audit](../../audits/q020-external-fields-20260528.md) §4).** The phase 4c soundness predicate is **not** `import(export(scheme)) ≡ scheme` flatly. The audit catalogues 11 `representable-but-absent` fields and 3 `externally-load-bearing-internally-irrelevant` fields that round-trip lossy under flat equality. The correct predicate is:

> `import(export(scheme)) ≡_substrate-relevant scheme`

where `≡_substrate-relevant` means equality on every field the substrate ontology recognises as semantically load-bearing (= every `exposed` and `representable-but-absent` field from Q-020's classification; modulo serialisation conventions documented per round-trip path). Fields classified `intentional-exclusion` or `externally-load-bearing-internally-irrelevant` may differ pre/post round-trip without falsifying soundness; fields classified `accidental-omission` are explicitly out-of-scope until [Q-022](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-022) (provenance schema) lands.

**Acceptance:** export emits the fingerprint; import does not
silently merge or split; inconclusive imports are logged and
default to "mint new + log"; soak review confirms `≡_substrate-relevant` holds on a 50-scheme sample import → export → import.

### Phase 4d — Catalogue audit pass (one-shot)

1. Write a one-shot script `scripts/audits/audit-catalogue-redundancy.ts`
   that runs the verifier over all pairs in the catalogue
   (quadratic but bounded; the catalogue is small enough that
   even O(N²) ≈ 10⁴ calls is feasible if each call is < 100ms).
2. Commit the output as `audits/catalogue-redundancy-<DATE>.json`
   listing every `equal` and `subset` pair.
3. File a follow-on Q-NNN or implementation issue for each
   identified duplicate, owned by the schemes-track maintainer.

**Acceptance:** audit committed; follow-ons filed.

## §6 Acceptance criteria

### Phase 4a accepts iff

- [ ] `verifyBehaviourEquality` returns the documented verdict
      shape for the unit-test fixtures.
- [ ] `computeBehaviourFingerprint` is a pure function (same input
      → same output across runs); ≥ 1 test pinning the digest of a
      canonical fixture.
- [ ] `POST /api/schemes/verify-equality` returns 200 with the
      verdict and 401/404 on auth/missing-scheme.
- [ ] Manual cross-check of 5 production pairs matches the
      verifier's verdicts.

### Phase 4b accepts iff

- [ ] `SchemeNonRedundancyPanel` renders inside `SchemeCreator`.
- [ ] Button-driven (no per-keystroke calls).
- [ ] `nonRedundancyJustification` field migrated; populated when
      admin proceeds despite a warning.
- [ ] Soak telemetry: latency < 2s p95; ≥ 1 real duplicate
      surfaced and acted on.

### Phase 4c accepts iff

- [ ] AIF export emits `mesh:behaviourFingerprint`.
- [ ] AIF import respects the fingerprint and invokes the
      verifier.
- [ ] No silent-merge / silent-split incidents in the post-soak
      review.
- [ ] Import logs contain inconclusive verdicts where the
      verifier could not decide.

### Phase 4d accepts iff

- [ ] One-shot script lands; output committed.
- [ ] Follow-on Q-NNN or implementation issue filed per identified
      pair.
- [ ] Catalogue-redundancy markdown summary committed with the
      same shape as the Spec 5 audits.

## §7 Open risks

- **R1 — `inconclusive` is the most common verdict.** Text
  normalisation and premise unification are the verifier's weakest
  links; on a noisy catalogue, the verifier may return
  `inconclusive` more often than `equal` / `incomparable`.
  *Mitigation:* tighten `textNormalisation` only after seeing
  phase 4a's cross-check results; the verifier's job is to be
  *sound* (no false `equal`s), not *complete*.
- **R2 — False positives on the non-redundancy panel.** If the
  verifier returns `equal` for two genuinely-different schemes
  (false positive), the admin loses trust in the panel.
  *Mitigation:* the verifier is conservative — it returns `equal`
  only with a full certificate covering the CQ-bundle, premise
  unification, and inheritance. The `nonRedundancyJustification`
  field captures admin disagreement and is the input to
  recalibration.
- **R3 — Fingerprint collisions.** A weak digest could produce
  spurious "candidate" matches that the verifier then has to
  reject. *Mitigation:* sha256 of a structured canonical digest
  (sorted CQ-bundle structural fields + arity counts) makes
  collisions vanishingly improbable; even if one occurs, the
  verifier catches it.
- **R4 — Catalogue scan latency at AIF import.** Imports of large
  AIF documents with many schemes do N catalogue lookups.
  *Mitigation:* materialise the fingerprint as an indexed column
  if AIF-import latency becomes a problem (additive schema change,
  filed as follow-on when measurements warrant).
- **R5 — Composition not covered.** Q-015's soundness-of-
  concatenation is research-open; the verifier does not decide
  $\llbracket S_1; S_2 \rrbracket = \llbracket S_3 \rrbracket$.
  *Mitigation:* documented as out of scope; the verifier API
  shape leaves room for a future `verifyCompositionEquality`
  function that depends on Q-015's resolution.
- **R6 — Verifier becomes an attack surface.** A maliciously
  crafted scheme submission could attempt to exhaust the
  verifier's search bound or trigger pathological unification.
  *Mitigation:* the `searchBoundMs` cap is hard; the endpoint is
  authenticated; rate-limiting on `POST /api/schemes/verify-
  equality` is filed as a security follow-on (not a phase 4
  blocker since the verifier is admin-only).

## §8 Dependencies

**Upstream (research):**

- [T003](../../RESEARCH_PROGRAMME/02_THEOREMS_AND_PROOFS/T003-schemes-layered-coherence.md) (the non-injectivity of $\mathcal{B}$ that motivates certificate-based equality)
- [Q-021](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md) (the open question this spec operationalises; the spec's verifier is route (b) of Q-021's resolution)
- [`SCHEMES_ONTOLOGY_DECISION.md`](SCHEMES_ONTOLOGY_DECISION.md) §3.2 (non-injectivity proof), §8.7 (decidability question)

**Upstream (specs):**

- [Spec 2](SCHEMES_IMPL_ADMIN_TIGHTENING.md) phase 2a+ — stable C007
  presentations that the verifier can reason over.
- [Spec 3](SCHEMES_IMPL_PROTOCOL_SOUNDNESS.md) phase 3a+ — the verifier
  treats protocols as a black box; phase 3a ensures protocols are
  sound-by-enforcement so the verifier never has to consider an
  "unsound C008 layer" case.
- [Spec 5](SCHEMES_IMPL_AUDIT_PROTOCOLS.md) — Q-020 informs which
  external-catalogue fields participate in the behaviour fingerprint
  (currently scoped to CQ-bundle structure + premise arity; Q-020
  may surface additional structural fields).

**Upstream (code):**

- [`lib/models/schema.prisma`](../../lib/models/schema.prisma)
  (`ArgumentScheme`, `CriticalQuestion`, `SchemeVariant`)
- [`lib/aif/syncArgument.ts`](../../lib/aif/syncArgument.ts)
- [`components/admin/SchemeCreator.tsx`](../../components/admin/SchemeCreator.tsx)
- [`app/api/schemes/`](../../app/api/schemes/) (new
  `verify-equality/route.ts`)

**Downstream:**

- Q-014 catalogue-ontology decision: the verifier's output is one
  empirical input to whether the catalogue behaves as an ontology
  or a folksonomy (a folksonomy is expected to surface many
  `equal` / `subset` verdicts; an ontology should not).
- Q-015 (soundness-of-concatenation): a future
  `verifyCompositionEquality` will reuse this verifier's
  CQ-bundle-matching machinery.

**Out of scope but worth knowing:**

- A general behaviour-equality oracle (the verifier targets
  scheme-shaped behaviours only).
- Catalogue deduplication actions (merge/split rows). This spec
  surfaces information; actions are downstream.
- Public scheme catalogue / publication discipline (out of scope
  per overview §6).
