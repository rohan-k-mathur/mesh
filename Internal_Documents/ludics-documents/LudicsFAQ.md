what Ludics is (in this app)
* Think of a dialogue as a tree of places you can talk (loci, paths like 0, 0.1, 0.2.1, …).
* Two roles “play” on that tree: Proponent (P) and Opponent (O). These are design roles, not fixed to one user—many users may author P/O moves.
* A move is an act at a locus:
    * PROPER (a substantive move), with polarity P or O.
    * DAIMON (†) to close a branch (convergence).
    * Some PROPER acts mark a parent as additive (⊕), where one child must be chosen.
* We persist P & O as two designs; the visible tree is the merge of those designs’ loci/acts.
* Your stepper runs a dialogical traversal that pairs positive and negative acts at the same locus; that trace powers the ribbons, indices, heat-map, convergence state, etc.

the surfaces users touch
* Arguments list, Cards, Claim pages – where everyday editing and nudging happen.
* LegalMoveChips / InlineMoveForm – post WHY (challenge) and GROUNDS (defend) against a claim/argument, with optional commit (fact) flows.
* CriticalQuestions – scheme-aware WHY/GROUNDS + a guarded “mark satisfied” toggle (requires an actual REBUT/UNDERCUT attached).
* Negotiation drawer (Ludics) – merged P/O tree, keyboardable, focusable by locus, with heat stripes and additive pickers; runs compile/step and shows a TraceRibbon.
* Representative Viewpoints – cohort selection + CQ coverage + “Address CQs” dialog to clear bottlenecks view-by-view.
* EntailmentWidget – classical + NLI entailment; can emit a mini Ludics viz and push WHY/Commit.

a realistic multi-user flow (day-1 → day-7)
0) kickoff
* Several users add arguments and cards (claim + reasons).
* Autoharvest links reasons/objections into the claim graph; warrants saved if present.
1) bridge to dialogue
* Anyone hits Discuss in Ludics on a row. The backend bridges the monological structure (Toulmin bits) into initial P acts under 0, 0.1, 0.2, … (safe if already bridged).
* We compile designs from moves and run one step in neutral.
2) first challenges & answers
* Someone clicks WHY (O), optionally picking a locus (default 0 or the claim locus).
    * The move gets a dedup signature, a 24h TTL (a soft “obligation window”), and a small entry in Trace.
* Others respond with GROUNDS (P), referencing which WHY they’re answering (we stick justifiedByLocus and schemeKey/cqId in meta).
* Optional: Commit a fact at that locus from the popover—this updates the Commitments State (CS) and emits a refresh.
3) additive choice & collisions
* When a P opener marks a node additive (⊕) (e.g., “choose exactly one mitigation”), the parent remembers the chosen child in usedAdditive.
* If both sides opened different children at the same base:
    * assoc mode: let it through; the stepper will flag an additive-violation later.
    * partial: preflight fails fast (dir-collision) and asks you to resolve first.
    * spiritual: preflight warns; you then delocate/fax one branch to a fresh base and re-run.
4) convergence & endorsement
* The traversal ends CONVERGENT when someone plays † (daimon) at a locus or the play has no more openings.
* If the final negative is an ACK, we mark endorsement (who endorsed, where). The ribbon shows decisive indices (which pairs mattered) and † hints.
5) critical-question housekeeping
* In CriticalQuestions (or “Address CQs” in RV), authors/mods can mark items Satisfied—but only after meeting the proof guard:
    * REBUT guard: there must be a rebuts/REBUTS edge or (when attacker is known) a strong NLI contradiction to the conclusion.
    * UNDERCUT guard: there must be an UNDERCUTS edge (warrant/inference attack).
* Anyone can still ask WHY or post GROUNDS; only the author/mod flips the status.
6) cohort shaping & coverage (views)
* In Representative Viewpoints, users pick selection rules (utilitarian/harmonic/JR), see CQ coverage and sequent entailment (⊢ Γ→Δ with verdicts), then:
    * Open all CQs for a view,
    * Copy Γ/Δ, Send Γ to dialogue, or Export the sequent as a card.
* The “Conflicts explained” links scroll+pulse the two clashing items (good for facilitation).

what the data is doing (underneath)
* dialogueMove rows store: deliberationId, targetType/id, kind, and payload.
    * Modern payloads include acts[] (we synthesize legacy WHY/GROUNDS to acts).
    * The signature dedups retries (WHY/GROUNDS/CLOSE).
* ludicDesign / ludicAct / ludicLocus persist the merged tree (compound unique on (dialogueId, path)).
* ludicTrace stores the last step’s pairs[{posActId,negActId,locusPath,ts}], usedAdditive, and decisiveIndices.
* claimEdge records rebuts/UNDERCUTS (Dung relation + specific attack type). CQ guards read these.
* events: routes emit dialogue:moves:refresh, dialogue:cs:refresh, and (optionally via SSE) claims:edges:changed, so the UI revalidates only when needed.

who can do what (permissions)
* WHY/GROUNDS/Commit: any signed-in participant (actorId saved on move).
* Mark CQ satisfied: claim author or moderator (server returns 403 otherwise).
* Promote to Claim: argument author (or anyone if enabled), then dialogue will target the new claim id.

how it stays fast & sane (concurrency/robustness)
* compileFromMoves runs in short transactions, skips additive-reuse errors on compile (the stepper will surface conflicts). A lock prevents thrash.
* stepInteraction is idempotent/cheap; pairs & heat-maps drive the UI.
* Dedup: SWR deduping + bus events; we only refetch on change (no polling storms).
* Signatures on WHY/GROUNDS prevent accidental double posts; WHY has a default deadlineAt.

practical “how to facilitate” with this
1. Start by carding the main claim, then click Discuss in Ludics.
2. Let a few WHYs land; ask answerers to post GROUNDS where the WHY is anchored.
3. If you see a ⊕, pick one branch first (usedAdditive remembers it). Resolve the rest via delocation if needed.
4. After a good run, hit † to close a branch; look for endorsement (ACK).
5. Sweep Critical Questions:
    * Use Attach suggestion (rebut/undercut) if the guard blocks.
    * Only the author/mod flips “Satisfied.”
6. In RV, open the view with the weakest CQ coverage; run “Address CQs,” clear the bottlenecks, and re-step.
7. Keep Commitments in sync by committing the facts you keep using in GROUNDS.

mental model in one line
Ludics gives your discussion a place to put each move (loci), a discipline for turn-taking (P/O acts, additive choices), and a receipt for where/why it converged (trace, decisive indices, endorsement). Everything else—the CQs, cards, sequent checks, evidence—plugs into that spine.


--

Great question. The short answer is: in our Ludics setup, **P/O are not people** and not permanent “teams.” They’re **roles at the level of a single move at a single place** in the discussion. That’s what lets many people with many stances fit cleanly into a two-polarity engine.

Here’s how it works in practice:

# The mapping rule (local, not global)

* At any locus (a specific question/step), there’s a **current thesis** being advanced.
* **Proponent (P)** means “move the thesis forward here” (assert, answer, pick a branch).
* **Opponent (O)** means “challenge/ask WHY here” (request justification, poke a hole).
* The same human can be P at one locus and O at another, even in the same session. Roles are **per-move**.

# Many people, one merged P/O tree

* We persist two **designs** (P and O) per dialogue, but **many users can author acts** in either design.
* Think of the P design as “the sum of all ways people try to advance this thread,” and O as “the sum of all ways people challenge it.” The UI still shows per-move authorship.

# More than two viewpoints without more than two roles

We get plurality from structure, not more polarities:

1. **Branching for alternatives**
   If there are 4 different policy options, we **open four child loci** under the same base. Supporters of each option add P-acts on *their* branch. O-acts can target any branch one by one.

2. **Additive (⊕) choices**
   Mark the parent additive to express “we must pick exactly one.” The engine remembers the chosen child (`usedAdditive`) but **keeps the other branches visible** (so minority options don’t disappear).

3. **Delocation (“spiritual” mode)**
   If two P choices collide under the same parent, we can **fax/delocate** one to a fresh base and run both lines in parallel—no one gets erased; the comparison becomes explicit.

4. **Multiple dialogues when needed**
   You can spin up **separate dialogues** for different camps (or representative viewpoints) and compare traces. RV already does something like this: it selects a cohort’s Γ/Δ and can “send Γ to dialogue” to seed a camp-specific P line.

# What the traversal (stepper) guarantees

* It pairs **P and O acts at the same locus** (not across the whole topic), so disagreements stay **local and legible**.
* It records a **trace** of pairings + **decisive indices** (which moves mattered) and marks **convergence** (†) and **endorsement** (ACK). That gives everyone a durable receipt of how the debate advanced.

# Where plurality shows up in the UI

* **Arguments / Cards**: many authors post WHY or GROUNDS; the same person can be P for one claim and O for another.
* **Critical Questions**: different people can propose attacks; only the claim author/mod toggles “satisfied” (with guards requiring REBUT/UNDERCUT when appropriate).
* **Representative Viewpoints**: multiple cohorts’ arguments are projected; you can open CQs per view, compare entailment (⊢ Γ→Δ), and act on weak spots.
* **Ludics panel**: you literally see divergent P branches co-exist, with O challenges hung where they belong.

# Why two roles are enough

* At any micro-decision (“do we accept *this* step?”) there are only two postures: **advance** or **challenge**.
* The *variety* of viewpoints is encoded in **which branch** people advance, **what grounds** they supply, and **where** they challenge—not by minting extra polarities.

# A concrete example

> City center pricing has options: \$0, \$5, \$10, \$15.
> Supporters of \$5 and \$10 both add P-acts under `0.($5)` and `0.($10)`.
> Opponents post WHY on each branch (e.g., equity, small-business impact).
> The parent is ⊕, so one child is chosen for this run; others stay documented.
> Later, if a different cohort runs the dialogue, they can pick a different branch and the traces are comparable.

**Bottom line:** The P/O structure is a *discipline for turn-taking at a point*, not a crude “for/against” across the whole issue. People map into it by the moves they choose at specific loci, and plurality lives in branching, additive choices, and parallel dialogues—not in proliferating roles.

Great question. In Mesh/Ludics you have three very different “centers of gravity” that can decide what happens next:

1. **Computation** (algorithms, formal semantics, entailment, metrics)
2. **Facilitation** (moderators / review panels)
3. **Democracy** (votes, approvals, JR-style cohort coverage)

They’re complementary, not rivals. A clean way to think about it is: **computation generates receipts and default recommendations; panels curate and keep the game fair; the community ratifies choices or picks among legitimate options.** Here’s exactly how that plays out, with concrete defaults you can ship.

---

## A. What kinds of “outcomes” exist—and who should decide?

| Outcome class                                       | Examples                                                   | Primary decider                                     | Why                                                                                                           |
| --------------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Epistemic** (is a claim warranted?)               | AF labels (IN/OUT/UNDEC), CQ “Satisfied?”, entailment ✓    | **Computation → Panel confirm**                     | Grounded semantics + CQ guards are objective and auditable; panel fixes mis-tagging or abuse.                 |
| **Procedural** (which path in the debate?)          | Pick child at ⊕, plan next locus, close branch (†)         | **Computation → Panel**                             | Ludics constraints (additive, convergence) create the discipline; panel resolves edge collisions/delocations. |
| **Allocative / Policy** (which option do we adopt?) | Choose \$5 congestion fee vs \$10, prioritize roadmap item | **Democracy** (vote), informed by **RV** + receipts | Community preference is the point; computation informs (coverage, entailment), not replaces.                  |
| **Editorial** (what to highlight/summarize/pin)     | Pin a view, publish a summary, archive a branch            | **Panel/Moderator** (with public rationale)         | Minimizes spam, ensures coherence. Panels publish short Why/Receipt.                                          |

> Rule of thumb: **truth-tracking ⇒ compute first; preference-tracking ⇒ vote**. Everything is visible and reversible via receipts.

---

## B. The pipeline (how a dialogue actually moves to a decision)

1. **Exploration**

   * People post **WHY/GROUNDS**, attach **REBUT/UNDERCUT** where needed.
   * Computation runs continuously: Ludics **step** (trace, convergence, additive use), AF **labels** (claim IN/OUT/UNDEC), CQ **coverage**, entailment **⊢ Γ→Δ**, RV **coverage stats**.

2. **Synthesis**

   * **Representative Viewpoints** selects coherent bundles (utilitarian / harmonic / JR).
   * Panel curates: fix obvious tagging errors, run **delocation** to resolve dir-collisions, ensure CQ guards are followed.
   * The system produces a **Recommended Decision** with receipts (see §E).

3. **Democratic choice** (when needed)

   * If the outcome is allocative/policy or multiple coherent options survive: open a **vote** (approval or ranked, below).
   * Ballot shows: options, **Γ/Δ** summaries, CQ coverage, entailment verdicts, AF labels, plus short panel Why.

4. **Enactment**

   * Result appears as **Decision** on the dialogue with a **DecisionReceipt** (details in §E).
   * Ludics may **†** a branch (convergence), RV pins the winning view, Cards/Claims get a status banner.

5. **Re-open triggers** (safety valve)

   * New **UNDERCUT/REBUT**, CQ flips to **unsatisfied**, or AF labels shift → decision goes to **“Under Review”** and stakeholders are pinged.

---

## C. What each layer does (and doesn’t)

### 1) Computation (objective, receipt-friendly)

* **Ludics**: enforces local turn-taking, additive choice, convergence; leaves a **trace** with decisive indices and endorsements.
* **Critical Questions**: “Satisfied” only if guards are met (REBUT/UNDERCUT edge or strong NLI contradiction for rebut).
* **Argumentation semantics** (grounded): labels claims **IN / OUT / UNDEC** from the claim graph.
* **Entailment**: classical + optional NLI assist; produces **steps** + **classicalPatterns** for audit.
* **Representative Viewpoints**: chooses k views by rule (utilitarian/harmonic/JR) and reports **coverage**.

**Important**: computation **recommends** and **documents**; it doesn’t impose policy by itself.

### 2) Panels / Moderators (curate, keep the game fair)

* Fix scheme/typing errors, collapse duplicates, apply **delocation** for incompatible directory choices, and publish short rationales.
* Emergency / safety calls (off-topic, harm) with visible justification.
* Can **confirm** computation outcomes (“CQ Satisfied” when the guard is met) but should not bypass them invisibly—if they override, it must be written to the receipt.

### 3) Democracy (choose among legitimate options)

* When preferences, budgets, or values matter: **run a vote**.
* The app should default to **Approval voting** for speed, and use **Ranked Choice (RCV)** when selecting >2 mutually exclusive options.
* JR contexts (maxcov views) can show **“group fully represented”** counts to protect minorities.

---

## D. Defaults you can ship (numbers you can tune later)

* **Vote method**:

  * 2–3 options → **Approval** (fast).
  * 4+ options or contentious → **RCV** (ranked).
* **Quorum**: at least **20%** of active room members (past 30 days) or **n ≥ 20** participants, whichever is larger.
* **Panel confirmation**: required only for **Epistemic** outcomes (CQ satisfy, AF labels corrections).
* **Override**: Community can overturn a panel’s editorial decision with **⅔ supermajority** and quorum.
* **Re-open**: any new UNDERCUT/REBUT attached to a “settled” claim flips it to **Under Review** automatically for 72h.

---

## E. Receipts (what we store & show)

Add a `DecisionReceipt` (or reuse your existing receipt pattern) that captures:

* **kind**: epistemic/procedural/allocative/editorial
* **subject**: claimId / locusPath / viewId / optionIds
* **inputs**: AF snapshot hash, Ludics trace id, CQ statuses, NLI scores, RV selection params (rule, k), tally JSON (if vote)
* **who/when**: emittedBy (panel/user/system), start/end ISO time, version
* **rationale**: panel note or auto-explanation (e.g., “CQ-2 under Expert Opinion satisfied by UNDERCUTS edge from claim X”)
* **rollback trigger**: conditions that auto-reopen (e.g., `newEdge: UNDERCUTS to subject.claimId`)

UI: render this as a **Decision stack** on the dialogue (“Computation → Panel → Vote”) with green checks and links to each receipt.

---

## F. How this looks in the UI (concrete touchpoints)

* **LegalMoveChips**: remain the primary WHY/GROUNDS entry, with commit popover; after each action emit `dialogue:moves:refresh`.
* **CriticalQuestions**: show per-CQ **“Needs rebut/undercut”** when guard blocks; “Attach” uses your suggestion hook; author/mod flips Satisfied.
* **Representative Viewpoints**: show **⊢ Γ→Δ** badge (counts + verdict), **CQ coverage**, **Conflicts pulse**; view menu has **Open all CQs / Copy ΓΔ / Send Γ to dialogue / Export card**.
* **DecisionBanner**: a compact banner on Cards/Claims (“Warranted by AF (IN) · Panel confirmed · Vote scheduled 2025-09-20”) + link to receipt.
* **Vote widget**: a single panel with options, Γ/Δ summaries, CQ coverage, AF labels, and panel Why. On close, write the `DecisionReceipt`.

---

## G. A realistic path through all three layers (example)

> **Topic:** Congestion pricing for Metrovale CBD.

1. People propose \$0/\$5/\$10/\$15 branches; P opens ⊕ at `0`.
2. O posts WHY at `0.5` (equity); P supplies GROUNDS and commits “equity program in place” at `0.5.1`.
3. CQ for Expert Opinion flips **Satisfied** only after an **UNDERCUT** is attached to the warrant claim.
4. AF labels key claims IN; RV shows a JR-satisfying view for \$10 with high coverage.
5. Panel confirms the CQ status and delocates a directory clash under `0.10` to `2.0`.
6. Community runs **Approval vote** among \$5/\$10; \$10 wins 61–39 with quorum.
7. App records a `DecisionReceipt` (inputs, rationale, tally). Card & dialogue display the outcome; a † closes the branch.
8. Two weeks later, a new undercut appears; the decision flips to **Under Review**. Panel reviews, confirms it doesn’t invalidate the outcome (receipt v2), or triggers a re-vote.

---

## H. What this buys you

* **Legibility**: every “why” and “how” is on record (trace, steps, CQ guards, receipts).
* **Fairness**: panels can fix mis-structure without silencing minority options; JR views show representativeness.
* **Agency**: the community picks among coherent options when preferences matter.
* **Safety**: new evidence auto-reopens; overrides are possible but accountable.

If you want, I can turn this into a short “Decision Playbook” doc with a config block you can drop into your repo (thresholds, defaults, receipt schema, and where each UI hook lives).
