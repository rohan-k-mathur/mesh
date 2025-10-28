# AIF Round-Trip Integration Tests

## Overview
The `aif-roundtrip.test.ts` file contains tests for verifying AIF JSON-LD export/import fidelity. Currently, 4 basic tests run in CI (function availability checks), while 4 integration tests are skipped due to requiring a real database connection.

## Running Integration Tests Locally

To run the full integration test suite with database access:

1. **Set up a test database:**
   ```bash
   # Create a test database (Postgres)
   createdb mesh_test
   ```

2. **Configure environment variables:**
   ```bash
   export DATABASE_URL="postgresql://user:password@localhost:5432/mesh_test"
   export NODE_ENV="test"
   ```

3. **Run migrations:**
   ```bash
   npm run prisma -- migrate deploy
   ```

4. **Update jest.setup.ts:**
   ```typescript
   // Comment out the prisma mock for integration tests
   // jest.mock("@/lib/prismaclient", () => ({ prisma: { $connect: jest.fn() } }));
   ```

5. **Run the tests:**
   ```bash
   npm run test -- tests/aif-roundtrip.test.ts
   ```

6. **Unskip tests:**
   Remove `.skip` from test cases in `aif-roundtrip.test.ts`

## Test Coverage

### ✅ Unit Tests (Currently Running)
- `has export function` - Verifies exportDeliberationAsAifJSONLD exists
- `has import function` - Verifies importAifJSONLD exists
- `export returns AIF structure` - Checks function signature
- `import accepts AIF structure` - Checks function signature

### ⏳ Integration Tests (Skipped in CI)
- `preserves all node types in round-trip` - Tests I/RA/CA/PA node preservation
- `preserves scheme references in round-trip` - Tests ArgumentScheme.key preservation
- `preserves premise relationships in round-trip` - Tests ArgumentPremise fidelity
- `maintains node loss below 5% threshold` - Tests overall data loss < 5%

## Acceptance Criteria

All integration tests must pass with:
- **Node counts:** Imported counts match original (Claims, Arguments, Attacks, Preferences)
- **Scheme keys:** All scheme keys preserved on Arguments
- **Premise relationships:** All premise-claim connections intact
- **Data loss:** <5% total node loss in round-trip

## Future Work
- Set up dedicated test database in CI
- Create seed fixtures for consistent test data
- Add performance benchmarks for large deliberations
- Test edge cases: orphaned nodes, circular references, missing schemes
