# Deliberation System Overhaul - Implementation Plan Part 2
## Core Architecture: Multi-Scheme Arguments & Dependencies

**Date**: November 8, 2025  
**Status**: Implementation Roadmap - Part 2  
**Prerequisite**: Part 1 (Phase 0) completed  
**Scope**: Phases 1-2 - Fundamental architectural transformation

---

## Part 2 Overview

This document covers the **most critical architectural changes** identified in the strategy document:

- **Phase 1**: Multi-Scheme Arguments (ArgumentNet model)
- **Phase 2**: Dependencies & Explicitness Tracking

These phases transform Mesh from **single-scheme argument tracking** to **multi-scheme argument nets**, enabling representation of real argumentation as described in Section 7 of the research.

### Why These Phases Are Critical

From strategy document Part 4:
> "Current Mesh `Argument` model with single `schemeId` is architecturally insufficient. Real arguments instantiate multiple schemes in interdependent nets."

Without this transformation, we cannot accurately model real-world arguments like the Hague speech example (classification → commitment → consequences).

### Phase Dependencies

```
Phase 0 (Foundation) 
    ↓
Phase 1 (ArgumentNet Model) ← YOU ARE HERE
    ↓
Phase 2 (Dependencies & Explicitness)
    ↓
Phase 3 (Navigation)
    ↓
Phase 4 (Generation)
```

**Estimated Total Time**: 4-5 weeks (160-200 hours)

---

---
---

# Phase 2: Dependencies & Explicitness (80 hours, 2 weeks)

**Goal**: Complete the ArgumentNet model by adding dependency tracking, visualization, and explicitness styling throughout the UI. This phase transforms multi-scheme arguments from a collection of schemes into a structured **argumentative network** with explicit relationships.

**Research Foundation**: Macagno & Walton (2017) - "Practical Reasoning Arguments: A Modular Approach"
- Premise-conclusion dependencies
- Presuppositional structures
- Sequential reasoning chains
- Support vs justificational roles

**User Value**:
- See how schemes connect to form coherent arguments
- Understand implicit vs explicit reasoning
- Recognize common argument patterns
- Validate argument structure

**Technical Scope**:
- Dependency graph visualization
- Automatic dependency detection
- Global explicitness styling system
- Pattern recognition and matching
- Net validation rules
- Enhanced testing and documentation


## Phase 2.1: Dependency Graph Visualization (16 hours)

**Goal**: Create interactive graph component showing ArgumentSchemeInstances as nodes and ArgumentDependencies as edges.

**Key Deliverables**:
- `ArgumentNetGraph.tsx` - React Flow component with hierarchical/force-directed layouts
- `DependencyDetailModal.tsx` - Shows dependency details on edge click
- Integration into `ArgumentDetailsPanel` with "Network View" tab
- API endpoint `/api/arguments/[id]/dependencies` with cycle detection
- Mini-map for navigation, legend for dependency types

**Implementation Steps**:
1. Install React Flow library (`yarn add reactflow`)
2. Create ArgumentNetGraph component (6 hours)
   - Node styling by role (blue=primary, green=supporting, purple=presupposed)
   - Border styling by explicitness (solid/dashed/dotted)
   - Edge styling by dependency type with Unicode symbols (⟶ ⊨ ↗ ∵ →)
   - Layout algorithms (hierarchical arranges by order, force-directed spreads evenly)
3. Integrate into ArgumentDetailsPanel (3 hours)
   - Add "Network View" tab alongside "Schemes" and "CQs"
   - Click scheme → highlight in network view
   - Click node → show details
4. Create DependencyDetailModal (3 hours)
   - Show dependency type, description, justification
   - Warn for implicit dependencies
   - Display source/target schemes
5. Update types for ArgumentDependency (1 hour)
6. Add API endpoint with validation (2 hours)
   - POST /api/arguments/[id]/dependencies
   - Validate instances belong to argument
   - Check for circular dependencies (BFS algorithm)
   - Return created dependency with relations

**Testing**:
- Unit tests for ArgumentNetGraph (render, click handlers, highlighting)
- API tests for dependency creation and cycle detection
- Visual regression tests for graph rendering

**Acceptance Criteria**:
- [ ] Graph renders nodes and edges correctly
- [ ] Click handlers work for navigation
- [ ] Layouts arrange schemes logically
- [ ] Cycle detection prevents invalid dependencies
- [ ] All tests passing

**Time**: 16 hours | **Complexity**: Medium | **Risk**: Low

---

## Phase 2.2: Automatic Dependency Detection (12 hours)

**Goal**: Implement inference algorithm that automatically detects likely dependencies between schemes, reducing manual work.

**Key Deliverables**:
- `server/services/dependencyInference.ts` - 5 pattern detection algorithms
- `DependencySuggestionsPanel.tsx` - UI for accepting/rejecting suggestions
- API endpoint `/api/arguments/[id]/dependencies/infer`
- Integration into ArgumentSchemeManagementPanel

**Inference Patterns**:
1. **Premise-Conclusion Chains** (confidence 0.7-1.0)
   - Match scheme A's conclusion to scheme B's premise using textual similarity
   - `calculateSimilarity()` uses word overlap
   - Example: "X is true" (conclusion) → "X is true" (premise)

2. **Presuppositional Dependencies** (confidence 0.9)
   - Role-based: presupposed schemes → primary scheme
   - Automatically inferred from role assignment

3. **Support Relationships** (confidence 0.85)
   - Role-based: supporting schemes → primary scheme
   - Provides additional evidence

4. **Sequential Reasoning** (confidence 0.7)
   - Order-based: consecutive non-primary schemes form chains
   - Scheme[i] → Scheme[i+1]

5. **Justificational Dependencies** (confidence 0.8)
   - Scheme-type based: Expert Opinion, Authority, Witness → other schemes
   - Provides justification for claims

**Implementation Steps**:
1. Create dependency inference service (5 hours)
   - `inferDependencies()` - main entry point
   - 5 pattern detection functions
   - `parseFormalStructure()` - extract premises/conclusions
   - `findStructuralMatch()` - textual similarity scoring
   - Deduplication and confidence sorting
2. Create DependencySuggestionsPanel UI (4 hours)
   - Display suggestions with confidence scores
   - Accept/reject buttons
   - Batch dismiss
   - Color-coded by dependency type
3. Add inference API endpoint (2 hours)
   - GET /api/arguments/[id]/dependencies/infer
   - Returns sorted suggestions
4. Integrate into editing flow (1 hour)
   - Show suggestions after adding 2+ schemes
   - Accept → create ArgumentDependency with `isExplicit: false`
   - Justification from inference reason

**Testing**:
- Unit tests for each pattern detection algorithm
- Integration tests for inference service
- E2E tests for suggestion acceptance flow

**Acceptance Criteria**:
- [ ] All 5 patterns detect correctly
- [ ] Suggestions sorted by confidence
- [ ] UI allows accept/reject with feedback
- [ ] Accepted suggestions create dependencies
- [ ] Inferred dependencies marked as implicit
- [ ] All tests passing

**Time**: 12 hours | **Complexity**: High | **Risk**: Medium (false positives possible)

---

## Phase 2.3: Global Explicitness Styling (12 hours)

**Goal**: Establish consistent visual language for explicitness levels (explicit/presupposed/implied) across all components.

**Key Deliverables**:
- `styles/explicitness.css` - Global CSS utility classes
- `lib/explicitnessUtils.ts` - Helper functions
- Updated ArgumentCard, MultiSchemeBadge with explicitness borders
- `ExplicitnessFilter.tsx` - Filter UI component
- `ExplicitnessLegend.tsx` - Explanatory popover

**Visual Language**:
- **Explicit**: Solid borders (●), normal font, 100% opacity
- **Presupposed**: Dashed borders (◐), italic font, 75% opacity  
- **Implied**: Dotted borders (○), italic font, 50% opacity

**Implementation Steps**:
1. Create explicitness utilities (2 hours)
   - CSS classes: `.explicitness-explicit/presupposed/implied`
   - Helper functions: `getExplicitnessBorderClass()`, `getExplicitnessIcon()`, etc.
   - Descriptions for each level
2. Update ArgumentCard component (2 hours)
   - Apply explicitness border to card
   - Show explicitness icon
   - Warning for implicit arguments
3. Update MultiSchemeBadge component (2 hours)
   - Add explicitness borders to badges
   - Include explicitness icon
4. Create ExplicitnessFilter component (3 hours)
   - Checkbox for each level
   - Icons and labels
   - Filter arguments by primary scheme explicitness
5. Create ExplicitnessLegend component (2 hours)
   - Popover with "Understanding Explicitness" guide
   - Visual examples (border styles)
   - Tip about finding implicit reasoning
6. Update ArgumentList with filter (1 hour)
   - Sidebar with ExplicitnessFilter
   - Header with ExplicitnessLegend button
   - Filter applied to displayed arguments

**Testing**:
- Unit tests for utility functions
- Visual regression tests for styling
- Component tests for filter functionality

**Acceptance Criteria**:
- [ ] Consistent explicitness styling across all components
- [ ] Filter works correctly
- [ ] Legend explains visual language
- [ ] Warning shown for implicit arguments
- [ ] All tests passing

**Time**: 12 hours | **Complexity**: Low | **Risk**: Low (visual changes)

---

## Phase 2.4: Pattern Recognition (16 hours)

**Goal**: Identify and suggest common ArgumentNet patterns (policy arguments, legal precedents, etc.).

**Key Deliverables**:
- `SchemeNetPattern` seeding script with 10+ common patterns
- `matchPattern()` function in dependencyInference service
- Pattern badge/indicator in UI
- Pattern suggestion during argument creation
- Pattern library browser

**Common Patterns to Seed**:
1. **Policy Argument** (PR + Values + Consequences)
2. **Legal Precedent** (Case-to-Case + Authority + Analogy)
3. **Scientific Argument** (Sign + Expert + Correlation)
4. **Value-Based PR** (Values + PR)
5. **Slippery Slope** (Consequences chains)
6. **Ethical Dilemma** (Values + Consequences + Counterargument)
7. **Historical Analogy** (Example + Case-to-Case + Authority)
8. **Causal Chain** (Sign + Cause-to-Effect sequences)
9. **Burden Shift** (PR + Negative Consequences + Authority)
10. **Compromise** (Multiple Values + Multiple PR)

**Implementation Steps**:
1. Seed SchemeNetPattern table (3 hours)
   - Define 10+ patterns with:
     - `name`, `description`, `domain`
     - `schemeIds[]` - typical schemes used
     - `typicalStructure` - JSON with roles and dependencies
     - `usageCount` - track adoption
2. Create pattern matching algorithm (5 hours)
   - `matchPattern()` - compare argument structure to patterns
   - Scoring: scheme overlap + dependency similarity + role alignment
   - Return ranked matches with confidence scores
3. Create PatternBadge component (2 hours)
   - "This argument uses [Pattern Name]" indicator
   - Click to see pattern details
   - Confidence meter
4. Add pattern suggestion to creation flow (3 hours)
   - After adding 2+ schemes, suggest matching patterns
   - "Complete this pattern?" prompt
   - One-click to add remaining schemes
5. Create pattern library browser (3 hours)
   - Browse all patterns by domain
   - See example arguments
   - Filter by scheme types
   - Usage statistics

**Testing**:
- Unit tests for pattern matching algorithm
- Integration tests for pattern suggestions
- E2E tests for pattern-based creation

**Acceptance Criteria**:
- [ ] 10+ patterns seeded with correct structures
- [ ] Matching algorithm scores accurately
- [ ] UI shows pattern badges
- [ ] Suggestions work during creation
- [ ] Pattern library browsable
- [ ] All tests passing

**Time**: 16 hours | **Complexity**: Medium | **Risk**: Medium (pattern definitions)

---

## Phase 2.5: Net Validation (12 hours)

**Goal**: Implement validation rules to ensure ArgumentNet structural integrity.

**Key Deliverables**:
- `server/services/netValidation.ts` - Validation rules engine
- Real-time validation during editing
- Validation dashboard for admins
- Auto-fix suggestions

**Validation Rules**:
1. **No Circular Dependencies**: Cycles break logical flow
2. **Supporting Schemes Have Targets**: All supporting schemes must support something
3. **Presupposed Schemes Have Dependents**: Presuppositions must be used
4. **Explicit Dependencies Have Justification**: User must explain explicit connections
5. **Primary Scheme Exists**: Every argument needs a primary inference
6. **Orphaned Schemes**: No schemes disconnected from the net (except primary)
7. **Dependency Type Consistency**: Edge types match scheme roles

**Implementation Steps**:
1. Create validation service (6 hours)
   - `validateArgumentNet()` - main entry point
   - Individual rule validators (7 functions)
   - `ValidationResult` type with errors/warnings
   - Severity levels (error, warning, info)
2. Add real-time validation to UI (4 hours)
   - Validate on scheme add/remove/edit
   - Show errors in editing panel
   - Block save if critical errors
   - Allow warnings with confirmation
3. Create auto-fix suggestions (2 hours)
   - "Remove orphaned scheme X"
   - "Add justification for dependency Y"
   - "Convert presupposed role to supporting"
   - One-click fixes where possible

**Testing**:
- Unit tests for each validation rule
- Integration tests for validation service
- E2E tests for error display and auto-fix

**Acceptance Criteria**:
- [ ] All 7 validation rules implemented
- [ ] Real-time validation during editing
- [ ] Errors displayed with helpful messages
- [ ] Auto-fix suggestions work
- [ ] Critical errors block save
- [ ] All tests passing

**Time**: 12 hours | **Complexity**: Medium | **Risk**: Low (clear rules)

---

## Phase 2.6: Testing & Documentation (12 hours)

**Goal**: Comprehensive testing and documentation for Phase 2 features.

**Key Deliverables**:
- Unit tests for all Phase 2 services
- Integration tests for API endpoints
- E2E tests for user workflows
- Performance tests for inference and validation
- User documentation for dependencies and patterns
- Developer documentation for extending patterns

**Testing Scope**:

**Unit Tests** (4 hours):
- `dependencyInference.test.ts` - All 5 pattern detectors
- `netValidation.test.ts` - All 7 validation rules
- `explicitnessUtils.test.ts` - Utility functions
- `patternMatching.test.ts` - Pattern algorithm

**Integration Tests** (3 hours):
- API endpoint tests with mocked Prisma
- Dependency creation with cycle detection
- Inference endpoint with various argument structures
- Validation endpoint with rule checking

**E2E Tests** (3 hours):
- Create multi-scheme argument → see suggestions → accept → verify dependency
- View network graph → click edge → see details
- Filter by explicitness → verify results
- Match pattern → complete pattern → verify structure

**Performance Benchmarks** (1 hour):
- Inference: <100ms for 6-scheme argument
- Validation: <50ms for complex net
- Graph rendering: <500ms for 10-node net
- Pattern matching: <200ms for 10 patterns

**Documentation** (1 hour):
- User guide: Understanding Dependencies, Patterns, and Explicitness
- Developer guide: Adding new patterns, extending inference
- Admin guide: Reviewing nets, seeding patterns

**Acceptance Criteria**:
- [ ] 90%+ test coverage for Phase 2 code
- [ ] All performance benchmarks met
- [ ] User documentation published
- [ ] Developer documentation complete
- [ ] All tests passing in CI

**Time**: 12 hours | **Complexity**: Low | **Risk**: Low

---

## Phase 2 Summary

**Total Effort**: 80 hours (2 weeks)

**Deliverables**:
- ✅ Interactive dependency graph with React Flow
- ✅ Automatic dependency detection (5 patterns)
- ✅ Global explicitness styling system
- ✅ Pattern recognition and matching (10+ patterns)
- ✅ Net validation rules (7 rules)
- ✅ Comprehensive testing and documentation

**User Value**:
- **Understand Structure**: See how schemes connect in argumentative networks
- **Save Time**: Automatic dependency detection reduces manual work
- **Identify Implicit Reasoning**: Explicitness styling reveals assumptions
- **Leverage Patterns**: Recognize and use common argument structures
- **Ensure Validity**: Validation catches structural errors

**Technical Value**:
- **Complete ArgumentNet Model**: Structure (Phase 1) + Semantics (Phase 2)
- **Foundation for Visualization**: Dependency data enables advanced graph features
- **Research Alignment**: Implements Macagno & Walton presuppositional structures
- **Extensible Patterns**: Easy to add new patterns and inference rules

**Next Steps**:
After Phase 2, the ArgumentNet model is complete. Recommended next phases:
- **Phase 3**: Multi-Entry Navigation (Weeks 5-8) - Dichotomic tree, cluster browser
- **Phase 4**: Argument Generation (Weeks 9-12) - Attack/support suggestions, construction wizard
- **Phase 5**: Advanced Visualization (Weeks 13-16) - Multi-net analysis, comparative views

---

## Phase 2 Deployment Checklist

### Pre-Deployment
- [ ] All Phase 2.1-2.6 tests passing
- [ ] Performance benchmarks met (<100ms inference, <50ms validation)
- [ ] Dependency graph renders correctly for 10+ node nets
- [ ] Pattern library seeded with 10+ patterns
- [ ] Validation rules tested with edge cases
- [ ] Feature flags configured for gradual rollout
- [ ] User documentation published
- [ ] Team training on dependencies and patterns

### Deployment (Days 31-40)

**Stage 1: Internal Testing (Days 31-32)**
- [ ] Deploy to dev environment
- [ ] Test with internal arguments (5-10 complex cases)
- [ ] Verify inference accuracy (>80% useful suggestions)
- [ ] Check validation catches errors
- [ ] Performance testing with production data

**Stage 2: Beta Release (Days 33-35)**
- [ ] Enable for 20-30 beta users
- [ ] Monitor inference acceptance rate (target >50%)
- [ ] Track pattern usage
- [ ] Collect qualitative feedback
- [ ] Fix critical bugs

**Stage 3: Gradual Rollout (Days 36-40)**
- [ ] Day 36: 25% of users
- [ ] Day 37: 50% of users
- [ ] Day 38: 75% of users
- [ ] Day 39: 100% of users
- [ ] Day 40: Remove feature flags

### Post-Deployment
- [ ] Monitor key metrics for 1 week:
  - Dependency creation rate (manual + auto)
  - Inference acceptance rate (target >50%)
  - Pattern match accuracy
  - Validation error frequency
  - Graph view engagement
- [ ] Address user feedback
- [ ] Write postmortem
- [ ] Plan Phase 3 (Multi-Entry Navigation)

---

## Phase 2 Success Metrics

### Technical Metrics

**Performance**:
- [ ] Dependency inference: <100ms P95
- [ ] Net validation: <50ms P95
- [ ] Graph rendering: <500ms for 10 nodes
- [ ] Pattern matching: <200ms P95

**Reliability**:
- [ ] Inference accuracy: >80% useful suggestions
- [ ] Validation false positive rate: <5%
- [ ] Graph rendering success: >99%
- [ ] API error rate: <0.5%

### User Metrics

**Adoption**:
- [ ] % arguments with dependencies: >40%
- [ ] Avg dependencies per argument: 2-4
- [ ] Inference acceptance rate: >50%
- [ ] Pattern usage rate: >20% of multi-scheme args

**Engagement**:
- [ ] Network view open rate: >30%
- [ ] Explicitness filter usage: >15%
- [ ] Pattern library visits: >10% of users
- [ ] Dependency editing: >25% of multi-scheme args

**Quality**:
- [ ] % arguments with validated nets: >90%
- [ ] % implicit dependencies justified: >70%
- [ ] % pattern matches accurate: >85%
- [ ] Validation error fix rate: >95%

---

**Phase 2 Complete!**

With Phase 2 complete, the ArgumentNet model is fully implemented:
- **Phase 1**: Multi-scheme arguments (structure)
- **Phase 2**: Dependencies & explicitness (semantics)

**Ready for**: Phase 3 (Multi-Entry Navigation) - Help users discover and compose schemes through dichotomic trees, cluster browsing, and identification conditions.

---

*End of Phase 2. Ready for Phase 3 when you're ready.*

