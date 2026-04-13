# Embeddable Argument Widget — Development Roadmap

**Date**: April 2026  
**Status**: Implementation Planning  
**Derived From**: [EMBEDDABLE_ARGUMENT_WIDGET_BRAINSTORM.md](./EMBEDDABLE_ARGUMENT_WIDGET_BRAINSTORM.md)  
**Guiding Principle**: Every phase must produce a working, testable artifact. No phase depends on a future phase to deliver value.

---

## Strategic Context

The deliverable is a portable citation-evidence-argument object that can be pasted into any comment section or forum and render as a structured, verifiable argument card. The implementation is organized into five phases, each building on the last but independently shippable. The first two phases are the only ones that matter until the funnel is proven.

**The funnel:**
1. **The OG image is the beer** — it has to look better than everything else in the comment thread
2. **The permalink page is the invitation** — zero-friction, no-auth, full argument with visible depth
3. **The Quick Argument Builder arms your users** — turns them into distribution vectors
4. **The response loop is the hook** — converts readers into creators

---

## Phase Overview

| Phase | Name | Core Deliverable | Funnel Role |
|-------|------|-----------------|-------------|
| **1** | Foundation — Rich Previews & Embed Infrastructure | OG images + argument/claim embed pages + extended oEmbed | The beer + the invitation |
| **2** | Creation — Quick Argument Builder & Share Flow | Lightweight creation UI + Share modal + Markdown/text export | Arming users |
| **3** | Distribution — Browser Extension | Chrome extension for create-from-anywhere + inline preview enhancement | Expanding reach |
| **4** | Engagement — Response Loop & Analytics | "Respond to this" flow + embed tracking + notification pipeline | The hook |
| **5** | Ecosystem — Integrations & Public API | Web Components, Slack app, Discord bot, WordPress plugin, public API | Scaling what works |

---

## Phase 1: Foundation — Rich Previews & Embed Infrastructure

**Goal**: Make any existing Isonomia argument or claim instantly shareable as a rich, visually compelling link preview on Reddit, Twitter, Discord, LinkedIn, Slack, and any OG-supporting platform. Simultaneously ship the iframe embed pages and extend the oEmbed endpoint.

**Success criteria**: A user can copy an argument's permalink, paste it in a Reddit comment, and see a well-designed card with the claim text, evidence count, confidence score, and Isonomia branding unfurl automatically.

### Step 1.1: Dynamic OG Image Generation for Arguments

**What**: A Next.js route that renders argument data into a 1200×630 PNG image using `next/og` (Satori, already bundled with Next.js — no new dependency).

**Files to create**:
```
app/api/og/argument/[identifier]/route.tsx    — OG image generator
```

**Implementation details**:

1. Create `app/api/og/argument/[identifier]/route.tsx`:
   - Export a GET handler using `ImageResponse` from `next/og`
   - Accept `identifier` as shortCode, slug, or argumentId
   - Resolve argument via `resolvePermalink()` (from `lib/citations/permalinkService.ts`) or direct Prisma query
   - Prisma query fetches: `text`, `confidence`, `author.displayName`, `conclusionClaim.text`, `premises` (count), `deliberation.title`, `argumentSchemes` (first scheme name), `citationMetrics.totalCitations`, `ClaimEvidence` (on conclusion claim)
   - Render JSX layout (Satori-compatible subset of CSS):
     - Top bar: Isonomia logo (inline SVG) + "ARGUMENT" badge
     - Center: Claim text (max 150 chars, truncated with ellipsis). Use `conclusionClaim.text` if available, fallback to `argument.text`
     - Bottom left: Evidence count ("3 sources cited"), confidence bar (colored segments), scheme name
     - Bottom right: Author name, permalink slug
   - Return `new ImageResponse(jsx, { width: 1200, height: 630 })`
   - Set `Cache-Control: public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800`
   - Handle not-found: return a generic "Argument not found" image (not a 404 — crawlers need a valid image response)

2. Design the OG image layout using "Option A: Card layout" from the brainstorm:
   ```
   ┌────────────────────────────────────────────────────────┐
   │ [Isonomia logo]                           ARGUMENT CARD    │
   │                                                        │
   │ ┌────────────────────────────────────────────────────┐ │
   │ │  "Remote work increases productivity               │ │
   │ │   for knowledge workers"                           │ │
   │ └────────────────────────────────────────────────────┘ │
   │                                                        │
   │  📚 3 sources cited         ▓▓▓▓░ 82% confidence       │
   │  Scheme: Argument from Expert Opinion                  │
   │                                                        │
   │  Isonomia.app/a/Bx7kQ2mN                    by @janedoe   │
   └────────────────────────────────────────────────────────┘
   ```

3. Font loading: Use Inter or the project's primary sans-serif. Satori requires explicit font file loading — fetch the font binary in the route handler and pass to `ImageResponse` options.

**Testing**:
- Manual: Visit `/api/og/argument/{shortCode}` in browser — should render PNG
- Verify image dimensions are exactly 1200×630
- Test with missing argument (should return fallback image)
- Test with very long claim text (should truncate)
- Test with arguments that have no confidence score, no scheme, no evidence (all optional fields)
- Validate with [Twitter Card Validator](https://cards-dev.twitter.com/validator), [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/), LinkedIn Post Inspector

**Dependencies**: None — uses existing `next/og`, existing Prisma models, existing permalink service.

---

### Step 1.2: Dynamic OG Image Generation for Claims

**What**: Same pattern as 1.1 but for claims.

**Files to create**:
```
app/api/og/claim/[identifier]/route.tsx    — Claim OG image generator
```

**Implementation details**:

1. Create `app/api/og/claim/[identifier]/route.tsx`:
   - Accept `identifier` as `claimId` or `moid`
   - Prisma query: `text`, `moid`, `createdBy.displayName`, `ClaimEvidence[]` (count + titles), `edgesFrom`/`edgesTo` (support/attack counts), `deliberation.title`
   - Layout: Similar to argument but simpler:
     - Top: Isonomia logo + "CLAIM" badge
     - Center: Claim text
     - Bottom: Evidence count, support/attack counts, MOID, author
   - Same caching, same fallback strategy

---

### Step 1.3: Argument Public Permalink Page with Full OG Meta

**What**: Transform the existing `/api/a/[identifier]` route from an API-only endpoint into a full public-facing page that serves rich OG meta tags to crawlers and a complete argument view to browsers.

**Files to create**:
```
app/a/[identifier]/page.tsx               — Public argument page (SSR)
app/a/[identifier]/layout.tsx             — Layout with OG meta via generateMetadata
```

**Implementation details**:

1. Create `app/a/[identifier]/page.tsx`:
   - This is a Next.js page (not an API route) so `generateMetadata` can produce `<head>` tags that crawlers see on first HTML response
   - `generateMetadata()`:
     - Resolve permalink via `resolvePermalink(identifier)`
     - Fetch argument with relations: conclusion claim, evidence, scheme, author, deliberation, citation metrics, premise count, attack/support edge counts
     - Return:
       ```typescript
       {
         title: claimText,
         description: `Evidence-backed argument · ${evidenceCount} sources · ${confidenceDisplay} confidence · ${schemeName || "Structured reasoning"} · View on Isonomia`,
         openGraph: {
           title: claimText,
           description: ogDescription,
           type: "article",
           url: `${baseUrl}/a/${identifier}`,
           images: [{ url: `${baseUrl}/api/og/argument/${identifier}`, width: 1200, height: 630 }],
           siteName: "Isonomia",
         },
         twitter: {
           card: "summary_large_image",
           title: claimText,
           description: twitterDescription,
           images: [`${baseUrl}/api/og/argument/${identifier}`],
         },
         alternates: {
           canonical: `${baseUrl}/a/${identifier}`,
         },
         other: {
           "citation_title": claimText,
           "citation_author": authorName,
           "citation_date": createdAt.toISOString().split("T")[0],
         },
       }
       ```
     - Include `<link rel="alternate" type="application/json+oembed">` via metadata API
   - Page component:
     - **For MVP**: Server-render a public argument detail view. Show:
       - Claim text (prominent)
       - Evidence list (clickable source links)
       - Scheme + critical questions summary
       - Confidence score
       - Author + creation date
       - Deliberation context (link)
       - Attack/support counts
       - Citation count
       - "Respond to this argument" CTA → links to Isonomia app
       - "View in deliberation" CTA → links to deliberation in Isonomia app
       - JSON-LD `<script type="application/ld+json">` with Schema.org Claim + ClaimReview structured data
     - This page is **public, no auth required**. Auth is only needed for response actions.
     - Use inline styles (like existing embed pages) OR a minimal Tailwind build if the page is part of the main app
     - Mobile-responsive

2. **Keep the existing `/api/a/[identifier]/route.ts` as-is** for JSON API consumers. The new page handles browser + crawler traffic; the API route handles programmatic access.

3. **Base URL**: Use `process.env.NEXT_PUBLIC_APP_URL || process.env.PUBLIC_BASE_URL || "https://Isonomia.app"` (consistent with existing embed pages).

**Testing**:
- `curl -H "User-Agent: Twitterbot" https://Isonomia.app/a/{shortCode}` should return HTML with OG meta tags
- `curl -H "User-Agent: Mozilla/5.0" https://Isonomia.app/a/{shortCode}` should return the full page
- Validate with Twitter Card Validator, Facebook Debugger
- Test with nonexistent permalink → 404 page
- Test mobile viewports (375px, 414px, 768px)

**Dependencies**: Step 1.1 (OG image route must exist for the `og:image` URL).

---

### Step 1.4: Claim Public Permalink Page

**What**: Same pattern as 1.3 but for claims. Creates a public page at `/c/[identifier]` (using moid or claimId).

**Files to create**:
```
app/c/[identifier]/page.tsx               — Public claim page
app/c/[identifier]/layout.tsx             — Layout with OG meta
```

**Implementation details**:

1. Mirror the argument page structure but with claim-specific data:
   - Resolve by `moid` first (the canonical identifier), fallback to `claimId`
   - Show: claim text, evidence list, support/attack argument counts, negation (if exists), deliberation context
   - OG image: `${baseUrl}/api/og/claim/${identifier}`
   - JSON-LD: Schema.org `Claim` type
2. Shorter and simpler than the argument page — claims are atomic assertions, not inferential structures

**Dependencies**: Step 1.2 (OG image for claims).

---

### Step 1.5: Argument Embed Widget Page (iframe)

**What**: A self-contained HTML embed page for arguments, following the exact pattern of the existing stack/source/evidence embeds.

**Files to create**:
```
app/embed/argument/[identifier]/page.tsx   — Argument embed widget
```

**Implementation details**:

1. Follow the existing embed page pattern precisely (reference `app/embed/stack/[stackId]/page.tsx`):
   - Server-rendered with Prisma data fetch
   - Self-contained `<html>` with inline `<style>` (no Tailwind runtime, no external CSS)
   - Theme support: `?theme=light|dark|auto` with CSS custom properties + `prefers-color-scheme`
   - Compact mode: `?compact=true`
   - Additional query params: `?showEvidence=true|false`, `?showScheme=true|false`
   - `generateMetadata()` with basic OG tags

2. Layout:
   - **Standard mode**: Claim text, evidence list (titles + links), scheme badge, confidence bar, author, "View on Isonomia" CTA, "Respond" CTA
   - **Compact mode**: Claim text only, evidence count, confidence, single CTA
   - Footer: "Powered by Isonomia" with link (consistent with existing embeds)

3. Access control:
   - Arguments in public/unlisted deliberations: accessible
   - Arguments in private deliberations: show "This argument is from a private deliberation" message
   - Quick arguments marked as public: accessible
   - Deleted/moderated arguments: show "This argument is no longer available" message

4. Interactivity (minimal, no React needed):
   - Evidence list expand/collapse (CSS `:target` or `<details>` element — no JS required)
   - External links open in `_blank` with `rel="noopener noreferrer"`
   - All CTAs open in new tab

**Testing**:
- Embed in a test HTML page via `<iframe>` — verify renders correctly
- Test all three themes
- Test compact mode
- Test with arguments that have 0 evidence, 0 scheme, null confidence
- Verify no external resource loads (fully self-contained)
- Test `X-Frame-Options` / CSP headers allow embedding from any origin

---

### Step 1.6: Claim Embed Widget Page (iframe)

**What**: Same pattern for claims.

**Files to create**:
```
app/embed/claim/[identifier]/page.tsx      — Claim embed widget
```

**Implementation details**: Mirror Step 1.5 structure with claim-specific data (text, moid, evidence, support/attack counts).

---

### Step 1.7: Extend oEmbed Endpoint for Arguments and Claims

**What**: Add `argument` and `claim` type support to the existing oEmbed endpoint at `app/api/oembed/route.ts`.

**Files to modify**:
```
app/api/oembed/route.ts                    — Add argument + claim type handling
```

**Implementation details**:

1. Extend the URL pattern matching to recognize:
   - `/embed/argument/{identifier}` → type `argument`
   - `/embed/claim/{identifier}` → type `claim`
   - `/a/{identifier}` → type `argument` (permalink URL)
   - `/c/{identifier}` → type `claim` (permalink URL)

2. For `argument` type:
   - Resolve argument via permalink or direct ID
   - Fetch metadata: claim text, author name, evidence count
   - Return oEmbed response:
     ```json
     {
       "type": "rich",
       "version": "1.0",
       "title": "<claim text, truncated to 256 chars>",
       "author_name": "<author displayName>",
       "author_url": "<baseUrl>/u/<authorId>",
       "provider_name": "Isonomia",
       "provider_url": "<baseUrl>",
       "html": "<iframe src=\"<baseUrl>/embed/argument/<identifier>?theme=auto\" width=\"600\" height=\"400\" ...>",
       "width": 600,
       "height": 400,
       "thumbnail_url": "<baseUrl>/api/og/argument/<identifier>",
       "thumbnail_width": 1200,
       "thumbnail_height": 630
     }
     ```

3. For `claim` type: Same pattern, different dimensions (600×300).

4. Keep existing `Cache-Control: public, max-age=3600` header.

**Testing**:
- `GET /api/oembed?url=https://isonomia.app/embed/argument/Bx7kQ2mN&format=json` → valid oEmbed response
- `GET /api/oembed?url=https://isonomia.app/a/Bx7kQ2mN&format=json` → valid oEmbed response
- Verify Discord auto-discovery works (paste link in Discord, verify rich embed appears)

---

### Step 1.8: Extend Embed Code Generator for Arguments and Claims

**What**: Add `argument` and `claim` type support to `app/api/widgets/embed/route.ts`.

**Files to modify**:
```
app/api/widgets/embed/route.ts             — Add argument + claim types
```

**Implementation details**:

1. Add `"argument"` and `"claim"` to the supported types
2. For arguments: `verifyPublicAccess` checks deliberation visibility (or standalone public flag)
3. Return `EmbedResponse` with:
   - `widgetUrl`: `/embed/argument/{identifier}`
   - `embedCodes.iframe`: `<iframe src="..." width="600" height="400" ...>`
   - `embedCodes.script`: `<div class="Isonomia-widget" data-Isonomia-type="argument" data-Isonomia-id="..." ...>`
   - `embedCodes.oembed`: `/api/oembed?url=...`
   - `preview`: `/a/{identifier}`

---

### Step 1.9: Claim Permalink Service

**What**: Create a permalink service for claims mirroring the existing argument permalink service.

**Files to create**:
```
lib/citations/claimPermalinkService.ts     — Claim permalink service
```

**Prisma schema changes**:
```prisma
model ClaimPermalink {
  id              String    @id @default(cuid())
  claimId         String    @unique
  claim           Claim     @relation(fields: [claimId], references: [id], onDelete: Cascade)
  shortCode       String    @unique
  slug            String?
  permalinkUrl    String
  version         Int       @default(1)
  accessCount     Int       @default(0)
  lastAccessedAt  DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([shortCode])
  @@index([slug])
}
```

Also add to the `Claim` model:
```prisma
permalink       ClaimPermalink?
```

**Implementation details**:

1. Create `lib/citations/claimPermalinkService.ts`:
   - Mirror `lib/citations/permalinkService.ts` structure
   - `generateShortCode(length=8)` — reuse the same base62 function (extract to shared util if not already)
   - `generateSlug(claimText)` — slugify claim text, 100-char limit
   - `getOrCreateClaimPermalink(claimId)` — idempotent creation
   - `resolveClaimPermalink(identifier)` — try shortCode, then slug, then moid
   - `bumpClaimPermalinkVersion(claimId)` — version increment on claim text edits

2. Run `npx prisma db push` to apply schema changes.

---

### Step 1.10: JSON-LD Structured Data on Public Pages

**What**: Add Schema.org structured data to the public argument and claim pages for SEO and fact-checking discoverability.

**Files to modify**:
```
app/a/[identifier]/page.tsx                — Add JSON-LD script tag
app/c/[identifier]/page.tsx                — Add JSON-LD script tag
```

**Implementation details**:

1. In the argument page, render a `<script type="application/ld+json">` block:
   ```json
   {
     "@context": "https://schema.org",
     "@type": "Claim",
     "text": "<claim text>",
     "author": { "@type": "Person", "name": "<author>", "url": "<profile>" },
     "datePublished": "<ISO date>",
     "appearance": [{ "@type": "CreativeWork", "url": "<permalink>" }],
     "citation": [
       { "@type": "CreativeWork", "name": "<evidence title>", "url": "<evidence url>" }
     ]
   }
   ```

2. For the claim page, same pattern with `Claim` type and simpler structure (no reasoning/scheme metadata).

3. Validate with [Google Rich Results Test](https://search.google.com/test/rich-results).

---

### Phase 1 Completion Checklist

- [ ] `GET /api/og/argument/[identifier]` returns 1200×630 PNG
- [ ] `GET /api/og/claim/[identifier]` returns 1200×630 PNG
- [ ] `GET /a/[identifier]` renders public page with OG meta + JSON-LD (no auth required)
- [ ] `GET /c/[identifier]` renders public claim page with OG meta + JSON-LD (no auth required)
- [ ] `GET /embed/argument/[identifier]` renders self-contained HTML for iframe
- [ ] `GET /embed/claim/[identifier]` renders self-contained HTML for iframe
- [ ] `GET /api/oembed?url=.../embed/argument/...` returns valid oEmbed response
- [ ] `GET /api/oembed?url=.../embed/claim/...` returns valid oEmbed response
- [ ] `GET /api/widgets/embed?type=argument&id=...` returns embed codes
- [ ] `GET /api/widgets/embed?type=claim&id=...` returns embed codes
- [ ] `ClaimPermalink` model exists and `claimPermalinkService` is functional
- [ ] Pasting `Isonomia.app/a/{shortCode}` in Reddit shows rich OG card
- [ ] Pasting `Isonomia.app/a/{shortCode}` in Twitter shows `summary_large_image` card
- [ ] Pasting `Isonomia.app/a/{shortCode}` in Discord shows rich embed with thumbnail
- [ ] Pasting `Isonomia.app/a/{shortCode}` in Slack shows unfurled card
- [ ] JSON-LD validates in Google Rich Results Test
- [ ] All pages are mobile-responsive
- [ ] `npm run lint` passes
- [ ] No auth wall on any public page/embed

---

## Phase 2: Creation — Quick Argument Builder & Share Flow

**Goal**: Give users the tools to create embeddable arguments quickly and share them outward. This is what turns passive Isonomia users into distribution vectors.

**Success criteria**: A user can go from "I want to make an argument about X" to "here's a link I can paste in Reddit" in under 60 seconds.

### Step 2.1: Share Argument Modal

**What**: A modal component that appears when a user clicks "Share" on any argument within Isonomia. Displays the argument's permalink, embed code, and share-to-platform buttons.

**Files to create**:
```
components/modals/ShareArgumentModal.tsx   — Share modal component
```

**Implementation details**:

1. Follow the pattern of existing share modals (`SharePostModal.tsx`, `ShareRoomModal.tsx`):
   - Open via `modalStore` (the existing modal system)
   - Props: `argumentId: string`

2. On mount:
   - Call `getOrCreatePermalink(argumentId)` (or fetch via API if client-side)
   - Fetch argument metadata for display: claim text, evidence count, confidence

3. Modal sections:
   - **Link Preview**: Show a thumbnail of the OG image (load from `/api/og/argument/{identifier}`)
   - **Copy Link**: One-click copy of `https://isonomia.app/a/{shortCode}`
   - **Copy Embed Code**: `<iframe>` snippet
   - **Copy as Markdown**: Formatted text block:
     ```markdown
     **Claim:** Remote work increases productivity for knowledge workers
     
     **Evidence:**
     - Stanford WFH Study (Bloom et al. 2015)
     - Microsoft Research: Effects of Remote Work (2022)
     
     **Confidence:** 82% · **Scheme:** Argument from Expert Opinion
     
     [View full argument on Isonomia](https://isonomia.app/a/Bx7kQ2mN)
     ```
   - **Copy as Plain Text**: Same content without Markdown formatting
   - **Share to Platform** buttons: Reddit (pre-fills Reddit submission URL), Twitter (pre-fills tweet with link), LinkedIn, copy for Discord/Slack
   - **Advanced**: Copy JSON-LD, download OG image, copy AIF export link

4. All "Copy" buttons use `navigator.clipboard.writeText()` with visual feedback ("Copied!" toast).

5. Platform share URLs:
   - Reddit: `https://www.reddit.com/submit?url={encodedPermalink}&title={encodedClaim}`
   - Twitter: `https://twitter.com/intent/tweet?text={encodedClaim}&url={encodedPermalink}`
   - LinkedIn: `https://www.linkedin.com/shareArticle?mini=true&url={encodedPermalink}&title={encodedClaim}`

---

### Step 2.2: Integrate Share Button into Argument UI

**What**: Add a "Share" button to argument cards/panels throughout the Isonomia UI that opens the `ShareArgumentModal`.

**Files to modify** (identify the primary argument display components):
```
components/arguments/ArgumentCard.tsx      — (or equivalent) Add share button
components/deepdive/DeepDivePanelV2.tsx    — Add share action to argument detail view
```

**Implementation details**:

1. Search for the primary argument display components in the codebase
2. Add a share icon button (use Lucide `Share2` or `ExternalLink` icon, consistent with existing UI)
3. On click: `modalStore.open(ShareArgumentModal, { argumentId })`
4. Show the button on all arguments that have a permalink or are in public/unlisted deliberations
5. For arguments without a permalink: create one on-the-fly when the share button is first clicked

---

### Step 2.3: Share Claim Modal

**What**: Same as 2.1 but for claims. Simpler since claims have less metadata.

**Files to create**:
```
components/modals/ShareClaimModal.tsx       — Share modal for claims
```

**Implementation details**: Mirror `ShareArgumentModal` with claim-specific data. Uses `getOrCreateClaimPermalink(claimId)`.

---

### Step 2.4: Quick Argument Builder — API Endpoint

**What**: A streamlined API endpoint for creating arguments with minimal input, optimized for the "create and immediately share" use case.

**Files to create**:
```
app/api/arguments/quick/route.ts           — POST endpoint for quick argument creation
```

**Implementation details**:

1. `POST /api/arguments/quick`:
   - Requires authentication (standard Isonomia auth middleware)
   - Request body:
     ```typescript
     {
       claim: string;                           // Required: the assertion
       evidence: Array<{                        // Optional but encouraged
         url: string;
         title?: string;
         quote?: string;
       }>;
       reasoning?: string;                      // Optional: free-text explanation
       deliberationId?: string;                 // Optional: attach to existing deliberation
       isPublic?: boolean;                      // Default: true (embeddable)
     }
     ```
   - Processing:
     1. Validate input (claim non-empty, URLs are valid, deliberationId exists if provided)
     2. If no `deliberationId`: create a lightweight "standalone" deliberation (or use a per-user "My Arguments" deliberation — design decision)
     3. Create `Claim` from the claim text (generate `moid`)
     4. Create `ClaimEvidence[]` from the evidence URLs
     5. Auto-unfurl evidence URLs for title/metadata (use existing `lib/unfurl.ts` `parseOpenGraph()`)
     6. Create `Argument` linking to the claim and deliberation
     7. Create `ArgumentPermalink` via `getOrCreatePermalink()`
     8. Create `ClaimPermalink` via `getOrCreateClaimPermalink()`
     9. Optionally: Run scheme auto-detection (if NLI/LLM infrastructure is available and fast enough — if not, skip for MVP)
   - Response:
     ```typescript
     {
       argument: { id, text, confidence, scheme },
       claim: { id, text, moid },
       permalink: { shortCode, slug, url },
       embedCodes: {
         link: "https://Isonomia.app/a/{shortCode}",
         iframe: "<iframe ...>",
         markdown: "**Claim:** ...",
         plainText: "CLAIM: ...",
       },
     }
     ```
   - Rate limit: 20 quick arguments per user per hour

2. Input validation and sanitization:
   - Sanitize claim text (strip HTML, limit to 2000 chars)
   - Validate URLs (must be http/https, no javascript: or data: URIs)
   - Limit evidence to 10 items per argument
   - Validate deliberationId belongs to user or user has access

---

### Step 2.5: Quick Argument Builder — Frontend UI

**What**: A lightweight, fast creation form accessible from the Isonomia UI, designed for the "I need to make an argument to share in a comment thread right now" use case.

**Files to create**:
```
components/arguments/QuickArgumentBuilder.tsx    — Creation form component
app/quick/page.tsx                               — Standalone page for quick creation
```

**Implementation details**:

1. Create `components/arguments/QuickArgumentBuilder.tsx`:
   - **Section 1: Claim** — Large text input, placeholder: "What are you claiming?"
   - **Section 2: Evidence** — URL input with auto-unfurl:
     - On paste/enter: call `parseOpenGraph(url)` (or a new lightweight API endpoint) to fetch title + metadata
     - Show unfurled preview (title, domain favicon)
     - "+ Add another source" button
     - Optional quote input per source
   - **Section 3: Reasoning** — Optional textarea, placeholder: "Why does this evidence support your claim?"
   - **Section 4: Preview** — Live rendering of what the OG card will look like (either an `<img>` pointed at the OG route with draft data, or a client-side approximation)
   - **Section 5: Actions**:
     - Primary: "Create & Copy Link" — calls `/api/arguments/quick`, copies permalink to clipboard, shows success toast
     - Secondary: "Create & Copy Embed" — same but copies iframe code
     - Tertiary: "Create & Share to..." — creates then opens platform share URL
   - **Advanced options** (collapsed by default):
     - Attach to deliberation (dropdown of user's deliberations)
     - Confidence slider
     - Scheme selector (if they want to specify manually)
     - Public/private toggle

2. Create `app/quick/page.tsx`:
   - A dedicated page at `/quick` for the Quick Argument Builder
   - Minimal chrome — just the builder and Isonomia header/nav
   - This page is linkable from outside Isonomia and from the browser extension
   - Accepts query params for pre-filling: `?claim=...&url=...` (used by browser extension)

**Key UX decisions**:
- The form submits in one API call — no multi-step wizard
- URL unfurling happens asynchronously while the user keeps typing
- The permalink is generated server-side and immediately available after creation
- Default is public — the toggle to make private is visible but not the default position

---

### Step 2.6: URL Unfurl API Endpoint

**What**: A lightweight API endpoint that extracts Open Graph metadata from a URL, used by the Quick Argument Builder for evidence URL auto-fill.

**Files to create**:
```
app/api/unfurl/route.ts                    — URL metadata extraction
```

**Implementation details**:

1. `GET /api/unfurl?url={encodedUrl}`:
   - Requires authentication
   - Fetches the URL (with timeout: 5s, max body: 1MB)
   - Uses existing `parseOpenGraph()` from `lib/unfurl.ts`
   - Returns:
     ```typescript
     {
       title: string | null;
       description: string | null;
       image: string | null;
       siteName: string | null;
       author: string | null;
       publishedDate: string | null;
       favicon: string | null;
     }
     ```
   - Cache: In-memory LRU cache (1000 entries, 1h TTL) or Redis cache
   - Rate limit: 60 unfurls per user per hour
   - Security: Server-side fetch only (prevents SSRF by validating URL is public HTTP/HTTPS, not internal network ranges)

---

### Step 2.7: Standalone Arguments / "My Arguments" Deliberation

**What**: A mechanism for Quick Arguments that aren't attached to an existing deliberation. The user needs a home for standalone arguments.

**Design options**:

**Option A: Auto-create a per-user "My Arguments" deliberation.**
- On first quick argument creation, check if user has a deliberation titled "My Arguments" (or with a special flag)
- If not, create one automatically
- All standalone quick arguments go here
- Pro: Fits existing data model perfectly. User can browse all their quick arguments in one place.
- Con: Creates a deliberation the user didn't ask for

**Option B: Allow null deliberationId (schema change).**
- Make `Argument.deliberationId` nullable
- Pro: Clean — standalone arguments exist independently
- Con: Many existing queries assume non-null deliberationId. Significant refactor risk.

**Option C: Create a throwaway deliberation per argument.**
- Each standalone argument gets its own deliberation
- Pro: No schema change, each argument is isolated
- Con: Deliberation spam in the database

**Recommended**: **Option A** — Auto-create "My Arguments" deliberation. Minimal risk, fits existing patterns, and the user can upgrade any argument to a "real" deliberation later by moving it.

**Implementation**:
1. In the `/api/arguments/quick` handler, if no `deliberationId` is provided:
   - Query for existing deliberation where `createdById = userId` AND `title = "My Arguments"` AND `hostType = "standalone"` (or similar marker)
   - If not found, create it
   - Use this deliberation as the target
2. Add a `"standalone"` value to the `DeliberationHostType` enum if it doesn't exist (check prisma schema)

---

### Phase 2 Completion Checklist

- [ ] `ShareArgumentModal` opens from any argument in the UI
- [ ] `ShareClaimModal` opens from any claim in the UI
- [ ] Copy Link, Copy Embed, Copy Markdown, Copy Plain Text all work
- [ ] Platform share buttons (Reddit, Twitter, LinkedIn) open pre-filled share URLs
- [ ] `POST /api/arguments/quick` creates argument + claim + evidence + permalink in one call
- [ ] `GET /api/unfurl?url=...` returns OG metadata for any public URL
- [ ] Quick Argument Builder at `/quick` allows claim + evidence + optional reasoning → creates and copies link
- [ ] URL auto-unfurl works in the evidence input
- [ ] Live preview shows approximate OG card
- [ ] Standalone arguments go to "My Arguments" deliberation
- [ ] Rate limiting on quick argument creation (20/hr) and unfurling (60/hr)
- [ ] Input validation: HTML stripping, URL validation, length limits
- [ ] `npm run lint` passes
- [ ] End-to-end test: Create quick argument → copy link → paste in test Reddit post → verify OG card appears

---

## Phase 3: Distribution — Browser Extension

**Goal**: Enable argument creation from anywhere on the web and make Isonomia links render richer on supported platforms for extension users.

**Success criteria**: A user can highlight text on any webpage, right-click, select "Create Isonomia Argument," and have a link copied to their clipboard in under 15 seconds.

### Step 3.1: Extension Project Setup

**What**: Initialize a Chrome browser extension project within the Isonomia repo.

**Files to create**:
```
extensions/chrome/
├── manifest.json                          — Manifest V3
├── src/
│   ├── background/
│   │   └── service-worker.ts              — Background service worker
│   ├── content/
│   │   ├── link-detector.ts               — Finds Isonomia URLs on pages
│   │   ├── inline-renderer.ts             — Renders rich previews for Isonomia links
│   │   └── selection-handler.ts           — Right-click → create argument
│   ├── popup/
│   │   ├── popup.html                     — Extension popup HTML
│   │   ├── popup.tsx                      — Quick argument builder in popup
│   │   └── popup.css                      — Popup styles
│   ├── options/
│   │   ├── options.html                   — Options page
│   │   └── options.tsx                    — Account connection, toggles
│   └── shared/
│       ├── api-client.ts                  — Isonomia API client (authenticated)
│       ├── auth.ts                        — OAuth / token management
│       └── types.ts                       — Shared type definitions
├── webpack.config.js                      — Build config
├── package.json                           — Extension deps
└── README.md                              — Development guide
```

**Implementation details**:

1. Use **Manifest V3** (required for Chrome Web Store as of Nov 2024)
2. Build with webpack or esbuild (lightweight, no full Next.js needed)
3. Authentication: OAuth2 flow with Isonomia backend, store token in `chrome.storage.local`
4. Permissions: `activeTab`, `contextMenus`, `storage`, `identity`
5. Host permissions: `*://Isonomia.app/*` (or whatever the production domain is)

---

### Step 3.2: Context Menu — "Create Isonomia Argument"

**What**: Right-click context menu on text selection that creates a quick argument pre-filled with the selected text and current page as a source.

**Implementation details**:

1. In `service-worker.ts`:
   - Register context menu: `chrome.contextMenus.create({ id: "create-Isonomia-argument", title: "Create Isonomia Argument", contexts: ["selection"] })`
   - On click: send selected text + page URL + page title to popup/sidebar

2. In `popup.tsx` (or a sidebar panel):
   - Pre-fill claim with selected text
   - Pre-fill first evidence URL with current page URL (auto-unfurl via Isonomia API)
   - User can edit claim text, add more sources
   - "Create & Copy Link" button calls `/api/arguments/quick`
   - On success: copy permalink to clipboard, show confirmation, close popup

3. Error handling: If user is not logged in, show login prompt. If network error, show offline message.

---

### Step 3.3: Content Script — Isonomia Link Detection & Inline Preview

**What**: When viewing Reddit, Twitter/X, HN, or other supported sites, detect `Isonomia.app/a/...` URLs in the page content and render rich inline previews for users who have the extension installed.

**Implementation details**:

1. In `link-detector.ts`:
   - Scan page for links matching `Isonomia.app/a/` or `Isonomia.app/c/` patterns
   - For each detected link:
     - Fetch argument/claim metadata from Isonomia API (or from the page's OG tags if available)
     - Inject a styled card below/beside the link (using Shadow DOM for style isolation)

2. Platform-specific handling:
   - **Reddit**: Detect links in `.md` comment bodies, inject card after the link element
   - **Twitter/X**: Detect links in tweet cards, enhance with additional metadata
   - **HN**: Detect links in `.comment` elements, inject card inline

3. Card rendering: Use a lightweight HTML/CSS template (no React in content script for performance). Template mirrors the OG card layout.

4. User preference: Toggle on/off per site in extension options. Off by default to avoid being intrusive — user opts in.

---

### Step 3.4: Extension Popup — Quick Argument Builder

**What**: Clicking the extension icon opens a popup with a compact Quick Argument Builder.

**Implementation details**:

1. Compact version of the full Quick Argument Builder from Step 2.5
2. Pre-fills current page URL as evidence source
3. Shows recent arguments (last 5) for quick re-sharing
4. "Search Isonomia arguments" field for finding existing arguments to share
5. Build with lightweight React (Preact) or vanilla JS to keep popup fast

---

### Step 3.5: Firefox Port

**What**: Port the Chrome extension to Firefox using WebExtension API compatibility.

**Implementation details**:
- Manifest V3 is largely compatible between Chrome and Firefox (with minor differences in `background.service_worker` vs `background.scripts`)
- Use `browser` namespace polyfill (`webextension-polyfill`)
- Test on Firefox Developer Edition
- Submit to Firefox Add-ons

---

### Step 3.6: Safari Port

**What**: Port to Safari using Safari Web Extensions (Xcode project).

**Implementation details**:
- Safari Web Extensions use the same WebExtension API
- Requires an Xcode project wrapper and Apple Developer account
- Use `xcrun safari-web-extension-converter` to generate the Xcode project from the existing extension source
- Submit to App Store (macOS + iOS)

---

### Phase 3 Completion Checklist

- [ ] Chrome extension installable from local build
- [ ] Right-click → "Create Isonomia Argument" works with text selection
- [ ] Popup quick builder creates argument and copies link
- [ ] Content script detects and enhances Isonomia links on Reddit
- [ ] Content script detects and enhances Isonomia links on Twitter/X
- [ ] Extension options page allows account connection and per-site toggles
- [ ] Firefox extension published
- [ ] Safari extension published
- [ ] Chrome Web Store submission

---

## Phase 4: Engagement — Response Loop & Analytics

**Goal**: Close the feedback loop — when someone sees an embedded argument and wants to respond, make it trivially easy to create a counter-argument and get their own permalink. Track embed performance.

**Success criteria**: Two users in a Reddit thread can have a structured argumentative exchange mediated by Isonomia permalink cards, with each argument linked in the Isonomia graph.

### Step 4.1: "Respond to This" Landing Flow

**What**: When a user clicks through an embedded argument (via OG card link or "Respond" CTA), they land on the argument's public page with a clear path to create a response.

**Files to modify**:
```
app/a/[identifier]/page.tsx                — Add response CTAs and composer trigger
```

**Implementation details**:

1. On the public argument page (`/a/{identifier}`), add prominent response CTAs:
   - "Support this argument" → opens Isonomia with a pre-filled argument composer targeting the original as a SUPPORT edge
   - "Challenge this argument" → opens Isonomia with a pre-filled argument composer targeting the original as an ATTACK edge (choice of REBUT, UNDERCUT, UNDERMINE)
   - "Ask a critical question" → opens Isonomia with the argument's scheme CQs visible

2. For unauthenticated users:
   - Show the CTAs but clicking them goes to login/signup with `?redirect=/a/{identifier}?action=respond`
   - After auth, redirect back to the argument with the composer open

3. For authenticated users:
   - CTAs link to the argument within its deliberation in the full Isonomia app, with the response composer pre-opened
   - After response creation: automatically generate a permalink for the response and show the ShareArgumentModal so the user can paste their counter-argument link back in the thread

4. **The key UX moment**: After creating a response, the modal should say something like: "Your counter-argument is ready. Copy the link to paste it in the conversation:" with a one-click copy button.

---

### Step 4.2: Deliberation Summary Embed Widget

**What**: An embed widget showing a high-level summary of an entire deliberation, for embedding in articles, blog posts, or forum threads where the full deliberation context is relevant.

**Files to create**:
```
app/embed/deliberation/[deliberationId]/page.tsx   — Deliberation summary embed
```

**Implementation details**:

1. Follow existing embed page pattern
2. Prisma query: deliberation title, argument count, claim count, participant count (distinct `authorId`), top 3 claims by citation count, creation date
3. Layout:
   - Title
   - Stats row: N arguments, N claims, N participants
   - Top claims list (3 items, each with support/attack count)
   - "View full deliberation on Isonomia" CTA
4. Theme + compact support

---

### Step 4.3: Embed Analytics Tracking

**What**: Lightweight, privacy-respecting tracking of embed renders and click-throughs.

**Files to create**:
```
app/api/embed/track/route.ts               — Analytics beacon endpoint
```

**Prisma schema changes** (from brainstorm):
```prisma
model EmbedContext {
  id                String            @id @default(cuid())
  argumentPermalinkId String?
  claimPermalinkId    String?
  platform          String            // "reddit", "twitter", "discord", etc.
  hostUrl           String?           // URL where embed appears (referrer)
  renderTier        String            // "og_preview", "oembed", "iframe"
  firstSeenAt       DateTime          @default(now())
  lastSeenAt        DateTime          @default(now())
  viewCount         Int               @default(0)
  clickThroughCount Int               @default(0)

  argumentPermalink ArgumentPermalink? @relation(fields: [argumentPermalinkId], references: [id])
  claimPermalink    ClaimPermalink?    @relation(fields: [claimPermalinkId], references: [id])

  @@unique([argumentPermalinkId, hostUrl])
  @@unique([claimPermalinkId, hostUrl])
  @@index([platform])
}
```

Also add to `ArgumentPermalink` and `ClaimPermalink`:
```prisma
embedContexts     EmbedContext[]
```

**Implementation details**:

1. `POST /api/embed/track`:
   - Body: `{ permalinkId, type: "argument" | "claim", platform, hostUrl, renderTier, event: "view" | "click" }`
   - **No authentication required** (fired from external embeds)
   - Validate input, sanitize hostUrl
   - Queue to Redis via BullMQ (existing infrastructure) — do not write to DB synchronously
   - Return 202 Accepted immediately
   - Rate limit by IP: 100 events per minute per IP

2. Worker job (`workers/`):
   - Process embed tracking events from the queue
   - Upsert `EmbedContext` record (increment `viewCount` or `clickThroughCount`)
   - Update `lastSeenAt`
   - Batch writes: process up to 100 events at a time

3. Add tracking beacon to embed pages:
   - In `app/embed/argument/[identifier]/page.tsx`, add a 1×1 image beacon or `navigator.sendBeacon` call at bottom of page
   - Detect platform from referrer or embed context
   - Fire on page load (view event) and on CTA click (click event)

---

### Step 4.4: Embed Analytics Dashboard

**What**: A page within Isonomia where users can see how their embedded arguments are performing.

**Files to create**:
```
app/analytics/embeds/page.tsx              — Embed analytics dashboard
components/analytics/EmbedAnalytics.tsx    — Analytics display component
```

**Implementation details**:

1. Dashboard shows for the authenticated user:
   - Total embed views, click-throughs, and CTR across all their arguments
   - Per-argument breakdown: views, CTR, platforms, top referrer URLs
   - Per-platform breakdown: Reddit vs Twitter vs Discord etc.
   - Time series: views and clicks over time (daily/weekly)
   - Top performing arguments (by CTR or total views)

2. Data query: Aggregate from `EmbedContext` where the argument's `authorId` matches the user.

3. Simple charts using an existing charting library (check if one is already in the project) or basic CSS bar charts.

---

### Step 4.5: Notification Pipeline for Embed Responses

**What**: Notify users when someone creates a response to their embedded argument.

**Implementation details**:

1. When a new `ArgumentEdge` (ATTACK or SUPPORT) is created targeting an argument that has embed views:
   - Check if the target argument has any `EmbedContext` records
   - If so, create a notification for the original argument's author:
     - "Someone responded to your argument [claim text snippet] — [response type: supported/challenged] with [response claim snippet]"
     - Include link to the response and the original argument's embed analytics

2. Use existing notification infrastructure (check for notification models/services in the codebase).

---

### Phase 4 Completion Checklist

- [ ] Public argument page has "Support" and "Challenge" CTAs
- [ ] Unauthenticated users are redirected to login then back to respond
- [ ] After creating a response, share modal auto-opens with response permalink
- [ ] Deliberation summary embed widget renders at `/embed/deliberation/{id}`
- [ ] `POST /api/embed/track` accepts and queues analytics events
- [ ] Worker processes embed tracking events into `EmbedContext` records
- [ ] Embed pages fire tracking beacons on load and CTA clicks
- [ ] Analytics dashboard shows per-argument and per-platform stats
- [ ] Notifications fire when arguments with embed views receive responses

---

## Phase 5: Ecosystem — Integrations & Public API

**Goal**: Make Isonomia argument embeds a standard tool available beyond just link-sharing: native integrations for major platforms, a public API for third-party builders, and Web Components for custom site integration.

**Success criteria**: A developer can embed a Isonomia argument in their own website using a `<Isonomia-argument>` custom element with a single script tag, and a Slack workspace can unfurl Isonomia links with rich interactive cards.

### Step 5.1: Web Component Distribution

**What**: A standalone JavaScript bundle that registers `<Isonomia-argument>`, `<Isonomia-claim>`, and `<Isonomia-deliberation>` custom elements, usable on any website without React or Isonomia dependencies.

**Files to create**:
```
packages/Isonomia-embed/
├── src/
│   ├── Isonomia-argument.ts                   — <Isonomia-argument> custom element
│   ├── Isonomia-claim.ts                      — <Isonomia-claim> custom element
│   ├── Isonomia-deliberation.ts               — <Isonomia-deliberation> custom element
│   ├── shared/
│   │   ├── api.ts                         — Fetch argument data from Isonomia API
│   │   ├── renderer.ts                    — HTML/CSS rendering utilities
│   │   └── theme.ts                       — Theme detection and application
│   └── index.ts                           — Register all custom elements
├── package.json
├── tsconfig.json
├── rollup.config.js                       — Bundle to single file
└── README.md                              — Usage documentation
```

**Implementation details**:

1. Each custom element:
   - Uses Shadow DOM for style isolation
   - Fetches data from Isonomia API on connectedCallback
   - Renders the same card layout as the embed pages
   - Attributes: `argument-id`, `claim-id`, `theme`, `compact`, `show-evidence`, `show-scheme`
   - Emits custom events: `Isonomia:loaded`, `Isonomia:error`, `Isonomia:click`

2. Bundle: Single file (`Isonomia-embed.js`), <50KB gzipped, no dependencies
3. Serve from CDN: `https://Isonomia.app/embed/Isonomia-embed.js`
4. Fallback: If JS fails to load, show a `<noscript>` link to the argument permalink

5. Usage:
   ```html
   <Isonomia-argument argument-id="Bx7kQ2mN"></Isonomia-argument>
   <script src="https://Isonomia.app/embed/Isonomia-embed.js" async></script>
   ```

---

### Step 5.2: Slack App Integration

**What**: A Slack app that provides rich interactive unfurling of Isonomia argument links and slash commands for creating/sharing arguments.

**Files to create**:
```
services/slack-app/
├── src/
│   ├── events/
│   │   └── link-shared.ts                 — Handle link_shared events for unfurling
│   ├── commands/
│   │   └── Isonomia-argument.ts               — /Isonomia-argument slash command
│   ├── actions/
│   │   └── respond.ts                     — "Respond" button action handler
│   ├── app.ts                             — Slack Bolt app setup
│   └── blocks.ts                          — Block Kit message builders
├── package.json
└── README.md
```

**Implementation details**:

1. Use Slack Bolt SDK
2. **Link unfurling**: When a `Isonomia.app/a/...` link is shared in a channel:
   - Fetch argument metadata from Isonomia API
   - Render Block Kit message with: claim text, evidence list, confidence, scheme, action buttons
   - Action buttons: "View on Isonomia" (link button), "Respond" (opens external URL), "Add to Stack" (triggers modal)
3. **Slash command**: `/Isonomia-argument "claim text" https://source1.com https://source2.com`
   - Creates a quick argument via Isonomia API
   - Posts the argument card in the channel
4. Deploy as a microservice (Docker → k8s, consistent with existing services under `services/`)

---

### Step 5.3: Discord Bot

**What**: A Discord bot that enhances Isonomia link rendering in Discord channels and provides argument creation commands.

**Files to create**:
```
services/discord-bot/
├── src/
│   ├── events/
│   │   └── message-create.ts              — Detect and enhance Isonomia links
│   ├── commands/
│   │   └── argument.ts                    — /argument slash command
│   ├── embeds/
│   │   └── argument-embed.ts              — Discord.js embed builder
│   ├── bot.ts                             — Discord.js client setup
│   └── types.ts
├── package.json
└── README.md
```

**Implementation details**:

1. Use Discord.js v14
2. **Link detection**: On message containing `Isonomia.app/a/...`, reply with a rich embed showing the full argument card (using Discord embed fields for claim, evidence, scheme, confidence)
3. **Slash command**: `/argument create claim:"..." evidence:"url1, url2" reasoning:"..."`
4. Deploy as a microservice

---

### Step 5.4: WordPress Plugin

**What**: A WordPress plugin that provides a Gutenberg block and shortcode for embedding Isonomia arguments.

**Files to create**:
```
packages/wordpress-plugin/
├── Isonomia-argument-embed/
│   ├── Isonomia-argument-embed.php            — Plugin entry point
│   ├── includes/
│   │   ├── class-Isonomia-oembed.php          — Register oEmbed provider
│   │   └── class-Isonomia-shortcode.php       — [Isonomia_argument id="..."] shortcode
│   ├── blocks/
│   │   └── Isonomia-argument/
│   │       ├── block.json                 — Block metadata
│   │       ├── edit.js                    — Block editor component
│   │       ├── save.js                    — Block frontend render
│   │       └── style.css                  — Block styles
│   └── readme.txt                         — WordPress.org plugin readme
```

**Implementation details**:

1. Register Isonomia as an oEmbed provider in WordPress:
   ```php
   wp_oembed_add_provider('https://Isonomia.app/a/*', 'https://Isonomia.app/api/oembed');
   wp_oembed_add_provider('https://Isonomia.app/c/*', 'https://Isonomia.app/api/oembed');
   ```
2. Shortcode: `[Isonomia_argument id="Bx7kQ2mN" theme="auto"]` → renders iframe
3. Gutenberg block: URL input → live preview via oEmbed → renders iframe on save
4. Submit to WordPress.org plugin directory

---

### Step 5.5: Public API (v3)

**What**: A versioned public API for third-party developers to create, read, and embed Isonomia arguments programmatically.

**Files to create**:
```
app/api/v3/
├── arguments/
│   ├── route.ts                           — GET (list), POST (create)
│   └── [id]/
│       └── route.ts                       — GET (detail), PATCH (update)
├── claims/
│   ├── route.ts                           — GET (list), POST (create)
│   └── [id]/
│       └── route.ts                       — GET (detail)
├── auth/
│   └── token/
│       └── route.ts                       — POST (create API token)
└── docs/
    └── route.ts                           — OpenAPI spec
```

**Implementation details**:

1. API key authentication (bearer token)
2. Rate limiting: 1000 requests/hour for free tier, higher for authenticated partners
3. Endpoints:
   - `GET /api/v3/arguments?q=...&deliberationId=...` — Search/list public arguments
   - `GET /api/v3/arguments/{id}` — Get argument with full metadata, evidence, scheme, metrics
   - `POST /api/v3/arguments` — Create an argument (same fields as quick argument)
   - `GET /api/v3/claims?q=...` — Search/list public claims
   - `GET /api/v3/claims/{id}` — Get claim with evidence and argument counts
4. Response format with embed codes included:
   ```json
   {
     "data": { ... },
     "embed": {
       "permalink": "https://Isonomia.app/a/...",
       "og_image": "https://Isonomia.app/api/og/argument/...",
       "iframe": "<iframe ...>",
       "oembed": "https://Isonomia.app/api/oembed?url=..."
     }
   }
   ```
5. OpenAPI 3.0 spec served at `/api/v3/docs`

---

### Step 5.6: Schema.org ClaimReview Integration

**What**: Enhance the JSON-LD on public argument pages to conform to Google's ClaimReview specification, enabling arguments to appear in Google Search fact-check results.

**Files to modify**:
```
app/a/[identifier]/page.tsx                — Enhance JSON-LD to include ClaimReview
```

**Implementation details**:

1. When an argument has been reviewed (e.g., has engaged critical questions, has multiple supporting/attacking arguments), include `ClaimReview` structured data:
   ```json
   {
     "@context": "https://schema.org",
     "@type": "ClaimReview",
     "claimReviewed": "<claim text>",
     "author": { "@type": "Organization", "name": "Isonomia", "url": "https://Isonomia.app" },
     "reviewRating": {
       "@type": "Rating",
       "ratingValue": "<confidence>",
       "bestRating": 1,
       "worstRating": 0
     },
     "itemReviewed": {
       "@type": "Claim",
       "text": "<claim text>",
       "author": { "@type": "Person", "name": "<claim author>" }
     }
   }
   ```
2. Only emit ClaimReview for arguments that meet a quality threshold (e.g., at least 2 evidence sources, confidence score set, scheme assigned).

---

### Step 5.7: Argument Search Engine

**What**: A public search interface that lets anyone search across all public Isonomia arguments by topic, claim text, or evidence.

**Files to create**:
```
app/search/arguments/page.tsx              — Public argument search page
app/api/v3/search/route.ts                 — Search API endpoint
```

**Implementation details**:

1. Use existing Pinecone vector infrastructure (from deps) for semantic search across argument texts
2. Full-text search via Prisma/Postgres for exact matches
3. Search page: text input → results list showing argument cards with relevance score
4. Each result links to the public argument page (`/a/{identifier}`)
5. Filters: by scheme, by confidence range, by evidence count, by date range
6. This becomes the "Google Scholar for arguments" — the long-term SEO play

---

### Phase 5 Completion Checklist

- [ ] `<Isonomia-argument>` Web Component works on any HTML page
- [ ] Web Component bundle < 50KB gzipped, served from CDN
- [ ] Slack app unfurls Isonomia links with Block Kit cards
- [ ] Slack `/Isonomia-argument` command creates arguments from Slack
- [ ] Discord bot enhances Isonomia links with rich embeds
- [ ] Discord `/argument create` command works
- [ ] WordPress plugin registers oEmbed provider and Gutenberg block
- [ ] Public API v3 serves argument and claim data with embed codes
- [ ] API key authentication works for v3 endpoints
- [ ] ClaimReview JSON-LD emits on qualifying argument pages
- [ ] Argument search returns relevant results with semantic search
- [ ] All integrations use existing auth/rate-limiting infrastructure

---

## Cross-Cutting Concerns

### Security

| Concern | Mitigation | Phase |
|---------|-----------|-------|
| XSS in embed pages | Sanitize all user-generated text before rendering in HTML (existing practice) | 1 |
| SSRF in URL unfurling | Validate URLs are public HTTP/HTTPS, block private IP ranges | 2 |
| Rate limiting | Per-user limits on argument creation (20/hr), unfurling (60/hr), embed tracking (100/min/IP) | 1-4 |
| Content injection | Sanitize claim text, evidence titles — no raw HTML rendering | 1 |
| Auth bypass | Public pages serve read-only data. Mutations require authenticated sessions. | 1-4 |
| CSRF | Use existing CSRF protection for all mutation endpoints | 2 |
| Embed tracking privacy | No PII in tracking. Hash IPs. GDPR-compliant: no cookies in embeds. | 4 |

### Performance

| Concern | Strategy | Phase |
|---------|---------|-------|
| OG image generation latency | Cache to CDN (24h TTL). Pre-generate on argument creation. | 1 |
| Embed page load time | SSR with inline styles. No external resources. Target <200ms TTFB. | 1 |
| oEmbed response time | Simple Prisma query + response. Target <100ms. | 1 |
| Permalink resolution speed | Index on shortCode + slug (already indexed). Target <50ms. | 1 |
| Web Component bundle size | Tree-shaking, no React in bundle. Target <50KB gzipped. | 5 |
| Analytics event throughput | BullMQ queue + batch worker. No sync DB writes on tracking. | 4 |

### Accessibility

| Requirement | Implementation | Phase |
|-------------|---------------|-------|
| Screen reader support | Alt text on OG images, ARIA labels on embed interactive elements | 1 |
| Keyboard navigation | All CTAs reachable via Tab, Enter activates | 1 |
| Color contrast | WCAG AA on all text in embed pages and OG images | 1 |
| Reduced motion | Respect `prefers-reduced-motion` in embed pages | 1 |
| Text scaling | Embed pages use relative units, not fixed px for text | 1 |

### Monitoring & Observability

| Signal | Mechanism | Phase |
|--------|----------|-------|
| OG image generation failures | Error logging + alert on >1% failure rate | 1 |
| Embed page 5xx rate | Standard Next.js error monitoring | 1 |
| Permalink resolution misses | Log 404s on `/a/` and `/c/` routes | 1 |
| Embed view/click tracking throughput | BullMQ queue depth monitoring | 4 |
| API rate limit hits | Log and alert when users consistently hit limits | 2 |

---

## Dependency Graph

```
Phase 1.1: OG Image (Arguments)           ─┐
Phase 1.2: OG Image (Claims)              ─┤
Phase 1.9: Claim Permalink Service         ─┤
                                            ├─→ Phase 1.3: Argument Public Page ──→ Phase 1.10: JSON-LD
                                            ├─→ Phase 1.4: Claim Public Page ─────→ Phase 1.10: JSON-LD
                                            ├─→ Phase 1.5: Argument Embed Widget
                                            ├─→ Phase 1.6: Claim Embed Widget
                                            │
Phase 1.5 + 1.6 ──────────────────────────→ Phase 1.7: Extend oEmbed
                                            Phase 1.8: Extend Embed Code Generator
                                            │
                                            ├─→ Phase 2.1: Share Argument Modal
Phase 1.3 ─────────────────────────────────→ Phase 2.2: Share Button Integration
                                            Phase 2.3: Share Claim Modal
                                            │
                                            ├─→ Phase 2.4: Quick Argument API
Phase 2.6: URL Unfurl API ────────────────→ Phase 2.5: Quick Argument Builder UI
Phase 2.7: Standalone Arguments ──────────→ Phase 2.4: Quick Argument API
                                            │
Phase 2.4 + 2.5 ──────────────────────────→ Phase 3: Browser Extension (all steps)
                                            │
Phase 1.3 ─────────────────────────────────→ Phase 4.1: Response Landing Flow
Phase 1.5 ─────────────────────────────────→ Phase 4.2: Deliberation Embed Widget
                                            Phase 4.3: Embed Analytics Tracking
Phase 4.3 ─────────────────────────────────→ Phase 4.4: Analytics Dashboard
Phase 4.3 ─────────────────────────────────→ Phase 4.5: Notification Pipeline
                                            │
Phase 1 + 2 ──────────────────────────────→ Phase 5: All ecosystem steps
```

**Key insight**: Steps 1.1, 1.2, 1.5, 1.6, and 1.9 have zero dependencies on each other and can be developed in parallel. Step 1.3 depends on 1.1. Step 1.7 depends on 1.5 + 1.6. The longest critical path is: 1.1 → 1.3 → 2.2 → (user testing) → 3.x.

---

## Implementation Notes

### File Naming Conventions
- Follow existing patterns: embed pages are `page.tsx` under `app/embed/`, API routes are `route.ts` under `app/api/`
- New components follow existing naming: `PascalCase.tsx` in `components/`
- New services follow existing naming: `camelCase.ts` in `lib/`

### String Quotes
- Use double quotes in all TypeScript files (project convention per `AGENTS.md`)

### Database Changes
- Use `npx prisma db push` for schema changes (not `prisma migrate dev`, per project convention)
- Run `prisma generate` after schema changes (runs automatically in `postinstall`)

### Testing Strategy
- Unit tests: Jest for service functions (permalink generation, OG image data assembly)
- Integration tests: Test API endpoints with actual Prisma queries against test database
- Visual testing: Manual review of OG images across argument variations
- Platform testing: Validate OG cards render correctly on Reddit, Twitter, Discord, LinkedIn using each platform's debugging tools
- E2E: Create quick argument → copy link → verify OG card appears (manual for now, automate later if volume warrants)

### Environment Variables
- `NEXT_PUBLIC_APP_URL` or `PUBLIC_BASE_URL`: Used for constructing permalink URLs and OG image URLs
- No new secrets needed for Phase 1-2. Phase 3+ may need OAuth credentials for platform integrations.

---

*This roadmap is designed to be executed sequentially by phase, with parallelism within each phase where the dependency graph allows. Each phase produces testable, shippable artifacts. Phases 1 and 2 are the priority. Everything after is conditional on funnel performance.*
