# Agora Feed System Architecture

## Comprehensive Real-Time Event Feed & Deliberation Integration

**Version:** 1.0  
**Last Updated:** January 2025  
**Document Type:** System Architecture Specification

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Overview](#2-system-overview)
3. [Architecture Diagrams](#3-architecture-diagrams)
4. [Data Models](#4-data-models)
5. [Component Architecture](#5-component-architecture)
6. [Real-Time Event Infrastructure](#6-real-time-event-infrastructure)
7. [API Specifications](#7-api-specifications)
8. [Plexus Visualization System](#8-plexus-visualization-system)
9. [Following & Subscription System](#9-following--subscription-system)
10. [Deliberation Integration](#10-deliberation-integration)
11. [Performance & Scalability](#11-performance--scalability)
12. [Appendices](#12-appendices)

---

## 1. Executive Summary

### 1.1 Purpose

The **Agora Feed System** serves as the central real-time activity hub for the Mesh platform. It provides users with a unified view of all collaborative activities across deliberations, citations, stacks, and discussions. The system integrates deeply with the deliberation infrastructure, enabling users to discover, follow, and participate in structured reasoning processes.

### 1.2 Key Capabilities

| Capability | Description |
|------------|-------------|
| **Real-Time Event Feed** | Server-Sent Events (SSE) infrastructure delivering instant updates |
| **Event Coalescing** | Intelligent bundling of similar events to reduce noise |
| **Multi-View Interface** | Feed, Debates, and Plexus visualization modes |
| **Following System** | Room, tag, and stack subscription management |
| **Cross-Room Navigation** | Plexus network visualization showing room relationships |
| **Debate Sheet Integration** | Direct access to structured argument views |

### 1.3 System Boundaries

```
┌─────────────────────────────────────────────────────────────────────┐
│                      AGORA FEED SYSTEM                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────────────────┐   │
│  │ Feed View   │   │ Debates View│   │ Plexus View             │   │
│  │             │   │             │   │ (Board/Graph/Matrix)    │   │
│  └──────┬──────┘   └──────┬──────┘   └───────────┬─────────────┘   │
│         │                 │                       │                 │
│         └─────────────────┴───────────────────────┘                 │
│                           │                                         │
│              ┌────────────┴────────────┐                           │
│              │    Event Processing     │                           │
│              │    (Coalescing, SWR)    │                           │
│              └────────────┬────────────┘                           │
│                           │                                         │
│         ┌─────────────────┴─────────────────┐                      │
│         │                                    │                      │
│    ┌────┴─────┐                     ┌───────┴───────┐              │
│    │ SSE Bus  │                     │ REST APIs     │              │
│    │ /api/events                    │ /api/agora/*  │              │
│    └──────────┘                     └───────────────┘              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐   ┌─────────────────┐   ┌─────────────────┐
│ Deliberations │   │ Stacks/Library  │   │ Discussions     │
│ System        │   │ System          │   │ System          │
└───────────────┘   └─────────────────┘   └─────────────────┘
```

### 1.4 Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Next.js 14 (App Router), TypeScript |
| State Management | SWR for data fetching, React useState/useEffect |
| Real-Time | Server-Sent Events (EventSource API) |
| Server Bus | Node.js EventEmitter (singleton) |
| Database | PostgreSQL via Prisma ORM |
| Styling | Tailwind CSS, clsx |

---

## 2. System Overview

### 2.1 Core Concepts

#### 2.1.1 AgoraEvent

The fundamental unit of the feed system. Each event represents an activity that occurred in the platform.

```typescript
type AgoraEvent = {
  id: string;              // Unique identifier for deduplication
  type: BusEvent;          // Event category (dialogue:changed, citations:changed, etc.)
  ts: number;              // Timestamp in epoch milliseconds
  title: string;           // Human-readable event title
  meta?: string;           // Additional context (room ID, target info)
  chips?: string[];        // Tags/labels for filtering
  link?: string;           // Primary navigation link
  deliberationId?: string; // Associated deliberation (if any)
  targetType?: string;     // Target entity type (claim, comment, etc.)
  targetId?: string;       // Target entity ID
  icon?: string;           // Visual indicator (move, link, check, vote, branch)
};
```

#### 2.1.2 Event Types

Events are categorized by their source system:

| Category | Event Types | Description |
|----------|-------------|-------------|
| **Dialogue** | `dialogue:moves:refresh`, `dialogue:changed`, `dialogue:cs:refresh` | Argument moves, state changes |
| **Claims** | `claims:edges:changed`, `cqs:changed` | Claim relationships, critical questions |
| **Decisions** | `decision:changed`, `votes:changed` | Voting, acceptance/rejection |
| **Content** | `stacks:changed`, `comments:changed`, `citations:changed` | User content updates |
| **Structure** | `deliberations:created`, `xref:changed` | New deliberations, cross-references |

#### 2.1.3 View Modes

The Agora interface offers three distinct view modes:

| Mode | Purpose | Key Components |
|------|---------|----------------|
| **Feed** | Real-time activity stream | EventCard, FiltersPanel, RightRail |
| **Debates** | Structured argument navigation | RoomPicker, DebatePicker, DebateSheetReader |
| **Plexus** | Room relationship visualization | PlexusBoard, Plexus (Graph), PlexusMatrix |

### 2.2 Data Flow Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          EVENT LIFECYCLE                                  │
└──────────────────────────────────────────────────────────────────────────┘

1. EVENT EMISSION (Server-Side)
   ┌─────────────┐      emitBus()      ┌─────────────┐
   │ API Route   │ ──────────────────► │ Event Bus   │
   │ (mutation)  │                     │ (singleton) │
   └─────────────┘                     └──────┬──────┘
                                              │
2. EVENT BROADCAST                            │
                                              ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │                    SSE ENDPOINT (/api/events)                   │
   │  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐           │
   │  │ Client A    │   │ Client B    │   │ Client C    │           │
   │  │ EventSource │   │ EventSource │   │ EventSource │           │
   │  └─────────────┘   └─────────────┘   └─────────────┘           │
   └─────────────────────────────────────────────────────────────────┘
                                              │
3. CLIENT PROCESSING                          ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │                   LiveEventsProvider                            │
   │  ┌───────────────┐   ┌───────────────┐   ┌───────────────┐     │
   │  │ Coalesce      │   │ SWR Mutate    │   │ Window Event  │     │
   │  │ (bundle)      │   │ (revalidate)  │   │ (legacy)      │     │
   │  └───────────────┘   └───────────────┘   └───────────────┘     │
   └─────────────────────────────────────────────────────────────────┘
                                              │
4. UI UPDATE                                  ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │                      Agora Component                            │
   │  ┌───────────────┐   ┌───────────────┐   ┌───────────────┐     │
   │  │ Filter Events │   │ Render Cards  │   │ Update State  │     │
   │  │ (tab/search)  │   │ (EventCard)   │   │ (selection)   │     │
   │  └───────────────┘   └───────────────┘   └───────────────┘     │
   └─────────────────────────────────────────────────────────────────┘
```

### 2.3 Integration Points

The Agora system integrates with multiple platform subsystems:

```
                    ┌─────────────────┐
                    │  AGORA SYSTEM   │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ Deliberations │   │   Stacks &    │   │  Discussions  │
│               │   │   Libraries   │   │               │
│ • Arguments   │   │ • PDFs        │   │ • Forums      │
│ • Claims      │   │ • Subscriptions│  │ • Comments    │
│ • Schemes     │   │ • Citations   │   │ • Threads     │
│ • Decisions   │   └───────────────┘   └───────────────┘
│ • Votes       │
└───────────────┘
        │
        ▼
┌───────────────┐
│  Thesis &     │
│  Knowledge    │
│  Bases        │
└───────────────┘
```

---

## 3. Architecture Diagrams

### 3.1 Component Hierarchy

```
app/agora/
├── page.tsx                    # Server Component (initial fetch)
│   └── Agora                   # Client Component (main)
│       ├── TopBar              # Navigation & controls
│       │   ├── HomeButton
│       │   ├── Segmented (tabs)
│       │   └── Search/Pause controls
│       │
│       ├── [view === 'feed']
│       │   ├── FiltersPanel    # Left sidebar (placeholder)
│       │   ├── EventCard[]     # Event list
│       │   │   ├── Icon
│       │   │   ├── Title/Meta
│       │   │   ├── Chips
│       │   │   └── Actions (Open, Follow, Reply)
│       │   └── RightRail       # Context panel
│       │       ├── Room info
│       │       ├── Navigator (backlinks)
│       │       └── StackSummaryCard
│       │
│       ├── [view === 'debates']
│       │   ├── RoomPicker
│       │   ├── DebatePicker
│       │   ├── SheetPicker
│       │   └── DebateSheetReader
│       │       ├── DebateSheetHeader
│       │       ├── DebateSheetFilters
│       │       ├── ArgumentNetworkCard[]
│       │       └── SupportBar
│       │
│       └── [view === 'plexus']
│           └── PlexusShell
│               ├── ViewModeSelector
│               ├── PlexusBoard     # Card grid
│               ├── Plexus          # Force-directed graph
│               └── PlexusMatrix    # Adjacency matrix

app/agora/
└── LiveEventsProvider.tsx      # Wraps app layout (SSE consumer)

lib/client/
├── useFollowing.ts             # Room/tag follow state
├── useStackFollowing.ts        # Stack subscription state
└── useBusEffect.ts             # SSE subscription hook

lib/server/
├── bus.ts                      # Event bus singleton
lib/events/
└── topics.ts                   # BusEvent type definitions
```

### 3.2 Server-Side Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SERVER INFRASTRUCTURE                           │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                          Event Bus (Singleton)                          │
│                         lib/server/bus.ts                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  globalThis.__meshBus__ = new EventEmitter()                    │   │
│  │  maxListeners: 50                                               │   │
│  │                                                                 │   │
│  │  Methods:                                                       │   │
│  │  • emitBus(type, payload) → BusEnvelope                        │   │
│  │  • onBus(type, handler)   → void                               │   │
│  │  • offBus(type, handler)  → void                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
            ┌────────────────────────┼────────────────────────┐
            │                        │                        │
            ▼                        ▼                        ▼
┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
│ SSE Endpoint      │   │ API Mutations     │   │ Workers/Cron      │
│ /api/events       │   │ /api/dialogue/*   │   │ workers/          │
│                   │   │ /api/claims/*     │   │                   │
│ Subscribes to all │   │ Call emitBus()    │   │ Emit background   │
│ BUS_EVENTS        │   │ after mutations   │   │ events            │
└───────────────────┘   └───────────────────┘   └───────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                          Ring Buffer (In-Memory)                        │
│                         app/api/events/route.ts                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  globalThis.__agoraRing__ = { buf: [], cap: 2048 }              │   │
│  │  globalThis.__agoraSeq__ = 0  // Sequential event IDs           │   │
│  │                                                                 │   │
│  │  Features:                                                      │   │
│  │  • Circular buffer (FIFO, 2048 events)                         │   │
│  │  • Sequential IDs for resumability                             │   │
│  │  • last-event-id header support                                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Client-Side Event Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       CLIENT EVENT PROCESSING                           │
└─────────────────────────────────────────────────────────────────────────┘

                         Browser Tab
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        app/(app)/layout.tsx                             │
│  <LiveEventsProvider>                                                   │
│      {children}                                                         │
│  </LiveEventsProvider>                                                  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       LiveEventsProvider                                │
│                   app/agora/LiveEventsProvider.tsx                      │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  EventSource("/api/events?lastEventId=...")                     │   │
│  │                                                                 │   │
│  │  1. Subscribe to ALL named topics (TOPICS array)                │   │
│  │  2. Parse incoming JSON payloads                                │   │
│  │  3. Normalize envelope format                                   │   │
│  └──────────────────────────────┬──────────────────────────────────┘   │
│                                 │                                       │
│                                 ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  handle(raw) callback                                           │   │
│  │                                                                 │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │   │
│  │  │ Coalesce    │  │ SWR Mutate  │  │ Window CustomEvent      │ │   │
│  │  │ to buffer   │  │ via KEYMAP  │  │ (legacy bridge)         │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  useSafetyBackfill() - Periodic safety net                      │   │
│  │  • Poll /api/agora/events?since=... every 60s                   │   │
│  │  • Trigger on visibilitychange (tab focus)                      │   │
│  │  • Trigger on 'online' event (network reconnect)                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Agora Component                                 │
│                      app/agora/ui/Agora.tsx                             │
│                                                                         │
│  useBusEffect("*", handler)                                             │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Event Handler:                                                 │   │
│  │  1. Parse message to AgoraEvent                                 │   │
│  │  2. coalesce(prev, ev) → bundle similar events                  │   │
│  │  3. setEvents(coalescedList.slice(0, 200))                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  State: [events, setEvents] ─────────► Render EventCard list           │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.4 Event Coalescing Algorithm

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      EVENT COALESCING LOGIC                             │
└─────────────────────────────────────────────────────────────────────────┘

Input: Previous events array, New event

┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  BUNDLE_WINDOW_MS = 3 * 60 * 1000  (3 minutes)                         │
│  CITATION_BUNDLE_WINDOW_MS = 2 * 60 * 1000  (2 minutes)                │
│  FEED_CAP = 300 events                                                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

                    New Event Arrives
                          │
                          ▼
              ┌───────────────────────┐
              │ Is citations:changed? │
              └───────────┬───────────┘
                    │           │
                   YES          NO
                    │           │
                    ▼           ▼
        ┌───────────────┐  ┌───────────────────────┐
        │ Find matching │  │ Is dialogue:changed   │
        │ bundle with   │  │ with deliberationId?  │
        │ same target   │  └───────────┬───────────┘
        │ within 2 min  │        │           │
        └───────┬───────┘       YES          NO
                │               │            │
    ┌───────────┴───────────┐   ▼            ▼
    │ Bundle  │ No Bundle   │   ...          │
    │ Found   │ Found       │   (same logic) │
    └────┬────┴─────┬───────┘                │
         │          │                        │
         ▼          ▼                        │
   ┌───────────┐  ┌───────────┐              │
   │ Update    │  │ Create    │              │
   │ existing  │  │ new event │◄─────────────┘
   │ bundle    │  │ (no bundle│
   │ count++   │  │ needed)   │
   └───────────┘  └───────────┘
         │              │
         └──────┬───────┘
                ▼
        ┌───────────────┐
        │ Move to front │
        │ of array      │
        └───────┬───────┘
                │
                ▼
        ┌───────────────┐
        │ Slice to      │
        │ FEED_CAP      │
        └───────────────┘
```

---

## 4. Data Models

### 4.1 Core Prisma Models

#### 4.1.1 AgoraRoom

Represents a topic-based container for deliberations.

```prisma
model AgoraRoom {
  id            String          @id @default(cuid())
  slug          String          @unique
  title         String
  summary       String?
  visibility    String          @default("public")  // "public" | "private" | "unlisted"
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
  
  // Relations
  sheets        DebateSheet[]   @relation(name: "RoomSheets")
  deliberations Deliberation[]
}
```

**Usage Context:**
- Rooms group related deliberations
- Plexus visualizes room-to-room relationships
- Users can follow rooms to receive updates

#### 4.1.2 AgoraFollow

Tracks user subscriptions to rooms and tags.

```prisma
model AgoraFollow {
  userId        String
  kind          String          // "room" | "tag"
  targetId      String          // Room ID or tag string
  createdAt     DateTime        @default(now())

  @@id([userId, kind, targetId])
  @@index([kind, targetId])
}
```

**Usage Context:**
- "Following" tab filters events to subscribed rooms
- Tag following enables topic-based filtering
- Drives personalized feed experience

#### 4.1.3 AgoraOutbox

Event persistence for durability and replay.

```prisma
model AgoraOutbox {
  id              String    @id @default(cuid())
  ts              DateTime  @default(now())
  topic           String    // BusEvent type
  roomId          String?
  deliberationId  String?
  targetType      String?
  targetId        String?
  payload         Json?
  delivered       Boolean   @default(false)

  @@index([ts])
  @@index([topic, deliberationId])
}
```

**Usage Context:**
- Future: Persistent event storage for durability
- Enables event replay after server restart
- Supports audit logging

#### 4.1.4 RoomFunctor

Cross-room claim mappings for inter-deliberation relationships.

```prisma
model RoomFunctor {
  id            String    @id @default(cuid())
  fromRoomId    String    // Source deliberation
  toRoomId      String    // Target deliberation
  claimMapJson  Json      // { "claimA": "claimB", ... }
  notes         String?
  createdById   String?
  createdAt     DateTime  @default(now())

  @@unique([fromRoomId, toRoomId])
  @@index([fromRoomId, toRoomId])
}
```

**Usage Context:**
- Plexus "imports" edge type
- Enables cross-room argument reuse
- Category-theoretic claim transport

### 4.2 TypeScript Type Definitions

#### 4.2.1 BusEvent Types

```typescript
// lib/events/topics.ts

export const BUS_EVENTS = [
  'dialogue:moves:refresh',
  'dialogue:cs:refresh',
  'claims:edges:changed',
  'cqs:changed',
  'cards:changed',
  'decision:changed',
  'votes:changed',
  'stacks:changed',
  'deliberations:created',
  'comments:changed',
  'xref:changed',
  'citations:changed',
  'dialogue:changed',
  'issues:changed',
] as const;

export type BusEvent = typeof BUS_EVENTS[number];
```

#### 4.2.2 Bus Payload Types

```typescript
// lib/server/bus.ts

export interface BusPayloadMap {
  'dialogue:moves:refresh': {
    deliberationId: string;
    moveId?: string;
    kind?: string;
  };
  'dialogue:cs:refresh': {
    deliberationId: string;
    participantId?: string;
  };
  'dialogue:changed': {
    deliberationId: string;
    moveId?: string;
    kind?: string;
    chips?: string[];
  };
  'citations:changed': {
    targetType: string;      // "claim" | "comment"
    targetId: string;
    sourceId?: string;
    url?: string;
    quote?: string;
    note?: string;
    deliberationId?: string;
  };
  'deliberations:created': {
    id: string;
    hostType: string;
    hostId: string;
  };
  // Additional types as needed...
}

export type BusPayload<T extends BusEvent> =
  T extends keyof BusPayloadMap ? BusPayloadMap[T] : Record<string, any>;

export type BusEnvelope<T extends BusEvent = BusEvent> =
  { type: T; ts: number } & BusPayload<T>;
```

#### 4.2.3 Network Graph Types

```typescript
// Used by Plexus components

type EdgeKind = 'xref' | 'overlap' | 'stack_ref' | 'imports' | 'shared_author';

type RoomNode = {
  id: string;
  title?: string | null;
  nArgs: number;           // Argument count
  nEdges: number;          // Edge count
  accepted: number;        // Accepted claims
  rejected: number;        // Rejected claims
  undecided: number;       // Undecided claims
  tags?: string[];
  updatedAt?: string | null;
  debateSheetId?: string | null;
};

type MetaEdge = {
  from: string;            // Source room ID
  to: string;              // Target room ID
  kind: EdgeKind;
  weight: number;          // Connection strength
};

type Network = {
  scope: 'public' | 'following';
  version: number;
  rooms: RoomNode[];
  edges: MetaEdge[];
};
```

### 4.3 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        AGORA DATA MODEL                                 │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│  AgoraRoom  │─────────│ Deliberation │─────────│   Argument  │
│             │   1:N   │             │   1:N   │             │
│ id          │         │ id          │         │ id          │
│ slug        │         │ title       │         │ text        │
│ title       │         │ hostType    │         │ kind        │
│ summary     │         │ hostId      │         │             │
│ visibility  │         │ agoraRoomId │◄────────│deliberationId│
└──────┬──────┘         └──────┬──────┘         └─────────────┘
       │                       │
       │                       │
       │                ┌──────┴──────┐
       │                │             │
       ▼                ▼             ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ DebateSheet │  │ DialogueMove │  │    Claim    │
│             │  │             │  │             │
│ id          │  │ id          │  │ id          │
│ title       │  │ kind        │  │ text        │
│ deliberation│  │ targetType  │  │ confidence  │
│ agoraRoomId │  │ targetId    │  │ deliberation│
└─────────────┘  └─────────────┘  └─────────────┘

┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│ AgoraFollow │         │ AgoraOutbox │         │ RoomFunctor │
│             │         │             │         │             │
│ userId      │         │ id          │         │ id          │
│ kind        │         │ ts          │         │ fromRoomId  │
│ targetId    │         │ topic       │         │ toRoomId    │
│ createdAt   │         │ payload     │         │ claimMapJson│
│             │         │ delivered   │         │ notes       │
└─────────────┘         └─────────────┘         └─────────────┘

Legend:
─────── : Foreign key relationship
1:N     : One-to-many cardinality
◄────── : Reference direction
```

---

## 5. Component Architecture

### 5.1 Agora Main Component

**File:** `app/agora/ui/Agora.tsx` (832 lines)

The central component orchestrating the entire Agora interface.

#### 5.1.1 Component Props

```typescript
export default function Agora({
  initialEvents,
}: {
  initialEvents: AgoraEvent[];
}) {
  // Server-rendered initial events for instant display
}
```

#### 5.1.2 State Management

```typescript
// Core state
const [events, setEvents] = useState<AgoraEvent[]>(initialEvents);
const [paused, setPaused] = useState(false);
const [tab, setTab] = useState<"all" | "following" | "calls" | "votes" | "accepted">("all");
const [view, setView] = useState<"feed" | "debates" | "plexus">("feed");
const [q, setQ] = useState("");
const [selected, setSelected] = useState<AgoraEvent | null>(null);

// Following state (from hooks)
const { roomSet, isFollowingRoom, isFollowingTag, followRoom, unfollowRoom } = useFollowing();
const { stackSet, isFollowingStack } = useStackFollowing();

// UI state
const [pending, setPending] = useState<Set<string>>(new Set());
const [ok, setOk] = useState<Set<string>>(new Set());

// Debate view state
const [roomId, setRoomId] = useState<string | null>(null);
const [debateId, setDebateId] = useState<string | null>(null);
const [sheetKey, setSheetKey] = useState<string | null>(null);

// Persistence
const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
const [currentSheetKey, setCurrentSheetKey] = useState<string | null>(null);
```

#### 5.1.3 Event Handling

```typescript
// Live event subscription
useBusEffect("*", (m) => {
  if (paused) return;
  
  const t = String(m?.type ?? "");
  const ts = typeof m.ts === "number" ? m.ts : Date.parse(m.ts) || Date.now();
  let ev: AgoraEvent | null = null;

  switch (t) {
    case "dialogue:moves:refresh":
      ev = {
        id: `mv:${m.moveId || ts}`,
        type: "dialogue:changed",
        ts,
        title: `New move${m.kind ? ` (${m.kind})` : ""}`,
        meta: m.deliberationId ? `room:${m.deliberationId.slice(0, 6)}…` : undefined,
        chips: m.kind ? [m.kind] : [],
        link: m.deliberationId ? `/deliberation/${m.deliberationId}` : undefined,
        deliberationId: m.deliberationId,
        icon: "move",
      };
      break;

    case "citations:changed":
      ev = buildCitationEvent(m, ts);
      break;

    case "decision:changed":
      ev = buildDecisionEvent(m, ts);
      break;

    // ... additional cases
  }

  if (ev) setEvents((prev) => coalesce(prev, ev).slice(0, 200));
});
```

#### 5.1.4 Filtering Logic

```typescript
const filtered = useMemo(() => {
  let list = events;

  // Tab-based filtering
  if (tab === "accepted") list = list.filter((e) => e.type === "decision:changed");
  if (tab === "votes") list = list.filter((e) => e.type === "votes:changed");

  // Following filter
  if (tab === "following") {
    if (!hasFollowData) return events; // Don't blank feed if no data yet
    
    list = list.filter((e) => {
      const inRooms = e.deliberationId ? roomSet.has(e.deliberationId) : false;
      const inTags = (e.chips || []).some((c) => isFollowingTag(c));
      const inStacks = /* stack following check */;
      const citInRoom = /* citation room check */;
      const citInStack = /* citation stack check */;
      
      return inRooms || inTags || inStacks || citInRoom || citInStack;
    });
  }

  // Search filter
  if (q) {
    const ql = q.toLowerCase();
    list = list.filter((e) =>
      (e.title ?? "").toLowerCase().includes(ql) ||
      (e.meta ?? "").toLowerCase().includes(ql) ||
      (e.chips ?? []).some((c) => c.toLowerCase().includes(ql))
    );
  }

  return list;
}, [events, tab, q, roomSet, isFollowingTag, isFollowingStack, hasFollowData]);
```

#### 5.1.5 View Mode Rendering

```typescript
return (
  <div className="mx-auto w-full max-w-screen justify-center px-0 pb-10 pt-2">
    <TopBar tab={tab} onTab={setTab} q={q} onQ={setQ} paused={paused} onPause={() => setPaused(p => !p)} />
    
    {/* View mode selector */}
    <ViewModeButtons view={view} setView={setView} />

    {/* Conditional rendering based on view */}
    {view === 'plexus' && <PlexusShell scope="public" />}
    
    {view === 'debates' && (
      <DebatesView 
        roomId={roomId} setRoomId={setRoomId}
        debateId={debateId} setDebateId={setDebateId}
        sheetKey={sheetKey} setSheetKey={setSheetKey}
      />
    )}
    
    {view === 'feed' && (
      <FeedView 
        filtered={filtered}
        selected={selected} setSelected={setSelected}
        isFollowingRoom={isFollowingRoom}
        followRoom={followRoom} unfollowRoom={unfollowRoom}
        pending={pending} ok={ok}
      />
    )}
  </div>
);
```

### 5.2 EventCard Component

**File:** `app/agora/ui/EventCard.tsx` (~175 lines)

Renders individual events in the feed.

#### 5.2.1 Props Interface

```typescript
export function EventCard({
  ev,
  onSelect,
  isFollowing,
  onFollow,
  onUnfollow,
  pending = false,
  ok = false,
}: {
  ev: AgoraEvent;
  onSelect?: (e: AgoraEvent) => void;
  isFollowing?: boolean;
  onFollow?: () => void;
  onUnfollow?: () => void;
  pending?: boolean;
  ok?: boolean;
}) { ... }
```

#### 5.2.2 Bundle Detection

```typescript
const isBundle = ev.type === ("bundle" as any);
const bundleSub = (ev as any).subtype as string | undefined;
const iconKind = isBundle 
  ? (bundleSub === "citations" ? "link" : "move") 
  : ev.icon;
```

#### 5.2.3 Status Fetching (SWR)

```typescript
const statusUrl = (ev.type === "bundle" as AgoraEvent["type"]) && ev.deliberationId
  ? `/api/dialogues/${ev.deliberationId}/status`
  : null;

const { data: st } = useSWR(
  statusUrl,
  (u) => fetch(u).then(r => r.ok ? r.json() : null),
  { revalidateOnFocus: false, shouldRetryOnError: false }
);
```

#### 5.2.4 Chip Rendering

```typescript
const chips = ev.chips ?? [];
const MAX_CHIPS = 5;
const displayChips = chips.slice(0, MAX_CHIPS);
const extra = Math.max(0, chips.length - MAX_CHIPS);

// Render chips with styling based on type
{displayChips.map((t) => {
  const s = String(t);
  const isQuote = s.startsWith(""");
  const isNote = s.startsWith("Note:");
  return (
    <span
      key={s}
      className={clsx(
        "text-[11px] px-1.5 py-0.5 rounded border bg-white/80",
        isQuote && "italic",
        isNote && "text-slate-600 border-slate-200"
      )}
      title={s}
    >
      {s}
    </span>
  );
})}
```

#### 5.2.5 Action Buttons

```typescript
{/* Contextual actions based on event type */}
{ev.link && ev.type !== "citations:changed" && (
  isExternal(ev.link) ? (
    <a href={ev.link} target="_blank" rel="noreferrer" className="...">Open</a>
  ) : (
    <Link href={ev.link} className="...">Open</Link>
  )
)}

{ev.type === "dialogue:changed" && ev.deliberationId && (
  <Link href={`/deliberation/${ev.deliberationId}?mode=forum`} className="...">
    Reply
  </Link>
)}

{ev.type === "citations:changed" && (ev as any).contextLink && (
  <Link href={(ev as any).contextLink} className="...">Context</Link>
)}

{/* Follow/Unfollow button */}
{!!ev.deliberationId && (
  <div className="inline-flex items-center gap-2 ml-auto">
    {isFollowing ? (
      <button onClick={onUnfollow} disabled={pending}>Following</button>
    ) : (
      <button onClick={onFollow} disabled={pending}>Follow</button>
    )}
    {ok && <span className="text-emerald-700">✓ saved</span>}
  </div>
)}
```

### 5.3 TopBar Component

**File:** `app/agora/ui/TopBar.tsx` (~122 lines)

Navigation and controls header.

#### 5.3.1 Tab Configuration

```typescript
type Tab = "all" | "following" | "calls" | "votes" | "accepted";

const tabs: Array<{ value: Tab; label: string }> = [
  { value: "all",       label: "All" },
  { value: "following", label: "Following" },
  { value: "calls",     label: "Calls" },
  { value: "votes",     label: "Votes" },
  { value: "accepted",  label: "Accepted" },
];
```

#### 5.3.2 Segmented Control

```typescript
function Segmented<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void;
  ariaLabel?: string;
}) {
  // Keyboard navigation with arrow keys
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight") focusBtn(idx + 1);
    if (e.key === "ArrowLeft") focusBtn(idx - 1);
  }

  return (
    <nav role="tablist" aria-label={ariaLabel} onKeyDown={onKeyDown}>
      <div className="inline-flex overflow-hidden rounded-xl border ...">
        {options.map((o, i) => (
          <button
            key={o.value}
            role="tab"
            aria-selected={o.value === value}
            tabIndex={o.value === value ? 0 : -1}
            className={clsx("px-5 py-1 ...", active && "bg-slate-900 text-white")}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
```

### 5.4 RightRail Component

**File:** `app/agora/ui/RightRail.tsx` (~90 lines)

Context panel showing selected event details.

#### 5.4.1 Data Extraction

```typescript
export function RightRail({ selected }: { selected: AgoraEvent | null }) {
  // Extract deliberation ID from various sources
  const toDelib = selected?.deliberationId || (selected as any)?.toId || null;

  // Extract stack ID from link or contextLink
  const link = (selected as any)?.contextLink || selected?.link || "";
  const stackMatch = typeof link === "string" ? link.match(/\/stacks\/([^/?#]+)/) : null;
  const stackIdOrSlug = stackMatch?.[1];

  // For stacks:changed events, parse from meta
  const stackId = selected?.type === "stacks:changed"
    ? (selected.meta?.startsWith?.("stack:") ? selected.meta.split(":")[1].replace("…", "") : null)
    : stackIdOrSlug || null;
}
```

#### 5.4.2 Backlinks Fetching

```typescript
const { data } = useSWR(
  toDelib ? `/api/xref?toType=deliberation&toId=${encodeURIComponent(toDelib)}` : null,
  fetcher,
  { revalidateOnFocus: false }
);
const backlinks = data?.items ?? [];
```

#### 5.4.3 Sections

```typescript
return (
  <div className="space-y-3">
    {/* Room Section */}
    {toDelib && (
      <div className="rounded-xl border bg-white/70 p-3">
        <div className="text-sm font-medium">Room {toDelib}</div>
        <div className="mt-2 flex items-center gap-2">
          <a href={`/deliberation/${toDelib}`}>Open Deliberation</a>
          <a href={`/deliberation/${toDelib}/dialoguetimeline`}>Open Dialogue Timeline</a>
          <FollowButton roomId={toDelib} />
        </div>
      </div>
    )}

    {/* Navigator (XRef backlinks) */}
    <div className="rounded-xl border bg-white/70 p-3">
      <div className="text-sm font-medium">Navigator</div>
      {!toDelib ? (
        <div>Select a card to see backlinks.</div>
      ) : backlinks.length ? (
        <ul className="mt-2 space-y-1">
          {backlinks.map((x) => (
            <li key={x.id}>
              {x.relation} from {x.fromType}:{x.fromId.slice(0,6)}…
              {x.fromType === 'deliberation' && <a href={`/deliberation/${x.fromId}`}>Open</a>}
            </li>
          ))}
        </ul>
      ) : (
        <div>No backlinks.</div>
      )}
    </div>

    {/* Stack Summary */}
    {stackId && <StackSummaryCard stackId={stackId} />}
  </div>
);
```

### 5.5 StackSummaryCard Component

**File:** `app/agora/ui/StackSummaryCard.tsx` (~30 lines)

Displays stack metadata in the RightRail.

```typescript
export function StackSummaryCard({ stackId }: { stackId: string }) {
  const { data, error } = useSWR<{
    id: string;
    name: string;
    slug: string | null;
    is_public: boolean;
    subscriberCount: number;
  }>(
    stackId ? `/api/stacks/${encodeURIComponent(stackId)}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  if (error) return null;
  if (!data) return <div>Loading…</div>;

  const href = data.slug ? `/stacks/${data.slug}` : `/stacks/${data.id}`;
  
  return (
    <div className="rounded-xl border bg-white/70 p-3 text-sm">
      <div className="font-semibold">{data.name}</div>
      <div className="text-[11px] text-slate-600 mt-1">
        Visibility: {data.is_public ? 'Public' : 'Private'} · 
        Subscribers: {data.subscriberCount}
      </div>
      <a href={href} className="inline-block mt-2 ...">Open stack</a>
    </div>
  );
}
```

---

## 6. Real-Time Event Infrastructure

### 6.1 Event Bus Architecture

**File:** `lib/server/bus.ts`

The event bus is a Node.js EventEmitter singleton shared across all server processes.

#### 6.1.1 Singleton Pattern

```typescript
declare global {
  var __meshBus__: EventEmitter | undefined;
}

const bus: EventEmitter = globalThis.__meshBus__ ??= new EventEmitter();

// Increase listener limit for multiple SSE connections
if ((EventEmitter as any).defaultMaxListeners < 50) {
  (EventEmitter as any).defaultMaxListeners = 50;
}
bus.setMaxListeners(50);

export default bus;
```

#### 6.1.2 Helper Functions

```typescript
/**
 * Emit an event to the bus with typed payload
 */
export function emitBus<T extends BusEvent>(
  type: T,
  payload: BusPayload<T>
): BusEnvelope<T> {
  const env = { type, ts: Date.now(), ...(payload || {}) } as BusEnvelope<T>;
  bus.emit(type, env);
  return env;
}

/**
 * Subscribe to an event type
 */
export function onBus<T extends BusEvent>(
  type: T,
  fn: (e: BusEnvelope<T>) => void
) {
  bus.on(type, fn as any);
}

/**
 * Unsubscribe from an event type
 */
export function offBus<T extends BusEvent>(
  type: T,
  fn: (e: BusEnvelope<T>) => void
) {
  (bus as any).off
    ? (bus as any).off(type, fn as any)
    : bus.removeListener(type, fn as any);
}
```

#### 6.1.3 Usage in API Routes

```typescript
// Example: Emitting after a dialogue move is created
// app/api/dialogue/moves/route.ts

import { emitBus } from "@/lib/server/bus";

export async function POST(req: NextRequest) {
  // ... create move in database
  
  // Emit event
  emitBus("dialogue:moves:refresh", {
    deliberationId: move.deliberationId,
    moveId: move.id,
    kind: move.kind,
  });
  
  return NextResponse.json({ ok: true, move });
}
```

### 6.2 SSE Endpoint

**File:** `app/api/events/route.ts`

The Server-Sent Events endpoint that broadcasts events to connected clients.

#### 6.2.1 Ring Buffer

```typescript
type FeedEvent = { id: string; ts: number; type: string; [k: string]: any };

// In-memory circular buffer for event history
const RING = (globalThis as any).__agoraRing__ ??= { 
  buf: [] as FeedEvent[], 
  cap: 2048 
};
let seq = (globalThis as any).__agoraSeq__ ??= 0;

function pushRing(e: Omit<FeedEvent, 'id'>): FeedEvent {
  const full = { ...e, id: String(++seq) };
  RING.buf.push(full);
  if (RING.buf.length > RING.cap) RING.buf.shift(); // FIFO eviction
  return full;
}
```

#### 6.2.2 SSE Response Stream

```typescript
export async function GET(req: NextRequest) {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const enc = (s: string) => writer.write(new TextEncoder().encode(s));

  const headers = {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  } as const;

  // Handle reconnection with last-event-id
  const url = new URL(req.url);
  const lastQ = url.searchParams.get('lastEventId');
  const lastH = req.headers.get('last-event-id');
  const last = lastQ ?? lastH ?? undefined;

  // Replay missed events
  if (last) {
    const sinceId = Number(last);
    const backlog = RING.buf.filter((e) => Number(e.id) > sinceId);
    for (const e of backlog) {
      await enc(`id: ${e.id}\n`);
      await enc(`event: ${e.type}\n`);
      await enc(`data: ${JSON.stringify(e)}\n\n`);
    }
  }

  // Set retry interval hint
  await enc(`retry: 10000\n\n`);

  // Heartbeat every 20 seconds
  const beat = setInterval(() => enc(`:hb ${Date.now()}\n\n`).catch(() => {}), 20_000);

  // Event handler
  const handler = async (msg: any) => {
    try {
      const payload = msg && typeof msg === 'object' ? { ...msg } : {};
      const type = payload.type || 'message';
      const ts = Number.isFinite(payload.ts) ? payload.ts : Date.now();
      const full = pushRing({ ts, type, ...payload });
      await enc(`id: ${full.id}\n`);
      await enc(`event: ${full.type}\n`);
      await enc(`data: ${JSON.stringify(full)}\n\n`);
    } catch {
      close();
    }
  };

  // Subscribe to all event types
  BUS_EVENTS.forEach((t) => onBus(t, handler));

  // Cleanup on disconnect
  const close = () => {
    clearInterval(beat);
    try { BUS_EVENTS.forEach((t) => offBus(t, handler)); } catch {}
    try { writer.close(); } catch {}
  };

  req.signal.addEventListener('abort', close);
  return new NextResponse(readable as any, { headers });
}
```

### 6.3 LiveEventsProvider

**File:** `app/agora/LiveEventsProvider.tsx` (~170 lines)

Client-side SSE consumer wrapped around the app layout.

#### 6.3.1 Topics Configuration

```typescript
export const TOPICS = [
  'dialogue:moves:refresh',
  'dialogue:cs:refresh',
  'claims:edges:changed',
  'cqs:changed',
  'cards:changed',
  'decision:changed',
  'votes:changed',
  'stacks:changed',
  'deliberations:created',
  'comments:changed',
  'xref:changed',
  'citations:changed',
  'dialogue:changed'
] as const;
```

#### 6.3.2 SWR Revalidation Map

```typescript
const KEYMAP: Record<string, (ev: any) => string[]> = {
  'dialogue:moves:refresh': (e) =>
    e?.deliberationId 
      ? [`/api/dialogue/moves?deliberationId=${encodeURIComponent(e.deliberationId)}`] 
      : [],
  'dialogue:changed': (e) =>
    e?.deliberationId 
      ? [`/api/ludics/orthogonal?dialogueId=${encodeURIComponent(e.deliberationId)}`] 
      : [],
  'citations:changed': (e) =>
    e?.targetId 
      ? [`/api/claims/${encodeURIComponent(e.targetId)}/evidence`] 
      : [],
  'decision:changed': () => 
    ['/api/hub/deliberations', '/api/agora/events?since=bootstrap'],
  'comments:changed': (e) =>
    e?.discussionId 
      ? [`/api/discussions/${encodeURIComponent(e.discussionId)}/forum`] 
      : [],
};
```

#### 6.3.3 Safety Backfill Hook

```typescript
function useSafetyBackfill(onEvent: (e: AnyEvent) => void) {
  const lastTsRef = useRef<number>(0);

  useEffect(() => {
    const kick = async () => {
      try {
        const url = lastTsRef.current
          ? `/api/agora/events?since=${lastTsRef.current}`
          : `/api/agora/events?limit=0`;
        const r = await fetch(url, { cache: 'no-store' });
        if (!r.ok) return;
        const j = await r.json();
        const items: AnyEvent[] = Array.isArray(j?.items) ? j.items : [];
        for (const e of items) {
          onEvent(e);
          if (e.ts && e.ts > lastTsRef.current) lastTsRef.current = e.ts;
        }
      } catch {}
    };

    // Triggers
    const onVis = () => { if (document.visibilityState === 'visible') kick(); };
    const onOnline = () => kick();

    // Periodic polling (60 second safety net)
    const id = setInterval(kick, 60_000);
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('online', onOnline);

    kick(); // Initial check

    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('online', onOnline);
    };
  }, [onEvent]);
}
```

#### 6.3.4 Provider Component

```typescript
export function LiveEventsProvider({ children }: { children: React.ReactNode }) {
  const bufRef = useRef<any[]>([]);
  const lastIdRef = useRef<string | null>(
    typeof sessionStorage !== 'undefined' 
      ? sessionStorage.getItem('agora:lastEventId') 
      : null
  );

  const handle = useCallback((raw: any) => {
    let ev: AnyEvent | null = null;
    try { ev = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch {}
    if (!ev || !ev.type) return;

    // 1) Coalesce for local buffer
    bufRef.current = coalesce(bufRef.current, ev);

    // 2) Trigger SWR revalidation
    const keys = new Set(KEYMAP[ev.type]?.(ev) ?? []);
    if (keys.size) {
      queueMicrotask(() => {
        for (const k of keys) swrMutate(k, undefined, { revalidate: true });
      });
    }

    // 3) Legacy bridge (until all consumers migrate)
    try { window.dispatchEvent(new CustomEvent(ev.type, { detail: ev })); } catch {}
  }, []);

  useSafetyBackfill(handle);

  useEffect(() => {
    const qs = lastIdRef.current 
      ? `?lastEventId=${encodeURIComponent(lastIdRef.current)}` 
      : '';
    const es = new EventSource(`/api/events${qs}`);

    const saveId = (id?: string | null) => {
      if (!id) return;
      lastIdRef.current = String(id);
      try { sessionStorage.setItem('agora:lastEventId', String(id)); } catch {}
    };

    // Default message handler
    es.onmessage = (ev: MessageEvent) => {
      const id = (ev as any)?.lastEventId || (ev as any)?.id;
      if (id) saveId(id);
      handle(ev.data);
    };

    // Named topic handlers
    for (const t of TOPICS) {
      es.addEventListener(t, (ev: MessageEvent) => {
        const id = (ev as any)?.lastEventId || (ev as any)?.id;
        if (id) saveId(id);
        try {
          const j = JSON.parse(ev.data as any);
          const flat = j?.payload && typeof j.payload === 'object'
            ? { type: t, ...j.payload }
            : { type: t, ...j };
          handle(flat);
        } catch {}
      });
    }

    es.onerror = () => { /* auto-reconnect built-in */ };

    return () => es.close();
  }, [handle]);

  return <>{children}</>;
}
```

### 6.4 useBusEffect Hook

**File:** `lib/client/useBusEffect.ts` (~140 lines)

Reusable hook for subscribing to SSE events.

#### 6.4.1 Hook Signature

```typescript
export function useBusEffect<T extends BusEvent = BusEvent>(
  topics: Topics<T>,           // "*" | "all" | BusEvent[]
  handler: (e: BusEnvelope<T>) => void,
  opts: Options = {}
)
```

#### 6.4.2 Options

```typescript
type Options = {
  url?: string;              // SSE endpoint (default: "/api/events")
  withCredentials?: boolean; // CORS credentials
  retry?: boolean;           // Auto-retry on error
  maxRetryDelayMs?: number;  // Max backoff (default: 30000)
};
```

#### 6.4.3 Normalization

```typescript
function normalize<T extends BusEvent>(
  raw: any, 
  fallbackType?: T
): BusEnvelope<T> | null {
  if (!raw) return fallbackType ? { type: fallbackType, ts: Date.now() } as any : null;

  // Top-level type present
  if (raw.type) {
    if (raw.payload && typeof raw.payload === 'object') {
      return { type: raw.type, ...raw.payload } as any;
    }
    return raw as BusEnvelope<T>;
  }

  // Fallback for named SSE events
  if (fallbackType) {
    if (raw.payload && typeof raw.payload === 'object') {
      return { type: fallbackType, ...raw.payload } as any;
    }
    return { type: fallbackType, ...raw } as any;
  }

  return null;
}
```

#### 6.4.4 Usage Example

```typescript
// In Agora.tsx
useBusEffect("*", (m) => {
  if (paused) return;
  
  const ev = transformToAgoraEvent(m);
  if (ev) {
    setEvents(prev => coalesce(prev, ev).slice(0, 200));
  }
});

// In CriticalQuestionsV3.tsx
useBusEffect(
  ["cqs:changed", "claims:edges:changed"],
  (e) => {
    if (e.deliberationId === currentDeliberationId) {
      mutate(); // Refresh SWR data
    }
  }
);
```

---

## 7. API Specifications

### 7.1 SSE Events Endpoint

#### GET `/api/events`

Server-Sent Events endpoint for real-time updates.

**Headers:**
```
Content-Type: text/event-stream; charset=utf-8
Cache-Control: no-cache, no-transform
Connection: keep-alive
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `lastEventId` | string | Resume from this event ID (optional) |

**Request Header:**
| Header | Description |
|--------|-------------|
| `Last-Event-ID` | Alternative to query param for resume |

**SSE Message Format:**
```
id: 123
event: dialogue:changed
data: {"type":"dialogue:changed","ts":1704067200000,"deliberationId":"abc123",...}

```

**Event Types Emitted:**
All events from `BUS_EVENTS` are broadcast on this endpoint.

**Heartbeat:**
```
:hb 1704067200000

```
Sent every 20 seconds to keep connection alive.

### 7.2 Agora Events Endpoint

#### GET `/api/agora/events`

Fetch historical events with optional filtering.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 30 | Max events to return (max 100) |
| `since` | number | 0 | Timestamp filter (epoch ms) |

**Response:**
```typescript
{
  items: AgoraEvent[];
}
```

**Data Sources:**
- `DialogueMove` - Recent moves (60% of limit)
- `Citation` - Recent citations (30% of limit)
- `LudicDecisionReceipt` - Recent decisions (30% of limit)

### 7.3 Network Endpoint

#### GET `/api/agora/network`

Get room network graph for Plexus visualization.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `scope` | string | "public" | "public" or "following" |
| `maxRooms` | number | 80 | Maximum rooms to return (max 500) |

**Response:**
```typescript
{
  scope: "public" | "following";
  version: number;     // Cache invalidation timestamp
  rooms: RoomNode[];
  edges: MetaEdge[];
}
```

**Room Data:**
```typescript
type RoomNode = {
  id: string;
  title: string | null;
  nArgs: number;       // Argument count
  nEdges: number;      // ArgumentEdge count
  accepted: number;    // Claims with label='IN'
  rejected: number;    // Claims with label='OUT'
  undecided: number;   // Claims without label
  tags: string[];
  updatedAt: string | null;
  debateSheetId: string | null;
};
```

**Edge Types:**
```typescript
type MetaEdge = {
  from: string;        // Source room ID
  to: string;          // Target room ID
  kind: EdgeKind;      // Edge category
  weight: number;      // Connection strength
};

type EdgeKind = 
  | 'xref'            // Explicit XRef record
  | 'overlap'         // Shared claim text
  | 'stack_ref'       // Reference same stack
  | 'imports'         // RoomFunctor mapping
  | 'shared_author';  // Common contributors
```

### 7.4 Rooms Endpoint

#### GET `/api/agora/rooms`

List all agora rooms.

**Response:**
```typescript
{
  items: Array<{
    id: string;
    slug: string;
    title: string;
    summary: string | null;
    updatedAt: string;
    nDeliberations: number;   // Count of deliberations in room
  }>;
}
```

### 7.5 Room Deliberations Endpoint

#### GET `/api/agora/rooms/[id]/deliberations`

Get deliberations within a specific room.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Room ID |

**Response:**
```typescript
{
  items: Array<{
    id: string;
    title: string | null;
    hostType: string;
    hostId: string;
    createdAt: string;
    updatedAt: string;
  }>;
}
```

### 7.6 Follow Endpoint

#### GET `/api/follow`

Get user's followed rooms and tags.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `kind` | string | Filter by "room" or "tag" (optional) |

**Response:**
```typescript
{
  items: Array<{
    userId: string;
    kind: "room" | "tag";
    targetId: string;
    createdAt: string;
  }>;
}
```

#### POST `/api/follow`

Follow a room or tag.

**Request Body:**
```typescript
{
  kind: "room" | "tag";
  targetId: string;
}
```

**Response:**
```typescript
{ ok: true }
```

#### DELETE `/api/follow`

Unfollow a room or tag.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `kind` | string | "room" or "tag" |
| `targetId` | string | Room ID or tag string |

**Response:**
```typescript
{ ok: true }
```

### 7.7 Edge Metadata Endpoint

#### GET `/api/agora/edge-metadata`

Get detailed metadata for Plexus edges.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `from` | string | Source room ID |
| `to` | string | Target room ID |
| `kind` | EdgeKind | Edge type |

**Response:**
```typescript
{
  ok: boolean;
  kind: EdgeKind;
  // For 'imports':
  mappings?: Array<{ fromClaim: string; toClaim: string }>;
  // For 'shared_author':
  authors?: Array<{ id: string; name: string }>;
  // Additional metadata based on kind
}
```

### 7.8 Hub Deliberations Endpoint

#### GET `/api/hub/deliberations`

Discover deliberations with search and filtering.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Search query |
| `calls` | string | "any" or "open" (has open calls) |
| `tags` | string | Comma-separated tag filter |

**Response:**
```typescript
{
  items: Array<{
    id: string;
    title: string | null;
    host: { type: string } | null;
    tags: string[];
    call: { description: string } | null;
    stats: {
      claims: number;
      openCQs: number;
    };
    updatedAt: string;
  }>;
}
```

### 7.9 XRef Endpoint

#### GET `/api/xref`

Query cross-references (backlinks).

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `toType` | string | Target entity type (e.g., "deliberation") |
| `toId` | string | Target entity ID |

**Response:**
```typescript
{
  items: Array<{
    id: string;
    fromType: string;
    fromId: string;
    toType: string;
    toId: string;
    relation: string;
  }>;
}
```

---

## 8. Plexus Visualization System

### 8.1 System Overview

Plexus is the room relationship visualization subsystem, providing three view modes for exploring how deliberations connect across the platform.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      PLEXUS ARCHITECTURE                                │
└─────────────────────────────────────────────────────────────────────────┘

                    PlexusShell (Agora.tsx)
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │ PlexusBoard │ │   Plexus    │ │PlexusMatrix │
    │  (Card Grid)│ │ (Force Dir) │ │ (Adjacency) │
    └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
           │               │               │
           └───────────────┼───────────────┘
                           │
                           ▼
               ┌───────────────────────┐
               │  /api/agora/network   │
               │  Fetches rooms/edges  │
               └───────────────────────┘
```

### 8.2 PlexusShell Component

**File:** `app/agora/ui/Agora.tsx` (lines 106-210)

Wrapper component that provides view mode switching.

```typescript
function PlexusShell({ scope }: { scope: 'public' | 'following' }) {
  const [view, setView] = useState<'board' | 'graph' | 'matrix'>('board');

  return (
    <div>
      {/* View mode selector */}
      <div className="flex items-center gap-2 p-2 border-b">
        <span className="text-sm text-neutral-600">View:</span>
        {(['board', 'graph', 'matrix'] as const).map((v) => (
          <button
            key={v}
            className={clsx('px-3 py-1 text-sm rounded', 
              view === v ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'
            )}
            onClick={() => setView(v)}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Conditional view rendering */}
      {view === 'board'  && <PlexusBoard scope={scope} />}
      {view === 'graph'  && <Plexus scope={scope} />}
      {view === 'matrix' && <PlexusMatrix scope={scope} />}
    </div>
  );
}
```

### 8.3 Plexus (Force-Directed Graph)

**File:** `components/agora/Plexus.tsx` (1010 lines)

Interactive node-link visualization of room network.

#### 8.3.1 Key Features

- **Force-directed layout** - Nodes repel, edges attract
- **Edge filtering** - Toggle edge types on/off
- **Confidence gating** - Filter by DS/min/product confidence
- **Edge bundling** - Combine parallel edges
- **Room selection** - Click to select, hover for preview
- **Link sketching** - Draw new edges between rooms
- **Metadata tooltips** - Hover edge for detailed info

#### 8.3.2 State Management

```typescript
// Filter state (persisted to localStorage)
const [edgeOn, setEdgeOn] = usePersistentState<Record<EdgeKind, boolean>>(
  'plexus:edgeOn',
  { xref: true, overlap: true, stack_ref: true, imports: true, shared_author: false }
);
const [bundleEdges, setBundleEdges] = usePersistentState<boolean>('plexus:bundle', true);
const [orderBy, setOrderBy] = usePersistentState<OrderBy>('plexus:order', 'recent');
const [labelMode, setLabelMode] = usePersistentState<LabelMode>('plexus:labels', 'auto');
const [q, setQ] = usePersistentState<string>('plexus:q', '');

// Selection state
const [sel, setSel] = useState<string[]>([]); // Up to 2 rooms for link creation
const [hoverRoom, setHoverRoom] = useState<string | null>(null);
const [hoverEdge, setHoverEdge] = useState<MetaEdge | null>(null);
const [edgeMetadata, setEdgeMetadata] = useState<any>(null);
```

#### 8.3.3 Confidence Integration

```typescript
const { mode, tau } = useConfidence();
const prefetch = useRoomGraphPrefetch();

// Fetch confidence-gated support percentages
const fetchGated = useCallback(async (rid: string) => {
  if (gatedShare.current.has(rid)) return gatedShare.current.get(rid)!;
  
  const qs = new URLSearchParams({ 
    semantics: 'preferred', 
    mode, 
    ...(tau != null ? { confidence: String(tau) } : {}) 
  });
  
  const r = await fetch(`/api/deliberations/${rid}/graph?${qs}`, { cache: 'no-store' });
  const g = await r?.json();
  
  const total = Array.isArray(g?.nodes) ? g.nodes.length : 0;
  const inCount = total ? g.nodes.filter((n: any) => n.label === 'IN').length : 0;
  const share = total ? inCount / total : 0;
  
  gatedShare.current.set(rid, share);
  return share;
}, [mode, tau]);
```

#### 8.3.4 Live Event Refresh

```typescript
useEffect(() => {
  const bump = () => mutate();
  const evts = [
    'dialogue:changed',
    'xref:changed',
    'deliberations:created',
    'plexus:links:changed',
    'roomFunctor:changed'
  ];
  evts.forEach((t) => window.addEventListener(t, bump as any));
  return () => evts.forEach((t) => window.removeEventListener(t, bump as any));
}, [mutate]);
```

#### 8.3.5 Edge Color Scheme

```typescript
const EDGE_COLORS: Record<EdgeKind, string> = {
  xref: '#6366f1',          // Indigo
  overlap: '#ef4444',       // Red
  stack_ref: '#f59e0b',     // Amber
  imports: '#14b8a6',       // Teal
  shared_author: '#64748b', // Slate
};

const EDGE_LABELS: Record<EdgeKind, string> = {
  xref: 'Cross‑ref',
  overlap: 'Overlap',
  stack_ref: 'Stack ref',
  imports: 'Imports',
  shared_author: 'Shared author'
};
```

### 8.4 PlexusBoard (Card Grid)

**File:** `components/agora/PlexusBoard.tsx` (960 lines)

Card-based board view showing rooms as cards with edge lines.

#### 8.4.1 Key Features

- **Grid layout** - Responsive card arrangement
- **Edge lines** - SVG lines connecting related rooms
- **Metrics display** - Arguments, edges, acceptance rates
- **Sorting options** - Recent, size, acceptance, alphabetical
- **Search filtering** - Filter by title or tags
- **Quick actions** - Open room, create links

#### 8.4.2 Card Component

```typescript
function RoomCard({ room, isSelected, onSelect, onHover }: {
  room: RoomNode;
  isSelected: boolean;
  onSelect: () => void;
  onHover: (hover: boolean) => void;
}) {
  const total = room.accepted + room.rejected + room.undecided;
  const acceptShare = total ? room.accepted / total : 0;

  return (
    <div
      className={clsx(
        "rounded-xl border p-3 cursor-pointer transition",
        isSelected ? "ring-2 ring-indigo-500" : "hover:bg-slate-50"
      )}
      onClick={onSelect}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      <div className="font-medium truncate">{room.title ?? room.id.slice(0, 12)}</div>
      
      <div className="flex gap-2 mt-2 text-xs text-slate-600">
        <span>Args: {room.nArgs}</span>
        <span>Edges: {room.nEdges}</span>
      </div>
      
      <div className="mt-2 h-2 bg-slate-200 rounded overflow-hidden">
        <div 
          className="h-full bg-emerald-500" 
          style={{ width: `${acceptShare * 100}%` }}
        />
      </div>
      
      {room.tags?.length && (
        <div className="mt-2 flex flex-wrap gap-1">
          {room.tags.slice(0, 3).map(t => (
            <span key={t} className="text-[10px] px-1 py-0.5 rounded bg-slate-100">
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 8.5 PlexusMatrix (Adjacency Matrix)

**File:** `components/agora/PlexusMatrix.tsx` (331 lines)

Matrix visualization showing room-to-room relationships.

#### 8.5.1 Key Features

- **Canvas rendering** - Efficient for large matrices
- **Edge bundling** - Multiple edge types per cell
- **Hover details** - Cell tooltip with edge info
- **Minimap** - Overview for navigation
- **Scroll sync** - Synchronized row/column headers

#### 8.5.2 Matrix Rendering

```typescript
// Build cell data
type Cell = { [K in EdgeKind]?: number };
const bundle = useMemo(() => {
  const m = new Map<string, Cell>();
  const key = (i: number, j: number) => i <= j ? `${i}|${j}` : `${j}|${i}`;
  
  for (const e of data.edges) {
    const i = idx.get(e.from), j = idx.get(e.to);
    if (i == null || j == null) continue;
    
    const k = key(i, j);
    const cell = m.get(k) ?? {};
    cell[e.kind] = (cell[e.kind] || 0) + e.weight;
    m.set(k, cell);
  }
  return m;
}, [data.edges, idx]);

// Canvas drawing
useEffect(() => {
  const ctx = canvasRef.current?.getContext('2d');
  if (!ctx) return;
  
  ctx.clearRect(0, 0, width, height);
  
  for (let i = 0; i < N; i++) {
    for (let j = i; j < N; j++) {
      const cell = bundle.get(`${i}|${j}`);
      if (!cell) continue;
      
      // Draw colored segments for each edge type
      let offset = 0;
      for (const [kind, weight] of Object.entries(cell)) {
        if (!onKinds[kind as EdgeKind]) continue;
        ctx.fillStyle = KCOL[kind as EdgeKind];
        ctx.fillRect(
          CELL_SIZE * j + offset,
          CELL_SIZE * i,
          Math.ceil(CELL_SIZE * (weight / maxWeight)),
          CELL_SIZE
        );
        offset += 4;
      }
    }
  }
}, [bundle, N, onKinds]);
```

### 8.6 PlexusRoomMetrics

**File:** `components/agora/PlexusRoomMetrics.tsx` (~100 lines)

Detailed metrics display for a selected room.

```typescript
export default function PlexusRoomMetrics({ roomId }: { roomId: string }) {
  const { data } = useSWR(
    roomId ? `/api/agora/room-metrics?id=${roomId}` : null,
    fetcher
  );

  if (!data) return <div>Loading...</div>;

  return (
    <div className="rounded-xl border bg-white/70 p-4">
      <h3 className="font-semibold">{data.title ?? roomId.slice(0, 12)}</h3>
      
      <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
        <div>
          <div className="text-slate-500">Arguments</div>
          <div className="text-xl font-medium">{data.nArgs}</div>
        </div>
        <div>
          <div className="text-slate-500">Edges</div>
          <div className="text-xl font-medium">{data.nEdges}</div>
        </div>
        <div>
          <div className="text-slate-500">Acceptance Rate</div>
          <div className="text-xl font-medium text-emerald-600">
            {((data.accepted / (data.accepted + data.rejected + data.undecided)) * 100).toFixed(1)}%
          </div>
        </div>
        <div>
          <div className="text-slate-500">Last Updated</div>
          <div className="text-sm">{new Date(data.updatedAt).toLocaleDateString()}</div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <a href={`/deliberation/${roomId}`} className="btn">Open</a>
        {data.debateSheetId && (
          <a href={`/sheet/${data.debateSheetId}`} className="btn-outline">Sheet</a>
        )}
      </div>
    </div>
  );
}
```

### 8.7 useConfidence Hook

**File:** `components/agora/useConfidence.tsx`

Context for confidence mode selection across Plexus and debate sheets.

```typescript
type ConfidenceMode = 'min' | 'product' | 'ds';

interface ConfidenceContext {
  mode: ConfidenceMode;
  setMode: (m: ConfidenceMode) => void;
  tau: number | null;      // Threshold for DS mode
  setTau: (t: number | null) => void;
}

export function useConfidence(): ConfidenceContext {
  // Context implementation with localStorage persistence
}
```

### 8.8 ConfidenceControls Component

**File:** `components/agora/ConfidenceControls.tsx`

UI for selecting confidence mode.

```typescript
export function ConfidenceControls() {
  const { mode, setMode, tau, setTau } = useConfidence();

  return (
    <div className="flex items-center gap-3 text-sm">
      <label>Confidence:</label>
      <select 
        value={mode} 
        onChange={(e) => setMode(e.target.value as ConfidenceMode)}
        className="border rounded px-2 py-1"
      >
        <option value="product">Product</option>
        <option value="min">Min</option>
        <option value="ds">Dempster-Shafer</option>
      </select>
      
      {mode === 'ds' && (
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={tau ?? 0.5}
          onChange={(e) => setTau(Number(e.target.value))}
          className="w-24"
        />
      )}
    </div>
  );
}
```

---

## 9. Following & Subscription System

### 9.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    FOLLOWING SYSTEM ARCHITECTURE                        │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                         Client Layer                                    │
│                                                                         │
│  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐   │
│  │  useFollowing()   │  │useStackFollowing()│  │   EventCard       │   │
│  │                   │  │                   │  │   Follow Buttons  │   │
│  │ • roomSet        │  │ • stackSet        │  │                   │   │
│  │ • tagSet         │  │ • isFollowingStack│  │ • onFollow()     │   │
│  │ • followRoom()   │  │                   │  │ • onUnfollow()   │   │
│  │ • unfollowRoom() │  │                   │  │                   │   │
│  │ • followTag()    │  │                   │  │                   │   │
│  │ • unfollowTag()  │  │                   │  │                   │   │
│  └─────────┬─────────┘  └─────────┬─────────┘  └─────────┬─────────┘   │
│            │                      │                      │             │
│            └──────────────────────┼──────────────────────┘             │
│                                   │                                     │
└───────────────────────────────────┼─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          API Layer                                      │
│                                                                         │
│  ┌───────────────────────────┐    ┌───────────────────────────────┐    │
│  │      /api/follow          │    │   /api/stacks/subscriptions    │    │
│  │                           │    │                               │    │
│  │  GET    → List follows    │    │  GET → List subscribed stacks │    │
│  │  POST   → Follow          │    │                               │    │
│  │  DELETE → Unfollow        │    │                               │    │
│  └─────────────┬─────────────┘    └───────────────┬───────────────┘    │
│                │                                   │                    │
└────────────────┼───────────────────────────────────┼────────────────────┘
                 │                                   │
                 ▼                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Database Layer                                   │
│                                                                         │
│  ┌───────────────────────────┐    ┌───────────────────────────────┐    │
│  │      AgoraFollow          │    │    StackSubscription          │    │
│  │                           │    │                               │    │
│  │  userId + kind + targetId │    │  userId + stackId             │    │
│  │  (composite PK)           │    │  (composite PK)               │    │
│  └───────────────────────────┘    └───────────────────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 9.2 useFollowing Hook

**File:** `lib/client/useFollowing.ts`

Primary hook for room and tag following state.

```typescript
type Item = {
  userId: string;
  kind: "room" | "tag";
  targetId: string;
  createdAt: string;
};

export function useFollowing() {
  const { data, mutate } = useSWR<{ items: Item[] }>(
    "/api/follow",
    fetcher,
    { revalidateOnFocus: false }
  );

  const items = data?.items ?? [];

  // Build lookup sets for O(1) checks
  const roomSet = new Set(
    items.filter((i) => i.kind === "room").map((i) => i.targetId)
  );
  const tagSet = new Set(
    items.filter((i) => i.kind === "tag").map((i) => i.targetId.toLowerCase())
  );

  // Follow/unfollow mutations
  async function follow(kind: "room" | "tag", targetId: string) {
    await fetch("/api/follow", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind, targetId }),
    });
    mutate(); // Revalidate
  }

  async function unfollow(kind: "room" | "tag", targetId: string) {
    const p = new URLSearchParams({ kind, targetId });
    await fetch(`/api/follow?${p.toString()}`, { method: "DELETE" });
    mutate();
  }

  // Convenience helpers
  const isFollowingRoom = (deliberationId?: string | null) =>
    !!deliberationId && roomSet.has(deliberationId);
  
  const isFollowingTag = (tag?: string) =>
    !!tag && tagSet.has(tag.toLowerCase());

  const followRoom = (id: string) => follow("room", id);
  const unfollowRoom = (id: string) => unfollow("room", id);
  const followTag = (tag: string) => follow("tag", tag);
  const unfollowTag = (tag: string) => unfollow("tag", tag);

  return {
    items,
    roomSet,
    tagSet,
    isFollowingRoom,
    isFollowingTag,
    followRoom,
    unfollowRoom,
    followTag,
    unfollowTag,
    mutate,
  };
}
```

### 9.3 useStackFollowing Hook

**File:** `lib/client/useStackFollowing.ts`

Hook for stack subscription state.

```typescript
export function useStackFollowing() {
  const { data } = useSWR<{ items: string[] }>(
    "/api/stacks/subscriptions",
    fetcher,
    { revalidateOnFocus: false }
  );

  const set = new Set((data?.items ?? []).map(String));
  
  const isFollowingStack = (id?: string) => !!(id && set.has(id));

  return { stackSet: set, isFollowingStack };
}
```

### 9.4 Integration with Feed Filtering

The following system integrates with the Agora feed to filter events:

```typescript
// In Agora.tsx
const filtered = useMemo(() => {
  if (tab !== "following") return events;
  if (!hasFollowData) return events; // Show all if no data yet

  return events.filter((e) => {
    // Check room following
    const inRooms = e.deliberationId ? roomSet.has(e.deliberationId) : false;
    
    // Check tag following
    const inTags = (e.chips || []).some((c) => isFollowingTag(c));
    
    // Check stack following for stack events
    const inStacks =
      (e.type === "stacks:changed" || e.type === "comments:changed") &&
      (e as any).link?.includes("/stacks/")
        ? isFollowingStack((e as any).link.split("/stacks/")[1])
        : false;

    // Check citations linked to followed rooms/stacks
    const cit = e.type === "citations:changed" ? (e as any) : null;
    const citInRoom = cit?.deliberationId ? roomSet.has(cit.deliberationId) : false;
    const citInStack = cit?.contextLink?.includes("/stacks/")
      ? isFollowingStack(cit.contextLink.split("/stacks/")[1].split("#")[0])
      : false;

    return inRooms || inTags || inStacks || citInRoom || citInStack;
  });
}, [events, tab, roomSet, isFollowingTag, isFollowingStack, hasFollowData]);
```

### 9.5 Follow Event Propagation

When follow state changes, dispatch custom event for cross-component sync:

```typescript
async function doFollow(roomId: string) {
  setPendingOn(roomId, true);
  try {
    await followRoom(roomId);
    flashOk(roomId);
    
    // Broadcast to other components
    window.dispatchEvent(
      new CustomEvent("follow:changed", {
        detail: { kind: "room", id: roomId, following: true },
      })
    );
  } finally {
    setPendingOn(roomId, false);
  }
}
```

---

## 10. Deliberation Integration

### 10.1 Integration Overview

The Agora system serves as the discovery and navigation layer for the Mesh deliberation infrastructure. It provides multiple entry points into deliberations and maintains bidirectional connections with the argumentation system.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                  AGORA ↔ DELIBERATION INTEGRATION                       │
└─────────────────────────────────────────────────────────────────────────┘

                         ┌─────────────────────┐
                         │     AGORA FEED      │
                         │                     │
                         │  • Event Discovery  │
                         │  • Following        │
                         │  • Plexus Nav       │
                         └──────────┬──────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
     ┌────────────────┐   ┌────────────────┐   ┌────────────────┐
     │  Feed Events   │   │  Debates View  │   │  Plexus View   │
     │                │   │                │   │                │
     │ dialogue:*     │   │ DebateSheet    │   │ Room Network   │
     │ citations:*    │   │ Reader         │   │ Visualization  │
     │ decision:*     │   │                │   │                │
     └───────┬────────┘   └───────┬────────┘   └───────┬────────┘
             │                    │                    │
             └────────────────────┼────────────────────┘
                                  │
                                  ▼
              ┌─────────────────────────────────────────┐
              │           DELIBERATION SYSTEM           │
              │                                         │
              │  ┌─────────────┐  ┌─────────────┐      │
              │  │ Arguments   │  │  Claims     │      │
              │  │ Schemes     │  │  Evidence   │      │
              │  │ Chains      │  │  Decisions  │      │
              │  └─────────────┘  └─────────────┘      │
              │                                         │
              │  ┌─────────────┐  ┌─────────────┐      │
              │  │ Dialogue    │  │  ASPIC+     │      │
              │  │ Moves       │  │  Semantics  │      │
              │  └─────────────┘  └─────────────┘      │
              └─────────────────────────────────────────┘
```

### 10.2 Event Integration Points

#### 10.2.1 Dialogue Events

When dialogue moves are created, events flow to Agora:

```typescript
// In dialogue move creation API
import { emitBus } from "@/lib/server/bus";

export async function POST(req: NextRequest) {
  const move = await prisma.dialogueMove.create({
    data: { ... }
  });

  // Emit event for Agora consumption
  emitBus("dialogue:moves:refresh", {
    deliberationId: move.deliberationId,
    moveId: move.id,
    kind: move.kind,
  });

  return NextResponse.json({ ok: true, move });
}
```

**Event Mapping in Agora.tsx:**
```typescript
case "dialogue:moves:refresh":
  ev = {
    id: `mv:${m.moveId || ts}`,
    type: "dialogue:changed",
    ts,
    title: `New move${m.kind ? ` (${m.kind})` : ""}`,
    meta: m.deliberationId ? `room:${m.deliberationId.slice(0, 6)}…` : undefined,
    chips: m.kind ? [m.kind] : [],
    link: m.deliberationId ? `/deliberation/${m.deliberationId}` : undefined,
    deliberationId: m.deliberationId,
    icon: "move",
  };
  break;
```

#### 10.2.2 Citation Events

When citations are added to claims or comments:

```typescript
// In citation creation API
emitBus("citations:changed", {
  targetType: citation.targetType,     // "claim" | "comment"
  targetId: citation.targetId,
  sourceId: citation.sourceId,
  url: source.url,
  quote: citation.quote,
  note: citation.note,
  deliberationId: derivedDelibId,
});
```

**Event Mapping:**
```typescript
case "citations:changed": {
  const titleTxt = niceTitle(m);
  const targetLabel = m.targetType === "comment" ? "Comment"
    : m.targetType === "claim" ? "Claim" : m.targetType || "Target";

  ev = {
    id: `ct:${ts}:${m.sourceId || ""}:${m.targetId || ""}`,
    type: "citations:changed",
    ts,
    title: `Added source: ${titleTxt}`,
    meta: `${targetLabel}${domainLabel}${preview}`,
    chips: [quoteChip, noteChip, kindChip].filter(Boolean),
    link: m.url || contextLink,
    contextLink,
    icon: "link",
    deliberationId: m.deliberationId,
  };
  break;
}
```

#### 10.2.3 Decision Events

When claims are accepted or rejected:

```typescript
// In decision recording API
emitBus("decision:changed", {
  deliberationId: decision.deliberationId,
  kind: decision.kind,        // "accept" | "reject" | "defer"
  rationale: decision.rationale,
});
```

**Event Mapping:**
```typescript
case "decision:changed":
  ev = {
    id: `dc:${ts}`,
    type: "decision:changed",
    ts,
    title: "Decision recorded",
    meta: m.rationale || "",
    chips: [m.kind || "decision"],
    link: m.deliberationId ? `/deliberation/${m.deliberationId}` : undefined,
    deliberationId: m.deliberationId,
    icon: "check",
  };
  break;
```

### 10.3 Debates View

The Debates view provides direct navigation into the deliberation system:

#### 10.3.1 Picker Hierarchy

```
RoomPicker → DebatePicker → SheetPicker → DebateSheetReader
    │             │              │
    ▼             ▼              ▼
/api/agora/   /api/agora/    /api/sheets/
rooms         rooms/[id]/    by-deliberation/
              deliberations  [id]
```

#### 10.3.2 RoomPicker Component

**File:** `components/agora/RoomAndDebatePickers.tsx`

```typescript
export function RoomPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (id: string) => void;
}) {
  const { data } = useSWR('/api/agora/rooms', fetcher);
  const rooms = data?.items ?? [];

  return (
    <div className="flex items-center gap-2 text-sm">
      <label>Room:</label>
      <select
        className="menuv2--lite rounded px-2 py-1"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      >
        {!value && <option value="">Select…</option>}
        {rooms.map((r: any) => (
          <option key={r.id} value={r.id}>
            {r.title ?? r.slug}
          </option>
        ))}
      </select>
    </div>
  );
}
```

#### 10.3.3 DebatePicker Component

```typescript
export function DebatePicker({
  roomId,
  value,
  onChange,
}: {
  roomId?: string | null;
  value: string | null;
  onChange: (id: string) => void;
}) {
  const { data } = useSWR(
    roomId ? `/api/agora/rooms/${roomId}/deliberations` : null,
    fetcher
  );
  const debates = data?.items ?? [];

  if (!roomId) return null;

  return (
    <div className="flex items-center gap-2 text-sm">
      <label>Debate:</label>
      <select
        className="menuv2--lite w-full rounded px-2 py-1"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      >
        {!value && <option value="">Select…</option>}
        {debates.map((d: any) => (
          <option key={d.id} value={d.id}>
            {d.title}
          </option>
        ))}
      </select>
    </div>
  );
}
```

#### 10.3.4 SheetPicker Component

```typescript
export function SheetPicker({
  deliberationId,
  value,
  onChange,
}: {
  deliberationId?: string | null;
  value: string | null;
  onChange: (id: string) => void;
}) {
  const { data } = useSWR(
    deliberationId ? `/api/sheets/by-deliberation/${deliberationId}` : null,
    fetcher
  );
  const curated = data?.items ?? [];

  if (!deliberationId) return null;

  return (
    <div className="flex items-center gap-2 text-sm">
      <label>Sheet:</label>
      <select
        className="menuv2--lite rounded px-2 py-1"
        value={value ?? `delib:${deliberationId}`}
        onChange={(e) => onChange(e.target.value)}
      >
        {/* Synthetic sheet from live deliberation */}
        <option value={`delib:${deliberationId}`}>Live (synthetic)</option>
        
        {/* Curated sheets */}
        {curated.map((s: any) => (
          <option key={s.id} value={s.id}>
            {s.title ?? s.id.slice(0, 18) + '…'}
          </option>
        ))}
      </select>
    </div>
  );
}
```

### 10.4 DebateSheetReader Integration

**File:** `components/agora/DebateSheetReader.tsx` (533 lines)

The DebateSheetReader provides a spreadsheet-like view of arguments within a deliberation.

#### 10.4.1 Data Flow

```
                    DebateSheetReader
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
   /api/deliberations   useConfidence   useAuth
   /[id]/arguments/full  (mode, tau)    (userId)
          │
          ▼
   ┌─────────────────────────────────────────┐
   │         Unified Argument Data           │
   │                                         │
   │  • id, text, kind                       │
   │  • aif: { nodes, edges, schemes }       │
   │  • support: scalar or DS interval       │
   │  • premises, conclusions                │
   └────────────────────────┬────────────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
       DebateSheet    ArgumentNetwork   SupportBar
       Header/Filters      Card
```

#### 10.4.2 Props Interface

```typescript
export default function DebateSheetReader({ 
  sheetId,           // Legacy: "delib:xxx" or sheet ID
  deliberationId     // New: direct deliberation ID
}: { 
  sheetId?: string; 
  deliberationId?: string;
}) {
  // Extract deliberationId from sheetId if needed
  const delibId = useMemo(() => {
    if (deliberationId) return deliberationId;
    if (sheetId?.startsWith("delib:")) return sheetId.slice("delib:".length);
    return null;
  }, [deliberationId, sheetId]);
  
  // ...
}
```

#### 10.4.3 Unified Data Fetch

```typescript
const { data: fullData, mutate: refetchData } = useSWR(
  delibId 
    ? `/api/deliberations/${delibId}/arguments/full?limit=500&mode=${mode}&imports=${imports}` 
    : null,
  (u: string) => fetch(u, { cache: 'no-store' }).then(r => r.json()),
  { revalidateOnFocus: false }
);

// Build lookup maps
const argumentById = useMemo(() => {
  const m = new Map<string, any>();
  if (fullData?.items) {
    for (const item of fullData.items) {
      m.set(item.id, item);
    }
  }
  return m;
}, [fullData]);
```

#### 10.4.4 Confidence Mode Integration

```typescript
const { mode, setMode } = useConfidence();
const [imports, setImports] = useState<'off' | 'materialized' | 'virtual' | 'all'>('off');

// Mode affects how support values are computed
// - 'product': Multiply path probabilities
// - 'min': Take minimum along path
// - 'ds': Dempster-Shafer intervals [bel, pl]
```

### 10.5 Hub Component

**File:** `app/hub/ui/Hub.tsx`

Deliberations discovery dashboard accessible from Agora.

```typescript
export default function Hub() {
  const [q, setQ] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [calls, setCalls] = useState<"any" | "open">("any");

  const params = new URLSearchParams({ q, calls, tags: tags.join(",") });
  const key = `/api/hub/deliberations?${params.toString()}`;
  const { data, mutate } = useSWR(key, fetcher);

  // Live refresh on relevant events
  useBusMutate(
    [
      "deliberations:created",
      "decision:changed",
      "votes:changed",
      "dialogue:changed",
      "comments:changed",
      "xref:changed"
    ],
    key,
    undefined,
    150
  );

  const items = data?.items ?? [];

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      {/* Search and filters */}
      <div className="flex gap-2 items-center">
        <input placeholder="Search…" value={q} onChange={e => setQ(e.target.value)} />
        <select value={calls} onChange={e => setCalls(e.target.value as any)}>
          <option value="any">All deliberations</option>
          <option value="open">Open calls for input</option>
        </select>
      </div>

      {/* Deliberation cards */}
      <div className="grid md:grid-cols-2 gap-3">
        {items.map((d: any) => (
          <DeliberationCard key={d.id} deliberation={d} />
        ))}
      </div>
    </div>
  );
}
```

### 10.6 DelibsDashboard Component

**File:** `app/(root)/(standard)/profile/deliberations/ui/DelibsDashboard.tsx`

User's personal deliberations management with Agora integration.

```typescript
export default function DelibsDashboard({ initialItems }: { initialItems: Item[] }) {
  const router = useRouter();
  const { isFollowingRoom, followRoom, unfollowRoom } = useFollowing();

  return (
    <div className="mx-auto max-w-5xl p-4 space-y-6">
      {/* Header with Agora link */}
      <div className="flex items-center justify-between">
        <div className="text-[1.8rem] font-semibold">Your Deliberations</div>
        <button
          onClick={() => router.push("/agora")}
          className="px-3 py-1.5 rounded-xl bg-amber-300 text-black text-sm"
        >
          Open Agora
        </button>
      </div>

      {/* Deliberation table with follow actions */}
      <table>
        <tbody>
          {items.map((i) => (
            <tr key={i.id}>
              <td>{i.title || i.id}</td>
              <td>
                {isFollowingRoom(i.id) ? (
                  <button onClick={() => unfollowRoom(i.id)}>Following ✓</button>
                ) : (
                  <button onClick={() => followRoom(i.id)}>Follow</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### 10.7 Cross-Room Navigation (XRef)

The Agora RightRail displays backlinks between deliberations:

```typescript
// In RightRail.tsx
const { data } = useSWR(
  toDelib 
    ? `/api/xref?toType=deliberation&toId=${encodeURIComponent(toDelib)}` 
    : null,
  fetcher,
  { revalidateOnFocus: false }
);
const backlinks = data?.items ?? [];

// Render backlinks
{backlinks.map((x: any) => (
  <li key={x.id} className="flex items-center justify-between gap-2">
    <span>{x.relation} from {x.fromType}:{x.fromId.slice(0, 6)}…</span>
    {x.fromType === 'deliberation' && (
      <a href={`/deliberation/${x.fromId}`}>Open</a>
    )}
  </li>
))}
```

---

## 11. Performance & Scalability

### 11.1 Current Architecture Characteristics

#### 11.1.1 In-Memory Event Storage

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CURRENT STATE (In-Memory)                            │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                      Server Process                                     │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  globalThis.__agoraRing__                                       │   │
│  │                                                                 │   │
│  │  Ring Buffer (2048 events)                                      │   │
│  │  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐             │   │
│  │  │ E1  │ E2  │ E3  │ ... │E2046│E2047│E2048│     │             │   │
│  │  └─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘             │   │
│  │                                               ▲                 │   │
│  │                                               │                 │   │
│  │                                          New events             │   │
│  │                                          push here              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Limitations:                                                           │
│  • Lost on server restart                                               │
│  • No persistence across instances                                      │
│  • Fixed capacity (2048)                                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 11.1.2 Connection Limits

```
EventEmitter.defaultMaxListeners = 50

→ Maximum ~50 concurrent SSE connections per process
→ Each connection = one browser tab
→ Horizontal scaling requires shared state
```

### 11.2 Client-Side Optimizations

#### 11.2.1 Event Coalescing

Reduces UI noise by bundling similar events:

```typescript
// Without coalescing: 10 dialogue moves = 10 cards
// With coalescing: 10 dialogue moves in 3 min = 1 bundle card

const BUNDLE_WINDOW_MS = 3 * 60 * 1000;  // 3 minute window

function coalesce(prev: AgoraEvent[], ev: AgoraEvent): AgoraEvent[] {
  // Find existing bundle for same room within window
  const i = prev.findIndex((e) =>
    e.type === 'bundle' &&
    e.deliberationId === ev.deliberationId &&
    ev.ts - e.ts <= BUNDLE_WINDOW_MS
  );

  if (i >= 0) {
    // Update existing bundle
    const b = prev[i];
    const kinds = { ...b.kinds };
    kinds[ev.chips?.[0] || 'MOVE'] = (kinds[ev.chips?.[0] || 'MOVE'] || 0) + 1;
    const upd = { ...b, ts: ev.ts, kinds };
    return [upd, ...prev.filter((_, idx) => idx !== i)];
  }

  // No bundle, add new event
  return [ev, ...prev];
}
```

#### 11.2.2 Feed Capping

```typescript
// In Agora.tsx useBusEffect handler
if (ev) setEvents((prev) => coalesce(prev, ev).slice(0, 200));
//                                             ^^^^^^^^^^^^^^
//                                             Cap at 200 events

// In LiveEventsProvider coalesce
return [ev, ...prev].slice(0, FEED_CAP);
//                          ^^^^^^^^
//                          FEED_CAP = 300
```

#### 11.2.3 SWR Caching

```typescript
// Data fetching with SWR caching and deduplication
const { data } = useSWR(
  `/api/agora/network?scope=${scope}`,
  fetcher,
  { revalidateOnFocus: false }  // Don't refetch on tab focus
);

// Targeted revalidation via KEYMAP
const keys = new Set(KEYMAP[ev.type]?.(ev) ?? []);
if (keys.size) {
  queueMicrotask(() => {
    for (const k of keys) swrMutate(k, undefined, { revalidate: true });
  });
}
```

### 11.3 Safety Backfill Mechanism

Handles edge cases of missed events:

```typescript
function useSafetyBackfill(onEvent: (e: AnyEvent) => void) {
  useEffect(() => {
    const kick = async () => {
      // Fetch events since last known timestamp
      const url = lastTsRef.current
        ? `/api/agora/events?since=${lastTsRef.current}`
        : `/api/agora/events?limit=0`;
      // ...
    };

    // Trigger backfill on:
    // 1. Tab becomes visible (visibilitychange)
    // 2. Network comes back online
    // 3. Every 60 seconds (safety net)

    const id = setInterval(kick, 60_000);
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('online', onOnline);
    // ...
  }, [onEvent]);
}
```

### 11.4 Scaling Recommendations

#### 11.4.1 Redis-Backed Event Store

For production scalability:

```typescript
// Proposed: Replace in-memory ring with Redis Streams

import { Redis } from "@upstash/redis";

const redis = new Redis({ /* config */ });

async function pushEvent(event: FeedEvent) {
  await redis.xadd(
    "agora:events",
    "*",  // Auto-generate ID
    { data: JSON.stringify(event) }
  );
  
  // Trim to keep last N events
  await redis.xtrim("agora:events", { strategy: "MAXLEN", threshold: 10000 });
}

async function getEventsSince(lastId: string) {
  return redis.xrange("agora:events", lastId, "+", 100);
}
```

#### 11.4.2 Horizontal Scaling with Redis Pub/Sub

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PROPOSED: Redis Pub/Sub Architecture                 │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Instance 1 │  │  Instance 2 │  │  Instance 3 │
│             │  │             │  │             │
│ EventSource │  │ EventSource │  │ EventSource │
│ connections │  │ connections │  │ connections │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       └────────────────┼────────────────┘
                        │
                        ▼
           ┌────────────────────────┐
           │      Redis Pub/Sub     │
           │                        │
           │  Channel: agora:events │
           └────────────────────────┘
                        │
                        ▼
           ┌────────────────────────┐
           │    Redis Streams       │
           │                        │
           │  Stream: agora:events  │
           │  (persistent history)  │
           └────────────────────────┘
```

#### 11.4.3 Connection Pooling

For high connection count:

```typescript
// Proposed: Use connection pooling service
// e.g., Pusher, Ably, or self-hosted solution

// Instead of direct EventSource:
const socket = new PusherClient('app_key', {
  cluster: 'us2',
  forceTLS: true
});

const channel = socket.subscribe('agora-events');
channel.bind('event', (data: AgoraEvent) => {
  handle(data);
});
```

### 11.5 Performance Metrics

#### 11.5.1 Current Characteristics

| Metric | Value | Notes |
|--------|-------|-------|
| Max concurrent connections | ~50/process | EventEmitter limit |
| Event buffer size | 2048 | In-memory ring |
| Client feed cap | 200-300 | UI responsiveness |
| Heartbeat interval | 20s | Keep-alive |
| Safety backfill | 60s | Polling fallback |
| Bundle window (dialogue) | 3 min | Coalescing |
| Bundle window (citations) | 2 min | Coalescing |

#### 11.5.2 Recommendations for Scale

| Scale | Recommendation |
|-------|----------------|
| < 100 concurrent users | Current architecture sufficient |
| 100-1000 users | Add Redis Streams for persistence |
| 1000-10000 users | Redis Pub/Sub + connection pooling |
| > 10000 users | Dedicated real-time service (Pusher/Ably) |

---

## 12. Appendices

### A.1 File Reference

#### A.1.1 Frontend Components

| File | Location | Purpose |
|------|----------|---------|
| Agora.tsx | `app/agora/ui/Agora.tsx` | Main feed component (832 lines) |
| EventCard.tsx | `app/agora/ui/EventCard.tsx` | Event card display (~175 lines) |
| TopBar.tsx | `app/agora/ui/TopBar.tsx` | Navigation header (~122 lines) |
| RightRail.tsx | `app/agora/ui/RightRail.tsx` | Context panel (~90 lines) |
| FiltersPanel.tsx | `app/agora/ui/FiltersPanels.tsx` | Filter sidebar (~15 lines) |
| StackSummaryCard.tsx | `app/agora/ui/StackSummaryCard.tsx` | Stack info (~30 lines) |
| page.tsx | `app/agora/page.tsx` | Server entry point |
| LiveEventsProvider.tsx | `app/agora/LiveEventsProvider.tsx` | SSE provider (~170 lines) |

#### A.1.2 Plexus Components

| File | Location | Purpose |
|------|----------|---------|
| Plexus.tsx | `components/agora/Plexus.tsx` | Force-directed graph (1010 lines) |
| PlexusBoard.tsx | `components/agora/PlexusBoard.tsx` | Card grid view (960 lines) |
| PlexusMatrix.tsx | `components/agora/PlexusMatrix.tsx` | Adjacency matrix (331 lines) |
| PlexusRoomMetrics.tsx | `components/agora/PlexusRoomMetrics.tsx` | Room stats (~100 lines) |
| RoomAndDebatePickers.tsx | `components/agora/RoomAndDebatePickers.tsx` | Selector components (~75 lines) |
| ConfidenceControls.tsx | `components/agora/ConfidenceControls.tsx` | Mode selector (~50 lines) |
| useConfidence.tsx | `components/agora/useConfidence.tsx` | Confidence context |

#### A.1.3 Debate Sheet Components

| File | Location | Purpose |
|------|----------|---------|
| DebateSheetReader.tsx | `components/agora/DebateSheetReader.tsx` | Debate sheet view (533 lines) |
| DebateSheetHeader.tsx | `components/deepdive/v3/debate-sheet/DebateSheetHeader.tsx` | Sheet header |
| DebateSheetFilters.tsx | `components/deepdive/v3/debate-sheet/DebateSheetFilters.tsx` | Sheet filters |
| ArgumentNetworkCard.tsx | `components/deepdive/v3/debate-sheet/ArgumentNetworkCard.tsx` | Argument card |
| SupportBar.tsx | `components/evidence/SupportBar.tsx` | Confidence bar |

#### A.1.4 Client Hooks

| File | Location | Purpose |
|------|----------|---------|
| useFollowing.ts | `lib/client/useFollowing.ts` | Room/tag following |
| useStackFollowing.ts | `lib/client/useStackFollowing.ts` | Stack subscriptions |
| useBusEffect.ts | `lib/client/useBusEffect.ts` | SSE subscription hook (~140 lines) |

#### A.1.5 Server Infrastructure

| File | Location | Purpose |
|------|----------|---------|
| bus.ts | `lib/server/bus.ts` | Event bus singleton |
| topics.ts | `lib/events/topics.ts` | BusEvent definitions |
| route.ts | `app/api/events/route.ts` | SSE endpoint |
| route.ts | `app/api/agora/events/route.ts` | Historical events |
| route.ts | `app/api/agora/network/route.ts` | Network graph |
| route.ts | `app/api/agora/rooms/route.ts` | Room list |
| route.ts | `app/api/follow/route.ts` | Follow API |

### A.2 Event Type Reference

| Event | Payload | Source |
|-------|---------|--------|
| `dialogue:moves:refresh` | `{ deliberationId, moveId, kind }` | Move creation |
| `dialogue:changed` | `{ deliberationId, moveId, kind, chips }` | Dialogue state change |
| `dialogue:cs:refresh` | `{ deliberationId, participantId }` | Commitment store update |
| `citations:changed` | `{ targetType, targetId, sourceId, url, quote, note }` | Citation addition |
| `decision:changed` | `{ deliberationId, kind, rationale }` | Accept/reject decision |
| `votes:changed` | `{ deliberationId, sessionId, method }` | Vote update |
| `stacks:changed` | `{ stackId, op }` | Stack modification |
| `comments:changed` | `{ stackId, discussionId, op }` | Comment CRUD |
| `deliberations:created` | `{ id, hostType, hostId }` | New deliberation |
| `xref:changed` | `{ fromType, fromId, toType, toId, relation }` | Cross-reference |
| `claims:edges:changed` | `{ deliberationId, claimId }` | Claim relationship |
| `cqs:changed` | `{ deliberationId, argumentId }` | Critical question update |
| `cards:changed` | `{ deliberationId }` | Card update |
| `issues:changed` | `{ deliberationId, issueId }` | Issue update |

### A.3 Icon Reference

| Icon Key | Symbol | Usage |
|----------|--------|-------|
| `move` | `»` | Dialogue moves |
| `link` | `⛓` | Citations, sources |
| `check` | `✓` | Decisions |
| `vote` | `☑` | Votes |
| `branch` | `⑂` | Cross-references |
| `plus` | `⊕` | New deliberations |
| `stack` | `⧉` | Stack updates |
| `chat` | `✉` | Comments |

### A.4 URL Patterns

| Pattern | Purpose |
|---------|---------|
| `/agora` | Main Agora feed |
| `/deliberation/[id]` | Deliberation view |
| `/deliberation/[id]?mode=forum` | Forum mode |
| `/deliberation/[id]?mode=panel` | Panel mode |
| `/deliberation/[id]?mode=synthesis` | Synthesis mode |
| `/deliberation/[id]/dialoguetimeline` | Timeline view |
| `/stacks/[id]` | Stack view |
| `/stacks/[id]#c=[commentId]` | Comment anchor |
| `/claim/[id]` | Claim detail |
| `/hub` | Deliberations hub |

### A.5 LocalStorage Keys

| Key | Type | Purpose |
|-----|------|---------|
| `agora:activeRoom` | string | Currently selected room |
| `agora:activeSheet` | string | Currently selected sheet |
| `agora:lastEventId` | string | SSE resume point (sessionStorage) |
| `plexus:edgeOn` | `Record<EdgeKind, boolean>` | Edge type toggles |
| `plexus:bundle` | boolean | Edge bundling toggle |
| `plexus:order` | OrderBy | Room sort order |
| `plexus:labels` | LabelMode | Label display mode |
| `plexus:q` | string | Search query |

### A.6 CSS Classes Reference

| Class | Usage |
|-------|-------|
| `menuv2--lite` | Lightweight dropdown styling |
| `btnv2--ghost` | Ghost button styling |
| `lockbutton` | Locked/primary button |
| `savebutton` | Save action button |
| `minorfield` | Compact input field |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | January 2025 | System | Initial comprehensive documentation |

---

*End of Document*
