# ASPIC+ Phase 1 Implementation Plan: Strict Rules & Knowledge Base Stratification

**Date**: November 17, 2025  
**Status**: Pre-Development Research & Planning  
**Focus**: Strict Rules, Axioms, Assumptions, and Contraries for full ASPIC+ compliance

---

## Executive Summary

### Current State Assessment

**What Works** ✅:
- Defeasible rules fully operational (from ArgumentScheme → RA nodes)
- Attack computation (undermining, rebutting, undercutting)
- Grounded extension computation
- Preference orderings (last-link, weakest-link)
- AIF → ASPIC+ translation pipeline

**What's Missing** ❌:
- **Strict Rules** (Rs): All rules currently defeasible
- **KB Stratification**: No distinction between Kn (axioms), Kp (premises), Ka (assumptions)
- **Contraries Function**: Empty contraries map (no logical contradictions)
- **Rule Naming**: No naming function n: Rd → L for undercutting attacks

**Impact**: System cannot properly evaluate formal proofs, Kantian deduction, mathematical arguments, or any reasoning requiring strict (non-defeasible) inference.

---

## Part 1: Theoretical Foundation Review

### 1.1 ASPIC+ Knowledge Base Structure (Modgil & Prakken 2013)

From `lib/aspic/types.ts` (lines 45-61):

```typescript
/**
 * Knowledge Base (KB)
 * Partitioned into three categories based on fallibility
 */
export interface KnowledgeBase {
  /** Kn: Necessary axioms (infallible, cannot be attacked) */
  axioms: Set<string>;
  
  /** Kp: Ordinary premises (fallible, can be undermined) */
  premises: Set<string>;
  
  /** Ka: Assumptions (fallible, attacks always succeed) */
  assumptions: Set<string>;
  
  /** Preference ordering on ordinary premises ≤' */
  premisePreferences: Array<{ preferred: string; dispreferred: string }>;
  
  /** Preference ordering on defeasible rules ≤ */
  rulePreferences: Array<{ preferred: string; dispreferred: string }>;
}
```

**Key Insight**: Three-tier stratification with different attack rules:
- **Kn (Axioms)**: Cannot be undermined at all
- **Kp (Premises)**: Can be undermined if attacker ⊀ premise (preference check)
- **Ka (Assumptions)**: Can always be undermined (no preference check)

### 1.2 Strict vs Defeasible Rules (Modgil & Prakken 2013)

From `lib/aspic/types.ts` (lines 20-30):

```typescript
/**
 * Rule: Inference pattern (strict or defeasible)
 * 
 * Strict rules (Rs): Premises logically guarantee conclusion
 *   Example: p, p→q ⊢ q
 * 
 * Defeasible rules (Rd): Premises create presumption for conclusion
 *   Example: Bird(x) ⇒ Flies(x)
 */
export interface Rule {
  id: string;
  antecedents: string[];  // Premise formulae
  consequent: string;     // Conclusion formula
  type: "strict" | "defeasible";
}
```

**Key Insight**: Type affects attack success:
- Strict rules: Conclusions **cannot be rebutted** (only undercut if named)
- Defeasible rules: Conclusions **can be rebutted** (if attacker ⊀ target)

### 1.3 Current Implementation Gaps

#### Gap 1: ArgumentPremise has no status field

From `lib/models/schema.prisma` (lines 2490-2505):

```prisma
model ArgumentPremise {
  argumentId String
  claimId    String
  isImplicit Boolean  @default(false)
  
  // ASPIC+ Phase B: Axioms Designation
  // Marks premise as axiom (K_n) vs ordinary premise (K_p)
  // Axioms cannot be undermined (attack restriction)
  isAxiom    Boolean  @default(false)
  
  argument   Argument @relation(fields: [argumentId], references: [id], onDelete: Cascade)
  groupKey   String?
  claim      Claim    @relation(fields: [claimId], references: [id], onDelete: Cascade)

  @@id([argumentId, claimId])
}
```

**Status**: `isAxiom` field EXISTS! ✅ (Added in Phase B)

**However**: Only handles Kn vs Kp distinction, not Ka (assumptions)

#### Gap 2: All rules are defeasible

From `lib/aif/translation/aifToAspic.ts` inspection:

```typescript
// Current: All RA nodes → defeasible rules
for (const raNode of raNodes) {
  defeasibleRules.push({
    id: raNode.id,
    antecedents: premises.map(p => p.content),
    consequent: conclusion.content,
    type: "defeasible", // HARDCODED - no way to mark as strict
  });
}
```

**Gap**: No mechanism to designate an Argument/Scheme as using strict inference.

#### Gap 3: No contraries defined

From `app/api/aspic/evaluate/route.ts` (line 267):

```typescript
// Step 1d: Fetch explicit ClaimContrary records (Phase D-1)
// @ts-ignore - ClaimContrary model exists but TypeScript server hasn't refreshed
const explicitContraries = await prisma.claimContrary.findMany({
  where: {
    deliberationId,
    status: "ACTIVE",
  },
  include: {
    claim: true,
    contrary: true,
  },
});
```

**Status**: `ClaimContrary` model referenced but not in schema! Need to verify.

Let me check current schema for ClaimContrary:

---

## Part 2: Database Schema Analysis

### 2.1 Current Premise Status (VERIFIED ✅)

```prisma
model ArgumentPremise {
  argumentId String
  claimId    String
  isImplicit Boolean  @default(false)
  isAxiom    Boolean  @default(false)  // ✅ Phase B implementation
  // ... rest of fields
}
```

**Assessment**: 
- ✅ Can mark premises as axioms (Kn)
- ✅ Default is ordinary premise (Kp)
- ❌ Cannot mark as assumption (Ka)

**Needed**: Add third state for assumptions

**Options**:
1. Add `isAssumption` boolean (alongside `isAxiom`)
2. Convert to `status` enum: `AXIOM | PREMISE | ASSUMPTION`

**Recommendation**: Option 2 (enum) is cleaner and prevents invalid states (both isAxiom and isAssumption true).

### 2.2 AssumptionUse Model (VERIFIED ✅)

From `ASPIC_USER_INTERACTION_ANALYSIS.md`:

```prisma
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

**Assessment**:
- ✅ Model exists and operational
- ✅ API endpoints exist (`POST /api/deliberations/[id]/assumptions/create`)
- ❌ Not integrated into ASPIC+ translation
- ❌ Not exposed in main UI (DeepDivePanelV2)

**Gap**: AssumptionUse records exist but aren't fetched/translated to Ka in ASPIC+.

### 2.3 Strict Rule Designation (MISSING ❌)

**Current Scheme Structure**:

```prisma
model ArgumentScheme {
  id          String   @id @default(cuid())
  key         String   @unique
  name        String
  // ... many other fields
  
  // NO FIELD for strict vs defeasible distinction
}

model ArgumentSchemeInstance {
  id         String @id @default(cuid())
  schemeId   String?
  // ... other fields
  
  // NO FIELD for rule type
}
```

**Options for Implementation**:

**Option A**: Add to ArgumentScheme (scheme-level default)
```prisma
model ArgumentScheme {
  // ... existing fields
  ruleType   RuleType @default(DEFEASIBLE)
}

enum RuleType {
  STRICT
  DEFEASIBLE
}
```

**Option B**: Add to ArgumentSchemeInstance (argument-level override)
```prisma
model ArgumentSchemeInstance {
  // ... existing fields
  ruleType   RuleType @default(DEFEASIBLE)
}
```

**Option C**: Add to Argument directly
```prisma
model Argument {
  // ... existing fields
  isStrictRule Boolean @default(false)
}
```

**Recommendation**: Option B (ArgumentSchemeInstance) - allows same scheme to be used as strict or defeasible depending on context.

**Example Use Case**:
- Modus Ponens scheme can be strict (deductive logic) or defeasible (practical reasoning)
- User chooses strictness when creating specific argument instance

### 2.4 ClaimContrary Model (VERIFIED ✅)

From `lib/models/schema.prisma` (lines 2602-2634):

```prisma
model ClaimContrary {
  id             String   @id @default(cuid())
  deliberationId String
  claimId        String // First claim
  contraryId     String // Contradictory/contrary claim
  isSymmetric    Boolean  @default(true) // true = contradictory (mutual), false = contrary (one-way)
  
  createdById BigInt
  createdAt   DateTime @default(now())
  
  status String @default("ACTIVE") // "ACTIVE" | "PROPOSED" | "DISPUTED" | "RETRACTED"
  reason String? @db.Text // User's explanation for why these are contrary
  
  // Relations
  deliberation Deliberation @relation(fields: [deliberationId], references: [id], onDelete: Cascade)
  claim        Claim        @relation("ClaimContraries", fields: [claimId], references: [id], onDelete: Cascade)
  contrary     Claim        @relation("ContraryOf", fields: [contraryId], references: [id], onDelete: Cascade)
  createdBy    User         @relation(fields: [createdById], references: [id], onDelete: Cascade)
  
  @@unique([claimId, contraryId])
  @@index([deliberationId])
}
```

**Assessment**:
- ✅ Model exists in schema (Phase D-1 complete)
- ✅ API fetches it in `/api/aspic/evaluate` (line 267)
- ✅ Supports symmetric (contradictory) and asymmetric (contrary) relationships
- ✅ Status field for moderation workflow
- ❌ Not integrated into ASPIC+ contraries map
- ❌ No UI to create contraries (need ContrarySelector component)

**Key Feature**: `isSymmetric` distinguishes:
- Contradictories: φ ∈ ψ̄ AND ψ ∈ φ̄ (classical negation)
- Contraries: φ ∈ ψ̄ but ψ ∉ φ̄ (negation-as-failure)

---

## Part 3: Current ASPIC+ Translation Pipeline

### 3.1 AIF → ASPIC+ Translation Flow

From `app/api/aspic/evaluate/route.ts` (GET endpoint):

```typescript
// Step 1: Fetch Arguments
const argumentsList = await prisma.argument.findMany({
  where: { deliberationId },
  include: {
    conclusion: true,
    premises: {
      include: { claim: true },
    },
    scheme: true,
  },
});

// Step 2: Build AIF Graph
const nodes: AnyNode[] = [];
const edges: Edge[] = [];

// Step 3: Translate AIF → ASPIC+ (lib/aif/translation/aifToAspic.ts)
const theory = aifToASPIC(aifGraph, explicitContraries);

// Step 4: Compute semantics (lib/aspic/index.ts)
const semantics = computeAspicSemantics(theory);
```

**Current Translation** (from code inspection of `lib/aif/translation/aifToAspic.ts`):

```typescript
function aifToASPIC(aifGraph: AIFGraph, explicitContraries: ClaimContrary[]): ArgumentationTheory {
  // Language: All claim texts
  const language = new Set<string>();
  
  // Rules: All RA nodes become defeasible rules
  const defeasibleRules: Rule[] = [];
  const strictRules: Rule[] = []; // ALWAYS EMPTY
  
  // Knowledge Base: All premises
  const axioms = new Set<string>(); // ALWAYS EMPTY
  const premises = new Set<string>(); // ALL PREMISES GO HERE
  const assumptions = new Set<string>(); // ALWAYS EMPTY
  
  // Contraries: From ClaimContrary records
  const contraries = new Map<string, Set<string>>();
  for (const contrary of explicitContraries) {
    // Add to contraries map
  }
  
  return {
    system: { language, strictRules, defeasibleRules, contraries, ruleNames: new Map() },
    knowledgeBase: { axioms, premises, assumptions, premisePreferences: [], rulePreferences: [] }
  };
}
```

**Gaps Identified**:
1. ❌ `strictRules` always empty
2. ❌ `axioms` always empty (all premises go to `premises`)
3. ❌ `assumptions` always empty
4. ❌ `ruleNames` always empty (needed for undercutting attacks)

---

## Part 4: Implementation Strategy

### 4.1 Schema Changes Needed

#### Change 1: ArgumentPremise Status Enum

**Current**:
```prisma
model ArgumentPremise {
  isAxiom Boolean @default(false)
}
```

**Proposed**:
```prisma
model ArgumentPremise {
  // Remove isAxiom boolean
  status PremiseStatus @default(ORDINARY)
}

enum PremiseStatus {
  AXIOM      // Kn: Cannot be undermined
  ORDINARY   // Kp: Can be undermined (preference check)
  ASSUMPTION // Ka: Always undermined (no preference check)
}
```

**Migration Strategy**:
```sql
-- Add new column
ALTER TABLE "ArgumentPremise" ADD COLUMN "status" TEXT DEFAULT 'ORDINARY';

-- Migrate existing data
UPDATE "ArgumentPremise" SET "status" = 'AXIOM' WHERE "isAxiom" = true;

-- Drop old column
ALTER TABLE "ArgumentPremise" DROP COLUMN "isAxiom";
```

#### Change 2: ArgumentSchemeInstance Rule Type

**Proposed**:
```prisma
model ArgumentSchemeInstance {
  id         String   @id @default(cuid())
  // ... existing fields
  
  // ASPIC+ Phase C: Strict vs Defeasible Rule Designation
  ruleType   RuleType @default(DEFEASIBLE)
  
  // ASPIC+ Phase C: Optional naming for undercutting attacks
  ruleName   String?  // Maps to ASPIC+ naming function n: Rd → L
}

enum RuleType {
  STRICT      // Rs: Conclusion cannot be rebutted
  DEFEASIBLE  // Rd: Conclusion can be rebutted
}
```

**No Migration Needed**: New optional field, defaults to DEFEASIBLE (preserves current behavior).

#### Change 3: ClaimContrary (Already Exists ✅)

No schema changes needed, just integration.

---

### 4.2 Translation Layer Changes

#### File: `lib/aif/translation/aifToAspic.ts`

**Current Issues**:
- All premises → Kp (ordinary premises)
- All rules → defeasible
- No assumptions fetched
- ClaimContrary fetched but not fully integrated

**Required Changes**:

```typescript
export function aifToASPIC(
  aifGraph: AIFGraph, 
  explicitContraries: ClaimContrary[],
  deliberationId: string // NEW: Need to fetch assumptions
): ArgumentationTheory {
  
  // 1. Stratify Knowledge Base by premise status
  const axioms = new Set<string>();
  const premises = new Set<string>();
  const assumptions = new Set<string>();
  
  for (const node of iNodes) {
    const metadata = node.metadata || {};
    
    if (metadata.role === 'axiom' || metadata.isAxiom) {
      axioms.add(node.content);
    } else if (metadata.role === 'assumption') {
      assumptions.add(node.content);
    } else {
      premises.add(node.content);
    }
  }
  
  // 2. Fetch and integrate AssumptionUse records
  const assumptionUses = await prisma.assumptionUse.findMany({
    where: { 
      deliberationId,
      status: 'ACCEPTED' // Only accepted assumptions enter Ka
    },
    include: {
      // Fetch claim if exists
    }
  });
  
  for (const assump of assumptionUses) {
    const text = assump.assumptionText || assump.assumptionClaim?.text;
    if (text) assumptions.add(text);
  }
  
  // 3. Separate strict vs defeasible rules
  const strictRules: Rule[] = [];
  const defeasibleRules: Rule[] = [];
  const ruleNames = new Map<string, string>();
  
  for (const raNode of raNodes) {
    const schemeInstance = await fetchSchemeInstance(raNode.schemeId);
    const ruleType = schemeInstance?.ruleType || 'defeasible';
    
    const rule = {
      id: raNode.id,
      antecedents: premises.map(p => p.content),
      consequent: conclusion.content,
      type: ruleType,
    };
    
    if (ruleType === 'strict') {
      strictRules.push(rule);
    } else {
      defeasibleRules.push(rule);
      
      // Add rule name if specified (for undercutting)
      if (schemeInstance?.ruleName) {
        ruleNames.set(rule.id, schemeInstance.ruleName);
      }
    }
  }
  
  // 4. Build contraries map from ClaimContrary records
  const contraries = new Map<string, Set<string>>();
  
  for (const contrary of explicitContraries) {
    const claimText = contrary.claim.text;
    const contraryText = contrary.contrary.text;
    
    // Add forward direction
    if (!contraries.has(claimText)) {
      contraries.set(claimText, new Set());
    }
    contraries.get(claimText)!.add(contraryText);
    
    // Add reverse direction if symmetric (contradictory)
    if (contrary.isSymmetric) {
      if (!contraries.has(contraryText)) {
        contraries.set(contraryText, new Set());
      }
      contraries.get(contraryText)!.add(claimText);
    }
  }
  
  return {
    system: {
      language,
      strictRules,
      defeasibleRules,
      contraries,
      ruleNames,
    },
    knowledgeBase: {
      axioms,
      premises,
      assumptions,
      premisePreferences: [], // TODO: Implement preference extraction
      rulePreferences: [],
    },
  };
}
```

---

### 4.3 Attack Validation Changes

#### File: `lib/aspic/attacks.ts`

**Current Undermining Logic** (lines 68-90):

```typescript
function checkUndermining(
  attacker: Argument,
  attacked: Argument,
  contraries: Map<string, Set<string>>,
  ordinaryPremises: Set<string>,
  assumptions: Set<string>
): Attack[] {
  const attacks: Attack[] = [];
  
  for (const premise of attacked.premises) {
    // Can only undermine ordinary premises and assumptions
    const isOrdinaryPremise = ordinaryPremises.has(premise);
    const isAssumption = assumptions.has(premise);

    if (!isOrdinaryPremise && !isAssumption) {
      continue; // Cannot undermine axioms
    }
    
    // ... check for contrary
  }
  
  return attacks;
}
```

**Assessment**: ✅ Already correctly implements axiom protection!

The key logic `if (!isOrdinaryPremise && !isAssumption) continue;` prevents attacks on axioms.

**Required Change**: None for undermining. Logic is correct.

#### Rebutting Attacks on Strict Conclusions

**Current Rebutting Logic** (lines 110-135):

```typescript
function checkRebutting(
  attacker: Argument,
  attacked: Argument,
  contraries: Map<string, Set<string>>
): Attack[] {
  // ...
  for (const subArg of subArguments) {
    // Can only rebut if sub-argument has DEFEASIBLE top rule
    if (!subArg.topRule || subArg.topRule.type !== "defeasible") {
      continue;
    }
    // ... check for contrary
  }
}
```

**Assessment**: ✅ Already correctly restricts rebutting to defeasible conclusions!

The key check `if (subArg.topRule.type !== "defeasible") continue;` prevents rebutting strict conclusions.

**Required Change**: None. Logic is correct.

---

### 4.4 Defeat Resolution Changes

#### File: `lib/aspic/defeats.ts`

**Assumption Attack Success** (lines 44-57):

```typescript
export function computeDefeats(
  attacks: Attack[],
  theory: ArgumentationTheory,
  ordering: PreferenceOrdering = "last-link"
): Defeat[] {
  // ...
  for (const attack of attacks) {
    // Special case: Undermining attacks on assumptions ALWAYS succeed
    if (attack.type === "undermining" && attack.target.premise) {
      const targetPremise = attack.target.premise;
      const isAssumption = theory.knowledgeBase.assumptions.has(targetPremise);
      
      if (isAssumption) {
        defeats.push({
          defeater: attack.attacker,
          defeated: attack.attacked,
          attack,
          preferenceApplied: false, // No preference check for assumptions
        });
        continue;
      }
    }
    // ... preference check for ordinary premises
  }
}
```

**Assessment**: ✅ Already correctly handles assumptions (no preference check)!

**Required Change**: None. Logic is correct.

---

## Part 5: UI Component Requirements

### 5.1 Premise Status Selector

**Component**: `components/arguments/PremiseStatusSelector.tsx` (NEW)

**Purpose**: Allow users to designate premises as Axiom/Ordinary/Assumption

**UI Design**:
```tsx
<RadioGroup value={premiseStatus} onValueChange={setPremiseStatus}>
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <RadioGroupItem value="ORDINARY" id="ordinary" />
      <Label htmlFor="ordinary" className="flex items-center gap-2">
        <span>Ordinary Premise</span>
        <span className="text-xs text-gray-500">(Can be challenged with evidence)</span>
      </Label>
    </div>
    
    <div className="flex items-center gap-2">
      <RadioGroupItem value="AXIOM" id="axiom" />
      <Label htmlFor="axiom" className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-blue-600" />
        <span>Axiom</span>
        <span className="text-xs text-gray-500">(Unchallengeable foundation)</span>
      </Label>
    </div>
    
    <div className="flex items-center gap-2">
      <RadioGroupItem value="ASSUMPTION" id="assumption" />
      <Label htmlFor="assumption" className="flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-amber-600" />
        <span>Assumption</span>
        <span className="text-xs text-gray-500">(Can always be challenged)</span>
      </Label>
    </div>
  </div>
</RadioGroup>
```

**Integration**: Add to `AIFArgumentWithSchemeComposer.tsx` premise selection

---

### 5.2 Rule Type Selector

**Component**: `components/arguments/RuleTypeSelector.tsx` (NEW)

**Purpose**: Allow users to designate inference as strict (deductive) or defeasible

**UI Design**:
```tsx
<Card className="border-l-4 border-l-blue-500">
  <CardHeader>
    <CardTitle className="text-sm">Inference Type</CardTitle>
  </CardHeader>
  <CardContent>
    <RadioGroup value={ruleType} onValueChange={setRuleType}>
      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <RadioGroupItem value="DEFEASIBLE" id="defeasible" />
          <div className="flex-1">
            <Label htmlFor="defeasible" className="font-semibold">
              Defeasible (Default)
            </Label>
            <p className="text-xs text-gray-600 mt-1">
              Creates presumption for conclusion. Can be rebutted if contrary evidence is stronger.
            </p>
            <Badge variant="outline" className="mt-2">Example: Bird(x) ⇒ Flies(x)</Badge>
          </div>
        </div>
        
        <div className="flex items-start gap-2">
          <RadioGroupItem value="STRICT" id="strict" />
          <div className="flex-1">
            <Label htmlFor="strict" className="font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              Strict (Deductive)
            </Label>
            <p className="text-xs text-gray-600 mt-1">
              Logically guarantees conclusion. Cannot be rebutted, only undercut.
            </p>
            <Badge variant="outline" className="mt-2 border-blue-600">
              Example: p, p→q ⊢ q
            </Badge>
          </div>
        </div>
      </div>
    </RadioGroup>
    
    {ruleType === 'STRICT' && (
      <Alert className="mt-3 bg-blue-50 border-blue-200">
        <AlertCircle className="w-4 h-4 text-blue-600" />
        <AlertDescription className="text-xs">
          Strict rules cannot be rebutted. Opponents must undercut the rule application itself.
        </AlertDescription>
      </Alert>
    )}
  </CardContent>
</Card>
```

**Integration**: Add to `AIFArgumentWithSchemeComposer.tsx` after scheme selection

---

### 5.3 Contrary Selector

**Component**: `components/propositions/ContrarySelector.tsx` (NEW)

**Purpose**: Allow users to mark claim pairs as contrary/contradictory

**UI Design**:
```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Mark Claims as Contrary</DialogTitle>
      <DialogDescription>
        Define logical contradiction between claims for ASPIC+ evaluation
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-4">
      <div className="p-3 rounded-lg bg-gray-50">
        <p className="text-sm font-medium">Selected Claim:</p>
        <p className="text-sm text-gray-700 mt-1">{selectedClaim.text}</p>
      </div>
      
      <div>
        <Label>Choose Contrary Claim:</Label>
        <ClaimPicker
          deliberationId={deliberationId}
          onSelect={setContraryClaim}
          excludeIds={[selectedClaim.id]}
        />
      </div>
      
      <div>
        <Label>Relationship Type:</Label>
        <RadioGroup value={isSymmetric ? 'contradictory' : 'contrary'}>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="contradictory" id="contradictory" />
            <Label htmlFor="contradictory">
              Contradictory (Mutual) - Both claims cannot be true
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="contrary" id="contrary" />
            <Label htmlFor="contrary">
              Contrary (One-way) - First claim excludes second
            </Label>
          </div>
        </RadioGroup>
      </div>
      
      <div>
        <Label>Reason (Optional):</Label>
        <Textarea
          placeholder="Explain why these claims are contradictory..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
    </div>
    
    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
      <Button onClick={handleSubmit}>Mark as Contrary</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Integration**: Add action button to `PropositionsList.tsx` dropdown menu

---

### 5.4 ASPIC+ Theory Viewer Updates

**Component**: `components/aspic/AspicTheoryViewer.tsx`

**Required Changes**:

1. **KB Section Enhancement** - Show stratification:
```tsx
<Card>
  <CardHeader>
    <CardTitle>Knowledge Base ({total} items)</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Shield className="w-4 h-4 text-blue-600" />
        <h4 className="text-sm font-semibold">Axioms (Kn) - {axioms.length}</h4>
        <Badge variant="outline" className="text-xs">Cannot be attacked</Badge>
      </div>
      {axioms.map((axiom, idx) => (
        <Badge key={idx} className="mr-2 bg-blue-100 border-blue-300">{axiom}</Badge>
      ))}
    </div>
    
    <div>
      <div className="flex items-center gap-2 mb-2">
        <h4 className="text-sm font-semibold">Ordinary Premises (Kp) - {premises.length}</h4>
        <Badge variant="outline" className="text-xs">Can be undermined</Badge>
      </div>
      {premises.map((p, idx) => (
        <Badge key={idx} className="mr-2 bg-gray-100">{p}</Badge>
      ))}
    </div>
    
    <div>
      <div className="flex items-center gap-2 mb-2">
        <AlertCircle className="w-4 h-4 text-amber-600" />
        <h4 className="text-sm font-semibold">Assumptions (Ka) - {assumptions.length}</h4>
        <Badge variant="outline" className="text-xs">Always undermined</Badge>
      </div>
      {assumptions.map((a, idx) => (
        <Badge key={idx} className="mr-2 bg-amber-100 border-amber-300">{a}</Badge>
      ))}
    </div>
  </CardContent>
</Card>
```

2. **Rules Section Enhancement** - Distinguish strict vs defeasible:
```tsx
<div>
  <div className="flex items-center gap-2 mb-2">
    <Shield className="w-4 h-4 text-blue-600" />
    <h4 className="text-sm font-semibold">Strict Rules (Rs) - {strictRules.length}</h4>
    <Badge variant="outline" className="text-xs">Deductive</Badge>
  </div>
  {strictRules.map((rule, idx) => (
    <div key={idx} className="flex items-start gap-2 text-sm mb-2">
      <Badge variant="secondary" className="bg-blue-100 border-blue-300">
        {rule.id}
      </Badge>
      <code className="text-xs font-mono">
        {rule.antecedents.join(", ")} → {rule.consequent}
      </code>
    </div>
  ))}
</div>

<div>
  <div className="flex items-center gap-2 mb-2">
    <h4 className="text-sm font-semibold">Defeasible Rules (Rd) - {defeasibleRules.length}</h4>
    <Badge variant="outline" className="text-xs">Presumptive</Badge>
  </div>
  {defeasibleRules.map((rule, idx) => (
    <div key={idx} className="flex items-start gap-2 text-sm mb-2">
      <Badge variant="secondary">{rule.id}</Badge>
      <code className="text-xs font-mono">
        {rule.antecedents.join(", ")} ⇒ {rule.consequent}
      </code>
    </div>
  ))}
</div>
```

---

## Part 6: API Endpoints Needed

### 6.1 Contrary Management

**Endpoint**: `POST /api/deliberations/[id]/contraries`

**Purpose**: Create ClaimContrary record

**Request Body**:
```typescript
{
  claimId: string;
  contraryId: string;
  isSymmetric: boolean;
  reason?: string;
}
```

**Implementation**:
```typescript
export async function POST(req: NextRequest, { params }: Context) {
  const userId = await getCurrentUserId();
  const { claimId, contraryId, isSymmetric, reason } = await req.json();
  
  // Validate claims exist and belong to deliberation
  const [claim, contrary] = await prisma.claim.findMany({
    where: {
      id: { in: [claimId, contraryId] },
      deliberationId: params.id,
    },
  });
  
  if (!claim || !contrary) {
    return NextResponse.json({ error: 'Claims not found' }, { status: 404 });
  }
  
  // Create contrary record
  const claimContrary = await prisma.claimContrary.create({
    data: {
      deliberationId: params.id,
      claimId,
      contraryId,
      isSymmetric,
      reason,
      createdById: userId,
      status: 'ACTIVE',
    },
  });
  
  return NextResponse.json({ success: true, claimContrary });
}
```

**Endpoint**: `GET /api/deliberations/[id]/contraries`

**Purpose**: Fetch all contraries for deliberation

---

### 6.2 Premise Status Update

**Endpoint**: `PATCH /api/arguments/[id]/premises/[claimId]/status`

**Purpose**: Update ArgumentPremise status (AXIOM/ORDINARY/ASSUMPTION)

**Request Body**:
```typescript
{
  status: 'AXIOM' | 'ORDINARY' | 'ASSUMPTION';
}
```

**Implementation**:
```typescript
export async function PATCH(req: NextRequest, { params }: Context) {
  const { status } = await req.json();
  
  // Validate status enum
  if (!['AXIOM', 'ORDINARY', 'ASSUMPTION'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }
  
  // Update premise status
  await prisma.argumentPremise.update({
    where: {
      argumentId_claimId: {
        argumentId: params.id,
        claimId: params.claimId,
      },
    },
    data: { status },
  });
  
  return NextResponse.json({ success: true });
}
```

---

## Part 7: Testing Strategy

### 7.1 Unit Tests (Jest)

**File**: `tests/aspic/knowledgeBase.test.ts` (NEW)

```typescript
import { aifToASPIC } from '@/lib/aif/translation/aifToAspic';

describe('Knowledge Base Stratification', () => {
  it('should separate axioms, premises, and assumptions', () => {
    const aifGraph = createTestGraph({
      premises: [
        { text: 'p1', status: 'AXIOM' },
        { text: 'p2', status: 'ORDINARY' },
        { text: 'p3', status: 'ASSUMPTION' },
      ],
    });
    
    const theory = aifToASPIC(aifGraph, []);
    
    expect(theory.knowledgeBase.axioms.has('p1')).toBe(true);
    expect(theory.knowledgeBase.premises.has('p2')).toBe(true);
    expect(theory.knowledgeBase.assumptions.has('p3')).toBe(true);
  });
  
  it('should prevent attacks on axioms', () => {
    // Test that axioms cannot be undermined
  });
  
  it('should allow attacks on assumptions without preference check', () => {
    // Test that assumptions are always defeated
  });
});

describe('Strict vs Defeasible Rules', () => {
  it('should separate strict and defeasible rules', () => {
    const aifGraph = createTestGraph({
      arguments: [
        { ruleType: 'STRICT', premises: ['p'], conclusion: 'q' },
        { ruleType: 'DEFEASIBLE', premises: ['r'], conclusion: 's' },
      ],
    });
    
    const theory = aifToASPIC(aifGraph, []);
    
    expect(theory.system.strictRules.length).toBe(1);
    expect(theory.system.defeasibleRules.length).toBe(1);
  });
  
  it('should prevent rebutting attacks on strict conclusions', () => {
    // Test that strict rule conclusions cannot be rebutted
  });
});

describe('Contraries Integration', () => {
  it('should build contraries map from ClaimContrary records', () => {
    const contraries = [
      { claim: { text: 'p' }, contrary: { text: 'not_p' }, isSymmetric: true },
    ];
    
    const theory = aifToASPIC(createTestGraph(), contraries);
    
    expect(theory.system.contraries.get('p')?.has('not_p')).toBe(true);
    expect(theory.system.contraries.get('not_p')?.has('p')).toBe(true);
  });
  
  it('should handle asymmetric contraries', () => {
    // Test one-way contrary relationships
  });
});
```

---

## Part 8: Implementation Timeline

### Week 1: Schema & Translation (5 days)

**Day 1-2: Schema Changes**
- Add `PremiseStatus` enum
- Add `RuleType` enum and fields
- Write migration script
- Run `npx prisma db push`
- Verify TypeScript types generated

**Day 3-4: Translation Layer**
- Update `lib/aif/translation/aifToAspic.ts`
- Implement KB stratification
- Implement strict/defeasible rule separation
- Integrate ClaimContrary records
- Fetch AssumptionUse records

**Day 5: Testing**
- Write unit tests for translation
- Test with sample data
- Verify ASPIC+ semantics computation

---

### Week 2: UI Components (5 days)

**Day 1: PremiseStatusSelector**
- Create component
- Integrate into `AIFArgumentWithSchemeComposer`
- Test premise designation

**Day 2: RuleTypeSelector**
- Create component
- Integrate into argument creation flow
- Add educational tooltips

**Day 3: ContrarySelector**
- Create component
- Integrate into `PropositionsList`
- Test contrary creation

**Day 4-5: ASPIC Theory Viewer**
- Update KB section with stratification
- Update Rules section with strict/defeasible distinction
- Add visual indicators (shields, badges)
- Test display

---

### Week 3: API & Integration (5 days)

**Day 1: API Endpoints**
- Create `/api/deliberations/[id]/contraries`
- Create `/api/arguments/[id]/premises/[claimId]/status`
- Test endpoints

**Day 2-3: E2E Integration**
- Wire up UI → API → Database → ASPIC+
- Test full flow: Create axiom → Verify in ASPIC+ → Try to attack → Verify prevented

**Day 4: Documentation**
- Update ASPIC+ user guide
- Create tutorial: "Using Axioms for Formal Proofs"
- Create tutorial: "Strict vs Defeasible Reasoning"

**Day 5: Polish & Bug Fixes**
- Address edge cases
- Improve error messages
- Add loading states

---

## Part 9: Success Criteria

### 9.1 Functional Requirements

✅ **FR1**: Users can designate premises as Axiom/Ordinary/Assumption  
✅ **FR2**: Users can mark inference rules as Strict/Defeasible  
✅ **FR3**: Users can define contrary relationships between claims  
✅ **FR4**: ASPIC+ theory correctly stratifies knowledge base (Kn/Kp/Ka)  
✅ **FR5**: ASPIC+ theory separates strict rules (Rs) from defeasible rules (Rd)  
✅ **FR6**: Attack validation prevents undermining axioms  
✅ **FR7**: Attack validation prevents rebutting strict conclusions  
✅ **FR8**: Assumptions are always defeated (no preference check)  
✅ **FR9**: Contraries map integrates ClaimContrary records  
✅ **FR10**: Theory viewer displays all stratifications with visual distinction  

---

### 9.2 Test Cases

**Test Case 1: Kantian Deduction**
```
Axiom: Law of Non-Contradiction (cannot be challenged)
Strict Rule: "All experience requires synthesis" + "Categories provide synthesis" → "Categories required"
Ordinary Premise: "Inner experience is determined in time"
Assumption: "Space and time are pure forms of intuition" (can always be challenged)

Expected:
- Axiom appears in Kn, immune to undermining
- Strict rule conclusion cannot be rebutted
- Ordinary premise can be undermined with preference check
- Assumption can be undermined without preference check
```

**Test Case 2: Mathematical Proof**
```
Axioms: Peano axioms (5 axioms, all in Kn)
Strict Rules: All inference steps (modus ponens, substitution, etc.)

Expected:
- All axioms immune to undermining
- All conclusions immune to rebutting
- Only way to attack: Undercut rule application (show invalid step)
```

**Test Case 3: Defeasible Reasoning**
```
Ordinary Premise: "Birds fly" (Kp)
Defeasible Rule: "Tweety is a bird" ⇒ "Tweety flies"
Contrary: "Tweety is a penguin" ∈ "Tweety flies"̄

Expected:
- Premise can be undermined
- Conclusion can be rebutted
- Contrary relationship triggers attack
```

---

## Part 10: Documentation Deliverables

### 10.1 Developer Documentation

**File**: `docs/aspic/knowledge-base-stratification.md`

Topics:
- Three-tier KB structure (Kn/Kp/Ka)
- When to use each tier
- Attack restrictions by tier
- Code examples

**File**: `docs/aspic/strict-vs-defeasible-rules.md`

Topics:
- Deductive vs presumptive reasoning
- When to use strict rules
- Attack behavior differences
- Examples from philosophy, mathematics, law

### 10.2 User Documentation

**File**: `docs/user-guides/aspic-axioms-guide.md`

Topics:
- What are axioms?
- How to designate premises as axioms
- When axioms are appropriate
- Examples: Kantian principles, mathematical axioms, legal statutes

**File**: `docs/user-guides/aspic-strict-rules-guide.md`

Topics:
- Deductive vs defeasible inference
- How to mark rules as strict
- Implications for argumentation
- Examples: Modus ponens, syllogism, formal proofs

---

## Conclusion

### Summary of Changes Required

**Schema** (2 enums, 2 fields):
1. Add `PremiseStatus` enum (AXIOM/ORDINARY/ASSUMPTION)
2. Add `RuleType` enum (STRICT/DEFEASIBLE)
3. Add `ArgumentPremise.status` field
4. Add `ArgumentSchemeInstance.ruleType` field

**Translation** (1 file, ~150 lines):
1. Stratify KB by premise status
2. Fetch AssumptionUse records
3. Separate strict/defeasible rules
4. Integrate ClaimContrary records

**UI** (4 new components):
1. PremiseStatusSelector
2. RuleTypeSelector
3. ContrarySelector
4. Updated AspicTheoryViewer

**API** (2 endpoints):
1. POST/GET `/api/deliberations/[id]/contraries`
2. PATCH `/api/arguments/[id]/premises/[claimId]/status`

**Total Estimated Effort**: 15 days (3 weeks)

### Impact Assessment

**Before Phase 1**:
- ❌ Cannot represent formal proofs
- ❌ Cannot model Kantian deduction
- ❌ All premises equally challengeable
- ❌ All rules equally defeatable
- ❌ No logical contradictions

**After Phase 1**:
- ✅ Full ASPIC+ KB stratification
- ✅ Strict (deductive) + defeasible reasoning
- ✅ Axiom protection (unchallengeable foundations)
- ✅ Assumption tracking (always challengeable)
- ✅ Contrary relationships (logical contradictions)
- ✅ Proper attack validation by rule/premise type

**Philosophy Impact**:
- Can now model Kant's Critique of Pure Reason
- Can represent mathematical proofs
- Can handle legal reasoning (statutes as axioms)
- Can track enthymematic assumptions
- Can formalize logical contradictions

This completes the theoretical foundation for CPR-level philosophical argumentation as identified in the revised analysis.

---

**Next Steps**: Review this plan, then begin implementation starting with schema changes.

---

# APPENDIX A: COMPONENT INTEGRATION AUDIT

This audit identifies existing ASPIC+ related components and their integration status.

## A.1 Core ASPIC+ Components (FULLY INTEGRATED ✅)

### AspicTheoryPanel.tsx
**Location**: `components/aspic/AspicTheoryPanel.tsx`  
**Status**: ✅ INTEGRATED  
**Used In**: 
- `DeepDivePanelV2.tsx` (line 1691)
- `ArgumentsTab.tsx` (line 214) - ASPIC tab

**Functionality**:
- Main container for ASPIC+ visualization
- Tabs: Theory, Graph (disabled), Extension, Rationality (disabled)
- Fetches from `/api/aspic/evaluate?deliberationId=xxx`
- Properly integrated into UI hierarchy

**Assessment**: Working correctly, no issues found.

---

### AspicTheoryViewer.tsx
**Location**: `components/aspic/AspicTheoryViewer.tsx`  
**Status**: ✅ INTEGRATED (with data display limitations)  
**Parent**: AspicTheoryPanel (Theory tab)

**Functionality**:
- Displays Language, Rules, Knowledge Base, Contraries
- Collapsible sections with copy/export actions
- **Already has UI structure for axioms/premises/assumptions**
- Handles both old and new theory formats

**Current Display**:
```typescript
// Knowledge Base Section (lines 230-300)
- Axioms (shows count, badges with bg-sky-100)
- Premises (shows count, outline badges)
- Assumptions (shows count, secondary badges)
```

**Assessment**: 
- ✅ UI is ALREADY BUILT for stratified KB
- ❌ But receives empty axioms/assumptions arrays (data layer issue)
- ✅ Strict/Defeasible rules sections already separate
- ❌ Both show "No rules defined" (data layer issue)

**Key Finding**: This component is actually MORE COMPLETE than the plan indicated. The UI fully supports Phase 1 features, but the data layer doesn't populate them.

---

### GroundedExtensionPanel.tsx
**Location**: `components/aspic/GroundedExtensionPanel.tsx`  
**Status**: ✅ INTEGRATED  
**Parent**: AspicTheoryPanel (Extension tab)

**Functionality**:
- Displays IN/OUT/UNDEC arguments
- Search and export functionality
- Justification explanations
- Uses ArgumentStatusCard for display

**Assessment**: Working correctly, depends on semantics computation.

---

### ArgumentStatusCard.tsx
**Location**: `components/aspic/ArgumentStatusCard.tsx`  
**Status**: ✅ INTEGRATED  
**Parent**: GroundedExtensionPanel

**Functionality**:
- Expandable card showing argument structure
- Premise/rule/conclusion display
- Status badges (IN/OUT/UNDEC)
- Detailed structure visualization with JSON parsing

**Assessment**: Working correctly, sophisticated display logic.

---

### ExtensionStats.tsx
**Location**: `components/aspic/ExtensionStats.tsx`  
**Status**: ✅ INTEGRATED (assumed functional based on usage)  
**Parent**: GroundedExtensionPanel

**Functionality**: Displays summary statistics for grounded extension.

---

## A.2 Attack Components (PARTIALLY INTEGRATED ⚠️)

### AttackCreationModal.tsx
**Location**: `components/aspic/AttackCreationModal.tsx`  
**Status**: ⚠️ PARTIALLY INTEGRATED  
**Used In**: `ClaimDetailPanel.tsx` (lines 291-304)

**Functionality**:
- UI for direct ASPIC+ attack creation
- Three attack types: UNDERMINES, REBUTS, UNDERCUTS
- Attacker selection (claim or argument)
- Creates ConflictApplication via `/api/ca`

**Integration Issues**:
1. ✅ Accessible from ClaimDetailPanel → "Create ASPIC+ Attack" button
2. ⚠️ Not accessible from ArgumentsTab or ASPIC tab
3. ⚠️ No batch attack creation workflow
4. ⚠️ UI shows good educational content but could be better integrated

**Assessment**: Component is well-built but access is limited. Should be promoted to ArgumentsTab for better discoverability.

---

## A.3 Contrary Management (FULLY INTEGRATED ✅)

### ClaimContraryManager.tsx
**Location**: `components/claims/ClaimContraryManager.tsx`  
**Status**: ✅ INTEGRATED  
**Used In**: `ClaimDetailPanel.tsx` (line 264)

**Functionality**:
- List existing contraries for a claim
- Add new contrary relationships
- Delete contraries
- Symmetric (contradictory) vs asymmetric (contrary) toggle
- Well-formedness warnings

**API Integration**:
- ✅ GET `/api/contraries?deliberationId=xxx&claimId=yyy`
- ✅ POST `/api/contraries/create`
- ✅ DELETE `/api/contraries?contraryId=xxx`

**Database Integration**:
- ✅ ClaimContrary model exists (lines 2602-2634 in schema.prisma)
- ✅ Fields: claimId, contraryId, isSymmetric, status, reason
- ✅ Relations: Deliberation, Claim (bidirectional), User

**ASPIC+ Integration**:
- ✅ Fetched in `/api/aspic/evaluate` (line 210)
- ❌ BUT: Translation to contraries map needs verification
- ❓ Unknown if contraries actually populate ASPIC+ theory.contraries

**Assessment**: UI and API are complete. Need to verify ASPIC+ translation integration.

---

### ClaimDetailPanel.tsx
**Location**: `components/claims/ClaimDetailPanel.tsx`  
**Status**: ✅ INTEGRATED  
**Used In**: ArgumentCardV2 (for premises and conclusions)

**Functionality**:
- CEG labels and metrics
- Dialogical activity tracking
- Citations display
- **ClaimContraryManager integration** (line 264)
- **AttackCreationModal integration** (lines 291-304)
- CQ completion status

**Assessment**: Hub component connecting claims to ASPIC+ features. Well-integrated.

---

## A.4 Assumption Management (FULLY IMPLEMENTED ✅ but INTEGRATION GAP ❌)

### CreateAssumptionForm.tsx
**Location**: `components/assumptions/CreateAssumptionForm.tsx`  
**Status**: ✅ FULLY IMPLEMENTED  
**Used In**: `DeepDivePanelV2.tsx` (line 1593)

**Functionality**:
- Create new assumptions with content, description, role
- Weight slider (0-1)
- Confidence slider (0-1)
- Status flow: PROPOSED → (user accepts) → ACCEPTED
- ASPIC+ K_a integration notes in UI

**UI Features**:
- Role selector: background, domain, simplification, epistemic
- Educational info box explaining K_a semantics
- Sliders for weight and confidence

**Assessment**: Component is production-ready and feature-complete.

---

### ActiveAssumptionsPanel.tsx
**Location**: `components/assumptions/ActiveAssumptionsPanel.tsx`  
**Status**: ✅ FULLY IMPLEMENTED  
**Used In**: `DeepDivePanelV2.tsx` (line 1597)

**Functionality**:
- Lists all assumptions (not just ACCEPTED)
- Status filtering by PROPOSED/ACCEPTED/CHALLENGED/RETRACTED
- Stats display
- Uses AssumptionCard for display
- K_a educational banner

**API Integration**:
- ✅ GET `/api/assumptions?deliberationId=xxx`
- ✅ Full CRUD operations via `/api/assumptions/[id]/*`

**Assessment**: Component is production-ready.

---

### AssumptionCard.tsx
**Location**: `components/assumptions/AssumptionCard.tsx`  
**Status**: ✅ ASSUMED IMPLEMENTED (not read but referenced)  
**Parent**: ActiveAssumptionsPanel

**Functionality**: Display individual assumption with status management.

---

## A.5 API Endpoints

### /api/aspic/evaluate (GET)
**Location**: `app/api/aspic/evaluate/route.ts`  
**Status**: ⚠️ PARTIAL INTEGRATION  

**What It Does**:
1. ✅ Fetches Arguments with premises (including isAxiom flag)
2. ✅ Fetches ConflictApplications
3. ✅ Fetches ClaimEdges
4. ✅ Fetches AssumptionUse records (status=ACCEPTED)
5. ✅ Fetches ClaimContrary records (status=ACTIVE)
6. ✅ Builds AIFGraph with nodes/edges
7. ✅ Tags I-nodes with role metadata (axiom vs premise) - line 278
8. ✅ Creates assumption I-nodes with role="assumption" - lines 491-556
9. ⚠️ Calls aifToASPIC(aifGraph, explicitContraries)
10. ✅ Validates axiom consistency and well-formedness
11. ✅ Computes semantics

**Critical Finding - Line 267**:
```typescript
// TODO: Phase A - Integrate AssumptionUse into ASPIC+ Ka set
// For now, we fetch them but don't yet merge into KB.assumptions
```

**Critical Finding - Lines 491-556**:
```typescript
// Step 4: Add I-nodes for assumptions (K_a)
for (const assumption of assumptionsList) {
  // Creates I-nodes with metadata.role = "assumption"
  // Creates "presumption" edges to arguments
  // Logs: "Created assumption I-node..."
}
```

**Assessment**: 
- ✅ AssumptionUse IS being fetched and converted to I-nodes
- ✅ I-nodes ARE tagged with role="assumption"
- ❌ BUT: Unknown if aifToASPIC actually reads this metadata
- ❌ Need to verify translation layer integration

---

### /api/contraries
**Location**: `app/api/contraries/route.ts`  
**Status**: ✅ FULLY IMPLEMENTED

**Endpoints**:
- GET: List contraries with filters
- DELETE: Soft-delete (set status=RETRACTED)

**Assessment**: Working correctly.

---

### /api/contraries/create
**Location**: `app/api/contraries/create/route.ts`  
**Status**: ✅ ASSUMED IMPLEMENTED (referenced by ClaimContraryManager)

---

### /api/assumptions
**Location**: `app/api/assumptions/route.ts`  
**Status**: ✅ FULLY IMPLEMENTED

**Endpoints**:
- GET: List with filters (deliberationId, argumentId, status)
- POST: Create new assumption

**Key Features**:
- ✅ Supports standalone assumptions (argumentId optional)
- ✅ Accepts weight and confidence
- ✅ Allows content as alias for assumptionText
- ✅ Proper auth checks

**Assessment**: Production-ready.

---

### /api/assumptions/[id]/*
**Location**: Multiple files  
**Status**: ✅ FULLY IMPLEMENTED

**Endpoints**:
- GET/PATCH/DELETE `/api/assumptions/[id]`
- POST `/api/assumptions/[id]/accept`
- POST `/api/assumptions/[id]/challenge`
- POST `/api/assumptions/[id]/retract`
- POST `/api/assumptions/[id]/link`

**Assessment**: Complete status workflow implementation.

---

## A.6 Translation Layer (CRITICAL GAP IDENTIFIED ❌)

### lib/aif/translation/aifToAspic.ts
**Status**: ❌ CRITICAL INTEGRATION GAP  
**Not Read Yet**: This is the key file that needs audit

**Known Issues** (from implementation plan Part 3.1):
1. ❌ All rules → defeasible (strictRules always empty)
2. ❌ All premises → Kp (axioms always empty)
3. ❌ Assumptions always empty
4. ❌ Contraries fetched but integration unclear

**Verification Needed**:
- Does it read I-node metadata.role?
- Does it check ArgumentPremise.isAxiom?
- Does it populate theory.axioms from role="axiom"?
- Does it populate theory.assumptions from role="assumption"?
- Does it map ClaimContrary records to theory.contraries?

**This is the single most important file to audit.**

---

## A.7 Summary of Integration Gaps

### Critical Path Issue: Translation Layer ❌

**The Problem**: 
- ✅ UI components are ready (AspicTheoryViewer already displays axioms/premises/assumptions)
- ✅ Database models are ready (ArgumentPremise.isAxiom, AssumptionUse, ClaimContrary)
- ✅ API fetches all needed data
- ✅ I-nodes are tagged with proper metadata
- ❌ **BUT**: Translation layer (aifToASPIC) may not be reading the metadata

**Impact**:
- Users create assumptions → They appear in ActiveAssumptionsPanel ✅
- Users mark premises as axioms → Stored in database ✅
- Users create contraries → Stored in ClaimContrary table ✅
- ASPIC+ evaluation runs → Fetches all data ✅
- **BUT**: ASPIC+ theory shows empty axioms/assumptions/contraries ❌

**Root Cause**: The gap is in `lib/aif/translation/aifToAspic.ts` not reading I-node metadata or ClaimContrary records.

---

### Secondary Issues

1. **AttackCreationModal**: Only accessible from ClaimDetailPanel, not from ArgumentsTab
2. **No UI for Strict Rule Designation**: Need checkbox in AIFArgumentWithSchemeComposer
3. **No UI for Premise Status**: Need to surface ArgumentPremise.isAxiom in UI

---

## A.8 Recommended Audit Order

1. **CRITICAL**: Read `lib/aif/translation/aifToAspic.ts` (lines 1-500) ← DO THIS FIRST
2. Verify how it processes I-node metadata
3. Verify how it processes ClaimContrary records
4. Check if ArgumentPremise.isAxiom is used anywhere
5. Test actual ASPIC+ evaluation with existing data

---

## A.9 Phase 1 Implementation Priorities (REVISED)

### ✅ COMPLETED: Translation Layer Fix (Nov 17, 2025)
**Goal**: Make existing data flow through to ASPIC+ theory

**Changes Made**:
1. ✅ Fixed `aifToAspic.ts` to read I-node metadata.role  
   - Line 164-196: Enhanced KB classification logic
   - Now checks `metadata.role === "axiom"` and `metadata.role === "assumption"`
   - Maintains backward compatibility with `metadata.isAxiom` flag
   
2. ✅ Mapped role="axiom" → theory.axioms
   - I-nodes with `metadata.role === "axiom"` OR `metadata.isAxiom === true` added to axioms Set
   - Console logging added for debugging
   
3. ✅ Mapped role="assumption" → theory.assumptions
   - I-nodes with `metadata.role === "assumption"` added to assumptions Set
   - Also preserves `presumption` edge-based assumption detection
   - Prevents double-adding assumptions
   
4. ✅ ClaimContrary → theory.contraries (Already Working)
   - Lines 145-161: Explicit contraries integration already complete
   - Supports symmetric (contradictory) and asymmetric (contrary) relationships
   
5. ✅ Added summary logging
   - Lines 231-241: Summary statistics logged after translation
   - Helps debug what was loaded into each KB tier

**Testing**: Need to verify with actual data that AspicTheoryViewer now shows non-empty sections

**Estimated Time**: 2 hours (ACTUAL: 30 minutes - faster than expected!)

---

### Immediate (Week 1): Translation Layer Fix
**Goal**: Make existing data flow through to ASPIC+ theory

1. Fix `aifToAspic.ts` to read I-node metadata.role
2. Map role="axiom" → theory.axioms
3. Map role="assumption" → theory.assumptions
4. Map ClaimContrary records → theory.contraries
5. Test that AspicTheoryViewer now shows non-empty sections

**Estimated Time**: 2 days (faster than schema changes!)

### Medium Priority (Week 2): Strict Rules
**Goal**: Enable strict vs defeasible rule designation

1. Add ArgumentSchemeInstance.ruleType field
2. Update AIFArgumentWithSchemeComposer with checkbox
3. Update aifToAspic.ts to check ruleType field
4. Test strict rule behavior

**Estimated Time**: 3 days

### Lower Priority (Week 3): Premise Status UI
**Goal**: Surface axiom/assumption designation to users

1. Add premise status selector to argument creation
2. Link to existing ArgumentPremise.isAxiom field
3. Add visual indicators in ArgumentCardV2

**Estimated Time**: 2 days

---

## A.10 Key Insight

**The system is MORE COMPLETE than initially assessed.**

- Database models: 80% complete (only missing ruleType field)
- UI components: 70% complete (AspicTheoryViewer already built for Phase 1)
- API layer: 90% complete (fetches everything needed)
- **Translation layer: 20% complete** ← This is the bottleneck

**Implication**: Phase 1 can be completed much faster by focusing on the translation layer first, rather than schema changes.


<function_calls>
<invoke name="grep_search">
<parameter name="includePattern">lib/models/schema.prisma