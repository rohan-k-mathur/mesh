

---

## ASCII diagrams — Sections 2 & 3

### D1. Loci & ramifications (Section 2)  fileciteturn1file2
```
Root locus σ
(+ , σ, {1,2})       # positive action opens two sub-addresses

Branching of addresses (dot = child)
σ
├─ σ·1
└─ σ·2
```

### D2. Alternating actions at a locus (Section 2)  fileciteturn1file2
```
Timeline at locus σ and its left child σ·1

E:  − σ         (opponent requests at σ)
D:  + σ         (design answers / offers ramification)
E:  − σ·1       (opponent focuses / challenges left)
D:  + σ·1.k     (design continues positively under σ·1, k ∈ enabled indices)
```

### D3. One-step interaction driver (Section 3)  fileciteturn1file3
```
Given designs D (positive) and E (negative) glued on interface σ:

while moves remain:
  take the next pending address ξ from the interface;
  if last move at ξ was − then D must produce + at ξ (or daimon);
  if last move at ξ was + then E must answer with − at some ξ.i;
  if neither side can move coherently at ξ → interaction fails (non-orthogonal);
  if daimon occurs → terminate as success (convergent).
```

### D4. Orthogonality ⇒ Behaviour (Section 3)  fileciteturn1file4
```
Let ⟂ be normalization-based compatibility.

For a set B of designs:
  B⊥   = {E | ∀D∈B, D ⟂ E}              # all tests that normalize against B
  B⊥⊥ = {D | ∀E∈B⊥, D ⟂ E}              # designs validated by all those tests

A behaviour is exactly a fixed point:  B = B⊥⊥
(read: meaning-by-tests, closed under bi-orthogonality)
```

### D5. Mini end-to-end example (Sections 2→3)  fileciteturn1file2 fileciteturn1file3
```
Design D:
  + σ         (+ , σ, {1,2})
  + σ·1       (+ , σ·1, {a})        # develops left branch
  + σ·2       (+ , σ·2, {})         # right branch is a stub

Counter-design E:
  − σ         (request/open at σ)
  − σ·1       (focus left)
  − σ·1.a     (drill down)

Run:
  E −σ ; D +σ ; E −σ·1 ; D +σ·1 ; E −σ·1.a ; D +σ·1.a
  … if D can finish (or daimon), D ⟂ E; otherwise, stuck = non-orthogonal.
```

> Notation follows ludics conventions: `(+ , ξ, I)` positive action at address `ξ` enabling children `I`; `− ξ.i` negative action selecting a child; *daimon* may close interaction as success.  fileciteturn1file2 fileciteturn1file3

