Theoretical Framework: Hypotheticals, Counterfactuals, Conditionals & Objections in Argument Chains
Let me think through this at a conceptual level before we get into implementation.

The Core Problem
The current ArgumentChain model assumes a positive, assertoric flow:
[Claim A] → SUPPORTS → [Claim B] → ENABLES → [Conclusion C]
But real deliberation involves much richer epistemic modalities:

Hypotheticals: "If we assume X, then Y follows"
Counterfactuals: "Had X been the case, Y would have resulted"
Conditionals: "Only if X, then Y"
Objections/Negations: "X is false" or "The inference from X to Y fails"
These don't fit cleanly into "Argument A supports Argument B."

Part 1: Modal & Epistemic Status of Nodes
Current Model (Implicit Assertion)
Every node in the chain implicitly asserts: "This claim is true."

Node: "Climate change is real"
Status: ASSERTED (implicit)

Proposed Enhancement: Explicit Epistemic Status
Each node should carry an epistemic modality:

Modality	Meaning	Example
ASSERTED	Speaker commits to truth	"Climate change is real"
HYPOTHETICAL	Assumed for sake of argument	"Suppose emissions continue at current rate..."
COUNTERFACTUAL	Contrary to known fact	"Had we acted in 2000, warming would be 0.5° less"
CONDITIONAL	Depends on antecedent	"If carbon tax passes, emissions will drop"
QUESTIONED	Under examination	"Is the 1.5° target achievable?"
DENIED	Speaker commits to falsity	"The 'pause' in warming is a myth"
SUSPENDED	Neither asserted nor denied	"Whether nuclear is viable is unclear"
Implications for Chain Structure
A hypothetical chain might look like:

The final node can be asserted because it's a meta-claim about the hypothetical reasoning itself.

Part 2: Objections & Negations - Three Distinct Concepts
2.1 Rebuttal (Attacks the Claim)
"Your conclusion is false."

This is a direct negation of the content:

[ASSERTED: "Carbon tax will reduce emissions"]
    ↑
    │ REBUTS
    │
[ASSERTED: "Carbon tax will NOT reduce emissions (see: Australia)"]

Key insight: A rebuttal is itself an assertion — it asserts the negation.

2.2 Undercut (Attacks the Inference)
"Even if your premises are true, your conclusion doesn't follow."

This doesn't deny the premises or conclusion directly — it denies the inferential link:

[A: "Experts say X"]  →  [B: "Therefore X is true"]
                  ↑
                  │ UNDERCUTS (the inference, not A or B)
                  │
[C: "Expert testimony is unreliable in this domain"]

The undercut targets the edge, not the nodes.

2.3 Undermining (Attacks a Premise)
"Your premise is false, so your argument fails."

[A: "97% of scientists agree"] → [B: "Consensus supports action"]
    ↑
    │ UNDERMINES
    │
[C: "The 97% figure is methodologically flawed"]

The undermining attacks node A, which propagates to weaken B.

Summary Table
Attack Type	Target	Effect	ASPIC+ Terminology
Rebuttal	Conclusion node	Direct contradiction	Rebuttal
Undercut	Edge (inference)	Breaks reasoning link	Undercut
Undermine	Premise node	Weakens downstream	Premise attack
Part 3: Hypotheticals & Counterfactuals - Scoped Reasoning
The "Scope" Concept
Hypothetical reasoning creates a modal scope — claims within the scope are evaluated relative to the hypothetical assumption, not the actual world.

┌─────────────────────────────────────────────────────┐
│ HYPOTHETICAL SCOPE: "Assume carbon tax passes"     │
│                                                     │
│   [H1: "Revenue = $50B/year"]                      │
│        ↓                                            │
│   [H2: "Investment in renewables increases"]       │
│        ↓                                            │
│   [H3: "Emissions drop 30%"]                       │
│                                                     │
└─────────────────────────────────────────────────────┘
         ↓ SCOPE_EXIT
[ASSERTED: "If carbon tax passes, emissions will drop 30%"]

The final assertion is outside the scope — it's a claim about what the hypothetical reasoning shows.

Counterfactuals: The "Contrary Scope"
Counterfactuals are hypotheticals about a world we know to be false:

┌─────────────────────────────────────────────────────┐
│ COUNTERFACTUAL SCOPE: "Had Kyoto been enforced"    │
│ (We know Kyoto was NOT enforced)                   │
│                                                     │
│   [C1: "Major emitters would have cut 5%/year"]   │
│        ↓                                            │
│   [C2: "Cumulative CO2 would be 20% lower"]       │
│        ↓                                            │
│   [C3: "Warming would be 0.3° less"]              │
│                                                     │
└─────────────────────────────────────────────────────┘
         ↓ COUNTERFACTUAL_CONCLUSION
[ASSERTED: "Kyoto enforcement would have meaningfully reduced warming"]

Key Insight: Scopes as First-Class Chain Structures
A scope could be modeled as:

A special kind of node that contains sub-chains
A subgraph with clear entry/exit points
A chain-within-a-chain (nested structure)
Part 4: Conditionals - Antecedent/Consequent Structure
Simple Conditional

"If A, then B"

This is NOT the same as:

"A is true" (no commitment to A)
"B is true" (no commitment to B)
"A causes B" (conditional isn't necessarily causal)
It's a claim about the material or logical relationship between A and B.

How Conditionals Fit in Chains
Option A: Conditional as a single node

[Node: "If carbon tax, then emissions drop"]
  ↓ SUPPORTS
[Node: "Carbon tax should be considered"]

The conditional is treated as an atomic claim.

Option B: Conditional as edge type

[Antecedent: "Carbon tax passes"]
  ↓ IF_THEN (conditional edge)
[Consequent: "Emissions drop 30%"]

The conditionality is in the relationship, not the nodes.

Option C: Conditional as scoped structure

┌─────────────────────────────────────────┐
│ CONDITIONAL: "If carbon tax passes"     │
│   [Body of reasoning about consequences]│
└─────────────────────────────────────────┘

Nested Conditionals
Real arguments often have nested conditionals:

"If A, then (if B, then C)"
"Even if A, still B"
"Unless A, B"

These require scope nesting or edge composition.

Part 5: How Objections Work in Chain Construction
Objection as Parallel Structure
An objection creates a parallel track that challenges the main line:

MAIN CHAIN:
[A] → [B] → [C] → [Conclusion]

OBJECTION CHAIN:
              ↑
         [Obj1] → [Obj2] → [Counter-Conclusion]
              REBUTS

Objection with Response (Dialectical Structure)

[Thesis]
    ↑
    │ REBUTS
[Antithesis]
    ↑
    │ REBUTS
[Synthesis / Response]


This creates a dialectical layer on top of the base chain.

The "Objection Scope" Pattern
When someone raises an objection, they often do so within a hypothetical:

"Suppose your argument is correct. Even then, X would follow, which contradicts Y."

This is a reductio ad absurdum — reasoning within the opponent's assumptions to derive a contradiction:

┌─────────────────────────────────────────────────────┐
│ OPPONENT'S SCOPE: "Assume carbon tax works"        │
│                                                     │
│   [O1: "Tax revenue increases"]                    │
│        ↓                                            │
│   [O2: "Government spending increases"]            │
│        ↓                                            │
│   [O3: "Deficit increases"]                        │
│        ↓                                            │
│   [O4: "Economic instability"]                     │
│        ↓                                            │
│   [CONTRADICTION: "This undermines the goal"]      │
│                                                     │
└─────────────────────────────────────────────────────┘
         ↓ REDUCTIO_CONCLUSION
[ASSERTED: "Therefore carbon tax has hidden costs"]

Part 6: Theoretical Framework Synthesis
Proposed Ontology
Node Properties:

content: The claim text
epistemicStatus: ASSERTED | HYPOTHETICAL | COUNTERFACTUAL | CONDITIONAL | QUESTIONED | DENIED | SUSPENDED
scopeId: Which hypothetical/counterfactual scope this belongs to (null = actual world)
dialecticalRole: THESIS | ANTITHESIS | SYNTHESIS | OBJECTION | RESPONSE
Edge Types (Extended):

Positive flow: SUPPORTS, ENABLES, PRESUPPOSES, EXEMPLIFIES
Attack relations: REBUTS (node), UNDERCUTS (edge), UNDERMINES (premise)
Modal relations: IF_THEN, WITHIN_SCOPE, SCOPE_EXIT
Dialectical: RESPONDS_TO, CONCEDES, QUALIFIES
Scope Structures:

Hypothetical scope (assumed true for argument)
Counterfactual scope (assumed contrary to fact)
Opponent's scope (reasoning from opponent's premises)
Conditional scope (antecedent-dependent reasoning)
Visual Metaphor
Think of the chain as a 3D structure:

Layer 0 (Actual World): Main assertoric chain
    │
    │ hypothetical branch
    ▼
Layer 1 (Hypothetical): "If X" reasoning
    │
    │ counterfactual branch
    ▼
Layer 2 (Counterfactual): "Had Y" reasoning

Layer -1 (Dialectical): Objections and responses

Each layer has its own internal chain structure, with cross-layer edges connecting them.

Part 7: Key Theoretical Questions
Q1: Are objections nodes or edges?
Answer: Both, depending on type:

Rebuttal: A node that asserts the negation, connected by REBUTS edge
Undercut: An edge modifier (or meta-edge) that targets inference
Undermining: A node that attacks a premise
Q2: How do hypotheticals propagate?
Answer: Claims derived within a hypothetical scope inherit the hypothetical status unless explicitly extracted via a conditional conclusion.

Q3: Can chains have multiple "worlds"?
Answer: Yes — a single chain might explore:

The actual world (what we assert)
Hypothetical world A (if policy X)
Hypothetical world B (if policy Y)
Counterfactual world (had we acted earlier)
These are parallel scopes with potential interactions.

Q4: How do negations compose?
Answer:

Negating an assertion → assertion of opposite
Negating a hypothetical → hypothetical of opposite
Negating a conditional → "Even if A, not B" (different from "If not A, then B")


Part 8: Implications for ArgumentChain Design
Current Data Model Gaps
No epistemic status on nodes
No scope/world tracking
Edge types don't distinguish attack subtypes
No support for nested/parallel chains
Minimal Extensions Needed


// Node extension
interface ArgumentChainNodeExtended {
  // ... existing fields ...
  epistemicStatus: EpistemicStatus;
  scopeId?: string; // null = main assertoric chain
  dialecticalRole?: DialecticalRole;
}

// Scope model
interface ArgumentScope {
  id: string;
  chainId: string;
  scopeType: "HYPOTHETICAL" | "COUNTERFACTUAL" | "CONDITIONAL" | "OPPONENT";
  assumption: string; // "If X", "Had Y", etc.
  parentScopeId?: string; // For nested scopes
}

// Edge extension
interface ArgumentChainEdgeExtended {
  // ... existing fields ...
  edgeType: ExtendedEdgeType; // Include attack subtypes
  targetType: "NODE" | "EDGE"; // Undercuts target edges
  targetEdgeId?: string; // If targeting an edge
}


Visualization Challenges
How to show hypothetical scopes visually?
How to distinguish edge attacks from node attacks?
How to render parallel "worlds"?
Summary: The Conceptual Model
Concept	Definition	Chain Representation
Hypothetical	Assumed for argument	Scoped subchain with HYPOTHETICAL status
Counterfactual	Contrary to fact assumption	Scoped subchain with COUNTERFACTUAL status
Conditional	If-then relationship	Edge type or scoped structure
Objection (Rebuttal)	Denies conclusion	Node with REBUTS edge to target
Objection (Undercut)	Denies inference	Edge/meta-edge targeting another edge
Objection (Undermine)	Denies premise	Node with UNDERMINES edge to premise
Negation	Asserts opposite	DENIED status or explicit negation node

---

# Implementation Roadmap

## Part 9: Embedding AIFArgumentWithSchemeComposer in Chain Builder

### 9.1 Current State & Motivation

**Current Flow (Friction):**
1. User is building a chain on the canvas
2. Realizes they need a new argument that doesn't exist yet
3. Must leave chain canvas → go to Arguments tab
4. Create argument with AIFArgumentWithSchemeComposer
5. Return to chain canvas → find the new argument → add it

**Proposed Flow (Seamless):**
1. User clicks "Create New Argument" button in chain builder
2. Modal opens with AIFArgumentWithSchemeComposer embedded
3. User creates argument with full scheme support
4. On save: argument auto-added to chain (optionally with pre-configured edge)

### 9.2 Design Confirmation: Any Argument Can Be a Chain Node

✅ **Verified**: The current API (`/api/argument-chains/[chainId]/nodes`) has NO authorship restriction.

Validation checks:
- User must be authenticated
- User must have edit permission (creator OR `chain.isEditable`)
- Argument must be from same deliberation
- Argument can only appear once per chain

**No check for**: `argument.authorId === currentUser`

This is **intentional and correct** — enables using others' objections, rebuttals, and supporting arguments as building blocks.

### 9.3 AIFArgumentWithSchemeComposer Interface

The component already exposes the callbacks we need:

```typescript
type Props = {
  deliberationId: string;
  authorId: string;
  conclusionClaim: { id?: string; text?: string } | null;
  defaultSchemeKey?: string | null;
  attackContext?: AttackContext;  // For REBUTS/UNDERCUTS/UNDERMINES
  onCreated?: (argumentId: string) => void;  // ← Key callback
  onCreatedDetail?: (arg: {
    id: string;
    conclusion: { id: string; text: string };
    premises: { id: string; text: string }[];
  }) => void;
  onChangeConclusion?: (c: { id?: string; text?: string } | null) => void;
};

type AttackContext =
  | { mode: "REBUTS"; targetClaimId: string; hint?: string }
  | { mode: "UNDERCUTS"; targetArgumentId: string; hint?: string }
  | { mode: "UNDERMINES"; targetPremiseId: string; hint?: string }
  | null;
```

### 9.4 Proposed Extension: Chain-Aware Context

New optional prop to pass chain context:

```typescript
type ChainComposerContext = {
  chainId: string;
  // Pre-select role based on user intent
  suggestedRole?: "PREMISE" | "EVIDENCE" | "CONCLUSION" | "OBJECTION" | "REBUTTAL" | "QUALIFIER";
  // Auto-create edge on save
  autoConnect?: {
    targetNodeId: string;
    edgeType: ArgumentChainEdgeType;
    strength?: number;
  };
  // For hypothetical/counterfactual arguments (future)
  epistemicContext?: {
    status: EpistemicStatus;
    scopeId?: string;
  };
};
```

### 9.5 Implementation Plan

#### Phase 1: Basic Integration (~3 hours)

**Task 1.1: Add "Create New Argument" button to AddNodeButton.tsx**

Location: `components/chains/AddNodeButton.tsx`

```tsx
// Add state for composer modal
const [showComposer, setShowComposer] = useState(false);

// In the modal content, add a button:
<div className="p-4 border-t bg-gray-50">
  <Button 
    variant="outline" 
    className="w-full"
    onClick={() => setShowComposer(true)}
  >
    <Plus className="w-4 h-4 mr-2" />
    Create New Argument
  </Button>
</div>

// Add composer dialog:
<Dialog open={showComposer} onOpenChange={setShowComposer}>
  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Create New Argument for Chain</DialogTitle>
    </DialogHeader>
    <AIFArgumentWithSchemeComposer
      deliberationId={deliberationId}
      authorId={userId}
      conclusionClaim={null}
      defaultSchemeKey={null}
      onCreated={async (argumentId) => {
        // Fetch the new argument details
        const response = await fetch(`/api/arguments/${argumentId}`);
        const data = await response.json();
        
        // Add to chain via existing flow
        await handleAddArgument({
          id: argumentId,
          text: data.text,
          title: data.conclusion?.text || data.text.substring(0, 50),
          createdAt: data.createdAt,
          creator: { id: data.authorId, name: data.author?.name || "You" },
        });
        
        setShowComposer(false);
        setIsOpen(false); // Close the add node modal too
      }}
    />
  </DialogContent>
</Dialog>
```

**Task 1.2: Pass userId to AddNodeButton**

Currently `AddNodeButton` doesn't receive `userId`. Update the component chain:

```tsx
// ArgumentChainCanvas.tsx
<AddNodeButton 
  deliberationId={deliberationId} 
  userId={currentUserId}  // Add this
/>

// AddNodeButton.tsx props
interface AddNodeButtonProps {
  deliberationId: string;
  userId: string;  // Add this
}
```

**Task 1.3: Add necessary imports**

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AIFArgumentWithSchemeComposer } from "@/components/arguments/AIFArgumentWithSchemeComposer";
```

#### Phase 2: Context-Aware Composition (~4 hours)

**Task 2.1: Create context-aware wrapper**

New file: `components/chains/ChainArgumentComposer.tsx`

```tsx
"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AIFArgumentWithSchemeComposer, AttackContext } from "@/components/arguments/AIFArgumentWithSchemeComposer";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ChainArgumentComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliberationId: string;
  userId: string;
  chainId: string;
  
  // Context for what kind of argument to create
  context?: {
    mode: "general" | "support" | "attack" | "hypothetical";
    targetNode?: {
      id: string;
      argumentId: string;
      conclusionText: string;
    };
    targetEdge?: {
      id: string;
      sourceText: string;
      targetText: string;
    };
  };
  
  onCreated: (argumentId: string, role: string) => Promise<void>;
}

const ROLE_OPTIONS = [
  { value: "PREMISE", label: "Premise", description: "Provides foundational claim" },
  { value: "EVIDENCE", label: "Evidence", description: "Supports with data/facts" },
  { value: "CONCLUSION", label: "Conclusion", description: "Final claim being argued for" },
  { value: "OBJECTION", label: "Objection", description: "Challenges another argument" },
  { value: "REBUTTAL", label: "Rebuttal", description: "Responds to objection" },
  { value: "QUALIFIER", label: "Qualifier", description: "Adds conditions/scope" },
];

export function ChainArgumentComposer({
  open,
  onOpenChange,
  deliberationId,
  userId,
  chainId,
  context,
  onCreated,
}: ChainArgumentComposerProps) {
  const [selectedRole, setSelectedRole] = useState<string>(
    context?.mode === "attack" ? "OBJECTION" : "PREMISE"
  );

  // Derive attack context from chain context
  const attackContext: AttackContext = context?.mode === "attack" && context.targetNode
    ? { mode: "REBUTS", targetClaimId: context.targetNode.argumentId, hint: context.targetNode.conclusionText }
    : null;

  // Derive default scheme based on context
  const defaultScheme = context?.mode === "attack" ? null : null; // Could suggest schemes

  const handleCreated = async (argumentId: string) => {
    await onCreated(argumentId, selectedRole);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {context?.mode === "attack" 
              ? "Create Objection" 
              : context?.mode === "support"
              ? "Create Supporting Argument"
              : "Create New Argument"}
          </DialogTitle>
          {context?.targetNode && (
            <DialogDescription>
              {context.mode === "attack" ? "Challenging: " : "Supporting: "}
              "{context.targetNode.conclusionText}"
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Role selector */}
        <div className="mb-4 p-3 bg-muted/50 rounded-lg">
          <Label className="text-sm font-medium">Role in Chain</Label>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((role) => (
                <SelectItem key={role.value} value={role.value}>
                  <div>
                    <span className="font-medium">{role.label}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {role.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <AIFArgumentWithSchemeComposer
          deliberationId={deliberationId}
          authorId={userId}
          conclusionClaim={null}
          defaultSchemeKey={defaultScheme}
          attackContext={attackContext}
          onCreated={handleCreated}
        />
      </DialogContent>
    </Dialog>
  );
}
```

**Task 2.2: Integrate with ArgumentChainNode right-click menu**

Add context menu options to nodes:
- "Create Supporting Argument" → Opens composer in support mode
- "Create Objection" → Opens composer in attack mode

**Task 2.3: Integrate with edge context menu**

Add option to edges:
- "Challenge This Inference (Undercut)" → Opens composer for undercut

#### Phase 3: Auto-Edge Creation (~2 hours)

**Task 3.1: Extend onCreated to auto-create edges**

When creating an argument in context of a target node:

```typescript
const handleCreated = async (argumentId: string) => {
  // 1. Add argument as node
  const nodeResponse = await fetch(`/api/argument-chains/${chainId}/nodes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      argumentId,
      role: selectedRole,
    }),
  });
  const { node } = await nodeResponse.json();
  
  // 2. If we have a target, create the edge
  if (context?.targetNode && context.mode !== "general") {
    const edgeType = context.mode === "attack" ? "REBUTS" : "SUPPORTS";
    
    await fetch(`/api/argument-chains/${chainId}/edges`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceNodeId: node.id,
        targetNodeId: context.targetNode.id,
        edgeType,
        strength: 0.8,
      }),
    });
  }
  
  await onCreated(argumentId, selectedRole);
};
```

#### Phase 4: Epistemic Status & Hypothetical Scopes Implementation

**Overview:** This phase adds support for epistemic statuses (hypothetical, counterfactual, conditional, questioned) and argument scopes, enabling users to reason within different "worlds" or assumptions.

---

##### 4.1 Schema Changes (Prisma)

**Task 4.1.1: Add EpistemicStatus enum and ArgumentScope model**

```prisma
// Add to lib/models/schema.prisma

enum EpistemicStatus {
  ASSERTED        // Normal assertoric claim (default)
  HYPOTHETICAL    // Assumed true for sake of argument
  COUNTERFACTUAL  // Assumed contrary to known facts
  CONDITIONAL     // Part of an if-then structure
  QUESTIONED      // Under examination, not committed
  DENIED          // Explicitly negated
  SUSPENDED       // Temporarily set aside
}

enum ScopeType {
  HYPOTHETICAL    // "Suppose X..."
  COUNTERFACTUAL  // "Had X been the case..."
  CONDITIONAL     // "If X, then..."
  OPPONENT        // Reasoning within opponent's assumptions (reductio)
  MODAL           // Possibility/necessity reasoning
}

// Scope model for grouping hypothetical arguments
model ArgumentScope {
  id             String     @id @default(cuid())
  chainId        String
  
  // Scope semantics
  scopeType      ScopeType  @default(HYPOTHETICAL)
  assumption     String     @db.Text       // "If carbon tax passes", "Had we invested earlier"
  description    String?    @db.Text
  
  // Nesting support
  parentScopeId  String?
  depth          Int        @default(0)    // 0 = top-level scope
  
  // Visual grouping
  color          String?    @db.VarChar(7) // Hex color for scope boundary
  collapsed      Boolean    @default(false)
  
  createdAt      DateTime   @default(now())
  createdBy      BigInt
  
  // Relations
  chain          ArgumentChain       @relation(fields: [chainId], references: [id], onDelete: Cascade)
  parentScope    ArgumentScope?      @relation("ScopeNesting", fields: [parentScopeId], references: [id], onDelete: SetNull)
  childScopes    ArgumentScope[]     @relation("ScopeNesting")
  nodes          ArgumentChainNode[] @relation("ScopeNodes")
  creator        User                @relation(fields: [createdBy], references: [id])
  
  @@index([chainId])
  @@index([parentScopeId])
}
```

**Task 4.1.2: Extend ArgumentChainNode with epistemic fields**

```prisma
model ArgumentChainNode {
  // ... existing fields ...
  
  // Epistemic status
  epistemicStatus  EpistemicStatus @default(ASSERTED)
  
  // Scope membership (null = actual/assertoric world)
  scopeId          String?
  scope            ArgumentScope?  @relation("ScopeNodes", fields: [scopeId], references: [id], onDelete: SetNull)
  
  // Dialectical role (for objection/response patterns)
  dialecticalRole  DialecticalRole?
  
  @@index([scopeId])
}

enum DialecticalRole {
  THESIS         // Main position being argued
  ANTITHESIS     // Opposing position
  SYNTHESIS      // Resolution/integration
  OBJECTION      // Challenge to thesis
  RESPONSE       // Reply to objection
  CONCESSION     // Acknowledged point from opponent
}
```

**Task 4.1.3: Extend ArgumentChain with scope relations**

```prisma
model ArgumentChain {
  // ... existing fields ...
  
  // Scope support
  scopes         ArgumentScope[]
}
```

---

##### 4.2 API Endpoints

**Task 4.2.1: Scope CRUD endpoints**

```typescript
// app/api/argument-chains/[chainId]/scopes/route.ts

// GET: List scopes for a chain
// POST: Create new scope
//   body: { scopeType, assumption, description?, parentScopeId?, color? }

// app/api/argument-chains/[chainId]/scopes/[scopeId]/route.ts

// GET: Get scope with its nodes
// PATCH: Update scope (assumption, color, collapsed)
// DELETE: Delete scope (moves nodes back to assertoric)
```

**Task 4.2.2: Update node creation to support epistemic status**

```typescript
// Extend POST /api/argument-chains/[chainId]/nodes
body: {
  argumentId: string;
  role?: ChainNodeRole;
  epistemicStatus?: EpistemicStatus;  // NEW
  scopeId?: string;                   // NEW
  dialecticalRole?: DialecticalRole;  // NEW
}
```

---

##### 4.3 UI Components

**Task 4.3.1: EpistemicStatusBadge component**

```tsx
// components/chains/EpistemicStatusBadge.tsx

interface EpistemicStatusBadgeProps {
  status: EpistemicStatus;
  size?: "sm" | "md";
}

const STATUS_CONFIG = {
  ASSERTED: { label: "Asserted", color: "bg-gray-100 text-gray-700", icon: Check },
  HYPOTHETICAL: { label: "Hypothetical", color: "bg-amber-100 text-amber-700", icon: Lightbulb },
  COUNTERFACTUAL: { label: "Counterfactual", color: "bg-purple-100 text-purple-700", icon: GitBranch },
  CONDITIONAL: { label: "Conditional", color: "bg-blue-100 text-blue-700", icon: ArrowRightLeft },
  QUESTIONED: { label: "Questioned", color: "bg-yellow-100 text-yellow-700", icon: HelpCircle },
  DENIED: { label: "Denied", color: "bg-red-100 text-red-700", icon: X },
  SUSPENDED: { label: "Suspended", color: "bg-slate-100 text-slate-500", icon: Pause },
};
```

**Task 4.3.2: ScopeContainer component (visual grouping)**

```tsx
// components/chains/ScopeContainer.tsx

interface ScopeContainerProps {
  scope: ArgumentScope;
  children: React.ReactNode;
  onCollapse: (collapsed: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}

// Renders a visual boundary around scoped nodes with:
// - Header showing assumption text ("If carbon tax passes...")
// - Collapse/expand toggle
// - Colored border based on scope type
// - Nested scope support
```

**Task 4.3.3: ScopeCreator modal**

```tsx
// components/chains/ScopeCreator.tsx

// Modal for creating a new hypothetical scope
// - Scope type selector (Hypothetical, Counterfactual, Conditional, Opponent)
// - Assumption text input ("Suppose...", "If...", "Had...")
// - Color picker for visual distinction
// - Optional parent scope selection (for nesting)
```

**Task 4.3.4: Update ArgumentChainNode to show epistemic status**

```tsx
// In ArgumentChainNode.tsx

// Add visual indicator for non-asserted nodes:
// - Amber glow/border for hypothetical
// - Purple dashed border for counterfactual
// - Small badge showing status
// - Different background tint per status
```

**Task 4.3.5: Update ChainArgumentComposer for epistemic modes**

```tsx
// Extend ChainArgumentComposer.tsx

interface ChainComposerContext {
  // ... existing fields ...
  
  // Epistemic context
  epistemicMode?: "hypothetical" | "counterfactual" | "conditional";
  scopeId?: string;           // Create node within this scope
  scopeAssumption?: string;   // For display context
}

// Add epistemic status selector when mode is hypothetical/counterfactual
// Auto-assign to scope when scopeId provided
```

---

##### 4.4 Canvas Integration

**Task 4.4.1: Scope rendering in ReactFlow**

```tsx
// Update ArgumentChainCanvas.tsx

// Option A: Use ReactFlow Groups
// - Scopes rendered as background containers
// - Nodes within scope appear inside the group

// Option B: Custom scope overlay
// - Render colored rectangles behind scoped nodes
// - Calculate bounding box from node positions

// Option C: Node styling only
// - No grouping, just color-code nodes by scope
// - Simpler but less visually clear
```

**Task 4.4.2: Scope panel in analysis sidebar**

```tsx
// Add to ChainAnalysisPanel or new ScopesPanel

// List all scopes in the chain
// - Show assumption text
// - Count of nodes in scope
// - Collapse/expand scope in canvas
// - Quick actions: Edit, Delete, Add Node
```

**Task 4.4.3: "Enter Hypothetical Mode" action**

```tsx
// Add button to canvas panel

// "Create Hypothetical Scope"
// 1. Opens ScopeCreator modal
// 2. User defines assumption
// 3. Scope created, user can now add nodes to it
// 4. Visual boundary appears on canvas
```

---

##### 4.5 Implementation Order & Time Estimates

| Sub-Phase | Tasks | Hours | Dependencies |
|-----------|-------|-------|--------------|
| **4.1** | Schema changes + migration | 1.5h | None |
| **4.2** | API endpoints (CRUD) | 2h | 4.1 |
| **4.3.1-4.3.2** | Badge + Container components | 2h | 4.1 |
| **4.3.3** | ScopeCreator modal | 1.5h | 4.2 |
| **4.3.4** | Node visual updates | 1h | 4.3.1 |
| **4.3.5** | Composer epistemic modes | 1.5h | 4.2, 4.3.1 |
| **4.4** | Canvas integration | 2.5h | All above |
| **Total** | | **12h** | |

---

##### 4.6 Incremental Rollout Strategy

**MVP (Phase 4A - ~4 hours):**
- Schema with `epistemicStatus` on nodes only (no scopes yet)
- Simple badge display on nodes
- Status selector in composer
- No visual grouping

**Full Implementation (Phase 4B - ~8 hours):**
- Full scope model and API
- Visual scope containers
- Scope creation/management UI
- Canvas grouping

---

##### 4.7 Visual Design Considerations

**Status Visual Language:**
| Status | Border | Background | Icon | Animation |
|--------|--------|------------|------|-----------|
| ASSERTED | Solid | White | ✓ | None |
| HYPOTHETICAL | Solid | Amber-50 | 💡 | None |
| COUNTERFACTUAL | Dashed | Purple-50 | ⑂ | None |
| CONDITIONAL | Dotted | Blue-50 | ↔ | None |
| QUESTIONED | Solid | Yellow-50 | ? | Subtle pulse |
| DENIED | Solid Red | Red-50 | ✗ | Strikethrough |
| SUSPENDED | Muted | Gray-50 | ⏸ | 50% opacity |

**Scope Container Design:**
```
┌─────────────────────────────────────────────────────────────┐
│ 💡 HYPOTHETICAL: "Suppose carbon tax passes"           [−] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│    ┌──────────┐      ┌──────────┐      ┌──────────┐       │
│    │  Node 1  │ ───▶ │  Node 2  │ ───▶ │  Node 3  │       │
│    └──────────┘      └──────────┘      └──────────┘       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
         │
         │ SCOPE_CONCLUSION
         ▼
    ┌──────────────────┐
    │ Assertoric Node  │  (Back in "actual world")
    └──────────────────┘
```

---

### 9.6 Summary: Implementation Timeline (Updated)

| Phase | Tasks | Hours | Dependencies | Status |
|-------|-------|-------|--------------|--------|
| **Phase 1** | Basic composer integration | 3h | None | ✅ Complete |
| **Phase 2** | Context-aware wrapper | 4h | Phase 1 | ✅ Complete |
| **Phase 3** | Auto-edge creation + edge types | 2h | Phase 2 | ✅ Complete |
| **Phase 4A** | Epistemic status (MVP) | 4h | Schema changes | 🔲 Planned |
| **Phase 4B** | Full scopes | 8h | Phase 4A | 🔲 Planned |
| **Total** | | **21h** | |

### 9.7 Files to Modify

| File | Changes |
|------|---------|
| `components/chains/AddNodeButton.tsx` | Add composer modal, "Create New" button |
| `components/chains/ArgumentChainCanvas.tsx` | Pass userId to AddNodeButton |
| `components/chains/ChainArgumentComposer.tsx` | **NEW** - Context-aware wrapper |
| `components/chains/ArgumentChainNode.tsx` | Add context menu for support/attack |
| `components/chains/ArgumentChainEdge.tsx` | Add context menu for undercut |

---

# Part 10: Open Theoretical Questions for Further Development

This section captures questions that need deeper exploration before implementation.

## 10.1 Scope Nesting & Visualization

**Question**: How should nested hypothetical scopes be visualized?

Consider:
```
HYPOTHETICAL A: "Assume policy X passes"
  └── HYPOTHETICAL B: "Further assume economy grows 3%"
        └── [Claim derived from both assumptions]
```

**Options**:
1. **Visual nesting**: Boxes within boxes (like code blocks)
2. **Color coding**: Different background colors per scope level
3. **Layers**: Literal z-axis separation in 3D view
4. **Tabs/Lanes**: Horizontal swim lanes for each scope

**Recommendation**: Start with color-coded borders + collapsible scope containers.

## 10.2 Cross-Scope References

**Question**: Can a claim in Scope A reference a claim in Scope B?

Example:
```
HYPOTHETICAL A: "If carbon tax..."
  └── [A1: "Revenue increases"]

HYPOTHETICAL B: "If cap-and-trade..."  
  └── [B1: "Revenue also increases"] 
  └── [B2: "But A1 shows carbon tax is simpler"]  ← Cross-reference!
```

**Options**:
1. **Forbidden**: Scopes are hermetically sealed
2. **Read-only reference**: Can cite but not depend on
3. **Full cross-reference**: Complex but powerful

**Recommendation**: Allow read-only references with visual indicators.

## 10.3 Scope Exit Semantics

**Question**: What exactly happens when reasoning "exits" a scope?

```
HYPOTHETICAL: "Assume X"
  └── [H1] → [H2] → [H3]
         ↓
    SCOPE_EXIT
         ↓
[ASSERTED: "If X, then H3"]
```

**Options**:
1. **Conditional conclusion**: "If [scope assumption], then [final claim]"
2. **Probability update**: "Given [scope], P([final claim]) = 0.8"
3. **Metalinguistic**: "The hypothetical reasoning shows [X]"

**Recommendation**: Default to conditional conclusion with option for metalinguistic.

## 10.4 Dialectical Role Inheritance

**Question**: If Node A has role THESIS, and Node B attacks it with REBUTS, does B automatically get role ANTITHESIS?

**Options**:
1. **Automatic**: System infers dialectical role from edge type
2. **Manual**: User must specify role
3. **Suggested**: System suggests, user confirms

**Recommendation**: Auto-suggest with ability to override.

## 10.5 Attack Propagation

**Question**: If Node C undermines Node A, and A supports B, how is B affected?

```
[A] ────SUPPORTS────→ [B]
 ↑
 │ UNDERMINES
 │
[C]
```

**Options**:
1. **No propagation**: B's status unchanged
2. **Strength reduction**: B's confidence decreases proportionally
3. **Conditional weakening**: "B holds only if A survives C's attack"

**Recommendation**: Strength reduction with visual indication of propagated weakness.

## 10.6 Negation of Complex Structures

**Question**: What does it mean to negate an entire hypothetical scope?

```
HYPOTHETICAL: "Assume carbon tax..."
  └── [Complex reasoning chain]
         ↓
    [Conclusion: "Emissions drop"]

NEGATION of entire scope: ???
```

**Options**:
1. **Deny assumption**: "Carbon tax won't pass" (attacks entry)
2. **Deny conclusion**: "Even if tax, emissions won't drop" (attacks exit)
3. **Deny reasoning**: "The reasoning within the scope is flawed" (attacks internals)
4. **All of the above**: Different attack types for different targets

**Recommendation**: Distinguish between attacking assumption vs. attacking derived conclusion.

---

# Next Steps

1. **Implement Phase 1** of Section 9 (Basic composer integration) — ~3 hours
2. **Continue theoretical discussion** on Parts 10.1-10.6 as needed
3. **Design schema extensions** for epistemic status and scopes
4. **Create UI mockups** for scope visualization before implementation

> **Note (Dec 9, 2025)**: The preliminary recommendations in Part 10 are approved for initial implementation. We can iterate on these decisions as we gain practical experience with the system. Proceeding now to expand the theoretical framework with thesis/antithesis/synthesis patterns and conditional semantics.

---

# Part 11: Dialectical Patterns — Thesis, Antithesis, Synthesis

## 11.1 The Hegelian Structure in Argumentation

The thesis-antithesis-synthesis pattern is one of the most fundamental structures in deliberative reasoning. It captures how positions evolve through confrontation.

### Basic Pattern

```
[THESIS: "Carbon tax is the best climate policy"]
         │
         │ OPPOSES
         ↓
[ANTITHESIS: "Carbon tax is regressive and hurts the poor"]
         │
         │ RESOLVES
         ↓
[SYNTHESIS: "Carbon tax with dividend returns addresses both goals"]
```

### Key Insight: Synthesis ≠ Compromise

A true synthesis doesn't just split the difference — it **transcends** the original opposition by:
1. Identifying the valid kernel in both positions
2. Resolving the apparent contradiction at a higher level
3. Producing a new claim that neither side initially held

### Dialectical Roles as First-Class Properties

```typescript
enum DialecticalRole {
  THESIS,       // Initial position
  ANTITHESIS,   // Opposing position
  SYNTHESIS,    // Resolution of opposition
  ELABORATION,  // Develops existing position without opposing
  QUALIFICATION,// Adds conditions/scope to existing position
  CONCESSION,   // Acknowledges partial validity of opposition
}
```

## 11.2 Multi-Round Dialectics

Real deliberation rarely stops at one thesis-antithesis-synthesis cycle:

```
Round 1:
[T1: "We should ban fossil fuels"]
    ↓ OPPOSES
[A1: "Immediate ban would crash the economy"]
    ↓ RESOLVES
[S1: "Phased transition with economic support"]

Round 2 (S1 becomes new thesis):
[T2/S1: "Phased transition with economic support"]
    ↓ OPPOSES
[A2: "Phased approach is too slow for climate timeline"]
    ↓ RESOLVES
[S2: "Accelerated transition with emergency measures for most polluting sectors"]

Round 3...
```

### Chain Representation

```
┌─────────────────────────────────────────────────────────┐
│ DIALECTICAL ROUND 1                                     │
│   [T1] ←─OPPOSES─ [A1]                                 │
│          └─────RESOLVES────→ [S1]                      │
└─────────────────────────────────────────────────────────┘
                    │
                    │ ELEVATES_TO_THESIS
                    ↓
┌─────────────────────────────────────────────────────────┐
│ DIALECTICAL ROUND 2                                     │
│   [S1=T2] ←─OPPOSES─ [A2]                              │
│              └─────RESOLVES────→ [S2]                  │
└─────────────────────────────────────────────────────────┘
```

## 11.3 Partial Patterns: When Synthesis Isn't Reached

Not every dialectical exchange produces synthesis:

### Pattern A: Unresolved Opposition
```
[THESIS] ←──OPPOSES──→ [ANTITHESIS]
         (no resolution)
         
Status: DIALECTICAL_IMPASSE
```

### Pattern B: Thesis Prevails
```
[THESIS] ←──OPPOSES── [ANTITHESIS]
    │
    └──DEFEATS──→ (antithesis withdrawn/refuted)
    
Status: THESIS_VINDICATED
```

### Pattern C: Antithesis Prevails
```
[THESIS] ──OPPOSES──→ [ANTITHESIS]
    │                      │
    └──DEFEATED_BY────────┘
    
Status: THESIS_REFUTED (antithesis becomes new thesis)
```

### Pattern D: Multiple Antitheses
```
[THESIS] ←──OPPOSES── [ANTITHESIS_1]
    ↑
    ├──OPPOSES── [ANTITHESIS_2]
    │
    └──OPPOSES── [ANTITHESIS_3]

Status: THESIS_UNDER_MULTIPLE_ATTACK
```

## 11.4 Edge Types for Dialectical Relations

```typescript
enum DialecticalEdgeType {
  // Opposition relations
  OPPOSES,              // Direct contradiction
  TENSIONS_WITH,        // Partial/indirect tension
  
  // Resolution relations
  RESOLVES,             // Synthesis that transcends both
  SUBSUMES,             // One position absorbs the other
  COMPROMISES_BETWEEN,  // Split-the-difference (weaker than synthesis)
  
  // Victory/defeat relations
  DEFEATS,              // Conclusive refutation
  WEAKENS,              // Partial undermining
  CONCEDES_TO,          // Acknowledges opponent's point
  
  // Development relations
  ELABORATES,           // Adds detail without opposition
  QUALIFIES,            // Adds conditions
  ELEVATES_TO_THESIS,   // Synthesis becomes new thesis for next round
}
```

## 11.5 Visualization Considerations

**Option A: Triangular Layout**
```
        [SYNTHESIS]
           /\
          /  \
         /    \
   [THESIS]──[ANTITHESIS]
```

**Option B: Timeline Flow**
```
[THESIS] ──→ [ANTITHESIS] ──→ [SYNTHESIS]
   t₀            t₁              t₂
```

**Option C: Layered Rounds**
```
Round 3: [S2] ──────────────────────────────────────
              ↑
Round 2: [T2] ←─ [A2] ─→ [S2] ─────────────────────
              ↑
Round 1: [T1] ←─ [A1] ─→ [S1] ─────────────────────
```

**Recommendation**: Use triangular layout within rounds, with vertical stacking for multi-round dialectics.

---

# Part 12: Conditional Semantics — "If", "Even If", "Unless", "Only If"

## 12.1 The Conditional Family

Natural language has many conditional constructions, each with distinct logical semantics:

| Construction | Form | Meaning |
|--------------|------|---------|
| **Simple conditional** | "If A, then B" | A is sufficient for B |
| **Only if** | "A only if B" | B is necessary for A |
| **Unless** | "A unless B" | ¬B → A (if not B, then A) |
| **Even if** | "A even if B" | A holds regardless of B |
| **Provided that** | "A provided that B" | B is a precondition for A |
| **In case** | "A in case B" | A as contingency for B |

## 12.2 Logical Analysis

### Simple Conditional: "If A, then B"
```
Logical form: A → B
Equivalences: ¬A ∨ B

Chain representation:
[A: Antecedent] ──IF_THEN──→ [B: Consequent]
```

**Key property**: Says nothing about what happens when A is false.

### Only If: "A only if B"
```
Logical form: A → B (same as simple conditional!)
But pragmatically: B is necessary for A

Chain representation:
[A] ──ONLY_IF──→ [B]

Interpretation: "You can't have A without B"
```

### Unless: "A unless B"
```
Logical form: ¬B → A
Equivalence: B ∨ A

Chain representation:
[A: Default] ←──UNLESS──┤
                        │
               [B: Exception]

Example: "The motion passes unless there's a veto"
= "If there's no veto, the motion passes"
= "Either there's a veto, or the motion passes"
```

### Even If: "A even if B"
```
Logical form: A ∧ (B → A) ∧ (¬B → A)
             = A regardless of B

Chain representation:
         ┌──[B]──┐
         │       │
[A] ◄────┴───────┘  (A holds in all cases)

This is NOT a conditional — it's asserting A while dismissing B's relevance.
```

**Key insight**: "Even if" is used to preempt objections. It says: "You might think B matters, but A holds anyway."

### Provided That: "A provided that B"
```
Logical form: B → A (with pragmatic emphasis on B as precondition)

Chain representation:
[B: Precondition] ──PROVIDES──→ [A: Outcome]

Example: "We'll reach the goal, provided that funding continues"
```

## 12.3 Negating Conditionals

This is where things get subtle:

### Negating "If A, then B"
```
¬(A → B) = A ∧ ¬B

"It's not the case that if it rains, the ground gets wet"
= "It can rain and the ground stays dry"

This is an EXISTENCE claim: there exists a case where A is true and B is false.
```

### Negating "A only if B"
```
¬(A → B) = A ∧ ¬B (same as above)

"It's not the case that you pass only if you study"
= "You can pass without studying"
```

### Negating "Even if"
```
¬(A even if B) is complex:

Option 1: ¬A (simply deny A)
Option 2: B → ¬A (B actually does prevent A)
Option 3: The "even if" is inappropriate (B is relevant after all)
```

## 12.4 Conditionals in Argument Chains

### Pattern 1: Conditional Supporting Conclusion
```
[Conditional: "If we invest in education, productivity rises"]
         │
         │ SUPPORTS (via hypothetical syllogism)
         ↓
[Claim: "Education investment is worthwhile"]
```

### Pattern 2: Detachment (Modus Ponens in Chain)
```
[Conditional: "If A, then B"]      [Assertion: "A is true"]
         │                                  │
         └──────────┬──────────────────────┘
                    │ MODUS_PONENS
                    ↓
          [Derived: "Therefore B"]
```

### Pattern 3: Contraposition
```
[Conditional: "If A, then B"]
         │
         │ CONTRAPOSITIVE
         ↓
[Derived: "If not B, then not A"]
```

### Pattern 4: "Even If" as Objection Preemption
```
[Thesis: "We should adopt the policy"]
         │
         │ PREEMPTS_OBJECTION
         ↓
[Even-If: "Even if costs are high, benefits outweigh them"]
         │
         │ (Blocks potential attack)
         X
[Potential Objection: "Costs are too high"] (preempted)
```

## 12.5 Edge Types for Conditional Relations

```typescript
enum ConditionalEdgeType {
  // Basic conditional
  IF_THEN,           // A → B
  ONLY_IF,           // A only if B (necessary condition)
  
  // Exception handling
  UNLESS,            // Default unless exception
  EXCEPT_WHEN,       // Variant of unless
  
  // Preemption
  EVEN_IF,           // Holds regardless of
  REGARDLESS_OF,     // Synonym for even_if
  
  // Preconditions
  PROVIDED_THAT,     // B is precondition for A
  GIVEN_THAT,        // Similar to provided_that
  ASSUMING,          // Weaker precondition
  
  // Inference patterns
  MODUS_PONENS,      // Detachment: A, A→B ⊢ B
  MODUS_TOLLENS,     // Contraposition: ¬B, A→B ⊢ ¬A
  HYPOTHETICAL_SYLLOGISM, // A→B, B→C ⊢ A→C
}
```

## 12.6 Complex Conditional Patterns

### Nested Conditionals
```
"If A, then (if B, then C)"

Chain representation:
[A] ──IF_THEN──→ [SCOPE: If B]
                      │
                      └──IF_THEN──→ [C]

This requires scope nesting (see Part 10.1)
```

### Conditional Chains
```
"If A, then B; and if B, then C"

[A] ──IF_THEN──→ [B] ──IF_THEN──→ [C]
         │
         └──HYPOTHETICAL_SYLLOGISM──→ [A→C] (derived)
```

### Biconditional
```
"A if and only if B" (A ↔ B)

[A] ←──IFF──→ [B]

Equivalent to: (A → B) ∧ (B → A)
```

## 12.7 Implementing Conditional Semantics

### Option A: Conditionals as Edge Properties
```typescript
interface ConditionalEdge {
  edgeType: "CONDITIONAL";
  conditionalType: "IF_THEN" | "ONLY_IF" | "UNLESS" | "EVEN_IF" | ...;
  antecedentNodeId: string;
  consequentNodeId: string;
}
```

### Option B: Conditionals as Compound Nodes
```typescript
interface ConditionalNode {
  nodeType: "CONDITIONAL";
  structure: {
    antecedent: string; // nodeId or inline text
    consequent: string; // nodeId or inline text
    conditionalType: ConditionalType;
  };
  // The whole conditional can then be connected to other nodes
}
```

### Option C: Conditionals as Scoped Structures
```typescript
interface ConditionalScope {
  scopeType: "CONDITIONAL";
  antecedent: string; // The "if" clause
  body: string[]; // NodeIds within the scope
  consequent: string; // What's derived (optional, may be implicit)
}
```

**Recommendation**: Use **Option A** (edge properties) for simple conditionals, **Option C** (scoped structures) for complex/nested conditionals.

---

# Part 13: "Even If" Deep Dive — Concessive Conditionals

## 13.1 The Special Status of "Even If"

"Even if" deserves special attention because it's one of the most powerful rhetorical moves in argumentation.

### What "Even If" Does

1. **Acknowledges** a potential objection or counterpoint
2. **Dismisses** its relevance to the main claim
3. **Strengthens** the main claim by showing robustness

### Example Analysis
```
Main claim: "We should invest in renewable energy"

Potential objection: "Renewables are currently more expensive"

"Even if" move: "Even if renewables are currently more expensive, 
                 we should invest because costs are falling rapidly 
                 and the climate benefits are urgent"
```

The "even if" move:
- Concedes: "Yes, renewables may be more expensive"
- Dismisses: "But that doesn't change my conclusion"
- Strengthens: "My argument is robust to this objection"

## 13.2 "Even If" vs. "If"

| Aspect | "If A, then B" | "B even if A" |
|--------|----------------|---------------|
| **Commitment to A** | None | Often concedes A might be true |
| **Commitment to B** | Only if A | Regardless of A |
| **Rhetorical function** | Hypothetical reasoning | Objection preemption |
| **Logical strength** | Weaker | Stronger (asserts B unconditionally) |

## 13.3 Chain Representation of "Even If"

### Structure 1: As Preemption Node
```
[Main Claim: B]
      │
      │──PREEMPTS──→ [Concession: "Even if A"]
      │                     │
      │                     └──DISMISSES──→ [Potential Attack: A undermines B]
```

### Structure 2: As Robustness Demonstration
```
[Claim: B]
    │
    ├── holds when [A is true]  ──→ [Reasoning why B despite A]
    │
    └── holds when [A is false] ──→ [Reasoning why B when ¬A]
    
    Therefore: B regardless of A
```

### Structure 3: As Dialectical Move
```
[THESIS: B]
    ↑
    │ (anticipated)
[POTENTIAL ANTITHESIS: A undermines B]
    ↑
    │ EVEN_IF_PREEMPTS
[CONCESSIVE RESPONSE: "Even if A, still B because..."]
```

## 13.4 Variations of Concessive Conditionals

| Form | Meaning | Example |
|------|---------|---------|
| "Even if A, B" | B regardless of A | "Even if it rains, the game continues" |
| "Even though A, B" | A is true, but B anyway | "Even though it's raining, the game continues" |
| "Although A, B" | Similar to even though | "Although costly, it's worthwhile" |
| "Despite A, B" | A is true, B anyway | "Despite the costs, we proceed" |
| "Notwithstanding A, B" | Formal version of despite | "Notwithstanding objections, approved" |
| "Granted A, B" | Concedes A, asserts B | "Granted it's risky, the potential is huge" |

### Semantic Distinctions

- **"Even if"**: A may or may not be true; doesn't matter
- **"Even though"**: A IS true; but B holds anyway
- **"Although"**: A IS true; B is somewhat surprising given A

## 13.5 Implementing Concessive Logic

```typescript
interface ConcessiveRelation {
  type: "EVEN_IF" | "EVEN_THOUGH" | "ALTHOUGH" | "DESPITE" | "GRANTED";
  
  // The claim being defended
  mainClaimNodeId: string;
  
  // The conceded/acknowledged point
  concessionNodeId: string;
  
  // Whether the concession is hypothetical or actual
  concessionStatus: "HYPOTHETICAL" | "ACTUAL";
  
  // The reasoning for why main claim holds despite concession
  robustnessReasoningNodeId?: string;
}
```

### Edge Type Addition
```typescript
enum ConcessiveEdgeType {
  EVEN_IF,           // Hypothetical concession, claim holds
  EVEN_THOUGH,       // Actual concession, claim holds
  DESPITE,           // Actual obstacle, claim holds
  GRANTED,           // Acknowledges point, proceeds anyway
  NOTWITHSTANDING,   // Formal acknowledgment, proceeds
}
```

---

# Part 14: Summary of Extended Edge Type Taxonomy

Consolidating all edge types from Parts 1-13:

## 14.1 Complete Edge Type Enumeration

```typescript
enum ArgumentChainEdgeType {
  // ═══════════════════════════════════════════════════════
  // SUPPORT RELATIONS (Positive flow)
  // ═══════════════════════════════════════════════════════
  SUPPORTS,           // General support
  ENABLES,            // Makes possible
  PRESUPPOSES,        // Required background
  EXEMPLIFIES,        // Provides example
  ELABORATES,         // Adds detail
  STRENGTHENS,        // Increases confidence
  
  // ═══════════════════════════════════════════════════════
  // ATTACK RELATIONS (Negative/challenging)
  // ═══════════════════════════════════════════════════════
  REBUTS,             // Attacks conclusion (node)
  UNDERCUTS,          // Attacks inference (edge)
  UNDERMINES,         // Attacks premise (node)
  DEFEATS,            // Conclusive refutation
  WEAKENS,            // Partial undermining
  
  // ═══════════════════════════════════════════════════════
  // DIALECTICAL RELATIONS
  // ═══════════════════════════════════════════════════════
  OPPOSES,            // Thesis-antithesis relation
  TENSIONS_WITH,      // Partial tension
  RESOLVES,           // Synthesis
  SUBSUMES,           // One absorbs other
  COMPROMISES_BETWEEN,// Split-the-difference
  CONCEDES_TO,        // Acknowledges opponent's point
  RESPONDS_TO,        // Response in dialogue
  ELEVATES_TO_THESIS, // Synthesis → new thesis
  
  // ═══════════════════════════════════════════════════════
  // CONDITIONAL RELATIONS
  // ═══════════════════════════════════════════════════════
  IF_THEN,            // Simple conditional
  ONLY_IF,            // Necessary condition
  UNLESS,             // Default with exception
  PROVIDED_THAT,      // Precondition
  GIVEN_THAT,         // Assumption
  ASSUMING,           // Weaker assumption
  
  // ═══════════════════════════════════════════════════════
  // CONCESSIVE RELATIONS
  // ═══════════════════════════════════════════════════════
  EVEN_IF,            // Robust to hypothetical
  EVEN_THOUGH,        // Robust to actual fact
  DESPITE,            // Proceeds despite obstacle
  GRANTED,            // Acknowledges, continues
  NOTWITHSTANDING,    // Formal acknowledgment
  
  // ═══════════════════════════════════════════════════════
  // MODAL/SCOPE RELATIONS
  // ═══════════════════════════════════════════════════════
  WITHIN_SCOPE,       // Node belongs to scope
  SCOPE_EXIT,         // Exits hypothetical scope
  SCOPE_ENTRY,        // Enters new scope
  CROSS_SCOPE_REF,    // References across scopes
  
  // ═══════════════════════════════════════════════════════
  // INFERENCE PATTERNS
  // ═══════════════════════════════════════════════════════
  MODUS_PONENS,       // A, A→B ⊢ B
  MODUS_TOLLENS,      // ¬B, A→B ⊢ ¬A
  HYPOTHETICAL_SYLLOGISM, // A→B, B→C ⊢ A→C
  DISJUNCTIVE_SYLLOGISM,  // A∨B, ¬A ⊢ B
  
  // ═══════════════════════════════════════════════════════
  // QUALIFICATION RELATIONS
  // ═══════════════════════════════════════════════════════
  QUALIFIES,          // Adds conditions
  RESTRICTS,          // Narrows scope
  GENERALIZES,        // Broadens scope
  SPECIFIES,          // Adds specificity
}
```

## 14.2 Edge Type Categories for UI

For the chain builder UI, group these into user-friendly categories:

```typescript
const EDGE_TYPE_CATEGORIES = {
  "Building Your Case": [
    "SUPPORTS", "ENABLES", "PRESUPPOSES", "EXEMPLIFIES", "ELABORATES"
  ],
  "Challenging Arguments": [
    "REBUTS", "UNDERCUTS", "UNDERMINES", "DEFEATS", "WEAKENS"
  ],
  "Dialectical Moves": [
    "OPPOSES", "RESOLVES", "CONCEDES_TO", "RESPONDS_TO"
  ],
  "Conditional Reasoning": [
    "IF_THEN", "ONLY_IF", "UNLESS", "PROVIDED_THAT"
  ],
  "Handling Objections": [
    "EVEN_IF", "EVEN_THOUGH", "DESPITE", "GRANTED"
  ],
  "Scope & Structure": [
    "WITHIN_SCOPE", "SCOPE_EXIT", "QUALIFIES", "GENERALIZES"
  ],
};
```

---

# Part 15: Analogical Reasoning in Argument Chains

## 15.1 The Structure of Analogy

Analogical reasoning is one of the most powerful and common forms of argumentation. It works by transferring conclusions from a **source domain** (the analogy) to a **target domain** (the current situation).

### Basic Structure

```
SOURCE DOMAIN (The Analogy):
[S1: "In situation A, property P held"]
[S2: "Situation A had features F1, F2, F3"]

MAPPING:
[M: "Current situation B shares features F1, F2, F3 with A"]

TARGET DOMAIN (The Conclusion):
[T: "Therefore, property P likely holds in situation B"]
```

### Example: Legal Precedent

```
SOURCE (Precedent Case):
[S1: "In Smith v. Jones (1985), the court ruled X was liable"]
[S2: "That case involved breach of fiduciary duty by a corporate officer"]

MAPPING:
[M: "Our case also involves breach of fiduciary duty by a corporate officer"]
[M2: "The circumstances are materially similar"]

TARGET:
[T: "Therefore, defendant X should be found liable here too"]
```

## 15.2 Components of Analogical Arguments

### 1. Source Case(s)
The known situation(s) being drawn upon:
```typescript
interface AnalogicalSource {
  caseDescription: string;
  relevantFeatures: string[];
  knownOutcome: string;
  confidence: number; // How well-established is this case?
}
```

### 2. Feature Mapping
The claimed similarities between source and target:
```typescript
interface FeatureMapping {
  sourceFeature: string;
  targetFeature: string;
  similarityStrength: number; // 0-1, how similar?
  mappingType: "IDENTICAL" | "ANALOGOUS" | "PARTIAL";
}
```

### 3. Disanalogies (Critical!)
The differences that might undermine the analogy:
```typescript
interface Disanalogy {
  feature: string;
  presentInSource: boolean;
  presentInTarget: boolean;
  relevanceToConclusion: "HIGH" | "MEDIUM" | "LOW";
  // High relevance = this difference matters a lot
}
```

### 4. Conclusion Transfer
The inference from source to target:
```typescript
interface AnalogicalConclusion {
  sourceConclusion: string;
  targetConclusion: string;
  transferStrength: number; // Weakened by disanalogies
}
```

## 15.3 Chain Representation of Analogies

### Option A: Linear Representation

```
[SOURCE_CASE: "Smith v. Jones established X"]
         │
         │ ANALOGOUS_TO
         ↓
[MAPPING: "Our situation shares key features"]
         │
         │ THEREFORE_ANALOGICALLY
         ↓
[CONCLUSION: "Same outcome should apply"]
```

### Option B: Parallel Structure with Bridge

```
┌─────────────────────────────────────────────────────────┐
│ SOURCE DOMAIN                                           │
│   [S1: Case facts] → [S2: Outcome]                     │
└─────────────────────────────────────────────────────────┘
              ↕ ANALOGY_BRIDGE (feature mapping)
┌─────────────────────────────────────────────────────────┐
│ TARGET DOMAIN                                           │
│   [T1: Our facts] → [T2: Predicted outcome]            │
└─────────────────────────────────────────────────────────┘
```

### Option C: Multi-Source Analogies

When multiple analogies converge:

```
[SOURCE_1: "Case A suggests X"]──┐
                                 │
[SOURCE_2: "Case B suggests X"]──┼──CONVERGING_ANALOGIES──→ [CONCLUSION: X]
                                 │
[SOURCE_3: "Case C suggests X"]──┘
```

## 15.4 Attacking Analogies

### Attack 1: Challenging the Mapping (Disanalogy)

```
[ANALOGY: "A is like B, therefore..."]
         ↑
         │ DISANALOGY_ATTACK
         │
[ATTACK: "A and B differ crucially in respect R"]
```

### Attack 2: Challenging the Source

```
[ANALOGY: "In case A, X happened..."]
         ↑
         │ SOURCE_CHALLENGE
         │
[ATTACK: "Case A was wrongly decided / is disputed"]
```

### Attack 3: Counter-Analogy

```
[ANALOGY_1: "Like case A, we should do X"]
         ↑
         │ COUNTER_ANALOGY
         │
[ANALOGY_2: "But like case B, we should do Y instead"]
         │
         │ BETTER_ANALOGY_BECAUSE
         ↓
[REASONING: "Case B is more similar because..."]
```

## 15.5 Edge Types for Analogical Reasoning

```typescript
enum AnalogicalEdgeType {
  // Constructing analogies
  ANALOGOUS_TO,           // Source is analogous to target
  MAPS_FEATURE,           // Specific feature correspondence
  TRANSFERS_CONCLUSION,   // Conclusion carries over
  
  // Multiple analogies
  CONVERGING_ANALOGIES,   // Multiple sources support same conclusion
  COMPETING_ANALOGIES,    // Different sources suggest different conclusions
  
  // Attacking analogies
  DISANALOGY,             // Points out relevant difference
  SOURCE_CHALLENGE,       // Disputes the source case
  COUNTER_ANALOGY,        // Offers better analogy
  BETTER_ANALOGY_THAN,    // Claims superiority over another analogy
  
  // Defending analogies
  REBUTS_DISANALOGY,      // Argues difference doesn't matter
  STRENGTHENS_ANALOGY,    // Adds more similar features
}
```

## 15.6 Analogical Reasoning Patterns

### Pattern 1: Simple Precedent
```
[Precedent] ──ANALOGOUS_TO──→ [Current Case] ──THEREFORE──→ [Same Outcome]
```

### Pattern 2: Distinguishing a Case
```
[Opponent's Analogy] ←──DISANALOGY── [Key Difference] ──THEREFORE──→ [Different Outcome]
```

### Pattern 3: Arguing from Multiple Precedents
```
[Precedent 1]──┐
[Precedent 2]──┼──PATTERN_OF_CASES──→ [General Principle] ──APPLIES_TO──→ [Current Case]
[Precedent 3]──┘
```

### Pattern 4: The "Slippery Slope" Analogy
```
[Current Proposal] ──IF_ALLOWED──→ [Hypothetical Case A] ──ANALOGOUSLY──→ [Hypothetical Case B] ──LEADS_TO──→ [Bad Outcome]
```

---

# Part 16: Reductio ad Absurdum — Proof by Contradiction

## 16.1 The Structure of Reductio

Reductio ad absurdum (RAA) is a powerful logical technique: assume the opposite of what you want to prove, derive a contradiction, conclude the original claim must be true.

### Logical Form

```
1. Assume ¬P (the negation of what we want to prove)
2. From ¬P, derive Q
3. From ¬P, also derive ¬Q (contradiction!)
4. Therefore, P must be true (¬¬P = P)
```

### Example

```
Claim to prove: "There is no largest prime number"

Reductio:
1. Assume there IS a largest prime (call it N)
2. Consider N! + 1 (factorial of N, plus 1)
3. N! + 1 is not divisible by any number ≤ N
4. Therefore N! + 1 is either prime or has a prime factor > N
5. Either way, there's a prime larger than N
6. Contradiction! Our assumption must be false.
7. Therefore, there is no largest prime. ∎
```

## 16.2 Chain Representation of Reductio

### Structure 1: Scope-Based Representation

```
┌─────────────────────────────────────────────────────────┐
│ REDUCTIO SCOPE: "Assume ¬P"                            │
│                                                         │
│   [Step 1: Derive Q from ¬P]                           │
│        ↓                                                │
│   [Step 2: Derive R from ¬P]                           │
│        ↓                                                │
│   [Step 3: Show Q and R contradict]                    │
│        ↓                                                │
│   [CONTRADICTION MARKER]                                │
│                                                         │
└─────────────────────────────────────────────────────────┘
         ↓ REDUCTIO_CONCLUSION
[PROVED: "Therefore P"]
```

### Structure 2: Explicit Contradiction Node

```
[ASSUMPTION: ¬P] ──DERIVES──→ [Q]
       │                        │
       │                        │ CONTRADICTS
       │                        ↓
       └──DERIVES──→ [¬Q] ←────┘
                        │
                        │ REDUCTIO_THEREFORE
                        ↓
                   [CONCLUSION: P]
```

## 16.3 Variations of Reductio

### Type 1: Classical Reductio (Derive Formal Contradiction)
```
Assume ¬P → Derive Q ∧ ¬Q → Therefore P
```

### Type 2: Reductio ad Absurdum (Derive Absurdity)
```
Assume ¬P → Derive something clearly false/absurd → Therefore P
```

The "absurdity" doesn't have to be a formal contradiction — it can be:
- A claim everyone agrees is false
- A claim that violates common sense
- A claim that contradicts accepted facts

### Type 3: Reductio ad Ridiculum (Derive Ridicule)
A rhetorical variant where the consequence is merely ridiculous:
```
"If your policy were correct, then [ridiculous consequence]"
```

Note: This is weaker than formal reductio — the "ridiculousness" is subjective.

## 16.4 Edge Types for Reductio

```typescript
enum ReductioEdgeType {
  // Setting up reductio
  ASSUME_FOR_REDUCTIO,    // Marking the reductio assumption
  DERIVES_UNDER_ASSUMPTION, // Derivation within reductio scope
  
  // The contradiction
  CONTRADICTS,            // Two claims contradict
  ABSURD_CONSEQUENCE,     // This is absurd/unacceptable
  
  // The conclusion
  REDUCTIO_THEREFORE,     // By reductio, conclude
  DISCHARGES_ASSUMPTION,  // The assumption is discharged (proven false)
  
  // Challenging reductio
  DENIES_CONTRADICTION,   // Claims the "contradiction" isn't one
  ACCEPTS_CONSEQUENCE,    // "Bites the bullet" — accepts the "absurd" consequence
  CHALLENGES_DERIVATION,  // Disputes a step in the reductio
}
```

## 16.5 Attacking a Reductio Argument

### Attack 1: "That's Not Really a Contradiction"
```
[REDUCTIO: "Your view leads to Q and ¬Q"]
         ↑
         │ DENIES_CONTRADICTION
         │
[ATTACK: "Q and ¬Q are not actually contradictory when properly understood"]
```

### Attack 2: "Biting the Bullet"
```
[REDUCTIO: "Your view leads to absurd consequence C"]
         ↑
         │ ACCEPTS_CONSEQUENCE
         │
[RESPONSE: "C is not actually absurd; I accept it"]
```

### Attack 3: Challenging the Derivation
```
[REDUCTIO: "Assuming ¬P, we derive Q"]
         ↑
         │ CHALLENGES_DERIVATION
         │
[ATTACK: "The derivation of Q from ¬P is invalid because..."]
```

## 16.6 Reductio in Deliberative Contexts

### Policy Reductio
```
[CLAIM: "We should have completely open borders"]
         │
         │ REDUCTIO_CHALLENGE
         ↓
┌─────────────────────────────────────────────────────────┐
│ OPPONENT'S REDUCTIO SCOPE                               │
│                                                         │
│ [Assume: Open borders implemented]                      │
│         ↓                                               │
│ [Derive: Massive sudden migration]                      │
│         ↓                                               │
│ [Derive: Infrastructure collapse]                       │
│         ↓                                               │
│ [Derive: Cannot maintain open borders]                  │
│         ↓                                               │
│ [CONTRADICTION: Policy is self-defeating]               │
└─────────────────────────────────────────────────────────┘
         ↓
[REDUCTIO CONCLUSION: "Therefore open borders policy is incoherent"]
```

### Response to Policy Reductio
```
[REDUCTIO_CONCLUSION: "Open borders is incoherent"]
         ↑
         │ CHALLENGES_DERIVATION
         │
[RESPONSE: "The derivation assumes no transition period; 
            phased implementation avoids the contradiction"]
```

---

# Part 17: Argument by Elimination (Disjunctive Syllogism)

## 17.1 The Structure of Elimination

Argument by elimination systematically rules out alternatives until only one option remains.

### Logical Form

```
1. Either A, B, C, or D (exhaustive disjunction)
2. Not A (ruled out)
3. Not B (ruled out)
4. Not C (ruled out)
5. Therefore, D
```

### Example: Diagnostic Reasoning

```
[DISJUNCTION: "The patient has either flu, COVID, cold, or allergies"]
         │
         ├──RULES_OUT──→ [¬Flu: "No fever, rules out flu"]
         │
         ├──RULES_OUT──→ [¬COVID: "Negative test, rules out COVID"]
         │
         ├──RULES_OUT──→ [¬Cold: "No congestion, rules out cold"]
         │
         └──REMAINING──→ [CONCLUSION: "Therefore, allergies"]
```

## 17.2 Chain Representation

### Option A: Linear Elimination

```
[DISJUNCTION: A ∨ B ∨ C ∨ D]
         │
         │──ELIMINATE──→ [¬A: "A ruled out because..."]
         │
         │──ELIMINATE──→ [¬B: "B ruled out because..."]
         │
         │──ELIMINATE──→ [¬C: "C ruled out because..."]
         │
         └──THEREFORE──→ [D: "Only D remains"]
```

### Option B: Branching Structure

```
        ┌── [A] ──X (ruled out)
        │
[A∨B∨C∨D]├── [B] ──X (ruled out)
        │
        ├── [C] ──X (ruled out)
        │
        └── [D] ──✓ (remaining)
```

### Option C: Elimination as Narrowing

```
[ALL OPTIONS: {A, B, C, D}]
         │
         │ ¬A
         ↓
[REMAINING: {B, C, D}]
         │
         │ ¬B
         ↓
[REMAINING: {C, D}]
         │
         │ ¬C
         ↓
[CONCLUSION: {D}]
```

## 17.3 Critical Requirements for Valid Elimination

### Requirement 1: Exhaustive Options
The disjunction must cover ALL possibilities:
```
VALID:   "The number is positive, negative, or zero" (exhaustive)
INVALID: "The suspect is Tom, Dick, or Harry" (what if it's someone else?)
```

### Requirement 2: Mutually Exclusive Options
If options can overlap, elimination becomes complex:
```
SIMPLE:  "It's A or B" (mutually exclusive)
COMPLEX: "It's partly A and partly B" (options overlap)
```

### Requirement 3: Valid Eliminations
Each ruled-out option must be properly refuted:
```
VALID:   "Not A because [strong evidence against A]"
WEAK:    "Probably not A" (doesn't fully eliminate)
```

## 17.4 Edge Types for Elimination Arguments

```typescript
enum EliminationEdgeType {
  // Setting up options
  EXHAUSTIVE_DISJUNCTION,  // These are all the options
  OPTION_IN_DISJUNCTION,   // This is one of the options
  
  // Eliminating options
  RULES_OUT,               // Eliminates this option
  WEAKLY_RULES_OUT,        // Partially eliminates (lower confidence)
  ELIMINATES_BECAUSE,      // With reason
  
  // Reaching conclusion
  REMAINING_OPTION,        // This option survives elimination
  ELIMINATION_CONCLUSION,  // Conclude by elimination
  
  // Challenging elimination
  OPTION_NOT_EXHAUSTIVE,   // There are other options
  ELIMINATION_INVALID,     // The ruling-out was flawed
  REVIVES_OPTION,          // Brings back a "ruled out" option
}
```

## 17.5 Attacking Elimination Arguments

### Attack 1: "You Missed an Option"
```
[ELIMINATION: "Only A, B, or C, and we ruled out A and B, so C"]
         ↑
         │ OPTION_NOT_EXHAUSTIVE
         │
[ATTACK: "You forgot option D, which is actually the answer"]
```

### Attack 2: "Your Elimination Was Invalid"
```
[ELIMINATION: "Not A because X"]
         ↑
         │ ELIMINATION_INVALID
         │
[ATTACK: "X doesn't actually rule out A because..."]
```

### Attack 3: Reviving an Option
```
[ELIMINATED: "Not A because X"]
         ↑
         │ REVIVES_OPTION
         │
[REVIVAL: "New evidence Y shows A is still possible"]
```

## 17.6 Partial Elimination (Probabilistic)

Real-world elimination is often probabilistic:

```
[OPTIONS: {A, B, C, D}]
         │
         │ Evidence E₁: P(A) drops to 5%
         ↓
[UPDATED: {A: 5%, B: 35%, C: 35%, D: 25%}]
         │
         │ Evidence E₂: P(C) drops to 10%
         ↓
[UPDATED: {A: 5%, B: 50%, C: 10%, D: 35%}]
         │
         │ PROBABILISTIC_CONCLUSION
         ↓
[CONCLUSION: "B is most likely (50%)"]
```

This is weaker than definitive elimination but more realistic.

---

# Part 18: Additional Reasoning Patterns

## 18.1 Argument from Sign (Abductive Reasoning)

### Structure
```
[OBSERVATION: "Smoke is rising from the building"]
         │
         │ SIGN_OF
         ↓
[INFERENCE: "There is probably fire in the building"]
```

### Chain Representation
```
[Observable Sign] ──INDICATES──→ [Inferred Cause/State]
         ↑
         │ (can be challenged)
[Alternative Explanation: "It could be steam, not smoke"]
```

### Edge Types
```typescript
enum SignReasoningEdgeType {
  INDICATES,              // Sign points to conclusion
  SYMPTOM_OF,             // Medical/diagnostic sign
  EVIDENCE_OF,            // Evidential sign
  ALTERNATIVE_EXPLANATION,// Different cause for same sign
  BETTER_EXPLANATION,     // Superior explanation
}
```

## 18.2 Argument from Consequence

### Structure
```
[ACTION: "Implement policy X"]
         │
         │ LEADS_TO
         ↓
[CONSEQUENCE: "Good outcome Y"]
         │
         │ THEREFORE
         ↓
[CONCLUSION: "We should implement policy X"]
```

### Negative Form (Warning)
```
[ACTION: "Implement policy X"]
         │
         │ LEADS_TO
         ↓
[CONSEQUENCE: "Bad outcome Z"]
         │
         │ THEREFORE
         ↓
[CONCLUSION: "We should NOT implement policy X"]
```

### Edge Types
```typescript
enum ConsequenceEdgeType {
  LEADS_TO,              // Action causes consequence
  GOOD_CONSEQUENCE,      // Desirable outcome
  BAD_CONSEQUENCE,       // Undesirable outcome
  INTENDED_CONSEQUENCE,  // Planned result
  UNINTENDED_CONSEQUENCE,// Side effect
  SECOND_ORDER_EFFECT,   // Consequence of consequence
}
```

## 18.3 Argument from Authority (Expert Opinion)

### Structure
```
[AUTHORITY: "Dr. Smith, leading expert in X"]
         │
         │ ASSERTS
         ↓
[CLAIM: "Y is the case"]
         │
         │ THEREFORE (with weight)
         ↓
[SUPPORTED CONCLUSION: "We should accept Y"]
```

### Critical Questions (Built-in Challenges)
```
CQ1: Is the authority actually an expert in this domain?
CQ2: Do other experts agree?
CQ3: Is the authority biased?
CQ4: Is this within the authority's area of expertise?
```

### Edge Types
```typescript
enum AuthorityEdgeType {
  EXPERT_ASSERTS,        // Expert makes claim
  AUTHORITY_SUPPORTS,    // Expert opinion supports
  EXPERT_CONSENSUS,      // Multiple experts agree
  EXPERT_DISAGREES,      // Expert challenges
  AUTHORITY_QUESTIONED,  // Challenge to expertise
  BIAS_ALLEGED,          // Claim of expert bias
}
```

## 18.4 Argument from Commitment (Ad Hominem Consistency)

### Structure
```
[OPPONENT'S PREVIOUS CLAIM: "X is important"]
         │
         │ COMMITTED_TO
         ↓
[OPPONENT: Person P]
         │
         │ THEREFORE_SHOULD_ACCEPT
         ↓
[CONCLUSION: "P should accept Y (which follows from X)"]
```

### Example
```
[COMMITMENT: "You said you value free speech"]
         │
         │ CONSISTENCY_REQUIRES
         ↓
[CONCLUSION: "Then you must allow this speaker"]
```

### Edge Types
```typescript
enum CommitmentEdgeType {
  COMMITTED_TO,           // Has stated commitment
  CONSISTENCY_REQUIRES,   // Commitment entails
  INCONSISTENT_WITH,      // Contradicts commitment
  WITHDRAWS_COMMITMENT,   // Takes back commitment
  REINTERPRETS_COMMITMENT,// Clarifies commitment differently
}
```

## 18.5 Slippery Slope Arguments

### Structure
```
[INITIAL ACTION: A]
         │
         │ LEADS_TO
         ↓
[INTERMEDIATE: B]
         │
         │ LEADS_TO
         ↓
[INTERMEDIATE: C]
         │
         │ LEADS_TO
         ↓
[BAD OUTCOME: D]
         │
         │ THEREFORE
         ↓
[CONCLUSION: "Don't do A"]
```

### Critical Points
1. Is each step (A→B, B→C, C→D) actually likely?
2. Can we stop at any intermediate point?
3. Is D actually bad?

### Edge Types
```typescript
enum SlipperyEdgeType {
  SLIPPERY_STEP,         // One step on the slope
  INEVITABLE_LEADS_TO,   // Can't stop the progression
  STOPPABLE_AT,          // Could stop here
  END_OF_SLOPE,          // Final bad outcome
  SLOPE_FALLACY,         // Challenge: slope isn't real
}
```

---

# Part 19: Extended Edge Type Taxonomy (Final)

Consolidating ALL edge types from Parts 1-18:

```typescript
enum ArgumentChainEdgeType {
  // ═══════════════════════════════════════════════════════
  // SUPPORT RELATIONS
  // ═══════════════════════════════════════════════════════
  SUPPORTS,
  ENABLES,
  PRESUPPOSES,
  EXEMPLIFIES,
  ELABORATES,
  STRENGTHENS,
  
  // ═══════════════════════════════════════════════════════
  // ATTACK RELATIONS
  // ═══════════════════════════════════════════════════════
  REBUTS,
  UNDERCUTS,
  UNDERMINES,
  DEFEATS,
  WEAKENS,
  
  // ═══════════════════════════════════════════════════════
  // DIALECTICAL RELATIONS
  // ═══════════════════════════════════════════════════════
  OPPOSES,
  TENSIONS_WITH,
  RESOLVES,
  SUBSUMES,
  COMPROMISES_BETWEEN,
  CONCEDES_TO,
  RESPONDS_TO,
  ELEVATES_TO_THESIS,
  
  // ═══════════════════════════════════════════════════════
  // CONDITIONAL RELATIONS
  // ═══════════════════════════════════════════════════════
  IF_THEN,
  ONLY_IF,
  UNLESS,
  PROVIDED_THAT,
  GIVEN_THAT,
  ASSUMING,
  
  // ═══════════════════════════════════════════════════════
  // CONCESSIVE RELATIONS
  // ═══════════════════════════════════════════════════════
  EVEN_IF,
  EVEN_THOUGH,
  DESPITE,
  GRANTED,
  NOTWITHSTANDING,
  
  // ═══════════════════════════════════════════════════════
  // MODAL/SCOPE RELATIONS
  // ═══════════════════════════════════════════════════════
  WITHIN_SCOPE,
  SCOPE_EXIT,
  SCOPE_ENTRY,
  CROSS_SCOPE_REF,
  
  // ═══════════════════════════════════════════════════════
  // INFERENCE PATTERNS
  // ═══════════════════════════════════════════════════════
  MODUS_PONENS,
  MODUS_TOLLENS,
  HYPOTHETICAL_SYLLOGISM,
  DISJUNCTIVE_SYLLOGISM,
  
  // ═══════════════════════════════════════════════════════
  // ANALOGICAL RELATIONS
  // ═══════════════════════════════════════════════════════
  ANALOGOUS_TO,
  MAPS_FEATURE,
  TRANSFERS_CONCLUSION,
  CONVERGING_ANALOGIES,
  COMPETING_ANALOGIES,
  DISANALOGY,
  SOURCE_CHALLENGE,
  COUNTER_ANALOGY,
  BETTER_ANALOGY_THAN,
  
  // ═══════════════════════════════════════════════════════
  // REDUCTIO RELATIONS
  // ═══════════════════════════════════════════════════════
  ASSUME_FOR_REDUCTIO,
  DERIVES_UNDER_ASSUMPTION,
  CONTRADICTS,
  ABSURD_CONSEQUENCE,
  REDUCTIO_THEREFORE,
  DISCHARGES_ASSUMPTION,
  DENIES_CONTRADICTION,
  ACCEPTS_CONSEQUENCE,
  CHALLENGES_DERIVATION,
  
  // ═══════════════════════════════════════════════════════
  // ELIMINATION RELATIONS
  // ═══════════════════════════════════════════════════════
  EXHAUSTIVE_DISJUNCTION,
  OPTION_IN_DISJUNCTION,
  RULES_OUT,
  WEAKLY_RULES_OUT,
  REMAINING_OPTION,
  ELIMINATION_CONCLUSION,
  OPTION_NOT_EXHAUSTIVE,
  REVIVES_OPTION,
  
  // ═══════════════════════════════════════════════════════
  // SIGN/ABDUCTIVE RELATIONS
  // ═══════════════════════════════════════════════════════
  INDICATES,
  SYMPTOM_OF,
  EVIDENCE_OF,
  ALTERNATIVE_EXPLANATION,
  BETTER_EXPLANATION,
  
  // ═══════════════════════════════════════════════════════
  // CONSEQUENCE RELATIONS
  // ═══════════════════════════════════════════════════════
  LEADS_TO,
  GOOD_CONSEQUENCE,
  BAD_CONSEQUENCE,
  UNINTENDED_CONSEQUENCE,
  SECOND_ORDER_EFFECT,
  
  // ═══════════════════════════════════════════════════════
  // AUTHORITY RELATIONS
  // ═══════════════════════════════════════════════════════
  EXPERT_ASSERTS,
  AUTHORITY_SUPPORTS,
  EXPERT_CONSENSUS,
  EXPERT_DISAGREES,
  AUTHORITY_QUESTIONED,
  BIAS_ALLEGED,
  
  // ═══════════════════════════════════════════════════════
  // COMMITMENT RELATIONS
  // ═══════════════════════════════════════════════════════
  COMMITTED_TO,
  CONSISTENCY_REQUIRES,
  INCONSISTENT_WITH,
  WITHDRAWS_COMMITMENT,
  
  // ═══════════════════════════════════════════════════════
  // SLIPPERY SLOPE RELATIONS
  // ═══════════════════════════════════════════════════════
  SLIPPERY_STEP,
  INEVITABLE_LEADS_TO,
  STOPPABLE_AT,
  END_OF_SLOPE,
  SLOPE_FALLACY,
  
  // ═══════════════════════════════════════════════════════
  // QUALIFICATION RELATIONS
  // ═══════════════════════════════════════════════════════
  QUALIFIES,
  RESTRICTS,
  GENERALIZES,
  SPECIFIES,
}
```

## 19.1 Recommended UI Categories (Updated)

```typescript
const EDGE_TYPE_CATEGORIES = {
  "Building Your Case": [
    "SUPPORTS", "ENABLES", "PRESUPPOSES", "EXEMPLIFIES", 
    "ELABORATES", "STRENGTHENS"
  ],
  "Challenging Arguments": [
    "REBUTS", "UNDERCUTS", "UNDERMINES", "DEFEATS", 
    "WEAKENS", "CONTRADICTS"
  ],
  "Dialectical Moves": [
    "OPPOSES", "RESOLVES", "CONCEDES_TO", "RESPONDS_TO",
    "ELEVATES_TO_THESIS", "TENSIONS_WITH"
  ],
  "Conditional Reasoning": [
    "IF_THEN", "ONLY_IF", "UNLESS", "PROVIDED_THAT",
    "MODUS_PONENS", "MODUS_TOLLENS"
  ],
  "Handling Objections": [
    "EVEN_IF", "EVEN_THOUGH", "DESPITE", "GRANTED",
    "DENIES_CONTRADICTION", "ACCEPTS_CONSEQUENCE"
  ],
  "Analogical Reasoning": [
    "ANALOGOUS_TO", "DISANALOGY", "COUNTER_ANALOGY",
    "MAPS_FEATURE", "BETTER_ANALOGY_THAN"
  ],
  "Proof by Contradiction": [
    "ASSUME_FOR_REDUCTIO", "CONTRADICTS", "ABSURD_CONSEQUENCE",
    "REDUCTIO_THEREFORE", "CHALLENGES_DERIVATION"
  ],
  "Elimination / Options": [
    "EXHAUSTIVE_DISJUNCTION", "RULES_OUT", "REMAINING_OPTION",
    "ELIMINATION_CONCLUSION", "REVIVES_OPTION"
  ],
  "Evidence & Authority": [
    "INDICATES", "EVIDENCE_OF", "EXPERT_ASSERTS",
    "AUTHORITY_SUPPORTS", "BIAS_ALLEGED"
  ],
  "Consequences & Slopes": [
    "LEADS_TO", "GOOD_CONSEQUENCE", "BAD_CONSEQUENCE",
    "SLIPPERY_STEP", "SLOPE_FALLACY"
  ],
  "Scope & Structure": [
    "WITHIN_SCOPE", "SCOPE_EXIT", "QUALIFIES", 
    "GENERALIZES", "SPECIFIES"
  ],
};
```

---

# Next Steps (Updated)

1. ✅ Preliminary recommendations approved for initial implementation
2. ✅ Expanded theoretical framework: Dialectical patterns (Part 11)
3. ✅ Expanded theoretical framework: Conditional semantics (Part 12)
4. ✅ Expanded theoretical framework: Concessive logic (Part 13)
5. ✅ Consolidated edge type taxonomy (Part 14)
6. ✅ Analogical reasoning patterns (Part 15)
7. ✅ Reductio ad absurdum (Part 16)
8. ✅ Argument by elimination (Part 17)
9. ✅ Additional reasoning patterns (Part 18)
10. ✅ Final extended edge type taxonomy (Part 19)

## Implementation Progress

### ✅ Phase 1: Basic Composer Integration (COMPLETE - Dec 9, 2025)

**Files Modified:**
- `components/chains/AddNodeButton.tsx` — Added "Create New Argument" button and `AIFArgumentWithSchemeComposer` dialog
- `components/chains/ArgumentChainCanvas.tsx` — Added `currentUserId` prop, passed to AddNodeButton
- `components/deepdive/v3/tabs/ChainsTab.tsx` — Passes `currentUserId` to ArgumentChainCanvas
- `components/deepdive/v3/sections/ChainsSection.tsx` — Passes `currentUserId` to ArgumentChainCanvas

**Features Implemented:**
- ✅ Users can now create new arguments directly from the chain canvas
- ✅ Full `AIFArgumentWithSchemeComposer` integration with scheme support
- ✅ Newly created arguments are automatically added to the chain
- ✅ Role selection (PREMISE, EVIDENCE, CONCLUSION, etc.) preserved

**To Test:**
1. Open a deliberation with an argument chain
2. Click "Canvas" view mode
3. Click "Add Argument" button
4. Scroll to bottom of argument list
5. Click "Create New Argument" button
6. Build argument with scheme in the composer dialog
7. On save, argument should auto-add to chain

**Upcoming Implementation:**
- [ ] Phase 2: Context-aware wrapper (support/attack modes)
- [ ] Phase 3: Auto-edge creation when creating in context
- [ ] Phase 4: Epistemic status integration
- [ ] Schema migration for extended edge types
- [ ] UI components for pattern-specific chain building
- [ ] Visualization strategies for complex patterns (scopes, analogies, elimination trees)