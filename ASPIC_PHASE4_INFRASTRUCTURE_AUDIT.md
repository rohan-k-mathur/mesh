# ASPIC+ Phase 4 Infrastructure Audit Report

**Date**: 2025-01-17  
**Purpose**: Comprehensive audit of existing AIF preferences infrastructure to inform ASPIC+ Phase 4 implementation strategy  
**Status**: ✅ Complete

---

## Executive Summary

**Key Finding**: The system already has a mature AIF PA-node (Preference Application) infrastructure with:
- ✅ Full Prisma schema (`PreferenceApplication` model)
- ✅ Complete UI for creating preferences (`PreferenceAttackModal` - 800+ lines)
- ✅ API endpoint for PA creation (`POST /api/pa`)
- ✅ AIF import/export with PA-node support
- ✅ Visualization components (`PreferenceBadge`)
- ✅ ASPIC+ preference orderings already implemented (`last-link`, `weakest-link`)
- ✅ Defeat computation using preferences (`lib/aspic/defeats.ts`)

**Strategic Implication**: Phase 4 is NOT "building preferences from scratch" but rather **integrating existing AIF PA-nodes with existing ASPIC+ preference logic**. The primary work is:
1. **Translation layer**: Bidirectional AIF PA-nodes ↔ ASPIC+ preferences
2. **UI enhancement**: Add ordering policy selectors to existing modal
3. **API enhancement**: Expose defeat computation with ordering policies
4. **Schema extension**: Add ordering policy metadata to PA records (minimal)

---

## 1. AIF PA-Node Infrastructure (Existing)

### 1.1 Prisma Schema

**Location**: `lib/models/schema.prisma` (line 2671)

```prisma
model PreferenceApplication {
  id             String   @id @default(cuid())
  deliberationId String
  schemeId       String? // nullable - references PreferenceScheme
  createdById    String
  createdAt      DateTime @default(now())

  // Preferred element (exactly one of these)
  preferredClaimId    String?
  preferredArgumentId String?
  preferredSchemeId   String? // when preferring an inference scheme

  // Dispreferred element (exactly one of these)
  dispreferredClaimId    String?
  dispreferredArgumentId String?
  dispreferredSchemeId   String?

  scheme PreferenceScheme? @relation(fields: [schemeId], references: [id], onDelete: SetNull)

  @@index([deliberationId])
  @@index([preferredClaimId])
  @@index([preferredArgumentId])
  @@index([dispreferredClaimId])
  @@index([dispreferredArgumentId])
}
```

**Analysis**:
- ✅ Supports preference between claims (I-nodes) and arguments (RA-nodes)
- ✅ Supports preference over schemes (argumentation schemes themselves)
- ✅ Optional `schemeId` for argumentation schemes justifying the preference
- ✅ Well-indexed for query performance
- ⚠️ **Missing**: Ordering policy metadata (e.g., "last-link-elitist")
- ⚠️ **Missing**: Justification text field (but PreferenceAttackModal has it - UI only)

**Recommendation**: Add optional fields for Phase 4:
```prisma
orderingPolicy  String? // "last-link" | "weakest-link" | null (default)
setComparison   String? // "elitist" | "democratic" | null (default)
justification   String? @db.Text // Reason for preference
```

### 1.2 AIF Type Definitions

**Location**: `lib/aif/types.ts` (line 51)

```typescript
export interface PANode extends BaseNode {
  nodeType: 'PA';
  schemeId?: string;
  preferenceType: PreferenceType; // 'argument' | 'rule' | 'premise' | 'source'
  justification?: string;
}

export type PreferenceType = 'argument' | 'rule' | 'premise' | 'source';
```

**Analysis**:
- ✅ PA-nodes have explicit `preferenceType` for classification
- ✅ Justification field supported at type level
- ✅ Aligns with Bex et al. paper (Definition 2.1: PA ⊆ V)
- ✅ Preference types match ASPIC+ categories (argument = RA-node, premise = I-node)

**Mapping to ASPIC+**:
- `'premise'` → `≤'` (premise preferences in KB)
- `'rule'` / `'argument'` → `≤` (rule preferences in KB)
- `'source'` → Not in ASPIC+ (extension for source credibility)

### 1.3 API Endpoint

**Location**: `app/api/pa/route.ts`

**POST /api/pa** - Create Preference Application

```typescript
CreatePA = z.object({
  deliberationId: z.string().min(6),
  schemeKey: z.string().optional(),
  
  // Preferred (exactly one)
  preferredArgumentId: z.string().optional(),
  preferredClaimId: z.string().optional(),
  preferredSchemeId: z.string().optional(),
  
  // Dispreferred (exactly one)
  dispreferredArgumentId: z.string().optional(),
  dispreferredClaimId: z.string().optional(),
  dispreferredSchemeId: z.string().optional(),
});
```

**Validation**:
- ✅ Enforces "exactly one preferred AND one dispreferred" rule
- ✅ Optional `schemeKey` for preference scheme lookup
- ✅ Creates `PreferenceApplication` record
- ✅ Returns created PA ID

**GET /api/pa** - Commented out (no implementation visible)

**Analysis**:
- ✅ Simple, focused API for PA creation
- ✅ No complex business logic (validation only)
- ⚠️ **Missing**: Ordering policy parameters
- ⚠️ **Missing**: Justification text parameter (UI collects it but not in API schema)

**Recommendation for Phase 4**:
- Add `justification`, `orderingPolicy`, `setComparison` to schema
- Add GET endpoint for fetching preferences by argument/deliberation
- Add computed field for "effective preference" given ordering policy

### 1.4 UI Components

#### PreferenceBadge (`components/aif/PreferenceBadge.tsx` - 40 lines)

**Purpose**: Display aggregate preference counts on arguments

```typescript
Props: {
  preferredBy: number,    // Count of PA-nodes where this is preferred
  dispreferredBy: number  // Count of PA-nodes where this is dispreferred
}
```

**Display Logic**:
- Net positive (preferredBy > dispreferredBy): Green badge "↑N"
- Net negative (preferredBy < dispreferredBy): Red badge "↓N"
- Balanced: Neutral "↑N / ↓N"
- No preferences: Returns null (hidden)

**Analysis**:
- ✅ Simple aggregation visualization
- ✅ Color-coded for quick assessment
- ⚠️ **Limitation**: Does not show ordering policy or defeat implications

**Recommendation for Phase 4**:
- Enhance tooltip to show ordering policy details
- Show "effective preference" given current evaluation configuration
- Link to preference details modal

#### PreferenceAttackModal (`components/agora/PreferenceAttackModal.tsx` - 800+ lines)

**Purpose**: Full-featured UI for creating preference attacks (PA-nodes)

**Features**:
- **Entity Types**: Prefer/disprefer argument OR scheme
- **Selection Modes**: 
  - Single: Create one PA at a time
  - Bulk: Select multiple targets, create multiple PAs
- **Preference Types**:
  - "prefer" (↑): Source preferred over target
  - "disprefer" (↓): Source dispreferred to target
- **Data Fetching**:
  - Source argument details: `GET /api/arguments/:id/aif`
  - Existing preferences: `GET /api/arguments/:id/preferences`
  - Target argument/scheme details
- **Validation**:
  - Existing relationship warnings
  - Cycle detection (if applicable)
- **Bulk Operations**:
  - Progress tracking with visual progress bar
  - Individual success/error states
  - Batch API calls with rate limiting
- **Justification**: Textarea for explaining preference (optional)

**API Call Structure**:
```typescript
POST /api/pa
Body: {
  deliberationId,
  preferredArgumentId?, dispreferredArgumentId?,
  preferredClaimId?, dispreferredClaimId?,
  preferredSchemeId?, dispreferredSchemeId?,
  // NOTE: justification is collected in UI but not sent (BUG?)
}
```

**Analysis**:
- ✅ Comprehensive, production-ready UI
- ✅ Handles complex workflows (bulk, validation, error recovery)
- ✅ Good UX (EntityPicker, progress tracking, warnings)
- ⚠️ **Missing**: Ordering policy selector
- ⚠️ **Missing**: Justification in API call (UI collects but doesn't send)
- ⚠️ **Missing**: Preview of defeat implications

**Recommendation for Phase 4**:
- Add dropdown for ordering policy: "last-link" | "weakest-link" | "default"
- Add dropdown for set comparison: "elitist" | "democratic" | "default"
- Fix: Send `justification` to API
- Add: Preview panel showing "This will defeat arguments: X, Y, Z"
- Add: Link to ASPIC+ preference help documentation

### 1.5 AIF Import/Export

**Import**: `lib/aif/import.ts` (line 133-183)

```typescript
// 4) Preferences (PA)
const PA_nodes = graph.nodes.filter((n:any) => n['@type'] === 'aif:PA');
const prefEdges = edges.filter((e:any) => e.role?.endsWith('PreferredElement'));
const dispEdges = edges.filter((e:any) => e.role?.endsWith('DispreferredElement'));

for (const pa of PA_nodes) {
  // Find preferred and dispreferred elements via edges
  const prefEdge = prefEdges.find((e:any) => e.to === paId);
  const dispEdge = dispEdges.find((e:any) => e.from === paId);
  
  // Lookup scheme if provided
  const schemeKey: string | null = pa.scheme || pa['aif:usesScheme'] || null;
  
  // Create PreferenceApplication
  await prisma.preferenceApplication.create({
    data: {
      preferredArgumentId: ...,
      preferredClaimId: ...,
      dispreferredArgumentId: ...,
      dispreferredClaimId: ...,
      schemeId: scheme?.id ?? null,
      ...
    }
  });
}
```

**Analysis**:
- ✅ Imports PA-nodes from AIF JSON-LD format
- ✅ Handles edge types: "PreferredElement" → PA → "DispreferredElement"
- ✅ Looks up preference schemes by key
- ✅ Maps AIF node types to Prisma fields (RA → argument, I → claim)
- ⚠️ **Missing**: Import of ordering policy metadata (if added to schema)

**Export**: `lib/aif/jsonld.ts` (line 51, 144)

```typescript
// 4) Preferences
const paRows = await prisma.preferenceApplication.findMany({
  where: { deliberationId }
});

// PA-nodes (preference): preferred → PA → dispreferred
// (Export logic continues...)
```

**Analysis**:
- ✅ Exports PA-nodes to AIF JSON-LD format
- ✅ Creates PA-nodes with proper edge types
- ⚠️ **Missing**: Export of ordering policy metadata

**Recommendation for Phase 4**:
- Extend import/export to include `orderingPolicy` and `setComparison` as metadata
- Validate that ordering policies are preserved through round-trip (import → export)

---

## 2. ASPIC+ Preference Infrastructure (Existing)

### 2.1 Type Definitions

**Location**: `lib/aspic/types.ts`

**KnowledgeBase Interface** (line 55):
```typescript
export interface KnowledgeBase {
  axioms: Set<string>;
  premises: Set<string>;
  assumptions: Set<string>;
  
  /** Preference ordering on ordinary premises ≤' */
  premisePreferences: Array<{ preferred: string; dispreferred: string }>;
  
  /** Preference ordering on defeasible rules ≤ */
  rulePreferences: Array<{ preferred: string; dispreferred: string }>;
}
```

**Analysis**:
- ✅ Direct representation of ASPIC+ preferences (≤', ≤)
- ✅ Simple pair format: `{ preferred, dispreferred }`
- ✅ Matches Modgil & Prakken specification
- ⚠️ **Gap**: No connection to AIF `PreferenceApplication` records
- ⚠️ **Gap**: Preferences hardcoded in KB, not fetched from database

**Preference Ordering Types** (line 148):
```typescript
export type PreferenceOrdering = "last-link" | "weakest-link" | "custom";
```

**PreferenceRelation Interface** (line 437):
```typescript
export interface PreferenceRelation {
  isLessPreferred(arg1: Argument, arg2: Argument): boolean;
  isLessOrEquallyPreferred(arg1: Argument, arg2: Argument): boolean;
  compare(arg1: Argument, arg2: Argument): ArgumentComparison;
}
```

**Analysis**:
- ✅ Clean functional interface for preference comparison
- ✅ Supports all ASPIC+ operations (≺, ≤, compare)
- ✅ Policy-agnostic (implementation creates concrete relation)

### 2.2 Defeat Computation

**Location**: `lib/aspic/defeats.ts`

**Core Function**: `computeDefeats(attacks, theory, ordering)`

```typescript
export function computeDefeats(
  attacks: Attack[],
  theory: ArgumentationTheory,
  ordering: PreferenceOrdering = "last-link"
): Defeat[]
```

**Algorithm** (Definition 3.7 from Modgil & Prakken):
1. **Undercutting attacks**: Always succeed (no preference check)
2. **Undermining on assumptions**: Always succeed
3. **Undermining/Rebutting**: Succeed if `attacker ⊀ target`
   - Compare attacker with **attacked sub-argument** (critical: not whole target)
   - Use preference relation based on ordering policy

**Preference Relation Creation**:
```typescript
function createPreferenceRelation(
  theory: ArgumentationTheory,
  ordering: PreferenceOrdering
): PreferenceRelation {
  switch (ordering) {
    case "last-link": return createLastLinkPreference(theory);
    case "weakest-link": return createWeakestLinkPreference(theory);
    case "custom": throw new Error("Not implemented");
  }
}
```

**Last-Link Implementation** (Definition 3.6):
- Compare **last defeasible rule** only (or premises if both strict)
- Observation-based arguments (no top rule) are never strictly less preferred
- Uses `knowledgeBase.rulePreferences` for rule comparison
- Implements "reasonable ordering" check (strict & firm > fallible)

**Weakest-Link Implementation** (Definition 3.8):
- Compare **all defeasible rules AND all ordinary premises**
- Uses **elitist set comparison** (X < Y if ∃x∈X: ∀y∈Y, x < y)
- Uses both `rulePreferences` and `premisePreferences`
- More conservative than last-link (failure propagates through chain)

**Set Comparison Functions**:
- `elitistComparison()`: ∃ element in set1 strictly worse than all in set2
- `democraticComparison()`: ∀ elements in set1, ∃ element in set2 at least as good
- Currently only elitist is used; democratic included for completeness

**Analysis**:
- ✅ **EXCELLENT**: Full implementation of ASPIC+ defeat logic
- ✅ Both last-link and weakest-link implemented correctly
- ✅ Reasonable ordering validation included
- ✅ Special cases handled (undercutting, assumptions, observation-based)
- ⚠️ **Critical Gap**: Preferences are read from `theory.knowledgeBase` but never populated from AIF `PreferenceApplication` records
- ⚠️ **Gap**: Democratic set comparison implemented but not exposed

**Recommendation for Phase 4**:
- **Primary Work**: Build translation layer to populate KB preferences from PA-nodes
- Add `setComparison` parameter to `computeDefeats()` (currently hardcoded to elitist)
- Expose defeat computation via API endpoint

### 2.3 Semantics and Evaluation

**Location**: `lib/aspic/semantics.ts`

**Core Function**: `computeGroundedExtension(args, defeats)`

```typescript
export function computeGroundedExtension(
  args: Argument[],
  defeats: Defeat[]
): GroundedExtension
```

**Algorithm**: Dung's characteristic function (fixed-point iteration)
1. Start with E₀ = ∅
2. Eᵢ₊₁ = F(Eᵢ) = {A | all defeaters of A are in OUT(Eᵢ)}
3. Continue until fixpoint (Eᵢ₊₁ = Eᵢ)

**Analysis**:
- ✅ Clean separation: `computeDefeats()` → `computeGroundedExtension()`
- ✅ Defeats are input (not computed inside semantics)
- ✅ Correct implementation of Dung semantics
- ✅ Returns IN/OUT/UNDECIDED status for all arguments

**Evaluation Pipeline** (`lib/aspic/index.ts`):
```typescript
// 1. Construct arguments from KB
const args = constructArguments(theory);

// 2. Compute attacks
const attacks = computeAttacks(args, theory);

// 3. Compute defeats (THIS IS WHERE PREFERENCES APPLY)
const defeats = computeDefeats(attacks, theory, ordering);

// 4. Compute grounded extension
const extension = computeGroundedExtension(args, defeats);
```

**Analysis**:
- ✅ Correct pipeline: args → attacks → defeats → extensions
- ✅ Ordering policy passed to `computeDefeats()`
- ⚠️ **Gap**: No way to specify ordering policy from API/UI (hardcoded)

---

## 3. AIF ↔ ASPIC+ Translation (Formal Mapping)

### 3.1 Theoretical Foundation

**Source**: `docs/arg-computation-research/AIF Formal Analysis Using the ASPIC Framework.md` (Bex, Prakken, Reed)

**Definition 4.1: AIF → ASPIC+ Translation**

Given AIF argument graph G = (V, E):

**Clause 5 (Premise Preferences)**:
```
≤' = {(vi, vj) | vi, vj ∈ K, ∃PA-node pa: vi →[preferred] pa →[dispreferred] vj}
```
- PA-nodes between I-nodes → premise preference ordering

**Clause 6 (Rule Preferences)**:
```
≤ = {(ri, rj) | ri, rj ∈ R, ∃PA-node pa: rai →[preferred] pa →[dispreferred] raj}
```
- PA-nodes between RA-nodes → rule preference ordering

**Definition 4.2: ASPIC+ → AIF Translation**

Given ASPIC+ theory AT = (AS, KB):

**Preference Relations → PA-nodes**:
- For each (φ, ψ) ∈ ≤': Create PA-node with I-node(φ) →[preferred] PA →[dispreferred] I-node(ψ)
- For each (r, r') ∈ ≤: Create PA-node with RA-node(r) →[preferred] PA →[dispreferred] RA-node(r')

**Key Insight**: PA-nodes can be attacked/supported in AIF (reasons for preferences)  
**ASPIC+ Limitation**: Cannot express reasons for preferences (noted in Section 4.1)

### 3.2 Translation Implementation Status

**Current State**: ❌ **NOT IMPLEMENTED**

**Evidence**:
- `lib/aspic/defeats.ts` reads from `theory.knowledgeBase.premisePreferences` and `rulePreferences`
- These arrays are **never populated** from `PreferenceApplication` records
- No translation function exists: `aifToASPIC()` or `populateKBFromPA()`

**Search Results**:
```bash
grep_search("aifToASPIC|aspicToAIF") → No matches found
grep_search("PreferenceApplication", includePattern="lib/aspic/**") → No matches
```

**Critical Gap**: The two systems (AIF PA-nodes and ASPIC+ KB preferences) **do not communicate**.

### 3.3 Translation Requirements for Phase 4

#### Translation Function 1: AIF → ASPIC+ (Populate KB)

```typescript
/**
 * Populate ASPIC+ KB preferences from AIF PreferenceApplication records
 * Implements Definition 4.1 from Bex et al.
 */
async function populateKBPreferencesFromAIF(
  deliberationId: string
): Promise<{ premisePreferences, rulePreferences }> {
  
  // 1. Fetch all PA records for deliberation
  const paRecords = await prisma.preferenceApplication.findMany({
    where: { deliberationId }
  });
  
  // 2. Separate by preference type
  const premisePrefs: Array<{ preferred: string, dispreferred: string }> = [];
  const rulePrefs: Array<{ preferred: string, dispreferred: string }> = [];
  
  for (const pa of paRecords) {
    // Clause 5: I-node to I-node → premise preference
    if (pa.preferredClaimId && pa.dispreferredClaimId) {
      const preferred = await getFormulaFromClaim(pa.preferredClaimId);
      const dispreferred = await getFormulaFromClaim(pa.dispreferredClaimId);
      premisePrefs.push({ preferred, dispreferred });
    }
    
    // Clause 6: RA-node to RA-node → rule preference
    if (pa.preferredArgumentId && pa.dispreferredArgumentId) {
      const preferredRule = await getRuleFromArgument(pa.preferredArgumentId);
      const dispreferredRule = await getRuleFromArgument(pa.dispreferredArgumentId);
      rulePrefs.push({ preferred: preferredRule.id, dispreferred: dispreferredRule.id });
    }
  }
  
  return { premisePreferences: premisePrefs, rulePreferences: rulePrefs };
}
```

**Complexity**: Medium
- Need claim → formula mapping (claims are I-nodes, contain text)
- Need argument → rule mapping (arguments are built from rules)
- Need to handle transitive closure (if PA1: A > B, PA2: B > C, then A > C)

#### Translation Function 2: ASPIC+ → AIF (Create PA-nodes)

```typescript
/**
 * Create AIF PA-nodes from ASPIC+ KB preferences
 * Implements Definition 4.2 from Bex et al.
 */
async function createPANodesFromASPICPreferences(
  deliberationId: string,
  theory: ArgumentationTheory,
  userId: string
): Promise<void> {
  
  // 1. Create PA-nodes for premise preferences (≤')
  for (const pref of theory.knowledgeBase.premisePreferences) {
    const preferredClaim = await getClaimFromFormula(pref.preferred);
    const dispreferredClaim = await getClaimFromFormula(pref.dispreferred);
    
    await prisma.preferenceApplication.create({
      data: {
        deliberationId,
        createdById: userId,
        preferredClaimId: preferredClaim.id,
        dispreferredClaimId: dispreferredClaim.id,
      }
    });
  }
  
  // 2. Create PA-nodes for rule preferences (≤)
  for (const pref of theory.knowledgeBase.rulePreferences) {
    const preferredArg = await getArgumentFromRule(pref.preferred);
    const dispreferredArg = await getArgumentFromRule(pref.dispreferred);
    
    await prisma.preferenceApplication.create({
      data: {
        deliberationId,
        createdById: userId,
        preferredArgumentId: preferredArg.id,
        dispreferredArgumentId: dispreferredArg.id,
      }
    });
  }
}
```

**Complexity**: Medium
- Need formula → claim reverse mapping
- Need rule → argument reverse mapping
- Need to avoid duplicate PA-nodes if already exist

---

## 4. Integration Strategy for Phase 4

### 4.1 Revised Implementation Approach

**Original Roadmap Assumption**: Build preferences from scratch  
**Reality**: Preferences exist in AIF; defeat logic exists in ASPIC+  
**Gap**: No translation layer connecting them

**New Strategy**: Build translation layer as **primary focus**

### 4.2 Minimal Schema Extension

**Add to PreferenceApplication**:
```prisma
model PreferenceApplication {
  // ... existing fields ...
  
  // ASPIC+ ordering metadata (optional - defaults to system-wide policy)
  orderingPolicy  String? // "last-link" | "weakest-link" | null (default)
  setComparison   String? // "elitist" | "democratic" | null (default elitist)
  justification   String? @db.Text
}
```

**Rationale**:
- Most preferences use default ordering policy (system-wide setting)
- Advanced users can override per-preference
- Justification field was missing (PreferenceAttackModal collects it but doesn't save)

### 4.3 Revised Phase Structure

#### Phase 4.1: Translation Layer (3 days) - **PRIMARY WORK**

**Deliverables**:
1. `lib/aspic/translation/aifToASPIC.ts`:
   - `populateKBPreferencesFromAIF()`: Fetch PA-nodes → populate KB
   - `getFormulaFromClaim()`: Claim ID → formula text
   - `getRuleFromArgument()`: Argument ID → Rule object
   - Transitive closure computation (if needed)

2. `lib/aspic/translation/aspicToAIF.ts`:
   - `createPANodesFromASPICPreferences()`: KB prefs → create PA-nodes
   - `getClaimFromFormula()`: Formula text → Claim ID
   - `getArgumentFromRule()`: Rule ID → Argument ID
   - Duplicate detection

3. `lib/aspic/integration.ts`:
   - `evaluateWithAIFPreferences()`: High-level function combining:
     1. Construct arguments
     2. Compute attacks
     3. **Populate KB from PA-nodes** (NEW)
     4. Compute defeats (with ordering policy)
     5. Compute extensions
   - `syncPreferencesToAIF()`: Save KB changes back to AIF

4. Migration:
   - Add `orderingPolicy`, `setComparison`, `justification` to schema
   - Run `npx prisma db push`

**Testing**:
- Unit tests: Translation functions with mock data
- Integration test: Create PA-node → translate → compute defeats → verify correct
- Round-trip test: ASPIC → AIF → ASPIC (preserve preferences)

#### Phase 4.2: API Enhancement (1 day)

**Deliverables**:
1. Update `POST /api/pa`:
   - Add `justification`, `orderingPolicy`, `setComparison` to schema
   - Save to database

2. New `POST /api/aspic/evaluate`:
   ```typescript
   Body: {
     deliberationId: string,
     orderingPolicy?: "last-link" | "weakest-link",
     setComparison?: "elitist" | "democratic"
   }
   Response: {
     arguments: [...],
     defeats: [...],
     groundedExtension: { in, out, undecided },
     metrics: { argumentCount, defeatCount, computationTimeMs }
   }
   ```
   - Calls `evaluateWithAIFPreferences()` internally

3. New `GET /api/arguments/:id/defeats`:
   - Returns defeats on/by specific argument
   - Shows which preferences caused defeats

**Testing**:
- API tests: Create PA-node → evaluate → verify defeats correct
- Performance test: 100+ arguments with 50+ preferences

#### Phase 4.3: UI Enhancement (1.5 days)

**Deliverables**:
1. **Enhance PreferenceAttackModal**:
   - Add ordering policy dropdown (default: system-wide)
   - Add set comparison dropdown (default: elitist)
   - Fix: Send `justification` to API
   - Add preview panel: "This will defeat: X, Y, Z" (calls evaluate API)

2. **Enhance PreferenceBadge**:
   - Add tooltip showing ordering policy details
   - Show effective preference given current policy
   - Click to open preference details modal

3. **New Component: PreferenceDetailsModal**:
   - Show all PA-nodes involving argument
   - Show computed preference ranking
   - Show defeats caused by each preference
   - Link to edit/delete PA-nodes

4. **New Component: OrderingPolicySelector**:
   - Global selector for deliberation-wide policy
   - Options: Last-link vs Weakest-link
   - Options: Elitist vs Democratic
   - Explanation tooltips with examples
   - Preview impact: "This will change N defeats"

**Testing**:
- UI tests: Create preference → verify ordering saved
- UI tests: Change global policy → verify defeats update
- UI tests: Preview shows correct defeats

#### Phase 4.4: Documentation & Examples (0.5 days)

**Deliverables**:
1. User guide: "Understanding Preferences in ASPIC+"
   - Last-link vs weakest-link (with examples)
   - Elitist vs democratic (with examples)
   - When to use each ordering policy
   - Example 33 walkthrough

2. Developer guide: "AIF-ASPIC+ Translation"
   - How translation works
   - Adding new preference types
   - Debugging preference issues

3. API documentation updates

### 4.4 Updated Timeline

| Phase | Original | Revised | Change |
|-------|----------|---------|--------|
| 4.1 Data Model & API | 1 day | - | Removed (schema exists) |
| 4.2 Core Preference Logic | 1.5 days | - | Removed (defeats.ts exists) |
| **4.1 Translation Layer** | - | **3 days** | **New (primary work)** |
| **4.2 API Enhancement** | - | **1 day** | New |
| **4.3 UI Enhancement** | - | **1.5 days** | Replaces old 4.4 |
| **4.4 Documentation** | - | **0.5 days** | New |
| **Total** | **6 days** | **6 days** | Same duration, different focus |

---

## 5. Critical Success Factors

### 5.1 Translation Accuracy

**Risk**: Incorrect mapping between AIF PA-nodes and ASPIC+ preferences  
**Mitigation**:
- Strict adherence to Definition 4.1 and 4.2 from Bex et al.
- Comprehensive unit tests with known examples
- Round-trip tests (AIF → ASPIC → AIF should preserve preferences)
- Validation against Example 33 from Modgil & Prakken

### 5.2 Performance

**Risk**: Translation + evaluation slow for large deliberations  
**Mitigation**:
- Cache translated preferences (invalidate on PA creation/deletion)
- Batch PA-node fetching (single query, not N+1)
- Index optimization on PreferenceApplication queries
- Lazy evaluation (only compute defeats when needed)

### 5.3 Backward Compatibility

**Risk**: Breaking existing AIF workflows  
**Mitigation**:
- Schema changes are additive (new optional fields only)
- Existing PA-nodes work without ordering metadata (use defaults)
- PreferenceAttackModal remains functional without enhancements
- Gradual rollout: Translation → API → UI

### 5.4 User Understanding

**Risk**: Users confused by ordering policies  
**Mitigation**:
- Default to sensible policy (last-link + elitist)
- Hide advanced options behind "Advanced" disclosure
- Inline help tooltips with examples
- Preview panel shows impact before applying
- Comprehensive documentation with use cases

---

## 6. Key Decisions

### 6.1 Ordering Policy Scope

**Decision**: Support both **deliberation-wide** and **per-preference** ordering policies

**Rationale**:
- Most users want consistent policy across deliberation (default)
- Advanced users may want to override for specific preferences
- System-wide default: last-link + elitist (most common)

**Implementation**:
- Global setting: Deliberation metadata or user preferences
- Per-preference override: Optional fields in PreferenceApplication
- Resolution: Per-preference > Deliberation-wide > System default

### 6.2 Set Comparison Default

**Decision**: Default to **elitist** comparison

**Rationale**:
- Currently hardcoded in defeats.ts (line 305: `elitistComparison()`)
- Democratic comparison implemented but unused
- Elitist is more common in literature
- Can expose democratic as advanced option later

**Implementation**:
- Phase 4: Add `setComparison` parameter to `computeDefeats()`
- Phase 4: Expose in API and UI
- Default: "elitist" (backward compatible)

### 6.3 Transitive Closure

**Decision**: Compute transitive closure **on-demand** during translation

**Rationale**:
- PA-nodes represent direct preferences only
- ASPIC+ assumes transitive orderings (A < B, B < C ⟹ A < C)
- Computing at translation time avoids storage duplication

**Implementation**:
- `buildPreferenceMap()` in defeats.ts already handles this (ranking system)
- Translation layer outputs direct pairs; ranking creates transitivity
- No schema changes needed

### 6.4 Justification Storage

**Decision**: Add `justification` field to PreferenceApplication schema

**Rationale**:
- PreferenceAttackModal already collects justification text
- Currently not saved to database (bug)
- AIF paper notes: AIF can express reasons for preferences (ASPIC+ cannot)
- Important for argumentation transparency

**Implementation**:
- Add optional `justification String? @db.Text` field
- Update POST /api/pa to accept and save
- Display in PreferenceBadge tooltip and details modal

---

## 7. Recommendations

### 7.1 Immediate Actions (Before Phase 4.1)

1. **Update Roadmap**: Replace original Phase 4.1-4.2 with revised structure (done in this audit)
2. **Schema Migration**: Add `orderingPolicy`, `setComparison`, `justification` fields
3. **API Bug Fix**: Add `justification` to POST /api/pa schema (PreferenceAttackModal collects it but doesn't send)
4. **Test Data**: Create test PA-nodes for development (Example 33 from paper)

### 7.2 Phase 4.1 Focus Areas

1. **Translation Layer** (70% of effort):
   - `aifToASPIC.ts`: PA-nodes → KB preferences
   - `aspicToAIF.ts`: KB preferences → PA-nodes
   - `integration.ts`: High-level orchestration
   - Comprehensive testing (unit, integration, round-trip)

2. **Mapping Functions** (20% of effort):
   - Claim ↔ Formula bidirectional mapping
   - Argument ↔ Rule bidirectional mapping
   - Handle edge cases (orphan preferences, missing entities)

3. **Documentation** (10% of effort):
   - Code comments explaining Definition 4.1/4.2 implementation
   - Examples in JSDoc
   - Developer guide for future maintainers

### 7.3 Quick Wins

1. **Fix Justification Bug**: 5 minutes
   - Add `justification: z.string().optional()` to CreatePA schema
   - Add `justification: d.justification ?? null` to prisma.create()
   - PreferenceAttackModal already collects it

2. **Expose Democratic Comparison**: 10 minutes
   - Add `setComparison` parameter to `computeDefeats()`
   - Change `elitistComparison()` call to switch statement
   - Already implemented, just not exposed

3. **Add Preference Count API**: 15 minutes
   - `GET /api/arguments/:id/preferences/count` → `{ preferredBy, dispreferredBy }`
   - PreferenceBadge currently passes hardcoded props (should fetch from API)

### 7.4 Future Enhancements (Post-Phase 4)

1. **Preference Visualization**:
   - Graph view of preference orderings (directed graph)
   - Highlight cycles (if any)
   - Show transitive closure visually

2. **Preference Schemes**:
   - Formalize argumentation schemes for preferences (already have PreferenceScheme model)
   - Critical questions for preference justification
   - Scheme templates: "Expert A more credible than B because..."

3. **Conflict Resolution**:
   - Detect conflicting preferences (A < B and B < A)
   - UI to resolve conflicts
   - Weighted preferences (confidence scores)

4. **Bulk Operations**:
   - Import preferences from CSV
   - Apply preference template to multiple pairs
   - Batch preference updates

---

## 8. Conclusion

**Summary**: The existing infrastructure is **more mature than expected**:
- ✅ AIF PA-nodes: Full Prisma schema, UI, API
- ✅ ASPIC+ Defeat Logic: Complete implementation with both orderings
- ❌ **Missing**: Translation layer connecting the two systems

**Phase 4 Strategy**: Focus on **integration, not implementation**
- 70% effort: Translation layer (aifToASPIC, aspicToAIF)
- 20% effort: API and UI enhancements
- 10% effort: Documentation and testing

**Timeline**: 6 days unchanged, but work distribution revised:
- Removed: Data model creation (exists)
- Removed: Core logic implementation (exists)
- Added: Translation layer (critical gap)
- Added: Integration orchestration

**Risk Assessment**: **LOW** - Both systems work independently; integration is well-defined by formal paper

**Confidence Level**: **HIGH** - Clear requirements, existing implementations to build on, formal specification to follow

---

**Audit Complete**: Ready to update roadmap and begin Phase 4.1 development ✅
