# AIF Attack → Dialogue Move Integration

**Status**: ✅ COMPLETED  
**Date**: October 22, 2025  
**Feature**: Auto-create WHY moves when AIF attacks are created  
**Impact**: Unifies AIF graph system with dialogical move system

---

## 🎯 Problem Statement

Previously, the system had two **parallel but disconnected** challenge mechanisms:

1. **AIF Attacks** (via AttackMenuPro):
   - Creates `ConflictApplication` records
   - Creates `ArgumentEdge` entries
   - Visual graph representation
   - ❌ **No dialogue moves created**

2. **Dialogical Moves** (via CommandCard/LegalMoveChips):
   - Creates `DialogueMove` records  
   - Protocol validation (R1-R8)
   - WHY/GROUNDS pairing
   - ❌ **No AIF graph edges created**

**Result**: Users could attack arguments via AttackMenuPro, but these attacks wouldn't appear in the dialogue move history or trigger WHY/GROUNDS protocol flows.

---

## ✅ Solution

**Auto-create WHY dialogue moves when AIF attacks are created.**

When a user creates an attack via `AttackMenuPro`:
1. `/api/ca` creates the `ConflictApplication` (AIF attack)
2. **NEW**: Automatically creates a corresponding WHY `DialogueMove`
3. Links the WHY move back to the attack via `conflictApplicationId` in payload
4. Enables GROUNDS responses to follow normal protocol

---

## 🔧 Implementation

### File Modified

**`app/api/ca/route.ts`** (+45 lines)

### Code Added

```typescript
// Auto-create WHY dialogue move when AIF attack is created
// This unifies the AIF graph system with the dialogical move system
try {
  const targetType = d.conflictedArgumentId ? 'argument' : 'claim';
  const targetId = d.conflictedArgumentId || d.conflictedClaimId;
  
  if (targetId) {
    // Generate expression based on attack type
    const attackLabels = {
      'REBUTS': 'I challenge this conclusion',
      'UNDERCUTS': 'I challenge the reasoning',
      'UNDERMINES': 'I challenge this premise',
    };
    const expression = attackLabels[d.legacyAttackType as keyof typeof attackLabels] || 'I challenge this';
    
    // Create WHY move linked to this attack
    await prisma.dialogueMove.create({
      data: {
        deliberationId: d.deliberationId,
        targetType: targetType as TargetType,
        targetId,
        kind: 'WHY',
        actorId: String(userId),
        payload: {
          cqId: `aif_attack_${created.id}`,
          locusPath: '0',
          expression,
          attackType: d.legacyAttackType,
          conflictApplicationId: created.id, // Link back to AIF attack
        },
        signature: `WHY:${targetType}:${targetId}:aif_attack_${created.id}`,
      },
    });
    
    console.log('[ca] Auto-created WHY move for AIF attack:', {
      attackId: created.id,
      attackType: d.legacyAttackType,
      targetType,
      targetId,
    });
  }
} catch (err) {
  console.error('[ca] Failed to auto-create WHY move:', err);
  // Don't fail the whole request if WHY creation fails
}
```

---

## 📊 Data Flow

### Before (Disconnected)

```
User clicks "Post Rebuttal" in AttackMenuPro
  ↓
POST /api/ca
  ↓
Creates ConflictApplication
  ↓
Creates ArgumentEdge
  ↓
❌ No DialogueMove created
  ↓
Attack visible in graph, but not in dialogue history
```

### After (Integrated)

```
User clicks "Post Rebuttal" in AttackMenuPro
  ↓
POST /api/ca
  ↓
Creates ConflictApplication
  ↓
Creates ArgumentEdge
  ↓
✅ Auto-creates WHY DialogueMove
  ↓
Attack visible in BOTH graph AND dialogue history
  ↓
Author can respond with GROUNDS move
  ↓
Normal protocol flow continues
```

---

## 🔗 Bidirectional Linking

### AIF Attack → Dialogue Move

**ConflictApplication metadata**:
- ID stored in WHY move payload: `conflictApplicationId: created.id`
- Allows tracing from dialogue move back to AIF attack

**WHY Move metadata**:
```json
{
  "cqId": "aif_attack_clmxyz123",
  "locusPath": "0",
  "expression": "I challenge this conclusion",
  "attackType": "REBUTS",
  "conflictApplicationId": "ca_clmxyz456"
}
```

### Dialogue Move → AIF Attack

**Future enhancement**: When WHY moves are created via CommandCard:
- Could optionally create `ConflictApplication` records
- Would complete bidirectional sync
- **Status**: Not implemented yet (AttackMenuPro → WHY only for now)

---

## 🎨 Attack Type Expressions

Each AIF attack type gets a descriptive expression in the WHY move:

| Attack Type | Expression |
|------------|------------|
| `REBUTS` | "I challenge this conclusion" |
| `UNDERCUTS` | "I challenge the reasoning" |
| `UNDERMINES` | "I challenge this premise" |
| *(fallback)* | "I challenge this" |

These appear in:
- DialogueInspector move history
- Legal moves UI (as CQ context)
- Commitment store annotations

---

## 🧪 Testing Guide

### Test 1: Rebut Attack Creates WHY

**Steps**:
1. Open AttackMenuPro on an argument
2. Click "Post Rebuttal" with a counter-claim
3. Submit the attack

**Expected**:
- ✅ ConflictApplication created
- ✅ ArgumentEdge created  
- ✅ WHY DialogueMove created
- ✅ Console logs: `[ca] Auto-created WHY move for AIF attack`
- ✅ WHY appears in DialogueInspector
- ✅ GROUNDS button appears in legal moves

### Test 2: Undercut Attack Creates WHY

**Steps**:
1. Open AttackMenuPro on an argument
2. Enter exception text in "Undercut" section
3. Click "Post Undercut"

**Expected**:
- ✅ WHY move created with `attackType: "UNDERCUTS"`
- ✅ Expression: "I challenge the reasoning"
- ✅ Linked to ConflictApplication via payload

### Test 3: Undermine Attack Creates WHY

**Steps**:
1. Open AttackMenuPro on an argument
2. Select a premise
3. Pick contradicting claim
4. Click "Post Undermine"

**Expected**:
- ✅ WHY move created with `attackType: "UNDERMINES"`
- ✅ Expression: "I challenge this premise"
- ✅ Target type: 'claim' (premise claim ID)

### Test 4: GROUNDS Response Works

**Steps**:
1. After creating an attack (Test 1-3)
2. Switch to the argument author's account
3. Click GROUNDS button for the attack
4. Enter response text

**Expected**:
- ✅ GROUNDS move posts successfully
- ✅ Pairs with AIF-generated WHY move
- ✅ Protocol validation passes
- ✅ CQ marked as satisfied

---

## 🔍 Verification Queries

### Check WHY was created

```sql
SELECT 
  dm.id,
  dm.kind,
  dm.targetType,
  dm.targetId,
  dm.payload->>'attackType' AS attackType,
  dm.payload->>'conflictApplicationId' AS caId,
  dm.createdAt
FROM "DialogueMove" dm
WHERE dm.kind = 'WHY'
  AND dm.payload->>'conflictApplicationId' IS NOT NULL
ORDER BY dm.createdAt DESC
LIMIT 10;
```

### Check ConflictApplication → WHY linking

```sql
SELECT 
  ca.id AS ca_id,
  ca.legacyAttackType,
  ca.createdAt AS ca_created,
  dm.id AS why_id,
  dm.payload->>'expression' AS why_expression,
  dm.createdAt AS why_created
FROM "ConflictApplication" ca
LEFT JOIN "DialogueMove" dm
  ON dm.payload->>'conflictApplicationId' = ca.id
WHERE ca.createdAt > NOW() - INTERVAL '1 day'
ORDER BY ca.createdAt DESC
LIMIT 10;
```

---

## 📈 Benefits

### 1. **System Unification**
- AIF attacks and dialogue moves now work together
- No more parallel tracking systems
- Single source of truth for challenges

### 2. **Protocol Enforcement**
- AIF attacks now subject to dialogue rules
- WHY/GROUNDS pairing automatic
- Turn-taking and burden-of-proof apply

### 3. **Better Auditing**
- All attacks visible in DialogueInspector
- Complete move history for deliberations
- Traceability from graph to protocol

### 4. **Improved UX**
- Authors notified of attacks (WHY moves trigger notifications)
- Legal moves UI shows GROUNDS responses
- CommandCard displays attack context

---

## 🚧 Known Limitations

### 1. **One-Way Integration (for now)**
- ✅ AttackMenuPro → WHY moves (implemented)
- ❌ WHY moves → ConflictApplication (not implemented)
- **Impact**: Manual WHY moves don't create AIF graph edges
- **Future**: Could add reverse integration

### 2. **No Dialogue Status on Edges**
- ✅ WHY moves created
- ❌ ArgumentEdge doesn't show "answered" status
- **Impact**: Graph doesn't reflect GROUNDS responses visually
- **Future**: Add dialogue state to edge rendering

### 3. **Testing Mode Applies**
- `DIALOGUE_TESTING_MODE=true` bypasses author restrictions
- Affects both manual WHY and AIF-generated WHY
- **Reminder**: Disable in production

---

## 🛠️ Future Enhancements

### Phase 1: Bidirectional Sync ⚡
**Add ConflictApplication creation when WHY moves are created**

```typescript
// In /api/dialogue/move when posting WHY
if (kind === 'WHY' && targetType === 'argument') {
  await prisma.conflictApplication.create({
    data: {
      deliberationId,
      conflictingArgumentId: null, // or attacking argument if known
      conflictedArgumentId: targetId,
      legacyAttackType: payload.attackType || 'REBUTS',
      metaJson: { dialogueMoveId: moveId }
    }
  });
}
```

### Phase 2: Visual Indicators 🎨
**Show dialogue status on ArgumentEdges**

```typescript
// In edge rendering component
<ArgumentEdge 
  edge={edge}
  dialogueStatus={
    edge.hasGrounds ? 'answered' : 
    edge.hasWhy ? 'challenged' : 
    'neutral'
  }
/>
```

Colors:
- 🔴 Red edge: Open WHY (no GROUNDS yet)
- 🟡 Yellow edge: Partial GROUNDS
- 🟢 Green edge: Full GROUNDS response

### Phase 3: CQ Integration 🔗
**Link AIF attacks to specific critical questions**

```typescript
// When attack targets a CQ vulnerability
payload: {
  cqId: schemeInstance.cqKey, // Real CQ key instead of generic
  attackType: 'REBUTS',
  cqContext: schemeInstance.cqText
}
```

---

## 📝 Summary

**What Changed**:
- `/api/ca` now auto-creates WHY moves when attacks are posted
- AIF attacks (REBUTS, UNDERCUTS, UNDERMINES) trigger dialogue protocol
- WHY moves link back to attacks via `conflictApplicationId`

**Impact**:
- Unifies two major systems (AIF + dialogue)
- Enables protocol enforcement on graph attacks
- Improves auditing and notification flow

**Next Steps**:
- Test with real attacks in deliberations
- Monitor console logs for successful WHY creation
- Consider adding visual indicators to edges (Phase 2)

---

**Ready for testing!** Create an attack via AttackMenuPro and verify the WHY move appears in DialogueInspector. 🚀
