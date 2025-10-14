Short answer: **start the rework as soon as CA is the single source of truth, the AIF graph endpoint is stable, and the export validator is green**—i.e., right after the CA-counts + PA + CQ→CA tasks we just lined up. From there, evolve the diagram in three small, safe steps so the UI stays usable while we converge on the AIF figures you see in the papers.

Below is a crisp gate-and-plan.

---

## When exactly to begin

**Begin immediately after these three gates are met (we’re almost there):**

1. **CA as source of truth** for attacks (list & graph read from `ConflictApplication`, not `argumentEdge`).
2. **AIF graph endpoint** is available: `GET /api/deliberations/:id/graph?aif=true` (normalized **I/RA/CA/PA** with role-typed edges).
3. **Export validation passes**: JSON-LD export returns `validation.ok === true` (RA/CA/PA cardinalities & no I→I).

> These gates guarantee the diagram can be rebuilt as a **pure AIF view** instead of a bespoke mix of claim/argument edges.

---

## What to change (and why)

### AIF glyph set (match research figures)

* **I-node (Claim)**: rounded rectangle with text.
* **RA (inference)**: **diamond** (or chevron) between premises and conclusion.
* **CA (conflict)**: **octagon** or red diamond; edges labelled **conflicting** → **conflicted**.
* **PA (preference)**: **triangle** (green/gray), edges labelled **preferred** → **dispreferred**.
* **L-node (locution)**: small circles in a **side rail** (timeline), with “illocutes” links into the AIF area.

### Typed role edges (AIF roles, not generic “arrows”)

* Premise: **I → RA** (thin, black).
* Conclusion: **RA → I** (thicker, black).
* Conflicting → Conflicted: **CA → (I|RA)** (red, dashed).
* Preferred → Dispreferred: **PA → (I|RA|Scheme)** (green, dotted).

### Layering (readability & faithfulness)

* **Upper Ontology** center pane: I/RA/CA/PA.
* **Locution rail** on the right or left (L-nodes + replies).
* Optional **Forms** lens (colors/badges show which scheme an RA/CA/PA fulfils).

### Authoring affordances (after read-only works)

* Drag from a claim to empty space → **create RA** (premise prefilled).
* Click claim → “**rebut this**”, click RA → “**undercut**”, click premise → “**undermine**” (spawns CA composer).
* Small **PA menu** on RA/Claim to prefer/disprefer relative to another.

---

## How to roll it out (3 sprints, safe & incremental)

### Sprint A (read-only AIF diagram; 1–2 days)

**Goal:** render the current debate **exactly** as an AIF graph (no authoring changes yet).

* **Adapter**
  `lib/graph/aifAdapter.ts`: map `/graph?aif=true` payload → internal `GraphViewModel`:

  ```ts
  type AifNode = { id:string; kind:'I'|'RA'|'CA'|'PA'; text?:string; schemeKey?:string };
  type AifEdge = { from:string; to:string; role:'premise'|'conclusion'|'conflictingElement'|'conflictedElement'|'preferredElement'|'dispreferredElement' };
  ```

* **Renderer**
  `components/map/DiagramView.tsx`:

  * New glyphs for RA/CA/PA.
  * Edge styles by **role** (not by “type”).
  * Legend describing glyphs/roles.

* **Layout**
  Start with layered (Sugiyama-style): premises (top) → RA (middle) → conclusion (bottom). Group premises for the same RA into a fan. CA/PA edges are overlaid with routing (bundled or arced).

**Acceptance**

* Any deliberation renders I/RA/CA/PA with correct roles.
* AIF export and diagram view show **the same** count of nodes/edges.
* Clicking a node highlights its incident roles (premise/conclusion/conflicting/preferred).

---

### Sprint B (AIF-authoring in diagram; 2–3 days)

**Goal:** wire the existing flows into the diagram so authoring feels “on the canvas”.

* **Create RA**: drag from an I-node → drop to canvas → opens SchemeComposer with the dropped I prefilled as **premise**; enforce RA≥1.
* **Create CA**:

  * **Rebut**: select I → “rebut” → ClaimPicker → `POST /api/ca` (I→CA→I).
  * **Undercut**: select RA → “undercut” → quick text → `POST /api/claims` → `POST /api/ca` (I→CA→RA).
  * **Undermine**: select I (premise) → “undermine” → ClaimPicker → `POST /api/ca` (I→CA→I).
* **Create PA**: select RA/Claim → “prefer over…” → paste/pick target → `POST /api/aif/preferences`.
* **CQ shortcuts**: clicking a scheme’s CQ badge opens the corresponding objection composer (rebut/undercut/undermine) inline.

**Acceptance**

* All three CA authorings are possible from diagram interactions and appear instantly.
* PA preferences editable from the canvas (counts update on list + chips).

---

### Sprint C (research-faithful cosmetics + exports; 1–2 days)

**Goal:** match figures from the papers and make outputs citable.

* **Styling**: update glyphs and edge roles to match the canonical figures (legends, colors, dashed vs dotted).
* **Export**: add `?as=svg` / `?as=png` export of the current AIF diagram view and a print-friendly PDF (legends + context).
* **Locution rail**: optional toggle to show L-nodes and YA/TA links (inspired by OVA dual-pane layouts).

**Acceptance**

* Visuals align with the RA/CA/PA/L shapes from the papers; PDFs are readable and citable.

---

## Concrete dev checklist (files to touch)

* `app/api/deliberations/[id]/graph/route.ts`
  Add `aif=true` branch (nodes:I/RA/CA/PA, edges with roles).
* `lib/graph/aifAdapter.ts` (new)
  Normalize server payload → renderer model.
* `components/map/DiagramView.tsx`
  Render glyphs, role-edges, legend; add interaction hooks.
* `components/arguments/AIFArgumentsListPro.tsx`
  Keep as the list; sync selection ↔ diagram; add “open in diagram” control.
* `components/arguments/AttackMenuPro.tsx` / CQ inline editor
  Reuse from the diagram (same CA writer).
* `lib/aif/export.ts`
  Confirm RA/CA/PA are emitted with role-typed edges; validator runs post-build.

---

## Why now (and not later)

* We’ve made **CA/PA first-class** and are finalizing **AIF export + validator**. Reworking the diagram **now** means every new feature (CQ→CA, PA UI, semantics) will have **one** canonical visualization.
* It also prepares us for **Phase 4** (ASPIC+): AIF-faithful diagrams make the translation and “why justified?” explanations straightforward.

If you want, I can ship **Sprint A** immediately: adapter + read-only AIF diagram (glyphs, roles, legend) and a one-page acceptance test using a small seeded debate with RA, one REBUT, one UNDERCUT, one UNDERMINE, and a PA.
