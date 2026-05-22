# Ludics Sessions 1 & 2 — Implementation Audit Prompt

**Purpose.** Standalone prompt for a dedicated audit thread that verifies
every deliverable from `LUDICS_SESSION_1_DEV_SPEC.md` and
`LUDICS_SESSION_2_DEV_SPEC.md` is actually present in the codebase, behaves
as specified, and has not silently drifted from the spec. Open a fresh
conversation, paste this document as context, and let the model work through
the audit checklist in order. The session produces
`LUDICS_SESSIONS_1_2_AUDIT_REPORT.md` as its primary deliverable.

**This is a read-only, evidence-gathering exercise.** Do not fix issues
found during the audit — record them as findings and let the human triage.
The one exception is trivially correct documentation drift (e.g., a doc
referencing a renamed file path); flag it but do not fix in this session.

**Companion document.** This audit (spec ↔ code) is complementary to
`LUDICS_SESSIONS_1_2_SPEC_REVIEW_PROMPT.md` (substrate ↔ spec). Run them
as parallel threads and triage findings together. An "OK / matches spec"
finding here may become "implemented correctly but rip it out" if the
spec review concludes the spec itself was wrong.

---

## §0. Inputs

Read these documents in full before starting:

1. `Development and Ideation Documents/ARCHITECTURE/Ludics Generative Substrate Documents/LUDICS_SESSION_1_DEV_SPEC.md`
   — 7 phases (1a–1g): MCP tools, manifest, scorecard, non-attribution DB
   invariant, briefing-fingerprint API, 169 invariant tests.
2. `Development and Ideation Documents/ARCHITECTURE/Ludics Generative Substrate Documents/LUDICS_SESSION_2_DEV_SPEC.md`
   — 6 phases (2a–2f): staging migration + benchmarks, `incarnationSet`
   manifest field, AI synthesis workflow, fossil retraction lifecycle,
   OQ-JSL formal proof pass, production readiness (rate limiting, cache
   warming, auth audit, fingerprint durability).
3. `Development and Ideation Documents/ARCHITECTURE/Ludics Generative Substrate Documents/LUDICS_CONSOLIDATION_AND_DEV_READINESS.md`
   — OQ register (use as cross-reference for which OQs were closed/opened
   by this work).
4. `Development and Ideation Documents/ARCHITECTURE/Ludics Generative Substrate Documents/LUDICS_OQ_JSL_PROOF.md`
   and `LUDICS_ORDER_RELATION_DEFINITION.md` — the Phase 2e proof artefact
   and the Phase 2f pre-session definitional clarification.

Skim, do not deeply read, the following — they are context, not audit targets:
`LUDICS_GENERATIVE_SUBSTRATE.md`, `LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md`,
`LUDICS_OPEN_COMPOSITION_JOINT.md`,
`LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md`,
`PHASE_2E_OQ_JSL_PROOF_PROMPT.md`, `PHASE_2F_*` prompts.

---

## §1. Audit method

For each Session 1/2 deliverable:

1. **Locate the artefact.** Identify the file(s) the spec claims to have
   produced (Prisma model, MCP tool, API route, service module, test file,
   doc). Use `grep_search` / `file_search` to confirm existence.
2. **Verify the shape.** Read the file(s) and check the spec's contract:
   - Schema fields and their types (Prisma).
   - JSON-RPC input/output schemas (MCP tools).
   - Request/response shapes (API routes).
   - Function signatures and invariants (service modules).
   - Test names and what they assert.
3. **Verify the behaviour.** Where feasible without running the app, check
   the implementation against the spec by reading the code. Where claimed
   tests exist, confirm they are non-trivial (assert the spec'd invariant,
   not a tautology) and that they are still wired into the Jest config.
4. **Record one finding per deliverable** with one of:
   - **OK** — implemented per spec, no drift.
   - **DRIFT** — implemented but differs from spec in a recorded way
     (include a one-paragraph delta description).
   - **MISSING** — spec'd but not present.
   - **PARTIAL** — present but incomplete; describe what's missing.
   - **DEFERRED** — explicitly marked as deferred in the spec (don't audit).
   - **N/A** — the deliverable was a research artefact, not code (e.g.,
     a written proof); confirm the artefact exists and is non-trivial.

Reference specific file paths and line ranges in every finding.

---

## §2. Session 1 audit checklist

Walk these in order. For each phase, locate the spec's exit criteria and
verify.

### Phase 1a — Prisma models
Spec: five new models (`LudicMove`, `WitnessRecord`, `Design`, `Behaviour`,
`DesignInclusion`). Verify against `lib/models/schema.prisma` and
`prisma/schema.prisma` (whichever the repo uses). Check field types,
indexes, foreign keys, and any unique constraints called out in the spec.

### Phase 1b — 14-tool MCP surface
Spec §1: ~14 Ludics-native tools, six clusters. Verify against
`packages/isonomia-mcp/src/server.ts`. For each tool: name matches, JSON
schema matches, description includes the spec'd cross-reference to
existing tools where applicable. Confirm none of the 29 pre-existing
tools were silently removed.

### Phase 1c — Structural manifest
Spec §2: precise list of mechanically-computable graph properties; this
becomes `Manifest` in `eval/ai-epi/types.ts` and is populated by
`eval/ai-epi/manifestGenerator.ts`. Verify the field set matches §2.2 of
the Session 1 spec.

### Phase 1d — Fidelity scorecard
Spec §3: scorecard fields, weighting, and the `ConfidentMisstatementKind`
enum. Verify against `eval/ai-epi/scorecard/phase1.ts` and `types.ts`.
Confirm release-blocking vs. soft-blocking misstatements match the spec.
**Note:** Phase 2f added the chain-dependency dimension (OQ-fidelity);
verify that as part of Session 2 audit, not here.

### Phase 1e — Non-attribution DB invariant
Spec §4: schema constraint + API contract. Identify which fields/tables
hold the invariant. Verify any check constraints, Prisma `@@check`s, or
service-layer guards. Confirm there is at least one test that attempts
to violate the invariant and expects rejection.

### Phase 1f — Briefing-fingerprint API
Spec §5: API draft with five material-change rules. Locate the route(s)
(likely under `app/api/`). Confirm all five rules are implemented and
named consistently with the spec.

### Phase 1g — 169 invariant tests
Spec exit: 169/169 tests passing. Locate the test files. Do not run them
in this audit (the audit thread is read-only); instead, count test cases
across the relevant `__tests__/` and `eval/` directories and confirm the
count is plausibly ≥169. Flag any clearly-skipped or `.only`-pinned tests.

---

## §3. Session 2 audit checklist

### Phase 2a — Staging migration + benchmarks
Spec §1: a migration file plus a benchmark script with recorded results.
Look for SQL files under `prisma/migrations/` or `supabase/` from the
Session 2 date range; look for benchmark scripts under `scripts/` or
`tools/`. **Note:** repo convention is `npx prisma db push`, not
`migrate dev` — the "migration" may be a `db push` snapshot rather than
a generated migration file. Record what's actually there.

### Phase 2b — `incarnationSet` manifest field
Spec §2: add `incarnationSet` to `Manifest`. Verify the field exists in
`eval/ai-epi/types.ts`, is populated in `manifestGenerator.ts`, and that
fixtures emit it. Confirm there is a test asserting the field's shape.

### Phase 2c — AI synthesis workflow
Spec §3: end-to-end agent path `compute_articulation_join` →
`bind_participant_to_design` → commit. Locate the workflow (likely a
script under `scripts/` or an integration test). Verify it actually
calls the spec'd tool sequence.

### Phase 2d — Fossil retraction lifecycle
Spec §4: `fossilize()` wired to argument deletion, locus removal, and
design excision. Find the `fossilize` definition and its call sites.
Confirm at least the deletion paths trigger it.

### Phase 2e — OQ-JSL formal proof
Spec §5: proof document plus downstream C1-statement corrections.
Verify `LUDICS_OQ_JSL_PROOF.md` exists and contains the four claims
(antichain, cross-cone incompatibility, per-cone JSL conditional, C1
corrected statement). Cross-check that the consolidation register's
OQ-JSL row is marked Closed and that OQ-JSL-Cone / OQ-JSL-Type carry
the Phase 2f pre-session annotation. Verify the OQ4 chain-dependency
fidelity work (`eval/ai-epi/scorecard/phase1.ts`,
`__tests__/eval/chainDependency.test.ts`) is present and the 12 tests
exist.

### Phase 2f — Production readiness
Spec §6: rate limiting (Redis/Upstash, 10/min per `participantId` on
`bind_participant_to_design`), BullMQ cache-warming job, auth audit,
fingerprint durability (Redis-backed `hashCache`). For each of the
four sub-items, locate the implementation and verify the spec's
constraint is enforced. **Likely status: not yet implemented** — this
phase was explicitly listed as pending in the most recent session's
state. Record honestly.

---

## §4. Cross-cutting checks

After per-phase audit, run these checks:

1. **OQ register consistency.** For every OQ marked Closed in
   `LUDICS_CONSOLIDATION_AND_DEV_READINESS.md`, confirm the cited
   artefact exists and substantiates the closure. Flag any Closed
   OQ whose evidence is thin or whose artefact has drifted.
2. **Test-suite health.** List every test file added in Sessions 1
   and 2. Confirm none are `.skip`-ed or `.todo`-ed wholesale. Note
   any `xit` / `xdescribe`. Confirm Jest config still includes the
   relevant paths.
3. **Public-API stability.** For each Session 1 MCP tool, search the
   repo for callers. Confirm Session 2 changes did not silently
   rename a tool or change its input schema in a breaking way.
4. **Documentation drift.** Spot-check three places where Session 1
   docs reference file paths: confirm those files still exist at
   those paths (Session 2 may have moved things).
5. **The chain-dependency dimension (OQ4).** Confirm it is wired
   into both the manifest (`Manifest.dependencyEdges` populated from
   `fixture.readout.chains.chains[].edges` with the spec'd dedup
   key) and the scorecard (`scoreChainDependency`, edge-level and
   node-level P/R/F1, `chain-direction-reversal` as a release-
   blocking misstatement). Verify all 12 tests in
   `__tests__/eval/chainDependency.test.ts` are non-trivial.

---

## §5. Deliverable

Produce `LUDICS_SESSIONS_1_2_AUDIT_REPORT.md` with:

- **Executive summary** (≤10 lines): pass/fail counts per session, top
  three findings.
- **Per-phase findings table.** Columns: Phase, Deliverable, Status
  (OK / DRIFT / MISSING / PARTIAL / DEFERRED / N/A), Evidence
  (file paths + line ranges), Notes.
- **Cross-cutting findings** (one subsection per §4 check).
- **Recommended follow-ups**, prioritised. Distinguish:
  - **Must-fix** before the OQ-JSL-Type/Cone session runs.
  - **Must-fix** before Phase 2f production work starts.
  - **Nice-to-fix** housekeeping (e.g., test count drift, doc paths).
- **Outstanding questions for the implementation thread** —
  anything the audit could not resolve from reading alone and that
  requires a hands-on session.

---

## §6. Scope-out

- **Do not run tests.** Audit is read-only.
- **Do not fix issues found.** Record them; let the human triage.
- **Do not re-derive proofs.** Phase 2e/2f conceptual artefacts
  (`LUDICS_OQ_JSL_PROOF.md`, `LUDICS_ORDER_RELATION_DEFINITION.md`)
  are inputs, not audit targets. Confirm they exist and are
  non-trivial; do not re-verify the mathematics.
- **Do not audit Tier-0 / Sessions 0a–0h conceptual work.**
  Those produced research artefacts, not code; their audit is a
  separate exercise.
- **Do not audit `packages/sheaf-acl` or anything outside the
  Ludics substrate code paths**, unless a Session 1/2 deliverable
  explicitly touched it.

---

## §7. Recommended working order

1. Read all §0 inputs in full.
2. Walk §2 (Session 1) in order, recording findings as you go.
3. Walk §3 (Session 2) in order.
4. Run §4 cross-cutting checks.
5. Compile §5 deliverable.

Budget roughly 60% of effort on Session 2 (more recent, more likely
to contain drift) and 40% on Session 1 (older, more settled, but
foundational — drift here cascades).
