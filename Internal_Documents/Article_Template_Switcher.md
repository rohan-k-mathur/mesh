Below is a step-by-step build checklist for B-2 “Template Switcher (Standard · Feature · Interview)” that will give you three opinionated but tweak-friendly layouts whose visual rhythm feels close to NYT / WaPo while still flowing through your Tailwind design-tokens.

0. Pre-work — lock the base design language
deliverable	notes
Type scale & grid	Pick a fluid scale (e.g. 1.125 rem major third) and a 12-col CSS grid with 72 px column + 24 px gutter for ≥1024 px; clamp to 4 cols on mobile.
Tailwind config	Extend theme (fontSize, lineHeight, spacing, colors.neutral, maxWidth) so templates can be written in utility classes only.
Content tokens	CSS custom-props: --column-width, --line-height, --measure etc. Your editor already references these—keep it.

1. Template contract & selector
step	what to code	prod check
1.1	ArticleTemplate type in TS: `{ id: 'standard'	'feature'
1.2	<TemplateSelector> pulls this array and toggles template in local state + saves to Article DB.	
1.3	articleReader.tsx & ArticleEditor wrap root <article> with className={template} so the same utility sheet drives both authoring and reading.	✓ consistent SSR/CSR

2. CSS / Tailwind blocks
Create one globally-scoped stylesheet (article.templates.css) that exposes only template-level classes; everything else can stay module-scoped.

css
Copy
Edit
/* article.templates.css */

/* ---------- STANDARD ---------- */
.standard {
  --column-width: 65ch;
  --line-height: 1.65;
}

@media (min-width:1024px){
  .standard main{
    max-width: var(--column-width);
    margin-inline: auto;
  }
}

/* ---------- FEATURE ---------- */
.feature {
  --column-width: 72ch;
  --line-height: 1.8;
}
.feature header   { @apply grid lg:grid-cols-12 gap-6 pb-10; }
.feature h1       { @apply col-span-12 lg:col-span-8 text-5xl leading-tight font-serif; }
.feature .byline  { @apply col-span-12 lg:col-span-4 text-sm uppercase tracking-wide; }

/* ---------- INTERVIEW ---------- */
.interview {
  --column-width: 60ch;
  --line-height: 1.7;
}
.interview h1   { @apply font-mono text-4xl mb-6; }
.interview .q   { @apply font-semibold; }
.interview .a   { @apply pl-4 border-l-2 border-neutral-300; }
No third-party SCSS needed; Tailwind + CSS custom properties keep it modular.

3. Hero layouts
template	behaviour
Feature	Full-bleed hero (object-cover h-[55vh] w-full lg:rounded-b-[4rem]) with optional caption overlay.
Standard	4:3 image floated above body (mx-auto max-w-2xl rounded-md).
Interview	Optional avatar pair left-aligned

Add a HeroRenderer component that receives {src, template} and spits out correct DOM.

4. Block styles inside editor & reader
Re-use .ProseMirror baseline.

Layer template overrides via .standard .ProseMirror h2 {…} etc.

Keep hover pilcrow rule scoped with .editor-shell so it never leaks.

5. Toolbar preset shortcut
Add a dropdown in <Toolbar> called “Preset” that simply sets the template field—same action as TemplateSelector but accessible while scrolling.

6. Data & migration
Prisma migration:

prisma
Copy
Edit
model Article {
  id          String   @id @default(uuid())
  title       String
  template    String   @default("standard") // ← new
  heroImageKey String? 
  ...
}
API handlers already return template; update PUT/PATCH to whitelist it.

7. QA checklist
Column width and leading actually change when toggling.

Hero image rules validated at three breakpoints.

Article with interview template renders Q/A markdown right (“Q:” bold etc.).

Accessibility: heading hierarchy & colour contrast.

Feed card thumbnails look correct for each template.

8. Next-phase hooks (after MVP)
idea	when
Per-template colour themes (CSS vars)	Sprint Polish
Auto-generate pull-quotes (LLM) for Feature	Sprint Enhance
Paywall header slot	Sprint Monetise

Action items for you today
Add template column → run migration.

Create article.templates.css; import it once in app/layout.tsx.

Implement ArticleTemplate[] array + TemplateSelector.

Move hero markup into HeroRenderer.

Verify editor toggles class live (hot reload).

Ping me once 1-4 are merged; we’ll tackle card export to feed next.
