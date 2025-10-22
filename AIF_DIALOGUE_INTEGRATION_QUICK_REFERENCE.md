# Quick Reference: AIF ↔ Dialogue Integration

## 🎯 What Changed?

Three major features added to integrate AIF attacks with dialogue moves:

1. **Bidirectional Sync**: WHY moves ↔ ConflictApplication (both ways)
2. **Visual Status**: Color-coded attack cards show dialogue state
3. **CQ Context**: Attacks link to specific critical questions

---

## 🔄 Bidirectional Sync

### Creating Attacks via AttackMenuPro

**Before**:
```
User clicks "Post Rebuttal"
  → ConflictApplication created
  → ArgumentEdge created
  → ❌ No DialogueMove
```

**After**:
```
User clicks "Post Rebuttal"
  → ConflictApplication created
  → ArgumentEdge created
  → ✅ WHY DialogueMove auto-created
  → Links back via metaJson
```

### Creating WHY via CommandCard

**Before**:
```
User posts WHY move
  → DialogueMove created
  → ❌ No ConflictApplication
  → ❌ No graph representation
```

**After**:
```
User posts WHY move
  → DialogueMove created
  → ✅ ConflictApplication auto-created
  → Full graph representation
```

---

## 🎨 Visual Status Indicators

### Attack Card Colors

| Status | Color | Condition | Badge |
|--------|-------|-----------|-------|
| Answered | 🟢 Green (`emerald-50`) | hasGrounds = true | "✓ Answered" |
| Challenged | 🔴 Red (`rose-50`) | hasWhy = true, hasGrounds = false | "⚠ Challenged" |
| Neutral | ⚪ Light (`rose-50`) | No dialogue activity | None |

### API Response

GET `/api/arguments/{id}/attacks` now includes:

```typescript
{
  dialogueStatus: 'answered' | 'challenged' | 'neutral',
  hasWhy: boolean,
  hasGrounds: boolean,
  whyCount: number,      // Number of WHY moves
  groundsCount: number,  // Number of GROUNDS responses
}
```

### Example Usage

```tsx
<div className={`attack-card ${
  attack.dialogueStatus === 'answered' 
    ? 'bg-emerald-50 border-emerald-300'
    : attack.dialogueStatus === 'challenged'
    ? 'bg-rose-50 border-rose-300'
    : 'bg-rose-50 border-rose-200'
}`}>
  {attack.dialogueStatus === 'answered' && (
    <span className="badge bg-emerald-600">✓ Answered</span>
  )}
  {attack.dialogueStatus === 'challenged' && (
    <span className="badge bg-rose-600">⚠ Challenged</span>
  )}
</div>
```

---

## 🔗 CQ Integration

### How It Works

When creating attacks via AttackMenuPro, the system:

1. **Fetches CQs** for the target (claim or argument)
2. **Finds unsatisfied CQ** matching the attack type
3. **Links attack to CQ** via `metaJson`
4. **WHY move includes** full CQ context

### Attack Type → CQ Mapping

**REBUTS** (attacks conclusion):
- Target: Conclusion claim
- CQ filter: Any unsatisfied claim-level CQ
- Example CQs: "Is this claim factually accurate?", "Is there evidence?"

**UNDERCUTS** (attacks reasoning):
- Target: Argument
- CQ filter: Inference-related questions
- Keywords: "inference", "reasoning", "warrant"
- Example CQs: "Is the inference justified?", "Are there exceptions?"

**UNDERMINES** (attacks premise):
- Target: Specific premise claim
- CQ filter: Any unsatisfied premise-level CQ
- Example CQs: "Is this premise true?", "Is this assumption valid?"

### metaJson Structure

```typescript
// ConflictApplication.metaJson
{
  cqId: "E1",                          // Actual CQ key from scheme
  schemeKey: "expert_opinion",         // Argumentation scheme
  cqText: "Is the expert credible?",   // Full question text
  cqContext: "Attacking: Is the expert credible?",
  dialogueMoveId: "move_xyz123",       // Link to WHY move (Phase 1)
}

// DialogueMove.payload (WHY)
{
  cqId: "E1",                          // Same CQ key
  schemeKey: "expert_opinion",
  cqText: "Is the expert credible?",   // For tooltips
  expression: "Attacking: Is the expert credible?",
  attackType: "REBUTS",
  conflictApplicationId: "ca_abc456",  // Link to attack
}
```

### Console Logs

Look for these logs when creating attacks:

```
[AttackMenuPro] Linking rebuttal to CQ: { 
  cqId: 'E1', 
  schemeKey: 'expert_opinion', 
  cqText: 'Is the expert credible?', 
  cqContext: 'Attacking: Is the expert credible?' 
}

[ca] Auto-created WHY move for AIF attack: { 
  attackId: 'ca_xyz', 
  attackType: 'REBUTS', 
  targetType: 'claim', 
  targetId: 'claim_abc', 
  cqId: 'E1', 
  cqText: 'Is the expert credible...' 
}

[dialogue/move] Auto-created ConflictApplication for WHY: { 
  whyMoveId: 'move_xyz', 
  caId: 'ca_abc', 
  attackType: 'REBUTS', 
  targetId: 'arg_123' 
}
```

---

## 🔍 Debugging Checklist

### Issue: Attack created but no WHY move

**Check**:
1. Console for errors: `[ca] Failed to auto-create WHY move:`
2. Database: `SELECT * FROM "DialogueMove" WHERE kind = 'WHY' ORDER BY "createdAt" DESC`
3. Look for try/catch in `/api/ca/route.ts` (failure is non-blocking)

**Fix**: Check userId is valid, deliberationId matches

---

### Issue: WHY created but no ConflictApplication

**Check**:
1. Console for errors: `[dialogue/move] Failed to auto-create ConflictApplication:`
2. Verify `targetType === 'argument'` (only args get ConflictApplication)
3. Check `payload.conflictApplicationId` isn't already set

**Fix**: Ensure Prisma client is up to date (`npx prisma generate`)

---

### Issue: Attack card shows wrong status

**Check**:
1. Expand ArgumentCard and check network tab
2. Verify GET `/api/arguments/{id}/attacks` returns `dialogueStatus` field
3. Check WHY/GROUNDS moves exist in database

**Fix**:
- Run `npx prisma generate` if `dialogueStatus` missing
- Verify move queries target correct deliberationId + targetId

---

### Issue: No CQ metadata in attack

**Check**:
1. Console logs: Look for `[AttackMenuPro] Linking ... to CQ:`
2. Verify CQs exist for target: `GET /api/cqs?targetType=claim&targetId={id}`
3. Check if CQs are unsatisfied (satisfied CQs are skipped)

**Fix**:
- Ensure claim has schemes attached (call ensure-schemes endpoint)
- Verify at least one CQ is not satisfied

---

## 📊 Database Queries

### Find recent bidirectional links

```sql
-- WHY moves with ConflictApplication links
SELECT 
  dm.id AS why_id,
  dm.payload->>'conflictApplicationId' AS ca_id,
  dm.payload->>'cqId' AS cq_id,
  ca.id AS ca_check,
  ca."metaJson"->>'dialogueMoveId' AS dm_check
FROM "DialogueMove" dm
LEFT JOIN "ConflictApplication" ca 
  ON ca.id = dm.payload->>'conflictApplicationId'
WHERE dm.kind = 'WHY'
  AND dm."createdAt" > NOW() - INTERVAL '1 day'
ORDER BY dm."createdAt" DESC
LIMIT 10;
```

### Check dialogue status for argument

```sql
-- Count WHY and GROUNDS for an argument
SELECT 
  (SELECT COUNT(*) FROM "DialogueMove" 
   WHERE "targetType" = 'argument' 
     AND "targetId" = 'arg_123' 
     AND kind = 'WHY') AS why_count,
  (SELECT COUNT(*) FROM "DialogueMove" 
   WHERE "targetType" = 'argument' 
     AND "targetId" = 'arg_123' 
     AND kind = 'GROUNDS') AS grounds_count;
```

### Find attacks with CQ context

```sql
SELECT 
  ca.id,
  ca."legacyAttackType",
  ca."metaJson"->>'cqId' AS cq_id,
  ca."metaJson"->>'cqText' AS cq_text,
  ca."metaJson"->>'schemeKey' AS scheme_key,
  ca."createdAt"
FROM "ConflictApplication" ca
WHERE ca."metaJson"->>'cqId' IS NOT NULL
  AND ca."createdAt" > NOW() - INTERVAL '7 days'
ORDER BY ca."createdAt" DESC
LIMIT 20;
```

---

## 🎓 Common Patterns

### Pattern: Check if attack is answered

```typescript
const isAnswered = attack.dialogueStatus === 'answered';
const needsResponse = attack.dialogueStatus === 'challenged';
```

### Pattern: Get CQ context from WHY move

```typescript
const whyMove = await prisma.dialogueMove.findFirst({
  where: { kind: 'WHY', targetId: argumentId },
  select: { payload: true }
});

const cqContext = {
  cqId: whyMove.payload.cqId,
  cqText: whyMove.payload.cqText,
  schemeKey: whyMove.payload.schemeKey,
};
```

### Pattern: Find all unanswered challenges for user

```typescript
const args = await prisma.argument.findMany({
  where: { authorId: userId },
  select: { id: true }
});

const challenges = await Promise.all(
  args.map(async (arg) => {
    const res = await fetch(`/api/arguments/${arg.id}/attacks`);
    const data = await res.json();
    return data.items.filter(a => a.dialogueStatus === 'challenged');
  })
);
```

---

## 🔄 Migration Notes

### No Breaking Changes

All changes are **additive**:
- Existing ConflictApplication records work as-is
- Existing DialogueMove records work as-is
- ArgumentEdge enrichment is API-only (no schema change)

### Backward Compatibility

**Old attacks** (created before this implementation):
- Will NOT have linked WHY moves (metaJson empty)
- Will show `dialogueStatus: 'neutral'` (no dialogue activity)
- Can be "upgraded" by posting a WHY move manually

**Old WHY moves** (created before this implementation):
- Will NOT have linked ConflictApplication
- Can be "upgraded" by manually creating CA with `metaJson.dialogueMoveId`

---

## 📚 Related Docs

- **Full Implementation**: `AIF_DIALOGUE_ROADMAP_IMPLEMENTATION.md`
- **Original Integration**: `AIF_DIALOGUE_INTEGRATION_COMPLETE.md`
- **CQ System**: `CLAIM_LEVEL_CQ_SYSTEM.md`
- **Testing Guide**: `COMPREHENSIVE_TEST_CHECKLIST.md`

---

**Last Updated**: October 22, 2025  
**Version**: 1.0  
**Status**: Production Ready ✅
