# Particle & Structural Rules — One‑Pager

**Players:** Proponent **P** (thesis), Opponent **O** (challenges)

## Particle rules (local)
```
X: φ ∧ ψ   | Y: ?L^∧ or ?R^∧  | X: φ   or   X: ψ
X: φ ∨ ψ   | Y: ?∨            | X: φ   or   X: ψ   (X chooses)
X: φ ⊃ ψ   | Y: φ             | X: ψ
X: ¬φ      | Y: φ             | (role flips)
X: ∀x φ(x) | Y: [x/a_i]       | X: φ(a_i)
X: ∃x φ(x) | Y: ?∃            | X: φ(a_i) (fresh)
```

## Structural rules (global)
```
SR0  Start  : P states thesis; O picks repetition rank n; then P picks.
SR1i Play   : React to earlier moves; ≤ n repeats per target; Last‑Duty‑First.
SR2  Formal : P may play atoms only if O played them earlier (Copy‑Cat).
SR3  Win    : No legal move on your turn ⇒ you lose.
SR1c Classical variant: swap SR1i to validate classical tautologies.
```

## Mini‑example: (p ∧ q) ⊃ p
```
O: (p ∧ q)   → P: ?L^∧ → O: p → P: p  ⇒ P wins (O stuck)
```
