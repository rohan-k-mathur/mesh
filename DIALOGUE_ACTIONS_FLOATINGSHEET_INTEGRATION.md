# DialogueActionsButton Integration in FloatingSheet

**Status**: ✅ Complete  
**Date**: $(date)  
**Component**: DeepDivePanelV2.tsx  
**Location**: Right FloatingSheet "Actions & Diagram" panel

---

## Summary

Successfully integrated the new **DialogueActionsButton** component into the DeepDivePanelV2's right FloatingSheet, replacing the legacy CommandCard system. This serves as the first real-world test case for the canonical dialogue actions system.

---

## Changes Made

### 1. Import Addition (Line 22)
```typescript
import { DialogueActionsButton } from "@/components/dialogue/DialogueActionsButton";
```

### 2. State Fix (Line 368)
Uncommented the `commandActions` state that was previously disabled:
```typescript
const [commandActions, setCommandActions] = useState<CommandCardAction[]>([]);
```

### 3. DialogueInspector Prop Fix (Line 1307)
Fixed incorrect prop names to match interface:
```typescript
// Before: targetType, targetId, locusPath
// After: initialTargetType, initialTargetId, initialLocusPath
<DialogueInspector
  deliberationId="cmgy6c8vz0000c04w4l9khiux"
  initialTargetType="claim"
  initialTargetId="cmgzyuusc000ec0leqk4cf26g"
  initialLocusPath="0"
/>
```

### 4. CommandCard Replacement (Lines 1076-1145)

**Old System** (removed):
```typescript
<CommandCard
  actions={cardActions}
  onPerform={performCommand}
/>
```

**New System** (added):
```typescript
<DialogueActionsButton
  deliberationId={deliberationId}
  targetType={hudTarget.type as any}
  targetId={hudTarget.id}
  locusPath="0"
  label="Open Dialogue Actions"
  variant="default"
  className="w-full justify-center"
  onMovePerformed={() => {
    // Refresh the graph and moves
    swrMutate(`/api/dialogue/legal-moves?deliberationId=${deliberationId}&targetType=${hudTarget.type}&targetId=${hudTarget.id}&locus=0`);
    window.dispatchEvent(new CustomEvent("dialogue:moves:refresh", { detail: { deliberationId } }));
  }}
/>
```

**Legacy Comparison** (kept for testing):
```typescript
<details className="group">
  <summary className="cursor-pointer text-xs text-slate-600 hover:text-slate-900 font-medium">
    Show Legacy Grid View
  </summary>
  <div className="mt-3">
    {cardActions.length > 0 ? (
      <CommandCard actions={cardActions} onPerform={performCommand} />
    ) : (
      <div className="text-xs text-slate-500 text-center py-4">
        No actions available
      </div>
    )}
  </div>
</details>
```

---

## UI Structure

```
FloatingSheet (Right Side, 520px)
├── Title: "Actions & Diagram"
├── Dialogical Actions Section
│   ├── Selected Target Info (if hudTarget exists)
│   │   └── Shows claim/argument ID
│   ├── DialogueActionsButton (Primary UI)
│   │   └── Opens DialogueActionsModal
│   └── Legacy CommandCard (collapsible details)
│       └── For comparison during testing
└── DiagramViewer Section (below)
```

---

## Integration Pattern

### Props Mapping
| Prop | Source | Description |
|------|--------|-------------|
| `deliberationId` | Component prop | Current deliberation |
| `targetType` | `hudTarget.type` | "claim" or "argument" |
| `targetId` | `hudTarget.id` | Selected node ID from graph |
| `locusPath` | `"0"` | Root locus (hardcoded) |
| `variant` | `"default"` | Full button with label |

### State Dependencies
- **hudTarget**: Selected node from graph (set by graph interaction)
- **commandActions**: Legacy state for CommandCard (kept for backward compatibility)
- **cardActions**: Computed from legal moves (still used by legacy grid)

### Event Handling
On move performed:
1. **Mutate SWR cache** for legal moves endpoint
2. **Dispatch global event** `dialogue:moves:refresh` for app-wide updates
3. Modal auto-closes and graph refreshes

---

## Testing Checklist

### Pre-flight
- [x] TypeScript compiles without errors
- [x] ESLint passes (only pre-existing hook warnings)
- [x] Import path correct
- [x] Props interface matches

### Browser Testing
- [ ] Button appears when claim is selected
- [ ] Empty state shows when no claim selected
- [ ] Button opens DialogueActionsModal
- [ ] Modal loads legal moves correctly
- [ ] Protocol moves executable
- [ ] Structural moves open modal correctly
- [ ] Critical questions display
- [ ] NLCommitPopover works for GROUNDS
- [ ] Event system refreshes data
- [ ] Graph updates after move
- [ ] Legacy grid still works (details element)

### Edge Cases
- [ ] First load (no hudTarget)
- [ ] Switch between claims
- [ ] Perform move and verify refresh
- [ ] Multiple moves in sequence
- [ ] Error handling (network failure)
- [ ] Modal close/reopen behavior

---

## Comparison: Old vs New

| Feature | CommandCard (Old) | DialogueActionsButton (New) |
|---------|-------------------|----------------------------|
| **UI Pattern** | Grid of action cards | Single button → modal |
| **Move Organization** | Flat grid | Tabbed (Protocol/Structural/CQs) |
| **Legal Moves** | Pre-fetched via API | SWR with cache |
| **CQs** | Separate CQContextPanel | Integrated tab |
| **Structural Moves** | Direct execution | StructuralMoveModal |
| **GROUNDS** | Generic | NLCommitPopover |
| **Grouping** | None | By category |
| **Move Details** | Icon + label | Icon + label + description + tone |
| **State Mgmt** | useState | SWR + mutations |
| **Reusability** | DeepDive-specific | Universal component |
| **Event System** | Manual refresh | Global event dispatch |

---

## Benefits

### For Users
1. **Unified interface** for all dialogue actions
2. **Better organization** with tabs
3. **Richer context** with descriptions and tones
4. **Specialized UI** for different move types (GROUNDS, structural)
5. **Consistent experience** across all app sections

### For Developers
1. **Single source of truth** for dialogue actions
2. **Easy integration** (1 component vs building grid logic)
3. **Automatic updates** via event system
4. **Type safety** with full Prisma types
5. **SWR caching** for performance
6. **Extensible** - add to any component with a button

---

## Migration Path

### Phase 1: Parallel (Current)
- Both systems active
- Legacy in collapsible details
- User can compare side-by-side
- Collect feedback

### Phase 2: Feature Parity
- Ensure all CommandCard features work in modal
- Test edge cases
- Performance validation
- User acceptance

### Phase 3: Deprecation
- Remove legacy CommandCard from UI
- Keep state/logic for backward compat
- Update documentation
- Monitor for issues

### Phase 4: Cleanup
- Remove CommandCard completely
- Remove `cardActions` state
- Remove `performCommand` function
- Update all references

---

## Next Integration Targets

Based on DIALOGUE_ACTIONS_MODAL_GUIDE.md, integrate into:

1. **ClaimMiniMap** (high priority)
   - Location: Debate tab in DeepDivePanelV2
   - Replace: Inline action buttons
   - Props: Use selected claim from minimap

2. **AIFArgumentsList** (high priority)
   - Location: Left FloatingSheet
   - Add: Action button per argument
   - Props: Use argument ID from list item

3. **ArgumentCardV2** (medium priority)
   - Location: Various locations
   - Add: Footer action button
   - Props: Use claim/argument from card

4. **GraphExplorer Node Context** (medium priority)
   - Location: Right-click menu or node selection
   - Add: "Actions" menu item
   - Props: Use clicked node data

---

## Files Modified

- `components/deepdive/DeepDivePanelV2.tsx`
  - Lines 22: Import added
  - Lines 368: State uncommented
  - Lines 553: Uses setCommandActions (now defined)
  - Lines 1076-1145: CommandCard replaced with DialogueActionsButton
  - Lines 1307: DialogueInspector props fixed

---

## Related Documentation

- **DIALOGUE_ACTIONS_MODAL_GUIDE.md** - Complete developer guide with API reference
- **DIALOGUE_ACTIONS_MODAL_SUMMARY.md** - Implementation summary and architecture
- **DIALOGUE_ACTIONS_QUICK_REF.md** - Quick reference for common patterns
- **COMMANDCARD_ACTIONS_EXPLAINED.md** - Legacy system documentation

---

## Notes

### Why Keep Legacy System?
1. **Safety**: Gradual migration reduces risk
2. **Comparison**: Users can test both systems
3. **Fallback**: If issues found with new system
4. **Validation**: Ensures feature parity

### Why Details Element?
- Non-intrusive (collapsed by default)
- Easy to expand for comparison
- Shows both systems work with same data
- Can be removed in Phase 3

### Event System Design
The `onMovePerformed` callback:
1. **Mutates SWR cache** - Instant UI update for modal
2. **Dispatches event** - Updates other components (graph, lists)
3. **Decoupled** - Components listen independently

---

## Performance Considerations

### SWR Benefits
- **Caching**: Legal moves cached, reduce API calls
- **Deduplication**: Multiple components share cache
- **Revalidation**: Auto-refresh on focus/reconnect
- **Optimistic UI**: Mutations update immediately

### Modal vs Grid
- **Lazy loading**: Modal loads moves only when opened
- **Code splitting**: Modal can be split into separate chunk
- **Memory**: Grid keeps all moves in memory, modal loads on-demand

---

## Accessibility

### Keyboard Navigation
- Button: Tab to focus, Enter/Space to activate
- Modal: Esc to close, Tab to navigate tabs
- Moves: Arrow keys within tabs (inherited from Radix)

### Screen Readers
- Button: Labeled "Open Dialogue Actions"
- Modal: Aria-labeled tabs
- Moves: Icon + text for all buttons

### Focus Management
- Modal traps focus when open
- Returns focus to trigger button on close
- Tab order follows visual hierarchy

---

## Security

### Input Validation
- All props validated by TypeScript
- API endpoints validate permissions
- SWR fetcher handles errors gracefully

### XSS Prevention
- No dangerouslySetInnerHTML used
- All text escaped by React
- Icons from trusted library (Lucide)

---

## Known Issues

None currently. Monitor for:
- Modal positioning edge cases
- SWR cache invalidation timing
- Event listener memory leaks
- Legacy grid data mismatch

---

## Success Metrics

Track after deployment:
1. **Adoption rate**: % of users using new button vs legacy grid
2. **Error rate**: Failed move attempts
3. **Performance**: Modal open time, API response time
4. **Engagement**: Moves per session increase?
5. **Feedback**: User reports and feature requests

---

## Developer Experience

### Adding to New Component
```typescript
import { DialogueActionsButton } from "@/components/dialogue/DialogueActionsButton";

// In your render:
<DialogueActionsButton
  deliberationId={deliberationId}
  targetType="claim"
  targetId={claimId}
  locusPath="0"
/>
```

### Listening for Updates
```typescript
useEffect(() => {
  const handleRefresh = (e: CustomEvent) => {
    if (e.detail.deliberationId === deliberationId) {
      // Refresh your data
      mutate();
    }
  };
  window.addEventListener("dialogue:moves:refresh", handleRefresh);
  return () => window.removeEventListener("dialogue:moves:refresh", handleRefresh);
}, [deliberationId]);
```

---

## Conclusion

✅ Integration complete and ready for browser testing. The DialogueActionsButton successfully replaces CommandCard in the FloatingSheet, providing a cleaner, more powerful interface for dialogical actions. Legacy system kept for comparison during validation phase.

Next steps:
1. Test in browser with actual deliberation data
2. Validate all move types work correctly
3. Collect user feedback
4. Plan next integration point (ClaimMiniMap or AIFArgumentsList)
