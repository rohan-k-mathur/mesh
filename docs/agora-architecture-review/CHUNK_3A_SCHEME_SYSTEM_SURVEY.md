# CHUNK 3A: Scheme System - Exploratory Survey

**Survey Date:** October 31, 2025  
**Purpose:** Understand current scheme system architecture before implementing Gaps 3-5  
**Focus Areas:**  
- Gap 3: Database-driven custom scheme creation  
- Gap 4: Scheme composition for complex arguments  
- Gap 5: Automatic CQ generation from taxonomy  

---

## 📋 Executive Summary

### Current State
The scheme system has a **hybrid architecture**:
- ✅ **Database model** (ArgumentScheme) with rich Macagno taxonomy fields
- ⚠️ **Hardcoded inference** (lib/argumentation/criticalQuestions.ts) with only 4 schemes
- ✅ **Seed script** (scripts/schemes.seed.ts) with 7 schemes
- ✅ **Auto-inference** (lib/argumentation/schemeInference.ts) via regex heuristics
- ⚠️ **No UI** for creating custom schemes (selection only via SchemeComposerPicker)

### Key Finding
**The infrastructure for custom schemes EXISTS but is DISCONNECTED:**
- Database supports unlimited schemes with CQs
- Seed script manually defines 7 schemes
- Hardcoded util (criticalQuestions.ts) only knows about 4 schemes
- No admin UI to create schemes → manual DB inserts or seed script modifications only

### Recommendation
**Migration Strategy:**
1. **Phase 1 (Quick Win):** Refactor criticalQuestions.ts to query database  
2. **Phase 2 (Custom Schemes):** Build admin UI for scheme creation  
3. **Phase 3 (Taxonomy CQs):** Implement automatic CQ generation  
4. **Phase 4 (Composition):** Add multi-scheme argument support  

---

## 🗂️ Architecture Components

### 1. Database Schema (Prisma)

#### ArgumentScheme Model
**Location:** `lib/models/schema.prisma` lines 3237-3262

```prisma
model ArgumentScheme {
  id          String  @id @default(cuid())
  key         String  @unique
  name        String?
  description String?
  title       String?
  summary     String

  cq             Json             @default("{}") // CQ array
  SchemeInstance SchemeInstance[]

  // Macagno taxonomy (6 dimensions):
  purpose          String? // 'action' | 'state_of_affairs'
  source           String? // 'internal' | 'external'
  materialRelation String? // 'cause' | 'definition' | 'analogy' | 'authority'
  reasoningType    String? // 'deductive' | 'inductive' | 'abductive' | 'practical'
  ruleForm         String? // 'MP' | 'MT' | 'defeasible_MP'
  conclusionType   String? // 'ought' | 'is'
  
  slotHints        Json? // UI slot descriptions
  variants         SchemeVariant[]
  cqs              CriticalQuestion[]
  validators       Json? // CAS2-style validators including baseConfidence
  
  Argument         Argument[]
}
```

**Key Observations:**
- ✅ **Rich taxonomy** - All 6 Macagno dimensions present
- ✅ **Flexible CQ storage** - Both `cq` JSON field and `cqs` relation
- ✅ **Validators** - Can specify `baseConfidence`, slot requirements, etc.
- ✅ **Relations** - Connected to Argument, SchemeInstance, CriticalQuestion

**Current Usage:**
- 7 schemes seeded via `scripts/schemes.seed.ts`
- Schemes can be created via `POST /api/aif/schemes` but no UI exists
- Arguments reference schemes via `Argument.schemeId` (nullable)

---

#### CriticalQuestion Model
**Location:** `lib/models/schema.prisma` lines 3448-3474

```prisma
model CriticalQuestion {
  id           String          @id @default(cuid())
  instanceId   String?
  schemeId     String?
  scheme       ArgumentScheme? @relation(fields: [schemeId], references: [id])
  cqKey        String?
  cqId         String?
  text         String
  attackKind   String // 'UNDERMINES'|'UNDERCUTS'|'REBUTS'
  status       String // 'open'|'addressed'|'counter-posted'
  
  // Attack semantics:
  attackType   AttackType? // REBUTS | UNDERCUTS | UNDERMINES
  targetScope  TargetScope? // conclusion | inference | premise
  
  instance     SchemeInstance? @relation(...)
  @@unique([schemeId, cqKey])
}
```

**Key Observations:**
- ✅ **Attack semantics** - Full Pollock/Prakken taxonomy
- ✅ **Scheme linkage** - Each CQ belongs to a scheme
- ✅ **Unique constraint** - (schemeId, cqKey) prevents duplicates

---

### 2. Hardcoded Inference (Legacy)

#### lib/argumentation/criticalQuestions.ts
**Lines:** 76 total  
**Problem:** Hardcoded 4 schemes only

```typescript
export type SchemeId = 'ExpertOpinion' | 'Consequences' | 'Analogy' | 'Sign';

const CQS: Record<SchemeId, CriticalQuestion[]> = {
  ExpertOpinion: [
    { id: 'eo-1', text: 'Is the cited person a genuine expert...', severity: 'high' },
    // ... 5 CQs total
  ],
  Consequences: [ /* 4 CQs */ ],
  Analogy: [ /* 2 CQs */ ],
  Sign: [ /* 2 CQs */ ],
};

export function inferSchemesFromText(text: string): SchemeId[] {
  // Regex heuristics:
  if (/(phd|m\.?d\.?|prof|dr\.|licensed)/i.test(text)) return ['ExpertOpinion'];
  if (/(cost[-\s]?benefit|economic|security)/i.test(text)) return ['Consequences'];
  if (/\b(like|similar to|as if)\b/i.test(text)) return ['Analogy'];
  if (/\b(sign|indicator|symptom)\b/i.test(text)) return ['Sign'];
  return ['Consequences']; // default fallback
}

export function questionsForScheme(s: SchemeId): CriticalQuestion[] {
  return CQS[s] || [];
}
```

**Issues:**
- ❌ Only 4 schemes (DB has 7 seeded + could have more)
- ❌ Not connected to database
- ❌ Duplicates data (CQs defined both here and in seed script)
- ⚠️ Regex inference is brittle (but functional for 4 schemes)

**Where Used:**
- `lib/argumentation/schemeInference.ts` calls `inferSchemesFromText()`
- `app/api/arguments/route.ts` uses `inferAndAssignScheme()` for auto-scheme assignment

---

### 3. Seed Script (Current Scheme Source)

#### scripts/schemes.seed.ts
**Lines:** 193 total  
**Schemes Defined:** 7

```typescript
const SEEDS: SchemeSeed[] = [
  {
    key: "expert_opinion",
    name: "Argument from Expert Opinion",
    purpose: "state_of_affairs",
    source: "external",
    materialRelation: "authority",
    reasoningType: "abductive",
    ruleForm: "defeasible_MP",
    cqs: [
      { cqKey: "domain_fit", text: "Is E an expert in D?", attackType: "UNDERCUTS", targetScope: "inference" },
      { cqKey: "consensus",  text: "Do experts in D disagree on φ?", attackType: "UNDERCUTS", targetScope: "inference" },
      { cqKey: "bias",       text: "Is E biased?", attackType: "UNDERCUTS", targetScope: "inference" },
      { cqKey: "basis",      text: "Is E's assertion based on evidence?", attackType: "UNDERMINES", targetScope: "premise" },
    ],
  },
  {
    key: "practical_reasoning",
    // ... Goal→Means→Ought pattern
  },
  {
    key: "positive_consequences",
    // ... If A, then good consequences
  },
  {
    key: "negative_consequences",
    // ... If A, then bad consequences
  },
  {
    key: "analogy",
    // ... X is like Y
  },
  {
    key: "causal",
    // ... If cause, then effect
  },
  {
    key: "classification",
    // ... X belongs to category C
  },
];
```

**Observations:**
- ✅ **Macagno taxonomy** - All dimensions filled
- ✅ **Attack semantics** - Each CQ has attackType and targetScope
- ✅ **Proper CQ keys** - domain_fit, consensus, bias, etc.
- ⚠️ **Manual process** - Adding schemes requires editing this file + running seed

**Discrepancy:**
- Seed has 7 schemes
- Hardcoded util (criticalQuestions.ts) only knows 4
- **Result:** Arguments can be assigned 7 schemes, but only 4 are auto-inferred from text

---

### 4. Scheme Inference (Auto-Assignment)

#### lib/argumentation/schemeInference.ts
**Lines:** 54 total

```typescript
export async function inferAndAssignScheme(
  argumentText: string,
  conclusionText?: string
): Promise<string | null> {
  const combined = [argumentText, conclusionText].filter(Boolean).join(' ');

  // Uses hardcoded inferSchemesFromText() → only 4 schemes
  let schemes = inferSchemesFromText(combined);

  // Default fallback
  if (schemes.length === 0) {
    schemes.push('Consequences'); // most general scheme
  }

  // Lookup scheme row by key (converts 'ExpertOpinion' → DB ID)
  const schemeRow = await prisma.argumentationScheme.findFirst({
    where: { key: schemes[0] },
    select: { id: true, key: true }
  });

  return schemeRow?.id ?? null;
}
```

**Where Called:**
- `app/api/arguments/route.ts` POST handler (line 94-98)
- When creating argument without explicit `schemeId`

**Problem:**
- Uses hardcoded `inferSchemesFromText()` with only 4 schemes
- Cannot infer `practical_reasoning`, `causal`, or `classification` (which exist in DB)

---

### 5. API Endpoints

#### GET /api/schemes
**Location:** `app/api/schemes/route.ts`  
**Purpose:** List available schemes for UI selection

```typescript
export async function GET(_: NextRequest) {
  const db = await prisma.argumentScheme.findMany({
    orderBy: { key: 'asc' },
    select: { id:true, key:true, name:true, slotHints:true, cqs:true }
  });
  
  // Fallback to hardcoded if DB empty
  const builtins = [{ id: 'builtin:expert-opinion', key: 'expert_opinion', ... }];
  const items = db.length ? db : builtins;
  
  return NextResponse.json({ items });
}
```

**Observations:**
- ✅ Queries database dynamically
- ⚠️ Has hardcoded fallback (redundant if seed script ran)

---

#### GET /api/aif/schemes
**Location:** `app/api/aif/schemes/route.ts`  
**Purpose:** AIF-compatible scheme listing with auto-seeding

```typescript
export async function GET(req: Request) {
  const url = new URL(req.url);
  const ensure = url.searchParams.get('ensure') === '1';

  if (ensure) {
    // Auto-seed expert_opinion and bare_assertion if DB empty
    const hasAny = await prisma.argumentScheme.count();
    if (!hasAny) {
      await prisma.argumentScheme.create({ /* expert_opinion */ });
    }
    await prisma.argumentScheme.upsert({ /* bare_assertion */ });
  }

  const rows = await prisma.argumentScheme.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json({ ok: true, items: rows.map(normalize) });
}
```

**Features:**
- ✅ Auto-seeding via `?ensure=1` query param
- ✅ Normalizes CQ format (converts `cq.questions` array to structured CQs)
- ⚠️ Only seeds 2 schemes (expert_opinion, bare_assertion)

---

### 6. UI Components

#### SchemeComposerPicker
**Location:** `components/SchemeComposerPicker.tsx`  
**Purpose:** Search and select existing entities (claims, arguments, rooms, sheets)  
**Problem:** Despite name, does NOT pick schemes!

```tsx
export function SchemeComposerPicker({
  kind, open, onClose, onPick
}: { kind: 'claim'|'argument'|'room'|'sheet'; ... }) {
  // Searches via /api/kb/entity-search?k=${kind}&q=${query}
  // Returns matching entities for insertion
}
```

**Observations:**
- ❌ **Misleading name** - Does NOT handle scheme selection
- ✅ Reusable picker pattern (could be adapted for schemes)
- ✅ Used by CriticalQuestionsV2/V3 for attaching existing claims

**Scheme Selection Pattern (where it IS used):**
```typescript
// In argument creation:
const schemes = await fetch('/api/schemes').then(r => r.json());
// User picks from dropdown → schemeId sent to POST /api/arguments
```

**Missing:**
- ❌ No UI to **create** new schemes
- ❌ No scheme **editor** (name, CQs, taxonomy fields)
- ❌ No CQ **builder** for custom questions

---

#### CriticalQuestionsV2/V3
**Location:** `components/claims/CriticalQuestionsV2.tsx` (88 lines), `CriticalQuestionsV3.tsx` (115 lines)  
**Purpose:** Display and interact with CQs for claims/arguments

**Features:**
- ✅ Shows CQs grouped by scheme
- ✅ Toggle CQ status (open → satisfied)
- ✅ Attach existing claims as CQ responses
- ✅ SchemeComposerPicker integration for claim attachment

**Limitations:**
- ⚠️ Displays schemes from database (good!)
- ❌ No way to add CQs to a scheme (read-only view)

---

## 🔍 Data Flow Analysis

### Argument Creation Flow

```
1. User creates argument in UI
   ↓
2. POST /api/arguments
   {
     deliberationId, authorId, conclusionClaimId,
     premiseClaimIds, text, implicitWarrant,
     schemeId?: string, // optional
     slots?: Record<string, string> // role→claimId mapping
   }
   ↓
3. If no schemeId provided:
   inferAndAssignScheme(text, conclusionText)
   ↓ calls
   inferSchemesFromText(combined) // ❌ HARDCODED 4 SCHEMES
   ↓ returns
   ['ExpertOpinion'|'Consequences'|'Analogy'|'Sign']
   ↓
   prisma.argumentationScheme.findFirst({ where: { key: schemes[0] } })
   ↓ returns DB ID
   ↓
4. Argument.create({ schemeId: dbId, ... })
   ↓
5. Seed CQ rows:
   const sc = await prisma.argumentScheme.findUnique({
     where: { id: schemeId },
     select: { key: true, cqs: { select: { cqKey: true } } }
   });
   
   await prisma.cQStatus.createMany({
     data: sc.cqs.map(c => ({
       targetType: "argument",
       targetId: argId,
       schemeKey: sc.key,
       cqKey: c.cqKey,
       satisfied: false,
       createdById: authorId
     }))
   });
```

**Bottleneck:**
- Step 3: `inferSchemesFromText()` only knows 4 schemes
- Even though DB has 7 schemes, only 4 can be auto-assigned

---

### CQ Display Flow

```
1. User opens CQ modal (ArgumentCriticalQuestionsModal or claim CQ dialog)
   ↓
2. CriticalQuestionsV2 component fetches:
   GET /api/claims/[id]/cq/summary
   OR
   (argument-specific endpoint if targetType="argument")
   ↓
3. API returns:
   {
     schemes: [
       {
         schemeKey: "expert_opinion",
         required: 4, // total CQs
         satisfied: 2, // answered CQs
         open: 2, // unanswered
         cqs: [
           { key: "domain_fit", text: "Is E an expert in D?", satisfied: true, ... },
           { key: "consensus", text: "Do experts disagree?", satisfied: false, ... }
         ]
       }
     ]
   }
   ↓
4. UI renders scheme groups + CQ checkboxes
   ↓
5. User toggles CQ → POST /api/arguments/[id]/cqs/[cqKey]/toggle
   ↓
6. Updates CQStatus.satisfied field
```

**Observations:**
- ✅ CQ data comes from database (dynamic)
- ✅ Supports multiple schemes per target
- ⚠️ No way to add NEW CQs to existing scheme

---

## 🚧 Identified Gaps (Detailed)

### Gap 3: Hardcoded Inference (MEDIUM Priority)

**Problem:**
- `lib/argumentation/criticalQuestions.ts` hardcodes 4 schemes
- `inferSchemesFromText()` uses brittle regex patterns
- Cannot detect 3 schemes that exist in DB (practical_reasoning, causal, classification)

**Impact:**
- Arguments using those 3 schemes must have schemeId set manually
- Auto-inference misses valid schemes

**Solution:**
```typescript
// NEW: lib/argumentation/schemeInference.ts (refactored)

export async function inferSchemesFromText(text: string): Promise<string[]> {
  // Fetch all schemes from DB with taxonomy
  const schemes = await prisma.argumentScheme.findMany({
    select: {
      id: true,
      key: true,
      materialRelation: true,
      reasoningType: true,
      source: true
    }
  });

  // Score each scheme based on heuristics
  const scores = schemes.map(s => ({
    scheme: s,
    score: calculateSchemeScore(text, s)
  }));

  // Sort by score, return top matches
  scores.sort((a, b) => b.score - a.score);
  return scores.filter(s => s.score > 0.3).map(s => s.scheme.key);
}

function calculateSchemeScore(text: string, scheme: ArgumentScheme): number {
  let score = 0;
  const lower = text.toLowerCase();

  // Taxonomy-based scoring:
  if (scheme.materialRelation === 'authority') {
    if (/(phd|dr\.|prof|expert|study|research)/i.test(text)) score += 0.5;
  }
  if (scheme.materialRelation === 'cause') {
    if (/(because|therefore|thus|leads to|causes)/i.test(text)) score += 0.4;
  }
  if (scheme.materialRelation === 'analogy') {
    if (/(like|similar|resembles|as if|comparable)/i.test(text)) score += 0.5;
  }
  if (scheme.reasoningType === 'practical') {
    if (/(should|ought|must|goal|action|policy)/i.test(text)) score += 0.4;
  }
  if (scheme.source === 'external') {
    if (/(according to|cited|claims|states)/i.test(text)) score += 0.3;
  }

  return score;
}
```

**Benefits:**
- ✅ Scales to unlimited schemes
- ✅ Uses existing taxonomy fields
- ✅ More flexible scoring than exact regex
- ✅ Returns ranked matches (top N schemes)

**Effort:** 4-6 hours (refactor + tests)

---

### Gap 4: No Custom Scheme Creation UI (HIGH Priority for scaling)

**Problem:**
- Only way to add schemes: edit seed script + rerun
- No admin UI for power users to create schemes
- Cannot define schemes for domain-specific use cases

**Missing Components:**

#### 1. Scheme Creator UI
```tsx
// NEW: components/admin/SchemeCreator.tsx

interface SchemeForm {
  key: string;
  name: string;
  summary: string;
  
  // Macagno taxonomy:
  purpose: 'action' | 'state_of_affairs';
  source: 'internal' | 'external';
  materialRelation: string; // dropdown: 'cause', 'authority', 'analogy', etc.
  reasoningType: 'deductive' | 'inductive' | 'abductive' | 'practical';
  ruleForm: string; // 'MP', 'MT', 'defeasible_MP', etc.
  conclusionType?: 'ought' | 'is';
  
  // CQ builder:
  cqs: Array<{
    cqKey: string;
    text: string;
    attackType: 'REBUTS' | 'UNDERCUTS' | 'UNDERMINES';
    targetScope: 'conclusion' | 'inference' | 'premise';
  }>;
  
  // Optional:
  validators?: {
    baseConfidence?: number; // 0.0-1.0
    slots?: Record<string, { expects?: string; required?: boolean }>;
  };
}

export function SchemeCreator({ onSave }: { onSave: (scheme: SchemeForm) => void }) {
  const [form, setForm] = useState<SchemeForm>({ /* defaults */ });
  const [cqs, setCqs] = useState<CQForm[]>([]);

  const addCQ = () => {
    setCqs([...cqs, { cqKey: '', text: '', attackType: 'UNDERCUTS', targetScope: 'inference' }]);
  };

  const removeCQ = (index: number) => {
    setCqs(cqs.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const payload = { ...form, cqs };
    const res = await fetch('/api/schemes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const saved = await res.json();
      onSave(saved);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2>Create Custom Scheme</h2>
      
      {/* Basic Fields */}
      <div className="space-y-4">
        <input
          placeholder="Scheme Key (e.g., 'expert_opinion')"
          value={form.key}
          onChange={e => setForm({ ...form, key: e.target.value })}
        />
        <input
          placeholder="Scheme Name (e.g., 'Argument from Expert Opinion')"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
        />
        <textarea
          placeholder="Summary"
          value={form.summary}
          onChange={e => setForm({ ...form, summary: e.target.value })}
        />
      </div>

      {/* Taxonomy Section */}
      <div className="mt-6">
        <h3>Macagno Taxonomy</h3>
        <div className="grid grid-cols-2 gap-4">
          <select
            value={form.purpose}
            onChange={e => setForm({ ...form, purpose: e.target.value as any })}
          >
            <option value="action">Action</option>
            <option value="state_of_affairs">State of Affairs</option>
          </select>
          
          <select
            value={form.source}
            onChange={e => setForm({ ...form, source: e.target.value as any })}
          >
            <option value="internal">Internal</option>
            <option value="external">External</option>
          </select>
          
          <select
            value={form.materialRelation}
            onChange={e => setForm({ ...form, materialRelation: e.target.value })}
          >
            <option value="cause">Cause</option>
            <option value="authority">Authority</option>
            <option value="analogy">Analogy</option>
            <option value="definition">Definition</option>
            <option value="practical">Practical</option>
          </select>
          
          <select
            value={form.reasoningType}
            onChange={e => setForm({ ...form, reasoningType: e.target.value as any })}
          >
            <option value="deductive">Deductive</option>
            <option value="inductive">Inductive</option>
            <option value="abductive">Abductive</option>
            <option value="practical">Practical</option>
          </select>
        </div>
      </div>

      {/* CQ Builder */}
      <div className="mt-6">
        <h3>Critical Questions</h3>
        {cqs.map((cq, i) => (
          <div key={i} className="border p-4 rounded mb-2">
            <input
              placeholder="CQ Key (e.g., 'domain_fit')"
              value={cq.cqKey}
              onChange={e => {
                const updated = [...cqs];
                updated[i].cqKey = e.target.value;
                setCqs(updated);
              }}
            />
            <textarea
              placeholder="CQ Text (e.g., 'Is E an expert in D?')"
              value={cq.text}
              onChange={e => {
                const updated = [...cqs];
                updated[i].text = e.target.value;
                setCqs(updated);
              }}
            />
            <div className="flex gap-2 mt-2">
              <select
                value={cq.attackType}
                onChange={e => {
                  const updated = [...cqs];
                  updated[i].attackType = e.target.value as any;
                  setCqs(updated);
                }}
              >
                <option value="REBUTS">Rebuts (conclusion)</option>
                <option value="UNDERCUTS">Undercuts (inference)</option>
                <option value="UNDERMINES">Undermines (premise)</option>
              </select>
              <button onClick={() => removeCQ(i)}>Remove</button>
            </div>
          </div>
        ))}
        <button onClick={addCQ}>+ Add Critical Question</button>
      </div>

      {/* Actions */}
      <div className="mt-6 flex gap-2">
        <button onClick={handleSubmit}>Save Scheme</button>
        <button onClick={() => window.history.back()}>Cancel</button>
      </div>
    </div>
  );
}
```

#### 2. Scheme Management API
```typescript
// NEW: app/api/schemes/route.ts (POST handler)

export async function POST(req: NextRequest) {
  const user = await getUserFromCookies();
  if (!user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const body = await req.json();
  const { key, name, summary, purpose, source, materialRelation, reasoningType, ruleForm, conclusionType, cqs, validators } = body;

  // Validate key uniqueness
  const existing = await prisma.argumentScheme.findUnique({ where: { key } });
  if (existing) {
    return NextResponse.json({ error: 'Scheme key already exists' }, { status: 409 });
  }

  // Create scheme
  const scheme = await prisma.argumentScheme.create({
    data: {
      key,
      name,
      summary,
      purpose,
      source,
      materialRelation,
      reasoningType,
      ruleForm,
      conclusionType,
      validators: validators ?? {},
      cq: { questions: cqs.map((c: any) => c.text) }, // Legacy format
    }
  });

  // Create CQ rows
  for (const cq of cqs) {
    await prisma.criticalQuestion.create({
      data: {
        schemeId: scheme.id,
        cqKey: cq.cqKey,
        text: cq.text,
        attackType: cq.attackType,
        targetScope: cq.targetScope,
        attackKind: cq.attackType, // Legacy field
        status: 'OPEN'
      }
    });
  }

  return NextResponse.json({ ok: true, scheme });
}
```

**Effort:** 12-16 hours (UI + API + validation + tests)

---

### Gap 5: No Automatic CQ Generation (LOW Priority, future feature)

**Problem:**
- CQs manually defined per scheme
- Taxonomy fields not used for CQ generation
- Doesn't scale to hundreds of schemes

**Research Foundation:**
Macagno et al. propose that taxonomy enables automatic CQ generation:

| Taxonomy Field | Generated CQ |
|----------------|--------------|
| source='external' | "Is the source credible?" |
| materialRelation='cause' | "Are there confounders?", "Is the correlation strong?" |
| reasoningType='abductive' | "Are there alternative explanations?" |
| reasoningType='practical' | "Are there better alternatives?" |
| conclusionType='ought' | "Are the value trade-offs acceptable?" |

**Implementation:**
```typescript
// NEW: lib/argumentation/cqGeneration.ts

type CQTemplate = {
  condition: (scheme: ArgumentScheme) => boolean;
  cq: {
    cqKey: string;
    text: string;
    attackType: AttackType;
    targetScope: TargetScope;
  };
};

const CQ_TEMPLATES: CQTemplate[] = [
  {
    condition: (s) => s.source === 'external',
    cq: {
      cqKey: 'source_credible',
      text: 'Is the source credible and unbiased?',
      attackType: 'UNDERCUTS',
      targetScope: 'inference'
    }
  },
  {
    condition: (s) => s.materialRelation === 'cause',
    cq: {
      cqKey: 'confounders',
      text: 'Are there confounding factors?',
      attackType: 'UNDERCUTS',
      targetScope: 'inference'
    }
  },
  {
    condition: (s) => s.materialRelation === 'cause',
    cq: {
      cqKey: 'correlation_strength',
      text: 'Is the causal link strong enough?',
      attackType: 'UNDERMINES',
      targetScope: 'premise'
    }
  },
  {
    condition: (s) => s.reasoningType === 'abductive',
    cq: {
      cqKey: 'alternatives',
      text: 'Are there alternative explanations?',
      attackType: 'REBUTS',
      targetScope: 'conclusion'
    }
  },
  {
    condition: (s) => s.reasoningType === 'practical',
    cq: {
      cqKey: 'better_alternatives',
      text: 'Are there better alternatives to this action?',
      attackType: 'UNDERCUTS',
      targetScope: 'inference'
    }
  },
  {
    condition: (s) => s.reasoningType === 'practical',
    cq: {
      cqKey: 'feasibility',
      text: 'Is this action feasible?',
      attackType: 'UNDERCUTS',
      targetScope: 'inference'
    }
  },
  {
    condition: (s) => s.conclusionType === 'ought',
    cq: {
      cqKey: 'value_tradeoffs',
      text: 'Are the value trade-offs acceptable?',
      attackType: 'UNDERCUTS',
      targetScope: 'inference'
    }
  },
  {
    condition: (s) => s.materialRelation === 'analogy',
    cq: {
      cqKey: 'relevant_similarities',
      text: 'Are the relevant similarities strong?',
      attackType: 'UNDERCUTS',
      targetScope: 'inference'
    }
  },
  {
    condition: (s) => s.materialRelation === 'analogy',
    cq: {
      cqKey: 'critical_differences',
      text: 'Are there critical differences?',
      attackType: 'UNDERCUTS',
      targetScope: 'inference'
    }
  },
  {
    condition: (s) => s.materialRelation === 'definition',
    cq: {
      cqKey: 'category_fit',
      text: 'Does the case fit the category definition?',
      attackType: 'UNDERCUTS',
      targetScope: 'inference'
    }
  }
];

export function generateCQs(scheme: ArgumentScheme): CriticalQuestion[] {
  return CQ_TEMPLATES
    .filter(t => t.condition(scheme))
    .map(t => ({ ...t.cq, id: `${scheme.key}_${t.cq.cqKey}` }));
}

// Usage in Scheme Creator:
export function SchemeCreatorWithAutoGen() {
  const [form, setForm] = useState<SchemeForm>({ /* ... */ });
  const [manualCQs, setManualCQs] = useState<CQForm[]>([]);

  // Auto-generate CQs based on taxonomy
  const autoCQs = generateCQs(form as ArgumentScheme);

  const allCQs = [...autoCQs, ...manualCQs];

  return (
    <div>
      <h3>Auto-Generated CQs ({autoCQs.length})</h3>
      <ul>
        {autoCQs.map(cq => (
          <li key={cq.cqKey}>{cq.text} ({cq.attackType})</li>
        ))}
      </ul>

      <h3>Custom CQs ({manualCQs.length})</h3>
      {/* Manual CQ builder */}
    </div>
  );
}
```

**Benefits:**
- ✅ Schemes automatically get baseline CQs
- ✅ Can add domain-specific CQs on top
- ✅ Consistent CQ structure across schemes
- ✅ Scales to hundreds of schemes

**Effort:** 6-8 hours (rule engine + UI integration)

---

### Gap 4: No Scheme Composition (LOW Priority, research feature)

**Problem:**
- Arguments use single scheme only
- Complex arguments need multiple schemes in sequence
- No way to model multi-step reasoning

**Use Case:**
```
Argument: "We should adopt policy X"

Chain:
1. Expert Opinion: Dr. Y (expert in economics) says X will improve GDP
2. Causal Inference: Higher GDP causes better quality of life
3. Practical Reasoning: If it improves quality of life, we ought to adopt X

Confidence: min(expert_opinion_conf, causal_conf, practical_conf)
```

**Schema Design:**
```prisma
// NEW: CompositeScheme model

model CompositeScheme {
  id          String @id @default(cuid())
  targetType  String // 'argument'
  targetId    String
  name        String?
  
  // Ordered scheme chain
  steps       CompositeSchemeStep[]
  
  createdById String
  createdAt   DateTime @default(now())
  
  @@index([targetType, targetId])
}

model CompositeSchemeStep {
  id               String @id @default(cuid())
  compositeId      String
  composite        CompositeScheme @relation(fields: [compositeId], references: [id], onDelete: Cascade)
  
  order            Int // 1, 2, 3, ...
  schemeId         String
  scheme           ArgumentScheme @relation(fields: [schemeId], references: [id])
  
  // Weight in final confidence calculation
  weight           Float @default(1.0) // Equal weight by default
  
  // Mapping: how this step's conclusion becomes next step's premise
  outputRole       String? // Which slot this step fills in next step
  
  @@unique([compositeId, order])
  @@index([compositeId])
}
```

**Confidence Calculation:**
```typescript
// In /api/evidential/score/route.ts

// For composite schemes:
if (argument.compositeSchemeId) {
  const composite = await prisma.compositeScheme.findUnique({
    where: { id: argument.compositeSchemeId },
    include: { steps: { include: { scheme: true }, orderBy: { order: 'asc' } } }
  });

  // Calculate confidence for each step
  const stepConfidences = [];
  for (const step of composite.steps) {
    const schemeBase = step.scheme.validators?.baseConfidence ?? 0.6;
    const premiseFactor = /* calculate from premises */;
    const cqPenalty = /* calculate from unsatisfied CQs */;
    const stepConf = schemeBase * premiseFactor * cqPenalty * step.weight;
    stepConfidences.push(stepConf);
  }

  // Chain confidence: weakest link (min) or product
  const chainMode = composite.confidenceMode ?? 'min';
  const finalConf = chainMode === 'min'
    ? Math.min(...stepConfidences)
    : stepConfidences.reduce((a, b) => a * b, 1);

  return finalConf;
}
```

**UI:**
```tsx
// NEW: components/arguments/CompositeSchemeBuilder.tsx

export function CompositeSchemeBuilder({ argumentId }: { argumentId: string }) {
  const [steps, setSteps] = useState<SchemeStep[]>([]);

  const addStep = () => {
    setSteps([...steps, { order: steps.length + 1, schemeId: '', weight: 1.0 }]);
  };

  const handleSave = async () => {
    await fetch(`/api/arguments/${argumentId}/composite-scheme`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ steps })
    });
  };

  return (
    <div>
      <h3>Composite Scheme</h3>
      {steps.map((step, i) => (
        <div key={i} className="border p-4 mb-2">
          <span>Step {i + 1}</span>
          <select
            value={step.schemeId}
            onChange={e => {
              const updated = [...steps];
              updated[i].schemeId = e.target.value;
              setSteps(updated);
            }}
          >
            <option value="">Select scheme...</option>
            {schemes.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <input
            type="number"
            min="0"
            max="1"
            step="0.1"
            value={step.weight}
            onChange={e => {
              const updated = [...steps];
              updated[i].weight = parseFloat(e.target.value);
              setSteps(updated);
            }}
            placeholder="Weight (0-1)"
          />
        </div>
      ))}
      <button onClick={addStep}>+ Add Step</button>
      <button onClick={handleSave}>Save Composite</button>
    </div>
  );
}
```

**Effort:** 16-20 hours (schema + confidence logic + UI + tests)

---

## NOTE: --"also I am not sure if this was included in the survey but this is the current, active component used for argument with schemes cqs in the main AIFArugmentsListPro component: SchemeSpecificCQsModal.tsx"

## 📊 Priority Matrix

| Gap | Priority | Effort | Impact | Blocking? |
|-----|----------|--------|--------|-----------|
| Gap 3: Database-driven inference | **MEDIUM** | 4-6h | Medium | No (works with 4 schemes) |
| Gap 4: Custom scheme UI | **HIGH** | 12-16h | High | No (seed script workaround) |
| Gap 5: Auto CQ generation | **LOW** | 6-8h | Low | No (manual works) |
| Gap 4 (sic): Scheme composition | **LOW** | 16-20h | Low | No (single scheme sufficient) |

---

## 🎯 Recommended Implementation Order

### Phase 1: Database-Driven Inference (Gap 3)
**Why first:** Unlocks existing seeded schemes (7 instead of 4)  
**Effort:** 4-6 hours  
**Deliverables:**
- Refactor `lib/argumentation/schemeInference.ts` to query database
- Remove hardcoded `criticalQuestions.ts` (or keep as fallback)
- Add taxonomy-based scoring (use materialRelation, reasoningType, etc.)
- Update tests to use database schemes

**Validation:**
- Arguments with "practical reasoning" text get assigned `practical_reasoning` scheme
- Arguments with "cause" text get assigned `causal` scheme
- All 7 seeded schemes can be auto-inferred

---

### Phase 2: Custom Scheme Creation UI (Gap 4 part 1)
**Why second:** Enables domain customization  
**Effort:** 12-16 hours  
**Deliverables:**
- `components/admin/SchemeCreator.tsx` (form UI)
- `POST /api/schemes` (create endpoint)
- `PUT /api/schemes/[id]` (update endpoint)
- `DELETE /api/schemes/[id]` (delete endpoint)
- Admin route `/admin/schemes` (list + CRUD)
- CQ builder component (add/edit/remove CQs)
- Taxonomy field dropdowns (Macagno dimensions)
- Validators editor (baseConfidence, slot requirements)

**Validation:**
- Admin can create "Argument from Precedent" scheme
- Scheme appears in `/api/schemes` list
- New arguments can be assigned custom scheme
- CQs for custom scheme display in CQ modal

---

### Phase 3: Automatic CQ Generation (Gap 5)
**Why third:** Optional enhancement, builds on Phase 2  
**Effort:** 6-8 hours  
**Deliverables:**
- `lib/argumentation/cqGeneration.ts` (rule engine)
- 10-15 CQ templates (covering common taxonomy patterns)
- SchemeCreator integration (show auto-generated CQs)
- Toggle: "Use auto-generated CQs" + manual additions

**Validation:**
- Scheme with source='external' gets "Is source credible?" CQ
- Scheme with materialRelation='cause' gets confounder CQ
- Can add custom CQs on top of auto-generated ones

---

### Phase 4: Scheme Composition (Gap 4 part 2)
**Why last:** Research feature, not needed for MVP  
**Effort:** 16-20 hours  
**Deliverables:**
- `CompositeScheme` + `CompositeSchemeStep` models
- `components/arguments/CompositeSchemeBuilder.tsx`
- `POST /api/arguments/[id]/composite-scheme`
- Confidence calculation refactor (chain of schemes)
- UI visualization (step-by-step scheme flow)

**Validation:**
- Complex argument uses 3 schemes in sequence
- Confidence reflects weakest link in chain
- CQs displayed grouped by scheme step

---

## 🧪 Testing Strategy

### Unit Tests

#### Scheme Inference
```typescript
// __tests__/lib/argumentation/schemeInference.test.ts

describe('inferSchemesFromText', () => {
  it('should infer expert_opinion from authority language', async () => {
    const text = "Dr. Smith, a leading virologist, says vaccines are safe";
    const schemes = await inferSchemesFromText(text);
    expect(schemes).toContain('expert_opinion');
  });

  it('should infer causal from cause language', async () => {
    const text = "Higher taxes lead to reduced investment";
    const schemes = await inferSchemesFromText(text);
    expect(schemes).toContain('causal');
  });

  it('should infer practical_reasoning from ought language', async () => {
    const text = "We should adopt this policy to achieve our goals";
    const schemes = await inferSchemesFromText(text);
    expect(schemes).toContain('practical_reasoning');
  });

  it('should fall back to consequences if no match', async () => {
    const text = "Random text with no scheme indicators";
    const schemes = await inferSchemesFromText(text);
    expect(schemes).toContain('positive_consequences'); // fallback
  });
});
```

#### CQ Generation
```typescript
// __tests__/lib/argumentation/cqGeneration.test.ts

describe('generateCQs', () => {
  it('should generate credibility CQ for external sources', () => {
    const scheme = {
      key: 'test',
      source: 'external',
      materialRelation: 'authority',
      reasoningType: 'abductive'
    } as ArgumentScheme;

    const cqs = generateCQs(scheme);
    expect(cqs).toContainEqual(
      expect.objectContaining({ cqKey: 'source_credible', text: expect.stringContaining('credible') })
    );
  });

  it('should generate confounder CQ for causal relations', () => {
    const scheme = {
      key: 'test',
      materialRelation: 'cause',
      reasoningType: 'inductive'
    } as ArgumentScheme;

    const cqs = generateCQs(scheme);
    expect(cqs).toContainEqual(
      expect.objectContaining({ cqKey: 'confounders' })
    );
  });

  it('should generate alternatives CQ for practical reasoning', () => {
    const scheme = {
      key: 'test',
      reasoningType: 'practical',
      conclusionType: 'ought'
    } as ArgumentScheme;

    const cqs = generateCQs(scheme);
    expect(cqs).toContainEqual(
      expect.objectContaining({ cqKey: 'better_alternatives' })
    );
  });
});
```

### Integration Tests

#### Scheme CRUD API
```typescript
// __tests__/app/api/schemes/route.test.ts

describe('POST /api/schemes', () => {
  it('should create custom scheme with CQs', async () => {
    const payload = {
      key: 'legal_precedent',
      name: 'Argument from Legal Precedent',
      summary: 'Appeals to established case law',
      purpose: 'state_of_affairs',
      source: 'external',
      materialRelation: 'authority',
      reasoningType: 'deductive',
      ruleForm: 'MP',
      cqs: [
        { cqKey: 'binding', text: 'Is the precedent binding?', attackType: 'UNDERCUTS', targetScope: 'inference' },
        { cqKey: 'similar', text: 'Are the cases similar?', attackType: 'UNDERCUTS', targetScope: 'inference' }
      ]
    };

    const res = await fetch('/api/schemes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.scheme.key).toBe('legal_precedent');

    // Verify CQs created
    const cqs = await prisma.criticalQuestion.findMany({
      where: { schemeId: data.scheme.id }
    });
    expect(cqs).toHaveLength(2);
    expect(cqs.map(c => c.cqKey)).toContain('binding');
  });

  it('should reject duplicate scheme keys', async () => {
    await prisma.argumentScheme.create({
      data: { key: 'existing', name: 'Existing', summary: 'Test' }
    });

    const res = await fetch('/api/schemes', {
      method: 'POST',
      body: JSON.stringify({ key: 'existing', name: 'Duplicate', summary: 'Test' })
    });

    expect(res.status).toBe(409);
  });
});
```

### E2E Tests

#### Custom Scheme Creation Flow
```typescript
// __tests__/e2e/scheme-creation.spec.ts

test('admin can create custom scheme and use in argument', async ({ page }) => {
  // Login as admin
  await page.goto('/login');
  await page.fill('[name=email]', 'admin@test.com');
  await page.fill('[name=password]', 'password');
  await page.click('button[type=submit]');

  // Navigate to scheme creator
  await page.goto('/admin/schemes/new');

  // Fill scheme form
  await page.fill('[name=key]', 'scientific_study');
  await page.fill('[name=name]', 'Argument from Scientific Study');
  await page.fill('[name=summary]', 'Appeals to empirical research');
  await page.selectOption('[name=purpose]', 'state_of_affairs');
  await page.selectOption('[name=source]', 'external');
  await page.selectOption('[name=materialRelation]', 'authority');

  // Add CQ
  await page.click('button:has-text("Add Critical Question")');
  await page.fill('[name="cqs[0].cqKey"]', 'peer_reviewed');
  await page.fill('[name="cqs[0].text"]', 'Was the study peer-reviewed?');
  await page.selectOption('[name="cqs[0].attackType"]', 'UNDERMINES');

  // Save
  await page.click('button:has-text("Save Scheme")');
  await expect(page.locator('text=Scheme created successfully')).toBeVisible();

  // Verify scheme appears in list
  await page.goto('/admin/schemes');
  await expect(page.locator('text=Argument from Scientific Study')).toBeVisible();

  // Use in argument
  await page.goto('/deliberations/test-delib');
  await page.click('button:has-text("New Argument")');
  await page.selectOption('[name=schemeId]', { label: 'Argument from Scientific Study' });
  await page.fill('[name=text]', 'A recent study shows X');
  await page.click('button:has-text("Submit")');

  // Verify CQ appears
  await page.click('button:has-text("Arg CQs")');
  await expect(page.locator('text=Was the study peer-reviewed?')).toBeVisible();
});
```

---

## 📝 Next Steps

### Immediate Actions (before design)
1. ✅ Complete survey (this document)
2. Run seed script to verify 7 schemes in database:
   ```bash
   npx tsx scripts/schemes.seed.ts
   ```
3. Query database to confirm scheme count:
   ```sql
   SELECT COUNT(*) FROM "ArgumentScheme";
   -- Expected: 7 (expert_opinion, practical_reasoning, positive_consequences, negative_consequences, analogy, causal, classification)
   ```
4. Test inference with existing schemes:
   ```bash
   # Create argument with "practical reasoning" text
   # Verify schemeId is assigned (not null)
   ```

### Design Phase (next document)
1. Create detailed API specs for Gap 3 (refactored inference)
2. Create mockups for Gap 4 (scheme creator UI)
3. Define rule templates for Gap 5 (CQ generation)
4. Model confidence algorithm for scheme composition

### Implementation Phases
- **Phase 1 (Gap 3):** 4-6 hours → Database-driven inference
- **Phase 2 (Gap 4a):** 12-16 hours → Custom scheme UI
- **Phase 3 (Gap 5):** 6-8 hours → Auto CQ generation
- **Phase 4 (Gap 4b):** 16-20 hours → Scheme composition

---

## 🎓 Research Notes

### Macagno Taxonomy Reference
**Source:** Macagno, F., & Walton, D. (2015). Classifying the patterns of natural arguments. *Philosophy & Rhetoric*, 48(1), 26-53.

**6 Dimensions:**
1. **Purpose:** action vs state_of_affairs
2. **Source:** internal (from agent) vs external (from others)
3. **Material Relation:** cause, definition, analogy, authority, correlation, sign, classification, practical
4. **Reasoning Type:** deductive, inductive, abductive, practical
5. **Rule Form:** MP (modus ponens), MT (modus tollens), defeasible_MP, etc.
6. **Conclusion Type:** ought (normative), is (descriptive)

**Why useful:**
- Enables scheme similarity search
- Allows automatic CQ generation
- Supports burden of proof allocation
- Facilitates scheme composition

---

## 📚 Appendix: File Locations

### Core Scheme Files
- `lib/models/schema.prisma` (lines 3237-3474): ArgumentScheme, CriticalQuestion, SchemeInstance models
- `lib/argumentation/criticalQuestions.ts` (76 lines): Hardcoded 4-scheme inference (TO BE REFACTORED)
- `lib/argumentation/schemeInference.ts` (54 lines): Auto-inference wrapper
- `scripts/schemes.seed.ts` (193 lines): 7-scheme seed script

### API Endpoints
- `app/api/schemes/route.ts`: GET schemes list
- `app/api/aif/schemes/route.ts`: GET with auto-seeding
- `app/api/arguments/route.ts` (line 94-98): Auto-inference on argument creation
- `app/api/claims/[id]/cq/summary/route.ts`: CQ status by scheme

### UI Components
- `components/SchemeComposerPicker.tsx`: Entity picker (NOT schemes despite name!)
- `components/claims/CriticalQuestionsV2.tsx`: CQ display component
- `components/claims/CriticalQuestionsV3.tsx`: Enhanced CQ component
- `components/arguments/ArgumentCard.tsx`: Shows scheme badge

### Missing Components (TO BE CREATED)
- `components/admin/SchemeCreator.tsx`: Custom scheme UI
- `components/admin/SchemeList.tsx`: Scheme management
- `lib/argumentation/cqGeneration.ts`: Auto CQ generator
- `app/api/schemes/[id]/route.ts`: CRUD handlers

---

**Survey Status:** ✅ COMPLETE  
**Next Document:** `CHUNK_3A_SCHEME_SYSTEM_DESIGN.md` (detailed design for Gaps 3-5)
