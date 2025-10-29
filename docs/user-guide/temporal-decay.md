# Temporal Decay

## Overview

Temporal decay reduces the confidence of arguments that haven't been updated recently. This reflects the reality that information becomes outdated, evidence may be superseded, and older claims may no longer hold in changing contexts.

## How It Works

### Decay Formula

Confidence decreases exponentially over time using a **half-life model**:

```
decayFactor = max(minConfidence, e^(-ln(2) × days / halfLife))
adjustedConfidence = originalConfidence × decayFactor
```

**Default Configuration:**
- **Half-life**: 90 days (confidence drops to 50% after 90 days)
- **Minimum confidence**: 0.1 (arguments never decay below 10%)

### Decay Calculation Example

| Days Since Update | Decay Factor | Example (0.8 → ?) |
|-------------------|--------------|-------------------|
| 0 days | 1.00 | 0.80 |
| 30 days | 0.79 | 0.63 |
| 60 days | 0.63 | 0.50 |
| 90 days (half-life) | 0.50 | 0.40 |
| 120 days | 0.40 | 0.32 |
| 180 days | 0.25 | 0.20 |

## Visual Indicators

### Stale Argument Badge

Arguments display a badge when they become stale (> 7 days old):

- 🟢 **Normal** (< 30 days): No badge shown, argument is fresh
- 🟡 **Warning** (30-90 days): Yellow badge with decay factor
- 🔴 **Critical** (> 90 days): Red badge indicating severe staleness

**Badge Example:**
```
⏰ 45 days ago • Decay: 0.71
```

### Decay Explanation Tooltip

Hover over the stale badge to see:
- Exact days since last update
- Current decay factor
- Formula explanation
- Original vs. adjusted confidence
- Suggestion to update the argument

## Features

### Resetting Decay

Update your argument to reset the decay timer:

1. Navigate to your argument
2. Click **Edit Argument**
3. Make substantive changes (not just typos)
4. Click **Save**
5. `lastUpdatedAt` timestamp resets, decay factor returns to 1.0

**Note:** Minor edits (< 10 characters changed) may not reset decay to prevent gaming the system.

### Decay Configuration

Deliberation moderators can adjust decay settings:

**Via Settings Panel:**
1. Go to Deliberation Settings
2. Navigate to **Temporal Decay** tab
3. Adjust:
   - **Half-Life** (in days): How quickly confidence decays
   - **Minimum Confidence**: Lowest possible confidence floor
   - **Grace Period**: Days before decay starts
4. Click **Save Configuration**

**Common Configurations:**

| Context | Half-Life | Min Confidence | Grace Period |
|---------|-----------|----------------|--------------|
| Fast-moving topics (tech news) | 30 days | 0.2 | 7 days |
| General discussions | 90 days | 0.1 | 14 days |
| Foundational debates | 180 days | 0.3 | 30 days |

### Viewing Decay History

See how an argument's confidence has changed over time:

1. Open the argument detail page
2. Click **Confidence History** tab
3. View a graph showing:
   - Original confidence (green line)
   - Adjusted confidence with decay (orange line)
   - Decay factor over time (blue line)
   - Update events (marked with pins)

## Best Practices

### When to Update Arguments

Update your argument when:
- **New evidence emerges**: Link to recent studies, data, or events
- **Counterarguments addressed**: Respond to recent attacks
- **Context changes**: Political, technological, or social shifts
- **Sources updated**: Replace outdated links with current ones

### Avoiding Unnecessary Updates

Don't update just to reset decay if:
- No new information is available
- The argument still holds true
- Changes are purely cosmetic (formatting, typos)

Instead, add a comment explaining why the argument remains valid despite its age.

### Monitoring Stale Arguments

Use the **Stale Arguments Filter** to find arguments needing updates:

1. Click **Filters** in the argument list
2. Select **Temporal Decay** filter
3. Choose severity level:
   - **Warning** (30-90 days)
   - **Critical** (> 90 days)
4. Review and update flagged arguments

### Deliberation-Wide Decay Strategy

For deliberation moderators:

1. **Set appropriate half-life**: Match the topic's pace of change
2. **Announce decay policy**: Let participants know decay is enabled
3. **Regular reviews**: Monthly check for critically stale arguments
4. **Encourage updates**: Reward participants who keep arguments fresh

## FAQ

**Q: Why does my argument's confidence keep dropping?**
A: Temporal decay reduces confidence over time if you don't update the argument. Add new evidence or respond to recent attacks to reset the decay timer.

**Q: Can I disable decay for my argument?**
A: No, decay applies to all arguments in a deliberation. However, you can easily reset it by making substantive updates.

**Q: What counts as a "substantive" update?**
A: Changes that add new information, evidence, or reasoning. Simply rewording the same claim won't reset decay.

**Q: Does decay affect other arguments that reference mine?**
A: Yes, if your argument supports others, its reduced confidence propagates through the argument graph via confidence propagation rules.

**Q: What if my argument is foundational and doesn't need updates?**
A: Consider adding a recent citation or reaffirming the claim with a comment. Alternatively, moderators can increase the half-life for foundational deliberations.

## Technical Details

### Exponential Decay Model

We use exponential decay rather than linear decay because:
- Reflects how evidence credibility degrades naturally
- Prevents cliff effects (sharp confidence drops)
- Allows configurable half-life parameter
- Maintains mathematical properties (never reaches zero)

### Decay Factor Calculation

```typescript
export function calculateDecayFactor(
  days: number,
  config: { halfLife: number; minConfidence: number }
): number {
  const decayRate = Math.log(2) / config.halfLife;
  const factor = Math.exp(-decayRate * days);
  return Math.max(config.minConfidence, factor);
}
```

### Grace Period

Arguments less than 7 days old don't show decay indicators to avoid:
- UI clutter for fresh arguments
- Discouraging new participants
- False urgency on recent contributions

## Integration with Other Features

### Confidence Propagation

Temporal decay affects downstream confidence:
- Arguments supporting yours inherit reduced confidence
- Chains of reasoning decay proportionally
- See [Confidence Metrics](./confidence.md) for details

### Hom-Set Analysis

Decay impacts aggregate confidence in hom-set calculations:
- Stale edges reduce overall argument strength
- Categorical metrics account for temporal factors
- See [Hom-Set Analysis](./hom-set-analysis.md)

### Dialogue Tracking

Decay doesn't affect dialogue state badges:
- A "Complete" (3/3) argument can still be stale
- Answer attacks to reset decay AND improve dialogue state
- See [Dialogue Tracking](./dialogue-tracking.md)

## Related Features

- [Confidence Metrics](./confidence.md) - How confidence is calculated and displayed
- [Dempster-Shafer Mode](./dempster-shafer-mode.md) - Uncertainty visualization with temporal factors
- [Hom-Set Analysis](./hom-set-analysis.md) - Categorical perspective on argument strength

---

**Next Steps:**
- Learn about [Assumptions](./assumptions.md) to understand foundational claims
- Explore [Dempster-Shafer Mode](./dempster-shafer-mode.md) for uncertainty visualization
