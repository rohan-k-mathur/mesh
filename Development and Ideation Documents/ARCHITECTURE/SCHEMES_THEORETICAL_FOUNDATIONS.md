# Schemes — Theoretical Foundations

**Status:** opened 2026-05-27. Bridges the `/admin/schemes` codebase
([`app/admin/schemes/page.tsx`](../../app/admin/schemes/page.tsx),
[`components/admin/SchemeList.tsx`](../../components/admin/SchemeList.tsx),
[`components/admin/SchemeCreator.tsx`](../../components/admin/SchemeCreator.tsx),
[`components/admin/SchemeHierarchyView.tsx`](../../components/admin/SchemeHierarchyView.tsx))
to the research programme at
[`RESEARCH_PROGRAMME/`](../../RESEARCH_PROGRAMME/00_CHARTER.md).

**Companion entries in the programme:**

- Open questions:
  - Argumentation-scheme cluster: [Q-011](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md) (Pollock trichotomy), Q-012 (inheritance), Q-013 (taxonomy → CQ), Q-014 (ontology vs folksonomy), Q-015 (composition as cut).
  - Literature-review follow-on cluster (filed 2026-05-27): Q-016 (scheme-rivalry as fourth attack), Q-017 (CQ-of-CQ recursion), Q-018 (OntoClean meta-properties), Q-019 (`inheritCQs: false` semantics), Q-020 (catalogue field audit).
- Conjectures: [C006 — scheme-as-behaviour](../../RESEARCH_PROGRAMME/03_CONJECTURES/C006-scheme-as-behaviour.md), [C007 — scheme-as-design-schema](../../RESEARCH_PROGRAMME/03_CONJECTURES/C007-scheme-as-design-schema.md), [C008 — scheme-as-protocol-constraint](../../RESEARCH_PROGRAMME/03_CONJECTURES/C008-scheme-as-protocol-constraint.md), [C009 — scheme-rivalry as fourth attack](../../RESEARCH_PROGRAMME/03_CONJECTURES/C009-scheme-rivalry-fourth-attack.md). C006/C007/C008 stand in a trilemma whose resolution is the subject of `SCHEMES_ONTOLOGY_DECISION_PROMPT.md` (the resolution may be *layered* rather than *mutually exclusive*; see §1.1 below). C009 is *independent of* the trilemma.
- Empirical studies: [S004 — scheme-assignment agreement](../../RESEARCH_PROGRAMME/04_EMPIRICAL_STUDIES/S004-scheme-assignment-agreement.md); [S005 — pattern-vs-content classifier ablation](../../RESEARCH_PROGRAMME/04_EMPIRICAL_STUDIES/S005-scheme-pattern-ablation.md); [S006 — κ conditional on identification-pattern match](../../RESEARCH_PROGRAMME/04_EMPIRICAL_STUDIES/S006-scheme-kappa-conditional-on-pattern.md).
- Literature pass: [`SCHEMES_LITERATURE_REVIEW.md`](SCHEMES_LITERATURE_REVIEW.md) (delivered 2026-05-27).

**Why this document exists.** The schemes admin is the most theoretically
loaded surface in the product — every form field encodes a commitment
about what a Walton scheme *is*, and the page has accreted features from
at least four traditions (Walton 1996 → Walton-Reed-Macagno 2008,
Macagno-Walton 2015 taxonomy/clustering, Kienpointner 1992 epistemic
mode, ASPIC+ premise typing, Pollock 1995 attack typology, AIF-RA
identification) that have never been reconciled in the literature, let
alone in code. This file names the implicit theory the admin currently
asserts, makes the load-bearing choices visible, and points each open
question to the programme entry that owns it.

---

## §1.1 Reading-A/B/C disclosure — the C006/C007/C008 trilemma has no published precedent

The literature pass ([`SCHEMES_LITERATURE_REVIEW.md`](SCHEMES_LITERATURE_REVIEW.md)
Appendix A row SC4) confirms: **no published source poses, let alone
adjudicates, the C006/C007/C008 trilemma.** All extant treatments —
Walton 1996, WRM 2008, Macagno-Walton 2015, AIF (Chesñevar et al. 2006),
ASPIC+ (Modgil-Prakken 2014), DefLog (Verheij 2003), Wagemans PTA — are
representational. None treats schemes as $\perp\!\perp$-closed behaviours
of designs, none formalises schemes as locus trees with typed holes, and
none identifies the scheme with a protocol fragment. The Ludics-meets-
Walton sub-bucket (Lecomte-Quatrini 2009/2011, Fouqueré-Quatrini
2012/2013) applies Ludics to dialogue acts and natural-language
semantics, *not* to Walton schemes.

**Working prior (not a verdict).** The literature pass's §1 recommends a
**layered position**: C006 is the *semantic ground truth* (behaviours
as the primary semantic object, forced by Reading C), C007 is the
*syntactic presentation* (the locus tree with holes is how a scheme is
communicated and stored), C008 is the *protocol surface* (the obligation
pattern the scheme adds to the room once invoked). If the layered
position is coherent, the three conjectures are complementary, not
mutually exclusive, and the C006-as-ontological-primitive reading is
recovered as the bottom layer.

**This prior is original to this track** (SC4) and has no published
backing — Brandom 1994 inferentialism and Peregrin 2014 supply
philosophical motivation only (SC25 partial confirmation). The decision
session governed by [`SCHEMES_ONTOLOGY_DECISION_PROMPT.md`](SCHEMES_ONTOLOGY_DECISION_PROMPT.md)
is required to test the prior independently and may land on any of three
outcomes (layered coherent / trilemma real with C006 winning / trilemma
real with C006 losing).

Until the decision session returns its verdict, the programme treats the
trilemma as **open**: §2 Cluster A below still names C006/C007/C008 as
rivals; the conjecture files still carry their `mutually-exclusive-with`
lines.

---

## §1 The implicit theory the admin commits to

Reading the form fields of [`SchemeCreator.tsx`](../../components/admin/SchemeCreator.tsx)
as an axiom set, the admin currently asserts six load-bearing things:

1. **A scheme is a tuple.** ⟨Walton/Macagno taxonomy (`purpose`, `source`,
   `materialRelation`, `reasoningType`, `ruleForm`, `conclusionType`),
   epistemic mode (Kienpointner — `epistemicMode`), formal structure
   (Walton premises + conclusion with `variables` arrays), CQ-bundle
   (`{cqKey, text, attackType, targetScope, burdenOfProof,
   requiresEvidence, premiseType}[]`), identification conditions
   (`identificationPatterns`, `whenToUse`), cluster position
   (`parentSchemeId`, `clusterTag`, `inheritCQs`)⟩.

2. **Pollock's attack-type trichotomy is exhaustive.** The `attackType`
   field admits only `REBUTS | UNDERCUTS | UNDERMINES`. Every CQ targets
   exactly one of premise / inference / conclusion via `targetScope`. No
   epistemic-undercutter, no audience-undercutter, no scheme-rivalry
   attack is expressible.

3. **Inheritance is monotonic set-extension.** A child scheme's effective
   CQ-bundle is `parent.cqs ∪ child.cqs` whenever `inheritCQs` is true;
   the UI exposes no override, no refinement, and no conflict detection
   between inherited and child-declared CQs.

4. **Taxonomy functionally determines a baseline CQ set.** The "Generate
   from Taxonomy" button asserts that the six taxonomy fields, together
   with the scheme key, are sufficient inputs to a deterministic
   CQ-generator ([`lib/argumentation/cqGeneration.ts`](../../lib/argumentation/cqGeneration.ts)
   `generateCQsFromTaxonomy`). The natural-language CQ text is treated as
   downstream of taxonomy.

5. **The scheme catalogue is open.** Admin users can mint arbitrary new
   schemes via `POST /api/schemes`. The only well-formedness checks
   enforced are: lowercase-underscore key, non-empty name, non-empty
   summary, at least one CQ. No non-vacuity check (`⟦S⟧ ≠ ∅`), no
   non-redundancy check against the existing catalogue, no
   cluster-conservativity check, no locative-coherence check.

6. **A scheme has a single identity across time.** Schemes are mutable
   rows on `argument_scheme`. Edits to a scheme retroactively re-define
   what existing instances of that scheme "instantiated." There is no
   `argument_scheme_version` table, no scheme-version field on
   `argument_scheme_application`, no migration when a parent scheme's CQs
   change.

Each is a falsifiable claim. None are currently justified in the
programme.

---

## §2 Six clusters worth opening

The substrate's §0 framing
([`RESEARCH_PROGRAMME/00_CHARTER.md`](../../RESEARCH_PROGRAMME/00_CHARTER.md)
§0 Framing: Argumentation as Interaction) says argumentation is an
*interaction* problem, not a *representation* problem. The schemes admin,
inherited from a representation-first lineage (Walton, AIF, ASPIC+), has
to be re-grounded against that framing. The six clusters below are the
re-grounding work.

### Cluster A — Ontology: what *is* a scheme in the interaction-first substrate?

The Walton tradition treats a scheme as a defeasible inference template;
AIF as a graph node type (RA); ASPIC+ as a defeasible rule with typed
premises. None of these survives intact under the substrate's commitment
to interaction-first semantics. Three candidate replacements, each with
different downstream consequences:

- **Scheme-as-behaviour** ([C006](../../RESEARCH_PROGRAMME/03_CONJECTURES/C006-scheme-as-behaviour.md)).
  `⟦S⟧ ⊆ Designs` is the ⊥⊥-closed set of proponent designs that survive
  every CQ played as opponent. *Consequence:* scheme identity is
  extensional; two schemes with the same CQ-orthogonal set are the same
  scheme regardless of taxonomy.
- **Scheme-as-design-schema** ([C007](../../RESEARCH_PROGRAMME/03_CONJECTURES/C007-scheme-as-design-schema.md)).
  A locus tree with typed holes for premise variables plus a CQ-bundle.
  *Consequence:* scheme identity is intensional and structural; membership
  is decidable by unification; the admin's `variables: string[]` field on
  each premise becomes load-bearing.
- **Scheme-as-protocol-constraint** ([C008](../../RESEARCH_PROGRAMME/03_CONJECTURES/C008-scheme-as-protocol-constraint.md)).
  A fragment of the room's dialogue protocol that, once a proponent
  declares scheme application, extends the protocol with locus
  obligations and opponent rights. *Consequence:* schemes live in the
  room's protocol layer, not in any single argument; identification
  patterns become protocol triggers; the admin's `burdenOfProof` /
  `requiresEvidence` / `premiseType` fields become protocol clauses, not
  metadata.

C006/C007/C008 are mutually exclusive. The admin currently behaves *as
if all three are simultaneously true*, which is incoherent if pressed.
The programme owes a decision.

### Cluster B — CQs as opponent loci: what is a critical question, formally?

In Walton, a CQ shifts the burden of proof. In the substrate, the natural
reading is that a CQ is a *required opponent locus* — a sub-locus the
proponent must be prepared to defend at, and that the opponent has the
right to play. This opens:

- [**Q-011**](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md):
  is the Pollock REBUTS/UNDERMINES/UNDERCUTS trichotomy exhaustive for
  the substrate? The literature pass
  ([`SCHEMES_LITERATURE_REVIEW.md`](SCHEMES_LITERATURE_REVIEW.md) §3
  Bucket 2, Appendix A row SC6) confirms: **no post-2015 source proposes
  a fourth Pollock-style attack category.** Hahn & Hornikx 2016 propose
  Bayesian grading within the trichotomy; Amgoud & Nouioua 2015 propose
  reductive collapse to one relation; Tiozzo 2024 sub-divides category 2
  (substantive vs structural undercutting) but adds no fourth category;
  Doutre-Herzig-Perrussel's 2023 epistemic-argumentation line adds modal
  extensions to Dung frameworks but, on best available evidence, does not
  add a fourth attack type. The substrate's candidate fourth category —
  **scheme-rivalry** (`⟦S₁⟧ ∩ ⟦S₂⟧ = ∅` without any Pollock primitive
  applying) — is therefore original to this track and has been promoted
  to its own conjecture entry: [C009](../../RESEARCH_PROGRAMME/03_CONJECTURES/C009-scheme-rivalry-fourth-attack.md)
  + [Q-016](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md).
  C009 is *independent of* the C006/C007/C008 trilemma — each ontology
  admits the fourth category restated in its native vocabulary
  (behaviour-intersection emptiness / locus-tree disjointness / protocol
  incompatibility) — and its resolution should not be smuggled into the
  trilemma's decision session.
- [**Q-017**](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md):
  does the CQ-of-CQ regress terminate, and is the answer
  ontology-dependent (C006/C007/C008)? Walton & Godden 2005 OSSA §6
  raises the question; Hernández 2023 separates CQs from schemes but does
  not give a recursive structure; under C006 the recursion is natural
  (CQs are themselves designs with their own orthogonals) but unproven.
- *Substrate ↔ ASPIC+ premise-typing mismatch.* The admin's
  `burdenOfProof` field (`PROPONENT | CHALLENGER`) and ASPIC+'s
  `premiseType ∈ {ORDINARY, ASSUMPTION, EXCEPTION}` (Modgil-Prakken 2014)
  type **different objects**: ASPIC+'s typing is *rule-static* (a
  property of the knowledge base — which premises can be undermined),
  while the admin's `burdenOfProof` is *procedure-dynamic* (a property of
  the dialogical obligation — who must defend what in which turn). The
  literature pass (Appendix A row SC9) finds Walton & Godden 2005 §5
  observes the underlying misalignment but does not frame it as a typing
  error; the substrate's framing is the sharpest version. The admin
  currently uses **both** without distinguishing them, which conflates
  knowledge-base state with dialogue state. The bug is implementation-
  side, the theoretical clarification is owed by this document; flagged
  here, deferred to the decision session for principled resolution
  alongside the trilemma.

### Cluster C — Inheritance and hierarchy: what is a child scheme?

The admin allows `parent → child` relationships with the `inheritCQs`
flag. [**Q-012**](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md)
asks which of three candidate semantics it commits to:

- **Set-theoretic** — `child.CQs ⊇ parent.CQs` (current behaviour as far
  as the +inherited badge indicates).
- **Lattice-theoretic** — `⟦child⟧ ⊆ ⟦parent⟧` in the behaviour
  refinement order; child's behaviour is more specific. Compatible with
  C006.
- **Categorical** — schemes form a category with morphisms =
  scheme-refinements; "child" is one such morphism; `cluster_family` is
  the connected component.

These have different consequences. Under set-theoretic, a child can have
*strictly fewer* satisfying arguments than its parent (inheritance
enlarges the CQ-bundle, shrinks the behaviour). The admin does **not**
currently check that a child's behaviour is non-empty — a scheme can be
defined that no argument can satisfy, and the UI will accept it. This is
a verifiable bug under any of the three semantics; it is only the
*severity* that depends on the choice.

### Cluster D — Identification: what does "this argument instantiates scheme S" mean?

The admin's `identificationPatterns` field treats scheme assignment as
string-pattern matching. This is a strong empirical claim with
alternatives:

- **Declaration** — scheme assignment is whatever the author says it is
  (current chain-editor behaviour).
- **MAP inference** — scheme is the argmax under a probabilistic
  classifier (Lawrence-Reed 2015, Visser et al. 2020).
- **Derived from behaviour-membership** — an argument instantiates `S`
  iff its design lies in `⟦S⟧` (only well-formed under C006).
- **Hybrid** — declaration with optional post-hoc behaviour check.

The pattern-matching commitment is itself a theoretical position —
"lightweight, judgment-laden, recoverable from prose" — close to Walton's
own picture and *against* the categorical/behavioural readings. [**S004**](../../RESEARCH_PROGRAMME/04_EMPIRICAL_STUDIES/S004-scheme-assignment-agreement.md)
is the empirical leg: do identification patterns actually improve
inter-rater agreement, or are they decoration?

### Cluster E — Open catalogue: when is a custom scheme well-formed?

The catalogue is currently a folksonomy by default (admin can mint
anything). [**Q-014**](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md)
asks whether this is the right choice. The literature pass
([`SCHEMES_LITERATURE_REVIEW.md`](SCHEMES_LITERATURE_REVIEW.md) §2
Bucket 1, Appendix A row SC17) confirms: **no Walton-school source
proposes well-formedness rules for new schemes.** Blair 2001 and Lumer
2022 critique the *catalogue* for lacking inclusion criteria; Walton &
Macagno 2015 explicitly describe their classification as *"a provisional
hypothesis that should be subject to improvement as further empirical
and analytical work on schemes classification continues"*. The four
candidate well-formedness conditions below are therefore **original to
this track**:

- **Non-redundancy** — the new scheme's CQ-orthogonal set differs from
  every existing scheme's.
- **Non-vacuity** — `⟦S⟧ ≠ ∅`; at least one design satisfies all CQs.
  Well-defined only under C006 or layered-with-C006-ground-truth.
- **Cluster-conservativity** — if `S` is placed in cluster `K`, then
  `⟦S⟧ ⊆ ⋃ ⟦K-members⟧`.
- **Locative coherence** — `S`'s premise variables can be unified into a
  well-formed locus tree.

None are currently enforced. The substrate's commitment to a
structurally pre-existing dialectical layer (T4) biases toward
*ontology* (the catalogue describes pre-existing structure) over
*folksonomy* (the catalogue records authorial choice), but this has not
been worked out. The methodological gap is also independently addressed
by [**Q-018**](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md):
apply Guarino-Welty's OntoClean meta-properties (rigidity, identity,
unity, dependence) to the existing scheme catalogue. The literature
pass confirms (Appendix A row SC18) **OntoClean has never been applied
to argumentation-scheme catalogues**, and Q-018 is the substrate's
single most consequential empirical input to Q-014's settlement: any
Walton scheme whose central concept is a *role* rather than a *kind*
(canonical case: *argument from expert opinion*, where "expert" is a
role) will turn out anti-rigid under OntoClean and force a
re-organisation of the cluster graph.

**Catalogue scope clarification.** WRM 2008 contains **96 schemes
total** (publisher description); the widely-cited Ch. 9 catalogue lists
60+. The substrate's production catalogue currently contains 31 schemes
(per S004's Sub-study B). The substrate has not yet declared whether it
adopts the full 96, a curated subset (and by what principle), or a
bespoke catalogue layered over WRM. This declaration is downstream of
Q-014 + Q-018 + the trilemma resolution and should be made jointly with
them. Field-by-field omissions vs other catalogues (AIF, Argdown,
ASPIC+ rule signatures, DefLog, Wagemans PTA) are tracked by
[**Q-020**](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md).

### Cluster F — Composition: how do schemes combine?

Walton doesn't address composition; AIF allows it via shared nodes;
ASPIC+ via rule chaining. In the substrate, scheme composition is
plausibly *cut composition of designs*, and the substrate has real
machinery for this (Faggian-Hyland 2002 DDS, Terui 2011 computational
Ludics). [**Q-015**](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md)
asks whether this correspondence holds, and if so what the right CQ
inheritance rule for chained schemes is. This is the cluster where the
substrate has the most to offer that AIF/ASPIC+ cannot.

---

## §3 Where each admin field lands in the clusters

A reverse index, for use when editing the schemes admin and asking "what
theoretical choice is this field forcing?":

| Field / feature in admin | Cluster | Open question(s) | Conjectures it would resolve |
|---|---|---|---|
| `purpose`, `source`, `materialRelation`, `reasoningType`, `ruleForm`, `conclusionType` (Macagno-Walton taxonomy) | A, E | Q-014 | C006 vs C007 (extensional vs intensional identity) |
| `epistemicMode` (Kienpointner) | A | — (sub-question of Q-011) | tension with C008 — modal annotation resists protocol encoding |
| `premises[].variables`, `conclusion.variables` | A | Q-015 | strong evidence for C007 if load-bearing |
| `cqs[].attackType`, `cqs[].targetScope` | B | Q-011 | trichotomy exhaustiveness |
| `cqs[].burdenOfProof`, `cqs[].requiresEvidence`, `cqs[].premiseType` | A, B | Q-011 | strong evidence for C008 if these are protocol clauses |
| `parentSchemeId`, `clusterTag`, `inheritCQs` | C | Q-012 | inheritance semantics determines C006/C007/C008 implications |
| `identificationPatterns`, `whenToUse` | D | Q-013 (via S004) | declaration vs MAP-inference vs behaviour-derived |
| "Generate from Taxonomy" button | A, E | Q-013 | taxonomy → CQ-bundle functional determination |
| "Create Custom Scheme" path without well-formedness checks | E | Q-014 | ontology vs folksonomy |
| (absent) scheme versioning | — | (sub-question; not yet a Q-NNN) | — |
| (absent) scheme-composition representation | F | Q-015 | C006 / C007 / C008 produce different ⊕ operators |

---

## §4 What the programme does *not* commit to yet

The programme is not yet committed to:

- A choice among C006 / C007 / C008. The substrate-original framing
  (Reading C, anonymous polarity, behaviours as the primary semantic
  object) **leans** toward C006, but C007 has the cleanest story for
  scheme composition (Q-015) and C008 has the cleanest story for
  burden-of-proof / premise-type fields. The right answer may be a
  *layered* position (C006 as semantic ground truth, C007 as
  presentation, C008 as protocol surface), but that layered position has
  not yet been worked out.
- A position on Cluster D before [S004](../../RESEARCH_PROGRAMME/04_EMPIRICAL_STUDIES/S004-scheme-assignment-agreement.md)
  runs. The pattern-matching commitment is provisional.
- A position on Cluster E before Q-014 is articulated.
- Any retraction of admin behaviour. The admin is what it is; this
  document records what it *implies*, not what it should be changed to.

---

## §5 Pointers back into the code

When editing any of the following, consult the listed cluster before
committing:

- [`components/admin/SchemeCreator.tsx`](../../components/admin/SchemeCreator.tsx)
  — Clusters A (taxonomy fields), B (CQ form), C (parent/inheritance),
  D (identification patterns), E (well-formedness validation).
- [`components/admin/SchemeHierarchyView.tsx`](../../components/admin/SchemeHierarchyView.tsx)
  — Cluster C (inheritance display).
- [`components/admin/SchemeList.tsx`](../../components/admin/SchemeList.tsx)
  — Cluster A (what is being listed — instances of which ontology).
- [`lib/argumentation/cqGeneration.ts`](../../lib/argumentation/cqGeneration.ts)
  — Cluster A (taxonomy as constitutive vs descriptive), Cluster E
  (generated CQs as baseline vs authoritative).
- `app/api/schemes/route.ts` (if exists) — Cluster E (well-formedness
  validation).
- `prisma/schema.prisma` (the `argument_scheme` / `argument_scheme_cq` /
  `argument_scheme_application` tables) — Cluster A (which ontology the
  schema encodes), Cluster C (inheritance representation), Cluster F
  (composition representation, currently absent).

---

## §6 Pointers forward

Two dedicated research-thread prompts have been drafted and are ready to
run in fresh sessions:

1. [`SCHEMES_LITERATURE_REVIEW_PROMPT.md`](SCHEMES_LITERATURE_REVIEW_PROMPT.md)
   — the literature half. Pressure-tests 25 falsifiable claims (SC1–SC25)
   across six buckets (Walton primary; Pollock attack typology; AIF /
   ASPIC+ / dialogue; empirical scheme classification; ontology
   engineering & folksonomy; dialogue-protocol-as-scheme + Ludics-meets-
   Walton). Modelled on
   [`Ludics Generative Substrate Documents/LITERATURE_REVIEW_PROMPT.md`](Ludics%20Generative%20Substrate%20Documents/LITERATURE_REVIEW_PROMPT.md).
   Output: `SCHEMES_LITERATURE_REVIEW.md`.
2. [`SCHEMES_ONTOLOGY_DECISION_PROMPT.md`](SCHEMES_ONTOLOGY_DECISION_PROMPT.md)
   — the formal-decision half. Resolves the C006 / C007 / C008 trilemma
   (mutually exclusive vs layered) and answers Q-012 under the chosen
   resolution. Modelled on
   [`Ludics Generative Substrate Documents/PHASE_2E_OQ_JSL_PROOF_PROMPT.md`](Ludics%20Generative%20Substrate%20Documents/PHASE_2E_OQ_JSL_PROOF_PROMPT.md).
   **Explicitly waits on the literature review's deliverable.** Output:
   `SCHEMES_ONTOLOGY_DECISION.md`.

Run them in sequence: literature first, decision second. The decision
prompt's §1 names the literature deliverable as required reading and its
§10 ("Concrete inputs to SCHEMES_ONTOLOGY_DECISION_PROMPT.md") is
designed to be the payload that briefs the decision session.
