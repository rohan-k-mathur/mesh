# Argument Attacks & Dialogue Moves over MCP — Scope / Dev Spec

**Status:** brainstorm / scope research (pre-implementation)
**Owner:** Isonomia MCP / argument-write surface
**Relation to prior work:** third in the MCP write-surface sequence after
**chain creation** and **answering / challenging critical questions**. Reuses the
same write-seam discipline (MCP bearer auth, `requestId` idempotency, AI-provenance
honesty flags) and extends the **session/participant identity** substrate one step
further — from "the same session" to "which dialogical *side* the agent speaks as."

**Derived from / grounded against:**
- [ANSWER_CRITICAL_QUESTIONS_OVER_MCP_SPEC.md](ANSWER_CRITICAL_QUESTIONS_OVER_MCP_SPEC.md)
  §4 — the agent-supplied `sessionId` capability-token pattern this spec generalises
  into a `participantId` / `speakAs` capability.
- [CHAIN_CREATION_OVER_MCP_SPEC.md](CHAIN_CREATION_OVER_MCP_SPEC.md) §4 / §8 — the
  `requestId` idempotency + atomic-transaction pattern reused here for moves.
- [CHALLENGING_ANSWERED_CRITICAL_QUESTIONS_DEV_SPEC.md](CHALLENGING_ANSWERED_CRITICAL_QUESTIONS_DEV_SPEC.md)
  — the "challenge = scheme-free `Claim` + `ClaimEdge` + `CQAttack`, no new table"
  decision that the freestanding `attack_argument` tool extends to non-CQ attacks.
- [COMMITMENT_SYSTEM_ARCHITECTURE.md](COMMITMENT_SYSTEM_ARCHITECTURE.md) — the
  commitment-store model, move-force semantics, and protocol R-codes this spec must
  not violate.

**Companion substrate (verified, see §3):**
- [app/api/dialogue/move/route.ts](../../app/api/dialogue/move/route.ts) — the one
  protocol-move write seam (WHY / GROUNDS / CONCEDE / RETRACT / CLOSE / THEREFORE /
  SUPPOSE / DISCHARGE / ACCEPT_ARGUMENT), legal-move gated, ludics-compiling.
- [app/api/cqs/challenge/route.ts](../../app/api/cqs/challenge/route.ts) +
  [lib/cqs/challengeCq.ts](../../lib/cqs/challengeCq.ts) — the existing typed-attack
  write (the precedent the freestanding attack tool mirrors).
- [app/api/dialogue/legal-moves/route.ts](../../app/api/dialogue/legal-moves/route.ts),
  [app/api/dialogue/legal-attacks/route.ts](../../app/api/dialogue/legal-attacks/route.ts),
  [app/api/dialogue/commitments/route.ts](../../app/api/dialogue/commitments/route.ts)
  — the read affordances.
- [lib/dialogue/validate.ts](../../lib/dialogue/validate.ts),
  [lib/dialogue/legalMovesServer.ts](../../lib/dialogue/legalMovesServer.ts) — the
  R-code protocol validator the write tool must satisfy.

---

## 1. Motivation and the precise gap

The MCP surface can today **state** positions (`propose_argument`,
`propose_structured_argument`, `propose_argument_chain`) and **discharge or contest
the critical questions** a scheme demands (`answer_critical_question`,
`challenge_critical_question`). What it *cannot* do is participate in the
**dialectic as a process**:

1. **No freestanding attacks.** `challenge_critical_question` files a typed attack
   (REBUT / UNDERMINE / UNDERCUT) **only against an already-answered CQ**. An agent
   that simply disagrees with an argument's conclusion, doubts a premise, or thinks
   the inference does not hold — *without* there being an answered CQ to hang the
   objection on — has no write path to record that attack in the argument graph.

2. **No protocol moves.** The dialogue layer — WHY (demand justification), GROUNDS
   (discharge a WHY), CONCEDE, RETRACT, CLOSE, ACCEPT_ARGUMENT, and the structural
   THEREFORE / SUPPOSE / DISCHARGE — is the mechanism that turns a static graph into
   a *governed conversation* (every challenge creates an obligation; an unanswered
   challenge is itself a recorded datum; commitments accumulate and are checked for
   contradiction). None of it is reachable over MCP.

3. **No move-legality vision.** Even if the agent could post a move, it has no read
   tool for *what moves are currently legal* on a target, so any write would be a
   blind guess against a server that rejects illegal moves with protocol R-codes.

4. **No commitment-store read.** The agent cannot inspect what each participant is
   currently committed to — the very ledger that makes a CONCEDE or a
   contradiction-flag meaningful.

The user goal is to close (1)–(4): give an MCP agent the ability to **challenge and
respond to arguments**, both via the **durable argument-graph attack layer** and via
the **dynamic dialogue-protocol layer**, with the read affordances needed to do so
legally.

### 1.1 The one genuinely new modelling problem

Every prior MCP write attributed to a single shared service user
(`auth_id = "mcp-bot"`) was *additive and side-neutral* — minting an argument or
answering a CQ does not require the author to be distinct from anyone. **Dialogue
moves break that assumption.** The protocol is intrinsically *multi-party*:

- `validateMove` enforces **R3_SELF_REPLY** — you cannot reply to your own move.
- The legal-move computation enforces **author-only GROUNDS** (only the target's
  author may answer a WHY on it) and **non-author-only WHY** (you cannot WHY your
  own item).
- Commitment stores, contradiction checks, and the Proponent/Opponent ludics
  designs are all keyed on `participantId`.

If *every* MCP move is attributed to the one `mcp-bot` identity, an agent can never
legally challenge its own argument (steelmanning), two agent sessions can never take
opposite sides, and the protocol's two-sidedness collapses. So the central new piece
— the analogue of the CQ spec's `sessionId` — is a **participant/role capability**:
a way for an MCP caller to declare *which dialogical side it speaks as*, namespaced
safely under the service identity. This is detailed in §4.

---

## 2. Scope

### 2.1 In scope (v1)

**Read affordances (prerequisites — cheap, additive):**
- `get_legal_moves` — wrap `/api/dialogue/legal-moves`: the protocol-legal move set
  on a target *right now*, with each move's `kind`, `label`, `force`
  (ATTACK / SURRENDER / NEUTRAL), `payload` template, and `disabled` + `reason`.
- `get_legal_attacks` — wrap `/api/dialogue/legal-attacks`: heuristic attack-shape
  cues (`conditional` → "challenge antecedent", `conjunction` → "challenge conjunct",
  etc.) for a piece of claim/argument text.
- `get_commitments` — wrap `/api/dialogue/commitments`: the per-participant
  commitment ledger (active propositions), so the agent can see what a CONCEDE would
  accept or what contradicts a candidate assertion.

**Write — durable argument-graph attack (the edge layer):**
- `attack_argument` — file a freestanding REBUT / UNDERCUT / UNDERMINE against a
  target argument **or** claim by wrapping the **existing** `/api/ca`
  (ConflictApplication + auto-`ATTACK` move), optionally minting an objection `Claim`
  from `groundsText` first — *not* keyed to an answered CQ. Inherits the platform's
  PROPOSED/EFFECTIVE ratification lifecycle (an MCP attack is filed, never
  self-ratified into a defeat).

**Write — protocol dialogue moves (the dynamic layer), legal-move gated:**
- `post_dialogue_move` — a single general tool covering the **challenge/response
  loop and commitment moves**: `WHY`, `GROUNDS`, `CONCEDE`, `RETRACT`, `CLOSE`,
  `ACCEPT_ARGUMENT`. Each call is validated against `computeLegalMoves`; illegal
  moves return the protocol R-code as a structured error rather than a 500.
- Two thin ergonomic wrappers over the above for the two highest-value verbs (so an
  agent need not assemble payloads by hand):
  - `challenge_argument` → a `WHY` move (optionally seeded from a `get_legal_attacks`
    cue / a CQ key).
  - `respond_to_challenge` → a `GROUNDS` move discharging a specific open `WHY`.

**Identity:**
- An MCP-supplied **`participantId` / `speakAs` capability** (§4) namespaced under
  the service identity, so the agent can legally occupy a dialogical side and so two
  sessions can take opposite sides. Reuses the `sessionId` capability-token discipline
  from the CQ spec (high-entropy, never echoed, never bound to a human user).

**Cross-cutting:**
- **`requestId` idempotency** on every write (mirrors chain/CQ), layered over the
  route's existing signature-dedup so a timed-out retry replays rather than duplicates.
- **Honest error surface** — protocol R-codes, contradiction reports, and rate-limit
  rejections returned as structured, named results, never silently bypassed.

### 2.2 Out of scope (v1 — explicit deferrals)

- **Structural ludics moves** `THEREFORE`, `SUPPOSE`, `DISCHARGE`. They drive the
  Ludics design tree (loci, synthesis, scopes) and overlap the generative-substrate
  tool cluster already on the MCP server (`bind_participant_to_design`,
  `propose_synthesis`). Folding them in needs a unified locus story; deferred to v2.
- **`ASSERT` as a bare move.** Stating a position over MCP is already the job of
  `propose_argument` / `propose_structured_argument`; a bare ASSERT move would be a
  redundant, weaker write. (CONCEDE/RETRACT are kept because they have no other path.)
- **Full multi-party persona management** — directories of named participants,
  turn-taking orchestration, role assignment UIs. v1 supports *at most two* MCP
  personae per deliberation (e.g. `proponent` / `opponent`) via the capability; richer
  multi-agent choreography is a separate concern.
- **Withdrawing / editing a posted move or attack** over MCP (the route is
  append-only; retraction is itself a `RETRACT` move, which *is* in scope, but
  *deleting* a move is not).
- **`card` target type** — moves target `argument` or `claim` only in v1 (mirrors the
  existing write tools' surface).
- **Contradiction *bypass*** — the `payload.bypassContradictionCheck` escape hatch is
  **not** exposed; v1 surfaces contradictions and refuses, leaving override to humans.
- **Endorsements / votes on moves** (`/api/dialogue/moves/[id]/votes`).

---

## 3. What already exists (substrate inventory — verified)

This feature, like its predecessors, is mostly plumbing: the hard layers are shipped.

### 3.1 The protocol-move write seam — [app/api/dialogue/move/route.ts](../../app/api/dialogue/move/route.ts)

One `POST` handles every move kind. Request body (Zod, ~L71):

```jsonc
{
  deliberationId: string,
  targetType: "argument" | "claim" | "card",
  targetId: string,
  kind: "ASSERT"|"WHY"|"GROUNDS"|"RETRACT"|"CONCEDE"|"CLOSE"|"THEREFORE"|"SUPPOSE"|"DISCHARGE"|"ACCEPT_ARGUMENT",
  payload?: any,                 // { cqId, locusPath, expression, schemeKey, evidenceRefs[], ... }
  postAs?: { targetType, targetId },   // R7: post against a different target
  autoCompile?: boolean = true,  // recompile ludics design from moves
  autoStep?: boolean = true,     // step the interaction after the move
  phase?: "focus-P"|"focus-O"|"neutral",
  replyToMoveId?: string,
  replyTarget?: "claim"|"argument"|"premise"|"link"|"presupposition"
}
```

Per-kind effects (DB rows) — verified:

| Kind | Illocution | Rows written |
|---|---|---|
| `WHY` | Question | `DialogueMove`; upsert `CQStatus` (open, `deadlineAt` = +24h); auto-`ConflictApplication` (Phase 1.1) |
| `GROUNDS` | Argue | `DialogueMove`; update `CQStatus`; **create `Argument`** (from grounds text, `conclusionClaimId` = target); optional `ClaimEdge` |
| `CONCEDE` | Concede | `DialogueMove` (kind ASSERT, `as=CONCEDE`); upsert `Commitment` |
| `RETRACT` | Retract | `DialogueMove`; `Commitment.updateMany → isRetracted` |
| `ACCEPT_ARGUMENT` | Accept | `DialogueMove`; upsert `Commitment` (`ACCEPT:<prop>`) |
| `CLOSE` | Close | `DialogueMove` |
| `THEREFORE`/`SUPPOSE`/`DISCHARGE` | Argue/Suppose/Discharge | `DialogueMove` + `LudicMove`/`WitnessRecord` via `synthesizeActs` *(out of scope v1)* |

**Auth:** `getCurrentUserId()` → `actorId` string (~L200). **Idempotency:** implicit,
on a deterministic `signature` (sha1 of kind + target + cq/locus/expression) with a
`@@unique([deliberationId, signature])`; a repeat returns `dedup: true`. **Response:**
`{ ok, move, step, dedup, contradictionsBypassed? }`.

### 3.2 Legal-move validation — [lib/dialogue/validate.ts](../../lib/dialogue/validate.ts) + [lib/dialogue/legalMovesServer.ts](../../lib/dialogue/legalMovesServer.ts)

The route rejects any move not in the computed legal set. R-codes (protocol
invariants) include:

- `R3_SELF_REPLY` — cannot reply to your own move.
- `R2_NO_OPEN_CQ` — GROUNDS without a matching open WHY.
- `R7_ACCEPT_ARGUMENT_REQUIRED` — must ACCEPT_ARGUMENT (not bare CONCEDE) once a
  claim has been answered by GROUNDS.
- `R4_DUPLICATE_REPLY` — signature already exists.
- `R5_AFTER_SURRENDER` — attacking after CLOSE / CONCEDE.
- `R8_NO_OPEN_SUPPOSE` — DISCHARGE without an open SUPPOSE.

`legal-moves` returns `{ ok, moves: Move[], meta: { openWhyKeys, isClosed, anyGrounds,
targetAuthorId } }`, each `Move = { kind, label, payload?, disabled?, reason?, force,
relevance?, postAs?, verdict? }`.

### 3.3 The typed-attack precedent — [app/api/cqs/challenge/route.ts](../../app/api/cqs/challenge/route.ts)

`challenge_critical_question` already mints: lazy answer-`Claim` → challenge-`Claim`
→ `ClaimEdge` (`attackType` REBUTS/UNDERMINES/UNDERCUTS, `targetScope`,
`metaJson: { cqKey, schemeKey, cqStatusId, source, requestId }`) → `CQAttack`
(linking `CQStatus`→`ClaimEdge`) → flip `CQStatus SATISFIED→DISPUTED` →
`CQActivityLog`. Returns `{ ok, cqStatusId, challengeClaimId, answerClaimId,
claimEdgeId, cqAttackId, cqStatusEnum, attackType, permalink, idempotentReplay? }`.
Rate-limited 20/h. This is the *claim-minting* attack precedent: it shows how to
turn free text into an objection `Claim` before wiring an edge. The *edge-only*
precedent is `/api/ca` (§3.4a), which links two **existing** nodes; `attack_argument`
combines them — optionally mint the objection claim, then file the edge via `/api/ca`.

### 3.4 The attack models — [lib/models/schema.prisma](../../lib/models/schema.prisma)

| Model | Purpose | Key fields |
|---|---|---|
| `ConflictApplication` | scheme-aware / ad-hoc conflict between claim/arg pair | `conflicting{Claim,Argument}Id`, `conflicted{Claim,Argument}Id`, `legacyAttackType`, `legacyTargetScope`, `createdByMoveId`, `ratificationStatus`, `aspicAttackType` |
| `ClaimEdge` | claim→claim support/attack | `fromClaimId`, `toClaimId`, `type` (supports/rebuts), `attackType` (REBUTS/UNDERMINES/UNDERCUTS/SUPPORTS), `targetScope`, `metaJson` |
| `ArgumentEdge` | arg→arg typed edge | `fromArgumentId`, `toArgumentId`, `type` (EdgeType), `attackSubtype`, `targetScope`, `cqKey`, `targetPremiseId` |
| `CQAttack` | binds a CQ to its attack | `cqStatusId`, `conflictApplicationId?`, `claimEdgeId?` |
| `ConflictRatification` | human sign-off on a gated attack | `conflictApplicationId`, `withdrawnAt` |
| `Commitment` | participant ledger | `deliberationId`, `participantId`, `proposition`, `isRetracted` (`@@unique([delib, participant, proposition])`) |

### 3.4a The attack-write routes — **correction: a canonical standalone route already exists**

A first pass assumed attacks could only be filed through the CQ path or the
auto-`ConflictApplication` on a WHY. **That is wrong.** The UI files attacks through
three existing routes, and `attack_argument` should wrap the canonical one rather
than introduce a new endpoint:

| Route | Writes | Request shape (verified) | UI callers |
|---|---|---|---|
| **`POST /api/ca`** (canonical) | `ConflictApplication` + **auto-`ATTACK` `DialogueMove`** (bidirectional sync via `createDialogueMove` H1 seam) | `{ deliberationId, schemeKey?, conflicting{Claim,Argument}Id (exactly one), conflicted{Claim,Argument}Id (exactly one), legacyAttackType: REBUTS\|UNDERCUTS\|UNDERMINES, legacyTargetScope: conclusion\|inference\|premise, metaJson? }`; auth = server-side `getCurrentUserId` | `ArgumentAttackModal`, `AttackMenuPro(V2)`, `SchemeSpecificCQsModal`, `AIFArgumentWithSchemeComposer` |
| `POST /api/arguments/[id]/attacks` | `ArgumentEdge` (arg→arg) | `{ deliberationId, createdById (⚠ client-supplied), fromArgumentId, attackType, targetScope, toArgumentId?, targetClaimId?, targetPremiseId?, cqKey? }` | `lib/client/aifApi.ts` |
| `POST /api/pa` | `PreferenceApplication` (ASPIC+ priority attack) | `{ deliberationId, preferredArgumentId, dispreferredArgumentId }` (or scheme variants) | `PreferenceAttackModal`, `AttackMenuPro` |

Companions: **`POST/DELETE /api/ca/[id]/ratify`** (human sign-off) and
**`POST /api/ca/[id]/retract`**. Two facts here are decisive for the MCP design:

1. **Attacks have a ratification lifecycle.** Under a gating policy a new
   `ConflictApplication` is created `PROPOSED` (and does **not** count as a defeat
   until human sign-offs reach the policy threshold); under policy `none` it is
   `EFFECTIVE` immediately ([app/api/ca/route.ts](../../app/api/ca/route.ts), via
   `resolveRatificationPolicy`). So an MCP-filed attack may legitimately land
   *pending*, exactly like an AI-authored warrant.
2. **The substrate already forbids the bot from ratifying its own kind of attack.**
   [app/api/ca/[id]/ratify/route.ts](../../app/api/ca/[id]/ratify/route.ts) hard-codes
   `NON_HUMAN_ACTORS = { "mcp-bot", "importer", "system" }` and refuses ratification
   from them ("D4: human-only ratifiers"), in addition to a no-self-ratification
   guard. **This means the AI-honesty floor for attacks is already enforced by the
   platform** — an MCP attack can be *filed* but never *self-ratified into a defeat*;
   a human must sign it off. This is the attack-layer analogue of the ECC
   `propose_warrant` "non-logical until a human ratifies" contract, and it requires
   **no new code** to hold.

Consequence: `attack_argument` is a thin authenticated caller over the **existing**
`/api/ca`, not a new route (see revised §5.2 / §8).

### 3.5 MCP auth & identity — established by the prior specs

- MCP bearer (`Authorization: Bearer <ISONOMIA_API_TOKEN>`) → `resolveCitationCallerUserId`
  returns `MCP_AUTHOR_USER_ID || "mcp-bot"` ([lib/citation/mcpAuth.ts](../../lib/citation/mcpAuth.ts)).
- `isoFetch(path, { authenticated: true })` attaches the bearer
  ([packages/isonomia-mcp/src/http.ts](../../packages/isonomia-mcp/src/http.ts)).
- The CQ spec added an agent-supplied **`sessionId`** capability stamped into
  `aiProvenance` for same-session self-canonicalisation. **This spec needs the next
  rung: an agent-supplied participant/side identity** — because the dialogue route
  keys legality and commitments on a *distinct actorId per side*, and the bare
  `mcp-bot` user is a single side. See §4.

---

## 4. The participant-identity mechanism (the new piece)

**Decision (this pass): an agent-supplied `participantId` capability, namespaced
under the service identity.** As with `sessionId`, MCP is stateless per request, so
the identity is caller-supplied and stable — the same capability-token pattern, one
rung up: from "which session" to "which dialogical side."

### 4.1 Shape

`post_dialogue_move` (and the attack tool) accept an optional **`speakAs`** string
(e.g. `"proponent"`, `"opponent"`, or any stable agent-chosen persona label, 1–64
chars). The Next route, on an MCP bearer, resolves the effective `actorId` as a
**namespaced derivation of the service identity**, never a raw human id:

```
actorId = `${MCP_AUTHOR_USER_ID || "mcp-bot"}:${speakAs ?? "default"}`
```

So `mcp-bot:proponent` and `mcp-bot:opponent` are two *distinct* protocol
participants that both trace to the MCP service user for attribution/audit, but
satisfy R3_SELF_REPLY, author-only-GROUNDS, and the commitment-store keying as
genuinely different sides.

### 4.2 Why this is the minimal correct model

- **Self-challenge / steelmanning works.** An agent that authored an argument as
  `mcp-bot:proponent` can legally `WHY` it as `mcp-bot:opponent` — the route sees two
  different `actorId`s, so R3 does not fire.
- **Two agent sessions can take opposite sides** by each passing a different
  `speakAs`.
- **Commitments are per-side**, as the protocol expects: a CONCEDE by
  `mcp-bot:opponent` lands in the opponent's ledger, not a single muddled bot store.
- **Safety floor (non-negotiable):** an MCP-resolved `actorId` is **always**
  prefixed by the service identity. A `speakAs` value can never resolve to, collide
  with, or impersonate a *human* participant's `auth_id`. Human-authored moves and
  commitments are untouchable from MCP. (Mirror the CQ spec's "never self-canonicalise
  a human argument" floor.)

### 4.3 Capability semantics (document in tool/orientation copy)

> "Pick a stable `speakAs` label for each side you are playing (e.g. `proponent`,
> `opponent`) and reuse it across every move on that side. The platform records all
> MCP moves under the service identity; `speakAs` only chooses which *dialogical
> side* the move belongs to — it can never impersonate a human participant."

### 4.4 Relationship to `sessionId`

`sessionId` (CQ spec) and `speakAs` (this spec) are orthogonal and composable:
`sessionId` answers "is this the same agent session that authored the object?"
(for self-canonicalisation); `speakAs` answers "which side is this move on?" (for
protocol legality). A move tool may carry both. **Open confirmation Q3 (§7).**

---

## 5. Proposed MCP tool surface

### 5.1 Read tools (additive wrappers)

```jsonc
// get_legal_moves
{ deliberationId, targetType: "argument"|"claim", targetId, locusPath?, speakAs? }
//   → { ok, moves: [{ kind, label, force, payload?, disabled?, reason?, postAs? }], meta }
//   NOTE: pass speakAs so legality is computed for the side you intend to move on
//         (author-only GROUNDS / non-author WHY depend on it).

// get_legal_attacks
{ text }
//   → { ok, shape, options: [{ key, label, action }] }   // attack-shape cues

// get_commitments
{ deliberationId, limit?, offset? }
//   → { ok, commitments: { [participantId]: [{ proposition, createdAt }] }, pagination }
```

### 5.2 `attack_argument` (write — wraps the existing `/api/ca`)

```jsonc
{
  deliberationId: string,
  target: { type: "argument" | "claim", id: string },
  attackType: "REBUT" | "UNDERCUT" | "UNDERMINE",   // → legacyAttackType REBUTS/UNDERCUTS/UNDERMINES
  // EITHER point at an existing attacker node …
  attacker?: { type: "claim" | "argument", id: string },
  // … OR supply text and the tool mints a scheme-free objection Claim first:
  groundsText?: string,           // 10..5000; minted as the conflictingClaim
  targetPremiseId?: string,       // required when UNDERMINE targets a specific premise claim
  evidenceClaimIds?: string[],    // ≥1 required for UNDERMINE (mirror CQ-challenge rule)
  sourceUrls?: string[],
  speakAs?: string,               // §4 side capability
  requestId?: string              // idempotency (stored in metaJson)
}
// → { ok, conflictApplicationId, attackMoveId, objectionClaimId?,
//     attackType, targetScope, ratificationStatus, permalink, idempotentReplay? }
```

Behaviour: this is a **thin authenticated caller over the existing
[`POST /api/ca`](../../app/api/ca/route.ts)** (§3.4a), *not* a new route. `/api/ca`
requires an *existing* `conflicting{Claim,Argument}Id`, so the tool first resolves the
attacker: if `attacker` is given, use it directly; if `groundsText` is given, mint a
scheme-free objection `Claim` (reusing the claim-mint half of
[lib/cqs/challengeCq.ts](../../lib/cqs/challengeCq.ts)) and pass its id as
`conflictingClaimId`. It then maps `attackType` → `legacyAttackType` +
`legacyTargetScope` (`REBUT`→conclusion, `UNDERCUT`→inference, `UNDERMINE`→premise),
sets the conflicted side from `target` (`conflictedArgumentId` / `conflictedClaimId`,
plus `conflictedClaimId = targetPremiseId` for UNDERMINE), and POSTs. `/api/ca` then
**auto-creates the linked `ATTACK` `DialogueMove`** for free, so the attack lands in
both the static graph *and* the dialogue trace in one call.

Two behaviours fall out of the substrate (§3.4a) and must be surfaced honestly:
- **`ratificationStatus`** is echoed back. Under a gating policy the attack is
  `PROPOSED` and does **not** count as a defeat until a human signs it off — and the
  platform already refuses `mcp-bot` as a ratifier, so the tool must report
  "filed, pending human ratification" rather than implying the target is defeated.
- The `UNDERMINE`-requires-evidence floor and the CQ-challenge rate-limit bucket are
  reused.

**Sibling (deferred, §7 Q8):** `prefer_argument` over [`POST /api/pa`](../../app/api/pa/route.ts)
— an ASPIC+ *preference/priority* attack (`{ preferredArgumentId, dispreferredArgumentId }`),
a distinct attack form the UI exposes via `PreferenceAttackModal`.

### 5.3 `post_dialogue_move` (new write — protocol)

```jsonc
{
  deliberationId: string,
  targetType: "argument" | "claim",
  targetId: string,
  kind: "WHY" | "GROUNDS" | "CONCEDE" | "RETRACT" | "CLOSE" | "ACCEPT_ARGUMENT",
  payload?: {                     // kind-specific; the tool validates per kind
    cqId?: string,                // WHY / GROUNDS
    schemeKey?: string,
    expression?: string,          // WHY question / GROUNDS justification / RETRACT reason
    evidenceRefs?: string[],      // required if the CQ requiresEvidence
    locusPath?: string
  },
  postAs?: { targetType, targetId },   // R7 redirection
  replyToMoveId?: string,
  speakAs?: string,               // §4 side capability
  requestId?: string
}
// → { ok, move, legalMoveMatched, step?, dedup?,
//     contradictions?: [...],        // surfaced, NOT bypassed
//     warnings?: [...] }
// Errors (structured, not 500): R2_NO_OPEN_CQ, R3_SELF_REPLY,
//   R5_AFTER_SURRENDER, R7_ACCEPT_ARGUMENT_REQUIRED (echoing postAs hint),
//   MOVE_ILLEGAL (generic, with the offending verdict), MOVE_RATE_LIMITED.
```

The handler **pre-checks `computeLegalMoves`** for `(target, speakAs)` and, if the
requested `kind`/payload is not among the legal set, returns the matching R-code as a
typed error *before* attempting the write — turning the route's internal rejection
into an actionable result the agent can correct (e.g. "answer with `postAs` the
argument, not the claim").

Defaults: `autoCompile = true`, `autoStep = true` (keep the deliberation's ludics
state consistent; surface `step`). Contradictions on a commitment-creating move are
returned and the write **refused** in v1 (no bypass).

### 5.4 Ergonomic wrappers

```jsonc
// challenge_argument  → a WHY move
{ deliberationId, targetType, targetId, cqKey?|attackCue?, expression, speakAs?, requestId? }

// respond_to_challenge → a GROUNDS move discharging an open WHY
{ deliberationId, targetType, targetId, cqId, groundsText, schemeKey?, evidenceRefs?, speakAs?, requestId? }
```

Both compile down to `post_dialogue_move`; they exist so the two dominant verbs need
no payload assembly and so orientation can give a crisp "to disagree, call
`challenge_argument`; to defend, call `respond_to_challenge`" recipe.

### 5.5 Orientation

Add a **Recipe — Challenge & defend in a dialogue** to `orientation.ts`: (1)
`get_legal_moves` to see what is available on this side; (2) `attack_argument` for a
durable graph objection *or* `challenge_argument` (WHY) to open a protocol challenge;
(3) `respond_to_challenge` (GROUNDS) to discharge a WHY you are the author-side of;
(4) `get_commitments` before a CONCEDE; (5) always reuse one `speakAs` per side and
pass a `requestId`. Document that a filed attack may be `PROPOSED` pending **human**
ratification (the bot cannot ratify), so an attack is "filed," not "won." Add the new
tools to the cluster map (new cluster **7-dialectic-moves**) and bump
`ORIENTATION_VERSION`.

---

## 6. Data-model mapping (no new *models*, no new *routes* for attacks)

| Concept | Row(s) | Notes |
|---|---|---|
| Attack (`attack_argument`) | (optional objection `Claim`) + `ConflictApplication` + auto-`ATTACK` `DialogueMove` | via the **existing** `/api/ca`; `ratificationStatus` PROPOSED/EFFECTIVE per policy |
| Protocol move (`post_dialogue_move`) | `DialogueMove` (+ per-kind side-effects from §3.1) | unchanged route behaviour; tool is a gated caller |
| MCP participant side | derived `actorId = "mcp-bot:<speakAs>"` | no schema change; a *resolution rule* in the route's auth shim |
| Idempotency | the route's existing `signature` dedup **plus** an optional `requestId` | `requestId` mirrors chain/CQ; stored in `payload`/`metaJson` for replay |

**Schema touch is minimal and additive:** at most a `payload.requestId` /
`metaJson.requestId` convention (both fields are already `Json?`). The participant
namespacing is a *route-level resolution rule*, not a column. **No new attack route
is needed** — `attack_argument` wraps the existing `/api/ca` (§3.4a); the only route
work is adding MCP-bearer auth + the `speakAs` shim + optional `requestId` idempotency
to `/api/ca` and `/api/dialogue/move` (both currently session-cookie only).

---

## 7. Decisions (proposed) + remaining confirmations

- **Q1 — attack route. RESOLVED by substrate: reuse the existing `/api/ca`.** The
  first draft proposed a new `/api/arguments/attack` route; grounding showed `/api/ca`
  is already the canonical UI attack endpoint (ConflictApplication + auto-`ATTACK`
  move, §3.4a). *Confirm we add MCP-bearer auth to `/api/ca` rather than build a
  parallel endpoint.*
- **Q2 — `speakAs` namespacing. PROPOSED: `"mcp-bot:<speakAs>"`, max two personae
  per deliberation in v1.** Confirm the prefix scheme and whether to cap persona
  count (guards against an agent spawning a synthetic "crowd").
- **Q3 — carry both `sessionId` and `speakAs`?** They are orthogonal (§4.4).
  *Confirm* a move/attack tool accepts both, with `sessionId` reserved for any future
  self-canonicalisation of move-derived objects and `speakAs` for side legality.
- **Q4 — contradiction handling. PROPOSED: surface and refuse; no bypass.** Confirm
  v1 never exposes `bypassContradictionCheck` (leave override to the human web UI).
- **Q5 — legality pre-check vs. optimistic write. PROPOSED: pre-check
  `computeLegalMoves` and return the R-code before writing.** Confirm we prefer the
  extra read for a clean error over an optimistic write that 4xxs on the route's
  internal guard.
- **Q6 — rate limits. PROPOSED: reuse the CQ-challenge bucket (20/h) for
  `attack_argument`; add a separate move bucket for `post_dialogue_move`.** Confirm
  thresholds.
- **Q7 — defaults for `autoCompile` / `autoStep`. PROPOSED: both `true`.** Confirm
  we want every MCP move to recompile + step the ludics interaction (consistency at
  the cost of latency) vs. a faster "record-only" default.
- **Q8 — attack ratification honesty. RESOLVED by substrate: the platform already
  refuses `mcp-bot` as a ratifier** (`/api/ca/[id]/ratify` `NON_HUMAN_ACTORS`, D4).
  An MCP attack therefore lands `PROPOSED` under a gating policy and can never be
  self-ratified into a defeat. *Confirm `attack_argument` echoes `ratificationStatus`
  and the tool/orientation copy says "filed, pending human sign-off," never "defeated."*
- **Q9 — preference attacks (`/api/pa`). PROPOSED: defer `prefer_argument` to v2.**
  ASPIC+ preference/priority attacks are a distinct form (the UI's
  `PreferenceAttackModal`); confirm they are out of v1 scope, listed as the natural
  next attack tool.

---

## 8. Phased implementation outline (proposed, not yet executed)

1. **S1 — claim-mint helper.** Factor the scheme-free objection-`Claim` mint out of
   [lib/cqs/challengeCq.ts](../../lib/cqs/challengeCq.ts) so `attack_argument` can
   reuse it for the `groundsText` path (no edge-writer extraction needed — the edge
   is `/api/ca`'s job).
2. **S2 — MCP-enable `/api/ca`.** Add MCP-bearer auth (`resolveCitationCallerUserId`)
   + middleware PUBLIC_API allowlist + optional `requestId` idempotency (in
   `metaJson`) to the **existing** `/api/ca`. No new route. The auto-`ATTACK` move and
   ratification lifecycle already work; verify `mcp-bot` lands `PROPOSED` under a
   gating policy.
3. **S3 — participant shim.** Add the `speakAs` → `mcp-bot:<speakAs>` resolution to
   the `/api/dialogue/move` and `/api/ca` auth path, behind the MCP bearer only;
   assert the human-impersonation floor with a unit test.
4. **S4 — legality pre-check helper.** A small server util that runs
   `computeLegalMoves` for `(target, actorId)` and returns the first blocking R-code,
   reused by `post_dialogue_move`.
5. **S5 — MCP tools.** Register `get_legal_moves`, `get_legal_attacks`,
   `get_commitments`, `attack_argument` (→ `/api/ca`), `post_dialogue_move`,
   `challenge_argument`, `respond_to_challenge`; wire to S2/S4 and the existing
   dialogue route. Bump tool count + cluster map.
6. **S6 — orientation.** New recipe + cluster `7-dialectic-moves`;
   `ORIENTATION_VERSION` bump; rebuild `dist/` (`npm run mcp:rebuild`).
7. **S7 — tests (jest):** attack maps `attackType` → `legacyAttackType` + targetScope
   correctly and lands `PROPOSED` under a gating policy; `mcp-bot` cannot ratify its
   own attack (existing guard regression); `UNDERMINE` without evidence → refused;
   self-`WHY` as a *different* `speakAs` succeeds, as the *same* side →
   `R3_SELF_REPLY`; GROUNDS without open WHY → `R2_NO_OPEN_CQ`; CONCEDE after
   answered-claim → `R7_ACCEPT_ARGUMENT_REQUIRED` with `postAs` hint; contradiction on
   CONCEDE → surfaced + refused; idempotent replay on `requestId`;
   **human-impersonation floor** (a `speakAs` colliding with a human `auth_id` never
   resolves to that human).
8. **S8 — Claude Desktop smoke:** author an argument as `proponent`, `attack_argument`
   a third party's claim (observe `ratificationStatus: PROPOSED`), `challenge_argument`
   it as `opponent`, `respond_to_challenge` as `proponent`, read `get_commitments` to
   confirm per-side ledgers.

---

## 9. One-paragraph summary

The argument-graph attack layer (`ConflictApplication` / `ClaimEdge` / `ArgumentEdge`)
and the dialogue-protocol layer (`DialogueMove` + commitments + legal-move R-codes)
are fully built and almost entirely unreachable from MCP — the one exception being
`challenge_critical_question`, which can only attack an *answered CQ*. v1 closes the
gap with: (1) three read affordances (`get_legal_moves`, `get_legal_attacks`,
`get_commitments`); (2) `attack_argument`, a freestanding REBUT/UNDERCUT/UNDERMINE
write that wraps the **existing** `/api/ca` (ConflictApplication + auto-`ATTACK`
move) — so the only attack-side work is MCP-bearer auth, not a new route, and the
platform's existing `mcp-bot`-cannot-ratify guard already enforces "filed, pending
human sign-off" rather than "defeated"; (3)
`post_dialogue_move` (plus `challenge_argument` / `respond_to_challenge` wrappers), a
legal-move-gated WHY/GROUNDS/CONCEDE/RETRACT/CLOSE/ACCEPT_ARGUMENT surface; and (4)
the one genuinely new model — a `speakAs` participant capability namespaced under the
service identity (`mcp-bot:<side>`) so an agent can legally occupy a dialectical side,
challenge its own arguments when steelmanning, and let two sessions take opposite
sides — with the hard floor that an MCP move can never impersonate a human
participant. Structural ludics moves (THEREFORE/SUPPOSE/DISCHARGE), bare ASSERT, move
deletion, preference attacks (`/api/pa`), and contradiction-bypass are explicitly
deferred.
