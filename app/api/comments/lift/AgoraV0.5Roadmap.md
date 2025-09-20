short answer: not just EventCards/Filters/TopBar. keep those as the spine, but give Agora a few high-leverage “widgets” so people can (1) see what’s happening, (2) know where they’re needed, and (3) jump straight into impact.

here’s a tight, layered plan you can ship incrementally:

# v1 (today): the spine, but useful

* TopBar: tabs (all / following / calls / votes / accepted) + search + pause.
* Left Filters: tags + sort + quick toggles (rooms you follow).
* Now Feed (EventCards): burst-coalesced stream, follow/unfollow, reply/open.
* Right Rail (basic): context for the selected card (room name, quick follow, open CQ count).

# v1.5 (1–2 PRs): “why this matters” sidebars

1. **Sidebar: Activity you can act on**

   * **Your Calls** (open decisions you can participate in)
   * **Active Votes** (ending soon first)
   * **Recent Receipts** (accepted decisions)
     API: `GET /api/agora/sidebar?deliberationId=…` → `{ calls[], votes[], receipts[] }` (you already planned this).

2. **Hub snapshot** (left column)

   * **Recently active rooms** from `/api/hub/deliberations` with: title, claims count, open CQs, updatedAt.
   * Sort: `updated`, `most open CQs`, `near confirm` (see thresholds below).

# v2: “help now” tasklets (micro-contributions)

* **Open CQs you can close** (for rooms you follow)

  * For each followed room, `GET /api/dialogue/legal-moves?targetType=argument|claim` and surface “WHY/GROUNDS needed” chips as **Tasklets**: “Add GROUNDS on *X*” → one-click takes you to the composer.
* **Under-evidenced claims** (needs sources)

  * Use your evidence counts + threshold heuristic (see v2.5).
* UX: small checklist list in Right Rail; completing one shows a green ✓ micro-toast.

# v2.5: thresholds & “Confirmable soon”

* Compute per-room **Threshold Chips** (CQ completeness %, evidence sufficiency %, participation min met?).
* Show a mini **progress bar** next to rooms in Hub snapshot: “82% to Confirm”.
* When all thresholds are green, surface a **Confirm** CTA (or jump link) on the room.
* Service helpers (client or server):

  * `calcCQCompleteness(roomId)` → { satisfied, required, pct }
  * `calcEvidenceSufficiency(roomId)` → { have, need, pct }
  * `calcParticipation(roomId)` → { voters, min, pct }

# v3: threads/network lens (XRef)

* **Navigator** (Right Rail): when a card is selected, show cross-links (parents/siblings/children) via `/api/xref?toType=deliberation&toId=…`.
* **Threads tab**: `/agora/threads` — clusters of related rooms (same issue, shared sources, shared authors), each tile links to “forum” or “deep dive”.
* Feed chip “xref” opens a small overlay listing the linked items.

# v4: personal inbox & saves

* **Mentions & replies** to you; **Assigned asks** (if we add lightweight routing).
* **Saved views** (filters + query + tab). Persist server-side if you want team sharing later.
* **Bookmarks/Stars** list (you already have Stars & Bookmarks infra).

# v5: discovery & suggestions

* **Follow suggestions** (“People who follow room X also follow…”, or “Rooms adjacent to your stars”).
* **Trending** (rooms with sustained burst > N over 30–60 min; you already have burst logic).

---

## concrete layout (keeps your three-column skeleton)

* **TopBar**: (existing)
* **Left** (FiltersPanel area):

  * Section A: Search & switches (All/Following etc. already mirrored in TopBar).
  * Section B: Hub snapshot (10 rooms) — from `/api/hub/deliberations`; pill shows `openCQs` and a “near confirm” badge.
  * Section C: Follow suggestions (v5).
* **Center (main)**:

  * Now Feed (EventCards), burst-coalescer enabled.
  * Optional “Today” separators for visual breathing.
* **Right Rail**:

  * Card 1 (selected room context): title, follow toggle, quick stats (claims, open CQs, last activity, threshold chips if computed).
  * Card 2 (Act now): Tasklets (WHY, GROUNDS, add evidence) — v2
  * Card 3 (Calls/Votes/Receipts): from `/api/agora/sidebar` — v1.5
  * Card 4 (Navigator / XRef): v3

---

## small, PR-sized tickets you can knock out

1. **Sidebar endpoint + RightRail wire-up**

   * Files: `app/api/agora/sidebar/route.ts`, `app/agora/ui/RightRail.tsx`
   * Acceptance: shows 3 lists (calls/votes/receipts) with links; updates live via bus (`votes:changed`, `decision:changed`).

2. **Hub snapshot in FiltersPanel**

   * Files: `app/api/hub/deliberations/route.ts` (already exists), `app/agora/ui/FiltersPanel.tsx`
   * Acceptance: top 10 rooms, sortable; shows open CQs; click → open room; follow button inline.

3. **Tasklets (WHY/GROUNDS) MVP**

   * Files: `app/agora/ui/RightRail.tsx` (+ tiny `lib/client/useTasklets.ts`)
   * Acceptance: lists up to 5 actionable items from `GET /api/dialogue/legal-moves…`; clicking opens composer anchored to the target.

4. **Threshold chips helper**

   * Files: `lib/services/thresholds.ts`, consumed by RightRail and Hub list.
   * Acceptance: shows 2–3 chips with % and green when ≥ thresholds; gated Confirm CTA appears in room pages.

5. **XRef Navigator (skeleton)**

   * Files: `app/api/xref/route.ts` (list by target), `app/agora/ui/Navigator.tsx`
   * Acceptance: when a feed item with `deliberationId` is selected, the Navigator shows linked items by relation.

---

## content types to emphasize on the feed (so EventCards don’t all feel the same)

* **New move** (dialogue\:changed): already there, bundle bursts; add mini glyph for WHY/GROUNDS/CLOSE.
* **Evidence attached** (citations\:changed): show “+source(s)” chip and a “View sources” CTA.
* **Decision recorded** (decision\:changed): elevate visually (✓ badge) and surface a “Receipt” quick link.
* **Vote updated** (votes\:changed): show method (approval, rank, poll) chip; “Vote now” CTA if open.
* **XRef added** (xref\:changed): chip shows relation (supports/refutes/duplicate/related).
* **Deliberation created** (deliberations\:created): “Follow” CTA prominent.

---

## empty states & polish

* All tab empty → show Hub snapshot + “Follow a room to start” suggestion.
* Following tab empty → suggest 5 rooms to follow (from Hub).
* Micro-toasts for Follow/Unfollow (you already have the hook) + success ticks on buttons.

---

if you want, I can stub `GET /api/agora/sidebar` + a RightRail card list in one go—super small PR.
