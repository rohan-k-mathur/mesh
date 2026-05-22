# LUDICS Sessions 1 & 2 — Spec Quality Review

**Review type:** spec ↔ substrate fidelity + architectural optimality (read-only).
**Question asked:** *"Is the spec the right spec?"* — not "is it implemented correctly" (that is the companion code-audit prompt).
**Specs under review:** [LUDICS_SESSION_1_DEV_SPEC.md](LUDICS_SESSION_1_DEV_SPEC.md) (1184 lines), [LUDICS_SESSION_2_DEV_SPEC.md](LUDICS_SESSION_2_DEV_SPEC.md) (985 lines).
**Substrate inputs read:** 10 Tier-1 documents, ~5,686 lines total.
**Methodology:** Two-pass review per spec. Pass A = substrate-fidelity rating (FAITHFUL / LOSSY / DISTORTED / OVER-COMMITTED / UNDER-COMMITTED). Pass B = architectural alternatives with 5-axis scoring on Correctness / Performance / Operability / Evolvability / Cognitive load.
**Reviewer notes:** [LUDICS_SESSIONS_1_2_SPEC_REVIEW_WORKING_NOTES.md](LUDICS_SESSIONS_1_2_SPEC_REVIEW_WORKING_NOTES.md) contains full per-finding evidence; this document is the distilled deliverable.

---

## §1 — Executive summary

**Top three fidelity findings (Pass A):**
1. **Phase 2e proof prompt anticipates the wrong outcomes (A12.1).** Session 2 §5's binary "confirm / counterexample-with-flag" branching missed the actual Outcome B (mis-attribution with structural refinement). Following §5.2 verbatim would have produced a misleading C1 update. **Highest-impact single finding.**
2. **`IncarnationSetManifest` singular `bottom` field (A9.1).** Reifies the obsolete unique-bottom-of-Inc(B) assumption Phase 2e disproved. Cascades into `claimedMinimalPremiseLociCount`, `ArticulationRecallScore.recall`, the mock client, all five corpus fixtures, and 22 tests.
3. **`compute_articulation_join` asserts a join always exists (A5.6).** Wrong post-2e for cross-cone inputs; OVER-COMMITTED at the API contract level. Drives the largest architectural finding too (B1, Δ +11).

**Top three architectural findings (Pass B):**
1. **B1 / B7 / B8 / B10 (cluster):** four rewrite-tier items, all tracing to the same root cause (T1 below). Mean Δ +11.
2. **B4 terminology drift (Δ +11).** `inference → daimon` rename + I1–I4 renumber. Lowest-cost high-value cleanup in either spec; should ship before any further consumer adoption locks in the wrong vocabulary.
3. **B9 fossilize-by-argument fuzzy lookup (Δ +12).** Spec ships a `canonicalText contains` interim path alongside the correct `argumentId` column. The interim path has nontrivial false-positive risk on production data; the dual-path approach should be replaced with column-first sequencing.

**One-sentence verdict per session:**
- **Session 1 spec is mostly faithful** with 4 DISTORTED findings (concentrated in §1 schema and §3 articulation API), 1 OVER-COMMITTED finding, and 7 UNDER-COMMITTED findings (concentrated in test/invariant discipline) — 2 architectural commitments worth rewriting, 4 worth augmenting.
- **Session 2 spec carries more substrate-fidelity defects** with 9 DISTORTED findings, 1 OVER-COMMITTED, 12 UNDER-COMMITTED, concentrated in §2 (`incarnationSet`), §3 (`proposeSynthesis`), and §5 (OQ-JSL proof prompt) — 4 architectural commitments worth rewriting, 2 worth augmenting.

---

## §2 — Pass A findings table

Rating shorthand: **F** = FAITHFUL · **L** = LOSSY · **D** = DISTORTED · **OC** = OVER-COMMITTED · **UC** = UNDER-COMMITTED.

### Session 1

| # | Phase | Contract | Substrate artefact | Rating | Evidence / Note |
|---|---|---|---|---|---|
| A1.1 | 1a §1 | `LudicMove.moveType` enum has `inference` | Substrate `daimon` (✝) | D | Terminology drift; every audit must translate |
| A1.2 | 1a §1 | `Design.loci String[]` (Postgres text array) | Set of loci ⊆ universe | F | Set semantics implicit (de-dup at caller) |
| A1.3 | 1a §1 | `DesignInclusion` as edge table | ≤_⊆ partial order on B | F | Edge materialization is operationally sound |
| A1.4 | 1a §1 | `WitnessRecord.stratumLabel` mirror of move | Witnessing layer flag | F | Allows witness-side filters |
| A2.1 | 1b §2.1 | Invariants I1–I4 | Substrate I1–I4 (different content) | D | Naming collision; audits ambiguous |
| A2.2 | 1b §2.2 | Tier-2 invariants T1–T5 | Substrate triad 𝒯_L = (P_L, N_L, ⊥_L) | UC | Spec T1–T5 are operational; substrate T1–T5 are formal — separate concepts share labels |
| A2.3 | 1b §2 | "Invariant violations raise" | Substrate: invariants are intrinsic | F | Defensive runtime checks acceptable |
| A3.1 | 1c §3.1 | `exposureMap(deliberationId)` returns positions | σ(𝒟_P)^⊥ enumeration | F | Result type matches Reading C |
| A3.2 | 1c §3.1 | `stratumLabel` as stored column | Derived from current 𝒟_P | D | Will go stale on neighbour writes (echoes T3) |
| A3.3 | 1c §3.1 | `walked` / `witnessable` / `latent` trichotomy | Substrate stratum has same three | F | — |
| A4.1 | 1d §3.2 | `articulationLattice(deliberationId)` returns lattice | (B, ≤_⊆) | L | Returns lattice flag, not Cone structure |
| A4.2 | 1d §3.2 | `bottom` field returned with B | Inc(B) is antichain post-2e | D | Singular `bottom` not defined post-2e |
| A5.1 | 1e §3.2 | `DesignInclusion` treated as lattice spine | (B, ≤_⊆) decomposes into cones | D | Spec assumes connected order; cones are disjoint |
| A5.6 | 1e §3.2 | `compute_articulation_join(designIds[])` asserts join | ∨_⊥⊥ exists same-cone only | **OC** | API will throw or return wrong shape for cross-cone inputs |
| A5.7 | 1e §3.2 | `delocationType: "locus-addition-required"` | Daimon Lock Lemma cone-extension | UC | Single shape conflates legitimate delocation with cross-cone non-join |
| A6.1 | 1f §1 | `retractReason` flat enum (4 values) | T4 separates dialectical-side / witness-side | L | Layer collapse baked into schema |
| A6.2 | 1f §3.3 | `walkDesign()` / `extendDesign()` tools | Substrate move + extension discipline | F | — |
| A7.1 | 1g §5.3 | Briefing fingerprint = single SHA256 over 15 fields | Tier-2 N-C24 freshness discipline | L | Opaque to which of R1–R5 fired |
| A7.2 | 1g §5.3 | R1–R5 material-change rules listed | Substrate R1–R5 | F | Rules are correctly stated |
| A7.3 | 1g §6 | MCP auth: shared bearer + caller participantId | T5 consumer surface | UC | No cross-participant abuse mitigation |

**Session 1 severity tally:** F: 9 · L: 3 · D: 4 · OC: 1 · UC: 4.

### Session 2

| # | Phase | Contract | Substrate artefact | Rating | Evidence / Note |
|---|---|---|---|---|---|
| A8.1 | 2a §1.2 | `prisma migrate dev` | n/a (operational) | F substrate / **repo-convention violation** | AGENTS.md mandates `prisma db push` (T7) |
| A8.2 | 2a §1.2 | Seed script: `DesignInclusion` between two designs | Cones disjoint (Phase 2e) | UC | Silent on cone-locality |
| A8.3 | 2a §1.3 | p95 perf targets (500/200/100 ms) | n/a | F | Defensible operational |
| A8.4 | 2a §1.3 | Test 11: fingerprint stability only | R1–R5 invalidation rules | UC | 0/5 invalidation rules tested |
| A8.5 | 2a §1.3 | Seed `stratumLabel = "walked"` static | Derived state from σ(𝒟_P)^⊥ | UC | No test for neighbour relabeling |
| A9.1 | 2b §2.2 | `IncarnationSetManifest.bottom: DesignSummary \| null` | Inc(B) is antichain (Phase 2e) | **D** | Cascades into 4 sub-fields, 22 tests |
| A9.2 | 2b §2.6 | "co-equal hub topology" framed as exceptional | Antichain is generic post-2e | D | Fixture distribution reflects pre-2e priors |
| A9.3 | 2b §2.4 | `recall = claimedMinimalLociCount / bottomLociCount` | Per-cone, no global bottom | D | Single-number recall breaks |
| A9.4 | 2b §2.4 | `ConfidentMisstatementKind: "incarnation-undercount"` | Multiple incarnations generic | UC | No `miscount-across-cones` or `incarnation-conflation` kinds |
| A9.5 | 2b §2.5 | Mock-client perfect-recall path depends on `bottom !== null` | n/a | D | Same singular-bottom defect |
| A10.1 | 2c §3.3 | `proposeSynthesis` returns `delocationType` on `newLoci > 0` | ∨_⊥⊥ undefined cross-cone | **D + OC** | Conflates legitimate delocation with cross-cone non-join |
| A10.2 | 2c §3.5 | Fixture: `bottom.loci.length = sum of inputs` | Union ≤ sum; bottom ⊆ join | D | Fixture arithmetic wrong post-2e |
| A10.3 | 2c §3.2 | `SyntheticReadout.bottomIncarnation` field | Per-cone, no global | D | Same defect (A4.2 / A9.1) |
| A10.4 | 2c §3.6 | Log "slow joins (`closureSteps > 5`)" | Within-cone ∨ = literal ∪; closureSteps always 0 | D | Any nonzero = substrate violation |
| A10.5 | 2c §3.3 | `schemeKey: "synthesis"` | Not in substrate scheme catalogue | UC | No CQs, validity conditions specified |
| A10.6 | 2c §3.6 | `proposeSynthesis` idempotence on `biorthoClass` | Substrate I2 | F | ✅ |
| A11.1 | 2d §4.4 | `argumentId String?` on `LudicMove` | Back-pointer lives on witness side | L | Direction reversed; small T4 leak |
| A11.2 | 2d §4.3 | Fuzzy `canonicalText contains` interim path | n/a | UC | False-positive risk; ships alongside correct `argumentId` path |
| A11.3 | 2d §4.5 | Manual retract endpoint | A1–A4 announcement discipline | UC | Silent on notification integration |
| A11.4 | 2d §4.6 | `fossilize()` idempotent / endpoint returns 409 | n/a | **Intra-spec incoherence** | Split behaviour at function vs. endpoint layer |
| A11.5 | 2d §4 | `retractReason` lifecycle wiring | T4 separation | L | Confirms A6.1; makes the collapse concrete |
| A12.1 | 2e §5.2 | Branching: confirm / counterexample-with-`joinIsMinimal`-flag | Actual: Outcome B mis-attribution + structural refinement | **UC** | Highest-regret finding; spec stale on arrival |
| A12.2 | 2e §5.2 | Branching only allows C1 "upgrade" | C1 was downgraded to Corrected | UC | No "downgrade" path |
| A12.3 | 2e §5.3 | References: Girard, Melliès | Actual proof uses Fouqueré–Quatrini 2013 | UC | Key citation missing |
| A13.1 | 2f §6.1 | Rate-limit by `participantId` | n/a | F / UC | Cross-participant abuse vector unaddressed |
| A13.2 | 2f §6.2 | BullMQ cache warming | n/a | F | — |
| A13.3 | 2f §6.3 | "`closureSteps > 5` = unusual position complexity" | Substrate violation post-2f | D | Interpretation stale |
| A13.4 | 2f §6.4 | Extract auth to `server/ludics/auth.ts` | n/a | F | — |
| A13.5 | 2f §6.5 | L1 in-memory + L2 DB cache | n/a | F / UC | Cross-instance L1 coherence unspecified |
| A13.6 | 2f §6.6 | Test wording: "upsert: `ruleLabel` updated to 'R2'" | Hash changes ⇒ new row, not update | D | Test contradicts schema intent |

**Session 2 severity tally:** F: 6 · L: 2 · D: 9 · OC: 1 · UC: 12.

---

## §3 — Pass B findings table

| # | Phase | Commitment | Spec choice | Alternatives | Winner | Spec wins? | Recommendation |
|---|---|---|---|---|---|---|---|
| B1 | S1 §3.2 | Articulation join algorithm | Eager closure, asserts join exists | (2) Discriminated result (3) Two-call API | Alt-2 (23/25) | No (12/25) | **REWRITE** — discriminated result `{ kind: "same-cone-join" \| "cross-cone-no-join" \| "same-cone-no-extension" }` |
| B2 | S1 §1 | `stratumLabel` storage | Stored column | (2) Derived view (3) Materialized view (4) Verify-on-read cache | Alt-4 (21/25) | No (16/25) | **AUGMENT** — stored cache + cheap version check + recompute on mismatch |
| B3 | S1 §1 | `retractReason` enum | Single flat enum (4 values) | (2) Tagged `retractLayer + retractReason: string` (3) Separate `RetractionEvent` table | Alt-2 (22/25) | No (17/25) | **AUGMENT** — split into tagged columns, preserve T4 |
| B4 | S1 §1, §2.1 | Terminology (`inference`, I1–I4) | Keep, document mapping | (2) Rename to substrate terms (3) DB alias | Alt-2 (25/25) | No (14/25) | **REWRITE** (mechanical) — `inference → daimon`, I1–I4 → S1–S4 |
| B5 | S1 §5.3 | Briefing fingerprint hash | Single SHA256 over 15 fields | (2) Component hash vector (3) Merkle tree | Alt-2 (23/25) | No (19/25) | **AUGMENT** — `{ hubHash, refusalHash, claimGraphHash, ... }` ✅ shipped 2026-05-21 (additive — see §9) |
| B6 | S1 §6 | MCP auth | Shared bearer + caller participantId | (2) Per-tenant JWT (3) mTLS (4) Scoped session tokens | Alt-4 (22/25) | No (19/25) | **FINE v1 / AUGMENT v2** — scoped session tokens bound to `(deliberationId, participantId)` |
| B7 | S2 §2.2 | `IncarnationSetManifest` shape | `{ bottom, minimals[], totalIncarnations }` | (2) `{ incarnations[], totalIncarnations }` (3) Per-cone `{ cones[] }` | Alt-2 (24/25) | No (12/25) | **REWRITE** — drop `bottom`; consider Alt-3 once MCP exposes cone identity |
| B8 | S2 §3.3 | `proposeSynthesis` failure model | Assumes joinable | (2) Discriminated kinds (3) Two-step validate→synthesize | Alt-2 (23/25) | No (14/25) | **REWRITE** — mirror B1's discriminated pattern |
| B9 | S2 §4.3 | `fossilizeByArgument` lookup | Dual path (fuzzy + `argumentId`) | (2) `argumentId`-only (3) Event-bus | Alt-2 (25/25) | No (13/25) | **REWRITE** — column-first; drop fuzzy interim ✅ shipped 2026-05-21 (variant — see §9) |
| B10 | S2 §5.2 | OQ-JSL proof outcome model | Binary confirm / counterexample-with-flag | (2) Three-bucket (confirm / refute-local / refute-structural) (3) Exploratory + formal | Alt-2 (24/25) | No (12/25) | **REWRITE (template)** — permanent template for formal-proof spec sections |
| B11 | S2 §6.1 | Rate-limit key | `participantId` | (2) Compound `(tenant, participant) + (tenant, IP)` (3) Per-IP (4) Token-bucket | Alt-2 (20/25) | Tie (19/25) | **FINE v1 / AUGMENT v2** — compound key for cross-participant abuse |
| B12 | S2 §6.5 | Fingerprint cache coherence | L1 in-memory + L2 DB | (2) Drop L1; Redis read-through (3) L1+L2+pub/sub | Alt-2 (24/25) | No (16/25) | **AUGMENT** — drop L1; single shared Redis cache |

**Pass B roll-up:**
- **Rewrite-tier (6):** B1, B4, B7, B8, B9, B10 (Δ +9 to +12).
- **Augment-tier (5):** B2, B3, B5, B12, + B11/B6 deferred to v2.
- **Spec choice scored lower than the best alternative on all 12 commitments.** Performance was a strong design driver (spec scored 4–5 on Performance for 10/12); Correctness was the weak axis (spec scored 1–3 on Correctness for the six rewrite-tier items).

---

## §4 — Cross-cutting findings

### §4.1 — Singular-bottom assumption (root cause behind 13 findings)
Both specs assume Inc(B) has a unique bottom |B|. Phase 2e (proof landed 2026-05-21) disproved this; Inc(B) is an antichain, (B, ≤_⊆) decomposes into disjoint cones, and ∨_⊥⊥ is well-defined only within a cone (literal chronicle-set union under Phase 2f Reading A). Both specs were written 2026-05-19/20, 1–2 days before the proof. **Not a quality failure — a sequencing artifact.** But it concentrates regret in §2, §3, §5 of Session 2 and §3.2 of Session 1.

Findings tracing to this root cause: A4.2, A5.1, A5.6, A9.1, A9.2, A9.3, A9.5, A10.1, A10.3, A10.4, A12.1, B1, B7, B8, B10. **15 items total.**

### §4.2 — Terminology drift from substrate
Five separate drifts (A1.1, A2.1, A9.2, A10.4/A13.3, A10.5). Spec invariant numbering collides with substrate; move-type vocabulary diverges; closure-step interpretation reverses from "correctness gauge" to "performance gauge." **One coordinated terminology pass eliminates all five.**

### §4.3 — Derived state treated as stored state
Four cases (A3.2, A9.1, A7.1/B5, A13.5/B12). Substrate is replete with derived state; spec defaults to stored columns with manual sync, generating staleness risk surfaces. Common remedies (verify-on-read, component vectors, single-shared-cache) are well-known but not adopted.

### §4.4 — T4 boundary leakage
Three cases (A11.1 reversed back-reference; A6.1/A11.5/B3 enum collapse; A11.3 unowned announcement discipline). The substrate's clean separation between the dialectical layer and the witnessing layer is partially collapsed at the Prisma schema boundary.

### §4.5 — Operational concerns added without substrate hooks
Rate limiting, cache warming, observability, auth, durable history — all FAITHFUL on Pass A but under-specified failure modes (cross-participant abuse, concurrent rule firing, L1/L2 coherence, `closureSteps > 0` policy).

### §4.6 — Test discipline gaps
- R1–R5 fingerprint invalidation rules: **0/5 exercised against real data** through end of Session 2 (A8.4).
- Stratum-recompute never tested (A8.5).
- Function-layer idempotence ≠ endpoint-layer idempotence (A11.4 — intra-spec incoherence).
- Adversarial fixture arithmetic mathematically inconsistent post-2e (A10.2).

### §4.7 — Repo-convention violation
A8.1 — `npx prisma migrate dev` against the directive in `.github/copilot-instructions.md` and `AGENTS.md` to use `prisma db push`.

---

## §5 — Regret-check inventory

*Specs that should be rewritten now that OQs they predated have closed.* This is the highest-value section of the review.

### OQs closed since spec was written
| OQ | Resolution | Date | Spec sections affected |
|---|---|---|---|
| OQ-JSL (is `(Inc(B), ≤_⊆, ∨_⊥⊥)` a JSL?) | **Outcome B mis-attribution.** Inc(B) is an antichain; JSL carrier is per-cone C_i. | 2026-05-21 | S1 §3.2 · S2 §2 · S2 §3 · S2 §5 · S2 §6.3 |
| ∨_⊥⊥ within-cone semantics | **Literal chronicle-set union** (Reading A, Phase 2f pre-session) | 2026-05-21 | S1 §3.2 · S2 §3.5 |
| Cone Decomposition Proposition | (B, ≤_⊆) = disjoint union of cones C_i; ∨ exists same-cone only | 2026-05-21 | S1 §3.2 · S2 §2.6 · S2 §3.3 |
| Daimon Lock Lemma | Same-cone designs share positive (daimon) skeleton; differ only in negative branches | 2026-05-21 | S2 §1 seed script construction |

### Stale-on-arrival sections (cannot be augmented; require rewrite)
| Section | Why stale | Tier |
|---|---|---|
| S1 §3.2 `compute_articulation_join` | Assumes unique bottom; asserts join exists | **REWRITE** |
| S2 §2 `incarnationSet` manifest + recall metric | Singular `bottom` field; single-number recall | **REWRITE** |
| S2 §3 `proposeSynthesis` | Assumes joinable; conflates delocation with cross-cone failure; fixture arithmetic wrong | **REWRITE** |
| S2 §5 OQ-JSL proof prompt | Proof has already executed with Outcome B; spec branching never anticipated structural refinement | **ARCHIVE** with pointer to [LUDICS_OQ_JSL_PROOF.md](LUDICS_OQ_JSL_PROOF.md) |
| S2 §6.3 `closureSteps` observability paragraph | "Slow join" interpretation wrong; any nonzero is substrate violation | **REWRITE** (paragraph) |
| S2 §1.2 seed script | Silent on cone-locality of `DesignInclusion` edge | **REWRITE** (script) |

**Counts:** 6 REWRITE + 1 ARCHIVE.

### Risk-weighted dependency order for downstream specs
Session 3 spec authors should treat the inventory as a dependency graph, not a flat list.

1. **Tier-1 blockers (do first; everything downstream depends on these):**
   - **B4 terminology pass** — mechanical; unblocks every audit and consumer doc.
   - **REWRITE S2 §2** — every Session 2+ feature touches `IncarnationSetManifest`.
   - **REWRITE S1 §3.2** — every synthesis path calls `compute_articulation_join`.
   - **ARCHIVE S2 §5** — formally close the loop with a pointer to actual outcome.

2. **Tier-2 high-priority (before next AI-consumer-facing feature):**
   - **REWRITE S2 §3 `proposeSynthesis`** — depends on Tier-1 (B7, B1 rewrites).
   - **AUGMENT S2 §4 (B9)** — drop fuzzy fossilize path (production correctness risk).
   - **AUGMENT S2 §6.5 (B12)** — drop L1; Redis-only (production correctness risk).

3. **Tier-3 hygiene (do when touching the area):** B5, B2, B3, B11, T7 migration tooling.

4. **Tier-4 future-proofing (defer to next major auth/observability cycle):** B6 scoped session tokens.

---

## §6 — Triage (three bins)

### Bin 1 — Spec is wrong, rewrite (7 items)
*Highest priority. Fix before any new code is written against the affected sections.*

| Section | Driver |
|---|---|
| S1 §3.2 articulation join algorithm | A5.6, B1 |
| S2 §1.2 seed script | A8.2 |
| S2 §2 `IncarnationSetManifest` | A9.1, B7 |
| S2 §3 `proposeSynthesis` | A10.1, A10.2, A10.3, B8 |
| S2 §5 OQ-JSL proof prompt (**ARCHIVE**) | A12.1, B10 |
| S2 §6.3 `closureSteps` paragraph | A10.4, A13.3 |
| S1 §1 + §2.1 terminology pass (B4) | A1.1, A2.1 |

### Bin 2 — Spec is right but under-specified, augment (12 items)
*Add the missing invariant, failure mode, or enforcement point.*

| Section | Driver |
|---|---|
| S1 §1 `LudicMove.stratumLabel` column | B2 — verify-on-read |
| S1 §1 `WitnessRecord.retractReason` | B3 — tagged columns |
| S1 §5.3 briefing fingerprint hash | B5 — component vector ✅ shipped 2026-05-21 |
| S2 §1.1 migration command | T7 — `prisma db push` |
| S2 §1.3 integration tests | A8.4 (R1–R5 coverage), A8.5 (stratum) |
| S2 §4.3 `fossilizeByArgument` | B9 — drop fuzzy path ✅ shipped 2026-05-21 |
| S2 §4 fossil endpoint idempotence | A11.4 ✅ shipped 2026-05-21 |
| S2 §4.5 manual retract endpoint | A11.3 — announcement integration policy |
| S2 §6.1 rate-limit | B11 — compound key (v2) |
| S2 §6.5 `BriefingFingerprintHistory` | B12 — drop L1; Redis-only |
| S1 §6 / S2 §6.4 MCP auth | B6 — scoped session tokens (v2) |
| S2 §2.4 `ConfidentMisstatementKind` | A9.4 — add `miscount-across-cones`, `incarnation-conflation` |

### Bin 3 — Spec is fine, kept for the record (5 items)
*No action; documented for future reviewers.*

| Section | Note |
|---|---|
| S1 §1 Prisma core shapes (Behaviour, Design, DesignInclusion, WitnessRecord) | Modulo enum/tag cleanups above |
| S1 §6 test harness structure | Sound |
| S2 §1 performance SLAs (500/200/100 ms p95) | Defensible operational targets |
| S2 §6.2 BullMQ cache warming | Orthogonal to substrate; correctly scoped |
| S2 §6.4 auth extraction to `server/ludics/auth.ts` | Good factoring |

**Triage totals:** 7 REWRITE/ARCHIVE · 12 AUGMENT · 5 FINE.

---

## §7 — Outstanding questions

Surfaced by the review; could not be resolved from spec + substrate reading alone.

1. **OQ-C3-thin-cones** (flagged in Phase 2f pre-session notes). What is the formal characterization of "thin cones" — cones with |C_i| bounded by a small constant? Affects whether per-cone join can be sub-linear in |B|.
2. **Cone identity in the MCP surface.** Does the AI consumer need explicit `coneId` exposure, or is the `incarnations[]` array sufficient? Decides whether B7 Alt-2 (drop `bottom`) or B7 Alt-3 (per-cone manifest) is the right rewrite.
3. **Cross-cone synthesis semantics.** When two designs occupy different cones, is there a *Mesh-layer* (non-substrate) "discourse synthesis" operation that fills the gap that ∨_⊥⊥ no longer covers? Spec currently silent.
4. **Announcement discipline ownership.** A1–A4 deferred at substrate, silent in spec. Manual retract endpoint (A11.3) needs a home for "who notifies whom" — substrate, spec, or a new layer.
5. **Concurrent rule firing for `BriefingFingerprintHistory.ruleLabel`.** When R1 and R2 fire on the same write, which is recorded? Affects auditability of cache-invalidation events.
6. **`closureSteps > 0` policy.** Hard error / soft alert / drop-result? Post-2f, all three are defensible; spec needs to pick one before Session 3 ships any new synthesis tooling.
7. **Terminology rename cost.** B4 recommends `inference → daimon` and I1–I4 → S1–S4. The DB migration is mechanical; the API/MCP-tool-name impact on existing AI consumers is the open question — has any external consumer hard-coded `moveType: "inference"`?

---

## §8 — Closing observations

**Meta-finding.** The substrate-spec gap is **healable in one focused sprint**. Four of six rewrite-tier items share a single root cause (T1). Fixing the singular-bottom assumption and doing the B4 terminology pass would resolve **11 of the 15 cross-cutting findings**.

**Pattern of strength.** Both specs scored 4–5 on Performance for nearly every commitment. Operational sections (BullMQ cache warming, perf SLAs, auth extraction) were uniformly FAITHFUL. The spec's structural weakness is **substrate fidelity**, not engineering judgment.

**Pattern of weakness.** The recurring failure mode is **adopting the staleness-prone storage option** (stored column over derived view; single hash over component vector; L1+L2 over single shared cache; flat enum over tagged columns). A future Session 3 spec template could include a "derived state checklist" prompting the author to argue against the staleness-prone default.

**Sequencing lesson.** Both specs were written 1–2 days before the OQ they implicitly depended on closed. A spec lifecycle convention — "do not commit a spec section whose primary OQ is open at the time of writing" — would have prevented the largest finding cluster. This is a process recommendation, not a quality criticism of the spec authors.

---

## §9 — Resolution log (2026-05-21)

Three Bin-2 items from this review have shipped. Annotated with ✅ in §3 (Pass B) and §6 (triage) above.

| Item | Bin | Resolution | Artefacts |
|---|---|---|---|
| **A11.4** — `fossilize()` function-vs-endpoint idempotence | Bin 2 | DONE | Direct unit test pinning function-layer idempotent return + endpoint-layer 409. Splits the behaviour at the correct layer per the spec's intent. |
| **B9** — drop fuzzy `fossilizeByArgument` lookup | Bin 2 | DONE (variant) | The fuzzy `canonicalText contains` path was already removed in earlier `P1.h.5` hardening. This round closed the adjacent gap surfaced by the audit: the seed script never wrote `argumentId` on `LudicMove` rows. [scripts/seed-ludics-showcase.ts](../../../../scripts/seed-ludics-showcase.ts) (L85–L116) now sets `argumentId`; the 143 NULL rows on staging were backfilled idempotently. New T15.2 in [__tests__/invariants/phase2d-fossil-lifecycle.test.ts](../../../../__tests__/invariants/phase2d-fossil-lifecycle.test.ts) pins the structural-where contract for `fossilizeByArgument` (asserts `Object.keys(where).sort() === ["fossilizedAt", "ludicMove"]` — no `canonicalText`, no `OR`). |
| **B5** — briefing fingerprint component vector | Bin 2 | DONE (additive) | `ComponentHashVector { hubs, frontier, refusal, witnessing }` added to `BriefingFingerprintResult` in [server/ludics/briefingFingerprint.ts](../../../../server/ludics/briefingFingerprint.ts). Disjoint partition over `MaterialFields` (refusalCount deliberately omitted — derivable from `refusalConclusionIds`). `evaluateStalenessRules` takes optional `(prevComponents, currComponents)` and skips rules whose owning component is unchanged: R1↔hubs · R2↔refusal · R3/R4↔frontier · R5↔witnessing. New `diffComponents(prev, curr)` helper. New pin file [__tests__/invariants/phase1f-fingerprint-components.test.ts](../../../../__tests__/invariants/phase1f-fingerprint-components.test.ts). |

**Design note on B5 — additive vs. replace.** The Pass B recommendation reads `AUGMENT — { hubHash, refusalHash, claimGraphHash, ... }`. Two implementations satisfy that contract:
- **Additive (chosen).** Keep `contentHash` byte-stable; add `components` alongside it. Pin the consistency invariant in tests: any `contentHash` change ⇒ ≥ 1 component digest change.
- **Replace.** Redefine `contentHash = sha256(`${hubs}|${frontier}|${refusal}|${witnessing}`)`. Cleaner single source of truth, but invalidates every pinned `manifest.contentHash` in `eval/ai-epi/snapshot/corpus/v2/`.

The additive path was chosen to preserve the corpus pins and ship without a fixture-regeneration sub-task. The replace path remains available if a future consumer surface needs the combined-hash framing directly.

**Test surface deltas:**
- `__tests__/invariants/phase1f-fingerprint-components.test.ts` — new (B5).
- `__tests__/invariants/phase2d-fossil-lifecycle.test.ts` — T15.2 added (B9 defensive structural-where).
- `__tests__/invariants/phase1g-scorecard-manifest.test.ts` — fixture-count assertion bumped 5 → 7 (pre-existing drift surfaced while running B5 regression; `synthesis-join-db` + `synthesis-delocation-db` had been added since the baseline assertion was written).

**Aggregate at landing:** 17 suites · 336 tests green across `__tests__/invariants` + `__tests__/eval`.

**Bin 2 remaining (9 items):** B2 (verify-on-read), B3 (retractReason tagged columns), T7 (`prisma db push` tooling), A8.4 (R1–R5 invalidation coverage), A8.5 (stratum recompute), A11.3 (announcement integration), A9.4 (`ConfidentMisstatementKind` extensions), B11 (compound rate-limit key, v2), B12 (drop L1 / Redis-only), B6 (scoped session tokens, v2).

**Bin 1 unchanged:** all 7 rewrite/archive items still open (B4 terminology, S1 §3.2 join algorithm, S2 §1.2 seed, S2 §2 manifest, S2 §3 `proposeSynthesis`, S2 §5 archive, S2 §6.3 `closureSteps` paragraph).

---

*End of review. See [LUDICS_SESSIONS_1_2_SPEC_REVIEW_WORKING_NOTES.md](LUDICS_SESSIONS_1_2_SPEC_REVIEW_WORKING_NOTES.md) for full per-round evidence and per-finding scoring detail. Companion spec ↔ code audit is the separate [LUDICS_SESSIONS_1_2_AUDIT_PROMPT.md](LUDICS_SESSIONS_1_2_AUDIT_PROMPT.md) (not executed by this review).*
