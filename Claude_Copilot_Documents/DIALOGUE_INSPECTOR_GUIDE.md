# Dialogue Inspector Component

## Overview

The **DialogueInspector** is a unified debug component that provides a comprehensive view of the entire dialogue system state. It consolidates information about claims, arguments, dialogue moves, critical questions, and legal actions into a single, easy-to-use interface.

## Purpose

This component solves the problem of fragmented information across DeepDivePanelV2 and other dialogue components. Instead of piecing together state from multiple places, you can see everything in one place.

## Location

- **Component**: `components/dialogue/DialogueInspector.tsx`
- **Test Page**: `app/(app)/test/dialogue-inspector/page.tsx`

## Usage

### Accessing the Test Page

Navigate to: **`/test/dialogue-inspector`**

### Programmatic Usage

```tsx
import { DialogueInspector } from "@/components/dialogue/DialogueInspector";

<DialogueInspector
  deliberationId="cmgy6c8vz0000c04w4l9khiux"
  targetType="claim"
  targetId="cmgzyuusc000ec0leqk4cf26g"
  locusPath="0"
/>
```

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `deliberationId` | `string` | Yes | - | The deliberation ID |
| `targetType` | `"claim" \| "argument" \| "card"` | Yes | - | Type of target to inspect |
| `targetId` | `string` | Yes | - | ID of the target (claim/argument/card) |
| `locusPath` | `string` | No | `"0"` | Locus path for legal moves |

## Features

### 📊 Overview Tab

Shows a high-level summary:
- **Target Info**: Type, ID, text content, metadata
- **Quick Stats**: Dialogue moves count, legal actions count, open/total CQs
- **Latest Activity**: Recent 5 dialogue moves with timestamps

### 💬 Moves Tab

Displays all dialogue moves related to the target:
- Move kind (WHY, GROUNDS, CLOSE, etc.)
- Force indicator (⚔️ ATTACK, 🏳️ SURRENDER, ● NEUTRAL)
- Expression/content
- Locus path
- Actor ID
- Signature
- Full payload with dialogue acts (expandable)

### ⚖️ Legal Actions Tab

Shows computed legal moves:
- Available actions (enabled/disabled)
- Force classification
- Relevance indicators (● likely, ○ unlikely)
- Disabled reasons
- Payload preview

### ❓ Critical Questions Tab

Displays critical questions (for claims):
- Question key (e.g., "eo-1")
- Question text and description
- Status (✅ Answered / ⏳ Open)
- Satisfaction state
- Attachment information

### 🔧 Raw Data Tab

Shows raw JSON responses from all APIs:
- Target data
- Moves data
- Legal moves data
- CQs data
- Attachments data

## What It Shows

### Data Sources

The component fetches from these APIs:

1. **Target Data**:
   - `/api/claims/{id}` (for claims)
   - `/api/arguments/{id}` (for arguments)

2. **Dialogue Moves**:
   - `/api/deliberations/{id}/moves?limit=100`

3. **Legal Moves**:
   - `/api/dialogue/legal-moves?deliberationId=...&targetType=...&targetId=...&locusPath=...`

4. **Critical Questions**:
   - `/api/cqs?targetType=claim&targetId=...`

5. **CQ Attachments**:
   - `/api/cqs/attachments?targetType=claim&targetId=...`

### Relationships Visualized

The inspector helps you understand:

- **Which moves target this claim/argument**
- **What legal actions are currently available**
- **Which critical questions are open vs. answered**
- **How dialogue acts map to locus paths**
- **Why certain moves are disabled (with reasons)**
- **The full payload structure of each move**

## Use Cases

### 1. Debugging Legal Moves

When a user reports that an action isn't appearing:

1. Open the inspector for that claim/argument
2. Go to "Legal Actions" tab
3. Find the missing action
4. Check if it's disabled and read the `reason` field
5. Examine the payload to understand constraints

### 2. Understanding Move Flow

To trace how a dialogue progresses:

1. Open "Moves" tab
2. Expand each move to see full details
3. Check signatures to understand deduplication
4. Examine dialogue acts to see Ludics engine input
5. Verify locus paths are correct

### 3. Checking CQ Status

To verify critical questions are being tracked:

1. Open "Critical Questions" tab (claims only)
2. See which CQs are open vs. answered
3. Check attachment status
4. Verify satisfaction flags match UI

### 4. Raw Data Inspection

When you need to inspect the exact API responses:

1. Go to "Raw Data" tab
2. Expand any section
3. Copy JSON for bug reports or testing
4. Compare expected vs. actual data structures

## Integration with Existing Code

### Non-Destructive

This component:
- ✅ Does NOT modify DeepDivePanelV2 or other components
- ✅ Uses existing APIs (no new endpoints)
- ✅ Fetches data independently via SWR
- ✅ Can be removed without affecting other features

### Adding to DeepDivePanelV2

If you want to embed it in the existing panel:

```tsx
import { DialogueInspector } from "@/components/dialogue/DialogueInspector";

// Inside DeepDivePanelV2.tsx
{showDebugPanel && (
  <DialogueInspector
    deliberationId={deliberationId}
    targetType={selectedNodeType}
    targetId={selectedNodeId}
    locusPath={currentLocusPath}
  />
)}
```

### Adding a Toggle Button

```tsx
const [showInspector, setShowInspector] = useState(false);

<button
  onClick={() => setShowInspector(!showInspector)}
  className="inspector-toggle"
>
  🔍 Inspector
</button>

{showInspector && <DialogueInspector ... />}
```

## Visual Design

The inspector uses:
- **Purple accent** (#8B5CF6) for branding
- **Collapsible sections** to reduce clutter
- **Icons** for quick visual scanning
- **Color coding**:
  - 🟢 Green: Answered/available
  - 🟡 Amber: Open/pending
  - 🔴 Red: Disabled/error
  - 🔵 Blue: Neutral/info
- **Monospace font** for IDs and code
- **Cards** for each item with expand/collapse

## Tips

### Finding IDs

**In Production:**
1. Open browser DevTools → Network tab
2. Filter by "dialogue" or "claims"
3. Click on any API request
4. Copy IDs from the URL or response body

**From Console:**
```javascript
// Log selected claim ID
console.log(selectedClaimId);

// Get deliberation from URL
window.location.pathname.match(/deliberations\/([^/]+)/)[1]
```

### Quick Testing

Use the "Load Example" button on the test page to populate with real IDs from your logs.

### Performance

The inspector uses SWR for caching, so repeated views are fast. However, initial load fetches 5 APIs, so expect ~1-2 second load time.

## Roadmap

Potential future enhancements:

- [ ] Live refresh toggle (auto-refresh every N seconds)
- [ ] Export data as JSON/CSV
- [ ] Visual graph of move relationships
- [ ] Inline editing (change locus, test moves)
- [ ] Compare two targets side-by-side
- [ ] Filter moves by kind/actor/date
- [ ] Search within move content

## Troubleshooting

### "No data appearing"

Check:
1. Are the IDs correct?
2. Does the target exist in the database?
3. Check browser console for API errors
4. Verify network requests are succeeding (200 status)

### "Legal moves showing as empty"

The `/api/dialogue/legal-moves` endpoint may be slow (~3.5s). Wait for it to load, or check if the endpoint is returning an error.

### "CQs not showing"

CQs only apply to **claims**, not arguments. Make sure `targetType="claim"`.

## Related Documentation

- **CommandCard Actions**: `COMMANDCARD_ACTIONS_EXPLAINED.md`
- **Answer-and-Commit**: `ANSWER_AND_COMMIT_INTEGRATION_SUMMARY.md`
- **GROUNDS Workflow**: `GROUNDS_EXPLANATION.md`
- **Critical Questions**: `CRITICAL_QUESTIONS_UPGRADE_SUMMARY.md`

## Support

If you have issues or feature requests for the inspector, document them in the component file header or create a task in your project tracker.

---

**Last Updated**: January 2025  
**Component Version**: 1.0.0  
**Status**: ✅ Ready for use
