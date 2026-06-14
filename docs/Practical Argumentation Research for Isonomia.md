# Practical Argument Schema for Isonomia

**Status:** Draft 0.1 — foundation spec for the Lumerian practical-argument family
**Depends on:** existing Argument/Claim/premise model, scheme registry, CQ machinery, challenge protocol, closed monoid registry, culprit-set engine
**Scope:** premise typing, attack surface, DesirabilityProfile object, netting/fold semantics, derived critical questions for the core practical family and the Pascal subfamily, standing and transport qualifiers

---

## 0. Design constraints honored

This spec is written against the platform's existing contracts and does not relax any of them:

1. Premises remain typed `ORDINARY | ASSUMPTION | EXCEPTION`, with `implicit` and `axiomatic` flags. The completeness presupposition is materialized through this existing typing, not a new mechanism.
2. Challenges remain Pollock-typed (`REBUT | UNDERMINE | UNDERCUT`) with admissibility bars that are properties of the question and attack type, never of the filer. One new **non-attack** move is introduced (the sensitivity probe, §4); it deliberately does not extend the attack typology.
3. All fold computation is deterministic and graph-derived: bit-identical output on repeated invocation over the same fixture, same contract as the existing log-odds surface.
4. Standing is reported as a classified dialectical state plus qualifiers, never an opaque score. Truth-support (log-odds) and value-netting (expected desirability) are kept in **separate registers**; no shared currency.
5. Scheme classification stays many-to-many; the practical family composes with existing schemes (an argument can be `practical/instrument-comparative` *and* instantiate Argument from Expert Opinion on one of its consequence premises).

One genuine migration cost is flagged up front: the practical family requires **per-instance critical questions** (one accuracy question per consequence record), where the current model generates CQs statically per scheme. See §6.

---

## 1. DesirabilityProfile

The first-class object that makes practical validity *relativized and auditable* rather than absolute and hidden. Every practical argument nets under exactly one profile version; the conclusion's standing carries the profile id as a qualifier.

```prisma
model DesirabilityProfile {
  id              String   @id @default(cuid())
  scope           ProfileScope        // PERSONAL | DELIBERATION | ROOM | PACKET
  scopeRefId      String              // id of the scoping object
  mode            ProfileMode         // ADEQUACY | CARDINAL | LEXICAL
  aggregation     AggregationRule     // EXPECTED_DESIRABILITY | LAPLACE | MAXIMIN | HURWICZ
  hurwiczAlpha    Decimal?            // required iff aggregation = HURWICZ
  dimensions      ProfileDimension[]
  declaredById    String              // user or institution; AI-declared profiles flagged like AI arguments
  declaredAt      DateTime
  justificationArgumentId String?     // ← the reflexive hook: a practical/adequacy argument
                                      //   justifying this profile, living in the ordinary graph
  version         Int
  supersedesId    String?             // version chain
  contentHash     String              // profile is citable and tamper-evident like any argument
}

model ProfileDimension {
  id              String   @id @default(cuid())
  profileId       String
  label           String              // e.g. "fiscal cost", "participation equity", "implementation risk"
  description     String
  weight          Decimal?            // CARDINAL mode
  rank            Int?                // LEXICAL mode
  isAdequacyCondition Boolean         // ADEQUACY mode: graded/pass-fail condition rather than weight
  boundClaimId    String?             // optional claim: "dimension d merits weight w in scope s"
                                      // bound → the weight is contestable through normal protocol
                                      // unbound → conclusion carries STIPULATED_PROFILE qualifier
}
```

**Design decisions.**

- **Three modes, because Lumer distinguishes three justification procedures.** Quantitative netting (CARDINAL ≈ multi-attribute utility), lexical priority orderings, and adequacy-condition arguments (ADEQUACY) — the qualitative fallback Lumer reserves for cases where quantitative desirability is unavailable, *including the foundational case where the evaluation criteria themselves are what is being justified*. Ship ADEQUACY first: real communities will not supply cardinal weights on day one, and the adequacy mode degrades gracefully into "named conditions, graded fulfillment, dominance comparison."
- **Unbound dimensions are legal, not defective.** A room may stipulate weights without deliberating them. The system's obligation is honesty, not foundations: the conclusion is labeled `STIPULATED_PROFILE`, and the query "where does this evaluation bottom out?" resolves to the stipulation event. This is the direction-1 commitment made structural — the regress is *exposed and addressable*, not terminated.
- **`justificationArgumentId` closes the reflexive loop in one field.** A profile justified by an adequacy argument is a profile whose own evaluation criteria are in the graph, attackable by the same protocol. Room-level gating parameters (confidence mode, thresholds, monoid selection) should eventually point at profiles through the same field.

---

## 2. Netting object and consequence records

The netting is a side-table on the existing `Argument`, so claims, premises, challenges, and provenance stay canonical. The scheme key selects rendering and CQ generation; the netting carries the decision-theoretic structure.

```prisma
model PracticalNetting {
  id              String   @id @default(cuid())
  argumentId      String   @unique
  profileId       String
  profileVersion  Int                 // pinned: re-netting under a new profile version
                                      // is an explicit event, never silent drift
  options         NettingOption[]     // ≥1; ≥2 required for comparative schemes
  completenessAssumptionPremiseId String   // auto-materialized ASSUMPTION premise (§3)
  alternativesAdequacyPremiseId   String?  // comparative schemes only
  foldResultsHash String              // cached deterministic fold output
  contentHash     String
}

model NettingOption {
  id              String   @id @default(cuid())
  nettingId       String
  optionClaimId   String              // the value object: a policy, instrument, rule, design
  intrinsicValuations IntrinsicValuation[]
  consequences    ConsequenceRecord[]
}

model ConsequenceRecord {
  id              String   @id @default(cuid())
  optionId        String
  consequenceClaimId String           // ORDINARY premise: "adopting O leads to c"
  probabilityKind ProbKind            // POINT | BAND | LAPLACE | LAW_REF
  probability     Decimal?            // POINT
  probLow         Decimal?            // BAND
  probHigh        Decimal?
  lawArgumentId   String?             // LAW_REF: probability inherited from a statistical-law
                                      // argument elsewhere in the graph; attacks redirect there
  dimensionId     String              // which ProfileDimension values this consequence
  polarity        Int                 // +1 / −1
  magnitude       Decimal?            // CARDINAL mode
  gradeLabel      String?             // ADEQUACY mode: e.g. FULL | PARTIAL | FAIL
  orientationRelevant Boolean @default(false)  // Pascal restriction flag (§6, PAS-CQ4)
}
```

**Design decisions.**

- **Probability claims are ordinary graph citizens.** `LAW_REF` is the important kind: a consequence whose probability rests on a statistical law argued elsewhere inherits that argument's standing, and an attack on the probability *redirects* to the law's argument rather than duplicating the dispute. This is Lumer's structure exactly — practical arguments contain probabilistic components with their own validity conditions — and it reuses your chain machinery (the law argument is a link; weakest-link reporting applies).
- **Profile version is pinned per netting.** When a profile is revised, dependent nettings are flagged stale, not silently recomputed. Re-netting is a logged event with a diff — same discipline as your snapshot-and-diff over cited states.

---

## 3. Premise typing and attack surface

The core of the spec. Each premise class maps to an existing Isonomia premise type, takes a defined subset of attacks, with a defined admissibility bar and named exits.

| Premise | Type | Attacks | Admissibility bar | Exits |
|---|---|---|---|---|
| Consequence claim ("O leads to c") | `ORDINARY` | rebut, undermine | evidence required for undermine (existing rule) | standard claim resolution |
| Probability (POINT/BAND) | `ORDINARY` | undermine | evidence required | standard |
| Probability (LAW_REF) | `ORDINARY` (inherited) | — | — | redirect to law argument |
| Valuation entry (bound dimension) | `ORDINARY` | rebut, undermine | standard | standard; or redirect to profile deliberation if one exists |
| Valuation entry (unbound dimension) | not attackable in-argument | — | — | sensitivity probe only (§4); conclusion already qualified `STIPULATED_PROFILE` |
| **Completeness presupposition** | `ASSUMPTION`, `implicit`, auto-materialized | **undermine-by-instantiation** | challenger must (a) name a candidate consequence as a claim, (b) assert its relevance under ≥1 active profile dimension | **incorporate-and-renet** / **reject-existence** (evidence dispute on the named consequence) / **reject-relevance** (adjudicated against profile dimensions, §3.1) |
| **Alternatives-set adequacy** (comparative only) | `ASSUMPTION`, `implicit` | undermine-by-instantiation | challenger must sketch the alternative to nettable minimum: option label + ≥1 consequence record *or* adequacy-grade sketch | **incorporate-and-renet** / **reject-feasibility** / **reject-distinctness** (alternative collapses into an existing option) |
| Profile binding ("netted under P v.n") | `AXIOMATIC` | none (Pollock) | — | sensitivity probe (§4); or a practical/adequacy argument *against the profile object itself*, which propagates |
| Netting + argmax step | strict rule | none | — | machine-checked logicality predicate; failure is a bug-class flag, not a dialectical state |
| Pascal: no-evidence condition (PP3) | `EXCEPTION` | undermine-with-evidence | evidence required (existing bar) | **FATAL**: argument marked `PASCAL_INVALID`, not merely defeated (§8) |
| Pascal: partition premise (PP1) | `ORDINARY` + optional deductive certificate | undermine-by-instantiation ("here is a world outside your partition") | the instantiated world must be specified against the partition's construction variables | incorporate (repartition) / reject (deductive proof of coverage, automatic when permutation-constructed) |

Three structural points:

**3.1 Relevance is profile-relative — and that is a feature.** When a completeness challenger names a missed consequence, the proposer may exit via *reject-relevance*: the consequence values no active dimension. This makes the relevance dispute *adjudicable* rather than vibes-based — it resolves against a finite, declared dimension list. Default burden rule: once a consequence is admissibly instantiated, the burden of the relevance rejection falls on the rejector (the challenger already met their bar). A contested relevance rejection escalates to a mini adequacy argument about whether the profile is missing a dimension — which is exactly where that dispute belongs, because "your evaluation ignores X" is an attack on the *evaluation criteria*, not on the netting arithmetic.

**3.2 The completeness assumption is never satisfied, only unrefuted.** It is auto-materialized as implicit, carries no proponent burden, and its CQ (PRC-CQ1) initializes to a distinct state `OPEN_UNREFUTED` rather than `SATISFIED` — making Lumer's point structural: completeness cannot be positively proven, so the system should not represent it as proven. The argument participates in grounded-extension computation normally; an admissibly attacked and undefended completeness assumption takes the argument out, exactly as ASPIC+ assumption-attack semantics requires. This is the dialectical resolution of the unprovability problem, in the data model.

**3.3 The defeasible body / strict top split mirrors Lumer.** Everything feeding the netting is defeasible and attackable; the netting fold and the comparative argmax are strict, machine-checked, and not dialectically contestable (you do not get to *argue* with arithmetic — you attack its inputs, or you attack the aggregation rule via PRC-CQ7). This is Lumer's instrument-justification structure: practical evaluations per object, a deductive optimality step on top.

---

## 4. The sensitivity probe — a non-attack dialogue move

```
PROBE_PROFILE(argumentId, alternativeProfileId) →
  { result: STABLE | FLIPS,
    divergence: TypedDivergenceLocus[] }   // when FLIPS
```

The engine re-nets deterministically under the alternative profile. A **flip is not a defeat** — it is a typed-disagreement datum: it demonstrates that the conclusion is sensitive to an evaluative parameter, and locates exactly which one. To convert a probe result into an actual attack, the prober must argue that the *active* profile is inadequate — a practical/adequacy argument filed against the profile object — which then propagates to dependent nettings through the staleness mechanism.

**Why a new move rather than a fourth attack type:** Pollock attacks dispute an argument's premises, conclusion, or inference. A probe disputes none of these; the netting under P is correct, and the netting under P′ is also correct. The disagreement lives in *which profile binds*, which is a different object. Keeping the probe outside the attack typology keeps your Pollock surface clean and keeps the scheme-rivalry conjecture (your candidate fourth category) uncontaminated by a case that is really profile-rivalry.

**Integration with the minimal-disagreement extractor.** Probe output feeds divergence-locus typing:

- `FACTUAL` — parties diverge on a consequence or probability claim (resolvable by evidence; route to citation machinery)
- `EVALUATIVE` — parties diverge on a dimension weight or dimension membership (resolvable, if at all, by profile deliberation; route to facilitation)
- `STRUCTURAL` — parties diverge on the alternatives set or, in Pascal cases, the partition (resolvable by instantiation moves)

A facilitator cockpit that displays *which kind* of disagreement the room has — before anyone burns a session arguing facts when the dispute is values — is the single most practitioner-visible payoff of this entire spec.

---

## 5. Fold semantics — the desirability register

Registered in the closed monoid registry alongside log-odds, min, and product, but in a **separate register**: truth-support and value-netting never share a currency. Reusing log-odds for desirability would be a category error made structural; the spec forbids it.

**5.1 CARDINAL / EXPECTED_DESIRABILITY.** Per `(option, profile)` pair, fold over consequence records:

```
contribution(r) = p(r) × weight(dimension(r)) × polarity(r) × magnitude(r)
fold = Σ contributions + Σ intrinsic valuations
```

Commutative, associative, identity 0 — a lawful commutative monoid over signed contributions. `BAND` probabilities fold to an interval `[foldLow, foldHigh]`; interval overlap between options yields the honest output `INCOMPARABLE_UNDER_UNCERTAINTY` rather than a forced ranking.

**5.2 ADEQUACY.** Fold is multiset union of `(condition, grade)` pairs per option; comparison is dominance (option A weakly exceeds B on every condition, strictly on one) with lexical tie-breaking if the profile declares ranks. The comparison is a **partial order**: `INCOMPARABLE` is a first-class result, surfaced explicitly — the evaluative analog of your search surface's refusal to collapse empty states.

**5.3 The comparative step lives outside the fold.** Optimality ("O₁ is best among the considered alternatives") is a strict argmax/dominance comparison over per-option fold results — a deductive step, machine-checked, conditioned on the completeness and alternatives-adequacy assumptions remaining unrefuted.

**5.4 Uncertainty variants (Pascal and beyond).** `LAPLACE` (uniform over partition cells — the Pascal default), `MAXIMIN`, and `HURWICZ(α)` are registered as fold/comparison pairs. PRC-CQ7 (§6) makes the *choice of aggregation rule* contestable — "expected value is the wrong rule for catastrophic-risk contexts; use maximin" is a legitimate, typed move, not an out-of-band complaint.

**5.5 Evaluative culprit sets.** The canonical query generalizes: alongside *"what must I retract to reject this claim?"* the desirability register answers *"which consequence claims, probability assignments, or dimension weights must I revise, minimally, for this recommendation to flip?"* Deterministic ranking, bit-identical contract test on fixtures, same as the existing culprit engine. For deliberative-democracy deployments this query is arguably worth more than its alethic sibling: it mechanically locates whether a recommendation's opponents need to win a factual fight or admit a value difference.

---

## 6. Derived critical questions

CQs in this family are not curated; they are **derived from the validity conditions of the practical epistemological principle**, one per condition. This is the generative upgrade to the CQ model: scheme identity = CQ set becomes a theorem (the CQs *are* the validity conditions), and your univalence formulation gains its missing *why*.

**Migration cost, stated honestly:** PRC-CQ2/3 instantiate **per consequence record**, and PRC-CQ5 per named alternative. The current model generates CQs statically per scheme; this family needs per-argument CQ instantiation keyed to netting rows. The CQ data model needs an `instanceRefId` column and a generation hook on netting writes. Everything else in this spec reuses existing machinery; this is the one schema change with real surface area.

### 6.1 Core practical family

| CQ | Question template | Targets | Attack mapping | Burden | Machine assist |
|---|---|---|---|---|---|
| PRC-CQ1 | Are all consequences relevant under profile P covered? | completeness assumption | undermine-by-instantiation | challenger | initializes `OPEN_UNREFUTED`, never `SATISFIED` |
| PRC-CQ2 (per record) | Does O in fact lead to c? | consequence claim | rebut / undermine | challenger (evidence bar) | citation resolver |
| PRC-CQ3 (per record) | Is p(c) adequately supported? | probability premise | undermine; LAW_REF → redirect | challenger | redirect resolution |
| PRC-CQ4 | Is the weight on dimension d justified? | bound valuation claim | rebut; or redirect to profile deliberation | challenger | redirect; unbound → probe-only, `STIPULATED_PROFILE` already set |
| PRC-CQ5 (comparative; per instantiation) | Is there an unconsidered alternative that nets higher? | alternatives-adequacy assumption | undermine-by-instantiation | challenger (nettable-minimum bar) | engine pre-nets the sketch |
| PRC-CQ6 | Does O carry intrinsic (dis)value beyond its consequences? | intrinsic valuation slots | rebut | challenger | — |
| PRC-CQ7 | Is the aggregation rule appropriate to this decision context? | profile.aggregation | escalates to profile adequacy argument | challenger | engine offers side-by-side re-fold under proposed rule |
| PRC-CQ8 | Is the netting arithmetically correct? | fold + argmax | none (strict) | — | fully machine-checked; failure = bug flag |

### 6.2 Pascal subfamily (`practical/pascal`)

Adds, per Lumer's PP1–PP5 plus the direction-1 refinement:

| CQ | Question template | Validity condition | Semantics |
|---|---|---|---|
| PAS-CQ1 | Is the partition {p₁…pₙ} exhaustive and mutually exclusive? | PP1 | deductive certificate when permutation-constructed (auto-`SATISFIED` with proof ref); otherwise open to instantiation attack |
| PAS-CQ2 | Does the database contain theoretical evidence for or against any pᵢ? | PP3 | **fatal on YES**: per Lumer, available evidence does not weaken a Pascal argument, it *invalidates* it — the standing label is `PASCAL_INVALID`, distinct from defeated/OUT (§8) |
| PAS-CQ3 | Does the optimality of as-if-p₁ survive every admissible partition? | partition-invariance (our refinement; not in Lumer) | machine-assisted: enumerate coarsenings/refinements within the consequence-relevance quotient (records with identical consequence profiles over available acts merge — the Savage small-worlds discipline); survival across the lattice grants the `REINFORCED` qualifier; failure surfaces the offending partition as a `STRUCTURAL` divergence locus |
| PAS-CQ4 | Are only orientation-relevant consequences counted? | Lumer's restriction of Pascal arguments to epistemic/orientation consequences | filter on `orientationRelevant`; records failing the flag are challengeable for exclusion |
| PAS-CQ5 | Can the agent in fact regularly sustain as-if-p₁ behavior? | PP4's regularity condition | ordinary feasibility premise; rebut/undermine |

**Enumeration cost, stated honestly:** the partition lattice is exponential in the worst case. The consequence-relevance quotient collapses most of it; beyond that, cap the enumeration and report `REINFORCED(bounded, n partitions checked)` rather than pretending exhaustiveness — the same honesty discipline as the synthetic readout.

### 6.3 Welfare-ethical variant (`practical/welfare-ethical`)

Identical structure with one added constraint and one added CQ: the bound profile must be a welfare-aggregation criterion (dimensions are per-affected-party desirabilities plus an aggregation form), and **WEL-CQ1** asks whether the welfare criterion itself is justified — redirecting to the criterion's own justification argument, which is a `practical/adequacy` argument by necessity (Lumer: foundational evaluation criteria can only be justified by adequacy-condition arguments; the quantitative machinery presupposes them).

---

## 7. Scheme registry entries

| Key | Conclusion form | Required slots | Notes |
|---|---|---|---|
| `practical/evaluation` | value judgment about one object: "O is good/bad/acceptable w.r.t. P" | 1 option, ≥1 consequence or intrinsic valuation, completeness assumption, profile binding | the elementary form |
| `practical/instrument-comparative` | optimality: "O₁ is the best of {O₁…Oₖ} for standard output S under P" | ≥2 options, alternatives-adequacy assumption, all of the above | the TIH10/TTC7 form; feeds recommendation packets |
| `practical/adequacy` | comparative judgment via condition fulfillment | adequacy-mode profile, graded records | the qualitative fallback **and** the foundational form (profiles justify themselves through this scheme — the regress's documented landing point) |
| `practical/welfare-ethical` | moral value judgment | welfare-criterion profile | adds WEL-CQ1 |
| `practical/pascal` | "epistemically optimal to behave as if p₁" | partition, PP3 exception premise, LAPLACE aggregation, orientation filter | the ontic-practical form; fatal-invalidity semantics |

Composition notes: comparative conclusions are the natural payload of **recommendation packets** — a packet should carry (or reference) the netting, the profile, the alternatives set, and the live attack register, so the receiving institution inherits the evaluation structure, not just the verdict. Chain integration: when a practical argument is a chain link, weakest-link reporting must treat unrefuted-but-attacked completeness assumptions as link exposure.

---

## 8. Standing qualifiers and transport

Standing classification (IN / OUT / contested / undecided) is unchanged. Practical arguments add orthogonal **qualifiers**:

- `PROFILE_RELATIVE(profileId, version)` — always present; the conclusion is a conclusion-under-P
- `STIPULATED_PROFILE` — ≥1 unbound dimension in the binding profile
- `REINFORCED` / `REINFORCED(bounded, n)` — Pascal arguments surviving partition-invariance
- `PASCAL_INVALID` — PP3 violated; rendered distinctly from OUT, because the cure is different (the argument type is inapplicable; the proponent should argue *from the evidence* instead)
- `STALE_PROFILE` — binding profile superseded; re-netting pending

**Transport (Plexus) rule, by epistemological type:**

| Type | Relativization parameter | Transport behavior |
|---|---|---|
| deductive | none (monotonic) | free |
| probabilistic | evidence database *d* | compatibility check against target room's evidence base; downgrade or flag on mismatch |
| practical | desirability profile *P* | one of: target adopts P (declared) · engine re-nets under target's profile (flip ⇒ flagged) · import with `PROFILE_DIVERGENT` flag |

This is the semantic refinement of the monodromy result: epistemological type *predicts* where transport drift lives. The one-hop contract is unchanged; this typing explains, after the fact, which arguments ever needed it.

---

## 9. Open design questions

1. **Relevance adjudication default.** §3.1 places the burden of a relevance rejection on the rejector once a consequence is admissibly instantiated. Alternative: room-configurable burden. Recommend shipping the fixed default; configurability invites burden-shopping.
2. **Cardinal elicitation UX.** Out of scope here, but the spec's bet is that ADEQUACY mode carries most real deliberations and CARDINAL is opt-in for rooms that want it (policy analysis, engineering tradeoffs).
3. **Ludics extension.** The completeness assumption is a standing concession locus — a directory every Opponent design may visit. Conjecture: the grounded ⇔ orthogonality keystone extends to frameworks containing practical arguments, since assumption-attacks compile to ordinary attack edges; what needs checking in the mechanization is whether **strategy preservation** respects the concession locus (the Proponent's design must answer instantiation visits with one of the named exits, which are themselves moves). A bounded-fuel version over the finite fragment looks provable with the existing Agda apparatus.
4. **Probe results and social scores.** Recommend strictly no coupling: a conclusion's sensitivity to profile choice is information, not a demerit, and letting probes move social scores would re-mix the currencies §0 separates.
5. **Profile inheritance across scope.** When a deliberation has no profile, does it inherit the room's? Recommend explicit adoption (one action, logged) over silent inheritance — consistent with the platform's reversible-upgrade idiom.

---

## 10. What this buys, restated in one paragraph

The platform gains a native representation for the argument type its highest-stakes outputs already are: recommendations, evaluations, design decisions. The unprovable completeness condition becomes an attackable assumption premise with named exits (the epistemological problem dissolved dialectically); critical questions become derivable rather than curated (scheme identity = validity conditions, as a theorem); value disagreement becomes mechanically separable from factual disagreement (probes + typed divergence loci); recommendations become sensitivity-analyzable (evaluative culprit sets); and every evaluation's relativization to a desirability base is exposed, versioned, citable, and contestable — which is both the philosophically defensible position on where practical justification bottoms out, and the same honesty-by-architecture standard the rest of the platform already enforces.