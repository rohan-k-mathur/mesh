# Phase 3: Knowledge Graph — Implementation Overview

**Phase:** 3 of 6  
**Timeline:** Q3 2026  
**Theme:** Claim Provenance & Citation Intelligence  
**Status:** Planning

---

## Executive Summary

Phase 3 builds the "argument graph layer" between papers and metrics. Just as citation indexing (1964) transformed discovery by linking papers, argument-level linking is the next evolutionary step.

**Key Insight:** Scholarly knowledge isn't just papers citing papers — it's claims supporting, refuting, and building upon other claims across contexts.

---

## Sub-Phases

| Sub-Phase | Focus | Timeline |
|-----------|-------|----------|
| 3.1 | Claim Provenance Tracking | Weeks 1-4 |
| 3.2 | Argument-Level Citations | Weeks 5-8 |
| 3.3 | Cross-Deliberation Claim Mapping | Weeks 9-12 |

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                     KNOWLEDGE GRAPH ARCHITECTURE                             │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   PAPER LAYER (Traditional)                                                  │
│   ┌────────────────────────────────────────────────────────────────────────┐ │
│   │  📄 Paper A ───────cites────────▶ 📄 Paper B                           │ │
│   │       │                                │                               │ │
│   │       │ contains                       │ contains                      │ │
│   │       ▼                                ▼                               │ │
│   └───────┼────────────────────────────────┼───────────────────────────────┘ │
│           │                                │                                 │
│   ════════╪════════════════════════════════╪═══════════════════════════════  │
│           │                                │                                 │
│   CLAIM LAYER (New!)                       │                                 │
│   ┌───────┼────────────────────────────────┼───────────────────────────────┐ │
│   │       ▼                                ▼                               │ │
│   │   ┌───────┐                        ┌───────┐                           │ │
│   │   │Claim 1│────────supports───────▶│Claim 4│                           │ │
│   │   └───────┘                        └───────┘                           │ │
│   │       │                                │                               │ │
│   │       │ challenged by                  │ equivalent to                 │ │
│   │       ▼                                ▼                               │ │
│   │   ┌───────┐                        ┌───────┐                           │ │
│   │   │Claim 2│                        │Claim 5│ (in Deliberation X)       │ │
│   │   └───────┘                        └───────┘                           │ │
│   │       │                                                                │ │
│   │       │ evolved from                                                   │ │
│   │       ▼                                                                │ │
│   │   ┌───────┐                                                            │ │
│   │   │Claim 3│ (v1 → v2 → v3)                                             │ │
│   │   └───────┘                                                            │ │
│   │       │                                                                │ │
│   │       │ canonical: claim:abc123                                        │ │
│   │       ▼                                                                │ │
│   │   ┌─────────────────────────────────────────────────────────────────┐  │ │
│   │   │                  CANONICAL CLAIM REGISTRY                       │  │ │
│   │   │  claim:abc123 appears in:                                       │  │ │
│   │   │    - Deliberation A (as Claim 1)                                │  │ │
│   │   │    - Deliberation B (as Claim 7)                                │  │ │
│   │   │    - Deliberation C (as Claim 3, forked)                        │  │ │
│   │   │  Status: CONTESTED                                              │  │ │
│   │   │  Challenges: 3 active, 2 defended                               │  │ │
│   │   └─────────────────────────────────────────────────────────────────┘  │ │
│   └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│   ARGUMENT LAYER                                                             │
│   ┌────────────────────────────────────────────────────────────────────────┐ │
│   │                                                                        │ │
│   │   Argument A1 (Smith 2023, Arg. 3)                                     │ │
│   │   ┌────────────────────────────────────────────────────────────┐       │ │
│   │   │ Premises: [Claim 1, Claim 2]                               │       │ │
│   │   │ Conclusion: Claim 4                                        │       │ │
│   │   │ Scheme: Argument from Expert Opinion                       │       │ │
│   │   │ Permalink: agora.edu/arguments/arg-xyz789                  │       │ │
│   │   │                                                            │       │ │
│   │   │ Cited by: [Arg B2, Arg C1, Arg D5]                         │       │ │
│   │   │ Attacks: [Undercut by Arg E3]                              │       │ │
│   │   └────────────────────────────────────────────────────────────┘       │ │
│   │                                                                        │ │
│   └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│   CHALLENGE/ATTACK TRACKING                                                  │
│   ┌────────────────────────────────────────────────────────────────────────┐ │
│   │                                                                        │ │
│   │   GET /api/claims/:id/challenges                                       │ │
│   │   ┌────────────────────────────────────────────────────────────┐       │ │
│   │   │ {                                                          │       │ │
│   │   │   claim: { id, text, status },                             │       │ │
│   │   │   challenges: {                                            │       │ │
│   │   │     rebuttals: [attacks on conclusion],                    │       │ │
│   │   │     undercuts: [attacks on inference],                     │       │ │
│   │   │     undermines: [attacks on premises]                      │       │ │
│   │   │   },                                                       │       │ │
│   │   │   defenses: [...],                                         │       │ │
│   │   │   resolutionStatus: "open" | "defended" | "conceded"       │       │ │
│   │   │ }                                                          │       │ │
│   │   └────────────────────────────────────────────────────────────┘       │ │
│   │                                                                        │ │
│   └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Sub-Phase 3.1: Claim Provenance Tracking

**Goal:** Track the origin and evolution of claims across the scholarly discourse.

### Key Features

1. **Claim Origin Tracking**
   - Record first assertion (paper + date)
   - Link to original source
   - Track who introduced the claim

2. **Evolution Timeline**
   - Version history of claim refinements
   - Track challenges and status changes
   - Show consensus evolution over time

3. **"What Challenges This?" Query**
   - API to find all attacks on a claim
   - Group by attack type (rebut/undercut/undermine)
   - Track defenses and resolution status

4. **Canonical IDs**
   - Stable identifiers across contexts
   - Same claim recognized across deliberations

---

## Sub-Phase 3.2: Argument-Level Citations

**Goal:** Enable citing specific arguments, not just papers.

### Key Features

1. **Argument Citation Model**
   - Cite "Smith 2023, Argument 3"
   - Stable argument permalinks
   - Citation context (why citing)

2. **Citation Graph Visualization**
   - Visualize argument citation networks
   - Claim dependency graphs
   - Cross-deliberation links

3. **Export Formats**
   - BibTeX/RIS with argument-level resolution
   - DOI-like identifiers for arguments

---

## Sub-Phase 3.3: Cross-Deliberation Claim Mapping

**Goal:** Connect claims across different deliberations and contexts.

### Key Features

1. **Canonical Claim Registry**
   - Global registry of canonical claims
   - Mark claims as equivalent across contexts
   - Cross-room search functionality

2. **Argument Transport**
   - Import arguments from other deliberations
   - Preserve provenance on import
   - Adaptation layer for context differences

3. **Claim Similarity Detection**
   - Semantic matching for similar claims
   - Suggest equivalences to users
   - Alert when related claims appear elsewhere

---

## Deliverables Summary

| Deliverable | Description | User Value |
|-------------|-------------|------------|
| Claim provenance | Track origin and evolution | Understand claim history |
| Challenge tracking | See all attacks and defenses | Evaluate claim strength |
| Argument permalinks | Stable citable URIs | Precise scholarly citation |
| Citation graph | Visualize argument relationships | Discover connections |
| Canonical registry | Cross-context claim identity | Connect scattered discussions |
| Argument import | Reuse arguments across deliberations | Build on prior work |

---

## Technical Dependencies

| Dependency | From Phase | Required For |
|------------|------------|--------------|
| Claim model | Phase 1.1 | Provenance tracking |
| Argument model | Phase 1.2 | Argument citations |
| Attack types | Phase 1.2 | Challenge grouping |
| Release system | Phase 2.1 | Version tracking |
| Fork system | Phase 2.2 | Cross-deliberation mapping |

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Graph query performance | High | Use graph database or materialized views |
| Canonical ID collisions | Medium | Robust deduplication algorithm |
| Citation format compatibility | Medium | Validate against major formats |
| Cross-deliberation privacy | Medium | Permission checks on import |

---

## Rollout Plan

| Week | Milestone | Key Deliverables |
|------|-----------|------------------|
| 1-2 | Claim History | ClaimVersion model, provenance API |
| 3-4 | Challenge Query | Attack grouping, resolution tracking |
| 5-6 | Argument Citations | Permalinks, citation model |
| 7-8 | Citation Graph | Visualization component |
| 9-10 | Canonical Registry | Global claim registry, equivalence |
| 11-12 | Argument Transport | Import/export, cross-deliberation linking |

---

## Next Steps

Proceed to detailed implementation documents:
- **Phase 3.1**: Claim Provenance Tracking (Parts 1-2)
- **Phase 3.2**: Argument-Level Citations (Parts 1-2)
- **Phase 3.3**: Cross-Deliberation Claim Mapping (Parts 1-2)

---

*End of Phase 3 Overview*
