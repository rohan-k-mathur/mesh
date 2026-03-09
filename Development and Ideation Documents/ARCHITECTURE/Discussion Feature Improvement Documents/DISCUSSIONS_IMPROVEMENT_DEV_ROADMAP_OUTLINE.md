# Discussions & Chat Improvement Development Roadmap

> **Status**: Draft  
> **Created**: March 9, 2026  
> **Source**: [DISCUSSIONS_IMPROVEMENT_BRAINSTORM.md](DISCUSSIONS_IMPROVEMENT_BRAINSTORM.md), [DISCUSSIONS_AND_CHAT_ARCHITECTURE.md](../DISCUSSIONS_AND_CHAT_ARCHITECTURE.md)  
> **Goal**: Harden the Discussions & Chat system from a capable prototype into a production-grade, search-indexed, notification-driven discussion platform with structured knowledge harvesting

---

## Executive Summary

This roadmap executes the improvements outlined in the Discussions Improvement Brainstorm, organized into five phases:

| Phase | Focus | Duration | Outcome |
|-------|-------|----------|---------|
| **Phase 1** | Foundation Fixes | 1-2 days | Error feedback, security enforcement, debug cleanup |
| **Phase 2** | Feature Completeness | 3-4 weeks | Editing, notifications, search, roles, reactions |
| **Phase 3** | Real-Time & Sync Robustness | 1-2 weeks | Drift sync, reconnection, forum live updates |
| **Phase 4** | Structured Knowledge Harvesting | 2-3 weeks | Pinning, templates, cross-linking, tags, timeline |
| **Phase 5** | AI-Enhanced Features (Deferred) | TBD | Summaries, smart seeding, semantic search |

**Total Estimated Duration**: 8-11 weeks (Phases 1-4; Phase 5 deferred)

---

## Phase 1: Foundation Fixes

**Objective**: Close the 4 explicit TODOs and the one security gap. These are small, high-confidence changes that should land immediately before any feature work begins.

**Timeline**: Days 1-2  
**Dependencies**: None

### 1.1 Error Toast Notifications

**Priority**: P0 — Active UX bugs  
**Estimated Effort**: 1-2 hours  
**Risk**: Low

#### Problem Statement

Four places in the codebase have explicit `// TODO: toast error` comments where operations fail silently:
- `DiscussionDescriptionEditor.tsx` (~line 43) — PATCH description failure
- `DiscussionTitleEditor.tsx` (~line 39) — PATCH title failure
- `MessageComposer.tsx` (~line 247) — file upload failure
- `MessageComposer.tsx` (~line 259) — message send failure

#### Implementation Tasks

- [ ] Identify existing toast system in use (likely `sonner` or custom)
- [ ] Wire error catch blocks to display toast with actionable message
- [ ] For upload failures: include file name and retry suggestion
- [ ] For send failures: preserve draft text so user can retry

#### Acceptance Criteria

- [ ] All 4 TODO comments resolved with working toast notifications
- [ ] Users see clear error feedback on every failure path

---

### 1.2 Enforce Sheaf Facet Expiry Server-Side

**Priority**: P0 — Security gap  
**Estimated Effort**: 2-4 hours  
**Risk**: Low-Medium (need to verify no existing facets use expiry)

#### Problem Statement

`SheafFacet.expiresAt` exists in the schema but is never checked during message retrieval in `/api/sheaf/messages`. Expired facets are returned to clients, violating sender intent.

#### Implementation Tasks

- [ ] Add `WHERE expiresAt IS NULL OR expiresAt > NOW()` filter to message facet query in `/api/sheaf/messages` GET handler
- [ ] Add BullMQ recurring job to hard-redact expired facet content (set `body = null`, mark as expired)
- [ ] Log facet expirations for audit trail
- [ ] Add test: create facet with past `expiresAt` → verify it's excluded from API response

#### Acceptance Criteria

- [ ] Expired facets are not returned by the messages API
- [ ] Worker job runs on schedule and redacts expired content

---

### 1.3 Remove Debug Logging

**Priority**: P2 — Polish  
**Estimated Effort**: 15 minutes  
**Risk**: None

#### Tasks

- [ ] Remove `console.log` calls from `DriftPane.tsx`
- [ ] Audit other chat/discussion components for stray debug logging

---

### Phase 1 Milestone Checklist

- [ ] All 4 error toast TODOs resolved
- [ ] Sheaf facet expiry enforced at API and worker level
- [ ] No debug `console.log` in production paths

---

## Phase 2: Feature Completeness

**Objective**: Close the table-stakes feature gaps that prevent the discussion system from being taken seriously as a full-featured platform: editing, notifications, search, roles, and reactions.

**Timeline**: Weeks 1-4  
**Dependencies**: Phase 1 (foundation must be clean first)

### 2.1 Forum Comment Editing

**Priority**: P0 — Table stakes for any forum  
**Estimated Effort**: 3-4 days  
**Risk**: Low  
**Dependencies**: None

#### Current State

`ForumComment` has no `PATCH` endpoint. Once posted, content cannot be corrected. The `updatedAt` field exists but is only set on creation.

#### Schema Extension

```prisma
model ForumComment {
  // ... existing fields
  editHistory  Json?    // Array of { body: Json, bodyText: String, editedAt: DateTime }
}
```

#### Implementation Tasks

- [ ] Add `PATCH /api/discussions/[id]/forum/[commentId]` endpoint
- [ ] Authorization: only original author or discussion moderator can edit
- [ ] Before update: push current `{body, bodyText, editedAt: now()}` into `editHistory` array
- [ ] Update `body`, `bodyText`, and `updatedAt`
- [ ] UI: "edited" indicator on ForumCommentItem (timestamp of last edit)
- [ ] UI: "View edit history" popover/modal showing previous versions
- [ ] Rate limit: max 30 edits per comment (prevent abuse)

#### Acceptance Criteria

- [ ] Forum comments can be edited by their author
- [ ] Edit history preserved and viewable
- [ ] Non-authors receive 403

---

### 2.2 Chat Message Editing

**Priority**: P0 — Table stakes for chat  
**Estimated Effort**: 3-4 days  
**Risk**: Medium (Sheaf facet interaction complexity)  
**Dependencies**: None

#### Current State

`Message.edited_at` exists but message content cannot be updated post-creation. No edit endpoint exists.

#### Implementation Tasks

- [ ] Add `PATCH /api/sheaf/messages/[id]` endpoint
- [ ] Authorization: sender only, within configurable time window (e.g., 24 hours)
- [ ] Store previous content in `Message.meta.editHistory` array
- [ ] For Sheaf-faceted messages: update the relevant `SheafFacet.body`, not just `Message.text`
- [ ] Set `Message.edited_at` to current timestamp
- [ ] Broadcast edit event via Supabase so other clients update in real-time
- [ ] UI: "edited" badge on messages, click to view history
- [ ] UI: "Edit" option in message context menu (sender only)

#### Acceptance Criteria

- [ ] Chat messages editable by sender within time window
- [ ] Edit history preserved in meta
- [ ] Real-time edit propagation to other clients
- [ ] Sheaf faceted messages edit correctly

---

### 2.3 Notification Pipeline

**Priority**: P0 — Biggest functional gap for engagement  
**Estimated Effort**: 5-7 days  
**Risk**: Medium (needs integration with existing notification infrastructure)  
**Dependencies**: None (can parallel with 2.1/2.2)

#### Current State

`DiscussionSubscription` model exists. `SubscribeButton` toggles it. `MessageMention` table exists. But there is **no dispatch mechanism** — subscriptions have no effect.

#### Schema Extension

```prisma
model UserNotificationPreference {
  id            String  @id @default(cuid())
  userId        String  @unique
  
  // Discussion notification channels
  discussionInApp   Boolean @default(true)
  discussionPush    Boolean @default(true)
  discussionEmail   Boolean @default(false)
  
  // Frequency for email digests
  emailDigestFreq   String  @default("daily") // "realtime" | "daily" | "weekly" | "never"
  
  // Quiet hours
  quietStart        Int?    // Hour (0-23) in user's TZ
  quietEnd          Int?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### Implementation Tasks

- [ ] Create `UserNotificationPreference` model (or extend existing user preferences)
- [ ] BullMQ worker: `discussion-notification` job triggered on new message/forum comment
  - [ ] Query `DiscussionSubscription` for the discussion
  - [ ] Query `MessageMention` for @ mentions in the new content
  - [ ] Deduplicate (don't notify the sender)
  - [ ] For each subscriber: check notification preferences, dispatch to channels
- [ ] In-app notification: create `Notification` record (check if model exists, or create)
- [ ] Push notification: Firebase Cloud Messaging (already in deps)
- [ ] Email digest: SES (already in deps), batch by `emailDigestFreq`
- [ ] Mention parsing: extract `@username` patterns from message text, resolve against participants
- [ ] Wire mention parsing into the message creation flow in `/api/sheaf/messages` POST
- [ ] UI: notification preferences page/modal

#### Acceptance Criteria

- [ ] Subscribing to a discussion → receive in-app notification on new activity
- [ ] @mentioning a user → they receive a notification
- [ ] Email digest batches correctly according to preference
- [ ] Sender is not notified about their own messages
- [ ] Quiet hours respected

---

### 2.4 Full-Text Search

**Priority**: P1 — Transforms discussions from ephemeral to durable  
**Estimated Effort**: 4-5 days  
**Risk**: Low-Medium (Postgres tsvector is well-understood)  
**Dependencies**: None (can parallel with 2.3)

#### Current State

No search capability exists. Past content is only findable by scrolling.

#### Schema Extension

```sql
-- Add tsvector columns + GIN indexes
ALTER TABLE messages ADD COLUMN search_vector tsvector;
CREATE INDEX idx_messages_search ON messages USING GIN(search_vector);

ALTER TABLE forum_comments ADD COLUMN search_vector tsvector;
CREATE INDEX idx_forum_comments_search ON forum_comments USING GIN(search_vector);

-- Trigger to auto-update search_vector
CREATE FUNCTION messages_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', COALESCE(NEW.text, ''));
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER trig_messages_search
  BEFORE INSERT OR UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION messages_search_trigger();
```

#### Implementation Tasks

- [ ] Add `search_vector` tsvector columns to `messages` and `forum_comments` tables
- [ ] Create GIN indexes + update triggers
- [ ] Backfill existing rows: `UPDATE messages SET search_vector = to_tsvector('english', COALESCE(text, ''))`
- [ ] Create `GET /api/discussions/[id]/search?q=...&mode=chat|forum|all` endpoint
  - [ ] `ts_query` against appropriate table(s) filtered by discussion's conversation_id / discussion_id
  - [ ] Return results with `ts_headline` for highlighted snippets
  - [ ] Paginated (cursor or offset)
- [ ] Create `GET /api/discussions/search?q=...` global endpoint (scoped to user's accessible discussions)
- [ ] UI: search bar in `DiscussionView` header
- [ ] UI: search results panel with mode tabs (Chat | Forum | All)
- [ ] UI: click result → jump to message/comment in context

#### Acceptance Criteria

- [ ] Searching by keyword returns matching chat messages and forum posts
- [ ] Results show highlighted matching text
- [ ] Results are scoped to discussions the user has access to
- [ ] Clicking a result navigates to that message in context

---

### 2.5 Participant Roles & Basic Moderation

**Priority**: P1 — Needed as discussions scale  
**Estimated Effort**: 3-4 days  
**Risk**: Low  
**Dependencies**: None

#### Schema Extension

```prisma
enum DiscussionRole {
  owner
  moderator
  contributor
  observer
}

model DiscussionParticipant {
  // ... existing fields
  role  DiscussionRole @default(contributor)
}
```

#### Implementation Tasks

- [ ] Add `role` field to `DiscussionParticipant`
- [ ] Migrate existing participants: creator → `owner`, others → `contributor`
- [ ] Authorization checks in API routes:
  - [ ] `observer`: read-only (no POST to forum or message send)
  - [ ] `contributor`: can post/edit own content
  - [ ] `moderator`: can edit discussion metadata, pin messages, close Drifts, remove content
  - [ ] `owner`: all moderator permissions + manage participant roles + delete discussion
- [ ] UI: role badges next to participant names in presence list
- [ ] UI: role management in discussion settings (owner/moderator only)
- [ ] UI: moderator actions in message/comment context menus

#### Acceptance Criteria

- [ ] Observers can read but not post
- [ ] Moderators can pin/remove/close without being the owner
- [ ] Role changes take effect immediately

---

### 2.6 Enable Message Reactions

**Priority**: P2 — Low effort, high engagement  
**Estimated Effort**: 1-2 days  
**Risk**: Low (infrastructure already built)  
**Dependencies**: None

#### Current State

`MessageReaction` table exists. `useChatStore` has `reactionsByMessageId` and `applyReactionDelta`. Feature is disabled via `ENABLE_REACTIONS = false`.

#### Implementation Tasks

- [ ] Set `ENABLE_REACTIONS = true`
- [ ] Verify reaction picker UI renders in message hover/context menu
- [ ] Verify reaction pills display below messages
- [ ] Add reaction support to `ForumComment` (new `ForumCommentReaction` model or reuse `MessageReaction` with polymorphic target)
- [ ] Real-time reaction sync via Supabase broadcast

#### Acceptance Criteria

- [ ] Users can add/remove emoji reactions on chat messages
- [ ] Reaction counts display in real-time
- [ ] Forum comment reactions work (if extended)

---

### 2.7 Drift Lifecycle Management UI

**Priority**: P2 — Organizational hygiene  
**Estimated Effort**: 1-2 days  
**Risk**: Low  
**Dependencies**: None

#### Current State

`Drift.is_closed` and `is_archived` exist in the model. No UI to control them. `DriftMember` management has no UI.

#### Implementation Tasks

- [ ] Add close / archive / reopen buttons to `DriftPane` header
- [ ] `PATCH /api/drifts/[id]` endpoint (or extend existing) for status changes
- [ ] Visual distinction: closed Drifts greyed out and collapsed by default in list
- [ ] "Closed Drifts" collapsible section in Drift list
- [ ] DriftMember add/remove UI (simple participant selector)

#### Acceptance Criteria

- [ ] Drifts can be closed/archived from UI
- [ ] Closed Drifts visually distinct
- [ ] Drift members manageable

---

### Phase 2 Milestone Checklist

- [ ] Forum comments editable by authors with history preserved
- [ ] Chat messages editable by sender within time window
- [ ] Notification pipeline dispatching to in-app + push + email
- [ ] Full-text search functional across Chat and Forum modes
- [ ] Participant roles enforced (owner/moderator/contributor/observer)
- [ ] Message reactions enabled
- [ ] Drift lifecycle controls in UI

---

## Phase 3: Real-Time & Sync Robustness

**Objective**: Make all real-time features reliable across unstable connections and ensure both Chat and Forum modes feel consistently live.

**Timeline**: Weeks 5-6  
**Dependencies**: Phase 2 (notifications should be in place so missed messages can fall back to notifications)

### 3.1 Drift Real-Time Sync

**Priority**: P0 — Existing feature doesn't work as designed  
**Estimated Effort**: 3-4 hours  
**Risk**: Low  
**Dependencies**: None

#### Current State

`DriftPane` fetches messages via HTTP on mount but does not subscribe to Supabase `postgres_changes`. Drift conversations are not real-time — users must close/reopen the pane to see new messages.

#### Implementation Tasks

- [ ] Subscribe to `postgres_changes` on `messages` table filtered by `drift_id=eq.${driftId}`
- [ ] On `INSERT`: call `appendDriftMessage(driftId, normalizeMessage(payload.new))` (store action already exists)
- [ ] On `UPDATE`: handle edits (when chat editing is implemented in 2.2)
- [ ] Typing indicator for Drifts: broadcast on `drift-${driftId}` channel
- [ ] Clean up subscription on Drift close/unmount

#### Acceptance Criteria

- [ ] New messages in a Drift appear in real-time without manual refresh
- [ ] Typing indicators work within Drifts

---

### 3.2 Supabase Channel Reconnection & Backoff

**Priority**: P1 — Reliability on unstable connections  
**Estimated Effort**: 2-3 days  
**Risk**: Medium (need to test edge cases around reconnection timing)  
**Dependencies**: None

#### Implementation Tasks

- [ ] Add `onError` / `onClose` handlers to Supabase channel subscriptions in `useConversationRealtime.ts`
- [ ] Implement exponential backoff: 1s → 2s → 4s → 8s → 16s → cap at 30s
- [ ] On reconnection: fetch messages since `lastSeenMessageId` to fill the gap
- [ ] UI: "Reconnecting..." banner in `ChatRoom` header when connection is lost
- [ ] UI: "Connected" confirmation when reconnection succeeds
- [ ] Reset backoff timer on successful connection

#### Acceptance Criteria

- [ ] Dropping network connection shows reconnection banner
- [ ] Connection is restored automatically with backoff
- [ ] Missed messages are fetched on reconnect (no gaps)

---

### 3.3 Forum Real-Time Updates

**Priority**: P1 — Mode consistency  
**Estimated Effort**: 1-2 days  
**Risk**: Low  
**Dependencies**: None

#### Current State

Forum mode uses SWR `mutate()` for updates. New comments from other users don't appear until manual refresh or tab switch.

#### Implementation Tasks

- [ ] Subscribe to `postgres_changes` on `forum_comments` table filtered by `discussion_id`
- [ ] On `INSERT`: append new comment to the threaded tree (handle `parentId` for correct placement)
- [ ] On `UPDATE`: reflect edits in-place (when 2.1 is implemented)
- [ ] Show "N new comments" toast/banner when comments arrive while user is scrolled up
- [ ] Click banner → scroll to newest

#### Acceptance Criteria

- [ ] New forum comments appear in real-time
- [ ] Comments correctly placed in thread hierarchy
- [ ] "New comments" indicator shown when not scrolled to bottom

---

### Phase 3 Milestone Checklist

- [ ] Drift messages update in real-time
- [ ] Chat survives connection drops with automatic reconnection
- [ ] Forum comments appear in real-time from other users

---

## Phase 4: Structured Knowledge Harvesting

**Objective**: Add tools that help users extract, organize, and connect knowledge from discussions — making discussions a source of durable institutional memory rather than ephemeral conversation.

**Timeline**: Weeks 7-9  
**Dependencies**: Phase 2 (roles needed for pin permissions; search needed for cross-linking suggestions)

### 4.1 Pinned Messages & Key Takeaways

**Priority**: P0 — Core knowledge curation  
**Estimated Effort**: 3-4 days  
**Risk**: Low  
**Dependencies**: 2.5 (roles — moderators control pins)

#### Schema Extension

```prisma
model MessagePin {
  id              String   @id @default(cuid())
  messageId       BigInt
  conversationId  BigInt
  pinnedById      String
  groupLabel      String?  // Optional "Takeaway" group name
  position        Float    @default(0)
  createdAt       DateTime @default(now())

  message    Message @relation(fields: [messageId], references: [id], onDelete: Cascade)

  @@unique([messageId, conversationId]) // One pin per message per conversation
  @@index([conversationId, position])
}
```

#### Implementation Tasks

- [ ] Create `MessagePin` model
- [ ] `POST /api/conversations/[id]/pins` — pin a message (moderator+ only)
- [ ] `DELETE /api/conversations/[id]/pins/[pinId]` — unpin
- [ ] `PATCH /api/conversations/[id]/pins/[pinId]` — set `groupLabel` or reorder
- [ ] `GET /api/conversations/[id]/pins` — list pins (ordered)
- [ ] UI: "Pin" action in message context menu
- [ ] UI: collapsible "Pinned" section at top of `ChatRoom`
- [ ] UI: grouped by `groupLabel` (unnamed pins in "General" group)
- [ ] When upgrading Discussion → Deliberation: carry pins as initial claim candidates

#### Acceptance Criteria

- [ ] Moderators can pin/unpin messages
- [ ] Pinned section visible at top of chat
- [ ] Pins optionally grouped into named takeaway sections

---

### 4.2 Discussion Labels & Tags

**Priority**: P1 — Discoverability  
**Estimated Effort**: 2 days  
**Risk**: Low  
**Dependencies**: None

#### Schema Extension

```prisma
model Discussion {
  // ... existing fields
  tags  String[]  @default([])
}
```

#### Implementation Tasks

- [ ] Add `tags` field to `Discussion` model
- [ ] `PATCH /api/discussions/[id]` — accept `tags` array in update payload
- [ ] Tag input UI in discussion settings / creation form
- [ ] Filter by tag on `/api/discussions/list` and `/api/discussions/explore`
- [ ] UI: color-coded tag pills on `DiscussionCard` and `DiscussionView` header
- [ ] Autocomplete from existing tags across platform (simple `DISTINCT` query)

#### Acceptance Criteria

- [ ] Discussions can be tagged during creation or later
- [ ] Discussion list/explore filterable by tag
- [ ] Tag autocomplete prevents fragmentation

---

### 4.3 Discussion Templates

**Priority**: P1 — Lower barrier to structured discourse  
**Estimated Effort**: 3-4 days  
**Risk**: Low-Medium  
**Dependencies**: 2.1 (forum editing — templates create pre-filled ForumComments)

#### Schema Extension

```prisma
model DiscussionTemplate {
  id          String   @id @default(cuid())
  name        String
  description String?
  createdById String?  // null = system template
  structure   Json     // Array of { title, bodyPlaceholder, order }
  isPublic    Boolean  @default(true)
  createdAt   DateTime @default(now())
}

model Discussion {
  // ... existing
  templateId  String?
  template    DiscussionTemplate? @relation(fields: [templateId], references: [id])
}
```

#### Implementation Tasks

- [ ] Create `DiscussionTemplate` model
- [ ] Seed system templates: "Open Discussion", "Decision", "Review", "Journal Club", "Proposal"
- [ ] Template picker in `NewDiscussionButton` creation flow
- [ ] On discussion creation with template: auto-create `ForumComment` records as section headers
- [ ] Template preview in picker (show structure outline)
- [ ] Allow users to create custom templates from existing discussions

#### Template Definitions

```typescript
const SYSTEM_TEMPLATES = [
  {
    name: "Open Discussion",
    description: "Free-form discussion with Chat and Forum modes",
    structure: [] // No pre-created sections
  },
  {
    name: "Decision",
    description: "Structured decision-making with options, analysis, and vote",
    structure: [
      { title: "Options", bodyPlaceholder: "List the options under consideration..." },
      { title: "Pros & Cons", bodyPlaceholder: "Analyze tradeoffs for each option..." },
      { title: "Decision & Rationale", bodyPlaceholder: "Record the final decision and reasoning..." },
    ]
  },
  {
    name: "Review",
    description: "Structured feedback on a document, proposal, or artifact",
    structure: [
      { title: "Strengths", bodyPlaceholder: "What works well..." },
      { title: "Weaknesses", bodyPlaceholder: "Areas for improvement..." },
      { title: "Questions", bodyPlaceholder: "Open questions for the author..." },
      { title: "Suggestions", bodyPlaceholder: "Specific recommendations..." },
    ]
  },
  {
    name: "Journal Club",
    description: "Structured discussion of an academic paper",
    structure: [
      { title: "Paper Summary", bodyPlaceholder: "Brief summary of the paper's contribution..." },
      { title: "Key Findings", bodyPlaceholder: "Main results and claims..." },
      { title: "Methodology Critique", bodyPlaceholder: "Strengths and weaknesses of the approach..." },
      { title: "Discussion", bodyPlaceholder: "Implications, connections to other work..." },
    ]
  },
  {
    name: "Proposal",
    description: "Propose a change or initiative for group feedback",
    structure: [
      { title: "Problem Statement", bodyPlaceholder: "What problem does this address..." },
      { title: "Proposed Solution", bodyPlaceholder: "Describe the proposed approach..." },
      { title: "Feedback", bodyPlaceholder: "Community feedback and concerns..." },
      { title: "Revised Proposal", bodyPlaceholder: "Updated proposal incorporating feedback..." },
    ]
  },
];
```

#### Acceptance Criteria

- [ ] 5 system templates available in discussion creation flow
- [ ] Selecting a template creates pre-structured forum sections
- [ ] Custom template creation from existing discussions

---

### 4.4 Cross-Discussion Linking

**Priority**: P2 — Institutional memory  
**Estimated Effort**: 2-3 days  
**Risk**: Low  
**Dependencies**: 2.4 (search — for suggesting related discussions)

#### Schema Extension

```prisma
enum DiscussionLinkType {
  related
  continuation
  supersedes
  contradiction
}

model DiscussionLink {
  id                   String             @id @default(cuid())
  sourceDiscussionId   String
  targetDiscussionId   String
  linkType             DiscussionLinkType @default(related)
  note                 String?
  createdById          String
  createdAt            DateTime           @default(now())

  source  Discussion @relation("DiscussionLinksFrom", fields: [sourceDiscussionId], references: [id], onDelete: Cascade)
  target  Discussion @relation("DiscussionLinksTo", fields: [targetDiscussionId], references: [id], onDelete: Cascade)

  @@unique([sourceDiscussionId, targetDiscussionId])
  @@index([targetDiscussionId])
}
```

#### Implementation Tasks

- [ ] Create `DiscussionLink` model
- [ ] `POST /api/discussions/[id]/links` — create a link to another discussion
- [ ] `GET /api/discussions/[id]/links` — list linked discussions (both directions)
- [ ] `DELETE /api/discussions/[id]/links/[linkId]` — remove link
- [ ] UI: "Related Discussions" sidebar panel in `DiscussionView`
- [ ] UI: "Link Discussion" action with search-based discussion picker
- [ ] On creation: suggest related discussions by title keyword overlap (simple SQL `ILIKE` or use tsvector from 2.4)

#### Acceptance Criteria

- [ ] Discussions can be linked with typed relationships
- [ ] Related Discussions sidebar visible in DiscussionView
- [ ] Links are bidirectional (appear on both sides)

---

### 4.5 Discussion Activity Timeline

**Priority**: P2 — Catch-up tool for late joiners  
**Estimated Effort**: 2-3 days  
**Risk**: Low  
**Dependencies**: 4.1 (pins appear as timeline events)

#### Schema Extension

```prisma
model DiscussionEvent {
  id            String   @id @default(cuid())
  discussionId  String
  eventType     String   // "created" | "mode_switch" | "drift_created" | "deliberation_upgrade" | "pin" | "participant_joined" | "milestone"
  actorId       String?
  metadata      Json?    // Event-specific data
  createdAt     DateTime @default(now())

  discussion Discussion @relation(fields: [discussionId], references: [id], onDelete: Cascade)

  @@index([discussionId, createdAt])
}
```

#### Implementation Tasks

- [ ] Create `DiscussionEvent` model
- [ ] Emit events from existing actions:
  - [ ] Discussion creation
  - [ ] Deliberation upgrade
  - [ ] Drift creation / closure
  - [ ] Pin events
  - [ ] Participant join / leave
  - [ ] Message milestones (10th, 50th, 100th message)
- [ ] `GET /api/discussions/[id]/timeline` — paginated event list
- [ ] UI: "Timeline" tab or sidebar in `DiscussionView`
- [ ] Compact card-style rendering of each event with timestamp and actor

#### Acceptance Criteria

- [ ] Timeline shows key discussion events in chronological order
- [ ] Late joiners can scan timeline to understand discussion trajectory
- [ ] Events emitted automatically from existing actions

---

### Phase 4 Milestone Checklist

- [ ] Moderators can pin messages with optional grouping
- [ ] Discussions taggable and filterable by tags
- [ ] Discussion templates available for structured creation
- [ ] Discussions can be cross-linked with typed relationships
- [ ] Activity timeline available for discussion catch-up

---

## Phase 5: AI-Enhanced Features (Deferred)

> **Status**: Deferred — not scheduled for current development cycle. Listed here to inform architecture decisions in Phases 1-4.

**Objective**: Use AI to reduce friction in discussion participation, knowledge extraction, and discovery.

**Dependencies**: Phase 2 (search indexing provides the text corpus), Phase 4 (pins/templates provide the structure)

### 5.1 Thread Summarization

**Priority**: P3 — Deferred  
**Estimated Effort**: 3-5 days  
**Dependencies**: OpenAI integration (exists), usable message text corpus (Phase 2.4)

- AI-generated rolling summary of recent conversation
- "Catch-up card" for users returning after absence
- Summary updated incrementally (not recomputed from scratch)
- Respects Sheaf ACL — only summarizes facets visible to the requesting user

---

### 5.2 Smart Deliberation Seeding

**Priority**: P3 — Deferred  
**Estimated Effort**: 3-4 days  
**Dependencies**: Deliberation upgrade flow, message corpus

- When upgrading Discussion → Deliberation, extract candidate claims from chat/forum history
- Use NLP to identify positions, arguments, and evidence references
- Pre-populate deliberation workspace with extracted candidates
- Human review step before claims are committed

---

### 5.3 Semantic Related Discussions

**Priority**: P3 — Deferred  
**Estimated Effort**: 3-5 days  
**Dependencies**: Pinecone (exists in deps), discussion text corpus

- Generate embeddings for discussions (from title + description + top messages)
- Store in Pinecone vector index
- Power "Related Discussions" recommendations that go beyond keyword matching
- Complement keyword-based cross-linking from Phase 4.4

---

### 5.4 Auto-Tagging

**Priority**: P3 — Deferred  
**Estimated Effort**: 2-3 days  
**Dependencies**: Tags (Phase 4.2), message corpus

- Automatically suggest tags based on discussion content analysis
- Use topic extraction (LDA or similar) or LLM-based classification
- Present as suggestions, not automatic application (human-in-the-loop)

---

## Cross-Cutting Concerns

### A) Loading Skeletons for Forum

**Priority**: P1 — Ship with Phase 2  
**Effort**: Half day

- [ ] Add shimmer skeleton UI to `ForumPane` during data fetch
- [ ] Match skeleton shape to actual ForumCommentItem layout
- [ ] Apply same pattern to `DriftPane` loading state

### B) Virtual Scrolling for Long Conversations

**Priority**: P2 — Ship with Phase 3  
**Effort**: 1-2 days

- [ ] Implement virtualized scrolling in `ChatRoom` using `@tanstack/virtual` or `react-window`
- [ ] Maintain scroll-to-bottom behavior for new messages
- [ ] Maintain jump-to-message behavior for search results and quote links

### C) Quote Source Validation

**Priority**: P1 — Ship with Phase 2  
**Effort**: Half day

- [ ] Server-side validation in `/api/sheaf/messages` POST: verify quoted message exists
- [ ] Verify quoting user has Sheaf ACL visibility to the quoted facet
- [ ] Return 400 if quote source is invalid or inaccessible

### D) Forum Comment Idempotency

**Priority**: P2 — Ship with Phase 2  
**Effort**: 2 hours

- [ ] Add `clientId String? @db.VarChar(64)` to `ForumComment`
- [ ] Add `@@unique([discussionId, clientId])` constraint
- [ ] Client generates `clientId` before POST, server upserts on conflict

---

## Success Metrics

| Metric | Baseline (Current) | Target (Post-Phase 4) |
|--------|--------------------|-----------------------|
| Error toasts on failure paths | 0/4 wired | 4/4 wired |
| Expired facets returned by API | Not filtered | 0 returned |
| Forum comments with edits | N/A (no editing) | Available |
| Discussions with active subscribers | Unknown | Measurable via notification dispatch |
| Search queries per day | 0 (no search) | Trackable |
| Discussions with tags | 0% | 50%+ of new discussions |
| Discussions using templates | 0% | 20%+ of new discussions |
| Mean time to first forum reply | Unmeasured | Measurable via event timeline |
| Drift real-time message latency | N/A (HTTP only) | <500ms (WebSocket) |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| tsvector backfill slow on large messages table | Medium | Low | Run as background migration, batch 1000 rows at a time |
| Notification spam (high-activity discussions) | Medium | Medium | Implement digest batching + quiet hours from day one |
| Role migration breaks existing participant access | Low | High | Default all existing participants to `contributor`; owner set from `createdById` |
| Forum real-time subscription too chatty | Low | Medium | Debounce UI updates; batch rapid successive inserts |
| Sheaf facet expiry worker redacts content users want | Low | High | Only redact body content; keep metadata for audit; log all redactions |

---

## Quarterly Timeline

```
Day 1-2:    Phase 1 — Foundation Fixes (toasts, expiry, debug cleanup)
            ─── Phase 1 Complete ───
Week 1-2:   2.1 Forum Comment Editing + 2.2 Chat Message Editing
Week 2-3:   2.3 Notification Pipeline (parallel with editing)
Week 3-4:   2.4 Full-Text Search + 2.5 Participant Roles
Week 4:     2.6 Reactions + 2.7 Drift Lifecycle + Cross-Cutting A/C/D
            ─── Phase 2 Complete ───
Week 5:     3.1 Drift Real-Time Sync + 3.3 Forum Real-Time Updates
Week 6:     3.2 Reconnection/Backoff + Cross-Cutting B
            ─── Phase 3 Complete ───
Week 7-8:   4.1 Pinned Messages + 4.2 Tags + 4.3 Templates
Week 9:     4.4 Cross-Discussion Linking + 4.5 Activity Timeline
            ─── Phase 4 Complete ───
            Phase 5 — Deferred to future cycle
```
