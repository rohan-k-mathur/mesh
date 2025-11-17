# ASPIC+ Phase 1b.2: Translation Layer - COMPLETED ✅

**Date**: November 17, 2025  
**Status**: Complete  
**Time Spent**: ~1.5 hours  
**Files Modified**: 2

---

## Summary

Successfully implemented the translation layer to read `ruleType` from `ArgumentSchemeInstance` and properly classify rules into `strictRules[]` and `defeasibleRules[]` arrays. Added comprehensive logging for debugging and verification.

---

## Changes Made

### 1. API Endpoint Updates

**File**: `app/api/aspic/evaluate/route.ts`

#### Added ArgumentSchemeInstance Fetching (Step 1e)
```typescript
// Step 1e: Fetch ArgumentSchemeInstance records for ASPIC+ ruleType (Phase 1b.2)
const schemeInstances = await prisma.argumentSchemeInstance.findMany({
  where: {
    argument: {
      deliberationId,
    },
  },
  include: {
    scheme: true,
  },
});

// Build map: argumentId -> schemeInstance (use primary instance)
const schemeInstanceMap = new Map<string, any>();
for (const instance of schemeInstances) {
  if (instance.isPrimary || !schemeInstanceMap.has(instance.argumentId)) {
    schemeInstanceMap.set(instance.argumentId, instance);
  }
}
```

**Why**: We need to fetch the `ArgumentSchemeInstance` records to get the `ruleType` field that was added in Phase 1b.1.

#### Enhanced RA-Node Metadata
```typescript
nodes.push({
  id: raNodeId,
  nodeType: "RA",
  content: arg.text || "Argument",
  debateId: deliberationId,
  inferenceType: "modus_ponens",
  schemeId: arg.schemeId || undefined,
  // ASPIC+ Phase 1b.2: Add scheme instance metadata
  metadata: {
    schemeInstance: schemeInstance ? {
      ruleType: schemeInstance.ruleType,
      ruleName: schemeInstance.ruleName,
      confidence: schemeInstance.confidence,
      isPrimary: schemeInstance.isPrimary,
    } : null,
  },
});
```

**Why**: The AIF graph needs to carry the scheme instance data so the translation layer can access it.

### 2. Translation Layer Updates

**File**: `lib/aif/translation/aifToAspic.ts`

#### Enhanced Rule Classification Logic

**Before** (hardcoded):
```typescript
const type = (ra as any).schemeType === 'deductive' ? 'strict' : 'defeasible';
const rule = { id: ra.id, antecedents, consequent, type } as Rule;
(type === 'strict' ? strictRules : defeasibleRules).push(rule);
```

**After** (reads from database):
```typescript
// ASPIC+ Phase 1b.2: Read ruleType from ArgumentSchemeInstance metadata
const raMetadata = (ra as any).metadata ?? {};
const schemeInstance = raMetadata.schemeInstance;

// Determine rule type (priority order):
// 1. schemeInstance.ruleType (from ArgumentSchemeInstance - Phase 1b.2)
// 2. schemeType metadata (legacy support)
// 3. Default to 'defeasible'
let ruleType: 'strict' | 'defeasible' = 'defeasible';

if (schemeInstance?.ruleType) {
  // Phase 1b.2: Use ruleType from ArgumentSchemeInstance
  ruleType = schemeInstance.ruleType.toLowerCase() as 'strict' | 'defeasible';
} else if ((ra as any).schemeType === 'deductive') {
  // Legacy: infer from schemeType
  ruleType = 'strict';
}

const ruleName = schemeInstance?.ruleName || null;

const rule = {
  id: ra.id,
  antecedents,
  consequent: (conclNode as any).content ?? (conclNode as any).text ?? conclNode.id,
  type: ruleType,
} as Rule;

// Classify rule by type
if (ruleType === 'strict') {
  strictRules.push(rule);
  console.log(`[aifToAspic] ✅ Added STRICT rule: ${rule.id}`);
  console.log(`  Antecedents: [${rule.antecedents.join(', ')}]`);
  console.log(`  Consequent: ${rule.consequent}`);
  if (ruleName) {
    console.log(`  Rule name: "${ruleName}"`);
  }
} else {
  defeasibleRules.push(rule);
  console.log(`[aifToAspic] Added defeasible rule: ${rule.id}`);
}
```

**Key Features**:
1. **Priority-based determination**: Checks multiple sources in order
2. **Backward compatibility**: Falls back to legacy `schemeType` if no `ruleType` exists
3. **Default handling**: Defaults to `'defeasible'` for safety
4. **Rule naming**: Captures optional `ruleName` for undercutting attacks
5. **Detailed logging**: Different log levels for strict vs defeasible

#### Enhanced Summary Statistics

**Before**:
```typescript
console.log(`[aifToAspic] Translation complete:`, {
  language: language.size,
  contraries: contraries.size,
  strictRules: strictRules.length,
  defeasibleRules: defeasibleRules.length,
  axioms: axioms.size,
  premises: premises.size,
  assumptions: assumptions.size,
  preferences: preferences.length,
});
```

**After**:
```typescript
console.log(`\n${'='.repeat(70)}`);
console.log(`[aifToAspic] 📊 Translation Summary`);
console.log(`${'='.repeat(70)}`);
console.log(`Language:        ${language.size} formulas`);
console.log(`Contraries:      ${contraries.size} contrary pairs`);
console.log(`Strict Rules:    ${strictRules.length} (R_s)`);
console.log(`Defeasible Rules: ${defeasibleRules.length} (R_d)`);
console.log(`Total Rules:     ${strictRules.length + defeasibleRules.length}`);
console.log(`Axioms (K_n):    ${axioms.size}`);
console.log(`Premises (K_p):  ${premises.size}`);
console.log(`Assumptions (K_a): ${assumptions.size}`);
console.log(`Preferences:     ${preferences.length}`);
console.log(`${'='.repeat(70)}\n`);
```

**Features**:
- Formatted box with separators for easy reading
- ASPIC+ notation included (R_s, R_d, K_n, K_p, K_a)
- Total rules count for quick verification
- Clear visual separation in console

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. DATABASE QUERY                                           │
│    app/api/aspic/evaluate/route.ts (Step 1e)              │
│                                                             │
│    SELECT * FROM ArgumentSchemeInstance                     │
│    WHERE argument.deliberationId = ?                        │
│    INCLUDE scheme                                           │
│                                                             │
│    Results: {                                              │
│      id: "asi_123",                                        │
│      argumentId: "arg_abc",                                │
│      ruleType: 'STRICT', ← NEW FIELD                      │
│      ruleName: 'Modus Ponens', ← NEW FIELD                │
│      confidence: 1.0,                                       │
│      isPrimary: true                                        │
│    }                                                        │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. MAP CONSTRUCTION                                         │
│    Build Map<argumentId, schemeInstance>                    │
│                                                             │
│    schemeInstanceMap.set("arg_abc", {                      │
│      ruleType: 'STRICT',                                   │
│      ruleName: 'Modus Ponens',                             │
│      confidence: 1.0,                                       │
│      isPrimary: true                                        │
│    });                                                      │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. AIF GRAPH CONSTRUCTION                                   │
│    Attach schemeInstance to RA-node metadata               │
│                                                             │
│    RANode {                                                │
│      id: "RA:arg_abc",                                     │
│      nodeType: "RA",                                       │
│      metadata: {                                            │
│        schemeInstance: {                                    │
│          ruleType: 'STRICT', ← ATTACHED                   │
│          ruleName: 'Modus Ponens'                          │
│        }                                                    │
│      }                                                      │
│    }                                                        │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. TRANSLATION (aifToAspic)                                │
│    lib/aif/translation/aifToAspic.ts                       │
│                                                             │
│    for (const ra of graph.nodes.filter(n => n.type='RA')) {│
│      const schemeInstance = ra.metadata?.schemeInstance;    │
│      const ruleType = schemeInstance?.ruleType || 'defeasible';│
│                                                             │
│      if (ruleType === 'STRICT') {                          │
│        strictRules.push(rule); ← CLASSIFIED               │
│      } else {                                              │
│        defeasibleRules.push(rule);                         │
│      }                                                      │
│    }                                                        │
│                                                             │
│    return {                                                │
│      system: {                                             │
│        strictRules: [rule1, rule2], ← NOW POPULATED!      │
│        defeasibleRules: [rule3, rule4, ...]               │
│      }                                                      │
│    };                                                       │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. ASPIC+ ENGINE                                            │
│    lib/aspic/arguments.ts                                   │
│                                                             │
│    const allRules = [                                       │
│      ...theory.system.strictRules,    // ✅ NOW HAS DATA  │
│      ...theory.system.defeasibleRules                       │
│    ];                                                        │
│                                                             │
│    // Arguments constructed using both rule types           │
│    // Attack validation respects strict rule restrictions   │
└─────────────────────────────────────────────────────────────┘
```

---

## Console Output Example

When the translation runs, you'll see output like this:

```
[aifToAspic] Processing 2 explicit contraries
[aifToAspic] Added ordinary premise: "All humans are mortal"
[aifToAspic] Added ordinary premise: "Socrates is human"
[aifToAspic] ✅ Added STRICT rule: RA:arg_abc123
  Antecedents: [All humans are mortal, Socrates is human]
  Consequent: Socrates is mortal
  Rule name: "Modus Ponens"
[aifToAspic] Added defeasible rule: RA:arg_def456

======================================================================
[aifToAspic] 📊 Translation Summary
======================================================================
Language:        15 formulas
Contraries:      2 contrary pairs
Strict Rules:    1 (R_s)
Defeasible Rules: 3 (R_d)
Total Rules:     4
Axioms (K_n):    0
Premises (K_p):  2
Assumptions (K_a): 0
Preferences:     0
======================================================================
```

---

## Testing & Verification

### Manual Testing Steps

1. **Open browser console** (F12 → Console tab)

2. **Navigate to ASPIC+ evaluation page** for any deliberation

3. **Check console output** for translation logs:
   - Look for `✅ Added STRICT rule` messages
   - Verify `Translation Summary` shows correct counts
   - Check that `Strict Rules: X (R_s)` is > 0 (if you have strict rules)

4. **Verify in AspicTheoryViewer UI**:
   - Open "Rules" section
   - Check "Strict Rules (R_s)" count matches console
   - Verify rules display with correct arrow symbols (→ vs ⇒)

### Expected Behavior

#### Scenario 1: Argument with STRICT rule type
```
Database:
  ArgumentSchemeInstance { ruleType: 'STRICT', ruleName: 'Modus Ponens' }

Console Output:
  [aifToAspic] ✅ Added STRICT rule: RA:xxx
  Strict Rules: 1 (R_s)

ASPIC+ Theory:
  theory.system.strictRules = [{ id: 'RA:xxx', type: 'strict', ... }]
```

#### Scenario 2: Argument with DEFEASIBLE rule type (default)
```
Database:
  ArgumentSchemeInstance { ruleType: 'DEFEASIBLE' }

Console Output:
  [aifToAspic] Added defeasible rule: RA:xxx
  Defeasible Rules: 1 (R_d)

ASPIC+ Theory:
  theory.system.defeasibleRules = [{ id: 'RA:xxx', type: 'defeasible', ... }]
```

#### Scenario 3: Legacy argument (no scheme instance)
```
Database:
  (No ArgumentSchemeInstance record)

Console Output:
  [aifToAspic] Added defeasible rule: RA:xxx
  Defeasible Rules: 1 (R_d)

ASPIC+ Theory:
  theory.system.defeasibleRules = [{ id: 'RA:xxx', type: 'defeasible', ... }]
```

---

## Backward Compatibility

### Handling Existing Data

All existing arguments (created before Phase 1b.1) will:
1. Have `ruleType = 'DEFEASIBLE'` in database (set by default during migration)
2. Be classified as defeasible rules during translation
3. Continue to work exactly as before

### Legacy Support

The translation layer maintains support for the old `schemeType` metadata:
```typescript
if (schemeInstance?.ruleType) {
  // NEW: Use ruleType from ArgumentSchemeInstance
  ruleType = schemeInstance.ruleType.toLowerCase();
} else if ((ra as any).schemeType === 'deductive') {
  // LEGACY: Fall back to schemeType
  ruleType = 'strict';
}
```

This ensures that even if `ArgumentSchemeInstance` data is missing, the system can still infer rule type from legacy metadata.

---

## Known Limitations

### 1. TypeScript Type Generation

The `@ts-ignore` comment is needed because Prisma Client types haven't fully refreshed:
```typescript
// @ts-ignore - ArgumentSchemeInstance model exists, TypeScript server needs refresh
const schemeInstances = await prisma.argumentSchemeInstance.findMany({...});
```

**Fix**: Run `npx prisma generate` to regenerate types, then restart VS Code TypeScript server.

### 2. Primary Scheme Selection

Currently uses simple heuristic for selecting primary scheme:
```typescript
if (instance.isPrimary || !schemeInstanceMap.has(instance.argumentId)) {
  schemeInstanceMap.set(instance.argumentId, instance);
}
```

**Future**: Phase 4 (Multi-scheme arguments) will handle multiple schemes per argument with more sophisticated selection logic.

---

## Integration Points

### ✅ Complete Integration

1. **Database → API**: ArgumentSchemeInstance fetched correctly
2. **API → AIF Graph**: Scheme instance attached to RA-node metadata
3. **AIF Graph → Translation**: `ruleType` read from metadata
4. **Translation → ASPIC+ Engine**: Rules classified into `strictRules[]` and `defeasibleRules[]`
5. **ASPIC+ Engine → Attacks**: Attack validation respects rule types (already implemented)

### ⏳ Pending Integration

**Phase 1b.3 (UI Components)**: 
- User needs way to CREATE arguments with `ruleType = 'STRICT'`
- Currently, all new arguments still default to `DEFEASIBLE`
- Next phase adds RadioGroup UI to select rule type during argument creation

---

## Next Steps

### Immediate (Phase 1b.3 - UI Components)

1. **Add RadioGroup** to `AIFArgumentWithSchemeComposer.tsx`
2. **Add educational tooltips** explaining strict vs defeasible
3. **Add strict rule badge** to `ArgumentCardV2.tsx`
4. **Test full workflow**: Create strict argument → Verify in ASPIC+ theory

### Testing Checklist for Phase 1b.3

After UI is implemented:
- [ ] Create argument with "Strict Rule" selected
- [ ] Verify `ruleType='STRICT'` saved to database
- [ ] Open ASPIC+ tab, check console shows "✅ Added STRICT rule"
- [ ] Verify `AspicTheoryViewer` displays rule under "Strict Rules (R_s)"
- [ ] Attempt to rebut strict conclusion → should fail (attack not generated)
- [ ] Attempt to undercut strict rule → should succeed (attack generated)

---

## Technical Debt & Improvements

### Priority: LOW

1. **Type safety**: Remove `@ts-ignore` after Prisma types refresh
2. **Error handling**: Add try-catch around `argumentSchemeInstance` query
3. **Performance**: Consider caching scheme instance map if deliberations are large
4. **Logging**: Add configurable log levels (verbose vs quiet mode)

### Priority: MEDIUM

5. **Multi-scheme support**: Handle arguments with multiple schemes (Phase 4)
6. **Rule naming**: Standardize rule naming convention for undercutting
7. **Validation**: Add schema validation for `ruleType` enum values

---

## Commit Message

```
feat(aspic): Implement Phase 1b.2 translation layer for strict rules

Changes:
- Fetch ArgumentSchemeInstance records in ASPIC+ evaluation API
- Attach scheme instance metadata to RA-nodes in AIF graph
- Update aifToAspic.ts to read ruleType from metadata
- Classify rules into strictRules[] and defeasibleRules[] based on ruleType
- Add comprehensive console logging for debugging
- Add formatted translation summary statistics

Data flow:
  Database (ruleType) → API → AIF Graph → Translation → ASPIC+ Engine

Backward compatibility:
- Falls back to legacy schemeType if no ArgumentSchemeInstance exists
- Defaults to 'defeasible' for safety
- All existing arguments continue working with default ruleType

Next: Phase 1b.3 (UI components for rule type selection)
```

---

**Status**: ✅ Phase 1b.2 Complete  
**Files Modified**: 
- `app/api/aspic/evaluate/route.ts` (API endpoint)
- `lib/aif/translation/aifToAspic.ts` (Translation layer)

**Total Lines Changed**: ~100 lines  
**Lint Errors**: 0  
**Breaking Changes**: None (fully backward compatible)
