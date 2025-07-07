Below is a **full Software-Requirements Specification (SRS)** for **Pivot** —the daily “rotating crossword ring” puzzle.
The structure mirrors the Word Rails SRS, so engineering, design, and product can reference both as a matched set.

---

# 1  Introduction

| Section             | Content                                                                                                                                                                                                                                                                                                               |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1.1 Purpose**     | Define functional, non-functional, and architectural requirements for Pivot, a browser/PWA word game built around three independently-spinning rings.                                                                                                                                                                 |
| **1.2 Scope**       | Single-page web app that serves one deterministic puzzle per day; no account required; optional cloud leaderboard.                                                                                                                                                                                                    |
| **1.3 Definitions** | **Ring** – one of the three concentric letter bands (inner R1, middle R2, outer R3). **Spoke** – the trio of letters that align vertically across rings at a given angle. **Spin** – a 45° clockwise (+1) or counter-clockwise (-1) rotation of an entire ring. **Par** – minimal spins needed to reach solved state. |

---

# 2  Overall Description

| Topic                         | Details                                                                                                   |
| ----------------------------- | --------------------------------------------------------------------------------------------------------- |
| **2.1 Product Perspective**   | Stands alone like NYT Wordle/Spelling Bee; embeds cleanly in host news sites.                             |
| **2.2 Major Functions**       | Daily board load, ring-spin interaction, validity checking, streak & stats, sharing, (opt.) leaderboards. |
| **2.3 User Classes**          | Casual (just solve), Optimizer (≤ par), Strategist (fewest spins + time).                                 |
| **2.4 Operating Environment** | Modern browsers ES2020+, touch & mouse; responsive ≥ 375 px; offline via PWA.                             |
| **2.5 Constraints**           | Payload < 180 kB; first puzzle interactive in < 1 s on 3 G.                                               |
| **2.6 Assumptions**           | System date accurate; JS enabled.                                                                         |

---

# 3  System Features (Functional Requirements)

| ID       | Requirement                                                                                                        |
| -------- | ------------------------------------------------------------------------------------------------------------------ |
| **F-01** | Render three concentric SVG/CSS rings (R1,R2,R3), each with 8 letter tiles.                                        |
| **F-02** | Accept drag or click-arrow input to rotate one ring ±45 °. Count each 45 ° as **1 spin**.                          |
| **F-03** | After each spin, recompute the eight spoke words (R1→R3 letters).                                                  |
| **F-04** | Validate each 3-letter spoke against local dictionary; colour indicator per spoke (green = valid, grey = invalid). |
| **F-05** | Detect victory when **all eight spokes** are valid simultaneously.                                                 |
| **F-06** | Track spins used *this puzzle* and compare to stored **par**; award Gold (≤ par), Silver (≤ par+2), Bronze (else). |
| **F-07** | Persist local stats: total solves, average spins, Gold/Silver counts, daily streak.                                |
| **F-08** | Provide share-card text `Pivot #217  🎯 7 spins  🥈` copied to clipboard.                                          |
| **F-09** | Load puzzle by date; lock board once solved; countdown to next puzzle.                                             |
| **F-10** | (Opt.) POST anonymized result to Supabase; backend verifies SHA-1 of solved board.                                 |

---

# 4  Non-Functional Requirements

| Category        | Target                                                             |
| --------------- | ------------------------------------------------------------------ |
| Performance     | ≤ 100 ms spin-response; < 1 s LCP on 3 G.                          |
| Accessibility   | WCAG 2.2 AA; full keyboard control (Tab selects ring, ←/→ spins).  |
| Reliability     | Pre-baked year of puzzles; hash verification to prevent tampering. |
| Security        | No PII in localStorage; HTTPS only.                                |
| Maintainability | Frontend packaged as Vite library < 5 kB diff per release.         |

---

# 5  External Interfaces

| Interface           | Spec                                                                                                       |
| ------------------- | ---------------------------------------------------------------------------------------------------------- |
| **UI**              | React + Tailwind; rings rendered via SVG with group `transform: rotate()` animation.                       |
| **Puzzle Manifest** | Static JSON `{date,len:3,start:[24 letters],par,optimal_hash}`. `start` = concatenated R1,R2,R3 clockwise. |
| **Result API**      | `POST /pivot/result` `{date, spins, grade, board_hash}` authenticated by signed cookie (if account).       |

---

# 6  Software Architecture

```
┌───────────────┐
│  Generator    │ (Node script, offline)
└───┬───────────┘
    │ manifest.json
┌───▼───────────┐
│  CDN / S3     │
└───┬───────────┘
    │ fetch
┌───▼───────────┐     optional
│ React SPA     │───► Supabase (scores)
└───────────────┘
```

### 6.1 Frontend Modules

1. **RingCanvas** – draws rings & handles spin gestures.
2. **GameState** – Zustand or XState finite-state machine.
3. **WordChecker** – WASM DAWG for 3-letter words (< 12 kB gzipped).
4. **StatsStore** – IndexedDB via idb-keyval.
5. **ShareModal** – builds share text + emoji grade.

---

# 7  Puzzle Generation Algorithm

```
Input: 3-letter dictionary D (≈ 1 600 words)
Goal: choose 8 target words W[0..7], and spin offsets s1,s2,s3 so that:
      - initial board B0 = rotate(R1,s1) ∪ rotate(R2,s2) ∪ rotate(R3,s3)
      - shortest composite spin sequence to reach solved board B* has length d∈[5,9]
Steps:
1. Randomly pick 8 distinct 3-letter words (all letters A-Z).
2. Place them on the 8 spokes clockwise to form solved board B*.
3. Search backward: random sequence of x spins (5–9) → produce B0.
4. Verify that *no shorter* sequence solves (IDA* search) – gives **par = x**.
5. Store `{start_letters=B0, par=x, hash=SHA-1(B*)}`.
```

---

# 8  User Flows

### 8.1 First-Time User

1. Landing modal “Spin rings until every spoke is a word. Drag or use arrows.”
2. Dismiss → tutorial board (par = 2) auto-loads.
3. After win → streak = 1 modal, share button.

### 8.2 Daily Returner

1. Open site → loads today’s puzzle.
2. If solved → board locked; shows spins, grade, countdown.

### 8.3 Edge / Error

* Offline: service-worker serves cached manifest; if none, show “Come back online.”
* Wrong system date: banner prompt to correct.

---

# 9  Product Development Roadmap

| Phase           | Weeks   | Scope                                                                  | Exit Criteria                     |
| --------------- | ------- | ---------------------------------------------------------------------- | --------------------------------- |
| **0-Planning**  | 0       | Approve SRS & design mockups                                           | Signed off.                       |
| **1-MVP**       | 1-4     | RingCanvas, spin logic, local validation, tutorial board               | Playable desktop/mobile.          |
| **2-Alpha**     | 5-6     | Generator pipeline, PWA, share-card, sound/animation polish, a11y pass | Internal test (50 users).         |
| **3-Beta**      | 7-8     | Stats, streaks, par grades, confetti, bug bash                         | Public soft-launch on sub-domain. |
| **4-Launch v1** | 9-10    | Leaderboard backend, account OAuth, archive browser                    | 10 k MAU, < 0.2 % error rate.     |
| **5-Growth**    | ongoing | Theme packs (emoji rings), 4-letter weekend mode, localization         | Revenue ≥ infra.                  |

---

# 10  Project Management

* **Methodology**: Kanban with weekly demo.
* **CI/CD**: GitHub Actions → Playwright tests → Cloudflare Pages preview → main.
* **Definition of Done**: 90 % unit coverage, no axe-core violations, design QA pass.

---

# 11  Risks & Mitigations

| Risk                                            | Prob | Impact | Mitigation                                                                                |
| ----------------------------------------------- | ---- | ------ | ----------------------------------------------------------------------------------------- |
| Ring-drag on mobile feels fiddly                | Med  | High   | Implement both drag & “tap + arrow” gesture; add snap animation.                          |
| Dictionary spoilers (players brute-force)       | Low  | Med    | Use hash-only validation; dictionary lives client-side but 3-letter list is small anyway. |
| Multiple optimal solutions break par uniqueness | Med  | High   | Generator runs IDA\* check; ties resolved by extra dummy spin injection.                  |

---

# 12  Appendices

* **A.** Three-letter dictionary pruning script.
* **B.** UI colour palette & WCAG contrast report.
* **C.** Play-test rubric (difficulty vs. spins used).

Example: 

Below is a **worked-through daily “Pivot” puzzle** showing

1. the *published* start board that players see,
2. each spin the solver makes (six spins total, which equals the puzzle’s par), and
3. the final solved board where every spoke is a real 3-letter word.

You can reuse this example in play-testing, tutorials, or design docs.

---

## 0 Legend & layout

```
          Ring-3 (outer)      index ↑
        ┌───┬───┬───┬───┬───┬───┬───┬───┐
        │ 0 │ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │ 7 │  ← clockwise positions
┌───────┼───┼───┼───┼───┼───┼───┼───┼───┤
│ Ring-2│   │   │   │   │   │   │   │   │
└───────┼───┼───┼───┼───┼───┼───┼───┼───┤
        │   │   │   │   │   │   │   │   │  Ring-1 (inner)
        └───┴───┴───┴───┴───┴───┴───┴───┘
```

*At any moment a **spoke word** is the vertical trio of letters at the same index (R1-R2-R3).*

---

## 1 Puzzle parameters

| Item                                | Value                             |
| ----------------------------------- | --------------------------------- |
| Word length per spoke               | 3                                 |
| Rings                               | 3 (R1 inner, R2 middle, R3 outer) |
| Spokes                              | 8                                 |
| **Par (optimal spins)**             | **6**                             |
| Puzzle hash (SHA-1 of solved board) | `0bf1a5…`                         |

---

## 2 Solved board (kept server-side)

Clockwise from index 0 the eight correct spoke words are:

```
0  SUN   4  TAR
1  MAP   5  HOP
2  OIL   6  NET
3  PEG   7  LOG
```

So the canonical ring strings (clockwise) are:

| Ring | Letters             |
| ---- | ------------------- |
| R1   | **S M O P T H N L** |
| R2   | **U A I E A O E O** |
| R3   | **N P L G R P T G** |

---

## 3 Published start board (offsets: R1 +1, R2 +2, R3 +3)

```
Index →      0   1   2   3   4   5   6   7
Ring-3   │   P   T   G   N   P   L   G   R
Ring-2   │   E   O   U   A   I   E   A   O
Ring-1   │   L   S   M   O   P   T   H   N
           ↓   ↓   ↓   ↓   ↓   ↓   ↓   ↓
Spoke     LEP SOT MUG OAN PIP TEL HAG NOR   ← only 3 of 8 are valid
```

Player sees eight **grey** spokes, three of which (*SOT, MUG, PIP*) are yellow to indicate they’re already real words.

---

## 4 Step-by-step playthrough (6 spins)

| #     | Action (45° spin)      | Ring offsets (R1,R2,R3) | Spokes now (valid ✓ / invalid ✗)                          |
| ----- | ---------------------- | ----------------------- | --------------------------------------------------------- |
| **0** | — start board          | **+1, +2, +3**          | LEP✗  SOT✓  MUG✓  OAN✗  PIP✓  TEL✗  HAG✓  NOR✗            |
| **1** | Rotate **R2 −1** (CCW) | +1, **+1**, +3          | LOP✓  SUT✗  MAG✓  OIN✗  PEP✓  TAL✗  HOG✓  NER✗            |
| **2** | Rotate **R1 −1**       | **0**, +1, +3           | SOP✓  MUT✗  OAG✗  PIN✓  TAP✓  HAL✗  NOG✓  LER✗            |
| **3** | Rotate **R2 −1**       | 0, **0**, +3            | **SUN✓ MAP✓ OIL✓ PEG✓ TAR✓ HOP✓ NET✓ LOG✓**               |
| **4** | Rotate **R3 −1**       | 0, 0, +2                | SUT✗ MAG✓ OIN✗ PEP✓ TAL✗ HOG✓ NER✗ LOP✓                   |
| **5** | Rotate **R3 −1**       | 0, 0, +1                | SUG✗ MAN✓ OIP✗ PEL✗ TAG✓ HOR✗ NEP✗ LOT✓                   |
| **6** | Rotate **R3 −1**       | **0, 0, 0**             | **SUN✓ MAP✓ OIL✓ PEG✓ TAR✓ HOP✓ NET✓ LOG✓** ← **Victory** |

**Spins used = 6 → matches par → Gold medal 🥇**

*(Notice how one wrong ring—R3—knocked the board out again at step 4, forcing three focused spins to finish.
This illustrates the “one move changes three spokes” deduction that makes Pivot sudoku-like.)*

---

## 5 End-of-game screen

```
Pivot #042      🥇  6 spins   Streak 🔥 3
SUN MAP OIL PEG TAR HOP NET LOG
```

A “Copy” button places the share-string on the clipboard.

---

### What this example demonstrates

| Design goal                  | How it shows up in playthrough                                               |
| ---------------------------- | ---------------------------------------------------------------------------- |
| **Few but meaningful moves** | Six spins, each altering 3 spokes; every decision is visible.                |
| **Constraint propagation**   | Fixing R1+R2 (step 3) briefly solved, but R3 still wrong—player sees why.    |
| **Clear par metric**         | 6 spins optimum; solver who flails will land in Silver (7-8) or Bronze (9+). |
| **Short tutorial potential** | Steps 1-3 themselves form a tiny tutorial of “rotate → check spokes”.        |

Use this walk-through in onboarding slides or QA scripts to verify rendering, spin gestures, word-validation, medal awarding, and share-card generation.


---

### ✅ Pivot specification ready

This SRS, combined with the earlier Word Rails spec, provides a clear blueprint for design mock-ups, sprint tickets, and engineering tasks. Let me know if you’d like wireframes, generator pseudocode in detail, or localisation considerations next!
