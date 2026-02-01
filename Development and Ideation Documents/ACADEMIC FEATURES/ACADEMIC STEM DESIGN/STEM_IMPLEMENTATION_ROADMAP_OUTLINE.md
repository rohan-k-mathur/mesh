# Academic Agora for STEM: Implementation Roadmap Outline

**Source Document**: [academic-agora-stem-design-exploration.md](../academic-agora-stem-design-exploration.md)  
**Created**: January 31, 2026  
**Status**: Planning Phase

---

## Overview

This roadmap outlines the implementation plan for extending Academic Agora to serve STEM disciplines. The work is organized into 12 major parts comprising 26 phases, building progressively from foundational infrastructure to discipline-specific modules and adoption strategy.

**Core Insight**: STEM discourse requires not just argumentation about claims but **verification** of the empirical grounding that makes claims testable. The platform must become both a discourse layer and a verification layer.

---

## Part I: Foundation & Core Infrastructure

### Phase 0: Prerequisites & Audit
- Assess existing HSS platform capabilities
- Identify database schema extension points
- Audit current Claim/Argument/Scheme architecture
- Define API versioning strategy for backward compatibility

### Phase 1: Extended Claim Ontology
- 1.1 STEM Claim Type Enumeration (27 new types across 7 categories)
- 1.2 Grounding Requirements Model
- 1.3 GroundedClaim Prisma Schema
- 1.4 GroundingStatus Computation Engine
- 1.5 Migration strategy for existing claims

---

## Part II: Empirical Grounding Layer

### Phase 2: Anchor Models & External Linking
- 2.1 DatasetAnchor model + repository enums (Zenodo, Figshare, OSF, etc.)
- 2.2 CodeAnchor model + repository enums (GitHub, GitLab, Code Ocean)
- 2.3 ProtocolAnchor model + repository enums (protocols.io, JoVE)
- 2.4 ModelAnchor model
- 2.5 Unified Grounding Link abstraction

### Phase 3: Verification Engine (Core)
- 3.1 Accessibility verification (link checking, DOI resolution)
- 3.2 Hash verification & versioning
- 3.3 Verification status tracking & history
- 3.4 Automated verification scheduling (cron jobs)

---

## Part III: Computational Reproducibility Infrastructure

### Phase 4: Code Execution Pipeline
- 4.1 Code retrieval & commit-pinned fetching
- 4.2 Environment specification parsing (Docker, requirements.txt, etc.)
- 4.3 Integration options evaluation (Binder, Code Ocean, self-hosted runners)
- 4.4 Sandboxed execution layer
- 4.5 Output capture & comparison engine

### Phase 5: Verification Reports
- 5.1 VerificationReport Prisma model
- 5.2 VerificationVerdict computation
- 5.3 Report UI components
- 5.4 Public verification history display

---

## Part IV: Statistical Verification Layer

### Phase 6: Statistical Parsing & Validation
- 6.1 Statistical statement parser (t-tests, F-tests, p-values, CIs, effect sizes)
- 6.2 Consistency checks (GRIM, SPRITE, impossible statistics detection)
- 6.3 Derived measure computation (effect size from t and df)
- 6.4 Automated statistical checks API

### Phase 7: Statistical Enrichment UI
- 7.1 Parsed statistics display component
- 7.2 Automated checks warnings/errors display
- 7.3 Power analysis integration
- 7.4 Contextual field-level comparison (literature baselines)

---

## Part V: Replication Tracking System

### Phase 8: Replication Data Model
- 8.1 Replication Prisma model (type, similarity, status)
- 8.2 Replication-to-Claim linking
- 8.3 Effect size tracking across replications
- 8.4 Meta-analytic aggregation computation

### Phase 9: Replication UI & Dashboard
- 9.1 Replication status summary card
- 9.2 Replication timeline visualization
- 9.3 Forest plot / effect size visualization
- 9.4 Register new replication workflow
- 9.5 Automated replication detection (paper scanning)

---

## Part VI: New Argumentation Schemes for STEM

### Phase 10: Empirical Schemes
- 10.1 Argument from Statistical Inference (with 8 CQs)
- 10.2 Argument from Replication (with 7 CQs)
- 10.3 Argument from Mechanism (with 6 CQs)

### Phase 11: Computational Schemes
- 11.1 Argument from Computational Experiment (with 7 CQs)
- 11.2 Argument from Model Fit (with 7 CQs)

### Phase 12: Meta-Scientific Schemes
- 12.1 Argument from Meta-Analysis (with 7 CQs)
- 12.2 Scheme-to-verification layer integration

---

## Part VII: Picturing Face Implementation

### Phase 13: Prediction Registration & Tracking
- 13.1 ClaimPrediction Prisma model
- 13.2 ClaimOutcome Prisma model
- 13.3 Prediction-Outcome matching logic
- 13.4 Prediction registration UI

### Phase 14: Picturing Score Computation
- 14.1 PicturingScore interface & algorithm
- 14.2 Calibration computation
- 14.3 Overall grounding status derivation
- 14.4 Dual-face claim card UI (Signifying + Picturing)

---

## Part VIII: Integration Ecosystem

### Phase 15: Data Repository Integrations
- 15.1 Zenodo API integration
- 15.2 Figshare API integration
- 15.3 OSF API integration
- 15.4 Domain-specific (GenBank, PDB, GEO, etc.)

### Phase 16: Code Repository Integrations
- 16.1 GitHub API (commits, releases, file access)
- 16.2 GitLab API
- 16.3 Binder/Code Ocean integration

### Phase 17: Academic Infrastructure
- 17.1 Crossref DOI resolution
- 17.2 ORCID identity linking
- 17.3 OpenAlex / Semantic Scholar metadata
- 17.4 Pre-registration registry linking (OSF Registries, ClinicalTrials.gov)

---

## Part IX: Discipline-Specific Modules

### Phase 18: Module Architecture
- 18.1 Plugin/module system design
- 18.2 Domain configuration schema
- 18.3 Claim type extensibility
- 18.4 Scheme extensibility

### Phase 19: Priority Discipline Modules
- 19.1 Psychology/Social Sciences Module
- 19.2 Computer Science (ML/AI) Module
- 19.3 Life Sciences Module
- 19.4 Medicine/Clinical Module

---

## Part X: UI/UX Paradigms

### Phase 20: Core STEM UI Components
- 20.1 Empirical Claim Card (dual-face display)
- 20.2 Replication Timeline View
- 20.3 Data-Argument Traceability View
- 20.4 Verification badge system

### Phase 21: Visualization Components
- 21.1 Forest plots
- 21.2 Effect size timeline charts
- 21.3 Funnel plots (publication bias)
- 21.4 Domain-specific visualizations (per-module)

---

## Part XI: Governance & Quality Assurance

### Phase 22: Verification Tiers
- 22.1 Tier definitions & badge system
- 22.2 Tier progression logic
- 22.3 Tier display in UI

### Phase 23: Domain Expert System
- 23.1 DomainExpert Prisma model
- 23.2 Expert verification workflow
- 23.3 Expert accuracy tracking

### Phase 24: Conflict of Interest Management
- 24.1 ConflictDeclaration model
- 24.2 COI disclosure workflow
- 24.3 Permission restrictions based on COI

---

## Part XII: Adoption & Launch Strategy

### Phase 25: Pilot Deployment
- 25.1 Phase 1 discipline pilot (Psychology/Social Sciences)
- 25.2 Partnership outreach (COS, SIPS, FORRT)
- 25.3 User feedback collection

### Phase 26: Iterative Expansion
- 26.1 Phase 2-5 discipline rollouts
- 26.2 Journal/repository partnerships
- 26.3 Funding agency alignment

---

## Appendices

### Appendix A: Risk Register & Mitigation Strategies
*To be developed*

### Appendix B: Open Research Questions
- **Technical**: Massive datasets, proprietary data, expensive compute, stochastic results, lab notebook integration
- **Social**: Researcher participation, adversarial verification, gaming prevention, sensitive findings
- **Epistemological**: Replication definitions, evidence weighting, claim settlement, paradigm shifts

### Appendix C: Comparison to Existing Infrastructure
| System | What It Does | What Agora Adds |
|--------|--------------|-----------------|
| **OSF** | Project management, pre-registration | Structured discourse about registered projects |
| **Code Ocean** | Executable code capsules | Link execution to specific claims and arguments |
| **ReplicationWiki** | Catalog of replications | Structured deliberation about replication results |
| **PubPeer** | Post-publication comments | Typed arguments, scheme-based challenges, integration with data |
| **Curate Science** | Track replications and effects | Full deliberation layer, meta-analytic synthesis |
| **Papers With Code** | Link papers to code | Verification pipeline, claim-level code linking |

### Appendix D: Resource & Team Requirements per Phase
*To be developed*

### Appendix E: Dependency Graph
*To be developed - visualizing phase prerequisites*

---

## Document Index

| Document | Description | Status |
|----------|-------------|--------|
| `STEM_IMPLEMENTATION_ROADMAP_OUTLINE.md` | This document - master outline | ✓ Created |
| `PART_I_FOUNDATION_CORE_INFRASTRUCTURE.md` | Detailed Phase 0-1 implementation | Pending |
| `PART_II_EMPIRICAL_GROUNDING_LAYER.md` | Detailed Phase 2-3 implementation | Pending |
| `PART_III_COMPUTATIONAL_REPRODUCIBILITY.md` | Detailed Phase 4-5 implementation | Pending |
| *...additional parts...* | | |

---

*This roadmap is a living document. Each part will be elaborated with detailed task breakdowns, database schemas, API specifications, and acceptance criteria.*
