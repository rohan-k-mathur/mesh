# Conflict Resolution User Guide

**Last Updated**: November 18, 2025  
**Feature**: ASPIC+ Preference Conflict Resolution  
**Status**: Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [What Are Preference Conflicts?](#what-are-preference-conflicts)
3. [Why Do Conflicts Matter?](#why-do-conflicts-matter)
4. [How to Access Conflict Resolution](#how-to-access-conflict-resolution)
5. [Understanding the Conflict Display](#understanding-the-conflict-display)
6. [Resolution Strategies](#resolution-strategies)
7. [Step-by-Step Resolution Workflow](#step-by-step-resolution-workflow)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)
10. [Technical Details](#technical-details)

---

## Overview

The ASPIC+ Conflict Resolution system detects and helps you resolve **preference cycles** in your deliberation's argumentation framework. When preferences form circular dependencies (e.g., A is preferred to B, B is preferred to C, C is preferred to A), the system cannot determine which arguments are justified. This guide explains how to identify and resolve these conflicts.

---

## What Are Preference Conflicts?

### Definition

A **preference conflict** (or **preference cycle**) occurs when a chain of argument preferences creates a circular loop. 

### Examples

#### Simple 2-Cycle
```
Argument A < Argument B  (B is preferred to A)
Argument B < Argument A  (A is preferred to B)

Result: Cycle detected! ⚠️
```

#### 3-Cycle
```
Argument A < Argument B
Argument B < Argument C
Argument C < Argument A

Result: A → B → C → A (cycle)
```

#### Complex 4-Cycle
```
Argument A < Argument B
Argument B < Argument C
Argument C < Argument D
Argument D < Argument A

Result: A → B → C → D → A (cycle)
```

### Why Cycles Form

Cycles typically occur when:
- Multiple users express conflicting preferences
- Preferences are added incrementally without checking consistency
- Different criteria are used for different preference judgments
- Argumentation schemes suggest contradictory orderings

---

## Why Do Conflicts Matter?

### Impact on Argumentation

**ASPIC+ Rationality**: The ASPIC+ framework guarantees that justified arguments are consistent and defensible. Preference cycles violate the **well-foundedness** postulate, making it impossible to compute:
- Grounded extensions (justified arguments)
- Defeat relations (which attacks succeed)
- Argument status (IN/OUT/UNDECIDED)

**Real-World Analogy**: Imagine a voting system where:
- Alice ranks Bob > Charlie > Alice
- This creates a tie that cannot be broken

### What Happens If Not Resolved

If you don't resolve conflicts:
- ❌ ASPIC+ evaluation will fail or produce incorrect results
- ❌ Arguments may be incorrectly marked as justified or defeated
- ❌ Grounded extension computation will be blocked
- ❌ Theory validation will report violations

**Bottom Line**: You must resolve all preference conflicts before running ASPIC+ evaluation.

---

## How to Access Conflict Resolution

### Step-by-Step Navigation

1. **Open Your Deliberation**
   - Navigate to the deliberation where you want to check for conflicts

2. **Go to the Arguments Tab**
   - Click the **"Arguments"** tab in the main navigation

3. **Switch to the ASPIC Sub-Tab**
   - Within the Arguments tab, click **"ASPIC"**

4. **View Conflict Resolution Panel**
   - The Conflict Resolution Panel appears at the top of the ASPIC tab
   - If conflicts exist, you'll see a red alert banner
   - If no conflicts exist, you'll see a green success message

### Visual Location

```
DeepDivePanelV2
└── [Arguments Tab] ← Click here first
    └── [ASPIC Sub-Tab] ← Then click here
        ├── 🔴 Conflict Resolution Panel (top)
        └── ASPIC Theory Panel (bottom)
```

---

## Understanding the Conflict Display

### Alert Banner

When conflicts are detected, you'll see:

```
⚠️ 2 conflicts detected!
Circular preferences violate rationality constraints and must be resolved before evaluation.
```

- **Red background**: Indicates urgent action required
- **Number of conflicts**: Shows how many cycles exist
- **Warning message**: Explains why resolution is needed

### Conflict Cards

Each conflict is shown in its own card:

```
┌─────────────────────────────────────────────┐
│ 🔴 Cycle | Conflict #1                      │
│                                              │
│ Cycle: arg_A → arg_B → arg_C → arg_A       │
│                                              │
│ ℹ️ Involved Preferences:                     │
│                                              │
│ ┌───────────────────────────────────────┐   │
│ │ arg_A → arg_B                         │   │
│ │ "Climate models are reliable"         │   │
│ │ Weight: 0.85 | 2024-11-15 | User A   │   │
│ └───────────────────────────────────────┘   │
│                                              │
│ ┌───────────────────────────────────────┐   │
│ │ arg_B → arg_C                         │   │
│ │ "Economic factors matter more"        │   │
│ │ Weight: 0.90 | 2024-11-16 | User B   │   │
│ └───────────────────────────────────────┘   │
│                                              │
│ ┌───────────────────────────────────────┐   │
│ │ arg_C → arg_A                         │   │
│ │ "Social impact is paramount"          │   │
│ │ Weight: 0.40 | 2024-11-17 | User A   │   │
│ └───────────────────────────────────────┘   │
│                                              │
│ Resolution Strategy:                        │
│ ○ Remove Weakest Preference (Recommended)   │
│ ○ Keep Most Recent                          │
│ ○ Remove Minority Opinion                   │
│ ○ Manual Selection                          │
│                                              │
│ [Resolve Conflict]                          │
└─────────────────────────────────────────────┘
```

### Preference Metadata

Each preference in a conflict shows:
- **Preferred → Dispreferred**: The preference relationship
- **Justification**: Why this preference was created (if provided)
- **Weight**: Confidence level (0.0 to 1.0)
- **Date**: When the preference was created
- **Creator**: Who created the preference (if available)

---

## Resolution Strategies

The system provides **four strategies** for resolving conflicts. Choose the one that best fits your situation.

### 1. Remove Weakest Preference ⭐ (Recommended)

**What It Does**: Removes the preference with the **lowest confidence weight**.

**When to Use**:
- When preferences have significantly different confidence levels
- When one preference is clearly less certain than others
- When you trust the weight assignments

**How It Works**:
```
Preferences in cycle:
- A → B (weight: 0.85)
- B → C (weight: 0.90)
- C → A (weight: 0.40) ← Weakest

Action: Remove C → A
Result: No cycle! (A → B → C remains)
```

**Recommendation Badge**: 
- Shows **"Recommended"** if the weakest preference has significantly lower weight than the next-weakest
- Example: 0.40 vs. 0.85+ (clear difference)

**Example Scenario**:
> "Three users expressed preferences. User A said Argument 1 > Argument 2 with high confidence (0.9). User B said Argument 2 > Argument 3 with medium confidence (0.7). User C said Argument 3 > Argument 1 but was uncertain (0.3). The system recommends removing User C's preference."

---

### 2. Keep Most Recent

**What It Does**: Removes the **oldest preference** by creation date.

**When to Use**:
- When preferences were added over time as new information emerged
- When you trust that later preferences reflect updated reasoning
- When weights are similar or not meaningful

**How It Works**:
```
Preferences in cycle:
- A → B (created: Nov 10, 2024) ← Oldest
- B → C (created: Nov 15, 2024)
- C → A (created: Nov 18, 2024)

Action: Remove A → B
Result: No cycle! (B → C → A remains)
```

**Example Scenario**:
> "During a deliberation, participants initially preferred economic arguments over social arguments. Later, new evidence showed social factors were more important. Keeping the most recent preferences reflects the current consensus."

---

### 3. Remove Minority Opinion

**What It Does**: Removes preferences from the user who contributed **fewest preferences** in the cycle.

**When to Use**:
- When preferences reflect user voting or consensus
- When some users are outliers in the discussion
- When you want to preserve majority opinion

**How It Works**:
```
Preferences in cycle:
- A → B (created by: User 1)
- B → C (created by: User 1)
- C → A (created by: User 2) ← Minority (1 pref vs. 2)

Action: Remove C → A
Result: No cycle! (A → B → C remains)
```

**Availability**: 
- Only shown if **multiple users** created preferences in the cycle
- If all preferences are from the same user, this option won't appear

**Example Scenario**:
> "In a group deliberation, three participants expressed preferences. Two participants agreed on a consistent ordering. One participant disagreed. The system suggests removing the single dissenting preference."

---

### 4. Manual Selection

**What It Does**: Lets you **choose exactly which preference(s)** to remove.

**When to Use**:
- When you have specific domain knowledge about which preferences are incorrect
- When you want full control over the resolution
- When automatic strategies don't match your reasoning
- When you want to remove multiple preferences at once

**How It Works**:
1. Select "Manual Selection" strategy
2. Checkboxes appear next to each preference
3. Check one or more preferences to remove
4. Click "Resolve Conflict"

**UI Display**:
```
○ Manual Selection
  ☐ A → B (weight: 0.85)
  ☑ B → C (weight: 0.90) ← Selected
  ☐ C → A (weight: 0.40)
```

**Validation**: 
- You must select **at least one preference**
- Error shown if you try to resolve without selections

**Example Scenario**:
> "You realize that one preference was based on a misunderstanding of the argument's conclusion. You manually select that specific preference to remove, even though it's not the weakest or oldest."

---

## Step-by-Step Resolution Workflow

### Complete Workflow

#### Step 1: Detect Conflicts

1. Navigate to **Arguments → ASPIC** tab
2. System automatically checks for conflicts
3. Alert banner appears if conflicts exist

#### Step 2: Review Conflict Details

1. Read the cycle display (e.g., "arg_A → arg_B → arg_A")
2. Expand the conflict card to see all involved preferences
3. Review metadata: weights, dates, creators, justifications
4. Understand why the cycle formed

#### Step 3: Choose a Resolution Strategy

1. Consider the four strategies (see [Resolution Strategies](#resolution-strategies))
2. Look for the "Recommended" badge (if present)
3. Click the radio button for your chosen strategy

**Decision Guide**:
- **Different confidence levels?** → Use "Remove Weakest"
- **Preferences added over time?** → Use "Keep Most Recent"
- **Multiple users involved?** → Consider "Remove Minority Opinion"
- **Need full control?** → Use "Manual Selection"

#### Step 4: Apply Resolution

1. If using **Manual Selection**: Check the preferences to remove
2. Click **"Resolve Conflict"** button
3. System removes the preference(s) and re-checks for conflicts
4. Success message appears if no conflicts remain

#### Step 5: Verify Resolution

1. Confirm "No preference conflicts detected" message appears
2. Review the updated ASPIC Theory Panel below
3. Preferences involved in the conflict are now soft-deleted (status: "resolved")
4. You can proceed with ASPIC+ evaluation

### Visual Workflow Diagram

```
┌─────────────────────────────────────────────────────┐
│ 1. Navigate to Arguments → ASPIC Tab               │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 2. System Detects Conflicts (automatic)            │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 3. Review Conflict Details                         │
│    - Cycle display                                  │
│    - Preference metadata                            │
│    - Weights, dates, creators                       │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 4. Choose Resolution Strategy                      │
│    ○ Remove Weakest (recommended)                  │
│    ○ Keep Most Recent                              │
│    ○ Remove Minority Opinion                       │
│    ○ Manual Selection                              │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 5. Apply Resolution                                │
│    [Resolve Conflict] button                       │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 6. Verify Resolution                               │
│    ✅ No conflicts detected                         │
│    ✅ ASPIC theory updated                          │
│    ✅ Ready for evaluation                          │
└─────────────────────────────────────────────────────┘
```

---

## Troubleshooting

### Problem: "Please select at least one preference"

**Cause**: You chose "Manual Selection" but didn't check any preferences.

**Solution**: Check at least one checkbox before clicking "Resolve Conflict".

---

### Problem: Conflict still exists after resolution

**Cause**: Multiple overlapping cycles. Resolving one cycle may not resolve another.

**Solution**: Repeat the resolution process for remaining conflicts. The system shows the count of remaining conflicts after each resolution.

---

### Problem: "Failed to resolve conflict" error

**Cause**: Network error or server issue.

**Solution**:
1. Refresh the page
2. Try again
3. Check your network connection
4. If problem persists, contact support with the error message

---

### Problem: Can't find the ASPIC tab

**Cause**: You might be in the wrong section of the interface.

**Solution**:
1. Make sure you're in a deliberation (URL should be `/deliberations/[id]`)
2. Click the **"Arguments"** tab (main navigation)
3. Click the **"ASPIC"** sub-tab (nested tabs)

---

### Problem: No conflicts shown but evaluation still fails

**Cause**: Other types of errors (not preference conflicts).

**Solution**:
1. Check the **Rationality Checklist** in the ASPIC Theory Panel
2. Look for other violations (inconsistency, malformed arguments)
3. Review the ASPIC theory structure

---

### Problem: Accidentally resolved the wrong preference

**Cause**: Selected wrong strategy or wrong preference in manual mode.

**Solution**:
- **Undo API exists** (can restore resolved preferences via API)
- Currently no undo button in UI (feature request)
- **Workaround**: Re-create the preference manually

---

### Problem: Loading spinner never goes away

**Cause**: API call hanging or network timeout.

**Solution**:
1. Refresh the page
2. Check browser console for errors
3. Verify the deliberation ID is valid
4. Check network tab for failed requests

---

## Best Practices

### Before Resolving Conflicts

1. **Understand the Arguments**: Read the arguments involved in the cycle to understand their relationships.

2. **Review Justifications**: Check if preference justifications explain the reasoning behind each preference.

3. **Check Weights**: If weights are meaningful in your deliberation, trust them. If not, use date or manual selection.

4. **Consult Stakeholders**: For group deliberations, discuss conflicts with participants before resolving.

5. **Document Your Decision**: Consider noting why you chose a particular resolution strategy (in a comment or deliberation notes).

### Choosing the Right Strategy

- **High-Stakes Deliberations**: Use "Manual Selection" to maintain full control.
- **Collaborative Deliberations**: Use "Remove Minority Opinion" to preserve consensus.
- **Evidence-Based Deliberations**: Use "Remove Weakest" to respect confidence levels.
- **Evolving Deliberations**: Use "Keep Most Recent" to reflect updated information.

### After Resolving Conflicts

1. **Verify No Remaining Conflicts**: Check that the success message appears.

2. **Re-Run ASPIC+ Evaluation**: Refresh the ASPIC Theory Panel to see updated results.

3. **Review Grounded Extension**: Confirm that justified arguments are now computed correctly.

4. **Check Rationality Postulates**: Ensure no other violations remain.

---

## Technical Details

### Soft Delete Pattern

**Resolved preferences are NOT permanently deleted**. Instead:
- `conflictStatus` field set to `"resolved"`
- `conflictResolution` field stores resolution metadata:
  ```json
  {
    "resolvedAt": "2024-11-18T10:30:00Z",
    "resolvedBy": "user_123",
    "strategy": "remove_weakest",
    "conflictIndex": 0,
    "reason": "Weight 0.40 significantly lower than others"
  }
  ```
- Preferences remain in database for audit trail
- Can be restored via API if needed

### Resolution Metadata

Each resolution stores:
- **resolvedAt**: Timestamp of resolution
- **resolvedBy**: User ID who performed resolution
- **strategy**: Which strategy was used
- **conflictIndex**: Which conflict this preference was part of
- **reason**: Explanation of why this preference was removed

### API Endpoints

**Detect Conflicts**:
```http
GET /api/aspic/conflicts?deliberationId={id}
```

**Resolve Conflict**:
```http
POST /api/aspic/conflicts/resolve
{
  "deliberationId": "delib_123",
  "conflictIndex": 0,
  "strategyType": "remove_weakest",
  "manualPAIds": [] // Optional, for manual strategy
}
```

**Undo Resolution**:
```http
POST /api/aspic/conflicts/undo
{
  "paIds": ["pa_1", "pa_2"]
}
```

### Conflict Detection Algorithm

The system uses **Tarjan's Strongly Connected Components** algorithm to detect cycles in the preference graph:
1. Build directed graph: nodes = arguments, edges = preferences
2. Find strongly connected components (SCCs)
3. SCCs with size > 1 = cycles
4. Extract preference IDs involved in each cycle
5. Enrich with metadata (weights, dates, creators)

### Performance

- **Detection**: O(V + E) where V = arguments, E = preferences
- **Resolution**: O(1) database update (soft delete)
- **Re-check**: O(V + E) after each resolution

For typical deliberations (< 100 arguments, < 200 preferences):
- Detection: < 100ms
- Resolution: < 50ms
- Total workflow: < 1 second

---

## FAQ

**Q: What happens to defeated arguments after conflict resolution?**

A: After resolving conflicts, ASPIC+ re-computes the grounded extension. Defeat relations may change, and previously unresolved arguments may now be justified or defeated.

---

**Q: Can I restore a resolved preference?**

A: Yes, via API (POST /api/aspic/conflicts/undo). A UI button for undo is planned for future releases.

---

**Q: What if I have multiple separate cycles?**

A: Resolve them one at a time. The system shows the count of remaining conflicts after each resolution.

---

**Q: Can I resolve all conflicts at once?**

A: No, each conflict must be resolved individually. This ensures you understand each cycle and choose the appropriate strategy.

---

**Q: Do preferences outside cycles get affected?**

A: No, only preferences that are part of detected cycles can be resolved. Other preferences remain unchanged.

---

**Q: What if two strategies seem equally valid?**

A: Trust the "Recommended" badge if shown. Otherwise, choose based on your deliberation's context (see [Best Practices](#best-practices)).

---

**Q: Can I export conflict resolution history?**

A: Not currently in the UI. You can access resolution history via the API:
```http
GET /api/aspic/conflicts?deliberationId={id}
```
Response includes `history` field with all past resolutions.

---

## Support

If you encounter issues not covered in this guide:
- Check the **browser console** for error messages
- Review the **ASPIC Theory Panel** for other violations
- Contact support with:
  - Deliberation ID
  - Conflict details
  - Resolution strategy attempted
  - Error message (if any)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Nov 18, 2025 | Initial release |

---

**End of User Guide**
