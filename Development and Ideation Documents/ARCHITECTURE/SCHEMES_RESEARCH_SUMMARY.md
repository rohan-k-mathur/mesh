# Argument Schemes Research — Compressed Summary

> A standalone overview of the argumentation-scheme research programme in Mesh:
> the central question, the formal result that answers it, the open questions
> that remain, the empirical findings, and the implementation arc that turns the
> theory into shipped code.

**Last updated:** 2026-06-01

---

## Executive abstract

This programme answers one question — *what is an argumentation scheme?* — for an
interaction-first (Ludics) substrate, and turns the answer into shipped code.

The headline result is the **layered ontology** (theorem T003): a scheme is not
one thing but a coherent triple $\langle \llbracket S \rrbracket, \mathcal{S}_S, \pi_S \rangle$
— a **behaviour** (the $\perp\!\perp$-closed set of designs surviving every critical
question, which is the scheme's identity), a **presentation** (a locus tree with
typed holes), and a **protocol** (a procedural surface). Three rival conjectures
(scheme-as-behaviour, -as-design-schema, -as-protocol) are reconciled as *layers*
rather than competitors, with the behaviour as semantic ground truth. This forces
inheritance to be lattice refinement ($\llbracket S' \rrbracket \subseteq \llbracket S \rrbracket$),
retires the incoherent `inheritCQs: false` flag, and mandates a certificate-based
equality verifier because presentations map many-to-one onto behaviours.

Empirically, an OntoClean audit of the live catalogue found it to be a *"folksonomy
in practice, ontology in aspiration"*: machinery-clean but riddled with duplicates,
test placeholders, and miscategorised entries. A seven-phase remediation arc is in
flight — phases 0–4 shipped (hygiene, provenance, behaviour-equality verifier,
well-formedness rules, protocol-soundness gate), phase 5 partial, phases 6–7 open —
shrinking the catalogue from 31 noisy rows to 24 clean, fingerprinted ones.

Several claims are **substrate-original** (schemes-as-behaviours, CQs as obligatory
opponent loci, scheme-composition as cut-composition, a proposed *fourth* attack
category for scheme-rivalry); the published Ludics literature never touches
Walton-style schemes, making "Ludics-meets-Walton" a confirmed null result.

**If you read one thing:** §2 (the layered ontology) is the load-bearing result;
everything else either justifies it (§1, §6), tests it against reality (§4), or
operationalises it (§5).

---

## 1. The core question

> *What is an argumentation scheme in Isonomia's Ludics substrate?*

The programme began by auditing the implicit theory embedded in the
`/admin/schemes` UI and the `ArgumentScheme` catalogue, then formalizing it.
Three foundational documents anchor the work:

- [SCHEMES_THEORETICAL_FOUNDATIONS.md](SCHEMES_THEORETICAL_FOUNDATIONS.md) — the implicit commitments of the admin surface, organised into clusters.
- [SCHEMES_LITERATURE_REVIEW.md](SCHEMES_LITERATURE_REVIEW.md) — the published-literature backing and the catalogue of substrate-original claims.
- [SCHEMES_ONTOLOGY_DECISION.md](SCHEMES_ONTOLOGY_DECISION.md) — the decision that resolves the central question.

---

## 2. The central result — the layered ontology (T003)

Three competing conjectures named candidate answers to the core question:

- **C006 — scheme-as-behaviour:** a scheme *is* the set of designs that survive its critical questions.
- **C007 — scheme-as-design-schema:** a scheme *is* a locus tree with typed holes plus a CQ-bundle.
- **C008 — scheme-as-protocol-constraint:** a scheme *is* a protocol fragment that extends a room's dialogue rules.

The trilemma was resolved as **not mutually exclusive but layered**
([T003 — Schemes Layered Coherence](../../RESEARCH_PROGRAMME/02_THEOREMS_AND_PROOFS/T003-schemes-layered-coherence.md)).
A scheme is a triple

$$
S = \langle\, \llbracket S \rrbracket,\; \mathcal{S}_S,\; \pi_S \,\rangle
$$

fibred over its shared critical-question bundle $\mathrm{CQ}(S)$:

| Layer | Conjecture | Object | Role |
|---|---|---|---|
| **Behaviour** $\llbracket S \rrbracket$ | C006 | $\perp\!\perp$-closed design set | **Semantic ground truth.** Scheme identity is behaviour-extensional: two schemes are the same iff their behaviours agree. |
| **Presentation** $\mathcal{S}_S$ | C007 | locus tree + typed holes + CQ-bundle | **Structural description.** The map $\mathcal{B}$ (presentation→behaviour) is *many-to-one* — multiple presentations denote one behaviour. |
| **Protocol** $\pi_S$ | C008 | protocol fragment (burden, closure) | **Procedural surface.** The map $\mathcal{P}$ (protocol→behaviour) is *sound*: $\mathcal{P}(\pi_S) \subseteq \llbracket S \rrbracket$, proper in general — the gap is the *latent stratum*. |

**The three coherence conditions (T003):**

1. **Presentation determines behaviour:** $\mathcal{B}(\mathcal{S}_S) = \llbracket S \rrbracket$.
2. **Protocol soundness:** $\mathcal{P}(\pi_S) \subseteq \llbracket S \rrbracket$ (the protocol never produces designs outside the behaviour).
3. **CQ-bundle consistency:** the presentation and the protocol reference the same critical questions.

**Why it is forced, not chosen.** The layered structure is isomorphic to the
substrate's existing $\iota$ dialectical/witnessing layer separation under
Reading C + T4. Any other resolution would treat scheme ontology under a
discipline incompatible with how the substrate already treats deliberation.

**Downstream consequences:**

- Inheritance is **lattice refinement**: $\llbracket S' \rrbracket \subseteq \llbracket S \rrbracket$ (a child has *more* CQs, hence a *smaller* behaviour).
- The `inheritCQs: false` flag is **incoherent** (it would enlarge the child's behaviour, reversing inheritance) and is retired.
- Because $\mathcal{B}$ is non-injective, behaviour-equality needs a **certificate-based verifier**, not canonical forms.

---

## 3. The open-questions registry (the research spine)

Tracked append-only in
[01_OPEN_QUESTIONS_REGISTRY.md](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md).
The scheme cluster:

**Closed**

| ID | Question | Resolution |
|---|---|---|
| Q-012 | Inheritance semantics | Layered refinement; closed by T003 + ontology decision |
| Q-018 | OntoClean meta-property classification | folksonomy-in-practice (see §4) |
| Q-019 | `inheritCQs: false` audit | 0 of 31 rows use it — flag retired trivially |
| Q-020 | External-catalogue field comparison | principled minimalism; 5 follow-on questions filed |

**Open — formal**

- **Q-011** — Is Pollock's REBUT / UNDERMINE / UNDERCUT attack trichotomy exhaustive for the substrate?
- **Q-015** — Does scheme composition correspond to *cut composition* of designs?
- **Q-017** — Does the CQ-of-CQ recursion terminate?
- **Q-021** — How does the admin decide behaviour-equality, given $\mathcal{B}$ is non-injective?

**Open — empirical / philosophical**

- **Q-013** — Does "Generate from Taxonomy" produce CQ-bundles practitioners accept unmodified?
- **Q-014** — Is the catalogue an *ontology* or a *folksonomy*, and what does the answer obligate?
- **C009 / Q-016** — Is a **fourth attack category** (scheme-rivalry / behaviour-intersection emptiness) required? The most consequential proposed substrate-original extension to attack typology since Pollock.

**Open — engineering follow-ons (Q-022 – Q-026)**

Provenance schema, AIF version pinning, `createdAt`/`updatedAt`/`createdBy`
columns, `isAxiomatic` vs Carneades `premiseType`, and Wagemans PTA
`subjectType` placement.

---

## 4. Key empirical finding (Q-018)

The OntoClean audit
([audits/q018-ontoclean-20260528.md](../../audits/q018-ontoclean-20260528.md))
classified 31 schemes:

- **Strict machinery clean:** 0 rigid / 31 non-rigid / 0 anti-rigid; 0 strict OntoClean violations. (Argument schemes are uniformly non-rigid as a *domain* — no rigidity-subsumption violation is even possible.)
- **Qualitative signals uniformly folksonomic:** 3 duplicate-candidate pairs, 2 test placeholders shipped to production, 4 dialogue-meta entries miscategorised as schemes, 9 of 31 schemes with no cluster tag, 1 cluster-naming inconsistency.

**Verdict for Q-014:** the catalogue is *"folksonomy in practice, ontology in
aspiration."* The well-formedness rules and verifier (below) are the move toward
ontology; this audit is the empirical baseline against which the move is measured.

> **Caveat:** single-analyst pass. Inter-rater replication (Cohen's κ ≥ 0.6) is
> still outstanding.

---

## 5. From folksonomy to ontology (the implementation arc)

The checklist
[FROM_FOLKSONOMY_TO_ONTOLOGY_SCHEMES.md](FROM_FOLKSONOMY_TO_ONTOLOGY_SCHEMES.md)
drives 7 phases. The catalogue is now **24 clean, behaviour-fingerprinted rows**
(down from 31).

| Phase | Status | What it delivers |
|---|---|---|
| **0 — Catalogue hygiene** | ✅ shipped | Removed test placeholders; `kind` discriminator splits argument-schemes from dialogue-meta; cluster tags backfilled. |
| **1 — Provenance & timestamps** | ✅ shipped | `sourceCatalogue`/`sourceId`/`sourceVersion`/`importedAt` + `createdAt`/`updatedAt`/`createdBy`. |
| **2 — Behaviour-equality verifier** | ✅ shipped | [lib/schemes/verifier/](../../lib/schemes/verifier/behaviourEquality.ts) — returns `equal \| subset \| incomparable \| inconclusive` with a fingerprint pre-filter. |
| **3 — Well-formedness rules** | ✅ shipped | [validatePresentation.ts](../../lib/schemes/validation/validatePresentation.ts) — WF1/WF2/WF3 at error severity; `inheritCQs` column dropped. |
| **4 — Protocol soundness** | ✅ shipped | Instance-close soundness gate; `SchemeInstance.status`; Carneades `premiseType` defaults; latent-obligations panel. |
| **5 — Round-trip soundness** | 🟡 partial | Catalogue-redundancy sweep done (`equal=0 / subset=0`); AIF version-pin + `≡_substrate-relevant` round-trip pending. |
| **6 — Typology completion** | ⬜ not started | `isAxiomatic` vs `premiseType` (Q-025); `subjectType` for PTA (Q-026). |
| **7 — Inter-rater replication** | ⬜ not started | Second-analyst replication of Q-018 / Q-020 (κ ≥ 0.6). |

**Verifier two-tier discipline.** The *fingerprint*
([computeFingerprint.ts](../../lib/schemes/verifier/computeFingerprint.ts)) is a
cheap **necessary-but-not-sufficient** pre-filter; the *verifier* is the
sufficient check. There is no canonical-form route (Q-021 forecloses it) — any
code path treating a fingerprint match as equality is a bug.

---

## 6. Literature posture

The review confirms a set of **substrate-original** claims with no published
precedent:

- schemes-as-behaviours (Reading C);
- critical questions as *obligatory opponent loci*;
- scheme composition $\equiv$ cut composition of designs;
- the C006 / C007 / C008 trilemma itself;
- OntoClean applied to argumentation-scheme catalogues;
- the scheme-rivalry fourth attack category.

**Ludics-meets-Walton is a confirmed null.** The published Ludics-and-language
line (Girard 2001; Faggian & Hyland 2002; Lecomte & Quatrini; Fouqueré &
Quatrini; Terui 2011) applies Ludics to dialogue acts and natural-language
semantics — never to Walton-style schemes or critical-question bundles.

---

## 7. Document map

| Concern | Document |
|---|---|
| Implicit theory of the admin surface | [SCHEMES_THEORETICAL_FOUNDATIONS.md](SCHEMES_THEORETICAL_FOUNDATIONS.md) |
| Published-literature backing | [SCHEMES_LITERATURE_REVIEW.md](SCHEMES_LITERATURE_REVIEW.md) |
| Trilemma resolution (the decision) | [SCHEMES_ONTOLOGY_DECISION.md](SCHEMES_ONTOLOGY_DECISION.md) |
| The theorem | [T003 — Schemes Layered Coherence](../../RESEARCH_PROGRAMME/02_THEOREMS_AND_PROOFS/T003-schemes-layered-coherence.md) |
| Open questions | [01_OPEN_QUESTIONS_REGISTRY.md](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md) |
| Conjectures | [C006](../../RESEARCH_PROGRAMME/03_CONJECTURES/C006-scheme-as-behaviour.md), [C007](../../RESEARCH_PROGRAMME/03_CONJECTURES/C007-scheme-as-design-schema.md), [C008](../../RESEARCH_PROGRAMME/03_CONJECTURES/C008-scheme-as-protocol-constraint.md), [C009](../../RESEARCH_PROGRAMME/03_CONJECTURES/C009-scheme-rivalry-fourth-attack.md) |
| Implementation tracks | [IMPLEMENTATION_TRACKS.md](../../RESEARCH_PROGRAMME/IMPLEMENTATION_TRACKS.md); Specs 2–5 (`SCHEMES_IMPL_*.md`) |
| Folksonomy→ontology checklist | [FROM_FOLKSONOMY_TO_ONTOLOGY_SCHEMES.md](FROM_FOLKSONOMY_TO_ONTOLOGY_SCHEMES.md) |
| Empirical audits | [audits/](../../audits/) (Q-018, Q-019, Q-020, catalogue-redundancy) |
