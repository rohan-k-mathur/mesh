# Schemes Ontology Decision Prompt — C006 / C007 / C008 Trilemma Resolution

**Purpose of this document.** This is a standalone prompt for a dedicated conceptual-track session. Open a fresh conversation, paste this document as context, and ask the model to work through the decision. The session should produce `SCHEMES_ONTOLOGY_DECISION.md` as its primary deliverable.

**Do not work on this in the implementation thread.** This session has no code output; it is a formal-reasoning / decision exercise.

**Sequencing.** This prompt is the *formal-decision* follow-on to the literature-review pass specified in [`SCHEMES_LITERATURE_REVIEW_PROMPT.md`](SCHEMES_LITERATURE_REVIEW_PROMPT.md). **It explicitly waits on the deliverable of that pass.** Do not open this session until `SCHEMES_LITERATURE_REVIEW.md` exists in `Development and Ideation Documents/ARCHITECTURE/`. The literature review's §10 ("Concrete inputs to SCHEMES_ONTOLOGY_DECISION_PROMPT.md") is required reading for this session and overrides any conflicting guidance below if newer.

---

## §0. Pre-analysis — known observations (read before §1)

The following observations were worked out before this decision session opened. The session should verify them, sharpen them, and use them as the prior for the verdict.

### §0.1 The three readings are *not* obviously mutually exclusive

The bridging document
([`SCHEMES_THEORETICAL_FOUNDATIONS.md`](SCHEMES_THEORETICAL_FOUNDATIONS.md))
states C006 / C007 / C008 as mutually exclusive conjectures. On reflection
this overstates the case: each reading describes a *different facet* of
what a scheme is, and a *layered* position is candidate:

- **C006 as the semantic ground truth.** The behaviour $\llbracket S \rrbracket$ is what the scheme *means*; two schemes mean the same thing iff their orthogonal-closures agree. This is what the substrate's interaction-first §0 framing forces if it forces anything.
- **C007 as the presentation.** The locus-tree-with-holes $\langle L_S, V_S, \Phi_S, \mathrm{CQ}_S \rangle$ is what the scheme *looks like* — how it is communicated, stored, and matched against arguments. The admin's `variables` field implements this.
- **C008 as the protocol surface.** The protocol fragment $\pi_S$ is what the scheme *does* once invoked — the obligations and rights it adds to the room. The admin's `burdenOfProof` / `requiresEvidence` / `premiseType` fields implement this.

If the layered position is coherent, the three conjectures are not mutually exclusive but *complementary*; the trilemma dissolves into a question of how the layers compose (a soundness/coherence theorem, not a choice).

If the layered position is *not* coherent — e.g. two different design-schemata can present the same behaviour but have different protocol semantics — then the trilemma is real and the session must pick.

**The first task of the session is to determine which.**

### §0.2 The admin's behaviour is consistent with the layered reading

The admin's UI does not force a choice. It exposes Walton taxonomy (consistent with C006 — taxonomy as discovery metadata for a behaviour-extensional identity), a `variables` field on premises (consistent with C007), and burden-of-proof / premise-type fields (consistent with C008). It allows authoring without checking non-vacuity ($\llbracket S \rrbracket \neq \varnothing$ under C006), without enforcing unification-well-formedness (under C007), and without checking protocol-well-formedness (under C008).

So the admin is currently *under-determined* with respect to all three readings. Whichever reading wins, the admin will need to be tightened. The decision session does not need to defend the admin's current behaviour against any reading — it needs to identify which set of well-formedness conditions the admin *should* enforce.

### §0.3 The substrate strongly biases toward C006 as the ground truth

The §0 charter framing
([`../../RESEARCH_PROGRAMME/00_CHARTER.md`](../../RESEARCH_PROGRAMME/00_CHARTER.md))
commits the programme to **argumentation as interaction**, **behaviours as
the primary semantic object** ($\perp\perp$-closure as meaning), and
**Reading C** (the Opponent is the behaviour, not a participant). All three
commitments push the *semantic ground truth* layer toward C006.

This is *not* an argument that C007 and C008 are wrong; it is an argument
that *if* they are right, they are right as *presentations of* or
*protocol surfaces over* a C006-style ground truth, not as alternatives
to it.

**The second task of the session is to either confirm this bias — adopt
the layered position with C006 as the ground truth — or find the
substrate-internal obstruction that blocks it.**

### §0.4 The bind between Q-012 (inheritance) and the trilemma

The inheritance semantics question (Q-012) cannot be answered before the
trilemma. Each reading gives a different answer:

- **Under C006 (behaviour):** inheritance is $\llbracket S' \rrbracket \subseteq \llbracket S \rrbracket$ — lattice refinement. The `inheritCQs: false` flag is incoherent (child's behaviour is fully determined by its CQ-bundle).
- **Under C007 (design schema):** inheritance is *constraint-tightening* on the hole map $\Phi_{S'}$ relative to $\Phi_S$. The `inheritCQs: false` flag means "the child uses a different CQ-bundle on the same locus tree." Coherent but exotic.
- **Under C008 (protocol):** inheritance is $\pi_{S'} \supseteq \pi_S$ — the child's protocol fragment extends the parent's. The `inheritCQs: false` flag means "the child declares a different protocol fragment entirely while staying in the same cluster family." Reasonable.

**The third task of the session is to give Q-012 its answer in light of the trilemma resolution.**

### §0.5 The primary tasks for the proof session

The pre-analysis makes it likely that the verdict is the layered position
with C006 as the ground truth. But the session must do four things before
that verdict is locked in:

1. **Determine whether the three readings are mutually exclusive or layered.** Construct a candidate layered semantics; check it for coherence; identify whatever counterexamples would refute it.
2. **If layered: state the composition.** Give the explicit maps: presentation $\to$ behaviour, protocol $\to$ behaviour, and the coherence conditions (e.g. *every* protocol-legal play of $\pi_S$ produces a design in $\llbracket S \rrbracket$).
3. **If trilemmic: pick.** State which reading is the substrate's correct answer, with explicit refutations of the other two grounded in the literature review's §10 inputs.
4. **Resolve Q-012 (inheritance) under the chosen reading.**

---

## §1. Background

You are acting as a formal-methods conceptual analyst with deep familiarity with Girard's Ludics, the Walton/Macagno-Walton argumentation-schemes literature, and the substrate documents in [`Ludics Generative Substrate Documents/`](Ludics%20Generative%20Substrate%20Documents/). Your prior reading must include:

- The literature review deliverable: `SCHEMES_LITERATURE_REVIEW.md` (in this directory). Especially §1 (executive summary), §7 (Bucket 6 — Ludics-meets-Walton), §10 (inputs to this prompt), and Appendix A (claims verdict table).
- The bridging document: [`SCHEMES_THEORETICAL_FOUNDATIONS.md`](SCHEMES_THEORETICAL_FOUNDATIONS.md).
- The three competing conjectures: [`C006`](../../RESEARCH_PROGRAMME/03_CONJECTURES/C006-scheme-as-behaviour.md), [`C007`](../../RESEARCH_PROGRAMME/03_CONJECTURES/C007-scheme-as-design-schema.md), [`C008`](../../RESEARCH_PROGRAMME/03_CONJECTURES/C008-scheme-as-protocol-constraint.md).
- The relevant open questions: [Q-011, Q-012, Q-015 in `01_OPEN_QUESTIONS_REGISTRY.md`](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md) (the "Argumentation-scheme cluster").
- The substrate's §0 framing: [`00_CHARTER.md`](../../RESEARCH_PROGRAMME/00_CHARTER.md) §0.
- The Ludics substrate documents on behaviours and incarnations: [`LUDICS_ORDER_RELATION_DEFINITION.md`](Ludics%20Generative%20Substrate%20Documents/LUDICS_ORDER_RELATION_DEFINITION.md), [`LUDICS_OQ_JSL_PROOF.md`](Ludics%20Generative%20Substrate%20Documents/LUDICS_OQ_JSL_PROOF.md), [`LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md`](Ludics%20Generative%20Substrate%20Documents/LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md).

The admin codebase (read enough to validate that your verdict's well-formedness conditions are implementable): [`components/admin/SchemeCreator.tsx`](../../components/admin/SchemeCreator.tsx), [`components/admin/SchemeHierarchyView.tsx`](../../components/admin/SchemeHierarchyView.tsx), [`lib/argumentation/cqGeneration.ts`](../../lib/argumentation/cqGeneration.ts).

---

## §2. The decision obligation

The session must produce a verdict on the following four-part claim:

> **Trilemma resolution target.**
>
> (a) The C006 / C007 / C008 conjectures stand in one of two relationships: **mutually exclusive** (exactly one is the right answer) or **layered** (all three describe different facets of a single coherent scheme ontology).
>
> (b) In the layered case: the maps `presentation → behaviour` (C007 → C006) and `protocol → behaviour` (C008 → C006) are well-defined and respect a stated coherence condition.
>
> (c) In the mutually exclusive case: one of the three is the substrate's correct ontology, justified against the substrate's §0 framing and the literature review's prior art.
>
> (d) Under the chosen resolution, Q-012 (inheritance semantics) has a single right answer, and the `inheritCQs: false` flag in the admin either has a clear semantics or should be retired.

The verdict must address all four parts. (b) and (c) are mutually exclusive; (a) determines which.

---

## §3. What is already established (do not re-litigate)

From the Ludics substrate work:

- **T001 (per-cone JSL).** Within a behaviour $B$, the cone above each incarnation $D_i \in \mathrm{Inc}(B)$ is a join-semilattice under chronicle-set inclusion. ([`LUDICS_OQ_JSL_PROOF.md`](Ludics%20Generative%20Substrate%20Documents/LUDICS_OQ_JSL_PROOF.md), [`T001`](../../RESEARCH_PROGRAMME/02_THEOREMS_AND_PROOFS/T001-oq-jsl-per-cone.md))
- **T002 (Inc antichain + cone decomposition).** $\mathrm{Inc}(B)$ is an antichain; $B$ decomposes as the disjoint union of cones. ([`T002`](../../RESEARCH_PROGRAMME/02_THEOREMS_AND_PROOFS/T002-inc-b-antichain.md))
- **Reading C.** The Opponent is the behaviour, not a coalition of participants. This is a substrate-commitment, not an open question for this session.
- **Standard Ludics facts.** $B = B^{\perp\perp}$; biorthogonal closure is a closure operator; designs are forests of justified sequences with daimon termination (Girard 2001 §2, §4, §5).

From the Walton-school primary literature (whatever the literature review confirmed):

- The CQ bundle is the operational core of a scheme.
- Scheme catalogues evolve over time; the catalogue is *open* by Walton's own practice.
- Cluster-family membership and parent-child inheritance are present in Macagno-Walton 2015 but their semantics is *set-theoretic by default* (per the literature review's SC10 verdict).

What is **not** established and is the session's task: which ontological reading the substrate's commitments require, and how inheritance composes under that reading.

---

## §4. Reference materials

The session must work through, in order:

1. **The literature review's §10** (inputs to this prompt). This may *change* §0's pre-analysis; if it does, follow §10 over §0.
2. **The bridging document** [`SCHEMES_THEORETICAL_FOUNDATIONS.md`](SCHEMES_THEORETICAL_FOUNDATIONS.md) §1 (six implicit commitments), §2 (six clusters), §3 (reverse-index table).
3. **The three conjecture files** ([C006](../../RESEARCH_PROGRAMME/03_CONJECTURES/C006-scheme-as-behaviour.md), [C007](../../RESEARCH_PROGRAMME/03_CONJECTURES/C007-scheme-as-design-schema.md), [C008](../../RESEARCH_PROGRAMME/03_CONJECTURES/C008-scheme-as-protocol-constraint.md)). Each has "consequences if confirmed" and "consequences if refuted" sections — these are the levers the verdict will pull.
4. **The Ludics substrate's [`LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md`](Ludics%20Generative%20Substrate%20Documents/LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md)**. The ι instantiation operation already implements a *records-only* layer separation. The layered reading of the trilemma is structurally analogous; check whether ι's discipline informs the layered semantics.
5. **The Ludics substrate's [`LUDICS_OPEN_COMPOSITION_JOINT.md`](Ludics%20Generative%20Substrate%20Documents/LUDICS_OPEN_COMPOSITION_JOINT.md)** §0d.2 ("the articulation lattice"). The convolution-of-JSLs construction is the candidate machinery for explaining how C007 presentations compose under C006 ground truth.
6. **The admin's `lib/argumentation/cqGeneration.ts`**. The "Generate from Taxonomy" functional determination is testable under any of the three readings; the session may or may not need to take a position on it, but should note where it lands.

---

## §5. Decision strategy

**Step 1: Resolve §0.5 task 1 — layered or trilemmic.**

Construct a candidate layered semantics:

- Define an operator $\mathcal{B} : \mathrm{Presentations} \to \mathcal{P}(\mathrm{Designs})$ that takes a C007 presentation $\langle L_S, V_S, \Phi_S, \mathrm{CQ}_S \rangle$ and returns its associated C006 behaviour. The natural candidate: $\mathcal{B}(S) = \{D \in \mathrm{Designs} : D \text{ unifies with } L_S[\theta] \text{ for some } \theta\}^{\perp\perp}$, intersected with the orthogonal-closure of $\mathrm{CQ}_S$.
- Define an operator $\mathcal{P} : \mathrm{Protocols} \to \mathcal{P}(\mathrm{Designs})$ that takes a C008 protocol fragment $\pi_S$ and returns the set of designs producible by some legal play sequence under $\pi_S$.
- Check whether $\mathcal{B}(\text{presentation of } S) = \mathcal{P}(\pi_S)$ for every well-formed $S$. This is the coherence condition.

If the coherence condition holds modulo well-defined exceptional cases (e.g., requiring $\pi_S$ to be *non-deadlocking*), the layered reading is coherent. Adopt (b).

If the coherence condition fails — exhibit a scheme whose C007 presentation produces a behaviour that no $\pi_S$ in C008 form can realise, or vice versa — the trilemma is real. Go to Step 2.

**Step 2: If trilemmic, pick.**

The substrate's §0 framing forces C006 to be the right answer *if* the trilemma is real, because the substrate's commitment is to behaviour-as-meaning. Under the trilemmic reading: C007 and C008 are *projections* of C006 (the design-schema is a projection that collapses the orthogonal closure; the protocol is a projection that collapses the locus geometry). Each projection loses information; neither is the scheme itself.

State this verdict explicitly; refute C007 and C008 as *theories of scheme identity* (they are still useful as *representations* and *implementation strategies*); cite the substrate-internal counterexample produced in Step 1.

**Step 3: Resolve §0.5 task 4 — Q-012 inheritance.**

If layered: inheritance is *behaviour refinement* at the C006 layer ($\llbracket S' \rrbracket \subseteq \llbracket S \rrbracket$), implemented as *constraint-tightening* at the C007 layer ($\Phi_{S'}$ is a refinement of $\Phi_S$ on a sub-tree of $L_S$), and *protocol extension* at the C008 layer ($\pi_{S'} \supseteq \pi_S$ on the relevant loci). The `inheritCQs: false` flag is then a *layered violation* — it allows a child to be a child at C007 (same locus tree) without being a child at C008 (different protocol clauses) or C006 (different behaviour). This is *incoherent* under the layered reading; recommend the flag be retired or its semantics fully reworked.

If trilemmic with C006 winning: inheritance is behaviour refinement only. `inheritCQs: false` is incoherent under C006 alone (child's behaviour is its CQ-bundle's orthogonal closure; you cannot opt out of inheriting your own CQ-bundle). Recommend retirement.

**Step 4: Write the verdict.**

One of three outcomes (see §6).

---

## §6. Branching outcomes

### Outcome A: Layered reading is coherent

The candidate semantics in Step 1 passes the coherence check. The trilemma dissolves; C006/C007/C008 describe three layers of a single coherent ontology with explicit maps between them.

**If Outcome A:**

- Update the three conjecture files: each gains a "verdict: layered, see SCHEMES_ONTOLOGY_DECISION.md" line; the *mutually-exclusive-with* line on each is **removed** or rewritten as *layered-complement-of*.
- Update [`SCHEMES_THEORETICAL_FOUNDATIONS.md`](SCHEMES_THEORETICAL_FOUNDATIONS.md): §2 Cluster A is rewritten to lead with the layered position; §4 ("what the programme does *not* commit to") is rewritten to say the programme *does* now commit to a layered ontology.
- File a new theorem entry `T-NNN-schemes-layered-coherence.md` under [`../../RESEARCH_PROGRAMME/02_THEOREMS_AND_PROOFS/`](../../RESEARCH_PROGRAMME/02_THEOREMS_AND_PROOFS/) stating the coherence theorem ($\mathcal{B}(\text{presentation}) = \mathcal{P}(\text{protocol})$ for well-formed schemes), with the proof from Step 1.
- Update Q-012 in the registry: close with `closed-by: SCHEMES_ONTOLOGY_DECISION.md`; the inheritance semantics is layered refinement.
- Recommend admin changes (no code, just the recommendation): retire `inheritCQs: false`; add non-vacuity, locative-coherence, and protocol-well-formedness checks at scheme creation time.

### Outcome B: Trilemma is real, C006 wins

The coherence check fails; the substrate's §0 framing forces C006.

**If Outcome B:**

- Update the three conjecture files: C006 gains `verdict: confirmed`; C007 and C008 each gain `verdict: refuted as a theory of scheme identity; retained as a representation/implementation strategy` with the cite to the counterexample from Step 1.
- Update [`SCHEMES_THEORETICAL_FOUNDATIONS.md`](SCHEMES_THEORETICAL_FOUNDATIONS.md): §2 Cluster A is rewritten to lead with C006; §4 commits the programme to C006.
- File a new theorem entry stating the substrate-internal counterexample.
- Resolve Q-012 in favour of behaviour refinement.

### Outcome C: Trilemma is real, C006 *loses*

The substrate-internal counterexample of Step 1 cuts the other way — there is a feature of the admin (a worked production scheme) whose behaviour is degenerate ($\llbracket S \rrbracket$ is empty or singleton-equivalent to another scheme's) but which is practically distinguishable by either its presentation or its protocol. This refutes C006 as the ground truth.

**If Outcome C:** This is the *most consequential* outcome and the only one that forces the substrate's §0 framing to be revisited. The session must:

- State the counterexample precisely.
- State the consequences for the substrate's commitment to behaviours as the primary semantic object.
- Open a new programme-level open question: *is the substrate's §0 framing wrong about argumentation, or is the schemes domain a special case where behaviour-extensional identity collapses?*
- Defer Q-012's resolution until the meta-question is settled.

This outcome should not be reached lightly. The session is permitted to declare it only on the basis of a concrete, presented counterexample from the production scheme catalogue (or a near-miss thereof), not on philosophical preference.

---

## §7. Output format for `SCHEMES_ONTOLOGY_DECISION.md`

The decision document should follow this structure:

```markdown
# Schemes Ontology Decision — C006 / C007 / C008 Trilemma Resolution

**Session:** (this prompt)
**Date:** [date]
**Track:** Conceptual / decision
**Verdict:** [OUTCOME A: LAYERED | OUTCOME B: C006 WINS | OUTCOME C: C006 LOSES]
**Companion documents:** SCHEMES_THEORETICAL_FOUNDATIONS.md, SCHEMES_LITERATURE_REVIEW.md
**Programme entries touched:** C006, C007, C008, Q-012, Q-015 (possibly Q-011, Q-014 indirectly)

## 1. Trilemma under examination
[Restate the C006/C007/C008 conjectures and the four-part decision obligation from §2 of the prompt.]

## 2. Pre-analysis status
[Confirm or refute §0. State whether the literature review's §10 inputs have shifted the prior, and how.]

## 3. Layered candidate semantics
[Construct $\mathcal{B}$ and $\mathcal{P}$ explicitly. State the coherence condition.]

## 4. Coherence check
[Step 1 from §5. Either pass (with worked proof on at least three production schemes from distinct cluster families) or fail (with explicit counterexample).]

## 5. Verdict
[One of Outcomes A, B, or C. Make the choice unambiguous.]

## 6. Q-012 inheritance resolution under the chosen verdict
[Step 3 from §5. State the semantics; state the recommendation for the `inheritCQs: false` flag.]

## 7. Downstream implications and recommended edits
[Per the chosen outcome's "If Outcome X" section in §6 of the prompt. List the specific edits to the three conjecture files, the bridging document, and the registry.]

## 8. Open questions not resolved by this session
[Anything the decision leaves open. Under Outcome A: how does the layered semantics compose under scheme cut (Q-015)? Under Outcome C: the meta-question about §0 framing.]
```

---

## §8. What this session does NOT produce

- **No code.** Implementation-side changes (admin tightening, schema migration, retiring the `inheritCQs: false` flag) happen in the main implementation thread *after* this session's verdict is returned. The verdict carries a recommendation, not a patch.
- **No new conceptual constructs beyond what the trilemma resolution requires.** This session resolves three existing conjectures; it does not open new ones. If new conjectures are surfaced by the work, file them as open questions in §8 of the deliverable for a later session, not as part of the verdict.
- **No literature review work.** That is `SCHEMES_LITERATURE_REVIEW.md`'s job. Cite its findings; do not redo them.
- **No code-archaeology of the admin beyond what the decision needs.** The admin is what it is. The decision is about what the admin *should commit to*, not about defending the admin's current behaviour.
- **No changes to the substrate's §0 framing** unless Outcome C is reached and the change is forced by the verdict. The framing is load-bearing for the rest of the programme; revisiting it is a separate task with its own session.
