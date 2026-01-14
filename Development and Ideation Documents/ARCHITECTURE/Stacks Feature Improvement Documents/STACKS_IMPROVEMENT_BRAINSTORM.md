Based on what you’ve already built and documented (Stacks/Library system + citations + evidence aggregation + “lift to debate” into deliberations)  , you’re *already* ahead of Are.na in one key dimension: **you’re not just curating knowledge, you’re turning it into structured, evidence-bearing deliberation**.

Where you’re *not* yet at parity with Are.na is mostly about the **core “content block” primitives**, **connections/reuse across collections**, and **exploration/discovery ergonomics** that make Are.na feel like a living knowledge graph (blocks ↔ channels ↔ connections, multi-channel reuse, link/text/media capture, export, etc.). Are.na’s own docs emphasize: blocks are reusable across many channels, channels can include blocks *and other channels*, and “connections” are the central action rather than likes/favorites. ([Help Are.na][1])

Below is a set of upgrades in two layers:

1. **Parity layer** (get to “feels at least as capable as Are.na for collecting/organizing/connecting”)
2. **Beyond layer** (use your deliberation + evidence stack to offer value Are.na can’t)

---

## Where you are now (strengths to keep)

From your architecture docs, you already have: stacks of PDFs (LibraryPosts), ordering, hierarchy, RBAC collaborators, subscriptions, a stack discussion thread (FeedPost-based), a polymorphic `Citation` model targeting comments/claims/arguments/etc., `Source` dedup via fingerprinting, evidence aggregation per deliberation with usage metrics + community ratings, and a “lift” pipeline that turns a stack comment into a deliberation claim.  

This is an excellent “spine.” Most improvements below should **generalize** your primitives rather than replace them.

---

## Parity with Are.na: the minimum set I’d implement

### 1) Introduce a true “Block” primitive (not just PDFs)

Are.na is fundamentally “channels made of blocks (and sometimes other channels)” and supports many content types; they also explicitly extract metadata for blocks (web page text, screenshots, image details, etc.). ([Help Are.na][1])

Right now, your main in-stack object is essentially `LibraryPost` (PDF-first). 
To reach parity, you want a **generic block system**:

* **Block types** to start:

  * `pdf` (your current LibraryPost)
  * `link` (URL block with OG metadata + screenshot + extracted readable text)
  * `text` (markdown note / snippet)
  * `image`
  * `video` (YouTube/Vimeo w/ timestamp citing)
  * `dataset` (CSV/JSON + schema preview)
  * `stack_embed` (see next section)

Implementation direction:

* Either (A) evolve `LibraryPost` into `Block` (bigger migration), or (B) create `Block` and treat PDFs as one block subtype that references your existing storage + pages/thumbnails.
* Make `Source` optionally point to a `blockId` (not just `libraryPostId`), because a “source” could be a PDF, a link, a dataset, etc. 

**Why it matters for parity:** Are.na feels fluid because you can mix text, links, images, and files in one channel and the system “understands” them. ([Are.na][2])

---

### 2) Add “connections”: blocks reusable across *multiple* stacks

This is *the* biggest Are.na parity gap.

Are.na blocks can be connected to an “infinite number of channels,” and “connections” are the primary action. ([Help Are.na][1])

Your current modeling strongly implies a LibraryPost belongs to one stack (`stack_id`) and you store ordering as an array on Stack. 
That makes “connect this thing to multiple stacks” awkward.

**Recommended schema move (high leverage): replace `Stack.order: string[]` with a join table**:

```prisma
model StackItem {
  id        String   @id @default(cuid())
  stackId   String
  blockId   String          // or libraryPostId during transition
  position  Float           // or Int; Float makes inserts cheaper
  addedById BigInt
  createdAt DateTime @default(now())

  stack Stack @relation(fields: [stackId], references: [id], onDelete: Cascade)
  // block Block @relation(...)
  @@unique([stackId, blockId])
  @@index([stackId, position])
}
```

Benefits:

* One block can appear in many stacks (Are.na-like).
* Reordering is cheap and concurrency-safe (no rewriting a whole array).
* You can attach per-connection metadata later (who added it, when, why).

**Product/UI implications**:

* Add a global “Connect” action everywhere (on blocks, sources, feed cards, search results).
* Add a “Connected in X stacks” indicator and a “Contexts” panel (list stacks it appears in), mirroring Are.na’s “connections” concept. ([Help Are.na][3])

---

### 3) Let stacks contain other stacks *as items* (not just parent/child folders)

Are.na channels can contain “blocks but also sometimes other channels.” ([Help Are.na][4])

You currently have `parent_id` for hierarchical stacks (folder-like). 
That’s not the same as **embedding** a stack inside another stack as a curated item (the Are.na “channel inside channel” feel).

With `StackItem`, support:

* `StackItem.kind = block | stack`
* If `kind=stack`, then it references another stack id (embedded channel)

This unlocks:

* “Reader’s guides” that embed sub-stacks as modules
* Topic hubs that aggregate many sub-collections

---

### 4) Expand visibility modes to match “open / closed / private”

Are.na channels can be public/open, closed (viewable but only collaborators can add), and private. ([Are.na][5])

Right now you have `is_public` plus collaborators/subscribers. 
To reach parity, I’d add:

```ts
visibility: "public_open" | "public_closed" | "private" | "unlisted"
```

* **public_open**: anyone can view + connect/add blocks (spam risk → add moderation tools)
* **public_closed**: anyone can view; only owner/collaborators can add
* **private**: only collaborators can view/add
* **unlisted**: link-access but not discoverable

This alone will make the platform feel much closer to Are.na’s sharing model. ([Are.na][5])

---

### 5) Export / download stacks in multiple formats

Are.na explicitly supports downloading/exporting channel contents, and mentions export formats (PDF/ZIP/HTML) in their plan descriptions and channel settings docs. ([Help Are.na][6])

You should implement exports that match your domain:

* **Stack export as ZIP**:

  * included files (PDFs, images)
  * `manifest.json` (metadata, ordering, sources)
* **Stack export as Markdown**:

  * one markdown file per block (or per stack)
  * stable permalinks back to platform items
* **Bibliography export**:

  * BibTeX, CSL-JSON, RIS for all `Source`s referenced in the stack and/or deliberation

This is both parity *and* an adoption driver (“I can leave at any time”).

---

### 6) Provide a developer API surface (even if minimal at first)

Are.na has a public API for channels/blocks/search. ([Are.na][7])

Even a small API helps power users embed and automate:

* `GET /api/public/stacks/:slug` (stack metadata + items)
* `GET /api/public/blocks/:id`
* `GET /api/public/blocks/:id/contexts` (stacks it’s connected to)
* `GET /api/public/search?q=...`

Add:

* API keys + rate limiting
* “embed widgets” built on top of the API (stack preview, evidence list embed)

---

## Beyond Are.na: features that become uniquely valuable on your platform

This is where you should lean into what you already have: citations, sources, evidence aggregation, and deliberation integration. 

### 7) Make citations *addressable and navigable* (anchor to exact evidence)

Right now a `Citation` can store `locator`, `quote`, `note`, but it’s not guaranteed to deep-link into a PDF selection/highlight. 

Upgrade path:

* Add `citation.anchor` that can reference:

  * `annotationId` (for PDFs)
  * `textRange` (for web captures)
  * `timestamp` (for video/audio)
* In the viewer, clicking a citation should:

  * open the PDF
  * jump to page
  * highlight the exact region
  * show the quote + note in-context

This turns citations into *executable references* rather than decorative badges.

**Quick win**: when citing from a PDF viewer, auto-fill:

* page number → locator (`p. 13`)
* selected text → quote
* optional highlight creation → annotation

---

### 8) Copy citations automatically when “lifting” comments into claims

Your current lift route creates a Claim + a DialogueMove for provenance, but your docs don’t show citations being migrated from the comment to the new claim. 

This is a huge opportunity: the “lift” should carry evidence forward.

Implementation:

* On lift:

  * fetch citations where `targetType="comment"` and `targetId=commentId`
  * create equivalent citations for `targetType="claim"` and `targetId=newClaimId`
  * optionally preserve a `liftedFromCitationId` field if you want traceability

Result:

* Users experience: “I argued with sources in the stack; when it becomes a claim, the evidence is already there.”

That’s a *signature* “deliberative knowledge” feature.

---

### 9) Add evidence semantics: not all citations “support”

Are.na doesn’t care whether a block supports/refutes—it’s a moodboard/knowledge collection tool. You can go beyond by making evidence **typed**.

Add a field like:

```ts
citation.intent: "supports" | "refutes" | "context" | "defines" | "method" | "background"
```

Then in deliberation views:

* Show **pro-evidence vs counter-evidence** per claim
* Compute “evidence balance”
* Encourage users to add missing counterevidence (epistemic hygiene)

This moves you toward “argument mapping” without forcing rigid structure.

---

### 10) Evidence health metrics (deliberation-level and claim-level)

You already compute:

* usageCount
* unique users
* average rating
* usedInArguments vs usedInClaims 

Go further with “Evidence Health” scores, e.g.:

* **Diversity**: are all citations the same source?
* **Freshness**: median publication year / last accessed date
* **Primary-vs-secondary mix**: dataset/primary research vs commentary
* **Link-rot risk**: verified/archived status coverage
* **Disagreement coverage**: presence of refuting citations

Surface it as:

* a small badge on deliberations (“Evidence: strong / mixed / weak”)
* an explainer panel so it doesn’t feel like a black-box score

---

### 11) Source verification + archiving as a first-class workflow

Your `Source` model already anticipates `archiveUrl` and `accessedAt`. 
Make it real:

* On source creation/attach:

  * fetch and store HTTP status
  * follow redirects and store canonical final URL
  * optionally auto-create an archive snapshot (Wayback/perma.cc style)
* Nightly job:

  * re-verify popular sources
  * flag broken links in evidence lists
* UI:

  * “Verified ✅ / Unverified ⚠️ / Broken ❌”
  * “Archived ✅” badge with link

This is one of those “trust infrastructure” features that makes a deliberation platform meaningfully better than collection platforms.

---

### 12) Reputation-weighted, multi-dimensional source assessment

A single 1–10 rating is a good start. 
But you can produce much more useful signals with **structured review**:

Let users optionally rate dimensions:

* methodological rigor
* relevance to claim
* bias / conflicts
* clarity
* primary-ness (primary data vs commentary)

Then compute:

* overall score (with transparency)
* disagreement variance (controversial sources stand out)

Add lightweight friction:

* require a one-sentence rationale for extreme scores (1–2, 9–10)

This is a serious differentiator for “evidence commons” behavior.

---

## Architecture and safety upgrades that will matter sooner than you think

### 13) Don’t leak private content via public thumbnails

Your spec describes thumbnails stored in a public bucket (`pdf-thumbs`) while PDFs are private (signed URLs). 

If a stack is private, a public thumbnail can still leak page content.

Fix options:

* Store thumbs in a private bucket too, and sign them like PDFs
* Or generate “blurred/obscured” thumbs for private stacks
* Or separate thumbs by visibility (public thumbs only for public stacks)

This is one of those “small now, catastrophic later” issues.

---

### 14) Background processing pipeline for extraction (text, metadata, embeddings)

You already hint at server-side thumbnail fallback + `/api/library/status`.
To unlock search + “beyond” features, formalize a job system:

* `BlockProcessingStatus`: queued/running/failed/done
* jobs:

  * PDF text extraction (and OCR when needed)
  * metadata enrichment (DOI/Crossref style enrichment)
  * web capture text + screenshot
  * embedding generation (for semantic search)

This will also make “import from Zotero” truly powerful. 

---

## A practical build order (so it doesn’t sprawl)

### Phase 1: Are.na parity “feel”

1. `StackItem` join table + multi-stack connections
2. Block types: link + text (in addition to PDF)
3. “Connect” UI + contexts panel
4. Visibility modes (open/closed/private/unlisted)
5. Export (ZIP + JSON + bibliography)

### Phase 2: Evidence UX becomes magical

1. Citation anchors (PDF selection → locator/quote/annotation)
2. Lift copies citations from comment → claim
3. Citation intent (“supports/refutes/context…”)
4. Evidence list upgrades (filters by intent/type/year)

### Phase 3: Unique moat

1. Verification + archiving
2. Evidence health metrics
3. Multi-dimensional source reviews + reputation weighting
4. Knowledge graph view across stacks ↔ sources ↔ claims ↔ deliberations

---

## If you implement only 3 things next

If you want the highest-leverage moves that quickly get you “Are.na + more”:

1. **Replace `Stack.order[]` with `StackItem` and enable multi-stack connections** (this unlocks the whole “connect” mental model). ([Are.na][8])
2. **Add link + text blocks with metadata extraction** (so stacks aren’t PDF-only). ([Help Are.na][1])
3. **Make lift carry citations forward + add citation anchors** (so your deliberation engine inherits evidence seamlessly). 

If you want, I can also sketch:

* a concrete Prisma migration plan (minimal downtime) from `Stack.order[] + LibraryPost.stack_id` → `StackItem`,
* and a “Connect modal” UX flow that matches Are.na’s simplicity but stays consistent with your cite/evidence flows.

[1]: https://help.are.na/docs/getting-started/blocks?utm_source=chatgpt.com "Blocks"
[2]: https://www.are.na/about?utm_source=chatgpt.com "About"
[3]: https://help.are.na/docs/getting-started/connections?utm_source=chatgpt.com "Connections"
[4]: https://help.are.na/docs/getting-started/channels?utm_source=chatgpt.com "Channels"
[5]: https://dev.are.na/documentation/channels?utm_source=chatgpt.com "Channels - Are.na"
[6]: https://help.are.na/docs/getting-started/channels/settings-and-export?utm_source=chatgpt.com "Settings and export"
[7]: https://dev.are.na/documentation?utm_source=chatgpt.com "API - dev.are.na"
[8]: https://dev.are.na/documentation/blocks?utm_source=chatgpt.com "id GET /v2/blocks - Channels - Are.na"
