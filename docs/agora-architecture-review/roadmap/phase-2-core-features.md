# Phase 2: Core Feature Completion

**Duration:** 6-8 weeks (estimated) | **Priority:** 🟠 High  
**Status:** Not Started | **Progress:** 0/18 tasks (0%)

---

## 🎯 Phase Overview

Phase 2 implements missing backend logic to complete core features identified in the architecture review. This phase focuses on backend APIs, database models, and business logic—not UI components (those are Phase 3).

**Key Goals:**
1. Implement dialogue state computation (track which attacks answered)
2. Add temporal confidence decay with configurable half-life
3. Complete Dempster-Shafer (DS) mode implementation
4. Enable AssumptionUse full lifecycle (create → track → import/export)
5. Add response vote integration for dialogue moves
6. Make NLI threshold configurable per room

**Why This Phase Matters:**
- Enables research-grade dialogue tracking (GROUNDS responses per attack)
- Adds temporal reasoning (confidence decays over time without new support)
- Completes all 3 confidence modes (min, product, DS)
- Unlocks belief revision via AssumptionUse tracking
- Prepares system for DDF protocol (Phase 5)

---

## 📋 Task Breakdown

### 2.1 Dialogue Action Tracking (3 tasks, 5 hours)

Track which dialogue moves have been responded to and compute dialogue state per argument.

---

#### Task 2.1.1: Dialogue State API
**Priority:** 🟠 High  
**Effort:** 3 hours  
**Files:**
- `/app/api/arguments/[id]/dialogue-status/route.ts` (NEW)
- `/lib/dialogue/computeDialogueState.ts` (NEW)

**Current State:** AttackBadge shows attack count but not whether attacks answered

**Implementation:**
```typescript
// lib/dialogue/computeDialogueState.ts
export type DialogueState = {
  argumentId: string;
  attackCount: number;
  answeredCount: number;  // How many have GROUNDS response
  pendingCount: number;   // Unanswered attacks
  state: 'strong' | 'challenged' | 'refuted';
};

export async function computeDialogueState(argumentId: string): Promise<DialogueState> {
  // 1. Find all ArgumentEdge where toArgumentId = argumentId AND type = undercut/rebut
  const attacks = await prisma.argumentEdge.findMany({
    where: { toArgumentId: argumentId, type: { in: ['undercut', 'rebut'] } },
    select: { id: true, fromArgumentId: true }
  });
  
  // 2. For each attack, check if there's a reply:
  //    - Look for Argument where conclusionClaimId = (attack's targetClaimId)
  //    - AND authorId != attacker's authorId
  //    - AND createdAt > attack.createdAt
  
  let answeredCount = 0;
  for (const attack of attacks) {
    const response = await prisma.argument.findFirst({
      where: {
        deliberationId: attack.deliberationId,
        createdAt: { gt: attack.createdAt },
        // Check if this is a GROUNDS response (defends against the attack)
      }
    });
    if (response) answeredCount++;
  }
  
  const pendingCount = attacks.length - answeredCount;
  const state = pendingCount === 0 ? 'strong' : 
                (answeredCount > 0 ? 'challenged' : 'refuted');
  
  return {
    argumentId,
    attackCount: attacks.length,
    answeredCount,
    pendingCount,
    state
  };
}

// app/api/arguments/[id]/dialogue-status/route.ts
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const status = await computeDialogueState(params.id);
  return Response.json(status);
}
```

**Acceptance Criteria:**
- [ ] API returns correct attack counts
- [ ] Detects GROUNDS responses (replies to attacks)
- [ ] State computation: strong (0 pending) / challenged (some answered) / refuted (none answered)
- [ ] Response includes `answeredCount` and `pendingCount`
- [ ] API call < 100ms for arguments with < 10 attacks

**Dependencies:** None  
**Blocks:** Task 2.1.2, Phase 3 (dialogue badges)

---

#### Task 2.1.2: Response Vote Integration
**Priority:** 🟡 Medium  
**Effort:** 1.5 hours  
**Files:**
- `/app/api/dialogue-actions/[id]/votes/route.ts` (NEW)
- `/lib/models/schema.prisma` (add ResponseVote model)

**Current State:** DialogueAction table exists but no vote tracking

**Implementation:**
```prisma
// Add to schema.prisma
model ResponseVote {
  id               String         @id @default(cuid())
  dialogueActionId String
  voterId          String
  voteType         VoteType       // UPVOTE | DOWNVOTE | FLAG
  createdAt        DateTime       @default(now())
  
  dialogueAction   DialogueAction @relation(fields: [dialogueActionId], references: [id], onDelete: Cascade)
  
  @@unique([dialogueActionId, voterId])
  @@index([dialogueActionId])
}

enum VoteType {
  UPVOTE
  DOWNVOTE
  FLAG
}
```

```typescript
// app/api/dialogue-actions/[id]/votes/route.ts
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { voterId, voteType } = await req.json();
  
  const vote = await prisma.responseVote.upsert({
    where: { dialogueActionId_voterId: { dialogueActionId: params.id, voterId } },
    create: { dialogueActionId: params.id, voterId, voteType },
    update: { voteType }
  });
  
  // Aggregate vote counts
  const counts = await prisma.responseVote.groupBy({
    by: ['voteType'],
    where: { dialogueActionId: params.id },
    _count: true
  });
  
  return Response.json({ vote, counts });
}
```

**Acceptance Criteria:**
- [ ] Upsert prevents duplicate votes (same user voting twice)
- [ ] GET returns vote counts per type (upvotes, downvotes, flags)
- [ ] POST validates voteType enum
- [ ] Cascade delete removes votes when DialogueAction deleted
- [ ] API supports flagging inappropriate responses

**Dependencies:** None  
**Blocks:** Phase 3 (vote UI)

---

#### Task 2.1.3: Move Completion Tracking
**Priority:** 🟡 Medium  
**Effort:** 30 minutes  
**Files:**
- `/lib/models/schema.prisma` (add completed field to DialogueAction)

**Current State:** No way to mark moves as "fulfilled" or "completed"

**Implementation:**
```prisma
model DialogueAction {
  // ... existing fields
  completed   Boolean  @default(false)
  completedAt DateTime?
  completedBy String?
}
```

**Acceptance Criteria:**
- [ ] Migration adds `completed` field with default false
- [ ] API allows marking move as completed
- [ ] Completed moves excluded from "pending obligations" queries
- [ ] CompletedAt timestamp recorded
- [ ] CompletedBy tracks who fulfilled the obligation

**Dependencies:** None  
**Blocks:** Phase 5 (DDF stage transitions)

---

### 2.2 Temporal Confidence Decay (3 tasks, 6.5 hours)

Implement time-based confidence degradation for arguments lacking recent support.

---

#### Task 2.2.1: Decay Formula Implementation
**Priority:** 🟠 High  
**Effort:** 3 hours  
**Files:**
- `/lib/evidential/temporalDecay.ts` (NEW)
- `/app/api/evidential/score/route.ts` (modify)

**Current State:** Confidence never decays over time (issue identified in Chunk 3A)

**Implementation:**
```typescript
// lib/evidential/temporalDecay.ts
export type DecayConfig = {
  enabled: boolean;
  halfLife: number; // days
  minConfidence: number; // floor value
};

export function applyTemporalDecay(
  baseConfidence: number,
  createdAt: Date,
  config: DecayConfig
): number {
  if (!config.enabled) return baseConfidence;
  
  const ageInDays = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
  const decayFactor = Math.pow(0.5, ageInDays / config.halfLife);
  const decayed = baseConfidence * decayFactor;
  
  return Math.max(decayed, config.minConfidence);
}

// Example: halfLife = 30 days
// Day 0: confidence = 0.8
// Day 30: confidence = 0.8 * 0.5 = 0.4
// Day 60: confidence = 0.8 * 0.25 = 0.2
// Day 90: confidence = 0.8 * 0.125 = 0.1 (hit floor)
```

**Acceptance Criteria:**
- [ ] Decay factor = 0.5^(age / halfLife)
- [ ] HalfLife configurable per room (rulesetJson.confidence.temporalDecay)
- [ ] MinConfidence floor prevents total collapse (default 0.1)
- [ ] Decay applies after all other modifiers (scheme × premises × CQ × decay)
- [ ] Can disable decay with `enabled: false`

**Dependencies:** None  
**Blocks:** Task 2.2.2, 2.2.3

---

#### Task 2.2.2: Room Decay Configuration
**Priority:** 🟡 Medium  
**Effort:** 2 hours  
**Files:**
- `/app/api/sheets/[id]/route.ts` (update rulesetJson schema)
- `/lib/zod/rulesetSchema.ts` (NEW)

**Current State:** No UI or API to configure decay parameters

**Implementation:**
```typescript
// lib/zod/rulesetSchema.ts
import { z } from 'zod';

export const TemporalDecaySchema = z.object({
  enabled: z.boolean().default(false),
  halfLife: z.number().min(1).max(365).default(30),
  minConfidence: z.number().min(0).max(1).default(0.1)
});

export const RulesetSchema = z.object({
  confidence: z.object({
    mode: z.enum(['min', 'product', 'ds']).default('product'),
    temporalDecay: TemporalDecaySchema.optional()
  })
});

// app/api/sheets/[id]/route.ts
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  
  // Validate rulesetJson with Zod
  if (body.rulesetJson) {
    const validated = RulesetSchema.parse(body.rulesetJson);
    body.rulesetJson = validated;
  }
  
  const updated = await prisma.debateSheet.update({
    where: { id: params.id },
    data: body
  });
  
  return Response.json(updated);
}
```

**Acceptance Criteria:**
- [ ] PATCH validates decay config with Zod
- [ ] Invalid halfLife (< 1 or > 365) rejected with 400
- [ ] Default values applied when fields missing
- [ ] Changes persist in DebateSheet.rulesetJson
- [ ] GET returns current decay config

**Dependencies:** Task 2.2.1  
**Blocks:** Phase 3 (decay config UI)

---

#### Task 2.2.3: Decay Explanation in API
**Priority:** 🟢 Low  
**Effort:** 1.5 hours  
**Files:**
- `/app/api/evidential/score/route.ts` (add decay to explanation)

**Current State:** Explanation shows scheme, premises, CQ—but not decay

**Implementation:**
```typescript
// Add to existing explanation output
if (explain) {
  const decay = applyTemporalDecay(1.0, argument.createdAt, decayConfig);
  
  return Response.json({
    // ... existing fields
    temporalDecay: {
      enabled: decayConfig.enabled,
      ageInDays: (Date.now() - argument.createdAt.getTime()) / (1000 * 60 * 60 * 24),
      decayFactor: decay,
      halfLife: decayConfig.halfLife
    },
    formula: "base × premises × CQ × decay × (1-undercut) × (1-rebut)"
  });
}
```

**Acceptance Criteria:**
- [ ] Explanation includes `temporalDecay` object
- [ ] Shows `ageInDays` and `decayFactor`
- [ ] Formula string updated with decay term
- [ ] If decay disabled, shows decayFactor = 1.0
- [ ] UI can display age warning: "This argument is 90 days old"

**Dependencies:** Task 2.2.1, 2.2.2  
**Blocks:** Phase 3 (decay UI indicator)

---

### 2.3 Dempster-Shafer Mode (3 tasks, 9 hours)

Complete the DS mode implementation (currently a stub).

---

#### Task 2.3.1: Belief Mass Calculation
**Priority:** 🟡 Medium  
**Effort:** 4 hours  
**Files:**
- `/lib/evidential/dempsterShafer.ts` (NEW)
- `/app/api/evidential/score/route.ts` (add DS mode logic)

**Current State:** `mode: 'ds'` exists in config but not implemented (Chunk 2A)

**Implementation:**
```typescript
// lib/evidential/dempsterShafer.ts
export type BeliefMass = {
  hypothesis: Set<string>;  // Subset of frame of discernment
  mass: number;             // m(A) where A ⊆ Θ
};

export function computeBeliefMasses(
  premises: { claimId: string; confidence: number }[]
): BeliefMass[] {
  // Convert confidences to belief masses
  // Example: confidence 0.8 → m({true}) = 0.8, m({true, false}) = 0.2
  
  const masses: BeliefMass[] = [];
  for (const p of premises) {
    masses.push({
      hypothesis: new Set([p.claimId]),
      mass: p.confidence
    });
    masses.push({
      hypothesis: new Set([p.claimId, `¬${p.claimId}`]), // Ignorance
      mass: 1 - p.confidence
    });
  }
  
  return masses;
}

export function dempsterCombination(m1: BeliefMass[], m2: BeliefMass[]): BeliefMass[] {
  // Dempster's rule: m(A) = (Σ m1(B)·m2(C)) / (1 - K)
  // where B ∩ C = A and K = Σ m1(B)·m2(C) for B ∩ C = ∅
  
  const combined: Map<string, number> = new Map();
  let conflict = 0;
  
  for (const mass1 of m1) {
    for (const mass2 of m2) {
      const intersection = new Set(
        [...mass1.hypothesis].filter(x => mass2.hypothesis.has(x))
      );
      
      if (intersection.size === 0) {
        conflict += mass1.mass * mass2.mass;
      } else {
        const key = Array.from(intersection).sort().join(',');
        combined.set(key, (combined.get(key) || 0) + mass1.mass * mass2.mass);
      }
    }
  }
  
  // Normalize by (1 - K)
  const normFactor = 1 - conflict;
  const result: BeliefMass[] = [];
  
  for (const [key, mass] of combined.entries()) {
    result.push({
      hypothesis: new Set(key.split(',')),
      mass: mass / normFactor
    });
  }
  
  return result;
}

export function beliefAndPlausibility(masses: BeliefMass[], hypothesis: Set<string>) {
  // Bel(A) = Σ m(B) for all B ⊆ A
  // Pl(A) = Σ m(B) for all B ∩ A ≠ ∅
  
  let belief = 0;
  let plausibility = 0;
  
  for (const mass of masses) {
    // Check if mass.hypothesis ⊆ hypothesis
    const isSubset = [...mass.hypothesis].every(x => hypothesis.has(x));
    if (isSubset) belief += mass.mass;
    
    // Check if mass.hypothesis ∩ hypothesis ≠ ∅
    const hasIntersection = [...mass.hypothesis].some(x => hypothesis.has(x));
    if (hasIntersection) plausibility += mass.mass;
  }
  
  return { belief, plausibility };
}
```

**Acceptance Criteria:**
- [ ] Compute belief masses from premise confidences
- [ ] Dempster combination handles conflict (K factor)
- [ ] Return [bel, pl] interval for conclusion
- [ ] Handle ignorance (mass on Θ)
- [ ] Normalize after combination

**Dependencies:** None  
**Blocks:** Task 2.3.2, 2.3.3

---

#### Task 2.3.2: PCR5/PCR6 Conflict Resolution
**Priority:** 🟡 Medium  
**Effort:** 3 hours  
**Files:**
- `/lib/evidential/dempsterShafer.ts` (add PCR variants)

**Current State:** No conflict resolution strategy beyond Dempster normalization

**Implementation:**
```typescript
// PCR5: Proportional Conflict Redistribution (version 5)
export function pcrCombination(
  m1: BeliefMass[],
  m2: BeliefMass[],
  variant: 'PCR5' | 'PCR6' = 'PCR5'
): BeliefMass[] {
  // PCR5: Redistribute conflict proportionally to sources
  // m_PCR(A) = m_Dempster(A) + Σ [m1(A)·m2(B) / (m1(A) + m2(B))] for A ∩ B = ∅
  
  // Implementation details omitted for brevity
  // See: Smarandache & Dezert, "Advances and Applications of DSmT"
  
  return []; // Placeholder
}
```

**Acceptance Criteria:**
- [ ] PCR5 redistributes conflict proportionally
- [ ] PCR6 variant available (more aggressive redistribution)
- [ ] Configurable via rulesetJson.confidence.dsConflictResolution
- [ ] Performance: < 50ms for 10 premises
- [ ] Unit tests verify redistribution math

**Dependencies:** Task 2.3.1  
**Blocks:** None

---

#### Task 2.3.3: DS Mode in Confidence API
**Priority:** 🟡 Medium  
**Effort:** 2 hours  
**Files:**
- `/app/api/evidential/score/route.ts` (add DS mode case)

**Current State:** Only min and product modes implemented

**Implementation:**
```typescript
// app/api/evidential/score/route.ts
if (mode === 'ds') {
  const masses = computeBeliefMasses(premises);
  
  // Combine masses using Dempster's rule
  let combined = masses[0];
  for (let i = 1; i < masses.length; i++) {
    combined = dempsterCombination([combined], [masses[i]]);
  }
  
  // Get belief and plausibility for conclusion
  const conclusionHypothesis = new Set([argument.conclusionClaimId]);
  const { belief, plausibility } = beliefAndPlausibility(combined, conclusionHypothesis);
  
  // Apply CQ penalty and decay to belief interval
  const finalBelief = belief * cqPenalty * decayFactor;
  const finalPlausibility = plausibility * cqPenalty * decayFactor;
  
  return Response.json({
    confidence: finalBelief,  // Lower bound
    interval: [finalBelief, finalPlausibility],
    mode: 'ds',
    explanation: explain ? {
      beliefMass: combined,
      conflictMass: 1 - combined.reduce((sum, m) => sum + m.mass, 0)
    } : undefined
  });
}
```

**Acceptance Criteria:**
- [ ] API returns [bel, pl] interval when mode=ds
- [ ] Confidence field = belief (lower bound)
- [ ] Explanation includes conflict mass
- [ ] Performance: < 100ms for 5 premises
- [ ] Falls back to product mode if DS computation fails

**Dependencies:** Task 2.3.1, 2.3.2  
**Blocks:** Phase 3 (DS mode UI)

---

### 2.4 AssumptionUse Lifecycle (4 tasks, 8 hours)

Enable full create → track → import/export cycle for assumptions.

---

#### Task 2.4.1: AssumptionUse Creation API
**Priority:** 🟠 High  
**Effort:** 2 hours  
**Files:**
- `/app/api/arguments/[id]/assumptions/route.ts` (NEW)

**Current State:** AssumptionUse export works (Chunk 1B) but no way to create them via UI

**Implementation:**
```typescript
// app/api/arguments/[id]/assumptions/route.ts
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { claimId, role, weight } = await req.json();
  
  // Validate role: 'presumption' | 'exception'
  if (!['presumption', 'exception'].includes(role)) {
    return Response.json({ error: 'Invalid role' }, { status: 400 });
  }
  
  const assumption = await prisma.assumptionUse.create({
    data: {
      argumentId: params.id,
      claimId,
      role: role.toUpperCase(), // PRESUMPTION | EXCEPTION
      weight: weight ?? 1.0,
      createdAt: new Date()
    }
  });
  
  return Response.json(assumption);
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const assumptions = await prisma.assumptionUse.findMany({
    where: { argumentId: params.id },
    include: { claim: { select: { id: true, text: true } } }
  });
  
  return Response.json({ assumptions });
}
```

**Acceptance Criteria:**
- [ ] POST creates AssumptionUse with validation
- [ ] GET returns all assumptions for an argument
- [ ] Weight defaults to 1.0 if not provided
- [ ] Role validation (only presumption/exception allowed)
- [ ] Includes claim text in response

**Dependencies:** None  
**Blocks:** Task 2.4.2, Phase 3 (AssumptionUse UI)

---

#### Task 2.4.2: Import Presumption/Exception Edges
**Priority:** 🟡 Medium  
**Effort:** 2.5 hours  
**Files:**
- `/lib/aif/import.ts` (add Presumption/Exception edge handling)

**Current State:** Import creates I/RA/CA/PA nodes but not AssumptionUse (Chunk 1A gap)

**Implementation:**
```typescript
// lib/aif/import.ts (add after PA-node section)

// Handle Presumption edges (AIF property: 'Presumption')
const presumptionEdges = graph.edges.filter((e: any) => 
  e['@type'] === 'aif:Presumption' || e.role === 'presumption'
);

for (const edge of presumptionEdges) {
  const argumentId = argMap.get(edge.from);
  const claimId = claimMap.get(edge.to);
  
  if (argumentId && claimId) {
    await prisma.assumptionUse.create({
      data: {
        argumentId,
        claimId,
        role: 'PRESUMPTION',
        weight: edge.weight ?? 1.0
      }
    });
  } else {
    console.warn(`[AIF Import] Presumption edge missing nodes: ${edge.from} → ${edge.to}`);
  }
}

// Handle Exception edges
const exceptionEdges = graph.edges.filter((e: any) => 
  e['@type'] === 'aif:Exception' || e.role === 'exception'
);

for (const edge of exceptionEdges) {
  const argumentId = argMap.get(edge.from);
  const claimId = claimMap.get(edge.to);
  
  if (argumentId && claimId) {
    await prisma.assumptionUse.create({
      data: {
        argumentId,
        claimId,
        role: 'EXCEPTION',
        weight: edge.weight ?? 1.0
      }
    });
  }
}
```

**Acceptance Criteria:**
- [ ] Presumption edges create PRESUMPTION AssumptionUse
- [ ] Exception edges create EXCEPTION AssumptionUse
- [ ] Weight preserved from AIF edge
- [ ] Console warns if nodes missing (broken edges)
- [ ] Round-trip test passes (export → import → verify assumptions)

**Dependencies:** Task 2.4.1  
**Blocks:** None

---

#### Task 2.4.3: Assumption Weight in Confidence
**Priority:** 🟢 Low  
**Effort:** 2 hours  
**Files:**
- `/app/api/evidential/score/route.ts` (modify to use assumption weights)

**Current State:** AssumptionUse.weight field exists but not used (Chunk 1B observation)

**Implementation:**
```typescript
// Fetch assumptions and apply weights
const assumptions = await prisma.assumptionUse.findMany({
  where: { argumentId: arg.id },
  include: { claim: { select: { confidence: true } } }
});

// Weight presumptions positively, exceptions negatively
let assumptionFactor = 1.0;
for (const assumption of assumptions) {
  const claimConf = assumption.claim.confidence ?? 0.5;
  
  if (assumption.role === 'PRESUMPTION') {
    // Stronger presumptions increase confidence
    assumptionFactor *= (1 + assumption.weight * claimConf * 0.2);
  } else if (assumption.role === 'EXCEPTION') {
    // Exceptions decrease confidence
    assumptionFactor *= (1 - assumption.weight * claimConf * 0.2);
  }
}

// Apply to final confidence
const finalConfidence = baseConfidence * assumptionFactor;
```

**Acceptance Criteria:**
- [ ] Presumptions boost confidence by up to 20% per assumption
- [ ] Exceptions reduce confidence proportionally
- [ ] Weight scales the effect (weight=0.5 → 10% boost)
- [ ] Explanation shows assumption contributions
- [ ] Works with all confidence modes (min, product, DS)

**Dependencies:** Task 2.4.1  
**Blocks:** Phase 3 (assumption display)

---

#### Task 2.4.4: Assumption Display Data in API
**Priority:** 🟢 Low  
**Effort:** 1.5 hours  
**Files:**
- `/app/api/arguments/[id]/route.ts` (add assumptions to response)

**Current State:** Argument API doesn't include AssumptionUse data

**Implementation:**
```typescript
// app/api/arguments/[id]/route.ts
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const argument = await prisma.argument.findUnique({
    where: { id: params.id },
    include: {
      scheme: { select: { key: true, name: true } },
      premises: {
        include: { claim: { select: { id: true, text: true } } }
      },
      assumptions: {
        include: { claim: { select: { id: true, text: true, confidence: true } } }
      }
    }
  });
  
  return Response.json({ argument });
}
```

**Acceptance Criteria:**
- [ ] Response includes `assumptions` array
- [ ] Each assumption has claim text and confidence
- [ ] Role (PRESUMPTION/EXCEPTION) included
- [ ] Weight field present
- [ ] Response time < 50ms

**Dependencies:** Task 2.4.1  
**Blocks:** Phase 3 (assumption UI)

---

### 2.5 NLI Threshold Configuration (2 tasks, 3.5 hours)

Make Natural Language Inference thresholds configurable per room.

---

#### Task 2.5.1: NLI Config in RulesetJson
**Priority:** 🟡 Medium  
**Effort:** 2 hours  
**Files:**
- `/lib/zod/rulesetSchema.ts` (add NLI config)
- `/app/api/sheets/[id]/route.ts` (validate NLI config)

**Current State:** NLI thresholds hardcoded in service code (Chunk 2A observation)

**Implementation:**
```typescript
// lib/zod/rulesetSchema.ts
export const NliConfigSchema = z.object({
  entailmentThreshold: z.number().min(0).max(1).default(0.8),
  contradictionThreshold: z.number().min(0).max(1).default(0.8),
  neutralThreshold: z.number().min(0).max(1).default(0.5),
  provider: z.enum(['openai', 'local', 'none']).default('openai')
});

export const RulesetSchema = z.object({
  confidence: z.object({
    mode: z.enum(['min', 'product', 'ds']).default('product'),
    temporalDecay: TemporalDecaySchema.optional(),
    nli: NliConfigSchema.optional()
  })
});
```

**Acceptance Criteria:**
- [ ] Thresholds validated 0.0 - 1.0
- [ ] Provider enum: openai | local | none
- [ ] Defaults: entailment=0.8, contradiction=0.8, neutral=0.5
- [ ] PATCH validates and saves config
- [ ] GET returns current NLI config

**Dependencies:** None  
**Blocks:** Task 2.5.2

---

#### Task 2.5.2: Apply NLI Config in Synthesis
**Priority:** 🟡 Medium  
**Effort:** 1.5 hours  
**Files:**
- `/app/api/synthesis/[id]/route.ts` (use room NLI config)

**Current State:** Synthesis uses hardcoded thresholds

**Implementation:**
```typescript
// app/api/synthesis/[id]/route.ts
const sheet = await prisma.debateSheet.findUnique({
  where: { id: params.id },
  select: { rulesetJson: true }
});

const nliConfig = sheet?.rulesetJson?.confidence?.nli ?? {
  entailmentThreshold: 0.8,
  contradictionThreshold: 0.8,
  neutralThreshold: 0.5,
  provider: 'openai'
};

// Use nliConfig.entailmentThreshold when computing entailment
if (nliScore > nliConfig.entailmentThreshold) {
  // Claims are entailed
}
```

**Acceptance Criteria:**
- [ ] Synthesis API reads NLI config from room
- [ ] Falls back to defaults if config missing
- [ ] Provider setting respected (skip NLI if provider=none)
- [ ] Lower thresholds = more permissive entailment detection
- [ ] API response includes which config was used

**Dependencies:** Task 2.5.1  
**Blocks:** Phase 3 (NLI config UI)

---

### 2.6 Hom-Set Confidence Computation (3 tasks, 7.5 hours)

Complete the hom-set (all arguments A→B) confidence aggregation.

---

#### Task 2.6.1: Hom-Set Query API
**Priority:** 🟡 Medium  
**Effort:** 2.5 hours  
**Files:**
- `/app/api/claims/hom-set/route.ts` (NEW)

**Current State:** Hom-set concept exists but no API to fetch all A→B arguments (Chunk 1B gap)

**Implementation:**
```typescript
// app/api/claims/hom-set/route.ts
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const fromClaimId = searchParams.get('from');
  const toClaimId = searchParams.get('to');
  
  if (!fromClaimId || !toClaimId) {
    return Response.json({ error: 'Missing from/to claim IDs' }, { status: 400 });
  }
  
  // Find all arguments with:
  // - Any premise = fromClaimId
  // - conclusionClaimId = toClaimId
  const arguments = await prisma.argument.findMany({
    where: {
      conclusionClaimId: toClaimId,
      premises: {
        some: { claimId: fromClaimId }
      }
    },
    include: {
      scheme: { select: { key: true, name: true } },
      premises: {
        include: { claim: { select: { id: true, text: true } } }
      }
    }
  });
  
  // Compute confidence for each
  const withConfidence = await Promise.all(
    arguments.map(async (arg) => {
      const score = await computeConfidence(arg.id);
      return { ...arg, confidence: score };
    })
  );
  
  // Apply join operation (max or product depending on mode)
  const joined = joinConfidences(withConfidence.map(a => a.confidence));
  
  return Response.json({
    fromClaimId,
    toClaimId,
    arguments: withConfidence,
    joinedConfidence: joined
  });
}
```

**Acceptance Criteria:**
- [ ] Returns all arguments from claim A to claim B
- [ ] Includes confidence score per argument
- [ ] Computes joined confidence (max or product)
- [ ] Handles empty hom-set (returns confidence = 0)
- [ ] Response time < 200ms for < 20 arguments

**Dependencies:** None  
**Blocks:** Task 2.6.2, Phase 3 (hom-set UI)

---

#### Task 2.6.2: Join Operation Modes
**Priority:** 🟡 Medium  
**Effort:** 3 hours  
**Files:**
- `/lib/evidential/joinOperations.ts` (NEW)

**Current State:** Join concept mentioned but not implemented (Chunk 1B, 5B)

**Implementation:**
```typescript
// lib/evidential/joinOperations.ts
export type JoinMode = 'max' | 'product' | 'noisy-or' | 'ds';

export function joinConfidences(confidences: number[], mode: JoinMode): number {
  if (confidences.length === 0) return 0;
  
  switch (mode) {
    case 'max':
      // Take strongest argument (max confidence)
      return Math.max(...confidences);
    
    case 'product':
      // Independent probability: 1 - Π(1 - ci)
      const prod = confidences.reduce((acc, c) => acc * (1 - c), 1);
      return 1 - prod;
    
    case 'noisy-or':
      // Weighted noisy-OR for redundant arguments
      const noisyOr = confidences.reduce((acc, c, i) => {
        const weight = 1 / (i + 1); // Diminishing returns
        return acc + weight * c * (1 - acc);
      }, 0);
      return noisyOr;
    
    case 'ds':
      // Dempster-Shafer combination (use DS mode logic)
      // Treat each argument as evidence mass
      return 0; // Placeholder
    
    default:
      return Math.max(...confidences);
  }
}
```

**Acceptance Criteria:**
- [ ] Max mode: strongest single argument wins
- [ ] Product mode: combines independent evidence
- [ ] Noisy-OR: diminishing returns for redundancy
- [ ] DS mode: belief mass combination
- [ ] Configurable via rulesetJson.confidence.joinMode

**Dependencies:** None  
**Blocks:** Task 2.6.3

---

#### Task 2.6.3: Hom-Set Caching
**Priority:** 🟢 Low  
**Effort:** 2 hours  
**Files:**
- `/lib/evidential/homSetCache.ts` (NEW)

**Current State:** No caching (will recompute on every request)

**Implementation:**
```typescript
// lib/evidential/homSetCache.ts
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function getCachedHomSet(
  fromClaimId: string,
  toClaimId: string
): Promise<number | null> {
  const key = `homset:${fromClaimId}:${toClaimId}`;
  const cached = await redis.get(key);
  return cached ? parseFloat(cached) : null;
}

export async function setCachedHomSet(
  fromClaimId: string,
  toClaimId: string,
  confidence: number,
  ttl: number = 300 // 5 minutes
): Promise<void> {
  const key = `homset:${fromClaimId}:${toClaimId}`;
  await redis.setex(key, ttl, confidence.toString());
}

export async function invalidateHomSet(claimId: string): Promise<void> {
  // Invalidate all hom-sets involving this claim
  const keys = await redis.keys(`homset:${claimId}:*`);
  const keys2 = await redis.keys(`homset:*:${claimId}`);
  
  if (keys.length > 0) await redis.del(...keys);
  if (keys2.length > 0) await redis.del(...keys2);
}
```

**Acceptance Criteria:**
- [ ] Cache hit: return immediately (< 10ms)
- [ ] Cache miss: compute and cache for 5 minutes
- [ ] Invalidate when new argument added to hom-set
- [ ] Invalidate when claim confidence changes
- [ ] Redis TTL prevents stale data

**Dependencies:** Task 2.6.1, 2.6.2  
**Blocks:** Phase 6 (performance optimization)

---

## 📊 Phase 2 Summary

**Total Tasks:** 18  
**Estimated Effort:** 39.5 hours (6-8 weeks with other work)  
**Critical Path:** 2.1.1 → 2.2.1 → 2.3.1 → 2.4.1 (dialogue → decay → DS → assumptions)

**Deliverables:**
- ✅ Dialogue state computation (track answered attacks)
- ✅ Temporal confidence decay (configurable half-life)
- ✅ Complete DS mode (belief masses + PCR conflict resolution)
- ✅ Full AssumptionUse lifecycle (create → track → import/export)
- ✅ Response vote integration (upvote/downvote/flag)
- ✅ NLI threshold configuration per room
- ✅ Hom-set confidence aggregation (join operations)

**Success Metrics:**
- Dialogue state API < 100ms for 10 attacks
- Temporal decay configurable per room
- DS mode returns [bel, pl] intervals
- AssumptionUse round-trip test passes
- Hom-set query < 200ms for 20 arguments
- All APIs have >80% test coverage

---

## 🔗 Dependencies

**Depends On:**
- Phase 1 complete (confidence integration, import/export fixes)

**Blocks:**
- Phase 3 (UI components for new APIs)
- Phase 5 (DDF protocol requires dialogue state + assumptions)

---

## 🎯 Acceptance Criteria (Phase 2 Complete)

- [ ] Dialogue state computation works for all argument types
- [ ] Temporal decay applies correctly with configurable half-life
- [ ] DS mode produces valid [bel, pl] intervals
- [ ] AssumptionUse import/export round-trip preserves data
- [ ] Response votes tracked and aggregated
- [ ] NLI thresholds configurable and respected
- [ ] Hom-set API returns joined confidence
- [ ] All 18 tasks pass unit tests
- [ ] API response times meet performance targets
- [ ] Zero new lint errors

---

## 📝 Notes

**Parallel Work Opportunities:**
- 2.1 (Dialogue) and 2.2 (Decay) independent → can parallelize
- 2.3 (DS mode) and 2.4 (AssumptionUse) independent
- 2.5 (NLI) and 2.6 (Hom-set) independent

**Risk Mitigation:**
- DS mode complex → allocate extra time for testing
- Temporal decay affects all confidence scores → test thoroughly
- Hom-set caching critical for performance → validate cache invalidation logic

**Future Enhancements (Not in Phase 2):**
- Dialogue state UI display (Phase 3)
- Assumption weight slider (Phase 3)
- DS mode visualization (Phase 3)
- Real-time confidence updates (Phase 6)

---

**Ready to Start?** [Task 2.1.1: Dialogue State API →](#task-211-dialogue-state-api)
