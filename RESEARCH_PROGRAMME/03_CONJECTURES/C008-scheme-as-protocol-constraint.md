# C008 — A scheme is a protocol constraint: a rule on the room's dialogue protocol that obliges the proponent to offer subloci for each CQ and grants the opponent the right to play at any CQ-locus

- **status:** open
- **ring:** core
- **depends-on:** T001, T002
- **linked-open-questions:** Q-011, Q-012, Q-014, Q-015
- **mutually-exclusive-with:** C006, C007
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
