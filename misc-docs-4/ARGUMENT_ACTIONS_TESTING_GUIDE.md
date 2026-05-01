# Testing Guide: Argument Actions Floating Sheet

## Quick Start

The ArgumentActionsSheet is now fully integrated with DeepDivePanelV2 and ready to test!

## How to Test

### 1. Navigate to a Deliberation
- Go to any deliberation in your app
- Make sure it has some arguments in the Models tab

### 2. Click an Argument Card
**Location**: Models tab → AIFArgumentsListPro section

**What to look for**:
- Each argument card now has a subtle hover effect (light gray background)
- Cursor changes to pointer on hover
- Click anywhere on the ArgumentCardV2 component

### 3. Verify Right Sheet Opens
**Expected behavior**:
- Right floating sheet automatically opens
- Title shows "Argument Actions"
- Glass-dark theme (frosted glass with gradient)
- Action selector shows 5 tabs: Overview, Attack, Defend, CQs, Diagram

### 4. Test Each Action Panel

#### **Overview Panel** (default)
- Shows 5 quick action cards
- Each card has an icon and description
- Cards: Attack, Defend, Answer CQs, View Diagram, View Structure

#### **Attack Panel**
- Shows 3 attack types with color-coded badges:
  - Rebut (rose/red)
  - Undercut (amber/orange)
  - Undermine (indigo/purple)
- Guidance text directs to Attack Menu on argument card

#### **Defend Panel**
- Shows Community Defense info
- Displays argument ID (truncated)
- Guidance text for using Community Defense Menu

#### **CQs Panel**
Two states:
- **With Scheme**: Shows scheme key + guidance for answering CQs
- **No Scheme**: Shows "No scheme assigned" empty state

#### **Diagram Panel** (placeholder)
- Shows coming soon message
- Reserved for future AIF diagram viewer

### 5. Test Switching Arguments
- Click different argument cards
- Verify sheet content updates
- Check that scheme key changes in CQs panel

### 6. Test Claim Selection (Backward Compatibility)
- Click a claim in the graph (not an argument)
- Verify right sheet shows **original claim actions**:
  - DialogueActionsButton
  - CommandCard (legacy grid)
  - AIF Structure Diagram viewer
- This proves argument/claim separation works

## Integration Points

### Files Modified
1. **ArgumentActionsSheet.tsx** (NEW)
   - `/components/arguments/ArgumentActionsSheet.tsx`
   
2. **DeepDivePanelV2.tsx**
   - Added: `selectedArgumentForActions` state
   - Added: Conditional rendering for right sheet
   - Import: ArgumentActionsSheet component

3. **AIFArgumentsListPro.tsx**
   - Added: `onArgumentClick` prop to component
   - Added: `onArgumentClick` prop to RowImpl
   - Added: Clickable wrapper div around ArgumentCardV2
   - Added: Hover styling on argument cards

### Data Flow
```
User clicks ArgumentCardV2
    ↓
Wrapper div onClick fires
    ↓
RowImpl calls onArgumentClick({ id, conclusionText, schemeKey })
    ↓
AIFArgumentsListPro propagates to parent
    ↓
DeepDivePanelV2 updates selectedArgumentForActions state
    ↓
Right sheet switches to ArgumentActionsSheet
    ↓
ArgumentActionsSheet renders with selected argument data
```

## Visual Verification

### Glass-Dark Theme
- Background: Frosted glass effect with blur
- Border: Cyan/blue gradient on edge
- Text: White with varying opacity
- Icons: Cyan accents
- Matches Terms (Deliberation Dictionary) sheet aesthetic

### Action Selector Tabs
- 5 tabs with icons
- Active tab: Cyan underline + white text
- Inactive tabs: White/60 opacity
- Smooth transitions

### Empty State
- Shows when no argument selected
- Icon + "No argument selected" message
- Guidance text to click an argument card

## Known Limitations

### Current Design: Guidance-Based
The action panels show **guidance text** rather than embedding full interactive components. This is because child components require complex data:
- AttackMenuProV2/CommunityDefenseMenu need full argument structure (conclusion + premises)
- SchemeSpecificCQsModal needs pre-fetched CQs array
- All need author ID from authentication

### Why This Approach?
1. **Consistency**: Users already know how to use Attack Menu, Defense Menu on argument cards
2. **No Duplication**: Avoids replicating complex data fetching logic
3. **Maintainability**: Single source of truth for each action type
4. **Iterative**: Can enhance later with full interactivity if needed

## Future Enhancements

### Phase 2: Full Interactivity
If users want embedded actions instead of guidance:

```tsx
// Add data fetching in ArgumentActionsSheet
const { data: argument } = useSWR(
  selectedArgument ? `/api/arguments/${selectedArgument.id}` : null
);

// Construct target structure
const target = {
  id: argument.id,
  conclusion: { id: argument.conclusionClaimId, text: argument.conclusionText },
  premises: argument.premises.map(p => ({ id: p.claimId, text: p.text }))
};

// Embed components directly
<AttackMenuProV2
  deliberationId={deliberationId}
  authorId={authorId}
  target={target}
  onDone={() => {/* refresh */}}
/>
```

### Phase 3: Diagram Integration
```tsx
<DiagramPanel>
  <AIFDiagramViewer
    argumentId={argument.id}
    deliberationId={deliberationId}
    interactive={true}
  />
</DiagramPanel>
```

## Troubleshooting

### Right Sheet Doesn't Open
- Check console for errors
- Verify argument has `id` in data
- Check that `onArgumentClick` is passed to AIFArgumentsListPro

### Sheet Shows Claim Actions Instead
- This is correct if you clicked a claim (not an argument)
- Verify you're clicking in the Models tab, not the Debate tab
- Check `selectedArgumentForActions` state in React DevTools

### CQs Panel Always Shows "No Scheme"
- Verify argument has `schemeKey` in metadata
- Check AIF data fetch in AIFArgumentsListPro
- Schemes may not be assigned yet (expected in some cases)

### Styling Issues
- Verify FloatingSheet variant is "glass-dark"
- Check Tailwind classes compile correctly
- May need to clear Next.js cache: `rm -rf .next`

## Success Criteria

✅ Click argument card → right sheet opens
✅ Sheet shows ArgumentActionsSheet component
✅ All 5 action panels accessible via tabs
✅ Click claim → sheet shows original claim actions
✅ Switch between arguments → sheet updates
✅ Glass-dark theme matches Terms sheet
✅ No console errors
✅ Smooth transitions and interactions

## Questions?

If you encounter issues:
1. Check browser console for errors
2. Verify all 3 files compile without TypeScript errors
3. Check React DevTools for state updates
4. Review `ARGUMENT_ACTIONS_REFACTOR.md` for architecture details
