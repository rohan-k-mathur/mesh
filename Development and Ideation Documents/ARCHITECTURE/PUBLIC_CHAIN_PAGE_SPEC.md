# Public Argument-Chain Page — Dev Spec

**Status:** proposed (dev spec)
**Owner:** Isonomia web / public citable-surface
**Part of:** the public, machine-citable surface alongside the single-argument page.
**Goal:** give an individual `ArgumentChain` its own stable, public, server-rendered page at `app/chains/[identifier]/page.tsx`, mirroring what [app/a/[identifier]/page.tsx](../../app/a/[identifier]/page.tsx) does for a single `Argument` — reusing the existing chain view components rather than building new UI.

**Derived from:**
- [app/a/[identifier]/page.tsx](../../app/a/[identifier]/page.tsx) — the template: a `force-dynamic` server component doing content negotiation, a Prisma read, JSON-LD + citation meta tags, OG/Twitter cards, and an embed/export widget.
- [CHAIN_CREATION_OVER_MCP_SPEC.md](CHAIN_CREATION_OVER_MCP_SPEC.md) / [CHAIN_TOPOLOGY_OVER_MCP_SPEC.md](CHAIN_TOPOLOGY_OVER_MCP_SPEC.md) / [CHAIN_SEMANTICS_OVER_MCP_SPEC.md](CHAIN_SEMANTICS_OVER_MCP_SPEC.md) — the write specs that produce the structure (topology, attacks, scopes, anchored evidence) this page renders.

**Companion substrate (all already exists — this spec adds one page route + one public read path, no migration):**
- [lib/models/schema.prisma](../../lib/models/schema.prisma) — `model ArgumentChain` carries `id` (cuid), `deliberationId`, `name`, `description`, `purpose`, `chainType ArgumentChainType`, `rootNodeId`, `createdBy BigInt`, **`isPublic Boolean @default(false)`**, `isEditable`, `idempotencyKey`, `createdAt`/`updatedAt`; relations `nodes`, `edges`, `scopes`, `creator`, `deliberation`.
- [app/api/argument-chains/[chainId]/route.ts](../../app/api/argument-chains/[chainId]/route.ts) — the existing `GET` that hydrates a chain with all relations (nodes→argument→conclusion/premises/schemes, edges→source/target nodes, scopes). **Today it is cookie-auth-gated and returns `401` for anonymous callers even when `chain.isPublic === true`** — this is the gap the page must close.
- [lib/types/argumentChain.ts](../../lib/types/argumentChain.ts) — `ArgumentChainWithRelations` (the canonical hydrated shape every view component consumes), `SCOPE_TYPE_CONFIG`, `ScopeType`.
- Reusable client view components in [components/chains/](../../components/chains/):
  - `ChainProseView` — props `{ chainId, initialData?, compact?, maxHeight?, … }`. **Skips its SWR fetch when `initialData` is supplied** ([ChainProseView.tsx](../../components/chains/ChainProseView.tsx#L121): `!initialData ? "/api/argument-chains/…" : null`).
  - `ChainEssayView` — props `{ chainId, initialData?, compact?, maxHeight?, onViewThread?, onViewCanvas?, onViewProse? }`. Same `initialData` skip; the essay narrative is generated client-side by `generateEssay` from [lib/chains/essayGenerator.ts](../../lib/chains/essayGenerator.ts) (no extra server round-trip required).
  - `ArgumentChainThread` — props `{ chainId, initialData?, currentArgumentId?, showHeader?, showOrphans?, compact?, maxHeight?, … }`. Same `initialData` skip; builds a vertical thread via `chainToThread`.
  - `ChainRefusalBanner`, `EpistemicStatusBadge`, `ScopeBoundary` — supporting bits the above already pull in.
  - **`ArgumentChainCanvas` is explicitly out of scope** for the public page: it is edit-oriented (drives `useChainEditorStore`, `AddNodeButton`, `ConnectionEditor`, requires `deliberationId` + `currentUserId` + `isEditable`). The public page uses the read-only thread/prose/essay views instead.
- [lib/deliberation/chainExposure.ts](../../lib/deliberation/chainExposure.ts) — `computeChainExposure(deliberationId)` → per-chain `chainStanding` + `weakestLink`, for the "weakest link / standing" header (the same numbers the write path returns).

---

## 1. Motivation

A chain like
`https://isonomia.app/deliberations/cmp6823ov…/chains/cmpvvmxqk…`
(the June-1 peatland smoke-test result) has **no server-rendered page today**. That
URL is a *client* route inside the deliberation SPA — there is no
`app/deliberations/[id]/chains/[chainId]/page.tsx` — so:

- it is not directly shareable to anonymous readers (the SPA gates on auth / loads the whole deliberation),
- it carries no per-chain `<title>`/OG/Twitter metadata (link unfurls are generic),
- it emits no JSON-LD / citation metadata, so the chain is not machine-citable the way a single argument is, and
- there is no canonical short URL to cite a *chain* (only arguments get `app/a/[identifier]`).

Single arguments solved all of this with [app/a/[identifier]/page.tsx](../../app/a/[identifier]/page.tsx). This spec gives chains the parallel surface at **`app/chains/[identifier]/page.tsx`**, reusing the chain view components so there is no new rendering logic to maintain.

The identifier is the chain **cuid** (`ArgumentChain.id`). Unlike arguments, chains
have **no `Permalink`/shortCode** record ([permalinkService.ts](../../lib/citations/permalinkService.ts) is argument-only), so v1 resolves the identifier directly as a chain id. A short-code scheme for chains is a future option (§9), not a v1 requirement.

---

## 2. Scope

**In scope (v1):**
1. New page route `app/chains/[identifier]/page.tsx` — `force-dynamic` server component.
2. A **public read path** for a single chain so anonymous visitors can load a `isPublic` chain (close the `401` gap).
3. Server-side hydration of `ArgumentChainWithRelations`, passed as `initialData` into the existing view components (so the components never hit the auth-gated client fetch).
4. View switching between **Thread**, **Prose (Brief)**, and **Essay** — the three read-only views — defaulting to Thread, with `?view=essay|prose|thread` honored.
5. Per-chain metadata: `<title>`, description, OG/Twitter cards, canonical URL.
6. JSON-LD (`schema.org` `CreativeWork`/`Collection` describing the chain) + a machine-citable alternate, mirroring the argument page's content-negotiation contract.
7. Standing/weakest-link header from `computeChainExposure`.
8. A "not found / private" empty state mirroring the argument page's.

**Out of scope (v1, deferred to §9):**
- Editing (no `ArgumentChainCanvas`, no node/edge mutation from this page).
- A chain OG-image renderer (`/api/og/chain/[id]`) and an `/embed/chain/[id]` iframe — the argument page has analogues (`/api/og/argument/[id]`, `/embed/argument/[id]`); chains can reuse the pattern later. v1 may point OG `images` at a static fallback.
- A chain short-code / `app/c/[shortCode]` redirect.
- Citation-export formats (APA/MLA/BibTeX) for a *chain* (the argument page's `CitationExportWidget` is argument-shaped).

---

## 3. Routing & identifier resolution

- **Path:** `app/chains/[identifier]/page.tsx`. `[identifier]` = `ArgumentChain.id` (cuid).
- **Canonical URL:** `${BASE_URL}/chains/${identifier}` (where `BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://isonomia.app"`, matching the argument page).
- **Deep link compatibility:** the existing in-app chain URL `/deliberations/[id]/chains/[chainId]` keeps working (SPA route). The new public page is an *additional* canonical surface; the write path's `permalink` field MAY later be switched to `/chains/${id}` (§9), but v1 does not change existing permalinks.
- **`middleware.ts`:** add `app/chains/**` to the public (non-auth-gated) page allowlist so anonymous GETs render instead of redirecting to `/login`. Confirm the existing `PUBLIC_*` matchers don't already cover it.

---

## 4. Public read path (closing the 401 gap)

The view components fall back to `GET /api/argument-chains/[chainId]` when no
`initialData` is passed, and that route currently 401s anonymous callers. Two options;
**Option A is recommended** because the page passes `initialData` anyway, so the route
change is a thin safety-net rather than the hot path.

**Option A — relax the existing route for public chains (recommended).**
In [app/api/argument-chains/[chainId]/route.ts](../../app/api/argument-chains/[chainId]/route.ts) `GET`:
- Do **not** short-circuit to `401` before loading the chain. Resolve the user *optionally* (`getUserFromCookies()` may return null).
- After loading the chain, apply the existing visibility check: `canView = chain.isPublic || (user && isCreator)`. Anonymous + `isPublic` → allowed; anonymous + private → `404` (not `401`, to avoid leaking existence — match the page's "not found" framing); authed non-creator + private → `403` (unchanged).
- Keep `Cache-Control: no-store` for now (chains are mutable); revisit caching in §9.

**Option B — dedicated public endpoint** `GET /api/chains/[identifier]/public` returning only `isPublic` chains (404 otherwise), leaving the authed route untouched. More isolation, more surface to maintain. Use only if relaxing the shared route is deemed risky for the in-app callers.

Either way the **page itself reads via Prisma directly** (§5) and only the *client view components'* fallback fetch depends on this path — so a private chain never renders even if the route were misconfigured, because the server page returns the empty state first.

---

## 5. Server data flow (the page)

Mirror the argument page's shape:

1. `export const dynamic = "force-dynamic";`
2. `generateMetadata({ params })` — load a **thin** projection (`name`, `description`, `chainType`, `deliberation.title`, `_count.nodes`, `isPublic`) by `id`; if missing or `!isPublic` (for anonymous) → `{ title: "Chain not found — Isonomia" }`. Build `title` from `chain.name`, description from `chain.description ?? <generated summary>`, canonical `/chains/${identifier}`, OG/Twitter, and `alternates` (`canonical` + machine-citable JSON-LD/AIF link).
3. `export default async function ChainPage({ params, searchParams })`:
   - **Content negotiation** (same contract as the argument page): an explicit `?format=jsonld|aif|attestation` or an `Accept` header preferring `application/ld+json`/`application/json` (and *not* `text/html`) → `redirect` to the machine representation (`/api/chains/${identifier}/jsonld?format=…`, see §7). HTML browsers fall through.
   - **Load the full chain** with the same `include` tree the authed route uses (see [app/api/argument-chains/[chainId]/route.ts](../../app/api/argument-chains/[chainId]/route.ts#L21) and [lib/types/argumentChain.ts](../../lib/types/argumentChain.ts) `ArgumentChainWithRelations`). Extract the `include` into a shared const (e.g. `CHAIN_PAGE_INCLUDE` in `lib/chains/chainInclude.ts`) so the page, the authed route, and the JSON-LD route agree on one shape.
   - **Visibility:** resolve the optional viewer; if `!chain || (!chain.isPublic && !isCreator)` → render the **not-found/private empty state** (same visual as the argument page's "Argument not found", swapped copy: "This chain is private or doesn't exist").
   - **BigInt serialization:** `createdBy` and `creator.id` are `BigInt` — serialize to strings before handing to client components (the authed route already does this; reuse that serializer or extract it to `lib/chains/serializeChain.ts`).
   - **Standing:** `const exposure = await computeChainExposure(chain.deliberationId); const standing = exposure.chains.find(c => c.chainId === chain.id);` → `standing?.chainStanding`, `standing?.weakestLink`. Wrap in `try/catch` so an exposure failure degrades to "standing unavailable" rather than 500ing the page.

The hydrated, BigInt-serialized chain is the `initialData` for every view component.

---

## 6. Rendering (reuse, don't rebuild)

A small **client** wrapper `components/chains/PublicChainView.tsx` (`"use client"`) takes
`{ chain: ArgumentChainWithRelations, standing, weakestLink, initialView }` and renders:

- **Header band:** chain `name`, `chainType` badge (SERIAL/CONVERGENT/DIVERGENT/TREE/GRAPH), node count, creator name/avatar, deliberation title (link), and the standing + weakest-link summary. Reuse `EpistemicStatusBadge` where a node is scoped.
- **View switcher** (Thread / Prose / Essay) — a simple tab strip driven by local state seeded from `initialView` (the `?view=` param). On switch, shallow-update the URL query (`history.replaceState` / `router.replace`) so a chosen view is shareable. No data refetch — all three views receive the same `initialData={chain}`.
- **Body:** the selected view, each passed `chainId={chain.id}` **and** `initialData={chain}`:
  - Thread → `<ArgumentChainThread chainId initialData showHeader={false} compact={false} />` (header already rendered above; pass read-only — omit the edit callbacks).
  - Prose → `<ChainProseView chainId initialData />`.
  - Essay → `<ChainEssayView chainId initialData />` (essay text generated client-side via `generateEssay`).
- `ChainRefusalBanner` renders inside the prose/essay views already; nothing extra needed.

Because every view receives `initialData`, **none of them issue the auth-gated client fetch** — the public page works for anonymous readers purely off the server-hydrated payload. The §4 route relaxation is the belt-and-suspenders fallback (e.g. a future client refresh button).

---

## 7. Machine-citable representation (JSON-LD)

Mirror `/api/a/[identifier]/aif` with `/api/chains/[identifier]/jsonld`:
- `?format=jsonld` → `schema.org` JSON-LD: a `CreativeWork`/`Collection` for the chain (`name`, `url`, `dateCreated`, `author`, `hasPart`: one node per argument with its conclusion text, plus `about` the deliberation). Build it from `ArgumentChainWithRelations`.
- `?format=aif` (optional, defer if costly) → an AIF subgraph for the chain (compose per-node argument AIF the way the argument AIF route does). May be deferred to §9.
- The page emits a `<script type="application/ld+json">` inline (same as the argument page) plus `<link rel="alternate" type="application/ld+json" href=…/jsonld?format=jsonld>`.
- Visibility: the JSON-LD route returns only `isPublic` chains (404 otherwise) — never expose a private chain's structure to machine consumers.

---

## 8. Tests

- **Page (RSC) test** — `__tests__/app/chains-page.test.tsx` (or an integration test mirroring any existing `app/a` page test): public chain → renders header + default Thread view + JSON-LD script; private chain (anonymous) → renders empty state, no JSON-LD; `?view=essay` → essay view mounts; `?format=jsonld` → redirects.
- **Route test** — extend `__tests__` for `GET /api/argument-chains/[chainId]`: anonymous + public → 200 with serialized chain (no BigInt leakage); anonymous + private → 404; authed creator + private → 200; authed non-creator + private → 403. (Guard the §4 relaxation against regressing the in-app authed callers.)
- **Serializer unit test** — `serializeChain` turns every `BigInt` (`createdBy`, `creator.id`, any nested) into a string and is a no-op-safe on already-serialized input.
- **JSON-LD route test** — public chain → valid `schema.org` graph with one `hasPart` per node; private → 404.
- Reuse the existing chain-suite discipline (`cd` repo root, `npx jest`, `npx eslint` changed files, `get_errors`).

---

## 9. Phasing & open questions

**Phase 1 (this spec, v1):** page route + §4 Option A relaxation + shared `CHAIN_PAGE_INCLUDE`/`serializeChain` + `PublicChainView` wrapper (Thread/Prose/Essay) + metadata + inline JSON-LD + standing header + empty state + `middleware.ts` allowlist.

**Phase 2 (deferred):**
- `/api/og/chain/[id]` OG-image + `/embed/chain/[id]` iframe (parallel to the argument equivalents).
- AIF subgraph (`?format=aif`) for chains.
- A chain short-code (`Permalink`-style) and `app/c/[shortCode]` redirect; then switch the write path's `permalink` from `/deliberations/…/chains/…` to the canonical `/chains/…`.
- Caching: chains are mutable, so v1 is `no-store`. A revalidate-on-write (tag-based) strategy could make public chain pages cacheable.

**Open questions:**
- **CHAIN-PAGE-Q-A (identifier):** cuid-only (v1) vs introduce a chain short-code now? Lean: cuid v1, short-code Phase 2.
- **CHAIN-PAGE-Q-B (default view):** Thread vs Essay as the default landing view. Lean: **Thread** (closest to the actual structure; Essay is interpretive prose). `?view=` overrides either way.
- **CHAIN-PAGE-Q-C (private 404 vs 403 for anonymous):** return **404** for anonymous-on-private to avoid leaking that a private chain exists; reserve `403` for authed-but-unauthorized. Confirm this matches the argument page's privacy posture.
- **CHAIN-PAGE-Q-D (standing on a public page):** show the raw `chainStanding` (often `untested-default` until the chain draws challengers) or soften the copy so a low score doesn't read as "weak argument"? Lean: show it with a one-line "provisional until challenged" note (the smoke-test write path already frames it this way).

---

## 10. Where this fits

```
Argument (single)                         Chain (multi-node)
─────────────────                         ──────────────────
app/a/[identifier]/page.tsx        ⇄      app/chains/[identifier]/page.tsx   ← THIS SPEC
/api/a/[id]/aif (jsonld/aif)       ⇄      /api/chains/[id]/jsonld
/api/og/argument/[id]              ⇄      /api/og/chain/[id]        (Phase 2)
/embed/argument/[id]               ⇄      /embed/chain/[id]         (Phase 2)
Permalink shortCode (app/a)        ⇄      chain short-code          (Phase 2)

reuses → components/chains/{ArgumentChainThread, ChainProseView, ChainEssayView}
         lib/types/argumentChain.ts (ArgumentChainWithRelations)
         lib/deliberation/chainExposure.ts (chainStanding, weakestLink)
```
