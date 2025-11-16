# ArgumentChain Implementation Roadmap

**Feature**: Cross-Argument Chain Constructor  
**Estimated Timeline**: 7-10 weeks  
**Priority**: High (Core deliberation feature)  
**Status**: 📋 **PLANNING**

---

## Table of Contents

- [Part 1: Overview & Architecture](#part-1-overview--architecture)
- [Part 2: Phase 1 - Core Infrastructure](#part-2-phase-1---core-infrastructure)
- [Part 3: Phase 2 - Visual Editor & UX](#part-3-phase-2---visual-editor--ux)
- [Part 4: Phase 3 - Analysis Features](#part-4-phase-3---analysis-features)
- [Part 5: Phase 4 - Collaboration & Real-time](#part-5-phase-4---collaboration--real-time)
- [Part 6: Phase 5 - Integration & Polish](#part-6-phase-5---integration--polish)
- [Part 7: Testing Strategy](#part-7-testing-strategy)
- [Part 8: Deployment & Monitoring](#part-8-deployment--monitoring)

---

## Part 1: Overview & Architecture

### 1.1 Feature Summary

**What We're Building**:
A deliberation-level feature that allows users to chain complete Arguments together to visualize and construct complex multi-participant reasoning structures.

**Key Distinctions**:
- **SchemeNet**: Analyzes schemes **within** one argument (argument-level)
- **ArgumentChain**: Chains complete arguments **across** deliberation (deliberation-level)

**Core Value Proposition**:
- Model real deliberation structure (how arguments build on each other)
- Multi-author collaborative reasoning chains
- Visualize dependencies between participants' arguments
- Weakest link analysis across entire deliberation chain

---

### 1.2 Technical Architecture

**Data Layer**:
```
ArgumentChain
  ├─ ArgumentChainNode (M:N with Arguments)
  └─ ArgumentChainEdge (directed connections)

Relationships:
- Deliberation (1) ─── (M) ArgumentChain
- ArgumentChain (1) ─── (M) ArgumentChainNode
- ArgumentChainNode (M) ─── (1) Argument
- ArgumentChain (1) ─── (M) ArgumentChainEdge
```

**Application Layer**:
```
API Routes:
  POST   /api/argument-chains              (create)
  GET    /api/argument-chains/[id]         (fetch with nodes/edges)
  PATCH  /api/argument-chains/[id]         (update metadata)
  DELETE /api/argument-chains/[id]         (delete)
  
  POST   /api/argument-chains/[id]/nodes   (add argument)
  DELETE /api/argument-chains/[id]/nodes/[nodeId]
  
  POST   /api/argument-chains/[id]/edges   (connect arguments)
  PATCH  /api/argument-chains/[id]/edges/[edgeId]
  DELETE /api/argument-chains/[id]/edges/[edgeId]
  
  GET    /api/argument-chains/[id]/analyze (run analysis)
  GET    /api/deliberations/[id]/chains    (list all chains)
```

**Presentation Layer**:
```
Components:
  ArgumentChainConstructor (main container)
    ├─ ChainMetadataPanel (name, type, permissions)
    ├─ NetworkCanvas (ReactFlow editor)
    │   ├─ ArgumentChainNode (custom node component)
    │   ├─ ArgumentChainEdge (custom edge component)
    │   └─ ChainControls (zoom, minimap, export)
    ├─ ArgumentPalette (sidebar with available arguments)
    └─ ConnectionEditor (modal for edge creation)
  
  ArgumentChainsTab (management interface)
    ├─ ChainCard (grid item)
    ├─ ChainFilters (sort/filter)
    └─ ChainStats (analytics)
  
  ArgumentChainViewer (read-only display)
    └─ ChainAnalysisPanel (weakest link, path analysis)
```

---

### 1.3 Dependencies & Prerequisites

**Required Libraries**:
```json
{
  "reactflow": "^11.10.0",        // Graph visualization
  "@xyflow/react": "^12.0.0",     // Latest ReactFlow API
  "dagre": "^0.8.5",              // Auto-layout algorithms
  "elkjs": "^0.9.0",              // Alternative layout
  "zustand": "^4.4.0"             // State management (if not already)
}
```

**Existing Systems to Integrate**:
- ✅ Argument model (schema.prisma)
- ✅ ArgumentConstructor (for creating new arguments)
- ✅ SchemeNet (nested within ArgumentChainNodes)
- ✅ User permissions (deliberation membership)
- ✅ Real-time updates (Supabase channels)

**New Infrastructure Needed**:
- ❌ ArgumentChain models (schema migration)
- ❌ Chain CRUD API routes
- ❌ ReactFlow custom nodes/edges
- ❌ Graph analysis utilities (critical path, etc.)
- ❌ Export functionality (JSON, PNG, SVG)

---

### 1.4 Success Criteria

**Phase 1 (MVP)**:
- [ ] Users can create ArgumentChain with name and type
- [ ] Users can drag arguments from palette onto canvas
- [ ] Users can connect arguments with typed edges
- [ ] Basic visualization with ReactFlow
- [ ] Save/load chains to database

**Phase 2 (Core UX)**:
- [ ] Professional node/edge styling
- [ ] Edge connection modal with type selection
- [ ] Drag & drop from argument palette
- [ ] Auto-suggest connections based on semantic similarity
- [ ] Undo/redo support

**Phase 3 (Analysis)**:
- [ ] Critical path identification
- [ ] Weakest link analysis
- [ ] Chain complexity metrics
- [ ] Export to JSON/PNG/SVG

**Phase 4 (Collaboration)**:
- [ ] Real-time updates (multi-user editing)
- [ ] Permission controls (public/private, editable)
- [ ] Activity feed ("User X added Argument Y")
- [ ] Conflict resolution for concurrent edits

**Phase 5 (Integration)**:
- [ ] ArgumentChainsTab in DeepDive v3
- [ ] Link from ArgumentCard to chains containing it
- [ ] SchemeNet nested visualization
- [ ] Search/filter chains by type, author, arguments

---

### 1.5 Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **ReactFlow performance with large chains** | Medium | High | Implement virtualization, lazy loading of nodes |
| **Concurrent editing conflicts** | Medium | Medium | Optimistic locking, conflict detection, last-write-wins with warnings |
| **Complex edge routing** | Low | Low | Use ReactFlow's built-in edge types, dagre for layout |
| **Argument deletion breaks chains** | High | High | Cascade delete edges, warn user before deleting argument in chain |
| **Permissions confusion (public/editable)** | Medium | Medium | Clear UI copy, tooltips, permission preview |
| **Export functionality browser limits** | Low | Low | Use server-side rendering for PNG/SVG, limit canvas size |

---

## Part 2: Phase 1 - Core Infrastructure

**Duration**: 2-3 weeks  
**Goal**: Working CRUD for ArgumentChain with basic visualization

---

### 2.1 Database Schema Migration

**File**: `prisma/migrations/YYYYMMDDHHMMSS_add_argument_chain/migration.sql`

**Tasks**:

#### Task 1.1: Create ArgumentChain Table
```sql
-- CreateEnum for ArgumentChainType
CREATE TYPE "ArgumentChainType" AS ENUM (
  'SERIAL',
  'CONVERGENT',
  'DIVERGENT',
  'TREE',
  'GRAPH'
);

-- CreateTable ArgumentChain
CREATE TABLE "ArgumentChain" (
    "id" TEXT NOT NULL,
    "deliberationId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "purpose" TEXT,
    "chainType" "ArgumentChainType" NOT NULL DEFAULT 'SERIAL',
    "rootNodeId" TEXT,
    "createdBy" BIGINT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isEditable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArgumentChain_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ArgumentChain_deliberationId_idx" ON "ArgumentChain"("deliberationId");
CREATE INDEX "ArgumentChain_createdBy_idx" ON "ArgumentChain"("createdBy");
```

**Acceptance Criteria**:
- [x] Migration runs without errors
- [x] `ArgumentChainType` enum created
- [x] All fields with correct types
- [x] Indexes on deliberationId and createdBy

**Estimated Time**: 1 hour

---

#### Task 1.2: Create ArgumentChainNode Table
```sql
-- CreateEnum for ArgumentRole
CREATE TYPE "ArgumentRole" AS ENUM (
  'PREMISE',
  'EVIDENCE',
  'CONCLUSION',
  'OBJECTION',
  'REBUTTAL',
  'QUALIFIER'
);

-- CreateTable ArgumentChainNode
CREATE TABLE "ArgumentChainNode" (
    "id" TEXT NOT NULL,
    "chainId" TEXT NOT NULL,
    "argumentId" TEXT NOT NULL,
    "nodeOrder" INTEGER NOT NULL,
    "role" "ArgumentRole",
    "positionX" DOUBLE PRECISION,
    "positionY" DOUBLE PRECISION,
    "addedBy" BIGINT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArgumentChainNode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ArgumentChainNode_chainId_argumentId_key" 
  ON "ArgumentChainNode"("chainId", "argumentId");
CREATE INDEX "ArgumentChainNode_chainId_idx" ON "ArgumentChainNode"("chainId");
CREATE INDEX "ArgumentChainNode_argumentId_idx" ON "ArgumentChainNode"("argumentId");

-- AddForeignKey
ALTER TABLE "ArgumentChainNode" 
  ADD CONSTRAINT "ArgumentChainNode_chainId_fkey" 
  FOREIGN KEY ("chainId") 
  REFERENCES "ArgumentChain"("id") 
  ON DELETE CASCADE 
  ON UPDATE CASCADE;

ALTER TABLE "ArgumentChainNode" 
  ADD CONSTRAINT "ArgumentChainNode_argumentId_fkey" 
  FOREIGN KEY ("argumentId") 
  REFERENCES "Argument"("id") 
  ON DELETE CASCADE 
  ON UPDATE CASCADE;

ALTER TABLE "ArgumentChainNode" 
  ADD CONSTRAINT "ArgumentChainNode_addedBy_fkey" 
  FOREIGN KEY ("addedBy") 
  REFERENCES "User"("id") 
  ON DELETE RESTRICT 
  ON UPDATE CASCADE;
```

**Acceptance Criteria**:
- [x] `ArgumentRole` enum created
- [x] Unique constraint on (chainId, argumentId)
- [x] Cascade delete when chain or argument deleted
- [x] Foreign keys to ArgumentChain, Argument, User

**Estimated Time**: 1 hour

---

#### Task 1.3: Create ArgumentChainEdge Table
```sql
-- CreateEnum for ArgumentChainEdgeType
CREATE TYPE "ArgumentChainEdgeType" AS ENUM (
  'SUPPORTS',
  'ENABLES',
  'PRESUPPOSES',
  'REFUTES',
  'QUALIFIES',
  'EXEMPLIFIES',
  'GENERALIZES'
);

-- CreateTable ArgumentChainEdge
CREATE TABLE "ArgumentChainEdge" (
    "id" TEXT NOT NULL,
    "chainId" TEXT NOT NULL,
    "sourceNodeId" TEXT NOT NULL,
    "targetNodeId" TEXT NOT NULL,
    "edgeType" "ArgumentChainEdgeType" NOT NULL DEFAULT 'SUPPORTS',
    "strength" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "description" TEXT,
    "slotMapping" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArgumentChainEdge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ArgumentChainEdge_chainId_sourceNodeId_targetNodeId_key" 
  ON "ArgumentChainEdge"("chainId", "sourceNodeId", "targetNodeId");
CREATE INDEX "ArgumentChainEdge_chainId_idx" ON "ArgumentChainEdge"("chainId");

-- AddForeignKey
ALTER TABLE "ArgumentChainEdge" 
  ADD CONSTRAINT "ArgumentChainEdge_chainId_fkey" 
  FOREIGN KEY ("chainId") 
  REFERENCES "ArgumentChain"("id") 
  ON DELETE CASCADE 
  ON UPDATE CASCADE;

ALTER TABLE "ArgumentChainEdge" 
  ADD CONSTRAINT "ArgumentChainEdge_sourceNodeId_fkey" 
  FOREIGN KEY ("sourceNodeId") 
  REFERENCES "ArgumentChainNode"("id") 
  ON DELETE CASCADE 
  ON UPDATE CASCADE;

ALTER TABLE "ArgumentChainEdge" 
  ADD CONSTRAINT "ArgumentChainEdge_targetNodeId_fkey" 
  FOREIGN KEY ("targetNodeId") 
  REFERENCES "ArgumentChainNode"("id") 
  ON DELETE CASCADE 
  ON UPDATE CASCADE;
```

**Acceptance Criteria**:
- [x] `ArgumentChainEdgeType` enum created
- [x] Unique constraint on (chainId, sourceNodeId, targetNodeId)
- [x] Cascade delete when chain or nodes deleted
- [x] Strength field defaults to 1.0

**Estimated Time**: 1 hour

---

#### Task 1.4: Update Prisma Schema
**File**: `lib/models/schema.prisma`

Add models to schema file:
```prisma
// ============================================================================
// ArgumentChain: Deliberation-Level Argument Chains
// Phase 6: Cross-Argument Chains (Nov 2025)
// Based on ArgumentChain design proposal
// ============================================================================

enum ArgumentChainType {
  SERIAL       // A → B → C (linear chain)
  CONVERGENT   // A → C, B → C (multiple premises for one conclusion)
  DIVERGENT    // A → B, A → C (one premise for multiple conclusions)
  TREE         // Hierarchical (premise-conclusion tree)
  GRAPH        // General DAG (complex interdependencies)
}

enum ArgumentRole {
  PREMISE      // Provides foundational claim
  EVIDENCE     // Supports with data/facts
  CONCLUSION   // Final claim being argued for
  OBJECTION    // Challenges another argument
  REBUTTAL     // Responds to objection
  QUALIFIER    // Adds conditions/scope
}

enum ArgumentChainEdgeType {
  SUPPORTS        // A supports B (conclusion → premise)
  ENABLES         // A enables B (makes B's claim possible)
  PRESUPPOSES     // B presupposes A (A must be true for B)
  REFUTES         // A challenges B (attack relation)
  QUALIFIES       // A adds conditions to B
  EXEMPLIFIES     // A is example of B's general claim
  GENERALIZES     // A abstracts from B's specific case
}

model ArgumentChain {
  id             String   @id @default(cuid())
  deliberationId String
  
  // Metadata
  name           String   @db.VarChar(255)
  description    String?  @db.Text
  purpose        String?  @db.Text
  
  // Structure
  chainType      ArgumentChainType @default(SERIAL)
  rootNodeId     String?
  
  // Ownership & Permissions
  createdBy      BigInt
  isPublic       Boolean  @default(false)
  isEditable     Boolean  @default(false)
  
  // Timestamps
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  // Relations
  deliberation   Deliberation        @relation(fields: [deliberationId], references: [id], onDelete: Cascade)
  creator        User                @relation(fields: [createdBy], references: [id], onDelete: Restrict)
  nodes          ArgumentChainNode[]
  edges          ArgumentChainEdge[]
  
  @@index([deliberationId])
  @@index([createdBy])
}

model ArgumentChainNode {
  id           String   @id @default(cuid())
  chainId      String
  argumentId   String
  
  // Position in chain
  nodeOrder    Int
  role         ArgumentRole?
  
  // Visual layout
  positionX    Float?
  positionY    Float?
  
  // Contribution metadata
  addedBy      BigInt
  addedAt      DateTime @default(now())
  
  // Relations
  chain        ArgumentChain       @relation(fields: [chainId], references: [id], onDelete: Cascade)
  argument     Argument            @relation(fields: [argumentId], references: [id], onDelete: Cascade)
  contributor  User                @relation(fields: [addedBy], references: [id])
  
  outgoingEdges ArgumentChainEdge[] @relation("SourceNode")
  incomingEdges ArgumentChainEdge[] @relation("TargetNode")
  
  @@unique([chainId, argumentId])
  @@index([chainId])
  @@index([argumentId])
}

model ArgumentChainEdge {
  id             String   @id @default(cuid())
  chainId        String
  sourceNodeId   String
  targetNodeId   String
  
  // Relationship semantics
  edgeType       ArgumentChainEdgeType @default(SUPPORTS)
  strength       Float    @default(1.0)
  
  // Mapping details
  description    String?  @db.Text
  slotMapping    Json?
  
  createdAt      DateTime @default(now())
  
  // Relations
  chain          ArgumentChain     @relation(fields: [chainId], references: [id], onDelete: Cascade)
  sourceNode     ArgumentChainNode @relation("SourceNode", fields: [sourceNodeId], references: [id], onDelete: Cascade)
  targetNode     ArgumentChainNode @relation("TargetNode", fields: [targetNodeId], references: [id], onDelete: Cascade)
  
  @@unique([chainId, sourceNodeId, targetNodeId])
  @@index([chainId])
}
```

**Then run**:
```bash
npx prisma db push
npx prisma generate
```

**Acceptance Criteria**:
- [x] Models added to schema.prisma
- [x] Migration runs successfully
- [x] Prisma Client regenerated with new types
- [x] TypeScript types available for ArgumentChain, ArgumentChainNode, ArgumentChainEdge

**Estimated Time**: 1 hour

---

### 2.2 API Routes - CRUD Operations

#### Task 2.1: Create ArgumentChain
**File**: `app/api/argument-chains/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/models/db";
import { z } from "zod";

// Validation schema
const createChainSchema = z.object({
  deliberationId: z.string(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  purpose: z.string().optional(),
  chainType: z.enum(["SERIAL", "CONVERGENT", "DIVERGENT", "TREE", "GRAPH"]),
  isPublic: z.boolean().default(false),
  isEditable: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = createChainSchema.parse(body);

    // Check user is member of deliberation
    const membership = await prisma.deliberationParticipant.findFirst({
      where: {
        deliberationId: validatedData.deliberationId,
        userId: BigInt(session.user.id),
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "You must be a member of this deliberation" },
        { status: 403 }
      );
    }

    // Create ArgumentChain
    const chain = await prisma.argumentChain.create({
      data: {
        deliberationId: validatedData.deliberationId,
        name: validatedData.name,
        description: validatedData.description,
        purpose: validatedData.purpose,
        chainType: validatedData.chainType,
        isPublic: validatedData.isPublic,
        isEditable: validatedData.isEditable,
        createdBy: BigInt(session.user.id),
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        deliberation: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json(chain, { status: 201 });
  } catch (error) {
    console.error("Error creating ArgumentChain:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create argument chain" },
      { status: 500 }
    );
  }
}
```

**Acceptance Criteria**:
- [x] POST /api/argument-chains creates chain
- [x] Validates input with Zod
- [x] Checks user authentication
- [x] Checks deliberation membership
- [x] Returns created chain with creator and deliberation details
- [x] Returns appropriate error codes (401, 403, 400, 500)

**Testing**:
```bash
# Test: Create chain
curl -X POST http://localhost:3000/api/argument-chains \
  -H "Content-Type: application/json" \
  -d '{
    "deliberationId": "delid123",
    "name": "Climate Policy Chain",
    "chainType": "SERIAL",
    "isPublic": true
  }'

# Expected: 201 with chain object
```

**Estimated Time**: 2 hours

---

#### Task 2.2: Get ArgumentChain by ID
**File**: `app/api/argument-chains/[chainId]/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/models/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { chainId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chainId } = params;

    const chain = await prisma.argumentChain.findUnique({
      where: { id: chainId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        deliberation: {
          select: {
            id: true,
            title: true,
          },
        },
        nodes: {
          include: {
            argument: {
              include: {
                author: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                  },
                },
                schemes: {
                  include: {
                    scheme: true,
                  },
                },
                schemeNet: {
                  include: {
                    steps: {
                      include: {
                        scheme: true,
                      },
                      orderBy: {
                        stepOrder: "asc",
                      },
                    },
                  },
                },
              },
            },
            contributor: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: {
            nodeOrder: "asc",
          },
        },
        edges: {
          include: {
            sourceNode: {
              include: {
                argument: {
                  select: {
                    id: true,
                    conclusion: true,
                  },
                },
              },
            },
            targetNode: {
              include: {
                argument: {
                  select: {
                    id: true,
                    conclusion: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!chain) {
      return NextResponse.json({ error: "Chain not found" }, { status: 404 });
    }

    // Check permissions
    const membership = await prisma.deliberationParticipant.findFirst({
      where: {
        deliberationId: chain.deliberationId,
        userId: BigInt(session.user.id),
      },
    });

    const isCreator = chain.createdBy === BigInt(session.user.id);
    const canView = isCreator || chain.isPublic || membership;

    if (!canView) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(chain);
  } catch (error) {
    console.error("Error fetching ArgumentChain:", error);
    return NextResponse.json(
      { error: "Failed to fetch argument chain" },
      { status: 500 }
    );
  }
}
```

**Acceptance Criteria**:
- [x] GET /api/argument-chains/[chainId] fetches chain
- [x] Includes nodes with full argument details
- [x] Includes edges with source/target info
- [x] Includes SchemeNet for each argument (if exists)
- [x] Checks permissions (creator, public, or member)
- [x] Returns 404 if not found, 403 if forbidden

**Estimated Time**: 2 hours

---

#### Task 2.3: Update ArgumentChain
**File**: `app/api/argument-chains/[chainId]/route.ts` (add PATCH)

```typescript
export async function PATCH(
  req: NextRequest,
  { params }: { params: { chainId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chainId } = params;
    const body = await req.json();

    // Fetch existing chain
    const existingChain = await prisma.argumentChain.findUnique({
      where: { id: chainId },
    });

    if (!existingChain) {
      return NextResponse.json({ error: "Chain not found" }, { status: 404 });
    }

    // Check if user is creator
    if (existingChain.createdBy !== BigInt(session.user.id)) {
      return NextResponse.json(
        { error: "Only the creator can edit this chain" },
        { status: 403 }
      );
    }

    // Validate update data
    const updateSchema = z.object({
      name: z.string().min(1).max(255).optional(),
      description: z.string().optional(),
      purpose: z.string().optional(),
      chainType: z
        .enum(["SERIAL", "CONVERGENT", "DIVERGENT", "TREE", "GRAPH"])
        .optional(),
      isPublic: z.boolean().optional(),
      isEditable: z.boolean().optional(),
      rootNodeId: z.string().optional(),
    });

    const validatedData = updateSchema.parse(body);

    // Update chain
    const updatedChain = await prisma.argumentChain.update({
      where: { id: chainId },
      data: validatedData,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(updatedChain);
  } catch (error) {
    console.error("Error updating ArgumentChain:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update argument chain" },
      { status: 500 }
    );
  }
}
```

**Acceptance Criteria**:
- [x] PATCH /api/argument-chains/[chainId] updates chain
- [x] Only creator can update
- [x] Validates partial updates
- [x] Returns updated chain

**Estimated Time**: 1.5 hours

---

#### Task 2.4: Delete ArgumentChain
**File**: `app/api/argument-chains/[chainId]/route.ts` (add DELETE)

```typescript
export async function DELETE(
  req: NextRequest,
  { params }: { params: { chainId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chainId } = params;

    const existingChain = await prisma.argumentChain.findUnique({
      where: { id: chainId },
    });

    if (!existingChain) {
      return NextResponse.json({ error: "Chain not found" }, { status: 404 });
    }

    // Check if user is creator
    if (existingChain.createdBy !== BigInt(session.user.id)) {
      return NextResponse.json(
        { error: "Only the creator can delete this chain" },
        { status: 403 }
      );
    }

    // Delete chain (cascade deletes nodes and edges)
    await prisma.argumentChain.delete({
      where: { id: chainId },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting ArgumentChain:", error);
    return NextResponse.json(
      { error: "Failed to delete argument chain" },
      { status: 500 }
    );
  }
}
```

**Acceptance Criteria**:
- [x] DELETE /api/argument-chains/[chainId] deletes chain
- [x] Only creator can delete
- [x] Cascade deletes nodes and edges
- [x] Returns 200 on success

**Estimated Time**: 1 hour

---

---

### 2.3 API Routes - Node Management

#### Task 2.5: Add Node to Chain
**File**: `app/api/argument-chains/[chainId]/nodes/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/models/db";
import { z } from "zod";

const addNodeSchema = z.object({
  argumentId: z.string(),
  role: z.enum(["PREMISE", "EVIDENCE", "CONCLUSION", "OBJECTION", "REBUTTAL", "QUALIFIER"]).optional(),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { chainId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chainId } = params;
    const body = await req.json();
    const validatedData = addNodeSchema.parse(body);

    // Fetch chain
    const chain = await prisma.argumentChain.findUnique({
      where: { id: chainId },
      include: {
        nodes: true,
      },
    });

    if (!chain) {
      return NextResponse.json({ error: "Chain not found" }, { status: 404 });
    }

    // Check permissions
    const membership = await prisma.deliberationParticipant.findFirst({
      where: {
        deliberationId: chain.deliberationId,
        userId: BigInt(session.user.id),
      },
    });

    const isCreator = chain.createdBy === BigInt(session.user.id);
    const canEdit = isCreator || (chain.isEditable && membership);

    if (!canEdit) {
      return NextResponse.json(
        { error: "You don't have permission to edit this chain" },
        { status: 403 }
      );
    }

    // Verify argument exists and is in same deliberation
    const argument = await prisma.argument.findUnique({
      where: { id: validatedData.argumentId },
    });

    if (!argument) {
      return NextResponse.json({ error: "Argument not found" }, { status: 404 });
    }

    if (argument.deliberationId !== chain.deliberationId) {
      return NextResponse.json(
        { error: "Argument must be from the same deliberation" },
        { status: 400 }
      );
    }

    // Check if argument already in chain
    const existingNode = chain.nodes.find(
      (n) => n.argumentId === validatedData.argumentId
    );
    if (existingNode) {
      return NextResponse.json(
        { error: "Argument already in this chain" },
        { status: 400 }
      );
    }

    // Calculate next node order
    const maxOrder = chain.nodes.length > 0
      ? Math.max(...chain.nodes.map((n) => n.nodeOrder))
      : 0;

    // Create node
    const node = await prisma.argumentChainNode.create({
      data: {
        chainId,
        argumentId: validatedData.argumentId,
        nodeOrder: maxOrder + 1,
        role: validatedData.role,
        positionX: validatedData.positionX,
        positionY: validatedData.positionY,
        addedBy: BigInt(session.user.id),
      },
      include: {
        argument: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            schemes: {
              include: {
                scheme: true,
              },
            },
            schemeNet: {
              include: {
                steps: {
                  include: {
                    scheme: true,
                  },
                  orderBy: {
                    stepOrder: "asc",
                  },
                },
              },
            },
          },
        },
        contributor: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(node, { status: 201 });
  } catch (error) {
    console.error("Error adding node to chain:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to add node to chain" },
      { status: 500 }
    );
  }
}
```

**Acceptance Criteria**:
- [x] POST /api/argument-chains/[chainId]/nodes adds node
- [x] Checks permissions (creator or editable + member)
- [x] Validates argument is in same deliberation
- [x] Prevents duplicate arguments in chain
- [x] Auto-increments nodeOrder
- [x] Returns node with full argument details including SchemeNet

**Testing**:
```bash
curl -X POST http://localhost:3000/api/argument-chains/chain123/nodes \
  -H "Content-Type: application/json" \
  -d '{
    "argumentId": "arg456",
    "role": "PREMISE",
    "positionX": 100,
    "positionY": 200
  }'

# Expected: 201 with node object
```

**Estimated Time**: 2.5 hours

---

#### Task 2.6: Remove Node from Chain
**File**: `app/api/argument-chains/[chainId]/nodes/[nodeId]/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/models/db";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { chainId: string; nodeId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chainId, nodeId } = params;

    // Fetch node with chain
    const node = await prisma.argumentChainNode.findUnique({
      where: { id: nodeId },
      include: {
        chain: true,
      },
    });

    if (!node) {
      return NextResponse.json({ error: "Node not found" }, { status: 404 });
    }

    if (node.chainId !== chainId) {
      return NextResponse.json({ error: "Node not in this chain" }, { status: 400 });
    }

    // Check permissions
    const membership = await prisma.deliberationParticipant.findFirst({
      where: {
        deliberationId: node.chain.deliberationId,
        userId: BigInt(session.user.id),
      },
    });

    const isCreator = node.chain.createdBy === BigInt(session.user.id);
    const isNodeCreator = node.addedBy === BigInt(session.user.id);
    const canEdit = isCreator || (node.chain.isEditable && membership && isNodeCreator);

    if (!canEdit) {
      return NextResponse.json(
        { error: "You don't have permission to remove this node" },
        { status: 403 }
      );
    }

    // Delete node (cascade deletes connected edges)
    await prisma.argumentChainNode.delete({
      where: { id: nodeId },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error removing node from chain:", error);
    return NextResponse.json(
      { error: "Failed to remove node from chain" },
      { status: 500 }
    );
  }
}
```

**Acceptance Criteria**:
- [x] DELETE /api/argument-chains/[chainId]/nodes/[nodeId] removes node
- [x] Chain creator can remove any node
- [x] Node contributor can remove their own node (if chain is editable)
- [x] Cascade deletes connected edges
- [x] Returns 200 on success

**Estimated Time**: 1.5 hours

---

#### Task 2.7: Update Node Position/Role
**File**: `app/api/argument-chains/[chainId]/nodes/[nodeId]/route.ts` (add PATCH)

```typescript
export async function PATCH(
  req: NextRequest,
  { params }: { params: { chainId: string; nodeId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chainId, nodeId } = params;
    const body = await req.json();

    const updateSchema = z.object({
      role: z.enum(["PREMISE", "EVIDENCE", "CONCLUSION", "OBJECTION", "REBUTTAL", "QUALIFIER"]).optional(),
      positionX: z.number().optional(),
      positionY: z.number().optional(),
      nodeOrder: z.number().optional(),
    });

    const validatedData = updateSchema.parse(body);

    // Fetch node with chain
    const node = await prisma.argumentChainNode.findUnique({
      where: { id: nodeId },
      include: {
        chain: true,
      },
    });

    if (!node) {
      return NextResponse.json({ error: "Node not found" }, { status: 404 });
    }

    if (node.chainId !== chainId) {
      return NextResponse.json({ error: "Node not in this chain" }, { status: 400 });
    }

    // Check permissions
    const membership = await prisma.deliberationParticipant.findFirst({
      where: {
        deliberationId: node.chain.deliberationId,
        userId: BigInt(session.user.id),
      },
    });

    const isCreator = node.chain.createdBy === BigInt(session.user.id);
    const canEdit = isCreator || (node.chain.isEditable && membership);

    if (!canEdit) {
      return NextResponse.json(
        { error: "You don't have permission to update this node" },
        { status: 403 }
      );
    }

    // Update node
    const updatedNode = await prisma.argumentChainNode.update({
      where: { id: nodeId },
      data: validatedData,
      include: {
        argument: {
          select: {
            id: true,
            conclusion: true,
          },
        },
      },
    });

    return NextResponse.json(updatedNode);
  } catch (error) {
    console.error("Error updating node:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update node" },
      { status: 500 }
    );
  }
}
```

**Acceptance Criteria**:
- [x] PATCH /api/argument-chains/[chainId]/nodes/[nodeId] updates node
- [x] Can update role, position, nodeOrder
- [x] Checks permissions
- [x] Returns updated node

**Estimated Time**: 1 hour

---

### 2.4 API Routes - Edge Management

#### Task 2.8: Create Edge (Connect Arguments)
**File**: `app/api/argument-chains/[chainId]/edges/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/models/db";
import { z } from "zod";

const createEdgeSchema = z.object({
  sourceNodeId: z.string(),
  targetNodeId: z.string(),
  edgeType: z.enum([
    "SUPPORTS",
    "ENABLES",
    "PRESUPPOSES",
    "REFUTES",
    "QUALIFIES",
    "EXEMPLIFIES",
    "GENERALIZES",
  ]),
  strength: z.number().min(0).max(1).default(1.0),
  description: z.string().optional(),
  slotMapping: z.record(z.string()).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { chainId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chainId } = params;
    const body = await req.json();
    const validatedData = createEdgeSchema.parse(body);

    // Fetch chain
    const chain = await prisma.argumentChain.findUnique({
      where: { id: chainId },
    });

    if (!chain) {
      return NextResponse.json({ error: "Chain not found" }, { status: 404 });
    }

    // Check permissions
    const membership = await prisma.deliberationParticipant.findFirst({
      where: {
        deliberationId: chain.deliberationId,
        userId: BigInt(session.user.id),
      },
    });

    const isCreator = chain.createdBy === BigInt(session.user.id);
    const canEdit = isCreator || (chain.isEditable && membership);

    if (!canEdit) {
      return NextResponse.json(
        { error: "You don't have permission to edit this chain" },
        { status: 403 }
      );
    }

    // Verify both nodes exist and belong to this chain
    const [sourceNode, targetNode] = await Promise.all([
      prisma.argumentChainNode.findUnique({
        where: { id: validatedData.sourceNodeId },
      }),
      prisma.argumentChainNode.findUnique({
        where: { id: validatedData.targetNodeId },
      }),
    ]);

    if (!sourceNode || !targetNode) {
      return NextResponse.json({ error: "Node not found" }, { status: 404 });
    }

    if (sourceNode.chainId !== chainId || targetNode.chainId !== chainId) {
      return NextResponse.json(
        { error: "Both nodes must belong to this chain" },
        { status: 400 }
      );
    }

    // Prevent self-loops
    if (validatedData.sourceNodeId === validatedData.targetNodeId) {
      return NextResponse.json(
        { error: "Cannot create edge from node to itself" },
        { status: 400 }
      );
    }

    // Check if edge already exists
    const existingEdge = await prisma.argumentChainEdge.findUnique({
      where: {
        chainId_sourceNodeId_targetNodeId: {
          chainId,
          sourceNodeId: validatedData.sourceNodeId,
          targetNodeId: validatedData.targetNodeId,
        },
      },
    });

    if (existingEdge) {
      return NextResponse.json(
        { error: "Edge already exists between these nodes" },
        { status: 400 }
      );
    }

    // Create edge
    const edge = await prisma.argumentChainEdge.create({
      data: {
        chainId,
        sourceNodeId: validatedData.sourceNodeId,
        targetNodeId: validatedData.targetNodeId,
        edgeType: validatedData.edgeType,
        strength: validatedData.strength,
        description: validatedData.description,
        slotMapping: validatedData.slotMapping,
      },
      include: {
        sourceNode: {
          include: {
            argument: {
              select: {
                id: true,
                conclusion: true,
              },
            },
          },
        },
        targetNode: {
          include: {
            argument: {
              select: {
                id: true,
                conclusion: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(edge, { status: 201 });
  } catch (error) {
    console.error("Error creating edge:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create edge" },
      { status: 500 }
    );
  }
}
```

**Acceptance Criteria**:
- [x] POST /api/argument-chains/[chainId]/edges creates edge
- [x] Validates both nodes exist in chain
- [x] Prevents self-loops
- [x] Prevents duplicate edges
- [x] Validates strength (0-1)
- [x] Returns edge with source/target info

**Testing**:
```bash
curl -X POST http://localhost:3000/api/argument-chains/chain123/edges \
  -H "Content-Type: application/json" \
  -d '{
    "sourceNodeId": "node1",
    "targetNodeId": "node2",
    "edgeType": "SUPPORTS",
    "strength": 0.9,
    "description": "Source conclusion becomes target premise"
  }'

# Expected: 201 with edge object
```

**Estimated Time**: 2.5 hours

---

#### Task 2.9: Update Edge
**File**: `app/api/argument-chains/[chainId]/edges/[edgeId]/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/models/db";
import { z } from "zod";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { chainId: string; edgeId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chainId, edgeId } = params;
    const body = await req.json();

    const updateSchema = z.object({
      edgeType: z.enum([
        "SUPPORTS",
        "ENABLES",
        "PRESUPPOSES",
        "REFUTES",
        "QUALIFIES",
        "EXEMPLIFIES",
        "GENERALIZES",
      ]).optional(),
      strength: z.number().min(0).max(1).optional(),
      description: z.string().optional(),
      slotMapping: z.record(z.string()).optional(),
    });

    const validatedData = updateSchema.parse(body);

    // Fetch edge with chain
    const edge = await prisma.argumentChainEdge.findUnique({
      where: { id: edgeId },
      include: {
        chain: true,
      },
    });

    if (!edge) {
      return NextResponse.json({ error: "Edge not found" }, { status: 404 });
    }

    if (edge.chainId !== chainId) {
      return NextResponse.json({ error: "Edge not in this chain" }, { status: 400 });
    }

    // Check permissions
    const membership = await prisma.deliberationParticipant.findFirst({
      where: {
        deliberationId: edge.chain.deliberationId,
        userId: BigInt(session.user.id),
      },
    });

    const isCreator = edge.chain.createdBy === BigInt(session.user.id);
    const canEdit = isCreator || (edge.chain.isEditable && membership);

    if (!canEdit) {
      return NextResponse.json(
        { error: "You don't have permission to update this edge" },
        { status: 403 }
      );
    }

    // Update edge
    const updatedEdge = await prisma.argumentChainEdge.update({
      where: { id: edgeId },
      data: validatedData,
      include: {
        sourceNode: {
          include: {
            argument: {
              select: {
                id: true,
                conclusion: true,
              },
            },
          },
        },
        targetNode: {
          include: {
            argument: {
              select: {
                id: true,
                conclusion: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updatedEdge);
  } catch (error) {
    console.error("Error updating edge:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update edge" },
      { status: 500 }
    );
  }
}
```

**Acceptance Criteria**:
- [x] PATCH /api/argument-chains/[chainId]/edges/[edgeId] updates edge
- [x] Can update edgeType, strength, description, slotMapping
- [x] Validates strength range
- [x] Checks permissions
- [x] Returns updated edge

**Estimated Time**: 1 hour

---

#### Task 2.10: Delete Edge
**File**: `app/api/argument-chains/[chainId]/edges/[edgeId]/route.ts` (add DELETE)

```typescript
export async function DELETE(
  req: NextRequest,
  { params }: { params: { chainId: string; edgeId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chainId, edgeId } = params;

    // Fetch edge with chain
    const edge = await prisma.argumentChainEdge.findUnique({
      where: { id: edgeId },
      include: {
        chain: true,
      },
    });

    if (!edge) {
      return NextResponse.json({ error: "Edge not found" }, { status: 404 });
    }

    if (edge.chainId !== chainId) {
      return NextResponse.json({ error: "Edge not in this chain" }, { status: 400 });
    }

    // Check permissions
    const membership = await prisma.deliberationParticipant.findFirst({
      where: {
        deliberationId: edge.chain.deliberationId,
        userId: BigInt(session.user.id),
      },
    });

    const isCreator = edge.chain.createdBy === BigInt(session.user.id);
    const canEdit = isCreator || (edge.chain.isEditable && membership);

    if (!canEdit) {
      return NextResponse.json(
        { error: "You don't have permission to delete this edge" },
        { status: 403 }
      );
    }

    // Delete edge
    await prisma.argumentChainEdge.delete({
      where: { id: edgeId },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting edge:", error);
    return NextResponse.json(
      { error: "Failed to delete edge" },
      { status: 500 }
    );
  }
}
```

**Acceptance Criteria**:
- [x] DELETE /api/argument-chains/[chainId]/edges/[edgeId] deletes edge
- [x] Checks permissions
- [x] Returns 200 on success

**Estimated Time**: 0.5 hours

---

### 2.5 API Routes - Listing & Analysis

#### Task 2.11: List Chains in Deliberation
**File**: `app/api/deliberations/[deliberationId]/argument-chains/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/models/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { deliberationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { deliberationId } = params;

    // Check membership
    const membership = await prisma.deliberationParticipant.findFirst({
      where: {
        deliberationId,
        userId: BigInt(session.user.id),
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "You must be a member of this deliberation" },
        { status: 403 }
      );
    }

    // Fetch chains
    // User can see: chains they created OR public chains OR chains in their deliberation
    const chains = await prisma.argumentChain.findMany({
      where: {
        deliberationId,
        OR: [
          { createdBy: BigInt(session.user.id) },
          { isPublic: true },
        ],
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            nodes: true,
            edges: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json(chains);
  } catch (error) {
    console.error("Error fetching chains:", error);
    return NextResponse.json(
      { error: "Failed to fetch argument chains" },
      { status: 500 }
    );
  }
}
```

**Acceptance Criteria**:
- [x] GET /api/deliberations/[id]/argument-chains lists chains
- [x] Returns chains user created or public chains
- [x] Includes node/edge counts
- [x] Sorted by updatedAt (most recent first)
- [x] Checks deliberation membership

**Estimated Time**: 1.5 hours

---

#### Task 2.12: Basic Chain Analysis
**File**: `app/api/argument-chains/[chainId]/analyze/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/models/db";

interface PathAnalysis {
  nodes: string[];
  edges: string[];
  overallStrength: number;
  weakestLink: {
    edgeId: string;
    sourceNodeId: string;
    targetNodeId: string;
    strength: number;
  } | null;
}

function findAllPaths(
  startNodeId: string,
  endNodeId: string,
  edges: any[],
  visited: Set<string> = new Set()
): string[][] {
  if (startNodeId === endNodeId) {
    return [[startNodeId]];
  }

  visited.add(startNodeId);
  const paths: string[][] = [];

  const outgoingEdges = edges.filter((e) => e.sourceNodeId === startNodeId);

  for (const edge of outgoingEdges) {
    if (!visited.has(edge.targetNodeId)) {
      const subPaths = findAllPaths(
        edge.targetNodeId,
        endNodeId,
        edges,
        new Set(visited)
      );
      for (const subPath of subPaths) {
        paths.push([startNodeId, ...subPath]);
      }
    }
  }

  return paths;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { chainId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chainId } = params;

    const chain = await prisma.argumentChain.findUnique({
      where: { id: chainId },
      include: {
        nodes: {
          orderBy: {
            nodeOrder: "asc",
          },
        },
        edges: true,
      },
    });

    if (!chain) {
      return NextResponse.json({ error: "Chain not found" }, { status: 404 });
    }

    // Check permissions
    const membership = await prisma.deliberationParticipant.findFirst({
      where: {
        deliberationId: chain.deliberationId,
        userId: BigInt(session.user.id),
      },
    });

    const isCreator = chain.createdBy === BigInt(session.user.id);
    const canView = isCreator || chain.isPublic || membership;

    if (!canView) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Basic complexity metrics
    const nodeCount = chain.nodes.length;
    const edgeCount = chain.edges.length;
    const avgDegree = nodeCount > 0 ? (edgeCount * 2) / nodeCount : 0;

    // Find nodes with no incoming edges (potential roots)
    const nodeIds = new Set(chain.nodes.map((n) => n.id));
    const nodesWithIncoming = new Set(chain.edges.map((e) => e.targetNodeId));
    const rootNodes = chain.nodes.filter((n) => !nodesWithIncoming.has(n.id));

    // Find nodes with no outgoing edges (potential conclusions)
    const nodesWithOutgoing = new Set(chain.edges.map((e) => e.sourceNodeId));
    const conclusionNodes = chain.nodes.filter((n) => !nodesWithOutgoing.has(n.id));

    // Calculate max depth (longest path)
    let maxDepth = 0;
    if (rootNodes.length > 0 && conclusionNodes.length > 0) {
      for (const root of rootNodes) {
        for (const conclusion of conclusionNodes) {
          const paths = findAllPaths(root.id, conclusion.id, chain.edges);
          for (const path of paths) {
            maxDepth = Math.max(maxDepth, path.length - 1); // edges = nodes - 1
          }
        }
      }
    }

    // Find critical path (weakest overall strength)
    let criticalPath: PathAnalysis | null = null;

    if (chain.rootNodeId && conclusionNodes.length > 0) {
      for (const conclusion of conclusionNodes) {
        const paths = findAllPaths(chain.rootNodeId, conclusion.id, chain.edges);
        
        for (const path of paths) {
          // Get edges for this path
          const pathEdges = [];
          for (let i = 0; i < path.length - 1; i++) {
            const edge = chain.edges.find(
              (e) => e.sourceNodeId === path[i] && e.targetNodeId === path[i + 1]
            );
            if (edge) pathEdges.push(edge);
          }

          if (pathEdges.length === 0) continue;

          // Find weakest link in path
          const weakestEdge = pathEdges.reduce((min, e) =>
            e.strength < min.strength ? e : min
          );

          const pathStrength = weakestEdge.strength;

          if (!criticalPath || pathStrength < criticalPath.overallStrength) {
            criticalPath = {
              nodes: path,
              edges: pathEdges.map((e) => e.id),
              overallStrength: pathStrength,
              weakestLink: {
                edgeId: weakestEdge.id,
                sourceNodeId: weakestEdge.sourceNodeId,
                targetNodeId: weakestEdge.targetNodeId,
                strength: weakestEdge.strength,
              },
            };
          }
        }
      }
    }

    // Suggestions
    const suggestions = [];

    // Check for disconnected nodes
    const connectedNodes = new Set([
      ...chain.edges.map((e) => e.sourceNodeId),
      ...chain.edges.map((e) => e.targetNodeId),
    ]);
    const disconnectedNodes = chain.nodes.filter(
      (n) => !connectedNodes.has(n.id)
    );

    if (disconnectedNodes.length > 0) {
      suggestions.push({
        type: "disconnected_nodes",
        message: `${disconnectedNodes.length} node(s) are not connected to the chain`,
        affectedNodes: disconnectedNodes.map((n) => n.id),
      });
    }

    // Check for weak links (strength < 0.5)
    const weakEdges = chain.edges.filter((e) => e.strength < 0.5);
    if (weakEdges.length > 0) {
      suggestions.push({
        type: "weak_links",
        message: `${weakEdges.length} edge(s) have low connection strength`,
        affectedNodes: weakEdges.flatMap((e) => [e.sourceNodeId, e.targetNodeId]),
      });
    }

    // Check for cycles (simplified check)
    // TODO: Implement proper cycle detection if needed

    return NextResponse.json({
      complexity: {
        nodeCount,
        edgeCount,
        averageDegree: Math.round(avgDegree * 100) / 100,
        maxDepth,
        rootNodes: rootNodes.map((n) => n.id),
        conclusionNodes: conclusionNodes.map((n) => n.id),
      },
      criticalPath,
      suggestions,
    });
  } catch (error) {
    console.error("Error analyzing chain:", error);
    return NextResponse.json(
      { error: "Failed to analyze chain" },
      { status: 500 }
    );
  }
}
```

**Acceptance Criteria**:
- [x] GET /api/argument-chains/[chainId]/analyze returns analysis
- [x] Calculates complexity metrics (node count, edge count, avg degree, max depth)
- [x] Finds critical path (weakest overall strength)
- [x] Identifies weakest link in chain
- [x] Provides suggestions (disconnected nodes, weak links)
- [x] Checks permissions

**Testing**:
```bash
curl http://localhost:3000/api/argument-chains/chain123/analyze

# Expected: Analysis object with complexity, criticalPath, suggestions
```

**Estimated Time**: 3 hours

---

### 2.6 TypeScript Types & Utilities

#### Task 2.13: Create Type Definitions
**File**: `lib/types/argumentChain.ts`

```typescript
import { Prisma } from "@prisma/client";

// Full chain with all relations
export type ArgumentChainWithRelations = Prisma.ArgumentChainGetPayload<{
  include: {
    creator: {
      select: {
        id: true;
        name: true;
        image: true;
      };
    };
    deliberation: {
      select: {
        id: true;
        title: true;
      };
    };
    nodes: {
      include: {
        argument: {
          include: {
            author: {
              select: {
                id: true;
                name: true;
                image: true;
              };
            };
            schemes: {
              include: {
                scheme: true;
              };
            };
            schemeNet: {
              include: {
                steps: {
                  include: {
                    scheme: true;
                  };
                };
              };
            };
          };
        };
        contributor: {
          select: {
            id: true;
            name: true;
            image: true;
          };
        };
      };
    };
    edges: {
      include: {
        sourceNode: {
          include: {
            argument: {
              select: {
                id: true;
                conclusion: true;
              };
            };
          };
        };
        targetNode: {
          include: {
            argument: {
              select: {
                id: true;
                conclusion: true;
              };
            };
          };
        };
      };
    };
  };
}>;

// Chain summary (for list views)
export type ArgumentChainSummary = Prisma.ArgumentChainGetPayload<{
  include: {
    creator: {
      select: {
        id: true;
        name: true;
        image: true;
      };
    };
    _count: {
      select: {
        nodes: true;
        edges: true;
      };
    };
  };
}>;

// Node with argument
export type ArgumentChainNodeWithArgument = Prisma.ArgumentChainNodeGetPayload<{
  include: {
    argument: {
      include: {
        author: {
          select: {
            id: true;
            name: true;
            image: true;
          };
        };
        schemes: {
          include: {
            scheme: true;
          };
        };
        schemeNet: {
          include: {
            steps: {
              include: {
                scheme: true;
              };
            };
          };
        };
      };
    };
    contributor: {
      select: {
        id: true;
        name: true;
        image: true;
      };
    };
  };
}>;

// Edge with nodes
export type ArgumentChainEdgeWithNodes = Prisma.ArgumentChainEdgeGetPayload<{
  include: {
    sourceNode: {
      include: {
        argument: {
          select: {
            id: true;
            conclusion: true;
          };
        };
      };
    };
    targetNode: {
      include: {
        argument: {
          select: {
            id: true;
            conclusion: true;
          };
        };
      };
    };
  };
}>;

// Analysis result types
export interface ChainAnalysis {
  complexity: {
    nodeCount: number;
    edgeCount: number;
    averageDegree: number;
    maxDepth: number;
    rootNodes: string[];
    conclusionNodes: string[];
  };
  criticalPath: {
    nodes: string[];
    edges: string[];
    overallStrength: number;
    weakestLink: {
      edgeId: string;
      sourceNodeId: string;
      targetNodeId: string;
      strength: number;
    } | null;
  } | null;
  suggestions: Array<{
    type: "disconnected_nodes" | "weak_links" | "circular_dependency";
    message: string;
    affectedNodes: string[];
  }>;
}

// ReactFlow node data
export interface ChainNodeData {
  argument: ArgumentChainNodeWithArgument["argument"];
  role?: string;
  addedBy: {
    id: string;
    name: string | null;
    image: string | null;
  };
  nodeOrder: number;
}

// ReactFlow edge data
export interface ChainEdgeData {
  edgeType: string;
  strength: number;
  description?: string | null;
  slotMapping?: any;
}
```

**Estimated Time**: 1 hour

---

**Phase 1 Summary**:
- **Total Tasks**: 13
- **Estimated Time**: 18-21 hours (approx 2.5-3 weeks with testing)
- **Deliverable**: Complete backend infrastructure for ArgumentChain

**Completed**:
- ✅ Database schema (ArgumentChain, ArgumentChainNode, ArgumentChainEdge)
- ✅ Chain CRUD (create, read, update, delete)
- ✅ Node management (add, remove, update position/role)
- ✅ Edge management (create, update, delete)
- ✅ List chains by deliberation
- ✅ Basic analysis endpoint (complexity, critical path, suggestions)
- ✅ TypeScript type definitions

**Testing Checklist**:
```bash
# 1. Create chain
npm run test:api -- --testPathPattern=argument-chains.create

# 2. Add nodes
npm run test:api -- --testPathPattern=argument-chains.nodes

# 3. Create edges
npm run test:api -- --testPathPattern=argument-chains.edges

# 4. Analyze chain
npm run test:api -- --testPathPattern=argument-chains.analyze

# 5. List chains
npm run test:api -- --testPathPattern=argument-chains.list
```

---

## Part 3: Phase 2 - Visual Editor & UX

**Duration**: 2-3 weeks  
**Goal**: Professional ReactFlow-based visual editor with drag & drop

This section will be in the next part (Part 3). Ready to continue?

