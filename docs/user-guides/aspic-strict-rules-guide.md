# ASPIC+ Strict Rules: User Guide

**Last Updated**: November 17, 2025  
**Version**: 1.0  
**Audience**: Mesh users creating formal arguments

---

## Table of Contents

1. [What Are Strict Rules?](#what-are-strict-rules)
2. [When to Use Strict vs Defeasible Rules](#when-to-use-strict-vs-defeasible-rules)
3. [How to Create Strict Rules](#how-to-create-strict-rules)
4. [Real-World Examples](#real-world-examples)
5. [Attack Restrictions](#attack-restrictions)
6. [Transposition Closure](#transposition-closure)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## What Are Strict Rules?

**Strict rules** are inference patterns where the conclusion follows **necessarily** from the premises. If the premises are true, the conclusion **must** be true. They represent:

- Logical deduction (modus ponens, universal instantiation)
- Mathematical proofs
- Definitional truths
- Analytical statements

**Defeasible rules** are inference patterns where the conclusion follows **plausibly** but can be defeated by new evidence. They represent:

- Generalizations ("most birds fly")
- Expert testimony
- Analogical reasoning
- Practical inferences

### Visual Distinction

In Mesh, strict rules are marked with a **blue badge** (🔵 STRICT) while defeasible rules have no special marking.

---

## When to Use Strict vs Defeasible Rules

### ✅ Use STRICT Rules When:

1. **Logical Validity**: The inference is logically valid (e.g., modus ponens)
   - "If P then Q. P. Therefore Q."
   
2. **Mathematical Proofs**: The reasoning is mathematical
   - "n is even → n² is even"
   
3. **Definitions**: The conclusion follows from definitions
   - "x is a bachelor → x is unmarried"
   
4. **Analytical Truths**: True by meaning alone
   - "All triangles have three sides"

5. **Kantian Transcendental Arguments**: Necessary conditions for experience
   - "Experience requires categories of understanding"

### ❌ Use DEFEASIBLE Rules When:

1. **Generalizations**: Based on observation, not logic
   - "Birds typically fly"
   
2. **Expert Opinion**: Authority-based reasoning
   - "The doctor says this treatment works"
   
3. **Analogies**: Similarity-based reasoning
   - "This case is like that precedent"
   
4. **Practical Reasoning**: Goal-based inference
   - "To achieve X, do Y"

---

## How to Create Strict Rules

### Step 1: Open the Argument Composer

Navigate to any deliberation and click **"Create Argument"**.

### Step 2: Choose Your Argument Type

You can create strict rules in two ways:

#### A. Scheme-Based Arguments
1. Select an argumentation scheme (e.g., "Modus Ponens")
2. Fill in the scheme slots
3. Select **"STRICT"** in the Rule Type section

#### B. Freeform Arguments
1. Choose "Freeform Argument"
2. Add your premises and conclusion
3. Select **"STRICT"** in the Rule Type section

### Step 3: Review the Warning

When you select STRICT, you'll see a warning:

> ⚠️ **Strict rules require strong justification**
> 
> Ensure your inference pattern is truly *logically valid*. Opponents cannot rebut strict conclusions directly—they can only undercut by challenging premises or the rule itself.

### Step 4: (Optional) Name Your Rule

For undercutting attacks, you can name your rule:
- "Modus Ponens"
- "Universal Instantiation"
- "Kant's Transcendental Argument"

This makes it easier for opponents to reference when challenging your reasoning.

### Step 5: Check Transposition

If creating a strict rule with multiple premises, Mesh will check **transposition closure**:

> 💡 **Transposition Closure**
> 
> For logical consistency, strict rules should support *contrapositive reasoning* (modus tollens). If you create "**P → Q**", the system may warn if "**¬Q → ¬P**" is missing.

You can auto-generate missing transpositions with one click.

---

## Real-World Examples

### Example 1: Kantian Transcendental Argument

**Context**: Philosophical debate about necessary conditions for knowledge

**Premises**:
- "We have sensory experiences"
- "We possess categories of understanding (causality, substance, etc.)"

**Conclusion**:
- "We have structured experience"

**Rule Type**: STRICT (Kantian deduction)

**Justification**: This is a transcendental argument—the conclusion follows necessarily from the premises. If you have sensory input and categories, you *must* have structured experience.

**Attack Possibilities**:
- ✅ **Undercut the premises**: "Do we really possess innate categories?"
- ✅ **Undercut the rule**: "Is the Kantian framework correct?"
- ❌ **Rebut the conclusion**: Cannot directly rebut "We have structured experience"

---

### Example 2: Mathematical Proof

**Context**: Number theory discussion

**Premises**:
- "n is an even number"

**Conclusion**:
- "n² is an even number"

**Rule Type**: STRICT (mathematical proof)

**Justification**: This is a proven mathematical theorem. If n = 2k, then n² = 4k² = 2(2k²), which is even.

**Transposition**: The system will suggest adding:
- "n² is odd → n is odd" (contrapositive)

This enables proof by contradiction: if you observe n² is odd, you can deduce n must be odd.

---

### Example 3: Legal Reasoning (Statutory Rule)

**Context**: Constitutional law debate

**Premises**:
- "Person X is a U.S. citizen"
- "Person X is over 18 years old"

**Conclusion**:
- "Person X has the right to vote"

**Rule Type**: STRICT (statutory rule)

**Justification**: This follows directly from the Constitution and Voting Rights Act. If the premises are satisfied, the conclusion is legally mandated.

**Attack Possibilities**:
- ✅ **Undercut premises**: "Is X really a citizen?" (challenge documentation)
- ✅ **Undercut rule**: "Are there exceptions?" (felony disenfranchisement)
- ❌ **Rebut conclusion**: Cannot say "X lacks voting rights" without challenging premises/rule

---

### Example 4: Modus Ponens (Classical Logic)

**Context**: Logic discussion

**Premises**:
- "If it's raining, the ground is wet"
- "It's raining"

**Conclusion**:
- "The ground is wet"

**Rule Type**: STRICT (modus ponens)

**Justification**: This is a fundamental logical inference rule. The conclusion follows necessarily.

**Transposition**: System suggests adding:
- "The ground is not wet → It's not raining" (modus tollens)

This enables: "I observe the ground is dry, therefore it's not raining."

---

### Example 5: WRONG Use of Strict Rules ❌

**Context**: General argument about exercise

**Premises**:
- "Most doctors recommend exercise"

**Conclusion**:
- "Exercise is healthy"

**Rule Type**: ❌ DEFEASIBLE (NOT strict!)

**Why Wrong**: This is a generalization based on expert opinion, not a logical necessity. You could have evidence that exercise is harmful in certain cases. Use DEFEASIBLE for this.

---

## Attack Restrictions

### What Changes with Strict Rules?

When an argument uses a strict rule, its conclusion **cannot be rebutted directly**.

#### Example Scenario

**Argument A** (Strict):
- Premises: "Socrates is human"
- Conclusion: "Socrates is mortal"
- Rule: "All humans are mortal" (STRICT)

**Attack Options**:
- ✅ **Undermine premises**: "Is Socrates really human?" (attack premise source)
- ✅ **Undercut the rule**: "Is the rule 'all humans are mortal' valid?" (challenge inference)
- ❌ **Rebut conclusion**: Cannot create argument concluding "Socrates is immortal"

**Why?** If you accept that Socrates is human AND that all humans are mortal, you cannot logically deny that Socrates is mortal. You must challenge the premises or the rule itself.

### How to Challenge Strict Arguments

1. **Question the premises**: 
   - "How do we know X is true?"
   - "What's the evidence for this premise?"

2. **Challenge the rule**:
   - "Is this really a strict rule, or just a generalization?"
   - "Are there exceptions or edge cases?"
   - "Is the logical form valid?"

3. **Provide a countermodel**:
   - Show a scenario where premises are true but conclusion could be false
   - This proves the rule isn't actually strict

---

## Transposition Closure

### What Is Transposition?

For every strict rule, its **contrapositive** should also hold. This enables modus tollens reasoning.

**Original Rule**: P → Q ("If P, then Q")  
**Transposition**: ¬Q → ¬P ("If not Q, then not P")

### Why Does This Matter?

Transposition allows you to reason backwards from denying the conclusion:

**Forward** (Modus Ponens):
1. If it's raining, the ground is wet
2. It's raining
3. ∴ The ground is wet

**Backward** (Modus Tollens):
1. If it's raining, the ground is wet
2. The ground is NOT wet
3. ∴ It's NOT raining

### Automatic Validation

When you create a strict rule, Mesh checks if the transposition exists. If missing, you'll see:

> ⚠️ **Transposition Closure Violated**
> 
> 1 contrapositive rule missing. Strict rules should be closed under transposition for logical consistency.
> 
> [Show Missing Rules] [Auto-generate Transpositions]

### Multi-Premise Rules

For rules with multiple premises, Mesh generates one transposition per premise:

**Rule**: P, Q → R  
**Transpositions**:
1. Q, ¬R → ¬P
2. P, ¬R → ¬Q

### Example: Legal Contract Formation

**Original Rule**:
- "offer + acceptance + consideration → valid contract"

**Transpositions** (auto-generated):
1. "acceptance + consideration + ¬valid_contract → ¬offer"
2. "offer + consideration + ¬valid_contract → ¬acceptance"
3. "offer + acceptance + ¬valid_contract → ¬consideration"

**Legal Reasoning**: "If we have offer and acceptance but no valid contract, then consideration must be missing."

---

## Best Practices

### 1. Use Strict Rules Sparingly

**Guideline**: < 20% of your rules should be strict.

Most real-world reasoning is defeasible. Only mark rules as strict when you're certain the inference is logically necessary.

### 2. Document Your Justification

Use the optional "Rule name" field to explain why the rule is strict:
- "Modus Ponens (classical logic)"
- "Mathematical theorem (proven)"
- "Constitutional mandate (15th Amendment)"

### 3. Accept Transposition Suggestions

When Mesh suggests auto-generating transpositions, accept unless you have a specific reason not to. This ensures:
- Logical consistency
- Support for modus tollens reasoning
- Complete argumentation framework

### 4. Challenge Misused Strict Rules

If you see an opponent mark a generalization as strict:
1. Click "Attack Argument"
2. Choose "Undercut the Rule"
3. Explain: "This is a generalization, not a logical necessity. It should be defeasible."

### 5. Prefer Defeasible When in Doubt

**If unsure**, use DEFEASIBLE. It's easier to change later than to defend an invalid strict rule.

---

## Troubleshooting

### "My strict rule keeps getting rejected"

**Possible causes**:
1. The rule is actually defeasible (a generalization, not logical necessity)
2. You haven't provided sufficient justification in the "Rule name" field
3. The premises don't actually entail the conclusion

**Solution**: Review the [When to Use Strict Rules](#when-to-use-strict-vs-defeasible-rules) section.

---

### "I can't rebut my opponent's conclusion"

**This is expected** if their argument uses a strict rule.

**Solution**: 
1. Check if the rule should actually be strict
2. If yes, undercut the premises or rule instead
3. If no, create an argument explaining why the rule is defeasible

---

### "The transposition warning won't go away"

**Cause**: You've created strict rules without their contrapositives.

**Solution**:
1. Go to the ASPIC+ Theory tab
2. Click "Show Missing Rules"
3. Click "Auto-generate Transpositions"
4. The system will create all necessary contrapositives

---

### "My auto-generated transpositions look wrong"

**Example issue**: "rain → wet" generated "¬wet → ¬rain" but you expected something else.

**Explanation**: This is correct! The contrapositive uses negation (¬) symbols. If you want natural language, you can:
1. Edit the generated rule's conclusion
2. Replace "¬rain" with "not raining" or "dry weather"

---

### "Can I mix strict and defeasible rules in one argument?"

**Yes!** An argument can have:
- Strict sub-arguments (foundational logic)
- Defeasible sub-arguments (applied reasoning)

The top rule determines the overall strength. If the top rule is strict, the entire argument's conclusion cannot be rebutted (but sub-arguments can still be attacked).

---

## Summary Checklist

Before marking a rule as STRICT, ask yourself:

- [ ] Is this inference **logically valid**, not just plausible?
- [ ] Would it be **impossible** for the premises to be true and conclusion false?
- [ ] Can I name the **logical principle** justifying this (modus ponens, definition, theorem)?
- [ ] Am I prepared to defend this against undercutting attacks?
- [ ] Have I checked for necessary **transpositions**?

If you answered "no" to any question, consider using DEFEASIBLE instead.

---

## Further Reading

**ASPIC+ Framework**:
- Modgil & Prakken (2013): "The ASPIC+ framework for structured argumentation"
- Caminada & Amgoud (2007): "On the evaluation of argumentation formalisms"

**In Mesh Docs**:
- `ASPIC_STRICT_RULES_DEEP_DIVE.md` - Technical implementation details
- `ASPIC_PHASE1C_TRANSPOSITION_PLAN.md` - Transposition closure specification
- `THEORETICAL_FOUNDATIONS_SYNTHESIS.md` - Full ASPIC+ theory reference

**Support**: For questions, contact the Mesh development team or open an issue on GitHub.

---

**Version History**:
- v1.0 (Nov 17, 2025): Initial release with strict rules support
