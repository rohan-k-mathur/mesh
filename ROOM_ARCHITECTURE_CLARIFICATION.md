# Room Architecture Clarification

**Date**: November 2, 2025  
**Purpose**: Clarify the distinction between RealtimeRoom and AgoraRoom, and explain the relationship between Arguments in DebateSheets vs. Deliberations

---

## Question 1: What are RealtimeRoom vs AgoraRoom?

### TL;DR
**They are COMPLETELY DIFFERENT systems with different purposes:**

- **RealtimeRoom** = Social/real-time canvas for posts/collages (legacy social features)
- **AgoraRoom** = Argumentation workspace container (Phase 4 Debate Layer modernization)

---

### RealtimeRoom (Social Canvas System)

**Purpose**: Legacy social/creative canvas feature for real-time collaboration

**Schema** (`lib/models/schema.prisma` lines 230-243):
```prisma
model RealtimeRoom {
  id                       String                    @id
  created_at               DateTime                  @default(now())
  room_icon                String
  isLounge                 Boolean                   @default(false)
  isPublic                 Boolean                   @default(false)
  realtimeedges            RealtimeEdge[]            // Canvas edges
  realtimeposts            RealtimePost[]            // Canvas posts
  realtimeRoomInviteTokens RealtimeRoomInviteToken[] // Invite system
  members                  UserRealtimeRoom[]        // User membership
}
```

**What it contains:**
- **RealtimePost** (canvas posts with x/y coordinates, collage layouts)
- **RealtimeEdge** (connections between posts on canvas)
- **UserRealtimeRoom** (membership join table)
- **RealtimeRoomInviteToken** (invite links)

**Use cases:**
- Social canvas for creative collaboration
- Visual collages with spatial positioning
- Real-time post creation/editing
- Plugin integrations (prediction markets, product reviews)

**Related files:**
- `lib/actions/realtimeroom.actions.ts` (join/create room actions)
- `components/forms/CreateRoom.tsx` (UI for creating realtime rooms)

**Route pattern**: `/room/[id]` (where id is realtime_room_id)

---

### AgoraRoom (Argumentation Workspace)

**Purpose**: Container for deliberations and debate sheets in the Agora argumentation system

**Schema** (`lib/models/schema.prisma` lines 5281-5291):
```prisma
model AgoraRoom {
  id            String        @id @default(cuid())
  slug          String        @unique             // URL-friendly identifier
  title         String                            // Display name
  summary       String?                           // Description
  visibility    String        @default("public")  // Access control
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  sheets        DebateSheet[] @relation("RoomSheets")  // One room → many sheets
  deliberations Deliberation[]                    // One room → many deliberations
}
```

**What it contains:**
- **Deliberation** (structured argumentation sessions)
- **DebateSheet** (curated argument visualizations)
- No posts, no canvas, no x/y coordinates

**Use cases:**
- Group multiple related deliberations together
- Provide a stable URL (`/agora/[slug]`) for debate topics
- Enable cross-deliberation argument referencing (Phase 5A)
- Support multi-room plexus visualization

**Related files:**
- `app/api/agora/rooms/route.ts` (list all agora rooms)
- `app/api/agora/rooms/[id]/deliberations/route.ts` (get deliberations in room)
- `scripts/backfill-agora-debate-chain.ts` (Phase 4 Task 0 backfill)

**Route pattern**: `/agora` (Plexus view), `/agora/[slug]` (room detail - not yet implemented)

---

### Key Differences Summary

| Feature | RealtimeRoom | AgoraRoom |
|---------|--------------|-----------|
| **Purpose** | Social canvas for posts | Argumentation workspace |
| **Contains** | Posts, edges, collages | Deliberations, DebateSheets |
| **Positioning** | x/y canvas coordinates | No spatial layout |
| **Membership** | UserRealtimeRoom join table | No explicit membership (visibility-based) |
| **ID Type** | String (custom) | cuid() |
| **Slug** | None | Unique URL-friendly slug |
| **Legacy Status** | Legacy social feature | Active (Phase 4+) |
| **Routes** | `/room/[id]` | `/agora`, `/agora/[slug]` |

---

### Confusion Source: The Word "Room"

**Problem**: Both models use "Room" in their name but serve completely different purposes.

**Historical Context**:
- **RealtimeRoom** came first (social/canvas feature)
- **AgoraRoom** added later for argumentation system
- **Deliberation model** has 3 legacy room fields causing confusion:
  - `agoraRoomId` ← **CORRECT** (links to AgoraRoom)
  - `agoraRoomID` ← Legacy (capital ID, unused)
  - `roomId` ← Legacy (ambiguous, could mean either type)

**Phase 4 Task 0 Fixed This**:
- Standardized on `Deliberation.agoraRoomId` → `AgoraRoom.id`
- Created backfill to ensure 100% coverage
- Updated APIs to query correct field

---

## Question 2: Are Arguments in DebateSheets the SAME as Arguments in Deliberations?

### TL;DR
**YES, they are the SAME Arguments, but DebateSheets are CURATED VIEWS.**

---

### Argument Model (Ground Truth)

**Schema** (`lib/models/schema.prisma` lines ~3900):
```prisma
model Argument {
  id             String        @id @default(cuid())
  deliberationId String                        // ← Parent deliberation
  deliberation   Deliberation  @relation(...)
  claimId        String?                       // Conclusion claim
  claim          Claim?        @relation(...)
  schemeId       String?                       // Argumentation scheme
  confidence     Float         @default(0.5)
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
  
  // Relations
  premises       ArgumentPremise[]   // Premise claims
  edges          ArgumentEdge[]      // Attack/support edges
  debateNodes    DebateNode[]        @relation("ArgumentDebateNodes") // ← Links to sheets
  
  // ... many other relations
}
```

**Key Point**: Arguments are **stored once** in the `Argument` table with a `deliberationId`.

---

### DebateSheet (Curated View)

**Schema** (`lib/models/schema.prisma` lines 4785-4811):
```prisma
model DebateSheet {
  id             String        @id @default(cuid())
  title          String
  scope          String?                       // 'deliberation' | 'claim' | 'custom'
  roles          String[]      @default([])   // 'Proponent' | 'Opponent' | 'Curator'
  rulesetJson    Json?                        // Debate rules
  
  deliberationId String?                       // Optional link to source deliberation
  deliberation   Deliberation? @relation(...)
  roomId         String?                       // Optional link to AgoraRoom
  room           AgoraRoom?    @relation("RoomSheets", ...)
  
  // VIEWS (not storage):
  nodes          DebateNode[]  // ← References arguments via DebateNode.argumentId
  edges          DebateEdge[]  // ← Represents argument relations
}
```

---

### DebateNode (The Bridge)

**Schema** (`lib/models/schema.prisma` lines 4820-4838):
```prisma
model DebateNode {
  id         String      @id @default(cuid())
  sheetId    String                        // Parent sheet
  sheet      DebateSheet @relation(...)
  
  // Links to actual argument data:
  argumentId String?                       // ← POINTS TO Argument.id
  argument   Argument?   @relation("ArgumentDebateNodes", ...)
  
  claimId    String?                       // OR points to standalone claim
  claim      Claim?      @relation("ClaimDebateNodes", ...)
  
  diagramId  String?     @unique           // Links to AIF diagram
  diagram    ArgumentDiagram? @relation(...)
  
  title      String?                       // Display override (optional)
  summary    String?                       // Display override (optional)
}
```

**Key Point**: `DebateNode` is a **pointer** to an `Argument`, not a copy. The argument data lives in the `Argument` table.

---

### How It Works: Same Arguments, Curated Views

#### Scenario 1: Deliberation with Arguments

```
Deliberation "Should we adopt TypeScript?" (id: delib-123)
  ├─ Argument A: "TypeScript improves code quality"
  ├─ Argument B: "Types catch bugs early"
  └─ Argument C: "Learning curve is steep"

DebateSheet "delib:delib-123" (synthetic sheet)
  ├─ DebateNode 1 (argumentId: A) → Shows Argument A
  ├─ DebateNode 2 (argumentId: B) → Shows Argument B
  └─ DebateNode 3 (argumentId: C) → Shows Argument C
```

**Result**: The sheet shows ALL arguments from the deliberation via DebateNode pointers.

---

#### Scenario 2: Curated Subset

```
Deliberation "Climate Policy Debate" (id: delib-456)
  ├─ Argument X: "Carbon tax is effective"
  ├─ Argument Y: "It hurts poor families"
  ├─ Argument Z: "Subsidies are better"
  └─ ... 20 more arguments

DebateSheet "Key Pro/Con Arguments" (custom sheet)
  ├─ DebateNode 1 (argumentId: X) → Shows Argument X
  └─ DebateNode 2 (argumentId: Y) → Shows Argument Y
  (Z and others not included)
```

**Result**: Curator created a focused sheet showing only 2 key arguments from the 23 total.

---

#### Scenario 3: Cross-Deliberation Sheet (Future)

```
Deliberation A: "Adopt TypeScript?" (id: delib-A)
  └─ Argument A1: "Types catch bugs"

Deliberation B: "Use strict mode?" (id: delib-B)
  └─ Argument B1: "Strict mode prevents errors"

DebateSheet "Code Quality Arguments" (cross-room sheet)
  ├─ DebateNode 1 (argumentId: A1) → Argument from delib A
  └─ DebateNode 2 (argumentId: B1) → Argument from delib B
```

**Result**: Sheet combines arguments from multiple deliberations (Phase 5+ feature).

---

### Phase 4 Current State

**As of Phase 4 Task 0 (November 2, 2025):**

1. **Every deliberation has a synthetic DebateSheet**
   - ID format: `delib:<deliberationId>`
   - Scope: `'deliberation'`
   - Purpose: Default view of all arguments in that deliberation

2. **Sheets are EMPTY placeholders**
   - No DebateNodes created yet (that's Phase 4 Task 1)
   - Script to generate nodes exists: `scripts/generate-debate-sheets.ts` (upcoming)

3. **Arguments exist in deliberations**
   - Accessible via `/api/deliberations/{id}/arguments/aif`
   - Displayed in DeepDivePanelV2 → Models tab → AIFArgumentsListPro
   - Uses `ArgumentCardV2` component

---

### UI Component Clarification

#### Where Arguments Are Displayed

**Location**: DeepDivePanelV2 → **Models Tab** → AIFArgumentsListPro

**Component Chain**:
```
DeepDivePanelV2 (deliberation interface)
  └─ Models Tab
      └─ AIFArgumentsListPro (argument browser)
          └─ ArgumentCardV2 (individual argument card)
              ├─ Shows: conclusion, premises, scheme, CQs, attacks
              ├─ Phase 3 badges: dialogue state, stale indicator, confidence
              └─ Phase 5A badge: provenance (if imported)
```

**Data Source**: 
- Fetches from `/api/deliberations/{id}/arguments/aif`
- Returns arguments **directly from the Argument table**
- NOT from DebateSheet (sheets are empty placeholders right now)

**Component File**: `components/arguments/AIFArgumentsListPro.tsx`

---

#### DebateSheetReader (Future)

**Purpose**: Will read DebateNodes from DebateSheet and display them

**Current Status**: Empty sheets → shows no nodes

**Phase 4 Task 1 Goal**: Generate DebateNodes from Arguments so DebateSheetReader shows content

**Component File**: `components/debate/DebateSheetReader.tsx` (not yet heavily used)

---

### Data Flow Diagrams

#### Current (Phase 4 Task 0):

```
User visits /deliberation/[id]
    ↓
DeepDivePanelV2 renders Models tab
    ↓
AIFArgumentsListPro fetches /api/deliberations/{id}/arguments/aif
    ↓
API queries: prisma.argument.findMany({ where: { deliberationId } })
    ↓
Returns: Array<Argument> with full relations
    ↓
AIFArgumentsListPro → ArgumentCardV2 renders each argument
```

**Key**: Arguments displayed directly from `Argument` table, NOT from DebateSheet.

---

#### Future (Phase 4 Task 1+):

```
User visits /agora/[slug]
    ↓
DebateSheetReader fetches /api/sheets/{id}
    ↓
API queries: prisma.debateSheet.findUnique({
  include: {
    nodes: {
      include: { argument: { include: { claim, premises, ... } } }
    }
  }
})
    ↓
Returns: DebateSheet with populated DebateNodes
    ↓
Each DebateNode.argument contains full Argument data
    ↓
DebateSheetReader → ArgumentCardV2 renders curated subset
```

**Key**: DebateSheet provides **curated view** of Arguments via DebateNode pointers.

---

## Summary: Two Key Points

### 1. RealtimeRoom ≠ AgoraRoom

| RealtimeRoom | AgoraRoom |
|--------------|-----------|
| Social canvas system | Argumentation workspace |
| Posts with x/y coords | Deliberations + sheets |
| Legacy feature | Active (Phase 4+) |
| `/room/[id]` | `/agora/[slug]` |

**They are separate systems with different purposes.**

---

### 2. Arguments: Same Data, Multiple Views

**Storage**: `Argument` table (one copy per deliberation)

**Views**:
- **AIFArgumentsListPro**: Shows all arguments in deliberation (current UI)
- **DebateSheet**: Curated subset via DebateNode pointers (Phase 4 Task 1+)

**Relationship**: DebateNode → Argument (many-to-one pointer)

**Current State**: Arguments displayed directly from Argument table. DebateSheets exist but have no nodes yet.

**Phase 4 Task 1**: Generate DebateNodes from Arguments to populate sheets.

---

## Migration Checklist

If you need to work with either system:

### Working with RealtimeRoom (Social Canvas):
- [ ] Use `lib/actions/realtimeroom.actions.ts`
- [ ] Query `prisma.realtimeRoom` (lowercase table name)
- [ ] Routes: `/room/[id]`
- [ ] Related: RealtimePost, RealtimeEdge, UserRealtimeRoom

### Working with AgoraRoom (Argumentation):
- [ ] Use Deliberation.agoraRoomId → AgoraRoom.id
- [ ] Query `prisma.agoraRoom` (camelCase)
- [ ] Routes: `/agora`, `/agora/[slug]`
- [ ] Related: Deliberation, DebateSheet, Argument

### Working with Arguments:
- [ ] Query `prisma.argument.findMany({ where: { deliberationId } })`
- [ ] Use AIFArgumentsListPro → ArgumentCardV2 for display
- [ ] DebateSheet is a VIEW layer, not storage
- [ ] Wait for Phase 4 Task 1 to populate DebateNodes

---

## References

**Phase 4 Documentation**:
- `PHASE_4_TASK_0_COMPLETE.md` (Room/sheet backfill details)
- `scripts/backfill-agora-debate-chain.ts` (Backfill implementation)

**Schema Files**:
- `lib/models/schema.prisma` lines 230-243 (RealtimeRoom)
- `lib/models/schema.prisma` lines 5281-5291 (AgoraRoom)
- `lib/models/schema.prisma` lines 3655-3746 (Deliberation)
- `lib/models/schema.prisma` lines 4785-4838 (DebateSheet/DebateNode)

**UI Components**:
- `components/deepdive/DeepDivePanelV2.tsx` (Main deliberation interface)
- `components/arguments/AIFArgumentsListPro.tsx` (Argument browser)
- `components/arguments/ArgumentCardV2.tsx` (Argument display)

---

**Document Status**: Final v1.0  
**Last Updated**: November 2, 2025  
**Next Review**: After Phase 4 Task 1 completion (DebateNode generation)
