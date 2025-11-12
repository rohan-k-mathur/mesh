# DeepDivePanel V3 - Overhaul Integration Audit

**Date**: November 11, 2025  
**Context**: Phases 0-4 of Deliberation System Overhaul completed, integration needed for V3 redesign  
**Purpose**: Map implemented overhaul components to DeepDivePanel tabs for systematic integration

---

## Executive Summary

**Key Finding**: Phases 0-4 of the Deliberation System Overhaul have been **fully implemented** with comprehensive components, APIs, and data models. These features are **NOT yet integrated** into DeepDivePanelV2 despite being production-ready.

**Impact**: The V3 redesign provides the perfect opportunity to integrate these sophisticated argumentation features, transforming DeepDivePanel from a basic argument viewer into an **intelligent argumentation platform**.

**Recommendation**: Integrate overhaul features **systematically during Week 5-8** of the V3 migration, immediately after tab extraction is complete.

---

## Phase 0: Foundation (Burden of Proof) ✅ COMPLETE

### Data Model Updates

**Status**: ✅ Fully implemented in schema

**Implementation**:
- `CriticalQuestion.burdenOfProof` - "PROPONENT" | "CHALLENGER"
- `CriticalQuestion.requiresEvidence` - boolean flag
- Integrated into all CQ-related APIs

### Components Implemented

| Component | Location | Purpose | Status |
|-----------|----------|---------|--------|
| **BurdenOfProofIndicators** | `components/argumentation/` | Badge/tooltip UI for burden display | ✅ Complete |
| **CriticalQuestionsV3** | `components/claims/` | Enhanced CQ panel with burden badges | ✅ Complete |
| **SchemeCreator (enhanced)** | `components/admin/` | Burden config in scheme editor | ✅ Complete |

### APIs Implemented

- ✅ All `/api/schemes/*` endpoints return burden metadata
- ✅ `/api/arguments/suggest-attacks` uses burden for ranking
- ✅ CQ response APIs track burden context

### Current Integration Status

**Where it's used**:
- ❌ NOT in DeepDivePanelV2
- ✅ Used in standalone CriticalQuestionsV3 component
- ✅ Used in attack suggestion flows
- ✅ Visible in admin scheme creator

**Integration Opportunity**: 
- **Arguments Tab**: Add burden badges to CQ panels
- **Admin Tab**: Already integrated (SchemeCreator)
- **Debate Tab**: Show burden in proposition analysis

---

## Phase 1: Multi-Scheme Arguments (Argument Nets) ✅ COMPLETE

### Data Model Updates

**Status**: ✅ Fully implemented

**Key Models**:
```prisma
// Note: Check actual schema for exact structure
model Argument {
  // Multi-scheme support via ArgumentSchemeInstance
  schemeInstances ArgumentSchemeInstance[]
}

model ArgumentSchemeInstance {
  // Track multiple schemes per argument
  // Explicitness classification
  // Dependency tracking
}

model ArgumentScheme {
  // Composition support
  composedFrom String[] // Scheme IDs this is composed from
  // Cluster metadata
  clusterTag String?
  // Dichotomic metadata
  dichotomicPurpose String?
  dichotomicSource String?
}
```

### Components Implemented

| Component | Location | Purpose | Status |
|-----------|----------|---------|--------|
| **ArgumentNetAnalyzer** | `components/argumentation/` | Full net analysis UI with tabs | ✅ Complete |
| **SchemeNetVisualization** | `components/arguments/` | Graph visualization of scheme nets | ✅ Complete |
| **ComposedCQPanel** | `components/cqs/` | Net-aware CQ panel with grouping | ✅ Complete |
| **NetGraphWithCQs** | `components/nets/visualization/` | Interactive net graph | ✅ Complete |
| **NetworksSection** | `components/deepdive/v3/sections/` | Deliberation-level net detection | ✅ Complete |

### Services Implemented

| Service | Location | Purpose |
|---------|----------|---------|
| **NetIdentificationService** | `app/server/services/` | Detect multi-scheme arguments |
| **NetAnalysisService** | `app/server/services/` | Analyze net structure |
| **NetCQService** | `app/server/services/` | Composed CQ generation |

### APIs Implemented

**Net Detection & Analysis**:
- ✅ `POST /api/nets/detect` - Detect nets in deliberation
- ✅ `GET /api/nets/[id]` - Get net details
- ✅ `GET /api/nets/[id]/dependencies` - Get dependency graph
- ✅ `GET /api/nets/[id]/explicitness` - Explicitness analysis
- ✅ `GET /api/nets/[id]/reconstruction` - Reconstruction suggestions

**Net-Aware CQs**:
- ✅ `GET /api/nets/[id]/cqs` - Get composed CQs for net
- ✅ `POST /api/nets/[id]/cqs/answer` - Answer net CQ
- ✅ `POST /api/nets/[id]/confirm` - Confirm net structure

**Scheme Net Management**:
- ✅ `GET /api/arguments/[id]/scheme-net` - Get scheme net for argument
- ✅ `POST /api/arguments/[id]/scheme-net/steps` - Add net step

### Current Integration Status

**Where it's used**:
- ❌ NOT in DeepDivePanelV2 (main tabs)
- ✅ NetworksSection exists in `v3/sections/` (ready to integrate)
- ✅ Used in standalone SchemeAnalyzer component
- ⚠️ **Partially integrated** - components exist but not wired to main UI

**Integration Opportunity**:
- **Arguments Tab**: 
  - Replace single-scheme CQ modal with ArgumentNetAnalyzer
  - Add "Analyze Net" button to argument cards
  - Show scheme badges on multi-scheme arguments
- **New "Networks" Sub-Tab** (under Arguments):
  - Use existing NetworksSection component
  - Show all detected nets in deliberation
  - Interactive net browser
- **Analytics Tab**:
  - Add net complexity metrics
  - Show net distribution charts

---

## Phase 2: Multi-Entry Navigation (Scheme Discovery) ✅ COMPLETE

### Components Implemented

| Component | Location | Purpose | Status |
|-----------|----------|---------|--------|
| **SchemeNavigator** | `components/schemes/` | Unified multi-mode navigator | ✅ Complete |
| **DichotomicTreeWizard** | `components/schemes/` | Step-by-step scheme selection | ✅ Complete |
| **ClusterBrowser** | `components/schemes/` | Browse schemes by semantic cluster | ✅ Complete |
| **IdentificationConditionsFilter** | `components/schemes/` | Filter by identification conditions | ✅ Complete |
| **SchemeSearch** | `components/schemes/` | Text search with filters | ✅ Complete |
| **SchemesSection** | `components/deepdive/v3/sections/` | Deliberation scheme browser | ✅ Complete |

**Supporting Components**:
- ClusterCard, ClusterGrid, ClusterSchemeList
- PurposeStep, SourceStep, ResultsStep (wizard steps)
- ConditionCategory, ConditionCheckbox, ConditionMatchResults
- FavoritesPanel, RecentSchemesPanel
- NavigationHeader, SchemeNavigationContext

### Data Model Support

**Scheme Metadata** (added to ArgumentScheme):
```typescript
{
  // Dichotomic Tree
  dichotomicPurpose: "action" | "state-of-affairs" | null
  dichotomicSource: "internal" | "external" | null
  
  // Clustering
  clusterTag: string | null // e.g., "causal", "authority", "decision"
  
  // Identification Conditions
  identificationConditions: string[] // Stored in metadata JSON
  
  // Examples
  typicalExamples: string[]
}
```

### APIs Supporting Navigation

- ✅ `GET /api/schemes/all` - Returns all schemes with metadata
- ✅ Schemes include clusterTag, dichotomic fields
- ✅ Client-side filtering/grouping in components

### Current Integration Status

**Where it's used**:
- ❌ NOT in DeepDivePanelV2
- ✅ SchemesSection exists in `v3/sections/` (ready to integrate)
- ✅ SchemeNavigator is standalone-ready
- ❌ NOT replacing AIFArgumentWithSchemeComposer's scheme picker yet

**Integration Opportunity**:
- **Arguments Tab**:
  - Replace simple scheme dropdown in AIFArgumentWithSchemeComposer
  - Use SchemeNavigator for scheme selection
  - Add "Browse Schemes" button → opens navigator dialog
- **New "Schemes" Sub-Tab** (under Admin or Arguments):
  - Use existing SchemesSection component
  - Full scheme browser for deliberation
  - Educational mode for learning schemes
- **Scheme Picker Replacement**:
  - Replace SchemePickerWithHierarchy with SchemeNavigator
  - Multiple entry points improve UX

---

## Phase 3: Argument Generation (Attack/Support Wizards) ✅ COMPLETE

### Components Implemented

| Component | Location | Purpose | Status |
|-----------|----------|---------|--------|
| **AttackSuggestions** | `components/argumentation/` | List CQ-based attack strategies | ✅ Complete |
| **AttackConstructionWizard** | `components/argumentation/` | Step-by-step attack builder | ✅ Complete |
| **AttackPreviewSubmission** | `components/argumentation/` | Review & submit attack | ✅ Complete |
| **SupportSuggestions** | `components/argumentation/` | Suggest supporting arguments | ✅ Complete |
| **SupportConstructionWizard** | `components/argumentation/` | Build support arguments | ✅ Complete |
| **ArgumentConstructionFlow** | `components/argumentation/` | Orchestrates full flow | ✅ Complete |
| **ArgumentConstructor** | `components/argumentation/` | General argument builder | ✅ Complete |
| **EvidenceGuidance** | `components/argumentation/` | Evidence collection helper | ✅ Complete |
| **EvidenceMatchingVisualizer** | `components/argumentation/` | Visual evidence mapping | ✅ Complete |
| **EvidenceSchemeMapper** | `components/argumentation/` | Match evidence to schemes | ✅ Complete |
| **TemplateLibrary** | `components/argumentation/` | Argument templates | ✅ Complete |
| **BatchArgumentGenerator** | `components/argumentation/` | Generate multiple arguments | ✅ Complete |

### Services Implemented

**Backend Services**:
- ✅ ArgumentGenerationService
- ✅ AttackSuggestionService
- ✅ SupportSuggestionService
- ✅ TemplateGenerationService
- ✅ ConfidenceScoring (integrated)

### APIs Implemented

**Attack Generation**:
- ✅ `POST /api/arguments/suggest-attacks` - Generate attack suggestions
- ✅ `POST /api/attacks/create` - Create attack from template
- ✅ `POST /api/attacks/undercut` - Undercut inference

**Support Generation**:
- ✅ Support suggestion APIs (integrated in argument creation flow)

**Attack Management**:
- ✅ `GET /api/attacks` - List attacks
- ✅ Various attack-specific endpoints

### Current Integration Status

**Where it's used**:
- ❌ NOT in DeepDivePanelV2
- ✅ Components exist and are production-ready
- ⚠️ May be used in ArgumentActionsSheet (check)
- ❌ NOT exposed as primary UI flow

**Integration Opportunity**:
- **Arguments Tab**:
  - Add "Generate Attack" button on argument cards
  - Opens AttackSuggestions → AttackConstructionWizard flow
  - Replaces manual "Add counterargument" with intelligent suggestions
- **Debate Tab**:
  - Add "Suggest Support" for claims
  - Show "Weak points to attack" for opponent claims
  - Strategic deliberation mode
- **Command Card Enhancement**:
  - Integrate attack suggestions into dialogue legal moves
  - Show suggested CQs as dialogue actions
- **New "Attack Generator" Modal**:
  - Full-featured attack wizard
  - Accessible from any argument/claim
  - Education mode explains attack strategy

---

## Phase 4: Net Visualization & Analysis ✅ COMPLETE

### Components Already Listed in Phase 1

**Net visualization components are part of Phase 1 implementation**:
- ArgumentNetAnalyzer (full UI)
- SchemeNetVisualization (graph)
- NetGraphWithCQs (interactive)
- ComposedCQPanel (net-aware CQs)

### Additional Phase 4 Features

**Net Export & History**:
- ✅ ArgumentNetAnalyzer includes "Export" tab
- ✅ Version history tracking
- ✅ Reconstruction suggestions

**Interactive Features**:
- ✅ Click nodes to see scheme details
- ✅ Click edges to see dependencies
- ✅ Color-coded by explicitness
- ✅ Layout algorithms (hierarchical, force-directed)

### Current Integration Status

**Same as Phase 1** - components ready, not integrated into main UI.

---

## Integration Priority Matrix

### High Priority (Week 5-6) - Core Argumentation

| Feature | Target Tab | Effort | Impact | Dependencies |
|---------|-----------|--------|--------|--------------|
| **ArgumentNetAnalyzer** | Arguments | Medium | High | Replace CQ modal |
| **NetworksSection** | Arguments (new sub-tab) | Low | High | Already built |
| **Attack Suggestions** | Arguments | Medium | Very High | User workflow change |
| **Burden of Proof badges** | Arguments | Low | Medium | CQ panel update |

### Medium Priority (Week 7) - Enhanced Discovery

| Feature | Target Tab | Effort | Impact | Dependencies |
|---------|-----------|--------|--------|--------------|
| **SchemeNavigator** | Arguments | Medium | High | Replace picker |
| **SchemesSection** | Admin or new tab | Low | Medium | Already built |
| **Support Suggestions** | Debate | Medium | High | Similar to attacks |
| **Net badges on cards** | Arguments | Low | Medium | Visual enhancement |

### Lower Priority (Week 8+) - Advanced Features

| Feature | Target Tab | Effort | Impact | Dependencies |
|---------|-----------|--------|--------|--------------|
| **Batch Generator** | Arguments | Low | Low | Power user feature |
| **Evidence Mapper** | Debate | Medium | Medium | Evidence tab needed |
| **Template Library** | Arguments | Low | Low | Advanced users |
| **Net Export** | Analytics | Low | Low | Already in analyzer |

---

## Recommended Integration Sequence

### Week 5: Arguments Tab Enhancement

**Goal**: Make Arguments tab the hub for intelligent argumentation

**Tasks**:
1. **Add ArgumentNetAnalyzer integration** (~4 hours)
   - Replace SchemeSpecificCQsModal with ArgumentNetAnalyzer
   - Add "Analyze" button to argument cards
   - Handle single-scheme vs multi-scheme gracefully
   
2. **Add NetworksSection as sub-section** (~2 hours)
   - Add collapsible NetworksSection to Arguments tab
   - Wire deliberationId prop
   - Style to match tab aesthetic

3. **Add burden of proof badges** (~2 hours)
   - Update CQ display to show burden indicators
   - Add tooltips explaining burden
   - Use BurdenOfProofIndicators component

**Estimated Total**: 8 hours

### Week 6: Attack Generation Integration

**Goal**: Transform Arguments tab into strategic attack platform

**Tasks**:
1. **Add Attack Suggestions flow** (~6 hours)
   - Add "Generate Attack" button to argument cards
   - Integrate AttackSuggestions component
   - Wire to AttackConstructionWizard
   - Handle attack creation and refresh

2. **Update ArgumentActionsSheet** (~3 hours)
   - Add attack suggestions to existing actions
   - Show CQ-based attack options
   - Rank by strategic value

3. **Add visual indicators** (~1 hour)
   - Badge multi-scheme arguments
   - Show attack opportunity indicators
   - Highlight high-value attack targets

**Estimated Total**: 10 hours

### Week 7: Scheme Navigation & Support

**Goal**: Complete the argumentation toolkit

**Tasks**:
1. **Replace scheme picker** (~4 hours)
   - Use SchemeNavigator in AIFArgumentWithSchemeComposer
   - Add dialog wrapper
   - Test all navigation modes

2. **Add SchemesSection** (~2 hours)
   - Add as new collapsible section in Arguments or Admin
   - Educational browsing mode
   - Link to scheme usage in deliberation

3. **Add Support Suggestions** (~4 hours)
   - Similar flow to attack suggestions
   - Target friendly claims
   - Evidence matching guidance

**Estimated Total**: 10 hours

### Week 8: Polish & Advanced Features

**Goal**: Add power-user features and refinements

**Tasks**:
1. **Net visualization enhancements** (~3 hours)
   - Improve graph layouts
   - Add filtering/highlighting
   - Performance optimization

2. **Evidence integration** (~3 hours)
   - Wire EvidenceGuidance to composition
   - Evidence mapper in relevant contexts
   - Link to EvidenceList

3. **Analytics integration** (~2 hours)
   - Add net metrics to Analytics tab
   - Scheme usage statistics
   - Attack/defense ratios

**Estimated Total**: 8 hours

---

## Total Effort Estimate

| Phase | Weeks | Hours | Risk |
|-------|-------|-------|------|
| Week 5: Arguments Enhancement | 1 week | 8h | Low |
| Week 6: Attack Generation | 1 week | 10h | Medium |
| Week 7: Navigation & Support | 1 week | 10h | Low |
| Week 8: Polish & Advanced | 1 week | 8h | Low |
| **Total** | **4 weeks** | **36h** | **Low-Medium** |

**Risk Assessment**:
- ✅ All components already built and tested
- ✅ APIs fully functional
- ⚠️ Integration complexity in ArgumentsTab (many features)
- ⚠️ User workflow changes (need guidance/onboarding)
- ✅ Can be done incrementally (feature flags if needed)

---

## API Endpoints Summary

### Phase 0-1: Nets & CQs
```
POST /api/nets/detect
GET  /api/nets/[id]
GET  /api/nets/[id]/dependencies
GET  /api/nets/[id]/explicitness
GET  /api/nets/[id]/reconstruction
GET  /api/nets/[id]/cqs
POST /api/nets/[id]/cqs/answer
POST /api/nets/[id]/confirm
GET  /api/arguments/[id]/scheme-net
POST /api/arguments/[id]/scheme-net/steps
```

### Phase 2: Schemes
```
GET /api/schemes/all  (includes cluster/dichotomic metadata)
GET /api/schemes/[id]
```

### Phase 3: Attack Generation
```
POST /api/arguments/suggest-attacks
POST /api/attacks/create
POST /api/attacks/undercut
GET  /api/attacks
```

---

## Component Inventory Summary

### By Directory

**`components/argumentation/`** (Phase 3 & 4):
- ArgumentNetAnalyzer ✅
- AttackSuggestions ✅
- AttackConstructionWizard ✅
- AttackPreviewSubmission ✅
- SupportSuggestions ✅
- SupportConstructionWizard ✅
- ArgumentConstructionFlow ✅
- ArgumentConstructor ✅
- EvidenceGuidance ✅
- EvidenceMatchingVisualizer ✅
- EvidenceSchemeMapper ✅
- TemplateLibrary ✅
- BatchArgumentGenerator ✅
- BurdenOfProofIndicators ✅

**`components/schemes/`** (Phase 2):
- SchemeNavigator ✅
- DichotomicTreeWizard ✅
- ClusterBrowser ✅
- IdentificationConditionsFilter ✅
- SchemeSearch ✅
- + 18 supporting components ✅

**`components/deepdive/v3/sections/`** (Ready for V3):
- NetworksSection ✅
- SchemesSection ✅

**`components/arguments/`** (Phase 1 & 4):
- SchemeNetVisualization ✅
- ComposedCQsModal ✅
- SchemeAnalyzer ✅ (uses ArgumentNetAnalyzer)

**`components/cqs/`** (Phase 1):
- ComposedCQPanel ✅

**`components/nets/visualization/`** (Phase 4):
- NetGraphWithCQs ✅

---

## Key Insights

### What This Means for DeepDivePanel V3

1. **We're NOT starting from scratch** - we have a complete argumentation platform ready to integrate

2. **V2 is missing major features** - the overhaul created sophisticated tools that aren't exposed to users yet

3. **V3 redesign is the perfect time** - clean architecture makes integration much easier than retrofitting V2

4. **4 weeks of integration work** unlocks months of already-completed development

5. **Incremental integration possible** - can add features one at a time, no big-bang required

### Architecture Alignment

**The V3 tab structure maps perfectly to overhaul phases**:

- **Arguments Tab** → Phases 1, 3, 4 (nets, attacks, analysis)
- **Debate Tab** → Phase 3 (support suggestions)
- **Admin Tab** → Phase 0, 2 (burden config, scheme navigation)
- **Analytics Tab** → Phase 1, 4 (net metrics)
- **Sources Tab** → Phase 3 (evidence guidance)

**v3/sections/ directory** already has NetworksSection and SchemesSection ready!

### User Impact

**Before Integration** (Current V2):
- Manual argument construction
- Single-scheme view only
- No attack guidance
- Limited scheme discovery
- Static CQ lists

**After Integration** (V3 with overhaul):
- AI-assisted attack generation
- Multi-scheme net analysis
- Strategic CQ suggestions with burden info
- Intelligent scheme navigation (4 modes)
- Interactive net visualization
- Evidence-aware composition

---

## Next Steps

### Immediate Actions

1. ✅ **Complete this audit** (DONE)
2. **Review with stakeholders** - confirm integration priorities
3. **Update V3 migration plan** - add overhaul integration to weeks 5-8
4. **Create feature flags** - allow gradual rollout if needed
5. **Plan user onboarding** - these are sophisticated features

### Documentation Needed

- [ ] User guide for attack generation
- [ ] Tutorial for scheme navigation modes
- [ ] Video explaining argument nets
- [ ] Admin guide for burden of proof configuration
- [ ] API documentation for new endpoints

### Testing Strategy

- [ ] Integration tests for each component in tab context
- [ ] E2E tests for full attack generation flow
- [ ] Performance testing with large nets
- [ ] User acceptance testing with real deliberations

---

## Conclusion

**The Deliberation System Overhaul is DONE and ready for integration.**

Phases 0-4 represent a **complete transformation** of Mesh's argumentation capabilities, from basic argument tracking to an intelligent, theory-grounded argumentation platform. The components are **production-ready**, the APIs are **tested**, and the architecture **aligns perfectly** with the V3 redesign.

**The V3 migration is the ideal time to integrate these features.** The clean tab architecture, extracted components, and systematic approach make integration straightforward. We can add sophisticated argumentation features **without complexity** because the hard work is already done.

**Recommendation**: Proceed with integration in Weeks 5-8 of V3 migration, following the priority matrix above. Start with ArgumentNetAnalyzer and NetworksSection (highest impact, lowest effort), then add attack generation (transformative UX), then navigation enhancements.

**Expected Outcome**: DeepDivePanel V3 becomes the most sophisticated argumentation interface in Mesh, fully leveraging years of argumentation theory research and months of implementation work.

---

**Document Status**: ✅ Complete  
**Next Review**: After stakeholder discussion  
**Owner**: DeepDivePanel V3 Migration Team
