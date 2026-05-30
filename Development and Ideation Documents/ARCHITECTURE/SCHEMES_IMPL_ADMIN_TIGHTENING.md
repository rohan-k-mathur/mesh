# Schemes Implementation — Spec 2: Admin Tightening (C007 surface)

- **status:** draft
- **owner:** schemes track
- **depends-on:** [`SCHEMES_IMPL_OVERVIEW.md`](SCHEMES_IMPL_OVERVIEW.md), [Spec 5 — Audit Protocols](SCHEMES_IMPL_AUDIT_PROTOCOLS.md), [T003](../../RESEARCH_PROGRAMME/02_THEOREMS_AND_PROOFS/T003-schemes-layered-coherence.md)
- **last-reviewed:** 2026-05-27

## §1 Problem statement

The substrate's scheme-authoring surface
([`components/admin/SchemeCreator.tsx`](../../components/admin/SchemeCreator.tsx),
[`app/api/schemes/route.ts`](../../app/api/schemes/route.ts), and the
`ArgumentScheme` model in [`lib/models/schema.prisma`](../../lib/models/schema.prisma))
currently treats a scheme as an undifferentiated bag of fields. Under
the layered ontology (premise P1), this surface is specifically the
**C007 presentation layer** — and it has three observable deficits:

1. **No creation-time enforcement of T003's coherence conditions.** A
   newly-created scheme can violate
   $\mathcal{B}(\mathcal{S}_S) = \llbracket S \rrbracket$
   (CQ-bundle inconsistency between declared CQs and inherited CQs)
   and the catalogue accepts it silently.
2. **The `inheritCQs: false` flag is incoherent under T003's
   inheritance corollary** (premise P4). Production uses of the flag
   need to be classified and the flag retired or reclassified.
3. **The "Generate from Taxonomy" feature blurs the C006/C007 boundary**
   — taxonomy currently drives CQ-bundle generation, but the verdict
   re-frames taxonomy as a *presentation hint*, not a behaviour
   determinant.

This spec tightens the C007 surface to enforce T003-coherence at
creation time, retires `inheritCQs: false` per the Q-019 audit, and
re-positions "Generate from Taxonomy" as an explicitly C007-layer
operation. It does **not** touch runtime / play-time enforcement
(that's [Spec 3](SCHEMES_IMPL_PROTOCOL_SOUNDNESS.md)) or behaviour-
equality decisions (that's [Spec 4](SCHEMES_IMPL_VERIFIER.md)).

**Premises inherited:** P1, P2 (creation-time half of the soundness
discipline), P4 (`inheritCQs: false` retirement), P5 (no schema
materialisation of layers in this phase).

## §2 Goals and non-goals

**Goals.**

- Add **creation-time well-formedness rules** that enforce T003's
  three coherence conditions on the C007 layer:
  - **WF1 — CQ-bundle consistency:** declared CQs plus inherited CQs
    are mutually consistent (no duplicate `cqKey` with different
    `text` / `attackType` / `targetScope`; no contradictory
    `targetScope` for the same logical referent).
  - **WF2 — Non-vacuity sentinel:** the declared CQ-bundle is non-
    empty (`cq_count ≥ 1`); a separate sentinel rejects "all CQs
    accept every design" cases discoverable cheaply (see §3.2).
  - **WF3 — Inheritance monotonicity:** if `parentSchemeId` is set,
    the child's CQ-key set is a superset of the parent's
    (closing the breach `inheritCQs: false` would have opened).
- Implement the **`inheritCQs: false` retirement** under the
  posture chosen by the [Q-019 audit](SCHEMES_IMPL_AUDIT_PROTOCOLS.md#q-019)
  output:
  - If audit count ≤ 5 and all classified `sibling-misuse` or
    `workaround`: retire the flag (drop the column after migrating
    rows).
  - If audit count > 5 or any classified `genuine-child-different-cqs`:
    reclassify as a sibling marker (rename to a new field with
    correct semantics, e.g. `siblingOf: String?`) and migrate rows.
- Re-position **"Generate from Taxonomy"** ([`lib/argumentation/cqGeneration.ts`](../../lib/argumentation/cqGeneration.ts))
  as a *presentation generator* (C007-only), not a behaviour
  generator. Surface the framing in the UI ("Suggest CQ
  presentation from taxonomy") and document that the generated
  bundle is a *first draft of $\mathcal{S}_S$*, not a *definition of
  $\llbracket S \rrbracket$*.
- Document — but **do not implement** — the scheme-versioning
  follow-on, including the shape it would take if implemented.

**Non-goals.**

- Any change to runtime / room-protocol behaviour (Spec 3 owns this).
- Behaviour-equality / non-redundancy checks (Spec 4 owns this).
- Materialised three-table schema (P5; deferred).
- New scheme-versioning table (deferred; documented only).
- Migration of legacy `Argument`-relation scheme references
  (orthogonal cleanup).

## §3 API contract

### §3.1 Server-side validator: `validateSchemePresentation`

**New module:** `lib/schemes/validation/validatePresentation.ts`

```ts
import type { ArgumentScheme, CriticalQuestion } from "@prisma/client";

export type SchemeDraft = {
  key: string;
  name: string | null;
  summary: string;
  premises: unknown | null;       // JSON; validated by separate schema
  conclusion: unknown | null;
  parentSchemeId: string | null;
  clusterTag: string | null;
  cqs: Array<Pick<
    CriticalQuestion,
    "cqKey" | "text" | "attackType" | "targetScope" | "burdenOfProof" | "requiresEvidence" | "premiseType"
  >>;
  // ...other ArgumentScheme fields elided
};

export type ValidationResult =
  | { ok: true }
  | { ok: false; violations: ValidationViolation[] };

export type ValidationViolation = {
  rule: "WF1" | "WF2-empty" | "WF2-vacuous" | "WF3";
  severity: "warn" | "error";
  message: string;
  cqKey?: string;
  parentCqKey?: string;
};

export async function validateSchemePresentation(
  draft: SchemeDraft,
  ctx: { parentScheme: (ArgumentScheme & { cqs: CriticalQuestion[] }) | null }
): Promise<ValidationResult>;
```

**Severity policy.** During phase 2a (additive), `severity` is always
`"warn"` for WF1/WF2/WF3. Phase 2b promotes them to `"error"`.
Callers respect `severity`: the API route returns `200` with a
`warnings` array in phase 2a; `400` with the violations in phase 2b.

### §3.2 The "vacuous-CQ" sentinel (WF2 second clause)

T003's non-vacuity condition is non-decidable in general (Q-021's
fibre is exactly the problem), so WF2's second clause is a **cheap
syntactic sentinel**, not a semantic check:

```ts
type VacuousCheck = {
  totalCqCount: number;
  cqsTargetingEachScope: { conclusion: number; inference: number; premise: number };
  cqsByAttackType: { REBUTS: number; UNDERCUTS: number; UNDERMINES: number };
  // Sentinel triggers if:
  //   totalCqCount === 0                                            → "WF2-empty"
  //   every CQ has targetScope === null                             → "WF2-vacuous"
  //   no CQ has attackType in {REBUTS, UNDERCUTS, UNDERMINES}       → "WF2-vacuous"
  //   every CQ's text is empty or under 3 chars after trim          → "WF2-vacuous"
};
```

The sentinel is intentionally conservative: it catches scaffolding
mistakes (CQ entries created but never filled in), not semantic
vacuity. Spec 4 handles semantic non-redundancy.

### §3.3 API route changes

**[`app/api/schemes/route.ts`](../../app/api/schemes/route.ts)** —
`POST /api/schemes`:

```diff
- const created = await prisma.argumentScheme.create({ data });
+ const parent = data.parentSchemeId
+   ? await prisma.argumentScheme.findUnique({
+       where: { id: data.parentSchemeId },
+       include: { cqs: true },
+     })
+   : null;
+ const result = await validateSchemePresentation(draft, { parentScheme: parent });
+ if (!result.ok) {
+   const errors = result.violations.filter((v) => v.severity === "error");
+   const warnings = result.violations.filter((v) => v.severity === "warn");
+   if (errors.length > 0) {
+     return NextResponse.json({ error: "well-formedness-violation", violations: errors, warnings }, { status: 400 });
+   }
+   // phase 2a: warn-only — proceed but return warnings in body
+   const created = await prisma.argumentScheme.create({ data });
+   return NextResponse.json({ created, warnings }, { status: 200 });
+ }
+ const created = await prisma.argumentScheme.create({ data });
```

**[`app/api/schemes/[id]/route.ts`](../../app/api/schemes/[id]/route.ts)** —
`PATCH` and **[`app/api/schemes/[id]/cqs/route.ts`](../../app/api/schemes/[id]/cqs/route.ts)** —
`POST`: same validator invocation, scoped to the post-edit draft.

### §3.4 Client-side preview validator

**[`components/admin/SchemeCreator.tsx`](../../components/admin/SchemeCreator.tsx)**
gains a non-blocking inline preview that calls a thin
`POST /api/schemes/validate` endpoint (new, no DB write) and renders
warnings beside the relevant CQ row or parent-scheme picker.

Phase 2a: warnings are advisory; the Submit button remains enabled
with a "Submit anyway" affordance. Phase 2b: warnings escalate to
errors and Submit becomes disabled until they're resolved (with a
documented "override" admin role for emergencies).

### §3.5 `inheritCQs` retirement / reclassification

The migration shape depends on the Q-019 audit output (see §5.3
below). Two API shapes are documented; the implementer chooses the
one matching the audit's recommendation.

**Shape A — Retirement (audit count ≤ 5, no genuine uses):**

```diff
 model ArgumentScheme {
   // ...
-  inheritCQs Boolean @default(true) // Whether to inherit parent scheme's CQs
   // ...
 }
```

`POST /api/schemes` and `PATCH /api/schemes/[id]` reject `inheritCQs`
in the body during phase 2c-A with a 400 + deprecation message. After
soak, the column is dropped.

**Shape B — Reclassification as sibling marker (audit count > 5 or
genuine uses found):**

```diff
 model ArgumentScheme {
   // ...
-  inheritCQs Boolean @default(true)
+  siblingOf  String? @db.VarChar(64) // Marks this scheme as a sibling of the named scheme; replaces the (incoherent) inheritCQs: false semantics
+  sibling    ArgumentScheme? @relation("SchemeSibling", fields: [siblingOf], references: [id], onDelete: SetNull)
+  siblings   ArgumentScheme[] @relation("SchemeSibling")
   // ...
+  @@index([siblingOf])
 }
```

Migration: for each row where `inheritCQs = false`:

- If `intent = sibling-misuse` (per audit): set `siblingOf =
  parentSchemeId`, set `parentSchemeId = NULL`.
- If `intent = workaround`: set `inheritCQs = true` (i.e. fix the
  workaround) and file a follow-on issue describing what the author
  was trying to express.
- If `intent = genuine-child-different-cqs`: convert to a top-level
  scheme (`parentSchemeId = NULL`) and copy the parent's CQs into
  the child's CQ list (preserving behaviour at the cost of
  redundancy), then file a follow-on for proper modelling.

## §4 Data model

### §4.1 No new tables in phase 2a / 2b

The well-formedness rules are validator-side; the schema is unchanged.

### §4.2 Phase 2c schema diff (one of Shape A or Shape B)

See §3.5 for the two diff shapes. Migration name template:

- Shape A: `prisma/migrations/<ts>_retire_inherit_cqs/migration.sql`
- Shape B: `prisma/migrations/<ts>_reclassify_inherit_cqs_as_siblingof/migration.sql`

### §4.3 Documented deferral: scheme versioning

**Not implemented in this spec.** The shape it *would* take, for
future reference:

```prisma
model ArgumentSchemeVersion {
  id              String          @id @default(cuid())
  schemeId        String
  scheme          ArgumentScheme  @relation(fields: [schemeId], references: [id], onDelete: Cascade)
  versionNumber   Int             // monotonic per scheme
  snapshot        Json            // full ArgumentScheme row + CQs at this version
  createdAt       DateTime        @default(now())
  createdById     String?
  changeReason    String?

  @@unique([schemeId, versionNumber])
  @@index([schemeId])
}
```

And `ArgumentSchemeApplication` (or `ArgumentSchemeInstance`,
whichever the substrate settles on) would gain `schemeVersionId
String?` to pin instances to the version of the scheme they
instantiated. Out of scope for this spec; documented so a future
spec doesn't re-discover the shape.

## §5 Migration plan

Five phases. Phases 2a–2c are sequential; phase 2d (Generate from
Taxonomy reframing) can run in parallel with any of them.

### Phase 2a — Validator landing, warn-only

1. Land `lib/schemes/validation/validatePresentation.ts` with WF1,
   WF2, WF3 implemented but `severity = "warn"` for all violations.
2. Land `POST /api/schemes/validate` (no-DB endpoint).
3. Wire client-side preview in `SchemeCreator.tsx`.
4. Modify `POST /api/schemes` to call the validator and return
   warnings in the response body.
5. Soak: one calendar month. Monitor warning rates by rule.

**Acceptance gate to 2b:** monthly warning rate has plateaued and the
spec author has reviewed the warnings to confirm there are no false
positives (false-positive rate ≤ 5%).

### Phase 2b — Promote warnings to errors

1. Flip `severity` from `"warn"` to `"error"` for WF1, WF2, WF3.
2. `POST /api/schemes` returns 400 on error; client disables Submit.
3. Document the "override" admin role and audit-log every override.

**Acceptance gate to 2c:** Q-019 audit complete (per [Spec 5](SCHEMES_IMPL_AUDIT_PROTOCOLS.md));
spec author has chosen Shape A or Shape B per §3.5.

### Phase 2c — `inheritCQs` retirement (Shape A) OR reclassification (Shape B)

**Shape A path:**

1. Migration: `UPDATE "ArgumentScheme" SET "inheritCQs" = true WHERE "inheritCQs" = false;`
   (re-enabling inheritance is the only safe migration since
   `inheritCQs: false` enlarges the behaviour and inheritance-true
   is the layered-correct default).
2. API: `POST` / `PATCH` reject `inheritCQs: false` with a 400.
3. Soak: one calendar month. Confirm no clients send the field.
4. Migration: drop the column.

**Shape B path:**

1. Migration: add `siblingOf String?` + index + relation.
2. Data migration script per §3.5 (one-shot, audited row-by-row
   against the Q-019 audit).
3. API: `POST` / `PATCH` reject `inheritCQs` in the body with a 400
   + deprecation message pointing at `siblingOf`.
4. Soak: one calendar month.
5. Migration: drop `inheritCQs` column.

**Acceptance gate to wrap:** post-soak audit shows zero rows with the
deprecated semantics.

### Phase 2d — "Generate from Taxonomy" reframing

Parallelisable with any phase.

1. Rename UI button: "Generate CQs from Taxonomy" → "Suggest CQ
   presentation from taxonomy".
2. Add inline copy beside the button:
   > "These suggestions are a first draft of how the scheme is
   > presented (C007), not a definition of its behaviour (C006).
   > Edit freely; the well-formedness rules will check the final
   > bundle for layered consistency."
3. Add a `source: "taxonomy-suggestion" | "manual"` field on each
   CQ at draft time (UI-only; not persisted) so the SchemeCreator
   can show which CQs are still un-edited taxonomy suggestions.
4. Update `lib/argumentation/cqGeneration.ts` JSDoc to make the
   C007-only framing explicit.

**Acceptance:** the rename, copy, and JSDoc are in place; no
behaviour change.

## §6 Acceptance criteria

### Phase 2a accepts iff

- [ ] `validateSchemePresentation` exists with WF1/WF2/WF3 and ≥ 1
      unit test per rule.
- [ ] `POST /api/schemes/validate` returns the same warnings the
      `POST /api/schemes` route does.
- [ ] `SchemeCreator.tsx` renders warnings inline within 300ms of
      edit (debounced).
- [ ] `POST /api/schemes` returns 200 with `warnings` array
      populated when violations exist.

### Phase 2b accepts iff

- [ ] Severity is `"error"` for WF1/WF2 in all cases.
- [ ] Severity is `"error"` for WF3. *(The Q-019-gated phase-ordering constraint dissolved on 2026-05-28: the audit at [`audits/q019-inherit-cqs-false-20260528.md`](../../audits/q019-inherit-cqs-false-20260528.md) returned **zero rows**, so no `sibling-navigational` uses exist in production. WF3 flips on the original phase-2b schedule.)*
- [ ] `POST /api/schemes` returns 400 on error.
- [ ] Override role exists, requires explicit confirmation, and
      writes an audit log entry per override.
- [ ] Existing catalogue rows pass validation (back-test: run
      validator over every row; any failure is either a real
      problem to fix before phase 2b ships, or a false positive to
      patch).

### Phase 2c (whichever shape) accepts iff

- [ ] Migration runs cleanly against staging snapshot.
- [ ] Post-migration: every Q-019-identified row is in the correct
      state per the audit's classification.
- [ ] API rejects deprecated input shape.
- [ ] Documentation updated:
      [`SCHEMES_THEORETICAL_FOUNDATIONS.md`](SCHEMES_THEORETICAL_FOUNDATIONS.md)
      §3 (admin-fields-to-clusters table) reflects the new shape;
      Q-019 in the registry is closed-by-implementation.

### Phase 2d accepts iff

- [ ] Button rename + copy live.
- [ ] JSDoc updated.
- [ ] One screenshot in the PR description showing the new framing.

## §7 Open risks

- **R1 — WF1 false positives from cosmetic `text` differences.**
  Two CQs with the same `cqKey` but differently-worded `text` look
  like a WF1 violation. *Mitigation:* WF1 compares structural fields
  (`cqKey`, `attackType`, `targetScope`) first; `text` differences
  produce a `"warn"`-severity even in phase 2b (these become
  Spec 4's verifier territory).
- **R2 — WF3 breaks legitimate sibling relationships.** ~~If a
  scheme's author *intended* a sibling and used `parentSchemeId` as
  a navigational hint, WF3 will flag it.~~ **Closed 2026-05-28** by
  the Q-019 audit ([`audits/q019-inherit-cqs-false-20260528.md`](../../audits/q019-inherit-cqs-false-20260528.md)):
  zero of 31 production schemes use `inheritCQs: false`, so there
  are no candidate sibling-navigational uses of `parentSchemeId`
  to break. The validator's WF3 error message still points at
  `siblingOf` as the supported alternative for forward-compatibility
  with the (now-vestigial) Shape B, but Shape B itself is no
  longer on the implementation path — phase 2c-A (retirement) is
  the only §3.5 shape that ships.
- **R3 — Override-role abuse.** Admins under deadline may override
  WF errors routinely. *Mitigation:* the audit log entry contains
  the violations being overridden; weekly review surfaces patterns.
  Repeated overrides on the same rule are an input to revising the
  rule.
- **R4 — Phase 2c soak too short to catch off-platform clients.**
  External integrations (if any) sending `inheritCQs` will only
  surface during soak. *Mitigation:* before phase 2c starts, grep
  the repo for `inheritCQs` and contact owners of any external
  callers identified.
- **R5 — Validator latency on large CQ bundles.** A scheme with
  dozens of CQs and a parent with dozens more pushes WF1's
  pair-comparison into noticeable latency. *Mitigation:* the
  validator caches the parent's CQs per request; if needed, push
  WF1 into a worker (out of scope for phase 2a, in scope for 2b
  if measurements warrant).

## §8 Dependencies

**Upstream (research):**

- [T003](../../RESEARCH_PROGRAMME/02_THEOREMS_AND_PROOFS/T003-schemes-layered-coherence.md) (the three coherence conditions WF1/WF2/WF3 are operationalising)
- Q-012 resolution (per [`SCHEMES_ONTOLOGY_DECISION.md`](SCHEMES_ONTOLOGY_DECISION.md) §6.3)

**Upstream (specs):**

- [Spec 5 — Audit Protocols](SCHEMES_IMPL_AUDIT_PROTOCOLS.md): Q-019
  output gates phase 2c shape choice; Q-018 output informs phase 2b's
  back-test scope.

**Upstream (code):**

- [`lib/models/schema.prisma`](../../lib/models/schema.prisma) (`ArgumentScheme`, `CriticalQuestion`)
- [`components/admin/SchemeCreator.tsx`](../../components/admin/SchemeCreator.tsx)
- [`components/admin/SchemeHierarchyView.tsx`](../../components/admin/SchemeHierarchyView.tsx) (`+inherited` badge logic; phase 2c-A removes the badge entirely; phase 2c-B retargets the badge at `siblingOf`)
- [`app/api/schemes/route.ts`](../../app/api/schemes/route.ts), [`app/api/schemes/[id]/route.ts`](../../app/api/schemes/[id]/route.ts), [`app/api/schemes/[id]/cqs/route.ts`](../../app/api/schemes/[id]/cqs/route.ts)
- [`lib/argumentation/cqGeneration.ts`](../../lib/argumentation/cqGeneration.ts)

**Downstream:**

- [Spec 3 — Protocol Soundness](SCHEMES_IMPL_PROTOCOL_SOUNDNESS.md): consumes the validator's well-formedness guarantees (a runtime soundness check can assume the C007 layer is consistent because phase 2b enforces it).
- [Spec 4 — Verifier](SCHEMES_IMPL_VERIFIER.md): consumes the
  cosmetic-`text`-difference warning class as one input to its
  non-redundancy UI.

**Out of scope but documented:**

- Scheme versioning (§4.3).
- Materialised three-table schema (P5).
