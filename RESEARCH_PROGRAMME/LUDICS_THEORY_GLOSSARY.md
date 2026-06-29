# Ludics — Theory Glossary

> A compressed reference to the *upstream* theory of ludics (Girard 2001,
> *Locus Solum*; Faggian, Curien, Fouqueré & Quatrini). This file is the
> **theory** companion to [`07_GLOSSARY.md`](07_GLOSSARY.md), which records
> where the substrate *diverges* from this baseline. Definitions here are
> standard unless noted; one short paragraph per term.

---

## 0. One-paragraph orientation

Ludics is Girard's *interactive* reconstruction of logic. It throws away the
distinction between syntax (proofs) and semantics (their meaning) and replaces
both with a single object — the **design** — and a single dynamic — **normalisation
as a play between two designs**. Formulas are not given in advance; a formula
(a **behaviour**) is *recovered* as the set of designs that interact well with
a fixed set of opponents (closure under **bi-orthogonality**). Truth becomes
"convergence of interaction"; proof becomes "a winning strategy"; logical
connectives become operations on loci. The whole edifice is built on **addresses
(loci)**, not on the contents stored at them — hence "locus solum", *location alone*.

---

## 1. Loci and the arena

### Locus (address)
A finite sequence of natural numbers `ξ = ⟨i₁, …, iₙ⟩` naming a position in an
infinite tree. Loci, not formulas, are the primitive carriers of logical
structure. A locus `ξ` has **sub-loci** `ξ·i` (append a natural number). All of
ludics happens by addressing, splitting, and focusing on loci.

### Bias / polarity
Every locus carries a **polarity**: **positive** (the design *acts* here — the
Player speaks) or **negative** (the design *waits* here — the Opponent speaks).
Polarity strictly alternates down the tree. Positive = "I move", negative =
"you move". This is the proof-theoretic residue of focalisation.

### Ramification
The (finite) set of sub-loci a single action opens. If an action on `ξ` has
ramification `I ⊆ₙ ℕ`, it simultaneously creates the sub-loci `{ξ·i : i ∈ I}`.
Ramification is how a connective's "immediate subformulas" appear without ever
naming a formula.

### Base / pitchfork
The **base** (written `Γ ⊢ Δ`, a *pitchfork*) fixes the addresses a design lives
on: a finite set of negative loci on the left and positive loci on the right.
It is the typing context for an interaction — what's "on the table" before play.

---

## 2. Actions, chronicles, designs

### Action
The atomic move. A **proper action** is a triple **(polarity, locus ξ, ramification I)**:
"act at `ξ`, opening sub-loci `I`". There are two improper/terminal actions:
the **daimon** `†` (give up / assert) and (in some presentations) implicit
divergence. An action is **justified** if its locus is a sub-locus opened by an
earlier action (or sits in the base).

### Daimon (`†`)
The positive action that *ends* a play by abandoning it — the player "throws in"
and declares the interaction complete/won-by-fiat. The daimon is what makes
**partial** proofs first-class: it lets a design converge without having fully
justified everything, and it is the engine of paraproofs and of testing.

### Chronicle
A single, linear, **alternating, justified** sequence of actions — one coherent
"line of play" through the tree, ending (if finite) in a daimon or a positive
action. A chronicle is the ludics analogue of a *branch* of a proof / a *single
run* of a strategy.

### Design
The central object. A **design** is a set of chronicles closed under the
coherence conditions below — equivalently, a **focalised, justified strategy**
on a base. Intuitively a design is a (possibly partial, possibly infinite)
proof *seen as how it reacts to every opponent*. Designs come in two equivalent
presentations: as **sets of chronicles** (Girard) or as **abstract Böhm-like
trees / strategies** (Curien, Faggian). The five conditions a chronicle-set must
satisfy to be a design:

- **Arborescence (forest):** chronicles are closed under prefix and form a tree.
- **Coherence:** two chronicles sharing a prefix either continue identically or
  fork at a *negative* action (Opponent chooses; Player is deterministic).
- **Positivity:** a maximal finite chronicle ends with a positive action
  (typically `†`).
- **Totality (optional):** the empty/`Fid` cases; a design may be **partial**.
- **Daimon-as-leaf:** `†` only ever occurs last in a chronicle.

### Cut / cut-net
Plugging two designs together on a shared locus of opposite polarity (one acts,
the other waits). A **cut-net** is a finite set of designs connected by cuts —
the configuration that **normalisation** consumes.

---

## 3. Interaction: the heart of ludics

### Normalisation (interaction)
The dynamics. Given two designs sharing a cut locus, **play** them against each
other: the positive action on one side selects a branch on the other, alternately,
following loci. Normalisation either **converges** (reaches a daimon — the
interaction completes) or **diverges** (runs forever / gets stuck). Cut-elimination,
proof-normalisation, and strategy-composition are all *the same operation* here.

### `[[D, E]]` — the result of interaction
The normal form / outcome of playing designs `D` and `E`. The key binary verdict:
the interaction is either **`†` (convergent / Player wins)** or **`Fid`/divergent
(failed)**.

### Orthogonality (`D ⊥ E`)
The fundamental relation: `D ⊥ E` iff their interaction **converges to the daimon**
(`[[D, E]] = †`). Read as "`D` and `E` pass each other's test" / "`D` is a winning
strategy against opponent `E`". Orthogonality is the single primitive from which
*all* logical content is reconstructed.

### Orthogonal set (`D^⊥`)
For a set of designs `A`, `A^⊥ = { E : E ⊥ D for all D ∈ A }` — every counter-design
that beats all of `A`. The "tests `A` must survive."

---

## 4. Behaviours: formulas, recovered

### Behaviour
A set of designs `B` (on a fixed base) that is **equal to its own bi-orthogonal**:
`B = B^⊥⊥`. Behaviours are the ludics notion of **formula / type / proposition**.
The slogan: *a formula is not a primitive — it is whatever set of proofs is stable
under testing.* `B^⊥` is its **linear negation** (and is automatically a behaviour).

### Bi-orthogonal closure (`(-)^⊥⊥`)
The closure operator taking any set of designs to the smallest behaviour
containing it. `B = B^⊥⊥` is exactly the **closure / saturation** condition.
This is the ludics version of the **double-negation / completeness** phenomenon:
membership is decided purely by passing all counter-tests.

### Incarnation (`|B|`, `|D|_B`)
The **material content** of a behaviour: the smallest designs that already realise
it. `|D|_B` is the part of design `D` actually *visited* during interaction with
`B^⊥` — the rest is "fat" and can be discarded. **Incarnated designs** (`|B| = {|D|_B}`)
are the canonical, minimal proofs; incarnation makes "the same proof up to junk"
precise.

### Behaviour as join/meet structure
Behaviours over a base, ordered by inclusion, carry lattice-like structure;
incarnated designs give canonical representatives. (The substrate's *per-cone
join-semilattice* refinement of this is the project-original part — see
[`07_GLOSSARY.md`](07_GLOSSARY.md) §"OQ-JSL".)

---

## 5. Connectives and the logic that emerges

### Internal completeness
Ludics' signature theorem: for the ludics connectives, the behaviour of a compound
formula is built **directly** from the behaviours of its parts with **no extra
designs needed** — the bi-orthogonal closure adds nothing beyond the obvious
union/composition. This replaces the usual soundness+completeness pair with a
single structural identity. It is *the* reason ludics is called "interactive
completeness".

### Additives (`⊕`, `&`) and multiplicatives (`⊗`, `⅋`)
The linear-logic connectives reappear as operations on behaviours over **disjoint**
or **shared** loci:
- **`⊗` / `⅋`** (multiplicatives): juxtapose behaviours on *delocated* (disjoint) loci.
- **`⊕` / `&`** (additives): choose among behaviours sharing a locus; the polarity
  of the locus decides who chooses (Player for `⊕`, Opponent for `&`).
Quantifiers and exponentials (`!`, `?`) extend this with locus-families and
reusability. Crucially, the connectives are **defined**, not postulated.

### Delocation / fax (`Fax`)
A **fax** is the identity-like design that faithfully copies an entire sub-behaviour
from one locus to another (a "delocation"). It is ludics' **identity axiom / η-expansion**:
the proof that a behaviour entails itself, and the glue used to relocate
behaviours when forming multiplicatives.

---

## 6. Strategies, games, and partiality

### Designs as strategies (the game-semantics reading)
A design *is* an innocent, deterministic Player strategy on the arena fixed by its
base; orthogonality is "Player beats this Opponent counter-strategy". Curien and
Faggian recast Girard's chronicle-sets as **abstract Böhm trees**, making the
HO/AJM game-semantics bridge explicit. Ludics is thus a *foundational* game
semantics where the arena itself is generated by addresses.

### Partial design / paraproof
Because `†` can terminate any branch, designs need not be "logically valid": a
**paraproof** is a design that may assert without justification. This is a feature:
it lets ludics model *dialogue*, *refutation*, and *incremental* argument, where
moves are made before everything is grounded. (This is the hook the substrate uses
to model real deliberation.)

### Convergence vs. divergence as truth-values
There is no third value at the level of a single interaction: you either reach the
daimon (`†`) or you don't. All graded/probabilistic notions (confidence, etc.) are
*built on top* of this binary substrate, not inside it.

---

## 7. Cheat-sheet of symbols

| Symbol | Reads as | Section |
|---|---|---|
| `ξ`, `ξ·i` | locus, sub-locus | §1 |
| `(±, ξ, I)` | action: polarity, locus, ramification | §2 |
| `†` | daimon (give up / convergence marker) | §2 |
| `⊢ / ⊣` (pitchfork) | base (typing context of a design) | §1 |
| `[[D, E]]` | normal form of interaction | §3 |
| `D ⊥ E` | orthogonality (`[[D,E]] = †`) | §3 |
| `A^⊥` | orthogonal (set of counter-designs) | §3 |
| `B = B^⊥⊥` | behaviour (= formula) | §4 |
| `|B|`, `|D|_B` | incarnation (material content) | §4 |
| `Fax` | fax / delocation (identity) | §5 |

---

## 8. Primary sources

- **Girard, J.-Y. (2001).** *Locus Solum: From the rules of logic to the logic of
  rules.* Math. Struct. Comp. Sci. 11(3). — the founding paper (designs, behaviours,
  orthogonality, internal completeness).
- **Curien, P.-L.** *Introduction to linear logic and ludics, parts I–II.* — the
  accessible reconstruction; designs as abstract Böhm trees.
- **Faggian, C. & Curien, P.-L.** *L-nets, strategies and proof-nets.* — designs as
  strategies / game-semantics bridge.
- **Fouqueré, C. & Quatrini, M. (2013+).** Incarnation, behaviour structure, and
  applications of ludics to discourse/argumentation — the lineage this programme
  extends.
- **Terui, K.** *Computational ludics.* TCS 2011 — complexity / computational reading.

> For where Mesh's *substrate* re-interprets these terms (behaviours as Prisma rows,
> designs as unordered chronicle-sets, deliberation-scoped loci, the per-cone JSL,
> the walked/witnessable/latent stratification), see [`07_GLOSSARY.md`](07_GLOSSARY.md).
