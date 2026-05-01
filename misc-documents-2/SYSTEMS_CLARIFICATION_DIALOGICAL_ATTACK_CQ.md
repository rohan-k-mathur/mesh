# System Relationships: Dialogical Moves, Attack System, and Critical Questions

**Date:** November 19, 2025  
**Purpose:** Clarify the differences, relationships, and connections between three core Mesh systems

---

## Executive Summary

These three systems are **distinct but deeply interconnected** layers of argumentation:

1. **Dialogical Moves System** = User communication protocol (WHY/GROUNDS/CONCEDE)
2. **Attack System** = Formal argumentation structure (REBUTS/UNDERCUTS/UNDERMINES)
3. **Critical Questions (CQ) System** = Quality assurance layer (scheme-based validation)

**Key Insight:** They form a **pipeline** where dialogical moves **trigger** CQs, which **generate** attacks.

---

## 1. Dialogical Moves System

### What It Is
A **conversational protocol** for participants to question, defend, and negotiate claims/arguments in a structured dialogue.

### Core Moves

```typescript
type DialogueKind = 
  | "ASSERT"    // Make a claim or propose an argument
  | "WHY"       // Challenge: "Why should I accept this?"
  | "GROUNDS"   // Defend: "Here's my reasoning/evidence"
  | "CONCEDE"   // Surrender: "You're right, I accept"
  | "RETRACT"   // Withdraw: "I take back my claim"
  | "CLOSE"     // End dialogue thread
  | "THEREFORE" // Inference step
  | "SUPPOSE"   // Hypothetical
  | "DISCHARGE"; // Release assumption
```

### Database Model

```prisma
model DialogueMove {
  id             String   @id @default(cuid())
  deliberationId String
  targetType     String   // 'argument' | 'claim'
  targetId       String   // What is being addressed
  kind           String   // WHY, GROUNDS, etc.
  actorId        String   // Who made the move
  payload        Json?    // Move-specific data
  createdAt      DateTime
  
  // Provenance tracking
  createdArguments   Argument[]
  createdConflicts   ConflictApplication[]
  introducedClaims   Claim[]
  
  // Completion tracking
  completed   Boolean
  completedAt DateTime?
}
```

### Key Characteristics

- **User-facing:** Direct interaction by participants
- **Temporal:** Moves happen in chronological order
- **Conversational:** Forms dialogue trees with replies
- **Actionable:** Each move has consequences (creates arguments, triggers CQs)

### Example Flow

```
User A: ASSERT "Climate change is caused by CO2"
User B: WHY (challenges the claim)
User A: GROUNDS "Here's IPCC data showing correlation" → Creates Argument
System: Triggers CQs for the scheme used in GROUNDS
```

---

## 2. Attack System (Formal Argumentation)

### What It Is
The **structural backbone** of argumentation, representing logical relationships and conflicts between claims/arguments using ASPIC+ framework.

### Core Attack Types

#### Claim-Level Attacks (ClaimEdge)

```prisma
model ClaimEdge {
  id          String        @id
  fromClaimId String        // Attacker
  toClaimId   String        // Defender
  type        ClaimEdgeType // 'supports' | 'rebuts'
  attackType  ClaimAttackType? // REBUTS | UNDERCUTS | UNDERMINES
  targetScope String?       // 'premise' | 'inference' | 'conclusion'
  
  // CQ Enhancement: Track which CQ generated this attack
  metaJson    Json?
  cqAttacks   CQAttack[]    // Back-reference
}

enum ClaimAttackType {
  SUPPORTS    // Not an attack, positive relationship
  REBUTS      // Attack the conclusion (contrary claim)
  UNDERCUTS   // Attack the inference (warrant/rule)
  UNDERMINES  // Attack a premise (input claim)
}
```

#### Argument-Level Attacks (ConflictApplication)

```prisma
model ConflictApplication {
  id             String   @id
  deliberationId String
  schemeId       String?  // Which conflict scheme applies
  
  // One of these is the attacker
  conflictingClaimId    String?
  conflictingArgumentId String?
  
  // One of these is the defender
  conflictedClaimId    String?
  conflictedArgumentId String?
  
  // ASPIC+ semantics
  aspicAttackType   String?  // 'undermining' | 'rebutting' | 'undercutting'
  aspicDefeatStatus Boolean? // Did attack succeed?
  aspicMetadata     Json?    // Full attack details
  
  // Provenance
  createdByMoveId String?
  createdByMove   DialogueMove?
  
  // CQ linkage
  cqAttacks CQAttack[]
}
```

### Attack Type Semantics

| Type | Target | Meaning | Example |
|------|--------|---------|---------|
| **REBUTS** | Conclusion | Direct contradiction | "No, climate change is NOT caused by CO2" |
| **UNDERCUTS** | Inference | Rule/warrant is faulty | "Correlation doesn't imply causation" |
| **UNDERMINES** | Premise | Input data is wrong | "That IPCC data is outdated" |

### Key Characteristics

- **Formal:** Defined by argumentation theory (Dung, ASPIC+)
- **Static:** Relationships persist until explicitly changed
- **Structural:** Forms directed attack graphs (CEG - Claim-Edge Graph)
- **Computable:** Enables grounded semantics (IN/OUT/UNDEC labels)

### Grounded Semantics

The attack graph is used to compute **acceptability labels**:

```typescript
// lib/ceg/grounded.ts
function groundedLabels(nodes: string[], edges: Edge[]): Map<string, Label> {
  // Fixed-point algorithm:
  // - Node is IN if all attackers are OUT
  // - Node is OUT if any attacker is IN
  // - Node is UNDEC otherwise (cycles, incomplete info)
}
```

**Result:** Every claim gets labeled IN (accepted), OUT (rejected), or UNDEC (undecided).

---

## 3. Critical Questions (CQ) System

### What It Is
A **quality assurance framework** that validates arguments by asking **scheme-specific questions** that expose weaknesses and generate potential attacks.

### Database Models

```prisma
model CQStatus {
  id         String       @id
  targetType TargetType   // 'argument' | 'claim'
  targetId   String
  schemeKey  String       // Which argumentation scheme
  cqKey      String       // Which specific CQ in that scheme
  statusEnum CQStatusEnum // OPEN, PENDING_REVIEW, SATISFIED, etc.
  satisfied  Boolean
  
  // Multi-response system
  canonicalResponseId String?
  responses           CQResponse[]
  
  // Track attacks generated from this CQ
  attacks CQAttack[]
}

enum CQStatusEnum {
  OPEN                 // No response yet
  PENDING_REVIEW       // Responses awaiting approval
  PARTIALLY_SATISFIED  // Some responses approved
  SATISFIED            // Fully answered
  CHALLENGED           // Answer disputed
  UPDATED              // Response revised
}

model CQResponse {
  id         String     @id
  cqStatusId String
  text       String     // The actual answer
  authorId   String
  status     String     // 'pending' | 'approved' | 'rejected'
  approvedBy String?
  createdAt  DateTime
}

model CQAttack {
  id        String   @id
  cqStatusId String
  cqStatus  CQStatus
  
  // Links to actual attack (exactly one set)
  conflictApplicationId String?
  conflictApplication   ConflictApplication?
  claimEdgeId           String?
  claimEdge             ClaimEdge?
  
  createdById String
  createdAt   DateTime
}
```

### How CQs Work

#### Step 1: Scheme Association
When an argument is created with a scheme (e.g., "Argument from Expert Opinion"), that scheme has **predefined critical questions**:

```typescript
// Example: Expert Opinion Scheme
const expertOpinionCQs = [
  {
    key: "expertise",
    text: "How credible is E as an expert source?",
    attackType: "UNDERMINES",
    targetScope: "premise"
  },
  {
    key: "relevance", 
    text: "Is E an expert in the field that A is in?",
    attackType: "UNDERMINES",
    targetScope: "premise"
  },
  {
    key: "consistency",
    text: "What did E assert that implies A?",
    attackType: "UNDERCUTS",
    targetScope: "inference"
  }
];
```

#### Step 2: CQ Generation
System creates `CQStatus` records for each CQ:

```typescript
// When GROUNDS move creates argument
for (const cq of scheme.cqs) {
  await prisma.cQStatus.create({
    targetType: 'argument',
    targetId: argument.id,
    schemeKey: scheme.key,
    cqKey: cq.key,
    statusEnum: 'OPEN',
    satisfied: false
  });
}
```

#### Step 3: User Response
Participants can answer CQs:

```typescript
// User provides GROUNDS for a CQ
await prisma.cQResponse.create({
  cqStatusId: cqStatus.id,
  text: "Dr. Smith has 20 years experience in climate science",
  authorId: currentUser.id,
  status: 'pending'
});
```

#### Step 4: Attack Generation
If a CQ is **not satisfied** or is **challenged**, it can generate attacks:

```typescript
// If expertise CQ is unsatisfied, generate UNDERMINES attack
const attack = await prisma.conflictApplication.create({
  conflictingClaimId: "expert-not-credible-claim",
  conflictedArgumentId: originalArgument.id,
  aspicAttackType: 'undermining',
  metaJson: { source: 'cq', cqKey: 'expertise' }
});

await prisma.cQAttack.create({
  cqStatusId: cqStatus.id,
  conflictApplicationId: attack.id
});
```

### Key Characteristics

- **Proactive:** Anticipates objections before they're raised
- **Scheme-based:** Questions depend on argument type
- **Quality-driven:** Ensures arguments are well-supported
- **Attack-generating:** Unsatisfied CQs become formal attacks

---

## 4. System Interactions & Pipeline

### The Complete Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    DIALOGICAL MOVES LAYER                       │
│  (User Interaction: WHY, GROUNDS, CONCEDE, RETRACT)            │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ GROUNDS move creates Argument
                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                  CRITICAL QUESTIONS LAYER                       │
│  (Quality Assurance: Scheme-based validation)                  │
│  - Generate CQStatus records for scheme                        │
│  - Users provide CQResponse answers                            │
│  - System evaluates satisfaction                               │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ Unsatisfied CQ generates attack
                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                     ATTACK SYSTEM LAYER                         │
│  (Formal Structure: REBUTS/UNDERCUTS/UNDERMINES)               │
│  - ConflictApplication created                                 │
│  - ClaimEdge created                                           │
│  - CQAttack links back to source CQ                            │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ Attack graph used for computation
                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                   GROUNDED SEMANTICS LAYER                      │
│  (Computation: IN/OUT/UNDEC labels)                            │
│  - Run fixed-point algorithm on attack graph                   │
│  - Store ClaimLabel results                                    │
│  - Update CEG visualization                                    │
└─────────────────────────────────────────────────────────────────┘
```

### Concrete Example

#### Initial State
```typescript
// User makes a claim
Claim A: "Vaccines prevent disease"
```

#### Dialogical Layer
```typescript
// User B challenges
DialogueMove {
  kind: "WHY",
  targetType: "claim",
  targetId: claimA.id,
  actorId: userB.id
}

// User A provides grounds
DialogueMove {
  kind: "GROUNDS",
  targetType: "claim", 
  targetId: claimA.id,
  actorId: userA.id,
  payload: {
    conclusionClaimId: claimA.id,
    premiseClaimIds: [claimP1.id, claimP2.id],
    schemeKey: "argument_from_expert_opinion",
    warrantText: "Medical experts are reliable sources"
  }
}
→ Creates Argument A1
```

#### CQ Layer
```typescript
// System generates CQs for expert opinion scheme
CQStatus {
  targetId: argumentA1.id,
  schemeKey: "argument_from_expert_opinion",
  cqKey: "expertise",
  text: "How credible is the expert?",
  statusEnum: "OPEN"
}

CQStatus {
  targetId: argumentA1.id,
  schemeKey: "argument_from_expert_opinion",
  cqKey: "field_relevance",
  text: "Is the expert in the relevant field?",
  statusEnum: "OPEN"
}

// User A provides response
CQResponse {
  cqStatusId: cq1.id,
  text: "Dr. Smith, WHO chief virologist, 30 years experience",
  status: "pending"
}
→ CQStatus.statusEnum = "PENDING_REVIEW"

// Author approves response
→ CQStatus.statusEnum = "SATISFIED"
→ CQStatus.satisfied = true

// User C challenges the second CQ
DialogueMove {
  kind: "WHY",
  targetType: "argument",
  targetId: argumentA1.id,
  payload: { cqKey: "field_relevance" }
}
```

#### Attack Layer
```typescript
// User C's challenge generates an attack
ConflictApplication {
  conflictingClaimId: claimC1.id, // "Dr. Smith is not a virologist"
  conflictedArgumentId: argumentA1.id,
  aspicAttackType: "undermining", // Attacks a premise
  metaJson: { 
    source: "cq",
    cqKey: "field_relevance",
    cqStatusId: cq2.id
  }
}

CQAttack {
  cqStatusId: cq2.id,
  conflictApplicationId: conflict1.id
}
→ Creates ClaimEdge: claimC1 --[UNDERMINES]--> claimP1
```

#### Grounded Semantics
```typescript
// Attack graph now includes:
// - Original argument structure
// - New undermining attack from CQ

// Recompute labels
await recomputeGroundedForDelib(deliberationId);

// Results:
ClaimLabel(claimA) = "UNDEC" // Because undermined premise
ClaimLabel(claimP1) = "OUT"  // Because attacked by claimC1 (IN)
ClaimLabel(claimC1) = "IN"   // Because unattacked
```

---

## 5. Key Distinctions

### Dialogical vs Attack System

| Aspect | Dialogical Moves | Attack System |
|--------|------------------|---------------|
| **Nature** | Temporal, conversational | Structural, persistent |
| **Purpose** | User interaction protocol | Formal argumentation logic |
| **Visibility** | User-facing actions | Backend graph structure |
| **Computation** | No computation, just recording | Grounded semantics computation |
| **Example** | "WHY do you believe that?" | ClaimEdge(A attacks B, type: REBUTS) |

### CQ vs Dialogical System

| Aspect | Critical Questions | Dialogical Moves |
|--------|-------------------|------------------|
| **Trigger** | Automatic (on argument creation) | User-initiated |
| **Content** | Predefined by scheme | Freeform user input |
| **Purpose** | Systematic validation | Open conversation |
| **Response** | Structured answers | Any dialogue move |
| **Example** | "Is the expert credible?" | User says "WHY?" |

### CQ vs Attack System

| Aspect | Critical Questions | Attack System |
|--------|-------------------|---------------|
| **Role** | Quality assurance, attack **generator** | Formal structure, attack **representation** |
| **Temporal** | Mid-layer (between dialogue and attacks) | Bottom layer (final structure) |
| **Mutability** | CQs can be satisfied/challenged over time | Attacks persist (but can be deleted) |
| **Example** | CQ: "Is source reliable?" → generates attack | ClaimEdge: Source unreliable (UNDERMINES premise) |

---

## 6. Integration Points

### Where They Connect in Code

#### DialogueMove → Argument
```typescript
// app/api/dialogue/submit/route.ts
if (moveKind === 'GROUNDS') {
  const argument = await createArgument({
    conclusionClaimId,
    premiseClaimIds,
    schemeKey,
    warrantText,
    createdByMoveId: dialogueMove.id // 👈 Provenance link
  });
}
```

#### Argument → CQStatus
```typescript
// After creating argument with scheme
const scheme = await prisma.argumentScheme.findUnique({
  where: { key: schemeKey },
  include: { cqs: true }
});

for (const cq of scheme.cqs) {
  await prisma.cQStatus.create({
    targetType: 'argument',
    targetId: argument.id,
    schemeKey: scheme.key,
    cqKey: cq.key,
    statusEnum: 'OPEN'
  });
}
```

#### CQStatus → ConflictApplication
```typescript
// When CQ is challenged or unsatisfied
if (!cqStatus.satisfied && cqStatus.attackType) {
  const conflict = await prisma.conflictApplication.create({
    conflictingClaimId: challengeClaim.id,
    conflictedArgumentId: cqStatus.targetId,
    aspicAttackType: cqStatus.attackType, // 'undermining' | 'undercutting'
    metaJson: {
      source: 'cq',
      cqKey: cqStatus.cqKey,
      cqStatusId: cqStatus.id
    }
  });
  
  await prisma.cQAttack.create({
    cqStatusId: cqStatus.id,
    conflictApplicationId: conflict.id
  });
}
```

#### ConflictApplication → ClaimEdge
```typescript
// Maintain legacy AF compatibility
if (conflict.conflictingClaimId && conflict.conflictedClaimId) {
  await prisma.claimEdge.create({
    fromClaimId: conflict.conflictingClaimId,
    toClaimId: conflict.conflictedClaimId,
    type: 'rebuts', // or determined from aspicAttackType
    attackType: conflict.legacyAttackType,
    metaJson: {
      source: 'conflict_application',
      conflictId: conflict.id
    }
  });
}
```

#### ClaimEdge → ClaimLabel (Grounded Semantics)
```typescript
// lib/ceg/grounded.ts
export async function recomputeGroundedForDelib(deliberationId: string) {
  const claims = await prisma.claim.findMany({ where: { deliberationId } });
  const edges = await prisma.claimEdge.findMany({ where: { deliberationId } });
  
  const labels = groundedLabels(
    claims.map(c => c.id),
    edges.map(e => ({
      from: e.fromClaimId,
      to: e.toClaimId,
      isAttack: e.type === 'rebuts' || 
                e.attackType === 'UNDERCUTS' || 
                e.attackType === 'UNDERMINES'
    }))
  );
  
  for (const [claimId, label] of labels) {
    await prisma.claimLabel.upsert({
      where: { claimId },
      update: { label, computedAt: new Date() },
      create: { claimId, label, semantics: 'grounded' }
    });
  }
}
```

### Event System

All three systems trigger refresh events:

```typescript
// After dialogue move
window.dispatchEvent(new CustomEvent('mesh:dialogue:refresh', {
  detail: { deliberationId }
}));

// After CQ status change
window.dispatchEvent(new CustomEvent('mesh:cq:refresh', {
  detail: { deliberationId }
}));

// After attack created or grounded semantics recomputed
window.dispatchEvent(new CustomEvent('mesh:ceg:refresh', {
  detail: { deliberationId }
}));
```

**Components listen:**
- `useCegData` → listens to all three events
- `useCQData` → listens to `cq:refresh` and `dialogue:refresh`
- `useDialogueData` → listens to `dialogue:refresh`

---

## 7. UI Integration Status

### Current State (Per CEG Audit)

| Component | Dialogical | CQ | Attack Graph |
|-----------|------------|----|--------------| 
| **CegMiniMap** | ✅ WHY/GROUNDS badges | ✅ CQ% badges | ✅ Full graph viz |
| **ClaimMiniMap** | ✅ Full integration | ✅ Full integration | ✅ CEG labels |
| **ClaimDetailPanel** | ✅ WHY/GROUNDS counts | ✅ CQ completion% | ✅ CEG metrics |
| **AIFArgumentsListPro** | ✅ Move toolbar | ⚠️ Data fetched, no UI | ✅ Attack display |
| **CriticalQuestionsV2** | ✅ WHY button per CQ | ✅ Response system | ✅ Links to attacks |
| **AttackMenuPro** | ❌ Not integrated | ❌ Not integrated | ✅ Attack creation |

### Visualization Examples

#### CegMiniMap Node
```
┌────────────────┐
│  [IN] Node     │  ← Grounded semantics label
│  +5            │  ← Approval count
│  CQ 75%        │  ← Critical question completion
│  ?2  G:1       │  ← Open WHYs, GROUNDS count
└────────────────┘
```

#### ClaimDetailPanel
```
╔══════════════════════════════════════════╗
║ Claim: "Vaccines prevent disease"       ║
║                                          ║
║ CEG Status: [IN] Accepted               ║
║ Confidence: ████████░░ 80%              ║
║                                          ║
║ Dialogical Activity:                    ║
║   WHY moves: 3 (1 open)                 ║
║   GROUNDS: 2                            ║
║   Concessions: 1                        ║
║                                          ║
║ Critical Questions:                     ║
║   Required: 5                           ║
║   Satisfied: 4 (80%)                    ║
║   [View Details]                        ║
║                                          ║
║ Attack Graph:                           ║
║   Supporters: 2                         ║
║   Attackers: 1 (UNDERMINES premise)     ║
║   Centrality: 0.65 (hub)                ║
╚══════════════════════════════════════════╝
```

---

## 8. API Endpoints

### Dialogical Moves
```typescript
GET  /api/deliberations/[id]/moves
POST /api/dialogue/submit
GET  /api/deliberations/[id]/moves?targetId=[claimId]&kind=WHY
```

### Critical Questions
```typescript
GET  /api/deliberations/[id]/cqs
GET  /api/cqs?targetType=claim&targetId=[claimId]
POST /api/cqs/[cqStatusId]/respond
PUT  /api/cqs/[cqStatusId]/approve
```

### Attack System
```typescript
GET  /api/deliberations/[id]/ceg/mini  // Full attack graph
GET  /api/claims/[id]/edges            // Claim attack edges
GET  /api/arguments/[id]/conflicts     // Argument conflicts
POST /api/conflicts                     // Create attack
```

---

## 9. Developer Mental Model

### Think of them as layers in a stack:

```
┌────────────────────────────────────────────┐
│  UI Layer: User clicks "WHY?" button      │
└─────────────────┬──────────────────────────┘
                  ↓
┌────────────────────────────────────────────┐
│  Dialogical Layer: Record WHY move        │
│  → Creates DialogueMove record            │
└─────────────────┬──────────────────────────┘
                  ↓
┌────────────────────────────────────────────┐
│  CQ Layer: Check if CQ-related            │
│  → May create CQStatus or link to CQ     │
└─────────────────┬──────────────────────────┘
                  ↓
┌────────────────────────────────────────────┐
│  Attack Layer: If CQ unsatisfied          │
│  → Create ConflictApplication             │
│  → Create ClaimEdge                       │
│  → Link via CQAttack                      │
└─────────────────┬──────────────────────────┘
                  ↓
┌────────────────────────────────────────────┐
│  Computation Layer: Recompute semantics   │
│  → Run grounded algorithm                 │
│  → Update ClaimLabel records              │
│  → Trigger UI refresh events              │
└────────────────────────────────────────────┘
```

### When to use each system:

**Use Dialogical Moves when:**
- User is having a conversation
- Need to track "who said what when"
- Want to show dialogue history/threading
- Building chat-like UI

**Use Critical Questions when:**
- Want to ensure argument quality
- Need structured validation
- Want to guide users to strengthen arguments
- Building scheme-based argument composer

**Use Attack System when:**
- Need formal argumentation structure
- Want to compute acceptability (grounded semantics)
- Building argument graph visualization
- Need to track logical conflicts

---

## 10. Common Patterns

### Pattern 1: WHY → CQ → Attack
```typescript
// 1. User asks WHY
const whyMove = await createDialogueMove({
  kind: 'WHY',
  targetId: argument.id
});

// 2. System links to relevant CQ
const cq = await findRelevantCQ(argument.id);
await linkMoveToCQ(whyMove.id, cq.id);

// 3. If CQ remains unsatisfied, generate attack
if (!cq.satisfied) {
  const attack = await generateAttackFromCQ(cq);
}
```

### Pattern 2: GROUNDS → Argument → CQs
```typescript
// 1. User provides GROUNDS
const groundsMove = await createDialogueMove({
  kind: 'GROUNDS',
  payload: { 
    conclusionClaimId,
    premiseClaimIds,
    schemeKey 
  }
});

// 2. Create argument
const argument = await createArgument({
  ...groundsMove.payload,
  createdByMoveId: groundsMove.id
});

// 3. Generate CQs for scheme
const cqs = await generateCQsForScheme(
  argument.id, 
  schemeKey
);
```

### Pattern 3: Attack → Grounded Semantics → UI Update
```typescript
// 1. Attack is created (from any source)
const attack = await createClaimEdge({
  fromClaimId,
  toClaimId,
  type: 'rebuts'
});

// 2. Recompute grounded semantics
await recomputeGroundedForDelib(deliberationId);

// 3. Trigger UI refresh
window.dispatchEvent(new CustomEvent('mesh:ceg:refresh', {
  detail: { deliberationId }
}));

// 4. Components react
// - CegMiniMap updates node colors
// - ClaimDetailPanel updates CEG labels
// - Stats components update metrics
```

---

## 11. Summary Table

| System | Purpose | User-Facing? | Persists? | Computes? | Example |
|--------|---------|--------------|-----------|-----------|---------|
| **Dialogical Moves** | Communication protocol | ✅ Yes | ✅ Yes | ❌ No | "WHY do you believe that?" |
| **Critical Questions** | Quality assurance | ✅ Yes | ✅ Yes | ⚠️ Partial (satisfaction) | "Is the expert credible?" |
| **Attack System** | Formal structure | ⚠️ Indirect | ✅ Yes | ✅ Yes (semantics) | ClaimEdge(A REBUTS B) |

---

## 12. Key Takeaways

1. **They're complementary, not redundant:**
   - Dialogical = How users interact
   - CQ = What questions to ask
   - Attack = What the structure looks like

2. **They form a pipeline:**
   - Dialogical moves → trigger CQs
   - CQs → generate attacks
   - Attacks → enable computation

3. **They have different lifecycles:**
   - Moves: Temporal, chronological
   - CQs: Evolving (OPEN → SATISFIED → CHALLENGED)
   - Attacks: Persistent, structural

4. **They serve different audiences:**
   - Moves: Human users (conversation)
   - CQs: Both humans (validation) and system (attack generation)
   - Attacks: Primarily system (computation), humans see results

5. **Integration is key:**
   - Best UIs show all three simultaneously
   - CegMiniMap example: Shows attack graph + CQ badges + dialogical status
   - Users see the complete picture

---

## 13. Further Reading

- **Dialogical Moves:** `CQ_DIALOGICAL_INTEGRATION_ANALYSIS.md`
- **Critical Questions:** `CRITICAL_QUESTIONS_UPGRADE_SUMMARY.md`
- **Attack System:** `CEG_SYSTEM_AUDIT_REPORT.md` (Section 3)
- **ASPIC+ Framework:** `ASPIC_IMPLEMENTATION_TODO.md`
- **Grounded Semantics:** `lib/ceg/grounded.ts` (implementation)

---

**Questions? See:**
- Database schema: `lib/models/schema.prisma`
- Event system: Section 6 "Integration Points"
- UI examples: Section 7 "UI Integration Status"
- Code patterns: Section 10 "Common Patterns"
