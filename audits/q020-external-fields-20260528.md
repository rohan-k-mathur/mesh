# Q-020 — External-catalogue field comparison

- **generated at:** 2026-05-28
- **classifier:** single analyst (first-pass)
- **source CSV:** [audits/q020-external-fields-20260528.csv](q020-external-fields-20260528.csv)
- **spec:** [Spec 5 — Audit Protocols](../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_IMPL_AUDIT_PROTOCOLS.md) §3 (Q-020); methodology against substrate model at [lib/models/schema.prisma](../lib/models/schema.prisma) line 4062 (`ArgumentScheme`)
- **catalogues compared:** AIF (Chesñevar et al. 2006), AIFdb (Lawrence & Reed 2012), Argdown, ASPIC+ (Modgil & Prakken 2014), DefLog (Verheij 2003), WRM-2008 (Walton, Reed & Macagno 2008 Ch. 9), Wagemans PTA 2016
- **total fields surveyed:** 51

---

## §1 Per-class summary

| Classification | Count | % |
|---|---|---|
| `exposed` | 19 | 37% |
| `representable-but-absent` | 11 | 22% |
| `intentional-exclusion` | 12 | 24% |
| `accidental-omission` | 6 | 12% |
| `externally-load-bearing-internally-irrelevant` | 3 | 6% |
| **total** | **51** | **100%** |

**Reading.** The substrate covers **59% of external fields directly or by derivation** (exposed + representable-but-absent). Of the 41% absent, three-quarters are absent on principle (intentional-exclusion or externally-load-bearing-internally-irrelevant) and only 12% (6 fields) are genuine omissions warranting follow-on research questions.

---

## §2 Per-source breakdown

| Source | exposed | rep-but-absent | int-excl | acc-omit | ext-load-bearing | total |
|---|---:|---:|---:|---:|---:|---:|
| AIF | 2 | 2 | 4 | 2 | 1 | 11 |
| AIFdb | 0 | 1 | 3 | 2 | 0 | 6 |
| Argdown | 3 | 1 | 3 | 0 | 1 | 8 |
| ASPIC+ | 4 | 2 | 1 | 0 | 1 | 8 |
| DefLog | 0 | 3 | 1 | 0 | 0 | 4 |
| WRM-2008 | 7 | 1 | 0 | 1 | 0 | 9 |
| Wagemans-PTA | 3 | 1 | 0 | 1 | 0 | 5 |

**Notable patterns:**

- **WRM-2008** has the highest direct-coverage rate (7/9 exposed) — the substrate is closest in spirit to Walton/Reed/Macagno, which is unsurprising since the catalogue is empirically Walton-derived.
- **AIFdb** has 0 directly-exposed fields, because AIFdb's fields are almost entirely *import-provenance* (URLs, contributors, map IDs) — the substrate is itself a canonical source, not a federated importer.
- **AIF and Argdown** account for most `intentional-exclusion` rows because they conflate scheme-level fields with argument-level (I-nodes, L-nodes) or presentation-level (heading-level, position-in-graph) fields; the substrate maintains the separation.
- **DefLog** is uniformly `representable-but-absent` because its defeater/issue/justification structure is recoverable from the substrate's CriticalQuestion + ClaimRelation model at serialisation time.

---

## §3 Accidental omissions → new research questions

Six fields are genuine omissions. They cluster into four follow-on questions:

### Q-022 — Per-scheme provenance & citation
- **Fields:** AIF `hassource`, AIFdb `mapId`, WRM-2008 `chapter-section-reference`.
- **Substrate gap:** `ArgumentScheme` has no field linking back to the source catalogue, citation, or import map. This made the [Q-018](q018-ontoclean-20260528.md) §3.1 duplicate-candidate diagnosis harder than it should have been (we cannot tell whether `expert_opinion` and `expert-opinion` originated from different sources without an audit-log query).
- **Proposed Q-022:** "What is the minimal per-scheme provenance schema (source-catalogue, source-ID-within-catalogue, import-timestamp, importer-version) sufficient to make catalogue-redundancy diagnosis tractable, and where in the substrate should it live (column vs. side-table)?"

### Q-023 — AIF version-pinning for round-trip
- **Field:** AIF `AIF-version`.
- **Substrate gap:** [lib/aif/syncArgument.ts](../lib/aif/syncArgument.ts) does not pin or record the AIF spec version used in serialisation. Spec 4 phase 4c (AIF round-trip identity discipline) cannot honestly claim *the same* round-trip without version-pinning.
- **Proposed Q-023:** "Which AIF spec version is the substrate's round-trip targeting, and how is version-skew handled when importing schemes serialised against a different version?"

### Q-024 — Per-scheme creation timestamp
- **Field:** AIFdb `import-timestamp`.
- **Substrate gap:** `ArgumentScheme` has no `createdAt` column (discovered during [Q-019 audit script](../scripts/audits/audit-inherit-cqs-false.ts) development). This blocks chronological auditing of catalogue evolution.
- **Proposed Q-024:** "Add `createdAt`, `updatedAt`, and `createdBy` columns to `ArgumentScheme`; assess data-migration impact."

### Q-025 — Explicit axiomatic-premise flag
- **Field:** ASPIC+ `axiom-vs-premise`.
- **Substrate state:** Carneades-typed `premiseType` already covers the substantive distinction (ASPIC+'s K_n maps to Carneades's `ordinary`-with-default-true; K_a maps to `assumption`). An explicit `isAxiomatic` boolean on `CriticalQuestion` would make the distinction visible at the data-model level rather than buried in the Carneades-to-ASPIC+ mapping.
- **Proposed Q-025:** "Does the substrate gain expressive power from an explicit `isAxiomatic` flag on `CriticalQuestion`, or is the Carneades `premiseType` taxonomy sufficient?" *(Likely closed in favour of premiseType, but worth filing for explicit consideration during [Spec 3](../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_IMPL_PROTOCOL_SOUNDNESS.md) phase 3d.)*

### Q-026 — Wagemans PTA subject typology
- **Field:** Wagemans-PTA `subject-type`.
- **Substrate state:** Substrate exposes `conclusionType` (Wagemans's predicate axis) but not subject typology. Without it the substrate cannot place a scheme in the full Wagemans Periodic Table.
- **Proposed Q-026:** "Add `subjectType` to `ArgumentScheme`; assess whether full Wagemans PTA placement is a substrate goal or a derivation responsibility."

---

## §4 Implications for downstream specs

### Spec 4 phase 4c — AIF round-trip identity discipline

The 11 `representable-but-absent` fields are the cases where round-trip identity is *non-trivial*: the substrate doesn't store the field but can reconstruct it deterministically from the structural columns. Spec 4's verifier must therefore distinguish:

1. **Lossless-by-construction**: the field is reconstructed identically on every serialisation. These are safe.
2. **Lossless-by-convention**: reconstruction depends on a serialisation convention (e.g., CA-Scheme-Type assumed `CA-Rebut` when `attackKind=rebut`). These need explicit documentation in the serialiser.
3. **Lossy**: round-tripping through the substrate erases information present in the source (e.g., AIFdb `mapId`, AIF `period`). These require Q-022's provenance side-table to round-trip identically.

The phase 4c soundness predicate cannot be `import(export(scheme)) ≡ scheme` as flatly stated; it needs to be `import(export(scheme)) ≡_substrate-relevant scheme`, with the equivalence relation explicit.

### Spec 4 §3.5 — Fingerprint domain

Fields currently in fingerprint scope: `aspicMapping.ruleType`, `premises`, `conclusion`, `materialRelation`, `reasoningType`, CQ `attackKind` set. This audit identifies one substrate-stored field that may belong in fingerprint scope but isn't currently mentioned:

- **`ArgumentScheme.epistemicMode`**: factual vs hypothetical vs counterfactual *changes the behaviour* of the scheme under play-time evaluation. Two schemes identical in premises/conclusion but differing in `epistemicMode` are behaviourally distinct. Spec 4 §3.5 should widen the fingerprint domain to include `epistemicMode`.

Spec 4 §3.5 follow-on documented.

### Spec 2 phase 2b — WF1 back-test

The 6 `accidental-omission` fields don't gate phase 2b directly, but Q-022's provenance schema (when adopted) would materially help WF1 because duplicate-detection becomes a JOIN on `source + sourceId` rather than a fuzzy name-match.

---

## §5 Verdict

The substrate's external-coverage posture is **principled minimalism**:

- 37% of external fields are exposed directly.
- 22% are recoverable at serialisation time.
- 30% (intentional-exclusion + externally-load-bearing-internally-irrelevant) are absent for stated principled reasons that hold up under the substrate's separation of concerns (scheme layer vs. argument layer vs. dialogue layer vs. provenance).
- 12% (6 fields) are genuine omissions warranting 5 follow-on Qs.

**Recommendation for Q-020 closure:** mark closed-by-experiment; file Q-022 through Q-026 as a tight cluster of provenance / version-pinning / typology gaps surfaced by this audit.
