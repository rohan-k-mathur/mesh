---

# **Software Requirements Specification (SRS)**

**Product:** **Pivot v2** – Skill‑based rotating‑ring word puzzle
**Document ID:** PIV‑SRS‑0.9  **Last updated:** 13 Jul 2025
**Owner:** Rohan Mathur / Flowstate Games

---

## 1 Purpose & Scope

Pivot v2 transforms the current “find‑one‑word‑and‑win” prototype into a replayable, strategically rich puzzle that rewards deduction. This SRS formalises **what** must be built (functional & non‑functional requirements), **how** it will be built (architecture, data & algorithms) and **when** (road‑map and milestones).

---

## 2 References & Context

| Ref | Title / Link                    | Notes                          |
| --- | ------------------------------- | ------------------------------ |
| R1  | `page.tsx` (supplied)           | Existing React page            |
| R2  | `pivotGenerator.ts` (supplied)  | Puzzle producer                |
| R3  | `words4.ts` (supplied)          | Dictionary loader              |
| R4  | Design review dated 11 Jul 2025 | Game‑play changes to implement |

---

## 3 Definitions / Glossary

| Term                 | Meaning                                                  |
| -------------------- | -------------------------------------------------------- |
| *Ring*               | Circular array of letters; length may vary (n₁…n₄)       |
| *Orientation vector* | Tuple `(o₁,o₂,o₃,o₄)` where `oᵢ ∈ [0,nᵢ‑1]`              |
| *Column / Spoke*     | Vertical stack of 4 letters: outer→core                  |
| *Lock*               | Column flagged solved; affected letters become immutable |
| *Par*                | Minimum rotations found by solver during generation      |

---

## 4 Overall Description

### 4.1 User Classes

| Class             | Needs                                   | Priority |
| ----------------- | --------------------------------------- | -------- |
| Casual player     | Intuitive controls, hints, daily puzzle | M        |
| Puzzle enthusiast | Depth, par scoring, leader‑board        | H        |
| Speed‑runner      | Timer mode, shareable results           | L        |

### 4.2 Assumptions

* Runs in evergreen desktop & mobile browsers.
* All computation client‑side except optional leader‑board service.
* 4‑letter English dictionary provided (`/pivot/4letter.txt`).

---

## 5 System Architecture (high‑level)

```
┌─────────────────────┐  HTTP  ┌─────────────────────────┐
│ Next.js Front‑end   │───────►│  Serverless API (opt.)  │
│  • UI (React/TS)    │        │  • Score submission     │
│  • Game state store │        │  • Daily seed dist.     │
│  • WebWorker:       │        └─────────────────────────┘
│    – Generator BFS  │
│    – Solver / hints │
└─────────────────────┘
```

* **Front‑end** remains a **pages/app router** Next.js project.
* **WebWorker** isolates compute‑heavy BFS so UI stays responsive.
* **Optional serverless** (e.g. Supabase functions) holds leaderboard & UTC‑daily seed.

---

## 6 External Interfaces

| Interface             | Description                     | I/O Spec                        |
| --------------------- | ------------------------------- | ------------------------------- |
| **Dictionary fetch**  | GET `/pivot/4letter.txt`        | Plain text                      |
| **Daily seed** (opt.) | GET `/api/seed?date=YYYY‑MM‑DD` | JSON `{ seed: int }`            |
| **Score POST** (opt.) | POST `/api/score`               | `{ userId, spins, time, hash }` |

---

## 7 Functional Requirements

### FR‑1 Variable Ring Lengths

*The system shall support ring lengths 9‑8‑7‑6 (default) and allow future config.*

### FR‑2 Unique‑Solution Puzzle Generation

1. Generator assembles 8 target words.
2. Rings are derived row‑wise, scrambled with random offsets.
3. Breadth‑first solver verifies exactly **one** orientation vector solves all columns.
4. If no unique solution or par < `PAR_MIN` or > `PAR_MAX`, restart.

### FR‑3 Lock Mechanic

* When a column is valid, mark it **locked** in state; subsequent rotations that would alter any locked letter are disallowed and the button flashes.

### FR‑4 Rotation Dependencies (Gear Mode – MVP Optional)

* Outer → rotates Middle by +1 step; Middle → Inner; Inner → Core (direction toggle in settings).

### FR‑5 Hint System

* H1: After *N* failed rotations display possible‑word count per column.
* H2: After *M* more rotations, allow peek at one letter (costs 1 score).

### FR‑6 Scoring Engine

`score = (par / spins) × 100  –  hintsUsed × 5`
Stores best per puzzle in `localStorage`; submits to backend if logged‑in.

### FR‑7 Game Modes

| Mode            | Constraints                                    |
| --------------- | ---------------------------------------------- |
| **Classic**     | Spin cap = `4×par`                             |
| **Time‑Attack** | Unlimited spins, ticking clock                 |
| **Blindfold**   | Locks hidden; player presses *Check* to verify |

### FR‑8 Analytics & Telemetry

Anonymous events: puzzleId, spins, time, hints, win/lose. Toggle-able in settings.

---

## 8 Non‑Functional Requirements

| Category             | Requirement                                                                    |
| -------------------- | ------------------------------------------------------------------------------ |
| Performance          | Puzzle generation < 50 ms in WebWorker; first paint < 1 s on 3G.               |
| Reliability          | Unique‑solution guarantee via unit/property tests; no duplicate daily seeds.   |
| Accessibility        | Fully keyboard operable; WCAG 2.1 AA colour‑contrast; aria‑labels on controls. |
| Security             | SHA‑256 hash of solved grid to prevent forged scores.                          |
| Internationalisation | All UI text routed through i18n hook.                                          |

---

## 9 Data Design

### 9.1 TypeScript Types

```ts
type Ring = { letters: string[]; len: number; offset: number }; // len ∈ {6…10}
type Column = { letters: [string,string,string,string]; locked: boolean };

interface GameState {
  rings: Ring[];
  columns: Column[];
  solved: boolean;
  spins: number;
  par: number;
  mode: 'classic' | 'time' | 'blindfold';
}
```

### 9.2 Storage

* `localStorage.pivot_bestScores = { [puzzleId]: score }`
* `IndexedDB.pivot_cache` (dictionary trie & generated puzzles, LRU 20).

---

## 10 Algorithms

| Algorithm              | Complexity                 | Module              |
| ---------------------- | -------------------------- | ------------------- |
| **rotate(letters,k)**  | O(n)                       | `utils/array.ts`    |
| **BFS solver**         | O(Π nᵢ) ≤ 10*9*8\*7 ≈ 5040 | `workers/solver.ts` |
| **Trie pattern‑count** | O(wordLen)                 | `workers/hints.ts`  |
| **SHA‑256 grid hash**  | O(gridSize)                | `utils/hash.ts`     |

---

## 11 User Flows (textual)

1. **Landing / Daily puzzle**
   `index.tsx` → fetch seed → `PivotPage` mounts with deterministic puzzle.
2. **Rotate ring**
   Click / keyboard (‘QWE’ anti‑clockwise, ‘IOP’ clockwise) → dispatch `ROTATE(ringId, dir)` → reducer mutates `offset`, recalculates affected columns, checks locks, updates score.
3. **Column solves**
   On each `ROTATE` reducer iterates columns; if pattern in dictionary and not locked → lock and play “click” sound.
4. **Victory**
   All columns locked → fire `WIN` action → show stats modal → store best → POST score.
5. **Share**
   “Copy Link” adds `?id=<puzzleId>&score=<score>` to clipboard.

---

## 12 Development Road‑map

| Phase                              | Duration | Deliverables                                                                       | Key Risks / Mitigations                    |
| ---------------------------------- | -------- | ---------------------------------------------------------------------------------- | ------------------------------------------ |
| **0.1 Planning**                   | 1 wk     | Approved SRS, Jira epics                                                           | Scope creep → freeze spec after review     |
| **0.2 Core Engine**                | 2 wks    | Variable‑length rings, unique‑solution generator & solver in WebWorker, unit tests | Solver perf → optimise BFS, memoise        |
| **0.3 UX Upgrade**                 | 2 wks    | Lock mechanic, new SVG layout, keyboard controls                                   | Mobile layout regressions → Storybook QA   |
| **0.4 Scoring / Par**              | 1 wk     | Par calc, score overlay, local best storage                                        | Formula tuning → A/B in Feature flag       |
| **0.5 Hints & Settings**           | 1 wk     | Hint UI, accessibility audit                                                       | Overhinting → incremental unlock           |
| **0.6 Daily & Leaderboard (opt.)** | 2 wks    | API routes, Supabase table, anti‑cheat hash                                        | Bot spam → rate‑limit Cloudflare Turnstile |
| **0.7 Beta & Polish**              | 1 wk     | PWA install banner, sound FX, night theme                                          | Perf budget → Lighthouse CI                |
| **0.8 Launch**                     | 1 wk     | Marketing site, web‑analytics, press kit                                           | CDN cache → warm during deploy             |

*(Durations assume 1 FTE developer + 0.2 FTE designer.)*

---

## 13 Testing Strategy

| Layer          | Tooling                       | Coverage target                     |
| -------------- | ----------------------------- | ----------------------------------- |
| Unit           | Vitest + jsdom                | 95 % of utils & reducer             |
| Property‑based | fast‑check                    | No generated puzzle has >1 solution |
| Integration    | React Testing Library         | All UI flows                        |
| E2E            | Playwright (desktop & mobile) | Start→win path in each mode         |
| Accessibility  | @axe‑core/playwright          | 0 serious violations                |

CI: GitHub Actions → lint / type‑check / test / Percy visual diff.

---

## 14 Migration & Refactor Plan

1. **Refactor state** (`rings[]` array replaces four parallel `useState`s).
2. **Move heavy functions** (`generatePuzzle`, `solver`, trie build) into `/workers`.
3. **Delete** obsolete `solutionOffsets` logic; rely on solver for par.
4. **Update `pivotGenerator.ts`** to accept variable lengths and return metadata.
5. **Rename `page.tsx` → `index.tsx`** under `/pivot` and export as dynamic route for future `?id=` param.

---

## 15 Open Issues / To‑Decide

| # | Question                                     | Owner       | Due              |
| - | -------------------------------------------- | ----------- | ---------------- |
| 1 | Exact values for `PAR_MIN / MAX`             | Game design | Before Phase 0.2 |
| 2 | Choose gear vs lock for MVP                  | Product     | Planning         |
| 3 | Do we require account login for leaderboard? | PM          | Phase 0.6        |
| 4 | Multilingual dictionaries                    | Design      | Post‑launch      |

---

### **End of SRS**

This document is the single source of truth until superseded. All change requests flow through the project’s Jira board and require product‑owner approval.

Good building & happy puzzling!
