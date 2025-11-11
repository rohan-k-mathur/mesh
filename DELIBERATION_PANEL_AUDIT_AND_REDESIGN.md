# Deliberation Panel Audit & Redesign Plan

**Status**: 🎯 STRATEGIC PLANNING - Post Phase 1-4 Implementation  
**Current Component**: `DeepDivePanelV2.tsx` (2,128 LOC)  
**Goal**: Modernize and consolidate deliberation UI with Phase 1-4 features integrated

---

## Executive Summary

With Phases 1-4 successfully implemented (Argumentation Theory Integration, Scheme Detection, Multi-Scheme Nets, and Net Management), we now have a powerful foundation. The current DeepDivePanelV2 has grown organically to 2,128 lines and integrates many features, but needs strategic consolidation to:

1. **Integrate Phase 1-4 features** into main deliberation flow
2. **Modernize UI/UX patterns** with consistent design system
3. **Improve performance** through better component architecture
4. **Enhance discoverability** of advanced features
5. **Maintain backward compatibility** while upgrading

---

## Current State Analysis

### Component Overview: DeepDivePanelV2.tsx

**Size**: 2,128 lines  
**Imports**: 73 components/utilities  
**Main Features**: 9 tabs with extensive functionality

#### Tab Structure (Current)
```
1. Debate (Main Discussion)
   - Proposition Composer
   - Claims MiniMap
   - Dialogue Inspector
   - Issues List
   - Assumptions Management
   
2. Arguments (AIF Arguments)
   - AIFArgumentsListPro
   - Argument Actions Sheet
   
3. Dialogue (Formal Dialogue System)
   - Ludics compilation
   - Behaviour Inspector
   - Legal moves tracking
   
4. Ludics (Game Theory)
   - Pro/Opp compilation
   - Behaviour trees
   
5. Admin (Management)
   - Works system
   - Approvals
   - Topology widget
   
6. Sources (Evidence)
   - Evidence List
   - Citation management
   
7. Thesis (Legal-style Arguments)
   - Thesis composer
   - Thesis list
   
8. ASPIC (Structured Argumentation)
   - ASPIC Theory Panel
   - Attack structures
   
9. Analytics (Metrics)
   - Categorical analysis
   - HomSet comparison
```

### Floating Sheets (3)
1. **Left Sheet**: Graph Explorer (Arguments + Claims)
   - AFMinimap visualization
   - Dialogue Actions
   - CommandCard
   
2. **Right Sheet**: Actions HUD
   - CQ Context Panel
   - Argument diagram viewer
   
3. **Terms Sheet**: Dictionary/Glossary

### Key UI Patterns Identified

#### ✅ **Strong Patterns to Preserve**
1. **SectionCard Component** - Unified card system with:
   - Title, subtitle, icon
   - Action buttons
   - Footer
   - Loading states
   - Tone variants (info/success/warn/danger)
   - Dense/padded modes

2. **Floating Sheets** - Side panels with:
   - Persistence (localStorage)
   - Badge counts
   - Glass morphism styling
   - Multiple width options

3. **StickyHeader** - Dynamic header with:
   - Scroll detection
   - Backdrop blur
   - Configuration controls

4. **Tab System** - Clear navigation between modes

5. **ChipBar** - Compact metadata display

#### ⚠️ **Patterns Needing Improvement**
1. **Tab Organization** - 9 tabs may be overwhelming
2. **Feature Discoverability** - Advanced features hidden in tabs
3. **Component Coupling** - Some tight coupling between sections
4. **State Management** - Multiple useState hooks (could use reducer)
5. **Performance** - 2,128 LOC with many renders

#### 🔴 **Anti-Patterns to Address**
1. **Monolithic File** - Single 2,128 line component
2. **Mixed Concerns** - API calls, state, rendering in one place
3. **Duplication** - Some repeated patterns across tabs
4. **Magic Numbers** - Hardcoded dimensions, limits
5. **Comment Clutter** - Old commented code (see lines 1920-1930)

---

## Phase 1-4 Integration Opportunities

### 🎯 **Critical Integrations Needed**

#### 1. **Argument Net Visualization** (Phase 4 - COMPLETED)
**Current**: Hidden in separate test page  
**Needed**: Integrate ArgumentNetAnalyzer into main debate flow

**Integration Points**:
- Add "Scheme Analysis" button to argument cards in Debate tab
- Show scheme count badge on multi-scheme arguments
- Optional "Scheme Network" subtab within Arguments tab
- Link to NetGraphWithCQs from argument popout

**UI Mockup**:
```
┌─ Argument Card ───────────────────────────────┐
│ Expert Opinion: Climate science is reliable   │
│ Confidence: 0.92 • Schemes: 3 [Net View →]   │
│                                                │
│ [Support] [Attack] [View CQs] [Analyze Net]  │
└────────────────────────────────────────────────┘
```

#### 2. **Scheme-Specific Critical Questions** (Phase 2 - COMPLETED)
**Current**: Available but not prominently featured  
**Needed**: Highlight CQ system in main flow

**Integration Points**:
- CQ badge on arguments with unanswered questions
- CQ response count in argument cards
- Dedicated "Critical Questions" subsection in Debate tab
- Moderator review dashboard in Admin tab

#### 3. **Scheme Detection Indicators** (Phase 1 - COMPLETED)
**Current**: Background detection, not surfaced  
**Needed**: Visual indicators of detected schemes

**Integration Points**:
- Scheme badge/chip on argument cards
- Confidence meter for scheme detection
- Tooltip with scheme definition on hover
- Link to scheme breakdown modal

#### 4. **Net-Aware Dialogue Moves** (Phase 3 - COMPLETED)
**Current**: Legal moves system exists  
**Needed**: Adapt for multi-scheme nets

**Integration Points**:
- Show net-specific moves in CommandCard
- Dependency-aware move suggestions
- Attack/support options per scheme in net

---

## Proposed Component Architecture

### Design Principle: **Modular Monolith**

Keep single entry point but extract concerns into focused sub-components.

### New Structure

```
DeepDivePanelV3/
├── index.tsx                    (150 LOC) - Main orchestrator
├── hooks/
│   ├── useDeliberationData.ts   (100 LOC) - Data fetching
│   ├── useDeliberationState.ts  (80 LOC)  - State management
│   ├── useSheetPersistence.ts   (40 LOC)  - localStorage
│   └── useTabNavigation.ts      (30 LOC)  - Tab state
├── tabs/
│   ├── DebateTab.tsx            (400 LOC) - Main discussion
│   ├── ArgumentsTab.tsx         (300 LOC) - Arguments + Schemes
│   ├── DialogueTab.tsx          (250 LOC) - Formal dialogue
│   ├── AnalyticsTab.tsx         (200 LOC) - Metrics
│   ├── AdminTab.tsx             (200 LOC) - Management
│   └── index.ts                 - Re-exports
├── sheets/
│   ├── GraphExplorerSheet.tsx   (350 LOC) - Left sheet
│   ├── ActionsHudSheet.tsx      (300 LOC) - Right sheet
│   └── GlossarySheet.tsx        (150 LOC) - Terms sheet
├── sections/
│   ├── PropositionSection.tsx   (150 LOC)
│   ├── ClaimsSection.tsx        (200 LOC)
│   ├── ArgumentsSection.tsx     (250 LOC) - w/ Net integration
│   ├── IssuesSection.tsx        (150 LOC)
│   └── AssumptionsSection.tsx   (100 LOC)
└── shared/
    ├── SectionCard.tsx          (100 LOC) - Extracted from V2
    ├── StickyHeader.tsx         (80 LOC)  - Extracted from V2
    ├── ChipBar.tsx              (40 LOC)  - Extracted from V2
    └── types.ts                 (50 LOC)  - Shared types

Total: ~3,000 LOC (organized into 25+ focused files)
```

**Benefits**:
- Each file under 400 LOC (maintainable)
- Clear separation of concerns
- Easy to test individual parts
- Parallel development possible
- Better code reuse

---

## UI/UX Redesign Proposals

### 1. **Consolidated Tab Structure** (9 → 6 tabs)

**Current 9 Tabs**: Debate, Arguments, Dialogue, Ludics, Admin, Sources, Thesis, ASPIC, Analytics

**Proposed 6 Tabs**:
```
1. 💬 Debate         (Main discussion + Claims + Propositions)
2. 🎯 Arguments      (Arguments + Schemes + Nets + ASPIC)
3. 🎮 Dialogue       (Dialogue + Ludics combined)
4. 📚 Knowledge      (Sources + Thesis + Dictionary)
5. 📊 Analytics      (Metrics + Reports)
6. ⚙️  Admin         (Settings + Moderation)
```
-- one note about the tabs issue: i think we should use the pattern of the nested tab-lists like the way the aspic tab is handled where there is one parent tab from the main panel tab list (ASPIC) and then
there is another tablist within that tab with 4 tabs: Theory, Graph, Extension, Rationality
-- this way we can reduce the number of "global" tabs and have a more hierarchical visual structure
**Rationale**:
- **Debate**: Primary activity, keep focused
- **Arguments**: All argumentation features together
- **Dialogue**: Game-theoretic features naturally grouped
- **Knowledge**: Reference materials consolidated
- **Analytics**: All metrics in one place
- **Admin**: Management functions separated

### 2. **Enhanced Argument Cards** (Phase 1-4 Integration)

```tsx
<ArgumentCard>
  {/* Header with scheme indicators */}
  <CardHeader>
    <SchemeBadge schemes={3} primaryScheme="Expert Opinion" />
    <ConfidenceMeter value={0.92} />
  </CardHeader>
  
  {/* Main content */}
  <CardBody>
    {argumentText}
  </CardBody>
  
  {/* Phase 1-4 Actions */}
  <CardActions>
    <Button variant="ghost">
      <Target /> Support
    </Button>
    <Button variant="ghost">
      <Shield /> Defend
    </Button>
    <Button variant="ghost" badge={5}>
      <HelpCircle /> CQs
    </Button>
    <Button variant="primary" badge="new">
      <Network /> Analyze Net
    </Button>
  </CardActions>
  
  {/* Expandable CQ section */}
  {expanded && (
    <CardExpanded>
      <ComposedCQPanel netId={netId} />
    </CardExpanded>
  )}
</ArgumentCard>
```

### 3. **Smart Sidebar System** (Instead of Multiple Floating Sheets)

**Concept**: Single dynamic sidebar that adapts to context

```
┌─ Main Content ────────────┬─ Smart Sidebar ────┐
│ Debate Tab                 │ 📍 Context Panel   │
│                            │                     │
│ [Argument Selected]        │ → Argument Details │
│                            │ → Legal Moves      │
│                            │ → CQ Responses     │
│                            │ → Net Visualization│
│                            │                     │
│ [Claim Selected]           │ → Claim Details    │
│                            │ → Top Arguments    │
│                            │ → Dialogue Actions │
│                            │                     │
│ [Nothing Selected]         │ → Mini Map         │
│                            │ → Recent Activity  │
│                            │ → Quick Stats      │
└────────────────────────────┴─────────────────────┘
```

**Benefits**:
- Context-aware (no need to manage 3 sheets)
- Always visible (no toggle buttons needed)
- Responsive (collapses on mobile)
- Discoverable (shows relevant actions)

### 4. **Progressive Disclosure** for Advanced Features

**Principle**: Show simple first, reveal complexity on demand

**Example - Scheme Analysis**:
```
Level 1 (Default):
  Argument card shows "Schemes: 3" badge
  
Level 2 (Hover/Click):
  Tooltip shows scheme names and confidence
  
Level 3 (Action):
  Opens ArgumentNetAnalyzer in modal/panel
  
Level 4 (Deep Dive):
  Full net visualization with all features
```

### 5. **Activity Stream** (New Feature)

Add persistent activity sidebar showing:
- Recent propositions
- New arguments
- CQ responses pending review
- Dialogue moves
- Net detections
- Scheme updates

**Mockup**:
```
┌─ Activity Stream ─────────┐
│ 🕐 2 min ago              │
│ [Alice] Posted Expert     │
│ Opinion argument          │
│                            │
│ 🕐 5 min ago              │
│ [Bob] Responded to CQ:    │
│ "How reliable is..."      │
│                            │
│ 🕐 8 min ago              │
│ [System] Detected 3-      │
│ scheme net in arg #42     │
└────────────────────────────┘
```

---

## Performance Optimizations

### Current Issues
1. **Heavy re-renders** - Many useState hooks at top level
2. **Unnecessary fetches** - Some SWR calls could be conditional
3. **Large bundle** - 73 imports, some may be unused
4. **No virtualization** - Lists render all items

### Proposed Solutions

#### 1. **State Management Consolidation**
```tsx
// Instead of 20+ useState hooks:
const [tab, setTab] = useState(...)
const [leftSheetOpen, setLeftSheetOpen] = useState(...)
const [rightSheetOpen, setRightSheetOpen] = useState(...)
// ... etc

// Use reducer:
const [state, dispatch] = useReducer(deliberationReducer, initialState)
```

#### 2. **Code Splitting by Tab**
```tsx
const DebateTab = lazy(() => import('./tabs/DebateTab'))
const ArgumentsTab = lazy(() => import('./tabs/ArgumentsTab'))
// Only load active tab
```

#### 3. **SWR Optimization**
```tsx
// Conditional fetching
const { data } = useSWR(
  tab === 'arguments' ? `/api/arguments?delibId=${id}` : null,
  fetcher
)
```

#### 4. **List Virtualization**
```tsx
// Already using CardListVirtuoso for some lists
// Expand to all long lists (claims, arguments, etc.)
<Virtuoso
  data={arguments}
  itemContent={(index, arg) => <ArgumentCard {...arg} />}
/>
```

---

## Migration Strategy

### Phase 0: Preparation (Week 1)
- [ ] Audit all imports and remove unused
- [ ] Document all current features and behaviors
- [ ] Create feature parity checklist
- [ ] Set up feature flags for gradual rollout

### Phase 1: Extract Shared Components (Week 2)
- [ ] Extract SectionCard to shared/
- [ ] Extract StickyHeader to shared/
- [ ] Extract ChipBar to shared/
- [ ] Create shared types.ts
- [ ] Update DeepDivePanelV2 to import shared components
- [ ] Verify no regressions

### Phase 2: Custom Hooks (Week 3)
- [ ] Create useDeliberationData hook
- [ ] Create useDeliberationState hook
- [ ] Create useSheetPersistence hook
- [ ] Create useTabNavigation hook
- [ ] Migrate V2 to use hooks
- [ ] Verify no regressions

### Phase 3: Tab Extraction (Week 4-5)
- [ ] Extract DebateTab component
- [ ] Extract ArgumentsTab component (with Net integration)
- [ ] Extract DialogueTab component
- [ ] Extract remaining tabs
- [ ] Update V2 to use tab components
- [ ] Verify feature parity

### Phase 4: Sheet Consolidation (Week 6)
- [ ] Extract GraphExplorerSheet
- [ ] Extract ActionsHudSheet
- [ ] Extract GlossarySheet
- [ ] Consider Smart Sidebar alternative
- [ ] Update V2 to use sheet components
- [ ] Verify no regressions

### Phase 5: Create DeepDivePanelV3 (Week 7)
- [ ] Create new V3 entry point
- [ ] Wire up all extracted components
- [ ] Implement state reducer
- [ ] Add code splitting
- [ ] Performance testing
- [ ] A/B testing setup

### Phase 6: Phase 1-4 Integration (Week 8-9)
- [ ] Add ArgumentNetAnalyzer to Arguments tab
- [ ] Add scheme badges to argument cards
- [ ] Add "Analyze Net" buttons
- [ ] Add CQ response dashboard to Admin
- [ ] Add net visualization to sidebar
- [ ] Add scheme detection indicators

### Phase 7: Beta & Rollout (Week 10)
- [ ] Beta testing with select users
- [ ] Gather feedback
- [ ] Fix critical issues
- [ ] Gradual rollout via feature flag
- [ ] Monitor performance metrics
- [ ] Full rollout

### Phase 8: Cleanup (Week 11)
- [ ] Remove DeepDivePanelV2 once V3 is stable
- [ ] Update all imports across codebase
- [ ] Archive old components
- [ ] Update documentation

---

## Feature Flag Strategy

```typescript
// Feature flags for gradual rollout
const FEATURES = {
  USE_V3_PANEL: false,              // Main V3 toggle
  ENABLE_SMART_SIDEBAR: false,      // New sidebar system
  SHOW_SCHEME_INDICATORS: true,     // Phase 1 integration
  ENABLE_NET_ANALYZER: true,        // Phase 4 integration
  CONSOLIDATED_TABS: false,         // 6-tab layout
  ACTIVITY_STREAM: false,           // Activity sidebar
  CODE_SPLITTING: false,            // Lazy load tabs
} as const

// Usage
if (FEATURES.USE_V3_PANEL) {
  return <DeepDivePanelV3 {...props} />
} else {
  return <DeepDivePanelV2 {...props} />
}
```

---

## Design System Tokens

### Colors (Consistent with Phase 1-4)
```typescript
const THEME = {
  // Argument scheme colors
  scheme: {
    primary: 'indigo-600',
    secondary: 'purple-600',
    supporting: 'sky-600',
  },
  
  // Confidence indicators
  confidence: {
    high: 'emerald-600',
    medium: 'amber-600',
    low: 'rose-600',
  },
  
  // UI tones (already in SectionCard)
  tone: {
    default: 'slate-200',
    info: 'sky-200',
    success: 'emerald-200',
    warn: 'amber-200',
    danger: 'rose-200',
  },
}
```

### Spacing Scale
```typescript
const SPACING = {
  xs: '0.5rem',   // 8px
  sm: '0.75rem',  // 12px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
  '2xl': '3rem',  // 48px
}
```

### Typography Scale
```typescript
const TYPOGRAPHY = {
  // Already using "Kolonia" for headers
  display: 'font-[Kolonia] text-4xl uppercase tracking-wide',
  h2: 'text-2xl font-semibold',
  h3: 'text-lg font-semibold',
  body: 'text-sm',
  caption: 'text-xs text-slate-600',
}
```

---

## API Optimizations

### Batch Requests
```typescript
// Instead of:
const args = await fetch(`/api/arguments?delibId=${id}`)
const claims = await fetch(`/api/claims?delibId=${id}`)
const propositions = await fetch(`/api/propositions?delibId=${id}`)

// Use:
const { args, claims, propositions } = await fetch(
  `/api/deliberations/${id}/full`
)
```

### Incremental Loading
```typescript
// Initial load - essential data only
const { metadata, recentActivity } = await fetch(
  `/api/deliberations/${id}?view=minimal`
)

// Load tab data on demand
const { arguments } = await fetch(
  `/api/deliberations/${id}/arguments`
) // Only when Arguments tab clicked
```

### WebSocket for Real-Time Updates
```typescript
// Subscribe to deliberation updates
const ws = useDeliberationSocket(deliberationId)

ws.on('new-argument', (arg) => {
  // Update local state without refetch
  mutate('/api/arguments', (data) => [...data, arg], false)
})
```

---

## Testing Strategy

### Unit Tests (New Components)
```typescript
// Example: SectionCard.test.tsx
describe('SectionCard', () => {
  it('renders with title', () => {
    render(<SectionCard title="Test" />)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })
  
  it('applies tone styles correctly', () => {
    const { container } = render(
      <SectionCard tone="success" />
    )
    expect(container.firstChild).toHaveClass('ring-emerald-200')
  })
})
```

### Integration Tests (Tab Behavior)
```typescript
describe('DeepDivePanelV3', () => {
  it('switches tabs correctly', async () => {
    render(<DeepDivePanelV3 deliberationId="test-123" />)
    
    const argumentsTab = screen.getByText('Arguments')
    await userEvent.click(argumentsTab)
    
    expect(screen.getByText('AIFArgumentsListPro')).toBeVisible()
  })
})
```

### E2E Tests (Critical Flows)
```typescript
test('User can create argument and view its scheme net', async ({ page }) => {
  await page.goto('/deliberation/test-delib')
  
  // Create argument
  await page.click('[data-testid="compose-argument"]')
  await page.fill('[name="text"]', 'Test argument...')
  await page.click('[data-testid="submit-argument"]')
  
  // View net
  await page.click('[data-testid="analyze-net"]')
  await expect(page.locator('.net-graph')).toBeVisible()
})
```

---

## Success Metrics

### Performance Targets
- [ ] Initial load < 2s (currently ~3s)
- [ ] Tab switch < 200ms (currently ~500ms)
- [ ] Argument card render < 50ms
- [ ] Bundle size < 500KB (currently ~800KB)

### User Experience Targets
- [ ] 80% of users discover net analyzer within 1st session
- [ ] Average time to create argument < 60s
- [ ] 90% of users understand scheme indicators
- [ ] CQ response rate increases 2x

### Code Quality Targets
- [ ] No files > 400 LOC
- [ ] Test coverage > 70%
- [ ] Zero TypeScript errors
- [ ] Lighthouse score > 90

---

## Risk Analysis

### High Risk
- **Breaking existing workflows** - Users accustomed to current layout
  - *Mitigation*: Feature flag + gradual rollout + feedback loop
  
- **Performance regression** - More components = more overhead?
  - *Mitigation*: Performance budgets + monitoring + lazy loading

### Medium Risk
- **Incomplete feature parity** - Missing edge cases
  - *Mitigation*: Comprehensive testing + side-by-side comparison
  
- **State management bugs** - Reducer complexity
  - *Mitigation*: Unit tests + state machine diagrams

### Low Risk
- **Style inconsistencies** - Design tokens should prevent
- **Import errors** - TypeScript will catch
- **Dead code** - Linter will identify

---

## Open Questions

1. **Smart Sidebar vs Floating Sheets?**
   - Pro Sidebar: Always visible, context-aware
   - Pro Sheets: More screen real estate for main content
   - **Recommendation**: Try sidebar first, can fallback to sheets

2. **9 tabs → 6 tabs or keep 9?**
   - User feedback needed on current tab usage
   - Analytics: Which tabs are rarely used?
   - **Recommendation**: Consolidate but make it configurable

3. **Reducer vs Multiple useState?**
   - Reducer better for complex state
   - useState simpler for beginners to understand
   - **Recommendation**: Reducer for V3, document well

4. **Code splitting by default or opt-in?**
   - By default: Better initial load
   - Opt-in: Simpler to debug
   - **Recommendation**: By default for production, configurable in dev

5. **Backward compatibility timeline?**
   - Keep V2 for how long after V3 launch?
   - **Recommendation**: 2 months side-by-side, then deprecate V2

---

## Next Steps (Immediate)

### Week 1 Action Items
1. **Get stakeholder feedback** on this audit
2. **Prioritize features** - What's most important?
3. **Create GitHub project** for tracking migration
4. **Set up feature flags** in codebase
5. **Extract first shared component** (SectionCard) as proof of concept

### Week 2 Preview
- Complete shared component extraction
- Create useDeliberationData hook
- Start on tab extraction (DebateTab first)

---

## Appendix: Current Component Inventory

### Direct Dependencies (73 imports)
```typescript
// UI Components (18)
import { Tabs, TabsList, TabsContent, TabsTrigger } from "../ui/tabs"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"
import { FloatingSheet, SheetToggleButton } from "../ui/FloatingSheet"
// ... etc

// Feature Components (35)
import DeliberationComposer from "./DeliberationComposer"
import ArgumentsList from "./ArgumentsList"
import { RepresentativeViewpoints } from "./RepresentativeViewpoints"
import AIFArgumentsListPro from '@/components/arguments/AIFArgumentsListPro'
// ... etc

// Utilities (10)
import useSWR, { mutate as swrMutate } from "swr"
import { useAuth } from "@/lib/AuthContext"
import { scrollIntoViewById } from "@/lib/client/scroll"
// ... etc

// Icons (10)
import { GalleryVerticalEnd, MessageSquare, Settings } from "lucide-react"
// ... etc
```

### State Variables (25+)
```typescript
const [sel, setSel] = useState<Selection | null>(null)
const [pending, setPending] = useState(false)
const [status, setStatus] = useState<string | null>(null)
const [tab, setTab] = useState<'debate' | ...>('debate')
const [confMode, setConfMode] = useState<'product' | 'min'>('product')
// ... 20 more
```

### API Endpoints Called (15+)
```
/api/ludics/compile-step
/api/works
/api/arguments/{id}
/api/arguments/{id}?view=diagram
/api/claims/{id}
/api/claims/{id}/top-argument
/api/dialogue/legal-moves
/api/nets/detect
/api/nets/{id}/cqs
// ... etc
```

---

## Conclusion

The DeepDivePanelV2 is a powerful component that has grown organically with the platform. With Phase 1-4 complete, we have an opportunity to:

1. **Modernize architecture** - Split into focused, testable components
2. **Integrate new features** - Surface scheme detection and net analysis
3. **Improve performance** - Reduce bundle size and optimize renders
4. **Enhance UX** - Progressive disclosure and smart context awareness

The migration can be done incrementally over 11 weeks with feature flags ensuring no disruption to existing users. The result will be a more maintainable, performant, and feature-rich deliberation experience.

**Recommendation**: Proceed with Phase 0 (Preparation) and get stakeholder sign-off on:
- 6-tab consolidated layout vs keep 9 tabs
- Smart Sidebar vs Floating Sheets
- Aggressive timeline (11 weeks) vs conservative (16 weeks)

Once these decisions are made, we can begin extraction and migration with confidence.
