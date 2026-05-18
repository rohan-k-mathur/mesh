# Corpus v2 — DB-snapshot fixtures

Fixtures in this directory are produced by running the snapshot
capture pipeline against a real database:

```bash
DATABASE_URL=... npx tsx eval/ai-epi/snapshot/captureFixture.ts
# or:
DATABASE_URL=... npx tsx eval/ai-epi/snapshot/captureFixture.ts --slug small-single-hub-db
```

The capture script:

1. Seeds a deliberation graph from a `DeliberationSpec` (`eval/ai-epi/snapshot/specs.ts`).
2. Calls `computeSyntheticReadout(deliberationId)`.
3. Re-keys the readout's `deliberationId` to the spec slug for stability across re-captures.
4. Writes the full `SyntheticReadout`-shaped fixture to `fixtures/<slug>.json`.
5. Updates `manifest.json`.
6. **Cleans up** all seed data via the deliberation cascade (and explicit `CQStatus` + `DeliberationFingerprintCache` deletes).

Captured fixtures are consumed by the same `loadCorpus` / `generateManifest` /
`scorePhase1` pipeline as the v1 (synthetic) corpus. The `Fixture` shape is
identical; corpus-v2 fixtures simply embed a *full* `SyntheticReadout` rather
than the `Pick`-narrowed subset.

**Capture must NOT run in CI** without an isolated dev `DATABASE_URL`. CI
grades the committed JSON.
