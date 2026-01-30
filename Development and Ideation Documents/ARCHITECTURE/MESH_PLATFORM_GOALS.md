# Mesh Platform: Unified Goals & Priorities

**Created:** January 29, 2026  
**Last Updated:** January 29, 2026  
**Status:** Living Document

---

## Platform Identity

> **Core Statement:** Mesh is infrastructure for reasoning together — structured dialogue that accumulates into shared understanding, where every claim is traceable, every argument is visible, and every conclusion can be examined and built upon.

**Tagline:** *Where reasoning becomes visible*

**The Shift:** Conversations disappear. Mesh deliberations persist. We provide the scaffolding for groups to think together rigorously — not just talk, but actually reason toward defensible conclusions.

**Internal Model:** *(For team reference)* The platform draws architectural inspiration from legal systems — the most sophisticated reasoning infrastructure humanity has developed. Commitment tracking, typed challenges, evidentiary standards, and audit trails all have legal analogues. But externally, we emphasize *collaborative rigor* rather than adversarial process.

---

## Initiative Clusters Overview

| # | Initiative | Type | Status | Priority |
|---|------------|------|--------|----------|
| **1** | Sellarsian Implementation | Theoretical Infrastructure | Phase 1 Planning | High |
| **2** | Identity/Messaging Framework | GTM / Positioning | In Progress | High |
| **3** | Academic Agora | Vertical Market | Phase 2 Complete | High |
| **4** | Stacks/Library Improvements | Core Feature Enhancement | Planning | Medium |
| **5** | AIF ↔ Chain Integration | System Integration | Planning | Medium |
| **6** | Essay LLM Polish | Feature Enhancement | Planning | Low |
| **7** | Argument Chain Deep Review | Technical Debt | Planning | Medium |

---

# SHORT-TERM GOALS (Next 1-3 Months)

## 1. Platform Identity & GTM (Immediate)

### 1.1 Canonical Messaging Framework
| Goal | Deliverable | Timeline |
|------|-------------|----------|
| **Finalize Platform Positioning** | Production-ready messaging at all lengths | Week 1 |
| **Audience-Specific Packages** | Tailored pitches for executives, academics, policy, developers | Week 1-2 |
| **Pitch Deck Content** | Slide-ready materials emphasizing collaborative rigor | Week 2 |
| **Demo Script** | Walkthrough showing structured reasoning features | Week 2 |

### 1.2 Audience Mapping
| Audience | Key Message | Frame Emphasis |
|----------|-------------|----------------|
| **Executives/Funders** | "Decisions you can stand behind, with the receipts to prove it" | Accountability & clarity |
| **Policy/Governance** | "Transparent reasoning that builds trust" | Structured transparency |
| **Academics** | "Engage with ideas at the claim level, not just paper level" | Depth & precision |
| **Developers** | "Argumentation-native API with formal semantics" | Technical precision |
| **Communities** | "Discussions that actually go somewhere" | Progress & accessibility |

---

## 2. Academic Agora — Phase 3: Knowledge Graph

**Timeline:** Q1 2026 (Weeks 1-12)  
**Status:** Ready to Start

### 2.1 Phase 3.1: Claim Provenance Tracking (Weeks 1-4)
| Goal | Description | Success Criteria |
|------|-------------|------------------|
| **Claim Versioning** | Track claim evolution over time | Users can view version history for any claim |
| **Origin Tracking** | Record first assertion source/author/date | Every claim shows where it originated |
| **Canonical IDs** | Cross-context claim identification | Same claim in multiple deliberations is linked |
| **Challenge Aggregation** | Track open/defended/conceded challenges | Status dashboard shows challenge resolution |
| **Consensus Status** | Determine DEFENDED/CONTESTED/UNRESOLVED | Automated status calculation from attacks |

### 2.2 Phase 3.2: Argument-Level Citations (Weeks 5-8)
| Goal | Description | Success Criteria |
|------|-------------|------------------|
| **Argument Permalinks** | Stable citable URIs for arguments | Every argument has a shareable link |
| **Typed Argument Links** | SUPPORTS/EXTENDS/REFINES/RESPONDS relations | Clear relationship types between arguments |
| **Citation Export** | BibTeX/RIS for individual arguments | One-click argument citation |
| **Cross-Paper References** | "Argument A in Paper X attacks Argument B in Paper Y" | Visual cross-paper argument graph |

### 2.3 Phase 3.3: Cross-Deliberation Mapping (Weeks 9-12)
| Goal | Description | Success Criteria |
|------|-------------|------------------|
| **Claim Equivalence** | Detect similar claims across deliberations | "Same claim in 3 other debates" notifications |
| **Federated Claim Registry** | Global claim status aggregation | See claim status across all contexts |
| **Field-Level Claim View** | All claims in "political philosophy" | Subject-based claim browsing |
| **Import/Reference Claims** | Use claims from other deliberations | Cross-reference workflow |

---

## 3. Sellarsian Implementation — Phase 1: Core Infrastructure

**Timeline:** 2-3 weeks  
**Foundation:** Dual Characterization Data Models

### 3.1 Signifying Face (Space of Reasons)
| Goal | Description | Deliverable |
|------|-------------|-------------|
| **InferentialPosition Model** | Track each claim's status in the space of reasons | Prisma model + API |
| **Commitment Tracking** | Who is committed to what claims, with what entitlement | CommitmentRecord service |
| **Defeat Status** | Track undefeated/rebutted/undercut/undermined | Status propagation |
| **Entitlement Basis** | Testimony/perception/inference/authority | Per-commitment metadata |

### 3.2 Picturing Face (Realm of Law)
| Goal | Description | Deliverable |
|------|-------------|-------------|
| **PicturingRecord Model** | Track domain correspondence for claims | Prisma model + API |
| **Prediction System** | Link claims to testable predictions | ClaimPrediction model |
| **Outcome Tracking** | Record observed outcomes, link to predictions | ClaimOutcome model |
| **Picturing Score** | Aggregate empirical accuracy | Computed metrics |

### 3.3 Unified Dual Characterization
| Goal | Description | Deliverable |
|------|-------------|-------------|
| **DualCharacterizationService** | Unified API for both faces | Service layer |
| **Backfill Scripts** | Populate existing claims with dual data | Migration scripts |
| **Hook Integration** | Auto-update on claim/edge creation | Event hooks |

---

## 4. Technical Infrastructure (Parallel Track)

| Goal | Priority | Description | Timeline |
|------|----------|-------------|----------|
| **Database Migration** | P0 | Run `npx prisma db push` for all pending schema changes | Week 1 |
| **Phase 1-2 Testing** | P0 | Verify all academic services and API routes | Week 1-2 |
| **Argument Chain Audit** | P1 | Review and refactor per ARGUMENT_CHAIN_SYSTEM_DEEP_REVIEW | Week 3-4 |
| **API Documentation** | P1 | OpenAPI specs for all endpoints | Ongoing |
| **Performance Profiling** | P2 | Optimize snapshot generation, label propagation | Week 4+ |

---

## 5. Stacks/Library Improvements — Foundation

**Dependency:** Enables evidence-bearing deliberation

| Goal | Description | Priority |
|------|-------------|----------|
| **StackItem Join Table** | Multi-connect items to stacks (Are.na parity) | P0 |
| **Block Primitives** | Standardized block types for content | P1 |
| **Citation Anchors** | Link stack items to specific claim evidence | P1 |
| **Lift to Deliberation** | "Use this source in argument" workflow | P2 |

---

# MEDIUM-TERM GOALS (3-6 Months)

## 6. Academic Agora — Phase 4: Open Review & Credit

**Timeline:** Q2 2026

### 6.1 Public Peer Review (4.1)
| Goal | Description |
|------|-------------|
| **Review Deliberation Template** | Structured review phases: Initial → Response → Revision |
| **Reviewer Commitments** | Track reviewer positions through the review process |
| **Author Response Workflow** | Formal responses to critiques with dialogue moves |
| **Living Review** | Post-publication ongoing review capability |

### 6.2 Argumentation-Based Reputation (4.2)
| Goal | Description |
|------|-------------|
| **Contribution Metrics** | Claims curated, arguments made, defenses mounted |
| **Defense Rate** | "60% of your claims have been successfully defended" |
| **Reviewer Recognition** | Credit for constructive critique and challenges |
| **Quality Signals** | High-quality contribution badges |

### 6.3 Academic Credit Integration (4.3)
| Goal | Description |
|------|-------------|
| **ORCID Sync** | Push contributions to ORCID profile |
| **CV Export** | JSON/PDF export of academic contributions |
| **Institutional Reporting** | Export for tenure/review committees |

---

## 7. Sellarsian Implementation — Phases 2-4

### 7.1 Phase 2: Inference Ticket System (2 weeks)
| Goal | Sellarsian Concept | Implementation |
|------|-------------------|----------------|
| **Scheme ↔ CQ Integration** | Material inference | Enhanced scheme-CQ binding |
| **Inference Tickets** | Warranted moves | Scheme-validated inference steps |
| **CQ Coverage Tracking** | Addressed challenges | Per-argument CQ status |

### 7.2 Phase 3: Grounding Semantics (2 weeks)
| Goal | Sellarsian Concept | Implementation |
|------|-------------------|----------------|
| **Label Propagation** | Normative status | Efficient status recomputation |
| **Defeat Handling** | Space of reasons | Typed defeat propagation |
| **Acceptability Extensions** | Grounded semantics | ASPIC+ evaluation modes |

### 7.3 Phase 4: Developmental Scaffolding (2 weeks)
| Goal | Sellarsian Concept | Implementation |
|------|-------------------|----------------|
| **ArgumentationProfile Model** | Bildung | Per-user developmental tracking |
| **Progression Events** | RDR → ARSA → ARSD | Competency-building event capture |
| **Adaptive Scaffolding** | Ought-to-be → Ought-to-do | UI complexity adaptation |
| **Bildung Milestones** | Developmental hierarchy | Achievement/learning path |

---

## 8. System Integration & Polish

### 8.1 AIF ↔ Neighborhood Chain Integration
| Goal | Description |
|------|-------------|
| **Discover → Curate Workflow** | Seamless transition from AIF discovery to chain curation |
| **Neighborhood Suggestions** | "Related arguments" based on AIF graph |
| **Chain Import from AIF** | Pull argument structures into chains |

### 8.2 Essay LLM Polish
| Goal | Description |
|------|-------------|
| **Style Refinement** | LLM-based essay prose improvement |
| **Citation Integration** | Auto-cite from argument sources |
| **Tone Adjustment** | Academic/professional/accessible modes |

### 8.3 Stacks Advanced Features
| Goal | Description |
|------|-------------|
| **Evidence Health Dashboard** | Track source freshness and validity |
| **Knowledge Graph View** | Visualize stack → claim → argument connections |
| **Collaborative Stacks** | Multi-user stack curation |

---

## 9. User Growth & Adoption

| Goal | Target | Timeline |
|------|--------|----------|
| **First Academic Pilot** | 1 research group active | Q1 2026 |
| **Journal Club Adoption** | 5 active journal clubs | Q2 2026 |
| **Course Integration** | 2 university courses | Q2 2026 |
| **Cross-Institution** | 3+ universities | Q2 2026 |
| **Power Users** | 20 active scholars | Q2 2026 |
| **Papers Processed** | 500+ through claim pipeline | Q2 2026 |

---

# LONG-TERM GOALS (6-18 Months)

## 10. Academic Agora — Phase 5: Interdisciplinary Bridge

**Timeline:** Q3 2026

| Goal | Description | Impact |
|------|-------------|--------|
| **Concept Mapping Engine** | Link equivalent concepts across fields | "Agency" (philosophy) ↔ "Self-efficacy" (psychology) |
| **Translation Deliberations** | Negotiate cross-field terminology | Bridge epistemic vocabularies |
| **Collaboration Matching** | Find researchers on complementary problems | AI-powered research matchmaking |
| **Field Taxonomies** | Structured discipline/sub-discipline trees | Organized cross-field discovery |

---

## 11. Sellarsian Implementation — Phases 5-6

### 11.1 Phase 5: Community Substrate (2 weeks)
| Goal | Sellarsian Concept | Implementation |
|------|-------------------|----------------|
| **We-Intentions** | Linguistic community | Shared deliberation commitments |
| **Collective Memory** | Community knowledge | Institutional memory artifacts |
| **Norm Emergence** | Ought-to-be's | Community-defined standards |

### 11.2 Phase 6: Picturing Feedback Loop (2 weeks)
| Goal | Sellarsian Concept | Implementation |
|------|-------------------|----------------|
| **Evidence Links** | Picturing | Enhanced claim-evidence binding |
| **Outcome Tracking** | World-word direction | Prediction → observation loop |
| **Picturing Dashboard** | Signifying vs. Picturing | Dual-face visualization |

---

## 12. Academic Agora — Phase 6: External Presence

**Timeline:** Q4 2026

| Goal | Description |
|------|-------------|
| **Embeddable Widgets** | Agora deliberations embedded in journals/websites |
| **Claim Badges** | Status badges for claims (like CI badges) |
| **Publisher API** | Integration points for journal systems |
| **Browser Extension** | Overlay Agora claims on papers |
| **JATS/XML Export** | Academic publishing format support |

---

## 13. Platform & Ecosystem

| Goal | Timeline | Description |
|------|----------|-------------|
| **Self-Hosted Option** | 2027 | Universities can run their own instances |
| **Federated Mesh** | 2027 | Cross-instance claim synchronization |
| **Institutional Partnerships** | 2026-27 | Formal university/journal partnerships |
| **Standards Participation** | 2027 | Contribute to AIF/argumentation standards bodies |
| **Grant Funding** | 2026 | NEH/NSF grant applications for digital humanities |

---

## 14. Scale & Impact Metrics (18-Month Targets)

| Metric | Target | Significance |
|--------|--------|--------------|
| **Active Deliberations** | 500+ | Sustained scholarly engagement |
| **Claims in System** | 50,000+ | Rich knowledge graph |
| **Arguments Made** | 100,000+ | Structured reasoning at scale |
| **Unique Scholars** | 2,000+ | Critical mass for network effects |
| **Papers Processed** | 5,000+ | Comprehensive coverage of key works |
| **Cross-Citations** | 10,000+ | Arguments citing other arguments |
| **Fields Represented** | 20+ | Interdisciplinary reach |
| **Prediction Accuracy** | Tracked | Picturing face validation |

---

# STRATEGIC THEMES

## Theme 1: Structured Reasoning Infrastructure
The unifying identity. Every feature should support *reasoning that holds up* — traceable, challengeable, and improvable:
- **Claims** = Addressable assertions that persist
- **DialogueMoves** = Contributions that build the record
- **Schemes** = Recognized patterns of good reasoning
- **Attacks** = Structured ways to challenge and improve
- **Commitment Stores** = What each person actually said
- **Releases** = Snapshots you can cite and build on

*(Internal reference: These map to legal concepts — allegations, pleadings, standards of proof, objections, court record, judgments — but we present them as collaborative rigor rather than adversarial process.)*

## Theme 2: Sellarsian Dual Characterization
Every claim exists in two irreducible dimensions:
- **Signifying (Space of Reasons):** Inferential role, normative status, commitments
- **Picturing (Realm of Law):** Causal history, domain correspondence, outcomes

## Theme 3: From Papers to Claims
Make claims the atomic unit of scholarly discourse. Every feature supports engaging with, tracking, and evaluating individual claims rather than whole papers.

## Theme 4: Versioned Truth
Scientific knowledge evolves. Everything is versioned: claims, arguments, deliberations. Reference "as of v1.2" states.

## Theme 5: Transparent Evaluation
No more opaque peer review. All critique, defense, and resolution is visible and traceable.

## Theme 6: Credit for All Contributions
Not just papers — credit for curating claims, raising objections, defending positions, synthesizing debates.

## Theme 7: Bildung (Developmental Scaffolding)
Users grow from RDR → ARSA → ARSD. Platform adapts scaffolding based on developmental stage.

## Theme 8: Cross-Field Bridges
Break down disciplinary silos. Discover related work, translate terminology, collaborate across boundaries.

---

# DEPENDENCY GRAPH

```
FOUNDATIONAL LAYER (Must exist first)
├── Identity Frame: Canonical messaging ─────────────┐
│   └── Enables: Academic positioning, pitch materials│
├── Sellarsian Phase 1: Dual Characterization ───────┼──┐
│   └── Enables: Phases 2-6                          │  │
└── Stacks: StackItem join table ────────────────────│──│─┐
    └── Enables: All Stacks features                 │  │ │
                                                     │  │ │
INTEGRATION LAYER (Connects systems)                 │  │ │
├── Academic Phase 3: Knowledge Graph ◄──────────────┘  │ │
├── Sellarsian Phase 3: Grounding Semantics ◄───────────┘ │
├── AIF ↔ Chain integration                               │
└── Stacks: Citation anchors + lift ◄─────────────────────┘
                                                     
EXPERIENCE LAYER (User-visible polish)               
├── Academic Phase 4: Peer Review & Reputation       
├── Sellarsian Phase 4: Bildung scaffolding          
├── Essay LLM Polish                                 
└── Argument Chain technical debt                    

DIFFERENTIATION LAYER (Unique moat)                  
├── Sellarsian Phases 5-6: Community, Picturing      
├── Academic Phase 5: Interdisciplinary Bridge       
└── Academic Phase 6: External Presence              
```

---

# CRITICAL PATH

**Minimum time to full Sellarsian capability:**
```
Sellars P1 → P2 → P3 → P4 → P5 → P6
   (2w)    (2w)  (2w)  (2w)  (2w)  (2w)  = 12 weeks
```

**Minimum time to full Academic capability:**
```
Phase 3 → Phase 4 → Phase 5 → Phase 6
  (12w)    (12w)     (8w)     (8w)   = 40 weeks
```

**Identity work (can run parallel):**
```
Identity Frame → Academic Positioning → HSS Pilot → Launch
     (3d)              (2d)              (4w)      (ongoing)
```

---

# IMMEDIATE NEXT ACTIONS

1. ⬜ **Finalize Platform Positioning** — Production-ready messaging
2. ⬜ **Run database migration** — `npx prisma db push` for all pending schema
3. ⬜ **End-to-end test** — All Phase 1-2 academic features
4. ⬜ **Begin Sellarsian Phase 1** — InferentialPosition + PicturingRecord models
5. ⬜ **Begin Academic Phase 3.1** — Claim provenance schema
6. ⬜ **Stacks foundation** — StackItem join table for multi-connect
7. ⬜ **Recruit pilot group** — First real-world academic deliberation
8. ⬜ **Document APIs** — OpenAPI specs for Phase 1-2 endpoints

---

# RISKS & MITIGATIONS

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **Academic adoption friction** | High | Medium | Templates matching existing workflows (journal clubs) |
| **Sellarsian complexity** | Medium | Medium | Clear phases; can ship incrementally |
| **Scale performance** | High | Low | Optimize snapshot generation; consider caching |
| **Schema complexity** | Medium | Medium | Incremental migration; backwards compatibility |
| **Competing platforms** | Low | Low | Focus on argumentation depth as differentiator |
| **Funding runway** | High | Medium | Grant applications; institutional partnerships |
| **Message confusion** | Medium | Medium | Consistent "collaborative rigor" positioning across materials |

---

# SUCCESS DEFINITIONS

**3-Month Success:**
- Legal Identity Frame finalized and in use
- Sellarsian Phase 1 complete (Dual Characterization)
- Academic Phase 3.1 complete (Claim Provenance)
- First academic pilot group active

**6-Month Success:**
- Sellarsian Phases 1-4 complete
- Academic Phases 3-4 complete
- 5+ journal clubs using platform
- First peer-reviewed paper citing Agora deliberation

**18-Month Success:**
- Full Sellarsian implementation (Phases 1-6)
- Full Academic implementation (Phases 3-6)
- Multiple universities using Agora for courses/research
- Publishers integrating Agora claim status
- Platform recognized as scholarly infrastructure

---

*This document consolidates goals from STRATEGIC_PRIORITIZATION_ANALYSIS.md, LEGAL_IDENTITY_FRAME_v3.md, ACADEMIC_AGORA_DEVELOPMENT_ROADMAP.md, SELLARS_IMPLEMENTATION_ROADMAP_P1-6.md, and related planning documents.*

*Update monthly to reflect progress and reprioritization.*
