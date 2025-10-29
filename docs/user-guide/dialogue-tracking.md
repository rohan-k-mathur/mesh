# Dialogue Tracking

## Overview

Dialogue tracking helps you monitor which attacks on your arguments have been answered with GROUNDS responses. This ensures all challenges are properly addressed in your deliberation, following the argumentation protocols of the Mesh platform.

## Features

### Dialogue State Badge

Each argument displays a badge showing how many attacks have been answered:

- ✅ **Green (Complete)**: All attacks have GROUNDS responses
- ⏱️ **Yellow (Partial)**: Some attacks answered, but more work needed
- ❌ **Red (Pending)**: No attacks answered yet

The badge format is `X/Y` where:
- `X` = Number of attacks answered with GROUNDS
- `Y` = Total number of attacks on this argument

**Example:**
- `3/3` (green) - All attacks answered, move is complete
- `2/5` (yellow) - 2 out of 5 attacks answered
- `0/4` (red) - No attacks answered yet, requires attention

### Answered Attacks Panel

View a detailed list of all attacks on an argument and their responses:

1. Navigate to an argument's detail view
2. Scroll to the "Attacks & Responses" section
3. See which attacks have GROUNDS responses with:
   - Original attack content and scheme
   - GROUNDS response content
   - Response quality votes
   - Timestamp and author information

### Response Votes

Community members can vote on response quality to surface the best defenses:

- 👍 **Upvote**: This is a strong, effective response
- 👎 **Downvote**: This response is weak or doesn't address the attack
- 🚩 **Flag**: Mark as inappropriate, off-topic, or rule-violating

**Voting helps:**
- Identify which responses effectively defend against attacks
- Surface weak responses that need improvement
- Build consensus on argument quality

### Dialogue Filter

Filter arguments in your deliberation by dialogue state:

1. Click the **Dialogue Filter** button in the argument list
2. Select one or more states:
   - **Complete**: All attacks answered (3/3, 5/5, etc.)
   - **Partial**: Some attacks answered (2/5, 1/3, etc.)
   - **Pending**: No attacks answered (0/4, 0/1, etc.)
3. Click **Apply Filter**

This helps you:
- Focus on arguments that need responses (Pending)
- Review partially defended arguments (Partial)
- Verify fully defended arguments (Complete)

## Best Practices

### Prioritize High-Impact Attacks

When multiple attacks exist, answer those with:
- Higher confidence scores
- More community votes/attention
- Critical scheme types (e.g., attacks on expert credibility)

### Aim for Complete Status

A deliberation is stronger when all arguments reach "Complete" status. Work systematically to answer all attacks, even if they seem minor.

### Use Response Votes Wisely

- **Upvote** responses that directly address the attack premise
- **Downvote** responses that deflect or miss the point
- **Flag** responses that violate community guidelines

### Check Dialogue State Regularly

Before concluding a deliberation:
1. Use the Dialogue Filter to find all Pending arguments
2. Verify Partial arguments have addressed the most important attacks
3. Review Complete arguments to ensure responses are high-quality

### GROUNDS Responses

A valid GROUNDS response must:
- Directly challenge the attacker's premise
- Provide evidence or reasoning
- Follow the GROUNDS node type conventions (see [Argumentation Schemes](./schemes.md))

**Good GROUNDS Response:**
> "The study you cited has been retracted due to methodological flaws. Here's a more recent meta-analysis showing the opposite result: [link]"

**Poor GROUNDS Response:**
> "I disagree with your attack."

## Integration with Critical Questions

Dialogue tracking works alongside Critical Questions (CQs):
- When you answer a CQ, it may count as answering an attack
- Use CQ guidance to structure your GROUNDS responses
- See [Critical Questions Guide](./critical-questions.md) for details

## Workflow Example

1. **Review your argument**: Check the dialogue state badge (e.g., "2/5")
2. **Open Answered Attacks Panel**: See which attacks already have responses
3. **Identify unanswered attacks**: Focus on the 3 remaining attacks
4. **Craft GROUNDS responses**: Address each attack's premise with evidence
5. **Submit responses**: Watch the badge update to "5/5" (green)
6. **Monitor votes**: Community feedback helps you improve responses if needed

## FAQ

**Q: What if an attack is invalid or irrelevant?**
A: You can still provide a GROUNDS response explaining why the attack doesn't apply. Alternatively, use the flagging system to report invalid attacks.

**Q: Can I edit a GROUNDS response after submission?**
A: Yes, responses can be edited within 24 hours. After that, you'll need to post a new response or request moderator assistance.

**Q: What happens if I don't answer all attacks?**
A: Your argument remains in Partial or Pending state, which may reduce its perceived strength in the deliberation. Aim for Complete status when possible.

**Q: Do I need to answer attacks in a specific order?**
A: No, but we recommend addressing high-confidence attacks first, as they have the most impact on your argument's overall credibility.

## Related Features

- [Argumentation Schemes](./schemes.md) - Understanding attack types and structures
- [Critical Questions](./critical-questions.md) - Guided prompts for responses
- [Confidence Metrics](./confidence.md) - How dialogue state affects confidence scores

---

**Next Steps:**
- Learn about [Temporal Decay](./temporal-decay.md) to understand how argument age affects confidence
- Explore [Dempster-Shafer Mode](./dempster-shafer-mode.md) for uncertainty visualization
