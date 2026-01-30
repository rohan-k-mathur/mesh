# Academic Agora: Goals & Priorities

**Created:** January 29, 2026  
**Current Status:** Phase 2 Complete ✅ | Phase 3 Ready to Start  
**Vision:** Transform academic discourse from papers-as-PDFs to papers-as-debatable, composable claim graphs

---

## Short-Term Goals (Next 1-3 Months)

### 🎯 Immediate Priority: Phase 3 — Knowledge Graph (Q1 2026)

#### Phase 3.1: Claim Provenance Tracking (Weeks 1-4)
| Goal | Description | Success Criteria |
|------|-------------|------------------|
| **Claim Versioning** | Track claim evolution over time | Users can view version history for any claim |
| **Origin Tracking** | Record first assertion source/author/date | Every claim shows where it originated |
| **Canonical IDs** | Cross-context claim identification | Same claim in multiple deliberations is linked |
| **Challenge Aggregation** | Track open/defended/conceded challenges | Status dashboard shows challenge resolution |
| **Consensus Status** | Determine DEFENDED/CONTESTED/UNRESOLVED | Automated status calculation from attacks |

#### Phase 3.2: Argument-Level Citations (Weeks 5-8)
| Goal | Description | Success Criteria |
|------|-------------|------------------|
| **Argument Permalinks** | Stable citable URIs for arguments | Every argument has a shareable link |
| **Typed Argument Links** | SUPPORTS/EXTENDS/REFINES/RESPONDS relations | Clear relationship types between arguments |
| **Citation Export** | BibTeX/RIS for individual arguments | One-click argument citation |
| **Cross-Paper References** | "Argument A in Paper X attacks Argument B in Paper Y" | Visual cross-paper argument graph |

#### Phase 3.3: Cross-Deliberation Mapping (Weeks 9-12)
| Goal | Description | Success Criteria |
|------|-------------|------------------|
| **Claim Equivalence** | Detect similar claims across deliberations | "Same claim in 3 other debates" notifications |
| **Federated Claim Registry** | Global claim status aggregation | See claim status across all contexts |
| **Field-Level Claim View** | All claims in "political philosophy" | Subject-based claim browsing |
| **Import/Reference Claims** | Use claims from other deliberations | Cross-reference workflow |

---

### 🔧 Technical Debt & Infrastructure (Parallel Track)

| Goal | Priority | Description |
|------|----------|-------------|
| **Database Migration** | P0 | Run `npx prisma db push` for Phase 2.3 schema |
| **Testing Phase 1-2** | P0 | Verify all services and API routes work correctly |
| **Vector Search Upgrade** | P2 | Replace ILIKE search with Pinecone embeddings |
| **Performance Optimization** | P1 | Profile and optimize snapshot generation |
| **API Documentation** | P1 | OpenAPI specs for all academic endpoints |

---

### 📈 User Adoption Goals (Q1 2026)

| Goal | Target | Metric |
|------|--------|--------|
| **First Academic Pilot** | 1 research group | Active deliberation with >10 claims |
| **Claim Extraction Usage** | 100 papers processed | Papers → claims pipeline |
| **Release Creation** | 10 versioned releases | Scholars publishing debate snapshots |
| **Fork/Merge Activity** | 5 deliberation forks | Alternative exploration workflows |

---

## Medium-Term Goals (3-6 Months)

### 🎓 Phase 4: Open Review & Credit (Q2 2026)

#### 4.1: Public Peer Review
| Goal | Description |
|------|-------------|
| **Review Deliberation Template** | Structured review phases with dialogue moves |
| **Reviewer Commitments** | Track reviewer positions through review |
| **Author Response Workflow** | Formal response to critiques |
| **Living Review** | Post-publication ongoing review |

#### 4.2: Reputation System
| Goal | Description |
|------|-------------|
| **Contribution Metrics** | Track claims curated, arguments made, defenses |
| **Defense Rate** | "60% of your claims have been successfully defended" |
| **Reviewer Recognition** | Credit for constructive critique |
| **Quality Signals** | High-quality contribution badges |

#### 4.3: Credit Integration
| Goal | Description |
|------|-------------|
| **ORCID Sync** | Push contributions to ORCID profile |
| **CV Export** | JSON/PDF export of academic contributions |
| **Institutional Reporting** | Export for tenure/review committees |

---

### 🌐 User Growth & Adoption (Q2 2026)

| Goal | Target | Description |
|------|--------|-------------|
| **Journal Club Adoption** | 5 active journal clubs | Using deliberation templates |
| **Course Integration** | 2 university courses | Using Agora for student discussion |
| **Cross-Institution** | 3+ universities | Multi-institutional deliberations |
| **Power Users** | 20 active scholars | Regular contributors with profiles |

---

## Long-Term Goals (6-18 Months)

### 🌉 Phase 5: Interdisciplinary Bridge (Q3 2026)

| Goal | Description | Impact |
|------|-------------|--------|
| **Concept Mapping Engine** | Link equivalent concepts across fields | "Agency" (philosophy) ↔ "Self-efficacy" (psychology) |
| **Translation Deliberations** | Negotiate cross-field terminology | Bridge epistemic vocabularies |
| **Collaboration Matching** | Find researchers on complementary problems | AI-powered research matchmaking |
| **Field Taxonomies** | Structured discipline/sub-discipline trees | Organized cross-field discovery |

---

### 📡 Phase 6: External Presence (Q4 2026)

| Goal | Description |
|------|-------------|
| **Embeddable Widgets** | Agora deliberations embedded in journals/websites |
| **Claim Badges** | Status badges for claims (like CI badges) |
| **API for Publishers** | Integration points for journal systems |
| **Browser Extension** | Overlay Agora claims on papers |
| **JATS/XML Export** | Academic publishing format support |

---

### 🏛️ Platform & Ecosystem Goals

| Goal | Timeline | Description |
|------|----------|-------------|
| **Self-Hosted Option** | 2027 | Universities can run their own instances |
| **Federated Mesh** | 2027 | Cross-instance claim synchronization |
| **Institutional Partnerships** | 2026-27 | Formal university/journal partnerships |
| **Standards Participation** | 2027 | Contribute to AIF/argumentation standards |
| **Grant Funding** | 2026 | NEH/NSF grant for digital humanities |

---

### 📊 Scale & Impact Metrics (18-Month Targets)

| Metric | Target | Significance |
|--------|--------|--------------|
| **Active Deliberations** | 500+ | Sustained scholarly engagement |
| **Claims in System** | 50,000+ | Rich knowledge graph |
| **Arguments Made** | 100,000+ | Structured reasoning at scale |
| **Unique Scholars** | 2,000+ | Critical mass for network effects |
| **Papers Processed** | 5,000+ | Comprehensive coverage of key works |
| **Cross-Citations** | 10,000+ | Arguments citing other arguments |
| **Fields Represented** | 20+ | Interdisciplinary reach |

---

## Strategic Themes

### 1. **From Papers to Claims**
The fundamental shift: make claims the atomic unit of scholarly discourse instead of papers. Every feature should support engaging with, tracking, and evaluating claims.

### 2. **Versioned Truth**
Scientific knowledge evolves. Everything should be versioned: claims, arguments, deliberations. Scholars should be able to reference "as of v1.2" states.

### 3. **Transparent Evaluation**
No more opaque peer review. Make all critique, defense, and resolution visible and traceable. Build trust through transparency.

### 4. **Credit for All Contributions**
Not just papers — credit for curating claims, raising good objections, defending positions, synthesizing debates. Recognition beyond authorship.

### 5. **Cross-Field Bridges**
Break down disciplinary silos. Help scholars discover related work in other fields, translate terminology, and collaborate across boundaries.

---

## Immediate Next Actions

1. ⬜ **Run database migration** for Phase 2.3 quote schema
2. ⬜ **End-to-end test** all Phase 1-2 features
3. ⬜ **Begin Phase 3.1** schema implementation (ClaimVersion, provenance fields)
4. ⬜ **Recruit pilot group** for first real-world academic deliberation
5. ⬜ **Document APIs** for Phase 1-2 endpoints

---

## Dependencies & Risks

| Risk | Mitigation | Priority |
|------|------------|----------|
| **Academic adoption friction** | Templates matching existing workflows (journal clubs) | High |
| **Scale performance** | Optimize snapshot generation, consider caching | Medium |
| **Schema complexity** | Incremental migration, backwards compatibility | Medium |
| **Competing platforms** | Focus on argumentation depth as differentiator | Low |
| **Funding runway** | Grant applications, institutional partnerships | High |

---

## Success Definition

**6-Month Success:** A research group regularly uses Academic Agora for their journal club, creates versioned releases of their debates, and cites Agora deliberations in a published paper.

**18-Month Success:** Multiple universities use Agora for courses and research, publishers integrate Agora claim status into their systems, and the platform has become a recognized part of scholarly infrastructure.

---

*This document should be updated monthly to reflect progress and reprioritization.*
