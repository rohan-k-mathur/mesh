Below is a structured design‑review that tries to keep three lenses in focus:

* **Player experience** – what feels confusing, arbitrary, or too easy once the “trick” is found.
* **Puzzle theory** – how the underlying state‑space and information flow affect difficulty and replay‑value.
* **Implementation** – concrete hooks and code patterns that make the improvements practical in your React/TS stack.

---

## 1 Where the current design feels uneven

| Phase        | Symptoms                                                                                         | Root cause (mechanics)                                                                                                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Opening**  | *“I don’t know where to start.”* All eight spokes are random noise; no partial feedback.         | No gradients of information. With 4 rings × 8 columns = 32 unknowns but no hint system, the branching factor is huge (8⁴ = 4096 orientations).                                                 |
| **Mid‑game** | Once any one spoke is solved the rest tumble quickly; difficulty collapses.                      | A single correct spoke fixes **all four rings’ absolute offsets** because every ring has the same length (8) and rotations are independent. The search space instantly shrinks from 4096 to 1. |
| **Meta**     | Some puzzles are trivial out of the gate; others are practically impossible inside the spin cap. | Generator does not measure *information content* or *solution uniqueness*.                                                                                                                     |

---

## 2 Tuning the state space

> **Goal:** Keep the puzzle *deterministic* (no RNG after the first move) but ensure it requires several deductions, not one lucky guess.

### 2.1 Break the symmetrical 8‑8‑8‑8 group

*Use co‑prime ring sizes.*
Let the ring lengths be 9‑8‑7‑6 (or 10‑9‑8‑7 if you still want 45° steps on the outer ring).

* Why it helps – a single solved spoke no longer fixes all ring orientations. It only pins the *relative* offset of the rings whose sizes share a factor; the others still have multiple possibilities.
* Code impact – `step = 360 / letters.length` already handles arbitrary sizes; only art assets (circles) need updating.

### 2.2 Constrain motion to add planning

Two classic options:

| Variant   | How it works                                                                                              | Strategic effect                                                                           |
| --------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **Gears** | Rotating ring *k* also rotates ring *k + 1* by the same (or opposite) amount, like meshed gears.          | Player plans chain reactions; parity matters.                                              |
| **Locks** | When a column becomes a valid word, its four letters “lock”. Any further rotation must preserve the lock. | Each success makes the remaining puzzle smaller but *tighter*, extending difficulty curve. |

Add a simple boolean mask per column in state (`locked[i]`).  Before applying a rotation, test whether it would break any `locked` column; if so, disallow or warn.

### 2.3 Guarantee single‑solution puzzles with a difficulty score

Inside `generatePuzzle()`:

1. **Pick target words** with pair‑wise low letter overlap (minimise accidental early solves).
2. **Construct** the four rings by reading the target matrix row‑wise and then adding a random *scramble rotation* per ring.
3. **Search** with DFS/BFS from the scrambled state to verify that:

   * Exactly one orientation vector solves the grid.
   * The shortest solution path (rotations where each move is ±1 on one ring) is ≥ *X* and ≤ *Y* (e.g. 10 ≤ moves ≤ 25).
4. Return rings plus the difficulty metadata.

Caching the pre‑computed shortest path lets you:

* Display “Par: 14 spins” for golfers.
* Reject puzzles that would be impossible under your global `SPIN_LIMIT`.

A plain JavaScript BFS over `8⁴` or `9*8*7*6 ≈ 3024` states is trivial (<1 ms).

---

## 3 Information & feedback loops

### 3.1 Soft guidance instead of binary green/red

| Feedback flavour                                                                                                          | Implementation                                                                                                    | Pay‑off                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Heat map** on each column showing how many dictionary words are *still possible* given its current pattern (`_ A _ R`). | Pre‑compute a trie of 4‑letter words. Each rotation updates counts in O(8×4).                                     | Players learn to reason probabilistically instead of brute‑forcing.                              |
| **Ring entropy meter**                                                                                                    | For each ring, compute Shannon entropy of its current letter distribution across unsolved columns; display a bar. | Encourages players to rotate the ring that reduces uncertainty the most – a natural *heuristic*. |

Both are client‑side only; no back‑end calls.

### 3.2 Progressive hint economy

* After **N** failed spins, allow the player to *peek* at a single letter (deduct 1 bonus point).
* After **M** more spins, show whether any ring is currently in its correct orientation (“cold/warm/hot”).

Keeps novices engaged without dumbing‑down the core mechanics.

---

## 4 Scoring that rewards depth

| Component         | Formula (example)                                                                                     | Rationale                                                 |
| ----------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| **Efficiency**    | `score_base = par_moves / actual_moves`                                                               | Classic par system.                                       |
| **Style**         | +1 per consecutive “perfect column” streak (solving ≥2 columns back‑to‑back without other rotations). | Rewards foresight.                                        |
| **Entropy bonus** | +log₂(initial\_states / states\_after\_first\_move)                                                   | Mathematically rewards tackling the *hardest* ring first. |

Persist the best score per puzzle in `localStorage` and show a share‑link with URL hash `#id:score` for social virality.

---

## 5 Code‑level refactor touch‑points

| Current pattern                                              | Suggested refactor                                                                                                                            | Benefit                                                                                       |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Multiple `useState` for each ring (`r1…r4`, `angle1…angle4`) | `const [rings, setRings] = useState<RingState[]>(initial)` where `RingState = { letters: string[]; angle: number }`.                          | Fewer handlers; rotations become `ringIndex => dir`.                                          |
| Re‑computing `rotateSteps` on every render                   | Store current **offset** (0–len‑1) instead of angle in degrees; rotate with modular arithmetic, then derive SVG rotation as `offset*stepDeg`. | Eliminate rounding errors (`Math.round(angle/45)`) and floating‑point drift after many spins. |
| `speed` hard‑wired                                           | Tie spin animation duration to `spinsThisMove × 50 ms`                                                                                        | Faster early exploration, satisfying final “click”.                                           |
| Dictionary as `Set<string>`                                  | Keep a **trie** plus a `Map<pattern, count>` cache for heat‑map feedback                                                                      | O(1) pattern lookup.                                                                          |

---

## 6 Variant modes for longevity

1. **Daily Puzzle** – same seed for everyone; global leaderboard (hash the solved state as proof).
2. **Time‑Attack** – unlimited spins but a ticking clock; each rotation costs 2 s.
3. **Blindfold** – hide solved columns; player must *know* they are right before hitting “Check”.

Minimal code changes: just parameterise the reducer that counts spins / seconds / hints.

---

## 7 Why this feels mathematically richer

* Co‑prime ring lengths create a non‑trivial group $C_{n_1}\times C_{n_2}\times C_{n_3}\times C_{n_4}$.
* Lock or gear constraints introduce *sub‑groups* and cosets, forcing the player to reason about equivalence classes rather than raw offsets.
* Entropy‑based hints mirror the information theory of Mastermind, giving players a natural entry point to optimal‑search thinking.

---

### TL;DR—Checklist to try first

1. **Change ring sizes** to 9‑8‑7‑6 and regenerate puzzles with a single‑solution BFS filter.
2. **Add a lock mechanic**: correctly solved columns freeze.
3. **Show soft feedback** (possible‑word count per column).
4. **Publish par scores** and track best‑of‑day.

That four‑step patch alone turns the experience from “poke until lucky” into a layered deduction game whose optimal play is genuinely engaging to master.


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
