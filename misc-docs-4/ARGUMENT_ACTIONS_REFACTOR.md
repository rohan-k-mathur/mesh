# Argument Actions Floating Sheet Refactor

## Overview

Separated argument-level actions from claim-level actions by creating a dedicated `ArgumentActionsSheet` component. This architectural change enables proper AIF diagram functionality by distinguishing between:

- **Explorer Sheet (LEFT)**: Navigation through claims and arguments
- **Actions Sheet (RIGHT)**: Purely argument-level operations (when argument selected)
- **Claim Actions (RIGHT)**: Traditional dialogue actions (when claim selected)

## Changes Made

### 1. New Component: `ArgumentActionsSheet.tsx`

**Location**: `/components/arguments/ArgumentActionsSheet.tsx`

**Features**:
- Glass-dark variant matching Terms sheet aesthetic
- 5 action panels: Overview, Attack, Defend, CQs, Diagram
- Empty state when no argument selected
- Action selector tabs for easy navigation

**Action Panels**:

1. **Overview Panel**
   - Quick action cards for common tasks
   - Visual icons and descriptions
   - Links to other panels

2. **Attack Panel**
   - Displays three attack types: Rebut, Undercut, Undermine
   - Guidance text directing users to argument card Attack Menu
   - Visual differentiation with color-coded badges

3. **Defend Panel**
   - Displays community defense information
   - Guidance text for using Community Defense Menu
   - Shows argument ID for reference

4. **CQs Panel**
   - Shows scheme-specific critical questions
   - Displays current scheme if assigned
   - Guidance for answering CQs via argument card button

5. **Diagram Panel** *(placeholder)*
   - Reserved for future AIF diagram visualization
   - Currently shows placeholder text

**Props**:
```typescript
{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliberationId: string;
  selectedArgument: {
    id: string;
    conclusionText?: string;
    schemeKey?: string;
  } | null;
}
```

### 2. Modified: `DeepDivePanelV2.tsx`

**Added State**:
```typescript
const [selectedArgumentForActions, setSelectedArgumentForActions] = useState<{
  id: string;
  conclusionText?: string;
  schemeKey?: string;
} | null>(null);
```

**Added Import**:
```typescript
import { ArgumentActionsSheet } from "../arguments/ArgumentActionsSheet";
```

**Conditional Right Sheet** (lines ~1188-1378):
```tsx
{selectedArgumentForActions ? (
  <ArgumentActionsSheet
    open={rightSheetOpen}
    onOpenChange={setRightSheetOpen}
    deliberationId={deliberationId}
    selectedArgument={selectedArgumentForActions}
  />
) : (
  <FloatingSheet /* ... existing claim actions ... */ >
)}
```

**Result**: Right floating sheet now shows:
- **ArgumentActionsSheet** when an argument is clicked
- **Original claim actions** when a claim is selected via hudTarget

### 3. Modified: `AIFArgumentsListPro.tsx`

**Added Prop**:
```typescript
onArgumentClick?: (argument: {
  id: string;
  conclusionText?: string;
  schemeKey?: string;
}) => void;
```

**Added Click Handler** to `ArgumentCardV2` (line ~578):
```tsx
onClick={() => {
  if (onArgumentClick) {
    onArgumentClick({
      id: a.id,
      conclusionText: conclusionText,
      schemeKey: meta?.scheme?.key,
    });
  }
}}
```

**Wired Up in DeepDivePanelV2**:
```tsx
<AIFArgumentsListPro
  deliberationId={deliberationId}
  dsMode={dsMode}
  onArgumentClick={(argument) => {
    setSelectedArgumentForActions(argument);
    setRightSheetOpen(true);
  }}
/>
```

## User Flow

1. **User clicks an argument card** in AIFArgumentsListPro (Models tab)
2. **ArgumentCardV2** fires onClick event with argument details
3. **AIFArgumentsListPro** propagates via `onArgumentClick` prop
4. **DeepDivePanelV2** updates `selectedArgumentForActions` state
5. **Right floating sheet** switches to ArgumentActionsSheet
6. **User sees 5 action panels** specific to that argument

## Benefits

### Clean Separation of Concerns
- **Arguments**: Structured reasoning with schemes, CQs, attacks/defenses
- **Claims**: Dialogical moves, commitments, preferences

### Enables AIF Diagram Functionality
- Dedicated space for argument-level visualizations
- No confusion between claim graph and argument structure
- Future integration point for AIF diagram viewer

### Improved User Experience
- Clear context: "I'm working with an argument" vs "I'm working with a claim"
- Organized action panels vs mixed action buttons
- Visual consistency with glass-dark theme

### Maintainability
- Single responsibility: each sheet has one clear purpose
- Easier to add argument-specific features
- No prop conflicts between claim and argument actions

## Design Decisions

### Why Guidance Text Instead of Embedded Components?

**Problem**: Child components (AttackMenuProV2, CommunityDefenseMenu, SchemeSpecificCQsModal) require complex props:
- Full argument structure (conclusion + premises)
- Pre-fetched CQs array
- Author ID from authentication

**Solution**: Simplified panels that guide users to existing UI:
- Users already know how to use Attack Menu on argument cards
- No need to duplicate complex data fetching logic
- Consistent interaction patterns across the app

**Future Enhancement**: If ArgumentActionsSheet needs full interactivity, add:
```typescript
// Fetch argument details
const { data: argument } = useSWR(`/api/arguments/${selectedArgument.id}`);

// Extract target structure
const target = {
  id: argument.id,
  conclusion: { id: argument.conclusionClaimId, text: argument.conclusionText },
  premises: argument.premises.map(p => ({ id: p.claimId, text: p.text }))
};

// Pass to child components
<AttackMenuProV2
  deliberationId={deliberationId}
  authorId={authorId}
  target={target}
  onDone={() => {/* refresh */}}
/>
```

### Why Glass-Dark Variant?

Matches the aesthetic of Terms (Deliberation Dictionary) sheet:
- Visual consistency across "advanced" floating sheets
- Distinguishes from main content area (light theme)
- Creates hierarchy: Main content → Light sheets → Glass-dark "power user" sheets

## Testing Checklist

- [ ] Click argument card in Models tab
- [ ] Verify right sheet opens with ArgumentActionsSheet
- [ ] Verify 5 action panels are accessible via tabs
- [ ] Click claim in graph (via hudTarget)
- [ ] Verify right sheet shows original claim actions
- [ ] Switch between argument and claim selections
- [ ] Verify sheet content updates correctly
- [ ] Test with no argument selected (empty state)
- [ ] Verify CQs panel shows scheme key if available
- [ ] Verify CQs panel shows "no scheme" message otherwise

## Future Enhancements

### Diagram Panel Integration
```tsx
<DiagramPanel>
  <AIFDiagramViewer
    argumentId={argument.id}
    deliberationId={deliberationId}
    interactive={true}
    onNodeClick={(nodeId) => {/* handle click */}}
  />
</DiagramPanel>
```

### Full Interactivity
- Add data fetching hooks for argument details
- Embed AttackMenuProV2/CommunityDefenseMenu directly
- Add SchemeSpecificCQsModal trigger button
- Real-time updates via SWR mutations

### Analytics Integration
```typescript
onClick={(action) => {
  trackEvent('argument_action', {
    argumentId: argument.id,
    action: action.type, // 'attack' | 'defend' | 'cq'
    deliberationId
  });
}}
```

## Related Files

- `/components/arguments/ArgumentActionsSheet.tsx` (NEW)
- `/components/deepdive/DeepDivePanelV2.tsx` (MODIFIED)
- `/components/arguments/AIFArgumentsListPro.tsx` (MODIFIED)
- `/components/ui/FloatingSheet.tsx` (UNCHANGED - base component)

## Architecture Diagram

```
DeepDivePanelV2
├── LEFT Sheet (Explorer)
│   ├── Arguments Tab → AFMinimap
│   └── Claims Tab → ClaimMiniMap
│
├── RIGHT Sheet (Conditional)
│   ├── selectedArgumentForActions ? 
│   │   └── ArgumentActionsSheet
│   │       ├── Overview Panel
│   │       ├── Attack Panel
│   │       ├── Defend Panel
│   │       ├── CQs Panel
│   │       └── Diagram Panel
│   │
│   └── hudTarget (claim) ?
│       └── FloatingSheet (original)
│           ├── DialogueActionsButton
│           ├── CommandCard
│           └── DiagramViewer
│
└── TERMS Sheet (Dictionary)
    └── DefinitionSheet (glass-dark)
```

## Notes

- ArgumentActionsSheet uses `onClick` propagation from ArgumentCardV2
- Original claim actions remain unchanged (backward compatible)
- No breaking changes to existing dialogue system
- Future-proof for AIF diagram integration
