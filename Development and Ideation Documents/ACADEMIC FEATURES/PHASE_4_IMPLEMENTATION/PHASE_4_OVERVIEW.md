# Phase 4: Open Review & Credit — Living Peer Review

**Theme:** Transform peer review from opaque gatekeeping to structured, credited discourse.

**Historical Justification:** Peer review is 350 years old but still opaque. Team science makes granular credit essential.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Living Peer Review Architecture                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                  Review Deliberation                            │     │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │     │
│  │  │   Initial   │  │   Author    │  │  Revision   │            │     │
│  │  │   Review    │─▶│  Response   │─▶│   Round     │─▶ ...      │     │
│  │  │   Phase     │  │   Phase     │  │   Phase     │            │     │
│  │  └─────────────┘  └─────────────┘  └─────────────┘            │     │
│  │         │                │                │                    │     │
│  │         ▼                ▼                ▼                    │     │
│  │  ┌─────────────────────────────────────────────────────┐      │     │
│  │  │            Review Arguments & Moves                  │      │     │
│  │  │  Critique → Response → Resolution → Updated Claim    │      │     │
│  │  └─────────────────────────────────────────────────────┘      │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                 Reputation & Credit System                      │     │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │     │
│  │  │ Contribution │  │   Reviewer   │  │   Defense    │         │     │
│  │  │    Metrics   │  │  Recognition │  │    Stats     │         │     │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │     │
│  │         │                 │                 │                  │     │
│  │         └─────────────────┼─────────────────┘                  │     │
│  │                           ▼                                    │     │
│  │                  ┌──────────────┐                              │     │
│  │                  │   Scholar    │                              │     │
│  │                  │   Profile    │                              │     │
│  │                  └──────────────┘                              │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                  External Credit Integration                    │     │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │     │
│  │  │    ORCID     │  │  CV Export   │  │ Institutional│         │     │
│  │  │ Integration  │  │   (JSON/PDF) │  │  Reporting   │         │     │
│  │  └──────────────┘  └──────────────┘  └──────────────┘         │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Sub-Phases

| Sub-Phase | Focus | Key Deliverables |
|-----------|-------|------------------|
| **4.1** | Public Peer Review Deliberations | Review templates, reviewer commitments, structured author responses |
| **4.2** | Argumentation-Based Reputation | Contribution metrics, defense rates, reviewer recognition |
| **4.3** | Academic Credit Integration | ORCID sync, CV export, institutional reporting |

---

## Timeline

| Week | Focus |
|------|-------|
| 1-4 | Phase 4.1: Review Deliberation System |
| 5-8 | Phase 4.2: Reputation Metrics |
| 9-12 | Phase 4.3: External Credit Integration |

---

## Key Concepts

### Review as Deliberation
- Each peer review is a structured deliberation with defined phases
- Reviewer critiques are typed arguments with schemes
- Author responses follow dialogue move patterns
- Outcome is a transparent "reviewed claim map"

### Living Review
- Review continues post-publication
- New challenges can be raised at any time
- Author can update and respond perpetually
- Creates a living record of scientific discourse

### Granular Credit
- Every contribution is tracked and attributed
- Different contribution types (curation, review, synthesis, objection)
- Success metrics based on argument outcomes
- External verification via ORCID

---

## Dependencies

- Phase 1: Argumentation foundation (schemes, claims, arguments)
- Phase 2: Source attestation (paper integration)
- Phase 3: Provenance tracking (version history, challenges)

---

*End of Phase 4 Overview*
