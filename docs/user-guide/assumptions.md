# Assumptions

## Overview

Assumptions are foundational claims that underlie arguments in a deliberation. They represent shared beliefs, background knowledge, or simplifications that participants accept (or challenge) to make progress in discussion. Managing assumptions explicitly helps identify points of agreement and disagreement.

## What Are Assumptions?

An assumption is a claim that:
- **Isn't directly argued for** in the deliberation
- **Supports other arguments** as a premise or background condition
- **May be contested** by participants who disagree with its validity

### Example

**Argument:** "We should invest in solar energy because it reduces carbon emissions."

**Underlying Assumptions:**
1. Carbon emissions cause climate change (scientific)
2. We have a responsibility to mitigate climate change (ethical)
3. Solar energy is technically feasible at scale (practical)

If someone challenges assumption #3, the original argument weakens until that assumption is defended or retracted.

## Assumption Lifecycle

Assumptions move through states as participants evaluate them:

### 1. PROPOSED

**Initial state** when someone creates an assumption.

**Actions available:**
- **Accept**: Agree that this assumption holds
- **Challenge**: Question its validity (provide reason)

**Example:**
> 💡 **PROPOSED**
> "Assumption: All participants in this deliberation are domain experts."

### 2. ACCEPTED

Assumption has been **accepted** by the proposer or another participant.

**Actions available:**
- **Retract**: Remove acceptance (assumption goes back to PROPOSED or RETRACTED)

**Example:**
> ✅ **ACCEPTED**
> "Assumption: The data used in this discussion is from 2024."

### 3. CHALLENGED

Someone has questioned the assumption's validity.

**Details shown:**
- Challenge reason (why the assumption may not hold)
- Challenger identity and timestamp

**Actions available:**
- **Defend**: Post a response defending the assumption (returns to PROPOSED)
- **Retract**: Acknowledge the challenge and remove the assumption

**Example:**
> ⚠️ **CHALLENGED**
> "Assumption: AI systems will always have error rates."
> *Challenge reason: "Future breakthroughs may eliminate errors in narrow domains."*

### 4. RETRACTED

Assumption has been **withdrawn** from the deliberation.

**Actions available:** None (assumption is no longer active)

**Impact:** Arguments depending on this assumption are flagged as unsupported.

**Example:**
> ❌ **RETRACTED**
> "Assumption: Electric vehicles have zero environmental impact."
> *(Retracted due to challenges about battery production emissions)*

## Features

### Creating Assumptions

**Via Create Assumption Form:**

1. Navigate to the **Assumptions** tab in your deliberation
2. Click **New Assumption**
3. Fill out the form:
   - **Content** (required): The assumption claim
   - **Role** (required): Type of assumption (see [Assumption Roles](#assumption-roles))
   - **Description** (optional): Context or justification
4. Click **Create Assumption**

Your assumption starts in **PROPOSED** status.

### Assumption Roles

Classify your assumption by type:

| Role | Description | Example |
|------|-------------|---------|
| **BACKGROUND** | General knowledge or context | "The internet is widely accessible in developed nations." |
| **DOMAIN** | Field-specific expertise | "Quantum computers use superposition." |
| **SIMPLIFICATION** | Abstraction for tractability | "We ignore transaction costs in this model." |
| **EPISTEMIC** | Knowledge limitations | "We assume participants are truthful." |

**Why roles matter:**
- Help categorize and filter assumptions
- Signal what kind of evidence is needed to defend
- Identify systemic dependencies (e.g., many EPISTEMIC assumptions = trust issues)

### Active Assumptions Panel

View all **ACCEPTED** assumptions for a deliberation:

**Location:** Click **Active Assumptions** button in deliberation header

**Features:**
- List of all accepted assumptions
- Count of challenged vs. unchallenged
- Quick links to assumption detail pages
- Filter by role (BACKGROUND, DOMAIN, etc.)

**Use cases:**
- Review foundational claims before concluding deliberation
- Identify assumptions that need defense
- Understand shared vs. contested ground

### Assumption Dependency Graph

See which arguments rely on an assumption:

**Location:** Assumption detail page → **Dependencies** tab

**Features:**
- List of arguments using this assumption as a premise
- Confidence scores of dependent arguments
- Average confidence of dependent arguments
- **Retraction impact warning**: "Retracting this assumption would affect 8 arguments"

**Use cases:**
- Assess the importance of an assumption
- Understand cascading effects of challenging/retracting
- Prioritize which assumptions to defend

### Challenging Assumptions

**Steps:**
1. Navigate to an assumption card
2. Click **Challenge**
3. Provide a **reason**: Explain why the assumption may not hold
4. Click **Submit Challenge**

The assumption moves to **CHALLENGED** status, and your reason is displayed.

**Challenge Examples:**

**Good:**
> "This assumption relies on 2019 data, but the landscape has changed significantly. Recent studies show the opposite trend."

**Poor:**
> "I don't think this is true."

**Best practices:**
- Provide evidence (links, studies, examples)
- Be specific about what's problematic
- Suggest alternative assumptions if possible

### Accepting Assumptions

Click **Accept** on a PROPOSED assumption to:
- Signal agreement with the claim
- Allow it to support arguments
- Move it to **ACCEPTED** status

**Note:** Accepting an assumption doesn't prevent others from challenging it later.

### Retracting Assumptions

Click **Retract** on an ACCEPTED assumption to:
- Withdraw the claim from the deliberation
- Mark dependent arguments as unsupported
- Move it to **RETRACTED** status

**Warning:** Retracting an assumption with many dependencies can weaken large parts of the argument graph. Review the dependency graph first.

## Best Practices

### When to Create Assumptions

Create an assumption when:
- You're about to use a claim multiple times without defending it
- An argument relies on unstated background knowledge
- You want to make implicit beliefs explicit for discussion

**Example:**
Instead of repeating "economic models assume rational actors" in every argument, create it as a DOMAIN assumption once.

### When to Challenge Assumptions

Challenge an assumption when:
- You have evidence it doesn't hold
- It's overly broad or imprecise
- Alternative assumptions would change conclusions
- It's a hidden source of disagreement

**Don't challenge assumptions:**
- Just to slow down discussion (bad faith)
- That are trivially true or universally accepted
- Without providing a substantive reason

### Managing Assumption Dependencies

**For assumption proposers:**
1. Check the dependency graph regularly
2. Defend challenges promptly (they weaken dependent arguments)
3. Retract gracefully if a challenge is valid

**For argument authors:**
1. Be aware of which assumptions your arguments rely on
2. Monitor challenges to those assumptions
3. Consider defending assumptions your arguments depend on

### Deliberation-Wide Assumption Strategy

**For moderators:**
1. **Create core assumptions early**: Establish shared ground at the start
2. **Encourage explicit assumptions**: Ask participants to state their premises
3. **Review periodically**: Check for inconsistent or contradictory assumptions
4. **Resolve challenges**: Facilitate discussions about contested assumptions

## Workflow Example

**Scenario:** You're arguing for a policy change.

1. **Identify underlying assumptions:**
   - "The current policy has measurable problems."
   - "The proposed policy is technically feasible."
   - "Cost is not a limiting factor."

2. **Create assumptions:**
   - Go to Assumptions tab → New Assumption
   - Add each with appropriate role (BACKGROUND, DOMAIN, etc.)

3. **Reference in arguments:**
   - Your arguments now show dependencies on these assumptions
   - Dependency graph displays the connections

4. **Respond to challenges:**
   - Alice challenges: "Cost IS a limiting factor—here's the budget analysis."
   - You defend: "The budget allows for a 3-year rollout, here's the breakdown."
   - Assumption returns to ACCEPTED after successful defense

5. **Monitor impact:**
   - Check dependency graph: 12 arguments rely on this assumption
   - If retracted, all 12 would weaken → defend vigorously

## FAQ

**Q: What's the difference between an assumption and an argument?**
A: An **argument** is a claim you're actively defending with premises and evidence. An **assumption** is a claim you're *not* defending (or not yet)—it's taken as a starting point.

**Q: Can I turn an assumption into a full argument later?**
A: Yes! If an assumption is challenged frequently, you can create a full argument defending it, then reference that argument when re-proposing the assumption.

**Q: Who can accept or challenge assumptions?**
A: Any participant in the deliberation. Assumptions are collaborative—it's not just the proposer's decision.

**Q: What happens to arguments when their assumptions are retracted?**
A: They're flagged as "unsupported" and their confidence may decrease. Authors are notified and can either:
- Defend the assumption (move it back to PROPOSED or ACCEPTED)
- Revise the argument to not rely on that assumption
- Retract the argument if it can't stand without the assumption

**Q: How do assumptions affect confidence scores?**
A: Arguments depending on challenged or retracted assumptions receive reduced confidence scores during propagation. Accepted assumptions have no negative impact.

**Q: Can assumptions have sub-assumptions?**
A: Not directly, but you can create a chain: Argument A depends on Assumption B, which in turn could be supported by another argument that depends on Assumption C. The dependency graph will show these chains.

## Technical Details

### Assumption Model

```typescript
interface Assumption {
  id: string;
  deliberationId: string;
  content: string; // The assumption claim
  role: "BACKGROUND" | "DOMAIN" | "SIMPLIFICATION" | "EPISTEMIC";
  status: "PROPOSED" | "ACCEPTED" | "CHALLENGED" | "RETRACTED";
  description?: string; // Optional context
  proposedBy: string; // User ID
  proposedAt: Date;
  acceptedAt?: Date;
  retractedAt?: Date;
  challengeReason?: string; // If CHALLENGED
}
```

### Dependency Tracking

```typescript
interface AssumptionUse {
  assumptionId: string;
  argumentId: string;
  createdAt: Date;
}
```

This join table tracks which arguments depend on which assumptions, enabling the dependency graph.

### Confidence Propagation

When calculating an argument's confidence:

```typescript
function adjustForAssumptions(baseConfidence: number, assumptions: Assumption[]): number {
  const accepted = assumptions.filter(a => a.status === "ACCEPTED");
  const challenged = assumptions.filter(a => a.status === "CHALLENGED");
  const retracted = assumptions.filter(a => a.status === "RETRACTED");
  
  // Reduce confidence for challenged/retracted assumptions
  const penalty = (challenged.length * 0.1) + (retracted.length * 0.3);
  return Math.max(0.1, baseConfidence - penalty);
}
```

## Integration with Other Features

### Argumentation Schemes

Assumptions often correspond to scheme nodes:
- Assumption → PREMISE node in scheme
- Challenging an assumption → asking a critical question
- See [Argumentation Schemes](./schemes.md)

### Confidence Metrics

Assumption status affects confidence propagation:
- ACCEPTED: No impact
- CHALLENGED: Slight confidence reduction
- RETRACTED: Significant confidence reduction
- See [Confidence Metrics](./confidence.md)

### Dialogue Tracking

Defending assumptions may involve GROUNDS responses:
- Challenge = implicit attack
- Defense = GROUNDS response to challenge
- See [Dialogue Tracking](./dialogue-tracking.md)

## Related Features

- [Argumentation Schemes](./schemes.md) - Formal structure of arguments and assumptions
- [Confidence Metrics](./confidence.md) - How assumption status affects confidence
- [Dialogue Tracking](./dialogue-tracking.md) - Responding to challenges

---

**Next Steps:**
- Learn about [Hom-Set Analysis](./hom-set-analysis.md) for categorical perspective on argument dependencies
- Explore [Critical Questions](./critical-questions.md) for guided assumption evaluation
