# Debate Sheet Integration Roadmap

**Status**: 💡 Idea / Planning  
**Priority**: MEDIUM  
**Target**: DeepDivePanelV2 DebateTab Enhancement  
**Created**: November 20, 2025

---

## 🎯 Vision

Make debate sheets universally accessible by integrating `DebateSheetReader` directly into every deliberation's interface, rather than keeping it tucked away in the Agora page.

---

## 📍 Current State

### Where DebateSheetReader Lives Today
- **Location**: `components/agora/DebateSheetReader.tsx`
- **Access**: Only through Agora page (`/agora` or similar)
- **Usage**: Synthetic sheet IDs (`delib:{deliberationId}`) or curated sheet IDs
- **Features**:
  - Argument network visualization (card-based grid)
  - Confidence mode switcher (min, product, DS)
  - Support bars and acceptance labels
  - Filter controls (scheme, open CQs, attacked nodes)
  - Metadata badges (scheme, CQ status, attacks, preferences)
  - Modal integrations (ArgumentActionsSheet, MiniNeighborhoodPreview)
  - Import controls (materialized, virtual, all)

### Issues with Current Placement
- ❌ Hidden from main deliberation workflow
- ❌ Requires knowledge of Agora page to access
- ❌ Duplicate visualization logic (similar to ArgumentsTab but separate)
- ❌ Not integrated with other deliberation views

---

## 🎨 Proposed Design

### Integration Point: DebateTab

Add **DebateSheetReader** as a new subtab within `DebateTab` (which already uses nested tabs).

```
DebateTab (DeepDivePanelV2)
├─ Propositions (current subtab)
├─ Claims (current subtab with ClaimMiniMap, DialogueInspector)
└─ Sheet View ⭐ NEW
   └─ DebateSheetReader component
```

### UI Hierarchy

```
DeepDivePanelV2
└─ Main Tabs
   ├─ Debate ⭐
   │  └─ Nested Tabs (NestedTabs component)
   │     ├─ Thread View (NEW - ThreadedDiscussionTab)
   │     ├─ Propositions
   │     ├─ Claims
   │     └─ Sheet View (NEW - DebateSheetReader)
   ├─ Arguments
   ├─ Ludics
   ├─ Admin
   └─ ...
```

---

## 🔧 Implementation Strategy

### Phase 1: Basic Integration (2-3 hours) ✅ COMPLETE

**Goal**: Get DebateSheetReader rendering inside DebateTab

**Status**: ✅ Completed November 20, 2025

#### Task 1.1: Update DebateTab Component ✅
**File**: `components/deepdive/v3/tabs/DebateTab.tsx`

**Changes made**:
1. ✅ Imported DebateSheetReader and Network icon
2. ✅ Added "Sheet View" subtab as third tab in NestedTabs
3. ✅ Configured synthetic sheet ID: `delib:${deliberationId}`
4. ✅ Zero TypeScript errors

#### Task 1.2: Update Props Interface ✅
DebateTabProps already has all needed data:
- ✅ `deliberationId: string` - Used for synthetic sheet ID
- ✅ `currentUserId: string` - Available for DebateSheetReader

#### Task 1.3: Test Integration ⏳ NEXT
- [ ] Verify DebateSheetReader renders correctly in DebateTab
- [ ] Test synthetic sheet ID generation (`delib:{deliberationId}`)
- [ ] Ensure modals (ArgumentActionsSheet, preview) work within tab context
- [ ] Check responsive behavior

**Testing Instructions**:
1. Navigate to any deliberation in DeepDivePanelV2
2. Click on "Debate" main tab
3. Should see three subtabs: "Propositions", "Claims", "Sheet View"
4. Click "Sheet View" subtab
5. DebateSheetReader should render with argument network grid
6. Test filter controls, confidence mode switcher
7. Click node → ArgumentActionsSheet should open
8. Click preview button → MiniNeighborhoodPreview should open

---

### Phase 2: Enhanced Integration (1-2 days)

**Goal**: Deep integration with deliberation context

#### Task 2.1: Share Confidence Mode State
Currently, DebateSheetReader has its own confidence mode state. Integrate with global confidence context:

```tsx
// DebateSheetReader already uses useConfidence hook
import { useConfidence } from "@/components/agora/useConfidence";

// This should automatically sync with room-level confidence settings
const { mode, setMode } = useConfidence();
```

**Consider**: Should confidence mode be deliberation-scoped or user-preference scoped?

#### Task 2.2: Link to ArgumentActionsSheet
DebateSheetReader already opens `ArgumentActionsSheet`. Ensure:
- Sheet opens in context of parent panel (not separate modal stack)
- Refresh triggers update both sheet view and other tabs
- State coordination with ArgumentsTab (if viewing same argument)

#### Task 2.3: Add Cross-Tab Navigation
Enable "View in Sheet" links from other tabs:
- ArgumentsTab → Sheet View (highlight specific argument)
- Claims subtab → Sheet View (highlight specific claim node)
- Add URL hash/query param support for deep linking

---

### Phase 3: Polish & Optimization (1 day)

#### Task 3.1: Performance Optimization
DebateSheetReader currently fetches data independently. Consider:
- Shared SWR cache keys with other tabs
- Lazy loading (only fetch when Sheet View tab is active)
- Debounced filter updates
- Virtualized node grid for large deliberations

#### Task 3.2: UI Consistency
Match DebateSheetReader styling with DebateTab conventions:
- Use consistent card styles (panelv2, etc.)
- Match badge styling with ArgumentsTab
- Harmonize action button patterns
- Responsive breakpoints alignment

#### Task 3.3: Empty States
Handle deliberations with no arguments yet:
- Show onboarding message
- Link to AIFAuthoringPanel (in Models tab)
- Suggest creating first argument

---

## 🎯 Benefits

### For Users
- ✅ **Centralized access**: Sheet view available in main deliberation interface
- ✅ **Context awareness**: See sheet alongside propositions/claims
- ✅ **Integrated workflow**: Switch between views without leaving panel
- ✅ **Unified filters**: Apply same filters across all DebateTab views

### For Developers
- ✅ **Code reuse**: DebateSheetReader already feature-complete
- ✅ **Consistency**: Same component used in Agora and DeepDivePanel
- ✅ **Testability**: Component tested in both contexts
- ✅ **Maintainability**: Single source of truth for sheet rendering

---

## 🚧 Open Questions

1. **Tab Ordering**: Where should "Sheet View" appear in subtab order?
   - Option A: Last (Propositions → Claims → Sheet)
   - Option B: First (Sheet → Propositions → Claims)
   - Option C: Middle (Propositions → Sheet → Claims)

2. **Default Tab**: Should Sheet View ever be the default subtab?
   - Probably not initially (keep Propositions as default)
   - Maybe add user preference later

3. **Sheet ID Strategy**: 
   - Always use synthetic `delib:{id}` format?
   - Support curated sheet IDs if deliberation has associated sheet?
   - API endpoint to check if deliberation has curated sheet?

4. **Mobile UX**: 
   - DebateSheetReader's grid layout may need mobile-specific tweaks
   - Consider collapsing to list view on small screens

5. **Access Control**:
   - Should Sheet View visibility be permission-gated?
   - Any deliberations where we'd want to hide this tab?

---

## 📋 Dependencies

### Required Components
- ✅ `DebateSheetReader` (exists)
- ✅ `DebateTab` with NestedTabs (exists)
- ✅ `ArgumentActionsSheet` (exists)
- ✅ `MiniNeighborhoodPreview` (exists)

### Required APIs
- ✅ `/api/sheets/[id]` (exists)
- ✅ `/api/deliberations/[id]/evidential` (exists)
- ✅ `/api/arguments/[id]/aif-neighborhood` (exists)

### Potential New Requirements
- [ ] `/api/deliberations/[id]/sheet` - Get or create associated sheet
- [ ] URL hash/query param handling for deep linking
- [ ] Shared SWR cache coordination

---

## 📊 Success Metrics

### User Adoption
- Track % of users who discover and use Sheet View
- Measure time spent in Sheet View vs other DebateTab subtabs
- Survey: "How useful is the Sheet View for understanding debate structure?"

### Technical
- [ ] Page load time delta (should be minimal with lazy loading)
- [ ] SWR cache hit rate (should improve with shared keys)
- [ ] Error rate in Sheet View modal interactions

---

## 🔗 Related Work

### Concurrent Efforts
- **ThreadedDiscussionTab** (Option A implementation)
  - New default subtab for DebateTab
  - Complements Sheet View (overview vs. detailed grid)
  - Should cross-link to Sheet View for deep dives

### Future Enhancements
- **Unified Confidence System**: Room-level or deliberation-level settings
- **Cross-Tab State**: Highlight same argument across all views
- **Export Coordination**: Export from Sheet View includes context from other tabs

---

## 🎬 Rollout Plan

### Stage 1: Soft Launch (Week 1)
- Deploy to staging
- Internal team testing
- Gather feedback on tab placement and default behavior

### Stage 2: Beta (Week 2)
- Enable for power users (opt-in flag)
- Monitor usage patterns
- Iterate on filter/sort defaults

### Stage 3: General Availability (Week 3)
- Enable for all users
- Add to onboarding/documentation
- Announce in changelog

---

## 📝 Notes

- DebateSheetReader's confidence mode selector should sync with other tabs
- Consider adding "View in Arguments Tab" link from Sheet View (and vice versa)
- Sheet View might become preferred view for experienced users
- Keep Agora page access to DebateSheetReader (don't break existing workflows)

---

## 🔮 Future Vision

Eventually, DebateTab could become a "hub" with multiple specialized views:
- Thread View (conversational, Reddit-style)
- Propositions (current structured list)
- Claims (minimap + inspector)
- **Sheet View** (network grid with confidence)
- Graph View? (visual network diagram)
- Timeline View? (chronological with filters)

Each view offers different lens on same underlying deliberation data.

---

**Last Updated**: November 20, 2025  
**Owner**: TBD  
**Status**: Awaiting prioritization
