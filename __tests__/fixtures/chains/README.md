# Chain prose-generator test fixtures

Synthetic, hand-authored chain payloads that mirror the shape returned by
`GET /api/argument-chains/[chainId]`. Used by
[`__tests__/chains/proseGenerator.golden.test.ts`](../../chains/proseGenerator.golden.test.ts)
to lock in current rule-based output so M1+ refactors of
[`lib/chains/proseGenerator.ts`](../../../lib/chains/proseGenerator.ts) and
[`lib/chains/essayGenerator.ts`](../../../lib/chains/essayGenerator.ts) produce
reviewable snapshot diffs.

## Fixtures

- **`hinge1.json`** — 5 nodes / 4 edges, mirrors the polarization-1 Hinge #1
  chain ("Feeling-thermometer measurement validity") cited in the backlog.
  Mix of `ASSERTED` + `QUESTIONED` epistemic statuses and
  `THESIS / ANTITHESIS / RESPONSE / SYNTHESIS` dialectical roles, with one
  `REBUTS`, one `UNDERCUTS`, one `SUPPORTS`, and one `QUALIFIES` edge so the
  full transition matrix in M2c has data to bind to.
- **`blockedConclusion.json`** — 3 nodes / 2 edges chain whose `rootClaimId`
  is referenced from a sibling `refusalSurface.cannotConcludeBecause` fixture
  in [`syntheticReadout.blocked.json`](syntheticReadout.blocked.json). Used by
  M3 to assert the refusal-surface banner renders and the conclusion
  paragraph never asserts a blocked claim.

## Authoring notes

These fixtures are synthetic (not snapshotted from a live DB) so they remain
deterministic and don't require Prisma or `DATABASE_URL` to run the tests.
The shape tracks the prod serializer in
[`app/api/argument-chains/[chainId]/route.ts`](../../../app/api/argument-chains/%5BchainId%5D/route.ts):
BigInt fields are pre-stringified, scopes are an empty array, schemeNet is
`null`. If the API shape changes, update both fixtures and re-run
`npm run test -- proseGenerator.golden` with `--updateSnapshot`.
