# Answering Critical Questions over MCP — Scope / Dev Spec

**Status:** brainstorm / scope research (pre-implementation)
**Owner:** Isonomia MCP / argument-write surface
**Relation to prior work:** sibling of the 3-part MCP scheme-ontology alignment
sequence; reuses the same write-seam discipline (scheme-HEALTH gate, AI-provenance
honesty flags) and the same MCP author-identity substrate established for chain
creation.

**Derived from / grounded against:**
- [CHAIN_CREATION_OVER_MCP_SPEC.md](CHAIN_CREATION_OVER_MCP_SPEC.md) — the
  `requestId`/idempotency + MCP author-identity pattern this spec extends to a
  *session* identity.
- [SCHEMES_MCP_TOOL_ALIGNMENT.md](SCHEMES_MCP_TOOL_ALIGNMENT.md) §1.4 (the two
  write seams) — CQ answers are an **argument-layer** write, not a scheme-layer one.
- Substrate already shipped (see §3): the `CQStatus` / `CQResponse` multi-response
  model, its HTTP routes, and `lib/cqs/permissions.ts`.

---

## 1. Motivation and the precise gap

Critical questions (CQs) are the dialectical obligations attached to a scheme-typed
argument — "is the expert actually in the relevant field?", "are there known
counter-causes?", etc. Answering them is how an `untested-default` argument earns
its standing. Today an LLM acting over MCP can **see** which CQs are open (the
`get_argument` envelope already projects a per-CQ `answered`/`partiallyAnswered`/
`unanswered` aggregate) but has **no write path to answer them**.

The user goal has two halves:

1. **Self-answer (canonical).** When an LLM creates an argument and, *in the same
   session*, answers that argument's CQs, those answers should be able to become the
   **canonical** CQ responses — because the author is answering their own argument.
2. **Propose (non-canonical).** When an LLM answers a CQ on an argument created by
   **someone else**, the answer is a **visible, non-canonical proposal**. The
   argument's creator can review it and, if they accept it, **upgrade it to
   canonical**.

**The substrate for both already exists** (§3). The gap is almost entirely:
- **(a)** an MCP tool surface that exposes `cqStatusId` and submits/answers CQs; and
- **(b)** a *session-scoped* AI identity so "the same LLM session that created the
  argument" can be told apart from "any other LLM session sharing the `mcp-bot`
  service user" — the one genuinely new piece of modeling.

---

## 2. Scope

### 2.1 In scope (v1)

- **Target type: `argument` only.** (`CQStatus.targetType` also supports `claim`;
  deferred to v2 to mirror the `propose_structured_argument` surface.)
- **One MCP write tool** to submit a CQ answer (`answer_critical_question`), plus
  the read affordance needed to discover answerable CQs and their `cqStatusId`.
- **Session-scoped self-canonicalisation:** an agent-supplied stable `sessionId`
  stamped into `aiProvenance` at argument-creation time, threaded back at
  CQ-answer time. If the answering session id matches the argument's creating
  session id, the answer may be promoted to canonical in the same call.
- **Non-canonical proposal path:** answers from any other session (or any session,
  on someone else's argument) land as `PENDING` `CQResponse` rows, visible per the
  existing permission rules (creator + moderators in v1; see §7.1 for the deferred
  broaden-to-participants feature), awaiting human approval.
- **Reuse every existing route / permission / activity-log invariant.** The MCP
  tool is a thin authenticated caller over the existing HTTP routes; it introduces
  no new approval logic.

### 2.2 Out of scope (v1 — explicit deferrals)

- **Human/UI approval surface changes.** Approval + canonical upgrade for AI
  proposals happens **through the existing web CQ-response panel** (creator clicks
  approve → set canonical). No MCP approve/canonical tool in v1.
- **CQs on `claim` targets** (only `argument` targets in v1).
- **Endorsements / votes from MCP** (`CQEndorsement`, vote routes exist but are not
  exposed to agents in v1).
- **Auto-canonical for AI on *others'* arguments** — never; AI answers to a
  different author are always `PENDING` regardless of session.
- **Attack/conflict materialisation from a CQ answer** (`CQAttack` linkage) — a CQ
  *answer* discharges an obligation; it does not open an attack. Out of scope.
- **Cross-session "claim my prior session" recovery** — if an agent loses its
  `sessionId`, it falls back to the non-canonical proposal path. No identity
  recovery flow.

---

## 3. What already exists (substrate inventory — verified)

This feature is mostly plumbing because the hard parts are already shipped.

### 3.1 Data model — [lib/models/schema.prisma](../../lib/models/schema.prisma)

| Concept | Row | Notes |
|---|---|---|
| The CQ obligation, per target | `CQStatus` (`@@unique([targetType, targetId, schemeKey, cqKey])`) | carries `statusEnum: CQStatusEnum`, `canonicalResponseId`, `roomId` (denormalised for RLS), review tracking |
| A candidate answer | `CQResponse` | `groundsText`, `evidenceClaimIds[]`, `sourceUrls[]`, `responseStatus: ResponseStatus`, `contributorId` |
| The chosen answer | `CQStatus.canonicalResponseId → CQResponse` (`relation "CanonicalResponse"`) | |
| Audit trail | `CQActivityLog` + `CQAction` | `RESPONSE_SUBMITTED`, `CANONICAL_SELECTED`, … |
| Community signal | `CQEndorsement`, `CQResponse.upvotes/downvotes` | not used by v1 |

- `CQStatusEnum`: `OPEN → PENDING_REVIEW → PARTIALLY_SATISFIED → SATISFIED → DISPUTED`.
- `ResponseStatus`: `PENDING → APPROVED → CANONICAL → REJECTED → SUPERSEDED → WITHDRAWN`.

### 3.2 HTTP routes — all live

- Submit an answer: [app/api/cqs/responses/submit/route.ts](../../app/api/cqs/responses/submit/route.ts)
  — creates a `PENDING` `CQResponse`, flips `CQStatus` `OPEN → PENDING_REVIEW`, logs
  `RESPONSE_SUBMITTED`. Guards: one pending response per contributor per CQ.
- Approve / reject / withdraw / endorse / vote:
  [app/api/cqs/responses/[id]/approve/route.ts](../../app/api/cqs/responses/[id]/approve/route.ts)
  (+ `reject`, `withdraw`, `endorse`, `vote` siblings).
- **Upgrade to canonical:** [app/api/cqs/status/canonical/route.ts](../../app/api/cqs/status/canonical/route.ts)
  — supersedes any prior canonical, sets the chosen response to `CANONICAL`, sets
  `CQStatus.statusEnum = SATISFIED`. Requires the response be `APPROVED`/`CANONICAL`
  first, and the caller pass `canModerateResponse`.
- CQ status read for an argument: [app/api/aif-cqs/route.ts](../../app/api/aif-cqs/route.ts)
  (joins scheme CQ definitions to `CQStatus` rows by `cqKey`).

### 3.3 Permissions — [lib/cqs/permissions.ts](../../lib/cqs/permissions.ts)

`getCQPermissions(userId, cqStatusId)` resolves the target's author
(`Argument.authorId` for `argument` targets) and returns a capability set:

- `isAuthor = claimAuthorId === userId` (string-equality on `auth_id`).
- `canSubmitResponse = isPublic || isParticipant`.
- `canApproveResponse / canSetCanonical = isAuthor || isModerator`.
- `canViewPendingResponses = isAuthor || isModerator` (others don't see pending —
  **v1 keeps this unchanged**; a deliberation-scoped broaden-to-participants option
  is a deferred feature, see §7.1).

### 3.4 MCP read — [packages/isonomia-mcp/src/server.ts](../../packages/isonomia-mcp/src/server.ts)

`get_argument` already returns `criticalQuestions` (per-CQ status aggregate with
`premiseType`, `isSchemeRequired`, `inheritedFromParentScheme`) — but it does **not**
expose `cqStatusId`, so there is no handle to answer against. (Gap A.)

### 3.5 MCP author identity — established by the chain spec

- All MCP writes are attributed to one shared service user
  (`auth_id = "mcp-bot"`, seeded `User.id = 166`, `MCP_AUTHOR_USER_BIGINT_ID`).
- `Argument.authorId` is a free `String` set to that user's `auth_id`.
- `aiProvenance` stamped at creation is **`{ via: "mcp", tool, createdAt }`** — it
  carries **no session id today** ([quick-structured route ~L700](../../app/api/arguments/quick-structured/route.ts)).

This is the crux: because *every* MCP session shares `mcp-bot`, `isAuthor` is
trivially true for *any* MCP session against *any* MCP-authored argument. Plain
`isAuthor` is therefore **not** a sound basis for "the same session may
self-canonicalise."

---

## 4. The session-identity mechanism (the one new piece)

**Decision (this pass): session-scoped self-canonicalisation.** MCP is stateless
per request ([http.ts](../../packages/isonomia-mcp/src/http.ts)), so there is no
server-minted session. The session id is **agent-supplied and stable** — exactly
the pattern already used for `requestId` idempotency on chains.

### 4.1 Stamp at creation

Add an optional `sessionId` (string, e.g. `min 1 / max 200`) to the write tools
that mint arguments — `propose_structured_argument`, `propose_argument_chain`, and
the warrant tool — and persist it into `aiProvenance`:

```jsonc
aiProvenance: { via: "mcp", tool: "propose_structured_argument",
                createdAt: "…", sessionId: "<agent-supplied>" }
```

Back-compat: arguments minted before this exists (or by callers that omit it) have
no `aiProvenance.sessionId` → they can never be self-canonicalised over MCP (they
fall through to the proposal path). Safe default.

### 4.2 Match at answer time

`answer_critical_question` accepts the same `sessionId`. The route:

1. Loads the target argument, reads `aiProvenance.sessionId`.
2. **Self-canonical eligible iff** the argument is AI-authored (`authorKind = AI`)
   **and** `aiProvenance.via === "mcp"` **and** `aiProvenance.sessionId` is present
   **and** equals the supplied `sessionId`.
3. If eligible **and** the caller opts in (`promoteToCanonical: true`, default
   true for self-answers): submit the response, then internally run the
   approve → set-canonical transition in one server-side transaction (the agent
   is, by construction, the author of its own argument).
4. Otherwise: submit as a `PENDING` proposal (the non-canonical path) and return
   `{ canonical: false, status: "PENDING" }`.

**Security note.** `sessionId` is an *unauthenticated* bearer-ish token: anyone who
learns another session's id could impersonate it. Mitigations to weigh in §7 Q1:
(a) treat `sessionId` as a capability — high-entropy, agent-generated, never echoed
in public read surfaces; (b) additionally require `authorKind = AI` + `via = mcp`
so it can only ever self-canonicalise *AI-authored MCP* arguments (never a human's);
(c) optionally bind `sessionId` to the MCP bearer token / a per-token salt so it is
only valid within the same credentialed caller. **Self-canonical never applies to a
human-authored argument** regardless of `sessionId` — that is the hard safety floor.

---

## 5. Proposed MCP tool surface

### 5.1 `answer_critical_question` (new write tool)

Input (zod):

```jsonc
{
  argumentId: string,            // the argument whose CQ is being answered
  cqKey: string,                 // which CQ (from get_argument.criticalQuestions)
  schemeKey?: string,            // disambiguates when CQ inherited; else inferred
  groundsText: string,           // 10..5000 chars (mirrors submit route)
  evidenceClaimIds?: string[],   // existing Claim ids used as evidence
  sourceUrls?: string[],         // external citations (url-validated)
  sessionId?: string,            // the §4 session token
  promoteToCanonical?: boolean,  // default true; only honoured if self-eligible
  requestId?: string             // idempotency (reuse chain pattern)
}
```

Behaviour: resolve/create the `CQStatus` for `(argument, schemeKey, cqKey)` →
submit a `CQResponse` → conditionally self-canonicalise per §4.2. Returns
`{ ok, cqStatusId, responseId, responseStatus, canonical, cqStatusEnum, permalink }`.

Error codes (UPPERCASE, per the E.1 convention):
- `CQ_NOT_FOUND` — no such `cqKey` on the argument's scheme(s).
- `CQ_ARGUMENT_NOT_FOUND` — argument id unknown.
- `CQ_DUPLICATE_PENDING` — caller already has a pending response (mirror submit 409).
- `CQ_SELF_CANONICAL_DENIED` — `promoteToCanonical` requested but not self-eligible
  (returns the response as `PENDING` with this as a non-fatal warning, not a hard
  failure — the answer is still recorded).

### 5.2 Read affordance

Expose `cqStatusId` (and the resolvable `cqKey`/`schemeKey`) in the
`get_argument.criticalQuestions[]` items so an agent has a stable handle. (Pure
additive change to the attestation builder; no behaviour change.)

### 5.3 Orientation

Add a **Recipe — Answer a critical question** to `orientation.ts` documenting:
discover open CQs via `get_argument`, answer with `answer_critical_question`, pass
the same `sessionId` you used to create the argument to make your own answers
canonical, and that answers to others' arguments are visible proposals a human
must approve. Bump `ORIENTATION_VERSION`.

---

## 6. Data-model mapping (no schema change required for the answer itself)

A v1 CQ answer materialises as:

| Concept | Row(s) | Notes |
|---|---|---|
| The obligation | `CQStatus` (upserted on `[argument, schemeKey, cqKey]`) | created if first touch |
| The AI's answer | one `CQResponse` (`contributorId = mcp-bot auth_id`) | `PENDING`, or promoted |
| Self-canonical promotion | `CQResponse.responseStatus = CANONICAL` + `CQStatus.canonicalResponseId` + `statusEnum = SATISFIED` | via the existing canonical transition |
| Audit | `CQActivityLog` rows (`RESPONSE_SUBMITTED`, + `CANONICAL_SELECTED` if promoted) | |

**The only schema touch** is additive and lives on the *argument*, not the CQ:
`aiProvenance.sessionId` (JSON field, no migration — `aiProvenance` is already
`Json?`). Everything CQ-side reuses existing columns.

---

## 7. Decisions (settled) + remaining confirmations

- **Q1 — `sessionId` trust model. DECIDED: high-entropy agent token + AI/MCP floor
  for v1.** `sessionId` is treated as a **capability token**: agent-generated, high
  entropy, never echoed in any public read surface (not in `get_argument`, the
  attestation, AIF/JSON-LD, or activity logs visible to others). The safety floor is
  enforced in addition, not instead: self-canonicalisation requires
  `authorKind = AI` **and** `aiProvenance.via === "mcp"` **and** a matching
  `aiProvenance.sessionId`. Consequence of the capability model — a leaked
  `sessionId` can only ever self-canonicalise *that session's own AI-authored MCP*
  arguments; it can **never** touch a human-authored argument. Binding `sessionId`
  to the MCP bearer token is **deferred** (a v2 hardening); documented as a known
  limitation. **Capability semantics to document in the tool/orientation copy:**
  "Generate a fresh, unguessable `sessionId` (e.g. a UUIDv4 or 128-bit random hex)
  per agent session, reuse it across all writes in that session, and never log or
  surface it — it is the only thing that lets you make your own CQ answers canonical."
- **Q2 — default `promoteToCanonical`. DECIDED: default `true`, soft fallback.**
  Self-answers are normally meant to be the official answer. When the caller is not
  self-eligible, the response is still recorded as `PENDING` and the call returns
  `canonical: false` with a non-fatal `CQ_SELF_CANONICAL_DENIED` warning (never a
  hard error).
- **Q3 — visibility of AI proposals. DECIDED: keep `canViewPendingResponses =
  isAuthor || isModerator` unchanged for v1.** "Visible" therefore means visible to
  the creator (and moderators), who reviews and upgrades. **No permissions change in
  this spec.** A broader visibility model is captured as a separate future feature —
  see §7.1.
- **Q4 — one canonical per CQ vs. accumulate. DECIDED: keep single-canonical**
  (new canonical supersedes old; other approved/pending answers remain as
  alternatives). No change.
- **Q5 — evidence handling. DECIDED: reuse the submit route verbatim** —
  `evidenceClaimIds` (existing `Claim` ids) + `sourceUrls` (validated strings). No
  new evidence-unfurl pipeline in v1.

### 7.1 Deferred feature — deliberation-scoped pending-response visibility

Today pending `CQResponse` rows are visible only to the target's author and room
moderators (`canViewPendingResponses = isAuthor || isModerator`). A future addition
should let a **deliberation opt in** to making pending responses viewable by **any
participant** (or anyone, for public rooms) — so that non-canonical AI (and human)
proposals are openly visible before approval, enabling community review/endorsement
ahead of the author's decision.

- **Shape (sketch):** a per-deliberation (or per-room) flag, e.g.
  `pendingResponsesPublic: boolean`, consulted in `getCQPermissions` so
  `canViewPendingResponses = isAuthor || isModerator || (pendingResponsesPublic &&
  (isParticipant || isPublic))`.
- **Why deferred:** it is a genuine permissions/visibility change with its own RLS
  and UI implications (showing an "unreviewed proposals" tray to all participants),
  independent of the MCP write path. v1 ships the write surface; this unlocks the
  "seen by others" half more fully later without blocking the agent tooling.

---

## 8. Phased implementation outline (proposed, not yet executed)

1. **S1 — provenance stamp.** Add `sessionId` to `propose_structured_argument`
   (+ chain + warrant) inputs; persist into `aiProvenance` in the quick-structured
   and quick-chain routes. Additive; covered by existing arg-write tests + 1 new.
2. **S2 — read handle.** Surface `cqStatusId`/`cqKey`/`schemeKey` in
   `get_argument.criticalQuestions[]` (attestation builder). Additive.
3. **S3 — answer route.** New `POST /api/cqs/answer` (or extend submit) that: upserts
   `CQStatus`, submits `CQResponse`, and runs the self-canonical transition when
   §4.2 eligibility holds — all server-side, reusing `lib/cqs/permissions.ts` and the
   canonical route's supersede logic. Middleware PUBLIC_API regex + MCP-bearer auth.
4. **S4 — MCP tool.** Register `answer_critical_question`; wire to S3. Bump tool count.
5. **S5 — orientation.** New recipe + `ORIENTATION_VERSION` bump; rebuild `dist/`.
6. **S6 — tests.** Jest: self-canonical promotes (same session); cross-session →
   PENDING; human-authored target → never canonical even with matching `sessionId`;
   duplicate-pending 409; idempotent replay on `requestId`.
7. **S7 — Claude Desktop smoke:** create an argument with a `sessionId`, answer its
   CQs (canonical), then answer a CQ on a human argument (PENDING) and approve via web.

---

## 9. One-paragraph summary

The canonical/non-canonical CQ-answer system — model, routes, permissions, audit —
is already built and unused by MCP. v1 is: (1) a small additive `sessionId` stamp on
AI-authored arguments to give "the same session" a real identity (since all MCP
writes otherwise share one `mcp-bot` user); (2) exposing `cqStatusId` on
`get_argument`; (3) one `answer_critical_question` MCP tool that submits a
`CQResponse` and self-canonicalises only when the answering session created the
(AI-authored) argument; everything else — approval, canonical upgrade for proposals
on others' arguments — stays on the existing human web surface. The only safety
floor that is non-negotiable: an AI session may **never** self-canonicalise a
**human-authored** argument's CQ.
