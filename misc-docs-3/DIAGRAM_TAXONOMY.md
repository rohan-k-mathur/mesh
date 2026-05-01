# Mesh Diagram Taxonomy - Quick Reference

**Purpose**: Quick reference for developers and users to understand Mesh's diagram system architecture

---

## Two-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  LEVEL 1: MOLECULAR / META-LEVEL / INTER-ARGUMENT          │
│  "How do arguments relate to each other?"                   │
│                                                             │
│  • Plexus (multi-room network)                              │
│  • DebateSheet (single debate map)                          │
│  • AIF Neighborhood (argument + connections)                │
│  • AF Projection (acceptability graph)                      │
│  • Dialogue Tree (move sequences)                           │
└─────────────────────────────────────────────────────────────┘
                              ↕ "Pop-out" / Drilldown
┌─────────────────────────────────────────────────────────────┐
│  LEVEL 2: ATOMIC / INTRA-ARGUMENT / INTERNAL STRUCTURE      │
│  "What's the logical structure inside this argument?"       │
│                                                             │
│  • Toulmin Diagram (statements + inferences)                │
│  • ArgumentDiagram (full structure + evidence)              │
│  • Scheme Instance (scheme application + CQs)               │
└─────────────────────────────────────────────────────────────┘
```

---

## Diagram Types Matrix

| Name | Level | What It Shows | Where It Appears |
|------|-------|---------------|------------------|
| **Plexus** | Molecular | Multi-room network with cross-references | `/agora` main view |
| **DebateSheet** | Molecular | Single debate with argument cards | `/room/[id]` (when sheets exist) |
| **AIF Neighborhood** | Molecular | Argument + conflicts + preferences + support | ArgumentActionsSheet → Diagram tab |
| **AF Projection** | Molecular | Abstract acceptability graph (grounded/preferred) | Future: DebateSheet overlay |
| **Dialogue Tree** | Molecular | Dialogue move sequences and episodes | DialogicalPanel (existing) |
| **Toulmin Diagram** | Atomic | Premises, conclusion, warrant, backing | ArgumentPopoutDualMode → Toulmin tab |
| **ArgumentDiagram** | Atomic | Complete Toulmin + evidence links | `/api/arguments/[id]?view=diagram` |
| **Scheme Instance** | Atomic | Scheme template + CQ checklist | AIFArgumentWithSchemeComposer |

**Note on Dialogue Visualization**: 
- Dialogue moves (WHY, GROUNDS, CONCEDE, etc.) will be integrated as an **augmentation layer** to existing diagrams
- DM-nodes (Dialogue Move nodes) appear as optional toggles in AIF Neighborhood and DebateSheet
- Not a separate diagram type, but a **provenance overlay** showing which dialogue moves created arguments/attacks
- See `DIALOGUE_VISUALIZATION_ROADMAP.md` for implementation plan

---

## Visual Characteristics

### Molecular Diagrams

**Scale**: 10-1000 nodes  
**Layout**: Force-directed (Plexus) or Hierarchical (DebateSheet, AIF)  
**Interaction**: Pan, zoom, filter, click-to-navigate  
**Labels**: Short summaries (titles, claims)  
**Purpose**: Navigation and strategic overview

**Node Types**:
- **Plexus**: Rooms (AgoraRooms)
- **DebateSheet**: Arguments (DebateNodes)
- **AIF Neighborhood**: Arguments (RA), Claims (I), Conflicts (CA), Preferences (PA)

**Edge Types**:
- **Plexus**: xref, overlap, imports, shared_author
- **DebateSheet**: supports, rebuts, objects, undercuts, refines, restates, clarifies
  - **CRITICAL**: Edges derived from ConflictApplication (attacks) and ArgumentPremise+Claim (support)
  - ArgumentEdge table is NOT used (empty in production)
- **AIF Neighborhood**: premise, conclusion, conflict, preference, has-presumption, has-exception
  - **CRITICAL**: Attack edges come from ConflictApplication with claim-to-argument resolution
  - Support edges inferred from ArgumentPremise → Claim → Argument (conclusion) chain

### Atomic Diagrams

**Scale**: 3-30 nodes  
**Layout**: Grid (Toulmin) or Small graph (ArgumentDiagram)  
**Interaction**: Hover for details, click to edit  
**Labels**: Full text (complete statements)  
**Purpose**: Analysis and logical structure understanding

**Node Types**:
- **Toulmin**: Statements (premise, intermediate, conclusion, warrant, backing)
- **ArgumentDiagram**: Statements + EvidenceLinks
- **Scheme Instance**: Statements + CQ status nodes

**Edge Types**:
- **Toulmin**: Inferences (defeasible, deductive, inductive, abductive, analogy)
- **ArgumentDiagram**: Inferences + InferencePremise + EvidenceLink
- **Scheme Instance**: Scheme-specific inference patterns

---

## UI Navigation Paths

### Path 1: Plexus → DebateSheet → Toulmin
```
/agora (Plexus)
  → Click room card
  → /room/[id] (DebateSheetReader)
    → Click argument node (DebateNode)
    → ArgumentPopout modal
      → Toulmin tab (ArgumentDiagram)
```

### Path 2: DeepDivePanel → AIF Neighborhood → Toulmin
```
/room/[id] (DeepDivePanelV2)
  → Select claim in left panel
  → Right floating sheet opens
    → Click "Diagram" action
    → AIF Neighborhood view (AifDiagramViewerDagre)
      → Click RA-node
      → ArgumentPopoutDualMode modal
        → Toggle to Toulmin tab
```

### Path 3: Argument Actions → Scheme Composer
```
DeepDivePanelV2 → Right floating sheet
  → Click "Defend" action
  → Select "Add Supporting Argument"
  → AIFArgumentWithSchemeComposer modal
    → Pick scheme (e.g., Expert Opinion)
    → Fill premises
    → Answer CQs
    → Save (creates ArgumentDiagram with schemeKey)
```

---

## When to Use Each Diagram

### "I want to see what topics are being discussed across the platform"
→ **Plexus** (`/agora`)  
Shows: All rooms, tags, activity levels

### "I want to see how this debate is structured"
→ **DebateSheet** (`/room/[id]` when sheet exists)  
Shows: Argument cards, debate flow, acceptance status

### "I want to see what conflicts exist for this argument"
→ **AIF Neighborhood** (ArgumentActionsSheet → Diagram)  
Shows: Conflicts (CA-nodes), preferences (PA-nodes), support chains

### "I want to see the logical structure of this argument"
→ **Toulmin Diagram** (ArgumentPopoutDualMode → Toulmin tab)  
Shows: Premises, conclusion, warrant, backing, inferences

### "I want to build an argument using a scheme"
→ **Scheme Composer** (AIFArgumentWithSchemeComposer)  
Shows: Scheme template, CQ checklist, premise/conclusion slots

### "I want to see which rooms reference this room"
→ **Plexus** with room selected  
Shows: Import edges (teal), xref edges (indigo)

---

## Color Coding

### Plexus Edges
- **Indigo (#6366f1)**: Cross-references (xref)
- **Red (#ef4444)**: Claim overlap
- **Amber (#f59e0b)**: Stack references
- **Teal (#14b8a6)**: Imports (cross-deliberation)
- **Slate (#64748b)**: Shared authors

### DebateSheet Edges
- **Green**: supports
- **Red**: rebuts, objects
- **Orange**: undercuts
- **Blue**: refines, restates, clarifies

### AIF Neighborhood Edges
- **Blue**: premise (I → I)
- **Green**: conclusion (I → RA)
- **Red**: conflict (CA → RA/I)
- **Purple**: preference (PA → RA)
- **Gray**: has-presumption, has-exception

### Toulmin Statements
- **Blue**: Premise
- **Green**: Conclusion
- **Amber**: Warrant
- **Purple**: Backing
- **Orange**: Rebuttal

---

## Node Badge System

### Molecular Badges (Meta-Level)

**Plexus Room Nodes**:
- 🎯 Acceptance rate badge (accepted / total)
- 🔥 Activity indicator (moves per day)
- 🏷️ Tag chips
- 📋 Has DebateSheet indicator

**DebateSheet Nodes**:
- 🎓 Scheme badge (icon + name)
- ⚠️ Open CQ indicator (count)
- ⚔️ Conflict count badge (from ConflictApplication, not ArgumentEdge)
- 📥 Import provenance flag

**AIF Neighborhood Nodes**:
- 🎓 Scheme badge (RA-nodes)
- ⚠️ CQ status (I-nodes)
- 💬 Dialogue move icon (RA-nodes - optional dialogue layer)
- 📥 Import provenance (RA-nodes)

### Atomic Badges (Intra-Argument)

**Toulmin Statements**:
- 🔗 Evidence attachment indicator
- 📝 Statement role tag [P/C/W/B/R]

**ArgumentDiagram**:
- 🎓 Inference scheme label
- ⚠️ CQ status indicators
- 🔗 Evidence link count

---

## Data Architecture (CRITICAL)

### ⚠️ Important: No Duplicate Tables

**Single Source of Truth**:
- ✅ **Arguments** stored in `Argument` table (NOT duplicated in AifNode)
- ✅ **Claims** stored in `Claim` table (NOT duplicated)
- ✅ **Attacks** stored in `ConflictApplication` table (NOT ArgumentEdge - it's empty!)
- ✅ **Support** relationships implicit via `ArgumentPremise` + `Claim` linkage
- ✅ **Edges derived dynamically** at query time (not stored in AifEdge)

**Why This Matters**:
- ArgumentEdge table exists in schema but has **0 records in production**
- ConflictApplication is the **authoritative source** for attack relationships
- Support edges are **never stored explicitly** - derived from claim connections
- All diagram APIs query existing tables and build graphs on-the-fly

**References**: 
- See `DEBATE_LAYER_MODERNIZATION_PLAN.md` for detailed explanation
- See `scripts/generate-debate-sheets.ts` for proven implementation pattern
- See `DIALOGUE_VISUALIZATION_ROADMAP.md` for architectural decisions

---

## Technical Implementation

### Molecular Diagram Data Sources

```typescript
// Plexus
GET /api/agora/network?scope=public|following
→ Queries: AgoraRoom, RoomTag, DialogueMove (for activity metrics)
→ { rooms: RoomNode[], edges: MetaEdge[] }

// DebateSheet (USES PROVEN PATTERN)
GET /api/sheets/[id]
→ Queries:
  - Argument table (for RA-nodes)
  - Claim table (for I-nodes)
  - ConflictApplication table (for CA-nodes and attack edges)
  - ArgumentPremise table (for support edges via claim resolution)
→ Derives edges using claim-to-argument resolution map
→ { nodes: DebateNode[], edges: DebateEdge[], acceptance: {...} }

// AIF Neighborhood (DERIVES FROM EXISTING DATA)
GET /api/arguments/[id]/aif-neighborhood?depth=2
→ Queries:
  - Argument (for RA-nodes)
  - Claim (for I-nodes)
  - ConflictApplication (for CA-nodes and attacks)
  - ArgumentPremise + Claim (for support chains)
→ Builds graph dynamically with claim-to-argument resolution
→ { nodes: AifNodeDerived[], edges: DerivedEdge[] }
```

### Atomic Diagram Data Sources

```typescript
// Toulmin/ArgumentDiagram
GET /api/arguments/[diagramId]?view=diagram
→ Queries: ArgumentDiagram, Statement, Inference, InferencePremise, EvidenceLink
→ { diagram: { statements: Statement[], inferences: Inference[], aif?: AifSubgraph } }

// Scheme Instance
GET /api/schemes/[schemeKey]
→ Queries: ArgumentationScheme, CriticalQuestion (from scheme definitions)
→ { schemeKey, name, premises: [...], cqs: [...] }

// Critical Questions for Argument
GET /api/arguments/[id]/critical-questions
→ Queries: CriticalQuestion, CQStatus (from argument context)
→ { cqs: CriticalQuestion[], statuses: CQStatus[] }
```

**Key Pattern: Claim-to-Argument Resolution**
```typescript
// Used in generate-debate-sheets.ts, structure-import.ts, etc.
const claimToArgMap = new Map<string, string>();

// Map conclusions
for (const arg of arguments) {
  if (arg.claimId) claimToArgMap.set(arg.claimId, arg.id);
}

// Map premises
const premises = await prisma.argumentPremise.findMany({
  where: { argument: { deliberationId } }
});
for (const prem of premises) {
  claimToArgMap.set(prem.claimId, prem.argumentId);
}

// Resolve attacks from ConflictApplication
const conflicts = await prisma.conflictApplication.findMany({
  where: { deliberationId }
});

for (const conflict of conflicts) {
  const fromArgId = conflict.conflictingArgumentId || 
                    claimToArgMap.get(conflict.conflictingClaimId);
  const toArgId = conflict.conflictedArgumentId || 
                  claimToArgMap.get(conflict.conflictedClaimId);
  
  if (fromArgId && toArgId) {
    // Create edge: fromArgId attacks toArgId
  }
}
```

### Render Components

```typescript
// Molecular
import Plexus from '@/components/agora/Plexus';
import DebateSheetReader from '@/components/agora/DebateSheetReader';
import { AifDiagramViewerDagre } from '@/components/map/Aifdiagramviewerdagre';

// Atomic
import ArgumentPopoutDualMode from '@/components/agora/Argumentpopoutdualmode';
import { AIFArgumentWithSchemeComposer } from '@/components/arguments/AIFArgumentWithSchemeComposer';
import DiagramView from '@/components/map/DiagramView';
```

---

## Glossary

**Molecular**: Showing relationships *between* arguments/rooms  
**Atomic**: Showing structure *within* a single argument  
**Meta-Level**: Same as molecular  
**Inter-Argument**: Same as molecular  
**Intra-Argument**: Same as atomic  

**RA-node**: Reasoning Application node (argument in AIF)  
**I-node**: Information node (claim/statement in AIF)  
**CA-node**: Conflict Application node (attack in AIF)  
**PA-node**: Preference Application node (preference ordering in AIF)  

**Toulmin**: Argument structure model (Data, Warrant, Backing, Claim)  
**AIF**: Argument Interchange Format (I/RA/CA/PA nodes)  
**AF**: Abstract Argumentation Framework (nodes + attacks)  
**Scheme**: Stereotypical reasoning pattern (e.g., Expert Opinion)  
**CQ**: Critical Question (potential challenge to a scheme)

---

**Quick Tip**: When in doubt, remember:
- **Molecular = Navigate between arguments**
- **Atomic = Analyze within one argument**

**Architecture Quick Tip**: When implementing diagram features:
- ✅ Query `Argument`, `Claim`, `ConflictApplication`, `ArgumentPremise`
- ❌ Do NOT query `ArgumentEdge` or `AifEdge` (empty/legacy tables)
- ✅ Derive edges dynamically using claim-to-argument resolution
- ✅ Follow patterns in `generate-debate-sheets.ts` and `structure-import.ts`

**References**: 
- Full implementation: `DEBATE_LAYER_MODERNIZATION_PLAN.md`
- Dialogue integration: `DIALOGUE_VISUALIZATION_ROADMAP.md`
- Proven patterns: `scripts/generate-debate-sheets.ts`, `lib/arguments/structure-import.ts`

---

## Key Design Decisions

### When to Use Which Diagram?

**Decision Matrix**:

| User Goal | Diagram Type | Location |
|-----------|--------------|----------|
| "Which rooms are discussing similar topics?" | Plexus | `/agora` |
| "How does this debate flow?" | DebateSheet | `/room/[id]` (when sheet exists) |
| "What argues against this claim?" | AIF Neighborhood | ArgumentActionsSheet → Diagram |
| "What's the logical structure of this argument?" | Toulmin Diagram | ArgumentPopoutDualMode → Toulmin tab |
| "Which scheme should I use?" | Scheme Composer | AIFArgumentWithSchemeComposer |
| "Which CQs are open?" | Scheme CQ Modal | SchemeSpecificCQsModal |
| "What dialogue moves created this argument?" | Dialogue Overlay | Toggle in AIF Neighborhood/DebateSheet |

### Molecular vs Atomic Rendering

**Molecular (Meta-Level) Characteristics**:
- **Scale**: Handle 10-1000 nodes
- **Layout**: Force-directed (Plexus) OR hierarchical dagre (DebateSheet, AIF)
- **Interaction**: Pan, zoom, filter, click-to-navigate
- **Labels**: Summary text (short titles, claim excerpts)
- **Colors**: Semantic (node type, edge kind, acceptance status)
- **Badges**: Metrics (conflict counts, CQ status, scheme indicators)
- **Data**: Derived from Argument/Claim/ConflictApplication queries
- **Performance**: Optimize with batched queries, avoid N+1 problems

**Atomic (Intra-Argument) Characteristics**:
- **Scale**: Handle 3-30 nodes
- **Layout**: Toulmin grid OR small AIF graph
- **Interaction**: Hover for details, click to edit
- **Labels**: Full text (complete statements, premises, conclusions)
- **Colors**: Role-based (premise=blue, conclusion=green, warrant=amber)
- **Badges**: Minimal (text is primary, evidence indicators only)
- **Data**: From ArgumentDiagram, Statement, Inference tables
- **Performance**: Loaded on-demand when user drills down

### Data Freshness Strategy

**Real-time Updates** (WebSocket/SSE):
- Dialogue moves (immediate feedback for active deliberations)
- Acceptance status changes (AF projection updates)
- CQ status updates (answered/opened in active discussions)

**Polling/SWR** (5-30 sec revalidation):
- Plexus graph (room list, edge weights, activity metrics)
- DebateSheet nodes/edges (argument additions, attack changes)
- AIF neighborhoods (conflict/preference changes)

**On-demand** (user-triggered, expensive computation):
- DebateSheet generation (`POST /api/sheets/generate`)
- Deep AIF neighborhoods (depth > 3, recursive query)
- Structure import (cross-deliberation transport with claim resolution)
- Dialogue provenance backfill (historical move tracking)

### Edge Derivation Best Practices

**Attack Edges** (Follow `generate-debate-sheets.ts` pattern):
```typescript
// 1. Query ConflictApplication (authoritative source)
const conflicts = await prisma.conflictApplication.findMany({
  where: { deliberationId }
});

// 2. Build claim-to-argument resolution map
const claimToArgMap = new Map<string, string>();
for (const arg of arguments) {
  if (arg.claimId) claimToArgMap.set(arg.claimId, arg.id);
}
const premises = await prisma.argumentPremise.findMany({...});
for (const prem of premises) {
  claimToArgMap.set(prem.claimId, prem.argumentId);
}

// 3. Resolve conflicts to edges
for (const c of conflicts) {
  const fromArgId = c.conflictingArgumentId || claimToArgMap.get(c.conflictingClaimId);
  const toArgId = c.conflictedArgumentId || claimToArgMap.get(c.conflictedClaimId);
  if (fromArgId && toArgId) {
    edges.push({ source: fromArgId, target: toArgId, type: c.legacyAttackType });
  }
}
```

**Support Edges** (Implicit via claim linkage):
```typescript
// Support relationships are NOT stored explicitly
// They are inferred from: ArgumentPremise → Claim → Argument (conclusion)

// To find support edges:
// 1. Get argument's premise claims
const premises = await prisma.argumentPremise.findMany({
  where: { argumentId },
  select: { claimId: true }
});

// 2. Find arguments that have those claims as conclusions
const supportingArgs = await prisma.argument.findMany({
  where: {
    deliberationId,
    claimId: { in: premises.map(p => p.claimId) }
  }
});

// 3. Create edges: supportingArg supports targetArgument
for (const supportingArg of supportingArgs) {
  edges.push({ 
    source: supportingArg.id, 
    target: argumentId, 
    type: "support" 
  });
}
```

---

## Success Metrics

### Technical Metrics

- [x] **Schema Correctness**: ConflictApplication used for attacks (not ArgumentEdge)
- [x] **Edge Derivation**: Claim-to-argument resolution pattern validated
- [ ] **Performance**:
  - Plexus renders <2s for 100 rooms
  - DebateSheet renders <3s for 50 nodes
  - AIF Neighborhood (depth=2) renders <2s
- [ ] **Test Coverage**: >80% for diagram generation APIs
- [ ] **Accessibility**: WCAG 2.1 AA compliance for all diagram viewers

### User Experience Metrics

- [ ] **Clarity**: Users understand molecular vs atomic distinction without training
- [ ] **Navigation**: <3 clicks to go from Plexus → Toulmin diagram
- [ ] **Discoverability**: Users find scheme/CQ info intuitively
- [ ] **Consistency**: Same visual language across all diagram types
- [ ] **Dialogue Integration**: Users can toggle dialogue layer and understand provenance

### Adoption Metrics

- [ ] **DebateSheet Usage**: 30% of active rooms have generated sheets
- [ ] **AIF Neighborhood Usage**: 50% of argument views expand to diagram
- [ ] **Scheme Usage**: 40% of new arguments use scheme templates
- [ ] **Cross-Deliberation Imports**: 20% of imports preserve Toulmin structure
- [ ] **Dialogue Layer Usage**: 10% of users enable dialogue visualization overlay

---

## Maintenance & Future Work

### Ongoing Maintenance

- **Schema Migrations**: Track Prisma schema changes affecting Argument/Claim/ConflictApplication
- **API Performance**: Monitor query times for claim-to-argument resolution (can be expensive)
- **Edge Derivation**: Keep generate-debate-sheets.ts pattern as canonical reference
- **User Feedback**: Collect feedback on diagram usability, iterate on layouts

### Future Enhancements

**Phase 7: Advanced AF Features** (post-launch)
- Grounded/Preferred/Stable semantics overlays on DebateSheet
- Interactive extension exploration (click node to see full extension)
- Argument strength visualization (edge thickness = support strength)

**Phase 8: Dialogue Protocol Extensions**
- Multi-player dialogue games (PPD, CB, PPE protocols)
- Commitment store visualization (who committed to what propositions)
- Dialogue tree export (GraphML, DOT formats for external analysis)
- Full dialogue move provenance tracking with DM-nodes

**Phase 9: Cross-Debate Synthesis**
- TopicCanvas implementation (multi-sheet aggregation)
- Perspective clustering (k-viewpoints extraction from multiple deliberations)
- Bridge Builder UI (suggest connections between opposing camps)
- Cross-deliberation claim overlap detection

**Phase 10: AI-Assisted Diagramming**
- Auto-generate DebateSheet from unstructured debate text
- Suggest appropriate schemes for new arguments based on content
- Auto-answer CQs with evidence search and relevance ranking
- Detect implicit support/attack relationships from natural language

---

**Last Updated**: November 2, 2025  
**Status**: Aligned with proven architecture (ConflictApplication-based edge derivation)  
**Next Review**: After Phase 4 of Dialogue Visualization Roadmap
