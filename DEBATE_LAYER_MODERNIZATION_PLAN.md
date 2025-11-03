# Debate Layer Modernization Plan

**Created**: November 2, 2025  
**Purpose**: Align DebateSheet/DebateNode/DebateEdge/Plexus features with current AIF/Scheme/Ontological architecture and clarify diagram separation of concerns

---

## Executive Summary

The debate layer (DebateSheet, DebateNode, DebateEdge, Plexus) was designed as the "graph-of-graphs" meta-level view, but hasn't kept pace with recent improvements to:
- AIF neighborhood expansion with CA/PA nodes
- Scheme-based argumentation with critical questions
- DS-mode conflict mass computation
- ArgumentDiagram Toulmin structure preservation
- Cross-deliberation import/transport system

This plan proposes a phased modernization to:
1. Document diagram type taxonomy (molecular vs atomic)
2. Update Plexus to show scheme/CQ/conflict metrics
3. Enhance DebateSheet to leverage AIF neighborhoods
4. Bridge dialogue protocols to debate-layer edges
5. Integrate transport functor provenance into Plexus

---

## 1. Diagram Type Taxonomy & Separation of Concerns

### 1.1 Two-Level Architecture Principle

**From MeshCategoricalStructure.txt**:
> "A debate must be represented on two levels: a debate graph (nodes are whole arguments, edges are support/objection) and argument diagrams (internal premise-conclusion structure), with a 'pop-out' or 'expand/collapse' interaction between them."

### 1.2 Diagram Type Definitions

#### **Level 1: Molecular / Meta-Level / Inter-Argument Views**
**Purpose**: Show relationships *between* arguments, debates, and deliberations

| Diagram Type | Scope | Nodes | Edges | Location in UI |
|--------------|-------|-------|-------|----------------|
| **Plexus** | Multi-room network | AgoraRooms (deliberations) | xref, overlap, imports, shared_author | `/agora` main view, room list sidebar |
| **DebateSheet** | Single debate map | DebateNodes (arguments as cards) | supports, rebuts, objects, undercuts, refines | `/room/[id]` (when sheets exist), ArgumentPopout drilldown |
| **AIF Neighborhood** | Argument neighborhood (depth 1-5) | Arguments (RA), Claims (I), Conflicts (CA), Preferences (PA) | premise, conclusion, conflict, preference | ArgumentActionsSheet → Diagram tab, DeepDivePanelV2 right panel |
| **AF Projection** | Acceptability graph | Arguments (abstract nodes) | Attacks (abstract) | Future: DebateSheet overlay (skeptical/credulous labels) |
| **Dialogue Tree** | Move sequence | Dialogue moves (Locutions) | reply-to edges | DialogicalPanel (existing), future: DebateSheet thread view |

**Key Characteristics**:
- **Navigational**: Users navigate *between* arguments/rooms
- **Compositional**: Shows how arguments combine to form debates
- **Strategic**: Reveals patterns (clusters, bridges, conflicts)
- **Scalable**: Must handle dozens to hundreds of nodes

#### **Level 2: Atomic / Intra-Argument / Internal Structure Views**
**Purpose**: Show structure *within* a single argument

| Diagram Type | Scope | Nodes | Edges | Location in UI |
|--------------|-------|-------|-------|----------------|
| **Toulmin Diagram** | Single argument internals | Statements (premises, conclusion, warrant) | Inferences (defeasible, deductive, abductive) | ArgumentPopoutDualMode (Toulmin tab), DiagramViewer |
| **ArgumentDiagram** | Full Toulmin + Evidence | Statements + EvidenceLinks | Inferences + InferencePremise | `/api/arguments/[id]?view=diagram`, structure-import utility |
| **Scheme Instance** | Scheme application | Statements + CQ status | Scheme-specific inference | AIFArgumentWithSchemeComposer, SchemeSpecificCQsModal |

**Key Characteristics**:
- **Analytical**: Users analyze logical structure
- **Fine-grained**: Statement-level precision
- **Pedagogical**: Teaches argumentation theory
- **Small-scale**: Typically 3-15 nodes per argument

### 1.3 Current UI Locations (Audit)

**Molecular Views**:
- ✅ **Plexus**: `/agora` → Agora component (line 58-921 in Plexus.tsx)
- ⚠️ **DebateSheet**: `/room/[id]` → DebateSheetReader.tsx (limited adoption)
- ✅ **AIF Neighborhood**: ArgumentActionsSheet → DiagramPanel (line 440-516)
- ✅ **AIF Neighborhood**: DeepDivePanelV2 → right floating sheet (line 1310-1370)

**Atomic Views**:
- ✅ **Toulmin + AIF Toggle**: ArgumentPopoutDualMode.tsx (Toulmin/AIF tabs)
- ✅ **Toulmin Grid**: ArgumentPopout.tsx (statements + inferences)
- ✅ **Scheme Composer**: AIFArgumentWithSchemeComposer.tsx
- ✅ **Scheme CQs**: SchemeSpecificCQsModal.tsx

**Gaps**:
- ❌ AF Projection overlay on DebateSheet (planned but not implemented)
- ❌ Dialogue tree visualization (DialogicalPanel exists but no tree view)
- ⚠️ DebateSheet underutilized (most rooms use synthetic `delib:` sheets)

---

## 2. Current State Assessment

### 2.1 Plexus (Meta-Level Network)

**What Works**:
- ✅ Shows cross-room references (`xref` edges from ArgumentImport)
- ✅ DS-mode support (fetches gated share per room)
- ✅ Confidence filtering (tau threshold)
- ✅ Edge weight display (recent Sprint 1 work)
- ✅ Tag-based filtering
- ✅ Transport UI link creation

**What's Missing**:
- ❌ No scheme/CQ metrics per room
- ❌ No conflict/preference indicators
- ❌ No dialogue protocol badges
- ❌ No ArgumentImport provenance visualization (which rooms import from where)
- ❌ Doesn't leverage DebateSheet → DebateNode → ArgumentDiagram chain

**Data Sources**:
- `/api/agora/network?scope=public|following` → returns `{ rooms: RoomNode[], edges: MetaEdge[] }`
- Currently uses `ArgumentImport` for `imports` edges

**Improvement Opportunities**:
1. Add room-level metrics card showing:
   - Top schemes used (from `ArgumentScheme` → `Argument.schemeId`)
   - Open CQs count (from `UnresolvedCQ` where `deliberationId = roomId`)
   - Conflict density (CA-nodes per argument)
   - Dialogue activity (moves per day)
2. Visualize import provenance:
   - Edge thickness = import count
   - Edge color gradient = structure fidelity (materialized vs virtual)
   - Hover tooltip shows top imported arguments
3. Add DebateSheet linking:
   - If room has DebateSheet, show mini-map preview on hover
   - Click → open DebateSheetReader

### 2.2 DebateSheet (Single Debate Map)

**What Works**:
- ✅ Schema exists (DebateSheet, DebateNode, DebateEdge)
- ✅ API endpoint `/api/sheets/[id]`
- ✅ DebateSheetReader component renders nodes/edges
- ✅ ArgumentPopout drilldown to diagram
- ✅ AF projection planned (LocusStatus, SheetAcceptance models)

**What's Missing**:
- ❌ Most rooms use synthetic `delib:` sheets (not true DebateSheets)
- ❌ DebateEdge kinds not leveraging current ontology:
  - Missing: `undercut_inference`, `rebut_conclusion`, `undermine_premise` (from EdgeType enum)
  - Missing: Scheme-aware edge labels (e.g., "applies Expert Opinion scheme")
- ❌ DebateNode doesn't surface:
  - Scheme used (ArgumentDiagram → Inference.schemeKey)
  - CQ status (ArgumentDiagram.cqStatus)
  - Conflict count (CA-nodes)
  - Toulmin structure depth
- ❌ No integration with AIF neighborhood expansion
- ❌ No dialogue move threading (episode sequences)

**Current Schema**:
```prisma
model DebateSheet {
  id          String   @id @default(cuid())
  title       String
  scope       String?
  roles       String[] @default([])
  rulesetJson Json?    // { semantics: ["grounded","preferred"], confidence: { mode: "ds" } }
  
  deliberationId String?
  deliberation   Deliberation? @relation(...)
  
  roomId String?
  room   AgoraRoom? @relation(name: "RoomSheets", ...)
  
  nodes      DebateNode[]
  edges      DebateEdge[]
  loci       LocusStatus[]
  acceptance SheetAcceptance?
  unresolved UnresolvedCQ[]
  outcomes   Outcome[]
}

model DebateNode {
  id      String      @id @default(cuid())
  sheetId String
  sheet   DebateSheet @relation(...)
  
  title   String?
  summary String?
  
  diagramId String?          @unique
  diagram   ArgumentDiagram? @relation(...)
  
  argumentId String?
  argument   Argument? @relation(name: "ArgumentDebateNodes", ...)
  
  claimId String?
  claim   Claim?  @relation(name: "ClaimDebateNodes", ...)
  
  authorsJson Json?
  createdAt   DateTime @default(now())
}

enum DebateEdgeKind {
  supports
  rebuts
  objects
  undercuts
  refines
  restates
  clarifies
  depends_on
}
```

**Improvement Opportunities**:
1. **Add computed fields to DebateNode API response**:
   ```typescript
   {
     id: string;
     title: string;
     diagramId: string;
     schemeKey?: string;        // NEW: from ArgumentDiagram → Inference.schemeKey
     cqStatus?: {               // NEW: from ArgumentDiagram.cqStatus
       open: number;
       answered: number;
       keys: string[];
     };
     conflictCount?: number;    // NEW: count of CA-nodes targeting this argument
     preferenceRank?: number;   // NEW: from PA-nodes
     toulminDepth?: number;     // NEW: max inference chain depth
   }
   ```

2. **Enhance DebateEdge with attack subtypes**:
   ```prisma
   model DebateEdge {
     // ... existing fields ...
     attackSubtype  ArgumentAttackSubtype? // rebut | undercut | undermine
     schemeKey      String?                // if edge represents scheme application
     cqKey          String?                // if edge is a critical question challenge
   }
   ```

3. **Auto-generate DebateSheets from Deliberations**:
   - Script: `scripts/generate-debate-sheets.ts`
   - Logic:
     - Fetch all Arguments in deliberation
     - Create DebateNode per argument (with diagramId from DebateNode link)
     - Create DebateEdge from ArgumentEdge (map type → kind)
     - Populate UnresolvedCQ from ArgumentDiagram.cqStatus
   - Run on-demand or as cron job

4. **Integrate AIF Neighborhood Expansion**:
   - DebateNode click → fetch AIF neighborhood (depth=1)
   - Render mini-graph in hover card
   - Show conflict/preference badges

### 2.3 AIF Neighborhood (Argument-Level Molecular View)

**What Works** (from CHUNK 1B review):
- ✅ `buildAifNeighborhood(argumentId, depth, options)` (diagram-neighborhoods.ts)
- ✅ CA-node support (conflicts)
- ✅ PA-node support (preferences)
- ✅ AssumptionUse integration (has-presumption/has-exception)
- ✅ Depth-limited exploration (default 2, max 5)
- ✅ Circuit breaker (maxNodes = 200)
- ✅ API endpoint: `/api/arguments/[id]/aif-neighborhood`
- ✅ UI integration: ArgumentActionsSheet → DiagramPanel
- ✅ Interactive expansion: AifDiagramViewerDagre

**What's Missing**:
- ❌ No scheme visualization on RA-nodes
- ❌ No CQ status overlay on I-nodes
- ❌ No dialogue move context (which locution created this argument?)
- ❌ No import provenance badges (show if argument is imported)

**Improvement Opportunities**:
1. **Add scheme/CQ metadata to AifNode**:
   ```typescript
   type AifNode = {
     nodeID: string;
     text: string;
     type: "I" | "RA" | "CA" | "PA";
     metadata?: {
       schemeKey?: string;       // NEW
       schemeName?: string;      // NEW: human-readable
       cqStatus?: {              // NEW
         open: string[];         // ["CQ1", "CQ3"]
         answered: string[];
       };
       importedFrom?: {          // NEW
         deliberationId: string;
         deliberationName: string;
       };
       dialogueMove?: {          // NEW
         locutionType: string;   // "ASSERT" | "WHY" | "CONCEDE"
         speakerId: string;
         timestamp: string;
       };
     };
   }
   ```

2. **Enhance AifDiagramViewerDagre rendering**:
   - Scheme badge on RA-nodes (show icon + name on hover)
   - CQ status indicator on I-nodes (orange dot = open CQs)
   - Import provenance badge (purple corner flag)
   - Dialogue move icon (speech bubble with locution type)

3. **Add filters to DiagramPanel**:
   - Toggle: Show/hide CA-nodes (conflicts)
   - Toggle: Show/hide PA-nodes (preferences)
   - Toggle: Show only open CQ nodes
   - Toggle: Show only imported arguments

---

## 3. Integration Architecture

### 3.1 Data Flow: Molecular → Atomic

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER ENTRY POINTS                        │
│  /agora → Plexus (multi-room network)                           │
│  /room/[id] → DebateSheetReader (single debate map)             │
│  DeepDivePanelV2 → ArgumentActionsSheet (argument neighborhood) │
└────────────┬────────────────────────────────────────────────────┘
             │
             ↓ (user clicks room/node/argument)
┌─────────────────────────────────────────────────────────────────┐
│                   MOLECULAR LAYER (Meta-Level)                  │
│                                                                 │
│  Plexus                                                         │
│    → /api/agora/network                                         │
│    → Returns: RoomNode[] + MetaEdge[]                           │
│    → Shows: rooms, xrefs, imports, overlaps                     │
│    → Click room → navigate to /room/[id]                        │
│                                                                 │
│  DebateSheet                                                    │
│    → /api/sheets/[id]                                           │
│    → Returns: DebateNode[] + DebateEdge[]                       │
│    → Shows: arguments as cards, debate structure                │
│    → Click node → ArgumentPopout                                │
│                                                                 │
│  AIF Neighborhood                                               │
│    → /api/arguments/[id]/aif-neighborhood?depth=2               │
│    → Returns: AifSubgraph (I/RA/CA/PA nodes + edges)            │
│    → Shows: argument + connected args/conflicts/preferences     │
│    → Click RA-node → expand deeper OR drilldown to atomic       │
└────────────┬────────────────────────────────────────────────────┘
             │
             ↓ (user drills down into single argument)
┌─────────────────────────────────────────────────────────────────┐
│                   ATOMIC LAYER (Intra-Argument)                 │
│                                                                 │
│  ArgumentPopoutDualMode                                         │
│    → /api/arguments/[diagramId]                                 │
│    → Toulmin Tab: Show ArgumentDiagram (statements + inferences)│
│    → AIF Tab: Show embedded AifSubgraph (RA + I-nodes only)     │
│                                                                 │
│  Scheme Composer                                                │
│    → AIFArgumentWithSchemeComposer                              │
│    → Shows: scheme template + CQ checklist                      │
│    → Saves: Inference with schemeKey + cqKeys                   │
│                                                                 │
│  Structure Import                                               │
│    → extractArgumentStructure(argumentId, deliberationId)       │
│    → Returns: ArgumentStructure (statements, inferences, evidence)│
│    → Used by: transport functor (cross-deliberation imports)    │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Bridging Dialogue Protocol to Debate Layer

**Current State**:
- Dialogue moves stored in `DialogueMove` model
- Dialogical semantics enforced by `DialogicalPanel`
- No link to DebateSheet/DebateNode

**Proposed Bridge**:
1. **Add DialogueMove → DebateNode link**:
   ```prisma
   model DialogueMove {
     // ... existing fields ...
     debateNodeId String?
     debateNode   DebateNode? @relation(...)
   }
   ```

2. **Create DebateEdge from dialogue sequences**:
   - WHY move → creates `objects` edge (challenge)
   - GROUNDS move → creates `supports` edge (premise)
   - CONCEDE move → deletes opposing edge
   - UNDERCUT move → creates `undercuts` edge with `attackSubtype`

3. **Visualize dialogue threading in DebateSheet**:
   - Show episode sequences as colored threads
   - Group edges by dialogue thread ID
   - Animate move order (timeline scrubber)

### 3.3 Bridging Transport Functor to Plexus

**Current State** (from Sprint 3 work):
- ArgumentImport tracks cross-deliberation references
- Imports have `kind` (xref, direct, premise) and `mode` (materialized, virtual)
- `structureJson` field preserves Toulmin structure
- Plexus shows `imports` edges (teal color)

**Enhancement Plan**:
1. **Add import metrics to Plexus hover card**:
   ```typescript
   // On Plexus edge hover
   {
     from: "Room A",
     to: "Room B",
     kind: "imports",
     count: 12,                    // total ArgumentImports
     structurePreserved: 8,        // imports with structureJson
     schemes: ["Expert Opinion", "Analogy"], // top schemes
     topImports: [                 // preview
       { text: "Climate change is real", confidence: 0.85 },
       { text: "Renewables are cost-effective", confidence: 0.72 }
     ]
   }
   ```

2. **Add import direction indicator**:
   - Arrowhead on `imports` edges (currently undirected)
   - Bidirectional arrows if mutual imports exist

3. **Color-code by fidelity**:
   - Bright teal: Materialized with structure preservation
   - Muted teal: Materialized without structure
   - Dashed teal: Virtual imports (claim-only)

---

## 4. Phased Implementation Plan

### Phase 1: Documentation & Audit (1-2 days) ✅ THIS DOCUMENT

**Deliverables**:
- ✅ Diagram taxonomy (molecular vs atomic) documented
- ✅ UI location audit completed
- ✅ Gap analysis per component
- ✅ Integration architecture diagram

**Outcome**: Team alignment on current state and future direction

---

### Phase 2: Schema Enhancements (3-5 days)

**Tasks**:
1. **Add computed fields to DebateNode API**:
   - [ ] Update `/api/sheets/[id]` to include:
     - `schemeKey` from ArgumentDiagram
     - `cqStatus` aggregation
     - `conflictCount` from CA-nodes
   - [ ] Add to DebateSheetReader rendering

2. **Extend DebateEdge schema**:
   - [ ] Add `attackSubtype` field (optional)
   - [ ] Add `schemeKey` field (optional)
   - [ ] Add `cqKey` field (optional)
   - [ ] Migration: `npx prisma migrate dev --name debate_edge_extensions`

3. **Add DialogueMove → DebateNode link**:
   - [ ] Add `debateNodeId` field to DialogueMove
   - [ ] Backfill script: map existing moves to nodes
   - [ ] Update DialogicalPanel to create nodes on ASSERT

4. **Enhance AifNode metadata**:
   - [ ] Update `buildAifNeighborhood` to include:
     - schemeKey/schemeName
     - cqStatus
     - importedFrom (check ArgumentImport)
     - dialogueMove (join with DialogueMove)
   - [ ] Update AifNode type definition

**Testing**:
- Verify computed fields return correctly
- Check performance impact (add indexes if needed)
- Validate backfill script on test data

---

### Phase 3: Plexus Modernization (5-7 days)

**Tasks**:
1. **Add room metrics card**:
   - [ ] Create `<PlexusRoomMetrics>` component
   - [ ] Fetch metrics: `/api/agora/room-metrics?roomId=...`
     ```typescript
     {
       schemes: { name: string; count: number }[];
       openCQs: number;
       conflictDensity: number; // CA-nodes per argument
       dialogueActivity: { movesPerDay: number; lastMove: Date };
     }
     ```
   - [ ] Show on room hover (Plexus tooltip)

2. **Enhance import edge visualization**:
   - [ ] Add arrowheads to `imports` edges
   - [ ] Color gradient by fidelity (structure preservation)
   - [ ] Enhanced tooltip with top imports preview

3. **Add DebateSheet linking**:
   - [ ] If room has DebateSheet, show mini-map on hover
   - [ ] Click → open DebateSheetReader in modal OR navigate

**Testing**:
- Verify metrics calculation performance
- Test hover card interaction (shouldn't block graph navigation)
- Check mobile responsiveness

---

### Phase 4: DebateSheet Modernization (7-10 days)

**Tasks**:
0. **Make sure the deliberation-->agoraroom-->debate auto generation process works and is backfilled properly so that every deliberation has an agoraroom and every agoraroom has a debate (with a default synthetic sheet)**
   - [x] ✅ COMPLETE (10 AgoraRooms created, 43 DebateSheets backfilled)

1. **Auto-generate DebateSheets**:
   - [x] ✅ Create `scripts/generate-debate-sheets.ts`
   - [x] ✅ Logic implemented:
     - [x] ✅ Create DebateNode per Argument (with argumentId link)
     - [x] ✅ Compute schemeKey from ArgumentScheme
     - [x] ✅ Compute cqStatus from CQStatus table (IMPROVED: real queries, not placeholder)
     - [x] ✅ Compute conflictCount from ConflictApplication (IMPROVED: CA-nodes, not ArgumentEdge)
     - [x] ✅ Compute preferences from PreferenceApplication (IMPROVED: real counts)
     - [x] ✅ **FIXED**: Create DebateEdge from ConflictApplication (NOT ArgumentEdge - see "Critical Learning" below)
     - [x] ✅ Compute toulminDepth from inference chains
   - [x] ✅ Run for test rooms (deliberation cmgy6c8vz0000c04w4l9khiux: 10 nodes, 4 edges created from 22 CAs)
   - [x] ✅ Add UI button: "Generate Debate Map" in DeliberationSettingsPanel
   - [x] ✅ **FIXED**: UnresolvedCQ population (implemented in script + API)
   - [x] ✅ **FIXED**: API endpoint `/api/sheets/generate` created
   
   **⚠️ CRITICAL LEARNING - DebateEdge Generation**:
   
   **Problem**: Initial implementation queried `ArgumentEdge` table, which was **empty** (0 records), resulting in "Edges: 0" for all nodes despite visible attack counts.
   
   **Root Cause**: Attack data lives in the **AIF system** (`ConflictApplication` table), NOT in `ArgumentEdge`. The `ArgumentEdge` table appears to be legacy/unused in production.
   
   **Solution**: Follow the proven pattern from `diagram-neighborhoods.ts`:
   
   1. **ConflictApplications link Claims, not Arguments**:
      - `conflictingArgumentId` is often NULL
      - Must resolve `conflictingClaimId` → parent Argument
      - Must resolve `conflictedClaimId` → parent Argument
   
   2. **Build claim-to-argument resolution map**:
      ```typescript
      // Map both conclusion claims AND premise claims
      const claimToArgMap = new Map<string, string>();
      
      // Map conclusions
      for (const arg of args) {
        if (arg.claimId) claimToArgMap.set(arg.claimId, arg.id);
      }
      
      // Map premises (arguments can attack premises too!)
      const premises = await prisma.argumentPremise.findMany({
        where: { argumentId: { in: args.map(a => a.id) } }
      });
      for (const prem of premises) {
        if (!claimToArgMap.has(prem.claimId)) {
          claimToArgMap.set(prem.claimId, prem.argumentId);
        }
      }
      ```
   
   3. **Resolve ConflictApplications to DebateEdges**:
      ```typescript
      const conflicts = await prisma.conflictApplication.findMany({
        where: { deliberationId }
      });
      
      for (const c of conflicts) {
        // Resolve attacking argument
        let fromArgId = c.conflictingArgumentId || 
                        claimToArgMap.get(c.conflictingClaimId);
        
        // Resolve targeted argument
        let toArgId = c.conflictedArgumentId || 
                      claimToArgMap.get(c.conflictedClaimId);
        
        if (!fromArgId || !toArgId) continue;
        
        // Map attack type (legacyAttackType field)
        const attackType = c.legacyAttackType || "REBUT";
        const kind = attackType === "UNDERCUT" ? "undercuts" :
                     attackType === "UNDERMINE" ? "objects" : "rebuts";
        
        await prisma.debateEdge.create({
          data: {
            sheetId, fromId, toId, kind,
            attackSubtype: attackType // REBUT | UNDERCUT | UNDERMINE
          }
        });
      }
      ```
   
   4. **Test Results**:
      - **Before**: Found 0 ArgumentEdges → Created 0 DebateEdges
      - **After**: Found 22 ConflictApplications → Derived 5 edges → Created 4 (1 duplicate)
      - **Verification**: DebateSheet now shows "Edges: 3" for cmh00i node ✅
   
   **Key Takeaway**: `ConflictApplication` is the authoritative source for attack relationships. `ArgumentEdge` appears to be legacy. All edge generation must query the AIF system, not the ArgumentEdge table.
   
   **Reference Files**:
   - `lib/arguments/diagram-neighborhoods.ts` - Proven pattern for CA resolution
   - `scripts/generate-debate-sheets.ts` (lines 425-570) - Updated implementation
   - `DEBATE_EDGE_GENERATION_FIXED.md` - Full technical writeup

2. **Enhance DebateSheetReader**:
   - [x] ✅ Show scheme badges on nodes (SchemeBadge component created)
   - [x] ✅ Show CQ status indicators (CQStatusIndicator with orange dot for open CQs)
   - [x] ✅ Show conflict count badge (AttackBadge with R/U/M breakdown)
   - [x] ✅ Show preference badges (PreferenceBadge with upvote/downvote counts)
   - [x] ✅ Add filter controls:
     - [x] ✅ Filter by scheme (dropdown with available schemes)
     - [x] ✅ Show only nodes with open CQs (checkbox filter)
     - [x] ✅ Show only conflicted nodes (checkbox filter)
     - [x] ✅ Clear filters button
   - [x] ✅ Fixed `/api/sheets/[id]` to include `argumentId` field
   - [x] ✅ Fetch AIF metadata from `/api/deliberations/[id]/arguments/aif`
   - [x] ✅ Build argumentId → metadata lookup map
   - [x] ✅ Display all badges with real data

3. **Integrate AIF neighborhoods**:
   - [ ] On DebateNode hover → fetch mini-neighborhood (depth=1)
   - [ ] Render as compact graph in hover card
   - [ ] Click → expand to full ArgumentActionsSheet

4. **Add dialogue threading visualization**:
   - [ ] Color-code edges by dialogue thread
   - [ ] Add timeline scrubber (show move order)
   - [ ] Group nodes by episode

**Testing**:
- Verify sheet generation correctness
- Test filter performance (large sheets)
- Validate AIF neighborhood integration

---

### Phase 5: AIF Neighborhood Enhancements (5-7 days)

**Tasks**:
1. **Visual enhancements to AifDiagramViewerDagre**:
   - [ ] Scheme badge on RA-nodes (icon + name on hover)
   - [ ] CQ status indicator on I-nodes (orange dot with count)
   - [ ] Import provenance badge (purple flag with source name)
   - [ ] Dialogue move icon (speech bubble with locution type)

2. **Add filter controls to DiagramPanel**:
   - [ ] Toggle: Show/hide CA-nodes
   - [ ] Toggle: Show/hide PA-nodes
   - [ ] Toggle: Show only open CQ nodes
   - [ ] Toggle: Show only imported arguments

3. **Enhance metadata tooltips**:
   - [ ] On RA-node hover: show scheme, CQs, import source, dialogue context
   - [ ] On I-node hover: show statement text, role, CQ status
   - [ ] On CA-node hover: show conflict type, conflicting claims
   - [ ] On PA-node hover: show preference type, justification

**Testing**:
- Verify rendering performance (complex graphs)
- Test filter interactions (multiple filters active)
- Validate tooltip accuracy

---

### Phase 6: Integration Testing & Documentation (3-5 days)

**Tasks**:
1. **End-to-end testing**:
   - [ ] User journey: Plexus → DebateSheet → AIF Neighborhood → Toulmin
   - [ ] Cross-deliberation import with structure preservation
   - [ ] Dialogue protocol → DebateSheet bridge
   - [ ] Scheme/CQ propagation through all layers

2. **Performance testing**:
   - [ ] Large Plexus graphs (100+ rooms)
   - [ ] Complex DebateSheets (50+ nodes, 100+ edges)
   - [ ] Deep AIF neighborhoods (depth=5, 200 nodes)

3. **Documentation**:
   - [ ] Update README with diagram taxonomy
   - [ ] Add JSDoc comments to new API endpoints
   - [ ] Create developer guide: "Adding New Diagram Types"
   - [ ] Update user guide: "Understanding Mesh Diagrams"

4. **Accessibility audit**:
   - [ ] Keyboard navigation (all diagram viewers)
   - [ ] Screen reader support (alt text for visual badges)
   - [ ] Color contrast (conflict/preference indicators)

**Testing**:
- Run full test suite
- Manual QA on staging
- Accessibility scan (axe-core)

---

## 5. Key Design Decisions

### 5.1 When to Use Which Diagram?

**Decision Matrix**:

| User Goal | Diagram Type | Location |
|-----------|--------------|----------|
| "Which rooms are discussing similar topics?" | Plexus | `/agora` |
| "How does this debate flow?" | DebateSheet | `/room/[id]` (when sheet exists) |
| "What argues against this claim?" | AIF Neighborhood | ArgumentActionsSheet → Diagram |
| "What's the logical structure of this argument?" | Toulmin Diagram | ArgumentPopoutDualMode → Toulmin tab |
| "Which scheme should I use?" | Scheme Composer | AIFArgumentWithSchemeComposer |
| "Which CQs are open?" | Scheme CQ Modal | SchemeSpecificCQsModal |

### 5.2 Molecular vs Atomic Rendering

**Molecular (Meta-Level) Characteristics**:
- **Scale**: Handle 10-1000 nodes
- **Layout**: Force-directed OR hierarchical (dagre)
- **Interaction**: Pan, zoom, filter, click-to-navigate
- **Labels**: Summary text (short titles)
- **Colors**: Semantic (node type, edge kind)
- **Badges**: Metrics (counts, status indicators)

**Atomic (Intra-Argument) Characteristics**:
- **Scale**: Handle 3-30 nodes
- **Layout**: Toulmin grid OR small AIF graph
- **Interaction**: Hover for details, click to edit
- **Labels**: Full text (statements, premises)
- **Colors**: Role-based (premise=blue, conclusion=green)
- **Badges**: None (text is primary)

### 5.3 Data Freshness Strategy

**Real-time Updates** (WebSocket/SSE):
- Dialogue moves (immediate feedback)
- Acceptance status changes (AF projection)
- CQ status updates (answered/opened)

**Polling/SWR** (5-30 sec revalidation):
- Plexus graph (room list, edge weights)
- DebateSheet nodes/edges
- AIF neighborhoods (conflict/preference changes)

**On-demand** (user-triggered):
- DebateSheet generation (expensive computation)
- Deep AIF neighborhoods (depth > 3)
- Structure import (cross-deliberation transport)

---

## 6. Success Metrics

### 6.1 Technical Metrics

- [ ] **Schema Correctness**: All computed fields return accurate values
- [ ] **Performance**:
  - Plexus renders <2s for 100 rooms
  - DebateSheet renders <3s for 50 nodes
  - AIF Neighborhood (depth=2) renders <2s
- [ ] **Test Coverage**: >80% for new API endpoints
- [ ] **Accessibility**: WCAG 2.1 AA compliance

### 6.2 User Experience Metrics

- [ ] **Clarity**: Users understand molecular vs atomic distinction
- [ ] **Navigation**: <3 clicks to go from Plexus → Toulmin diagram
- [ ] **Discoverability**: Users find scheme/CQ info without training
- [ ] **Consistency**: Same visual language across all diagram types

### 6.3 Adoption Metrics

- [ ] **DebateSheet Usage**: 30% of active rooms have generated sheets
- [ ] **AIF Neighborhood Usage**: 50% of argument views expand to diagram
- [ ] **Scheme Usage**: 40% of new arguments use scheme templates
- [ ] **Cross-Deliberation Imports**: 20% of imports preserve structure

---

## 7. Maintenance & Future Work

### 7.1 Ongoing Maintenance

- **Schema Migrations**: Track Prisma schema changes, coordinate with team
- **API Versioning**: If breaking changes needed, version `/api/v2/sheets/[id]`
- **Performance Monitoring**: Track query times, optimize slow endpoints
- **User Feedback**: Collect feedback on diagram usability, iterate

### 7.2 Future Enhancements

**Phase 7: Advanced AF Features** (post-launch)
- Grounded/Preferred/Stable semantics overlays
- Interactive extension exploration (click to see full extension)
- Argument strength visualization (edge thickness = support strength)

**Phase 8: Dialogue Protocol Extensions**
- Multi-player dialogue games (PPD, CB, PPE)
- Commitment store visualization (who committed to what)
- Dialogue tree export (GraphML, DOT formats)

**Phase 9: Cross-Debate Synthesis**
- TopicCanvas implementation (multi-sheet aggregation)
- Perspective clustering (k-viewpoints extraction)
- Bridge Builder UI (connect opposing camps)

**Phase 10: AI-Assisted Diagramming**
- Auto-generate DebateSheet from unstructured text
- Suggest schemes for new arguments
- Auto-answer CQs with evidence search

---

## 8. References & Dependencies

### 8.1 Key Documents
- **AgoraMetastructureDevRoadmap.txt**: Original DebateSheet design
- **MeshCategoricalStructure.txt**: Two-level architecture principle
- **CHUNK_1B_Argument_Graph_Primitives.md**: AIF builder architecture
- **CHUNK_5A_COMPREHENSIVE_ANALYSIS.md**: Cross-deliberation import system
- **SPRINT_3_TASK_3_1_COMPLETE.md**: Structure preservation implementation

### 8.2 Related Implementations
- **lib/arguments/diagram.ts**: Core AIF builder (buildAifSubgraphForArgument)
- **lib/arguments/diagram-neighborhoods.ts**: Neighborhood expansion
- **lib/arguments/structure-import.ts**: Toulmin structure extraction
- **components/agora/Plexus.tsx**: Multi-room network visualization
- **components/agora/DebateSheetReader.tsx**: Single debate map reader
- **components/arguments/ArgumentActionsSheet.tsx**: AIF neighborhood UI
- **components/agora/ArgumentPopoutDualMode.tsx**: Toulmin/AIF dual-mode viewer

### 8.3 External Standards
- **AIF (Argument Interchange Format)**: Node types (I/RA/CA/PA), edge roles
- **ASPIC+**: Argumentation semantics (grounded, preferred, stable)
- **Walton Schemes**: Argumentation scheme templates + CQs
- **Toulmin Model**: Claim, Data, Warrant, Backing, Qualifier, Rebuttal

---

## 9. Appendix: Example API Responses

### 9.1 Enhanced Plexus Room Node

```json
{
  "id": "room-123",
  "title": "Climate Policy Debate",
  "nArgs": 45,
  "nEdges": 67,
  "accepted": 23,
  "rejected": 8,
  "undecided": 14,
  "tags": ["climate", "policy"],
  "updatedAt": "2025-11-02T10:30:00Z",
  
  // NEW: Room-level metrics
  "schemes": [
    { "key": "expert_opinion", "name": "Expert Opinion", "count": 12 },
    { "key": "analogy", "name": "Analogy", "count": 8 }
  ],
  "cqStatus": {
    "open": 5,
    "answered": 18,
    "total": 23
  },
  "conflictDensity": 0.34,
  "dialogueActivity": {
    "movesPerDay": 8.5,
    "lastMove": "2025-11-02T09:15:00Z"
  },
  "hasDebateSheet": true,
  "sheetId": "sheet-456"
}
```

### 9.2 Enhanced DebateNode

```json
{
  "id": "node-789",
  "title": "Renewables are cost-effective",
  "diagramId": "diagram-101",
  "argumentId": "arg-202",
  
  // NEW: Scheme metadata
  "schemeKey": "expert_opinion",
  "schemeName": "Argument from Expert Opinion",
  
  // NEW: CQ status
  "cqStatus": {
    "open": ["CQ1", "CQ3"],
    "answered": ["CQ2"],
    "openCount": 2,
    "answeredCount": 1,
    "totalCount": 3
  },
  
  // NEW: Conflict metadata
  "conflictCount": 2,
  "conflicts": [
    { "caNodeId": "ca-303", "type": "rebut", "targetId": "arg-404" },
    { "caNodeId": "ca-305", "type": "undercut", "targetId": "arg-505" }
  ],
  
  // NEW: Preference metadata
  "preferenceRank": 0.72,
  
  // NEW: Toulmin structure depth
  "toulminDepth": 3,
  
  // NEW: Import provenance
  "importedFrom": {
    "deliberationId": "delib-606",
    "deliberationName": "Energy Economics Forum",
    "importId": "import-707"
  }
}
```

### 9.3 Enhanced AifNode

```typescript
{
  nodeID: "RA:arg-202",
  text: "Renewables are cost-effective because IEA reports show...",
  type: "RA",
  metadata: {
    // NEW: Scheme metadata
    schemeKey: "expert_opinion",
    schemeName: "Argument from Expert Opinion",
    
    // NEW: CQ status
    cqStatus: {
      open: ["CQ1", "CQ3"],
      answered: ["CQ2"]
    },
    
    // NEW: Import provenance
    importedFrom: {
      deliberationId: "delib-606",
      deliberationName: "Energy Economics Forum"
    },
    
    // NEW: Dialogue context
    dialogueMove: {
      locutionType: "ASSERT",
      speakerId: "user-808",
      timestamp: "2025-11-01T14:20:00Z",
      moveId: "move-909"
    },
    
    // Existing metadata
    claimId: "claim-111",
    argumentId: "arg-202"
  }
}
```

---

**Document Status**: Draft v1.0  
**Next Review**: After Phase 2 completion  
**Maintainer**: Engineering team  
**Last Updated**: November 2, 2025
