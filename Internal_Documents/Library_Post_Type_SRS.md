Below is a structured brainstorming + implementation roadmap for the **Library Post Type** (LPT).  It is organized so you can move straight from concept to tickets in your issue tracker.

---

## 1 · Product Vision & Principles

| Principle                                   | Practical Implication for LPT                                                                                                |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Rabbit‑hole friendly**                    | Minimal friction to open, save, and reorganize PDFs; deep‑link anywhere inside a PDF or Stack.                               |
| **“Save something when you see something”** | One‑click clipping to personal or shared Stacks from any post, DM, or external URL (via browser extension / share sheet).    |
| **Creativity = connecting things**          | Robust cross‑linking: PDFs → Posts, Stacks → Nodes in Mesh graphs, annotations → comments.                                   |
| **No algorithmic bait**                     | Chronological surfacing inside a user’s Library feed; discovery powered by explicit follows/tags rather than opaque ranking. |

---

## 2 · User‑Facing Feature Set (MVP → V2)

| Slice                    | MVP (4–6 weeks)                                                                              | V1 (8–12 weeks)                                                          | V2 / Patron‑only (Post‑launch)                                                                                                         |
| ------------------------ | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Upload & Storage**     | Drag‑and‑drop PDF (single or multi‑select). Max 50 MB each. Background upload with progress. | Bulk CSV/ZIP import; email‑to‑Stack ingestion bot.                       | Direct import from Google Drive / Dropbox.                                                                                             |
| **Preview & Rendering**  | Generate first‑page thumbnail server‑side; lazy‑load full PDF via **PDF.js** only on click.  | Per‑page thumbs (for fast skim) stored in S3, CloudFront cached.         | AI‑generated abstract & semantic outline preview.                                                                                      |
| **Postcard Display**     | Size = 1 → static cover image; click expands inline PDF viewer.                              | Size = 2‑10 → swipeable carousel (re‑use Gallery component).             | Size > 10 (Patron) → postcard shows collage of 4 random covers + “View Stack (#)”; opens modal > dedicated Stack page in bento layout. |
| **Stacks (Collections)** | Manual drag‑to‑reorder; public / private toggle.                                             | Nested Stacks (sub‑folders); collaborative Stacks with role‑based perms. | Version history; branch+merge (“fork this Stack”).                                                                                     |
| **Annotations**          | Highlight + margin note at page‑level (private).                                             | Shareable annotations; @mentions; inline reactions.                      | AI summarizer that rolls up highlights into digestible notes.                                                                          |
| **Tags & Search**        | Free‑form tags; tag suggestion drop‑down.                                                    | Faceted search (tag, author, title, uploader).                           | “Concept graphs” – visualize tag co‑occurrence across your Stacks.                                                                     |
| **Social Hooks**         | Like, comment, repost to your feed.                                                          | “Add to my Stack” one‑tap from another user’s post.                      | Paid patron‑only “curator badges” that surface their Stacks platform‑wide.                                                             |

---

## 3 · System Architecture Highlights

1. **Storage**

   * Original PDFs → S3 (+ Glacier tiering for cold files).
   * Thumbnails / per‑page PNGs → separate S3 bucket with aggressive CloudFront edge caching.
   * Metadata + relations → Postgres (existing Mesh DB); full‑text extracted contents → OpenSearch cluster for search.

2. **Rendering Pipeline**

   1. User uploads → Lambda triggered.
   2. Lambda calls **pdf2png** to get first page; pushes job to ECS Fargate workers to create remaining page images if needed (≤10 pages for non‑Patrons).
   3. Metadata extractor (title, author, page count) writes to DB; text layer pushed to OpenSearch.

3. **API Design (GraphQL)**

   * `createLibraryPost(input: {files, stackId?, visibility})`
   * `addToStack(stackId, postId[])`
   * `annotatePdf(postId, page, rect, text)`
   * `listStacks(userId, filter)`
   * `generatePreview(postId, size)` – returns signed CloudFront URL.

4. **Client Rendering**

   * Use **React‑PDF** (built on PDF.js) with `onViewportEnter` hook so full PDF loads only when modal is visible.
   * Carousel re‑uses existing `GalleryCarousel` component with minor prop additions.
   * Bento layout page uses CSS grid with lazy load sentinel per tile.

---

## 4 · Data Model Snippets (Simplified)

```prisma
model LibraryPost {
  id            String   @id @default(cuid())
  uploaderId    String   @index
  stackId       String?  @index
  title         String?
  pageCount     Int
  fileUrl       String
  thumbUrls     String[] // key per page, first index 0 = cover
  tags          Tag[]    @relation(references: [id])
  createdAt     DateTime @default(now())
  annotations   Annotation[]
}

model Stack {
  id          String   @id @default(cuid())
  ownerId     String
  name        String
  description String?
  isPublic    Boolean  @default(false)
  order       String[] // array of LibraryPost ids
  createdAt   DateTime @default(now())
  parentId    String?
}

model Annotation {
  id         String   @id @default(cuid())
  postId     String   @index
  page       Int
  rect       Json     // {x,y,w,h}
  text       String
  authorId   String
  createdAt  DateTime @default(now())
}
```

---

## 5 · UX & Interaction Notes

* **Micro‑copy**: emphasize “Save breadcrumbs now, follow the thread later.”
* **Empty‑state** after first upload: show quick‑tips GIF on tagging & stacking.
* **Progressive disclosure**: Patron‑only UI affordances hidden until upsell context (“Need bigger Stacks? Unlock Patron”).
* **Keyboard navigation** inside modal: ⬆/⬇ page scroll, ⬅/➡ switch item in Stack.
* **Accessibility**: alt text auto‑generated from PDF title; focus‑trap within modal.

---

## 6 · Performance & Observability

| Concern                 | Strategy                                                                                                                                      |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| First paint of carousel | Serve pre‑generated 400 px thumbs ≤ 100 KB each.                                                                                              |
| Large PDF viewer jank   | Use `pdfjs-dist/legacy/build/pdf.worker.min.js` loaded via dynamic `import()` only inside modal.                                              |
| Search latency          | Warm OpenSearch indexes nightly; shard by userId prefix to localize queries.                                                                  |
| Metrics                 | **Core**: daily uploads, Stack creations, annotation count, time‑to‑first‑open. **Quality**: % of thumbnails generated < 5 s, modal load p95. |
| Alerts                  | SLO: 99 % thumbnail generation success within 30 s; PagerDuty on failure.                                                                     |

---

## 7 · Security & Compliance

* **Doc sanitization**: run PDFs through `qpdf --sanitize` to strip embedded JS.
* Signed, time‑boxed URLs for every download.
* Patron originals optionally encrypted at rest with KMS customer keys.
* GDPR: allow “Export my Library” endpoint (JSON + ZIP of PDFs and annotations).

---

## 8 · Commercial Levers (Patron Tier)

| Feature                              | Rationale                            |
| ------------------------------------ | ------------------------------------ |
| >10‑item Stacks & Bento page         | Power‑users, educators, researchers. |
| AI summaries & concept graphs        | High perceived value, compute heavy. |
| Unlimited per‑page thumbnails        | Offloads infra cost to paying tier.  |
| Advanced permissions (team curators) | Appeals to studios / collectives.    |

Pricing suggestion: \$8 / mo or bundle into existing Patron plan; run A/B on price elasticity.

---

## 9 · Delivery Timeline (Draft)

| Week | Engineering                                    | Design                              | GTM / Ops                                     |
| ---- | ---------------------------------------------- | ----------------------------------- | --------------------------------------------- |
| 0    | Finalize spec, DB migrations scaffold          | Wireframes for three postcard sizes | Blog teaser post (“Follow your rabbit holes”) |
| 1–2  | Upload API, S3 wiring, Lambda thumbnailer      | Postcard & carousel hi‑fi           | Determine Patron upsell copy                  |
| 3–4  | Modal viewer with annotations (local only)     | Annotation UI polish                | Prep educational docs / tutorial              |
| 5    | Stacks CRUD, ordering                          | Stack page desktop + mobile         | Beta invite to 100 creators                   |
| 6    | Search, tag filters                            | ✦ design freeze ✦                   | Collect beta feedback                         |
| 7–8  | Perf hardening, analytics hooks                | Empty‑state animations              | Full launch; in‑app onboarding                |
| 9+   | Patron‑tier features, AI summary, integrations | Iterate on bento postcard           | Paid acquisition, developer outreach          |

---

## 10 · Open Questions / Next Steps

1. **Annotation portability** – export to standard (e.g., PDF XFDF) for outside‑Mesh use?
2. **Public vs. Private intellectual property** – allow remix under CC licenses?
3. **External embed** – can a Stack be embedded in blogs with an iframe snippet?
4. **Mobile offline mode** – cache last N pages for reading on the subway?

Schedule a 90‑minute workshop to resolve these, then lock scope for MVP.

---

### Remember

The LPT is not a growth hack; it’s an invitation to **curate, connect, and wander**.  Ship a tight, performant core first, then layer in the rabbit‑hole magic.
