Below is a complete Software Requirements Specification (SRS) for the new Mesh “Article” post type, followed by a three‑sprint implementation roadmap.
You can paste the SRS directly into your /docs/specs/article‑post‑type.md and import the roadmap into your product‑board or Jira/Linear as epics → stories.

1 · Software Requirements Specification (SRS)
1.1 Purpose
Enable Mesh users to create, publish, and consume visually polished, long‑form text posts (“Articles”) that combine professional typography/layout with the social dynamics of Mesh (votes, comments, remix). Unlike Medium/Substack, Articles are non‑paywalled, non‑click‑bait, and collaborative by design.

1.2 Scope
In scope: Editor UI, block rendering pipeline, article storage & delivery, social interactions, analytics to author, accessibility conformance, exportability.

Out of scope (v1): Paid subscriptions, ad insertion, on‑device PDF/EPUB generation, multi‑language translations.

1.3 Definitions
Term	Meaning
Block	Atomic content unit (paragraph, heading, image, video, pull‑quote, code, call‑out, footnote).
Template	Pre‑configured block arrangement + typography settings.
Article AST	JSON representation of ordered blocks with attributes.
Revision	Immutable snapshot of Article AST at save time.
TL;DR	AI‑generated 3‑sentence summary stored with article.

1.4 References
Mesh UI guidelines v2.1

WCAG 2.1 AA accessibility standard

Slate.js editor docs (if using Slate) / TipTap if alternative adopted

Existing Mesh analytics event schema (ContentViewed, ContentInteracted)

2 · Stakeholders
Role	Interests
Authors (primary)	Express ideas in polished format without HTML/CSS; monitor reach.
Readers	Read long‑form comfortably on any device; highlight & discuss.
Moderators	Flag misinfo / policy violations efficiently.
Mesh Product	Increased session quality metric (≥ 2 min average read time).
Design/Brand	Showcase Mesh’s aesthetic superiority.

3 · User personas & stories (abridged)
Alex (Journalist)

“I want my 3 k‑word investigation to look as good as an NYT piece and spark debate without asking people to subscribe.”

Jamie (Technical blogger)

“I need syntax‑highlighted code blocks and inline LaTeX, plus comments right next to the lines readers care about.”

Sam (Casual reader)

“If the article is long I want a quick summary and a pleasant reading mode on mobile.”

Priya (Editor)

“I’m co‑authoring; we should both edit in real time and see suggestions.”

4 · Functional requirements (FR)
ID	Requirement
FR‑01	Provide WYSIWYG block editor with keyboard Markdown shortcuts and slash‑command insertion (/image, /quote).
FR‑02	Offer at least 3 default templates (Standard, Feature, Interview) switchable any time.
FR‑03	Support blocks: paragraph, H1‑H3, bulleted/numbered list, image (with caption/crop), video, code (language‑aware), pull‑quote, call‑out, footnote, inline LaTeX.
FR‑04	Auto‑save drafts every 10 s or on block change; display “saved” indicator.
FR‑05	Publishing workflow: Draft → Preview → Publish; each action creates a Revision.
FR‑06	Render published article responsively with: 100 %‑width hero, 60 – 70 ch line length, 1.6 line height, drop‑cap optional, embedded media lazy‑loaded.
FR‑07	Article page integrates Mesh social: up‑vote, comment thread, highlight‑to‑comment.
FR‑08	Provide inline collaborative suggestions and co‑author cursors (based on existing CRDT/canvas infra).
FR‑09	Analytics panel: total reads, unique readers, avg read time, scroll‑depth quartiles.
FR‑10	Authors can export article as article_<slug>.html and Article AST JSON.
FR‑11	Accessibility checker before publish: heading structure, alt‑text presence, colour‑contrast on pull‑quotes, ARIA landmarks.
FR‑12	REST/GraphQL endpoints for CRUD (/api/articles, /api/articles/:id/blocks, /api/articles/:id/revisions).

5 · Non‑functional requirements (NFR)
Category	Target
Performance	LCP < 2 s on 4G for article <5 MB; CLS < 0.1
SEO	Proper <article> semantics, canonical URL, OpenGraph tags (even though SEO isn’t main goal).
Accessibility	WCAG 2.1 AA verified via axe‑core CI gate.
Security	XSS sanitisation of user HTML (DOMPurify), CSP headers.
Scalability	Support 10 k concurrent article readers at 200 ms p95 TTFB (edge cache).
Reliability	Draft auto‑save must survive client crash (localStorage backup).

6 · System design (overview)
6.1 Data model (Prisma)
prisma
Copy
model Article {
  id            String   @id @default(uuid())
  authorId      String
  title         String
  slug          String   @unique
  heroImageKey  String?
  template      String   @default("standard")
  astJson       Json     // current published version
  status        ArticleStatus @default(DRAFT)
  revisions     Revision[]
  analytics     Json?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Revision {
  id        String   @id @default(uuid())
  articleId String
  astJson   Json
  createdAt DateTime @default(now())
}
6.2 Services
Article Editor UI – React/TipTap (or Slate) using Mesh design system.

Media Service – existing S3 + image CDN pipeline (adds hero art‑direction presets).

Article Renderer – Server component that converts AST → hydrated blocks.

Analytics Collector – existing Mixpanel/PostHog events extended with articleId.

Accessibility Linter – Node CLI wrapped inside /api/articles/:id/publish.

7 · External interface requirements
Interface	Spec
REST	POST /api/articles -> 201 + articleId; PATCH /api/articles/:id etc.
GraphQL	Type Article with fields matching model; mutations publishArticle, createRevision.
WS channel	/ws/article/:id for collaborative editing cursors / suggestions.

8 · Constraints & assumptions
Existing Mesh auth & roles apply (author needs WRITE in room).

Editor will reuse TipTap v2 already shipped for Room Canvas comments.

Image CDN is Cloudflare Images → no change to infra.

Feature must launch in web; native mobile editor deferred.

9 · Acceptance criteria (MVP)
Author can publish an article with at least 3 block types and a hero image.

Reader sees responsive rendering on viewport ≥320 px.

Up‑vote & comment interact work as for any Mesh post.

Article passes built‑in accessibility linter (all checks green).

Analytics dashboard shows non‑zero stats after reads.

10 · Risks & mitigation
Risk	Probability	Impact	Plan
Over‑engineering the editor	M	H	Start with limited block set; gather feedback.
Storage bloat (large hero images)	M	M	Enforce 5 MB/image, run CDN transforms.
Moderation load	L	M	Integrate article flag pipeline day‑one.

2 · Three‑Sprint Implementation Roadmap (6 weeks total)
Sprint	Duration	Goals & deliverables
Sprint 1 – “Foundations”	Week 1–2	Back‑end & minimal editor
• DB migrations (Article, Revision).
• REST/GraphQL CRUD endpoints.
• Basic TipTap editor with paragraph, headings, image, code.
• Draft autosave to DB & localStorage.
• /article/:slug SSR renderer with basic typography.
Sprint 2 – “Polish & Social”	Week 3–4	Templates + social integration
• Add hero upload w/ crop & CDN.
• Template switcher (Standard, Feature, Interview).
• Pull‑quote, call‑out, list blocks.
• Up‑vote, comment, share card in global feed.
• Accessibility linter pass/fail on publish.
• Initial analytics (reads, uniques).
Sprint 3 – “Collab & Analytics”	Week 5–6	Collaboration & insights
• Real‑time cursors & suggestion mode (CRDT sync).
• Highlight‑to‑comment inline.
• Scroll‑depth analytics & TL;DR generator.
• Export (HTML + AST JSON).
• Public launch toggle in admin panel; marketing blog post.

Milestones & KPIs
Date	Milestone	KPI (success threshold)
End Week 2	Internal dog‑food demo	≥3 team members publish test article
End Week 4	Private beta (invite authors)	Avg read time ≥90 s across beta content
End Week 6	Public launch	50+ public articles; 1 k unique readers; LCP <2 s p95

Next steps
Product owner: create Jira epics “Article Foundations”, “Article Social”, “Article Collaboration”.

Design: deliver Figma spec for templates by Day 3 of Sprint 1.

Engineering: spin up article‑feature branch; seed sample NYT‑style article to verify typography.

QA: define accessibility test cases using axe‑core.

When you’re ready, I can generate the task‑packet playbook (à la Room Shards) that breaks these sprints into codex‑friendly chunks.
