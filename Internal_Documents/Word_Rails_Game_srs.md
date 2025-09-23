Below is a **Software-Requirements Specification (SRS)** packet for **Word Rails**—the daily letter-ladder puzzle we scoped together.
It is written in IEEE-830 style but extended with architecture, UX flows, and a development roadmap so engineering, design, and product can start immediately.

---

# 1  Introduction

| Section             | Content                                                                                                                                                                                                  |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1.1 Purpose**     | Specify everything needed to design, build, test, and ship Word Rails as a browser & PWA game.                                                                                                           |
| **1.2 Scope**       | A lightweight single-page web app that delivers one deterministic puzzle per calendar day, tracks streaks locally + optionally on a backend leaderboard, and allows sharing results on social platforms. |
| **1.3 Definitions** | *Rail* – one intermediate word row. *Path* – sequence from START → … → END. *Par* – optimal rail count. *Streak* – consecutive daily clears.                                                             |

---

# 2  Overall Description

| Topic                         | Details                                                                                              |
| ----------------------------- | ---------------------------------------------------------------------------------------------------- |
| **2.1 Product Perspective**   | Stand-alone micro-site like Wordle; embeds easily in NYT-style wrapper.                              |
| **2.2 Major Functions**       | Daily puzzle delivery; in-browser validation; streak & stats; share card; (opt.) server leaderboard. |
| **2.3 User Classes**          | Casual (just clear), Optimizer (beat par), Speedrunner (time).                                       |
| **2.4 Operating Environment** | Modern browsers (Chrome, Safari, Firefox, Edge) ≥ ES2020; responsive ≥ 360 px; PWA offline-capable.  |
| **2.5 Constraints**           | One screen, < 150 kB initial payload, dictionary ≤ 50 kB gzipped per word length.                    |
| **2.6 Assumptions**           | Users have JS enabled; no login required for core loop.                                              |

---

# 3  System Features (Functional Reqs)

| ID       | Requirement                                                                                 |
| -------- | ------------------------------------------------------------------------------------------- |
| **F-01** | Display START & END words (same length) and N blank rails (default =N+1).                   |
| **F-02** | Accept keyboard & touch input; enforce exactly-one-letter change on submission.             |
| **F-03** | Validate word locally against compressed dictionary.                                        |
| **F-04** | Flip-tile animation for accepted rails; shake invalid.                                      |
| **F-05** | Detect success when last accepted word == END and rails ≤ limit.                            |
| **F-06** | Persist local stats: total plays, wins, Rails-Used histogram, current/longest streak.       |
| **F-07** | Generate share-card text: `WordRails #date 5/6`.                                            |
| **F-08** | Auto-load correct puzzle by system date; allow archive navigation after clear (optional).   |
| **F-09** | Hard-mode toggle: disallow anagram repeats.                                                 |
| **F-10** | (Opt.) POST result to backend; server verifies SHA-1 path hash and stores anonymized score. |

---

# 4  Non-Functional Reqs

| Category             | Target                                                              |
| -------------------- | ------------------------------------------------------------------- |
| Performance          | ≤ 100 ms first input delay; ≤ 1 s puzzle load on 3G.                |
| Reliability          | Deterministic daily seed; generator pre-computed 365 days.          |
| Accessibility        | WCAG 2.2 AA; full keyboard flow; high-contrast mode.                |
| Security             | No PII stored locally; HTTPS enforced; CSRF on API.                 |
| Internationalization | LTR interface first; dictionary US-English; hooks for locale packs. |
| Privacy              | Analytics opt-in only.                                              |

---

# 5  External Interfaces

| Interface           | Spec                                                                                                |
| ------------------- | --------------------------------------------------------------------------------------------------- |
| **UI**              | React + Tailwind; tiles 48 px mobile / 56 px desktop; ARIA live regions announce state.             |
| **Puzzle Manifest** | Static JSON `{date,start,end,length,par,opt_hash}` signed with HMAC.                                |
| **Result API**      | `POST /result` body `{date,rails,time,hash}`; auth via signed cookie if user creates account later. |

---

# 6  Software Architecture

```
┌─────────────┐
│  Generator  │  (Node script, offline)
└─────┬───────┘
      │ manifest.json
┌─────▼───────┐
│  CDN / S3   │  (static hosting)
└─────┬───────┘
      │ fetch
┌─────▼───────┐      optional
│ React SPA   │───► Supabase (stats)
└─────────────┘
```

### 6.1 Frontend modules

1. **AppShell** – routes, theme, service-worker.
2. **GameEngine** – state machine (XState or Zustand).
3. **Validator** – Hamming distance check + DAWG lookup (WebAssembly or JS).
4. **StatsStore** – IndexedDB via idb-keyval.
5. **ShareCard** – builds text & copies to clipboard.

### 6.2 Data Model (Frontend)

| Key            | Type        | Notes                                       |     |        |   |
| -------------- | ----------- | ------------------------------------------- | --- | ------ | - |
| `gameState`    | enum \`idle | inPlay                                      | won | lost\` |   |
| `rails`        | string\[]   | includes START, intermediates, END          |     |        |   |
| `attemptsLeft` | int         | decrements per valid rail                   |     |        |   |
| `stats`        | object      | wins, losses, railHistogram\[1..8], streaks |     |        |   |

---

# 7  Puzzle-Generation Algorithm (recap)

1. Build length-N word graph with Hamming-1 edges.
2. Random-sample start node **s**; BFS until node **e** with distance d (3–6) where *shortest-path uniqueness = 1*.
3. Persist `{date,s,e,d,opt_path}`; compute SHA-1 of path for client verification.

---

# 8  User Flows

### 8.1 First-Time User

1. Land on `/` → modal with 50-word tutorial.
2. Close tutorial → Game screen loads daily puzzle.
3. Complete puzzle → Result modal shows streak = 1, share button.

### 8.2 Returning User (Clear Path)

1. Auto-load puzzle for current date.
2. If cleared, board is read-only; shows timer to next drop and link to archive.

### 8.3 Error States

* **Offline**: Service-worker serves last-cached manifest.
* **Bad system date**: Banner “Check device clock”.

---

# 9  Product Development Roadmap

| Phase           | Duration   | Scope                                                         | Exit Criteria                                |
| --------------- | ---------- | ------------------------------------------------------------- | -------------------------------------------- |
| **0 - Concept** | Week 0     | Finalize SRS                                                  | Sign-off from Eng + Design.                  |
| **1 - MVP**     | Weeks 1-4  | Puzzle engine, in-browser validation, local stats, basic UI.  | Playable on desktop/mobile; manual manifest. |
| **2 - Alpha**   | Weeks 5-6  | Generator, share card, PWA, accessibility pass.               | Internal play-test; 90 % CLS < 0.1.          |
| **3 - Beta**    | Weeks 7-8  | Hard mode, streak logic, analytics opt-in, bug bash.          | Public soft-launch at sub-domain.            |
| **4 - Live v1** | Weeks 9-10 | Leaderboard, account linking (OAuth), archive mode.           | 10 k MAU, Sentry error rate < 0.1 %.         |
| **5 - Growth**  | Ongoing    | Locale dictionaries, daily email, monetization (ad-free sub). | Revenue covers infra.                        |

---

# 10  Project Management Approach

* **Methodology** – Kanban with 1-week OKR checkpoints.
* **Issue Tracker** – GitHub Projects.
* **CI/CD** – Vite build → Playwright E2E → Cloudflare Pages deploy preview → main.
* **Definition of Done** – unit tests ≥ 90 % lines; axe-core accessibility violations = 0; PR reviewed by Eng + Design.

---

# 11  Risks & Mitigations

| Risk                                  | Probability | Impact          | Mitigation                                                 |
| ------------------------------------- | ----------- | --------------- | ---------------------------------------------------------- |
| Dictionary size blows up bundle       | Med         | Med             | Lazy-load per length; build WASM DAWG.                     |
| Duplicate shortest paths slip through | Low         | High (fairness) | Uniqueness check in generator + unit tests.                |
| Bot scraping of manifest              | Med         | Low             | HMAC-sign puzzles; throttle API reveals.                   |
| Daily seed collision / profanity      | Low         | High            | Profanity filter on start/end words; manual override list. |

---

# 12  Appendices

* **A.** ENABLE1 pruning script.
* **B.** Accessibility checklist.
* **C.** Test-case matrix (happy, edge, error states).

---

### ✅ Deliverable ready

This SRS plus roadmap gives Engineering clear marching orders; Design can reference UI states; Product can track milestones.
When you’re ready, we can produce the same level of detail for **Pivot** or iterate on any section above.
