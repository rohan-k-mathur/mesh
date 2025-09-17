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
