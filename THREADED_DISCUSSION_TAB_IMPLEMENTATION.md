# ThreadedDiscussionTab Implementation Status

**Component**: `ThreadedDiscussionTab.tsx`  
**Pattern**: Option A - Extend DialogueTimeline threading pattern  
**Status**: 🚧 Initial Scaffold Complete  
**Created**: November 20, 2025

---

## ✅ Completed

### Phase 0: Component Scaffold (November 20, 2025)
- [x] Created `components/deepdive/v3/tabs/ThreadedDiscussionTab.tsx`
- [x] Defined core interfaces (`ThreadNode`, `ThreadedDiscussionTabProps`)
- [x] Implemented threading logic (`buildThreadHierarchy()`)
- [x] Created `ThreadCard` component with nested response rendering
- [x] Added overview bar with stats, filters, and quick actions
- [x] Integrated timeline/analytics tab structure
- [x] Added modal support (preview, actions sheet)
- [x] Exported from barrel (`v3/tabs/index.ts`)
- [x] Zero TypeScript errors

### Component Structure
```tsx
ThreadedDiscussionTab
├─ Overview Bar (sticky header)
│  ├─ ThreadStats (quick metrics)
│  ├─ Quick action buttons (→ other tabs)
│  └─ Filter controls (type, scheme, CQs, sort, date)
│
├─ Main Content (tabs)
│  ├─ Timeline View (default)
│  │  └─ ThreadCard[] (recursive, collapsible)
│  └─ Analytics View (placeholder)
│
└─ Modals
   ├─ MiniNeighborhoodPreview (AIF graph)
   └─ ArgumentActionsSheet (deep dive)
```

---

## 🚧 In Progress / Next Steps

### Phase 1: Data Integration (1-2 days)

#### Task 1.1: Implement Unified Data Fetching ⏳ PRIORITY
Currently using placeholder SWR queries. Need to:

1. **Create unified API endpoint** (recommended):
   ```
   GET /api/deliberations/[id]/discussion-items
   ```
   Returns: propositions, claims, arguments with metadata in single response

   **OR**

2. **Enhance existing queries** to include threading metadata:
   - Add `replyToId` to propositions/claims queries
   - Include AIF metadata by default
   - Add support scores to arguments

**Files to modify**:
- [ ] `app/api/deliberations/[id]/discussion-items/route.ts` (new)
- [ ] Update ThreadedDiscussionTab data fetching logic

#### Task 1.2: Fix Author ID Extraction
Currently returns empty array. Implement:
```tsx
const authorIds = useMemo(() => {
  const ids = new Set<string>();
  
  propositionsData?.propositions?.forEach((p: any) => {
    if (p.authorId) ids.add(p.authorId);
  });
  
  claimsData?.claims?.forEach((c: any) => {
    if (c.authorId || c.createdById) ids.add(c.authorId || c.createdById);
  });
  
  aifData?.items?.forEach((a: any) => {
    if (a.authorId || a.createdById) ids.add(a.authorId || a.createdById);
  });
  
  return Array.from(ids);
}, [propositionsData, claimsData, aifData]);
```

#### Task 1.3: Test with Real Data
- [ ] Connect to actual deliberation
- [ ] Verify thread hierarchy builds correctly
- [ ] Check metadata badges display properly
- [ ] Test filter/sort functionality

---

### Phase 2: Integration with DebateTab (2-3 hours)

#### Task 2.1: Add to DebateTab as Default Subtab
**File**: `components/deepdive/v3/tabs/DebateTab.tsx`

```tsx
import { ThreadedDiscussionTab } from "./ThreadedDiscussionTab";

// In DebateTab component, add new subtab:
<NestedTabs defaultValue="discussion"> {/* Changed from "propositions" */}
  <TabsList>
    <TabsTrigger value="discussion">Discussion</TabsTrigger> {/* NEW - default */}
    <TabsTrigger value="propositions">Propositions</TabsTrigger>
    <TabsTrigger value="claims">Claims</TabsTrigger>
  </TabsList>
  
  <TabsContent value="discussion">
    <ThreadedDiscussionTab
      deliberationId={deliberationId}
      currentUserId={currentUserId}
    />
  </TabsContent>
  
  {/* Existing tabs... */}
</NestedTabs>
```

#### Task 2.2: Cross-Tab Navigation
Implement quick action buttons that switch to other main tabs:
- "View Map" → Switch to Arguments tab, Networks subtab
- "View Ludics" → Switch to Ludics tab
- "View Analytics" → Switch to Analytics tab

**Pattern**: Use parent `DeepDivePanelV2` tab state management

---

### Phase 3: Enhanced Features (2-3 days)

#### Task 3.1: Reply/Interact Actions
Currently just placeholder buttons. Implement:
- **Reply**: Open PropositionComposerPro with `replyToId` set
- **Support**: Open AIFArgumentComposer with support scheme
- **Attack**: Open AIFArgumentComposer with attack scheme

#### Task 3.2: Analytics View
Replace placeholder with real analytics:
- Activity heatmap (adapted from DialogueTimeline)
- Type distribution chart
- Participation metrics
- Scheme usage breakdown
- Thread depth analysis

#### Task 3.3: Export Functionality
Implement CSV/JSON export of threaded discussion:
- Include full thread hierarchy
- Metadata (schemes, CQs, support scores)
- Filter-aware (export visible items only)

#### Task 3.4: Date Range Filtering
Add date picker controls (similar to DialogueTimeline):
```tsx
<input
  type="date"
  value={dateRange.start || ""}
  onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value || null }))}
  className="menuv2--lite text-sm rounded-lg px-3 py-1"
/>
```

---

### Phase 4: Polish & Optimization (1 day)

#### Task 4.1: Performance
- [ ] Virtualize long thread lists (react-window or similar)
- [ ] Lazy load nested responses (only on expand)
- [ ] Debounce filter updates
- [ ] Optimize SWR caching strategy

#### Task 4.2: Mobile Responsiveness
- [ ] Test on mobile viewport
- [ ] Adjust card padding/margins
- [ ] Collapse filter controls into dropdown
- [ ] Stack quick action buttons

#### Task 4.3: Accessibility
- [ ] Add ARIA labels
- [ ] Keyboard navigation (arrow keys to navigate threads)
- [ ] Focus management (modals, expand/collapse)
- [ ] Screen reader announcements

#### Task 4.4: Empty States
- [ ] No threads: Onboarding message with CTA
- [ ] No filtered results: Suggest clearing filters
- [ ] Loading states with skeletons

---

## 🎯 Testing Checklist

### Unit Tests
- [ ] `buildThreadHierarchy()` correctly nests responses
- [ ] Filter logic works for all combinations
- [ ] Sort orders produce correct results
- [ ] Date range filtering edge cases

### Integration Tests
- [ ] ThreadCard renders all metadata badges
- [ ] Modal interactions work (preview, actions)
- [ ] Filter changes trigger re-render
- [ ] Cross-tab navigation functions

### E2E Tests
- [ ] Full user flow: view thread → expand → click action → return
- [ ] Filter persistence across tab switches
- [ ] Export generates valid CSV
- [ ] Mobile touch interactions

---

## 📊 Success Metrics

### User Adoption
- % of users who view ThreadedDiscussionTab (vs. other DebateTab subtabs)
- Average time spent in threaded view
- Click-through rate on quick action buttons

### Technical
- Page load time (should be <500ms with lazy loading)
- Bundle size impact (<50KB gzipped for new component)
- Zero console errors/warnings

### Qualitative
- User feedback: "Easier to follow conversation"
- Support requests decrease for "how to see full discussion"

---

## 🔗 Related Components

### Direct Dependencies
- ✅ `BaseTabProps` (types.ts)
- ✅ `SchemeBadge`, `CQStatusIndicator`, `AttackBadge`, `PreferenceBadge` (aif/)
- ✅ `ArgumentActionsSheet` (arguments/)
- ✅ `MiniNeighborhoodPreview` (aif/)
- ✅ UI components (Card, Badge, Button, Tabs, Dialog)

### Integration Points
- 🔄 `DebateTab` (will embed ThreadedDiscussionTab)
- 🔄 `DeepDivePanelV2` (parent tab state management)
- 🔄 `PropositionComposerPro` (reply action)
- 🔄 `AIFAuthoringPanel` (support/attack actions)

### Similar Components (Reference)
- 📚 `app/deliberation/[id]/dialoguetimeline/page.tsx` (threading pattern)
- 📚 `components/agora/DebateSheetReader.tsx` (metadata badges, filters)
- 📚 `components/discussion/DiscussionView.tsx` (forum structure)
- 📚 `components/ludics/LudicsForest.tsx` (view mode switcher)

---

## 🚀 Deployment Plan

### Stage 1: Soft Launch (Week 1)
- Deploy to staging environment
- Internal team testing with real deliberations
- Gather feedback on thread hierarchy logic
- Iterate on filter defaults

### Stage 2: Beta (Week 2)
- Add feature flag: `enable_threaded_discussion_tab`
- Enable for power users (opt-in)
- Monitor usage metrics
- A/B test: default to threaded view vs. propositions view

### Stage 3: General Availability (Week 3)
- Remove feature flag (enable for all)
- Update onboarding to mention threaded view
- Document in help/wiki
- Announce in changelog

---

## 💡 Future Enhancements

### Short-term (1-2 months)
- [ ] Real-time updates (WebSocket/SSE for new posts)
- [ ] Thread following/notifications
- [ ] Collapse all / Expand all buttons
- [ ] Search within threads
- [ ] Highlight mentions (@username)

### Medium-term (3-6 months)
- [ ] Thread voting/ranking (Reddit-style)
- [ ] Pin important threads
- [ ] Thread tagging/categorization
- [ ] Export to PDF with formatting
- [ ] Share thread link (deep linking)

### Long-term (6+ months)
- [ ] AI-generated thread summaries
- [ ] Sentiment analysis visualization
- [ ] Thread health metrics (engagement, toxicity)
- [ ] Cross-deliberation thread discovery
- [ ] Thread archiving/freezing

---

## 🐛 Known Issues

- [ ] authorIds extraction returns empty array (needs implementation)
- [ ] Analytics view is placeholder (needs real charts)
- [ ] Reply/Support/Attack buttons are non-functional (need composer integration)
- [ ] No loading states/skeletons yet
- [ ] Date range filter not implemented

---

## 📝 Notes

- Threading logic assumes `parentId` or `targetId` fields exist in data
  - Verify schema: do propositions/claims have reply relationships?
  - May need DB migration to add `replyToId` column
  
- Consider adding "collapse below threshold" feature
  - Hide deeply nested threads (depth > 3) behind "Show more" button
  - Reduces initial render complexity
  
- Badge system is powerful but can get cluttered
  - Implement badge priority system (only show top 2-3)
  - "View all metadata" expandable section

- Quick action buttons need confirmation with UX team
  - Should they switch tabs or open modals?
  - Consider user preference setting

---

**Last Updated**: November 20, 2025  
**Next Review**: After Phase 1 completion  
**Owner**: TBD
