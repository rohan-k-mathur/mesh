# Understanding Preferences in ASPIC+

**Version**: 1.0  
**Last Updated**: 2025-01-20  
**Audience**: End users, deliberation participants

---

## Table of Contents

1. [What Are Preferences?](#what-are-preferences)
2. [Creating Preferences](#creating-preferences)
3. [Understanding Ordering Policies](#understanding-ordering-policies)
4. [Set Comparison Methods](#set-comparison-methods)
5. [Example Walkthrough](#example-walkthrough)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## What Are Preferences?

**Preferences** allow you to specify that one argument is stronger or more credible than another. This affects which attacks succeed as **defeats** during evaluation.

### Key Concepts

- **Preference Application (PA)**: A statement that "Argument A is preferred over Argument B"
- **Attack**: A logical conflict between two arguments (e.g., A contradicts B)
- **Defeat**: A successful attack where the attacking argument is at least as strong as the attacked argument
- **Ordering Policy**: The method used to compare argument strength

### Why Use Preferences?

Without preferences, all attacks become defeats. Preferences allow you to:

- **Distinguish credible sources** from less credible ones
- **Prioritize expert opinions** over anecdotal evidence
- **Model real-world reasoning** where some arguments naturally outweigh others
- **Resolve conflicts** between competing arguments

---

## Creating Preferences

### Step-by-Step Guide

1. **Navigate to an argument** in your deliberation
2. **Click the "Add Preference" button** (or similar action)
3. **Select the preference type**:
   - **Prefer Over**: This argument is stronger than the target
   - **Disprefer To**: This argument is weaker than the target
4. **Choose the target argument** from the list
5. **Add a justification** (optional but recommended):
   - Example: "Expert source with peer-reviewed evidence"
   - Example: "Older study superseded by recent meta-analysis"
6. **Configure advanced options** (optional):
   - Ordering policy: Last-link or Weakest-link
   - Set comparison: Elitist or Democratic
7. **Submit** the preference

### Visual Example

```
Argument A: "Climate change is accelerating (NASA study, 2024)"
    ↓ [Prefer Over]
Argument B: "Climate change is overstated (blog post, 2020)"

Justification: "NASA is a credible scientific institution with rigorous methodology"
```

**Result**: If A attacks B, the attack succeeds as a defeat. If B attacks A, the attack is blocked.

---

## Understanding Ordering Policies

Ordering policies determine **how argument strength is computed** from the strengths of its components (premises and inference rules).

### Last-Link Ordering (Legal/Normative Reasoning)

**Definition**: Compare only the **last defeasible rule** (final inference step) in each argument.

**When to Use**:
- Legal reasoning where the final rule application is most critical
- Normative contexts where the conclusion-drawing step matters most
- When earlier premises are assumed reliable

**Example**:

```
Argument A:
  Premise: Expert says X (assumed reliable)
  Rule: Expert testimony → Conclusion
  
Argument B:
  Premise: Study shows Y (assumed reliable)
  Rule: Scientific study → Conclusion
  
Preference: "Scientific study" rule > "Expert testimony" rule

Result with Last-Link: B defeats A
Reason: Only the final rule is compared; B's rule is stronger
```

**Metaphor**: "The strength of a chain is its weakest link, but we only check the last link."

---

### Weakest-Link Ordering (Epistemic Reasoning)

**Definition**: Compare **all defeasible rules AND all premises** in each argument.

**When to Use**:
- Scientific reasoning where uncertainty compounds through the chain
- Epistemic contexts where each step must be sound
- When argument strength is as weak as its weakest component

**Example**:

```
Argument A:
  Premise: Weak claim (low confidence)
  Rule: Strong inference rule
  
Argument B:
  Premise: Strong claim (high confidence)
  Rule: Weak inference rule
  
Preference: Requires BOTH dimensions to be better

Result with Weakest-Link: No defeat unless one argument is strictly better on ALL components
Reason: Uncertainty propagates; A has weak premise, B has weak rule
```

**Metaphor**: "A chain is only as strong as its weakest link—check every link."

---

### Comparison Table

| Feature | Last-Link | Weakest-Link |
|---------|-----------|--------------|
| **What is compared** | Final inference rule only | All rules + all premises |
| **Suitable for** | Legal, normative reasoning | Epistemic, scientific reasoning |
| **Strictness** | More permissive (easier to defeat) | More restrictive (harder to defeat) |
| **Focus** | Conclusion-drawing step | Entire reasoning chain |
| **Example domain** | Court precedent application | Medical diagnosis |

---

## Set Comparison Methods

When comparing sets of rules or premises, we need a method to determine if one set is "less than" another. This is controlled by **set comparison**.

### Elitist Comparison (Default)

**Definition**: Set X < Set Y if X has **one element worse than all elements in Y**.

**Mathematical**: ∃x∈X: ∀y∈Y, x < y

**Metaphor**: "A team is weak if it has one member who loses to everyone on the other team."

**Characteristics**:
- **More restrictive**: Rarely concludes X < Y
- **Focuses on worst element**: The weakest link determines the outcome
- **Conservative**: Safer for contexts where one weak point undermines everything

**Example**:

```
Argument A rules: [Strong, Weak, Strong]
Argument B rules: [Medium, Medium, Medium]

Elitist comparison:
- A has "Weak" element
- Is "Weak" worse than ALL elements in B? (Medium, Medium, Medium)
- Yes! "Weak" < "Medium" (all three times)
- Result: A < B (A is weaker)
```

---

### Democratic Comparison

**Definition**: Set X < Set Y if **every element in X is beaten by something in Y**.

**Mathematical**: ∀x∈X: ∃y∈Y, x ≤ y

**Metaphor**: "A team is weak if every member loses to at least one person on the other team."

**Characteristics**:
- **More permissive**: Often concludes X < Y
- **Considers all elements**: Every component must have a counterpart
- **Egalitarian**: Spreads weakness across all components

**Example**:

```
Argument A rules: [Weak, Medium, Strong]
Argument B rules: [Medium, Strong, Strong]

Democratic comparison:
- For A's "Weak": Does B have something ≥ "Weak"? Yes (Medium)
- For A's "Medium": Does B have something ≥ "Medium"? Yes (Medium)
- For A's "Strong": Does B have something ≥ "Strong"? Yes (Strong)
- Result: A ≤ B (A is weaker or equal)
```

---

### Comparison Table

| Feature | Elitist | Democratic |
|---------|---------|------------|
| **Logic** | One worst element decides | Every element must be matched |
| **Strictness** | More restrictive | More permissive |
| **Focus** | Worst-case analysis | Average-case analysis |
| **Use case** | High-stakes decisions (medical, legal) | Balanced evaluations |
| **Default** | ✓ Yes | No |

---

## Example Walkthrough

### Scenario: Evaluating Climate Science Arguments

**Arguments**:

```
A: "CO2 levels are rising (NOAA data)"
   Rule: Government data → Reliable
   
B: "Temperature increases are natural cycles (blog)"
   Rule: Blog post → Less reliable
   
C: "Climate models predict severe warming (IPCC report)"
   Rule: Scientific consensus → Highly reliable
```

**Preferences Created**:

1. **A > B**: NOAA data is more credible than a blog
   - Justification: "NOAA is a peer-reviewed government agency"
   
2. **C > A**: IPCC consensus is stronger than single data source
   - Justification: "Meta-analysis of 10,000+ studies"

**Ordering Policy**: Last-link (focus on source credibility)

**Evaluation**:

```
Attacks:
- B attacks A (contradicts CO2 data)
- A attacks B (contradicts natural cycles claim)
- No attack between A and C (compatible)

Defeats (with preferences):
- A defeats B ✓ (A > B preference)
- B does NOT defeat A ✗ (blocked by A > B)
- C remains undefeated ✓ (strongest argument)

Grounded Extension:
- IN: A, C
- OUT: B
```

**Result**: Arguments A and C are accepted; B is rejected.

---

### Step-by-Step with UI

1. **Create Argument A** with NOAA data source
2. **Create Argument B** with blog source
3. **Select Argument A** → Click "Add Preference"
4. **Choose "Prefer Over"** → Select B as target
5. **Add Justification**: "NOAA is a peer-reviewed government agency"
6. **Leave Advanced Options as default** (Last-link, Elitist)
7. **Submit Preference**
8. **Repeat for C > A** preference
9. **Run Evaluation** → View defeat graph
10. **Hover over Argument A badge** → See tooltip: "↑1 / ↓1" (preferred by C, dispreferred by B)

---

## Best Practices

### When Creating Preferences

1. **Always Add Justifications**: Helps others understand your reasoning
   - ❌ Bad: No justification
   - ✓ Good: "Systematic review > single study (higher evidence quality)"

2. **Be Consistent**: Use similar criteria across all preferences
   - Example: If prioritizing peer review, apply that consistently

3. **Avoid Cycles**: Don't create A > B > C > A
   - System will warn about cycles
   - Cycles make evaluation undefined

4. **Start with Default Policies**: Only change ordering if you have a specific reason
   - Most deliberations work well with Last-link + Elitist

5. **Document Domain Context**: Add a note about what kind of reasoning applies
   - "Legal context: using Last-link ordering"
   - "Scientific evaluation: using Weakest-link ordering"

### When Choosing Ordering Policies

| Context | Recommended Policy |
|---------|-------------------|
| Legal precedent | Last-link |
| Scientific evidence | Weakest-link |
| Expert testimony | Last-link |
| Multi-step proofs | Weakest-link |
| Policy debates | Last-link |
| Medical diagnosis | Weakest-link |

### When to Use Advanced Options

**Use Last-link when**:
- Final conclusions are most important
- Earlier premises are generally trusted
- Context is normative or legal

**Use Weakest-link when**:
- Every step must be sound
- Uncertainty compounds through reasoning
- Context is epistemic or scientific

**Use Elitist (default) when**:
- Conservative evaluation needed
- One weak point is critical
- High-stakes decisions

**Use Democratic when**:
- Balanced evaluation desired
- Overall quality matters more than worst case
- Lower-stakes discussions

---

## Troubleshooting

### Issue: "Preference cycle detected"

**Cause**: You created A > B > C > A (circular preference)

**Solution**:
1. Review your preferences
2. Identify the cycle (system shows path)
3. Remove one preference to break the cycle
4. Consider: Is there a genuine ambiguity? Maybe both arguments are equally strong

---

### Issue: "My preference doesn't affect the outcome"

**Possible Causes**:

1. **Arguments don't attack each other**:
   - Preferences only matter when attacks exist
   - Solution: Check if arguments actually conflict

2. **Wrong ordering policy**:
   - Last-link preference applied but using Weakest-link evaluation
   - Solution: Check global ordering policy matches your preference intent

3. **Set comparison blocking defeat**:
   - Elitist comparison is very restrictive
   - Solution: Try Democratic comparison in advanced options

4. **Preference direction reversed**:
   - You set A > B but meant B > A
   - Solution: Delete and recreate preference with correct direction

---

### Issue: "Tooltip shows no defeat information"

**Cause**: Defeat details API may not be returning expected data

**Solution**:
1. Ensure argument is part of a deliberation with evaluation run
2. Check that preferences exist and are properly connected
3. If issue persists, defeat computation may not be fully integrated yet (see Phase 4.1 completion status)

---

### Issue: "Advanced options don't appear"

**Cause**: UI enhancement in Phase 4.3 may not be deployed

**Solution**:
1. Refresh the page
2. Check that you're using the latest version
3. Advanced options are in a collapsible section—click to expand

---

## Glossary

- **Argument**: A conclusion supported by premises and inference rules
- **Attack**: A logical conflict where one argument contradicts another
- **Defeat**: A successful attack where the attacker is at least as strong
- **Preference**: A statement that one argument/premise/rule is stronger than another
- **Ordering Policy**: Method for computing argument strength (Last-link or Weakest-link)
- **Set Comparison**: Method for comparing sets of components (Elitist or Democratic)
- **Grounded Extension**: The set of ultimately accepted arguments after evaluation
- **Undercutter**: An argument that attacks the inference rule itself (always defeats)
- **Rebuttal**: An argument that attacks the conclusion (may or may not defeat)

---

## Further Reading

- **Theoretical Foundation**: See `docs/arg-computation-research/ASPIC_Argumentation with Preferences.md`
- **Developer Guide**: See `docs/developer-guides/AIF_ASPIC_Translation.md`
- **Research Paper**: Modgil & Prakken (2014), "A General Account of Argumentation with Preferences"
- **Phase 4 Roadmap**: See `ASPIC_PHASE4_PREFERENCES_ROADMAP_V2.md`

---

## Quick Reference Card

### Creating a Preference

```
1. Select source argument
2. Click "Add Preference"
3. Choose type (Prefer Over / Disprefer To)
4. Select target argument
5. Add justification (recommended)
6. Submit
```

### Default Settings

- **Ordering Policy**: Last-link
- **Set Comparison**: Elitist
- Both are suitable for most deliberations

### When to Change Defaults

- **Switch to Weakest-link**: Scientific or epistemic reasoning
- **Switch to Democratic**: When overall quality matters more than worst case

### Visual Indicators

- **Badge**: `↑3 / ↓1` means "preferred by 3, dispreferred by 1"
- **Green Badge**: Net positive preference (more preferred than dispreferred)
- **Red Badge**: Net negative preference (more dispreferred than preferred)
- **Tooltip**: Hover for detailed defeat information

---

**Questions?** Contact the development team or refer to the developer guide for implementation details.
