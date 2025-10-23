# Critical Questions Component Upgrade Summary

## Overview
Successfully upgraded the `CriticalQuestions` component to integrate with all current Mesh systems including AIF (Argument Interchange Format), dialogical moves, Prisma models, and event-driven architecture.

## New File Created
- **`components/claims/CriticalQuestionsV2.tsx`** - Fully upgraded component with modern integrations

## Key Upgrades & Integrations

### 1. **Prisma Model Integration** ✅
The component now properly integrates with the latest Prisma schema models:
- `CQStatus` - Tracks critical question satisfaction status per scheme/target
- `DialogicalMove` - Full integration with WHY/GROUNDS/CONCEDE/RETRACT moves
- `ArgumentScheme` - Scheme-based CQ generation and validation
- `ClaimEdge` - Tracks claim relationships (supports, rebuts, undercuts)
- `ArgumentEdge` - Argument attack relationships
- `ConflictApplication` - Conflict tracking with metadata

### 2. **AIF (Argument Interchange Format) Support** ✅
- Fetches and displays argument metadata (schemes, attacks, edges)
- Shows incoming/outgoing edges for claims
- Attack type badges (REBUTS, UNDERCUTS, UNDERMINES)
- Argument count display
- Scheme badge integration

### 3. **Dialogical Moves System** ✅
**Proper `cqId` Integration:**
- WHY moves now include `cqId` in payload (required by legal-moves API)
- GROUNDS moves properly paired with WHY via `cqId` 
- Locus path tracking (`locusPath`) for dialogue tree navigation
- Expression/brief/original text properly structured

**Legal Moves Integration:**
- Integrated `LegalMoveChips` component for each CQ
- Shows contextual legal moves (WHY, GROUNDS, CLOSE, CONCEDE, RETRACT)
- Proper payload construction with `cqId`, `schemeKey`, `locusPath`
- Move validation and disabled states based on dialogue rules

### 4. **Event-Driven Architecture** ✅
**Bus System Integration:**
- Uses `useBusEffect` for reactive updates
- Listens to: `cqs:changed`, `dialogue:moves:refresh`, `arguments:changed`, `claims:changed`, `claims:edges:changed`
- Automatic cache invalidation on relevant events
- Backwards compatible with legacy `window.addEventListener` events

**SWR Cache Management:**
- Multiple data endpoints with proper revalidation
- Optimistic updates for CQ toggling
- Coordinated cache invalidation across related data
- Deduplication interval to prevent excessive requests

### 5. **Enhanced Data Fetching** ✅
New endpoints integrated:
- `/api/cqs` - Core CQ data with schemes
- `/api/cqs/attachments` - Attachment status tracking
- `/api/cqs/toggle` - CQ satisfaction toggle with guards
- `/api/deliberations/[id]/moves` - Dialogical moves history
- `/api/claims/edges` - Claim graph connectivity
- `/api/claims/toulmin` - Toulmin argument structure
- `/api/dialogue/legal-moves` - Legal move computation
- `/api/dialogue/move` - Move posting
- `/api/dialogue/panel/confirm` - Confirmation receipts

### 6. **UI/UX Enhancements** ✅
- **Legal Moves Panel**: Expandable per-CQ interface showing all legal dialogical moves
- **Inline Grounds Input**: Quick reply interface with Enter-to-submit
- **Locus Control**: Explicit locus path input for dialogue navigation
- **Status Indicators**: Visual feedback (✓) for successful operations
- **Blocked Messages**: Clear error messaging when CQ guards fail (e.g., "Needs a rebut attached")
- **Attachment Helpers**: 
  - Quick-create new counter-claims
  - Search and attach existing claims
  - Suggestion-based attack templates
- **Panel Confirmation**: One-click confirmation of CQ/AF state for epistemic receipts

### 7. **Guard System Integration** ✅
The component properly handles the `/api/cqs/toggle` guard system:
- **409 Conflict** responses when proof obligations aren't met
- Parses `guard.requiredAttack` (rebut/undercut)
- Shows contextual error messages
- NLI (Natural Language Inference) threshold checks for rebut validation
- Edge existence verification before allowing satisfaction toggle

### 8. **Scheme-Based CQ Generation** ✅
- Fetches CQs from `ArgumentScheme.cq` JSON field
- Validates with `ArgCQArraySchema` (Zod)
- Merges with `CQStatus` for satisfaction tracking
- Supports scheme filtering via `prefilterKeys` prop
- Template suggestions from `suggestionForCQ` utility

## API Compatibility

### Endpoints Used
```typescript
// Core CQ data
GET /api/cqs?targetType=claim&targetId={id}&scheme={key}

// Attachment tracking
GET /api/cqs/attachments?targetType=claim&targetId={id}

// Toggle CQ status with guards
POST /api/cqs/toggle
{
  targetType, targetId, schemeKey, cqKey, satisfied,
  deliberationId, attackerClaimId?, attachSuggestion?
}

// Dialogical moves
GET /api/deliberations/{id}/moves?limit=500
POST /api/dialogue/move
{
  deliberationId, targetType, targetId, kind,
  payload: { cqId, schemeKey, locusPath, expression },
  autoCompile, autoStep
}

// Legal moves computation
GET /api/dialogue/legal-moves?deliberationId={id}&targetType={type}&targetId={id}&locusPath={path}

// Graph edges
GET /api/claims/edges?deliberationId={id}

// Toulmin structure
GET /api/claims/{id}/toulmin

// Panel confirmation
POST /api/dialogue/panel/confirm
```

## Breaking Changes & Migration

### From Old Component
The original `CriticalQuestions.tsx` had some issues:
1. **Missing `cqId` in WHY moves** - Now properly included
2. **No legal moves integration** - Now fully integrated with `LegalMoveChips`
3. **Limited event handling** - Now uses bus system + legacy events
4. **No edges data** - Now fetches and displays graph connectivity
5. **Basic grounds handling** - Now properly structured with `expression`, `locusPath`, `cqId`

### Migration Path
The new component (`CriticalQuestionsV2.tsx`) is a drop-in replacement:
```tsx
// Old import
import CriticalQuestions from "@/components/claims/CriticalQuestions";

// New import (after testing)
import CriticalQuestions from "@/components/claims/CriticalQuestionsV2";
```

All props remain the same, so no callsite changes needed.

## Testing Checklist

### Core Functionality
- [ ] CQs display correctly from schemes
- [ ] Checkbox toggling works (satisfied/unsatisfied)
- [ ] Guard system blocks toggling without proper attachments
- [ ] Error messages display for 409 conflicts

### Dialogical Moves
- [ ] WHY move includes `cqId` in payload
- [ ] GROUNDS move pairs correctly with WHY
- [ ] Legal moves panel shows contextual moves
- [ ] Locus path properly tracked
- [ ] Move posting triggers cache revalidation

### Attachments
- [ ] Quick-create counter-claim works
- [ ] Search existing claims works
- [ ] Attachment links to CQ via metadata
- [ ] Attachment status updates in real-time

### Events & Caching
- [ ] Bus events trigger cache updates
- [ ] Legacy events still work
- [ ] Optimistic updates appear immediately
- [ ] Server validation corrects optimistic state on error

### UI/UX
- [ ] Legal moves panel expands/collapses
- [ ] Inline grounds input submits on Enter
- [ ] Locus control updates dialogue context
- [ ] Status indicators (✓) appear on success
- [ ] Blocked messages show clear guidance

## Architecture Decisions

### Why SWR for Data Fetching?
- Already used in ClaimMiniMap and other components
- Built-in deduplication and caching
- Easy optimistic updates
- Works well with event-driven invalidation

### Why `useBusEffect` + Legacy Events?
- Gradual migration strategy
- Bus system is newer, more maintainable
- Legacy events ensure backwards compatibility
- Both systems revalidate same caches

### Why Separate `LegalMoveChips`?
- Reusable across components (claims, arguments, cards)
- Encapsulates legal move computation logic
- Proper separation of concerns
- Easier to test and maintain

### Why `cqId` Instead of `cqKey`?
- Aligns with `/api/dialogue/legal-moves` expectations
- Server pairs WHY/GROUNDS by `cqId`
- More specific than `cqKey` (scheme-scoped)
- See `lib/dialogue/signature.ts` for signature computation

## Related Documentation
- `AIF_DIALOGICAL_ACTIONS_FIX_SPEC.md` - Dialogical actions spec
- `MeshAgoraPlanning.txt` - Dialogue protocol rules (R1-R7)
- `AGENTS.md` - Development guidelines
- `.github/copilot-instructions.md` - AI coding guidelines

## Next Steps
1. **Test in development** - Use PHASE_3_TEST_GUIDE.md
2. **Replace old component** - Rename CriticalQuestionsV2.tsx → CriticalQuestions.tsx
3. **Update imports** - Verify all callsites still work
4. **Monitor events** - Check bus events fire correctly
5. **Performance** - Profile SWR deduplication behavior
6. **Error handling** - Add Sentry/logging for 409 conflicts

## Files Modified
- ✅ `components/claims/CriticalQuestionsV2.tsx` - New upgraded component
- 📝 `components/claims/CriticalQuestions.tsx` - Original (still intact)

## Questions/Issues
If you encounter issues:
1. Check browser console for event firing
2. Verify `/api/cqs` returns proper schema
3. Confirm `ArgumentScheme.cq` JSON is valid
4. Check `CQStatus` table has correct unique constraint
5. Ensure `DialogicalMove.payload.cqId` is populated

## Performance Considerations
- **Deduplication interval**: 2000ms to prevent request spam
- **Optimistic updates**: Immediate UI feedback before server confirmation
- **Event throttling**: Consider debouncing bus events if too frequent
- **Cache keys**: Stable keys prevent unnecessary refetches

---

**Status**: ✅ Complete  
**Author**: GitHub Copilot  
**Date**: October 21, 2025  
**Version**: 2.0 (AIF + Dialogical Moves Integration)
