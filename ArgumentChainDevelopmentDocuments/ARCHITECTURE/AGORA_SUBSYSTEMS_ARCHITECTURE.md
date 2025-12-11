# Agora Subsystems Architecture Guide

## Extended Reference for Specialized Subsystems

This companion document provides detailed architecture diagrams and explanations for specialized Agora subsystems including Debate Sheets, Plexus, Discussions, Schemes, Thesis, KB Wikis, Discourse Dashboard, and the Evidence/Sources system.

---

## Table of Contents

1. [Agora / Debate Sheets](#1-agora--debate-sheets)
2. [Plexus Network System](#2-plexus-network-system)
3. [Discussions System](#3-discussions-system)
4. [Argument Schemes System](#4-argument-schemes-system)
5. [Thesis System](#5-thesis-system)
6. [KB Wikis System](#6-kb-wikis-system)
7. [Discourse Dashboard](#7-discourse-dashboard)
8. [Evidence / Sources / Citations](#8-evidence--sources--citations)
9. [Stacks & Libraries](#9-stacks--libraries)
10. [Deliberate Button Flow](#10-deliberate-button-flow)

---

# 1. Agora / Debate Sheets

## Overview

Debate Sheets provide a **spreadsheet-like view** of arguments in a deliberation, showing confidence scores, support values, and argument networks in a scannable format.

## Architecture Diagram

```mermaid
flowchart TB
    subgraph DebateSheet["Debate Sheet System"]
        DSR[DebateSheetReader]
        DSH[DebateSheetHeader]
        DSF[DebateSheetFilters]
        ANC[ArgumentNetworkCard]
    end
    
    subgraph DataSources["Data Sources"]
        EV["/api/deliberations/:id/evidential"]
        CL["/api/claims"]
        AR["/api/arguments"]
    end
    
    subgraph Confidence["Confidence System"]
        UC[useConfidence Hook]
        CM["Confidence Modes:<br/>• product<br/>• min<br/>• ds (Dempster-Shafer)"]
        TAU["Threshold (τ)"]
    end
    
    subgraph Display["Display Components"]
        SB[SupportBar]
        CC[ClaimConfidence]
        EMT[EvalModeToggle]
    end
    
    DSR --> DSH & DSF
    DSR --> ANC
    DSR --> UC
    UC --> CM & TAU
    DSR --> EV
    EV --> CL & AR
    DSR --> Display
```

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEBATE SHEETS                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PURPOSE: Spreadsheet view of argument confidence & support     │
│                                                                 │
│  KEY COMPONENTS:                                                │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ DebateSheetReader    │ Main container                     │ │
│  │ DebateSheetHeader    │ Title, controls, mode toggle       │ │
│  │ DebateSheetFilters   │ Search, sort, filter options       │ │
│  │ ArgumentNetworkCard  │ Individual argument display        │ │
│  │ SupportBar           │ Visual confidence indicator        │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  CONFIDENCE MODES:                                              │
│  • product: Multiply path probabilities                        │
│  • min: Take minimum confidence                                │
│  • ds: Dempster-Shafer intervals [bel, pl]                     │
│                                                                 │
│  FILE LOCATIONS:                                                │
│  • components/agora/DebateSheetReader.tsx                      │
│  • components/deepdive/v3/debate-sheet/*                       │
│  • components/evidence/SupportBar.tsx                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Component Breakdown

```
agora/
├── DebateSheetReader.tsx      # Main debate sheet container (533 lines)
│   ├── ClaimsPane             # List of claims with scores
│   └── ArgumentNetworkCard    # Argument display with network preview
│
├── useConfidence.tsx          # Context provider for confidence settings
│   ├── mode: 'product'|'min'|'ds'
│   └── tau: number (threshold)
│
deepdive/v3/debate-sheet/
├── DebateSheetHeader.tsx      # Header with title and controls
├── DebateSheetFilters.tsx     # Filtering and sorting UI
└── ArgumentNetworkCard.tsx    # Individual argument card
```

---

# 2. Plexus Network System

## Overview

Plexus is a **meta-level network visualization** showing connections between different deliberation rooms/debates. It visualizes cross-references, shared arguments, and argument transport between deliberations.

## Architecture Diagram

```mermaid
flowchart TB
    subgraph PlexusSystem["Plexus Network System"]
        PX[Plexus.tsx<br/>Main Component]
        PB[PlexusBoard.tsx<br/>Grid View]
        PM[PlexusMatrix.tsx<br/>Matrix View]
        PRM[PlexusRoomMetrics.tsx<br/>Room Stats]
    end
    
    subgraph NetworkData["Network Data Model"]
        RN["RoomNode:<br/>• id, title<br/>• nArgs, nEdges<br/>• accepted/rejected/undecided<br/>• tags, debateSheetId"]
        ME["MetaEdge:<br/>• from, to<br/>• kind, weight"]
    end
    
    subgraph EdgeTypes["Edge Types (MetaEdge.kind)"]
        XR["xref: Cross-reference<br/>(indigo)"]
        OV["overlap: Shared claims<br/>(red)"]
        SR["stack_ref: Stack reference<br/>(amber)"]
        IM["imports: Imported args<br/>(teal)"]
        SA["shared_author: Same user<br/>(slate)"]
    end
    
    subgraph Actions["Link Actions"]
        TR["Transport:<br/>Copy arguments between rooms"]
        LK["Link:<br/>Create cross-references"]
    end
    
    PX --> PB & PM & PRM
    PX --> |fetches| API["/api/agora/network"]
    API --> RN & ME
    ME --> EdgeTypes
    PX --> Actions
```

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────────┐
│                    PLEXUS NETWORK                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PURPOSE: Meta-network of deliberation rooms & their links      │
│                                                                 │
│  EDGE TYPES (color-coded):                                      │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 🟣 xref         │ Cross-reference between rooms           │ │
│  │ 🔴 overlap      │ Shared claims/arguments                 │ │
│  │ 🟠 stack_ref    │ Referenced in same stack               │ │
│  │ 🟢 imports      │ Arguments imported from another room   │ │
│  │ ⚫ shared_author│ Same author participates               │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  VIEW MODES:                                                    │
│  • Plexus.tsx: Interactive graph with nodes & edges            │
│  • PlexusBoard.tsx: Grid/card layout                           │
│  • PlexusMatrix.tsx: Adjacency matrix view                     │
│                                                                 │
│  ACTIONS:                                                       │
│  • Transport: Copy arguments to another room                   │
│  • Link: Create explicit cross-reference                       │
│  • Select: Open room in DeepDivePanel                          │
│                                                                 │
│  FILE LOCATIONS:                                                │
│  • components/agora/Plexus.tsx (~1010 lines)                   │
│  • components/agora/PlexusBoard.tsx                            │
│  • components/agora/PlexusMatrix.tsx                           │
│  • components/agora/PlexusRoomMetrics.tsx                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Data Model

```typescript
// Room/Deliberation Node
type RoomNode = {
  id: string;
  title?: string | null;
  nArgs: number;        // Total arguments
  nEdges: number;       // Total edges
  accepted: number;     // IN claims count
  rejected: number;     // OUT claims count
  undecided: number;    // UNDEC claims count
  tags?: string[];
  updatedAt?: string | null;
  debateSheetId?: string | null;
};

// Edge between rooms
type MetaEdge = {
  from: string;   // Source room ID
  to: string;     // Target room ID
  kind: EdgeKind; // Type of connection
  weight: number; // Strength of connection
};

type EdgeKind = 'xref' | 'overlap' | 'stack_ref' | 'imports' | 'shared_author';
```

## Network Visualization

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                      PLEXUS NETWORK VIEW                        │
│                                                                 │
│     ┌─────────┐                      ┌─────────┐               │
│     │ Room A  │───── xref ──────────│ Room C  │               │
│     │ 12 args │                      │ 8 args  │               │
│     │ 🟢5 🔴3 │                      │ 🟢6 🔴1 │               │
│     └────┬────┘                      └────┬────┘               │
│          │                                │                     │
│       overlap                          imports                  │
│          │                                │                     │
│     ┌────▼────┐                      ┌────▼────┐               │
│     │ Room B  │───shared_author─────│ Room D  │               │
│     │ 20 args │                      │ 15 args │               │
│     │ 🟢10🔴5 │                      │ 🟢8 🔴4 │               │
│     └─────────┘                      └─────────┘               │
│                                                                 │
│  Legend: 🟢=IN 🔴=OUT ⚪=UNDEC                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

# 3. Discussions System

## Overview

The Discussions system provides a **casual forum/chat hybrid** for preliminary conversation before formal deliberation. Discussions can spawn deliberations via the "Deliberate" button.

## Architecture Diagram

```mermaid
flowchart TB
    subgraph DiscussionSystem["Discussion System"]
        DV[DiscussionView.tsx]
        DVG[DiscussionViewGlass.tsx]
        DC[DiscussionCard.tsx]
    end
    
    subgraph Modes["Communication Modes"]
        CM[Chat Mode<br/>Real-time messages]
        FM[Forum Mode<br/>Threaded comments]
    end
    
    subgraph Components["Sub-Components"]
        FP[ForumPane / ForumPaneGlass]
        CR[ChatRoom]
        MP[MessageComposer]
        TLS[ThreadListSidebar]
        FRC[ForumRulesCard]
    end
    
    subgraph Actions["Actions"]
        DB[DeliberateButton]
        SB[SubscribeButton]
        NDB[NewDiscussionButton]
    end
    
    subgraph Deliberation["Deliberation Bridge"]
        ENS["/api/deliberations/ensure"]
        DLM["/api/dialogue/move"]
    end
    
    DV --> Modes
    CM --> CR & MP
    FM --> FP & TLS
    DV --> Actions
    DB --> ENS
    ENS --> DLM
    DLM --> |"Creates"| DELIB[Deliberation]
```

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────────┐
│                    DISCUSSIONS SYSTEM                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PURPOSE: Casual discussion before formal deliberation          │
│                                                                 │
│  TWO MODES:                                                     │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 💬 CHAT   │ Real-time messaging, quick exchanges          │ │
│  │ 📋 FORUM  │ Threaded comments, structured discussion      │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  KEY COMPONENTS:                                                │
│  • DiscussionView.tsx - Main container with mode toggle        │
│  • ForumPane.tsx - Forum thread display                        │
│  • ChatRoom.tsx - Real-time chat interface                     │
│  • DeliberateButton.tsx - Bridge to formal deliberation        │
│                                                                 │
│  DELIBERATE FLOW:                                               │
│  Discussion → [Deliberate] → /api/deliberations/ensure          │
│            → Creates Deliberation → Opens DeepDivePanelV2       │
│                                                                 │
│  FILE LOCATIONS:                                                │
│  • components/discussion/DiscussionView.tsx                    │
│  • components/discussion/ForumPane.tsx                         │
│  • components/common/DeliberationButton.tsx                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Discussion → Deliberation Flow

```mermaid
sequenceDiagram
    participant U as User
    participant DV as DiscussionView
    participant DB as DeliberateButton
    participant API as Backend API
    participant DP as DeepDivePanelV2
    
    U->>DV: Views discussion
    U->>DV: Clicks "Deliberate"
    DV->>DB: Trigger
    DB->>API: POST /api/deliberations/ensure<br/>{hostType: "discussion", hostId}
    
    alt Deliberation exists
        API-->>DB: {id: existing_delib_id}
    else New deliberation
        API->>API: Create Deliberation
        API-->>DB: {id: new_delib_id}
    end
    
    opt Seed claim provided
        DB->>API: POST /api/dialogue/move<br/>{kind: ASSERT, payload: {text}}
    end
    
    DB->>API: POST /api/discussions/:id/deliberations<br/>{deliberationId}
    DB->>DP: Navigate to /deliberation/:id
    DP->>U: Show DeepDivePanelV2
```

---

# 4. Argument Schemes System

## Overview

The Argument Schemes system implements **Walton-style argumentation schemes** with critical questions. It provides a library of 60+ formal argument patterns that can be applied to arguments.

## Architecture Diagram

```mermaid
flowchart TB
    subgraph SchemeSystem["Argument Scheme System"]
        SL[SchemeList.tsx<br/>Admin View]
        SC[SchemeCreator.tsx<br/>Create/Edit]
        SHV[SchemeHierarchyView.tsx<br/>Tree View]
    end
    
    subgraph ArgumentIntegration["Argument Integration"]
        ASL[ArgumentSchemeList.tsx]
        ASC[AIFArgumentWithSchemeComposer.tsx]
        SB[SchemeBreakdown.tsx]
        SS[SchemeSelector.tsx]
        MSB[MultiSchemeBadge.tsx]
    end
    
    subgraph CriticalQuestions["Critical Questions"]
        CQM[ArgumentCriticalQuestionsModal.tsx]
        CQV[CriticalQuestionsV3.tsx]
        CQR[CQResponseForm.tsx]
    end
    
    subgraph SchemeData["Scheme Data Model"]
        AS["ArgumentScheme:<br/>• key, name<br/>• premises[], conclusion<br/>• materialRelation<br/>• reasoningType"]
        CQ["CriticalQuestion:<br/>• cqKey, text<br/>• attackType<br/>• targetScope<br/>• burdenOfProof"]
    end
    
    subgraph API["API Endpoints"]
        SCH["/api/schemes"]
        ASCH["/api/aif/schemes"]
        INST["/api/schemes/instances"]
    end
    
    SL --> SC & SHV
    SL --> API
    ASC --> SS --> AS
    AS --> CQ
    ASL --> MSB
    CQM --> CQV --> CQR
```

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────────┐
│                  ARGUMENT SCHEMES SYSTEM                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PURPOSE: Formal argument patterns with critical questions      │
│                                                                 │
│  SCHEME STRUCTURE:                                              │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Scheme: "Argument from Expert Opinion"                    │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │ Premises:                                                 │ │
│  │   • E is an expert in domain D                           │ │
│  │   • E asserts A                                          │ │
│  │   • A is in domain D                                     │ │
│  │ Conclusion:                                               │ │
│  │   • A is (presumably) true                               │ │
│  │ Critical Questions:                                       │ │
│  │   CQ1: Is E credible?                                    │ │
│  │   CQ2: Is E expert in D?                                 │ │
│  │   CQ3: What did E actually say?                          │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ATTACK TYPES (via CQs):                                        │
│  • REBUTS: Attacks conclusion                                  │
│  • UNDERCUTS: Attacks inference                                │
│  • UNDERMINES: Attacks premise                                 │
│                                                                 │
│  SCHEME CATEGORIES:                                             │
│  • Source-based (expert, witness, authority)                   │
│  • Causal (cause-effect, sign, correlation)                    │
│  • Analogy (comparison, precedent)                             │
│  • Practical (goals, consequences, values)                     │
│                                                                 │
│  KEY FILES:                                                     │
│  • components/admin/SchemeList.tsx                             │
│  • components/admin/SchemeCreator.tsx                          │
│  • components/arguments/ArgumentSchemeList.tsx                 │
│  • components/arguments/SchemeBreakdown.tsx                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Scheme Data Model

```typescript
type ArgumentScheme = {
  id: string;
  key: string;          // e.g., "expert_opinion"
  name: string;         // "Argument from Expert Opinion"
  summary: string;
  description?: string;
  
  // Classification
  materialRelation?: string;  // "source-based", "causal", etc.
  reasoningType?: string;     // "presumptive", "deductive"
  clusterTag?: string;        // Grouping tag
  
  // Structure
  premises?: PremiseTemplate[];
  conclusion?: ConclusionTemplate;
  ruleForm?: string;    // Logical form
  
  // Hierarchy
  parentSchemeId?: string;
  inheritCQs?: boolean;
  
  // Critical Questions
  cqs: CriticalQuestion[];
};

type CriticalQuestion = {
  cqKey: string;        // e.g., "CQ1"
  text: string;         // "Is E credible as an expert?"
  attackType: 'REBUTS' | 'UNDERCUTS' | 'UNDERMINES';
  targetScope: 'conclusion' | 'inference' | 'premise';
  burdenOfProof?: 'proponent' | 'challenger';
  requiresEvidence?: boolean;
};
```

## Scheme Hierarchy Visualization

```
┌─────────────────────────────────────────────────────────────────┐
│                    SCHEME HIERARCHY                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📁 Source-Based Arguments                                      │
│  ├── 📄 Argument from Expert Opinion                           │
│  │   ├── 📄 Argument from Expert Consensus                     │
│  │   └── 📄 Argument from Specialized Expert                   │
│  ├── 📄 Argument from Witness Testimony                        │
│  └── 📄 Argument from Authority                                │
│                                                                 │
│  📁 Causal Arguments                                            │
│  ├── 📄 Argument from Cause to Effect                          │
│  ├── 📄 Argument from Effect to Cause                          │
│  ├── 📄 Argument from Sign                                     │
│  └── 📄 Argument from Correlation to Cause                     │
│                                                                 │
│  📁 Practical Arguments                                         │
│  ├── 📄 Argument from Consequences                             │
│  ├── 📄 Argument from Goals                                    │
│  └── 📄 Argument from Values                                   │
│                                                                 │
│  📁 Analogical Arguments                                        │
│  ├── 📄 Argument from Analogy                                  │
│  └── 📄 Argument from Precedent                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

# 5. Thesis System

## Overview

The Thesis system allows users to compose **structured legal-style documents** that aggregate claims and arguments into cohesive, publishable theses with prongs, sections, and citations.

## Architecture Diagram

```mermaid
flowchart TB
    subgraph ThesisSystem["Thesis System"]
        TC[ThesisComposer.tsx<br/>Create/Edit]
        TR[ThesisRenderer.tsx<br/>Read View]
        TLV[ThesisListView.tsx<br/>List]
        TE[ThesisEditor.tsx]
        TEM[ThesisExportModal.tsx]
    end
    
    subgraph Structure["Thesis Structure"]
        TH["Thesis:<br/>• title, abstract<br/>• status, template<br/>• thesisClaim"]
        PR["Prong:<br/>• order, title, role<br/>• mainClaim<br/>• arguments[]"]
        SEC["Section:<br/>• sectionType<br/>• title, content"]
    end
    
    subgraph ProngRoles["Prong Roles"]
        SUP[SUPPORT<br/>Supports thesis]
        REB[REBUT<br/>Addresses counter]
        PRE[PREEMPT<br/>Anticipates objection]
    end
    
    subgraph Templates["Templates"]
        LEG[LEGAL_DEFENSE]
        POL[POLICY_CASE]
        ACA[ACADEMIC_THESIS]
        GEN[GENERAL]
    end
    
    subgraph Sections["Section Types"]
        INT[INTRODUCTION]
        BG[BACKGROUND]
        LS[LEGAL_STANDARD]
        METH[METHODOLOGY]
        CON[CONCLUSION]
        APP[APPENDIX]
    end
    
    TC --> TH
    TH --> PR & SEC
    PR --> ProngRoles
    TC --> Templates
    SEC --> Sections
    TR --> |exports| TEM
```

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────────┐
│                      THESIS SYSTEM                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PURPOSE: Structured legal-style argument documents             │
│                                                                 │
│  THESIS STRUCTURE:                                              │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ THESIS                                                    │ │
│  │ ├── Title & Abstract                                      │ │
│  │ ├── Thesis Claim (main assertion)                         │ │
│  │ ├── SECTIONS (intro, background, methodology...)          │ │
│  │ └── PRONGS (supporting argument groups)                   │ │
│  │     ├── SUPPORT prong (positive case)                     │ │
│  │     ├── REBUT prong (counter arguments)                   │ │
│  │     └── PREEMPT prong (anticipate objections)             │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  TEMPLATES:                                                     │
│  • LEGAL_DEFENSE: Court brief style                            │
│  • POLICY_CASE: Policy proposal format                         │
│  • ACADEMIC_THESIS: Research paper structure                   │
│  • GENERAL: Flexible format                                    │
│                                                                 │
│  STATUS WORKFLOW:                                               │
│  DRAFT → SUBMITTED → PUBLISHED → ARCHIVED                       │
│                                                                 │
│  KEY FILES:                                                     │
│  • components/thesis/ThesisComposer.tsx (~923 lines)           │
│  • components/thesis/ThesisRenderer.tsx                        │
│  • components/thesis/ProngEditor.tsx                           │
│  • components/thesis/ThesisSectionEditor.tsx                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Thesis Structure Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    THESIS DOCUMENT                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ╔═══════════════════════════════════════════════════════════╗ │
│  ║ TITLE: "Analysis of Climate Policy Effectiveness"         ║ │
│  ║ STATUS: 📝 DRAFT                                           ║ │
│  ║ TEMPLATE: POLICY_CASE                                      ║ │
│  ╚═══════════════════════════════════════════════════════════╝ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 📝 ABSTRACT                                              │   │
│  │ "This thesis argues that carbon taxation..."             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🎯 THESIS CLAIM                                          │   │
│  │ "Carbon taxation is the most effective policy tool..."   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ═══════════════════ SECTIONS ════════════════════════════     │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 📖 INTRODUCTION                                          │   │
│  │ Background context and motivation...                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 📚 BACKGROUND                                            │   │
│  │ Historical context and prior work...                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ═══════════════════ PRONGS ══════════════════════════════     │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ✅ PRONG 1: SUPPORT                                      │   │
│  │ "Economic Effectiveness"                                 │   │
│  │ Main Claim: Carbon taxes reduce emissions cost-effectively│   │
│  │ Arguments:                                               │   │
│  │   [1] From Expert Consensus                             │   │
│  │   [2] From Statistical Evidence                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ⚔️ PRONG 2: REBUT                                        │   │
│  │ "Addressing Economic Concerns"                           │   │
│  │ Main Claim: Economic harms are overstated               │   │
│  │ Arguments:                                               │   │
│  │   [1] Against regressive impact claim                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

# 6. KB Wikis System

## Overview

KB (Knowledge Base) Wikis provide a **block-based document system** for creating wiki pages that can embed arguments, claims, room summaries, and transports from the deliberation system.

## Architecture Diagram

```mermaid
flowchart TB
    subgraph KBSystem["KB Wiki System"]
        KPE[KbPageEditor.tsx<br/>Main Editor]
        KBR[KbBlockRenderer.tsx<br/>Block Display]
        KTR[KbTranscludeRenderer.tsx<br/>Embedded Content]
    end
    
    subgraph Blocks["Block Types"]
        TB[TextBlock]
        AB[ArgumentBlock]
        CB[ClaimBlock]
        RSB[RoomSummaryBlock]
        SHB[SheetBlock]
        TRB[TransportBlock]
    end
    
    subgraph Editor["Editor Features"]
        DND["Drag & Drop<br/>(dnd-kit)"]
        SM["Slash Menu<br/>Insert Picker"]
        SN["Snapshots<br/>Version History"]
    end
    
    subgraph Integration["Deliberation Integration"]
        EP[EntityPicker.tsx]
        TC[TransportComposer.tsx]
        PC[ProvenanceChip.tsx]
    end
    
    KPE --> KBR
    KBR --> Blocks
    KPE --> Editor
    Blocks --> Integration
    TB --> |"/argument"| AB
    TB --> |"/claim"| CB
    EP --> |selects| AB & CB & RSB
```

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────────┐
│                      KB WIKI SYSTEM                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PURPOSE: Block-based wiki with embedded deliberation content   │
│                                                                 │
│  BLOCK TYPES:                                                   │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 📝 TextBlock      │ Rich text content                     │ │
│  │ 💬 ArgumentBlock  │ Embedded argument from deliberation   │ │
│  │ 📌 ClaimBlock     │ Embedded claim with status            │ │
│  │ 🏠 RoomSummaryBlock│ Deliberation room summary            │ │
│  │ 📊 SheetBlock     │ Embedded debate sheet                 │ │
│  │ 🚀 TransportBlock │ Cross-room argument transport         │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  EDITOR FEATURES:                                               │
│  • Drag & drop reordering (dnd-kit)                            │
│  • Slash commands (/argument, /claim, etc.)                    │
│  • Snapshot versioning                                         │
│  • Live/Draft block status                                     │
│                                                                 │
│  TRANSCLUSION:                                                  │
│  • Arguments render with full AIF structure                    │
│  • Claims show current status (IN/OUT/UNDEC)                   │
│  • Provenance chips show source deliberation                   │
│                                                                 │
│  KEY FILES:                                                     │
│  • components/kb/KbPageEditor.tsx                              │
│  • components/kb/KbBlockRenderer.tsx                           │
│  • components/kb/blocks/*.tsx                                  │
│  • components/kb/editor/plugins/SlashMenu.ts                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Block Structure

```typescript
type KbBlock = {
  id: string;
  type: BlockType;
  order: number;
  live: boolean;      // Published or draft
  data: BlockData;    // Type-specific data
};

type BlockType = 
  | 'text'           // Rich text
  | 'argument'       // ArgumentBlock
  | 'claim'          // ClaimBlock
  | 'room_summary'   // RoomSummaryBlock
  | 'sheet'          // SheetBlock
  | 'transport';     // TransportBlock

// Example ArgumentBlock data
type ArgumentBlockData = {
  argumentId: string;
  deliberationId: string;
  showCQs?: boolean;
  showDiagram?: boolean;
};
```

---

# 7. Discourse Dashboard

## Overview

The Discourse Dashboard is a **personal activity tracker** showing users their contributions, engagements, and actions taken on their work across deliberations.

## Architecture Diagram

```mermaid
flowchart TB
    subgraph Dashboard["Discourse Dashboard"]
        DD[DiscourseDashboard.tsx<br/>~1032 lines]
    end
    
    subgraph Tabs["Four Main Tabs"]
        CONT["My Contributions<br/>📝 What I created"]
        ENG["My Engagements<br/>💬 What I interacted with"]
        ACT["Actions on My Work<br/>🎯 Others' reactions"]
        FEED["Activity Feed<br/>📊 Timeline"]
    end
    
    subgraph ContributionTypes["Contribution Types"]
        CL[Claims]
        AR[Arguments]
        PR[Propositions]
    end
    
    subgraph EngagementTypes["Engagement Types"]
        ATT[Attacks Made]
        SUP[Supports Given]
        CQ[CQs Asked]
        RES[Responses Given]
    end
    
    subgraph ActionTypes["Actions on My Work"]
        REC[Attacks Received]
        CHQ[Challenges Received]
        END[Endorsements]
        REF[Refutations]
    end
    
    DD --> Tabs
    CONT --> ContributionTypes
    ENG --> EngagementTypes
    ACT --> ActionTypes
```

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────────┐
│                   DISCOURSE DASHBOARD                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PURPOSE: Track personal participation and engagement           │
│                                                                 │
│  TABS:                                                          │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 📝 MY CONTRIBUTIONS                                       │ │
│  │    • Claims I've asserted                                 │ │
│  │    • Arguments I've constructed                           │ │
│  │    • Propositions I've submitted                          │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │ 💬 MY ENGAGEMENTS                                         │ │
│  │    • Attacks I've made                                    │ │
│  │    • Supports I've provided                               │ │
│  │    • Critical questions I've asked                        │ │
│  │    • Responses I've given                                 │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │ 🎯 ACTIONS ON MY WORK                                     │ │
│  │    • Attacks received on my claims                        │ │
│  │    • Challenges to my arguments                           │ │
│  │    • Endorsements received                                │ │
│  │    • Needs attention (pending responses)                  │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │ 📊 ACTIVITY FEED                                          │ │
│  │    • Chronological timeline                               │ │
│  │    • All interactions in one view                         │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ACTIONS:                                                       │
│  • Click to view detail                                        │
│  • Respond to attacks directly                                 │
│  • Track notification badges                                   │
│                                                                 │
│  FILE: components/discourse/DiscourseDashboard.tsx             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Dashboard Visualization

```
┌─────────────────────────────────────────────────────────────────┐
│                   DISCOURSE DASHBOARD                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [My Contributions] [My Engagements] [Actions on Me] [Feed]     │
│       ═══════                                                    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ SUB-TABS: [All] [Claims] [Arguments] [Propositions]     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  📊 Summary: 12 Claims | 5 Arguments | 3 Propositions          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 📌 Claim: "Carbon taxes reduce emissions"               │   │
│  │    Status: 🟢 IN | Supports: 3 | Attacks: 1              │   │
│  │    Created: 2 days ago                                   │   │
│  │    [View] [Respond to Attack]                           │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ 💬 Argument: "From Expert Consensus"                    │   │
│  │    Scheme: expert_opinion | CQs Answered: 2/6           │   │
│  │    Status: Active                                        │   │
│  │    [View] [Add Response]                                │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ 📝 Proposition: "We should implement carbon tax"        │   │
│  │    Votes: 12 | Comments: 5                              │   │
│  │    [View Discussion]                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

# 8. Evidence / Sources / Citations

## Overview

The Evidence system tracks **sources and citations** used across arguments and claims, with community quality ratings and usage metrics.

## Architecture Diagram

```mermaid
flowchart TB
    subgraph EvidenceSystem["Evidence System"]
        EL[EvidenceList.tsx<br/>Source List View]
        SB[SupportBar.tsx<br/>Confidence Display]
        CC[ClaimConfidence.tsx]
        EMT[EvalModeToggle.tsx]
    end
    
    subgraph SourceData["Source Data Model"]
        ES["EvidenceSource:<br/>• title, url, type<br/>• authors, year<br/>• doi, publication"]
        UM["Usage Metrics:<br/>• usageCount<br/>• usedInArguments<br/>• usedInClaims<br/>• uniqueUsers"]
        RT["Ratings:<br/>• averageRating (1-10)<br/>• ratingCount"]
    end
    
    subgraph Features["Features"]
        SR["Source Rating<br/>(1-10 scale)"]
        US["Usage Stats"]
        FT["Filtering/Sorting"]
    end
    
    subgraph Integration["Integration Points"]
        ARG["Arguments<br/>(evidence claims)"]
        CIT["Citations<br/>(in thesis/KB)"]
        CL["Claims<br/>(supporting evidence)"]
    end
    
    EL --> SourceData
    EL --> Features
    SourceData --> Integration
```

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────────┐
│                  EVIDENCE / SOURCES SYSTEM                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PURPOSE: Track citations and rate source quality               │
│                                                                 │
│  SOURCE DATA:                                                   │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ • title: "Study on Carbon Tax Effectiveness"             │ │
│  │ • url: https://journal.org/article/123                   │ │
│  │ • type: academic_paper | news | report | book            │ │
│  │ • authors: [{family: "Smith", given: "J"}]               │ │
│  │ • year: 2023                                             │ │
│  │ • doi: 10.1234/example                                   │ │
│  │ • publication: "Climate Policy Journal"                  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  METRICS:                                                       │
│  • Usage count: Times cited                                    │
│  • Used in: X arguments, Y claims                              │
│  • Unique users: Z different people cited this                 │
│  • Average rating: 8.5/10 (N ratings)                          │
│                                                                 │
│  RATING SYSTEM:                                                 │
│  • Community rates 1-10 scale                                  │
│  • Higher = more reliable/trustworthy                          │
│  • Ratings inform confidence calculations                      │
│                                                                 │
│  KEY FILES:                                                     │
│  • components/evidence/EvidenceList.tsx                        │
│  • components/evidence/SupportBar.tsx                          │
│  • app/api/deliberations/[id]/sources/route.ts                 │
│  • app/api/sources/[id]/rate/route.ts                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Source Data Model

```typescript
type EvidenceSource = {
  sourceId: string;
  title: string;
  url: string;
  type: string;          // academic_paper, news, report, etc.
  authorsJson: any;      // Parsed author data
  year: number | null;
  publicationTitle: string | null;
  doi: string | null;
  
  // Usage metrics
  usageCount: number;
  usedInArguments: number;
  usedInClaims: number;
  uniqueUsers: number;
  firstUsed: string;     // ISO date
  lastUsed: string;      // ISO date
  
  // Community rating
  averageRating: number | null;  // 1-10 scale
  ratingCount: number;
};
```

---

# 9. Stacks & Libraries

## Overview

Stacks are **curated collections** of references, arguments, or resources that users can organize, share, and use across deliberations.

## Architecture Diagram

```mermaid
flowchart TB
    subgraph StacksSystem["Stacks System"]
        SD[StacksDashboard.tsx<br/>User's Stacks]
        SP["Stack Page<br/>/stacks/[slugOrId]"]
    end
    
    subgraph StackData["Stack Data Model"]
        ST["Stack:<br/>• id, name, slug<br/>• is_public<br/>• description"]
        SI["Stack Items:<br/>• References<br/>• Arguments<br/>• Claims"]
    end
    
    subgraph Features["Features"]
        CR[Create Stack]
        ED[Edit/Rename]
        SH[Share (public/private)]
        CP[Copy Link]
        DL[Delete]
    end
    
    subgraph Integration["Integration"]
        DL2["Deliberations<br/>(stack_ref edges)"]
        PX["Plexus Network<br/>(cross-stack links)"]
        KB["KB Wikis<br/>(embed stacks)"]
    end
    
    SD --> StackData
    SD --> Features
    StackData --> Integration
```

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────────┐
│                    STACKS & LIBRARIES                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PURPOSE: Curated collections of resources and arguments        │
│                                                                 │
│  STACK PROPERTIES:                                              │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ • name: "Climate Policy Resources"                        │ │
│  │ • slug: climate-policy-resources                          │ │
│  │ • is_public: true/false                                   │ │
│  │ • description: "Collection of key papers..."              │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  FEATURES:                                                      │
│  • Create new stacks                                           │
│  • Add items (refs, arguments, claims)                         │
│  • Public/private visibility                                   │
│  • Share via slug URL                                          │
│  • Search and filter                                           │
│                                                                 │
│  INTEGRATION:                                                   │
│  • Plexus: stack_ref edge type                                 │
│  • KB Wikis: Embed stack blocks                                │
│  • Deliberations: Reference stack items                        │
│                                                                 │
│  KEY FILES:                                                     │
│  • app/(root)/(standard)/profile/stacks/ui/StacksDashboard.tsx │
│  • app/stacks/[slugOrId]/page.tsx                              │
│  • app/api/stacks/route.ts                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

# 10. Deliberate Button Flow

## Overview

The **Deliberate Button** is the bridge that transforms casual discussions into formal deliberations. It appears in discussions and creates/opens the corresponding deliberation.

## Architecture Diagram

```mermaid
flowchart TB
    subgraph Triggers["Trigger Points"]
        DV[DiscussionView]
        CC[Comment Card]
        KB[KB Wiki Page]
    end
    
    subgraph Button["DeliberateButton"]
        DB[DeliberateButton.tsx]
        DBP["Props:<br/>• discussionId<br/>• conversationId?<br/>• seedClaimText?"]
    end
    
    subgraph Flow["Deliberation Flow"]
        ENS["/api/deliberations/ensure<br/>POST {hostType, hostId}"]
        CHK{Exists?}
        NEW[Create New Deliberation]
        GET[Return Existing ID]
        SEED["Optional: Seed Claim<br/>/api/dialogue/move"]
        LINK["Link to Discussion<br/>/api/discussions/:id/deliberations"]
        NAV["Navigate to<br/>/deliberation/:id"]
    end
    
    Triggers --> DB
    DB --> ENS
    ENS --> CHK
    CHK -->|No| NEW --> SEED
    CHK -->|Yes| GET
    NEW & GET --> LINK --> NAV
```

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────────┐
│                   DELIBERATE BUTTON                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PURPOSE: Bridge from casual discussion to formal deliberation  │
│                                                                 │
│  PROPS:                                                         │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ discussionId   │ Required │ Source discussion ID          │ │
│  │ conversationId │ Optional │ Chat thread ID                │ │
│  │ seedClaimText  │ Optional │ Initial claim to assert       │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  FLOW:                                                          │
│  1. User clicks "Deliberate" button                            │
│  2. POST /api/deliberations/ensure                             │
│     • hostType: "discussion" | "inbox_thread"                  │
│     • hostId: discussionId or conversationId                   │
│  3. If new, creates deliberation                               │
│  4. If seedClaimText, creates initial ASSERT move              │
│  5. Links deliberation back to discussion                      │
│  6. Redirects to /deliberation/:id                             │
│                                                                 │
│  HOST TYPES:                                                    │
│  • discussion: Forum discussion                                │
│  • inbox_thread: Chat conversation                             │
│  • article: Article/post                                       │
│  • kb_page: KB wiki page                                       │
│                                                                 │
│  KEY FILES:                                                     │
│  • components/common/DeliberationButton.tsx                    │
│  • components/discussion/DeliberateButton.tsx                  │
│  • app/api/deliberations/ensure/route.ts                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Complete Flow Sequence

```mermaid
sequenceDiagram
    participant U as User
    participant D as Discussion
    participant DB as DeliberateButton
    participant API as Backend
    participant DEL as Deliberation
    participant DDP as DeepDivePanelV2
    
    U->>D: Views discussion
    U->>DB: Clicks "Deliberate"
    DB->>DB: setBusy(true)
    
    DB->>API: POST /api/deliberations/ensure
    Note right of API: {hostType: "discussion",<br/>hostId: "disc-123"}
    
    alt No existing deliberation
        API->>DEL: Create new deliberation
        DEL-->>API: {id: "delib-456"}
    else Deliberation exists
        API-->>DB: {id: "existing-delib"}
    end
    
    opt seedClaimText provided
        DB->>API: POST /api/dialogue/move
        Note right of API: {deliberationId, kind: "ASSERT",<br/>payload: {text: seedClaimText}}
    end
    
    DB->>API: POST /api/discussions/:id/deliberations
    Note right of API: Links deliberation to discussion
    
    DB->>DDP: location.href = /deliberation/:id
    DDP->>U: DeepDivePanelV2 rendered
    
    DB->>DB: setBusy(false)
```

---

# Master System Integration Diagram

```mermaid
flowchart TB
    subgraph EntryPoints["Entry Points"]
        DSC[Discussion]
        AGR[Agora Home]
        PLX[Plexus]
        KBP[KB Page]
    end
    
    subgraph Core["Core Deliberation"]
        DDP[DeepDivePanelV2]
        DB[Debate Sheet]
        ARG[Arguments]
        CL[Claims]
    end
    
    subgraph Support["Supporting Systems"]
        SCH[Schemes]
        TH[Thesis]
        KB[KB Wiki]
        STK[Stacks]
    end
    
    subgraph Analytics["Analytics & Tracking"]
        DD[Discourse Dashboard]
        EV[Evidence/Sources]
        PM[Plexus Metrics]
    end
    
    DSC -->|Deliberate| DDP
    AGR --> PLX --> DDP
    KBP -->|embed| DDP
    
    DDP --> DB & ARG & CL
    ARG --> SCH
    DDP --> TH
    KB --> |transclude| ARG & CL
    STK --> |reference| ARG
    
    DDP --> DD
    ARG --> EV
    PLX --> PM
```

---

## File Location Quick Reference

```
DEBATE SHEETS:
├── components/agora/DebateSheetReader.tsx
├── components/deepdive/v3/debate-sheet/*
└── components/evidence/SupportBar.tsx

PLEXUS:
├── components/agora/Plexus.tsx
├── components/agora/PlexusBoard.tsx
├── components/agora/PlexusMatrix.tsx
└── components/agora/PlexusRoomMetrics.tsx

DISCUSSIONS:
├── components/discussion/DiscussionView.tsx
├── components/discussion/ForumPane.tsx
└── components/common/DeliberationButton.tsx

SCHEMES:
├── components/admin/SchemeList.tsx
├── components/admin/SchemeCreator.tsx
├── components/arguments/ArgumentSchemeList.tsx
└── components/arguments/SchemeBreakdown.tsx

THESIS:
├── components/thesis/ThesisComposer.tsx
├── components/thesis/ThesisRenderer.tsx
├── components/thesis/ProngEditor.tsx
└── components/thesis/ThesisSectionEditor.tsx

KB WIKIS:
├── components/kb/KbPageEditor.tsx
├── components/kb/KbBlockRenderer.tsx
├── components/kb/blocks/*.tsx
└── components/kb/editor/plugins/SlashMenu.ts

DISCOURSE DASHBOARD:
└── components/discourse/DiscourseDashboard.tsx

EVIDENCE:
├── components/evidence/EvidenceList.tsx
├── components/evidence/SupportBar.tsx
└── app/api/deliberations/[id]/sources/route.ts

STACKS:
├── app/(root)/(standard)/profile/stacks/ui/StacksDashboard.tsx
├── app/stacks/[slugOrId]/page.tsx
└── app/api/stacks/route.ts
```

---

*Companion Document to AGORA_DELIBERATION_SYSTEM_ARCHITECTURE.md*
*Generated: December 10, 2025*
*Version: 1.0*
