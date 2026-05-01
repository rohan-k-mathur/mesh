# Justification Systems Explanation

**Date**: January 2025  
**Question**: What is the difference between `justification` and `implicitWarrant`?

---

## Summary

There are **two separate justification systems** in Mesh, serving different purposes:

1. **`implicitWarrant`** (on `Argument` model) - Explains **WHY premises support conclusion**
2. **`justification`** (on `ArgumentSchemeInstance` model) - Explains **WHY you chose this scheme reconstruction**

Both are coherent and serve complementary roles in argument analysis.

---

## 1. `implicitWarrant` - Inference Rule (Argument Level)

### Location
```prisma
model Argument {
  // ...
  implicitWarrant Json? // optional enthymeme/warrant text or rule
  // ...
}
```

**Line**: schema.prisma:2303

### Purpose
Stores the **missing inference rule** that connects premises to conclusion (Toulmin's "warrant").

### Use Case: Enthymematic Arguments
When an argument has **unstated assumptions** that make the inference valid:

**Example**:
```
Premise 1: Socrates is a man
Conclusion: Socrates is mortal

implicitWarrant: "All men are mortal" ← MISSING PREMISE
```

### Typical Content
- Missing major premise (e.g., "All X are Y")
- Inference rule (e.g., "If expert, then reliable")
- Background assumption (e.g., "Correlation suggests causation")
- Connecting principle (e.g., "Past predicts future")

### Where It's Used
- **ArgumentCardV2**: Shows as "Implicit Warrant" or "Unstated Assumption"
- **Assumption API** (`/api/arguments/[id]/assumptions`): Returns as `implicitWarrant` field
- **Argument creation**: Optional field in AIFArgumentWithSchemeComposer (labeled "Notes" or "Warrant")

### Example in UI
```
┌─ Implicit Warrant ─────────────────┐
│ All men are mortal                 │
│                                    │
│ This premise is required for the   │
│ inference to be valid but is not   │
│ explicitly stated in the text.     │
└────────────────────────────────────┘
```

---

## 2. `justification` - Reconstruction Reasoning (Scheme Level)

### Location
```prisma
model ArgumentSchemeInstance {
  // ...
  justification String? @db.Text // For presupposed/implicit: justification for reconstruction
  // ...
}
```

**Line**: schema.prisma:2361

### Purpose
Stores the **analyst's reasoning** for why they chose to reconstruct the argument with this particular scheme.

### Use Case: Interpretive Transparency
When reconstructing an argument, the analyst explains **their interpretive choices**:

**Example**:
```
Scheme: Argument from Expert Opinion

justification: "I chose Expert Opinion because Kant is explicitly cited 
as an authority on transcendental philosophy (paragraph 2). The author 
references his Critique of Pure Reason directly. The major premise 
(experts in X are reliable on X) is implicit but required. Alternative 
schemes considered: Argument from Authority (rejected because credentials 
are thoroughly established)."
```

### Typical Content
- Why this scheme fits the argument structure
- Where premises/conclusion are located in text
- What is explicit vs. implicit
- Alternative schemes considered and rejected
- Interpretive decisions made during reconstruction

### Where It's Used (After Your Implementation)
1. **ArgumentCardV2**: "Reconstruction Notes" section with 💭 icon
2. **ProngEditor**: 💭 tooltip next to arguments
3. **EnablerPanel**: "Why this reconstruction:" below enabler text
4. **AIFArgumentWithSchemeComposer**: Optional textarea during scheme selection

### Example in UI
```
💭 Reconstruction Notes

Expert Opinion: I interpreted this as Expert Opinion because the text 
explicitly names Dr. Smith and cites her 20 years of research. The major 
premise (experts in field X are reliable) comes from the opening sentence. 
The minor premise (Dr. Smith is an expert in X) is stated in paragraph 2. 
I chose this over Argument from Authority because the credentials are 
extensively documented.

Interpretive reasoning for this reconstruction choice
```

---

## Comparison Table

| Aspect | `implicitWarrant` (Argument) | `justification` (SchemeInstance) |
|--------|------------------------------|----------------------------------|
| **Level** | Argument-level | Scheme-level |
| **Purpose** | Fill logical gap in inference | Explain reconstruction choice |
| **Content** | Missing premise or rule | Analyst's reasoning process |
| **Answers** | "What premise is missing?" | "Why did I choose this scheme?" |
| **Philosophical Root** | Enthymeme theory (Aristotle) | CPR reconstruction (Macagno & Walton) |
| **Required When** | Argument is enthymematic | Scheme is implicit/presupposed |
| **Example** | "All men are mortal" | "I chose Expert Opinion because..." |
| **Data Type** | `Json?` (flexible structure) | `String?` (free text) |
| **Visibility** | Shown in Assumptions section | Shown in Reconstruction Notes |

---

## How They Work Together

### Scenario: Complex Philosophical Argument

**Argument**:
```
Kant states that synthetic a priori judgments are possible.
Therefore, metaphysics as a science is possible.
```

**`implicitWarrant`** (What's Missing):
```json
{
  "text": "If synthetic a priori judgments are possible, then metaphysics as a science is possible"
}
```
→ This is the **logical connection** between premise and conclusion

**`justification`** (Why This Reconstruction):
```
"I reconstructed this as Argument from Expert Opinion rather than simple 
Conditional reasoning because:

1. The premise relies on Kant's authority in transcendental philosophy
2. The conclusion follows from his system but isn't proven here
3. The implicit major premise (warrant above) is a Kantian thesis
4. Alternative: Could be Argument from Accepted Premise, but Kant's expertise 
   is relevant to accepting the premise

Location: Major premise (expert reliable) is implicit. Minor premise 
(Kant's claim) is explicit in paragraph 1. Conclusion is paragraph 3."
```
→ This is the **analyst's meta-reasoning** about the reconstruction

### Result in UI

**Implicit Warrant Section**:
```
If synthetic a priori judgments are possible, then 
metaphysics as a science is possible
```

**Reconstruction Notes Section**:
```
💭 I reconstructed this as Argument from Expert Opinion rather than 
simple Conditional reasoning because... [full justification above]
```

---

## When to Use Each

### Use `implicitWarrant` When:
- Argument has unstated premises (enthymeme)
- Inference needs a connecting rule to be valid
- You want to **complete the logical structure**
- You're filling gaps in the **argument itself**

### Use `justification` When:
- Multiple schemes could fit the argument
- Reconstruction involves interpretive choices
- You need to **explain your analytical decisions**
- You're documenting the **reconstruction process**

### Use Both When:
- Reconstructing complex philosophical arguments
- Working with implicit/presupposed schemes
- Full CPR-level analysis required
- Scholarly transparency is critical

---

## Historical Context

### `implicitWarrant` - Classical Logic
- **Root**: Aristotelian enthymeme theory (missing syllogistic premise)
- **Toulmin Model**: Warrant = rule connecting data to claim
- **Function**: Complete the argument structure
- **Audience**: Argument evaluators (does inference hold?)

### `justification` - Argumentation Theory
- **Root**: Macagno & Walton (2009) - argument nets reconstruction
- **CPR Principle**: Charity + Faithfulness + Relevance
- **Function**: Document interpretive reasoning
- **Audience**: Other analysts (why this reconstruction?)

---

## API Integration

### Creating an Argument with Both

```typescript
const argumentId = await createArgument({
  deliberationId,
  authorId,
  conclusionClaimId,
  premiseClaimIds,
  schemeId: "expert_opinion",
  
  // Fill logical gap
  implicitWarrant: { 
    text: "Experts in transcendental philosophy are reliable on synthetic a priori knowledge" 
  },
  
  // Explain reconstruction
  justification: "I chose Expert Opinion because Kant's expertise is explicitly invoked..."
});
```

### Retrieving Both

**Argument Query**:
```typescript
const argument = await prisma.argument.findUnique({
  where: { id: argumentId },
  include: {
    argumentSchemes: {
      include: { scheme: true }
    }
  }
});

// Access warrant
const warrant = argument.implicitWarrant;

// Access justification
const justification = argument.argumentSchemes[0]?.justification;
```

---

## Validation Rules

### `implicitWarrant`
- Optional for all arguments
- Recommended when inference is non-obvious
- Should be a **premise or rule** (not meta-commentary)
- Can be structured JSON or simple text

### `justification`
- Optional for explicit schemes
- **Required** for implicit/presupposed schemes (validation warning)
- Should explain **why this scheme** (not just describe it)
- Should reference **text evidence locations**
- Should mention **alternative schemes considered**

---

## Best Practices

### For `implicitWarrant`
✅ **DO**: State the missing premise clearly  
✅ **DO**: Use logical form when appropriate  
✅ **DO**: Keep it concise (one sentence if possible)  
❌ **DON'T**: Include meta-commentary or justification  
❌ **DON'T**: Restate existing premises  

### For `justification`
✅ **DO**: Explain interpretive choices  
✅ **DO**: Reference paragraph numbers or text locations  
✅ **DO**: Mention alternatives considered  
✅ **DO**: Be detailed and scholarly  
❌ **DON'T**: Just restate the scheme definition  
❌ **DON'T**: Include the missing premise (that's `implicitWarrant`)  

---

## Summary

Both systems are **coherent and complementary**:

- **`implicitWarrant`**: Completes the argument's **logical structure**
- **`justification`**: Documents the analyst's **reconstruction reasoning**

Together they enable:
1. **Logical completeness** (via implicit warrant)
2. **Interpretive transparency** (via justification)
3. **Scholarly rigor** (via documented reasoning)
4. **CPR principles** (Charity + Faithfulness + Relevance)

This is a **sophisticated dual-layer system** that mirrors professional philosophical practice:
- **Inner layer**: The argument's logical structure (with implicit parts filled in)
- **Outer layer**: The analyst's meta-reasoning about that structure

---

**Date**: January 2025  
**Related Docs**:
- IMMEDIATE_PRIORITIES_COMPLETE.md (justification visibility)
- THESIS_ARGUMENTCHAIN_INTEGRATION_ANALYSIS.md (CPR integration)
- CPR_LEVEL_PHILOSOPHY_REVISED_ANALYSIS.md (philosophical rigor)
