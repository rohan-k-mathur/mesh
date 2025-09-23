Below is a **two‑part deliverable**:

1. **Updated product roadmap** – folds **Canonical Quotes, Dynamic TL;DR, and E‑ink/Offline mode** into a four‑sprint plan.
2. **Task‑packet playbook** – 14 Codex‑ready packets that walk engineering from zero → GA, including the three new capabilities.
   *Copy–paste one packet at a time into Codex with the prompt template provided.*

---

## 1 · Updated 4‑Sprint Roadmap (8 weeks)

| Sprint                                             | Key themes & goals              | Major deliverables                                                                                                                                                                          |
| -------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sprint 1 – Foundations** (Week 1‑2)              | Data & basic authoring          | DB schema, CRUD APIs, minimal TipTap editor, draft autosave, SSR renderer.                                                                                                                  |
| **Sprint 2 – Polish & Social** (Week 3‑4)          | Templates & community           | Hero upload, three templates, pull‑quotes, up‑vote/comment integration, accessibility linter, basic analytics.                                                                              |
| **Sprint 3 – Collaboration & Citation** (Week 5‑6) | Co‑authoring + Canonical Quotes | CRDT live cursors & suggestion mode, highlight‑to‑comment, Canonical Quote block w/ hover preview & backlink graph, scroll‑depth & read‑time analytics.                                     |
| **Sprint 4 – Reader Delight** (Week 7‑8)           | AI & offline goodness           | Dynamic TL;DR generator stored in metadata; One‑tap Send‑to‑Kindle export (E‑ink mode) with presigned link; progressive‑web‑app offline cache so articles open with no network. |

**Success KPIs**

| Launch (W8) target                             |
| ---------------------------------------------- |
| ≥ 50 public articles                           |
| Avg read‑time ≥ 120 s                          |
| ≥ 30 % articles use Canonical Quotes           |
| ≥ 40 % readers open TL;DR; ≥ 5 % download EPUB |

---

## 2 · Task‑Packet Playbook (Codex‑friendly chunks)

> **Prompt template for Codex**
> “You are working in the Mesh monorepo. Implement everything in **PACKET \<n>** exactly. When finished, reply *only* with the list of changed files.”

### PACKET 0 · Prep & dependencies (15 min)

| Action                                                                                                                                                     |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `git checkout -b feature/article-post-type`                                                                                                                |
| `pnpm add -w @tiptap/react @tiptap/starter-kit zod dompurify slate-preview archiver @aws-sdk/client-ses @aws-sdk/client-s3 @aws-sdk/client-sesv2` |
| Add envs to `.env.example`: `AWS_SES_REGION`, `KINDLE_SENDER`, `KINDLE_ADDRESS`, `OPENAI_API_KEY` (for TL;DR).                                             |

---

### PACKET 1 · Schema & APIs (45 min)

| File(s)                                   | Steps                                               | Acceptance |
| ----------------------------------------- | --------------------------------------------------- | ---------- |
| `prisma/schema.prisma`                    | Add `Article`, `Revision` models (see SRS).         |            |
| `pages/api/articles/index.ts` & `[id].ts` | REST CRUD (+ basic auth).                           |            |
| Migration & unit tests.                   | `POST /api/articles` returns 201 id; DB row exists. |            |

---

### PACKET 2 · Minimal Editor (60 min)

| File(s)                                    | Steps                                                                    |
| ------------------------------------------ | ------------------------------------------------------------------------ |
| `components/article/Editor.tsx`            | TipTap init with StarterKit, image upload extension, Markdown shortcuts. |
| Autosave hook → `/api/articles/:id/draft`. |                                                                          |
| Route `app/article/new` renders editor.    |                                                                          |

*Accept:* Can create draft, refresh, content persists.

---

### PACKET 3 · SSR Renderer (40 min)

| File(s)                       | Steps                                                                           |
| ----------------------------- | ------------------------------------------------------------------------------- |
| `app/article/[slug]/page.tsx` | Load article, convert AST → HTML blocks, apply typography CSS (`article.scss`). |

*Accept:* Published article shows basic paragraph & heading.

---

### PACKET 4 · Templates & Hero (50 min)

| Steps                                          |
| ---------------------------------------------- |
| Implement hero image uploader (S3 presign).    |
| Add template selector; store `template` field. |
| CSS for “Standard”, “Feature”, “Interview”.    |

*Accept:* Switching template updates preview live.

---

### PACKET 5 · Social & Linter (45 min)

| Steps                                                                                               |
| --------------------------------------------------------------------------------------------------- |
| Inject existing up‑vote/comment components under article body.                                      |
| Add accessibility linter endpoint (`/api/articles/:id/lint`) using axe‑core; block publish if fail. |

*Accept:* Linter errors show modal; publish disabled until resolved.

---

### PACKET 6 · Analytics v0 (35 min)

| Steps                                                  |
| ------------------------------------------------------ |
| Fire `article_read` event on scroll > 25 %.            |
| Back‑end counter increment (`reads`, `uniqueReaders`). |
| Author dashboard component.                            |

*Accept:* Stats increment when article viewed in incognito.

---

### PACKET 7 · Collaboration (CRDT) (75 min)

| Steps                                                    |
| -------------------------------------------------------- |
| Integrate existing Yjs provider; `/ws/article/:id` room. |
| Show co‑author cursors.                                  |
| Suggestion mode toggle, accept/reject buttons.           |

*Accept:* Two browsers edit same article, see cursors.

---

### PACKET 8 · Canonical Quote block (70 min)

| File(s)                                                                                                                   | Steps                                                                                           | Acceptance |
| ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------- |
| `Editor`                                                                                                                  | Slash‑command `/quote` opens article search modal; author picks block to embed.                 |            |
| Store embed as `{type:'quote', targetArticleId, blockId}` in AST.                                                         |                                                                                                 |            |
| `Renderer`                                                                                                                | On hover, fetch target article fragment, show tooltip card; inside card link “Read full”.       |            |
| Backlink service: On publish, write row `{sourceId,targetId}` to `article_citations` table. GraphQL query for “cited by”. | • Quote renders; hover preview works.<br>• Visiting target article shows “Cited by 3 articles”. |            |

---

### PACKET 9 · Read‑depth Analytics & Scroll Heatmap (40 min)

| Steps                                                              |
| ------------------------------------------------------------------ |
| Add IntersectionObserver checkpoints 10 % increments; store array. |
| Author dashboard shows heatmap bar.                                |

---

### PACKET 10 · Dynamic TL;DR (45 min)

| File(s)                                       | Steps                                                                                                               |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `workers/tldrGenerator.ts`                    | On publish, call OpenAI `/chat/completions` prompt: “Summarise in 3 sentences, ≤100 words”. Save to `article.tldr`. |
| Renderer: show collapsible TL;DR pill at top. |                                                                                                                     |

*Accept:* Pill appears; open shows ≤100 words.

---

### PACKET 11 · E‑ink / Offline export (80 min)

| Steps                                                                                                                                           |
| ----------------------------------------------------------------------------------------------------------------------------------------------- |

| “Send to Kindle” button: invokes SES `SendEmail` from `KINDLE_SENDER` to `KINDLE_ADDRESS` with EPUB as attachment.                              |
| Add ServiceWorker caching strategy for offline reading (`workbox`) – cache published article assets + JSON.                                     |

*Accept:* Clicking “Send to Kindle” email arrives; device syncs; offline mode loads article w/ Wi‑Fi off.

---

### PACKET 12 · PWA polish & SEO microdata (30 min)

| Steps                                                                    |
| ------------------------------------------------------------------------ |
| Add `<link rel="canonical">`, schema.org Article LD‑JSON.                |
| Update manifest icons; enable “Add to Home Screen” prompt after 3 opens. |

---

### PACKET 13 · Monitoring & alerting (25 min)

| Steps                                                            |
| ---------------------------------------------------------------- |
| Metrics: publish latency, TL;DR API failures, export queue size. |
| CloudWatch alarms → Slack channel.                               |

---

### PACKET 14 · Docs, tests & launch toggle (60 min)

| Steps                                                                                 |
| ------------------------------------------------------------------------------------- |
| Vitest for block serializers, quote hover; Playwright end‑to‑end create‑publish‑read. |
| Docs in `/docs/article.md` (author guide, API).                                       |
| Feature flag `ARTICLE_PUBLIC_LAUNCH` in admin panel.                                  |

---

**Total engineering time**: \~ 8 weeks for one feature squad (2 dev, 1 designer, shared QA).
Features are **incremental**—stop after Packet 8 for a solid public MVP if schedule tight; Packets 9‑11 provide the “delight moments” that make Mesh’s Article type stand out.

---

### Ready to roll?

Copy **PACKET 0** into Codex and start the branch.
Ping me whenever you need deeper dives (e.g., TL;DR prompt tuning, EPUB styling, citation‑graph visualisation).
