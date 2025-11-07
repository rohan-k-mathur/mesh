# ASPIC+ User Interaction Analysis: Holistic Systems Review

**Date**: December 2024  
**Status**: Comprehensive Architectural Analysis  
**Focus**: How users create axioms, rules, assumptions, contraries, attacks, and defeats that flow into ASPIC+ visualization

---

## Executive Summary

The ASPIC+ tab in DeepDivePanelV2 is a **read-only visualization layer** that computes formal argumentation semantics from database content. Users don't directly manipulate ASPIC+ theory—instead, they create **Arguments, Claims, Assumptions, and Conflicts** through other tabs (Debate, Arguments, Dialogue) which the ASPIC+ system then translates and evaluates.

### Current State Observations

From your sample data (deliberation with 25 formulas, 8 defeasible rules, 11 premises, 19 justified arguments):

**What's Working:**
- ✅ All Arguments correctly translated to ASPIC+ arguments
- ✅ All Claims correctly translated to language formulas
- ✅ All Argument inference relations translated to defeasible rules
- ✅ All premises recognized in knowledge base
- ✅ Grounded semantics computation showing 19 IN arguments

**What's Missing:**
- ❌ No axioms (all KB elements are premises)
- ❌ No strict rules (only defeasible rules from RA nodes)
- ❌ No assumptions (no AssumptionUse records)
- ❌ No contraries (no logical contradictions defined)
- ❌ No attacks/defeats (no ConflictApplications, all arguments justified)

### Key Insight

The ASPIC+ system is **working correctly** but your deliberation lacks certain types of content. This is an **interaction design gap** rather than a technical bug—the UI doesn't provide clear affordances for users to:
1. Designate premises as axioms vs assumptions
2. Create strict rules (as opposed to defeasible inference arguments)
3. Define contrary pairs (logical contradictions)
4. Create attacks between arguments through dialogue moves

---

## Question 1: How Are Axioms, Strict Rules, Assumptions, and Contraries Added?

### 1.1 Current Data Model (Prisma Schema)

#### Premises (Implemented ✅)
```typescript
// File: lib/models/schema.prisma (Line ~2100)
model Argument {
  id             String            @id @default(cuid())
  conclusion     Claim             @relation("ArgumentConclusion")
  premises       ArgumentPremise[] @relation("ArgumentPremises")
  schemeInstance ArgumentSchemeInstance?
  // ...
}

model ArgumentPremise {
  id         String   @id @default(cuid())
  argumentId String
  claimId    String
  claim      Claim    @relation("PremiseReferences")
  // Note: No field to distinguish axiom vs ordinary premise
}
```

**How Users Add Premises:**
1. **Debate Tab** → PropositionComposerPro → Create Claims
2. **Arguments Tab** → AIFArgumentWithSchemeComposer → Select premises + conclusion → Create Argument
3. System creates ArgumentPremise records linking Argument → Claim

**ASPIC+ Translation:**
- All ArgumentPremise records become `K_p` (ordinary premises) in ASPIC+ knowledge base
- No distinction between axioms (`K_a`) and premises (`K_p`)

#### Assumptions (Implemented ✅ - Phase 2.4)
```typescript
// File: lib/models/schema.prisma (Line ~5318)
model AssumptionUse {
  id             String @id @default(cuid())
  deliberationId String
  argumentId     String
  
  // Either tie to existing claim or use freeform text
  assumptionClaimId String? // FK to Claim.id
  assumptionText    String?
  
  role       String           @default("premise") // 'premise'|'warrant'|'value'
  status     AssumptionStatus @default(PROPOSED)
  weight     Float?
  confidence Float?
  
  statusChangedAt DateTime @default(now())
  statusChangedBy String?
  challengeReason String?
  
  @@index([argumentId])
  @@index([status])
}

enum AssumptionStatus {
  PROPOSED   // Initial state
  ACCEPTED   // Accepted as valid assumption
  RETRACTED  // Withdrawn
  CHALLENGED // Under dispute
}
```

**How Users Add Assumptions:**
- **Component Exists**: `components/assumptions/ActiveAssumptionsPanel.tsx`
- **API Endpoints**: 
  - `POST /api/deliberations/[id]/assumptions/create`
  - `GET /api/deliberations/[id]/assumptions/active`
- **UI Location**: Currently NOT integrated into DeepDivePanelV2 main tabs
- **Status**: Implemented but not exposed in primary UI

**ASPIC+ Translation (NOT YET IMPLEMENTED):**
```typescript
// File: lib/aif/translation/aifToAspic.ts (Line ~230)
// TODO: Fetch AssumptionUse records and add to K_n (assumptions)
// Currently: No assumptions are included in ASPIC+ theory
```

#### Strict Rules (NOT IMPLEMENTED ❌)
```typescript
// ASPIC+ requires: R_s (strict rules) separate from R_d (defeasible rules)
// Current state: All rules are defeasible (from RA inference nodes)
// No mechanism to create strict rules
```

**How Rules Are Currently Created:**
1. User creates Argument with premises + conclusion in Arguments tab
2. System creates RA (rule application) node in AIF graph
3. ASPIC+ translation converts RA → defeasible rule in `R_d`

**Missing Mechanism:**
- No UI to designate a rule as strict (must-follow) vs defeasible (can-be-defeated)
- No database field to store strict/defeasible distinction
- All Argument-based inferences become defeasible rules

**Potential Solutions:**
1. Add `ruleType: 'strict' | 'defeasible'` field to ArgumentSchemeInstance
2. Add checkbox in AIFArgumentWithSchemeComposer: "Mark as strict rule"
3. Update ASPIC+ translation to separate strict rules into `R_s`

#### Contraries (NOT IMPLEMENTED ❌)
```typescript
// ASPIC+ requires: ¬ (contraries function) mapping formulas to their negations
// Current state: No contraries defined
// No mechanism to declare logical contradictions
```

**ASPIC+ Contraries Function:**
```typescript
// Logical contradictions (contraries) define when two claims conflict
// Example:
contraries = new Map([
  ["claim_climate_change_real", "claim_climate_change_fake"],
  ["claim_vaccines_safe", "claim_vaccines_dangerous"],
]);
```

**Missing Mechanism:**
- No UI to declare two Claims as contradictory
- No database model for contrary pairs
- ASPIC+ translation returns empty contraries map

**Potential Solutions:**
1. Create `model ClaimContrary` with `claimId` and `contraryClaimId` fields
2. Add "Mark as Contrary" action in PropositionsList
3. Update ASPIC+ translation to include contraries from database

---

### 1.2 Implementation Roadmap for Missing Features

#### Phase A: Assumptions Integration (2-3 hours)

**Goal:** Expose existing AssumptionUse system in DeepDivePanelV2 and integrate with ASPIC+

**Step A1:** Add Assumptions Panel to DeepDivePanelV2
```tsx
// File: components/deepdive/DeepDivePanelV2.tsx (Line ~1700)
<TabsContent value="arguments">
  <SectionCard title="Argument Assumptions">
    <ActiveAssumptionsPanel deliberationId={deliberationId} />
    <CreateAssumptionForm 
      deliberationId={deliberationId}
      argumentId={selectedArgumentId}
      onCreated={refetchAspic}
    />
  </SectionCard>
</TabsContent>
```

**Step A2:** Update ASPIC+ Translation
```typescript
// File: lib/aif/translation/aifToAspic.ts (Line ~230)
async function fetchAssumptions(deliberationId: string) {
  const assumptions = await prisma.assumptionUse.findMany({
    where: { 
      deliberationId,
      status: 'ACCEPTED' // Only include accepted assumptions
    },
    include: { assumptionClaim: true }
  });
  
  return assumptions.map(a => ({
    id: a.assumptionClaimId || `assumption_${a.id}`,
    formula: a.assumptionClaim?.text || a.assumptionText,
    confidence: a.confidence || 0.5,
  }));
}

// Add to knowledgeBase.assumptions (K_n)
```

**Step A3:** Update API Endpoint
```typescript
// File: app/api/aspic/evaluate/route.ts (Line ~180)
const assumptions = await fetchAssumptions(deliberationId);
theory.knowledgeBase.assumptions = assumptions;
```

**Result:** Assumptions panel visible in UI, accepted assumptions appear in ASPIC+ Theory tab

#### Phase B: Axioms Designation (3-4 hours)

**Goal:** Allow users to designate premises as axioms (unquestionable) vs ordinary premises

**Step B1:** Add Database Field
```typescript
// File: lib/models/schema.prisma (add to ArgumentPremise)
model ArgumentPremise {
  id         String  @id @default(cuid())
  argumentId String
  claimId    String
  isAxiom    Boolean @default(false) // NEW: Designate as axiom
  // ...
}
```

**Step B2:** Add UI Control
```tsx
// File: components/arguments/AIFArgumentWithSchemeComposer.tsx (Line ~600)
<div className="flex items-center gap-2">
  <Checkbox
    id={`axiom-${premise.id}`}
    checked={premise.isAxiom}
    onCheckedChange={(checked) => 
      updatePremise(premise.id, { isAxiom: checked })
    }
  />
  <label htmlFor={`axiom-${premise.id}`}>
    Mark as Axiom (unquestionable)
  </label>
</div>
```

**Step B3:** Update ASPIC+ Translation
```typescript
// File: lib/aif/translation/aifToAspic.ts (Line ~250)
const axioms = premiseNodes.filter(p => p.isAxiom).map(p => ({
  id: p.claimId,
  formula: p.claimText,
}));

const premises = premiseNodes.filter(p => !p.isAxiom).map(p => ({
  id: p.claimId,
  formula: p.claimText,
}));

knowledgeBase.axioms = axioms; // K_a
knowledgeBase.premises = premises; // K_p
```

**Result:** Users can designate premises as axioms, ASPIC+ distinguishes K_a vs K_p

#### Phase C: Strict Rules (4-5 hours)

**Goal:** Allow users to create strict (non-defeasible) inference rules

**Step C1:** Add Database Field
```typescript
// File: lib/models/schema.prisma (add to ArgumentSchemeInstance or Argument)
model ArgumentSchemeInstance {
  id         String  @id @default(cuid())
  argumentId String
  schemeId   String
  ruleType   RuleType @default(DEFEASIBLE) // NEW
  // ...
}

enum RuleType {
  STRICT     // Must-follow rule (R_s)
  DEFEASIBLE // Can-be-defeated rule (R_d)
}
```

**Step C2:** Add UI Control
```tsx
// File: components/arguments/AIFArgumentWithSchemeComposer.tsx (Line ~400)
<RadioGroup
  value={ruleType}
  onValueChange={setRuleType}
>
  <div className="flex items-center gap-2">
    <RadioGroupItem value="DEFEASIBLE" id="rule-defeasible" />
    <label htmlFor="rule-defeasible">
      Defeasible Rule (can be challenged)
    </label>
  </div>
  <div className="flex items-center gap-2">
    <RadioGroupItem value="STRICT" id="rule-strict" />
    <label htmlFor="rule-strict">
      Strict Rule (must hold)
    </label>
  </div>
</RadioGroup>
```

**Step C3:** Update ASPIC+ Translation
```typescript
// File: lib/aif/translation/aifToAspic.ts (Line ~280)
const strictRules: InferenceRule[] = [];
const defeasibleRules: InferenceRule[] = [];

for (const raNode of raNodes) {
  const rule = {
    id: raNode.id,
    antecedents: raNode.premises.map(p => p.claimId),
    consequent: raNode.conclusionId,
  };
  
  if (raNode.ruleType === 'STRICT') {
    strictRules.push(rule);
  } else {
    defeasibleRules.push(rule);
  }
}

rules.strict = strictRules; // R_s
rules.defeasible = defeasibleRules; // R_d
```

**Result:** Users can create strict rules, ASPIC+ evaluates them as non-defeasible

#### Phase D: Contraries Definition (3-4 hours)

**Goal:** Allow users to define logical contradictions between claims

**Step D1:** Add Database Model
```typescript
// File: lib/models/schema.prisma (new model)
model ClaimContrary {
  id           String   @id @default(cuid())
  deliberationId String
  claimId      String   // First claim
  contraryId   String   // Contradictory claim
  createdById  String
  createdAt    DateTime @default(now())
  
  claim    Claim @relation("ClaimContraries", fields: [claimId], references: [id])
  contrary Claim @relation("ContraryOf", fields: [contraryId], references: [id])
  
  @@unique([claimId, contraryId])
  @@index([deliberationId])
}
```

**Step D2:** Add UI Action
```tsx
// File: components/propositions/PropositionsList.tsx (add action button)
<DropdownMenuItem 
  onClick={() => openContrarySelector(claim.id)}
>
  <Ban className="w-4 h-4 mr-2" />
  Mark as Contrary to...
</DropdownMenuItem>

// New component: ContrarySelector.tsx
<Dialog>
  <DialogContent>
    <DialogTitle>Select Contradictory Claim</DialogTitle>
    <ClaimPicker
      deliberationId={deliberationId}
      onSelect={(contraryId) => 
        createContrary(claimId, contraryId)
      }
    />
  </DialogContent>
</Dialog>
```

**Step D3:** Create API Endpoint
```typescript
// File: app/api/deliberations/[id]/contraries/route.ts
export async function POST(req: NextRequest, { params }: Context) {
  const { claimId, contraryId } = await req.json();
  
  await prisma.claimContrary.createMany({
    data: [
      { deliberationId: params.id, claimId, contraryId },
      { deliberationId: params.id, claimId: contraryId, contraryId: claimId },
    ],
    skipDuplicates: true,
  });
  
  return NextResponse.json({ success: true });
}
```

**Step D4:** Update ASPIC+ Translation
```typescript
// File: lib/aif/translation/aifToAspic.ts (Line ~320)
const contraries = await prisma.claimContrary.findMany({
  where: { deliberationId },
  include: { claim: true, contrary: true }
});

const contrariesMap = new Map<string, string[]>();
for (const c of contraries) {
  const existing = contrariesMap.get(c.claimId) || [];
  contrariesMap.set(c.claimId, [...existing, c.contraryId]);
}

theory.system.contraries = Object.fromEntries(contrariesMap);
```

**Result:** Users can define contraries, ASPIC+ detects contradictions

---

## Question 2: How Do Users Create Attacks/Defeats?

### 2.1 Current Attack Creation Mechanisms

#### Mechanism 1: Direct Attack Menu (Implemented ✅)

**Location:** Arguments Tab → ArgumentActionsSheet → Attack Panel  
**Component:** `components/arguments/AttackMenuProV2.tsx`  
**Trigger:** Click "Challenge Argument" button on any ArgumentCardV2

**User Flow:**
```
1. View ArgumentCardV2 in AIFArgumentsListPro
2. Click "⋮" menu → "Challenge Argument"
3. ArgumentActionsSheet opens with Attack Panel
4. Choose attack type:
   - Rebut: Contradict conclusion
   - Undercut: Challenge inference
   - Undermine: Contradict premise
5. AttackMenuProV2 opens with 3 options:
   a) Use Critical Question (CQ) from scheme
   b) Create supporting argument with scheme
   c) Direct challenge (ad-hoc claim)
6. User creates content (new claim or argument)
7. System creates ConflictApplication record
```

**Database Operations:**
```typescript
// File: app/api/ca/route.ts (Line ~1)
POST /api/ca
{
  deliberationId: string,
  conflictingClaimId?: string,    // New attacking claim
  conflictingArgumentId?: string, // New attacking argument
  conflictedArgumentId: string,   // Target argument being attacked
  legacyAttackType: 'REBUTS' | 'UNDERCUTS' | 'UNDERMINES',
  legacyTargetScope: 'conclusion' | 'inference' | 'premise',
  schemeKey?: string,
  metaJson?: { cqKey?, cqId?, cqContext? }
}

// Creates:
1. ConflictApplication record
2. DialogueMove (kind: 'ATTACK')
3. Optionally: DialogueMove (kind: 'WHY') for tracking
4. ASPIC+ metadata computed via computeAspicConflictMetadata()
```

**ASPIC+ Integration:**
```typescript
// File: lib/aspic/conflictHelpers.ts (Line ~38)
function computeAspicConflictMetadata(
  attackResult: { attack: Attack | null } | null,
  context: {
    attackType: 'REBUTS' | 'UNDERCUTS' | 'UNDERMINES',
    targetScope: 'conclusion' | 'inference' | 'premise',
    cqKey?: string,
    schemeKey?: string,
  }
): {
  aspicAttackType: 'rebutting' | 'undercutting' | 'undermining',
  aspicDefeatStatus: boolean,
  aspicMetadata: { ... }
}

// Stored in ConflictApplication:
{
  aspicAttackType: 'undermining',
  aspicDefeatStatus: true,
  aspicMetadata: {
    attackType: 'UNDERMINES',
    targetScope: 'premise',
    cqKey: 'cq1_expert_credentials',
    computationReason: '...',
    timestamp: '...'
  }
}
```

#### Mechanism 2: Critical Questions (Implemented ✅)

**Location:** Arguments Tab → ArgumentCardV2 → Critical Questions button  
**Component:** `components/arguments/CriticalQuestionsV3.tsx`  
**Trigger:** Click "❓ Critical Questions" on argument with scheme

**User Flow:**
```
1. View ArgumentCardV2 (argument using argumentation scheme)
2. Click "❓ Critical Questions" button
3. CriticalQuestionsV3 modal opens showing scheme-specific CQs
4. User sees questions like:
   - "How credible is the expert?"
   - "Is the expert's field relevant?"
5. User can take actions:
   a) Click "Ask WHY" → Challenge that CQ needs answering
   b) Click "Provide GROUNDS" → Answer CQ with evidence
```

**WHY Action (Creates Attack):**
```typescript
// User clicks "Ask WHY" on CQ
// File: app/api/cqs/dialogue-move/route.ts (Line ~368)
POST /api/cqs/dialogue-move
{
  deliberationId: string,
  targetType: 'argument',
  targetId: string,
  kind: 'WHY',
  cqKey: string,         // e.g., 'cq1_expert_credentials'
  schemeKey: string,     // e.g., 'argument_from_expert_opinion'
  expression: string,    // CQ text
  locusPath: string,
}

// Creates:
1. DialogueMove (kind: 'WHY', payload.cqKey)
2. LudicAct (polarity: 'opponent', metaJson.aspic)
3. CA-node in AIF (conflict application node)
4. ConflictApplication record:
   - conflictingClaimId: (WHY claim from dialogue)
   - conflictedArgumentId: target argument
   - aspicAttackType: 'undermining' (from CQ metadata)
   - aspicMetadata: { cqKey, schemeKey, targetScope: 'premise' }
```

**ASPIC+ Attack Computation:**
```typescript
// File: lib/aspic/dialogueAttacks.ts (Line ~50)
function computeAttackFromDialogueMove(
  dialogueMove: DialogueMove,
  cqMetadata: CQMetadata
): { attack: Attack | null; reason: string } {
  
  // Map CQ to ASPIC+ attack type
  const attackType = cqMetadata.aspicMapping?.attackType || 'undermining';
  
  // Create Attack object
  const attack: Attack = {
    type: attackType,              // 'undermining'
    attacker: { id: dialogueMove.id, conclusion: '...' },
    attacked: { id: targetArgumentId, conclusion: '...' },
    targetPremiseIndex: cqMetadata.aspicMapping?.premiseIndex,
  };
  
  return { attack, reason: `CQ ${cqKey} creates ${attackType} attack` };
}
```

**Data Flow:**
```
User Action: "Ask WHY" on CQ
  ↓
DialogueMove (WHY) created
  ↓
LudicAct created with ASPIC+ metadata
  ↓
CA-node added to AIF graph
  ↓
ConflictApplication record created
  ↓
ASPIC+ evaluates attack in semantics computation
  ↓
Grounded extension shows defeated arguments
```

#### Mechanism 3: Dialogue Provenance (Implemented ✅ - Phase 1)

**Location:** Dialogue Tab → DialogueInspector  
**Component:** `components/dialogue/DialogueInspector.tsx`  
**Purpose:** Track which DialogueMoves created Arguments and ConflictApplications

**Provenance Links:**
```typescript
// File: lib/models/schema.prisma (Line ~2490)
model ConflictApplication {
  id              String        @id @default(cuid())
  createdByMoveId String?       // Link to DialogueMove
  createdByMove   DialogueMove? @relation("ConflictCreatedByMove")
  // ...
}

model DialogueMove {
  id   String   @id @default(cuid())
  kind MoveKind // 'WHY' | 'ATTACK' | 'GROUNDS' | ...
  
  // Back-relations
  createdArguments  Argument[]             @relation("ArgumentCreatedByMove")
  createdConflicts  ConflictApplication[]  @relation("ConflictCreatedByMove")
}
```

**Bidirectional Sync:**
```
ConflictApplication.createdByMoveId → DialogueMove
DialogueMove.createdConflicts ← ConflictApplication[]
```

This enables:
- Viewing which dialogue move created each attack
- Jumping from ASPIC+ attack back to source dialogue move
- Understanding provenance of all conflicts

---

### 2.2 Why No Attacks Are Showing in Your Data

**Observation:** Your deliberation has 19 justified arguments, 0 defeated arguments, no attacks.

**Root Causes:**

#### Cause 1: No ConflictApplications Created
```sql
-- Check if any conflicts exist
SELECT COUNT(*) FROM "ConflictApplication" 
WHERE "deliberationId" = 'your-delib-id';
-- Likely result: 0
```

**Why:** Users haven't used attack mechanisms:
- Haven't clicked "Challenge Argument" button
- Haven't clicked "Ask WHY" on Critical Questions
- Haven't created dialogue moves that generate attacks

#### Cause 2: ASPIC+ Translation Missing ConflictApplications
```typescript
// File: app/api/aspic/evaluate/route.ts (Line ~238)
// TODO: Add CA-nodes when Prisma client includes ConflictApplication
// Currently: ConflictApplications are NOT fetched or translated
```

**Impact:** Even if ConflictApplications exist, they're not included in AIF graph sent to ASPIC+.

**Fix Required:**
```typescript
// File: app/api/aspic/evaluate/route.ts (add after fetching Arguments)
// Fetch ConflictApplications
const conflicts = await prisma.conflictApplication.findMany({
  where: { deliberationId },
});

// Add CA-nodes to AIF graph
for (const conflict of conflicts) {
  const caNode: CANode = {
    nodeID: `ca_${conflict.id}`,
    text: `Attack: ${conflict.aspicAttackType}`,
    type: "CA",
  };
  nodes.push(caNode);
  
  // Add edge: conflicting → CA-node → conflicted
  if (conflict.conflictingArgumentId) {
    edges.push({
      edgeID: `edge_${conflict.id}_source`,
      fromID: conflict.conflictingArgumentId,
      toID: caNode.nodeID,
      formEdgeID: null,
    });
  }
  edges.push({
    edgeID: `edge_${conflict.id}_target`,
    fromID: caNode.nodeID,
    toID: conflict.conflictedArgumentId || conflict.conflictedClaimId,
    formEdgeID: null,
  });
}
```

**After Fix:** Attacks will appear in ASPIC+ Theory → Attacks section and Extension → Defeated Arguments

---

### 2.3 Implementation Roadmap for Attack Visualization

#### Phase E: ConflictApplication Translation (2-3 hours)

**Goal:** Include ConflictApplications in ASPIC+ computation

**Step E1:** Fetch ConflictApplications in API
```typescript
// File: app/api/aspic/evaluate/route.ts (Line ~180)
const conflicts = await prisma.conflictApplication.findMany({
  where: { deliberationId },
  include: {
    scheme: true,
    createdByMove: true,
  }
});
```

**Step E2:** Add CA-Nodes to AIF Graph
```typescript
// File: app/api/aspic/evaluate/route.ts (Line ~220)
for (const conflict of conflicts) {
  const caNode: CANode = {
    nodeID: `ca_${conflict.id}`,
    text: `${conflict.aspicAttackType || conflict.legacyAttackType} attack`,
    type: "CA",
  };
  nodes.push(caNode);
  
  // Create attack edges
  if (conflict.conflictingArgumentId) {
    edges.push({
      edgeID: `edge_${conflict.id}_from`,
      fromID: conflict.conflictingArgumentId,
      toID: caNode.nodeID,
      formEdgeID: null,
    });
  }
  
  edges.push({
    edgeID: `edge_${conflict.id}_to`,
    fromID: caNode.nodeID,
    toID: conflict.conflictedArgumentId || conflict.conflictedClaimId,
    formEdgeID: null,
  });
}
```

**Step E3:** Update ASPIC+ Translation
```typescript
// File: lib/aif/translation/aifToAspic.ts (Line ~400)
// CA-nodes now properly translated to ASPIC+ attacks
function translateCANodes(caNodes: CANode[], edges: Edge[]): Attack[] {
  return caNodes.map(ca => {
    const incomingEdge = edges.find(e => e.toID === ca.nodeID);
    const outgoingEdge = edges.find(e => e.fromID === ca.nodeID);
    
    return {
      type: ca.text.includes('undermine') ? 'undermining' 
          : ca.text.includes('undercut') ? 'undercutting' 
          : 'rebutting',
      attacker: { id: incomingEdge.fromID, conclusion: '...' },
      attacked: { id: outgoingEdge.toID, conclusion: '...' },
    };
  });
}
```

**Result:** Existing attacks now visible in ASPIC+ tab

#### Phase F: Attack Creation UI Enhancement (3-4 hours)

**Goal:** Make attack creation more discoverable and intuitive

**Step F1:** Add Inline Attack Button to ArgumentStatusCard
```tsx
// File: components/aspic/ArgumentStatusCard.tsx (Line ~190)
<div className="flex gap-2 mt-3">
  <Button
    size="sm"
    variant="outline"
    onClick={() => openAttackDialog(argument.id)}
  >
    <Swords className="w-3 h-3 mr-1" />
    Attack This Argument
  </Button>
</div>
```

**Step F2:** Create Attack from ASPIC Tab
```tsx
// New component: components/aspic/AspicAttackDialog.tsx
<Dialog>
  <DialogTitle>Create Attack on Argument {argumentId}</DialogTitle>
  <DialogContent>
    <RadioGroup value={attackType} onValueChange={setAttackType}>
      <RadioGroupItem value="undermining">
        Undermine Premise
      </RadioGroupItem>
      <RadioGroupItem value="undercutting">
        Undercut Inference
      </RadioGroupItem>
      <RadioGroupItem value="rebutting">
        Rebut Conclusion
      </RadioGroupItem>
    </RadioGroup>
    
    <Textarea
      placeholder="Describe your challenge..."
      value={challengeText}
      onChange={(e) => setChallengeText(e.target.value)}
    />
    
    <Button onClick={createAttack}>
      Create Attack
    </Button>
  </DialogContent>
</Dialog>
```

**Step F3:** Bidirectional Navigation
```tsx
// Jump from ASPIC argument to source Argument in Arguments tab
<Button
  variant="ghost"
  onClick={() => {
    setActiveTab('arguments'); // Switch to Arguments tab
    scrollToArgument(argument.id); // Highlight source argument
  }}
>
  <ExternalLink className="w-3 h-3 mr-1" />
  View Source Argument
</Button>
```

**Result:** Users can create attacks directly from ASPIC tab, with bidirectional navigation

---

## Question 3: Holistic Systems Integration Analysis

### 3.1 Complete Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     USER INTERACTION LAYER                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  DEBATE TAB  │  │ ARGUMENTS TAB│  │ DIALOGUE TAB │             │
│  │              │  │              │  │              │             │
│  │ Proposition  │  │ AIF Argument │  │  Dialogue    │             │
│  │ ComposerPro  │  │ WithScheme   │  │  Inspector   │             │
│  │              │  │ Composer     │  │              │             │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘             │
│         │                 │                  │                     │
│         │ Create Claims   │ Create Arguments │ Create Moves        │
│         ▼                 ▼                  ▼                     │
└─────────────────────────────────────────────────────────────────────┘
          │                 │                  │
          ▼                 ▼                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        DATABASE LAYER                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐     ┌──────────┐     ┌──────────────┐               │
│  │  Claim   │────▶│ Argument │────▶│ Conflict     │               │
│  │          │     │          │     │ Application  │               │
│  │ id       │     │ premises │     │              │               │
│  │ text     │     │ conclusion│     │ aspicAttack  │               │
│  └──────────┘     └──────────┘     │ Type         │               │
│                                     │ aspicDefeat  │               │
│  ┌──────────┐     ┌──────────┐     │ Status       │               │
│  │Assumption│     │ Dialogue │────▶│ aspicMetadata│               │
│  │Use       │     │ Move     │     └──────────────┘               │
│  │          │     │          │                                     │
│  │ status   │     │ kind     │                                     │
│  │ weight   │     │ payload  │                                     │
│  └──────────┘     └──────────┘                                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                            │
                            │ API Fetch
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   AIF TRANSLATION LAYER                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  File: lib/aif/graph-builder.ts                                    │
│  Function: buildAIFGraphFromDatabase()                             │
│                                                                     │
│  1. Fetch Arguments → Create I-nodes (conclusions)                  │
│  2. Fetch ArgumentPremises → Create I-nodes (premises)              │
│  3. Create RA-nodes (inference relations)                           │
│  4. Fetch ConflictApplications → Create CA-nodes                    │
│  5. Create edges: premise→RA, RA→conclusion, CA→target             │
│                                                                     │
│  Output: AIFGraph { nodes: [...], edges: [...] }                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                            │
                            │ Translation
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  ASPIC+ TRANSLATION LAYER                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  File: lib/aif/translation/aifToAspic.ts                           │
│  Function: aifToASPIC(aifGraph)                                    │
│                                                                     │
│  1. I-nodes → Language formulas (L)                                 │
│  2. I-nodes with role='premise' → Knowledge base premises (K_p)     │
│  3. AssumptionUse status=ACCEPTED → Assumptions (K_n)               │
│  4. ArgumentPremise.isAxiom=true → Axioms (K_a)                     │
│  5. RA-nodes → Defeasible rules (R_d)                               │
│  6. RA-nodes with ruleType=STRICT → Strict rules (R_s)              │
│  7. ClaimContrary → Contraries function (¬)                         │
│  8. CA-nodes → Attacks { attacker, attacked, type }                 │
│                                                                     │
│  Output: ArgumentationTheory                                        │
│  {                                                                  │
│    system: { language, rules, contraries },                        │
│    knowledgeBase: { axioms, premises, assumptions }                │
│  }                                                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                            │
                            │ Semantics Computation
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   ASPIC+ SEMANTICS LAYER                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  File: lib/aspic/semantics.ts                                      │
│  Function: computeAspicSemantics(theory)                           │
│                                                                     │
│  1. Construct arguments from theory                                 │
│     - Apply rules to knowledge base                                 │
│     - Build argument trees                                          │
│                                                                     │
│  2. Determine attacks                                               │
│     - Undermining: Attack on premises (¬φ ∈ conclusions)            │
│     - Rebutting: Attack on conclusions (ψ ↔ ¬ψ)                    │
│     - Undercutting: Attack on inference rules                       │
│                                                                     │
│  3. Apply preference orderings                                      │
│     - Check if attack succeeds as defeat                            │
│     - B defeats A if B attacks A and NOT (B' ≺ A)                   │
│                                                                     │
│  4. Compute grounded extension                                      │
│     - IN: Justified arguments (no undefeated attackers)             │
│     - OUT: Defeated arguments (attacked by IN argument)             │
│     - UNDEC: Undecided (circular attacks)                           │
│                                                                     │
│  Output: AspicSemantics                                             │
│  {                                                                  │
│    arguments: [...],      // All constructed arguments              │
│    attacks: [...],         // All attack relations                  │
│    defeats: [...],         // Successful attacks                    │
│    groundedExtension: {    // Labeling                              │
│      inArguments: [...],   // Justified                             │
│      outArguments: [...],  // Defeated                              │
│      undecArguments: []    // Undecided                             │
│    }                                                                │
│  }                                                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                            │
                            │ Render
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      ASPIC TAB VISUALIZATION                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  File: components/aspic/AspicTheoryPanel.tsx                       │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────┐       │
│  │  Theory Tab                                              │       │
│  │  ├─ Language: 25 formulas                                │       │
│  │  ├─ Rules: 8 defeasible, 0 strict                        │       │
│  │  ├─ Knowledge Base: 11 premises, 0 axioms, 0 assumptions │       │
│  │  └─ Contraries: (none)                                   │       │
│  └─────────────────────────────────────────────────────────┘       │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────┐       │
│  │  Extension Tab                                           │       │
│  │  ├─ ✅ Justified Arguments (IN): 19                      │       │
│  │  ├─ ❌ Defeated Arguments (OUT): 0                       │       │
│  │  └─ ❓ Undecided Arguments (UNDEC): 0                    │       │
│  │                                                          │       │
│  │  [Each argument expandable to show premises, rules]     │       │
│  └─────────────────────────────────────────────────────────┘       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 3.2 Integration Points Summary

#### DeepDivePanelV2 Tab Relationships

```typescript
// File: components/deepdive/DeepDivePanelV2.tsx

DeepDivePanelV2 (Central Hub - 2113 lines)
├─ Debate Tab (Line 1574)
│  ├─ PropositionComposerPro → Creates Claims
│  ├─ PropositionsList → Displays Claims
│  ├─ ClaimMiniMap → Visualizes claim relationships
│  └─ DialogueInspector → Shows dialogue moves on claims
│
├─ Arguments Tab (Line 1640)
│  ├─ AIFAuthoringPanel
│  │  └─ AIFArgumentWithSchemeComposer → Creates Arguments
│  ├─ AIFArgumentsListPro → Displays Arguments
│  │  ├─ ArgumentCardV2 → Shows individual arguments
│  │  │  ├─ CriticalQuestionsV3 → CQ-based attacks
│  │  │  └─ ArgumentActionsSheet
│  │  │     └─ AttackMenuProV2 → Direct attacks
│  │  └─ AttackMenuProV2 → Ad-hoc attacks
│  └─ [Assumptions Panel] → NOT YET INTEGRATED
│
├─ Dialogue Tab (Line 1760)
│  ├─ DialogueInspector → Shows all dialogue moves
│  ├─ Filters by kind: WHY, ATTACK, GROUNDS, ACCEPT, CLOSE
│  └─ Links to created Arguments & ConflictApplications
│
├─ Ludics Tab (Line 1810)
│  ├─ LudicsGraphExplorer → Visualizes formal dialogue structure
│  └─ LudicActs preserve ASPIC+ metadata in metaJson
│
├─ ASPIC Tab (Line 2084) ⭐ READ-ONLY VISUALIZATION
│  ├─ AspicTheoryPanel
│  │  ├─ Theory Tab
│  │  │  └─ AspicTheoryViewer → Shows language, rules, KB, contraries
│  │  ├─ Graph Tab (not implemented)
│  │  ├─ Extension Tab
│  │  │  └─ GroundedExtensionPanel → Shows IN/OUT/UNDEC arguments
│  │  └─ Rationality Tab (not implemented)
│  └─ SWR fetch from /api/aspic/evaluate
│
├─ Thesis Tab (Line 1890)
│  └─ ThesisBuilder → Structured argument construction
│
├─ Sources Tab (Line 1950)
│  └─ CitationsListPro → Evidence management
│
└─ Analytics Tab (Line 2000)
   └─ DeliberationAnalytics → Metrics & insights
```

---

### 3.3 Gap Analysis: Missing Interactions

#### Gap 1: Assumptions Not Exposed in DeepDivePanelV2 ❌

**Current State:**
- AssumptionUse model exists ✅
- ActiveAssumptionsPanel component exists ✅
- API endpoints exist ✅
- NOT integrated into DeepDivePanelV2 ❌

**Impact:**
- Users cannot view or create assumptions through main UI
- Assumptions don't appear in ASPIC+ Theory tab
- No way to mark premises as defeasible vs unquestionable

**Solution:** Add Assumptions section to Arguments Tab (see Phase A roadmap)

#### Gap 2: No Axiom Designation ❌

**Current State:**
- All ArgumentPremises treated equally
- No database field for `isAxiom`
- No UI control to designate axioms

**Impact:**
- ASPIC+ cannot distinguish K_a (axioms) from K_p (premises)
- All premises treated as defeasible (can be attacked)
- Missing semantic distinction for foundational vs ordinary premises

**Solution:** Add `isAxiom` field and checkbox UI (see Phase B roadmap)

#### Gap 3: No Strict Rules ❌

**Current State:**
- All RA-nodes become defeasible rules (R_d)
- No mechanism to create strict rules (R_s)
- No database field for rule type

**Impact:**
- ASPIC+ cannot distinguish must-follow vs can-be-challenged rules
- All inferences treated as potentially defeasible
- Missing logical necessity semantics

**Solution:** Add `ruleType` enum and radio button UI (see Phase C roadmap)

#### Gap 4: No Contraries Definition ❌

**Current State:**
- No ClaimContrary model
- No UI to declare contradictions
- ASPIC+ contraries function returns empty map

**Impact:**
- ASPIC+ cannot detect logical contradictions
- Rebutting attacks not properly classified
- Missing contradiction-based defeat semantics

**Solution:** Add ClaimContrary model and UI (see Phase D roadmap)

#### Gap 5: ConflictApplications Not in ASPIC+ Translation ❌

**Current State:**
- ConflictApplications created correctly ✅
- NOT fetched in /api/aspic/evaluate ❌
- CA-nodes not added to AIF graph ❌
- ASPIC+ translation doesn't see attacks ❌

**Impact:**
- Attacks don't appear in ASPIC+ Extension tab
- All arguments shown as justified (IN)
- Missing defeat semantics even when attacks exist

**Solution:** Fetch conflicts and add CA-nodes (see Phase E roadmap)

#### Gap 6: Limited Attack Discovery ⚠️

**Current State:**
- AttackMenuProV2 hidden in "⋮" menu
- Critical Questions require knowing about scheme
- No inline "Attack" button on arguments

**Impact:**
- Users may not discover how to create attacks
- Attack creation requires multiple clicks
- Low discoverability of argumentative challenge mechanisms

**Solution:** Add inline attack buttons and improve UI affordances (see Phase F roadmap)

---

### 3.4 Recommended Implementation Priority

#### Priority 1: Critical Path (Enable Basic Attack Visualization) 🔥

**Phase E: ConflictApplication Translation** (2-3 hours)
- Fetch ConflictApplications in API endpoint
- Add CA-nodes to AIF graph
- Update ASPIC+ translation to recognize attacks
- **Result:** Existing attacks visible in ASPIC tab

**Justification:** Highest impact for immediate value—makes existing attack data visible

#### Priority 2: Core Features (Enable Full ASPIC+ Semantics) ⭐

**Phase A: Assumptions Integration** (2-3 hours)
- Add ActiveAssumptionsPanel to Arguments tab
- Update ASPIC+ translation to include accepted assumptions
- **Result:** Assumptions appear in Theory KB section

**Phase D: Contraries Definition** (3-4 hours)
- Add ClaimContrary model
- Create contrary selection UI
- Update ASPIC+ translation
- **Result:** Logical contradictions recognized, rebutting attacks classified

**Justification:** Enables complete ASPIC+ theory construction with assumptions and contraries

#### Priority 3: Advanced Features (Enable Strict/Defeasible Distinction) 📈

**Phase B: Axioms Designation** (3-4 hours)
- Add isAxiom field to ArgumentPremise
- Add checkbox UI in argument composer
- Update ASPIC+ translation to separate K_a vs K_p
- **Result:** Foundational premises marked as unquestionable

**Phase C: Strict Rules** (4-5 hours)
- Add RuleType enum to ArgumentSchemeInstance
- Add radio button UI for rule type
- Update ASPIC+ translation to separate R_s vs R_d
- **Result:** Logical necessity rules marked as non-defeasible

**Justification:** Advanced semantic features for formal argumentation rigor

#### Priority 4: UX Improvements (Enhance Discoverability) 💡

**Phase F: Attack Creation UI Enhancement** (3-4 hours)
- Add inline attack buttons to ArgumentStatusCard
- Create AspicAttackDialog for direct creation
- Add bidirectional navigation (ASPIC ↔ Arguments tabs)
- **Result:** Attack creation more discoverable and intuitive

**Justification:** Improve user experience after core functionality complete

---

## Conclusion

### Current State Summary

**What's Working:**
- ✅ Arguments → ASPIC+ translation (premises, defeasible rules)
- ✅ Grounded semantics computation (labeling IN/OUT/UNDEC)
- ✅ Attack creation mechanisms (AttackMenuProV2, CriticalQuestionsV3)
- ✅ ConflictApplication database model with ASPIC+ metadata
- ✅ Dialogue provenance tracking (moves → conflicts)

**What's Missing:**
- ❌ Assumptions integration (data exists, not exposed in UI)
- ❌ Axiom designation (no field, no UI)
- ❌ Strict rules (no field, no UI)
- ❌ Contraries definition (no model, no UI)
- ❌ ConflictApplications in ASPIC+ translation (not fetched)

### Answer to Your Questions

**Q1: How would axioms, strict rules, assumptions, or contraries be added?**
- **Assumptions:** Data model exists, needs UI integration (Phase A - 2-3 hours)
- **Axioms:** Requires new field + UI checkbox (Phase B - 3-4 hours)
- **Strict Rules:** Requires new enum + UI radio buttons (Phase C - 4-5 hours)
- **Contraries:** Requires new model + UI selector (Phase D - 3-4 hours)

**Q2: How does a user attack or defeat an argument?**
- **Direct Attack:** Arguments tab → ArgumentActionsSheet → AttackMenuProV2
- **CQ Attack:** Arguments tab → CriticalQuestionsV3 → "Ask WHY"
- **Dialogue Attack:** Dialogue tab → Create ATTACK DialogueMove
- **Missing:** ConflictApplications not translated to ASPIC+ (Phase E - 2-3 hours)

**Q3: Holistic systems integration?**
- **Data Flow:** Debate → Arguments → Dialogue → AIF Graph → ASPIC+ → Visualization
- **Central Hub:** DeepDivePanelV2 coordinates 9 tabs
- **Read-Only ASPIC:** ASPIC tab visualizes computed semantics from other tabs
- **Integration Gaps:** 6 identified gaps, prioritized by impact

### Immediate Next Steps

1. **Implement Phase E** (ConflictApplication translation) → Make existing attacks visible
2. **Implement Phase A** (Assumptions integration) → Enable assumption tracking
3. **Implement Phase D** (Contraries definition) → Enable contradiction detection
4. **Test with real data** → Create attacks, assumptions, contraries in UI
5. **Validate ASPIC+ semantics** → Verify defeated arguments appear correctly

**Estimated Time to Full Feature Parity:** 15-20 hours across 6 phases

---

## Appendix: Quick Reference

### Database Models
- **Claim** → ASPIC+ language formula (L)
- **ArgumentPremise** → ASPIC+ premise (K_p) or axiom (K_a)
- **Argument** → ASPIC+ argument construction
- **AssumptionUse** → ASPIC+ assumption (K_n)
- **ConflictApplication** → ASPIC+ attack (defeats)
- **ClaimContrary** (NEW) → ASPIC+ contraries (¬)

### UI Components
- **PropositionComposerPro** → Create Claims
- **AIFArgumentWithSchemeComposer** → Create Arguments
- **AttackMenuProV2** → Create Attacks (ConflictApplications)
- **CriticalQuestionsV3** → CQ-based Attacks
- **ActiveAssumptionsPanel** → View/Create Assumptions
- **AspicTheoryPanel** → Visualize ASPIC+ theory

### API Endpoints
- `POST /api/ca` → Create ConflictApplication
- `POST /api/cqs/dialogue-move` → Create DialogueMove (WHY/GROUNDS)
- `GET /api/aspic/evaluate?deliberationId=...` → Compute ASPIC+ semantics
- `GET /api/deliberations/[id]/assumptions/active` → Fetch assumptions

### Key Files
- `components/deepdive/DeepDivePanelV2.tsx` (2113 lines) - Central hub
- `components/aspic/AspicTheoryPanel.tsx` - ASPIC visualization
- `app/api/aspic/evaluate/route.ts` - ASPIC computation
- `lib/aif/translation/aifToAspic.ts` - AIF → ASPIC+ translation
- `lib/aspic/semantics.ts` - Grounded extension computation
- `lib/aspic/conflictHelpers.ts` - Attack metadata helpers

---

**End of Analysis**
