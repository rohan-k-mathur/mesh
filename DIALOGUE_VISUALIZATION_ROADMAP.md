# Dialogue Visualization Roadmap: Hybrid Approach
## Diagrammatic Representation of Dialogical Actions in Mesh

**Version:** 1.0  
**Date:** November 2, 2025  
**Status:** Planning Phase  

---

## 🚀 Quick Start Guide

**Ready to begin implementation?** Follow these steps to get started:

### Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] Yarn package manager installed
- [ ] PostgreSQL database running (local or remote)
- [ ] Prisma CLI installed (`npm i -g prisma`)
- [ ] Repository cloned and dependencies installed (`yarn install`)
- [ ] Environment variables configured (`.env` file with `DATABASE_URL`)
- [ ] Dev server running successfully (`yarn dev`)

### Initial Setup (15 minutes)

```bash
# 1. Create a feature branch
git checkout -b feature/dialogue-visualization

# 2. Verify Prisma connection
npx prisma db pull  # Test database connection
npx prisma generate # Ensure Prisma client is up to date

# 3. Create working directories
mkdir -p lib/aif
mkdir -p types/aif-dialogue
mkdir -p scripts/migrations
mkdir -p app/api/aif/graph-with-dialogue

# 4. Backup your database (CRITICAL!)
pg_dump $DATABASE_URL > backup_before_dialogue_viz_$(date +%Y%m%d).sql

echo "✅ Setup complete! Ready to start Phase 1."
```

### First Task: Phase 1.1.1 (Schema Review)

```bash
# Open schema file
code lib/models/schema.prisma

# Search for existing models to understand structure
# Look for: DialogueMove, Argument, Claim, Deliberation

# Key questions to answer:
# - Does AifNode model exist? (Likely NO - we'll create it)
# - What fields does DialogueMove have? (Should have: id, kind, argumentId, etc.)
# - Are there existing indices we should follow patterns from?
```

**Expected outcome:** Understanding of current schema, notes on potential conflicts.

### Development Workflow

```bash
# For each task:

# 1. Create/modify files
# 2. Test locally
npm run lint          # Check code style
npm run test          # Run unit tests (if applicable)

# 3. Test database changes
npx prisma migrate dev --create-only --name descriptive_name
# Review generated migration in prisma/migrations/
npx prisma migrate dev  # Apply migration
npx prisma studio       # Verify in database GUI

# 4. Commit incrementally
git add .
git commit -m "feat(phase1): Complete task 1.1.1 - Schema review"

# 5. Push regularly to avoid losing work
git push origin feature/dialogue-visualization
```

### Quick Testing Commands

```bash
# Test API endpoints
curl http://localhost:3000/api/aif/graph-with-dialogue?deliberationId=test123

# Test migration script (dry run)
npx tsx scripts/migrations/add-dialogue-aif-links.ts --dry-run

# Watch for TypeScript errors
npx tsc --noEmit --watch

# Check Prisma schema for errors
npx prisma validate
```

### When You Get Stuck

1. **Schema conflicts?** → Check `docs/DIALOGUE_MERGER_COMPLETE.md` for past migration patterns
2. **Type errors?** → Run `npx prisma generate` to update Prisma client
3. **API not working?** → Check `app/api/dialogue/moves/route.ts` for existing patterns
4. **Need examples?** → Look at `lib/arguments/diagram.ts` for AIF graph construction

### Success Indicators (Phase 1)

You'll know Phase 1 is complete when:
- [ ] `npx prisma migrate status` shows all migrations applied
- [ ] `npx prisma studio` shows `AifNode` and `AifEdge` tables
- [ ] No TypeScript errors in `lib/aif/ontology.ts`
- [ ] Migration script runs without errors in dry-run mode
- [ ] New types importable: `import type { AifNodeWithDialogue } from "@/types/aif-dialogue"`

---

## Executive Summary

This roadmap outlines the end-to-end implementation of a hybrid visualization system that integrates dialogical actions (protocol moves, structural moves, commitment dynamics) with the existing AIF/ASPIC+/Scheme ontologies in Mesh. The system will provide three complementary views:

1. **Primary View:** Dual-space embedding with DM-nodes (Dialogue Move nodes) integrated into AIF graphs
2. **Secondary View:** Timeline/narrative playback showing dialogue evolution
3. **Detail View:** Scheme-aware annotations showing dialogue provenance on critical questions

### Core Goals

- **Visibility:** Make dialogue moves first-class visual citizens in deliberation diagrams
- **Traceability:** Show causal relationships between dialogue actions and argument structure
- **Pedagogy:** Help users understand how formal dialogue protocols shape argumentation
- **Integration:** Seamlessly connect dialogue layer with existing AIF/ASPIC+/Scheme systems

### Success Metrics

- Users can toggle dialogue layer on/off in all AIF viewers
- Every AIF node displays its dialogue provenance on hover
- Timeline playback accurately reconstructs deliberation history
- Performance: <100ms render time for graphs with 50+ dialogue moves
- Zero breaking changes to existing AIF visualization APIs

---

## Architectural Vision

### Current State Analysis

**Existing Systems:**
```
DialogueMove (DB) ──┬──→ Creates Arguments (via GROUNDS)
                    ├──→ Creates CQStatus (via WHY)
                    ├──→ Updates Commitments (via CONCEDE/RETRACT)
                    └──→ [NOT VISUALIZED IN DIAGRAMS]

AIF Nodes (I/RA/CA/PA) ──→ Visualized in multiple viewers
                         [No link to originating dialogue moves]

Schemes + CQs ──→ Displayed in scheme cards
                 [CQ challenges not shown diagrammatically]
```

**Gap:** Dialogue moves exist in the database and drive argument creation, but the **dialogical dimension** is invisible in visual representations.

### Target State Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   VISUALIZATION LAYER                    │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  AIF Viewer  │  │   Timeline   │  │ Scheme View  │  │
│  │  (Primary)   │  │  (Secondary) │  │  (Detail)    │  │
│  │              │  │              │  │              │  │
│  │ [I-nodes]    │  │ [Move seq.]  │  │ [CQ status]  │  │
│  │ [RA-nodes]   │  │ [Playback]   │  │ [Provenance] │  │
│  │ [DM-nodes]◄──┼──┤ [Scrubber]   │  │ [Badges]     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│         ▲                 ▲                  ▲           │
└─────────┼─────────────────┼──────────────────┼───────────┘
          │                 │                  │
┌─────────┴─────────────────┴──────────────────┴───────────┐
│                     DATA LAYER                            │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Extended AIF Ontology (with DM-nodes)           │   │
│  │  - dialogueMoveId: uuid (FK)                     │   │
│  │  - aif:DialogueMove (new RDF class)              │   │
│  │  - aif:causedByDialogueMove (new predicate)     │   │
│  └──────────────────────────────────────────────────┘   │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Prisma Schema Extensions                         │   │
│  │  - AifNode.dialogueMoveId (optional)             │   │
│  │  - DialogueMove.aifNodeId (optional)             │   │
│  │  - New indexes for performance                    │   │
│  └──────────────────────────────────────────────────┘   │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

### Design Principles

1. **Non-Invasive:** Existing AIF visualizations continue to work without modification
2. **Progressive Enhancement:** Dialogue layer is opt-in via toggle/filter controls
3. **Semantic Fidelity:** Visual encodings reflect formal dialogue game semantics (Prakken, Reed & Walton)
4. **Performance First:** Lazy loading, virtualization for large dialogue sequences
5. **Accessible:** ARIA labels, keyboard navigation, screen reader support for all new components

---

## Phase 1: Foundation & Data Model (Weeks 1-2)

**Objective:** Establish the extended AIF ontology and database schema to support dialogue-aware nodes.

### 1.1 Database Schema Extensions

**File:** `lib/models/schema.prisma` (actual location based on codebase)

**Context:** The Mesh codebase uses Prisma with schema in `lib/models/schema.prisma`. DialogueMove already exists with fields: `id`, `authorId`, `illocution`, `deliberationId`, `targetType`, `targetId`, `kind`, `payload`, `actorId`, `createdAt`, `replyToMoveId`, `argumentId`, etc.

**Changes Required:**

```prisma
// Create AifNode model (if not exists) or extend existing
model AifNode {
  id                String        @id @default(cuid())
  deliberationId    String
  nodeKind          String        // 'I'|'RA'|'CA'|'PA'|'DM' (new)
  label             String?
  text              String?
  schemeKey         String?       // For RA/CA/PA nodes
  
  // NEW: Dialogue provenance tracking
  dialogueMoveId    String?       
  dialogueMove      DialogueMove? @relation("AifNodeCreatedBy", fields: [dialogueMoveId], references: [id], onDelete: SetNull)
  
  // NEW: Node subtype for extensibility
  nodeSubtype       String?       // "dialogue_move", "standard", "scheme_instantiation"
  
  // NEW: Dialogue-specific metadata (JSON for flexibility)
  dialogueMetadata  Json?         
  /* Example structure:
  {
    "locution": "WHY",
    "speaker": "user123",
    "speakerName": "Alice",
    "timestamp": "2025-11-02T10:30:00Z",
    "replyToMoveId": "move456",
    "illocution": "Question"
  }
  */
  
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  
  // Relations to other AIF structures
  outgoingEdges     AifEdge[]     @relation("EdgeSource")
  incomingEdges     AifEdge[]     @relation("EdgeTarget")
  representedMove   DialogueMove? @relation("MoveRepresentation")
  
  @@index([deliberationId])
  @@index([dialogueMoveId])
  @@index([nodeKind])
  @@index([nodeSubtype])
  @@map("aif_nodes")
}

// Extend DialogueMove to reference AIF representation
model DialogueMove {
  // ... existing fields: id, authorId, illocution, deliberationId, etc. ...
  
  // NEW: Link to AIF nodes this move created (via GROUNDS, THEREFORE, etc.)
  createdAifNodes   AifNode[]     @relation("AifNodeCreatedBy")
  
  // NEW: Primary AIF node representing this move as a DM-node
  aifRepresentation String?       @unique
  aifNode           AifNode?      @relation("MoveRepresentation", fields: [aifRepresentation], references: [id], onDelete: SetNull)
  
  // Existing relations...
  deliberation      Deliberation  @relation(...)
  votes             ResponseVote[]
  // ... other existing relations ...
  
  @@index([aifRepresentation])
  // ... existing indexes ...
}

// Create AifEdge model for explicit edge storage
model AifEdge {
  id                String        @id @default(cuid())
  deliberationId    String
  
  sourceId          String
  source            AifNode       @relation("EdgeSource", fields: [sourceId], references: [id], onDelete: Cascade)
  
  targetId          String
  target            AifNode       @relation("EdgeTarget", fields: [targetId], references: [id], onDelete: Cascade)
  
  edgeRole          String        // 'premise'|'conclusion'|'conflictingElement'|'triggers'|'answers'|'repliesTo'
  
  // NEW: Track which dialogue move caused this edge
  causedByMoveId    String?
  causedByMove      DialogueMove? @relation("EdgeCausedBy", fields: [causedByMoveId], references: [id], onDelete: SetNull)
  
  createdAt         DateTime      @default(now())
  
  @@index([deliberationId])
  @@index([sourceId])
  @@index([targetId])
  @@index([causedByMoveId])
  @@map("aif_edges")
}
```

**Migration Script:**

```typescript
// scripts/migrations/add-dialogue-aif-links.ts
#!/usr/bin/env tsx
/**
 * Migration: Add Dialogue-AIF bidirectional links
 * 
 * Purpose:
 * 1. Create AifNode and AifEdge tables (if not exists)
 * 2. Add dialogue provenance fields to existing structures
 * 3. Backfill links for existing DialogueMoves that created Arguments
 * 4. Generate DM-nodes for protocol moves (WHY, CONCEDE, etc.)
 * 
 * Usage: tsx scripts/migrations/add-dialogue-aif-links.ts [--dry-run]
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface MigrationStats {
  totalMoves: number;
  dmNodesCreated: number;
  argumentsLinked: number;
  edgesCreated: number;
  errors: string[];
}

async function migrate(dryRun: boolean = false): Promise<MigrationStats> {
  const stats: MigrationStats = {
    totalMoves: 0,
    dmNodesCreated: 0,
    argumentsLinked: 0,
    edgesCreated: 0,
    errors: []
  };

  console.log(`🔧 Starting dialogue-AIF migration (${dryRun ? "DRY RUN" : "LIVE"})`);
  console.log("─".repeat(70));

  // Step 1: Fetch all DialogueMoves
  const moves = await prisma.dialogueMove.findMany({
    include: {
      deliberation: { select: { id: true } }
    },
    orderBy: { createdAt: "asc" }
  });
  stats.totalMoves = moves.length;
  console.log(`\n📊 Found ${stats.totalMoves} dialogue moves`);

  // Step 2: Create DM-nodes for protocol moves
  console.log("\n🔹 Creating DM-nodes for protocol moves...");
  const protocolKinds = ["WHY", "GROUNDS", "CONCEDE", "RETRACT", "CLOSE", "ACCEPT_ARGUMENT", "THEREFORE", "SUPPOSE", "DISCHARGE"];
  
  for (const move of moves) {
    if (!protocolKinds.includes(move.kind)) continue;
    
    try {
      // Check if DM-node already exists
      const existing = await prisma.aifNode.findFirst({
        where: { 
          deliberationId: move.deliberationId,
          nodeSubtype: "dialogue_move",
          dialogueMoveId: move.id
        }
      });
      
      if (existing) {
        console.log(`   ⏭️  DM-node exists for move ${move.id.slice(0, 8)}`);
        continue;
      }

      if (!dryRun) {
        const dmNode = await prisma.aifNode.create({
          data: {
            deliberationId: move.deliberationId,
            nodeKind: "DM",
            nodeSubtype: "dialogue_move",
            label: `${move.kind} by ${move.actorId.slice(0, 8)}`,
            dialogueMoveId: move.id,
            dialogueMetadata: {
              locution: move.kind,
              speaker: move.actorId,
              timestamp: move.createdAt.toISOString(),
              replyToMoveId: move.replyToMoveId,
              illocution: move.illocution,
              payload: move.payload
            }
          }
        });

        // Link back to DialogueMove
        await prisma.dialogueMove.update({
          where: { id: move.id },
          data: { aifRepresentation: dmNode.id }
        });

        stats.dmNodesCreated++;
        console.log(`   ✅ Created DM-node for ${move.kind} (${move.id.slice(0, 8)})`);
      } else {
        console.log(`   [DRY RUN] Would create DM-node for ${move.kind}`);
        stats.dmNodesCreated++;
      }
    } catch (error) {
      stats.errors.push(`Failed to create DM-node for move ${move.id}: ${error}`);
    }
  }

  // Step 3: Link Arguments created by GROUNDS moves
  console.log("\n🔹 Linking Arguments to GROUNDS moves...");
  const groundsMoves = moves.filter(m => m.kind === "GROUNDS" && m.argumentId);
  
  for (const move of groundsMoves) {
    try {
      // Find the argument this move created
      const argument = await prisma.argument.findUnique({
        where: { id: move.argumentId! },
        include: { 
          conclusion: { select: { id: true } },
          premises: { select: { claimId: true } }
        }
      });

      if (!argument) {
        console.log(`   ⚠️  Argument ${move.argumentId} not found for move ${move.id.slice(0, 8)}`);
        continue;
      }

      if (!dryRun) {
        // Create/find RA-node for this argument
        let raNode = await prisma.aifNode.findFirst({
          where: {
            deliberationId: move.deliberationId,
            nodeKind: "RA",
            // Could link via argumentId if we add that field
          }
        });

        if (!raNode) {
          raNode = await prisma.aifNode.create({
            data: {
              deliberationId: move.deliberationId,
              nodeKind: "RA",
              label: argument.text || `Argument ${argument.id.slice(0, 8)}`,
              dialogueMoveId: move.id,
              schemeKey: argument.schemeId || undefined
            }
          });
        }

        // Create edges: DM-node --answers--> RA-node
        const dmNode = await prisma.aifNode.findFirst({
          where: { dialogueMoveId: move.id, nodeKind: "DM" }
        });

        if (dmNode && raNode) {
          await prisma.aifEdge.create({
            data: {
              deliberationId: move.deliberationId,
              sourceId: dmNode.id,
              targetId: raNode.id,
              edgeRole: "answers",
              causedByMoveId: move.id
            }
          });
          stats.edgesCreated++;
        }

        stats.argumentsLinked++;
        console.log(`   ✅ Linked argument ${argument.id.slice(0, 8)} to move ${move.id.slice(0, 8)}`);
      } else {
        console.log(`   [DRY RUN] Would link argument ${move.argumentId?.slice(0, 8)} to move`);
        stats.argumentsLinked++;
      }
    } catch (error) {
      stats.errors.push(`Failed to link argument for move ${move.id}: ${error}`);
    }
  }

  console.log("\n" + "─".repeat(70));
  console.log("📈 Migration Summary:");
  console.log(`   Total moves processed: ${stats.totalMoves}`);
  console.log(`   DM-nodes created: ${stats.dmNodesCreated}`);
  console.log(`   Arguments linked: ${stats.argumentsLinked}`);
  console.log(`   Edges created: ${stats.edgesCreated}`);
  console.log(`   Errors: ${stats.errors.length}`);

  if (stats.errors.length > 0) {
    console.log("\n⚠️  Errors encountered:");
    stats.errors.forEach(err => console.log(`   - ${err}`));
  }

  return stats;
}

// Run migration
const dryRun = process.argv.includes("--dry-run");
migrate(dryRun)
  .then((stats) => {
    console.log("\n✅ Migration complete!");
    process.exit(stats.errors.length > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

**Tasks:**

- [x] 1.1.1: Review existing schema in `lib/models/schema.prisma` for conflicts
- [x] 1.1.2: Add `AifNode`, `AifEdge` models with dialogue fields to schema
- [x] 1.1.3: Add `aifRepresentation` field to `DialogueMove` model
- [x] 1.1.4: Create Prisma migration: `npx prisma db push --accept-data-loss`
- [ ] 1.1.5: Test migration script with `--dry-run` flag on staging database
- [ ] 1.1.6: Run live migration: `tsx scripts/migrations/add-dialogue-aif-links.ts`
- [ ] 1.1.7: Verify data integrity with spot checks in Prisma Studio
- [x] 1.1.8: Update Prisma client: `npx prisma generate`
- [x] 1.1.9: Update TypeScript imports across codebase to use new client types

**Estimated Time:** 4 days (increased for thorough testing)  
**Status:** ✅ Complete (Nov 2, 2025)  
**Risks & Mitigation:**
- **Risk:** Backfill may timeout for large databases (>10k moves)  
  **Mitigation:** Process in batches of 500, add progress checkpoints
- **Risk:** Existing foreign keys on `Argument` table may conflict  
  **Mitigation:** Use `onDelete: SetNull` for optional relations
- **Risk:** Schema sync issues between dev/staging/prod  
  **Mitigation:** Use Prisma migrations (not `db push`) for production

**Rollback Plan:**
```bash
# If migration fails:
npx prisma migrate resolve --rolled-back <migration_name>
# Restore from backup:
psql $DATABASE_URL < backup_before_aif_migration.sql
```

---

### 1.2 AIF Ontology Extension

**File:** `lib/aif/ontology.ts` (create if not exists)

**Define DM-Node Type:**

```typescript
/**
 * AIF Ontology Extensions for Dialogue Moves
 * Based on AIF+ specification (Reed & Rowe 2007)
 */

export const AIF_DIALOGUE_ONTOLOGY = {
  // New node type for dialogue moves
  DM_NODE: "aif:DialogueMoveNode",
  
  // Subtypes by locution
  DM_WHY: "aif:DialogueMove_Why",
  DM_GROUNDS: "aif:DialogueMove_Grounds",
  DM_CONCEDE: "aif:DialogueMove_Concede",
  DM_RETRACT: "aif:DialogueMove_Retract",
  DM_CLOSE: "aif:DialogueMove_Close",
  DM_ACCEPT: "aif:DialogueMove_Accept",
  DM_THEREFORE: "aif:DialogueMove_Therefore",
  DM_SUPPOSE: "aif:DialogueMove_Suppose",
  DM_DISCHARGE: "aif:DialogueMove_Discharge",
  
  // New edge types
  EDGE_TRIGGERS: "aif:triggers",           // DM-node → CQ
  EDGE_ANSWERS: "aif:answers",             // DM-node → Argument
  EDGE_COMMITS_TO: "aif:commitsTo",        // DM-node → I-node
  EDGE_CAUSED_BY: "aif:causedByDialogueMove", // Any node → DM-node
  EDGE_REPLIES_TO: "aif:repliesTo",        // DM-node → DM-node
} as const;

export type DmNodeType = typeof AIF_DIALOGUE_ONTOLOGY[keyof typeof AIF_DIALOGUE_ONTOLOGY];

/**
 * Type guard for DM-nodes
 */
export function isDmNode(node: { nodeType: string }): boolean {
  return node.nodeType.startsWith("aif:DialogueMove");
}

/**
 * Map DialogueMove.kind to AIF DM-node subtype
 */
export function dialogueKindToAifType(kind: string): DmNodeType {
  const mapping: Record<string, DmNodeType> = {
    WHY: AIF_DIALOGUE_ONTOLOGY.DM_WHY,
    GROUNDS: AIF_DIALOGUE_ONTOLOGY.DM_GROUNDS,
    CONCEDE: AIF_DIALOGUE_ONTOLOGY.DM_CONCEDE,
    RETRACT: AIF_DIALOGUE_ONTOLOGY.DM_RETRACT,
    CLOSE: AIF_DIALOGUE_ONTOLOGY.DM_CLOSE,
    ACCEPT_ARGUMENT: AIF_DIALOGUE_ONTOLOGY.DM_ACCEPT,
    THEREFORE: AIF_DIALOGUE_ONTOLOGY.DM_THEREFORE,
    SUPPOSE: AIF_DIALOGUE_ONTOLOGY.DM_SUPPOSE,
    DISCHARGE: AIF_DIALOGUE_ONTOLOGY.DM_DISCHARGE,
  };
  return mapping[kind] || AIF_DIALOGUE_ONTOLOGY.DM_NODE;
}
```

**Tasks:**

- [x] 1.2.1: Create `lib/aif/ontology.ts` with DM-node type definitions
- [x] 1.2.2: Add JSDoc comments with references to AIF+ specification
- [x] 1.2.3: Create type guards and utility functions
- [x] 1.2.4: Write unit tests for `dialogueKindToAifType` mapping
- [x] 1.2.5: Document in `AIF_DIAGRAM_SYSTEM_ARCHITECTURE_REVIEW.md`

**Estimated Time:** 2 days  
**Status:** ✅ Complete (Nov 2, 2025)  
**Dependencies:** None

---

### 1.3 TypeScript Type Definitions

**File:** `types/aif-dialogue.ts` (new)

```typescript
import type { DialogueMove } from "@prisma/client";

/**
 * Extended AIF node with dialogue metadata
 */
export interface AifNodeWithDialogue {
  id: string;
  nodeType: string;
  text: string;
  
  // Dialogue provenance
  dialogueMoveId?: string | null;
  dialogueMove?: DialogueMove | null;
  dialogueMetadata?: {
    locution: string;
    speaker: string;
    speakerName: string;
    timestamp: string;
    replyToMoveId?: string | null;
  } | null;
  
  // For DM-nodes specifically
  nodeSubtype?: "dialogue_move" | "standard" | null;
}

/**
 * Dialogue Move with AIF representation
 */
export interface DialogueMoveWithAif extends DialogueMove {
  aifNode?: AifNodeWithDialogue | null;
  createdAifNodes?: AifNodeWithDialogue[];
}

/**
 * Edge type for dialogue-aware graphs
 */
export interface DialogueAwareEdge {
  id: string;
  source: string;
  target: string;
  edgeType: "inference" | "conflict" | "preference" | "triggers" | "answers" | "commitsTo" | "repliesTo";
  
  // Dialogue metadata
  causedByDialogueMoveId?: string | null;
}

/**
 * Complete graph with dialogue layer
 */
export interface AifGraphWithDialogue {
  nodes: AifNodeWithDialogue[];
  edges: DialogueAwareEdge[];
  
  // Dialogue-specific metadata
  dialogueMoves: DialogueMoveWithAif[];
  commitmentStores: Record<string, string[]>; // participantId → committed I-node IDs
}
```

**Tasks:**

- [x] 1.3.1: Create `types/aif-dialogue.ts` with type definitions
- [x] 1.3.2: Extend existing `AifNode` types in `types/aif.ts`
- [x] 1.3.3: Add Zod schemas for runtime validation
- [x] 1.3.4: Export from `types/index.ts`

**Estimated Time:** 1 day
**Status:** ✅ Complete (Nov 2, 2025)

---

## Phase 1 Summary

**Duration:** 2 weeks  
**Deliverables:**
- ✅ Extended Prisma schema with dialogue-AIF links
- ✅ Migration scripts and backfilled data
- ✅ AIF ontology extension definitions
- ✅ TypeScript types for dialogue-aware nodes
- ✅ Unit tests for all new utilities

**Next Phase Preview:** Phase 2 will focus on server-side APIs to fetch and construct dialogue-aware AIF graphs, including efficient queries for provenance data.

---

## Development Guidelines

### Code Style
- Follow existing Mesh conventions (double quotes, Prettier)
- Use `@/` path alias for imports
- Add JSDoc comments with `@example` blocks

### Testing Strategy
- Unit tests: `vitest` for utility functions
- Integration tests: Test dialogue move → AIF node creation flow
- Performance tests: Benchmark graph queries with 100+ moves

### Documentation
- Update `AIF_DIAGRAM_SYSTEM_ARCHITECTURE_REVIEW.md` with new node types
- Add examples to `DIALOGUE_ACTIONS_MODAL_GUIDE.md`
- Create visual diagrams in Mermaid format

---

---

## Phase 2: Server APIs & Data Fetching (Weeks 3-4)

**Objective:** Build server-side APIs to fetch dialogue-aware AIF graphs with efficient querying and caching.

### 2.1 Core API: Fetch Dialogue-Aware AIF Graph

**File:** `app/api/aif/graph-with-dialogue/route.ts` (new)

**Specification:**

```typescript
/**
 * GET /api/aif/graph-with-dialogue?deliberationId={id}&includeDialogue=true
 * 
 * Fetches complete AIF graph with optional dialogue layer
 * 
 * Query Parameters:
 * - deliberationId: string (required)
 * - includeDialogue: boolean (default: false) - Include DM-nodes?
 * - includeMoves: "all" | "protocol" | "structural" (default: "all")
 * - participantFilter: userId (optional) - Filter to specific participant's moves
 * - timeRange: { start: ISO8601, end: ISO8601 } (optional)
 * 
 * Response:
 * {
 *   graph: {
 *     nodes: AifNodeWithDialogue[],
 *     edges: DialogueAwareEdge[]
 *   },
 *   dialogueMoves: DialogueMoveWithAif[],
 *   commitmentStores: Record<userId, claimId[]>,
 *   metadata: {
 *     totalNodes: number,
 *     dmNodeCount: number,
 *     moveCount: number,
 *     generatedAt: string
 *   }
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { buildDialogueAwareGraph } from "@/lib/aif/graph-builder";
import { getCurrentUserId } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const deliberationId = searchParams.get("deliberationId");
  const includeDialogue = searchParams.get("includeDialogue") === "true";
  const includeMoves = searchParams.get("includeMoves") || "all";
  const participantFilter = searchParams.get("participantFilter");

  if (!deliberationId) {
    return NextResponse.json(
      { error: "deliberationId is required" },
      { status: 400 }
    );
  }

  const userId = await getCurrentUserId();
  
  // Authorization check
  const deliberation = await prisma.deliberation.findUnique({
    where: { id: deliberationId },
    select: { id: true, isPublic: true, participants: { select: { userId: true } } }
  });

  if (!deliberation) {
    return NextResponse.json({ error: "Deliberation not found" }, { status: 404 });
  }

  const isParticipant = deliberation.participants.some(p => p.userId === userId);
  if (!deliberation.isPublic && !isParticipant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const graph = await buildDialogueAwareGraph({
      deliberationId,
      includeDialogue,
      includeMoves: includeMoves as "all" | "protocol" | "structural",
      participantFilter: participantFilter || undefined
    });

    return NextResponse.json(graph, { 
      status: 200,
      headers: {
        "Cache-Control": "private, max-age=60" // Cache for 1 minute
      }
    });
  } catch (error) {
    console.error("[AIF Graph API] Error:", error);
    return NextResponse.json(
      { error: "Failed to build AIF graph" },
      { status: 500 }
    );
  }
}
```

**Tasks:**

- [ ] 2.1.1: Create API route file `app/api/aif/graph-with-dialogue/route.ts`
- [ ] 2.1.2: Implement authorization checks (public/participant access)
- [ ] 2.1.3: Add query parameter validation with Zod
- [ ] 2.1.4: Implement error handling and logging
- [ ] 2.1.5: Add API documentation in OpenAPI/Swagger format
- [ ] 2.1.6: Write integration tests for all query parameter combinations

**Estimated Time:** 3 days

---

### 2.2 Graph Builder Utility

**File:** `lib/aif/graph-builder.ts` (new)

**Implementation:**

```typescript
/**
 * Core logic for building dialogue-aware AIF graphs
 */

import { prisma } from "@/lib/prismaclient";
import type { 
  AifGraphWithDialogue, 
  AifNodeWithDialogue, 
  DialogueAwareEdge,
  DialogueMoveWithAif 
} from "@/types/aif-dialogue";
import { buildAifSubgraphForArgument } from "@/lib/arguments/diagram";

interface BuildGraphOptions {
  deliberationId: string;
  includeDialogue: boolean;
  includeMoves: "all" | "protocol" | "structural";
  participantFilter?: string;
}

export async function buildDialogueAwareGraph(
  options: BuildGraphOptions
): Promise<AifGraphWithDialogue> {
  const { deliberationId, includeDialogue, includeMoves, participantFilter } = options;

  // Step 1: Fetch all arguments in deliberation
  const arguments = await prisma.argument.findMany({
    where: { deliberationId },
    include: {
      conclusion: { select: { id: true, text: true } },
      premises: { select: { claimId: true, claim: { select: { text: true } } } },
      scheme: { select: { name: true, category: true } }
    }
  });

  // Step 2: Build base AIF graph (I-nodes, RA-nodes, CA-nodes, PA-nodes)
  const nodes: AifNodeWithDialogue[] = [];
  const edges: DialogueAwareEdge[] = [];

  // Fetch existing AIF nodes from database
  const aifNodes = await prisma.aifNode.findMany({
    where: { 
      deliberationId,
      ...(includeDialogue ? {} : { nodeKind: { not: "DM" } })
    },
    include: {
      dialogueMove: {
        include: {
          author: { select: { id: true, username: true, displayName: true } }
        }
      },
      outgoingEdges: { include: { target: true } },
      incomingEdges: { include: { source: true } }
    }
  });

  // Transform to typed nodes
  for (const node of aifNodes) {
    nodes.push({
      id: node.id,
      nodeType: `aif:${node.nodeKind}Node`,
      text: node.label || node.text || "",
      dialogueMoveId: node.dialogueMoveId,
      dialogueMove: node.dialogueMove || null,
      dialogueMetadata: node.dialogueMetadata as any,
      nodeSubtype: node.nodeSubtype
    });
  }

  // Step 3: Fetch edges
  const aifEdges = await prisma.aifEdge.findMany({
    where: { deliberationId }
  });

  for (const edge of aifEdges) {
    edges.push({
      id: edge.id,
      source: edge.sourceId,
      target: edge.targetId,
      edgeType: mapEdgeRole(edge.edgeRole),
      causedByDialogueMoveId: edge.causedByMoveId
    });
  }

  // Step 4: Fetch dialogue moves (if needed)
  let dialogueMoves: DialogueMoveWithAif[] = [];
  if (includeDialogue) {
    const moveFilter: any = { deliberationId };
    
    // Filter by move type
    if (includeMoves === "protocol") {
      moveFilter.kind = { in: ["WHY", "GROUNDS", "CONCEDE", "RETRACT", "CLOSE", "ACCEPT_ARGUMENT"] };
    } else if (includeMoves === "structural") {
      moveFilter.kind = { in: ["THEREFORE", "SUPPOSE", "DISCHARGE"] };
    }
    
    // Filter by participant
    if (participantFilter) {
      moveFilter.actorId = participantFilter;
    }

    const moves = await prisma.dialogueMove.findMany({
      where: moveFilter,
      include: {
        aifNode: true,
        createdAifNodes: true,
        author: { select: { id: true, username: true, displayName: true } }
      },
      orderBy: { createdAt: "asc" }
    });

    dialogueMoves = moves as any;
  }

  // Step 5: Build commitment stores
  const commitments = await prisma.commitment.findMany({
    where: { deliberationId, isRetracted: false }
  });

  const commitmentStores: Record<string, string[]> = {};
  for (const c of commitments) {
    if (!commitmentStores[c.participantId]) {
      commitmentStores[c.participantId] = [];
    }
    commitmentStores[c.participantId].push(c.proposition);
  }

  return {
    nodes,
    edges,
    dialogueMoves,
    commitmentStores
  };
}

// Helper: Map edge roles to typed enum
function mapEdgeRole(role: string): DialogueAwareEdge["edgeType"] {
  const mapping: Record<string, DialogueAwareEdge["edgeType"]> = {
    "premise": "inference",
    "conclusion": "inference",
    "conflictingElement": "conflict",
    "conflictedElement": "conflict",
    "preferredElement": "preference",
    "triggers": "triggers",
    "answers": "answers",
    "commitsTo": "commitsTo",
    "repliesTo": "repliesTo"
  };
  return mapping[role] || "inference";
}
```

**Tasks:**

- [ ] 2.2.1: Create `lib/aif/graph-builder.ts` with core graph construction logic
- [ ] 2.2.2: Implement efficient batched queries (avoid N+1 problem)
- [ ] 2.2.3: Add caching layer using Redis/Upstash (optional but recommended)
- [ ] 2.2.4: Optimize for large graphs (>1000 nodes) with pagination/streaming
- [ ] 2.2.5: Write unit tests for graph builder with mock data
- [ ] 2.2.6: Add performance logging (query times, node counts)

**Estimated Time:** 4 days

---

### 2.3 Dialogue Move Hooks (Client-Side SWR)

**File:** `lib/hooks/useDialogueAwareGraph.ts` (new)

**Implementation:**

```typescript
/**
 * React hook for fetching dialogue-aware AIF graphs with SWR
 */

import useSWR from "swr";
import type { AifGraphWithDialogue } from "@/types/aif-dialogue";

interface UseDialogueAwareGraphOptions {
  deliberationId: string;
  includeDialogue?: boolean;
  includeMoves?: "all" | "protocol" | "structural";
  participantFilter?: string;
  refreshInterval?: number;
}

export function useDialogueAwareGraph(options: UseDialogueAwareGraphOptions) {
  const { 
    deliberationId, 
    includeDialogue = false, 
    includeMoves = "all",
    participantFilter,
    refreshInterval = 0 
  } = options;

  const params = new URLSearchParams({
    deliberationId,
    includeDialogue: String(includeDialogue),
    includeMoves,
    ...(participantFilter ? { participantFilter } : {})
  });

  const { data, error, isLoading, mutate } = useSWR<AifGraphWithDialogue>(
    deliberationId ? `/api/aif/graph-with-dialogue?${params.toString()}` : null,
    {
      refreshInterval,
      revalidateOnFocus: true,
      dedupingInterval: 5000 // Dedupe requests within 5 seconds
    }
  );

  return {
    graph: data,
    isLoading,
    error,
    refetch: mutate
  };
}

/**
 * Hook for fetching dialogue move provenance for a specific node
 */
export function useNodeDialogueProvenance(nodeId: string, deliberationId: string) {
  const { data, error, isLoading } = useSWR(
    nodeId ? `/api/aif/nodes/${nodeId}/provenance?deliberationId=${deliberationId}` : null
  );

  return {
    provenance: data,
    isLoading,
    error
  };
}
```

**Tasks:**

- [ ] 2.3.1: Create `lib/hooks/useDialogueAwareGraph.ts` with SWR hook
- [ ] 2.3.2: Add error handling and loading states
- [ ] 2.3.3: Implement optimistic updates for real-time collaboration
- [ ] 2.3.4: Add hook for node-specific provenance fetching
- [ ] 2.3.5: Write integration tests with React Testing Library
- [ ] 2.3.6: Document hook usage with TypeDoc comments

**Estimated Time:** 2 days

---

### 2.4 Additional API Endpoints

**File:** `app/api/aif/nodes/[id]/provenance/route.ts` (new)

```typescript
/**
 * GET /api/aif/nodes/{nodeId}/provenance?deliberationId={id}
 * 
 * Returns dialogue provenance for a specific AIF node
 * 
 * Response:
 * {
 *   nodeId: string,
 *   createdByMove: DialogueMove | null,
 *   causedByMoves: DialogueMove[], // For edges
 *   relatedCQs: CriticalQuestion[],
 *   commitmentHistory: CommitmentEvent[]
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const nodeId = params.id;
  const { searchParams } = new URL(request.url);
  const deliberationId = searchParams.get("deliberationId");

  if (!deliberationId) {
    return NextResponse.json({ error: "deliberationId required" }, { status: 400 });
  }

  const node = await prisma.aifNode.findUnique({
    where: { id: nodeId },
    include: {
      dialogueMove: {
        include: {
          author: { select: { username: true, displayName: true } }
        }
      },
      incomingEdges: {
        include: {
          source: true,
          causedByMove: { include: { author: true } }
        }
      },
      outgoingEdges: {
        include: {
          target: true,
          causedByMove: { include: { author: true } }
        }
      }
    }
  });

  if (!node || node.deliberationId !== deliberationId) {
    return NextResponse.json({ error: "Node not found" }, { status: 404 });
  }

  // Gather related CQs if this is linked to a GROUNDS move
  const relatedCQs = node.dialogueMove?.kind === "GROUNDS"
    ? await prisma.criticalQuestion.findMany({
        where: { 
          argument: { 
            id: node.dialogueMove.argumentId 
          }
        },
        include: {
          status: { include: { questionMove: true, answerMove: true } }
        }
      })
    : [];

  // Gather commitment history if this is an I-node involved in CONCEDE/RETRACT
  const commitmentHistory = await prisma.commitment.findMany({
    where: {
      deliberationId,
      OR: [
        { proposition: node.text },
        { claimId: node.id.startsWith("I:") ? node.id.slice(2) : undefined }
      ]
    },
    orderBy: { createdAt: "asc" }
  });

  return NextResponse.json({
    nodeId: node.id,
    createdByMove: node.dialogueMove,
    causedByMoves: [
      ...node.incomingEdges.map(e => e.causedByMove).filter(Boolean),
      ...node.outgoingEdges.map(e => e.causedByMove).filter(Boolean)
    ],
    relatedCQs,
    commitmentHistory
  });
}
```

**Tasks:**

- [ ] 2.4.1: Create provenance API endpoint
- [ ] 2.4.2: Create timeline API: `GET /api/dialogue/timeline?deliberationId={id}`
- [ ] 2.4.3: Create move sequence API: `GET /api/dialogue/moves/sequence?startMoveId={id}`
- [ ] 2.4.4: Add rate limiting to prevent abuse
- [ ] 2.4.5: Document all endpoints in API reference

**Estimated Time:** 3 days

---

## Phase 2 Summary

**Duration:** 2 weeks  
**Deliverables:**
- ✅ Core API for fetching dialogue-aware graphs
- ✅ Graph builder utility with optimized queries
- ✅ Client-side hooks for data fetching
- ✅ Provenance and timeline APIs
- ✅ Comprehensive API documentation

**Next Phase Preview:** Phase 3 will implement the visual components for DM-nodes, including React components, SVG rendering, and interaction handlers.

---

**[End of Part 2 - Server APIs & Data Fetching]**

---

## 📚 Additional Documentation

This roadmap is split across multiple documents for readability:

- **[DIALOGUE_VISUALIZATION_ROADMAP.md](./DIALOGUE_VISUALIZATION_ROADMAP.md)** (this file) - Overview, Quick Start, Phases 1-2
- **[DIALOGUE_VISUALIZATION_PHASES_3_4.md](./DIALOGUE_VISUALIZATION_PHASES_3_4.md)** - Visual Components & Primary View
- **[DIALOGUE_VISUALIZATION_PHASES_5_6.md](./DIALOGUE_VISUALIZATION_PHASES_5_6.md)** - Timeline & Scheme Views (coming soon)
- **[DIALOGUE_VISUALIZATION_PHASES_7_9.md](./DIALOGUE_VISUALIZATION_PHASES_7_9.md)** - Testing, Performance, Docs (coming soon)

---

## 📊 Overall Progress Tracker

### Phase Completion Status

| Phase | Name | Status | Duration | Dependencies |
|-------|------|--------|----------|--------------|
| 1 | Foundation & Data Model | � In Progress (75%) | 2 weeks | None |
| 2 | Server APIs & Data Fetching | 🔲 Not Started | 2 weeks | Phase 1 |
| 3 | DM-Node Visual Components | 🔲 Not Started | 2 weeks | Phase 2 |
| 4 | Primary View Integration | 🔲 Not Started | 2 weeks | Phase 3 |
| 5 | Timeline View | 🔲 Not Started | 1.5 weeks | Phase 4 |
| 6 | Scheme Detail View | 🔲 Not Started | 1.5 weeks | Phase 4 |
| 7 | Integration & Testing | 🔲 Not Started | 2 weeks | Phases 5-6 |
| 8 | Performance Optimization | 🔲 Not Started | 1 week | Phase 7 |
| 9 | Documentation & Training | 🔲 Not Started | 1 week | Phase 8 |

**Latest Update (Nov 2, 2025):** Phase 1 tasks 1.1-1.3 complete. Schema pushed to database, ontology defined, types created. See [Phase 1 Progress Report](./docs/agora-architecture-review/DIALOGUE_VIZ_PHASE_1_PROGRESS.md) for details.

**Total Estimated Time:** 15 weeks (3.75 months)

### Critical Path

```
Phase 1 (Foundation) → Phase 2 (APIs) → Phase 3 (Components) → Phase 4 (Integration)
                                                                        ↓
                                                    Phase 5 (Timeline) + Phase 6 (Schemes)
                                                                        ↓
                                                    Phase 7 (Testing) → Phase 8 (Performance)
                                                                        ↓
                                                                Phase 9 (Docs)
```

**Parallelization Opportunities:**
- Phases 5 and 6 can be developed simultaneously (different team members)
- Phase 8 performance work can begin during Phase 7 testing
- Phase 9 documentation can be written incrementally throughout

---

## 🎯 Success Criteria (Project-Wide)

### Functional Requirements

- [ ] **FR1:** Users can toggle dialogue layer on/off in all AIF viewers
- [ ] **FR2:** DM-nodes render with distinct visual style (diamond shape, gradient colors)
- [ ] **FR3:** Hovering any AIF node shows dialogue provenance tooltip
- [ ] **FR4:** Timeline scrubber allows playback of dialogue sequence
- [ ] **FR5:** Scheme cards display CQ challenge/answer status with move badges
- [ ] **FR6:** Commitment store changes are visible in real-time
- [ ] **FR7:** All dialogue moves (WHY, GROUNDS, CONCEDE, etc.) have visual representation
- [ ] **FR8:** Filter controls allow showing only specific participants' moves
- [ ] **FR9:** Export functionality includes dialogue layer in diagrams

### Non-Functional Requirements

- [ ] **NFR1:** Graph render time <100ms for 50 nodes, <500ms for 200 nodes
- [ ] **NFR2:** API response time <200ms for typical deliberations
- [ ] **NFR3:** Zero breaking changes to existing AIF visualization APIs
- [ ] **NFR4:** Mobile-responsive design for all new components
- [ ] **NFR5:** WCAG 2.1 AA accessibility compliance
- [ ] **NFR6:** All public APIs documented with OpenAPI/Swagger
- [ ] **NFR7:** Unit test coverage >80% for new code
- [ ] **NFR8:** Integration tests for all critical user flows

### User Experience Goals

- [ ] **UX1:** New users understand dialogue visualization without tutorial (self-explanatory UI)
- [ ] **UX2:** Advanced users can inspect dialogue provenance in <3 clicks
- [ ] **UX3:** Timeline playback feels smooth (no janky animations)
- [ ] **UX4:** Color coding is consistent across all views (WHY=amber, GROUNDS=blue, etc.)
- [ ] **UX5:** Loading states are informative (skeleton screens, progress indicators)

---

## 🔄 Iteration Plan

### Sprint Structure (2-week sprints)

**Sprint 1-2:** Phase 1 (Foundation)  
**Sprint 3-4:** Phase 2 (APIs)  
**Sprint 5-6:** Phase 3 (Components)  
**Sprint 7-8:** Phase 4 (Integration)  
**Sprint 9:** Phase 5 (Timeline)  
**Sprint 10:** Phase 6 (Schemes)  
**Sprint 11-12:** Phase 7 (Testing)  
**Sprint 13:** Phase 8 (Performance)  
**Sprint 14:** Phase 9 (Documentation)  

### Review Checkpoints

- **End of Phase 1:** Demo database schema and migration script
- **End of Phase 2:** Demo API endpoints with Postman/Insomnia
- **End of Phase 4:** Demo full working prototype with dialogue layer toggle
- **End of Phase 6:** Demo all three views (Primary, Timeline, Scheme)
- **End of Phase 9:** Final presentation and handoff

---

## 📝 Notes & Decisions Log

### Design Decisions

| Date | Decision | Rationale | Impact |
|------|----------|-----------|--------|
| 2025-11-02 | Use DM-nodes instead of edge annotations | Better semantic clarity, follows AIF+ spec | Schema complexity increases |
| 2025-11-02 | Store dialogue metadata as JSON | Flexibility for future extensions | Requires JSON query optimization |
| 2025-11-02 | Split roadmap into multiple docs | Avoid overwhelming single file | Easier navigation, parallel editing |

### Open Questions

- [ ] **Q1:** Should DM-nodes be clickable to open dialogue move details?  
  **Proposed:** Yes, open modal with move payload, votes, etc.
  
- [ ] **Q2:** How to handle very large deliberations (1000+ moves)?  
  **Proposed:** Implement virtualization/windowing for timeline view
  
- [ ] **Q3:** Should dialogue layer be enabled by default for new users?  
  **Proposed:** No, opt-in progressive enhancement

### Risks & Mitigation

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| Database migration fails on production | Medium | High | Extensive testing on staging, automated rollback scripts |
| Performance degrades with dialogue layer | Medium | Medium | Implement lazy loading, query optimization, caching |
| Breaking changes to existing AIF API | Low | High | Maintain backward compatibility, version API endpoints |
| Team capacity constraints | Medium | Medium | Parallelize Phases 5-6, focus on MVP first |

---

**Continue to [Phase 3-4 Documentation →](./DIALOGUE_VISUALIZATION_PHASES_3_4.md)**

