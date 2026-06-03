# Challenging Answered Critical Questions — Ontology & Ideation

**Status:** ideation / open brainstorm (pre-spec, pre-roadmap)
**Owner:** Isonomia argument-write surface / dialectical core
**Relation to prior work:** downstream of the
[ANSWER_CRITICAL_QUESTIONS_OVER_MCP_SPEC.md](ANSWER_CRITICAL_QUESTIONS_OVER_MCP_SPEC.md)
sequence (now shipped, S1–S6) and the public answered-CQ UI on the argument page.
That work gave us a *write path* to answer CQs and a *read path* to display
answers. This doc opens the next question: **once a critical question is answered,
how can it be contested — and what kind of object is an "answer" such that it can
be contested at all?**

**Grounded against:**
- [SCHEMES_ONTOLOGY_DECISION.md](SCHEMES_ONTOLOGY_DECISION.md) — CQs as Ludics
  opponent designs; a scheme's identity *is* its critical questions; "full standing"
  = surviving every position left open against it.
- [ASPIC_SYSTEM_ARCHITECTURE.md](ASPIC_SYSTEM_ARCHITECTURE.md) /
  `lib/aspic/attacks.ts` — REBUT / UNDERMINE / UNDERCUT, `Kn` axioms, defeasible
  vs. strict rules.
- [DIALOGUE_UI_PHASE_3D_SPEC.md](DIALOGUE_UI_PHASE_3D_SPEC.md) — WHY / GROUNDS
  moves, `BurdenOfProof` (PROPONENT / CHALLENGER), closure conditions,
  `lib/dialogue/burdenGuards.ts`.
- `lib/cqs/answerOverMcp.ts` — session-scoped self-canonicalisation (the AI floor).
- `lib/models/schema.prisma` — `CQStatus`, `CQResponse`, `CQAttack`,
  `CQActivityLog`, `CQStatusEnum`, `ResponseStatus`.

> **Scope discipline.** This is an *ideation* document. No schema deltas, no API
> contracts, no migration steps are committed here. The goal is to settle the
> ontology and surface the open questions so a later spec/roadmap can be scoped
> with confidence. Where the model is described, it is described *as it stands
> today* (for grounding), not as a proposal.

> **Settled call (2026-06-02).** An answer (and a challenge to one) materialises
> as a **scheme-free Claim / concession by default**, *not* as a full
> scheme-instance Argument. Promotion to a scheme-bearing argument is a
> deliberate, challenge-triggered escalation (§4.2, §7 Q5). This is the decision
> that keeps Stance B finite — see §4.

---

## 1. The question, precisely

The public argument page now shows **answered critical questions**. The natural
next user affordance is: *"I don't accept that answer — let me challenge it."* But
before we can build a challenge button we have to answer a prior, ontological
question:

> **What kind of object is an answer to a critical question?**

Because the *thing you can build a challenge against* depends entirely on *what
kind of thing the answer is*. You challenge a claim differently than you challenge
a vote, and differently again than you challenge a move in a game. Today the
codebase quietly commits to one of these without having decided it on purpose —
and that latent commitment is what blocks a clean challenge mechanism.

---

## 2. What a CQ answer *is* today (the status quo ontology)

In the current model an answer to a critical question is a **workflow /
obligation-discharge record** — not a node in the argument graph.

Concretely it is a `CQResponse` row hanging off a `CQStatus` (the obligation
holder, keyed by `(targetType, targetId, schemeKey, cqKey)`):

- `groundsText` — the answer prose.
- `evidenceClaimIds[]` / `sourceUrls[]` — pointers *out* to evidence (claims, URLs).
- `responseStatus` — `PENDING → APPROVED → CANONICAL` (or `REJECTED` / `SUPERSEDED`
  / `WITHDRAWN`).
- a lifecycle that flips the parent `CQStatus.statusEnum`:
  `OPEN → PENDING_REVIEW → SATISFIED` (with `PARTIALLY_SATISFIED` and `DISPUTED`
  also defined but under-used).

So, ontologically, **a CQ answer today is metadata about a dialectical move, not
the move itself.** It records *that* a position the opponent could occupy has been
defended/conceded, plus the text used to do so. It points *at* claims as evidence
but is not itself a claim or an argument. It cannot be the *target* of an attack
edge, because attack edges (REBUT/UNDERMINE/UNDERCUT) in `lib/aspic/attacks.ts`
target arguments, claims, and edges — never `CQResponse` rows.

### 2.1 The category mismatch this creates

The research programme treats each CQ as a **position an opponent may occupy** — a
Ludics opponent design `q_i^opp`, the challenge move the opponent has the *right*
to play. An argument has "full standing" only when its design survives every such
position ([SCHEMES_ONTOLOGY_DECISION.md](SCHEMES_ONTOLOGY_DECISION.md)). By
symmetry, an **answer** is a *proponent counter-move* — itself a design that, in
principle, can be played against.

But the data model makes the answer an **inert workflow record** while the things
you can actually attack are arguments/claims/edges. That is the gap:

> The formal theory says an answer is a *move that can be countered*. The data
> model says an answer is a *status annotation that can only be out-voted or
> superseded by an authority.*

This is exactly why "how do I challenge an answer?" has no clean answer yet — and
why the only recourse today is moderator supersession or re-raising the CQ.

---

## 3. Three ontological stances on "what is an answer"

Each stance implies a different challenge mechanism. They are not mutually
exclusive — see §5.

### Stance A — Answer as obligation-discharge record (status quo)

An answer is a vote/annotation that the obligation is met. You cannot *attack* it
directly; you can only:

- submit a **competing `CQResponse`** to the same `CQStatus` → with two non-null
  candidates the status can go `DISPUTED`; a human author/moderator
  re-canonicalises;
- **re-raise the CQ** (reset the obligation to `OPEN`);
- attack the **underlying argument** and link that attack to the CQ via the
  existing `CQAttack` provenance row.

**Pros:** cheap; mostly already wired; no new graph objects.
**Cons:** dialectically thin. An answer can be *out-voted* or *superseded by an
authority* but never *defeated by reasoning*. No defeasibility semantics on the
answer itself. `DISPUTED` is resolved by fiat, not computation.

### Stance B — Answer as a (defeasible) argument/claim — a first-class graph node

The answer's `groundsText` + evidence *is* an argument for the proposition
**"CQ_k is satisfied for argument A under scheme S."** Materialise it (or derive
it) as a Claim/Argument ("answer-claim"). Then challenging it is just the existing
machinery:

- **UNDERMINE** its cited evidence premises,
- **REBUT** the "is-satisfied" conclusion,
- **UNDERCUT** the inference ("your grounds don't actually address *this* CQ").

A *successful* attack (under ASPIC+/Ludics evaluation) is what flips
`CQStatus.statusEnum SATISFIED → DISPUTED` — **computed, not voted.** The
`DISPUTED` enum value finally gets real semantics.

**Pros:** most honest under the Ludics framing — an answer becomes a proponent
design living in `⊥⊥`-closure that can be knocked out. Reuses all existing attack
machinery + `CQAttack` provenance linkage. Makes self-canonicalisation *defeasible*
rather than final (see §6).
**Cons:** every canonical answer needs a backing claim/argument node; you need a
mapping rule "answer defeated ⇒ CQ reopened"; **raises the regress worry**
(see §4) — answers that are arguments have schemes that have CQs…

### Stance C — Answer as a dialogue / Ludics move (the GROUNDS move)

The answer is literally the proponent's **GROUNDS** reply to a **WHY** challenge;
canonicalisation is just "this play survived so far." Challenging = playing the
next opponent move in the dialogue
([DIALOGUE_UI_PHASE_3D_SPEC.md](DIALOGUE_UI_PHASE_3D_SPEC.md),
`lib/dialogue/burdenGuards.ts`).

**Pros:** most faithful to the formal core; burden-of-proof and termination are
native concepts.
**Cons:** heaviest to surface for casual/product users; dialogue state is a
heavier object than a claim node.

---

## 4. The regress problem (Stance B's hard question)

> *If CQ responses are themselves arguments, and arguments have schemes with CQs
> attached, doesn't that produce an infinite regress of CQs and responses with no
> bottom?*

**Yes in principle, no in practice — and the reason why is exactly what makes
Stance B defensible rather than a hack.** This is the classic **Agrippa's
trilemma** (justify a claim → its justification needs justification → …).
Argumentation theory already supplies the escape routes; Stance B's job is to
*adopt them explicitly* rather than pretend the regress doesn't exist. Three
mechanisms, in order of importance.

### 4.1 Defeasibility makes the regress *potential*, not *actual*

The decisive move: **an answer-claim has full standing until a CQ is actually
raised against it.** CQs are not pre-existing obligations that must be
pre-emptively discharged — they are *positions an opponent may occupy*
([SCHEMES_ONTOLOGY_DECISION.md](SCHEMES_ONTOLOGY_DECISION.md): each CQ is an
opponent design that *can* be played). So the tree of CQs/answers is **never
instantiated all at once**; it deepens by exactly one level each time a human or
agent *does the work* of challenging.

The chain terminates the moment nobody plays the next move — the Ludics
convergence / **daimon (†)**: a play ends when a participant concedes. You get a
**finite *actual* dialogue inside an infinite *possible* one.** The regress is a
property of the *possibility space*, not of any realised argument graph.

> Practical consequence we actually *want*: **depth of scrutiny is proportional to
> contestation.** A claim nobody disputes sits at depth 0 forever. A hotly
> contested claim grows a deep justification tree — because people chose to dig.
> That is the platform's whole thesis, not a pathology.

### 4.2 Ontological grading: not every answer is a scheme-instance

The regress only *bites* if you force **every** answer to instantiate a Walton
scheme (which is what carries a CQ catalogue). Don't. Grade the ontology:

- **Default tier — asserted Claim / concession.** A `CQResponse` materialises as a
  *plain claim* with **no scheme attached** ⇒ **no new CQs.** This is the Hamblin
  *concession*: it enters the commitment store, is attackable in principle (you can
  UNDERMINE it) but **spawns no obligations of its own.** Most answers live and die
  here.
- **Escalated tier — scheme-instance Argument.** *Only* when an answer-claim is
  itself challenged **and** the challenger demands structured grounds does it get
  promoted to a scheme-bearing argument with its own CQ catalogue.

This matters because **CQs attach to scheme instances, not to every claim** — the
current model already works this way (`CQStatus` is keyed by `schemeKey`). A
scheme-free answer-claim is therefore a **perfectly valid terminal node**, not a
loose end. The regress requires every node to be a scheme-instance; grading
guarantees most nodes are not.

### 4.3 Foundational stoppers: axioms + burden exhaustion

Two further floors guarantee bottoming-out even on a branch someone keeps digging:

- **Axiomatic premises (`Kn`).** ASPIC+ already has premises that *cannot* be
  undermined (`lib/aspic/attacks.ts`). Grounding a chain in conceded/axiomatic
  premises terminates it foundationally (the foundationalist horn of the trilemma).
- **Burden exhaustion.** Each per-CQ `BurdenOfProof` (`PROPONENT` / `CHALLENGER`)
  *shifts* with each challenge level. The regress halts when whichever party
  currently holds the burden declines to discharge it — they simply **lose that
  branch.** No infinite obligation; just a finite game someone stops playing.

### 4.4 Summary framing

The regress is defused by making answers **(a) defeasible, (b) ontologically
graded, and (c) dialogue-terminating.** The honest name for the result is
**"virtuous finite-in-practice regress"** — precisely the standard resolution of
Agrippa's trilemma via defeasible reasoning (Rescher's plausibility; Walton's
shifting burden of proof). It is a *feature*: it operationalises "scrutiny on
demand."

> **Design rule extracted:** never auto-promote an answer to a full scheme-instance
> argument. Answers default to **scheme-free claims (concessions)**; promotion to a
> scheme-instance is a *deliberate, challenge-triggered* event. This single rule is
> what keeps Stance B finite.

---

## 5. Recommendation: B as ontology, A as surface, C as semantics

The three stances are not competitors — they are **three resolutions of the same
object** at different layers:

- **C is the ground truth.** An answer *is* a move/design (GROUNDS reply).
- **B is the materialisation.** Render that move as a defeasible answer-claim so it
  is attackable with machinery we already have (ASPIC+ attacks +
  ConflictApplication/ClaimEdge + `CQAttack` linkage).
- **A is the projection.** Users see status chips + canonical answer text; the
  graph machinery stays under the hood.

### 5.1 The smallest coherent step that closes the gap

Make a **canonical `CQResponse` derive/own a backing "answer-claim"** for
`(A, S, cq_k)`, *subject to the §4.2 grading rule* (default scheme-free), so that:

1. A challenge to an answer is an **ordinary attack edge** targeting that
   answer-claim — REBUT the satisfaction, UNDERMINE the cited evidence, UNDERCUT
   the relevance.
2. The existing **`CQAttack`** row already provides the provenance link
   (`CQStatus ↔ ConflictApplication / ClaimEdge`). Today it records "CQ raised →
   attack filed"; here it extends to "attack filed **against the answer**."
3. A **successful** attack (under ASPIC+/Ludics evaluation) is what flips
   `CQStatus.statusEnum SATISFIED → DISPUTED` — computed, giving the existing
   `DISPUTED` enum real, earned semantics instead of fiat.

> This is a *direction*, not a spec. The schema delta (answer-claim materialisation,
> defeat relation, reopen-vs-branch policy) is deliberately left for a later pass.

---

## 6. Why this also fixes a self-canonicalisation governance smell

Today an AI can **self-canonicalise** its own CQ answers within its session
(capability-scoped, never on human-authored arguments —
`lib/cqs/answerOverMcp.ts`). The *only* recourse against a bad self-canon answer is
moderator supersession. That is a governance smell: an AI assertion is effectively
**final until an authority intervenes.**

Under Stance B, **self-canonicalisation stops being final.** It just means "the
proponent installed a defended design." Any user can then attack the answer-claim;
if the attack succeeds under evaluation, the CQ **reopens automatically**
(`SATISFIED → DISPUTED`). Self-canon becomes a **defeasible assertion** rather than
an unchallengeable verdict — far more defensible epistemically, and symmetric with
how human canonical answers would be contested.

---

## 7. Open design questions (to settle before a spec)

1. **Burden placement on the challenge.** When someone attacks an answer-claim,
   does the CQ go straight to `DISPUTED`, or only once the *attack itself* clears a
   bar? The per-CQ `BurdenOfProof` (PROPONENT/CHALLENGER) should drive this.
2. **Reopen vs. branch.** Does a successful challenge **reopen** the same
   `CQStatus` (→ `OPEN`/`DISPUTED`) or **fork** a competing canonical lineage? The
   supersession chain already models lineage; a *defeat* relation would be new.
3. **Granularity of attackability.** Do we expose attacking the answer's
   *conclusion* ("not satisfied"), its *evidence* (undermine a
   `sourceUrl`/`evidenceClaimId`), and its *relevance* (undercut — "valid point,
   wrong CQ") as three distinct affordances, or collapse them into one "challenge"
   button that infers the type?
4. **AI vs. human symmetry.** Should challenging an AI-self-canonicalised answer be
   *lower-friction* than challenging a human-moderated canonical one? Provenance is
   already on the `CQResponse` (`contributorId`, `aiProvenance`).
5. **Promotion trigger (the §4.2 hinge).** *Decided:* answers/challenges are
   **scheme-free claims by default** (§4.2). Remaining sub-question is only the
   *exact* event that promotes such a claim into a scheme-instance argument with
   its own CQs — "challenger demands structured grounds" still needs an
   operational definition (a move type, a button, a burden shift).
6. **Evaluation cadence.** Is the `SATISFIED → DISPUTED` flip computed
   synchronously on attack creation, or by a periodic ASPIC+/semantics recompute
   job? (Touches `ARGUMENTATION_SEMANTICS_CONSOLIDATION_ROADMAP.md`.)
7. **Termination guardrails in product.** Even with §4 theory, do we want *soft*
   product limits (depth indicators, "diminishing returns" UI, collapse-by-default
   deep branches) so the finite-in-practice regress stays legible to users?

---

## 8. Next step

If this ontology lands, the follow-on artifact is a **dev spec** that commits to:

- the answer-claim materialisation + the §4.2 grading rule as an invariant,
- the defeat relation and the `SATISFIED → DISPUTED` flip semantics,
- the reopen-vs-branch policy (Q2),
- and the MCP/UI affordances for filing and viewing challenges.

Until then this document is the shared reference for *why* a challenge mechanism is
non-trivial and *how* the regress is bounded.
