# Commonplace Design Language

A working document. The goal here is not visual identity in the brand sense — it is to articulate a **set of architectural commitments at the level of the interface** that follow from what Commonplace is, and to give every future styling decision a place to be checked against.

This document is the inverse of [docs/GLASS_MORPHISM_DESIGN_SYSTEM.md](docs/GLASS_MORPHISM_DESIGN_SYSTEM.md), the design system written for Mesh / Isonomia. The Mesh system is the right system for what Mesh is: deliberative, multi-participant, dashboard-shaped, motion-rich, "luminous darkness." Commonplace is none of those things, and asking it to wear that aesthetic would falsify it. The two systems share the same standard of care; almost nothing else.

---

## 1. What the interface has to do

The reference document is `Commonplace: the memory-infrastructure.md`. The relevant claims, condensed:

- The archive is **a site of sustained practice**, not a database. Its value is in the formative work it makes possible across years, not in retrieval efficiency.
- The practice is **fundamentally solitary**. There is no audience. There is no collaborator. There is no notification.
- **Temporal depth is primary**, not metadata. The archive's structure is its development across time, not a current state with timestamps attached.
- **Genre is structural**, not a tag. Excerpt, observation, meditation, dialogue, letter, list — each is a different formal object with different affordances.
- **Revision is the work**, not a backup mechanism. The earlier self is not overwritten by the later self; both remain in the archive in conversation.
- **The physical-digital relation is real**. The interface is one register of a practice that also happens in notebooks, on shelves, in bound volumes.
- **Privacy is architectural.** The archive is as private as a notebook in a drawer.

The interface is therefore **a tool for solitary, slow, formative writing whose principal output is the formation of the writer over decades.** Every visual decision derives from that.

---

## 2. The core commitments

### 2.1 Restraint over richness

The interface should look like it is **trying to disappear**. Where Mesh's visual language uses backdrop blur, animated shine, glowing borders, and depth-through-translucency to mark interactive surfaces as alive and inviting, Commonplace's interface marks them as **passive substrate** — like the page of a notebook, which is doing nothing visually so that the writing can be everything.

Concretely:

- No animations. No transitions other than instant state change and the single subtle hover color-shift. No motion to communicate anything.
- No glass / blur / translucency effects. The interface is opaque paper. There is no "behind."
- No gradients in interface chrome. (Gradients are reserved for one specific affordance — see §6 — and even then are extremely subtle.)
- No drop shadows. No inset shadows. No depth.
- No icons in chrome. The nav is words. The buttons are words. Icons are visual noise that competes with the writing for attention.

The discipline: **before adding any visual element, ask whether removing it would degrade the practice.** If not, it goes.

### 2.2 Typography is the design

The whole visual system rests on typography. Body is serif. The serif communicates that what is on screen is written, not displayed.

- Body font: a serif. Currently the Tailwind `font-serif` default; in production, a single chosen typeface (candidates: Source Serif 4, Iowan Old Style, Charter, Crimson Pro). One face, three weights (regular, italic, semibold), no display variant.
- The interface uses a single sans-serif for **labels only** (nav, metadata strips, button text, timestamps, genre chips). Currently `font-sans`; in production, a quiet humanist sans (Inter, Söhne, or system sans).
- Sizes are restricted: `text-xs` `text-sm` `text-base` `text-lg` `text-2xl`. No `text-3xl`, no `text-4xl`. Headers gain weight before they gain size.
- Body text is `text-base` (16px) with `prose-stone` typography defaults. Generous line-height. Generous paragraph spacing.
- Measure (line length) is fixed at `max-w-2xl` (~640px). This is non-negotiable. The full-bleed dashboard is the wrong shape for prose.

### 2.3 Stillness over feedback

Mesh interfaces tell you constantly that they are alive — pulse animations, glowing dots, real-time presence. Commonplace tells you nothing. The cursor blinks because the OS makes it blink. Nothing else moves.

- No loading spinners except as a last resort. Server components that block briefly are fine; the page can simply appear.
- No optimistic UI flourishes ("Saved!" toast, green check). The save button is labeled "Save entry"; after save, the URL changes. That is the feedback.
- No empty-state illustrations. Empty states are sentences in `text-stone-500`.
- No badges, no counters, no "new" indicators. The archive does not nag.

### 2.4 Time is structural, not decorative

Because temporal depth is the architectural principle, the interface treats time visibly and seriously, but never as a metric or a gamification.

- Dates are written out (`4/24/2026`, `April 2026`, `started Apr 2026`) — not "2 days ago," not relative time except in two specific places (`Today` in the week view; "active/warm/dormant/fallow" dormancy labels for threads).
- The four dormancy labels (`active` ≤14d, `warm` ≤90d, `dormant` ≤365d, `fallow` >365d) are the project's only temporal vocabulary aside from absolute dates. They are deliberately seasonal/horticultural rather than industrial. A thread that has not been touched in two years is **fallow**, not "stale" or "inactive."
- Streaks, day counts, "you wrote N words this week" are forbidden. They belong to the productivity register the project refuses.
- The Archive page's three horizons (One week / Six months / Years) are the project's principal expression of temporal depth, and their visual register changes with the horizon: the week view is concrete (full snippets, day cards), the half-year view is abstract (heatmap squares, thread categories), the years view is structural (monthly counts, thread lifespans). The horizon **changes what kind of attention you are bringing**, not just the date range.

### 2.5 Genre is visible but quiet

Genres are structural, not decorative. They appear:

- As small uppercase chips in metadata strips: `OBSERVATION · 4/24/2026`. Always uppercase, always sans, always small (`text-xs`), always with low weight.
- As selectable tiles in the capture flow, where they are momentarily prominent (you are choosing a discipline) but never colored differently from each other. The selected tile is dark on light; the unselected tiles are stone-on-white. There is no per-genre color.

The reason genres are uncolored: a colored genre system would create a visual hierarchy of importance ("excerpts are blue, meditations are gold"), which the practice does not have. All seven genres are equally serious disciplines.

### 2.6 The author is alone with the page

The interface assumes one user. There is no presence indicator, no "viewing" cursor, no shared selection, no comment thread. The nav has four items (`Write Read Search Archive`) and a sign-out — that is the entire global chrome.

When the writer is in `/write`, the chrome **recedes further**. The nav stays at the top because removing it would be inconsistent, but no other element appears until the writer has typed something. The genre selector is hidden until there is content to classify. The save bar is hidden until there is something to save. The cursor is in the editor on page load.

---

## 3. Color

The palette is small and almost monochrome.

### 3.1 The neutral spine

| Token | Tailwind | Use |
|---|---|---|
| Page | `stone-50` (`#fafaf9`) | Application background |
| Surface | `white` (`#ffffff`) | Editor surface, input fields, selected genre tile background contrast |
| Hairline | `stone-100` (`#f5f5f4`) | Inter-row dividers within lists |
| Rule | `stone-200` (`#e7e5e4`) | Section dividers, header rules, button outlines |
| Quiet text | `stone-400` (`#a8a29e`) | Timestamps, em-dashes for empty days, "(empty)" placeholders |
| Subdued text | `stone-500` (`#78716c`) | Helper copy, descriptions, sub-labels |
| Body secondary | `stone-600` (`#57534e`) | Snippets in lists, descriptions, body text on read pages |
| Body primary | `stone-700` (`#44403c`) | Section labels, secondary headings |
| Ink | `stone-800` (`#292524`) | Body text in lists, link hover state |
| Strong ink | `stone-900` (`#1c1917`) | Headings, primary buttons (filled), the editing cursor |

This is the entire palette for 95% of the interface.

### 3.2 The two non-neutral accents

Two — and only two — non-neutral colors appear, each with one specific job.

- **Amber** (`amber-100` → `amber-800`). The mark of *attention paid by the reader to a specific moment in the writing*. Used for: search result `<mark>` highlights, the historical-version banner, the heatmap intensity ramp on the half-year archive view. Amber is the marginalia color. It appears where the present reader is annotating the archive.
- **Rose** (`rose-700` text on `red-* `-free background). Errors only. Never warnings, never required-field markers, never destructive-action emphasis. The interface generally does not produce warnings.

That is all. No green for success. No blue/sky/cyan/indigo for primary action. No teal for "info." Black is the primary action. Rose is the failure.

### 3.3 What the absence of color means

The deliberate refusal of a status-color system (success-green, warning-yellow, info-blue) is part of the project's stance against the productivity register. A "success: saved!" toast in green frames writing as a task-completion event. The interface refuses that frame. You wrote; the URL changed; that is what happened.

---

## 4. Spacing, rhythm, and the page

### 4.1 The fixed measure

Everything sits inside `max-w-2xl mx-auto px-6 py-12`. Width is constant across `/write`, `/read`, `/entry/*`, `/search`, `/archive`. The reader's eye learns one shape and never has to re-learn it.

### 4.2 Vertical rhythm

The unit is the line. Vertical spacing comes from a small set of values:

- `space-y-1` — tight metadata stacks (date below title, description below name)
- `space-y-2` — within a single grouped block (genre chips row, dormancy chips row)
- `space-y-3` — between rows in a list
- `space-y-4` — between distinct entries in a thread view
- `space-y-6` — between a header and its content; between major sections within a page
- `space-y-8` — between top-level page sections (e.g. Threads → Recent entries)
- `space-y-10` — between the page header and the first section

The rhythm is **slow**. Most spacing is at `space-y-6` or larger. Cramped lists belong in spreadsheets.

### 4.3 The hairline rule

Lists separate their items with `border-b border-stone-100` (the hairline). Sections separate from each other with `border-t border-stone-200 pt-6` (the rule). Both are 1px. The interface never uses thicker borders for emphasis.

---

## 5. Components

The component vocabulary is intentionally tiny. New components require justification.

### 5.1 The list row

The atomic UI unit. A list row is a `<li>` containing a `<Link>` containing:

- A metadata strip: small uppercase sans, `text-xs text-stone-500`, items separated by `·`.
- A snippet: serif body, `text-stone-800`, `line-clamp-2` or `line-clamp-3` depending on context, `group-hover:text-stone-900`.

This is the row pattern on `/read`, `/read/[threadId]`, `/search`, `/archive?horizon=week`. **Do not invent a card.** A card with a border and a shadow would be a dashboard tile; the project's lists are typographic, not card-based.

### 5.2 The genre chip

```
<span className="rounded bg-stone-100 px-2 py-0.5 text-xs uppercase tracking-wide text-stone-700">
  meditation · 4
</span>
```

Used in metadata strips and the thread-detail genre breakdown. Never colored.

### 5.3 The button

Two states only:

- **Primary**: `rounded bg-stone-900 px-4 py-2 text-sm text-stone-50 disabled:opacity-50`
- **Secondary** (link): `text-sm text-stone-700 hover:underline`

There is no "outline" button, no "ghost" button, no "icon" button, no "tertiary," no "destructive variant." A destructive action is a primary button with the destructive verb in its label, with no special color treatment. (It is also rare; the only one that exists is delete, and it is currently buried.)

### 5.4 The input

Text inputs and selects share one shape:

```
className="w-full rounded border border-stone-300 bg-white px-3 py-2 text-sm
           focus:border-stone-500 focus:outline-none"
```

No focus ring color. No inner shadow. No floating label. Placeholder is `text-stone-400`.

### 5.5 The horizon nav (and other tab-like patterns)

Pills. Filled black for active, transparent with hover-only background for inactive. The pattern lives in [packages/commonplace/app/archive/HorizonNav.tsx](packages/commonplace/app/archive/HorizonNav.tsx) and is the canonical "switch between sibling views" widget.

### 5.6 The metadata strip

The most-repeated pattern across the app. Always:

```
<div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
  <span className="uppercase tracking-wide">{genre}</span>
  {thread && (<><span>·</span><span>{thread.name}</span></>)}
  <span>·</span>
  <time>{date}</time>
</div>
```

Item separator is the middle dot `·` rendered as its own `<span>`. Never use `|`, `/`, or "•". The middle dot is quieter and typographically older.

### 5.7 The historical version banner

The amber banner at the top of `/entry/[id]/versions/[n]` is the only colored chrome surface. It marks "you are not in the present." Pattern:

```
<div className="text-xs uppercase tracking-wide text-amber-700">
  Viewing historical version
</div>
```

No background, no border. The color alone does the work.

---

## 6. The amber gradient (the one exception)

The half-year heatmap is the only place in the entire interface where a gradient — even a stepped one — appears. The five-step amber ramp (`stone-100 → amber-200 → amber-400 → amber-600 → amber-800`) communicates writing-intensity-over-weeks.

The decision to allow this exception comes from two facts: (a) the heatmap's whole point is to make a quantitative density visible at a glance, which a single color cannot do; and (b) the amber palette here is consistent with amber's role as "marginalia / reader's attention" — the heatmap is the reader's attention scanned across the half-year.

If a future view is tempted to use color to encode another dimension (genre, thread, age), the right answer is almost always to redesign the view typographically instead.

---

## 7. The voice of the copy

The interface speaks the way the practice speaks. This is not a style choice; it is part of the design.

- Empty states are observations, not invitations. `"Nothing written yet. Begin."` not `"Capture your first thought →"`.
- Labels are nouns or imperatives, never gerunds or marketing voice. `"Save entry"` not `"Saving thoughts forever"`.
- Helper text underneath inputs is one sentence, factual. `"Stored alongside this version in the revision history."` not `"Tell future-you why you made this change ✨"`.
- Time phrases are bare. `"last activity 4/24/2026"`, not `"last touched two days ago"`.
- Confirmations describe state, not affect. The `(active)` / `(warm)` / `(dormant)` / `(fallow)` parentheticals are the model.

The forbidden register: anything chirpy, anything emoji, anything that addresses the user as "you" with the second-person urgency of marketing copy. The interface is not your friend. It is your notebook.

---

## 8. What we will not build

A list, partial and growing, of things the interface will not have. Each item is here because it would be in some sense "good UX" by conventional measure but would falsify what the project is.

- **A dashboard / home view with stats.** The home page is a redirect to either `/write` (for capture) or `/read` (for browsing). There is no "you have N entries across M threads" surface.
- **Streaks, daily-goal indicators, calendar-heatmap-of-streaks.** The half-year heatmap shows density over weeks; it is not a contribution graph and must never be made to look like one.
- **Notifications.** None. Not push, not email, not in-app. The archive does not initiate contact.
- **AI assistance in the writing flow.** No suggestions, no autocomplete beyond the OS-level, no "summarize this entry," no semantic search. The reference doc is explicit: AI in the contemplative context substitutes for the formative work the practice exists to perform.
- **Social features.** No follow, no share-to-feed, no public profiles. The letter genre may eventually support sending to a named correspondent; this is the only sharing affordance contemplated.
- **Onboarding tutorials, modals, tooltips.** The reference doc gestures at "specific invitations into the practice — perhaps in the form of excerpts from the tradition itself." When this is built, it will be a single pre-seeded entry from the tradition, not a guided tour.
- **Themes / dark mode.** One theme. Cream paper, ink text. The writer who needs dark mode at 2am is using the OS-level inversion, which works on this design because it is genuinely monochrome.
- **Customizable layout.** No draggable panels, no resizable sidebars, no view density toggle. The page is the page.

---

## 9. How this differs from Mesh, in one paragraph

Mesh is a deliberation environment. Many people, many speech-acts, many simultaneous structures, real-time, contested, social, performative. Its interface should look alive — translucent surfaces that suggest depth and conversation, glow that signals interactivity, motion that communicates state. The glass-morphism system in [docs/GLASS_MORPHISM_DESIGN_SYSTEM.md](docs/GLASS_MORPHISM_DESIGN_SYSTEM.md) is correct for that. Commonplace is a notebook. One person, in private, over decades. Its interface should look like paper. The project would be falsified by an interface that performed liveness, depth, or sociality. **The visual register is the philosophical register.** That is the central commitment, and every smaller decision in this document follows from it.

---

## 10. Open questions for the polish pass

- Pick the production serif and the production sans. (Currently using the Tailwind defaults, which are passable but not chosen.)
- Decide whether `/write`'s hidden chrome (genre selector / save bar appearing only after first keystroke) is the right pattern, or whether it should be permanently visible-but-quiet so the writer always knows the affordances are there.
- The capture flow currently renders the genre selector below the editor; consider whether the floating-prompt pattern from the reference doc ("the interface prompts — subtly, not insistently") wants a different treatment, perhaps after a few seconds of inactivity rather than appearing on first keystroke.
- The historical-version page's amber accent is currently the only place amber appears in chrome (heatmap aside). Walk the app and verify nothing else has accidentally drifted into a colored treatment.
- The genre-uncolored stance should be tested on a real archive with hundreds of entries. If genre-recognition-at-a-glance becomes a real friction, the answer is probably typographic differentiation (italic for excerpts? small-caps for letters?), not color.
- Decide where physical-production aesthetics begin to feed back into the screen design. If the eventual print volumes are typeset in (say) Iowan Old Style at 11pt with 13.5pt leading, the screen typography should probably converge toward that.

---

## 11. The standard

When in doubt, the test is: **does this look like a tool a serious practitioner of the commonplace tradition would want to use, in private, for thirty years?**

If yes, ship it. If no — even if it would look good in a screenshot, even if it would test well, even if it would feel modern — cut it.
