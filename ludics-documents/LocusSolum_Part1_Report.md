
# Locus *Solum* — Part 1 (Girard)  
**A contributor‑friendly summary & guide**

> Project: Mesh — Knowledge Notes / Repo Docs  
> Text: *Locus Solum: From the Rules of Logic to the Logic of Rules*, **Part 1** (Jean‑Yves Girard).  
> Purpose: Onboard contributors quickly to **ludics** with practical definitions, a worked micro‑example, and connections to proof theory and programming. fileciteturn0file0

---

## Executive summary (why Part 1 matters)

- **Shift of viewpoint:** Instead of starting from formulas and inference rules, **ludics** starts from **interaction** between moves at **addresses** (*loci*). Logical structure **emerges** from what normalizes against what. fileciteturn0file0  
- **Locality as a first‑class idea:** Reasoning happens *at places*; moves are tied to addresses. Composition wires places together. This makes resources and causality explicit. fileciteturn0file0  
- **Designs over formulas:** A **design** is a proof‑like strategy (possibly infinite but locally finite), made of **positive/negative actions** with justification pointers. Designs are the objects that interact. fileciteturn0file0  
- **Orthogonality & behaviours:** Two designs are **orthogonal** when their interaction **converges** (normalizes). Meanings (a.k.a. *types*) are **behaviours**: sets of designs closed under bi‑orthogonality. fileciteturn0file0  
- **The *daimon* (⊥):** A special “anytime” action that can terminate play; technically useful for well‑foundedness and semantically a top element for interaction. fileciteturn0file0  

---

## What Part 1 introduces (topic map)

> Order and headings in the PDF vary by edition; this map follows the flow of Part 1’s first chunk rather than strict section numbers. fileciteturn0file0

1. **Motivation & slogan.** “From the rules of logic to the logic of rules”: the *operational life* of rules **is** the logic. We observe **plays** instead of axiomatizing formulas first. fileciteturn0file0  
2. **Loci (addresses).** Every move happens at an **address**; addresses compose and branch. This makes locality, independence, and concurrency visible. fileciteturn0file0  
3. **Polarity & actions.** **Positive** actions (offers, productions) and **negative** actions (requests, challenges) alternate and steer interactions. fileciteturn0file0  
4. **Designs.** Forests of actions with justification links; think “proof without formulas”. Allow potentially infinite behaviour while remaining locally finite. fileciteturn0file0  
5. **Chronicles / views.** Observable linearizations (paths) through a design; the *trace* of one possible play. fileciteturn0file0  
6. **Interaction (cut) and normalization.** Running two designs together along shared loci; **orthogonality** if the run converges. fileciteturn0file0  
7. **Behaviours & bi‑orthogonality.** Meanings as interaction‑stable sets (D in B iff ∀E∈B⊥, D ⟂ E). fileciteturn0file0  
8. **Daimon.** A global abort/accept action; clarifies top behaviour and controls divergence. fileciteturn0file0  

---

## Key definitions (plain English)

- **Locus (address)** — A coordinate where a move can occur. Addresses branch (e.g., `σ.1`, `σ.2`) to record *where* we are in the play. fileciteturn0file0  
- **Action** — A move at a locus, tagged **+** (positive) or **−** (negative), with a justification pointer to a prior action (its *enabling*). fileciteturn0file0  
- **Design** — A set/forest of actions with justification; a strategy that may be infinite but is locally finite. A design determines what plays it is willing to engage in. fileciteturn0file0  
- **Chronicle / view** — A single observable path through a design (a play‑prefix); used to talk about *what we can see* of a strategy. fileciteturn0file0  
- **Interaction** — Plug two designs on dual interfaces (matching loci) and let their actions alternate according to polarity and justification. fileciteturn0file0  
- **Normalization** — The interaction *converges* to a terminal configuration (possibly the **daimon**). If so, the two designs are **orthogonal**. fileciteturn0file0  
- **Behaviour** — A set of designs `B` such that `B = B⊥⊥`. Behaviours are the semantic *types* of ludics. fileciteturn0file0  
- **Daimon (⊥)** — A special action available at any locus that can close the play; gives a greatest element and simplifies closure arguments. fileciteturn0file0  

---

## Worked micro‑example (two‑branch offer)

Below is a schematic, *not* from the text verbatim, but aligned with Part 1’s notions. It shows a design that **offers** two alternatives at the root address `σ`, and a counter‑design that **tests** the left branch.

```
Design D (positive strategy at σ)
  + σ                 // offer at root
  + σ·1               // offer left branch
  + σ·2               // offer right branch
  (and sub-structure under σ·1 or σ·2 ...)

Counter-design E (negative test at σ)
  − σ                 // request at root
  − σ·1               // choose the left branch and keep probing
```

**Interaction sketch.** Plug `D` and `E` so that their shared locus is `σ`. The first moves synchronize: `E` issues `−σ` (a request), which `D` can answer with `+σ`. Then `E` focuses on `σ·1`; if `D` has a compatible continuation under `σ·1`, the run **normalizes**, so `D ⟂ E`. If `D` only developed `σ·2`, the run **fails** (no move available at `σ·1`), showing non‑orthogonality. This is how *meaning as tests* works in ludics. fileciteturn0file0

> **Reading move:** whenever you spot a new action in the book, ask:
> **(1)** at which **address**? **(2)** with what **polarity**? **(3)** which counter‑move would make this **normalize**? fileciteturn0file0

---

## Connections (why this is useful to contributors)

- **Proof theory:** Designs are “proofs without formulas”; **cut** is **interaction**; **cut‑elimination** is **normalization**. fileciteturn0file0  
- **Linear logic & polarity:** Ludics inherits linear logic’s resource sensitivity and **polarity discipline**, reframed around addresses and plays. fileciteturn0file0  
- **Game semantics:** Strategies as behaviours and **orthogonality as compatibility** align with dialogue games; ludics goes further by making *addresses* primitive. fileciteturn0file0  
- **Program meaning as tests:** A program/design’s meaning is the set of all tests (counter‑designs) it safely interacts with; this supports **observational** styles of semantics. fileciteturn0file0  

---

## Gentle “report of the sections” (narrative outline)

- **Opening motivation.** Girard urges a turn from *axioms about formulas* to **observable interaction**. Locality and addressability are foregrounded to capture causality and independence. fileciteturn0file0  
- **Toolkit laid out.** Loci, actions (±), justification pointers, and **designs** are introduced as the raw material. **Chronicles/views** record observable paths. fileciteturn0file0  
- **Orthogonality & behaviours.** After presenting **interaction** and **normalization**, Part 1 frames **orthogonality** (compatibility) and defines **behaviours** via bi‑orthogonality. fileciteturn0file0  
- **Role of the daimon.** The special action **⊥** appears early as a technical and conceptual device ensuring closure and a clear top behaviour. fileciteturn0file0  
- **Outlook.** Later parts (beyond this chunk) refine composition, address management, and the reconstruction of standard logical operators from behaviours. Part 1 is the *operational seed*. fileciteturn0file0  

> **Note on exact headings/pages:** the PDF you shared has OCR artifacts; this guide mirrors **conceptual sections** rather than reproducing section titles. Always cross‑check notation directly in the PDF when implementing. fileciteturn0file0

---

## Quick notation crib

- Addresses / loci: `σ, σ·i, τ·j` (dot for branching).  
- Polarity: `+` (positive / offer) vs `−` (negative / request).  
- Daimon: `⊥` (global abort/accept).  
- Orthogonality: `D ⟂ E` (the interaction normalizes).  
- Behaviour: `B = B⊥⊥` (bi‑orthogonal closure). fileciteturn0file0

---

## Checks for understanding (prompts for your team)

1. Explain **orthogonality** without jargon—what does it mean for two designs to be compatible? Give a one‑line example. fileciteturn0file0  
2. Why are **addresses** indispensable in ludics but optional in a traditional sequent calculus? fileciteturn0file0  
3. Where does **polarity** actively constrain which move can happen next? Find a spot in Part 1 and restate it informally. fileciteturn0file0  
4. How does **bi‑orthogonality** turn interaction behaviour into a notion of type? fileciteturn0file0  
5. When and why would you use the **daimon** during an interaction? fileciteturn0file0  

---

## Minimal “from‑text‑to‑code” sketch (if you want to prototype)

- **Represent addresses** as lists (e.g., `['σ', 1, 2]`) or strings with dots (`"σ.1.2"`).  
- **Actions**: `{ locus, polarity: '+'|'-', justifies: <id> }`.  
- **Design**: a set of actions closed under justification with a root locus.  
- **Interaction driver**: zip two designs on a shared locus; alternate moves by polarity; stop on **⊥** or when one side is stuck.  
- **Orthogonality checker**: returns `true` iff the driver terminates (no unfulfilled requests).  
These follow Part 1’s operational intuitions; formal details and proofs come later in the book. fileciteturn0file0

---

## Glossary (one‑liners)

- **Address / locus** — place where a move is made.  
- **Action (±)** — a justified move at a locus.  
- **Design** — a proof‑like strategy (possibly infinite, locally finite).  
- **Chronicle / view** — an observable path (trace) through a design.  
- **Interaction** — running two designs on a shared interface.  
- **Normalization** — convergent interaction (a “finished” play).  
- **Orthogonality** — compatibility: two designs that normalize together.  
- **Behaviour** — interaction‑stable set of designs (bi‑orthogonal).  
- **Daimon (⊥)** — special action that can end play at any time. fileciteturn0file0

---

### References in this note
Girard, Jean‑Yves. *Locus Solum: From the Rules of Logic to the Logic of Rules*, **Part 1** (PDF shared by the team). This guide mirrors the core concepts introduced there and is intended for onboarding and discussion. fileciteturn0file0

---

*Prepared for the Mesh repo docs; contributions welcome (add examples/tests for orthogonality and behaviours).*

