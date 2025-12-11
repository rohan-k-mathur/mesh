# Agora/Deliberation System Architecture

## Executive Summary

This document provides a comprehensive architectural overview of the Mesh Digital Agora deliberation system, designed for whiteboard communication and technical onboarding. The system is built around `DeepDivePanelV2` as the central UI orchestration component, connecting multiple subsystems that implement formal argumentation theory.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architectural Layers](#2-architectural-layers)
3. [DeepDivePanelV2 - Central Hub](#3-deepdivepanelv2---central-hub)
4. [Core Subsystems](#4-core-subsystems)
   - [4.1 Dialogue Subsystem](#41-dialogue-subsystem)
   - [4.2 Arguments Subsystem (AIF)](#42-arguments-subsystem-aif)
   - [4.3 Claims Subsystem](#43-claims-subsystem)
   - [4.4 Schemes Subsystem](#44-schemes-subsystem)
   - [4.5 Ludics Subsystem](#45-ludics-subsystem)
   - [4.6 Chains Subsystem (Comprehensive)](#46-chains-subsystem-comprehensive)
   - [4.7 ASPIC Subsystem](#47-aspic-subsystem)
5. [Data Flow Diagrams](#5-data-flow-diagrams)
6. [Component Hierarchy](#6-component-hierarchy)
7. [API Architecture](#7-api-architecture)
8. [Theoretical Foundations](#8-theoretical-foundations)
9. [Whiteboard Diagrams](#9-whiteboard-diagrams)

---

## 1. System Overview

The Agora deliberation system implements a **three-layer formal argumentation architecture**:

```
┌─────────────────────────────────────────────────────────────────┐
│                     AGORA DELIBERATION ENGINE                    │
├─────────────────────────────────────────────────────────────────┤
│  Layer 1: PROTOCOL (PPD)                                        │
│  • Move legality, attack vs surrender, public semantics         │
├─────────────────────────────────────────────────────────────────┤
│  Layer 2: GEOMETRY (Ludics)                                     │
│  • Loci, polarized acts, convergence/divergence                 │
├─────────────────────────────────────────────────────────────────┤
│  Layer 3: CONTENT (Toulmin/Walton/AIF)                          │
│  • Schemes + CQs, rebut/undercut, Toulmin structure             │
└─────────────────────────────────────────────────────────────────┘
```

### Design Principles
- **Public Semantics Only**: Legality/status derived solely from public record
- **Explicit Reply Tree**: Every non-initial move replies to a prior move/locus
- **Attack vs Surrender Classification**: Drives branch state and status
- **Formal Grounding**: Based on AIF (Argument Interchange Format) standards

---

## 2. Architectural Layers

### 2.1 Presentation Layer (React/Next.js)

```
┌──────────────────────────────────────────────────────────────┐
│                    DeepDivePanelV2                           │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ Floating Sheets                                          ││
│  │ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  ││
│  │ │ Left Sheet  │ │ Right Sheet │ │ Dictionary Sheet    │  ││
│  │ │ (Explorer)  │ │ (Actions)   │ │ (Glossary)          │  ││
│  │ └─────────────┘ └─────────────┘ └─────────────────────┘  ││
│  └──────────────────────────────────────────────────────────┘│
│  ┌──────────────────────────────────────────────────────────┐│
│  │ Main Tabs                                                ││
│  │ [Debate][Arguments][Chains][Ludics][Admin][Sources]      ││
│  │ [Thesis][Analytics]                                      ││
│  └──────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

### 2.2 State Management Layer

```
┌─────────────────────────────────────────────────────────────┐
│                   State Management                           │
├────────────────────┬────────────────────────────────────────┤
│ Local State        │ SWR Cache                              │
│ • useDeliberationState │ • API Response Caching            │
│ • useSheetPersistence  │ • Optimistic Updates              │
│ • localStorage persist │ • Real-time Revalidation          │
└────────────────────┴────────────────────────────────────────┘
```

### 2.3 Service/API Layer

```
┌─────────────────────────────────────────────────────────────┐
│                     API Routes                               │
├──────────────┬───────────────┬───────────────┬──────────────┤
│ /api/dialogue│ /api/claims   │ /api/arguments│ /api/aif     │
│ • legal-moves│ • [id]        │ • [id]        │ • schemes    │
│ • move       │ • edges       │ • diagram     │ • graph      │
│ • commitments│ • label       │ • batch       │ • validate   │
└──────────────┴───────────────┴───────────────┴──────────────┘
```

### 2.4 Data Layer (Prisma/PostgreSQL)

```
┌─────────────────────────────────────────────────────────────┐
│                    Database Models                           │
├───────────────┬───────────────┬───────────────┬─────────────┤
│ Deliberation  │ Claim         │ Argument      │ DialogueMove│
│ Proposition   │ ClaimEdge     │ ArgumentScheme│ Commitment  │
│ ArgumentChain │ Evidence      │ CriticalQuestion│ LudicDesign│
└───────────────┴───────────────┴───────────────┴─────────────┘
```

---

## 3. DeepDivePanelV2 - Central Hub

### 3.1 Component Structure

`DeepDivePanelV2` serves as the **main orchestration component** for deliberation interfaces. Located at `components/deepdive/DeepDivePanelV2.tsx` (~1861 lines).

```
DeepDivePanelV2
├── Props
│   ├── deliberationId: string (required)
│   ├── selectedClaimId?: string
│   ├── hostName?: string
│   └── onClose?: () => void
│
├── State Management
│   ├── useDeliberationState() - Tab, config, UI state
│   ├── useSheetPersistence() - Floating sheet state
│   └── useMinimapData() - Graph visualization data
│
├── Floating Sheets (3)
│   ├── Left: Graph Explorer (Claims/Arguments/Commitments/Analytics)
│   ├── Right: Actions & Diagram (Dialogical moves, AIF viewer)
│   └── Terms: Definition Dictionary
│
└── Main Tab Content (8 tabs)
    ├── Debate → DebateTab
    ├── Arguments → ArgumentsTab
    ├── Chains → ChainsTab
    ├── Ludics → LudicsPanel
    ├── Admin → Discourse Dashboard, Issues
    ├── Sources → Evidence List
    ├── Thesis → ThesisListView
    └── Analytics → AnalyticsTab
```

### 3.2 Key Imports & Dependencies

```typescript
// Core UI Components
import { FloatingSheet, SheetToggleButton } from "../ui/FloatingSheet";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "../ui/tabs";

// V3 Tab Components
import { ArgumentsTab, AnalyticsTab, DebateTab } from "./v3/tabs";
import { ChainsTab } from "./v3/tabs/ChainsTab";

// Visualization Components
import { AFMinimap } from '@/components/dialogue/minimap/AFMinimap';
import { AifDiagramViewerDagre } from "@/components/map/Aifdiagramviewerdagre";
import CegMiniMap from "./CegMiniMap";
import ClaimMiniMap from "../claims/ClaimMiniMap";

// Dialogue Components
import { DialogueInspector } from "@/components/dialogue/DialogueInspector";
import { DialogueActionsButton } from "@/components/dialogue/DialogueActionsButton";
import { CommandCard, performCommand } from '@/components/dialogue/command-card/CommandCard';

// AIF Components
import { DialogueAwareGraphPanel } from "@/components/aif/DialogueAwareGraphPanel";
import { CommitmentStorePanel } from "@/components/aif/CommitmentStorePanel";

// ASPIC Components
import { AspicTheoryPanel } from "@/components/aspic/AspicTheoryPanel";

// Ludics Components
import LudicsPanel from "./LudicsPanel";
import BehaviourInspectorCard from '@/components/ludics/BehaviourInspectorCard';
```

### 3.3 State Hooks Used

```typescript
// Deliberation state management
const { state: delibState, actions: delibActions } = useDeliberationState({
  initialTab: 'debate',
  initialConfig: { confMode: 'product', rule: 'utilitarian', dsMode: false, cardFilter: 'all' },
});

// Sheet persistence (localStorage-backed)
const { state: sheets, actions: sheetActions } = useSheetPersistence({
  storageKey: `dd:sheets:${deliberationId}`,
  defaultState: { left: false, right: false, terms: false },
});

// Minimap data fetching
const { nodes: minimapNodes, edges: minimapEdges, loading, error } = useMinimapData(deliberationId, {
  semantics: 'grounded',
  supportDefense: true,
  radius: 1,
  maxNodes: 400,
});
```

---

## 4. Core Subsystems

### 4.1 Dialogue Subsystem

**Purpose**: Manages formal dialogue protocol (PPD moves)

```
┌───────────────────────────────────────────────────────────────┐
│                    DIALOGUE SUBSYSTEM                          │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  Move Types:                                                   │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │ ASSERT  │ │  WHY    │ │ GROUNDS │ │ RETRACT │ │ CONCEDE │  │
│  │(neutral)│ │(attack) │ │(attack) │ │(surrender)│(surrender)│  │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
│                                                                │
│  Force Classification:                                         │
│  • ATTACK: WHY, GROUNDS                                        │
│  • SURRENDER: RETRACT, CLOSE, CONCEDE                         │
│  • NEUTRAL: ASSERT, THEREFORE                                  │
│                                                                │
│  Key Components:                                               │
│  • DialogueActionsButton - Trigger dialogue moves              │
│  • CommandCard - Visual move interface                         │
│  • DialogueInspector - Move history viewer                     │
│  • LegalMoveChips - Available move indicators                  │
│                                                                │
│  API Endpoints:                                                │
│  • /api/dialogue/legal-moves - Get available moves             │
│  • /api/dialogue/move - Execute a move                         │
│  • /api/dialogue/commitments - Track commitments               │
└───────────────────────────────────────────────────────────────┘
```

**Key Files**:
- `components/dialogue/DialogueActionsButton.tsx`
- `components/dialogue/command-card/CommandCard.tsx`
- `lib/dialogue/legalMoves.ts`
- `lib/dialogue/types.ts`

### 4.2 Arguments Subsystem (AIF)

**Purpose**: Structured argumentation using Argument Interchange Format

```
┌───────────────────────────────────────────────────────────────┐
│                   ARGUMENTS SUBSYSTEM (AIF)                    │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  Node Types:                                                   │
│  ┌────┐  I-Node: Information (claims, propositions)           │
│  │ I  │                                                        │
│  └────┘                                                        │
│  ┌────┐  RA-Node: Rule of Inference Application               │
│  │RA  │  (connects premises → conclusion)                      │
│  └────┘                                                        │
│  ┌────┐  CA-Node: Conflict Application                        │
│  │CA  │  (attack relationships)                                │
│  └────┘                                                        │
│  ┌────┐  PA-Node: Preference Application                      │
│  │PA  │  (preference over conflicts)                           │
│  └────┘                                                        │
│                                                                │
│  Edge Roles:                                                   │
│  • premise: I → RA                                             │
│  • conclusion: RA → I                                          │
│  • conflictingElement: Attacker → CA                          │
│  • conflictedElement: CA → Target                             │
│  • preferredElement: PA → preferred                           │
│                                                                │
│  Key Components:                                               │
│  • AIFArgumentsListPro - Argument list view                   │
│  • AIFArgumentWithSchemeComposer - Create arguments           │
│  • AifDiagramViewerDagre - Graph visualization                │
│  • SchemeBreakdown - Scheme analysis                          │
│                                                                │
└───────────────────────────────────────────────────────────────┘
```

**Key Files**:
- `components/arguments/AIFArgumentsListPro.tsx`
- `components/arguments/AIFArgumentWithSchemeComposer.tsx`
- `components/map/Aifdiagramviewerdagre.tsx`
- `lib/arguments/diagram.ts`

### 4.3 Claims Subsystem

**Purpose**: Manage atomic propositions and their evaluation

```
┌───────────────────────────────────────────────────────────────┐
│                     CLAIMS SUBSYSTEM                           │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  Claim Status (Grounded Semantics):                           │
│  ┌────────┐ ┌────────┐ ┌────────┐                             │
│  │   IN   │ │  OUT   │ │ UNDEC  │                             │
│  │ (green)│ │  (red) │ │ (gray) │                             │
│  └────────┘ └────────┘ └────────┘                             │
│                                                                │
│  Claim Relationships:                                          │
│  • supports: Claim A supports Claim B                         │
│  • rebuttals: Claim A attacks Claim B                         │
│  • confidence: Computed belief score (0-1)                    │
│                                                                │
│  Key Components:                                               │
│  • ClaimMiniMap - Network visualization                       │
│  • CegMiniMap - Claim Evidence Graph                          │
│  • CriticalQuestionsV3 - CQ interface                         │
│  • ClaimDetailPanel - Claim inspector                         │
│                                                                │
│  Visualization:                                                │
│  ┌──────────────────────────────────────────┐                 │
│  │  [IN]───supports───>[IN]                 │                 │
│  │    │                  │                   │                 │
│  │  attacks            attacks               │                 │
│  │    ↓                  ↓                   │                 │
│  │  [OUT]             [UNDEC]               │                 │
│  └──────────────────────────────────────────┘                 │
│                                                                │
└───────────────────────────────────────────────────────────────┘
```

**Key Files**:
- `components/claims/ClaimMiniMap.tsx`
- `components/claims/CriticalQuestionsV3.tsx`
- `components/deepdive/CegMiniMap.tsx`
- `app/api/claims/[id]/route.ts`

### 4.4 Schemes Subsystem

**Purpose**: Argumentation schemes and critical questions

```
┌───────────────────────────────────────────────────────────────┐
│                    SCHEMES SUBSYSTEM                           │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  Scheme Structure (Walton):                                    │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Argument from Expert Opinion                              │ │
│  ├──────────────────────────────────────────────────────────┤ │
│  │ Premises:                                                 │ │
│  │   P1: E is an expert in domain D                         │ │
│  │   P2: E asserts that A is true                           │ │
│  │   P3: A is within domain D                               │ │
│  │ Conclusion:                                               │ │
│  │   C: A is true (presumably)                              │ │
│  ├──────────────────────────────────────────────────────────┤ │
│  │ Critical Questions:                                       │ │
│  │   CQ1: How credible is E as an expert?                   │ │
│  │   CQ2: Is E an expert in domain D?                       │ │
│  │   CQ3: What did E actually assert?                       │ │
│  │   CQ4: Is E reliable?                                    │ │
│  │   CQ5: Is A consistent with other experts?               │ │
│  │   CQ6: Is E's assertion based on evidence?               │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Attack Types:                                                 │
│  • REBUTS: Attacks the conclusion directly                    │
│  • UNDERCUTS: Attacks the inference rule                      │
│  • UNDERMINES: Attacks a premise                              │
│                                                                │
│  Key Components:                                               │
│  • SchemeBreakdown - Visual scheme structure                  │
│  • SchemeSelector - Scheme picker                             │
│  • ArgumentCriticalQuestionsModal - CQ interface              │
│  • SchemeNetBuilder - Multi-scheme networks                   │
│                                                                │
└───────────────────────────────────────────────────────────────┘
```

**Key Files**:
- `components/arguments/SchemeBreakdown.tsx`
- `components/arguments/ArgumentCriticalQuestionsModal.tsx`
- `app/api/aif/schemes/route.ts`
- `app/server/services/ArgumentGenerationService.ts`

### 4.5 Ludics Subsystem

**Purpose**: Game-theoretic analysis of dialogue

```
┌───────────────────────────────────────────────────────────────┐
│                    LUDICS SUBSYSTEM                            │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  Core Concepts:                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Locus: Address in dialogue tree (e.g., "0.1.2")         │  │
│  │ Polarity: P (positive/assertive) or O (negative/query)  │  │
│  │ Daimon (†): Convergence marker (dialogue terminates)    │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                │
│  Act Types:                                                    │
│  • PROPER: Regular move with polarity and locus               │
│  • DAIMON: Termination signal (†)                             │
│                                                                │
│  Travel Status:                                                │
│  ┌──────────┐ ┌────────────┐ ┌────────────┐                   │
│  │ ONGOING  │ │ CONVERGENT │ │ DIVERGENT  │                   │
│  │(playing) │ │(†,agreed)  │ │(disagreed) │                   │
│  └──────────┘ └────────────┘ └────────────┘                   │
│                                                                │
│  Design Structure:                                             │
│  ┌───────────────────────────────────────┐                    │
│  │ Proponent Design (pos acts)           │                    │
│  │ ├── Act at locus "0"                  │                    │
│  │ │   └── ramification: ["0.1", "0.2"]  │                    │
│  │ └── Act at locus "0.1"                │                    │
│  └───────────────────────────────────────┘                    │
│  ┌───────────────────────────────────────┐                    │
│  │ Opponent Design (neg acts)            │                    │
│  │ ├── Act at locus "0" (WHY?)           │                    │
│  │ └── Act at locus "0.1" (challenge)    │                    │
│  └───────────────────────────────────────┘                    │
│                                                                │
│  Key Components:                                               │
│  • LudicsPanel - Main ludics interface                        │
│  • LociTree - Locus visualization                             │
│  • TraceRibbon - Interaction trace display                    │
│  • BehaviourInspectorCard - Strategy analysis                 │
│                                                                │
└───────────────────────────────────────────────────────────────┘
```

**Key Files**:
- `components/deepdive/LudicsPanel.tsx`
- `components/ludics/LociTreeWithControls.tsx`
- `packages/ludics-core/types.ts`
- `packages/ludics-react/LociTree.tsx`

### 4.6 Chains Subsystem (Comprehensive)

**Purpose**: Link arguments into coherent threads with epistemic scoping, visual canvas editing, and export capabilities.

The Argument Chain system is a core feature of the Agora deliberation platform that allows users to organize, visualize, and export structured arguments. It supports multiple view modes, epistemic status tracking, hypothetical reasoning scopes, and AI-assisted essay generation.

---

#### 4.6.1 Data Model Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                    CHAINS DATA MODEL                           │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  ArgumentChain                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ id: string (cuid)                                       │   │
│  │ name: string                                            │   │
│  │ description?: string                                    │   │
│  │ purpose?: string                                        │   │
│  │ deliberationId: string (FK → Deliberation)              │   │
│  │ createdBy: BigInt (FK → User)                           │   │
│  │ chainType: SERIAL | LINKED | CONVERGENT | DIVERGENT     │   │
│  │ isPublic: boolean                                       │   │
│  │ createdAt: DateTime                                     │   │
│  │ updatedAt: DateTime                                     │   │
│  └────────────────────────────────────────────────────────┘   │
│                         │                                      │
│         ┌───────────────┼───────────────┐                      │
│         ▼               ▼               ▼                      │
│  ArgumentChainNode   ArgumentChainEdge   ArgumentScope         │
│                                                                │
└───────────────────────────────────────────────────────────────┘
```

**ArgumentChainNode** - Represents an argument within a chain:
```
┌────────────────────────────────────────────────────────────┐
│ ArgumentChainNode                                          │
├────────────────────────────────────────────────────────────┤
│ id: string (cuid)                                          │
│ chainId: string (FK → ArgumentChain)                       │
│ argumentId: string (FK → Argument)                         │
│ role: PREMISE | EVIDENCE | CONCLUSION | OBJECTION |        │
│       REBUTTAL | QUALIFIER                                 │
│ nodeOrder: Int                                             │
│ contributorId: BigInt (FK → User)                          │
│ positionX: Float (canvas X coordinate)                     │
│ positionY: Float (canvas Y coordinate)                     │
│ addedAt: DateTime                                          │
│                                                            │
│ // Phase 4: Epistemic Status & Scopes                      │
│ epistemicStatus: EpistemicStatus (default: ASSERTED)       │
│ scopeId?: string (FK → ArgumentScope)                      │
│ dialecticalRole?: DialecticalRole                          │
│ targetType?: ATTACK_NODE | ATTACK_EDGE                     │
│ targetEdgeId?: string (for edge attacks)                   │
└────────────────────────────────────────────────────────────┘
```

**ArgumentChainEdge** - Represents relationships between nodes:
```
┌────────────────────────────────────────────────────────────┐
│ ArgumentChainEdge                                          │
├────────────────────────────────────────────────────────────┤
│ id: string (cuid)                                          │
│ chainId: string (FK → ArgumentChain)                       │
│ sourceNodeId: string (FK → ArgumentChainNode)              │
│ targetNodeId: string (FK → ArgumentChainNode)              │
│ edgeType: SUPPORTS | REFUTES | ENABLES | PRESUPPOSES |     │
│           QUALIFIES | EXEMPLIFIES | UNDERCUTTING_ATTACK |  │
│           REBUTTING_ATTACK | UNDERMINING_ATTACK            │
│ strength: Float (0.0 - 1.0)                                │
│ description?: string                                       │
│ createdAt: DateTime                                        │
└────────────────────────────────────────────────────────────┘
```

**ArgumentScope** (Phase 4) - Defines hypothetical reasoning contexts:
```
┌────────────────────────────────────────────────────────────┐
│ ArgumentScope                                              │
├────────────────────────────────────────────────────────────┤
│ id: string (cuid)                                          │
│ chainId: string (FK → ArgumentChain)                       │
│ scopeType: HYPOTHETICAL | COUNTERFACTUAL | CONDITIONAL |   │
│            OPPONENT | MODAL                                │
│ assumption: string (e.g., "Suppose X...")                  │
│ description?: string                                       │
│ color?: string (hex color for visual display)              │
│ parentScopeId?: string (for nested scopes)                 │
│ depth: Int (nesting level, default: 0)                     │
│ createdBy: BigInt (FK → User)                              │
│ createdAt: DateTime                                        │
└────────────────────────────────────────────────────────────┘
```

---

#### 4.6.2 Epistemic Status System (Phase 4)

The epistemic status system tracks the commitment level and modal status of arguments:

```
┌───────────────────────────────────────────────────────────────┐
│                   EPISTEMIC STATUS VALUES                      │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌────────────┐  ASSERTED                                     │
│  │     ✓      │  Default status - claimed as true             │
│  │  (Green)   │  Represents the "actual world" position       │
│  └────────────┘                                               │
│                                                                │
│  ┌────────────┐  HYPOTHETICAL                                 │
│  │    💡      │  "Suppose X..." - exploring possibilities     │
│  │  (Amber)   │  Used within HYPOTHETICAL scopes              │
│  └────────────┘                                               │
│                                                                │
│  ┌────────────┐  COUNTERFACTUAL                               │
│  │    🔮      │  "Had X been the case..." - contrary to fact  │
│  │  (Purple)  │  Exploring alternative histories              │
│  └────────────┘                                               │
│                                                                │
│  ┌────────────┐  CONDITIONAL                                  │
│  │    ❓      │  "If X, then Y" - dependent on conditions     │
│  │   (Blue)   │  Arguments that depend on uncertain premises  │
│  └────────────┘                                               │
│                                                                │
│  ┌────────────┐  QUESTIONED                                   │
│  │    🤔      │  Under active challenge or inquiry            │
│  │   (Gray)   │  Status uncertain pending resolution          │
│  └────────────┘                                               │
│                                                                │
│  ┌────────────┐  DENIED                                       │
│  │    ✗       │  Explicitly rejected or refuted               │
│  │   (Red)    │  Marked as false or unacceptable              │
│  └────────────┘                                               │
│                                                                │
│  ┌────────────┐  SUSPENDED                                    │
│  │    ⏸       │  Temporarily set aside                        │
│  │  (Orange)  │  Not currently active in deliberation         │
│  └────────────┘                                               │
│                                                                │
└───────────────────────────────────────────────────────────────┘
```

**Dialectical Roles** - Position within the argument structure:
```
┌────────────────────────────────────────────────────────────┐
│ DIALECTICAL ROLES                                          │
├────────────────────────────────────────────────────────────┤
│ PROPONENT   - Advances the main thesis                     │
│ OPPONENT    - Challenges the main thesis                   │
│ MEDIATOR    - Seeks common ground                          │
│ CRITIC      - Evaluates argument quality                   │
│ THESIS      - Main position being argued                   │
│ ANTITHESIS  - Counter-position to thesis                   │
│ SYNTHESIS   - Resolution combining thesis/antithesis       │
│ OBJECTION   - Specific challenge to an argument            │
│ RESPONSE    - Answer to an objection                       │
└────────────────────────────────────────────────────────────┘
```

---

#### 4.6.3 View Modes

```
┌───────────────────────────────────────────────────────────────┐
│                    CHAIN VIEW MODES                            │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌────────┐  LIST VIEW                                        │
│  │  📋    │  Simple list of all chains in deliberation        │
│  │        │  • Create new chains                               │
│  │        │  • Delete/rename existing chains                   │
│  └────────┘  • Quick navigation to chain details              │
│                                                                │
│  ┌────────┐  THREAD VIEW                                      │
│  │  🧵    │  Linear conversation-style display                │
│  │        │  • Arguments shown in sequence                     │
│  │        │  • Inline support/attack indicators               │
│  └────────┘  • Comment and annotation support                 │
│                                                                │
│  ┌────────┐  CANVAS VIEW (ReactFlow)                          │
│  │  🎨    │  Interactive graph visualization                  │
│  │        │  • Drag-and-drop node positioning                 │
│  │        │  • Visual edge connections                        │
│  │        │  • Scope boundaries (Phase 4)                     │
│  │        │  • Hypothetical mode focus                        │
│  └────────┘  • Mini-map navigation                            │
│                                                                │
│  ┌────────┐  PROSE VIEW                                       │
│  │  📝    │  Narrative text export                            │
│  │        │  • Arguments as flowing paragraphs                │
│  │        │  • Relationship connectors ("therefore", "but")   │
│  └────────┘  • Copy-friendly format                           │
│                                                                │
│  ┌────────┐  ESSAY VIEW                                       │
│  │  📄    │  AI-generated structured essay                    │
│  │        │  • Introduction, body, conclusion                 │
│  │        │  • Citation formatting                            │
│  │        │  • Academic-style output                          │
│  └────────┘  • PDF export capability                          │
│                                                                │
└───────────────────────────────────────────────────────────────┘
```

---

#### 4.6.4 Canvas Architecture (ReactFlow)

The ArgumentChainCanvas uses ReactFlow for interactive graph editing:

```
┌───────────────────────────────────────────────────────────────┐
│               CANVAS COMPONENT ARCHITECTURE                    │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  ArgumentChainCanvas.tsx                                       │
│  ├── ReactFlow Provider                                        │
│  │   ├── Custom Node Types                                     │
│  │   │   ├── argument - ChainArgumentNode                     │
│  │   │   └── scopeBoundary - ScopeBoundary (Phase 4)          │
│  │   │                                                         │
│  │   ├── Custom Edge Types                                     │
│  │   │   └── chain - ChainEdge with labels                    │
│  │   │                                                         │
│  │   ├── Controls                                              │
│  │   │   ├── Zoom in/out                                       │
│  │   │   ├── Fit view                                          │
│  │   │   └── Fullscreen toggle                                 │
│  │   │                                                         │
│  │   ├── MiniMap                                               │
│  │   │   └── Scope-aware coloring                             │
│  │   │                                                         │
│  │   └── Background (dots pattern)                             │
│  │                                                             │
│  ├── Floating Panels                                           │
│  │   ├── Add Argument Button                                   │
│  │   ├── Legend Panel                                          │
│  │   │   ├── Edge type colors                                  │
│  │   │   └── Epistemic status indicators                       │
│  │   └── Scope Management (Phase 4)                            │
│  │                                                             │
│  └── Modal Dialogs                                             │
│      ├── ChainArgumentComposer - Create new arguments          │
│      ├── EdgeEditor - Edit relationship type/strength          │
│      └── ScopeEditor - Create/edit scopes                      │
│                                                                │
└───────────────────────────────────────────────────────────────┘
```

**Node Interaction Flow**:
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Click Node │────>│ Show Actions│────>│ Execute     │
│             │     │   Menu      │     │ Action      │
└─────────────┘     └─────────────┘     └─────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
   Support           Attack            Edit Node
   (opens            (opens            (opens
   composer)         composer)         detail panel)
```

---

#### 4.6.5 Scope Boundaries (Phase 4)

Visual containers for hypothetical reasoning:

```
┌───────────────────────────────────────────────────────────────┐
│                 SCOPE BOUNDARY RENDERING                       │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ 💡 HYPOTHETICAL: Suppose a $50/ton carbon tax...         │ │
│  │ ┌────────────────────────────────────────────────────┐   │ │
│  │ │                                                    │   │ │
│  │ │   [Arg 1]────────────>[Arg 2]                     │   │ │
│  │ │      │                   │                        │   │ │
│  │ │      └───────>[Arg 3]<───┘                        │   │ │
│  │ │                                                    │   │ │
│  │ └────────────────────────────────────────────────────┘   │ │
│  │                         [▼ Collapse] [👁 Toggle] [✏ Edit]│ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Features:                                                     │
│  • Colored border matching scopeType                           │
│  • Draggable header to reposition                             │
│  • Collapse/expand toggle                                      │
│  • Visibility toggle (dim when not focused)                   │
│  • Click header to enter "Hypothetical Mode"                  │
│  • Nodes can be dragged into/out of scopes                    │
│                                                                │
└───────────────────────────────────────────────────────────────┘
```

**Hypothetical Mode**:
- When activated, non-scope arguments are dimmed
- New arguments created in this mode auto-assign to the scope
- Composer shows scope context banner
- Visual focus on the hypothetical reasoning thread

---

#### 4.6.6 Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `ChainsTab` | `components/deepdive/v3/tabs/ChainsTab.tsx` | Main tab orchestration |
| `ChainListPanel` | `components/chains/ChainListPanel.tsx` | List view of all chains |
| `ArgumentChainCanvas` | `components/chains/ArgumentChainCanvas.tsx` | ReactFlow graph canvas |
| `ArgumentChainThread` | `components/chains/ArgumentChainThread.tsx` | Linear thread view |
| `ChainProseView` | `components/chains/ChainProseView.tsx` | Narrative export |
| `ChainEssayView` | `components/chains/ChainEssayView.tsx` | AI essay generation |
| `ChainArgumentNode` | `components/chains/ChainArgumentNode.tsx` | Custom ReactFlow node |
| `ChainArgumentComposer` | `components/chains/ChainArgumentComposer.tsx` | Argument creation dialog |
| `ScopeBoundary` | `components/chains/ScopeBoundary.tsx` | Visual scope container |
| `EpistemicStatusBadge` | `components/chains/EpistemicStatusBadge.tsx` | Status indicator |

---

#### 4.6.7 API Endpoints

```
/api/chains/
├── GET    /                          List all chains for deliberation
├── POST   /                          Create new chain
├── GET    /[chainId]                 Get chain with nodes and edges
├── PATCH  /[chainId]                 Update chain metadata
├── DELETE /[chainId]                 Delete chain
│
├── /[chainId]/nodes/
│   ├── POST   /                      Add node to chain
│   ├── PATCH  /[nodeId]              Update node (position, role, status)
│   ├── DELETE /[nodeId]              Remove node from chain
│   └── PATCH  /[nodeId]/scope        Assign node to scope
│
├── /[chainId]/edges/
│   ├── POST   /                      Create edge between nodes
│   ├── PATCH  /[edgeId]              Update edge type/strength
│   └── DELETE /[edgeId]              Remove edge
│
├── /[chainId]/scopes/
│   ├── GET    /                      List all scopes for chain
│   ├── POST   /                      Create new scope
│   ├── PATCH  /[scopeId]             Update scope
│   └── DELETE /[scopeId]             Delete scope
│
└── /[chainId]/export/
    ├── GET    /prose                 Export as prose text
    └── POST   /essay                 Generate AI essay
```

---

#### 4.6.8 User Flow: Creating a Chain with Scopes

**Step 1: Create a New Chain**
```
1. Navigate to Deliberation → Chains Tab
2. Click "New Chain" button
3. Enter:
   - Name: "Carbon Tax Policy Analysis"
   - Description: "Examining carbon pricing policy options"
   - Purpose: "To evaluate arguments for and against carbon taxation"
4. Click "Create"
```

**Step 2: Add Main Arguments (ASSERTED)**
```
1. Click "+" button or empty canvas area
2. Composer opens with default ASSERTED status
3. Enter argument:
   - Conclusion: "Climate change requires immediate policy action"
   - Add premises from existing claims or create new
   - Select argumentation scheme (e.g., Expert Opinion)
4. Click "Add to Chain"
5. Repeat for other main arguments
```

**Step 3: Create Hypothetical Scope**
```
1. Click "Add Scope" button in canvas toolbar
2. Configure scope:
   - Type: HYPOTHETICAL
   - Assumption: "Suppose a $50/ton carbon tax is enacted in 2025"
   - Color: Amber (#f59e0b)
3. Click "Create Scope"
4. A visual boundary appears on canvas
```

**Step 4: Add Arguments Within Scope**
```
Option A: Click inside scope boundary
- Composer auto-fills scope context
- Status defaults to HYPOTHETICAL

Option B: Use Hypothetical Mode
1. Click scope header to activate mode
2. Non-scope arguments dim
3. Create arguments normally
4. All new arguments auto-assign to active scope

Option C: Drag existing arguments into scope
- Drag node into scope boundary
- Confirmation dialog appears
- Node status updates to match scope type
```

**Step 5: Create Edges**
```
1. Hover over source node
2. Drag from connection handle to target node
3. Select edge type:
   - SUPPORTS (green)
   - REFUTES (red)
   - QUALIFIES (blue)
   - etc.
4. Optional: Set strength (0-100%)
```

**Step 6: Export**
```
Prose View:
- Click "Prose" tab
- Copy formatted text

Essay View:
- Click "Essay" tab
- Click "Generate Essay"
- AI produces structured academic essay
- Download as PDF or copy
```

---

#### 4.6.9 Seed Script Pattern

For testing or bulk data creation, use the seed script pattern:

**File**: `scripts/seed-test-chain-scopes.ts`

```typescript
/**
 * Seed Script Structure:
 * 1. Configuration - deliberationId, userId, chain metadata
 * 2. Scope definitions - hypothetical contexts
 * 3. Argument definitions - with epistemic status and scope refs
 * 4. Edge definitions - relationships between arguments
 * 5. Execution - create in proper order
 */

// Configuration
const CONFIG = {
  deliberationId: "your-deliberation-id",
  userId: "12",
  chainName: "Your Chain Name",
  chainDescription: "Description...",
  chainPurpose: "Purpose...",
};

// Define scopes
const SCOPES: ScopeData[] = [
  {
    id: "scope-hypothetical-1",
    scopeType: "HYPOTHETICAL",
    assumption: "Suppose X happens...",
    color: "#f59e0b",
  },
];

// Define arguments with epistemic status
const ARGUMENTS: ArgumentData[] = [
  {
    id: "arg-1",
    conclusionText: "Main thesis...",
    premises: [{ text: "Premise 1" }, { text: "Premise 2" }],
    schemeKey: "practical_reasoning",
    epistemicStatus: "ASSERTED",
    dialecticalRole: "THESIS",
  },
  {
    id: "arg-2",
    conclusionText: "Hypothetical consequence...",
    premises: [{ text: "Given X..." }],
    schemeKey: "causal",
    epistemicStatus: "HYPOTHETICAL",
    scopeRef: "scope-hypothetical-1",  // Links to scope
    dialecticalRole: "THESIS",
  },
];

// Define edges
const EDGES: EdgeData[] = [
  {
    sourceArgId: "arg-1",
    targetArgId: "arg-2",
    edgeType: "ENABLES",
    strength: 0.85,
    description: "Main thesis enables hypothetical exploration",
  },
];

// Execution order:
// 1. Create arguments (with claims)
// 2. Create chain
// 3. Create scopes
// 4. Create nodes (with scope connections)
// 5. Create edges
```

**Running the seed script**:
```bash
# Ensure schema is up to date
npx prisma db push
npx prisma generate

# Run seed script
npx ts-node -P tsconfig.scripts.json -r tsconfig-paths/register scripts/seed-test-chain-scopes.ts
```

---

#### 4.6.10 Key Files Reference

**Core Components**:
- `components/deepdive/v3/tabs/ChainsTab.tsx` - Tab orchestration
- `components/chains/ArgumentChainCanvas.tsx` - Main canvas (~900 lines)
- `components/chains/ChainArgumentComposer.tsx` - Argument creation dialog
- `components/chains/ChainArgumentNode.tsx` - Custom ReactFlow node
- `components/chains/ScopeBoundary.tsx` - Visual scope container
- `components/chains/EpistemicStatusBadge.tsx` - Status indicator

**API Routes**:
- `app/api/chains/route.ts` - Chain CRUD
- `app/api/chains/[chainId]/route.ts` - Single chain operations
- `app/api/chains/[chainId]/nodes/route.ts` - Node operations
- `app/api/chains/[chainId]/edges/route.ts` - Edge operations
- `app/api/chains/[chainId]/scopes/route.ts` - Scope operations

**Database Schema**:
- `lib/models/schema.prisma` - Prisma schema definitions
  - `ArgumentChain` model
  - `ArgumentChainNode` model
  - `ArgumentChainEdge` model
  - `ArgumentScope` model
  - `EpistemicStatus` enum
  - `ScopeType` enum
  - `DialecticalRole` enum

**Seed Scripts**:
- `scripts/seed-test-chain.ts` - Basic chain seeding
- `scripts/seed-test-chain-scopes.ts` - Chain with scopes (Phase 4)

### 4.7 ASPIC Subsystem

**Purpose**: Formal argumentation framework (ASPIC+)

```
┌───────────────────────────────────────────────────────────────┐
│                    ASPIC+ SUBSYSTEM                            │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  ASPIC+ Components:                                            │
│  • Strict Rules: ψ₁, ..., ψₙ → φ (cannot be attacked)         │
│  • Defeasible Rules: ψ₁, ..., ψₙ ⇒ φ (can be undercut)       │
│  • Contraries: ¬φ is contrary of φ                            │
│  • Preferences: Rule/premise ordering                         │
│                                                                │
│  Attack Types:                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ Rebutting: A attacks B on conclusion                    │   │
│  │ Undermining: A attacks B on ordinary premise           │   │
│  │ Undercutting: A attacks B on defeasible rule           │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                │
│  Extension Semantics:                                          │
│  • Grounded: Unique minimal skeptical extension               │
│  • Preferred: Maximal admissible sets                         │
│  • Complete: All admissible with defended attacks             │
│                                                                │
│  Key Components:                                               │
│  • AspicTheoryPanel - Theory visualization                    │
│  • ConflictResolutionPanel - Resolve conflicts                │
│  • GroundedExtensionPanel - Show grounded set                 │
│  • RationalityChecklist - Check argument quality              │
│                                                                │
└───────────────────────────────────────────────────────────────┘
```

**Key Files**:
- `components/aspic/AspicTheoryPanel.tsx`
- `components/aspic/ConflictResolutionPanel.tsx`
- `components/aspic/GroundedExtensionPanel.tsx`

---

## 5. Data Flow Diagrams

### 5.1 Dialogue Move Flow

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│    User      │    │ DeepDivePanel│    │   Backend    │
│  Interface   │    │    V2        │    │    API       │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │
       │ 1. Click Claim    │                   │
       │──────────────────>│                   │
       │                   │                   │
       │                   │ 2. Fetch Legal Moves
       │                   │──────────────────>│
       │                   │                   │
       │                   │ 3. Return Available
       │                   │<──────────────────│
       │                   │                   │
       │ 4. Show CommandCard                   │
       │<──────────────────│                   │
       │                   │                   │
       │ 5. Select Move    │                   │
       │──────────────────>│                   │
       │                   │                   │
       │                   │ 6. POST /dialogue/move
       │                   │──────────────────>│
       │                   │                   │
       │                   │ 7. Create DialogueMove
       │                   │   Update Commitments
       │                   │   Compute Ludics Acts
       │                   │<──────────────────│
       │                   │                   │
       │ 8. Refresh Views  │                   │
       │<──────────────────│                   │
       │                   │                   │
```

### 5.2 Argument Creation Flow

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Composer    │    │   Arguments  │    │   Database   │
│  Component   │    │     Tab      │    │   (Prisma)   │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │
       │ 1. User fills     │                   │
       │    scheme form    │                   │
       │──────────────────>│                   │
       │                   │                   │
       │                   │ 2. POST /arguments
       │                   │──────────────────>│
       │                   │                   │
       │                   │ 3. Create:        │
       │                   │   - Argument      │
       │                   │   - SchemeInstance│
       │                   │   - I-nodes (AIF) │
       │                   │   - RA-node       │
       │                   │   - Edges         │
       │                   │<──────────────────│
       │                   │                   │
       │                   │ 4. Link to Claim  │
       │                   │──────────────────>│
       │                   │                   │
       │ 5. Refresh List   │                   │
       │<──────────────────│                   │
       │                   │                   │
```

### 5.3 Commitment Tracking Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMMITMENT STORE FLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────┐  ASSERT(φ)   ┌─────────────────┐                   │
│  │ User A  │─────────────>│ Commitment Store │                   │
│  └─────────┘              │   A: {φ}         │                   │
│                           └─────────────────┘                   │
│                                    │                            │
│  ┌─────────┐  WHY(φ)?     ┌─────────────────┐                   │
│  │ User B  │─────────────>│ Challenge on φ   │                   │
│  └─────────┘              │ Status: PENDING  │                   │
│                           └─────────────────┘                   │
│                                    │                            │
│  ┌─────────┐  GROUNDS(ψ→φ)┌─────────────────┐                   │
│  │ User A  │─────────────>│ Commitment Store │                   │
│  └─────────┘              │   A: {φ, ψ→φ}   │                   │
│                           └─────────────────┘                   │
│                                    │                            │
│  ┌─────────┐  CONCEDE(φ)  ┌─────────────────┐                   │
│  │ User B  │─────────────>│ Commitment Store │                   │
│  └─────────┘              │   A: {φ, ψ→φ}   │                   │
│                           │   B: {φ}         │                   │
│                           └─────────────────┘                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Component Hierarchy

### 6.1 Full Component Tree

```
DeepDivePanelV2
├── ConfidenceProvider (Context)
│
├── StickyHeader
│   ├── StatusChip
│   ├── ChipBar (Rule, Confidence, DS Mode)
│   ├── Link to /admin/schemes
│   ├── Link to Dialogue Timeline
│   └── DiscusHelpPage
│
├── FloatingSheet [Left] - "Graph Explorer"
│   ├── Tab: Arguments
│   │   └── DialogueAwareGraphPanel
│   │       └── AifDiagramViewerDagre
│   ├── Tab: Claims
│   │   └── CegMiniMap
│   ├── Tab: Commitments
│   │   └── CommitmentStorePanel
│   └── Tab: Analytics
│       └── CommitmentAnalyticsDashboard
│
├── FloatingSheet [Right] - "Actions & Diagram"
│   ├── DialogueActionsButton
│   ├── CommandCard (legacy)
│   └── DiagramViewer
│
├── FloatingSheet [Terms] - "Dictionary"
│   └── DefinitionSheet
│
└── Tabs (Main Content)
    │
    ├── TabContent: "debate"
    │   └── DebateTab
    │       ├── NestedTabs
    │       │   ├── Discussion → ThreadedDiscussionTab
    │       │   ├── Propositions → PropositionComposerPro, PropositionsList
    │       │   ├── Claims → ClaimMiniMap, DialogueInspector
    │       │   └── Sheet View → DebateSheetReader
    │       └── DeliberationSettingsPanel
    │
    ├── TabContent: "arguments"
    │   └── ArgumentsTab
    │       ├── NestedTabs
    │       │   ├── All Arguments → AIFArgumentsListPro
    │       │   ├── Create → AIFArgumentWithSchemeComposer
    │       │   ├── Schemes → SchemesSection
    │       │   ├── Networks → NetworksSection
    │       │   ├── Nets → NetsTab
    │       │   └── ASPIC → AspicTheoryPanel, ConflictResolutionPanel
    │       ├── ArgumentNetAnalyzer (Dialog)
    │       └── AttackArgumentWizard (Dialog)
    │
    ├── TabContent: "chains"
    │   └── ChainsTab
    │       ├── ChainListPanel
    │       ├── ArgumentChainThread
    │       ├── ArgumentChainCanvas
    │       ├── ChainProseView
    │       └── ChainEssayView
    │
    ├── TabContent: "ludics"
    │   └── LudicsPanel
    │       ├── LociTreeWithControls
    │       ├── LudicsForest
    │       ├── TraceRibbon
    │       ├── JudgeConsole
    │       ├── CommitmentsPanel
    │       └── BehaviourInspectorCard
    │
    ├── TabContent: "admin"
    │   ├── DiscourseDashboard
    │   ├── IssuesList
    │   ├── IssueComposer
    │   ├── CQ Review Dashboard
    │   ├── CreateAssumptionForm
    │   └── ActiveAssumptionsPanel
    │
    ├── TabContent: "sources"
    │   └── EvidenceList
    │
    ├── TabContent: "thesis"
    │   ├── ThesisListView
    │   ├── ThesisComposer (Modal)
    │   └── ThesisRenderer (Modal)
    │
    └── TabContent: "analytics"
        └── AnalyticsTab
```

---

## 7. API Architecture

### 7.1 Core API Routes

```
/api/
├── dialogue/
│   ├── legal-moves/         GET  - Available dialogue moves
│   ├── move/                POST - Execute dialogue move
│   ├── move-aif/            POST - AIF-aware move execution
│   ├── commitments/         GET  - Commitment stores
│   ├── contradictions/      GET  - Detect contradictions
│   └── open-cqs/            GET  - Open critical questions
│
├── claims/
│   ├── [id]/
│   │   ├── route.ts         GET/PATCH/DELETE - Claim CRUD
│   │   ├── top-argument/    GET  - Best supporting argument
│   │   ├── edges/           GET  - Claim relationships
│   │   ├── label/           POST - Compute status label
│   │   ├── ca/              POST - Create CA (conflict)
│   │   └── cq/summary/      GET  - CQ status summary
│   ├── batch/               POST - Bulk operations
│   └── search/              GET  - Search claims
│
├── arguments/
│   ├── [id]/
│   │   ├── route.ts         GET/PATCH/DELETE - Argument CRUD
│   │   └── diagram/         GET  - AIF diagram data
│   ├── batch/               POST - Bulk create
│   └── search/              GET  - Search arguments
│
├── aif/
│   ├── schemes/             GET  - All schemes
│   ├── graph-with-dialogue/ GET  - Full AIF graph
│   ├── dialogue/[id]/
│   │   └── commitments/     GET  - Dialogue commitments
│   ├── validate/            POST - Validate AIF structure
│   ├── import/              POST - Import AIF
│   └── export/              GET  - Export AIF
│
├── deliberations/
│   ├── [id]/
│   │   ├── ludics/          GET/POST - Ludics designs
│   │   ├── viewpoints/      GET/POST - Viewpoint selection
│   │   └── chains/          GET  - Argument chains
│
└── ludics/
    ├── compile/             POST - Compile designs
    ├── interact/            POST - Step interaction
    └── trace/               GET  - Interaction trace
```

### 7.2 Key API Response Shapes

```typescript
// Legal Moves Response
interface LegalMovesResponse {
  moves: LegalMove[];
  targetId: string;
  targetType: 'claim' | 'argument' | 'proposition';
  locusPath: string;
}

interface LegalMove {
  kind: MoveKind;  // ASSERT, WHY, GROUNDS, RETRACT, CONCEDE, CLOSE
  force: MoveForce; // ATTACK, SURRENDER, NEUTRAL
  targetId: string;
  locusPath: string;
  cqId?: string;
  schemeKey?: string;
  label: string;
  description: string;
  enabled: boolean;
  disabledReason?: string;
}

// AIF Graph Response
interface AIFGraphResponse {
  nodes: AIFNode[];
  edges: AIFEdge[];
}

interface AIFNode {
  id: string;
  kind: 'I' | 'RA' | 'CA' | 'PA';
  label: string;
  schemeKey?: string;
  schemeName?: string;
  dialogueMoveId?: string;
  locutionType?: string;
}

interface AIFEdge {
  id: string;
  from: string;
  to: string;
  role: 'premise' | 'conclusion' | 'conflictingElement' | 'conflictedElement' | 'preferredElement';
}
```

---

## 8. Theoretical Foundations

### 8.1 Formal Argumentation Theory

The system implements several formal frameworks:

#### 8.1.1 Abstract Argumentation (Dung)
```
An Abstract Argumentation Framework (AF) is a pair ⟨A, R⟩ where:
- A is a set of arguments
- R ⊆ A × A is an attack relation

Semantics:
- Conflict-free: S ⊆ A is conflict-free iff ∄a,b ∈ S: (a,b) ∈ R
- Admissible: S is admissible iff S is conflict-free and defends itself
- Grounded: Unique minimal complete extension
```

#### 8.1.2 ASPIC+ Framework
```
ASPIC+ extends AF with:
- Strict rules: X₁, ..., Xₙ → Y (deductive)
- Defeasible rules: X₁, ..., Xₙ ⇒ Y (presumptive)
- Contrariness function: ¯ (maps formulas to contraries)
- Preference ordering: ≺ (over rules and/or premises)

Attack types:
- Rebutting: Argument for ¬φ attacks argument for φ
- Undermining: Argument for ¬ψ attacks premise ψ
- Undercutting: Argument attacks applicability of defeasible rule
```

#### 8.1.3 Argument Interchange Format (AIF)
```
AIF Ontology:
- I-nodes: Information nodes (claims, data)
- S-nodes: Scheme nodes
  - RA-nodes: Rule Application (inference)
  - CA-nodes: Conflict Application (attack)
  - PA-nodes: Preference Application (preference)
  - TA-nodes: Transition Application (dialogue)

Edge types:
- Scheme fulfillment edges (premise, conclusion)
- Support/attack relationships
- Preference relations
```

#### 8.1.4 Ludics (Girard)
```
Key concepts:
- Locus (α): Address in interaction space
- Designs: Sets of chronicles (interaction sequences)
- Polarity: Positive (asserts) / Negative (questions)
- Daimon (†): Termination marker (convergence)

Interaction:
- Two designs interact by matching positive/negative acts
- Convergent: Reaches daimon (agreement)
- Divergent: Blocked (disagreement)
```

### 8.2 PPD Protocol Rules

```
Move Kinds and Forces:
┌─────────────┬──────────────┬──────────────────────────────────┐
│ Move Kind   │ Force        │ Effect                           │
├─────────────┼──────────────┼──────────────────────────────────┤
│ ASSERT      │ NEUTRAL      │ Adds claim to commitment store   │
│ WHY         │ ATTACK       │ Challenges a commitment          │
│ GROUNDS     │ ATTACK       │ Provides justification           │
│ RETRACT     │ SURRENDER    │ Withdraws a commitment           │
│ CONCEDE     │ SURRENDER    │ Accepts opponent's claim         │
│ CLOSE       │ SURRENDER    │ Ends branch (daimon †)          │
│ THEREFORE   │ NEUTRAL      │ Derives conclusion               │
│ SUPPOSE     │ NEUTRAL      │ Hypothetical assertion           │
│ DISCHARGE   │ NEUTRAL      │ Exits supposition                │
└─────────────┴──────────────┴──────────────────────────────────┘

Key Invariants:
- R4: No duplicate reply to same target/locus/key
- R5: No attacks on surrendered/closed targets
- R7: Cannot concede directly if WHY was answered by GROUNDS
```

---

## 9. Whiteboard Diagrams

### 9.1 System Overview (Simple)

```
┌───────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│                          MESH DIGITAL AGORA                               │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                      DeepDivePanelV2                                 │  │
│  │  ┌─────────────┐  ┌─────────────────────────────┐  ┌─────────────┐  │  │
│  │  │   EXPLORE   │  │        MAIN TABS            │  │   ACTIONS   │  │  │
│  │  │  (Graph)    │  │ Debate | Args | Chains |... │  │  (Commands) │  │  │
│  │  └─────────────┘  └─────────────────────────────┘  └─────────────┘  │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                      │
│                                    ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                         API LAYER                                    │  │
│  │      /dialogue    /claims    /arguments    /aif    /ludics          │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                      │
│                                    ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                       DATABASE (Prisma)                              │  │
│  │   Deliberation | Claim | Argument | DialogueMove | LudicDesign      │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Dialogue Flow (Whiteboard)

```
                    ╔═══════════════════╗
                    ║   User Makes      ║
                    ║     Claim         ║
                    ╚═════════╤═════════╝
                              │
                              ▼
              ┌───────────────────────────────┐
              │     ASSERT("φ is true")        │
              │     → Add φ to commitments     │
              └───────────────┬───────────────┘
                              │
              ╔═══════════════╧═══════════════╗
              ║   Opponent Challenges          ║
              ╚═══════════════╤═══════════════╝
                              │
                              ▼
              ┌───────────────────────────────┐
              │     WHY("Why φ?")              │
              │     → Opens attack branch      │
              └───────────────┬───────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│    GROUNDS      │ │    RETRACT      │ │    CONCEDE      │
│ (Provide arg)   │ │ (Withdraw φ)    │ │ (Accept attack) │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                    │
         ▼                   ▼                    ▼
   Branch continues    Branch closes       Branch closes
   (more challenges)   (SURRENDER)         (SURRENDER)
```

### 9.3 AIF Node Structure (Whiteboard)

```
        I-NODE                    I-NODE                    I-NODE
     ┌─────────┐               ┌─────────┐               ┌─────────┐
     │ Premise │               │ Premise │               │ Premise │
     │   P1    │               │   P2    │               │   P3    │
     └────┬────┘               └────┬────┘               └────┬────┘
          │                        │                         │
          │    premise             │    premise              │    premise
          │                        │                         │
          └────────────────┬───────┴─────────────────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   RA-NODE    │
                    │ (Inference)  │
                    │ Scheme: X    │
                    └──────┬───────┘
                           │
                           │ conclusion
                           │
                           ▼
                    ┌──────────────┐
                    │   I-NODE     │
                    │ (Conclusion) │
                    │      C       │
                    └──────────────┘
                           ▲
                           │ conflictedElement
                           │
                    ┌──────────────┐
                    │   CA-NODE    │
                    │  (Attack)    │
                    └──────┬───────┘
                           │
                           │ conflictingElement
                           │
                    ┌──────────────┐
                    │   I-NODE     │
                    │ (Attacker)   │
                    │     ¬C       │
                    └──────────────┘
```

### 9.4 Tab Structure (Whiteboard Reference)

```
┌──────────────────────────────────────────────────────────────────────┐
│  DeepDivePanelV2 - TABS OVERVIEW                                     │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────┐ ┌──────────┐ ┌────────┐ ┌────────┐ ┌───────┐            │
│  │ DEBATE │ │ARGUMENTS │ │ CHAINS │ │ LUDICS │ │ ADMIN │ ...        │
│  └───┬────┘ └────┬─────┘ └───┬────┘ └───┬────┘ └───┬───┘            │
│      │           │           │          │          │                 │
│      ▼           │           │          │          │                 │
│  ┌────────┐      │           │          │          │                 │
│  │Discuss │      │           │          │          │                 │
│  │Propose │      │           │          │          │                 │
│  │Claims  │      │           │          │          │                 │
│  │Sheet   │      │           │          │          │                 │
│  └────────┘      │           │          │          │                 │
│                  ▼           │          │          │                 │
│              ┌────────┐      │          │          │                 │
│              │All Args│      │          │          │                 │
│              │Create  │      │          │          │                 │
│              │Schemes │      │          │          │                 │
│              │Networks│      │          │          │                 │
│              │ASPIC   │      │          │          │                 │
│              └────────┘      │          │          │                 │
│                              ▼          │          │                 │
│                          ┌────────┐     │          │                 │
│                          │List    │     │          │                 │
│                          │Thread  │     │          │                 │
│                          │Canvas  │     │          │                 │
│                          │Prose   │     │          │                 │
│                          └────────┘     │          │                 │
│                                         ▼          │                 │
│                                    ┌────────┐      │                 │
│                                    │LociTree│      │                 │
│                                    │Trace   │      │                 │
│                                    │Judge   │      │                 │
│                                    └────────┘      │                 │
│                                                    ▼                 │
│                                              ┌──────────┐            │
│                                              │Dashboard │            │
│                                              │Issues    │            │
│                                              │CQ Review │            │
│                                              └──────────┘            │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Appendix A: File Location Quick Reference

### Core Panel
- `components/deepdive/DeepDivePanelV2.tsx` - Main orchestration (~1861 lines)

### V3 Tab Components
- `components/deepdive/v3/tabs/DebateTab.tsx`
- `components/deepdive/v3/tabs/ArgumentsTab.tsx`
- `components/deepdive/v3/tabs/ChainsTab.tsx`
- `components/deepdive/v3/tabs/AnalyticsTab.tsx`

### V3 Hooks
- `components/deepdive/v3/hooks/useDeliberationState.ts`
- `components/deepdive/v3/hooks/useSheetPersistence.ts`

### Dialogue Components
- `components/dialogue/DialogueActionsButton.tsx`
- `components/dialogue/command-card/CommandCard.tsx`
- `components/dialogue/DialogueInspector.tsx`

### Argument Components
- `components/arguments/AIFArgumentsListPro.tsx`
- `components/arguments/AIFArgumentWithSchemeComposer.tsx`
- `components/arguments/SchemeBreakdown.tsx`

### Visualization
- `components/map/Aifdiagramviewerdagre.tsx`
- `components/claims/ClaimMiniMap.tsx`
- `components/deepdive/CegMiniMap.tsx`

### Ludics
- `components/deepdive/LudicsPanel.tsx`
- `packages/ludics-core/types.ts`
- `packages/ludics-react/LociTree.tsx`

### ASPIC
- `components/aspic/AspicTheoryPanel.tsx`
- `components/aspic/ConflictResolutionPanel.tsx`

### Libraries
- `lib/dialogue/types.ts`
- `lib/dialogue/legalMoves.ts`
- `lib/arguments/diagram.ts`

### Backend Services
- `app/server/services/ArgumentGenerationService.ts`
- `app/server/services/NetIdentificationService.ts`

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| **AIF** | Argument Interchange Format - standard ontology for argumentation |
| **ASPIC+** | Structured argumentation framework with strict/defeasible rules |
| **CA-node** | Conflict Application node (attack relationship) |
| **CQ** | Critical Question - challenges to argumentation schemes |
| **Daimon (†)** | Termination marker in Ludics indicating convergence |
| **Deliberation** | A structured discussion/debate instance |
| **Grounded Semantics** | Unique minimal skeptical extension of arguments |
| **I-node** | Information node (claims, propositions) |
| **Locus** | Address in Ludics interaction space (e.g., "0.1.2") |
| **PA-node** | Preference Application node |
| **Polarity** | P (positive/assertive) or O (negative/questioning) |
| **PPD** | Protocol for Persuasion Dialogues |
| **RA-node** | Rule Application node (inference relationship) |
| **Scheme** | Argumentation pattern (e.g., Argument from Expert) |

---

*Document generated: December 10, 2025*
*Version: 1.0 (Comprehensive Audit)*
