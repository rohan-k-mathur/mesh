# Facilitation — Authorization Matrix

Status: Draft v0.1 (C0 deliverable)
Parent: [docs/DelibDemocracyScopeC_Roadmap.md](../DelibDemocracyScopeC_Roadmap.md)
Companion: [docs/facilitation/API.md](API.md)

## Roles

Facilitation reuses Mesh's existing role primitives ([DeliberationRole](../../lib/models/schema.prisma)) — no new role enum is introduced.

| Role               | Source                                     | Notes |
|--------------------|--------------------------------------------|-------|
| `host`             | `DeliberationRole.role = HOST`             | Owns the deliberation; can do everything a facilitator can. |
| `facilitator`      | `DeliberationRole.role = FACILITATOR`      | Active operator of facilitation sessions. |
| `observer`         | `DeliberationRole.role = OBSERVER`         | Read-only access to facilitation telemetry. |
| `contributor`      | Default for any participant                | Can read public-redacted views only. |
| `anonymous`        | No session                                 | Can read public-redacted views only when `session.isPublic = true`. |

**Active-session constraint**: where the table below says "active session facilitator", the helper `lib/facilitation/auth.ts → isActiveSessionFacilitator(authId, sessionId)` returns true only if `session.status = OPEN` AND the caller's `auth_id = session.openedById` AND no PENDING handoff has transferred control.

## Capability matrix

| Capability                                       | host | facilitator         | observer | contributor | anonymous (public) |
|--------------------------------------------------|------|---------------------|----------|-------------|-------------------|
| **Sessions**                                     |      |                     |          |             |                   |
| Open session                                     | ✓    | ✓                   | ✗        | ✗           | ✗                 |
| Close session                                    | ✓    | ✓ (own session)     | ✗        | ✗           | ✗                 |
| Initiate handoff                                 | ✓    | ✓ (own session)     | ✗        | ✗           | ✗                 |
| Accept handoff                                   | ✓    | ✓ (target only)     | ✗        | ✗           | ✗                 |
| Decline handoff                                  | ✓    | ✓ (target only)     | ✗        | ✗           | ✗                 |
| **Questions**                                    |      |                     |          |             |                   |
| Author / revise question                         | ✓    | ✓                   | ✗        | ✗           | ✗                 |
| Run question check                               | ✓    | ✓                   | ✗        | ✗           | ✗                 |
| Lock question (BLOCK gate enforced)              | ✓    | ✓                   | ✗        | ✗           | ✗                 |
| Re-open locked question                          | ✓    | ✓ (own session)     | ✗        | ✗           | ✗                 |
| Read question + checks                           | ✓    | ✓                   | ✓        | ✓           | ✓ (public-read)   |
| **Interventions**                                |      |                     |          |             |                   |
| Read intervention queue                          | ✓    | ✓                   | ✓        | ✗           | ✗                 |
| Apply intervention                               | ✓\*  | ✓ (active session)  | ✗        | ✗           | ✗                 |
| Dismiss intervention                             | ✓\*  | ✓ (active session)  | ✗        | ✗           | ✗                 |
| Read intervention history (post-close)           | ✓    | ✓                   | ✓        | ✓ (own deliberation) | ✓ (public-read, summarized) |
| **Equity metrics**                               |      |                     |          |             |                   |
| Read live snapshot                               | ✓    | ✓                   | ✓        | ✗           | ✗                 |
| Read history                                     | ✓    | ✓                   | ✓        | ✓ (own deliberation) | ✓ (public-read, downsampled) |
| **Events / chain**                               |      |                     |          |             |                   |
| Read event feed                                  | ✓    | ✓                   | ✓        | ✓ (own deliberation, redacted) | ✓ (public-read, redacted) |
| Verify hash chain                                | ✓    | ✓                   | ✓        | ✓           | ✓ (public-read)   |
| **Reporting**                                    |      |                     |          |             |                   |
| Read facilitation report (full fidelity)         | ✓    | ✓                   | ✓        | ✗           | ✗                 |
| Read facilitation report (public-read variant)   | ✓    | ✓                   | ✓        | ✓           | ✓ (only if `isPublic=true`) |
| **Misc**                                         |      |                     |          |             |                   |
| Set `session.isPublic`                           | ✓    | ✓ (at open only)    | ✗        | ✗           | ✗                 |

\* `host` can act on interventions only when also the active session's facilitator (i.e. host opened the session, or accepted a handoff onto themselves). The host role does not implicitly take over an active session.

## Public-read redaction (decision #5)

Applies to any read endpoint reached by `contributor` or `anonymous` callers when `session.isPublic = true`:

| Field                                  | Public-read transformation |
|----------------------------------------|----------------------------|
| `actorId` / `openedById` / `appliedById` / `dismissedById` / `lockedById` / `authoredById` | Replaced with `sha256(authId)[:12]` |
| `intervention.rationaleJson`           | Truncated to a single sentence (`headline` only) |
| `intervention.dismissedReasonText`     | Omitted entirely |
| `intervention.dismissedReasonTag`      | Retained (aggregate-safe) |
| `metricSnapshot.breakdownJson`         | Stripped of any `userId` / `authId` references; counts retained |
| `event.payloadJson`                    | Stripped of free-text notes; structural fields retained |
| `question.text`                        | Retained (questions are inherently public to the room) |
| `question.checks[*].evidenceJson`      | Retained (heuristic outputs, no PII) |

Redaction is implemented by `lib/facilitation/auth.ts → redactForPublicRead(payload, viewerCtx)`. **All read routes pass their response through this helper.** The helper is the single source of truth; route handlers do not redact ad-hoc.

## Authorization helpers (to be implemented in C1)

```ts
// lib/facilitation/auth.ts

export async function isActiveSessionFacilitator(authId: string, sessionId: string): Promise<boolean>;
export async function canManageFacilitation(authId: string, deliberationId: string): Promise<boolean>; // host or facilitator
export async function canReadFacilitation(authId: string | null, sessionId: string): Promise<{
  ok: boolean;
  publicReadOnly: boolean; // true if caller can only see redacted view
}>;
export function redactForPublicRead<T>(payload: T, viewerCtx: { publicReadOnly: boolean }): T;

// Re-exported from Scope A so callers have a single import:
export { isFacilitator, isDeliberationHost } from "../pathways/auth";
```

Routes handle auth in this order:

1. `requireAuth()` (or anon-allowed equivalent for public-read endpoints).
2. Domain helper (`canManageFacilitation`, `isActiveSessionFacilitator`, `canReadFacilitation`) → returns 401/403/404 as appropriate.
3. Zod schema validation → returns 422 via `apiHelpers.zodError()`.
4. Service call.
5. `redactForPublicRead()` on the response if `publicReadOnly`.

## Failure modes covered by integration tests (C2.4)

| Scenario                                                                                  | Expected status | Code                                 |
|-------------------------------------------------------------------------------------------|-----------------|--------------------------------------|
| Unauthenticated POST to `/sessions`                                                       | 401             | `UNAUTHORIZED`                       |
| Contributor tries to open a session                                                       | 403             | `FORBIDDEN`                          |
| Open second session while one is OPEN                                                     | 409             | `CONFLICT_SESSION_ALREADY_OPEN`      |
| Apply intervention from a CLOSED session                                                  | 409             | `CONFLICT_SESSION_INACTIVE`          |
| Dismiss intervention without `reasonText`                                                 | 422             | `VALIDATION_ERROR`                   |
| Lock question with unresolved BLOCK check                                                 | 409             | `CONFLICT_BLOCK_SEVERITY_UNRESOLVED` |
| Initiate handoff while a PENDING handoff already exists                                   | 409             | `CONFLICT_HANDOFF_PENDING`           |
| Anonymous reads a session with `isPublic=false`                                           | 404             | `NOT_FOUND`                          |
| Anonymous reads a session with `isPublic=true` — receives redacted payload                | 200             | (redacted)                           |
| Observer attempts to apply intervention                                                   | 403             | `FORBIDDEN`                          |
| Host who is not the active facilitator attempts to apply intervention                     | 403             | `FORBIDDEN`                          |
