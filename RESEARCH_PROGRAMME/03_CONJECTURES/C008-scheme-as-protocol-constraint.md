# C008 — A scheme is a protocol constraint: a rule on the room's dialogue protocol that obliges the proponent to offer subloci for each CQ and grants the opponent the right to play at any CQ-locus

- **status:** confirmed (layered — procedural layer)
- **ring:** core
- **depends-on:** T001, T002
- **linked-open-questions:** Q-011, Q-014, Q-015 (Q-012 closed)
- **layered-complement-of:** C006 (base / semantic ground truth), C007 (structural layer)
- **verdict:** Confirmed as the procedural surface layer of the layered scheme ontology. The protocol fragment `π_S` is *sound with respect to* the C006 behaviour (`𝓟(π_S) ⊆ ⟦S⟧`) and carries additional procedural information (burden distribution, closure conditions) that the behaviour does not determine. Soundness is *proper inclusion* in general — the gap `⟦S⟧ ∖ 𝓟(π_S)` is exactly the exposure map's latent stratum applied to the scheme's behaviour. The `epistemicMode` candidate counterexample does not land: modal annotations live at the C007 layer (and affect C006 selection) without requiring a C008 encoding. See [`../../Development and Ideation Documents/ARCHITECTURE/SCHEMES_ONTOLOGY_DECISION.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_ONTOLOGY_DECISION.md) §3.3–§3.4, §4.5, and [T003 — Schemes Layered Coherence](../02_THEOREMS_AND_PROOFS/T003-schemes-layered-coherence.md).
- **last-reviewed:** 2026-05-27

## Statement

A scheme `S` is *not* an object inhabiting `Designs` or a behaviour over
`Designs`, but a *protocol fragment* `π_S` that, once a proponent has
declared "I am applying scheme S here," extends the room's dialogue
protocol with:

- **proponent obligations:** for each `q ∈ CQ(S)`, a sub-locus the
  proponent must be prepared to defend at (an enforced opening of opponent
  loci in the substrate's sense);
- **opponent rights:** the opponent has the *right* to play at any
  CQ-locus, and the system is required to surface these CQ-loci in the
  exposure map's *walked* layer (not the *latent* layer) once the scheme
  is declared;
- **closure conditions:** the proponent wins the scheme-instance iff every
  declared CQ-locus has either (a) been defended in a finite interaction
  or (b) gone unchallenged through the room's stopping rule.

Scheme identity is *protocol-extensional*: two schemes are the same iff
they extend the protocol the same way (same locus obligations, same
rights, same closure conditions). Walton taxonomy fields and identification
patterns are *discovery metadata*; CQ-bundles are *protocol clauses*.

## Positive settlement

A worked formalisation showing that the admin UI's `burdenOfProof`,
`requiresEvidence`, and `premiseType` fields on each CQ are precisely the
fragments of the protocol extension `π_S` and not arbitrary metadata. The
formalisation must:

- exhibit, for at least two production schemes, the explicit `π_S` derived
  from the admin row;
- show that the substrate's existing protocol-saturation operator `σ`
  composes meaningfully with `π_S` — i.e. `σ` on a scheme-extended
  protocol respects the additional clauses;
- explain why the same scheme can be applied at multiple loci in the same
  room without identity confusion (the protocol fragment is *parameterised
  by the application locus*).

## Negative settlement

A production-scheme feature that cannot be naturally encoded as a protocol
clause — e.g. the `epistemicMode` field (Kienpointner factual /
hypothetical / counterfactual) is a *modal* annotation on the conclusion,
not a procedural rule on the dialogue, and may resist this framing. If
multiple admin fields resist protocol-encoding, the scheme is *more than*
a protocol fragment, pushing toward C006 (behaviour) or C007 (design
schema).

## Consequences if confirmed

- The Walton taxonomy fields lose constitutive status (agreeing with C006
  on this point) but identification patterns remain useful as *protocol
  triggers* — natural-language predicates that suggest when to invoke `π_S`.
- The folksonomy/ontology question (Q-014) gets a clean answer: the
  catalogue is a *protocol library*, and the well-formedness rules for a
  new scheme are the well-formedness rules for a protocol fragment
  (non-deadlocking, finitely-terminating, locally-conservative).
- Scheme composition (Q-015) is protocol *concatenation*, not cut
  composition of designs — different mathematical operation, different
  obligations.

## Consequences if refuted

If schemes have features (epistemic mode, conclusion structure) that resist
protocol encoding, schemes are *more* than protocol fragments. The
remaining content is either a structural commitment (C007, design schema)
or a semantic commitment (C006, behaviour).

## Bibliography

- Hamblin 1970 *Fallacies* (commitment stores as protocol state)
- Walton & Krabbe 1995 *Commitment in Dialogue* (typed dialogue protocols)
- McBurney & Parsons 2009 *Dialogue Games for Agent Argumentation*
- Prakken 2005 *Coherence and Flexibility in Dialogue Games for Argumentation*
- ASPIC+ premise typing (Modgil & Prakken 2014) — the `premiseType` field
  comes from here
- [`../../Development and Ideation Documents/ARCHITECTURE/SCHEMES_THEORETICAL_FOUNDATIONS.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_THEORETICAL_FOUNDATIONS.md) Cluster A
