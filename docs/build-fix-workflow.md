# Build-Fix Workflow (Vercel deployment)

> I've saved the full pattern catalog and fix log in session memory.

This doc captures the most efficient way to approach a "fix all build errors so
Vercel deploys" session, based on lessons from working through ~60 TypeScript
errors across `app/api/**`.

## The core inefficiency to avoid

The single biggest time sink is the **one-error-at-a-time loop**: `next build`
stops at the *first* type error, and each run takes minutes. Running ~60 builds
for ~60 fixes is slow. The fixes below collapse that to ~3-5 runs.

## 1. Get ALL errors at once instead of one-at-a-time

`next build` halts on the first error. Instead use the TypeScript compiler
directly:

```bash
npx tsc --noEmit -p tsconfig.json 2>&1 | tee /tmp/tsc-errors.txt
```

This lists **every** type error in one pass (no build, no webpack, no OOM). Then
batch-fix dozens at once and only run the slow `next build` a couple of times for
final verification.

## 2. Group errors by pattern, fix in bulk

The errors cluster into a handful of recurring, mechanical patterns:

- `userId` is `bigint | null` → guard `?.userId`, use `.toString()` for string fields
- `Json?` Prisma fields → `?? undefined`, never literal `null`
- Prisma relation `connect` mixed with scalar FKs → use scalar (`deliberationId`, `schemeId`)
- `'executive-summary'` → `'abstract'` for `PDFReportSection`
- Schema field-name drift (`fromId`→`fromArgumentId`, `createdById`→`authorId`, missing `moid`)
- Stale `@ts-expect-error` → `@ts-ignore`

A grep across the codebase for each pattern catches all instances proactively
rather than waiting for the build to surface them.

## 3. Verify against the real schema early

Many errors are "field doesn't exist." The Prisma schema lives at
`lib/models/schema.prisma` (NOT `prisma/schema.prisma`). Skim the relevant models
upfront to avoid guess-and-check.

## 4. Always run the slow build with the heap flag

```bash
NODE_OPTIONS="--max-old-space-size=8192" npx next build
```

The default heap OOMs on this repo.

## Recommended workflow

1. `tsc --noEmit` → capture full error list
2. Bucket errors by pattern, batch-fix with multi-file edits
3. Re-run `tsc --noEmit` until clean
4. One `next build` to catch ESLint + webpack/route-specific issues
5. Fix those, final build
