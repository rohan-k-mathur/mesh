# Typology — B0 Design Decisions (Locked)

Status: Locked
Locked on: April 23, 2026
Parent roadmap: [docs/DelibDemocracyScopeB_Roadmap.md](../DelibDemocracyScopeB_Roadmap.md) §9

All eight recommended answers in §9 of the Scope B roadmap were approved verbatim. No nuances were attached.

| # | Decision | Locked answer |
|---|----------|---------------|
| 1 | **Axis count and identity** | Ship the four axes (`VALUE` / `EMPIRICAL` / `FRAMING` / `INTEREST`) as v1 with `axisVersion` pinning on every tag. Taxonomy is not relitigated in v1. |
| 2 | **Tag confirmation model** | Every persisted `DisagreementTag` requires explicit human confirmation. Seeders only enqueue `TypologyCandidate` rows. No auto-confirmed tags in v1. |
| 3 | **Summary scope** | Summaries are session-scoped by default (`MetaConsensusSummary.sessionId IS NOT NULL`). A deliberation-scoped variant is allowed when multiple sessions converge (`sessionId IS NULL`). No cross-deliberation summaries in v1. |
| 4 | **Snapshot policy** | `snapshotJson` freezes referenced tag ids + `axisVersion` + claim/argument text on publish. Editing a published summary requires a new version row pointing at `parentSummaryId`. |
| 5 | **Public read posture** | Opt-in per deliberation, gated by deliberation visibility, with the same redactor used by Scope A and Scope C (`redactForPublicRead`). |
| 6 | **Seeder participation** | Seeders ship behind individual feature flags. Default-on: `interventionSeeder`, `repeatedAttackSeeder`. Default-off until partner-reviewed: `valueLexiconSeeder`, `metricSeeder`. |
| 7 | **Cross-deliberation reconciliation** | Not in v1. Defer until at least one pilot deliberation is complete and a real reconciliation use case exists. |
| 8 | **LLM in summary drafter** | Not in v1. Re-evaluate after pilot data. |

## Implications captured downstream

- **Migration**: locked enum and table shapes — see [MIGRATION_DRAFT.md](MIGRATION_DRAFT.md).
- **API surface**: locked routes — see [API.md](API.md). The publish endpoint enforces decision #4 (snapshot freeze + 256 KiB cap).
- **Authorization**: locked role table — see [AUTH_MATRIX.md](AUTH_MATRIX.md). Decision #5 wires the public-read redactor into every read route.
- **Seed**: axis registry is seeded once after migration via [`prisma/seed/typologyAxes.ts`](../../prisma/seed/typologyAxes.ts) (decision #1).
- **Roadmap**: §9 in [docs/DelibDemocracyScopeB_Roadmap.md](../DelibDemocracyScopeB_Roadmap.md) marked locked; §10 updated to reflect B0 deliverable status.

## Out-of-band items not relitigated

The following were considered and explicitly deferred at the same review (parity with Scope C's deferral discipline):

- LLM-assisted typology classification — captured for v1.1 backlog; not in scope.
- Cross-deliberation typology reconciliation — captured for v1.1 backlog; not in scope.
- A fifth axis (e.g. `PROCEDURAL`, `EPISTEMIC`) — captured for v1.1 backlog; not in scope. The `axisVersion` pin and registry table shape make this a non-breaking future addition.
