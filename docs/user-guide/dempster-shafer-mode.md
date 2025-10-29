# Dempster-Shafer Mode

## Overview

Dempster-Shafer (DS) Mode visualizes **epistemic uncertainty** in argument confidence using interval-based representations. Unlike standard mode (single confidence value), DS mode shows a range: `[belief, plausibility]` that captures what we *know* versus what we *don't rule out*.

## Why DS Theory?

Traditional confidence values can be misleading when evidence is incomplete. Dempster-Shafer theory addresses this by:

- **Separating belief from uncertainty**: Distinguishing "support" from "lack of evidence against"
- **Quantifying ignorance**: Explicitly representing what we don't know
- **Avoiding false precision**: Not forcing a single number when evidence is ambiguous

### Example Scenario

**Standard Mode:** Argument A has 70% confidence.
- What does this mean? 70% likely to be true? 70% of evidence supports it?

**DS Mode:** Argument A has `[0.5, 0.8]` interval.
- **Belief (0.5)**: We have evidence supporting this claim at 50% strength
- **Plausibility (0.8)**: We can't rule it out beyond 80%
- **Uncertainty (0.3)**: We lack information about 30% of the decision space

## Key Concepts

### Belief (Bel)

The **minimum confidence** based on evidence directly supporting the claim.

**Formula:** `Bel(A) = sum of mass assigned to subsets of A`

**Interpretation:** "We have this much evidence *for* the claim."

### Plausibility (Pl)

The **maximum possible confidence** — how much we *don't disbelieve* the claim.

**Formula:** `Pl(A) = 1 - Bel(¬A) = sum of mass not contradicting A`

**Interpretation:** "We can believe this much *at most* given what we know."

### Epistemic Uncertainty

The gap between belief and plausibility: `Uncertainty = Pl - Bel`

**Interpretation:** "This much is unknown or ambiguous."

- **Low uncertainty (< 0.2)**: Evidence is clear, we're confident in the range
- **Medium uncertainty (0.2-0.5)**: Some ambiguity, more evidence needed
- **High uncertainty (> 0.5)**: Very incomplete information

### Example

| Bel | Pl | Uncertainty | Meaning |
|-----|----|-----------|-----------------------------------------|
| 0.7 | 0.9 | 0.2 | Strong support, little ambiguity |
| 0.3 | 0.7 | 0.4 | Weak support, significant uncertainty |
| 0.1 | 0.3 | 0.2 | Low support, but clear (not much unknown) |
| 0.2 | 0.9 | 0.7 | Very uncertain, wide range of possibilities |

## Features

### DS Mode Toggle

Enable DS mode to switch all confidence displays to interval format:

1. Click the **DS Mode Toggle** in the top right (or settings panel)
2. All confidence values change from `75%` to `[0.65, 0.85]`
3. DS interval charts appear in argument detail views
4. DS explanation tooltips provide context

**Tip:** DS mode persists across sessions via browser localStorage.

### Confidence Display (DS Mode)

When DS mode is ON, confidence displays show:

**Format:** `[Bel, Pl]` or `[belief, plausibility]`

**Color-coding:**
- 🟢 **Green**: Both Bel and Pl are high (strong argument)
- 🟡 **Yellow**: Medium values or high uncertainty
- 🔴 **Red**: Low belief or plausibility

**Example:**
```
[0.60, 0.85]  ← belief: 60%, plausibility: 85%, uncertainty: 25%
```

### DS Interval Chart

Visualizes the DS interval as a horizontal bar chart:

**Segments:**
- **Belief (Green)**: Direct evidence supporting the claim
- **Uncertainty (Yellow)**: Ambiguous or missing information
- **Disbelief (Red)**: Evidence against the claim (1 - Pl)

**Chart Example:**
```
|████████████░░░░░░░░▒▒▒|
 Belief      Uncert.  Dis
   60%         25%    15%
```

**Interpretation Guide (below chart):**
- **High belief, low uncertainty**: Strong, well-supported argument
- **High uncertainty**: More evidence needed to narrow the range
- **Low plausibility**: Argument likely false or strongly rebutted

### DS Explanation Tooltip

Hover over DS confidence displays to see:

- **Current interval values**: Bel = 0.65, Pl = 0.90
- **Uncertainty calculation**: Pl - Bel = 0.25
- **Formulas**: Brief DS theory equations
- **Mass assignments** (if available): Distribution over evidence
- **"Why DS theory?" section**: Philosophical justification

## Best Practices

### When to Use DS Mode

**Enable DS mode when:**
- Evidence is incomplete or contradictory
- You want to see epistemic uncertainty explicitly
- Comparing arguments with different evidence quality
- Research or analytical contexts (vs. casual discussion)

**Use standard mode when:**
- Evidence is clear and unambiguous
- Simplified view is sufficient for decision-making
- Presenting to audiences unfamiliar with DS theory

### Interpreting DS Intervals

**Narrow intervals `[0.7, 0.75]`:**
- High-quality, consistent evidence
- Conclusions are well-supported
- Low risk of surprising new evidence

**Wide intervals `[0.3, 0.8]`:**
- Incomplete or conflicting evidence
- Conclusions tentative
- More research recommended

**Low plausibility `[0.1, 0.3]`:**
- Argument likely false
- Strong counterevidence exists
- Consider retracting or revising

**High belief `[0.8, 0.9]`:**
- Strong direct support
- Argument well-defended
- Can proceed with confidence

### Reducing Uncertainty

To narrow DS intervals:
1. **Add more evidence**: Link to studies, data, expert testimony
2. **Answer attacks**: Responding to attacks may reduce disbelief (increase Pl)
3. **Clarify claims**: Vague claims have higher uncertainty
4. **Resolve conflicting evidence**: Address contradictions explicitly

### Communicating with DS Intervals

**Good:**
> "This argument has belief of 0.6 and plausibility of 0.85, meaning we have solid support but some ambiguity remains. Uncertainty is 0.25, which is acceptable for this context."

**Better:**
> "The DS interval [0.6, 0.85] shows strong support (60%) with moderate uncertainty (25%). We can be confident this claim holds, though more evidence could narrow the range."

## FAQ

**Q: What's the difference between standard confidence and DS intervals?**
A: Standard confidence collapses belief and uncertainty into one number. DS intervals separate them: `[belief, plausibility]` shows support *and* ambiguity.

**Q: How is DS mode calculated?**
A: Belief and plausibility are derived from mass assignments over evidence. The system aggregates support/rebut edge weights into DS structures. (See [Technical Details](#technical-details) below.)

**Q: Can I convert between standard and DS mode?**
A: Yes, standard confidence ≈ midpoint of DS interval `(Bel + Pl) / 2`. DS mode provides more nuanced information than standard.

**Q: Why is uncertainty sometimes high even with strong belief?**
A: High belief means "we have good evidence *for* this," but high uncertainty means "we lack evidence ruling out alternatives." Both can be true.

**Q: Should I always use DS mode?**
A: Not necessarily. For simple decisions or casual use, standard mode is clearer. Use DS mode when uncertainty is important to decision-making.

## Technical Details

### Mass Assignment

DS theory assigns **mass** to subsets of possibilities:

```
m({true}) = 0.6       ← belief in claim
m({false}) = 0.1      ← belief in negation
m({true, false}) = 0.3 ← uncertainty
```

**Constraints:**
- All masses sum to 1.0
- Mass can be assigned to uncertain sets (ambiguity)

### Belief and Plausibility Calculation

```typescript
function calculateDS(masses: MassAssignment): DSInterval {
  // Belief: sum of masses supporting the claim
  const belief = masses["{true}"] || 0;
  
  // Plausibility: 1 - (mass contradicting the claim)
  const plausibility = 1 - (masses["{false}"] || 0);
  
  return { belief, plausibility, uncertainty: plausibility - belief };
}
```

### Dempster's Rule of Combination

When combining evidence from multiple sources:

```
m1 ⊕ m2(A) = (sum of m1(B) × m2(C) for B ∩ C = A) / normalization
```

This combines mass assignments while handling conflicts.

### Visualization Math

DS interval chart segment widths:

- **Belief bar**: `belief × 100%`
- **Uncertainty bar**: `(plausibility - belief) × 100%`
- **Disbelief bar**: `(1 - plausibility) × 100%`

Total: `belief + uncertainty + disbelief = 100%`

## Integration with Other Features

### Confidence Propagation

DS intervals propagate through argument graphs:
- Support edges combine DS intervals via Dempster's rule
- Rebut edges invert belief/plausibility
- See [Confidence Metrics](./confidence.md)

### Hom-Set Analysis

Aggregate confidence in hom-sets uses DS intervals:
- Weighted average of belief/plausibility across edges
- Uncertainty aggregated separately
- See [Hom-Set Analysis](./hom-set-analysis.md)

### Temporal Decay

Decay affects DS intervals asymmetrically:
- Belief decreases over time (evidence ages)
- Uncertainty may increase (new ambiguity)
- See [Temporal Decay](./temporal-decay.md)

## Further Reading

**Academic Papers:**
- Shafer, G. (1976). *A Mathematical Theory of Evidence*. Princeton University Press.
- Sentz, K. & Ferson, S. (2002). *Combination of Evidence in Dempster-Shafer Theory*. SANDIA Report.

**Online Resources:**
- [Wikipedia: Dempster-Shafer Theory](https://en.wikipedia.org/wiki/Dempster%E2%80%93Shafer_theory)
- [Stanford Encyclopedia: Formal Epistemology](https://plato.stanford.edu/entries/formal-epistemology/)

## Related Features

- [Confidence Metrics](./confidence.md) - Standard vs. DS confidence calculation
- [Hom-Set Analysis](./hom-set-analysis.md) - Categorical perspective with DS intervals
- [Dialogue Tracking](./dialogue-tracking.md) - How responses affect belief/plausibility

---

**Next Steps:**
- Learn about [Assumptions](./assumptions.md) for foundational claims
- Explore [Hom-Set Analysis](./hom-set-analysis.md) for categorical argument analysis
