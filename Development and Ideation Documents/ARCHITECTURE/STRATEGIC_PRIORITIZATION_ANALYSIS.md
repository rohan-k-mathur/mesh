# Mesh Platform: Strategic Prioritization Analysis

**Date:** January 5, 2026  
**Purpose:** Synthesize feature brainstorms, roadmaps, and strategic initiatives into a prioritized execution plan  
**Status:** Living Document

---

## Document Overview

This document consolidates insights from multiple planning/brainstorming documents created after the comprehensive Mesh platform architecture documentation, providing:

1. **Initiative Inventory** — All major work streams identified
2. **Classification Framework** — How to think about these initiatives
3. **Dependency Analysis** — What must come before what
4. **Tiered Prioritization** — Recommended execution order
5. **Detailed Execution Recommendations** — Per-initiative guidance
6. **Quarterly Roadmap** — Suggested timeline

### Source Documents Analyzed

| Document | Type | Key Content |
|----------|------|-------------|
| `SELLARS_IMPLEMENTATION_ROADMAP_P1-3.md` | Theoretical Infrastructure | Phases 1-3: Dual Characterization, Inference Tickets, Grounding Semantics |
| `SELLARS_IMPLEMENTATION_ROADMAP_P4-6.md` | Theoretical Infrastructure | Phases 4-6: Bildung, Dialectical Recommendations, Picturing Feedback |
| `LEGAL_IDENTITY_FRAME_v3.md` | GTM / Positioning | "Legal Deliberation Infrastructure" as unified identity |
| `GESTALT_REFRAMING_V2.md` | GTM / Positioning | Alternative framings and audience mapping |
| `EXECUTIVE_SUMMARY_WORKSHOP.md` / `v2.md` | GTM / Positioning | Messaging iterations and audience analysis |
| `ACADEMIC_AGORA_USE_CASE.md` | Vertical Market | Academic discourse platform vision |
| `ACADEMIC_AGORA_HSS_DESIGN.md` | Vertical Market | Humanities & Social Sciences specific design |
| `ACADEMIC_COLLABORATION_FEATURES_BRAINSTORM.md` | Vertical Market | Feature discovery for academia |
| `STACKS_IMPROVEMENT_BRAINSTORM.md` | Core Feature Enhancement | Are.na parity + evidence UX |
| `AIF_NEIGHBORHOOD_CHAIN_INTEGRATION_ANALYSIS.md` | System Integration | Connecting neighborhood discovery with chain curation |
| `ESSAY_LLM_POLISH_IDEATION.md` | Feature Enhancement | LLM-based essay refinement |
| `ARGUMENT_CHAIN_SYSTEM_DEEP_REVIEW.md` | Technical Debt / Polish | System status and refactoring opportunities |

---

# PART I: STRATEGIC LANDSCAPE

## 1. Initiative Inventory

From the analyzed documents, **7 major initiative clusters** emerge:

| # | Initiative Cluster | Source Documents | Type |
|---|-------------------|------------------|------|
| **1** | **Sellarsian Implementation** | SELLARS_IMPLEMENTATION_ROADMAP_P1-3, P4-6 | Theoretical Infrastructure |
| **2** | **Identity/Messaging Framework** | LEGAL_IDENTITY_FRAME_v3, GESTALT_REFRAMING_V2, EXECUTIVE_SUMMARY_WORKSHOP v1/v2 | GTM / Positioning |
| **3** | **Academic Agora** | ACADEMIC_AGORA_USE_CASE, ACADEMIC_AGORA_HSS_DESIGN, ACADEMIC_COLLABORATION_FEATURES | Vertical Market |
| **4** | **Stacks/Library Improvements** | STACKS_IMPROVEMENT_BRAINSTORM | Core Feature Enhancement |
| **5** | **AIF Neighborhood ↔ Chain Integration** | AIF_NEIGHBORHOOD_CHAIN_INTEGRATION_ANALYSIS | System Integration |
| **6** | **Essay LLM Polish** | ESSAY_LLM_POLISH_IDEATION | Feature Enhancement |
| **7** | **Argument Chain Deep Review** | ARGUMENT_CHAIN_SYSTEM_DEEP_REVIEW | Technical Debt / Polish |

---

## 2. Classification by Strategic Dimension

### 2.1 Build vs. Position vs. Integrate

| Category | Initiatives | What It Means |
|----------|-------------|---------------|
| **BUILD** (New Capabilities) | Sellarsian Phases 1-6, Stacks Are.na Parity, Academic Features | Adding net-new functionality |
| **POSITION** (GTM Clarity) | Legal Identity Frame, Executive Summaries | Clarifying what we are for external audiences |
| **INTEGRATE** (System Coherence) | AIF↔Chain, Essay Polish, Argument Chain Debt | Connecting existing systems better |

### 2.2 User-Facing vs. Infrastructure vs. Narrative

| Category | Initiatives | Visibility |
|----------|-------------|------------|
| **User-Facing** | Stacks improvements, Academic features, Essay polish | Users see/touch these directly |
| **Infrastructure** | Sellarsian Phases 1-3 (Dual Characterization, Tickets, Semantics) | Backend models that power features |
| **Narrative** | Identity Frame, Summaries, Academic positioning | Words/framing that shape perception |

### 2.3 Urgency × Impact Matrix

```
                           IMPACT
                    Low          High
              ┌───────────┬───────────┐
         High │  Essay    │ Identity  │
              │  Polish   │ Frame     │
    URGENCY   ├───────────┼───────────┤
              │ Arg Chain │ Sellars   │
         Low  │ Debt      │ P1-3      │
              │           │ Stacks    │
              │           │ AIF↔Chain │
              └───────────┴───────────┘
```

**Key insight:** The "Identity Frame" work is high-urgency because it shapes how you talk about everything else. But the Sellarsian and Stacks work is high-impact foundation.

---

## 3. Dependency Analysis

### 3.1 What Depends on What

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        DEPENDENCY GRAPH                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  FOUNDATIONAL LAYER (must exist first)                                 │
│  ├── Sellarsian Phase 1: Dual Characterization                         │
│  │   └── Enables: Phase 2, 3, 4, 5, 6                                  │
│  ├── Stacks: StackItem join table (multi-connect)                      │
│  │   └── Enables: All other Stacks features                           │
│  └── Identity Frame: Canonical messaging                               │
│      └── Enables: Academic positioning, pitch materials               │
│                                                                         │
│  INTEGRATION LAYER (connects systems)                                  │
│  ├── AIF ↔ Chain integration                                           │
│  │   └── Depends on: Both systems stable                              │
│  │   └── Enables: "Discover → Curate" workflow                        │
│  ├── Sellarsian Phase 3: Grounding Semantics                           │
│  │   └── Depends on: Phases 1-2                                       │
│  │   └── Enables: Phases 4-6, Picturing feedback                      │
│  └── Stacks: Citation anchors + lift                                   │
│      └── Depends on: Block primitives                                  │
│      └── Enables: Evidence-bearing deliberation                       │
│                                                                         │
│  EXPERIENCE LAYER (user-visible polish)                                │
│  ├── Academic Agora HSS features                                       │
│  │   └── Depends on: Identity frame, Stacks improvements              │
│  ├── Sellarsian Phase 4: Bildung scaffolding                           │
│  │   └── Depends on: Phases 1-3                                       │
│  ├── Essay LLM Polish                                                  │
│  │   └── Depends on: Essay generator (exists)                         │
│  └── Argument Chain technical debt                                     │
│      └── Depends on: Nothing (can do anytime)                         │
│                                                                         │
│  DIFFERENTIATION LAYER (unique moat)                                   │
│  ├── Sellarsian Phases 5-6: Dialectical recs, Picturing               │
│  │   └── Depends on: Phases 1-4                                       │
│  └── Stacks: Evidence health, knowledge graph                          │
│      └── Depends on: All prior Stacks work                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Critical Path

The longest dependency chain that determines minimum time to full capability:

```
Sellars P1 → Sellars P2 → Sellars P3 → Sellars P4 → Sellars P5 → Sellars P6
   (2w)        (2w)         (2w)         (2w)         (2w)         (2w)
                                                              = 12 weeks

Stacks Join → Block Types → Citation Anchors → Lift + Evidence → Knowledge Graph
    (1w)         (1w)            (1w)             (1w)              (2w)
                                                              = 6 weeks

Identity Frame → Academic Positioning → HSS Pilot Features → Pilot Launch
     (3d)              (2d)                 (4w)               (ongoing)
                                                              = 5 weeks
```

**Implication:** Sellarsian implementation is the longest path. Start it immediately if full capability is the goal. Stacks and Identity can run in parallel.

---

## 4. Tiered Prioritization: Recommended Execution Order

### TIER 0: Immediate Clarity (This Week)
*These are "decision documents" not code — needed to guide everything else*

| Initiative | Deliverable | Time | Why Now |
|------------|-------------|------|---------|
| **Identity Frame Finalization** | Lock in "Legal Deliberation Infrastructure" framing | 2-3 days | Every pitch, every doc, every feature description needs consistent language |
| **Academic Positioning Decision** | Commit to HSS-first pilot strategy or not | 1 day | Affects feature prioritization |

### TIER 1: Foundational Infrastructure (Weeks 1-4)
*These unblock everything else*

| Initiative | Deliverable | Time Est. | Dependencies |
|------------|-------------|-----------|--------------|
| **Sellarsian Phase 1** | InferentialPosition, ClaimCommitment, PicturingRecord models | 1-2 weeks | None |
| **Stacks: StackItem Migration** | Replace `Stack.order[]` with join table, enable multi-connect | 1 week | None |
| **AIF↔Chain: Discovery Panel** | Neighborhood explorer embedded in chain canvas | 1 week | Both systems stable |

### TIER 2: Integration & Core Features (Weeks 4-8)
*Build on foundations*

| Initiative | Deliverable | Time Est. | Dependencies |
|------------|-------------|-----------|--------------|
| **Sellarsian Phase 2** | InferenceTicket, DefeatCondition, CQDefeatMapping | 1-2 weeks | Phase 1 |
| **Sellarsian Phase 3** | IntegratedSemanticsService, label propagation | 1-2 weeks | Phases 1-2 |
| **Stacks: Block Types** | Link + Text blocks (not just PDFs) | 1 week | StackItem done |
| **Stacks: Citation Anchors** | PDF selection → locator/quote/annotation | 1 week | Block types |
| **Essay LLM Polish** | Targeted fix-ups for generated essays | 3-5 days | None (independent) |

### TIER 3: Experience & Differentiation (Weeks 8-12+)
*User-facing polish and unique value*

| Initiative | Deliverable | Time Est. | Dependencies |
|------------|-------------|-----------|--------------|
| **Sellarsian Phase 4** | ArgumentationProfile, BildungService, adaptive UI | 2 weeks | Phases 1-3 |
| **Sellarsian Phase 5** | DialecticalRecommendationService, move recommendations | 2 weeks | Phase 4 |
| **Sellarsian Phase 6** | PicturingFeedbackService, reliability badges | 2 weeks | Phase 5 |
| **Academic Agora Pilot** | HSS features, seeded content, champion activation | Ongoing | Stacks, Identity |
| **Stacks: Evidence Health** | Verification, archiving, quality metrics | 1-2 weeks | All prior Stacks |
| **Argument Chain Debt** | Refactor Canvas, modularize proseGenerator | 1 week | None (can slot anywhere) |

---

# PART II: DETAILED EXECUTION RECOMMENDATIONS

## 5. Per-Initiative Deep Dive

### 5.1 Sellarsian Implementation (Phases 1-6)

#### Strategic Value

| Dimension | Assessment |
|-----------|------------|
| **Differentiation** | 🔥 **Highest** — No other platform has this philosophical grounding |
| **User Visibility** | Low (Phases 1-3) → High (Phases 4-6) |
| **Technical Complexity** | Medium-High |
| **Risk** | Low — Well-specified in roadmap documents |

#### Execution Recommendation

**Approach:** Sequential phases, but with early "touchpoints" that surface the infrastructure

| Phase | Core Work | Early Touchpoint (User-Visible) |
|-------|-----------|--------------------------------|
| **Phase 1** | Dual Characterization models | Add "commitment status" badge to claims |
| **Phase 2** | Inference Tickets | Show "ticket strength" on arguments |
| **Phase 3** | Grounding Semantics | Improved IN/OUT/UNDEC visualization |
| **Phase 4** | Bildung System | Onboarding flow with scaffolding levels |
| **Phase 5** | Dialectical Recommendations | "Suggested next moves" panel |
| **Phase 6** | Picturing Feedback | "Empirically grounded" badges |

**Risk Mitigation:**
- Each phase has defined Prisma models — migration risk is low
- Build feature flags so infrastructure can exist without UI exposure
- Write integration tests at each phase boundary

#### Suggested Timeline

```
Week 1-2:  Phase 1 (Dual Characterization)
Week 3-4:  Phase 2 (Inference Tickets)
Week 5-6:  Phase 3 (Grounding Semantics)
Week 7-8:  Phase 4 (Bildung) ← First major UX visibility
Week 9-10: Phase 5 (Dialectical Recommendations)
Week 11-12: Phase 6 (Picturing Feedback)
```

---

### 5.2 Identity/Messaging Framework

#### Strategic Value

| Dimension | Assessment |
|-----------|------------|
| **Differentiation** | High — "Legal Deliberation Infrastructure" is sticky and unique |
| **User Visibility** | High (affects all external communication) |
| **Technical Complexity** | None (words, not code) |
| **Risk** | Medium — Wrong framing could narrow market |

#### Execution Recommendation

**Approach:** Lock in core identity, create modular messaging assets

The v3 Legal Identity Frame document is comprehensive. Key decisions to finalize:

| Decision | Options | Recommendation |
|----------|---------|----------------|
| **Primary Frame** | Legal / Reasoning Infrastructure / Knowledge Compiler | **Legal Deliberation Infrastructure** — strongest differentiation |
| **Tagline** | Multiple candidates in docs | "Legal-grade reasoning infrastructure for any domain" |
| **Audience Variants** | Funders vs. Academics vs. Developers | Create 3 distinct pitch decks from same core |

**Deliverables:**
1. ✅ Canonical one-liner (finalize from v3)
2. ✅ 30-second elevator pitch (finalize from v3)
3. ⬜ Pitch deck (10 slides) with Legal frame
4. ⬜ Landing page copy refresh
5. ⬜ README.md / About page update

**Timeline:** 3-5 days of focused writing/review

---

### 5.3 Academic Agora (HSS Focus)

#### Strategic Value

| Dimension | Assessment |
|-----------|------------|
| **Differentiation** | High — No existing platform does structured academic discourse |
| **User Visibility** | High (new user segment) |
| **Technical Complexity** | Medium — Mostly feature composition, some new models |
| **Risk** | Medium-High — Requires community building, not just code |

#### Execution Recommendation

**Approach:** Start with HSS (Humanities & Social Sciences) as documented — lower barriers, natural fit

**Phase Sequence (from HSS Design doc):**

| Phase | Focus | Timeline | Key Dependency |
|-------|-------|----------|----------------|
| **Phase 1** | Foundational content seeding | Pre-launch | Identity frame locked |
| **Phase 2** | Champion activation (5-10 scholars per field) | Launch | Seeded content exists |
| **Phase 3** | Graduate student cultivation | +1-2 months | Champions active |
| **Phase 4** | Conference integration | +3-6 months | Critical mass of users |
| **Phase 5** | Journal integration | +6-12 months | Platform credibility |

**Feature Requirements (mapped to dependencies):**

| Required Feature | Source | Dependency |
|------------------|--------|------------|
| Bibliography/source linking | Stacks improvements | StackItem migration |
| Claim-level citations | Stacks citation anchors | Block types |
| Author identity verification | New feature | Identity frame |
| ORCID integration | Academic Collaboration doc | Author verification |
| Paper import (arXiv, JSTOR) | Academic Collaboration doc | Block types |

**Risk Mitigation:**
- Don't build academic-specific features until you have committed pilot partners
- Focus first on making core platform excellent for "power users who happen to be academics"
- The HSS design doc has detailed pilot community rankings — use them

---

### 5.4 Stacks/Library Improvements

#### Strategic Value

| Dimension | Assessment |
|-----------|------------|
| **Differentiation** | Medium (Are.na parity) → High (evidence integration) |
| **User Visibility** | 🔥 **Highest** — Core daily-use feature |
| **Technical Complexity** | Medium — Schema migration is the main challenge |
| **Risk** | Low-Medium — Well-understood patterns from Are.na |

#### Execution Recommendation

**Approach:** Three phases as outlined in brainstorm doc

**Phase 1: Are.na Parity "Feel" (2-3 weeks)**

| Task | Effort | Impact |
|------|--------|--------|
| `StackItem` join table migration | 3-4 days | 🔥 Unlocks everything |
| Multi-stack connections ("Connect" action) | 2-3 days | Core UX improvement |
| Link + Text block types | 2-3 days | No longer PDF-only |
| Visibility modes (open/closed/private/unlisted) | 1-2 days | Collaboration clarity |
| Export (ZIP + JSON + bibliography) | 1-2 days | User expectation |

**Phase 2: Evidence UX (2 weeks)**

| Task | Effort | Impact |
|------|--------|--------|
| Citation anchors (PDF selection → locator) | 3-4 days | Precision evidence |
| Lift carries citations to claims | 2 days | Seamless workflow |
| Citation intent (supports/refutes/context) | 1-2 days | Evidence semantics |
| Evidence list filters | 1-2 days | Usability |

**Phase 3: Unique Moat (2 weeks)**

| Task | Effort | Impact |
|------|--------|--------|
| Link verification + archiving | 2-3 days | Evidence durability |
| Evidence health metrics | 2-3 days | Quality signals |
| Source reputation weighting | 2-3 days | Trust signals |
| Knowledge graph view | 3-4 days | Cross-system visibility |

**Critical Migration Note:**
The `Stack.order[]` → `StackItem` migration requires:
1. Create `StackItem` table
2. Migrate existing order arrays to join table rows
3. Update all Stack queries to use join
4. Remove `order` column

This is a **breaking change** — plan for a maintenance window or feature-flag rollout.

---

### 5.5 AIF Neighborhood ↔ Chain Integration

#### Strategic Value

| Dimension | Assessment |
|-----------|------------|
| **Differentiation** | Medium-High — Unique "discover → curate" workflow |
| **User Visibility** | High for power users |
| **Technical Complexity** | Medium — Both systems exist, need glue |
| **Risk** | Low — Well-analyzed in integration doc |

#### Execution Recommendation

**Approach:** Start with highest-value integration point

From the integration analysis, the priority order is:

| Integration | Value | Effort | Recommendation |
|-------------|-------|--------|----------------|
| **Neighborhood → Chain import** | 🔥 High | 8-12 hours | **Do first** |
| Chain → AIF view toggle | Medium | 4-6 hours | Do second |
| Cross-chain argument tracking | Medium | 6-8 hours | Do third |
| Attack suggestions from neighborhood | Medium | 4-6 hours | Nice-to-have |

**Key Deliverables:**
1. `NeighborhoodExplorer` side panel in chain canvas
2. "Import to Chain" button on neighborhood nodes
3. Auto-suggested edge type based on AIF relationship
4. `MiniNeighborhoodPreview` on chain node hover

**Timeline:** 1-2 weeks total

---

### 5.6 Essay LLM Polish

#### Strategic Value

| Dimension | Assessment |
|-----------|------------|
| **Differentiation** | Low (LLM polish is commodity) |
| **User Visibility** | Medium (improves export quality) |
| **Technical Complexity** | Low — Targeted fix-ups, not full rewrite |
| **Risk** | Low — Graceful degradation built-in |

#### Execution Recommendation

**Approach:** Option C from ideation doc (Targeted Fix-Ups)

| Component | Effort | Notes |
|-----------|--------|-------|
| Issue detectors (regex/heuristic) | 2-3 hours | Catch awkward phrases, run-ons, placeholders |
| Fix request builder | 2-3 hours | Minimal prompt for each issue type |
| LLM integration (OpenAI client exists) | 2-3 hours | Use existing `lib/openai` |
| UI toggle + loading state | 1-2 hours | "Polish with AI" button |

**Total:** 1-2 days of work. Low priority but easy win.

**Important:** This is **optional polish**, not required path. Essays should be good without LLM.

---

### 5.7 Argument Chain Technical Debt

#### Strategic Value

| Dimension | Assessment |
|-----------|------------|
| **Differentiation** | None (internal quality) |
| **User Visibility** | None (unless bugs surface) |
| **Technical Complexity** | Medium — Refactoring without breaking |
| **Risk** | Low — Well-documented debt in review doc |

#### Execution Recommendation

**Approach:** Address as capacity allows, not as priority

From the deep review doc, the debt items are:

| Debt Item | Current State | Recommended Action |
|-----------|--------------|-------------------|
| `ArgumentChainCanvas.tsx` | 1293 lines | Extract hooks + subcomponents |
| `proseGenerator.ts` | 2128 lines | Modularize by section type |
| Scope boundary recalculation | Every render | Memoize with `useMemo` |

**When to do this:**
- When a feature change touches these files anyway
- During a "polish sprint" with no feature pressure
- If performance issues emerge from recalculation

**Not urgent** — The system works. Refactor opportunistically.

---

## 6. Risk Factors & Mitigation

### 6.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Stacks migration data loss | Low | High | Full backup, staged rollout, rollback plan |
| Sellarsian models too abstract | Medium | Medium | Build UI touchpoints at each phase |
| LLM costs for essay polish | Low | Low | Rate limit, cache, optional feature |
| AIF↔Chain integration breaks existing flows | Low | Medium | Feature flags, A/B test |

### 6.2 Strategic Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Academic pilot fails to gain traction | Medium | High | Start with 2-3 committed champions before building features |
| Identity frame doesn't resonate | Medium | Medium | Test messaging with 5-10 target users before committing |
| Building infrastructure without user feedback | Medium | High | Early touchpoints at each Sellarsian phase |
| Scope creep across initiatives | High | Medium | Strict tiering discipline, defer Tier 3 until Tier 1 done |

### 6.3 Resource Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Parallel initiatives cause context-switching | High | Medium | Focus on 1-2 initiatives per week |
| Technical debt compounds | Medium | Medium | Schedule debt-reduction time explicitly |
| Documentation falls behind | High | Low | Update docs as part of PR process |

---

## 7. Resource Allocation Suggestions

### 7.1 If Solo Developer

Focus on **one track at a time**:

```
Weeks 1-4:  Stacks improvements (highest user visibility)
Weeks 5-8:  Sellarsian Phases 1-3 (infrastructure)
Weeks 9-12: Sellarsian Phases 4-6 + AIF integration
Ongoing:    Academic pilot (community, not code)
```

### 7.2 If 2-3 Developers

Run **two parallel tracks**:

```
Track A (User-Facing):     Stacks → AIF Integration → Essay Polish → Academic Features
Track B (Infrastructure):  Sellarsian P1-6 (sequential)
Shared:                    Identity frame (3 days upfront, then done)
```

### 7.3 If Team + Community/BD Resource

Add **third track for market development**:

```
Track A (User-Facing):     Stacks → AIF Integration → Essay Polish
Track B (Infrastructure):  Sellarsian P1-6
Track C (Market):          Identity finalization → Academic champion recruitment → Pilot ops
```

---

## 8. Suggested Quarterly Roadmap

### Q1 2026 (January - March)

| Month | Focus | Key Deliverables |
|-------|-------|------------------|
| **January** | Foundations | Identity frame locked, Stacks StackItem migration, Sellarsian P1 |
| **February** | Core Features | Stacks block types + citations, Sellarsian P2-3, AIF↔Chain integration |
| **March** | Experience Layer | Sellarsian P4 (Bildung), Stacks evidence UX, Essay polish |

**Q1 Exit Criteria:**
- [ ] Identity messaging finalized and deployed to landing page
- [ ] Stacks has multi-connect, link/text blocks, citation anchors
- [ ] Sellarsian Phases 1-4 implemented
- [ ] AIF neighborhood discoverable from chain canvas
- [ ] Essay generator has optional LLM polish

### Q2 2026 (April - June)

| Month | Focus | Key Deliverables |
|-------|-------|------------------|
| **April** | Differentiation | Sellarsian P5-6, Stacks evidence health |
| **May** | Academic Pilot Prep | HSS features, content seeding, champion activation |
| **June** | Pilot Launch | 2-3 HSS communities live, feedback loop established |

**Q2 Exit Criteria:**
- [ ] Full Sellarsian implementation complete
- [ ] Stacks has verification/archiving and evidence health metrics
- [ ] 5-10 academic champions actively using platform
- [ ] First deliberations with real scholarly discourse

### Q3+ 2026 (July onwards)

- Academic pilot iteration based on feedback
- Knowledge graph / cross-system views
- Institutional partnerships (libraries, journals)
- Scale and polish based on usage patterns

---

## 9. Decision Log

Track key decisions made during prioritization:

| Date | Decision | Rationale | Owner |
|------|----------|-----------|-------|
| 2026-01-05 | Document created | Synthesize brainstorm docs into actionable plan | — |
| | | | |

---

## 10. Next Actions

### Immediate (This Week)

- [ ] Review and finalize identity frame messaging
- [ ] Decide: Commit to HSS-first academic strategy? (Y/N)
- [ ] Begin Stacks `StackItem` migration design
- [ ] Begin Sellarsian Phase 1 Prisma schema

### Short-Term (Next 2 Weeks)

- [ ] Complete Stacks migration
- [ ] Complete Sellarsian Phase 1
- [ ] Start AIF↔Chain integration

### Medium-Term (Next Month)

- [ ] Sellarsian Phases 2-3
- [ ] Stacks block types + citations
- [ ] Essay LLM polish

---

*Last updated: January 5, 2026*
