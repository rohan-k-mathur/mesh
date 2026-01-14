# Phase 1: Foundation — Implementation Overview

**Phase:** 1 of 6  
**Timeline:** Q1 2026 (8-10 weeks)  
**Status:** Planning  
**Parent Document:** [ACADEMIC_AGORA_DEVELOPMENT_ROADMAP.md](../ACADEMIC_AGORA_DEVELOPMENT_ROADMAP.md)

---

## Phase 1 Goal

> Enable core academic use patterns with minimal friction. Solve: *"I want to engage with specific claims in papers, not just cite whole papers."*

---

## Sub-Phase Breakdown

| Sub-Phase | Name | Effort | Dependencies |
|-----------|------|--------|--------------|
| **1.1** | Paper-to-Claim Pipeline | 2-3 weeks | Existing Source model |
| **1.2** | Claim-Based Search & Discovery | 2 weeks | 1.1 complete |
| **1.3** | Academic Deliberation Templates | 2 weeks | Existing Deliberation model |
| **1.4** | Academic Identity & Affiliation | 2 weeks | Existing User model |

---

## Implementation Documents

1. [PHASE_1.1_PAPER_TO_CLAIM_PIPELINE.md](./PHASE_1.1_PAPER_TO_CLAIM_PIPELINE.md)
2. [PHASE_1.2_CLAIM_SEARCH_DISCOVERY.md](./PHASE_1.2_CLAIM_SEARCH_DISCOVERY.md)
3. [PHASE_1.3_DELIBERATION_TEMPLATES.md](./PHASE_1.3_DELIBERATION_TEMPLATES.md)
4. [PHASE_1.4_ACADEMIC_IDENTITY.md](./PHASE_1.4_ACADEMIC_IDENTITY.md)

---

## Key Deliverables

| # | Deliverable | User Value | Validation Criteria |
|---|-------------|------------|---------------------|
| D1 | Paper → Claim pipeline | Engage at claim level | User can extract 5+ claims from a paper in <5 min |
| D2 | Claim-based search | Find claims, not just papers | Search returns relevant claims with 80%+ precision |
| D3 | Related arguments panel | Navigate debate space | Panel loads in <500ms with 5+ related items |
| D4 | Journal club template | Ready-to-use workflow | Template creates deliberation with all phases |
| D5 | Academic profiles | Professional credibility | ORCID verification completes in <30s |
| D6 | Organization model | Lab/department identity | User can create org and add 10+ members |

---

## Prerequisites

### Existing Infrastructure Required

- [x] Source model with DOI support
- [x] Claim model with basic fields
- [x] Deliberation model with members
- [x] User model with profile fields
- [x] Pinecone integration for embeddings
- [x] OpenAI integration for AI assistance
- [x] ArgumentChain infrastructure

### External APIs Needed

| API | Purpose | Auth Type | Rate Limits |
|-----|---------|-----------|-------------|
| Crossref | DOI resolution | None/Polite Pool | 50 req/s |
| OpenAlex | Paper enrichment | None | 100K/day |
| ORCID | Identity verification | OAuth 2.0 | 24 req/s |
| OpenAI | Claim extraction | API Key | Per plan |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| AI extraction quality varies | High | Medium | Human verification workflow, confidence scores |
| ORCID OAuth complexity | Medium | Low | Use existing OAuth patterns, test thoroughly |
| Embedding cost at scale | Medium | Medium | Batch processing, cache embeddings |
| Search latency issues | Low | High | Pinecone hybrid search, result caching |

---

## Testing Strategy

### Unit Tests
- Claim extraction logic
- DOI resolution
- Search query building
- Template instantiation

### Integration Tests
- End-to-end claim extraction flow
- Search → result → engagement flow
- ORCID verification flow
- Organization creation flow

### E2E Tests
- User extracts claims from uploaded PDF
- User searches for claims and contributes
- User creates journal club from template
- User links ORCID and joins organization

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Claims per active source | 5+ | DB query |
| Claim extraction time | <5 min for 5 claims | User session tracking |
| Search precision | 80%+ | User feedback sampling |
| Search → engagement rate | 30% | Funnel analytics |
| Template adoption | 20% of new deliberations | Template usage tracking |
| ORCID verification rate | 50% of academics | Profile completion rate |

---

## Team Allocation (Suggested)

| Role | Allocation | Focus Areas |
|------|------------|-------------|
| Backend Engineer | 60% | APIs, Prisma schema, external integrations |
| Frontend Engineer | 30% | Claim extraction UI, search UI, templates |
| ML/AI Engineer | 10% | Extraction prompts, embedding pipeline |

---

## Rollout Plan

### Week 1-2: Foundation
- Schema migrations
- External API integrations (Crossref, OpenAlex)
- Basic claim extraction API

### Week 3-4: Core Features
- AI-assisted extraction
- Claim search implementation
- Related arguments panel

### Week 5-6: Templates & Identity
- Deliberation templates
- ORCID integration
- Organization model

### Week 7-8: Polish & Testing
- UI refinements
- Performance optimization
- E2E testing
- Documentation

### Week 9-10: Buffer & Launch
- Bug fixes
- User feedback incorporation
- Gradual rollout

---

## Definition of Done

Phase 1 is complete when:

1. ✅ A user can paste a DOI and get auto-populated source metadata
2. ✅ A user can extract claims manually or with AI assistance
3. ✅ A user can search for claims semantically
4. ✅ A user can see related arguments for any claim
5. ✅ A user can create a deliberation from a journal club template
6. ✅ A user can link and verify their ORCID
7. ✅ A user can create an organization and invite members
8. ✅ All tests pass with >80% coverage on new code
9. ✅ Documentation complete for all new APIs
10. ✅ Performance benchmarks met (<500ms API responses)

---

*Proceed to sub-phase documents for detailed implementation steps.*
