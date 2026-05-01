# Quick Reference: Dialogical Moves vs Attack System vs CQ System

## One-Page Comparison

### 🗣️ Dialogical Moves System
**What:** User conversation protocol  
**When:** During live deliberation  
**Who:** Human participants  
**Data:** `DialogueMove` table  

**Key Moves:**
- `WHY` - Challenge/question
- `GROUNDS` - Defend with reasoning
- `CONCEDE` - Accept opponent's point
- `RETRACT` - Withdraw your claim

**Example:** User clicks "Ask WHY" button, system records the move

---

### ❓ Critical Questions (CQ) System
**What:** Quality assurance for arguments  
**When:** Auto-generated when argument created  
**Who:** System generates, humans answer  
**Data:** `CQStatus`, `CQResponse`, `CQAttack` tables  

**Lifecycle:**
1. OPEN (no answer yet)
2. PENDING_REVIEW (answer submitted)
3. SATISFIED (answer approved)
4. CHALLENGED (answer disputed)

**Example:** "Is the expert credible?" → User provides credentials → System validates

---

### ⚔️ Attack System
**What:** Formal argumentation structure  
**When:** Persistent relationships  
**Who:** System maintains, computes semantics  
**Data:** `ClaimEdge`, `ConflictApplication`, `ClaimLabel` tables  

**Attack Types:**
- `REBUTS` - Contradicts conclusion
- `UNDERCUTS` - Challenges inference/rule
- `UNDERMINES` - Disputes premise/input

**Example:** Claim A attacks Claim B → Grounded semantics → B labeled "OUT"

---

## The Pipeline

```
USER ACTION (Dialogical)
    ↓
QUALITY CHECK (CQ)
    ↓
FORMAL STRUCTURE (Attack)
    ↓
COMPUTATION (Grounded Semantics)
    ↓
UI UPDATE (Labels, Colors, Stats)
```

---

## Quick Decision Guide

**Show dialogue history?** → Use Dialogical Moves  
**Validate argument quality?** → Use CQs  
**Compute acceptability?** → Use Attack System  
**All of the above?** → Use CegMiniMap (integrates all three!)

---

## Code Patterns

### Create a WHY challenge
```typescript
await createDialogueMove({
  kind: 'WHY',
  targetType: 'claim',
  targetId: claimId,
  actorId: userId
});
```

### Check CQ satisfaction
```typescript
const cqs = await prisma.cQStatus.findMany({
  where: { 
    targetId: argumentId,
    statusEnum: 'SATISFIED'
  }
});
const percentSatisfied = (cqs.length / totalCQs) * 100;
```

### Create an attack
```typescript
await prisma.claimEdge.create({
  fromClaimId: attackerClaim.id,
  toClaimId: defenderClaim.id,
  type: 'rebuts',
  attackType: 'REBUTS'
});
await recomputeGroundedForDelib(deliberationId);
```

---

## Database Quick Reference

### DialogueMove (Conversation)
```
id, kind (WHY/GROUNDS/etc), targetId, actorId, createdAt
```

### CQStatus (Quality Check)
```
id, targetId, schemeKey, cqKey, statusEnum, satisfied
```

### ClaimEdge (Attack Structure)
```
id, fromClaimId, toClaimId, type, attackType
```

### ClaimLabel (Computed Result)
```
id, claimId, label (IN/OUT/UNDEC), computedAt
```

---

## Real-World Analogy

**Dialogical Moves** = Court transcript (who said what, when)  
**Critical Questions** = Judge's checklist (is evidence admissible?)  
**Attack System** = Legal precedent graph (which arguments defeat which)  
**Grounded Semantics** = Jury verdict (accepted, rejected, undecided)

---

## See Full Documentation
`SYSTEMS_CLARIFICATION_DIALOGICAL_ATTACK_CQ.md` (8,000+ words, 13 sections)
