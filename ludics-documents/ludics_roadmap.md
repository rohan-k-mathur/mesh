#  A single, comprehensive roadmap with status checklists to 

# Roadmap — *Locus Solum*–informed architecture & delivery plan

> **Purpose.** Unify the “v3” roadmap with the tightened “v4” feedback into one code‑first document. It maps directly onto our current surfaces (multi‑act moves, compile/step, LociTree, Negotiation Drawer, commitments) and is aligned to the Quickstart + Parts 1–9 notes.  
> **Scope.** Core runtime (loci, polarity, daimon, orthogonality, behaviours), local algebra at addresses (with/plus; multiplicatives), delocation/consensus, exponentials at addresses with uniformity, and (optional) \(A ⊢ B\) inspector.

**Quick links**
- Quickstart (Parts 1–9): `LocusSolum_Quickstart_Parts1-9.pdf`
- Glossary: `Ludics_Glossary_Complete.pdf`
- One‑page card: `Ludics_CheatSheet_Card.pdf`

---

## Status roll‑up (milestones)

| Milestone | Status | Owners | Notes |
|---|---|---|---|
| A — Core ludics runtime | ☐ Planned ☐ In‑Progress ☐ Done |  | Acts; directories; daimon; orthogonality; behaviours |
| B — Delocation, consensus, composition | ☐ Planned ☐ In‑Progress ☐ Done |  | Shift/fax; tester library; composition modes |
| C — Exponentials + uniformity | ☐ Planned ☐ In‑Progress ☐ Done |  | Copy/erase at addresses; saturation; α‑equiv |
| D — Behaviours in product | ☐ Planned ☐ In‑Progress ☐ Done |  | Contradictions; optional arrow inspector |
| E — Tooling/fixtures/observability | ☐ Planned ☐ In‑Progress ☐ Done |  | Fixtures; metrics; CI |

> Tick the milestone box when all its tasks’ DoD checklists are complete.

---

## Milestone A — Finish the core **ludics runtime**

**Goal.** Enforce the primitives—**loci/addresses**, **polarity & daimon**, **interaction → orthogonality**, **behaviours = B⊥⊥**—in one coherent stepper/API.

### A1) Acts as the truth (first‑class)

**Why.** Dialogue moves decompose into **actions at loci** with polarity (±) and ramification (openings).  
**Ship**
- `payload.acts[]` = `{ id, polarity:'pos'|'neg'|'daimon', locusPath, openings?: number[], justifiedBy?: {locusPath, actId}, meta? }`.
- `compileFromMoves` prefers `acts[]` (legacy expansion only when absent).
- Maintain **alternation per locus** with `lastPolarityAt[locus]` and **justification pointers**.

**DoD**
- `NarratedTrace` renders `acts[]` with justification; incoherent/alternate‑breaking moves are rejected immediately.

**Status checklist**
- [ ] Data shape adopted in payloads
- [ ] Alternation guard added to stepper
- [ ] Justification pointer stored & rendered
- [ ] Legacy expansion path covered by tests

---

### A2) Directories & additivity (local)

**Why.** **With** at a base locus is **set‑intersection**; **plus** is its polar dual. Make **directory** (immediate children) visible to drive UI and tests.  
**Ship**
- Persist `directory` at each base; mark positive openers with `isAdditive`.
- UI: **radio** for additive siblings; none for multiplicative branches.

**DoD**
- Attempting a second child under an additive parent yields **DIVERGENT** with **decisiveIndex**.

**Status checklist**
- [ ] Directory persisted & exposed
- [ ] `isAdditive` flag on openers
- [ ] Radio behaviour in LociTree
- [ ] Divergence on 2nd child tested

---

### A3) Daimon (†) and closed‑locus hints

**Why.** `♦` ends a run; when a locus has **no openings**, `♦` is the right suggestion.  
**Ship**
- Stepper returns `daimonHints[]` for closed loci; include `endedAtDaimonForParticipantId`.

**DoD**
- UI shows a † chip when appropriate; traces mark convergence with `♦` and “who played ♦”.

**Status checklist**
- [ ] `daimonHints[]` in `StepResult`
- [ ] UI † chip
- [ ] End‑of‑run attribution rendered
- [ ] Tests for closed‑locus suggestion

---

### A4) Orthogonality driver & behaviours service

**Why.** **Meaning = what passes all counter‑tests.** Behaviours are sets **closed under bi‑orthogonality**; for **additive** bases we expect **internal completeness** (saturation by interaction).  
**Ship**
- `POST /api/orthogonality/run` → `{ converges:'yes'|'no'|'divergent', decisiveIndex, reason }` with **fuel** (max steps) to classify genuine divergence vs timeout.
- `GET /api/behaviours/:id` → `{ base, directory, generators, incarnation[] }`.

**DoD**
- “Behaviour Inspector” shows **tests (= B⊥)**, **incarnation (|B|)**, and **saturated?** for additive bases.

**Status checklist**
- [ ] Driver with fuel/termination
- [ ] Decisive index in responses
- [ ] Behaviour Inspector UI
- [ ] Additive “saturated?” flag

---

## Milestone B — **Delocation**, **consensus**, **composition layers**

**Goal.** Resolve directory clashes with **shift/delocation**; surface **consensus testers** (divergence = draw); expose **assoc/partial/spiritual** composition knob.

### B5) Delocation helper (“fax”)

**Why.** Make colliding bases **compatible** before additive composition by renaming loci (e.g., `.L/.R`).  
**Ship**
- `delocate(design, tag: '.L'|'.R')` injective renaming + collision detector that proposes tags and re‑checks orthogonality.

**DoD**
- Behaviour Inspector: **“Shift to .L/.R”** button; expected with/plus regained on disjoint bases.

**Status checklist**
- [ ] Helper `delocate()`
- [ ] Collision detector
- [ ] UI shift buttons
- [ ] Re‑check after shift tests

---

### B6) Consensus testers (divergence = draw)

**Why.** Ludics is a **game by consensus**; use testers that **herd** play to the rule and label non‑compliance as **draw**.  
**Ship**
- Tester library: **herd‑to‑σ·i**, **punish‑σ·j**, **timeout‑to‑draw** patterns.
- Negotiation Drawer: **attach tester**; annotate traces as **draw by consensus** when appropriate.

**DoD**
- Habitual divergence becomes either convergent or explicitly **draw** (with attached tester tag).

**Status checklist**
- [ ] Tester library scaffold
- [ ] Herd‑to template
- [ ] Drawer integration
- [ ] “Draw by consensus” label

---

### B7) Composition mode (assoc/partial/spiritual)

**Why.** Some compositions are only **partial** (require compatibility); **spiritual** recovers completeness via explicit shifts.  
**Ship**
- Engine `compositionMode: 'assoc'|'partial'|'spiritual'`; **partial** blocks incompatible joins; **spiritual** auto‑inserts shifts.

**DoD**
- Engine panel toggle; traces annotate **“shift inserted”**.

**Status checklist**
- [ ] Engine flag & wiring
- [ ] Panel toggle
- [ ] Shift auto‑insert
- [ ] Mode‑specific tests

---

## Milestone C — **Exponentials + uniformity** (addresses, not globals)

**Goal.** Implement **copy/erase** at addresses with **freshness** and **uniformity**; add **saturation tests**.

### C8) Copy/erase protocol

**Why.** Contraction = copy via **fresh children** `σ·0, σ·1,…`; weakening = `♦`.  
**Ship**
- `POST /api/loci/copy` → `{ children: string[], bijection: child→parent }`; keep a **freshnessCounter** per base.
- Stepper spawns **independent sub‑runs** on each child.
- **Saturation tests** probe each child (normalize or `♦`).

**DoD**
- “Copy” spawns children; **Saturation** light goes green when all probed children normalize.

**Status checklist**
- [ ] Copy endpoint
- [ ] Freshness counter
- [ ] Sub‑run scheduling
- [ ] Saturation tests

---

### C9) Uniformity oracle (α‑equivalence)

**Why.** Quantifiers/copies must be **parameter‑independent**; compare traces **modulo renaming** (`σ·0↔σ·1`).  
**Ship**
- `POST /api/uniformity/check` compares **normalized** traces under α‑renaming; returns counterexample if violated.

**DoD**
- Same design across fresh copies yields α‑equivalent traces; violations show a minimal diff.

**Status checklist**
- [ ] Normalizer for traces
- [ ] α‑renaming compare
- [ ] Counterexample diff
- [ ] CI coverage

---

## Milestone D — Behaviours in product: **contradictions** & (optional) **arrow**

**Goal.** Make **behaviours**, **incarnation**, and contradictions operational; optionally expose the **arrow** \(A ⊢ B\) as a contract checker (programs as **adapters**).

### D10) Commitments as designs; contradictions by interaction

**Why.** Stores are sets of **designs** (facts/rules); contradictions fall out from **runs** (orthogonality failures).  
**Ship**
- Extend commitments: `{ facts: Design[], rules: Design[] }`.
- Run **pairwise tests**; flag minimal opposing pairs with **decisive indices** and locus/act links.

**DoD**
- “Contradictions” pane lists failing pairs and the exact act/locus causing failure.

**Status checklist**
- [ ] Commitments data model
- [ ] Pairwise runner
- [ ] Decisive‑index reporting
- [ ] UI pane

---

### D11) Behaviour / Arrow inspector (optional)

**Why.** \(A ⊢ B := \{ D \mid \forall a∈A, ⟨D|a⟩∈B \}\) — verify `D` *drives* any `A`‑test into `B`.  
**Ship**
- Inspector tab: upload `A`, `B`, `D`; certify `D ∈ (A ⊢ B)` iff runs land in `B` (i.e., orthogonal to `B⊥`).

**DoD**
- Clear pass/fail with trace highlights.

**Status checklist**
- [ ] Upload & wiring
- [ ] Checker path
- [ ] Trace highlights
- [ ] Doc examples

---

## Milestone E — Tooling, **fixtures**, **observability**, **CI**

**Goal.** Representative fixtures, visible metrics, and CI guards.

### E12) Fixtures pack

- **Additives (local)**: with = ∩ at a locus; **disjoint negatives** ⇒ `|B & C| ≅ |B|×|C|`.  
- **Multiplicatives**: two independent bases; factorized tests.  
- **Exponentials**: copy/erase + saturation.  
- **Quantifiers/uniformity**: fresh names; α‑equivalence of traces.  
- **Consensus**: divergence→draw + herd‑to‑σ·i tester.

**DoD**
- `npm run ludics:fixtures` seeds designs/tests; CI runs the orthogonality driver and checks expected statuses.

**Status checklist**
- [ ] Seeds added
- [ ] CI job
- [ ] Docs snippet
- [ ] Screenshots in PR

---

### E13) Observability & metrics

Emit `ludics.run` events `{ locus, stepNo, polarity, actionId }` and counters:  
`runs.total`, `runs.convergent`, `runs.divergent`, `runs.stuck`, `daimon.playedBy`. Use this to answer “**are behaviours saturated?**” over time.

**Status checklist**
- [ ] Event schema
- [ ] Dashboard
- [ ] Budget alarms
- [ ] Weekly trend

---

## Tight API / Type drops

### `StepResult` (engine → UI)

export type StepResult = {
  status: 'ONGOING'|'CONVERGENT'|'DIVERGENT'|'STUCK';
  pairs: { posActId?: string; negActId?: string; locusPath: string; ts: number }[];
  decisiveIndex?: number;
  endedAtDaimonForParticipantId?: 'Proponent'|'Opponent';
  usedAdditive?: Record<string, string>; // parent -> chosen child
  daimonHints?: { locusPath: string; reason: 'no-openings' }[];
  reason?: 'timeout'|'incoherent-move'|'additive-violation'|'no-response';
};

## Orthogonality Run:

POST /api/orthogonality/run
body: { designId: string, testId: string, fuel?: number }
resp: { converges: 'yes'|'no'|'divergent', decisiveIndex?: number, reason?: string }

## Delocation:

POST /api/delocate
body: { designId: string, tag: '.L'|'.R' }
resp: { designId: string, directory: number[] }

## Copy/erase & uniformity:

POST /api/loci/copy
body: { baseLocus: string, count?: number }
resp: { children: string[], bijection: Record<string,string> } // child -> parent

POST /api/uniformity/check
body: { designId: string, children: string[] }
resp: { uniform: boolean, counterexample?: { childA: string, childB: string, diffAt: string } }

## Risks & mitigations

Trace blow‑up on many copies → cap child count; use saturation subsets that still witness uniformity.

False “uniform” due to shallow diffs → compare normalized traces under α‑renaming.

Ambiguous failures → always set status + reason and a decisiveIndex.

## Suggested order of work (2–3 sprints)

Sprint 1 — Milestone A (+ basic fixtures): acts, alternation, † hints, orthogonality driver, Behaviour Inspector with incarnation.

Sprint 2 — Milestone B & C: delocation + consensus testers; copy/erase + uniformity oracle; saturation tests.

Sprint 3 — Milestone D & E: contradictions in commitments; (optional) arrow inspector; observability & CI fixture pack.

## Appendix — Why this is “right” in Ludics (and useful to users)

Local algebra at addresses. Additives are local (with = ∩), multiplicatives factor across independent loci, exponentials are copy/erase at addresses; the UI already manipulates loci and directories, so the fit is one‑to‑one.

Meaning by tests. The orthogonality driver and Behaviour Inspector make B = B⊥⊥ operational—no black boxes.

Consensus & delocation. “Divergence = draw” with consensus‑forcing testers gives practical levers; delocation/shift keeps compositions compatible (assoc/partial/spiritual).

Separation & incarnation; uniformity. Design equality is determined by tests; incarnation shows what materially matters; quantifiers/copies rely on uniformity (α‑equivalence under fresh names).
"""