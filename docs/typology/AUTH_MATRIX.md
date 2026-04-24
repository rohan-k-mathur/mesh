# Typology — Authorization Matrix

Status: Draft v0.1 (B0 deliverable)
Parent: [docs/DelibDemocracyScopeB_Roadmap.md](../DelibDemocracyScopeB_Roadmap.md)
Companion: [docs/typology/API.md](API.md)

## Roles

Typology reuses Mesh's existing role primitives ([DeliberationRole](../../lib/models/schema.prisma)) — no new role enum is introduced.

| Role          | Source                                | Notes |
|---------------|---------------------------------------|-------|
| `host`        | `DeliberationRole.role = HOST`        | Owns the deliberation; can do everything a facilitator can plus opt the deliberation in/out of public reads. |
| `facilitator` | `DeliberationRole.role = FACILITATOR` | Active operator; promotes/dismisses candidates and drafts/publishes summaries. |
| `observer`    | `DeliberationRole.role = OBSERVER`    | Read-only access to typology telemetry. |
| `contributor` | Default for any participant           | Can propose tags on the deliberation; can read public-redacted views. |
| `anonymous`   | No session                            | Public-redacted views only when the relevant `isPublic = true`. |

**Active-session constraint**: where the table below says "active session facilitator", the helper `lib/typology/auth.ts → isActiveSessionFacilitator(authId, sessionId)` returns true only if `session.status = OPEN` AND the caller's `auth_id = session.openedById` AND no PENDING handoff has transferred control. (Re-uses Scope C's helper of the same name.)

## Capability matrix

| Capability                                          | host | facilitator        | observer | contributor              | anonymous (public) |
|-----------------------------------------------------|------|--------------------|----------|--------------------------|-------------------|
| **Axes**                                            |      |                    |          |                          |                   |
| Read axis registry                                  | ✓    | ✓                  | ✓        | ✓                        | ✓                 |
| Toggle `isActive` on an axis                        | ✗    | ✗                  | ✗        | ✗                        | ✗                 (admin migration only) |
| **Tags**                                            |      |                    |          |                          |                   |
| Propose tag                                         | ✓    | ✓                  | ✗        | ✓ (own deliberation)     | ✗                 |
| Confirm tag (own proposal)                          | ✓    | ✓                  | ✗        | ✓                        | ✗                 |
| Confirm tag (other author's proposal)               | ✓    | ✓                  | ✗        | ✗                        | ✗                 |
| Retract tag (own)                                   | ✓    | ✓                  | ✗        | ✓                        | ✗                 |
| Retract tag (any)                                   | ✓    | ✓                  | ✗        | ✗                        | ✗                 |
| Read tag list                                       | ✓    | ✓                  | ✓        | ✓ (own deliberation)     | ✓ (public-read, redacted) |
| **Candidates**                                      |      |                    |          |                          |                   |
| Read candidate queue                                | ✓    | ✓                  | ✓        | ✗                        | ✗                 |
| Promote candidate                                   | ✓\*  | ✓ (active session) | ✗        | ✗                        | ✗                 |
| Dismiss candidate                                   | ✓\*  | ✓ (active session) | ✗        | ✗                        | ✗                 |
| **Summaries**                                       |      |                    |          |                          |                   |
| Draft summary                                       | ✓    | ✓                  | ✗        | ✗                        | ✗                 |
| Edit DRAFT (original drafter only)                  | ✓\*\*| ✓\*\*              | ✗        | ✗                        | ✗                 |
| Publish summary                                     | ✓    | ✓                  | ✗        | ✗                        | ✗                 |
| Retract published summary                           | ✓    | ✓                  | ✗        | ✗                        | ✗                 |
| Read summary list (PUBLISHED)                       | ✓    | ✓                  | ✓        | ✓ (own deliberation)     | ✓ (public-read, redacted) |
| Read summary detail                                 | ✓    | ✓                  | ✓        | ✓ (own deliberation)     | ✓ (public-read, redacted) |
| Read summary history (DRAFT + RETRACTED)            | ✓    | ✓                  | ✓        | ✗                        | ✗                 |
| **Events / chain**                                  |      |                    |          |                          |                   |
| Read event feed                                     | ✓    | ✓                  | ✓        | ✓ (own deliberation, redacted) | ✓ (public-read, redacted) |
| Verify hash chain                                   | ✓    | ✓                  | ✓        | ✓                        | ✓ (public-read)   |
| **Export**                                          |      |                    |          |                          |                   |
| Read canonical typology export                      | ✓    | ✓                  | ✓        | ✗                        | ✓ (only if every in-scope chain is `isPublic=true`) |

\* `host` can act on candidates only when also the active session's facilitator (i.e. host opened the session, or accepted a handoff onto themselves). The host role does not implicitly take over an active session — parity with Scope C.

\*\* "Edit DRAFT" is gated to the **original drafter** (`MetaConsensusSummary.authoredById`), not the role broadly. A different facilitator who needs to revise must publish-then-version (creating a new row with `parentSummaryId`).

## Public-read redaction (decision #5)

Applies to any read endpoint reached by `contributor` or `anonymous` callers. **Identical posture to Scope A and Scope C.**

| Field                                    | Public-read transformation |
|------------------------------------------|----------------------------|
| `tag.authoredById` / `confirmedById` / `retractedById` | Replaced with `sha256(authId)[:12]` |
| `summary.authoredById` / `publishedById` / `retractedById` | Replaced with `sha256(authId)[:12]` |
| `event.actorId`                          | Replaced with `sha256(authId)[:12]` |
| `tag.evidenceText`                       | Truncated to 140 chars; suffix `…` if truncated |
| `tag.evidenceJson`                       | Stripped of any `userId` / `authId` references; structural fields retained |
| `tag.retractedReasonText`                | Omitted entirely |
| `summary.retractedReasonText`            | Omitted entirely |
| `summary.bodyJson.blockers`              | Retained verbatim (non-PII summary content) |
| `summary.bodyJson.disagreedOn[*].summary`| Retained verbatim |
| `summary.narrativeText`                  | Retained verbatim |
| `summary.snapshotJson`                   | Retained, but per-tag `evidenceText` truncated as above and any author refs hashed |
| `event.payloadJson`                      | Stripped of free-text notes; structural fields (axisKey, targetType, targetId, ruleName) retained |
| `candidate.rationaleText`                | Retained (rule-generated, non-PII) |
| `candidate.dismissedReasonText`          | Omitted entirely |

Redaction is implemented by `lib/typology/auth.ts → redactForPublicRead(payload, viewerCtx)`. **All read routes pass their response through this helper.** The helper is the single source of truth; route handlers do not redact ad-hoc. Mirrors Scope C's discipline.

## Authorization helpers (to be implemented in B1)

```ts
// lib/typology/auth.ts

export async function canProposeTag(authId: string, deliberationId: string): Promise<boolean>;
export async function canConfirmTag(authId: string, tagId: string): Promise<boolean>;
export async function canRetractTag(authId: string, tagId: string): Promise<boolean>;
export async function canManageCandidates(authId: string, sessionId: string): Promise<boolean>; // active-session facilitator OR host
export async function canDraftSummary(authId: string, deliberationId: string): Promise<boolean>;
export async function canEditDraft(authId: string, summaryId: string): Promise<boolean>; // original drafter only
export async function canPublishSummary(authId: string, deliberationId: string): Promise<boolean>;
export async function canReadTypology(authId: string | null, deliberationId: string, sessionId?: string | null): Promise<{
  ok: boolean;
  publicReadOnly: boolean;
}>;
export function redactForPublicRead<T>(payload: T, viewerCtx: { publicReadOnly: boolean }): T;

// Re-exported from Scope C (which re-exports from Scope A) so callers have a single import:
export { isFacilitator, isDeliberationHost, isActiveSessionFacilitator } from "../facilitation/auth";
```

Routes handle auth in this order:

1. `requireAuth()` (or anon-allowed equivalent for public-read endpoints).
2. Domain helper (one of the `can…` functions) → returns 401/403/404 as appropriate.
3. Zod schema validation → returns 422 via `apiHelpers.zodError()`.
4. Service call.
5. `redactForPublicRead()` on the response if `publicReadOnly`.

## Failure modes covered by integration tests (B2.4)

| Scenario                                                                                  | Expected status | Code                                          |
|-------------------------------------------------------------------------------------------|-----------------|-----------------------------------------------|
| Unauthenticated POST to `/typology/tags`                                                  | 401             | `UNAUTHORIZED`                                |
| Anonymous reads tags on a private deliberation                                            | 404             | `NOT_FOUND`                                   |
| Contributor tries to confirm someone else's tag                                           | 403             | `FORBIDDEN`                                   |
| Propose tag against a target outside the deliberation                                     | 404             | `CONFLICT_TARGET_OUTSIDE_DELIBERATION`        |
| Confirm a retracted tag                                                                   | 409             | `CONFLICT_TAG_RETRACTED`                      |
| Retract without `reason`                                                                  | 422             | `VALIDATION_ERROR`                            |
| Edit a published summary                                                                  | 409             | `CONFLICT_SUMMARY_NOT_DRAFT`                  |
| Publish a summary referencing a retracted tag                                             | 409             | `CONFLICT_SUMMARY_REFERENCES_RETRACTED_TAG`   |
| Publish a summary that exceeds 256 KiB snapshot cap                                       | 422             | `SNAPSHOT_TOO_LARGE`                          |
| Propose tag on an axis where `isActive = false`                                           | 409             | `CONFLICT_AXIS_INACTIVE`                      |
| Promote a candidate that has already been dismissed                                       | 409             | `CONFLICT_CANDIDATE_RESOLVED`                 |
| Observer attempts to promote a candidate                                                  | 403             | `FORBIDDEN`                                   |
| Host who is not the active facilitator attempts to promote a candidate                    | 403             | `FORBIDDEN`                                   |
| Anonymous reads typology export when one chain is private                                 | 404             | `NOT_FOUND`                                   |
| Anonymous reads typology summary on a public deliberation — receives redacted payload     | 200             | (redacted)                                    |
| Re-tag the same `(target, axis, author)` triple — upserts in place                        | 200             | (no error; emits fresh `TAG_PROPOSED` event)  |
| Additive contract on `GET /api/pathways/[id]`: existing fields unchanged                  | 200             | (regression test)                             |
