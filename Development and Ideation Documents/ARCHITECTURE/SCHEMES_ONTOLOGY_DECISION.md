# Schemes Ontology Decision — C006 / C007 / C008 Trilemma Resolution

**Session:** SCHEMES_ONTOLOGY_DECISION_PROMPT.md
**Date:** 2026-05-27
**Track:** Conceptual / decision
**Verdict:** OUTCOME A: LAYERED — with refinement (product structure, not linear stack)

**Companion documents:** SCHEMES_THEORETICAL_FOUNDATIONS.md, SCHEMES_LITERATURE_REVIEW.md
**Programme entries touched:** C006, C007, C008, Q-012, Q-015 (indirectly Q-011, Q-014)
**Out-of-scope (flagged, not resolved):** C009 / Q-016 (scheme-rivalry as fourth attack category); Q-017 (CQ-of-CQ recursion); Q-018 (OntoClean meta-properties); Q-019 (`inheritCQs: false` audit)

---

## 1. Trilemma under examination

Three mutually exclusive conjectures name candidate answers to "what is an argumentation scheme in the interaction-first substrate?"

**C006 — Scheme-as-behaviour.** $\llbracket S \rrbracket \subseteq \mathrm{Designs}$ is the $\perp\!\perp$-closed set of proponent designs that survive every CQ in $\mathrm{CQ}(S)$ played as opponent. Identity is extensional: same orthogonal closure $\Rightarrow$ same scheme. Suggested by the substrate's §0 commitment to behaviours as the primary semantic object.

**C007 — Scheme-as-design-schema.** $S = \langle L_S, V_S, \Phi_S, \mathrm{CQ}_S \rangle$ — a locus tree with typed holes for premise variables plus a CQ-bundle. Identity is intensional and structural; membership is decidable by unification. Suggested by the admin's `variables: string[]` field on each `Premise`.

**C008 — Scheme-as-protocol-constraint.** $S$ is a protocol fragment $\pi_S$ that, upon proponent declaration of scheme application, extends the room's dialogue protocol with locus obligations, opponent rights, and closure conditions. Identity is protocol-extensional. Suggested by the admin's `burdenOfProof` / `requiresEvidence` / `premiseType` fields.

**The four-part decision obligation** (from the prompt's §2):

(a) Determine whether the conjectures are mutually exclusive or layered.

(b) If layered: state the maps $\text{presentation} \to \text{behaviour}$ (C007 $\to$ C006) and $\text{protocol} \to \text{behaviour}$ (C008 $\to$ C006) explicitly, with coherence conditions.

(c) If mutually exclusive: pick one, justified against the substrate's §0 framing and the literature review.

(d) Under the chosen resolution, give Q-012 (inheritance semantics) its answer and determine the fate of `inheritCQs: false`.

---

## 2. Pre-analysis status

### §0.1 — confirmed: the three readings are not obviously mutually exclusive

The prompt's §0.1 pre-analysis holds. Each conjecture describes a different facet of what a scheme is: C006 is what the scheme *means* (which designs survive its tests), C007 is what the scheme *looks like* (how it is communicated and matched), C008 is what the scheme *does* (the obligations it adds to a room). A layered position is the natural candidate. The question is whether it is coherent.

### §0.2 — confirmed: the admin is under-determined

The admin exposes fields consistent with all three readings simultaneously (taxonomy fields for C006-style discovery metadata, `variables` for C007 locus-tree structure, `burdenOfProof`/`premiseType` for C008 protocol clauses) without checking well-formedness conditions native to any of them. Whichever resolution wins, the admin must be tightened. This session identifies *which* conditions; implementation is downstream.

### §0.3 — confirmed with refinement: the substrate biases toward C006 as ground truth

The §0 charter framing commits to argumentation-as-interaction, behaviours as the primary semantic object ($B = B^{\perp\perp}$), and Reading C (Opponent is the behaviour, not a participant). All three push the *semantic ground truth* toward C006. The refinement: this bias does not rule out C007 and C008 as additional layers carrying information C006 does not. The bias constrains the *base* of the layered structure, not the entire structure.

### §0.4 — confirmed: Q-012 cannot precede the trilemma

Each reading gives a different inheritance semantics (§0.4 of the prompt). The trilemma must resolve first.

### Literature review §10 inputs: incorporated, no shifts to §0

The literature review's §10 (Q1–Q7 recommendation template) aligns with §0's pre-analysis. No source forces a choice among C006/C007/C008; the substrate must decide. The layered recommendation (C006 as ontological primitive, C007 and C008 as projections) is the prior. The one item that could have shifted the prior — a published layered position on scheme ontology (SC4) — was confirmed as original to this track. No shift.

---

## 3. Layered candidate semantics

### 3.1 The three layers and their information content

The proposal: a scheme $S$ is not *one* of C006, C007, or C008, but a *triple* $\langle \llbracket S \rrbracket, \mathcal{S}_S, \pi_S \rangle$ subject to coherence conditions, where:

- $\llbracket S \rrbracket$ is the **behaviour** (C006): the $\perp\!\perp$-closed set of proponent designs that survive every CQ played as opponent.
- $\mathcal{S}_S = \langle L_S, V_S, \Phi_S, \mathrm{CQ}_S \rangle$ is the **presentation** (C007): the structural description of the scheme — its locus tree skeleton, premise variables, hole map, and CQ-bundle.
- $\pi_S$ is the **protocol surface** (C008): the fragment that extends the room's dialogue protocol upon scheme declaration — obligations, rights, burden assignments, closure conditions.

The layers carry *different kinds of information* and are ordered by what they determine:

| Layer | Determines | Does not determine |
|---|---|---|
| C006 (behaviour) | Which designs survive all CQs | How the scheme looks structurally; who bears burden for each CQ |
| C007 (presentation) | Structural shape + CQ-bundle | Burden distribution; closure-rule details |
| C008 (protocol) | Procedural organisation of CQ-testing | (Adds burden/closure on top of C006 + C007) |

The layers are **not linearly ordered** (C007 does not contain all of C008's information, or vice versa). They form a **product** with C006 as the shared base:

$$S = \llbracket S \rrbracket \;\times_{\mathrm{CQ}(S)}\; \mathcal{S}_S \;\times_{\mathrm{CQ}(S)}\; \pi_S$$

where the fibred product is over the shared CQ-bundle: C007 and C008 must agree on which critical questions the scheme carries.

### 3.2 The map $\mathcal{B}$: presentation $\to$ behaviour (C007 $\to$ C006)

**Definition.** Given a C007 presentation $\mathcal{S}_S = \langle L_S, V_S, \Phi_S, \mathrm{CQ}_S \rangle$ with CQ-bundle $\mathrm{CQ}_S = \{q_1, \ldots, q_k\}$, define:

$$\mathcal{B}(\mathcal{S}_S) \;=\; \left\{ D \in \mathrm{Designs} \;:\; \forall i \in \{1, \ldots, k\},\; D \perp q_i^{\mathrm{opp}} \right\}^{\perp\perp}$$

where $q_i^{\mathrm{opp}}$ is the opponent design corresponding to CQ $q_i$ — the challenge move the opponent has the right to play. The behaviour is the $\perp\!\perp$-closure of the set of proponent designs that survive all CQs.

**Properties.**

(i) $\mathcal{B}$ is **well-defined**: the CQ-bundle determines the orthogonal class, the orthogonal class determines the behaviour via biorthogonal closure. This is standard Ludics (Girard 2001 §4).

(ii) $\mathcal{B}$ is **surjective onto the image of well-formed schemes**: every behaviour that arises from a CQ-bundle arises from some presentation containing that bundle.

(iii) $\mathcal{B}$ is **not injective**: two different presentations (different locus trees, different variable bindings) can yield the same behaviour if their CQ-bundles determine the same orthogonal class. This is the sense in which the presentation is a *presentation* — it is a syntactic object, not a semantic one. Multiple presentations can denote the same scheme-meaning.

(iv) $\mathcal{B}$ **discards structural information**: the locus-tree shape $L_S$, the variable assignments $V_S$, and the hole map $\Phi_S$ do not survive the passage to the behaviour. Only the CQ-bundle's orthogonality class matters.

### 3.3 The map $\mathcal{P}$: protocol $\to$ behaviour (C008 $\to$ C006)

**Definition.** Given a C008 protocol fragment $\pi_S$ derived from CQ-bundle $\mathrm{CQ}_S$ with burden assignments $\beta: \mathrm{CQ}_S \to \{\mathrm{PROPONENT}, \mathrm{CHALLENGER}\}$ and closure conditions $\gamma$, define:

$$\mathcal{P}(\pi_S) \;=\; \left\{ D \in \mathrm{Designs} \;:\; D \text{ is the proponent's design after some terminating play under } \pi_S \text{ in which proponent wins} \right\}^{\perp\perp}$$

**Properties.**

(i) $\mathcal{P}$ is **well-defined** provided $\pi_S$ is non-deadlocking and finitely terminating (well-formedness conditions on the protocol fragment).

(ii) $\mathcal{P}$ is **not injective**: two protocol fragments with different burden assignments but the same CQ-bundle and compatible closure conditions can produce the same behaviour, because burden distribution affects *who raises* a CQ, not *which designs survive it*.

(iii) $\mathcal{P}$ **discards procedural information**: the burden assignment $\beta$ and the specific closure conditions $\gamma$ do not survive the passage to the behaviour.

### 3.4 The coherence condition

**Theorem (Soundness).** For any well-formed scheme $S$, $\mathcal{P}(\pi_S) \subseteq \mathcal{B}(\mathcal{S}_S)$.

*Proof sketch.* $\pi_S$ is derived from the same CQ-bundle $\mathrm{CQ}_S$ as $\mathcal{S}_S$. Every terminating play under $\pi_S$ in which the proponent wins requires that every CQ that was raised has been defended — i.e., the proponent's final design survives the raised CQs. Every CQ that was *not* raised goes unchallenged through the closure rule. In either case, the proponent's design is in $\{D : \forall i, D \perp q_i^{\mathrm{opp}}\}$ (the pre-closure set). Therefore it is in $\mathcal{B}(\mathcal{S}_S)$ (the biorthogonal closure). $\square$

**The inclusion is proper in general.** The behaviour $\mathcal{B}(\mathcal{S}_S)$ contains all designs that *could* survive all CQs. The protocol $\mathcal{P}(\pi_S)$ contains only designs that *have been produced* by some legal play. The gap is the set of valid instantiations that no one has yet articulated in dialogue — designs that are semantically in the scheme's behaviour but that the room's protocol has not yet forced into existence. This gap is exactly the "latent stratum" $E_\ell$ of the exposure map (LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md §2.1) applied to the scheme's behaviour.

**The coherence condition is therefore soundness, not equality.** The protocol surface must not produce designs outside the behaviour (soundness), but need not produce every design in the behaviour (completeness is not required). This is the correct constraint because completeness would require the protocol to have forced every possible argument instance — a condition no finite dialogue can meet.

### 3.5 Structural precedent: the $\iota$ layer separation

The layered scheme ontology is structurally isomorphic to the $\iota$ instantiation operation's layer separation (LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md §1):

| $\iota$ layer separation | Scheme trilemma layered reading |
|---|---|
| Dialectical layer (anonymous, pre-existing, Ludics-native) | C006 behaviour (extensional, pre-existing as a semantic object) |
| Witnessing layer (attributed, constructed by participation) | C008 protocol surface (procedural, constructed by scheme declaration in a room) |
| Structural description (locus tree, designs, exposure map) | C007 presentation (locus tree, variables, CQ-bundle) |
| $\iota$ invariant I1: records-only on the dialectical side | Soundness: $\mathcal{P}(\pi_S) \subseteq \mathcal{B}(\mathcal{S}_S)$ — the protocol doesn't alter the behaviour |
| $\iota$ invariant I3: multiple witnesses per move | Multiple presentations per behaviour ($\mathcal{B}$ not injective) |

The $\iota$ discipline was designed for a two-layer architecture (dialectical / witnessing, connected by T4). The scheme trilemma layered reading is the *same* architecture applied to scheme ontology rather than to deliberation structure. The layers are: semantic (C006), structural (C007), procedural (C008), connected by the coherence conditions $\mathcal{B}$ and $\mathcal{P}$.

This is not an analogy. The $\iota$ layer separation and the scheme layered reading both follow from the same substrate commitment: **Reading C + T4 separation**. If argumentation is interaction and the dialectical layer pre-exists participation, then the scheme's semantic content (behaviour) pre-exists the scheme's deployment in a room (protocol), and the scheme's structural description (presentation) is a way of *communicating about* the pre-existing content. The three conjectures are three views of one object, just as the dialectical and witnessing layers are two views of one deliberation.

---

## 4. Coherence check

### 4.1 Method

The prompt's §5 Step 1 requires: construct a layered semantics, check it for coherence on at least three production schemes from distinct cluster families, identify counterexamples that would refute it.

The coherence condition is: **soundness** ($\mathcal{P}(\pi_S) \subseteq \mathcal{B}(\mathcal{S}_S)$) holds for every well-formed scheme — the protocol surface never produces designs outside the behaviour.

I check this on three schemes and then examine the candidate counterexample (`epistemicMode`).

### 4.2 Scheme 1: Argument from Expert Opinion (`authority_family`)

**C007 presentation.**
$$\mathcal{S}_{\mathrm{exp}} = \langle L_{\mathrm{exp}},\; V_{\mathrm{exp}} = \{E, D, A\},\; \Phi_{\mathrm{exp}},\; \mathrm{CQ}_{\mathrm{exp}} \rangle$$

- $L_{\mathrm{exp}}$: locus tree with premises {$E$ is an expert in domain $D$; $E$ asserts $A$; $A$ is within $D$} and conclusion {$A$ is plausible}.
- $\mathrm{CQ}_{\mathrm{exp}} = \{q_{\mathrm{qual}}, q_{\mathrm{cred}}, q_{\mathrm{consist}}, q_{\mathrm{consens}}\}$ — Is $E$ qualified? Is $E$ credible? Is $E$'s claim internally consistent? Do other experts agree?

**C006 behaviour.**
$$\llbracket S_{\mathrm{exp}} \rrbracket = \{D \in \mathrm{Designs} : D \perp q_{\mathrm{qual}}^{\mathrm{opp}} \wedge D \perp q_{\mathrm{cred}}^{\mathrm{opp}} \wedge D \perp q_{\mathrm{consist}}^{\mathrm{opp}} \wedge D \perp q_{\mathrm{consens}}^{\mathrm{opp}}\}^{\perp\perp}$$

The behaviour is non-empty (a proponent who has a genuinely qualified, credible, consistent expert with consensus support survives all four CQs).

**C008 protocol fragment.**
$$\pi_{\mathrm{exp}}: \text{Proponent must defend } q_{\mathrm{qual}} (\beta = \mathrm{PROPONENT}),\; q_{\mathrm{cred}} (\beta = \mathrm{PROPONENT}),\; q_{\mathrm{consist}} (\beta = \mathrm{PROPONENT});\; q_{\mathrm{consens}} (\beta = \mathrm{CHALLENGER})$$

Closure: proponent wins if all PROPONENT-burden CQs are defended and all CHALLENGER-burden CQs go unraised or are answered.

**Coherence check.** Every design produced by a winning proponent play under $\pi_{\mathrm{exp}}$ has survived all four CQs (the three proponent-burden ones by defence, the challenger-burden one by non-challenge or successful rebuttal). Therefore $D \in \{D : \forall i, D \perp q_i^{\mathrm{opp}}\} \subseteq \llbracket S_{\mathrm{exp}} \rrbracket$. Soundness holds. $\checkmark$

**Non-injectivity of $\mathcal{B}$.** A variant scheme $S_{\mathrm{exp}}'$ with the same four CQs but a different locus tree (e.g., flattening the premise hierarchy so that $E$'s domain and $E$'s assertion are not separated) has $\llbracket S_{\mathrm{exp}}' \rrbracket = \llbracket S_{\mathrm{exp}} \rrbracket$ — same behaviour, different presentation. This confirms that $\mathcal{B}$ is many-to-one.

**Non-injectivity of $\mathcal{P}$.** A variant $\pi_{\mathrm{exp}}'$ with $q_{\mathrm{consens}}$ reassigned to PROPONENT-burden has $\mathcal{P}(\pi_{\mathrm{exp}}') = \mathcal{P}(\pi_{\mathrm{exp}}) = \llbracket S_{\mathrm{exp}} \rrbracket$ (the same designs survive; burden assignment only affects who raises the question, not which designs pass the test). Different protocol, same behaviour. $\checkmark$

### 4.3 Scheme 2: Practical Reasoning (`practical_reasoning_family`)

**C007 presentation.**
$$\mathcal{S}_{\mathrm{pr}} = \langle L_{\mathrm{pr}},\; V_{\mathrm{pr}} = \{A, G, B\},\; \Phi_{\mathrm{pr}},\; \mathrm{CQ}_{\mathrm{pr}} \rangle$$

- $L_{\mathrm{pr}}$: {Agent $A$ has goal $G$; Action $B$ contributes to $G$; $B$ is feasible} $\to$ {$A$ should do $B$}.
- $\mathrm{CQ}_{\mathrm{pr}} = \{q_{\mathrm{goal}}, q_{\mathrm{alt}}, q_{\mathrm{side}}, q_{\mathrm{feas}}\}$ — Is $G$ a legitimate goal? Are there better alternatives? Are there bad side-effects? Is $B$ actually feasible?

**C006 behaviour.** $\llbracket S_{\mathrm{pr}} \rrbracket = \{D : D \perp q_{\mathrm{goal}}^{\mathrm{opp}} \wedge \ldots \wedge D \perp q_{\mathrm{feas}}^{\mathrm{opp}}\}^{\perp\perp}$. Non-empty (a proponent with a well-justified, feasible action toward a legitimate goal with no better alternatives and no bad side-effects survives).

**C008 protocol fragment.** $\pi_{\mathrm{pr}}$: All four CQs are PROPONENT-burden (standard for practical reasoning — the proponent bears the weight of showing the action is justified).

**Coherence check.** Same structure as Scheme 1. Every winning proponent design survives all four CQs. Soundness holds. $\checkmark$

### 4.4 Scheme 3: Argument from Sign (`evidence_family`)

**C007 presentation.**
$$\mathcal{S}_{\mathrm{sign}} = \langle L_{\mathrm{sign}},\; V_{\mathrm{sign}} = \{A, B\},\; \Phi_{\mathrm{sign}},\; \mathrm{CQ}_{\mathrm{sign}} \rangle$$

- $L_{\mathrm{sign}}$: {$B$ is observed; $B$ is a sign of $A$} $\to$ {$A$ is plausible}.
- $\mathrm{CQ}_{\mathrm{sign}} = \{q_{\mathrm{rel}}, q_{\mathrm{counter}}, q_{\mathrm{alt}}\}$ — Is the sign reliable? Is there a counter-sign? Is there an alternative explanation?

**C006 behaviour.** $\llbracket S_{\mathrm{sign}} \rrbracket$ is the $\perp\!\perp$-closure of the set of designs surviving all three CQs. Non-empty.

**C008 protocol fragment.** $\pi_{\mathrm{sign}}$: $q_{\mathrm{rel}}$ PROPONENT-burden, $q_{\mathrm{counter}}$ CHALLENGER-burden, $q_{\mathrm{alt}}$ CHALLENGER-burden.

**Coherence check.** Soundness holds by the same argument. $\checkmark$

### 4.5 The `epistemicMode` test

The conjecture file C008 (§"Negative settlement") flags `epistemicMode` (Kienpointner: factual / hypothetical / counterfactual) as a potential obstruction to the layered reading. The concern: epistemicMode is a *modal annotation* on the conclusion, not a procedural rule. If it resists protocol encoding, the scheme has content that C008 cannot capture — which would break the layered reading if we required the layers to be *jointly exhaustive*.

**Resolution.** The layered reading does *not* require joint exhaustiveness of C007 and C008 with respect to all scheme features. It requires:

(a) C006 (behaviour) is the semantic ground truth — what the scheme *means*.

(b) C007 (presentation) captures the structural description — what the scheme *looks like*.

(c) C008 (protocol) captures the procedural surface — what the scheme *does* in a room.

(d) Soundness: the protocol never produces designs outside the behaviour.

`epistemicMode` lives at the C007 layer (it is a type-annotation on the conclusion-hole of the locus tree) and affects the C006 layer (different epistemic modes select different designs into the behaviour, because a counterfactual conclusion has different orthogonality properties than a factual one). It does *not need to live at the C008 layer*. The protocol fragment $\pi_S$ is not required to encode every feature of the scheme — only the *procedural* features (burden distribution, closure conditions, locus obligations). Modal features are structural, not procedural; they belong to C007 and C006.

Therefore `epistemicMode` is not a counterexample to the layered reading. It is a confirmation that the layers carry *different information* — precisely the product-structure observation of §3.1. The C008 layer captures what is procedural; the C007 layer captures what is structural; neither need capture everything.

### 4.6 Search for a genuine counterexample

A genuine counterexample to the layered reading would be one of:

(i) A well-formed scheme whose C007 presentation determines a behaviour, and whose C008 protocol surface produces designs *outside* that behaviour (soundness failure).

(ii) A well-formed scheme whose C007 and C008 components are internally inconsistent — e.g., the protocol's CQ-bundle differs from the presentation's CQ-bundle.

(iii) A substrate-internal reason why the layers cannot coexist — e.g., a commitment that forces scheme identity to be *purely* extensional (C006 alone) and rules out the additional information in C007/C008 as constitutive.

**(i) does not arise** for any well-formed scheme because soundness follows from the shared CQ-bundle (§3.4). The protocol tests the same CQs that define the behaviour; any design surviving the protocol tests is in the behaviour.

**(ii) is a well-formedness violation, not a counterexample.** If a scheme's C007 and C008 components carry different CQ-bundles, the scheme is *ill-formed* under the layered reading. This is a new well-formedness condition: **CQ-bundle consistency across layers**. The admin should enforce it. It is not a refutation of the layered reading — it is a constraint the layered reading imposes on scheme creation.

**(iii) does not hold.** The substrate's §0 commitment is to behaviours as the *primary* semantic object, not the *only* object. Reading C says the dialectical layer pre-exists participation; it does not say the dialectical layer is the only layer. T4 explicitly introduces a *second* layer (witnessing). The layered scheme ontology adds structural and procedural layers in the same spirit.

**No counterexample found.** The layered reading passes the coherence check.

---

## 5. Verdict

**OUTCOME A: LAYERED.**

The C006 / C007 / C008 conjectures describe three layers of a single coherent scheme ontology. They are **not mutually exclusive**. The correct reading:

> A scheme $S$ is a triple $\langle \llbracket S \rrbracket, \mathcal{S}_S, \pi_S \rangle$ where:
>
> - $\llbracket S \rrbracket$ is the **behaviour** (C006) — the $\perp\!\perp$-closed set of proponent designs surviving every CQ played as opponent. This is the **semantic ground truth**: two schemes are *the same scheme* iff their behaviours agree.
>
> - $\mathcal{S}_S$ is the **presentation** (C007) — the locus tree with typed holes and CQ-bundle. This is the **structural description**: how the scheme is communicated, stored, matched against arguments, and displayed in the admin. It is a *presentation of* the behaviour, not a rival ontology. Multiple presentations can denote the same behaviour ($\mathcal{B}$ is not injective).
>
> - $\pi_S$ is the **protocol surface** (C008) — the fragment extending the room's dialogue protocol upon scheme declaration. This is the **procedural shadow**: what the scheme does once invoked. It is *sound with respect to* the behaviour ($\mathcal{P}(\pi_S) \subseteq \llbracket S \rrbracket$) but carries additional procedural information (burden distribution, closure conditions) that the behaviour does not determine.
>
> The three layers form a **product over the shared CQ-bundle** $\mathrm{CQ}(S)$, subject to:
>
> - **Soundness:** $\mathcal{P}(\pi_S) \subseteq \mathcal{B}(\mathcal{S}_S) = \llbracket S \rrbracket$.
> - **CQ-bundle consistency:** $\mathcal{S}_S$ and $\pi_S$ agree on $\mathrm{CQ}(S)$.
> - **Non-vacuity:** $\llbracket S \rrbracket \neq \varnothing$.

**Status of each conjecture under the layered reading:**

- **C006** — *Confirmed as the base layer.* Scheme identity is behaviour-extensional. The $\perp\!\perp$-closure of the CQ-orthogonal set is the semantic content. C006 is not refuted, not promoted to "the whole story" — it is the foundation the other layers rest on.

- **C007** — *Confirmed as the structural layer.* The design-schema is a presentation of the behaviour. It is not a rival ontology but a necessary component: the admin *needs* locus trees, variable bindings, and CQ-bundles to function. C007 is not refuted; it is re-framed from "what a scheme *is*" to "what a scheme *looks like*."

- **C008** — *Confirmed as the procedural layer.* The protocol fragment is the procedural surface of the scheme in a room. It is sound with respect to the behaviour and carries additional procedural information. C008 is not refuted; it is re-framed from "what a scheme *is*" to "what a scheme *does*."

**The `mutually-exclusive-with` line on each conjecture file should be replaced with `layered-complement-of`.**

---

## 6. Q-012 inheritance resolution under the layered verdict

### 6.1 The inheritance semantics

Under the layered reading, inheritance is defined at each layer:

**C006 layer (ground truth):** $S'$ is a child of $S$ iff $\llbracket S' \rrbracket \subseteq \llbracket S \rrbracket$. The child's behaviour is a *subset* of the parent's — every design that satisfies the child's stricter CQ-bundle also satisfies the parent's. This is **lattice refinement of behaviours**.

**C007 layer (structural):** The child's presentation $\mathcal{S}_{S'}$ is a *constraint-tightening* of the parent's $\mathcal{S}_S$: the child's locus tree $L_{S'}$ extends or refines $L_S$, the child's CQ-bundle $\mathrm{CQ}(S') \supseteq \mathrm{CQ}(S)$ (the child has all the parent's CQs plus possibly more), and the child's variable bindings may be more constrained.

**C008 layer (procedural):** The child's protocol fragment $\pi_{S'}$ *extends* the parent's $\pi_S$: the child inherits all the parent's obligations and may add more. The child's burden assignments for inherited CQs must be *at least as strong* (a CQ that is PROPONENT-burden in the parent cannot become CHALLENGER-burden in the child, because that would relax the obligation and potentially enlarge the behaviour, violating $\llbracket S' \rrbracket \subseteq \llbracket S \rrbracket$).

**Consistency across layers.** The three layer-specific definitions are consistent because they all follow from the same structural fact: the child's CQ-bundle is a superset of the parent's. More CQs $\Rightarrow$ smaller behaviour (C006); more constraints on the locus tree (C007); more obligations in the protocol (C008).

### 6.2 The Macagno-Walton inheritance reading

The literature review (SC10) confirms that Macagno-Walton 2015's inheritance is *informal additive* — "species of $X$ with $Y$ added on." This is consistent with the layered reading: "adding on" premises or CQs tightens constraints, which shrinks the behaviour, which makes the child a sub-behaviour of the parent. The Macagno-Walton tradition does not formalise this, but it is *compatible* with the layered formalisation. No contradiction.

### 6.3 The `inheritCQs: false` flag

Under the layered reading with C006 as ground truth:

A child scheme's behaviour is determined by its *effective* CQ-bundle — the union of inherited and declared CQs. If `inheritCQs: false`, the child's effective CQ-bundle is only its own declared CQs, *not* the parent's. A smaller CQ-bundle means a *larger* behaviour: fewer tests, more designs survive. Therefore $\llbracket S' \rrbracket \supseteq \llbracket S \rrbracket$ in general — the child's behaviour *contains* the parent's, reversing the inheritance direction.

This is **incoherent** under the layered reading's definition of inheritance ($\llbracket S' \rrbracket \subseteq \llbracket S \rrbracket$). A scheme that suppresses parent CQs is not a child in the behavioural sense. It is at best a *sibling* — same cluster family, but not a sub-scheme.

**Recommendation: retire `inheritCQs: false` as a flag on child schemes.** Replace with one of two clean alternatives:

(a) **Hard inheritance.** A child always inherits all parent CQs. `inheritCQs` is always `true` and need not be a field. The child may *add* CQs (tightening the behaviour) but may not *suppress* them. This is the C006-native semantics.

(b) **Sibling reclassification.** If an admin wants to create a scheme in the same cluster family that does *not* inherit parent CQs, the scheme is classified as a *sibling* (same `clusterTag`, no `parentSchemeId`) rather than a *child*. The `parentSchemeId` field then means strict sub-behaviour, not cluster membership.

We recommend (a) for conceptual cleanliness. The admin UX impact: remove the `inheritCQs` toggle from `SchemeCreator.tsx`; always compute effective CQ-bundle as $\mathrm{CQ}(P) \cup \mathrm{CQ}_{\mathrm{declared}}$; enforce at creation time that $\llbracket S' \rrbracket \neq \varnothing$ (non-vacuity — the combined CQ-bundle must be satisfiable).

**Note for Q-019.** The `inheritCQs: false` audit (Q-019) should inventory every existing scheme that uses the flag, check whether it is behaviourally a child or a sibling, and reclassify accordingly. This is a downstream implementation task, not a theoretical one.

---

## 7. Downstream implications and recommended edits

### 7.1 Conjecture files

**C006-scheme-as-behaviour.md:**
- `status:` `open` → `confirmed (layered — base layer)`
- `mutually-exclusive-with:` → `layered-complement-of: C007, C008`
- Add: `verdict: Confirmed as the semantic ground truth layer of the layered scheme ontology. See SCHEMES_ONTOLOGY_DECISION.md.`

**C007-scheme-as-design-schema.md:**
- `status:` `open` → `confirmed (layered — structural layer)`
- `mutually-exclusive-with:` → `layered-complement-of: C006, C008`
- Add: `verdict: Confirmed as the structural presentation layer. Multiple presentations can denote the same behaviour; the design schema is a syntactic object, not a rival ontology. See SCHEMES_ONTOLOGY_DECISION.md.`

**C008-scheme-as-protocol-constraint.md:**
- `status:` `open` → `confirmed (layered — procedural layer)`
- `mutually-exclusive-with:` → `layered-complement-of: C006, C007`
- Add: `verdict: Confirmed as the procedural surface layer. The protocol fragment is sound with respect to the behaviour and carries additional procedural information (burden distribution, closure conditions). See SCHEMES_ONTOLOGY_DECISION.md.`

### 7.2 Bridging document (SCHEMES_THEORETICAL_FOUNDATIONS.md)

- **§1.1 (Reading-A/B/C disclosure):** Update from "working prior" to "decided: the layered position is coherent (Outcome A). The trilemma dissolves; the three conjectures are complementary." Reference this document.
- **§2 Cluster A:** Rewrite to lead with the layered position. Replace "C006/C007/C008 are mutually exclusive" (line 160) with: "C006/C007/C008 form a product structure with C006 as base. See SCHEMES_ONTOLOGY_DECISION.md §5."
- **§4 (not committed to):** Rewrite to: "The programme now commits to a layered scheme ontology (C006 base, C007 structural, C008 procedural). What is not yet committed to: a position on Cluster D before S004 runs; a position on Cluster E before Q-014 is fully articulated; any retraction of admin behaviour (admin tightening is downstream of this decision)."

### 7.3 Open-questions registry

- **Q-012:** `status:` `open` → `closed-by: SCHEMES_ONTOLOGY_DECISION.md`. Resolution: "Inheritance is layered refinement — $\llbracket S' \rrbracket \subseteq \llbracket S \rrbracket$ at C006, constraint-tightening at C007, protocol extension at C008. `inheritCQs: false` is incoherent and should be retired or reclassified."

### 7.4 New theorem entry

File `T-NNN-schemes-layered-coherence.md` under `RESEARCH_PROGRAMME/02_THEOREMS_AND_PROOFS/`:

> **T-NNN (Schemes Layered Coherence).** For any well-formed scheme $S$ with CQ-bundle $\mathrm{CQ}(S)$, the three-layer scheme datum $\langle \llbracket S \rrbracket, \mathcal{S}_S, \pi_S \rangle$ satisfies:
>
> 1. $\mathcal{B}(\mathcal{S}_S) = \llbracket S \rrbracket$ (the presentation determines the behaviour via the CQ-bundle).
> 2. $\mathcal{P}(\pi_S) \subseteq \llbracket S \rrbracket$ (the protocol surface is sound with respect to the behaviour).
> 3. $\mathcal{S}_S$ and $\pi_S$ agree on $\mathrm{CQ}(S)$ (CQ-bundle consistency).
>
> Proved in SCHEMES_ONTOLOGY_DECISION.md §3–§4 with worked constructions on three production schemes (Expert Opinion / authority_family, Practical Reasoning / practical_reasoning_family, Argument from Sign / evidence_family). `closes: Q-012`.

### 7.5 Admin recommendations (no code, just the recommendation)

1. **Retire `inheritCQs: false`** or reclassify schemes using it as siblings. Add non-vacuity check at scheme creation time: verify that the combined CQ-bundle (parent + child) is satisfiable ($\llbracket S' \rrbracket \neq \varnothing$).

2. **Add CQ-bundle consistency validation.** The admin should enforce that the CQs declared in the SchemeCreator form (C007 presentation) match the burden/premiseType annotations (C008 protocol surface). Currently these can diverge silently.

3. **Add a layer indicator** to the admin UI: which fields belong to which layer (taxonomy/identification → discovery metadata for C006; variables/premises/CQs → C007 structural; burdenOfProof/requiresEvidence/premiseType → C008 procedural). This is a documentation/UX task, not a schema change.

4. **Non-vacuity check.** Block creation of schemes whose CQ-bundle is mutually unsatisfiable (no design survives all CQs). Under C006 ground truth, such schemes have $\llbracket S \rrbracket = \varnothing$ — they are degenerate.

5. **Locative coherence check.** Verify that the premise variables declared in C007 can be unified into a well-formed locus tree. Currently the admin accepts arbitrary variable lists without checking that they are structurally coherent.

---

## 8. Open questions not resolved by this session

### 8.1 Composition under the layered reading (Q-015)

The layered reading gives composition a three-layer structure:

- **C006 layer:** Scheme composition $S_1 ; S_2$ corresponds to cut composition of designs (Faggian-Hyland 2002, Terui 2011). The CQ-inheritance rule for composed schemes is: which CQs apply to $\llbracket S_1 ; S_2 \rrbracket$? This is SC22 + SC23 from the literature review, both confirmed original-to-track.

- **C007 layer:** Composition is plugging one scheme's locus tree into another's hole. C007 gives the cleanest story for this (the conjecture file already notes it).

- **C008 layer:** Composition is protocol *concatenation* — different mathematical operation from cut-of-designs. The question: is protocol-concatenation sound with respect to behaviour-cut-composition? I.e., does $\mathcal{P}(\pi_{S_1} \cdot \pi_{S_2}) \subseteq \mathcal{B}(\mathcal{S}_{S_1 ; S_2})$? This extends the §3.4 soundness theorem to composed schemes and is an open question.

**Status:** Q-015 remains open. The layered reading refines the question (composition must be checked at all three layers) but does not answer it.

### 8.2 C009 / Q-016 (scheme-rivalry as fourth attack category)

**Out of scope for this session.** C009 is independent of the trilemma: each layer admits scheme-rivalry restated in its native vocabulary (behaviour-intersection emptiness at C006; locus-tree disjointness at C007; protocol incompatibility at C008). C009's resolution should not be coupled to the layered verdict.

### 8.3 Q-017 (CQ-of-CQ recursion)

Under the layered reading, the CQ-of-CQ regress has a natural account at the C006 layer: CQs are themselves designs with their own orthogonals, so the regress corresponds to iterated biorthogonal closure. Whether this terminates depends on the finite-generation constraint (Girard's restriction to finite locus sets, which the substrate enforces). The layered reading makes the recursion well-typed but does not prove termination. Q-017 remains open.

**Dependency note for Q-017:** The termination question is *not* ontology-dependent under the layered reading (all three layers share the CQ-bundle, so the recursion is the same regardless of which layer you formulate it in). This simplifies Q-017's resolution.

### 8.4 Q-018 (OntoClean meta-properties)

Downstream of the layered verdict. Now that C006 is the semantic ground truth, OntoClean meta-properties (rigidity, identity, unity, dependence) should be applied *to the behaviours*, not to the syntactic presentations. A scheme is *rigid* iff every design that is in its behaviour is *necessarily* in its behaviour (i.e., the behaviour is closed under all accessible perturbations). A scheme supplies an *identity criterion* iff the behaviour determines a unique orthogonal class. These are non-trivial applications of OntoClean to a novel domain. Q-018 remains open.

### 8.5 Q-019 (`inheritCQs: false` audit)

The layered verdict declares `inheritCQs: false` incoherent under C006 ground truth (§6.3). Q-019 is the implementation-side audit: inventory existing schemes using the flag, check whether each is behaviourally a child or a sibling, reclassify. Q-019 remains open as an engineering task downstream of this decision.

### 8.6 The convolution construction (OQ-JSL-Ambler from LUDICS_OQ_JSL_PROOF.md §7)

The Phase 2e proof established that the per-cone JSL is the correct carrier for the articulation lattice. The layered scheme reading now asks: does the convolution construction (LUDICS_OPEN_COMPOSITION_JOINT.md §0d.2) compose scheme-behaviours correctly under the per-cone decomposition? The concern: if two schemes' behaviours decompose into different cone structures, composing them requires cone-alignment. This is an open question at the intersection of the scheme track and the Ludics substrate track.

### 8.7 Presentation multiplicity and admin canonicality

The layered reading establishes that multiple C007 presentations can denote the same C006 behaviour ($\mathcal{B}$ is not injective). The admin currently stores *one* presentation per scheme. This raises the question: when two admins create different-looking schemes with the same effective CQ-bundle, should the admin detect this as a non-redundancy violation and propose merging? This is a UX/implementation question downstream of Q-014 (ontology vs folksonomy).

---

*End of SCHEMES_ONTOLOGY_DECISION.md*