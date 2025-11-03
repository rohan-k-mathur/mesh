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
- **AIF Neighborhood**: premise, conclusion, conflict, preference, has-presumption, has-exception

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
- ⚔️ Conflict count badge
- 📥 Import provenance flag

**AIF Neighborhood Nodes**:
- 🎓 Scheme badge (RA-nodes)
- ⚠️ CQ status (I-nodes)
- 💬 Dialogue move icon (RA-nodes)
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

## Technical Implementation

### Molecular Diagram Data Sources

```typescript
// Plexus
GET /api/agora/network?scope=public|following
→ { rooms: RoomNode[], edges: MetaEdge[] }

// DebateSheet
GET /api/sheets/[id]
→ { nodes: DebateNode[], edges: DebateEdge[], acceptance: {...} }

// AIF Neighborhood
GET /api/arguments/[id]/aif-neighborhood?depth=2
→ { nodes: AifNode[], edges: AifEdge[] }
```

### Atomic Diagram Data Sources

```typescript
// Toulmin/ArgumentDiagram
GET /api/arguments/[diagramId]?view=diagram
→ { diagram: { statements: Statement[], inferences: Inference[], aif?: AifSubgraph } }

// Scheme Instance
GET /api/schemes/[schemeKey]
→ { schemeKey, name, premises: [...], cqs: [...] }
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

**Reference**: See `DEBATE_LAYER_MODERNIZATION_PLAN.md` for full implementation details
