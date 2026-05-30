# Phase 3 closure — WF validator landing + `inheritCQs` retirement

- **date:** 2026-05-29
- **plan:** [FROM_FOLKSONOMY_TO_ONTOLOGY_SCHEMES.md](../Development%20and%20Ideation%20Documents/ARCHITECTURE/FROM_FOLKSONOMY_TO_ONTOLOGY_SCHEMES.md) §Phase 3 (steps 11, 12, 13)
- **spec:** [SCHEMES_IMPL_ADMIN_TIGHTENING.md](../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_IMPL_ADMIN_TIGHTENING.md) §3.1–§3.5

## Outcome

- WF1 / WF2 / WF3 validator shipped at `error` severity from landing.
  Spec 2's phase 2a (warn-only soak) was dissolved because (a) the
  pre-flight back-test surfaced exactly 7 real catalogue defects, which
  were repaired in the same session, and (b) Q-019 had already cleared
  WF3.
- `ArgumentScheme.inheritCQs` column dropped. Catalogue went 25 → 24 rows
  (one stub deletion). Q-019 audit had already shown the column was
  unused (0 rows with `false`).
- Catalogue is `WF1/WF2/WF3`-clean: 24/24 rows pass the validator with
  zero warnings.
- Fingerprint invariant remains green (24 rows, no NULLs, no collisions).

## Pre-flight back-test findings (and disposition)

The plan's step-11 exit ("back-test produces no surprise failures") was
not met on the first run: 7/25 rows failed. Inspection
([scripts/audits/inspect-wf-failures-deep.ts](../scripts/audits/inspect-wf-failures-deep.ts))
showed two root causes — both pre-existing folksonomy artefacts the
migration was designed to surface.

| Row | Problem | Decision |
|---|---|---|
| `practical_reasoning` | 3 legacy CQs (`alternatives`, `feasible`, `side_effects`) duplicated canonical `PR.ALTERNATIVES` / `PR.FEASIBILITY` / `PR.SIDE_EFFECTS` with different `attackType`/`targetScope` | Drop the 3 legacy CQs |
| `negative_consequences` → `practical_reasoning` | Walton's "Argument from Consequences" is a sibling scheme, not a specialization (disjoint CQ set) | Null parent edge |
| `positive_consequences` → `practical_reasoning` | Walton VB-PR style; disjoint CQs | Null parent edge |
| `value_based_pr` → `practical_reasoning` | Disjoint VB.* CQs | Null parent edge |
| `slippery_slope` → `negative_consequences` | Walton SS has own SS.* CQs; sibling within family | Null parent edge |
| `definition_to_classification` → `verbal_classification` | Composes with VC; does not specialize it | Null parent edge |
| `popular_practice` → `popular_opinion` | CQ-key renamed sibling pair (`practice_evidence?` ↔ `acceptance_evidence?`) | Null parent edge |
| `expert-opinion` (dashed) | 2 stub CQs with null `attackType` / `targetScope`; duplicate of well-formed `expert_opinion` (underscored) | Delete row + CQs |

After the cleanup, `clusterTag` carries all the family-membership
semantics that were previously conflated into `parentSchemeId`.

Migration: [scripts/migrations/05-phase3-catalogue-cleanup.ts](../scripts/migrations/05-phase3-catalogue-cleanup.ts).

## Code changes

- **New**: [lib/schemes/validation/validatePresentation.ts](../lib/schemes/validation/validatePresentation.ts)
  — pure validator, 11/11 tests pass
  ([__tests__/lib/schemes/validation/validatePresentation.test.ts](../__tests__/lib/schemes/validation/validatePresentation.test.ts)).
- **New**: [scripts/audits/back-test-wf-validator.ts](../scripts/audits/back-test-wf-validator.ts)
  — CI-runnable, exits non-zero on any catalogue violation.
- **Wired**: POST [app/api/schemes/route.ts](../app/api/schemes/route.ts) and
  PUT [app/api/schemes/[id]/route.ts](../app/api/schemes/[id]/route.ts).
  Validator runs after duplicate-key check, before scheme create / update.
  Returns 400 with `{ violations, warnings }` on error severity; warnings
  ride along in 201 / 200 responses.
- **Schema**: `inheritCQs` column dropped from
  [lib/models/schema.prisma](../lib/models/schema.prisma); `npx prisma db
  push --accept-data-loss --skip-generate` applied to production.
- **Production sweep** (truthy-branch collapsed to `if (parentSchemeId)`):
  - [lib/argumentation/cqInheritance.ts](../lib/argumentation/cqInheritance.ts)
  - [app/api/arguments/[id]/cqs-with-provenance/route.ts](../app/api/arguments/[id]/cqs-with-provenance/route.ts)
  - [lib/aif/graphBuilder.ts](../lib/aif/graphBuilder.ts) (triple emission dropped)
  - [lib/aif/constants.ts](../lib/aif/constants.ts) (`MESH_INHERIT_CQS` retired)
  - [lib/aif/ontologyTypes.ts](../lib/aif/ontologyTypes.ts) (field + JSON-LD mapping)
  - [lib/client/aifApi.ts](../lib/client/aifApi.ts), [app/api/aif/schemes/route.ts](../app/api/aif/schemes/route.ts)
- **Admin UI**:
  - [components/admin/SchemeCreator.tsx](../components/admin/SchemeCreator.tsx) — checkbox removed
  - [components/admin/SchemeHierarchyView.tsx](../components/admin/SchemeHierarchyView.tsx) — `+inherited` badge logic simplified
  - [components/admin/SchemeList.tsx](../components/admin/SchemeList.tsx)
  - [components/arguments/SchemePickerWithHierarchy.tsx](../components/arguments/SchemePickerWithHierarchy.tsx)

## Verification

```text
$ npx tsx --env-file=.env scripts/audits/back-test-wf-validator.ts
loaded 24 kind='argument-scheme' row(s)
results: 24 ok (0 with warnings), 0 fail
=== PASS — every catalogue row passes WF1/WF2/WF3 ===

$ npx tsx --env-file=.env scripts/audits/verify-fingerprint-invariant.ts
loaded 24 kind='argument-scheme' row(s)
[1] non-NULL fingerprint: PASS
[2] stored == computed: PASS
[3] no fingerprint collisions: PASS
=== PASS — all invariants hold ===

$ npx jest __tests__/lib/schemes/
Test Suites: 3 passed, 3 total
Tests:       31 passed, 31 total
```

## Open follow-ups (not blocking)

- Spec 2 §3.3 "no-DB validate endpoint" (`POST /api/schemes/validate`) —
  spec calls for it as a preview affordance; the actual gate is in
  POST/PUT and is sufficient for step-11/12 exit. Defer until UI needs it.
- Spec 2 §3.4 "debounced inline warnings" in `SchemeCreator` — same.
  Currently violations surface on submit.
- The 4 `kind='dialogue-meta'` rows are untouched by Phase 3 (validator
  only runs against argument-scheme kind, and they have no parent edges).
