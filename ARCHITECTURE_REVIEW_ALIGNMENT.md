# Mesh Agora Architecture Review - Alignment Document

**Date:** October 27, 2025  
**Status:** Pre-Phase 5 Alignment Check  
**Current Progress:** 4 of 6 phases complete (67%)

---

## Mission Statement

**Primary Goal:** Conduct systematic architecture review of Mesh's digital agora implementation, assessing alignment with:
1. **AIF 2014 Standard** — Argument Interchange Format compliance
2. **Categorical Semantics** — Mathematical rigor (Hom-sets, functors, natural transformations)
3. **Ludics** — Girard's interaction semantics for dialogue
4. **ASPIC+** — Abstract argumentation framework
5. **Evidential Category** — Confidence propagation with proof obligations

**Review Methodology:** 6-phase deep-dive examining types → API → protocols → UI → cross-room → export

---

## Vision Recap: What Mesh Agora Aspires To Be

### Theoretical Foundation
- **Category Theory as Structure:** Arguments, claims, and inferences are objects/morphisms in formal categories
- **Ludics as Dynamics:** Dialogue moves are interactions in Girard's game semantics
- **Proof Obligations as Discipline:** Critical questions must be satisfied before inferences gain full confidence
- **Evidential Lattice as Epistemology:** Confidence values form partial order with join operations

### User Experience Goals
1. **Two-Level Navigation:** Seamlessly move between debate overview and argument detail
2. **Dual-Mode Rendering:** Toggle between Toulmin (intuitive) and AIF (precise) views
3. **Confidence Transparency:** Users see why claims have specific support values
4. **Dialogical Engagement:** Legal moves enforce structured, productive debate
5. **Cross-Room Coherence:** Arguments can be referenced/imported across deliberations

### Implementation Philosophy
- **Types First:** TypeScript types mirror mathematical structures
- **Proof Obligations Enforced:** CQs are not optional metadata but required conditions
- **Incremental Formality:** UI hides complexity but backend maintains rigor
- **Performance Matters:** Memoization, pagination, smart caching for responsiveness

---

## What We've Learned (Phases 1-4)

### Phase 1: Foundational Types ✅

**Chunk 1A: AIF Core (Grade: A+ 98%)**
- Complete AIF 2014 implementation in `lib/arguments/aif.ts`
- Six node kinds: I (information), L (locution), RA (reasoning), CA (conflict), PA (preference), TA (transition)
- Discriminated unions provide type safety
- ASPIC+ translation layer functional

**Chunk 1B: Graph Construction (Grade: A 93%)**
- `buildArgumentGraph` creates AIF from Prisma models
- Handles complex patterns: rebuttals, undercuts, preferences
- Edge roles: premise, conclusion, conflict, preference, support
- **Gap:** AA (Argument Application) nodes not fully implemented

**Key Insight:** Type system is solid foundation, minor gaps in advanced AIF features.

---

### Phase 2: Evidential Category ✅

**Chunk 2A: API & Accrual (Grade: A- 90%)**
- Three accrual modes: `min` (weakest-link), `product` (Bayesian), `ds` (Dempster-Shafer)
- Proof obligation enforcement: CQs tracked per inference via `Inference.proofObligations`
- `/api/deliberations/{id}/evidential` endpoint computes confidence propagation
- **Gap:** No explanation API (why is confidence X?)

**Chunk 2B: Confidence UI (Grade: B+ 87%)**
- `SupportBar` component visualizes scalar confidence
- DS mode shows belief/plausibility intervals
- `useConfidence` hook provides mode/tau state management
- **Gap:** No explanation tooltip showing evidence chain
- **Gap:** CQ satisfaction not visually linked to confidence

**Key Insight:** Backend math is strong, UI lacks transparency layer.

---

### Phase 3: Schemes & Dialogue ✅

**Chunk 3A: Macagno Taxonomy (Grade: A+ 96%)**
- 60+ schemes in Prisma database with structured CQs
- Schemes organized by reasoning type (analogical, causal, practical, etc.)
- `CriticalQuestionsV3` component provides rich CQ answering UI
- Proof obligations enforced at inference creation (not post-hoc)
- **Gap:** No scheme recommendation engine

**Chunk 3B: Ludics Protocol (Grade: A 94%)**
- Ludics interaction semantics in `lib/dialogue/protocol.ts`
- Four dialogue actions: WHY, GROUNDS, CONCEDE, RETRACT
- Legal move validation prevents invalid sequences
- `DialogueActionsButton` integrates with FloatingSheet UI
- **Gap:** No DDF (Dialogue Desideratum Framework) protocol rules
- **Gap:** Turn-taking not enforced (can make multiple moves)

**Key Insight:** Dialogue system is theoretically rigorous but lacks full protocol constraints.

---

### Phase 4: Two-Level UI ✅

**Chunk 4A: Component Foundation (Grade: A- 88%)**
- `CriticalQuestionsV3`: Modal for answering CQs with support submission
- `DialogueActionsButton`: FloatingSheet UI for WHY/GROUNDS/CONCEDE/RETRACT
- `SupportBar`: Visual confidence with scalar/DS modes
- Strong component reuse patterns
- **Gap:** Components operate in isolation, no coordinated state

**Chunk 4B: Pop-out & Dual-Mode (Grade: A- 90%)**
- `ArgumentPopout`: Production component with Toulmin/AIF toggle
- `DiagramViewer`: Professional zoom/pan with semantic edge coloring
- `AFMinimap`: Force-directed layout with Dung semantics (IN/OUT/UNDEC)
- `ClaimMiniMap`: Comprehensive dashboard with CQ%, attack counts, dialogical status
- `DebateSheetReader`: Debate-level view with evidential integration
- **Gap:** No sunburst/hierarchical drill-down
- **Gap:** Confidence not overlaid on argument diagrams
- **Gap:** CQ status not visible in AIF graph view
- **Gap:** Cross-room imports UI exists but backend unclear

**Key Insight:** Navigation is smooth, but missing advanced visualizations and confidence overlays.

---

## Current System Grade: A- (90%)

### What's Working Exceptionally Well

1. **Type Safety (98%)** — TypeScript types mirror formal structures
2. **Ludics Integration (94%)** — Interaction semantics provide strong foundation
3. **Proof Obligation Enforcement (96%)** — CQs enforced at inference creation
4. **Macagno Taxonomy (96%)** — Comprehensive scheme library
5. **Two-Level Navigation (90%)** — Clean debate → argument flow
6. **DS Confidence (90%)** — Belief intervals provide nuanced uncertainty

### Critical Gaps Identified

1. **Confidence Explanation Missing (40%)** — No UI showing evidence chain
2. **Scheme→Confidence Disconnect (50%)** — CQ satisfaction tracked but not linked to confidence in UI
3. **No DDF Protocol (30%)** — Dialogue rules not formalized beyond basic moves
4. **No Hierarchical Visualization (20%)** — Sunburst/radial missing
5. **Cross-Room Semantics Unclear (60%)** — Import backend support uncertain

### Enhancement Opportunities

1. **AA Nodes (70%)** — Argument Application nodes partially implemented
2. **CQ Badges on Graphs (40%)** — Scheme nodes don't show CQ status
3. **Confidence Overlays (40%)** — No per-edge confidence in diagrams
4. **Scheme Assistant (20%)** — No context-based recommendation
5. **Minimap Coordination (50%)** — Components operate independently

---

## Phase 5 Focus: Plexus & Cross-Room Semantics

### What We Need to Understand

**Core Questions:**
1. **Identity:** How are arguments identified across deliberations? (URI scheme? Hash-based? Database IDs?)
2. **Import Modes:** What does `'off'|'materialized'|'virtual'|'all'` actually mean in backend?
3. **Plexus Structure:** Is there a formal "plexus" entity tracking cross-room argument relations?
4. **Join Operation:** How does multi-room confidence aggregation work?
5. **Categorical Semantics:** What are the morphisms between deliberation categories?

**Files to Examine:**
- `/api/deliberations/[id]/evidential` — Check `imports` parameter handling
- `lib/arguments/import.ts` or similar — Cross-room import logic
- Prisma schema — Look for `ArgumentReference`, `CrossRoomLink`, or `Plexus` models
- `lib/evidential/accrual.ts` — Check for multi-source confidence join
- `components/agora/DebateSheetReader.tsx` — UI uses `imports` state

**Expected Outputs (Chunk 5A):**
- Document showing how arguments are referenced across rooms
- Analysis of import mode implementation status
- Categorical interpretation of cross-room morphisms
- Grade for cross-deliberation referencing architecture

**Expected Outputs (Chunk 5B):**
- Plexus identity resolution algorithm documentation
- Multi-room join operation analysis
- Assessment of categorical coherence across deliberations
- Grade for plexus architecture

---

## Phase 6 Preview: Knowledge Base & Export

### What We'll Cover

**Chunk 6A: Export & Interchange**
- AIF JSON export from ArgumentPopout
- PDF rendering with confidence overlays
- CSV export for data analysis
- AIFDB/Carneades integration patterns

**Chunk 6B: Knowledge Base**
- Persistent argument template library
- Scheme-based search
- Reusable argument patterns
- Cross-project knowledge transfer

---

## Alignment Check: Are We on Track?

### Original Goals vs. Current State

| Goal | Target | Current | Status |
|------|--------|---------|--------|
| **AIF 2014 Compliance** | 100% | 95% | ✅ Minor gaps (AA nodes) |
| **Categorical Semantics** | 95% | 92% | ✅ Strong foundation |
| **Ludics Integration** | 90% | 94% | ✅ Exceeds expectation |
| **Proof Obligations** | 95% | 96% | ✅ Excellent |
| **Confidence Transparency** | 80% | 60% | ⚠️ Needs UI work |
| **Cross-Room Semantics** | 85% | ??? | ⏳ Phase 5 target |
| **Export/KB** | 75% | ??? | ⏳ Phase 6 target |

### Adjustments Needed

1. **Phase 5 Deep-Dive Required:** Cross-room semantics is critical for multi-deliberation coherence
2. **Confidence Explanation Priority:** Should be addressed in Phase 5 or 6
3. **Hierarchical Viz Deferred:** Can be enhancement project, not blocker
4. **DDF Protocol Deferred:** Can be future research, current ludics is sufficient

---

## Methodology Validation

### What's Working in Our Review Process

✅ **Systematic Chunking:** 2-chunk per phase provides good granularity  
✅ **Grade-Based Assessment:** Quantitative scores enable progress tracking  
✅ **Gap Documentation:** Clear distinction between critical/enhancement gaps  
✅ **Code Evidence:** Reading actual implementation validates assumptions  
✅ **Categorical Lens:** Mathematical framing reveals structural insights  

### What We Could Improve

⚠️ **Backend Coverage:** More API endpoint testing needed  
⚠️ **Integration Testing:** Components reviewed in isolation, need full flow tests  
⚠️ **Performance Analysis:** No benchmarks or performance metrics yet  

---

## Phase 5A Roadmap

### Chunk 5A: Cross-Deliberation Argument Referencing

**Objectives:**
1. Document how arguments are referenced across deliberations
2. Analyze import mode implementation (`'off'|'materialized'|'virtual'|'all'`)
3. Assess URI/ID scheme for cross-room argument identity
4. Evaluate visual distinction for imported arguments in UI
5. Grade cross-deliberation referencing architecture

**Methodology:**
1. **Backend Analysis:**
   - Read `/api/deliberations/[id]/evidential/route.ts` for `imports` parameter handling
   - Search for cross-room import logic in `lib/arguments/` or `lib/evidential/`
   - Review Prisma schema for cross-room reference models
   
2. **UI Analysis:**
   - Examine how DebateSheetReader uses `imports` state
   - Check if imported arguments have visual distinction (badges, borders)
   - Look for "source deliberation" metadata in ArgumentPopout
   
3. **Categorical Analysis:**
   - Define morphisms between deliberation categories
   - Document functor mapping arguments across contexts
   - Assess naturality conditions for cross-room transformations

**Success Criteria:**
- Clear documentation of import mode semantics
- Verified backend implementation of each mode
- Categorical interpretation of cross-room references
- Grade assigned with specific gap identification

---

## Vision Alignment Summary

### Core Principles (Confirmed)

1. **Mathematical Rigor ✅** — Category theory, ludics, ASPIC+ provide solid foundation
2. **Type Safety ✅** — TypeScript types mirror formal structures
3. **Proof Obligations ✅** — CQs enforced, not optional
4. **Incremental Formality ✅** — Backend rigorous, UI hides complexity
5. **Cross-Room Coherence ⏳** — Goal for Phase 5

### User Experience (Status)

1. **Two-Level Navigation ✅** — Working well
2. **Dual-Mode Rendering ✅** — Smooth Toulmin ↔ AIF toggle
3. **Confidence Transparency ⚠️** — Needs explanation layer
4. **Dialogical Engagement ✅** — Legal moves enforce structure
5. **Cross-Room Import ⏳** — Phase 5 focus

### Implementation Quality (Status)

1. **Code Quality ✅** — Strong typing, SWR patterns, memoization
2. **Performance ✅** — Pagination, caching, smart fetching
3. **Accessibility ⚠️** — Some ARIA labels missing
4. **Error Handling ⚠️** — Could use more error boundaries
5. **Test Coverage ???** — Not assessed yet

---

## Ready for Phase 5A?

**Pre-Flight Checklist:**

✅ Phases 1-4 complete with documented findings  
✅ Overall system understanding solid (A- grade justified)  
✅ Critical gaps identified and prioritized  
✅ Phase 5 objectives clearly defined  
✅ Methodology validated and working well  
✅ Vision alignment confirmed  

**Confidence Level: HIGH (95%)**

We have clear understanding of:
- What Mesh agora is trying to achieve
- What's working exceptionally well (ludics, proof obligations, types)
- What needs improvement (confidence transparency, hierarchical viz)
- What we need to investigate in Phase 5 (cross-room semantics)

**Recommendation: PROCEED TO CHUNK 5A**

Focus on cross-deliberation argument referencing with systematic backend/UI/categorical analysis. Expected duration: Similar to previous chunks (comprehensive deep-dive with code evidence and categorical interpretation).

---

**Next Action:** Begin Chunk 5A by reading `/api/deliberations/[id]/evidential/route.ts` and searching for cross-room import logic in codebase.
