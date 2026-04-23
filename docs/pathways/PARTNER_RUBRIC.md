# Pilot Institutional Partner — Selection Rubric

Status: Draft v0.1
Parent: [docs/DelibDemocracyScopeA_Roadmap.md](../DelibDemocracyScopeA_Roadmap.md) section 6 (Rollout sequence) and section 10 (Immediate next actions, item 4)
Window: Weeks 1-4 of A0/A1 (identification); pilot engagement begins after master Phase 4

## Purpose

Identify 2-3 institutional partners willing to participate in the closed pilot of the Pathways system. Partner selection drives realistic intake `channel` requirements, validates the per-item disposition workflow, and produces evidence for the deliberative democracy community.

## Partner profile (target)

A good pilot partner is:
1. An institutional recipient of deliberative outputs in the real world (legislature committee, agency, sponsor, internal governance body, advisory board).
2. Already engaged with at least one Mesh deliberation, OR willing to receive a synthetic / convened deliberation.
3. Willing to author or transcribe structured per-item responses within a pilot timeframe (4-8 weeks).
4. Comfortable with public visibility of pathway data (default), or able to commit to time-bounded private pilot with public release at pilot end.

## Disqualifiers

- Cannot commit to at least one acknowledged response cycle within 8 weeks.
- Cannot designate a verifiable institutional contact.
- Requires features explicitly out of scope for Scope A (sortition, public scrutiny portal, multi-modal contributions).
- Legal or compliance constraints prevent storage of response data on Mesh.

## Scoring rubric

Score each candidate 0-3 on each dimension. Total range: 0-30. Recommend partners with total >= 21 and no zero scores on critical dimensions (marked *).

| Dimension | 0 | 1 | 2 | 3 |
|-----------|---|---|---|---|
| **Institutional fit** \* | Not a recognized institutional recipient | Informal advisory only | Established recipient, intermittent | Established recipient with regular intake process |
| **Engagement readiness** \* | No deliberation linkage | Synthetic deliberation only | Live deliberation in flight | Multiple live deliberations targeting this partner |
| **Response capacity** \* | Cannot commit to response cycle | Can acknowledge only | Can author summary response | Can author per-item dispositions in-platform |
| **Channel realism** | Only ad hoc channels | Email-only intake | Formal intake with documented process | API-capable or formal intake with structured outputs |
| **Public transparency comfort** | Requires permanent privacy | Requires private pilot only | Public after pilot end | Public from day one |
| **Pilot timeframe fit** | >12 weeks | 9-12 weeks | 6-8 weeks | 4-6 weeks |
| **Designated contact** \* | None | Single individual, no backup | Primary + backup | Verified team with role-based contacts |
| **Value to research** | Low novelty | Adds one new institutional kind | Adds new jurisdiction or kind | Adds new kind, jurisdiction, and intake pattern |
| **Operational risk** (inverted) | High legal/PR risk | Material risk requiring mitigation | Standard risk | Low risk, partner has done similar pilots |
| **Strategic signal** | Low visibility in DD field | Moderate visibility | High visibility (e.g., Fishkin lab adjacent) | Direct DD-field anchor partner |

\* Critical dimensions; zero score disqualifies.

## Diversity targets across the 2-3 selected partners

Aim for variety across:
- **Kind**: at least two distinct `InstitutionKind` values (e.g., one legislature, one sponsor or advisory board).
- **Jurisdiction**: avoid all partners from a single jurisdiction.
- **Channel**: at least one `in_platform` and one `formal_intake` partner to validate both flows.
- **Public-from-day-one**: at least one partner committing to full public visibility, to test the public read API in production conditions.
- **Linked-deliberation case**: bonus if at least one partner is itself representable as a Mesh deliberation, to validate `Institution.linkedDeliberationId`.

## Candidate intake template

For each candidate, capture:

```
Candidate: <name>
Kind: <legislature | agency | sponsor | internal_governance | advisory_board | other>
Jurisdiction: <region or scope>
Linked deliberation: <yes/no, link if yes>
Primary contact: <name, role, verified channel>
Backup contact: <name, role>
Intake channel: <in_platform | email | formal_intake | api>
Pilot timeframe commitment: <weeks>
Public visibility commitment: <day-one | post-pilot | private-only>

Scores (0-3 each):
- Institutional fit:
- Engagement readiness:
- Response capacity:
- Channel realism:
- Public transparency comfort:
- Pilot timeframe fit:
- Designated contact:
- Value to research:
- Operational risk:
- Strategic signal:
Total: <0-30>
Disqualifiers: <none | list>
Notes: <free text>
```

## Outreach process (suggested)

Week 1:
- Compile longlist of 8-12 candidates from existing Mesh deliberation partners, civic-tech network, and DD-field contacts (Fishkin lab, OECD network, Participedia adjacent).
- Initial outreach with one-page Pathways summary (derived from roadmap section 1).

Week 2:
- 30-minute discovery calls with responsive candidates.
- Score against rubric.
- Internal shortlist meeting.

Week 3:
- Send formal pilot invitation with pilot agreement template (covering: data scope, response commitments, public visibility, exit terms).

Week 4:
- Confirm 2-3 partners.
- Schedule pilot kickoff for end of master Phase 4.

## One-page partner summary (template)

To be sent to candidates during outreach. Lives at `docs/pathways/PARTNER_SUMMARY.md` once drafted.

Required sections:
1. What Pathways tracks.
2. What we ask of the institution.
3. What the institution receives in return (structured accountability record, public legitimacy artifact, optional research case study).
4. Time and effort estimate.
5. Visibility and data control terms.
6. Exit terms.

## Pilot agreement essentials

The formal pilot agreement (legal-reviewed) should cover at minimum:
- Scope of data captured (recommendation packets and structured responses; no member contact data beyond what the partner provides).
- Channel of response (in-platform, email, formal intake, API).
- Response commitment (acknowledge within X days; respond within Y days).
- Public visibility (day-one, post-pilot, or private with explicit release decision).
- Withdrawal terms (partner may withdraw; data treatment on withdrawal).
- Research use of pilot outcomes (anonymized aggregate metrics; case study with partner approval).

## Coordination checklist

- [ ] Longlist compiled (week 1)
- [ ] Outreach materials reviewed by Product + Research (week 1)
- [ ] Discovery calls scheduled (weeks 1-2)
- [ ] Rubric scored for all responsive candidates (week 2)
- [ ] Shortlist internal review (week 2)
- [ ] Pilot agreement template legal-reviewed (week 2-3)
- [ ] Formal invitations sent (week 3)
- [ ] 2-3 partners confirmed (week 4)
- [ ] Pilot kickoff scheduled (post master Phase 4)
