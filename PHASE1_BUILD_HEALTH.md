# Phase 1: Build Health — Strategy & Roadmap

> **Goal:** Flip `ignoreBuildErrors: false`, achieve a clean `next build`, resolve all lint errors, and establish CI guardrails so the codebase stays healthy going forward.
>
> **Timeline:** Weeks 3–4 (post-archive)
> **Prerequisite:** Archive Waves 1–5 complete ✅

---

## Table of Contents

1. [Current State Assessment](#1-current-state-assessment)
2. [Strategy Overview](#2-strategy-overview)
3. [Step 0 — Pre-Flight Checks](#3-step-0--pre-flight-checks)
4. [Step 1 — Fix TypeScript Errors (tsc --noEmit)](#4-step-1--fix-typescript-errors)
5. [Step 2 — Fix Critical Lint Errors](#5-step-2--fix-critical-lint-errors)
6. [Step 3 — Fix Mechanical Lint Errors (Bulk)](#6-step-3--fix-mechanical-lint-errors-bulk)
7. [Step 4 — Address Lint Warnings (Selective)](#7-step-4--address-lint-warnings-selective)
8. [Step 5 — Flip the Switch](#8-step-5--flip-the-switch)
9. [Step 6 — CI Guardrails](#9-step-6--ci-guardrails)
10. [Step 7 — Validation & Smoke Testing](#10-step-7--validation--smoke-testing)
11. [Error Inventory](#11-error-inventory)
12. [Execution Checklist](#12-execution-checklist)

---

## 1. Current State Assessment

### Baseline Numbers (post-archive, 2026-03-24)

| Metric | Count | Severity |
|---|---|---|
| **TypeScript errors (`tsc --noEmit`)** | **2** | Trivial — both in `tools/verifier-cli/index.ts` (shebang parsing) |
| **Lint errors (`next lint`)** | **182** | Mostly mechanical (see breakdown) |
| **Lint warnings (`next lint`)** | **140** | Low priority |
| **Files with lint errors** | **40** | Across components, app pages, lib |
| **Files with lint warnings** | **84** | Spread across the codebase |

### Project Scale

| Metric | Count |
|---|---|
| App router files (pages, routes, layouts) | ~901 |
| Component files | ~928 |
| Lib files | ~455 |
| Total TypeScript surface | ~2,300+ files |

### Lint Error Breakdown

| Error Type | Count | Category | Fix Strategy |
|---|---|---|---|
| `react/no-unescaped-entities` (`"`) | 116 | Mechanical | Bulk find-and-replace |
| `react/no-unescaped-entities` (`'`) | 42 | Mechanical | Bulk find-and-replace |
| `react-hooks/rules-of-hooks` | 8 | **Critical** | Manual refactor per-file |
| `react/jsx-no-undef` | 12 | **Critical** | Missing imports or dead references |
| `react/jsx-key` | 1 | Minor | Add `key` prop |
| `react/display-name` | 1 | Minor | Add `displayName` |

### Lint Warning Breakdown (Top Categories)

| Warning Type | Count | Priority |
|---|---|---|
| `@next/next/no-img-element` | 27 | Low — cosmetic, no build impact |
| `react-hooks/exhaustive-deps` | ~50+ | Medium — correctness risk but non-blocking |
| `import/no-anonymous-default-export` | 6 | Low — style only |

**Key Insight:** The archive work paid off enormously. The TypeScript compiler is essentially clean (2 errors in a non-app tool file). The real work is ~20 meaningful lint fixes and ~158 mechanical entity-escaping fixes.

---

## 2. Strategy Overview

### Guiding Principles

1. **Fix in dependency order** — TypeScript errors first, then lint errors, then flip the switch
2. **Critical before cosmetic** — hooks violations and missing references break at runtime; unescaped entities are cosmetic
3. **Automate what's automatable** — 158/182 lint errors can be bulk-fixed with codemod/regex
4. **Don't over-fix warnings** — suppress or defer lint warnings that don't affect correctness. Ship week, not style week.
5. **Gate the repo** — once clean, add CI checks so errors never accumulate again

### Phase Sequencing

```
Step 0: Pre-flight checks (ensure workspace builds, prisma is generated)     ~30 min
Step 1: Fix 2 TypeScript errors                                               ~15 min
Step 2: Fix 20 critical lint errors (hooks, missing refs)                     ~3-4 hrs
Step 3: Fix 158 mechanical lint errors (unescaped entities)                   ~1-2 hrs
Step 4: Triage lint warnings (fix ~10 critical, suppress rest)                ~2-3 hrs
Step 5: Flip ignoreBuildErrors: false, verify next build                      ~30 min
Step 6: Add CI guardrails (GitHub Actions type-check + lint)                  ~1-2 hrs
Step 7: Full validation — build, lint, test, smoke                            ~2-3 hrs
                                                                        ─────────────
                                                              Total est:  ~1.5-2 days
```

---

## 3. Step 0 — Pre-Flight Checks

Before touching any code, verify the post-archive codebase is in a stable state.

### Checklist

```bash
# 1. Ensure dependencies are installed and workspace is built
yarn install
npm run -w @app/sheaf-acl build

# 2. Generate Prisma client (postinstall should have done this)
npx prisma generate
npx prisma validate

# 3. Baseline type-check
npx tsc --noEmit 2>&1 | grep -c "error TS"
# Expected: 2 (tools/verifier-cli only)

# 4. Baseline lint
npx next lint 2>&1 | grep -c "Error:"
# Expected: 182

# 5. Verify dev server starts
npm run dev
# Ctrl+C after confirming it compiles
```

If anything fails here, fix it before proceeding. Common issues:
- **`@app/sheaf-acl` not built** → run `npm run acl:build`
- **Prisma client mismatch** → `npx prisma generate`
- **Missing `.env` values** → check `DATABASE_URL`, `DIRECT_URL` are set

---

## 4. Step 1 — Fix TypeScript Errors

### Current Errors (2 total)

Both errors are in `tools/verifier-cli/index.ts`:

```
tools/verifier-cli/index.ts(2,1): error TS18026: '#!' can only be used at the start of a file.
tools/verifier-cli/index.ts(2,16): error TS1005: ';' expected.
```

**Root Cause:** The file has a comment `// tools/verifier-cli/index.ts` on line 1, then a shebang `#!/usr/bin/env node` on line 2. TypeScript requires shebangs on line 1.

**Fix Options (choose one):**

#### Option A — Fix the file (recommended)
Move the shebang to line 1, remove or move the comment:

```typescript
#!/usr/bin/env node
// tools/verifier-cli/index.ts
import fs from 'node:fs';
```

#### Option B — Exclude from tsconfig
If `tools/` shouldn't be type-checked with the main project, add it to `tsconfig.json` excludes:

```json
"exclude": ["node_modules", "tools/**"]
```

#### Option C — Give tools/ its own tsconfig
Create `tools/verifier-cli/tsconfig.json` so it's independently compiled. Then exclude from root.

**Recommendation:** Option A is simplest and keeps tracking. If `tools/` grows, add Option C later.

### Verify

```bash
npx tsc --noEmit 2>&1 | grep -c "error TS"
# Expected: 0
```

---

## 5. Step 2 — Fix Critical Lint Errors

These are the **20 non-mechanical lint errors** that represent actual code issues. Fix them manually, file by file.

### 2a. `react-hooks/rules-of-hooks` — 8 errors across 4 files

These are real bugs or code-smell. Hooks called conditionally or inside callbacks will fail at runtime.

| File | Error | Fix Strategy |
|---|---|---|
| `components/chains/ThreadNode.tsx` (L66-68) | `useReducedMotion`, `useState`, `useMemo` called after early return | Move hooks above the early return; restructure conditional logic |
| `components/chat/ChatRoom.tsx` (L169, L11-12) | `React.useState` called conditionally | Move all `useState` calls to top of component; use conditional values instead of conditional hooks |
| `components/chat/MessageListVirtual.tsx` (L11-12) | `React.useState` called conditionally | Same pattern — hoist hooks above conditionals |
| `components/ludics/arena/PositionExplorer.tsx` (L201) | `useCircularLayout` called inside callback | Extract to component-level; pass result into callback |
| `components/views/SequentBadge.tsx` (L21) | `useSequentStatus` called conditionally | Hoist above early return |

**Pattern for fixing conditional hooks:**

```tsx
// BEFORE (broken)
function MyComponent({ data }) {
  if (!data) return null;
  const [state, setState] = useState(false); // ❌ conditional
  // ...
}

// AFTER (fixed)
function MyComponent({ data }) {
  const [state, setState] = useState(false); // ✅ always called
  if (!data) return null;
  // ...
}
```

### 2b. `react/jsx-no-undef` — 12 errors across 2 files

Components referenced in JSX but never imported. These indicate either:
1. **Missing imports** — component exists but import was forgotten/removed
2. **Dead references** — component was deleted in the archive but JSX reference remains

| Undefined Component | File | Action |
|---|---|---|
| `SectionCard` | `components/deepdive/v3/sections/NetworksSection.tsx` | Check if component exists; add import or replace |
| `ChipBar` | likely `components/ludics/ViewInspector.tsx` or similar | Check if component exists; add import or replace |
| `Segmented` (x2) | likely `components/ludics/ViewInspector.tsx` | Check if component exists; add import or replace |
| `TraceRibbon` | likely `components/ludics/ViewInspector.tsx` | Check if component exists; add import or replace |
| `CommitmentDelta` | likely `components/ludics/ViewInspector.tsx` | Check if component exists; add import or replace |
| `LociTreeWithControls` | likely `components/ludics/ViewInspector.tsx` | Check if component exists; add import or replace |
| `NLCommitPopover` | likely `components/ludics/ViewInspector.tsx` | Check if component exists; add import or replace |
| `SkeletonCard` (x2) | likely `components/ludics/ViewInspector.tsx` | Check if component exists; add import or replace |
| `LociTree` | likely `components/ludics/ViewInspector.tsx` | Check if component exists; add import or replace |
| `CommitmentsPanel` (x2) | likely `components/ludics/ViewInspector.tsx` | Check if component exists; add import or replace |
| `JudgeConsole` | likely `components/ludics/ViewInspector.tsx` | Check if component exists; add import or replace |

**Investigation workflow for each:**

```bash
# 1. Find where the component is defined
grep -rn "export.*function SectionCard\|export.*const SectionCard\|export default.*SectionCard" components/ lib/ app/

# 2. If found → add the import
# 3. If not found → the component was likely archived or never created
#    → Replace with a placeholder, stub, or remove the JSX block
```

### 2c. Other Critical Errors — 2 errors

| Error | File | Fix |
|---|---|---|
| `react/jsx-key` — missing key in iterator | 1 file | Add `key` prop to mapped element |
| `react/display-name` — missing display name | 1 file | Add `displayName` to component or convert to named function |

### Verify after Step 2

```bash
npx next lint 2>&1 | grep -E "rules-of-hooks|jsx-no-undef|jsx-key|display-name" | wc -l
# Expected: 0
```

---

## 6. Step 3 — Fix Mechanical Lint Errors (Bulk)

### 158 `react/no-unescaped-entities` errors

These are **all cosmetic**: literal `"` and `'` characters in JSX text content that React's JSX parser flags.

**Distribution:**
- 116 errors: unescaped `"` (double quote)
- 42 errors: unescaped `'` (apostrophe/single quote)

### Fix Strategy: Targeted Regex + Codemod

**Important:** Do NOT blindly replace all `"` and `'` in JSX files — that would break string props and imports. These need context-aware fixing.

#### Approach 1 — ESLint Auto-Fix (Recommended)

Unfortunately `react/no-unescaped-entities` does not have an auto-fixer. Use approach 2 or 3.

#### Approach 2 — Targeted Manual Batch Fix

Process all 40 files with errors. In each file, find JSX text content and replace:
- `"` → `&quot;` (or wrap text in `{" "}` expressions)
- `'` → `&apos;` (or use `'`)

**Pro tip:** Most of these will be in prose text — component descriptions, labels, help text, error messages rendered in JSX. A good pattern:

```tsx
// BEFORE
<p>Don't forget to check the "settings" page</p>

// AFTER (cleanest)
<p>Don&apos;t forget to check the &quot;settings&quot; page</p>

// AFTER (alternative — wrap in expression)
<p>{"Don't forget to check the \"settings\" page"}</p>
```

#### Approach 3 — Suppress the Rule (Fastest, Acceptable)

If shipping speed is priority, suppress the rule in `.eslintrc.json`:

```json
{
  "extends": "next/core-web-vitals",
  "rules": {
    "react/no-unescaped-entities": "warn"
  }
}
```

This downgrades from error to warning. The entities still render correctly in modern React — this rule prevents issues primarily in older JSX transforms. **This is a legitimate choice for a production launch** and can be revisited later.

**Recommendation:** Use **Approach 3** (downgrade to warning) for initial launch velocity, then clean up over time. This instantly resolves 158 of 182 errors and lets you focus on the real issues.

### Verify after Step 3

```bash
npx next lint 2>&1 | grep -c "Error:"
# Expected: 0 (if approached 3) or 24 → 0 (if approach 2)
```

---

## 7. Step 4 — Address Lint Warnings (Selective)

### Triage: Fix vs Suppress vs Defer

| Warning Category | Count | Risk | Action |
|---|---|---|---|
| **`react-hooks/exhaustive-deps`** | ~50+ | **Medium** — can cause stale closures | Fix the ~6 complex-expression ones; suppress-line for intentional omissions |
| **`@next/next/no-img-element`** | 27 | **Low** — `<img>` works fine, perf optimization only | Defer — convert to `<Image>` opportunistically |
| **`import/no-anonymous-default-export`** | 6 | **None** — pure style | Defer or quick-fix (assign to variable) |

### Prioritized Warning Fixes

#### High Priority — Fix These

1. **Complex expression in dependency array** (6 occurrences)
   These cause the deps to be recalculated every render, defeating memoization:
   ```tsx
   // Find them with:
   npx next lint 2>&1 | grep "complex expression in the dependency array"
   ```
   Fix by extracting the expression to a variable:
   ```tsx
   // BEFORE
   useEffect(() => { ... }, [obj.nested?.value?.id]);
   
   // AFTER
   const depId = obj.nested?.value?.id;
   useEffect(() => { ... }, [depId]);
   ```

2. **Missing dependencies that are refs** (if `textareaRef` etc.)
   Usually safe to add to the array or suppress with `// eslint-disable-next-line`:
   ```tsx
   // eslint-disable-next-line react-hooks/exhaustive-deps
   useEffect(() => { ... }, []);
   ```

#### Low Priority — Defer These

- `@next/next/no-img-element` — Convert `<img>` to `<Image>` as part of Phase 4 (bundle/perf), not now
- `import/no-anonymous-default-export` — Style-only, no runtime impact
- Remaining `exhaustive-deps` with intentional omissions — suppress per-line where needed

### Verify after Step 4

```bash
npx next lint 2>&1 | grep -c "Error:"
# Expected: 0

npx next lint 2>&1 | grep -c "Warning:"
# Target: <100 (down from 140)
```

---

## 8. Step 5 — Flip the Switch

### The Moment of Truth

Once Steps 1–4 are complete and lint/type-check are clean:

#### 5a. Flip `ignoreBuildErrors`

In `next.config.mjs`, change:

```javascript
// BEFORE
typescript: {
  ignoreBuildErrors: true,
},

// AFTER
typescript: {
  ignoreBuildErrors: false,
},
```

#### 5b. Run the Build

```bash
npm run build
```

**Expected outcome:** The build should succeed. The Next.js build runs TypeScript checking during compilation, which is stricter than `tsc --noEmit` alone because it also validates:
- Server Component vs Client Component boundaries
- `"use client"` / `"use server"` directive correctness
- Route segment config exports
- Metadata types

#### 5c. If New Errors Appear

The `next build` type-checker may surface errors that `tsc --noEmit` didn't because Next.js generates additional types at build time (`.next/types/**/*.ts`). Common ones:

| Error Pattern | Fix |
|---|---|
| `Type 'X' is not assignable to type 'PageProps'` | Update page component props to match Next.js generated types |
| `'params' should be awaited` (Next 14.x) | Wrap params access in the page component pattern |
| Missing `generateStaticParams` return type | Add explicit return type |
| Metadata export type mismatch | Import `Metadata` from `next` and type the export |

**If many errors appear:** Don't panic. Capture them, categorize, and batch-fix by error code:

```bash
npm run build 2>&1 | grep "error TS" | sed 's/.*error //' | sort | uniq -c | sort -rn
```

#### 5d. Consider Also Adding ESLint to Build

Optionally, stop the build on lint errors too (skip this for initial launch if lint is noisy):

```javascript
// In next.config.mjs (optional, can add later)
eslint: {
  ignoreDuringBuilds: false, // This is already the default
},
```

---

## 9. Step 6 — CI Guardrails

Once the build is clean, add GitHub Actions checks to prevent regression.

### 6a. Type-Check CI Job

Create or update `.github/workflows/typecheck.yml`:

```yaml
name: Type Check

on:
  pull_request:
    branches: [main, production/discourse-core]
  push:
    branches: [main]

jobs:
  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: yarn
      - run: yarn install --frozen-lockfile
      - run: npm run -w @app/sheaf-acl build
      - run: npx prisma generate
      - run: npx tsc --noEmit
```

### 6b. Lint CI Job

```yaml
name: Lint

on:
  pull_request:
    branches: [main, production/discourse-core]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: yarn
      - run: yarn install --frozen-lockfile
      - run: npm run -w @app/sheaf-acl build
      - run: npx prisma generate
      - run: npm run lint
```

### 6c. Build CI Job

```yaml
name: Build

on:
  pull_request:
    branches: [main, production/discourse-core]

jobs:
  build:
    runs-on: ubuntu-latest
    env:
      # Minimal env vars needed for build (no runtime secrets)
      DATABASE_URL: "postgresql://fake:fake@localhost:5432/fake"
      DIRECT_URL: "postgresql://fake:fake@localhost:5432/fake"
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: yarn
      - run: yarn install --frozen-lockfile
      - run: npm run -w @app/sheaf-acl build
      - run: npx prisma generate
      - run: npm run build
```

### 6d. Optional — Pre-commit Hook

For quicker feedback, add a pre-commit hook via `husky` + `lint-staged`:

```bash
yarn add -D husky lint-staged
npx husky init
```

`.husky/pre-commit`:
```bash
npx lint-staged
```

`package.json`:
```json
"lint-staged": {
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"]
}
```

**Note:** Only add pre-commit hooks if the team finds them helpful. CI is the hard gate; local hooks are convenience.

---

## 10. Step 7 — Validation & Smoke Testing

### Full Validation Sequence

```bash
# 1. Type check — must be 0 errors
npx tsc --noEmit

# 2. Lint — must be 0 errors (warnings acceptable)
npm run lint

# 3. Production build — must succeed
npm run build

# 4. Start and verify
npm run start
# Check: does the app load at localhost:3000?
# Check: can you navigate to key pages?

# 5. Unit tests
npm run test
npm run vitest

# 6. Dev mode check
npm run dev
# Verify hot reload works, no console errors
```

### Smoke Test Checklist

| Area | Test | Pass? |
|---|---|---|
| **Auth** | Login/register flow works | |
| **Feed** | Home feed loads, posts render | |
| **Articles** | Article editor opens, saves | |
| **Discussions** | Discussion thread renders | |
| **Chat** | Chat room connects, messages send | |
| **Arguments** | Argument chain loads, nodes render | |
| **Settings** | Settings pages load | |
| **API** | Hit 2-3 API routes, verify 200 responses | |

---

## 11. Error Inventory

### Files Requiring Manual Fixes (Step 2)

#### Hooks Violations (8 errors, 5 files)

| # | File | Line(s) | Error | Priority |
|---|---|---|---|---|
| 1 | `components/chains/ThreadNode.tsx` | 66-68 | 3 hooks after early return | High |
| 2 | `components/chat/ChatRoom.tsx` | 169 | useState conditional | High |
| 3 | `components/chat/MessageListVirtual.tsx` | 11-12 | 2x useState conditional | High |
| 4 | `components/ludics/arena/PositionExplorer.tsx` | 201 | hook in callback | High |
| 5 | `components/views/SequentBadge.tsx` | 21 | hook after early return | High |

#### Missing References (12 errors, ~2 files)

| # | Component | Likely File | Priority |
|---|---|---|---|
| 1 | `SectionCard` | `components/deepdive/v3/sections/NetworksSection.tsx` | High |
| 2 | `ChipBar` | ludics ViewInspector area | High |
| 3 | `Segmented` (x2) | ludics ViewInspector area | High |
| 4 | `TraceRibbon` | ludics ViewInspector area | High |
| 5 | `CommitmentDelta` | ludics ViewInspector area | High |
| 6 | `LociTreeWithControls` | ludics ViewInspector area | High |
| 7 | `NLCommitPopover` | ludics ViewInspector area | High |
| 8 | `SkeletonCard` (x2) | ludics ViewInspector area | High |
| 9 | `LociTree` | ludics ViewInspector area | High |
| 10 | `CommitmentsPanel` (x2) | ludics ViewInspector area | High |
| 11 | `JudgeConsole` | ludics ViewInspector area | High |

#### Other (2 errors)

| # | File | Error | Priority |
|---|---|---|---|
| 1 | (TBD) | Missing `key` prop | Low |
| 2 | (TBD) | Missing `displayName` | Low |

### Files Requiring Bulk Fixes (Step 3)

158 `react/no-unescaped-entities` errors across ~35 files — resolvable by ESLint rule downgrade or batch escaping.

### TypeScript Errors (Step 1)

| # | File | Error Code | Fix |
|---|---|---|---|
| 1 | `tools/verifier-cli/index.ts:2` | TS18026 | Move shebang to line 1 |
| 2 | `tools/verifier-cli/index.ts:2` | TS1005 | Same fix (cascading error) |

---

## 12. Execution Checklist

### Day 1 — Fix All Errors

- [ ] **Step 0:** Pre-flight checks pass (deps, prisma, baseline counts)
- [ ] **Step 1:** Fix `tools/verifier-cli/index.ts` shebang → `tsc --noEmit` shows 0 errors
- [ ] **Step 2a:** Fix all 8 `react-hooks/rules-of-hooks` violations (5 files)
- [ ] **Step 2b:** Resolve all 12 `react/jsx-no-undef` references (add imports or remove dead JSX)
- [ ] **Step 2c:** Fix `jsx-key` and `display-name` errors (2 files)
- [ ] **Step 3:** Downgrade `react/no-unescaped-entities` to warning in `.eslintrc.json` (or bulk-fix)
- [ ] **Checkpoint:** `npx tsc --noEmit` → 0 errors, `npx next lint` → 0 errors
- [ ] Commit: `"fix: resolve all type errors and lint errors for build health"`

### Day 2 — Flip Switch, CI, Validate

- [ ] **Step 4:** Fix ~6 high-priority lint warnings (complex deps expressions)
- [ ] **Step 5a:** Change `ignoreBuildErrors: true` → `false` in `next.config.mjs`
- [ ] **Step 5b:** Run `npm run build` — must succeed
- [ ] **Step 5c:** If new build-time errors appear, fix them (see troubleshooting in Step 5)
- [ ] Commit: `"feat: enable TypeScript build checking (ignoreBuildErrors: false)"`
- [ ] **Step 6:** Add CI workflows (typecheck, lint, build)
- [ ] Commit: `"ci: add type-check, lint, and build CI gates"`
- [ ] **Step 7:** Full validation (build, start, test, smoke test)
- [ ] Final commit: `"chore: Phase 1 build health complete"`

### Post-Phase 1

- [ ] Merge `production/discourse-core` changes
- [ ] Verify CI passes on the merge commit
- [ ] Ready for Phase 2 (Vercel deployment config)

---

## Appendix A: Risk Mitigation

### What If `next build` Surfaces Many New Errors?

The `next build` type-checker can find errors `tsc --noEmit` misses — primarily around Next.js-specific types (page props, metadata, route handlers). If this happens:

1. **Capture all errors:** `npm run build 2>&1 | tee build-errors.log`
2. **Categorize by error code:** `grep "error TS" build-errors.log | sed 's/.*error //' | sort | uniq -c | sort -rn`
3. **Batch-fix by category** — most Next.js type errors cluster around a few patterns
4. **If >50 new errors:** consider phasing — fix the critical ones, keep `ignoreBuildErrors: true` for one more iteration, then flip

### What About Prisma Client Sync Issues?

Sometimes VS Code / TypeScript report Prisma model errors that don't actually exist:

- Run `npx prisma generate` to regenerate the client
- Restart the TS server in VS Code: `Cmd+Shift+P` → "TypeScript: Restart TS Server"
- If errors persist in the editor but `tsc --noEmit` passes, it's a caching issue — safe to proceed

### What About `@app/sheaf-acl` Build Failures?

The ACL package must build before the main project can type-check:

```bash
npm run -w @app/sheaf-acl build
# or
npm run acl:build
```

If it fails, check `packages/sheaf-acl/tsconfig.json` and fix errors there first.

---

## Appendix B: Future Improvements (Not In Scope for Phase 1)

These are noted for later phases but should NOT be done during Phase 1:

- **Stricter ESLint rules** (e.g., `@typescript-eslint/strict`) — Phase 4 or later
- **Convert `<img>` to `<Image>`** — Phase 4 (bundle/perf)
- **Prettier integration** — nice-to-have, not blocking
- **`noUncheckedIndexedAccess`** in tsconfig — too invasive for now
- **`exactOptionalPropertyTypes`** — defer until codebase is more stable

---

*Created: March 24, 2026*
*Phase: 1 of 5 (Build Health)*
*Estimated effort: 1.5–2 days*
*Dependencies: Archive Waves 1–5 complete*
