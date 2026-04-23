# Deliberative Democracy Integration Roadmap (Skeletal Outline)

Status: Draft v0.1
Source analysis: docs/DelibDemocracyGapAnalysis.md
Primary audience: Product, Research, Design, and Engineering teams preparing for collaboration with deliberative democracy practitioners (for example Fishkin-style labs and civic partners).

Current focus decision (April 2026):
- In scope now: Scope A (Deliberative system connectivity), Scope B (Meta-deliberation and disagreement intelligibility), Scope C (Facilitation architecture).
- Deferred indefinitely for now: Scope D (Communicative pluralism), Scope E (Sortition and legitimacy infrastructure), Scope F (Mini-public to macro-public transmission).
- Implementation order for active scopes: A -> C -> B.

## Active Timeline (A -> C -> B)

30-second plan summary:
- Weeks 1-10 (Scope A / WS1): Build institutional pathway and lifecycle traceability foundations (events, provenance, pathway views, response tracking).
- Weeks 11-18 (Scope C / WS3): Ship facilitation cockpit v1 (question design, equity monitoring, intervention support) on top of Scope A telemetry.
- Weeks 19-28 (Scope B / WS2): Ship disagreement typology and meta-consensus outputs integrated into facilitation and institutional reporting.
- Weeks 29-38: Harden and integrate A/C/B end-to-end; finalize pilot runbooks and training.
- Weeks 39-52: Run pilots and validate traceability, facilitation quality, and disagreement intelligibility outcomes.

Stage gates:
- Gate 1: Scope A lifecycle instrumentation complete before full Scope C rollout.
- Gate 2: Scope C workflow baselines stable before full Scope B rollout.
- Gate 3: Integrated A/C/B pilot readiness review passed before pilot execution.

## 1) Purpose of this document

This roadmap translates the gap analysis into an implementable, phase-based plan.

Goals:
- Convert theory-level gaps into concrete product and platform workstreams.
- Sequence work so each phase can be shipped, evaluated, and iterated.
- Preserve existing Isonomia core architecture while adding civic-infrastructure layers.

Non-goals:
- Replacing ASPIC+, Walton, or existing claim-first deliberation architecture.
- Locking final UI/UX details before research and pilot validation.

## 2) Problem scopes and diagnoses (Round 1 understanding)

### Scope A: Deliberative system connectivity
Diagnosis:
- Current Plexus links mostly represent argumentative relationships.
- Missing explicit representation of institutional pathways from deliberation output to decision outcomes.
- Transmission is represented as exportability, not accountability traceability.

Product implication:
- Add institutional pathway graphing and response tracking as first-class capabilities.

### Scope B: Meta-deliberation and disagreement intelligibility
Diagnosis:
- Unresolved disagreements are visible structurally, but not typed by disagreement nature.
- Decision-makers cannot distinguish value conflict vs evidence conflict vs framing mismatch.

Product implication:
- Add disagreement typology and meta-consensus summaries.

### Scope C: Facilitation as core system capability
Diagnosis:
- Facilitation exists as a role-based practice, not a platform subsystem.
- Missing tools for question quality, equity monitoring, and intervention support.

Product implication:
- Build facilitation cockpit: question design, equity telemetry, and intervention prompts.

### Scope D: Communicative pluralism
Diagnosis:
- Claim-first architecture allows non-formal expression at discussion layer, but map-level affordances still favor formal argument objects.
- Narrative/testimonial/visual contributions lack equal representational standing in core deliberation views.

Product implication:
- Introduce typed non-argument contribution nodes with explicit linking semantics.

### Scope E: Representativeness and legitimacy infrastructure
Diagnosis:
- Open-participation model works for community use but not for mini-public legitimacy.
- No integration path for externally operated sortition pipelines.

Product implication:
- Add sortition-compatible participant provisioning, role partitioning, and representativeness auditing.

### Scope F: Mini-public to macro-public transmission
Diagnosis:
- Deliberation outputs are not fully designed as public reasoning artifacts with challenge-response lifecycle.
- External scrutiny and institutional response loops are under-specified.

Product implication:
- Create public deliberation layer with external challenge workflows and versioned response rounds.

## 3) Workstream model

Cross-functional workstreams:
- WS1 Institutional Pathways
- WS2 Meta-Consensus and Disagreement Typology
- WS3 Facilitation Architecture
- WS4 Multi-Modal Contribution Model
- WS5 Sortition and Access Governance
- WS6 Public Scrutiny and Challenge Layer
- WS7 Evaluation, Policy, and Research Partnerships

Active workstream focus (current):
- Active: WS1, WS2, WS3.
- Deferred indefinitely: WS4, WS5, WS6.
- WS7 remains active only as support for evaluation of WS1-WS3.

Execution sequence for active workstreams:
- Sequence: WS1 (Scope A) -> WS3 (Scope C) -> WS2 (Scope B).
- Rationale: WS1 establishes lifecycle and provenance primitives; WS3 uses those primitives for facilitation telemetry and interventions; WS2 is best stabilized after observing real facilitation workflows to reduce taxonomy churn.

Cross-cutting technical foundations:
- Event/audit logging and provenance
- Access control and role policy engine
- Explainability and transparency primitives
- Moderation and safety controls
- Metrics and experimentation instrumentation

## 4) Phase-based implementation timeline (skeletal)

## Phase 0: Discovery and alignment (Weeks 1-4)
Objective:
- Convert conceptual scopes into implementable product specifications and measurable outcomes.

Key outputs:
- Problem statements and hypothesis backlog per workstream.
- Initial data model deltas and API surface proposals.
- Governance and ethics constraints for civic deployments.
- Partner interview synthesis (facilitators, civic designers, assembly sponsors).

Milestones:
- M0.1 Scope acceptance memo
- M0.2 Architecture impact map
- M0.3 Pilot readiness criteria draft

Exit criteria:
- Each workstream has a one-page spec, owner, and measurable success metrics.

## Phase 1: Foundations and observability (Weeks 5-10)
Objective:
- Build shared infrastructure required by all civic-deliberation layers.

Key outputs:
- Institutional event schema (submission, receipt, response, revision).
- Contribution and event instrumentation registry for active scopes (argument, claim, facilitation interventions, disagreement tags, pathway events).
- Role/access primitives needed for active scopes (participants, facilitators, institutional responders, analysts).
- Baseline deliberation equity telemetry (participation distribution, challenge distribution, response latency).

Milestones:
- M1.1 Schema migration package
- M1.2 Role and policy primitives shipped
- M1.3 Telemetry dashboard alpha

Exit criteria:
- Platform can capture and query all deliberation lifecycle events with actor and timestamp provenance.

## Phase 2: Facilitation and meta-consensus MVP (Weeks 11-18)
Objective:
- Deliver first facilitator-facing capabilities and disagreement intelligence.

Key outputs:
- Structured question design assistant (bias checks, clarity checks, balance heuristics).
- Disagreement typology tagging UI and API.
- Meta-consensus summary generator (human editable).
- Facilitator intervention feed based on equity and disagreement patterns.

Ordering note:
- Within this phase sequence, prioritize Facilitation Architecture implementation first (Scope C), then complete Meta-Consensus and Disagreement Typology implementation (Scope B).
- A lightweight taxonomy design spike for Scope B can run during late Scope A/early Scope C, but full Scope B implementation follows Scope C.

Milestones:
- M2.1 Question design tool beta
- M2.2 Facilitation cockpit v1
- M2.3 Equity monitoring and intervention feed live

Exit criteria:
- Facilitators can run a session with real-time equity diagnostics and intervention support.

## Phase 3: Meta-consensus and disagreement layer (Weeks 19-28)
Objective:
- Implement Scope B on top of live Scope A and Scope C workflows.

Key outputs:
- Disagreement typology tagging UI and API.
- Node-level disagreement typing and confidence metadata.
- Session-level meta-consensus summary generator (human editable).
- Integration of disagreement insights into facilitation cockpit and institutional reports.

Milestones:
- M3.1 Disagreement taxonomy v1 finalized
- M3.2 Typology tagging in production map views
- M3.3 Meta-consensus summary workflow released

Exit criteria:
- Teams can produce structured meta-consensus outputs that distinguish value, empirical, framing, and interest disagreements.

## Phase 4: A/C/B integration hardening and pilot prep (Weeks 29-38)
Objective:
- Stabilize and integrate Scope A, Scope C, and Scope B capabilities for pilot deployment.

Key outputs:
- End-to-end pathway + facilitation + meta-consensus reporting bundle.
- Quality and performance hardening for facilitation cockpit and disagreement workflows.
- Training materials and facilitator playbook for A/C/B workflows.
- Pilot configuration templates and implementation runbooks.

Milestones:
- M4.1 Integrated reporting package v1
- M4.2 Facilitator playbook and training complete
- M4.3 Pilot readiness review passed

Exit criteria:
- At least one pilot can run with production-ready A/C/B features and operational support.

## Phase 5: Pilot programs and validation (Weeks 39-52)
Objective:
- Validate traceability, facilitation quality, and disagreement intelligibility with real pilots using Scopes A/C/B.

Key outputs:
- 2-3 pilot deployments focused on institutional pathway tracking, facilitation support, and meta-consensus outputs.
- Comparative evaluation against baseline process tools.
- Research report package suitable for deliberative democracy community review.
- Prioritized backlog for v2.

Milestones:
- M5.1 Pilot 1 complete + retrospective
- M5.2 Pilot 2 complete + comparative metrics
- M5.3 Public findings and product recommendations

Exit criteria:
- Evidence that the platform improves traceability, facilitation quality, and disagreement clarity in real processes.

## 5) Example epics by workstream

WS1 Institutional Pathways:
- Epic: Institutional actors and obligations model
- Epic: Recommendation packet and response protocol
- Epic: Pathway visualization and accountability report export

WS2 Meta-Consensus:
- Epic: Disagreement taxonomy and ontology
- Epic: Node-level disagreement typing and confidence
- Epic: Session-level meta-consensus synthesis

WS3 Facilitation:
- Epic: Question quality authoring flow
- Epic: Deliberative inequality monitoring
- Epic: Intervention recommendation engine

Deferred workstreams (not scheduled):
- WS4 Multi-Modal Contributions
- WS5 Sortition and Access Governance
- WS6 Public Scrutiny and Challenge Layer

## 6) Metrics and evaluation skeleton

Adoption and process metrics:
- Facilitator usage rate of cockpit features
- Percent of deliberations with disagreement typing coverage
- Percent of recommendations with documented institutional response

Equity and quality metrics:
- Participation concentration index before/after facilitation interventions
- Disagreement typing coverage and consistency
- Time-to-response for institutional pathway events

Legitimacy and transparency metrics:
- Share of recommendations with documented institutional response
- Meta-consensus report usage by decision-makers/facilitators
- Stakeholder trust scores from pilot surveys

## 7) Risks and mitigation skeleton

Risk: Over-formalization reduces accessibility.
Mitigation:
- Preserve progressive formalization defaults and lightweight contribution entry.

Risk: Institutional partners resist accountability visibility.
Mitigation:
- Start with opt-in pilot agreements and tiered transparency settings.

Risk: Scope sequencing drift (B starts before C stabilization) causes taxonomy churn.
Mitigation:
- Enforce stage gates: complete C telemetry and workflow baselines before full B rollout.

Risk: Facilitation recommendations create perceived algorithmic bias.
Mitigation:
- Keep recommendations advisory and auditable; support facilitator override with rationale.

## 8) Delivery model and ownership skeleton

Suggested squad structure:
- Squad A: Institutional Pathways (WS1)
- Squad B: Facilitation Architecture (WS3)
- Squad C: Meta-Consensus and Disagreement Typology (WS2)
- Research Ops: WS7 and pilot evaluation

Cadence:
- 2-week sprints
- 6-8 week phase increments
- End-of-phase partner review and roadmap re-baselining

## 9) Immediate next planning artifacts

Create next:
- PRD-lite for WS1, WS3, and WS2 (2-3 pages each)
- Data model change proposal document
- Pilot partner selection rubric
- Research protocol for facilitation and disagreement-intelligibility outcomes

Decision checkpoint:
- Confirm and lock active sequence as WS1 -> WS3 -> WS2 (Scopes A -> C -> B) for the next implementation cycle.
- Record deferred status of WS4, WS5, and WS6 as indefinite until strategic reprioritization.
