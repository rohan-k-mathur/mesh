# Answering Critical Questions over MCP — Implementation Roadmap

**Status:** ready-to-build (derived from the dev spec, substrate re-verified)
**Owner:** Isonomia MCP / argument-write surface
**Derived from:** [ANSWER_CRITICAL_QUESTIONS_OVER_MCP_SPEC.md](ANSWER_CRITICAL_QUESTIONS_OVER_MCP_SPEC.md)
**Companion patterns:** [CHAIN_CREATION_OVER_MCP_SPEC.md](CHAIN_CREATION_OVER_MCP_SPEC.md)
(requestId/idempotency + MCP author identity), [SCHEMES_MCP_ALIGNMENT_ROADMAP.md](SCHEMES_MCP_ALIGNMENT_ROADMAP.md)
(phase-ledger format, UPPERCASE write codes).

---

## 0. Re-verification deltas (read first)

The spec's substrate inventory (§3) was re-checked against the live code. Two facts
materially shape the build and are **not** fully reflected in the spec's "thin
caller over existing routes" framing:

1. **The existing CQ routes are cookie-auth only.**
   [app/api/cqs/responses/submit/route.ts](../../app/api/cqs/responses/submit/route.ts),
   [.../responses/[id]/approve/route.ts](../../app/api/cqs/responses/[id]/approve/route.ts),
   and [.../status/canonical/route.ts](../../app/api/cqs/status/canonical/route.ts)
   all authenticate via `getCurrentUserId()` (cookie/Firebase) — **none accept the
   MCP shared-secret bearer**. The MCP write surface (`quick-structured`,
   `quick-chain`) authenticates via `resolveCitationCallerUserId(req)` +
   `isMcpBearer(req)`. ⇒ v1 **cannot** be a thin MCP caller over those three
   routes. It needs **one new MCP-aware route** that performs the whole
   submit → (conditional) self-canonical sequence server-side.

2. **`submit` requires a pre-existing `cqStatusId`.** The MCP tool only knows
   `(argumentId, schemeKey, cqKey)`. So the new route must **upsert the `CQStatus`
   row first** (`@@unique([targetType, targetId, schemeKey, cqKey])`), exactly as
   the spec's §6 data-mapping table states ("`CQStatus` upserted on
   `[argument, schemeKey, cqKey]`, created if first touch").

Everything else in §3 is confirmed: `CQStatus` / `CQResponse` / `CQActivityLog`
models + enums, `getCQPermissions(userId, cqStatusId)` capability set, the
single-canonical supersede logic, and the `mcp-bot` author identity
(`Argument.authorId` is a free `String`; `isAuthor = authorId === userId`).

**Net effect:** the new route reuses the *logic* of the three existing routes
(submit guards, supersede-prior-canonical, activity logging) but reimplements it in
one MCP-authenticated transaction rather than calling them over HTTP. The existing
routes stay untouched (web UI keeps using them).

---

## 1. Phase ledger

Recommended order: **S1 → S2 → S3 → S4 → S5 → S6 → S7**. S1–S3 are independent of
the MCP package and ship/test on the web side first; S4–S5 are the MCP package
changes (one Claude Desktop restart); S6–S7 are validation.

| Phase | Title | Surface | Migration? | Depends on |
|---|---|---|---|---|
| **S1** | `sessionId` provenance stamp | route + MCP input | no (JSON field) | — |
| **S2** | `cqStatusId` read handle on `get_argument` | attestation builder | no | — |
| **S3** | `POST /api/cqs/answer` (the new MCP-aware route) | new route + helper | no | S1 (reads stamp) |
| **S4** | `answer_critical_question` MCP tool | MCP server.ts | no | S3 |
| **S5** | Orientation recipe + version bump | MCP orientation.ts | no | S4 |
| **S6** | Jest integration tests | `__tests__/api/` + `__tests__/lib/` | no | S3 |
| **S7** | Claude Desktop smoke | manual | no | S4–S5 |

No phase requires a Prisma migration — `aiProvenance` is already `Json?` and every
CQ column already exists.

---

## 2. S1 — `sessionId` provenance stamp

**Goal.** Give "the same MCP session" a real identity, since every MCP write shares
the `mcp-bot` user and `isAuthor` is therefore trivially true for any session.

### 2.1 Route changes

Files: [app/api/arguments/quick-structured/route.ts](../../app/api/arguments/quick-structured/route.ts),
[app/api/argument-chains/quick-chain/route.ts](../../app/api/argument-chains/quick-chain/route.ts),
[app/api/v3/deliberations/[id]/ecc/propose-warrant/route.ts](../../app/api/v3/deliberations/[id]/ecc/propose-warrant/route.ts).

- Add `sessionId: z.string().min(1).max(200).optional()` to each route's zod schema.
- At the `aiProvenance` stamp site (only when `viaMcp` / MCP-authored), extend the
  object with `sessionId` **only when present**:
  ```ts
  aiProvenance: {
    via: "mcp",
    tool: "propose_structured_argument", // or propose_argument_chain / propose_warrant
    createdAt: new Date().toISOString(),
    ...(sessionId ? { sessionId } : {}),
  }
  ```
  - **quick-structured:** the stamp is the `viaMcp ? { authorKind, aiProvenance } : {}`
    spread on `argument.create` (confirm exact current shape at the create site;
    today it does not include `createdAt`/`tool` consistently — normalise it here so
    S3 can read `aiProvenance.via === "mcp"` reliably).
  - **quick-chain (`mintAndLinkChain`):** each link's `argument.create` carries
    `aiProvenance: { tool: "propose_argument_chain", … }` when `viaMcp`. Thread the
    chain-level `sessionId` into every minted link so any link's CQ can be
    self-answered later. `compose` mode mints no arguments → no stamp.
  - **propose-warrant:** the route already builds `aiProvenance = { …body.aiProvenance,
    generatedAt, via: "mcp:propose_warrant" }`. Add `sessionId` and ensure
    `via` starts with `"mcp"` so the §4.2 match (`via.startsWith("mcp")` or
    `=== "mcp"`) holds — **decide one convention** (recommend: match
    `aiProvenance.via` with a `String(via).startsWith("mcp")` test in S3 to cover
    both `"mcp"` and `"mcp:propose_warrant"`).

### 2.2 MCP input changes (deferred to S4)

The `sessionId` zod field on the three MCP tools lands with the S4 package change
(one restart for all tool-surface edits). S1 only touches the routes so they
*accept and persist* `sessionId` immediately (testable server-side without a
Claude restart).

### 2.3 Back-compat

Arguments minted before S1, or by callers that omit `sessionId`, have no
`aiProvenance.sessionId` ⇒ never self-canonical-eligible ⇒ fall to the PENDING
proposal path. Safe default, no data fix needed.

### 2.4 Tests (land with S6, but unit-scoped here)

- quick-structured: `sessionId` round-trips into `argument.create` data
  `aiProvenance.sessionId`; absent when omitted.
- quick-chain: every minted link carries the chain `sessionId`.

---

## 3. S2 — `cqStatusId` read handle on `get_argument`

**Goal.** Give the agent a stable handle to answer against. Today
`get_argument.criticalQuestions[]` carries the per-CQ aggregate
(`answered`/`partiallyAnswered`/`unanswered`, `premiseType`, `isSchemeRequired`,
`inheritedFromParentScheme`) but **no `cqStatusId`**.

File: [lib/citations/argumentAttestation.ts](../../lib/citations/argumentAttestation.ts)
(the `criticalQuestions` builder; same area enriched in the A.2 work).

- For each CQ item, resolve its `CQStatus` row by
  `(targetType: "argument", targetId: argument.id, schemeKey, cqKey)` and surface:
  - `cqStatusId: string | null` (null when no `CQStatus` row exists yet — the CQ is
    open but never touched; the answer route will **create** it).
  - `cqKey` and `schemeKey` (already derivable; expose explicitly so the agent can
    pass them verbatim).
- **Efficiency:** batch-load all `CQStatus` rows for the argument in one
  `findMany({ where: { targetType: "argument", targetId } })` and index by
  `${schemeKey}::${cqKey}` rather than per-CQ queries.
- Purely additive — no field removed, no behaviour change. The `cq_status` aggregate
  counts are unchanged.

### 3.1 Fixture / back-compat

Add `cqStatusId: null` (and `cqKey`/`schemeKey`) to any attestation snapshot
fixtures (mirrors the A.2 `schemeInstance: null` fixture fix in
`citationFormats.test.ts`).

### 3.2 Tests

- Argument with a touched CQ → item carries the real `cqStatusId`.
- Argument with an untouched CQ → `cqStatusId: null`, `cqKey`/`schemeKey` present.

---

## 4. S3 — `POST /api/cqs/answer` (the core route)

**Goal.** One MCP-authenticated, transactional route that: resolves/upserts the
`CQStatus`, submits a `CQResponse`, and conditionally self-canonicalises.

File: new `app/api/cqs/answer/route.ts`. Helper logic in a new
`lib/cqs/answerOverMcp.ts` (keeps the route thin + unit-testable).

### 4.1 Auth + rate limit

- Auth: `resolveCitationCallerUserId(req)` + `isMcpBearer(req)` (same as
  quick-structured). Cookie callers are also accepted (the helper is auth-agnostic;
  it takes a resolved `userId`).
- Rate limit: dedicated limiter `rl:cq_answer`, e.g. `fixedWindow(30, "1 h")` (a CQ
  answer is cheaper than a chain; do **not** share the `rl:quick_arg` budget).
- Middleware: add a `PUBLIC_API` regex `^/api/cqs/answer/?$` to
  [middleware.ts](../../middleware.ts) so the MCP bearer reaches the route.

### 4.2 Request schema (mirrors spec §5.1)

```ts
const AnswerCQSchema = z.object({
  argumentId: z.string().min(1),
  cqKey: z.string().min(1),
  schemeKey: z.string().min(1).optional(),       // disambiguates inherited CQs
  groundsText: z.string().min(10).max(5000),     // mirrors submit route
  evidenceClaimIds: z.array(z.string()).optional().default([]),
  sourceUrls: z.array(z.string().url()).optional().default([]),
  sessionId: z.string().min(1).max(200).optional(),
  promoteToCanonical: z.boolean().optional().default(true),
  requestId: z.string().min(1).max(200).optional(), // idempotency
});
```

### 4.3 Flow

1. **Load the argument** (`prisma.argument.findUnique`, select
   `id, authorId, deliberationId, aiProvenance, authorKind, conclusionClaimId`,
   plus its scheme instances to validate `cqKey`/`schemeKey`).
   Missing → 404 `{ code: "CQ_ARGUMENT_NOT_FOUND" }`.
2. **Resolve `(schemeKey, cqKey)`.** Validate the `cqKey` belongs to one of the
   argument's schemes (own or inherited). If `schemeKey` omitted and the `cqKey` is
   unambiguous, infer it; ambiguous → require it. Unknown → 400
   `{ code: "CQ_NOT_FOUND" }`. (Reuse the same scheme→CQ join logic the
   `aif-cqs` read uses — extract it to a shared helper if not already.)
3. **Idempotency pre-flight.** If `requestId` present, look up a prior
   `CQResponse` stamped with it (store `requestId` in `CQResponse` — see §4.6) and
   **replay** `{ ok, idempotentReplay: true, … }` before any write.
4. **Upsert `CQStatus`** on `@@unique([targetType, targetId, schemeKey, cqKey])`
   with `targetType: "argument"`, `targetId: argumentId`, `createdById: userId`,
   `roomId` (resolve from the deliberation/room if the schema denormalises it).
5. **Duplicate-pending guard** (mirror submit): one PENDING `CQResponse` per
   `(cqStatusId, contributorId)` → 409 `{ code: "CQ_DUPLICATE_PENDING" }`.
6. **Evidence-claim existence check** (mirror submit): all `evidenceClaimIds` must
   resolve → else 400.
7. **Self-canonical eligibility** (spec §4.2):
   ```ts
   const prov = argument.aiProvenance as { via?: string; sessionId?: string } | null;
   const selfEligible =
     argument.authorKind === "AI" &&
     typeof prov?.via === "string" && prov.via.startsWith("mcp") &&
     !!prov.sessionId && !!sessionId && prov.sessionId === sessionId;
   ```
   **Hard floor:** never self-canonical on a human-authored argument regardless of
   `sessionId`. (Guaranteed by the `authorKind === "AI"` clause.)
8. **Transaction:**
   - Create the `CQResponse` (`responseStatus: "PENDING"`, `contributorId: userId`,
     `groundsText`, `evidenceClaimIds`, `sourceUrls`, `requestId` if present).
   - Flip `CQStatus` `OPEN → PENDING_REVIEW` (only if currently OPEN).
   - Log `CQActivityLog { action: "RESPONSE_SUBMITTED" }`.
   - **If `selfEligible && promoteToCanonical`:** run the canonical transition
     inline (the logic from `status/canonical`): supersede any prior
     `canonicalResponseId` → `SUPERSEDED`; set this response `CANONICAL`; set
     `CQStatus { canonicalResponseId, statusEnum: "SATISFIED", lastReviewedAt,
     lastReviewedBy: userId }`; log `CQActivityLog { action: "CANONICAL_SELECTED" }`.
   - **If `promoteToCanonical` but `!selfEligible`:** leave PENDING; attach a
     non-fatal warning `CQ_SELF_CANONICAL_DENIED` (the answer is still recorded —
     never a hard error, per spec Q2).
9. **Response:**
   ```jsonc
   {
     ok: true,
     cqStatusId, responseId,
     responseStatus: "PENDING" | "CANONICAL",
     canonical: boolean,
     cqStatusEnum: "OPEN" | "PENDING_REVIEW" | "SATISFIED" | …,
     warnings: [{ code: "CQ_SELF_CANONICAL_DENIED", detail }]?,
     permalink,                     // argument permalink
     idempotentReplay?: true
   }
   ```

### 4.4 Error codes (UPPERCASE, spec §5.1)

`CQ_ARGUMENT_NOT_FOUND`, `CQ_NOT_FOUND` (no such cqKey on the argument's schemes),
`CQ_DUPLICATE_PENDING` (409), `CQ_SELF_CANONICAL_DENIED` (non-fatal warning, not a
status code). Evidence/validation failures reuse the submit route's 400 shape.

### 4.5 Permissions reuse

The route resolves `userId` directly and (for the non-self path) may consult
`getCQPermissions(userId, cqStatusId).canSubmitResponse` for parity with the web
submit guard. The self-canonical path is gated by the §4.2 eligibility test
(server-derived), **not** by `canSetCanonical` over HTTP — the agent is, by
construction, the author of its own AI argument, so the route performs the
transition internally without a second authorization round-trip.

### 4.6 Idempotency column (optional, recommended)

Add `requestId String? @db.VarChar(200)` + `@@unique([contributorId, requestId])`
to `CQResponse` (Postgres NULLs-distinct → keyless answers unaffected). This mirrors
the `ArgumentChain.idempotencyKey` pattern. **If you skip the column in v1**, drop
`requestId` from the tool surface too (don't expose an idempotency key the server
can't honour). *Note:* this is the **only** optional schema touch in the whole
roadmap; apply with `npx prisma db push --accept-data-loss` (never pipe through
`| tail` — it hides the data-loss confirm prompt).

---

## 5. S4 — `answer_critical_question` MCP tool

File: [packages/isonomia-mcp/src/server.ts](../../packages/isonomia-mcp/src/server.ts).

- Add `AnswerCriticalQuestionInput` zod schema after `ProposeArgumentChainInput`
  (fields = §4.2, all enums/strings inlined — the package can't import `@/lib`).
- Register the tool right after `propose_argument_chain`:
  - `API_TOKEN` guard (write tool).
  - `isoFetch("/api/cqs/answer", { method: "POST", authenticated: true, … })`.
  - Description: discover `cqStatusId`/`cqKey` via `get_argument.criticalQuestions[]`;
    pass the **same `sessionId` used to create the argument** to make your own
    answers canonical; answers to **others'** arguments are visible PENDING
    proposals a human approves; `promoteToCanonical` defaults true but is a soft
    fallback (denied → still recorded PENDING with `CQ_SELF_CANONICAL_DENIED`).
- **Also add `sessionId`** to `ProposeStructuredArgumentInput`,
  `ProposeArgumentChainInput`, and `ProposeWarrantInput` (the S1 MCP-side half),
  with a describe() explaining it is a per-session capability token (generate a
  fresh UUIDv4 once per agent session, reuse across all writes, never log/surface).
- Tool count 53 → **54**. Verify `grep -cE '^    name: "' src/server.ts` = 54.

---

## 6. S5 — Orientation recipe + version bump

File: [packages/isonomia-mcp/src/orientation.ts](../../packages/isonomia-mcp/src/orientation.ts).

- `ORIENTATION_VERSION` 1.16.2 → **1.17.0** (tool-surface change).
- Cluster 3 (authoring) tool count 4 → 5; add `answer_critical_question` bullet.
- `SERVER_INSTRUCTIONS`: one line under the write surfaces noting CQ answers +
  `sessionId` self-canonicalisation.
- New **Recipe E.4 — Answer a critical question**:
  1. `get_argument(permalink)` → read `criticalQuestions[]`; pick an item with open
     `unanswered`, take its `cqStatusId`/`cqKey`/`schemeKey`.
  2. `answer_critical_question({ argumentId, cqKey, schemeKey?, groundsText,
     evidenceClaimIds?, sourceUrls?, sessionId, promoteToCanonical?, requestId })`.
  3. **`sessionId` discipline:** pass the SAME `sessionId` you used when you created
     the argument → your answer becomes CANONICAL. A different/absent session, or
     someone else's argument → PENDING proposal (`canonical: false`,
     `CQ_SELF_CANONICAL_DENIED` warning), which a human approves on the web CQ panel.
  4. Verify with `get_argument` → the CQ's `answered` count should reflect the
     canonical answer.
- Rebuild `dist/` (`cd packages/isonomia-mcp && npm run build`), verify `1.17.0` +
  `answer_critical_question` greps in `dist/`. **Claude Desktop restart required.**

---

## 7. S6 — Jest integration tests

New `__tests__/api/cq-answer.test.ts` (mirrors the quick-chain/quick-structured
harness: `prismaMock`, mocked `resolveCitationCallerUserId` → mcp-bot, mocked
ratelimit). Cases:

1. **Self-canonical promote** — argument `authorKind: "AI"`,
   `aiProvenance: { via: "mcp", sessionId: "s1" }`; answer with `sessionId: "s1"`,
   `promoteToCanonical: true` → response `CANONICAL`, `canonical: true`,
   `CQStatus.statusEnum: "SATISFIED"`, `canonicalResponseId` set, two activity logs
   (`RESPONSE_SUBMITTED` + `CANONICAL_SELECTED`).
2. **Cross-session → PENDING** — same AI argument, answer with `sessionId: "s2"` →
   `PENDING`, `canonical: false`, `CQ_SELF_CANONICAL_DENIED` warning, answer recorded.
3. **Human-authored target → never canonical** — `authorKind: "HUMAN"` (or no AI
   provenance), even with a matching `sessionId` → `PENDING` (the hard floor).
4. **CQStatus upsert (first touch)** — no prior `CQStatus` row → one is created with
   the right `@@unique` tuple; subsequent answer reuses it.
5. **Duplicate-pending 409** — second PENDING answer by same contributor on same CQ
   → `CQ_DUPLICATE_PENDING`, nothing written.
6. **Unknown cqKey → CQ_NOT_FOUND**; **unknown argument → CQ_ARGUMENT_NOT_FOUND**.
7. **Idempotent replay** (if §4.6 column shipped) — same `requestId` replays the
   first answer, no second `CQResponse.create`.
8. **Supersede prior canonical** — pre-existing canonical response → new
   self-canonical answer flips the old one to `SUPERSEDED`.

Plus the S1 unit assertions (sessionId stamped) and S2 (`cqStatusId` surfaced).
Target: all green, `npm run lint` + `get_errors` clean, MCP `tsc` clean.

---

## 8. S7 — Claude Desktop smoke

Manual, post-restart on 1.17.0:

1. Create a structured argument with an explicit `sessionId` (UUIDv4).
2. `get_argument` → read an open CQ's `cqStatusId`/`cqKey`.
3. `answer_critical_question` with the **same** `sessionId` → confirm `canonical:
   true`, and `get_argument` shows the CQ answered.
4. Answer a CQ on a **human-authored** argument (or a different session) → confirm
   `PENDING` + `CQ_SELF_CANONICAL_DENIED`, then approve it via the web CQ-response
   panel to confirm the human upgrade path still works end-to-end.
5. Save a transcript to `experiments/` (mirrors the chain smoke transcript).

---

## 9. Out of scope (carried from spec §2.2 / §7)

- No MCP approve/canonical tool for proposals on **others'** arguments (web panel
  only). No CQ-on-`claim` targets (argument only). No endorsements/votes from MCP.
  No attack/conflict materialisation from an answer. No session-recovery flow.
- **Deferred feature (spec §7.1):** deliberation-scoped pending-response visibility
  (`pendingResponsesPublic` flag in `getCQPermissions`) — a separate permissions/RLS
  change, independent of this write path.
- **Deferred hardening (spec §7 Q1):** binding `sessionId` to the MCP bearer token /
  a per-token salt. v1 treats `sessionId` as a high-entropy capability token with
  the `authorKind = AI` + `via = mcp` floor; a leaked id can only ever
  self-canonicalise that session's own AI-authored MCP arguments, never a human's.

---

## 10. One-paragraph build summary

Ship S1 (stamp `aiProvenance.sessionId` on the three MCP arg-minting routes — no
migration, `aiProvenance` is already `Json?`) and S2 (surface `cqStatusId` on
`get_argument.criticalQuestions[]`) first; both are additive and testable on the web
side without a Claude restart. Then S3: a new MCP-bearer-aware
`POST /api/cqs/answer` that upserts the `CQStatus`, submits a `CQResponse`, and —
**only** when the answering `sessionId` matches the AI-authored argument's creating
session — runs the approve→canonical transition inline (reusing the existing
supersede logic, not the cookie-only routes). S4–S5 add the `answer_critical_question`
MCP tool + `sessionId` on the arg-write tools + orientation 1.17.0 (one Claude
restart). S6 covers the eight invariant cases — with the human-authored-never-canonical
floor as the headline test — and S7 is the live smoke. The only optional schema touch
is a `CQResponse.requestId` idempotency column; everything else reuses shipped
columns, enums, and permission logic.
