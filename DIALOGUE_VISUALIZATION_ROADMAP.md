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

1. **Schema conflicts?** → Check `DEBATE_LAYER_MODERNIZATION_PLAN.md` for ArgumentEdge/ConflictApplication learnings
2. **Type errors?** → Run `npx prisma generate` to update Prisma client
3. **API not working?** → Check `app/api/dialogue/moves/route.ts` for existing patterns
4. **Need examples?** → Look at `scripts/generate-debate-sheets.ts` for claim resolution pattern
5. **Edge generation issues?** → Query ConflictApplication NOT ArgumentEdge (it's empty!)
6. **Support relationships?** → Use ArgumentPremise + Claim lookup (see `structure-import.ts` fixes)

### Success Indicators (Phase 1)

You'll know Phase 1 is complete when:
- [ ] `npx prisma migrate status` shows `add_dialogue_provenance` migration applied
- [ ] `npx prisma studio` shows `DialogueVisualizationNode` table (NOT AifNode/AifEdge)
- [ ] Argument table has `createdByMoveId` field populated for GROUNDS moves
- [ ] ConflictApplication table has `createdByMoveId` field
- [ ] No TypeScript errors in `lib/aif/ontology.ts`
- [ ] Migration script runs without errors in dry-run mode
- [ ] New types importable: `import type { AifNodeWithDialogue } from "@/types/aif-dialogue"`
- [ ] Test query successfully derives edges from ConflictApplication (not ArgumentEdge)

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
6. **Single Source of Truth:** Build on existing data structures (Argument, Claim, ConflictApplication) rather than duplicating data

## ⚠️ ARCHITECTURAL DECISION: Align with Existing Architecture

**Date:** November 2, 2025  
**Decision:** Use existing Argument/Claim/ConflictApplication architecture instead of creating parallel AifNode/AifEdge tables

### Critical Context

Recent work on `generate-debate-sheets.ts` and `structure-import.ts` revealed that:

1. **ArgumentEdge table is EMPTY/LEGACY** (0 records in production)
2. **ConflictApplication is authoritative** for attack relationships (22 records found)
3. **Claim linkage is implicit** through ArgumentPremise → Claim → Argument (conclusion)
4. **Working pattern proven**: Query Arguments/Claims/ConflictApplication, derive edges dynamically

### Why Not Create AifNode/AifEdge Tables?

**Problem with separate tables:**
- Arguments already exist in `Argument` table
- Would create duplicate RA-nodes in `AifNode` table
- Two edge systems: `ConflictApplication` (existing) vs `AifEdge` (new)
- Sync issues: What happens when an Argument is updated?
- Performance overhead: JOIN between AifNode → Argument to get actual data

**Proven alternative:**
- ONE source of truth: `Argument` for arguments, `ConflictApplication` for attacks
- Dialogue visualization = query layer built from existing data
- Less migration risk, simpler mental model
- Existing indexes already optimized

### Implementation Strategy

```
┌─────────────────────────────────────────────────────────┐
│             DIALOGUE VISUALIZATION APPROACH              │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  EXISTING DATA (Single Source of Truth):                 │
│  ├─ Argument table → RA-nodes                            │
│  │  └─ Add: createdByMoveId field                        │
│  ├─ Claim table → I-nodes                                │
│  │  └─ Add: introducedByMoveId field                     │
│  ├─ ConflictApplication → CA-nodes + attack edges        │
│  │  └─ Add: createdByMoveId field                        │
│  └─ ArgumentPremise → support edges (implicit)           │
│                                                           │
│  NEW DATA (Minimal Addition):                            │
│  └─ DialogueVisualizationNode → DM-nodes                 │
│     (ONLY for WHY, CONCEDE, RETRACT - no argument)       │
│                                                           │
│  VISUALIZATION LAYER:                                    │
│  └─ buildDialogueAwareGraph() queries existing tables    │
│     and derives graph dynamically                        │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### References

See related documentation:
- `DEBATE_LAYER_MODERNIZATION_PLAN.md` - Critical learnings about ConflictApplication
- `scripts/generate-debate-sheets.ts` - Working implementation of claim resolution
- `lib/arguments/structure-import.ts` - Fixed to use claim-based patterns
- `lib/arguments/diagram-neighborhoods.ts` - Claim-to-argument mapping pattern

---

## Phase 1: Foundation & Data Model (Weeks 1-2)

**Objective:** Add dialogue provenance tracking to existing data structures and create minimal new tables only for pure dialogue visualization nodes.

### 1.1 Database Schema Extensions

**File:** `lib/models/schema.prisma` (actual location based on codebase)

**Context:** The Mesh codebase uses Prisma with schema in `lib/models/schema.prisma`. DialogueMove already exists. We will ADD dialogue provenance to existing models rather than creating parallel AifNode/AifEdge tables.

**IMPORTANT:** Do NOT create AifNode/AifEdge tables. These would duplicate existing Argument/Claim/ConflictApplication data.

**Changes Required:**

```prisma
// EXTEND existing Argument model with dialogue provenance
model Argument {
  // ... all existing fields ...
  
  // NEW: Track which dialogue move created this argument
  createdByMoveId    String?
  createdByMove      DialogueMove? @relation("ArgumentCreatedBy", fields: [createdByMoveId], references: [id], onDelete: SetNull)
  
  @@index([createdByMoveId])
  // ... existing indexes ...
}

// EXTEND existing ConflictApplication model with dialogue provenance
model ConflictApplication {
  // ... all existing fields ...
  
  // NEW: Track which dialogue move created this attack
  createdByMoveId    String?
  createdByMove      DialogueMove? @relation("ConflictCreatedBy", fields: [createdByMoveId], references: [id], onDelete: SetNull)
  
  @@index([createdByMoveId])
  // ... existing indexes ...
}

// EXTEND existing Claim model with dialogue provenance (for CONCEDE/RETRACT)
model Claim {
  // ... all existing fields ...
  
  // NEW: Track which dialogue move introduced this claim (optional)
  introducedByMoveId String?
  introducedByMove   DialogueMove? @relation("ClaimIntroducedBy", fields: [introducedByMoveId], references: [id], onDelete: SetNull)
  
  @@index([introducedByMoveId])
  // ... existing indexes ...
}

// CREATE NEW table ONLY for pure dialogue visualization nodes
// (WHY, CONCEDE, RETRACT - moves that don't create Arguments)
model DialogueVisualizationNode {
  id                String        @id @default(cuid())
  deliberationId    String
  dialogueMoveId    String        @unique
  dialogueMove      DialogueMove  @relation("VisualizationNode", fields: [dialogueMoveId], references: [id], onDelete: Cascade)
  
  nodeKind          String        // "WHY", "CONCEDE", "RETRACT", etc.
  
  // Metadata for visualization
  metadata          Json?         
  /* Example structure:
  {
    "speaker": "user123",
    "speakerName": "Alice",
    "timestamp": "2025-11-02T10:30:00Z",
    "targetClaimId": "claim456",
    "targetArgumentId": "arg789"
  }
  */
  
  createdAt         DateTime      @default(now())
  
  @@index([deliberationId])
  @@index([nodeKind])
  @@map("dialogue_visualization_nodes")
}

// EXTEND DialogueMove to link to visualization nodes
model DialogueMove {
  // ... all existing fields ...
  
  // NEW: Link to visualization node (for non-argument moves)
  visualizationNode DialogueVisualizationNode? @relation("VisualizationNode")
  
  // NEW: Reverse relations for provenance tracking
  createdArguments  Argument[]              @relation("ArgumentCreatedBy")
  createdConflicts  ConflictApplication[]   @relation("ConflictCreatedBy")
  introducedClaims  Claim[]                 @relation("ClaimIntroducedBy")
  
  // ... existing relations ...
}
```

**Key Design Decisions:**

1. ✅ **Reuse existing tables**: Argument, Claim, ConflictApplication
2. ✅ **Add dialogue provenance**: Track which DialogueMove created each entity
3. ✅ **Minimal new tables**: Only DialogueVisualizationNode for pure dialogue moves (WHY, CONCEDE, RETRACT)
4. ✅ **Derive edges dynamically**: Query ConflictApplication for attacks, ArgumentPremise for support
5. ✅ **No data duplication**: Arguments aren't stored twice

**Migration Script:**

```typescript
// scripts/migrations/add-dialogue-provenance.ts
#!/usr/bin/env tsx
/**
 * Migration: Add Dialogue Provenance to Existing Data Structures
 * 
 * Purpose:
 * 1. Add dialogue provenance fields to Argument, ConflictApplication, Claim
 * 2. Create DialogueVisualizationNode table for pure dialogue moves
 * 3. Backfill links for existing DialogueMoves that created Arguments/Conflicts
 * 4. Generate visualization nodes for protocol moves (WHY, CONCEDE, etc.)
 * 
 * Usage: tsx scripts/migrations/add-dialogue-provenance.ts [--dry-run]
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface MigrationStats {
  totalMoves: number;
  argumentsLinked: number;
  conflictsLinked: number;
  claimsLinked: number;
  vizNodesCreated: number;
  errors: string[];
}

async function migrate(dryRun: boolean = false): Promise<MigrationStats> {
  const stats: MigrationStats = {
    totalMoves: 0,
    argumentsLinked: 0,
    conflictsLinked: 0,
    claimsLinked: 0,
    vizNodesCreated: 0,
    errors: []
  };

  console.log(`🔧 Starting dialogue provenance migration (${dryRun ? "DRY RUN" : "LIVE"})`);
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

  // Step 2: Link GROUNDS moves to Arguments
  console.log("\n🔹 Linking GROUNDS moves to Arguments...");
  const groundsMoves = moves.filter(m => m.kind === "GROUNDS" && m.argumentId);
  
  for (const move of groundsMoves) {
    try {
      const argument = await prisma.argument.findUnique({
        where: { id: move.argumentId! }
      });

      if (!argument) {
        console.log(`   ⚠️  Argument ${move.argumentId} not found`);
        continue;
      }

      if (!dryRun) {
        await prisma.argument.update({
          where: { id: move.argumentId! },
          data: { createdByMoveId: move.id }
        });
        stats.argumentsLinked++;
        console.log(`   ✅ Linked argument ${argument.id.slice(0, 8)} to move ${move.id.slice(0, 8)}`);
      } else {
        console.log(`   [DRY RUN] Would link argument ${move.argumentId?.slice(0, 8)}`);
        stats.argumentsLinked++;
      }
    } catch (error) {
      stats.errors.push(`Failed to link argument for move ${move.id}: ${error}`);
    }
  }

  // Step 3: Link ATTACK moves to ConflictApplications
  console.log("\n🔹 Linking ATTACK moves to ConflictApplications...");
  // Note: We need to infer which ConflictApplications were created by which moves
  // This might require checking timestamps and deliberation context
  
  const attackMoves = moves.filter(m => 
    m.kind === "ATTACK" || m.kind === "REBUT" || m.kind === "UNDERCUT"
  );
  
  for (const move of attackMoves) {
    try {
      // Find ConflictApplications created around the same time
      const conflicts = await prisma.conflictApplication.findMany({
        where: {
          deliberationId: move.deliberationId,
          createdAt: {
            gte: new Date(move.createdAt.getTime() - 5000), // 5 sec before
            lte: new Date(move.createdAt.getTime() + 5000)  // 5 sec after
          }
        }
      });

      if (conflicts.length === 1 && !dryRun) {
        await prisma.conflictApplication.update({
          where: { id: conflicts[0].id },
          data: { createdByMoveId: move.id }
        });
        stats.conflictsLinked++;
        console.log(`   ✅ Linked conflict ${conflicts[0].id.slice(0, 8)} to move ${move.id.slice(0, 8)}`);
      } else if (conflicts.length === 1) {
        console.log(`   [DRY RUN] Would link conflict ${conflicts[0].id.slice(0, 8)}`);
        stats.conflictsLinked++;
      }
    } catch (error) {
      stats.errors.push(`Failed to link conflict for move ${move.id}: ${error}`);
    }
  }

  // Step 4: Create visualization nodes for non-argument moves
  console.log("\n🔹 Creating visualization nodes for pure dialogue moves...");
  const vizMoveKinds = ["WHY", "CONCEDE", "RETRACT", "CLOSE", "ACCEPT_ARGUMENT"];
  
  for (const move of moves) {
    if (!vizMoveKinds.includes(move.kind)) continue;
    
    try {
      const existing = await prisma.dialogueVisualizationNode.findUnique({
        where: { dialogueMoveId: move.id }
      });
      
      if (existing) {
        console.log(`   ⏭️  Viz node exists for move ${move.id.slice(0, 8)}`);
        continue;
      }

      if (!dryRun) {
        await prisma.dialogueVisualizationNode.create({
          data: {
            deliberationId: move.deliberationId,
            dialogueMoveId: move.id,
            nodeKind: move.kind,
            metadata: {
              speaker: move.actorId,
              timestamp: move.createdAt.toISOString(),
              targetType: move.targetType,
              targetId: move.targetId,
              payload: move.payload
            }
          }
        });
        stats.vizNodesCreated++;
        console.log(`   ✅ Created viz node for ${move.kind} (${move.id.slice(0, 8)})`);
      } else {
        console.log(`   [DRY RUN] Would create viz node for ${move.kind}`);
        stats.vizNodesCreated++;
      }
    } catch (error) {
      stats.errors.push(`Failed to create viz node for move ${move.id}: ${error}`);
    }
  }

  console.log("\n" + "─".repeat(70));
  console.log("📈 Migration Summary:");
  console.log(`   Total moves processed: ${stats.totalMoves}`);
  console.log(`   Arguments linked: ${stats.argumentsLinked}`);
  console.log(`   Conflicts linked: ${stats.conflictsLinked}`);
  console.log(`   Claims linked: ${stats.claimsLinked}`);
  console.log(`   Viz nodes created: ${stats.vizNodesCreated}`);
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

- [ ] 1.1.1: Review existing schema in `lib/models/schema.prisma` for conflicts
- [ ] 1.1.2: Add `createdByMoveId` field to `Argument` model
- [ ] 1.1.3: Add `createdByMoveId` field to `ConflictApplication` model
- [ ] 1.1.4: Add `introducedByMoveId` field to `Claim` model (optional)
- [ ] 1.1.5: Create `DialogueVisualizationNode` table for pure dialogue moves
- [ ] 1.1.6: Add reverse relations to `DialogueMove` model
- [ ] 1.1.7: Create Prisma migration: `npx prisma migrate dev --name add_dialogue_provenance`
- [ ] 1.1.8: Test migration script with `--dry-run` flag on staging database
- [ ] 1.1.9: Run live migration: `tsx scripts/migrations/add-dialogue-provenance.ts`
- [ ] 1.1.10: Verify data integrity with spot checks in Prisma Studio
- [ ] 1.1.11: Update Prisma client: `npx prisma generate`
- [ ] 1.1.12: Update TypeScript imports across codebase to use new client types

**Estimated Time:** 3 days (reduced due to simpler approach)  
**Status:** 🔲 Not Started  
**Risks & Mitigation:**
- **Risk:** Backfill may timeout for large databases (>10k moves)  
  **Mitigation:** Process in batches of 500, add progress checkpoints
- **Risk:** Existing foreign keys on `Argument` table may conflict  
  **Mitigation:** Use `onDelete: SetNull` for optional relations
- **Risk:** Schema sync issues between dev/staging/prod  
  **Mitigation:** Use Prisma migrations (not `db push`) for production
- **Risk:** Inferring which ConflictApplication matches which DialogueMove  
  **Mitigation:** Use timestamp heuristics, manual review for ambiguous cases

**Rollback Plan:**
```bash
# If migration fails:
npx prisma migrate resolve --rolled-back add_dialogue_provenance
# Restore from backup:
psql $DATABASE_URL < backup_before_dialogue_provenance.sql

# Remove added fields:
npx prisma migrate dev --name rollback_dialogue_provenance
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
- [ ] 1.2.6: Add reference to ConflictApplication-based edge derivation pattern

**Estimated Time:** 1 day (reduced, ontology already exists)  
**Status:** ✅ Mostly Complete (Nov 2, 2025) - needs documentation update  
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

**Duration:** 1.5 weeks (reduced from 2 weeks)  
**Deliverables:**
- ✅ Extended Prisma schema with dialogue provenance fields on existing models
- ✅ New DialogueVisualizationNode table for pure dialogue moves only
- ✅ Migration scripts and backfilled dialogue provenance links
- ✅ AIF ontology extension definitions
- ✅ TypeScript types for dialogue-aware nodes
- ✅ Documentation of architectural decisions (ConflictApplication pattern)
- ✅ Unit tests for all new utilities

**Key Architectural Decisions:**
1. **No duplicate tables**: Build on existing Argument/Claim/ConflictApplication
2. **Dialogue provenance**: Added `createdByMoveId` fields to track origins
3. **Dynamic edge derivation**: Query ConflictApplication for attacks (proven pattern)
4. **Minimal new tables**: Only DialogueVisualizationNode for non-argument moves

**Next Phase Preview:** Phase 2 will focus on server-side APIs to fetch and construct dialogue-aware AIF graphs using the claim resolution pattern from `generate-debate-sheets.ts`.

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

**CRITICAL:** Follow the pattern from `generate-debate-sheets.ts` - query existing tables, derive edges dynamically.

**Implementation:**

```typescript
/**
 * Core logic for building dialogue-aware AIF graphs
 * 
 * ARCHITECTURE NOTE:
 * - Arguments are stored in Argument table (NOT duplicated in AifNode)
 * - Attack edges derived from ConflictApplication table
 * - Support edges derived from ArgumentPremise + Claim linkage (implicit)
 * - Only pure dialogue moves (WHY, CONCEDE, RETRACT) use DialogueVisualizationNode
 * 
 * See: generate-debate-sheets.ts for proven implementation pattern
 */

import { prisma } from "@/lib/prismaclient";
import type { 
  AifGraphWithDialogue, 
  AifNodeWithDialogue, 
  DialogueAwareEdge,
  DialogueMoveWithAif 
} from "@/types/aif-dialogue";

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

  const nodes: AifNodeWithDialogue[] = [];
  const edges: DialogueAwareEdge[] = [];

  // Step 1: Fetch all arguments (RA-nodes) with dialogue provenance
  const arguments = await prisma.argument.findMany({
    where: { deliberationId },
    include: {
      conclusion: { select: { id: true, text: true } },
      premises: { 
        select: { 
          claimId: true, 
          claim: { select: { id: true, text: true } } 
        } 
      },
      scheme: { select: { id: true, name: true, category: true } },
      createdByMove: { 
        include: { 
          author: { select: { id: true, username: true, displayName: true } } 
        } 
      }
    }
  });

  // Step 2: Build nodes from arguments
  for (const arg of arguments) {
    // RA-node (Reasoning Application node)
    nodes.push({
      id: `RA:${arg.id}`,
      nodeType: "aif:RANode",
      text: arg.text || `Argument using ${arg.scheme?.name || "scheme"}`,
      dialogueMoveId: arg.createdByMoveId,
      dialogueMove: arg.createdByMove || null,
      dialogueMetadata: arg.createdByMove ? {
        locution: arg.createdByMove.kind,
        speaker: arg.createdByMove.actorId,
        speakerName: arg.createdByMove.author?.displayName || arg.createdByMove.author?.username || "Unknown",
        timestamp: arg.createdByMove.createdAt.toISOString(),
        replyToMoveId: arg.createdByMove.replyToMoveId
      } : null,
      nodeSubtype: "standard"
    });

    // I-node for conclusion
    if (arg.conclusion) {
      nodes.push({
        id: `I:${arg.conclusion.id}`,
        nodeType: "aif:INode",
        text: arg.conclusion.text,
        dialogueMoveId: null,
        dialogueMove: null,
        dialogueMetadata: null,
        nodeSubtype: "standard"
      });

      // Edge: RA → I (conclusion)
      edges.push({
        id: `edge:${arg.id}:conclusion`,
        source: `RA:${arg.id}`,
        target: `I:${arg.conclusion.id}`,
        edgeType: "inference",
        causedByDialogueMoveId: arg.createdByMoveId
      });
    }

    // I-nodes for premises and edges: I → RA
    for (const premise of arg.premises) {
      const premiseINodeId = `I:${premise.claimId}`;
      
      // Add I-node if not already added
      if (!nodes.some(n => n.id === premiseINodeId)) {
        nodes.push({
          id: premiseINodeId,
          nodeType: "aif:INode",
          text: premise.claim.text,
          dialogueMoveId: null,
          dialogueMove: null,
          dialogueMetadata: null,
          nodeSubtype: "standard"
        });
      }

      // Edge: I → RA (premise)
      edges.push({
        id: `edge:${premise.claimId}:premise:${arg.id}`,
        source: premiseINodeId,
        target: `RA:${arg.id}`,
        edgeType: "inference",
        causedByDialogueMoveId: arg.createdByMoveId
      });
    }
  }

  // Step 3: Derive attack edges from ConflictApplication (CRITICAL!)
  const conflicts = await prisma.conflictApplication.findMany({
    where: { deliberationId },
    include: {
      createdByMove: {
        include: {
          author: { select: { id: true, username: true, displayName: true } }
        }
      }
    }
  });

  // Build claim-to-argument resolution map (follows generate-debate-sheets.ts pattern)
  const claimToArgMap = new Map<string, string>();
  
  // Map conclusions
  for (const arg of arguments) {
    if (arg.claimId) {
      claimToArgMap.set(arg.claimId, arg.id);
    }
  }
  
  // Map premises
  const allPremises = await prisma.argumentPremise.findMany({
    where: {
      argument: { deliberationId }
    },
    select: { claimId: true, argumentId: true }
  });
  
  for (const prem of allPremises) {
    claimToArgMap.set(prem.claimId, prem.argumentId);
  }

  // Resolve conflicts to CA-nodes and edges
  for (const conflict of conflicts) {
    // Resolve claims to arguments
    let fromArgId = conflict.conflictingArgumentId || 
                    claimToArgMap.get(conflict.conflictingClaimId || "");
    let toArgId = conflict.conflictedArgumentId || 
                  claimToArgMap.get(conflict.conflictedClaimId || "");

    if (!fromArgId || !toArgId) continue; // Skip unresolved conflicts

    const caNodeId = `CA:${conflict.id}`;
    
    // Create CA-node (Conflict Application node)
    nodes.push({
      id: caNodeId,
      nodeType: "aif:CANode",
      text: `${conflict.legacyAttackType || "Attack"}`,
      dialogueMoveId: conflict.createdByMoveId,
      dialogueMove: conflict.createdByMove || null,
      dialogueMetadata: conflict.createdByMove ? {
        locution: conflict.createdByMove.kind,
        speaker: conflict.createdByMove.actorId,
        speakerName: conflict.createdByMove.author?.displayName || "Unknown",
        timestamp: conflict.createdByMove.createdAt.toISOString(),
        replyToMoveId: conflict.createdByMove.replyToMoveId
      } : null,
      nodeSubtype: "standard"
    });

    // Edges: attacking arg → CA, CA → targeted arg
    edges.push({
      id: `edge:${fromArgId}:attacks:${caNodeId}`,
      source: `RA:${fromArgId}`,
      target: caNodeId,
      edgeType: "conflict",
      causedByDialogueMoveId: conflict.createdByMoveId
    });

    edges.push({
      id: `edge:${caNodeId}:targets:${toArgId}`,
      source: caNodeId,
      target: `RA:${toArgId}`,
      edgeType: "conflict",
      causedByDialogueMoveId: conflict.createdByMoveId
    });
  }

  // Step 4: Add dialogue visualization nodes (WHY, CONCEDE, RETRACT, etc.)
  if (includeDialogue) {
    const vizNodes = await prisma.dialogueVisualizationNode.findMany({
      where: { deliberationId },
      include: {
        dialogueMove: {
          include: {
            author: { select: { id: true, username: true, displayName: true } }
          }
        }
      }
    });

    for (const vizNode of vizNodes) {
      nodes.push({
        id: `DM:${vizNode.id}`,
        nodeType: `aif:DialogueMove_${vizNode.nodeKind}`,
        text: `${vizNode.nodeKind}`,
        dialogueMoveId: vizNode.dialogueMoveId,
        dialogueMove: vizNode.dialogueMove,
        dialogueMetadata: {
          locution: vizNode.nodeKind,
          speaker: vizNode.dialogueMove.actorId,
          speakerName: vizNode.dialogueMove.author?.displayName || "Unknown",
          timestamp: vizNode.createdAt.toISOString(),
          replyToMoveId: vizNode.dialogueMove.replyToMoveId
        },
        nodeSubtype: "dialogue_move"
      });

      // Create edges for dialogue move interactions (e.g., WHY → RA)
      const metadata = vizNode.metadata as any;
      if (metadata?.targetArgumentId) {
        edges.push({
          id: `edge:${vizNode.id}:triggers:${metadata.targetArgumentId}`,
          source: `DM:${vizNode.id}`,
          target: `RA:${metadata.targetArgumentId}`,
          edgeType: "triggers",
          causedByDialogueMoveId: vizNode.dialogueMoveId
        });
      }
    }
  }

  // Step 5: Fetch dialogue moves metadata
  let dialogueMoves: DialogueMoveWithAif[] = [];
  if (includeDialogue) {
    const moveFilter: any = { deliberationId };
    
    if (includeMoves === "protocol") {
      moveFilter.kind = { in: ["WHY", "GROUNDS", "CONCEDE", "RETRACT", "CLOSE", "ACCEPT_ARGUMENT"] };
    } else if (includeMoves === "structural") {
      moveFilter.kind = { in: ["THEREFORE", "SUPPOSE", "DISCHARGE"] };
    }
    
    if (participantFilter) {
      moveFilter.actorId = participantFilter;
    }

    dialogueMoves = await prisma.dialogueMove.findMany({
      where: moveFilter,
      include: {
        author: { select: { id: true, username: true, displayName: true } },
        createdArguments: true,
        createdConflicts: true
      },
      orderBy: { createdAt: "asc" }
    }) as any;
  }

  // Step 6: Build commitment stores
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
```

**Tasks:**

- [ ] 2.2.1: Create `lib/aif/graph-builder.ts` following proven pattern from `generate-debate-sheets.ts`
- [ ] 2.2.2: Implement claim-to-argument resolution map (CRITICAL for edge derivation)
- [ ] 2.2.3: Query ConflictApplication for attack edges (NOT ArgumentEdge - it's empty!)
- [ ] 2.2.4: Add support for DialogueVisualizationNode rendering
- [ ] 2.2.5: Optimize queries with proper includes to avoid N+1 problem
- [ ] 2.2.6: Write unit tests with mock data matching production patterns
- [ ] 2.2.7: Add performance logging (query times, node counts)
- [ ] 2.2.8: Document architectural decisions in code comments

**Estimated Time:** 3 days (reduced due to proven pattern)

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

**Duration:** 1.5 weeks (reduced from 2 weeks)  
**Deliverables:**
- ✅ Core API for fetching dialogue-aware graphs using existing data structures
- ✅ Graph builder utility with claim resolution pattern (proven in generate-debate-sheets.ts)
- ✅ Client-side hooks for data fetching with SWR
- ✅ Provenance and timeline APIs
- ✅ Comprehensive API documentation
- ✅ Performance optimizations using existing indexes

**Key Implementation Notes:**
- Graph builder queries Argument, Claim, ConflictApplication (NOT AifNode/AifEdge)
- Edges derived dynamically from ConflictApplication using claim-to-argument map
- Support relationships inferred from ArgumentPremise + Claim linkage
- Dialogue visualization nodes fetched separately only when needed

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
| 2025-11-02 | **CRITICAL: Align with existing Argument/Claim/ConflictApplication architecture** | ArgumentEdge table is empty/legacy; proven pattern exists in generate-debate-sheets.ts | Avoids data duplication, uses single source of truth, simpler migration |
| 2025-11-02 | Add dialogue provenance to existing models instead of creating AifNode/AifEdge | Prevents sync issues, leverages existing indexes, follows working patterns | Less schema complexity, faster queries, no JOIN overhead |

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

