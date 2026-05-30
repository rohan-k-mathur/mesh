# Schemes Implementation — Spec 5: Audit Protocols

- **status:** draft
- **owner:** schemes track
- **depends-on:** [`SCHEMES_IMPL_OVERVIEW.md`](SCHEMES_IMPL_OVERVIEW.md), [Q-018](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md), [Q-019](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md), [Q-020](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md)
- **unblocks:** [Spec 2 (Admin Tightening)](SCHEMES_IMPL_ADMIN_TIGHTENING.md), [Spec 3 (Protocol Soundness)](SCHEMES_IMPL_PROTOCOL_SOUNDNESS.md), [Spec 4 (Verifier)](SCHEMES_IMPL_VERIFIER.md)
- **last-reviewed:** 2026-05-27

## §1 Problem statement

Three research-open questions block sign-off on the downstream
implementation specs:

- **Q-019** — the production count and intent-classification of
  `inheritCQs: false` uses. The retirement plan in [Spec 2 §X]
  cannot be sized until this number is known.
- **Q-018** — the OntoClean meta-property classification of the
  production scheme catalogue. Spec 2's well-formedness rules need
  to know whether the catalogue admits OntoClean-based validation
  before adopting it.
- **Q-020** — the field-by-field comparison between the substrate's
  `ArgumentScheme` schema and the major external scheme catalogues.
  Spec 4's AIF round-trip identity discipline and non-redundancy UI
  need this to know what fields are load-bearing for behaviour
  identity in the wild.

This spec specifies three **read-only audits** that produce the data
those downstream specs consume. No production code changes.

**Premise inherited:** P5 (three layers conceptual now, materialised
later) — the audits operate on the existing single-table schema; no
schema migration is in scope here.

## §2 Goals and non-goals

**Goals.**

- Produce a Q-019 audit table: every `ArgumentScheme` row with
  `inheritCQs = false`, classified into a four-way taxonomy
  (sibling-misuse, workaround, genuine-child-with-different-CQs,
  unknown).
- Produce a Q-018 OntoClean matrix: one row per scheme, four
  meta-property assignments (rigidity, identity, unity, dependence),
  plus an anti-rigidity flag and an OntoClean-violation flag.
- Produce a Q-020 field-comparison spreadsheet: rows indexed by
  external-catalogue field name, columns for each catalogue (AIF,
  AIFdb, Argdown, ASPIC+, DefLog, WRM 2008, Wagemans PTA), classified
  as `intentional-exclusion | accidental-omission | representable-but-absent | externally-load-bearing-internally-irrelevant`.
- Deliver the audits as committed artefacts in the repo, not as
  ephemeral query output, so downstream specs can cite them by URL.

**Non-goals.**

- Any change to production behaviour or schema.
- Any retirement, migration, or UI change. Those are downstream.
- A general scheme-quality audit; this is exactly three audits with
  exactly three pre-stated consumers.
- Inter-rater reliability for Q-018 beyond the single-analyst pass
  (a κ-measurement protocol is documented for follow-on, not run).

## §3 API contract

Audits are **scripts + committed output files**, not endpoints. Three
script entry points, three output paths.

### Q-019 — `inheritCQs: false` audit

**Script:** `scripts/audits/audit-inherit-cqs-false.ts`

**Signature** (TypeScript):

```ts
type InheritFalseRow = {
  id: string;                    // ArgumentScheme.id
  key: string;                   // ArgumentScheme.key
  name: string | null;
  parentSchemeId: string | null;
  parentKey: string | null;      // joined from parent row
  clusterTag: string | null;
  parentClusterTag: string | null;
  ownCqCount: number;            // count of CQs declared on this scheme
  parentCqCount: number;         // count of CQs on parent
  cqKeyOverlap: string[];        // CQ keys present on both child and parent
  cqKeysSuppressed: string[];    // parent CQ keys not present on child
  cqKeysAdded: string[];         // child CQ keys not present on parent
  usageCount: number;            // existing usageCount field
  createdAtIso: string;
  // To be filled by classification pass:
  intent: "sibling-misuse" | "workaround" | "genuine-child-different-cqs" | "unknown";
  classifierNotes: string;       // free-text by the classifying analyst
};

type Q019Output = {
  generatedAtIso: string;
  totalCount: number;            // rows with inheritCQs = false
  totalCatalogueSize: number;    // total ArgumentScheme rows
  fraction: number;              // totalCount / totalCatalogueSize
  rows: InheritFalseRow[];
  byIntent: Record<InheritFalseRow["intent"], number>;
};
```

**Output:** `audits/q019-inherit-cqs-false-<YYYYMMDD>.json`
(committed to repo), plus a human-readable summary at
`audits/q019-inherit-cqs-false-<YYYYMMDD>.md` produced by a sibling
formatter script.

### Q-018 — OntoClean meta-property matrix

**Script:** `scripts/audits/audit-ontoclean.ts`

**Signature:**

```ts
type Rigidity   = "rigid" | "non-rigid" | "anti-rigid";
type Identity   = "carries-identity" | "no-identity";
type Unity      = "carries-unity" | "no-unity";
type Dependence = "dependent" | "independent";

type OntoCleanRow = {
  id: string;
  key: string;
  name: string | null;
  clusterTag: string | null;
  parentSchemeId: string | null;
  rigidity: Rigidity;
  identity: Identity;
  unity: Unity;
  dependence: Dependence;
  isAntiRigid: boolean;          // rigidity === "anti-rigid"
  ontoCleanViolation: boolean;   // true if any OntoClean constraint is violated by this scheme's position in the hierarchy
  violationDescription: string;  // empty unless ontoCleanViolation
  classifierNotes: string;
};

type Q018Output = {
  generatedAtIso: string;
  totalCount: number;
  rows: OntoCleanRow[];
  byRigidity: Record<Rigidity, number>;
  violationsCount: number;
  violatingClusterTags: string[];
};
```

**Output:** `audits/q018-ontoclean-<YYYYMMDD>.json` +
`audits/q018-ontoclean-<YYYYMMDD>.md`.

**OntoClean constraints checked.** A scheme `S'` with
`parentSchemeId = S` violates OntoClean if any of:

- `S` is anti-rigid and `S'` is rigid (anti-rigid cannot subsume
  rigid).
- `S` and `S'` carry incompatible identity criteria (catalogue-level
  judgement; analyst-recorded).
- `S` is independent and `S'` is dependent on a sortal `S` does not
  carry.

### Q-020 — External-catalogue field comparison

**Script:** none required (manual analyst pass with a template).

**Signature** (the committed artefact's shape):

```ts
type ExternalCatalogue =
  | "AIF"
  | "AIFdb"
  | "Argdown"
  | "ASPIC+"
  | "DefLog"
  | "WRM-2008"
  | "Wagemans-PTA";

type FieldClassification =
  | "exposed"                                      // present in substrate
  | "intentional-exclusion"                        // absent for principled reason
  | "accidental-omission"                          // absent; should be added
  | "representable-but-absent"                     // re-derivable from existing fields
  | "externally-load-bearing-internally-irrelevant"; // not needed under substrate ontology

type Q020Row = {
  externalFieldName: string;
  externalSource: ExternalCatalogue;
  semanticDescription: string;
  substrateMapping: string | null;                  // path to existing field, or null
  classification: FieldClassification;
  rationale: string;
  followOnQ: string | null;                         // Q-NNN if a follow-on is filed
};
```

**Output:** `audits/q020-external-fields-<YYYYMMDD>.csv` (so it can be
opened as a spreadsheet) + `audits/q020-external-fields-<YYYYMMDD>.md`
(narrative with per-class summaries).

## §4 Data model

No production schema changes. The audits read from the existing
`ArgumentScheme` and `CriticalQuestion` tables. Output is committed
under a new top-level [`audits/`](../../audits/) directory (to be
created by spec 5 implementation, with a [`audits/README.md`](../../audits/README.md)
explaining the directory's purpose, naming convention, and retention
policy).

**Retention.** Each audit is dated; old versions are kept indefinitely
(audits are research artefacts, not log files). When an audit is
re-run, the new dated file is added alongside the old; downstream
specs cite by date.

## §5 Migration plan

**Posture:** Greenfield (per [overview §4](SCHEMES_IMPL_OVERVIEW.md#§4-migration-posture-matrix)).
Three sub-phases, all in a single PR per audit:

### Phase 5a — Q-019 audit

1. Land `scripts/audits/audit-inherit-cqs-false.ts` with the SQL
   query (see [§7](#§7-reference-queries)) and a TypeScript
   classification harness.
2. Run the script against production read-replica; commit
   `audits/q019-inherit-cqs-false-<DATE>.json` with `intent` set to
   `"unknown"` on every row.
3. Analyst pass: open the JSON in an editor, fill in `intent` and
   `classifierNotes` per row. Use [`SCHEMES_ONTOLOGY_DECISION.md`](SCHEMES_ONTOLOGY_DECISION.md)
   §6.3 as the rubric for the four-way classification.
4. Commit the classified JSON + a markdown summary.

### Phase 5b — Q-018 OntoClean matrix

1. Land `scripts/audits/audit-ontoclean.ts` which fetches every
   scheme + parent and produces a JSON skeleton with the four
   meta-property fields set to `null`-equivalent values.
2. Analyst pass: classify each scheme using Guarino-Welty 2009 ch.
   8 as the rubric. Flag anti-rigid schemes and OntoClean
   violations.
3. Commit the populated JSON + a markdown summary that names the
   violating subsumptions and recommends a resolution (re-parent,
   re-classify, or accept the violation with rationale).

### Phase 5c — Q-020 external-catalogue field comparison

1. Land [`audits/q020-external-fields-TEMPLATE.csv`](../../audits/q020-external-fields-TEMPLATE.csv)
   pre-populated with the seven external catalogues' field lists
   (one row per `(field, catalogue)` pair, classification empty).
2. Analyst pass: fill `classification` and `rationale`; file
   follow-on Q-NNNs as needed (the spec records these in
   `followOnQ` for traceability).
3. Commit the populated CSV + a markdown summary with one section
   per classification bucket.

**Soak / acceptance.** Each audit is "complete" when its
classification fields are fully populated, the markdown summary is
written, and the relevant downstream spec has cited it in its own
acceptance criteria. No production traffic touches the audits, so no
soak period applies.

## §6 Acceptance criteria

### Phase 5a (Q-019) accepts iff

- [ ] `scripts/audits/audit-inherit-cqs-false.ts` exists and runs
      without error against the production read-replica.
- [ ] `audits/q019-inherit-cqs-false-<DATE>.json` is committed with
      every row's `intent` set to a non-`"unknown"` value.
- [ ] `audits/q019-inherit-cqs-false-<DATE>.md` is committed and
      contains: total count, fraction of catalogue, byIntent
      breakdown, a one-paragraph recommendation for spec 2's
      retirement-vs-reclassification posture.
- [ ] Spec 2 cites the audit by date in its `inheritCQs` retirement
      section.

### Phase 5b (Q-018) accepts iff

- [ ] `scripts/audits/audit-ontoclean.ts` exists and runs to
      completion.
- [ ] `audits/q018-ontoclean-<DATE>.json` is committed with every
      row's four meta-property fields populated.
- [ ] `audits/q018-ontoclean-<DATE>.md` is committed and contains:
      total count, byRigidity breakdown, the named list of OntoClean
      violations (or "none"), and a one-paragraph recommendation for
      spec 2's well-formedness rules (use OntoClean / don't / use
      partially).
- [ ] Spec 2 and Q-014 in the registry both cite the audit.

### Phase 5c (Q-020) accepts iff

- [ ] `audits/q020-external-fields-<DATE>.csv` is committed and every
      row has a non-empty `classification` and `rationale`.
- [ ] `audits/q020-external-fields-<DATE>.md` is committed with one
      summary section per classification bucket and a list of
      follow-on Q-NNNs filed.
- [ ] Spec 4 cites the audit in its AIF round-trip identity section.

## §7 Reference queries

### Q-019 query (Postgres / Prisma raw)

```sql
SELECT
  s.id,
  s.key,
  s.name,
  s."parentSchemeId" AS parent_scheme_id,
  parent.key AS parent_key,
  s."clusterTag" AS cluster_tag,
  parent."clusterTag" AS parent_cluster_tag,
  COALESCE((SELECT COUNT(*) FROM "CriticalQuestion" cq WHERE cq."schemeId" = s.id), 0) AS own_cq_count,
  COALESCE((SELECT COUNT(*) FROM "CriticalQuestion" cq WHERE cq."schemeId" = parent.id), 0) AS parent_cq_count,
  s."usageCount" AS usage_count,
  s."createdAt" AS created_at
FROM "ArgumentScheme" s
LEFT JOIN "ArgumentScheme" parent ON parent.id = s."parentSchemeId"
WHERE s."inheritCQs" = false
ORDER BY s."createdAt" ASC;
```

The CQ-overlap fields (`cqKeyOverlap`, `cqKeysSuppressed`,
`cqKeysAdded`) are computed in TypeScript from the per-row CQ
arrays — Postgres array-difference is awkward against a join.

**Verification.** Before classification, the analyst should manually
spot-check that the script's row count matches `SELECT COUNT(*) FROM
"ArgumentScheme" WHERE "inheritCQs" = false;`.

### Q-018 query (Postgres / Prisma raw)

```sql
SELECT
  s.id,
  s.key,
  s.name,
  s."clusterTag" AS cluster_tag,
  s."parentSchemeId" AS parent_scheme_id,
  parent.key AS parent_key,
  parent."clusterTag" AS parent_cluster_tag
FROM "ArgumentScheme" s
LEFT JOIN "ArgumentScheme" parent ON parent.id = s."parentSchemeId"
ORDER BY s."clusterTag" NULLS LAST, s.key ASC;
```

The four meta-property assignments are analyst judgements per Guarino
& Welty 2009 ch. 8 and cannot be derived from SQL.

### Q-020 has no SQL — entirely analyst-driven

The substrate side of the field comparison is enumerated from
[`lib/models/schema.prisma`](../../lib/models/schema.prisma)
`model ArgumentScheme` (currently ≈ 30 fields). The external side is
enumerated from the catalogues' published specs (bibliography in
[Q-020](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md)).

## §8 Open risks

- **R1 — Catalogue size variance.** If the production catalogue has
  grown substantially since the last manual review, the Q-018
  analyst pass becomes expensive. *Mitigation:* if `COUNT(*)` >
  200, the spec author may scope Q-018 to a stratified sample (one
  scheme per `clusterTag` plus all parent schemes plus all schemes
  flagged in Q-019) and document the sampling decision in the
  audit's markdown summary.
- **R2 — `inheritCQs: false` may be ambient.** If the audit reveals
  that `inheritCQs: false` is the *default in practice* (e.g. the UI
  silently sets it on some path), the breaking-change cost balloons.
  *Mitigation:* before the analyst pass, grep `components/admin/` for
  `inheritCQs` to confirm the UI default; record the finding in the
  Q-019 markdown.
- **R3 — OntoClean disputes.** A single analyst can produce a
  defensible OntoClean classification, but inter-rater agreement is
  the published standard. *Mitigation:* the spec scopes Q-018 to a
  single-analyst pass; a follow-on Q-NNN can be filed if downstream
  use of the matrix turns out to require κ-validation.
- **R4 — External catalogue field semantics underspecified.** Some
  external catalogues (AIFdb in particular) under-specify field
  semantics. *Mitigation:* the Q-020 row schema permits the
  classification `representable-but-absent` with a free-text
  rationale; ambiguous external fields land there with a note.
- **R5 — Output drifts from production.** Production schemes will
  continue to be created and edited after the audit runs.
  *Mitigation:* audits are dated; downstream specs cite by date; re-
  runs are cheap and additive. The spec does **not** establish a
  cron — re-running is a per-need operation.

## §9 Dependencies

**Upstream (research):**

- [Q-018](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md), [Q-019](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md), [Q-020](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md)
- [`SCHEMES_ONTOLOGY_DECISION.md`](SCHEMES_ONTOLOGY_DECISION.md) §6.3 (the rubric for Q-019 classification)

**Upstream (code):**

- [`lib/models/schema.prisma`](../../lib/models/schema.prisma) `model ArgumentScheme` (read-only)
- [`scripts/`](../../scripts/) (new sub-directory `scripts/audits/` to be created)
- Read-replica DB credentials (no production-write credentials needed)

**Downstream (consumers):**

- [Spec 2 — Admin Tightening](SCHEMES_IMPL_ADMIN_TIGHTENING.md): consumes Q-019 + Q-018
- [Spec 3 — Protocol Soundness](SCHEMES_IMPL_PROTOCOL_SOUNDNESS.md): consumes Q-018 indirectly (cluster_tag classification feeds protocol-clause defaults)
- [Spec 4 — Verifier](SCHEMES_IMPL_VERIFIER.md): consumes Q-020 (AIF round-trip identity)

**Out of scope but worth knowing:**

- The `audits/` directory will eventually grow beyond schemes-only
  audits. A future general-audits README should establish the
  directory's pattern; this spec only seeds it.
