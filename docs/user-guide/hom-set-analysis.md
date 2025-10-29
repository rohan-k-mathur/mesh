# Hom-Set Analysis

## Overview

Hom-Set Analysis provides a **categorical perspective** on argument strength by examining all relationships (morphisms) connecting arguments. Rather than viewing confidence as a single number, hom-set analysis aggregates information from all incoming or outgoing edges to assess overall argumentative position.

## What Is a Hom-Set?

In category theory, a **hom-set** is the collection of all morphisms (arrows) between two objects.

**In Mesh:**
- **Objects** = Arguments
- **Morphisms** = Argument edges (SUPPORT, REBUT, UNDERCUT, CONCEDE)
- **Hom-set** = All edges going *to* or *from* an argument

### Types of Hom-Sets

**Hom(_, A)** — **Incoming hom-set**: All edges pointing *to* argument A
- Answers: "What supports or attacks this argument?"
- Includes: SUPPORT, REBUT, UNDERCUT edges targeting A

**Hom(A, _)** — **Outgoing hom-set**: All edges originating *from* argument A
- Answers: "What does this argument support or attack?"
- Includes: SUPPORT, REBUT, UNDERCUT edges starting from A

## Features

### Hom-Set Confidence Panel

**Location:** Argument detail page → **Categorical Analysis** tab

**Displays:**
- **Aggregate confidence**: Weighted average of all edge confidences in the hom-set
- **Aggregate uncertainty**: Combined epistemic uncertainty (DS theory)
- **Edge count**: Number of morphisms in the hom-set
- **Min/Max confidence**: Range of edge confidences
- **Morphism list**: Individual edges with types, sources/targets, and confidence

**Example:**
```
Incoming Hom-Set for Argument A

Aggregate Confidence: 0.73 ± 0.12 (uncertainty)
Edge Count: 5 morphisms
Min: 0.52 | Max: 0.88

Morphisms:
1. Argument B --SUPPORT--> A (confidence: 0.88)
2. Argument C --SUPPORT--> A (confidence: 0.75)
3. Argument D --REBUT--> A (confidence: 0.67)
4. Argument E --UNDERCUT--> A (confidence: 0.52)
5. Argument F --SUPPORT--> A (confidence: 0.81)
```

### Morphism Visualization Cards

Each morphism in the hom-set displays as a card:

**Information shown:**
- **Edge type icon**: Shield (SUPPORT), Slash (REBUT), ThumbsDown (UNDERCUT), Handshake (CONCEDE)
- **Edge type color**:  
  - 🟢 Green = SUPPORT  
  - 🔴 Red = REBUT  
  - 🟠 Orange = UNDERCUT  
  - 🔵 Blue = CONCEDE
- **Source/Target arguments**: Clickable links to navigate
- **Confidence badge**: Color-coded (green/yellow/red) based on value
- **Direction indicator**: Arrow showing incoming/outgoing

**Interaction:**
- Click morphism card to navigate to the source or target argument
- Hover to see full argument text preview

### Hom-Set Comparison Chart

**Location:** Deliberation overview → **Hom-Set Analysis** section

**Purpose:** Compare hom-set aggregate confidence across multiple arguments.

**Features:**
- **Bar chart**: One bar per argument, height = aggregate confidence
- **Sorted by confidence**: Highest to lowest (configurable)
- **Average reference line**: Shows mean aggregate confidence across all arguments
- **"Above average" badges**: Highlights arguments exceeding the mean
- **Edge counts**: Displays number of incoming/outgoing edges for each argument
- **Click to navigate**: Click a bar to open that argument's detail page

**Example:**
```
Hom-Set Comparison (Incoming)

Argument A: ███████████████████ 0.85 (7 edges) ⭐ Above avg
Argument B: ██████████████████  0.78 (5 edges) ⭐ Above avg
Average:    ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬   0.68
Argument C: ████████████████    0.64 (3 edges)
Argument D: █████████████       0.52 (4 edges)
Argument E: ███████████         0.45 (2 edges)
```

### Filtering Hom-Sets

**Filter by direction:**
- **Incoming**: Edges pointing to this argument (what supports/attacks it)
- **Outgoing**: Edges from this argument (what it supports/attacks)

**Filter by edge type:**
- **SUPPORT**: Only support edges
- **REBUT**: Only rebuttal edges
- **UNDERCUT**: Only undercut edges
- **CONCEDE**: Only concession edges
- **ALL** (default): All edge types

**Use cases:**
- "Show only support edges" → See positive evidence
- "Show only rebut + undercut" → See attacks
- "Outgoing support" → What this argument defends

## Key Metrics

### Aggregate Confidence

**Formula:**
```
aggregateConfidence = sum(confidence_i × weight_i) / sum(weight_i)
```

**Weights:**
- **SUPPORT**: weight = +1
- **REBUT**: weight = -1 (reduces confidence)
- **UNDERCUT**: weight = -0.5
- **CONCEDE**: weight = -0.3

**Interpretation:**
- **High (> 0.7)**: Strong overall position, well-supported
- **Medium (0.4-0.7)**: Mixed evidence, moderate position
- **Low (< 0.4)**: Weak position, heavily attacked or unsupported

### Aggregate Uncertainty

**Formula (DS theory):**
```
aggregateUncertainty = sqrt(sum(uncertainty_i^2) / n)
```

RMS (root mean square) of individual edge uncertainties.

**Interpretation:**
- **Low (< 0.15)**: Clear, consistent evidence
- **Medium (0.15-0.30)**: Some ambiguity
- **High (> 0.30)**: Very unclear or conflicting evidence

### Edge Counts

**Total edges**: Number of morphisms in the hom-set
- More edges = more information (but quality matters)
- Balanced support/attack = contentious argument
- High support, low attacks = strong argument

**By type:**
- Support edges: Strengthens position
- Rebut/Undercut edges: Weakens position
- Concede edges: Mixed (depends on context)

## Best Practices

### Understanding Your Argument's Position

**Check incoming hom-set to assess:**
- How much support does my argument have?
- How heavily is it attacked?
- What's the net confidence after aggregating all edges?

**Check outgoing hom-set to see:**
- What am I contributing to (supporting)?
- What am I attacking?
- Am I primarily a supporter or challenger?

### Comparing Arguments

Use the **Hom-Set Comparison Chart** to:
- Identify strongest arguments (highest aggregate confidence)
- Find weakest arguments needing defense
- See which arguments have most connections (edge count)
- Prioritize where to focus deliberation efforts

### Strengthening Your Hom-Set

**To increase aggregate confidence:**
1. **Add support edges**: Find other arguments that support yours, create links
2. **Answer rebuttals**: Respond to attacks with GROUNDS defenses
3. **Remove undercuts**: Address premise challenges
4. **Increase edge confidence**: Strengthen existing support connections

**To reduce uncertainty:**
1. **Resolve conflicting evidence**: Address contradictions
2. **Add clearer evidence**: Replace ambiguous support with definitive sources
3. **Challenge weak attacks**: Rebut low-quality rebuttals

### Categorical Insights

Hom-set analysis reveals:
- **Compositional strength**: How argument chains combine  
  (A supports B, B supports C → net effect on C)
- **Structural position**: Central arguments have large hom-sets
- **Balance**: Equal support/attack = contested argument
- **Isolated arguments**: Small hom-sets = disconnected from deliberation

## Workflow Example

**Scenario:** You want to assess Argument A's strength.

1. **Open Argument A detail page**
2. **Navigate to Categorical Analysis tab**
3. **Review Hom-Set Confidence Panel:**
   - Aggregate confidence: 0.68 (medium)
   - 4 support edges, 3 rebut edges
   - Uncertainty: 0.22 (moderate ambiguity)
4. **Analyze morphisms:**
   - Strongest support: Argument B (0.85 confidence)
   - Strongest attack: Argument C (0.72 confidence)
5. **Decision:**
   - Defend against Argument C's rebut to increase aggregate confidence
   - Add more support edges by linking related arguments
6. **Monitor Hom-Set Comparison Chart:**
   - After changes, Argument A moves above average

## FAQ

**Q: What's the difference between hom-set confidence and argument confidence?**
A: **Argument confidence** is intrinsic to the claim itself. **Hom-set confidence** is the aggregate of all relationship strengths. Hom-set confidence reflects the argument's *positional strength* in the deliberation graph.

**Q: Should I focus on incoming or outgoing hom-sets?**
A: **Incoming** shows your argument's support/defense. **Outgoing** shows your argumentative activity (what you're contributing). Both are important, but incoming is usually more critical for assessing your position.

**Q: Why is my hom-set confidence low even though my argument is strong?**
A: Hom-set confidence depends on **relationships**, not just the argument itself. Low hom-set confidence means:
- Few support edges
- Many attack edges
- Low-confidence support edges
- High-confidence attack edges

Strengthen your position by adding support connections or defending against attacks.

**Q: What's a good aggregate confidence value?**
A: Context-dependent, but generally:
- **> 0.75**: Excellent, strong position
- **0.60-0.75**: Good, solid position
- **0.40-0.60**: Fair, needs improvement
- **< 0.40**: Weak, requires defense

**Q: How do I interpret high uncertainty in my hom-set?**
A: High uncertainty means the evidence (edges) is ambiguous or conflicting. Solutions:
- Clarify vague support edges
- Resolve contradictory evidence
- Add higher-confidence edges

**Q: Can I compare hom-sets across different deliberations?**
A: Not directly—each deliberation has different contexts, norms, and baseline confidence distributions. Hom-set comparison is most useful *within* a deliberation.

## Technical Details

### Categorical Interpretation

**Category:** Arguments form a category where:
- **Objects**: Arguments
- **Morphisms**: Typed edges (SUPPORT, REBUT, etc.)
- **Composition**: Edge chains (A → B → C)
- **Identity**: Reflexive self-loops (argument references itself)

**Hom-set properties:**
- **Hom(A, B)**: Set of all morphisms from A to B (usually 0 or 1 in Mesh)
- **Hom(_, A)**: All morphisms targeting A (incoming hom-set)
- **Hom(A, _)**: All morphisms originating from A (outgoing hom-set)

### Weighted Aggregation

```typescript
function calculateAggregateConfidence(edges: Edge[]): number {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const edge of edges) {
    const weight = edgeWeight(edge.type);
    weightedSum += edge.confidence * weight;
    totalWeight += Math.abs(weight);
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

function edgeWeight(type: EdgeType): number {
  switch (type) {
    case "SUPPORT": return 1.0;
    case "REBUT": return -1.0;
    case "UNDERCUT": return -0.5;
    case "CONCEDE": return -0.3;
    default: return 0;
  }
}
```

### Compositional Paths

Hom-set analysis can follow compositional paths:
- A --SUPPORT--> B --SUPPORT--> C  
  → Net effect: A indirectly supports C
- Confidence decays along paths: `conf(A→C) = conf(A→B) × conf(B→C)`

**Compositional hom-set**: Include not just direct edges, but also composed paths up to depth N.

### DS Theory Integration

Hom-set aggregate confidence can be expressed as DS intervals:
- **Belief**: Aggregate of support-edge beliefs
- **Plausibility**: Adjusted for attack-edge disbeliefs
- **Uncertainty**: RMS of individual uncertainties

## Integration with Other Features

### Confidence Propagation

Hom-set confidence feeds into overall argument confidence:
- High incoming hom-set confidence → boosts argument confidence
- Low incoming hom-set confidence → reduces confidence
- See [Confidence Metrics](./confidence.md)

### Dialogue Tracking

Hom-set edges include GROUNDS responses:
- Answering attacks improves incoming hom-set (adds support edges)
- See [Dialogue Tracking](./dialogue-tracking.md)

### Assumptions

Assumption dependencies affect hom-sets:
- Arguments depending on challenged assumptions have reduced hom-set confidence
- See [Assumptions](./assumptions.md)

### Temporal Decay

Decay affects individual edge confidences, which propagates to aggregate hom-set confidence:
- Old edges decay → aggregate confidence decreases
- See [Temporal Decay](./temporal-decay.md)

## Advanced Topics

### Functor Mappings

Hom-sets can be mapped across categories:
- **Agora → Deliberation functor**: Maps arguments and edges between contexts
- **Confidence functor**: Assigns confidence to each morphism
- See advanced documentation for categorical semantics

### Adjunctions

Support/Rebut edges form adjoint pairs in some contexts:
- Support edge A → B paired with potential rebut edge B → A
- Duality between attack and defense

### Natural Transformations

Confidence adjustments (decay, propagation) are natural transformations:
- Transform one confidence functor to another
- Preserve compositional structure

## Further Reading

**Category Theory Resources:**
- *Category Theory for Programmers* by Bartosz Milewski
- [nLab: Hom-set](https://ncatlab.org/nlab/show/hom-set)

**Argumentation Theory:**
- Dung, P.M. (1995). *On the acceptability of arguments and its fundamental role in nonmonotonic reasoning, logic programming and n-person games*. Artificial Intelligence, 77(2), 321-357.

## Related Features

- [Confidence Metrics](./confidence.md) - How hom-set confidence affects overall confidence
- [Dialogue Tracking](./dialogue-tracking.md) - GROUNDS responses as morphisms
- [Dempster-Shafer Mode](./dempster-shafer-mode.md) - DS intervals in hom-set aggregation
- [Assumptions](./assumptions.md) - Dependency effects on hom-sets

---

**Next Steps:**
- Learn about [Argumentation Schemes](./schemes.md) for formal argument structure
- Explore [Critical Questions](./critical-questions.md) for guided argument evaluation
