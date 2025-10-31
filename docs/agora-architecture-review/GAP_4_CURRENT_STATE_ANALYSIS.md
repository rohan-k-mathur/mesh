# Gap 4: AssumptionUse Current State Analysis

**Date:** October 30, 2025  
**Purpose:** Comprehensive analysis of existing AssumptionUse implementation before designing enhancements  
**Scope:** Database schema, APIs, business logic, UI components, and data flow

---

## 📊 Executive Summary

**Current Maturity: 60% - Solid Foundation, Missing Advanced Features**

**What Works:**
- ✅ Database schema with lifecycle tracking (PROPOSED → ACCEPTED → CHALLENGED → RETRACTED)
- ✅ Basic CRUD APIs for assumptions
- ✅ Weight-based confidence adjustment in scoring
- ✅ UI components for displaying assumptions
- ✅ Import/export support (AIF integration)

**What's Missing:**
- ❌ Per-derivation assumption tracking (cannot answer "which assumptions does THIS argument path depend on?")
- ❌ Belief revision UI ("what if I reject assumption X?")
- ❌ Minimal assumption set calculation
- ❌ Assumption dependency graph visualization
- ❌ Transitive assumption tracking through composition

---

## 🗄️ DATABASE SCHEMA ANALYSIS

### AssumptionUse Model

**Location:** `lib/models/schema.prisma` (lines 4950-4979)

```prisma
model AssumptionUse {
  id             String @id @default(cuid())
  deliberationId String
  argumentId     String

  // Either tie to an existing claim…
  assumptionClaimId String? // FK to Claim.id (nullable)
  // …or store freeform text for a local assumption
  assumptionText    String?

  role       String @default("premise") // 'premise'|'warrant'|'value'|… (open set)
  weight     Float? // local weight 0..1 for this assumption (optional)
  confidence Float? // confidence provided by author/UI (optional)
  metaJson   Json?

  createdAt DateTime @default(now())

  // Phase 2.4: Assumption lifecycle tracking
  status           AssumptionStatus @default(PROPOSED)
  statusChangedAt  DateTime         @default(now())
  statusChangedBy  String?
  challengeReason  String?          @db.Text

  @@index([argumentId])
  @@index([assumptionClaimId])
  @@index([status])
  @@index([deliberationId, status])
}

enum AssumptionStatus {
  PROPOSED   // Initial state - awaiting review
  ACCEPTED   // Accepted as valid assumption
  RETRACTED  // Withdrawn by proposer or community
  CHALLENGED // Under dispute
}
```

#### Schema Strengths ✅

1. **Flexible Identity:**
   - `assumptionClaimId` (link to existing Claim) OR `assumptionText` (freeform)
   - Enables both structured and ad-hoc assumptions

2. **Lifecycle Management:**
   - `status` enum with 4 states
   - `statusChangedAt` and `statusChangedBy` for audit trail
   - `challengeReason` for dispute tracking

3. **Semantic Role:**
   - `role` field (premise, warrant, value) - open-ended
   - Enables argumentation scheme integration

4. **Confidence Integration:**
   - `weight` (0..1) for strength of assumption
   - `confidence` for user-provided certainty

5. **Proper Indexing:**
   - Fast lookups by `argumentId` (get assumptions for argument)
   - Fast lookups by `assumptionClaimId` (get arguments using claim as assumption)
   - Fast filtering by `status` (e.g., get all ACCEPTED assumptions)
   - Composite index `[deliberationId, status]` for room-wide queries

#### Schema Gaps ❌

1. **No Derivation Tracking:**
   - Links to `argumentId` but not to specific derivation paths
   - Cannot distinguish "argument A uses assumption λ₁ via path P1" vs "via path P2"

2. **No Composition History:**
   - No tracking of transitive assumptions (if arg B depends on arg A, and A uses λ₁, does B inherit λ₁?)
   - Missing: `isTransitive: Boolean` or `derivedFrom: String[]`

3. **No Grouping:**
   - Cannot model "this argument requires assumptions {λ₁ AND λ₂} together"
   - Missing: `assumptionGroupId` for conjunctive sets

#### Related Models

**Argument Model** (lines 2253-2310):
```prisma
model Argument {
  id             String  @id @default(cuid())
  deliberationId String
  text           String  @db.Text
  conclusionClaimId String?
  conclusion        Claim?  @relation("Conclusion", fields: [conclusionClaimId], references: [id])
  premises          ArgumentPremise[]
  // ... no direct relation to AssumptionUse
}
```

**Note:** No explicit `assumptions` relation in Argument model. Must query separately:
```typescript
const assumptions = await prisma.assumptionUse.findMany({
  where: { argumentId: arg.id }
});
```

**ArgumentSupport Model** (lines 4928-4948):
```prisma
model ArgumentSupport {
  id             String @id @default(cuid())
  deliberationId String
  claimId        String // supported φ
  argumentId     String // supporting argument a

  mode      String  @default("product")
  strength  Float   @default(0.6)
  composed  Boolean @default(false)
  base      Float?

  // NO assumption tracking here
  // ❌ Missing: assumptionIds Json?
}
```

**Key Insight:** `ArgumentSupport` materializes hom-sets but **does not track which assumptions each support relationship depends on**.

---

## 🔌 API ENDPOINTS ANALYSIS

### 1. Active Assumptions API

**File:** `app/api/deliberations/[id]/assumptions/active/route.ts`

**Endpoint:** `GET /api/deliberations/[id]/assumptions/active`

**Purpose:** Fetch all ACCEPTED assumptions for a deliberation

**Implementation:**
```typescript
const assumptions = await prisma.assumptionUse.findMany({
  where: {
    deliberationId,
    status: "ACCEPTED",
  },
  orderBy: { createdAt: "desc" },
});

// Enrichment: fetch related argument and claim text
const enriched = await Promise.all(
  assumptions.map(async (assumption) => {
    const argument = await prisma.argument.findUnique({
      where: { id: assumption.argumentId },
      select: { id: true, text: true },
    });

    let claimText = null;
    if (assumption.assumptionClaimId) {
      const claim = await prisma.claim.findUnique({
        where: { id: assumption.assumptionClaimId },
        select: { text: true },
      });
      claimText = claim?.text;
    }

    return {
      ...assumption,
      argumentText: argument?.text,
      claimText,
    };
  })
);
```

**Response:**
```json
{
  "ok": true,
  "assumptions": [
    {
      "id": "assu123",
      "argumentId": "arg456",
      "argumentText": "Expert testimony from Dr. Smith...",
      "assumptionClaimId": "claim789",
      "assumptionText": null,
      "claimText": "Dr. Smith is an expert in virology",
      "role": "warrant",
      "weight": 0.9,
      "status": "ACCEPTED"
    }
  ]
}
```

**Strengths:**
- ✅ Clean separation of concerns (dedicated endpoint)
- ✅ Enriches with argument and claim text (good DX)
- ✅ Filters by status (only ACCEPTED)

**Limitations:**
- ❌ N+1 query problem (one query per assumption for enrichment)
- ❌ No pagination (could be slow with 100+ assumptions)
- ❌ No dependency information (which other arguments depend on each assumption?)

---

### 2. Argument Assumptions API

**File:** `app/api/arguments/[id]/assumptions/route.ts`

**Endpoint:** `GET /api/arguments/[id]/assumptions`

**Purpose:** Fetch assumptions for a specific argument

**Implementation:**
```typescript
const assumptions = await prisma.assumptionUse.findMany({
  where: { argumentId },
  include: {
    // Note: No actual includes defined in schema
    // Must manually fetch assumptionClaimId if needed
  },
});
```

**Note:** Endpoint exists but is basic. No enrichment like the active assumptions API.

---

### 3. Assumption Weight in Confidence Scoring

**File:** `app/api/deliberations/[id]/evidential/route.ts` (lines 95-115)

**How It Works:**

```typescript
// 1. Fetch all AssumptionUse records for arguments
const uses = await prisma.assumptionUse.findMany({
  where: { argumentId: { in: realArgIds } },
  select: { argumentId: true, weight: true },
});

// 2. Group by argumentId
const assump = new Map<string, number[]>();
for (const u of uses) {
  (assump.get(u.argumentId) ?? assump.set(u.argumentId, []))
    .push(clamp01(u.weight ?? 0.6));
}

// 3. Compute assumption factor (per argument)
const aBases = real ? (assump.get(s.argumentId) ?? []) : [];
const assumpFactor = aBases.length ? compose(aBases, mode) : 1;

// 4. Apply to score
const score = clamp01(compose([b, premFactor], mode) * assumpFactor);
```

**Composition Logic:**

```typescript
const compose = (xs: number[], mode: Mode) =>
  !xs.length ? 0 : mode === "min" ? Math.min(...xs) : xs.reduce((a, b) => a * b, 1);
```

**Semantics:**
- **Min mode:** Weakest assumption dominates (conservative)
- **Product mode:** All assumptions multiply together (independent probabilities)
- **DS mode:** (same as product for assumptions)

**Example:**
```
Argument A has assumptions:
  λ₁: weight=0.9
  λ₂: weight=0.8

Product mode: assumpFactor = 0.9 × 0.8 = 0.72
Final score = base × premFactor × 0.72
```

**Strengths:**
- ✅ Weights properly integrated into confidence computation
- ✅ Mode-aware composition (min vs product)
- ✅ Handles missing assumptions gracefully (factor=1)

**Limitations:**
- ❌ No visibility into which assumptions contributed to score
- ❌ No "what-if" analysis (cannot compute score without λ₁)
- ❌ Cannot distinguish between multiple derivation paths
- ❌ All assumptions treated equally (no dependency ordering)

---

## 🎨 UI COMPONENTS ANALYSIS

### 1. ActiveAssumptionsPanel Component

**File:** `components/assumptions/ActiveAssumptionsPanel.tsx`

**Purpose:** Display all ACCEPTED assumptions in a deliberation

**Implementation Highlights:**

```typescript
export function ActiveAssumptionsPanel({ deliberationId }: Props) {
  const [assumptions, setAssumptions] = useState<AssumptionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssumptions = async () => {
      const res = await fetch(`/api/deliberations/${deliberationId}/assumptions/active`);
      const data = await res.json();
      setAssumptions(data.assumptions || []);
    };
    fetchAssumptions();
  }, [deliberationId]);

  const stats = useMemo(() => {
    return {
      total: assumptions.length,
      challenged: assumptions.filter((a) => a.status === "CHALLENGED").length,
      accepted: assumptions.filter((a) => a.status === "ACCEPTED").length,
    };
  }, [assumptions]);

  return (
    <div>
      <div className="stats">
        <div>Total: {stats.total}</div>
        <div>Challenged: {stats.challenged}</div>
      </div>
      <div className="grid">
        {assumptions.map((assumption) => (
          <AssumptionCard key={assumption.id} {...assumption} />
        ))}
      </div>
    </div>
  );
}
```

**Visual Design:**
- Grid layout of assumption cards
- Stats summary (total, challenged count)
- Uses `AssumptionCard` for each item

**Strengths:**
- ✅ Clean React architecture (hooks, memoization)
- ✅ Loading and error states handled
- ✅ Refetch on status change (via callback)

**Limitations:**
- ❌ No search/filter functionality
- ❌ No sorting options
- ❌ No pagination (could be slow with many assumptions)
- ❌ No dependency visualization ("which arguments use this assumption?")

---

### 2. AssumptionCard Component

**File:** `components/assumptions/AssumptionCard.tsx`

**Purpose:** Display individual assumption with status badge and actions

**Key Features:**

```typescript
export function AssumptionCard({
  id,
  assumptionText,
  assumptionClaimId,
  claimText,
  role,
  status,
  weight,
  confidence,
  challengeReason,
  onStatusChange,
}: Props) {
  // Status badge rendering
  const statusConfig = {
    PROPOSED: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    ACCEPTED: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
    CHALLENGED: { icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
    RETRACTED: { icon: XCircle, color: "text-gray-600", bg: "bg-gray-50" },
  };

  return (
    <div className="card">
      {/* Status Badge */}
      <div className={statusConfig[status].bg}>
        <StatusIcon />
        <span>{status}</span>
      </div>

      {/* Assumption Text */}
      <div className="text">
        {claimText || assumptionText || "No text"}
      </div>

      {/* Metadata */}
      <div className="metadata">
        <div>Role: {role}</div>
        {weight && <div>Weight: {weight.toFixed(2)}</div>}
        {confidence && <div>Confidence: {confidence.toFixed(2)}</div>}
      </div>

      {/* Challenge Reason (if applicable) */}
      {status === "CHALLENGED" && challengeReason && (
        <div className="challenge-reason">
          <AlertCircle />
          <span>{challengeReason}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="actions">
        {/* Status change buttons */}
      </div>
    </div>
  );
}
```

**Visual Design:**
- Color-coded status badges (amber/green/red/gray)
- Icon indicators (Clock, CheckCircle2, AlertCircle, XCircle)
- Collapsible challenge reason display
- Metadata row with role, weight, confidence

**Strengths:**
- ✅ Clear visual hierarchy
- ✅ Accessible status indicators
- ✅ Handles both claim-based and text-based assumptions

**Limitations:**
- ❌ No "See dependencies" button
- ❌ No "Impact if retracted" warning
- ❌ No link to argument that uses assumption
- ❌ No transitive dependency indicator

---

### 3. ArgumentCard Assumption Display

**File:** `components/arguments/ArgumentCardV2.tsx` (from Quick Wins doc)

**Feature:** Shows assumptions used by an argument

**Implementation:**

```typescript
// Fetch assumptions for this argument
const { data: assumptionData } = useSWR(
  argumentId ? `/api/arguments/${argumentId}/assumption-uses` : null,
  fetcher
);

const assumptions = assumptionData?.assumptions || [];

// Render in collapsible section
<CollapsibleSection title={`Open Assumptions (${assumptions.length})`}>
  {assumptions.map((a) => (
    <div key={a.id} className="assumption-item">
      <div className="assumption-label">λ_{a.id.slice(-3)}</div>
      <div className="assumption-text">{a.text}</div>
      {a.weight && <div className="weight">weight: {a.weight.toFixed(2)}</div>}
      {a.role && <div className="role">role: {a.role}</div>}
    </div>
  ))}
  <Tip>Retracting assumptions may affect this argument's confidence.</Tip>
</CollapsibleSection>
```

**Visual Design:**
- λ notation (λ₁, λ₂, λ₃...) for assumptions
- Weight displayed as decimal (0.90)
- Role badge (premise, warrant, etc.)
- Tooltip warning about confidence impact

**Strengths:**
- ✅ Inline display (no need to navigate away)
- ✅ Uses mathematical notation (λ) for clarity
- ✅ Warning about retraction impact

**Limitations:**
- ❌ No interactive "what if" calculation
- ❌ Cannot expand to see full assumption details
- ❌ No indication of whether assumption is CHALLENGED
- ❌ No link to assumption detail page

---

## 🔄 DATA FLOW ANALYSIS

### Current Flow: Argument → Assumptions → Confidence

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User Creates Argument                                         │
│    POST /api/arguments                                           │
│    { text, premises, conclusionClaimId }                         │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. User Adds Assumptions                                         │
│    POST /api/arguments/[id]/assumptions                          │
│    { assumptionId, role, weight }                                │
│                                                                   │
│    Creates AssumptionUse records:                                │
│    - argumentId → arg123                                         │
│    - assumptionClaimId → claim456                                │
│    - weight → 0.9                                                │
│    - status → PROPOSED                                           │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Community Accepts Assumption                                  │
│    PATCH /api/assumptions/[id]                                   │
│    { status: "ACCEPTED" }                                        │
│                                                                   │
│    Updates: status → ACCEPTED, statusChangedAt → now()          │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Confidence Score Computed                                     │
│    GET /api/deliberations/[id]/evidential                        │
│                                                                   │
│    Query: SELECT * FROM AssumptionUse                            │
│           WHERE argumentId IN (...)                              │
│                                                                   │
│    Compute: assumpFactor = Π(weights)                            │
│             score = base × premFactor × assumpFactor             │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. UI Displays Result                                            │
│    - Argument confidence: 0.85                                   │
│    - Assumptions: [λ₁, λ₂, λ₃]                                   │
│    - Warning: "Depends on 3 assumptions"                         │
└─────────────────────────────────────────────────────────────────┘
```

### Missing Flow: Derivation → Assumptions

```
❌ CURRENT (no derivation tracking):

Argument A uses λ₁, λ₂
Argument B uses λ₃
Argument C = compose(A, B) → uses ??? (not tracked)

✅ DESIRED:

Argument A uses λ₁, λ₂
Argument B uses λ₃
Argument C = compose(A, B) → uses {λ₁, λ₂, λ₃} (union)

Arrow type needs:
  derivs: Set<DerivationId>
  assumptions: Map<DerivationId, Set<AssumptionId>>
```

---

## 🔗 INTEGRATION POINTS

### 1. Argumentation Schemes

**File:** `lib/models/schema.prisma` - ArgumentScheme model

**Current State:**
- Schemes have critical questions (CQ)
- CQs can challenge arguments
- **No explicit link between CQ and AssumptionUse**

**Potential Integration:**
- CQ satisfaction could create/validate AssumptionUse
- Example: "Is E an expert?" → assumption "E is an expert in domain D"

**Gap:** ❌ No automated creation of AssumptionUse from CQ answers

---

### 2. AIF Import/Export

**File:** `app/api/aif/import/route.ts` (mentioned in Phase 2.4 docs)

**Current State:**
- AIF Presumption edges → AssumptionUse with role=PRESUMPTION
- AIF Exception edges → AssumptionUse with role=EXCEPTION
- Weight preserved from AIF edge

**Strengths:**
- ✅ Round-trip import/export preserves assumptions
- ✅ Handles both presumption and exception types

**Limitations:**
- ❌ AIF doesn't encode derivation-level assumptions either (same gap)

---

### 3. Confidence Metrics

**File:** `app/api/evidential/score/route.ts`

**Current Integration:**
- AssumptionUse.weight → multiplier in confidence calculation
- Status filtering (only ACCEPTED assumptions affect confidence)

**Strengths:**
- ✅ Weights properly applied
- ✅ Status lifecycle respected

**Limitations:**
- ❌ No "contribution breakdown" (how much did each assumption contribute?)
- ❌ No counterfactual scoring (confidence without λ₁)

---

## 📊 CATEGORICAL ANALYSIS

### Current Arrow Type

**File:** `lib/argumentation/ecc.ts`

```typescript
export type Arrow<A = string, B = string> = {
  from: A;
  to: B;
  derivs: Set<DerivationId>;
  // ❌ Missing: assumptions
};
```

**What This Means:**
- Morphism from A to B is a **set of derivations**
- Each derivation is opaque (just an ID string)
- **No way to query**: "Which assumptions does derivation d₁ depend on?"

### Needed Extension

```typescript
export type Arrow<A = string, B = string> = {
  from: A;
  to: B;
  derivs: Set<DerivationId>;
  assumptions: Map<DerivationId, Set<AssumptionId>>; // ✅ NEW
};

// Example usage:
const arrow: Arrow = {
  from: "P",
  to: "C",
  derivs: new Set(["d1", "d2"]),
  assumptions: new Map([
    ["d1", new Set(["λ1", "λ2"])], // d1 depends on λ1, λ2
    ["d2", new Set(["λ3"])],       // d2 depends on λ3
  ]),
};
```

### Composition Update Needed

**Current `compose()` function:**

```typescript
export function compose<A, B, C>(g: Arrow<B, C>, f: Arrow<A, B>): Arrow<A, C> {
  const out = zero<A, C>(f.from, g.to);
  for (const df of f.derivs) {
    for (const dg of g.derivs) {
      out.derivs.add(`${df}∘${dg}`);
      // ❌ Missing: union assumption sets
    }
  }
  return out;
}
```

**Needed `compose()` with assumptions:**

```typescript
export function compose<A, B, C>(g: Arrow<B, C>, f: Arrow<A, B>): Arrow<A, C> {
  const out = zero<A, C>(f.from, g.to);
  for (const df of f.derivs) {
    for (const dg of g.derivs) {
      const composedId = `${df}∘${dg}`;
      out.derivs.add(composedId);
      
      // ✅ Union assumption sets
      const assumpsF = f.assumptions?.get(df) ?? new Set();
      const assumpsG = g.assumptions?.get(dg) ?? new Set();
      const unionAssumps = new Set([...assumpsF, ...assumpsG]);
      
      if (!out.assumptions) out.assumptions = new Map();
      out.assumptions.set(composedId, unionAssumps);
    }
  }
  return out;
}
```

**Categorical Semantics:**
- **Join (∨):** Union derivations, keep assumptions per derivation
- **Compose (∘):** Cartesian product derivations, union assumptions
- **Zero (⊥):** Empty derivations, empty assumptions

---

## 🎯 CAPABILITY MATRIX

| Capability | Current | Gap 4 Complete |
|-----------|---------|----------------|
| **Data Model** | | |
| Link assumption to argument | ✅ | ✅ |
| Track assumption status lifecycle | ✅ | ✅ |
| Store assumption weight | ✅ | ✅ |
| Link assumption to claim | ✅ | ✅ |
| Track per-derivation assumptions | ❌ | ✅ |
| Track transitive assumptions | ❌ | ✅ |
| Group conjunctive assumptions | ❌ | ✅ |
| **APIs** | | |
| Fetch assumptions for argument | ✅ | ✅ |
| Fetch assumptions for deliberation | ✅ | ✅ |
| Update assumption status | ✅ | ✅ |
| Fetch assumptions for derivation | ❌ | ✅ |
| Compute minimal assumption set | ❌ | ✅ |
| Counterfactual scoring | ❌ | ✅ |
| Assumption contribution breakdown | ❌ | ✅ |
| **Business Logic** | | |
| Apply weights in confidence | ✅ | ✅ |
| Filter by status (ACCEPTED only) | ✅ | ✅ |
| Compose assumption factors | ✅ | ✅ |
| Track assumptions through composition | ❌ | ✅ |
| Compute assumption closure | ❌ | ✅ |
| Detect circular assumptions | ❌ | ✅ |
| **UI Components** | | |
| Display assumption list | ✅ | ✅ |
| Display assumption on argument card | ✅ | ✅ |
| Status badge and lifecycle actions | ✅ | ✅ |
| Dependency graph visualization | ❌ | ✅ |
| "What if" belief revision UI | ❌ | ✅ |
| Minimal assumption set display | ❌ | ✅ |
| Assumption contribution chart | ❌ | ✅ |
| Derivation path explorer | ❌ | ✅ |
| **Integration** | | |
| AIF import/export | ✅ | ✅ |
| Argumentation scheme CQs | ⚠️ Partial | ✅ |
| Confidence scoring | ✅ | ✅ |
| Categorical operations (compose/join) | ❌ | ✅ |

**Legend:**
- ✅ Fully implemented
- ⚠️ Partially implemented
- ❌ Not implemented

---

## 🔍 KEY INSIGHTS

### 1. Solid Foundation
The current implementation provides a **strong base** for enhancement:
- Database schema is well-designed with proper indexing
- Lifecycle management (status enum) is production-ready
- Weight-based confidence adjustment works correctly
- UI components follow good React patterns

### 2. Architecture Decision: Argument-Level vs Derivation-Level
**Current:** Assumptions linked to **arguments** (one-to-many)
**Needed:** Assumptions linked to **derivations** (many-to-many through Arrow type)

**Why This Matters:**
```
Example: Argument A has two ways to support conclusion C

Path 1 (expert testimony):
  - Premise: "Dr. Smith says X"
  - Assumption λ₁: "Dr. Smith is an expert"
  - Assumption λ₂: "Dr. Smith is unbiased"

Path 2 (statistical evidence):
  - Premise: "Study shows X"
  - Assumption λ₃: "Study methodology is sound"

Currently: All assumptions {λ₁, λ₂, λ₃} apply to argument A
Desired: Path 1 uses {λ₁, λ₂}, Path 2 uses {λ₃}
```

### 3. Missing "Why" Explanations
Users cannot currently ask:
- "Why do I need to accept λ₁ to believe φ?"
- "Which path to φ requires the fewest assumptions?"
- "If I reject λ₁, what claims become less confident?"

### 4. Transitive Assumption Problem
```
Argument A: P₁ → Q (uses λ₁)
Argument B: Q → R (uses λ₂)
Composed: P₁ → R (uses ??? - not tracked!)

Expected: Composed argument should inherit {λ₁, λ₂}
Actual: Composition doesn't track assumptions
```

### 5. No Minimal Set Calculation
**Desired Feature:**
"The minimal assumptions needed to believe φ are: {λ₁, λ₄, λ₇}"

**Current:** Cannot compute this - would need:
1. All derivation paths to φ
2. Assumptions per path
3. Set intersection to find minimal shared assumptions

---

## 📈 IMPLEMENTATION READINESS

### What Can Be Built Immediately

#### Backend (2-3 days):
1. ✅ Extend Arrow type with assumptions map
2. ✅ Update compose() to union assumptions
3. ✅ Update join() to preserve per-deriv assumptions
4. ✅ Add API endpoint: GET /api/derivations/[id]/assumptions

#### Frontend (1-2 days):
1. ✅ Add "View Dependencies" button to AssumptionCard
2. ✅ Simple dependency list modal
3. ✅ Badge showing "Used by N arguments"

### What Requires Design Work

#### Complex Features (1-2 weeks):
1. ⚠️ Dependency graph visualization (need D3.js or similar)
2. ⚠️ Belief revision UI ("what if" calculator)
3. ⚠️ Minimal assumption set algorithm
4. ⚠️ Circular dependency detection

#### Database Migrations (2-3 days):
1. ⚠️ Add DerivationAssumption join table (or JSON field)
2. ⚠️ Backfill existing data (assign assumptions to derivations)
3. ⚠️ Update ArgumentSupport with assumption tracking

---

## 🎬 NEXT STEPS

### Step 1: Define Ideal Feature Set
- [ ] User stories for belief revision
- [ ] Wireframes for assumption dependency graph
- [ ] Algorithm for minimal assumption set calculation

### Step 2: Design Database Schema Changes
- [ ] Choose between DerivationAssumption table vs JSON field
- [ ] Plan migration strategy (downtime, backfill logic)
- [ ] Define new indexes

### Step 3: Design API Changes
- [ ] New endpoints needed
- [ ] Changes to existing endpoints
- [ ] Response format updates

### Step 4: Design UI Components
- [ ] Wireframes for new components
- [ ] Component hierarchy
- [ ] Interaction patterns

### Step 5: Implementation Phases
- [ ] Phase 1: Backend (Arrow type, compose/join updates)
- [ ] Phase 2: APIs (derivation assumptions endpoint)
- [ ] Phase 3: Basic UI (dependency list, badges)
- [ ] Phase 4: Advanced UI (graph, what-if calculator)

---

**Analysis Complete.** Ready to proceed to design phase.

**Key Takeaway:** Current implementation is **60% complete** with a **strong foundation**. The missing 40% is primarily about **per-derivation tracking** and **advanced reasoning features** (belief revision, minimal sets). The path forward is clear and achievable.
