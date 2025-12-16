# Agora Feed System Audit

## Document Overview

This audit provides a comprehensive analysis of the Agora real-time event feed system, documenting all components, data flows, API routes, and integration points. The Agora system serves as the central activity hub for the Mesh platform, providing real-time updates on deliberations, citations, stacks, and other collaborative activities.

---

## Audit Date: January 2025
## Audit Scope: Agora Event Feed, Live Events Infrastructure, Plexus Visualization

---

## 1. Core Files Inventory

### 1.1 Main UI Components (`app/agora/ui/`)

| File | Lines | Purpose |
|------|-------|---------|
| `Agora.tsx` | 832 | Main client component with event coalescing, three view modes |
| `EventCard.tsx` | ~175 | Individual event card display with actions |
| `FiltersPanels.tsx` | ~15 | Placeholder for feed filters |
| `RightRail.tsx` | ~90 | Context panel with backlinks, room info, stack summary |
| `StackSummaryCard.tsx` | ~30 | Stack metadata display |
| `TopBar.tsx` | ~122 | Top navigation with tabs, search, pause toggle |

### 1.2 Page Routes (`app/agora/`)

| File | Purpose |
|------|---------|
| `page.tsx` | Server component fetching initial events |
| `LiveEventsProvider.tsx` | Global SSE provider in app layout |

### 1.3 Plexus Visualization (`components/agora/`)

| File | Lines | Purpose |
|------|-------|---------|
| `Plexus.tsx` | 1010 | Interactive node-link graph of rooms |
| `PlexusBoard.tsx` | 960 | Card-based board view of rooms |
| `PlexusMatrix.tsx` | 331 | Adjacency matrix view |
| `PlexusRoomMetrics.tsx` | ~100 | Per-room statistics display |
| `DebateSheetReader.tsx` | 533 | Debate sheet view in debates mode |
| `RoomAndDebatePickers.tsx` | ~75 | Room/Debate/Sheet selector dropdowns |
| `ConfidenceControls.tsx` | ~50 | DS/min/product mode controls |

### 1.4 Hooks (`lib/client/`)

| File | Purpose |
|------|---------|
| `useFollowing.ts` | Room/tag following state management |
| `useStackFollowing.ts` | Stack subscription state |
| `useBusEffect.ts` | SSE event subscription hook |

### 1.5 Server Infrastructure

| File | Purpose |
|------|---------|
| `lib/server/bus.ts` | Event bus singleton (Node EventEmitter) |
| `lib/events/topics.ts` | BusEvent type definitions |
| `app/agora/LiveEventsProvider.tsx` | Client-side SSE consumer |

---

## 2. API Routes Inventory

### 2.1 Agora-Specific Routes (`app/api/agora/`)

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/agora/events` | GET | Fetch historical events with coalescing |
| `/api/agora/network` | GET | Get room network graph for Plexus |
| `/api/agora/rooms` | GET | List all agora rooms |
| `/api/agora/rooms/[id]/deliberations` | GET | Get deliberations in a room |
| `/api/agora/room-metrics` | GET | Room statistics |
| `/api/agora/edge-metadata` | GET | Edge details for Plexus |
| `/api/agora/threads` | GET | Thread metadata |
| `/api/agora/sidebar` | GET | Sidebar data |
| `/api/agora/links` | GET/POST | Create/query meta-edges |

### 2.2 Core Infrastructure Routes

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/events` | GET (SSE) | Server-Sent Events endpoint |
| `/api/follow` | GET/POST/DELETE | Room/tag following |
| `/api/stacks/subscriptions` | GET | Stack subscriptions |
| `/api/xref` | GET | Cross-reference backlinks |

### 2.3 Related Routes

| Route | Purpose |
|-------|---------|
| `/api/dialogues/[id]/status` | Dialogue status (open branches) |
| `/api/deliberations/[id]/arguments/full` | Full argument data for debate sheets |
| `/api/hub/deliberations` | Hub deliberations list |
| `/api/sheets/by-deliberation/[id]` | Get sheets for a deliberation |

---

## 3. Data Models

### 3.1 AgoraRoom

```prisma
model AgoraRoom {
  id         String        @id @default(cuid())
  slug       String        @unique
  title      String
  summary    String?
  visibility String        @default("public")
  createdAt  DateTime      @default(now())
  updatedAt  DateTime      @updatedAt
  sheets     DebateSheet[]
  deliberations Deliberation[]
}
```

### 3.2 AgoraFollow

```prisma
model AgoraFollow {
  userId    String
  kind      String    // 'room' | 'tag'
  targetId  String
  createdAt DateTime  @default(now())

  @@id([userId, kind, targetId])
  @@index([kind, targetId])
}
```

### 3.3 AgoraOutbox

```prisma
model AgoraOutbox {
  id             String   @id @default(cuid())
  ts             DateTime @default(now())
  topic          String
  roomId         String?
  deliberationId String?
  targetType     String?
  targetId       String?
  payload        Json?
  delivered      Boolean  @default(false)

  @@index([ts])
  @@index([topic, deliberationId])
}
```

### 3.4 RoomFunctor (Cross-Room Mapping)

```prisma
model RoomFunctor {
  id           String   @id @default(cuid())
  fromRoomId   String
  toRoomId     String
  claimMapJson Json
  notes        String?
  createdById  String?
  createdAt    DateTime @default(now())

  @@unique([fromRoomId, toRoomId])
}
```

---

## 4. Event Types (BusEvents)

### 4.1 Defined Topics (`lib/events/topics.ts`)

```typescript
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
```

### 4.2 AgoraEvent Type

```typescript
export type AgoraEvent = {
  id: string;
  type: BusEvent | "dialogue:changed";
  ts: number;
  title: string;
  meta?: string;
  chips?: string[];
  link?: string;
  deliberationId?: string;
  targetType?: string;
  targetId?: string;
  icon?: string;
};
```

---

## 5. Component Analysis

### 5.1 Agora.tsx (Main Component)

**Purpose:** Central event feed with three view modes

**State Management:**
- `events: AgoraEvent[]` - Current event list
- `paused: boolean` - Live updates toggle
- `tab: 'all' | 'following' | 'calls' | 'votes' | 'accepted'` - Filter tab
- `view: 'feed' | 'debates' | 'plexus'` - Top-level view mode
- `selected: AgoraEvent | null` - Currently selected event
- `currentRoomId: string | null` - Active room for debates view

**Event Coalescing Logic:**
```typescript
const BUNDLE_WINDOW_MS = 3 * 60 * 1000;        // 3 minutes for dialogue
const CITATION_BUNDLE_WINDOW_MS = 2 * 60 * 1000; // 2 minutes for citations

function coalesce(prev: AgoraEvent[], ev: AgoraEvent): AgoraEvent[] {
  // Bundle similar events within time windows
  // Creates 'bundle' type events with count and aggregated metadata
}
```

**View Modes:**
1. **Feed View** - Grid layout with EventCards, FiltersPanel, RightRail
2. **Debates View** - RoomPicker + DebatePicker + SheetPicker + DebateSheetReader
3. **Plexus View** - PlexusShell (Board/Graph/Matrix)

### 5.2 LiveEventsProvider.tsx

**Purpose:** Global SSE provider wrapping app layout

**Key Features:**
- Connects to `/api/events` SSE endpoint
- Coalesces incoming events
- Triggers SWR revalidation via `KEYMAP`
- Dispatches legacy window CustomEvents
- Safety backfill on visibility change / network reconnect

**KEYMAP Configuration:**
```typescript
const KEYMAP: Record<string,(ev:any)=>string[]> = {
  'dialogue:moves:refresh': (e) => [`/api/dialogue/moves?deliberationId=${e.deliberationId}`],
  'dialogue:changed': (e) => [`/api/ludics/orthogonal?dialogueId=${e.deliberationId}`],
  'citations:changed': (e) => [`/api/claims/${e.targetId}/evidence`],
  'decision:changed': () => ['/api/hub/deliberations', '/api/agora/events?since=bootstrap'],
  'comments:changed': (e) => [`/api/discussions/${e.discussionId}/forum`],
};
```

### 5.3 useBusEffect Hook

**Purpose:** Subscribe to SSE events with topic filtering

**Usage:**
```typescript
useBusEffect("*", (m) => {
  // Handle all events
  const ev = mapMessageToAgoraEvent(m);
  if (ev) setEvents(prev => coalesce(prev, ev).slice(0, 200));
});
```

**Features:**
- Topic filtering: `'*'` | `'all'` | specific topics array
- Automatic reconnection with backoff
- Named SSE event normalization
- Typed envelope handling

---

## 6. Plexus Visualization System

### 6.1 Network Data Structure

```typescript
type RoomNode = {
  id: string;
  title?: string | null;
  nArgs: number;
  nEdges: number;
  accepted: number;
  rejected: number;
  undecided: number;
  tags?: string[];
  updatedAt?: string | null;
  debateSheetId?: string | null;
};

type MetaEdge = {
  from: string;
  to: string;
  kind: EdgeKind;
  weight: number;
};

type EdgeKind = 'xref' | 'overlap' | 'stack_ref' | 'imports' | 'shared_author';
```

### 6.2 View Modes

| Mode | Component | Description |
|------|-----------|-------------|
| Board | `PlexusBoard.tsx` | Card-based room grid with edge lines |
| Graph | `Plexus.tsx` | Interactive force-directed graph |
| Matrix | `PlexusMatrix.tsx` | Adjacency matrix visualization |

### 6.3 PlexusShell (Agora.tsx lines 106-210)

Wrapper component providing view mode selector for Plexus variants.

---

## 7. Following System

### 7.1 useFollowing Hook

```typescript
export function useFollowing() {
  const { data, mutate } = useSWR<{ items: Item[] }>("/api/follow", fetcher);
  
  const roomSet = new Set(items.filter(i => i.kind === "room").map(i => i.targetId));
  const tagSet = new Set(items.filter(i => i.kind === "tag").map(i => i.targetId.toLowerCase()));

  return {
    items, roomSet, tagSet,
    isFollowingRoom, isFollowingTag,
    followRoom, unfollowRoom, followTag, unfollowTag,
    mutate
  };
}
```

### 7.2 useStackFollowing Hook

```typescript
export function useStackFollowing() {
  const { data } = useSWR<{ items: string[] }>("/api/stacks/subscriptions", fetcher);
  const set = new Set((data?.items ?? []).map(String));
  const isFollowingStack = (id?: string) => !!(id && set.has(id));
  return { stackSet: set, isFollowingStack };
}
```

---

## 8. Related Systems Integration

### 8.1 Hub Component

**File:** `app/hub/ui/Hub.tsx`

**Purpose:** Deliberations discovery dashboard

**Features:**
- Search by query
- Filter by open calls
- Uses `useBusMutate` for live refresh
- Links to deliberation, panel, and synthesis views

### 8.2 DelibsDashboard

**File:** `app/(root)/(standard)/profile/deliberations/ui/DelibsDashboard.tsx`

**Purpose:** User's deliberations management

**Features:**
- Paginated list with SWR Infinite
- Filter by host type (article/post/room)
- Follow/unfollow actions
- Link to Agora from profile

---

## 9. SSE Infrastructure

### 9.1 Server Side (`app/api/events/route.ts`)

**Key Features:**
- TransformStream-based SSE response
- In-memory ring buffer (2048 events)
- Sequential event IDs for resumability
- `last-event-id` support for reconnection
- 20-second heartbeat
- Subscribes to all BUS_EVENTS

**Ring Buffer:**
```typescript
const RING = (globalThis as any).__agoraRing__ ??= { buf: [] as FeedEvent[], cap: 2048 };
let seq = (globalThis as any).__agoraSeq__ ??= 0;
```

### 9.2 Event Bus (`lib/server/bus.ts`)

**Implementation:** Node.js EventEmitter singleton

```typescript
const bus: EventEmitter = globalThis.__meshBus__ ??= new EventEmitter();
bus.setMaxListeners(50);

export function emitBus<T extends BusEvent>(type: T, payload: BusPayload<T>): BusEnvelope<T> {
  const env = { type, ts: Date.now(), ...(payload || {}) };
  bus.emit(type, env);
  return env;
}
```

---

## 10. Issues & Recommendations

### 10.1 Current Issues

1. **FiltersPanel Placeholder** - Currently shows "soon" placeholders for discipline, method, time filters
2. **No Pagination** - DebateSheetReader uses high limit (500) without proper pagination UI
3. **Comments in Code** - Commented-out RoomPicker component in Agora.tsx
4. **Hardcoded Limits** - Event list capped at 200 items in Agora, 2048 in ring buffer

### 10.2 Recommendations

1. **Implement Real Filters** - Add functional discipline, method, time range filters
2. **Add Pagination** - Implement proper pagination for debate sheets with >500 arguments
3. **Event Persistence** - Consider Redis or database-backed event storage for durability
4. **Performance** - Add virtualization for large event lists
5. **Type Safety** - Eliminate `as any` casts in event handling

---

## 11. File References Quick Lookup

### Frontend Components

| Component | Location |
|-----------|----------|
| Agora Main | `app/agora/ui/Agora.tsx` |
| EventCard | `app/agora/ui/EventCard.tsx` |
| TopBar | `app/agora/ui/TopBar.tsx` |
| RightRail | `app/agora/ui/RightRail.tsx` |
| FiltersPanel | `app/agora/ui/FiltersPanels.tsx` |
| LiveEventsProvider | `app/agora/LiveEventsProvider.tsx` |
| Plexus | `components/agora/Plexus.tsx` |
| PlexusBoard | `components/agora/PlexusBoard.tsx` |
| PlexusMatrix | `components/agora/PlexusMatrix.tsx` |
| DebateSheetReader | `components/agora/DebateSheetReader.tsx` |
| Hub | `app/hub/ui/Hub.tsx` |
| DelibsDashboard | `app/(root)/(standard)/profile/deliberations/ui/DelibsDashboard.tsx` |

### Hooks

| Hook | Location |
|------|----------|
| useFollowing | `lib/client/useFollowing.ts` |
| useStackFollowing | `lib/client/useStackFollowing.ts` |
| useBusEffect | `lib/client/useBusEffect.ts` |
| useConfidence | `components/agora/useConfidence.tsx` |

### Server Infrastructure

| Component | Location |
|-----------|----------|
| Event Bus | `lib/server/bus.ts` |
| Bus Topics | `lib/events/topics.ts` |
| SSE Route | `app/api/events/route.ts` |
| Events Route | `app/api/agora/events/route.ts` |
| Network Route | `app/api/agora/network/route.ts` |
| Follow Route | `app/api/follow/route.ts` |
| Rooms Route | `app/api/agora/rooms/route.ts` |

---

## 12. Summary Statistics

| Category | Count |
|----------|-------|
| UI Components | 16 |
| API Routes | 12 |
| Hooks | 4 |
| Data Models | 4 |
| Event Types | 14 |
| View Modes | 3 (Feed/Debates/Plexus) |
| Plexus Views | 3 (Board/Graph/Matrix) |

---

*Audit completed. Ready for architecture documentation.*
