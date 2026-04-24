# Facilitation C0 Architecture Review — Decision Log

Status: Draft (decisions to be filled at the end of week 12 review meeting)
Companion: [docs/facilitation/REVIEW_AGENDA.md](REVIEW_AGENDA.md)

## Pre-locked decisions (from roadmap §9)

The following 7 decisions were locked during roadmap drafting and are **not** open for re-litigation in the C0 review unless new evidence is presented.

| # | Decision | Status | Notes |
|---|----------|--------|-------|
| R1 | Single OPEN session per deliberation | Approved | Partial unique index `WHERE status = 'OPEN'` shipped as raw SQL in migration. |
| R2 | Three-tier check failure: BLOCK / WARN / INFO | Approved | BLOCK gates lock; WARN requires acknowledgement; INFO is advisory. |
| R3 | Snapshots are first-class with `metricVersion` + 30-day post-close downsample to ~5-min buckets + `isFinal` and intervention-referenced snapshots pinned indefinitely | Approved with nuances | See [docs/facilitation/EQUITY_METRICS.md](EQUITY_METRICS.md) "Worker cadence and snapshot lifecycle". |
| R4 | Required free-text + optional structured tag for intervention dismissal | Approved | Tags: `not_relevant` / `already_addressed` / `wrong_target` / `other`. |
| R5 | Public-read opt-in per deliberation, gated by visibility, redacted (sha256(authId)[:12], summarized rationales) | Approved | Single redaction helper enforces (`lib/facilitation/auth.ts → redactForPublicRead`). |
| R6 | No LLM in v1 question assistant | Approved | All checks are rules + lexicons; i18n stub returns INFO only for non-English. |
| R7 | No cross-room facilitation rollups in v1 | Deferred | Revisit in v1.1 once at least 3 deliberations have been run end-to-end. |

## Review-meeting decisions (to be filled)

1. **Schema deltas** (incl. 4 MIGRATION_DRAFT open issues)
   - --

2. **API + authorization matrix**
   - --

3. **Hash chain + snapshot retention policy**
   - --

4. **Equity metric v1 formulas and thresholds**
   - --

5. **Intervention rule catalogue** (incl. `cooldownRule` default-off; `evidenceGapRule` / `cooldownRule` exempt from "every rule references a snapshot" invariant)
   - --

6. **Question check catalogue** (incl. `BIAS` stub, per-deliberation severity-ceiling override)
   - --

7. **UX information architecture** (incl. 4 open WIREFRAMES questions; minimal-mode default for new facilitators)
   - --

8. **Rollout sequence and pilot triggers**
   - --

9. **Scope A stage-gate exit verified** (hash-chain verification production-clean, telemetry sufficient for C to consume)
   - --

10. **Phase C1 GO / NO-GO**
    - --

## Open issues carried forward

To be reconciled by responses to decisions 1, 5, 7 above. Listed here for the agenda to make visible:

- MIGRATION_DRAFT — 4 open issues at end of file.
- WIREFRAMES — 4 open UX questions (incl. minimal-mode default).
- INTERVENTION_RULES — explicit recommendation: do **not** synthesize a snapshot for `evidenceGapRule` / `cooldownRule` in v1; document the exception instead.
- QUESTION_CHECKS — `BIAS` ships as reserved enum, no active heuristics; revisit in v1.1.
- ROADMAP §9 R7 — cross-room rollups deferred; revisit after 3+ deliberations.
