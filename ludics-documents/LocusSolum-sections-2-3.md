# **Locus *Solum* (Jean‑Yves Girard) — Sections 2 & 3: Team‑Onboarding Notes**

> **Scope.** This brief is a practical, shareable recap of Sections **2** and **3** of *Locus Solum: From the rules of logic to the logic of rules*. It’s written for contributors who want a fast, working grasp of **ludics**—Girard’s interaction‑first reconstruction of logic—without getting lost in formalities. It’s not a substitute for the text, but a map to it. fileciteturn2file13 fileciteturn2file1

---

## TL;DR

- **Ludics flips the script:** instead of building logic from **formulas** and **proof rules**, it builds it from **interactions** between structured objects called **designs** living at **loci** (addresses).  
- **Section 2 (Foundations):** introduces the **micro-geometry** of interaction—**loci/addresses**, **polarized actions**, and how **designs** are assembled from **chronicles/paths** with basic coherence constraints. fileciteturn2file13  
- **Section 3 (Interaction & Types):** defines **interaction/normalization**, **orthogonality** (when designs successfully interact), and **behaviours** (types) as **bi‑orthogonal** closures of designs. This is where the “**logic of rules**” emerges from stable patterns of interaction. fileciteturn2file1

---

## Why this matters (for contributors)

- You can read a program/proof fragment as a **design** and its “tests” as **counter‑designs**; **types** are **sets of designs** closed under successful testing (orthogonality).  
- This reframes soundness/completeness as **interaction properties**, which is helpful when thinking about protocols, interactive verification, or language/runtime design.

---

## Section 2 — Loci, Actions, and Designs (the building blocks)  fileciteturn2file13

### 2.1 Loci (addresses)
- A **locus** is an **address** that pins down *where* a move can happen. Think of it as a path like `ε`, `1`, `1.2`, `1.2.3` in a (possibly infinite) tree.  
- Loci let different sub‑interactions proceed independently; they coarse‑grain *place* in a proof/program much like pointers/paths in a heap or a trie.

### 2.2 Polarized actions
- Actions carry **polarity** and an **address** (and sometimes a **ramification**—a finite set indicating enabled subaddresses):
  - **Positive** action: “I *create* or *choose* structure here.”  
    Notation (mnemonic): `(+ , ξ, I)` meaning “at address `ξ`, open sub‑addresses indexed by finite set `I`.”  
  - **Negative** action: “I *challenge* or *inspect* structure here.”  
    Notation: `(- , ξ.i)` meaning “at sub‑address `ξ.i`, answer the challenge.”
- There is a special **daïmon** (⊥/♦) used to model *immediate success/closure* of interaction (e.g., an error/abort or terminal acknowledgment).

### 2.3 Chronicles, paths, and designs
- A **chronicle** is a **sequence of alternating actions** with coherent addresses (no address clashes, proper justifications).  
- A **path** is a chronicle you can actually *play* (it respects alternation and locality).  
- A **design** is a **set of chronicles** satisfying basic closure/coherence principles (prefix‑closure; no conflicting moves at the same address; etc.). Intuitively, a design is a *strategy skeleton* telling you what positive/negative actions are possible at which loci.

> **Intuition:** if a standard ND/ sequent proof is a tree of rule instances, a **design** is a **normal‑form, address‑indexed interaction blueprint**—a *long proof* written as “what I can do/respond where.”

---

## Section 3 — Interaction, Orthogonality, and Behaviours (the dynamics)  fileciteturn2file1

### 3.1 Normalization as interaction
- Given a **design** `D` and a **counter‑design** `E`, we run them **against each other** by **following addresses** where their moves meet.  
- The run **follows the justifications** supplied by each side; when one side enables a family of sub‑addresses, the other selects one and continues.  
- **Termination** with the **daïmon** ♦ (or a designated success state) counts as a **successful interaction**.

### 3.2 Orthogonality
- Two designs are **orthogonal** (`D ⟂ E`) iff their **interaction normalizes** successfully (no deadlock, no incoherent address clash).  
- Orthogonality turns *testing* into a notion of **observational equality**: two designs are indistinguishable if they react the same way against all tests.

### 3.3 Behaviours (types) via bi‑orthogonality
- A **behaviour** `B` is a set of designs that is **equal to its bi‑orthogonal**: `B = B^{⟂⟂}`.  
- In practice, **types are behaviours**: they are exactly those collections of designs stable under “all tests of all tests.”  
- Connectives and structural principles emerge as **constructors on behaviours** (products/sums, polarity shifts, etc.)—logic rebuilt from stable interactive patterns rather than primitive derivation rules.

> **Takeaway:** *Proof theory* reappears as **the geometry of interaction** among designs; *typing* reappears as **closure under tests**. This is the “**logic of rules**” promised in the title. fileciteturn2file16

---

## Concrete mental model (quick example)

```
Root locus ε
  ├─ 1        (a positive action opens sub-issues 1,2 at ε: (+, ε, {1,2}))
  │   └─ 1.α  (opponent challenges branch 1: (-, ε.1))
  └─ 2        (we may later answer at 2, opening further loci)
```
- **Design = set of coherent “what I do where” traces** over such a tree.  
- **Interaction** = drive two such trees together; at each common address, alternate moves.  
- **Success** = reach ♦ without conflict; **failure** = deadlock or incoherence.

---

## Reading tips & pitfalls

- Keep a **local picture of addresses**; every definition is “about *where* something happens.”  
- Don’t treat designs as standard proofs: they’re **interaction‑ready shapes**, not rule trees.  
- When stuck, ask: *Which address is active? Who moved last (polarity)? What ramifications are currently enabled?*

---

## Glossary (working)

- **Locus / address:** tree‑like name of a place of interaction.  
- **Action (±):** a polarized step at an address; positive = *offer/open*, negative = *respond/challenge*.  
- **Ramification:** finite set of sub‑addresses a positive move opens.  
- **Chronicle / path:** coherent, alternating action sequence; a path is *playable*.  
- **Design:** set of chronicles satisfying prefix/coherence conditions.  
- **Interaction / normalization:** driving a design against a counter‑design along matching loci.  
- **Orthogonality (`⟂`):** successful, normalizing interaction.  
- **Behaviour:** a type = a bi‑orthogonally closed set of designs.

---

## How to use this in our repo

- Treat **protocols** / **APIs** as **behaviours**; individual handlers are **designs**.  
- Testing a component is **running a counter‑design** against it; *success* ≈ **normalizing to ♦**.  
- This viewpoint helps us reason about **compositionality**: behaviours compose when their interactions are stable.

---

### Citations (to the shared PDFs)

- **Section 2** fundamentals and notational set‑up. fileciteturn2file13 fileciteturn2file14  
- **Section 3** interaction/orthogonality/behaviours. fileciteturn2file1 fileciteturn2file16

---

*Prepared for the team by ChatGPT (mesh docs companion).*  
