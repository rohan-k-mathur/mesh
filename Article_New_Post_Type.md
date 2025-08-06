### Incremental add-on: **“Article” post type ↔ Mesh feed integration**

Below is a focused build plan that *extends* the SRS/road-map you already approved so the long-form Article becomes a first-class citizen inside the main social feed—exactly how the “site/portfolio” exporter currently works.
(Background principles & MVP scope are unchanged—see previous SRS.)

---

## 1 · UX flow

| Step             | Experience                                                                                           | Tech notes                                                                                |
| ---------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **1. Publish**   | Author hits **Publish** in Article editor.                                                           | Server creates `Article`, `Revision`, **generates `FeedPost` row** of type `ARTICLE`.     |
| **2. Feed card** | Card appears in global feed with hero thumbnail, title, TL;DR, author avatar, vote & comment counts. | Card component pulls from `/api/feed` which now unions `Post`, `SiteExport`, **Article**. |
| **3. Open**      | Click-through opens **modal reader** (desktop) or navigates to `/article/[slug]` (mobile).           | Use existing `Dialog` modal; SSR reader component mounted inside.                         |
| **4. Analytics** | Reads logged as `ContentViewed (article)`.                                                           | Same pipeline as SiteExport.                                                              |

---

## 2 · Data-model additions

```prisma
model FeedPost {
  id            String   @id @default(uuid())
  type          PostType // ENUM: TEXT | IMAGE | SITE | ARTICLE | …
  authorId      String
  // ↓ Article-specific
  articleId     String?  @unique
  thumbnailKey  String?  // 4:3 hero variant stored in CDN
  tldr          String?  // 280-char summary
  createdAt     DateTime @default(now())
}

enum PostType {
  TEXT
  IMAGE
  SITE
  ARTICLE
}
```

*Publishing* pipeline:

1. Generate `slug` (`kebabCase(title)` with collision suffix).
2. Run TL;DR LLM on first 800 words → store in Article and FeedPost.
3. Create 640×480 hero variant via Image CDN preset → `thumbnailKey`.

---

## 3 · Component inventory

| Component            | Responsibility                                                                                | Est.                                                               |       |
| -------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ----- |
| **`<ArticleCard>`**  | Reusable feed card. Props: `title`, `tldr`, `thumbUrl`, `author`, `stats`.                    | 0.5 d                                                              |       |
| **`<ArticleModal>`** | Wraps server-side reader component in `Dialog`; infinite-scroll body lock & deep-link backup. | 1 d                                                                |       |
| **Renderer hook**    | \`useArticleRenderer(slug                                                                     | astJson)\` returns JSX for inline modal preview (hydrated blocks). | 0.5 d |
| **Publish service**  | `POST /api/articles/:id/publish` orchestrates TL;DR, thumbnail, feed-post creation.           | 0.5 d                                                              |       |

---

## 4 · Sprint timeline adjustments

| Sprint                           | Additions                                                                                                                              |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Sprint 2 (“Polish & Social”)** | • Implement **`ArticleCard`** and **modal reader**.<br>• Feed API unions Article posts.<br>• Add `/api/articles/:id/publish` endpoint. |
| **Sprint 3**                     | • TL;DR generator (OpenAI call) & thumbnail pipeline.<br>• Voting/analytics events unify for ARTICLE type.                             |

No extra sprint needed; workload fits inside existing Social sprint.

---

## 5 · Edge-cases & safeguards

* **Hero missing** → generate blurred solid-colour card with title overlaid.
* **Long titles** → clamp to 2 lines (Tailwind `line-clamp-2`).
* **Modal routing** → push `?article=[slug]` query param so F5 ≡ full page.
* **SEO** → Feed card injects `<meta property="og:type" content="article">` etc.

---

## 6 · Next actions

1. **Backend**: extend `FeedPost` model & CRUD mutation.
2. **Frontend**: build `ArticleCard` skeleton (use `next/image` for thumb).
3. **API**: implement `/api/articles/:id/publish` (step 4 above).
4. **QA**: regression test feed scroll perf with mixed post types.

Give me the green light and I’ll draft the Jira tickets in the sprint backlog.
