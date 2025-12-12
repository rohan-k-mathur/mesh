# Discussions & Chat System Architecture

## Executive Summary

This document provides a comprehensive architectural overview of the Mesh Discussions and Chat system. The architecture implements a **dual-mode communication model** where users can seamlessly switch between real-time chat and threaded forum discussions within a unified Discussion container.

Key design goals:
- **Dual-Mode Interaction**: Chat for rapid back-and-forth, Forum for structured threaded discussions
- **Progressive Deliberation**: Discussions can upgrade to formal Deliberations when complexity warrants
- **Sheaf-Aware Messaging**: Messages support multi-audience facets with access control (Sheaf ACL)
- **Real-Time Presence**: Supabase-powered presence and typing indicators
- **Cross-Mode Bridging**: Content can flow between Chat and Forum (quote to chat, promote to forum)

---

## Table of Contents

1. [Global System Design](#1-global-system-design)
   - [1.1 Core Concepts](#11-core-concepts)
   - [1.2 Dual-Mode Architecture](#12-dual-mode-architecture)
   - [1.3 Data Flow Overview](#13-data-flow-overview)
   - [1.4 Progressive Deliberation](#14-progressive-deliberation)
2. [Data Models (Prisma)](#2-data-models-prisma)
   - [2.1 Discussion Model](#21-discussion-model)
   - [2.2 Conversation Model](#22-conversation-model)
   - [2.3 Message Model](#23-message-model)
   - [2.4 ForumComment Model](#24-forumcomment-model)
   - [2.5 Drift Model (Threads/Side Conversations)](#25-drift-model-threadsside-conversations)
   - [2.6 Poll Models](#26-poll-models)
   - [2.7 Entity Relationship Diagram](#27-entity-relationship-diagram)
3. [Component Architecture](#3-component-architecture)
   - [3.1 Discussion Components](#31-discussion-components)
   - [3.2 Chat Components](#32-chat-components)
   - [3.3 Sheaf Components](#33-sheaf-components)
   - [3.4 Component Hierarchy Diagram](#34-component-hierarchy-diagram)
4. [State Management](#4-state-management)
   - [4.1 useChatStore (Zustand)](#41-usechatstore-zustand)
   - [4.2 State Shape](#42-state-shape)
   - [4.3 Key Actions](#43-key-actions)
5. [API Routes](#5-api-routes)
   - [5.1 Discussion APIs](#51-discussion-apis)
   - [5.2 Sheaf/Message APIs](#52-sheafmessage-apis)
   - [5.3 Conversation APIs](#53-conversation-apis)
   - [5.4 Bridge APIs](#54-bridge-apis)
6. [Sheaf ACL Package](#6-sheaf-acl-package)
   - [6.1 Overview](#61-overview)
   - [6.2 Audience Selectors](#62-audience-selectors)
   - [6.3 Share Policies](#63-share-policies)
   - [6.4 Visibility Logic](#64-visibility-logic)
7. [Real-Time System](#7-real-time-system)
   - [7.1 Supabase Channels](#71-supabase-channels)
   - [7.2 Presence Tracking](#72-presence-tracking)
   - [7.3 Typing Indicators](#73-typing-indicators)
   - [7.4 Message Broadcasting](#74-message-broadcasting)
8. [Key User Flows](#8-key-user-flows)
   - [8.1 Creating a Discussion](#81-creating-a-discussion)
   - [8.2 Sending a Chat Message](#82-sending-a-chat-message)
   - [8.3 Creating a Forum Post](#83-creating-a-forum-post)
   - [8.4 Promoting Chat to Forum](#84-promoting-chat-to-forum)
   - [8.5 Upgrading to Deliberation](#85-upgrading-to-deliberation)
9. [File Reference](#9-file-reference)

---

## 1. Global System Design

### 1.1 Core Concepts

The Discussion system is built around four key entities:

| Entity | Description | Storage |
|--------|-------------|---------|
| **Discussion** | Container for a topic-focused conversation space | `Discussion` table |
| **Conversation** | Low-level chat thread (1:1 with Discussion) | `Conversation` table |
| **Message** | Real-time chat message in a Conversation | `Message` table |
| **ForumComment** | Threaded forum post in a Discussion | `ForumComment` table |

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DISCUSSION CONTAINER                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌───────────────────────────────┐   ┌───────────────────────────────┐     │
│   │         CHAT MODE             │   │        FORUM MODE             │     │
│   │                               │   │                               │     │
│   │   ┌─────────────────────┐     │   │   ┌─────────────────────┐     │     │
│   │   │     Conversation    │     │   │   │   ForumComment[]    │     │     │
│   │   │     ───────────     │     │   │   │   ──────────────    │     │     │
│   │   │   • Messages[]      │     │   │   │   • Threaded tree   │     │     │
│   │   │   • Real-time       │     │   │   │   • Votes & scoring │     │     │
│   │   │   • Typing/presence │     │   │   │   • Parent/child    │     │     │
│   │   │   • Sheaf facets    │     │   │   │   • Rich body JSON  │     │     │
│   │   └─────────────────────┘     │   │   └─────────────────────┘     │     │
│   │                               │   │                               │     │
│   │   ┌─────────────────────┐     │   │                               │     │
│   │   │      Drifts         │     │   │                               │     │
│   │   │   (side threads)    │     │   │                               │     │
│   │   └─────────────────────┘     │   │                               │     │
│   │                               │   │                               │     │
│   └───────────────────────────────┘   └───────────────────────────────┘     │
│                                                                              │
│                    ◄─────── Bridge APIs ───────►                             │
│                    • Quote to Chat                                           │
│                    • Promote to Forum                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Dual-Mode Architecture

The system provides two interaction modes within a single Discussion:

| Mode | Purpose | Data Store | UI Component |
|------|---------|------------|--------------|
| **Chat** | Real-time messaging, quick exchanges | `Message` via `Conversation` | `ChatRoom` |
| **Forum** | Threaded discussion, structured posts | `ForumComment` | `ForumPane` |

**Key Design Decisions:**
- **Separate data stores**: Chat messages live in `Message`, forum posts in `ForumComment`
- **Unified container**: Both modes share the same `Discussion` entity
- **Mode switching**: Users toggle via tabs in `DiscussionView`
- **Cross-mode references**: Chat messages can be promoted to forum; forum posts can quote chat

### 1.3 Data Flow Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA FLOW OVERVIEW                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────┐         ┌─────────────────────────────────┐               │
│   │   Browser   │         │         Next.js Server          │               │
│   │   Client    │         │                                 │               │
│   └──────┬──────┘         └────────────────┬────────────────┘               │
│          │                                 │                                 │
│          │    1. Page Load (SSR)           │                                 │
│          │ ◄───────────────────────────────┤  • Prisma queries               │
│          │    (initialMessages, discussion) │  • User auth check              │
│          │                                 │                                 │
│          │    2. Zustand Hydration         │                                 │
│          ├─────────────────────────────────►  useChatStore.setMessages()    │
│          │                                 │                                 │
│          │    3. Real-time Subscribe       │                                 │
│          │ ◄───────────────────────────────┤                                 │
│          │    (Supabase channel)           │                                 │
│          │                                 │                                 │
│   ┌──────▼──────┐                          │                                 │
│   │  Supabase   │                          │                                 │
│   │  Realtime   │◄─────────────────────────┤  4. Message broadcast           │
│   └──────┬──────┘                          │                                 │
│          │                                 │                                 │
│          │    5. useChatStore update       │                                 │
│          ├─────────────────────────────────►                                 │
│          │    (appendMessage)              │                                 │
│          │                                 │                                 │
│          │    6. API Calls                 │                                 │
│          ├─────────────────────────────────►  /api/sheaf/messages            │
│          │                                 │  /api/discussions/[id]/forum    │
│          │                                 │                                 │
└──────────┴─────────────────────────────────┴─────────────────────────────────┘
```

### 1.4 Progressive Deliberation

Discussions can be upgraded to formal Deliberations when structured argumentation is needed:

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│  Discussion  │────────►│  Deliberation │────────►│   Agora      │
│  (informal)  │ upgrade │  (formal)     │ access  │  (full UI)   │
└──────────────┘         └──────────────┘         └──────────────┘
       │                         │
       │                         ├── Claims
       ├── Chat messages         ├── Arguments
       ├── Forum posts           ├── Dialogue moves
       └── Participants          └── Schemes + CQs
```

**Trigger**: `DeliberateButton` component calls `/api/deliberations/ensure`

---

## 2. Data Models (Prisma)

### 2.1 Discussion Model

```prisma
model Discussion {
  id          String  @id @default(cuid())
  slug        String? @unique
  title       String
  description String?
  createdById String
  visibility  String  @default("public") // "public" | "private" | "unlisted"

  // Link to chat conversation (created on demand)
  conversationId BigInt? @unique
  conversation   Conversation? @relation(...)

  // Polymorphic attachment to any object
  attachedToType String? // "article" | "comment" | "stack" | "claim" | "post"
  attachedToId   String?

  // Relations
  upgradedToDeliberation Deliberation?
  messages               DiscussionMessage[]
  participants           DiscussionParticipant[]
  subscriptions          DiscussionSubscription[]
  forumComments          ForumComment[]
  deliberations          DiscussionDeliberation[]

  // Counters
  replyCount   Int      @default(0)
  viewCount    Int      @default(0)
  lastActiveAt DateTime @default(now())

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Key Points:**
- `conversationId` links to the underlying chat thread (1:1, created on demand)
- `attachedToType` + `attachedToId` enable polymorphic attachment (e.g., discussion on an article)
- `visibility` controls access: `public` | `private` | `unlisted`

### 2.2 Conversation Model

```prisma
model Conversation {
  id         BigInt   @id @default(autoincrement())
  user1_id   BigInt?  // For DMs
  user2_id   BigInt?  // For DMs
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
  title      String?
  is_group   Boolean  @default(false)

  // Relations
  user1        User?  @relation("ConversationUser1", ...)
  user2        User?  @relation("ConversationUser2", ...)
  messages     Message[]
  participants ConversationParticipant[]
  drifts       Drift[]
  Discussion   Discussion?

  @@unique([user1_id, user2_id])
  @@map("conversations")
}
```

**Key Points:**
- `Conversation` is the low-level chat container
- Can be a DM (`user1_id`, `user2_id`) or group (`is_group = true`)
- Links to `Discussion` via the inverse of `Discussion.conversationId`

### 2.3 Message Model

```prisma
model Message {
  id              BigInt   @id @default(autoincrement())
  conversation_id BigInt
  sender_id       BigInt
  text            String?  // Plain text (deprecated in favor of facets)
  created_at      DateTime @default(now())

  // Moderation / lifecycle
  is_redacted Boolean   @default(false)
  edited_at   DateTime?
  deleted_at  DateTime?
  client_id   String?   @db.VarChar(64) // Idempotency key

  // Drifts & Threads
  drift_id      BigInt?   // FK to Drift (side conversation)
  reply_to      BigInt?   // Reply threading
  reply_count   Int       @default(0)
  last_reply_at DateTime?

  // Misc
  meta Json?

  // Relations
  conversation Conversation        @relation(...)
  sender       User                @relation(...)
  attachments  MessageAttachment[]
  reactions    MessageReaction[]
  SheafFacet   SheafFacet[]        // Sheaf ACL facets
  drift        Drift?              @relation("DriftMessages", ...)
  stars        MessageStar[]
  bookmarks    Bookmark[]

  @@unique([conversation_id, client_id])
  @@map("messages")
}
```

**Key Points:**
- `SheafFacet` relation enables multi-audience messaging (see Section 6)
- `drift_id` allows messages to belong to side conversations (Drifts)
- `client_id` provides idempotency for message creation

### 2.4 ForumComment Model

```prisma
model ForumComment {
  id           BigInt     @id @default(autoincrement())
  discussionId String
  discussion   Discussion @relation(...)
  parentId     BigInt?    // Threading
  authorId     String

  // Content
  body     Json    // TipTap JSON
  bodyText String? // Plain text for search/snippets

  // Cross-post source (chat → forum)
  sourceMessageId      Int? // Original chat message ID
  sourceConversationId Int?

  score     Int      @default(0)
  isDeleted Boolean  @default(false)
  isRemoved Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([discussionId, sourceMessageId]) // Prevent duplicate promotes
  @@index([discussionId, parentId])
}
```

**Key Points:**
- `parentId` enables threaded replies
- `body` stores TipTap JSON for rich formatting
- `sourceMessageId` tracks if this was promoted from chat (enables idempotency)

### 2.5 Drift Model (Threads/Side Conversations)

```prisma
enum DriftKind {
  DRIFT    // Ad-hoc side conversation
  THREAD   // Reply thread on a specific message
  PROPOSAL // Proposal-focused discussion
}

model Drift {
  id                BigInt    @id @default(autoincrement())
  conversation_id   BigInt
  created_by        BigInt
  title             String
  created_at        DateTime  @default(now())
  updated_at        DateTime  @updatedAt
  is_closed         Boolean   @default(false)
  is_archived       Boolean   @default(false)
  message_count     Int       @default(0)
  last_message_at   DateTime?
  anchor_message_id BigInt?   @unique  // For DRIFT kind
  kind              DriftKind @default(DRIFT)
  root_message_id   BigInt?   // For THREAD kind

  // Relations
  conversation   Conversation @relation("ConversationDrifts", ...)
  anchor_message Message?     @relation("DriftAnchor", ...)
  messages       Message[]    @relation("DriftMessages")
  members        DriftMember[]

  @@unique([conversation_id, root_message_id, kind])
  @@map("drifts")
}
```

**Key Points:**
- Drifts are side conversations within a chat
- `DRIFT`: Ad-hoc, anchored to a message
- `THREAD`: Reply thread on a specific message
- `PROPOSAL`: Proposal-focused discussion

### 2.6 Poll Models

```prisma
enum PollKind {
  OPTIONS  // Multiple choice
  TEMP     // Temperature check (1-5 scale)
}

model Poll {
  id              BigInt    @id @default(autoincrement())
  conversation_id BigInt
  message_id      BigInt
  created_by_id   BigInt
  kind            PollKind
  options         String[]  @default([])
  max_options     Int       @default(1)
  closes_at       DateTime?
  anonymous       Boolean   @default(false)
  created_at      DateTime  @default(now())

  votes PollVote[]
  @@map("polls")
}

model PollVote {
  id         BigInt   @id @default(autoincrement())
  poll_id    BigInt
  user_id    BigInt
  option_idx Int?     // For OPTIONS polls
  value      Int?     // For TEMP polls (1-5)
  created_at DateTime @default(now())

  poll Poll @relation(...)
  @@unique([poll_id, user_id])
  @@map("poll_votes")
}
```

### 2.7 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ENTITY RELATIONSHIP DIAGRAM                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────┐     1:1      ┌──────────────┐                            │
│   │  Discussion  │─────────────►│ Conversation │                            │
│   │              │              │              │                            │
│   │  • id        │              │  • id        │                            │
│   │  • title     │              │  • is_group  │                            │
│   │  • visibility│              │  • title     │                            │
│   └──────┬───────┘              └──────┬───────┘                            │
│          │                             │                                     │
│          │ 1:N                         │ 1:N                                 │
│          ▼                             ▼                                     │
│   ┌──────────────┐              ┌──────────────┐                            │
│   │ ForumComment │              │   Message    │                            │
│   │              │              │              │                            │
│   │  • body      │◄─promote────│  • text      │                            │
│   │  • parentId  │              │  • sender_id │                            │
│   │  • score     │              │  • drift_id  │                            │
│   └──────────────┘              └──────┬───────┘                            │
│                                        │                                     │
│                                        │ 1:N                                 │
│                                        ▼                                     │
│                                 ┌──────────────┐      ┌──────────────┐      │
│                                 │  SheafFacet  │      │    Drift     │      │
│                                 │              │      │              │      │
│                                 │  • audience  │      │  • kind      │      │
│                                 │  • body      │      │  • title     │      │
│                                 │  • policy    │      │  • is_closed │      │
│                                 └──────────────┘      └──────────────┘      │
│                                                                              │
│   ┌──────────────┐                                                          │
│   │ Deliberation │◄─── upgrade ─── Discussion                               │
│   │              │                                                          │
│   │  • hostType  │                                                          │
│   │  • hostId    │                                                          │
│   └──────────────┘                                                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Architecture

### 3.1 Discussion Components

| Component | Path | Purpose |
|-----------|------|---------|
| `DiscussionView` | `components/discussion/DiscussionView.tsx` | Main container; renders Chat/Forum tabs |
| `ForumPane` | `components/discussion/ForumPane.tsx` | Forum mode UI with threaded comments |
| `DeliberateButton` | `components/discussion/DeliberateButton.tsx` | Upgrade discussion to deliberation |
| `NewDiscussionButton` | `components/discussion/NewDiscussionButton.tsx` | Create new discussion |
| `SubscribeButton` | `components/discussion/SubscribeButton.tsx` | Toggle subscription notifications |
| `DiscussionCard` | `components/discussion/DiscussionCard.tsx` | Card for discussion list views |
| `DiscussionTitleEditor` | `components/discussion/DiscussionTitleEditor.tsx` | Inline title editing |
| `DiscussionDescriptionEditor` | `components/discussion/DiscussionDescriptionEditor.tsx` | Inline description editing |

### 3.2 Chat Components

| Component | Path | Purpose |
|-----------|------|---------|
| `ChatRoom` | `components/chat/ChatRoom.tsx` | Main chat message list (~2200 lines) |
| `MessageComposer` | `components/chat/MessageComposer.tsx` | Message input with attachments, polls |
| `ConversationView` | `components/chat/ConversationView.tsx` | Standalone conversation wrapper |
| `ConversationList` | `components/chat/ConversationList.tsx` | List of conversations (inbox) |
| `DriftPane` | `components/chat/DriftPane.tsx` | Side conversation viewer |
| `DriftChip` | `components/chat/DriftChip.tsx` | Inline drift indicator |
| `PollChip` | `components/chat/PollChip.tsx` | Poll display and voting |
| `QuoteBlock` | `components/chat/QuoteBlock.tsx` | Quoted message display |
| `LinkCard` | `components/chat/LinkCard.tsx` | URL preview card |
| `StarToggle` | `components/chat/StarToggle.tsx` | Star/bookmark message |
| `MessengerPane` | `components/chat/MessengerPane.tsx` | Global messenger overlay |
| `PrivateChatDock` | `components/chat/PrivateChatDock.tsx` | Floating private chat dock |

### 3.3 Sheaf Components

| Component | Path | Purpose |
|-----------|------|---------|
| `SheafComposer` | `components/sheaf/SheafComposer.tsx` | Multi-facet message composer |
| `SheafMessageBubble` | `components/sheaf/SheafMessageBubble.tsx` | Facet-aware message display |
| `FacetEditorTabs` | `components/sheaf/FacetEditorTabs.tsx` | Tabbed facet editing |

### 3.4 Component Hierarchy Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       COMPONENT HIERARCHY                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   DiscussionView                                                             │
│   ├── DiscussionTitleEditor                                                  │
│   ├── DiscussionDescriptionEditor                                            │
│   ├── SubscribeButton                                                        │
│   ├── DeliberateButton                                                       │
│   │                                                                          │
│   ├── [Tab: "chat"]                                                          │
│   │   └── ChatRoom                                                           │
│   │       ├── MessageItem (memoized, per message)                            │
│   │       │   ├── SheafMessageBubble (if faceted)                            │
│   │       │   ├── QuoteBlock (if quoting)                                    │
│   │       │   ├── LinkCard (if URL previews)                                 │
│   │       │   ├── PollChip (if poll attached)                                │
│   │       │   ├── DriftChip (if drift anchor)                                │
│   │       │   └── StarToggle                                                 │
│   │       ├── DriftPane (when drift open)                                    │
│   │       └── MessageComposer                                                │
│   │           ├── SheafComposer (optional)                                   │
│   │           ├── QuickPollComposer (optional)                               │
│   │           └── File upload UI                                             │
│   │                                                                          │
│   └── [Tab: "forum"]                                                         │
│       └── ForumPane                                                          │
│           ├── SortControl                                                    │
│           └── ForumCommentItem (recursive)                                   │
│               ├── VoteControls                                               │
│               ├── Reply composer (inline)                                    │
│               └── ForumCommentItem[] (children)                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. State Management

### 4.1 useChatStore (Zustand)

The chat system uses a Zustand store for client-side state management.

**Location**: `contexts/useChatStore.ts`

### 4.2 State Shape

```typescript
interface ChatState {
  // Conversations
  conversations: Record<string, Conversation>;
  currentConversation?: string;
  
  // Messages by conversation ID
  messages: Record<string, Message[]>;
  
  // Polls by message ID
  pollsByMessageId: Record<string, PollUI>;
  
  // Reactions by message ID
  reactionsByMessageId: Record<string, ReactionAgg[]>;
  
  // Drifts (side conversations)
  driftsByAnchorId: Record<string, DriftUI>;
  driftsByRootMessageId: Record<string, DriftUI>;
  driftMessages: Record<string, Message[]>;
  
  // Quote drafts
  quoteDraftByConversationId: Record<string, QuoteRef>;
}
```

### 4.3 Key Actions

| Action | Description |
|--------|-------------|
| `setMessages(id, msgs)` | Set messages for a conversation (SSR hydration) |
| `appendMessage(id, msg)` | Append a new message (real-time) |
| `setPolls(id, polls)` | Set polls for a conversation |
| `upsertPoll(poll, state, myVote)` | Update poll state |
| `setDrifts(items)` | Set drift list |
| `upsertDrift(item)` | Update a single drift |
| `setDriftMessages(id, rows)` | Set messages for a drift |
| `appendDriftMessage(id, msg)` | Append message to drift |
| `setReactions(id, items)` | Set reactions for a message |
| `applyReactionDelta(id, emoji, op, byMe)` | Optimistic reaction update |
| `setQuoteDraft(id, ref)` | Set quote for composer |

---

## 5. API Routes

### 5.1 Discussion APIs

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/discussions` | `POST` | Create new discussion |
| `/api/discussions/[id]` | `GET` | Get discussion details |
| `/api/discussions/[id]` | `PATCH` | Update title/description |
| `/api/discussions/[id]/forum` | `GET` | Get forum comments (paginated, threaded) |
| `/api/discussions/[id]/forum` | `POST` | Create forum comment |
| `/api/discussions/[id]/subscribe` | `POST/DELETE` | Toggle subscription |
| `/api/discussions/[id]/deliberations` | `POST` | Link deliberation to discussion |
| `/api/discussions/list` | `GET` | List discussions (with filters) |
| `/api/discussions/explore` | `GET` | Explore public discussions |
| `/api/discussions/subscribed` | `GET` | Get subscribed discussions |

### 5.2 Sheaf/Message APIs

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/sheaf/messages` | `GET` | Fetch messages (with facet visibility) |
| `/api/sheaf/messages` | `POST` | Send message with facets |
| `/api/sheaf/upload` | `POST` | Upload attachment |
| `/api/sheaf/forward-check` | `POST` | Check forward permissions |
| `/api/sheaf/preview` | `GET` | Get link preview |
| `/api/sheaf/participants` | `GET` | Get conversation participants |
| `/api/sheaf/lists` | `GET/POST` | Manage audience lists |

### 5.3 Conversation APIs

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/conversations/[id]` | `GET` | Get conversation details |
| `/api/conversations/[id]/ensure-member` | `POST` | Ensure user is a participant |
| `/api/conversations/group` | `POST` | Create group conversation |
| `/api/conversations/list` | `GET` | List user's conversations |

### 5.4 Bridge APIs

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/discussions/[id]/bridge/promote` | `POST` | Promote chat message to forum |

---

## 6. Sheaf ACL Package

### 6.1 Overview

The Sheaf ACL package (`@app/sheaf-acl`) provides access control for multi-audience messaging.

**Location**: `packages/sheaf-acl/`

### 6.2 Audience Selectors

```typescript
type AudienceSelector =
  | { kind: 'EVERYONE'; mode?: 'DYNAMIC' }
  | { kind: 'ROLE'; role: string; mode: 'DYNAMIC' }
  | { kind: 'LIST'; listId: string; mode: 'DYNAMIC' | 'SNAPSHOT'; ... }
  | { kind: 'USERS'; userIds?: string[]; mode: 'DYNAMIC' | 'SNAPSHOT'; ... };
```

| Kind | Description |
|------|-------------|
| `EVERYONE` | Visible to all participants |
| `ROLE` | Visible to users with specific role |
| `LIST` | Visible to members of an audience list |
| `USERS` | Visible to explicit user IDs |

**Mode:**
- `DYNAMIC`: Membership evaluated at view time
- `SNAPSHOT`: Membership frozen at send time

### 6.3 Share Policies

| Policy | Description |
|--------|-------------|
| `ALLOW` | Content can be forwarded/quoted |
| `REDACT` | Content redacted when forwarded |
| `FORBID` | Cannot be forwarded at all |

### 6.4 Visibility Logic

```typescript
// Core visibility check
function isUserInAudience(user: UserContext, audience: AudienceSelector): boolean

// Get visible facets for a user
function visibleFacetsFor(user: UserContext, facets: MessageFacet[]): MessageFacet[]

// Get default facet (most private visible)
function defaultFacetFor(user: UserContext, facets: MessageFacet[]): MessageFacet | null

// Priority ranking (lower = more private)
function priorityRank(audience: AudienceSelector): number
// USERS: 100, LIST: 200, ROLE: 300, EVERYONE: 400
```

---

## 7. Real-Time System

### 7.1 Supabase Channels

The system uses Supabase Realtime for live updates.

**Hook**: `hooks/useConversationRealtime.ts`

```typescript
const channel = supabase.channel(`conversation-${conversationId}`, {
  config: { presence: { key: currentUser.id } },
});
```

### 7.2 Presence Tracking

```typescript
// Join presence
channel.on("presence", { event: "sync" }, () => {
  const state = channel.presenceState();
  // Update online users map
});

channel.on("presence", { event: "join" }, ({ key, newPresences }) => {
  // Add user to online list
});

channel.on("presence", { event: "leave" }, ({ key }) => {
  // Remove user from online list
});

// Track own presence
channel.subscribe(async (status) => {
  if (status === "SUBSCRIBED") {
    await channel.track({ name: currentUser.name, image: currentUser.image });
  }
});
```

### 7.3 Typing Indicators

```typescript
// Listen for typing broadcasts
channel.on("broadcast", { event: "typing" }, ({ payload }) => {
  const { userId, until, name } = payload;
  // Update typing state (expires after timeout)
});

// Send typing indicator (throttled)
const sendTyping = useMemo(
  () => throttle(() => {
    channel.send({
      type: "broadcast",
      event: "typing",
      payload: { userId, until: Date.now() + 3000, name },
    });
  }, 2000),
  [channel, userId]
);
```

### 7.4 Message Broadcasting

Messages are broadcast via Supabase's database changes subscription:

```typescript
// In ChatRoom component
useEffect(() => {
  const channel = supabase
    .channel(`room:${conversationId}`)
    .on('postgres_changes', 
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
      (payload) => {
        appendMessage(conversationId, normalizeMessage(payload.new));
      }
    )
    .subscribe();
  
  return () => supabase.removeChannel(channel);
}, [conversationId]);
```

---

## 8. Key User Flows

### 8.1 Creating a Discussion

```
User clicks "New Discussion"
        │
        ▼
┌─────────────────────────────────────┐
│ NewDiscussionButton                 │
│ → navigates to /discussions/new     │
└─────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────┐
│ POST /api/discussions               │
│                                     │
│ Body: { title, description?,        │
│         attachedToType?, attachedToId? }│
│                                     │
│ Creates:                            │
│ 1. Discussion record                │
│ 2. Conversation (if createConversation=true) │
│ 3. Initial participant              │
└─────────────────────────────────────┘
        │
        ▼
Redirect to /discussions/[id]
```

### 8.2 Sending a Chat Message

```
User types message in MessageComposer
        │
        ▼
┌─────────────────────────────────────┐
│ MessageComposer.handleSubmit()      │
│                                     │
│ 1. Build payload (text/facets/attachments)│
│ 2. POST /api/sheaf/messages         │
│ 3. Optimistic update via appendMessage│
└─────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────┐
│ POST /api/sheaf/messages            │
│                                     │
│ Creates:                            │
│ 1. Message record                   │
│ 2. SheafFacet records (per audience)│
│ 3. SheafAttachment records          │
│ 4. MessageMention records           │
│ 5. Link previews (async)            │
│                                     │
│ Broadcasts via Supabase             │
└─────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────┐
│ Other clients receive via           │
│ Supabase postgres_changes           │
│                                     │
│ → appendMessage() in useChatStore   │
└─────────────────────────────────────┘
```

### 8.3 Creating a Forum Post

```
User clicks "Reply" or "New Post" in ForumPane
        │
        ▼
┌─────────────────────────────────────┐
│ ForumPane inline composer           │
│                                     │
│ 1. TipTap editor for rich content   │
│ 2. parentId (if reply)              │
└─────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────┐
│ POST /api/discussions/[id]/forum    │
│                                     │
│ Body: { body: TipTapJSON,           │
│         parentId?: BigInt }         │
│                                     │
│ Creates ForumComment record         │
└─────────────────────────────────────┘
        │
        ▼
SWR mutate() → UI updates
```

### 8.4 Promoting Chat to Forum

```
User clicks "Promote to forum" on message
        │
        ▼
┌─────────────────────────────────────┐
│ PromoteToForumMenuItem              │
│                                     │
│ POST /api/discussions/[id]/bridge/promote │
│ Body: { messageId }                 │
└─────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────┐
│ Bridge API                          │
│                                     │
│ 1. Fetch original message via       │
│    GET /api/sheaf/messages?messageId=...│
│ 2. Create ForumComment with:        │
│    - body: blockquote wrapping text │
│    - sourceMessageId: original ID   │
│ 3. Return created comment           │
│                                     │
│ Idempotency: unique(discussionId, sourceMessageId)│
└─────────────────────────────────────┘
```

### 8.5 Upgrading to Deliberation

```
User clicks "Deliberate" button
        │
        ▼
┌─────────────────────────────────────┐
│ DeliberateButton                    │
│                                     │
│ POST /api/deliberations/ensure      │
│ Body: { hostType, hostId }          │
└─────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────┐
│ Ensure API                          │
│                                     │
│ 1. If hostType="discussion":        │
│    - Ensure conversation exists     │
│    - Map to hostType="inbox_thread" │
│                                     │
│ 2. Find or create Deliberation      │
│    with { hostType, hostId }        │
│                                     │
│ 3. Initialize Ludics baseline       │
│                                     │
│ 4. Emit event via emitBus()         │
└─────────────────────────────────────┘
        │
        ▼
Redirect to /deliberation/[id]
```

---

## 9. File Reference

### Components

| File | Lines | Purpose |
|------|-------|---------|
| `components/discussion/DiscussionView.tsx` | ~210 | Main discussion container |
| `components/discussion/ForumPane.tsx` | ~1310 | Forum comment list & threading |
| `components/discussion/DeliberateButton.tsx` | ~65 | Deliberation upgrade button |
| `components/chat/ChatRoom.tsx` | ~2195 | Main chat message list |
| `components/chat/MessageComposer.tsx` | ~720 | Message input with attachments |
| `components/chat/DriftPane.tsx` | ~205 | Side conversation viewer |
| `components/sheaf/SheafComposer.tsx` | ~335 | Multi-facet composer |

### Contexts & Hooks

| File | Purpose |
|------|---------|
| `contexts/useChatStore.ts` | Zustand store for chat state |
| `hooks/useConversationRealtime.ts` | Supabase presence & typing |
| `hooks/useStars.ts` | Message starring |
| `hooks/useBookmarks.ts` | Message bookmarking |
| `hooks/useReceipts.ts` | Read receipts |

### API Routes

| File | Purpose |
|------|---------|
| `app/api/discussions/[id]/route.ts` | CRUD for discussions |
| `app/api/discussions/[id]/forum/route.ts` | Forum comments CRUD |
| `app/api/discussions/[id]/bridge/promote/route.ts` | Chat → Forum promotion |
| `app/api/sheaf/messages/route.ts` | Message fetching with ACL |
| `app/api/conversations/[id]/ensure-member/route.ts` | Ensure membership |
| `app/api/deliberations/ensure/route.ts` | Deliberation creation |

### Packages

| File | Purpose |
|------|---------|
| `packages/sheaf-acl/src/types.ts` | ACL type definitions |
| `packages/sheaf-acl/src/acl.ts` | ACL logic (visibility, subset checks) |

### Lib Helpers

| File | Purpose |
|------|---------|
| `lib/chat/roomKey.ts` | Generate room keys |
| `lib/chat/makePrivateRoomId.ts` | DM room ID generation |
| `lib/sheaf/resolveQuote.ts` | Quote resolution with ACL |
| `lib/sheaf/visibility.ts` | Facet visibility checks |
| `lib/text/mentions.ts` | Mention parsing |
| `lib/text/urls.ts` | URL extraction |

---

## Appendix: Key Type Definitions

### Message Type (Client)

```typescript
interface Message {
  id: string;
  text: string | null;
  createdAt: string;
  senderId: string;
  sender?: { name: string; image: string | null };
  attachments?: Attachment[];
  facets?: {
    id: string;
    audience: AudienceSelector;
    sharePolicy: SharePolicy;
    expiresAt: string | null;
    body: any;
    attachments?: any[];
    priorityRank: number;
    createdAt: string;
  }[];
  defaultFacetId?: string | null;
  isRedacted?: boolean;
  meta?: any;
  driftId?: string | null;
  mentionsMe?: boolean;
}
```

### DriftUI Type

```typescript
type DriftUI = {
  drift: {
    id: string;
    conversationId: string;
    title: string;
    isClosed: boolean;
    isArchived: boolean;
    messageCount: number;
    lastMessageAt: string | null;
    anchorMessageId?: string | null;
    kind?: "DRIFT" | "THREAD";
    rootMessageId?: string | null;
  };
  my?: {
    collapsed: boolean;
    pinned: boolean;
    muted: boolean;
    lastReadAt: string | null;
  };
};
```

### ForumComment Type

```typescript
type ForumComment = {
  id: string;
  discussionId: string;
  parentId: string | null;
  authorId: string | number;
  body?: any;          // TipTap JSON
  bodyText?: string | null;
  sourceMessageId?: string | null;
  score: number;
  createdAt: string;
  _children?: ForumComment[];
};
```

---

*Document Version: 1.0*
*Last Updated: December 12, 2025*
