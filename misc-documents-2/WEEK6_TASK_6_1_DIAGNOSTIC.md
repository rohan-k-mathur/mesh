# Week 6 Task 6.1 - Attack Generation Integration Diagnostic

## Issue Summary

The "Generate Attack" button opens the modal, but the AttackSuggestions component shows an empty state: "No attacks available".

## Root Cause Analysis

### Expected Data Flow

1. User clicks "Generate Attack" on an argument
2. API receives `targetArgumentId` and `targetClaimId`
3. `ArgumentGenerationService.suggestAttacks()` runs:
   - Fetches argument with `argumentSchemes` relation
   - For each scheme, gets Critical Questions
   - For each CQ, generates an attack suggestion
   - Returns ranked array of suggestions
4. Frontend displays suggestions with burden/difficulty info

### What's Missing

The empty state indicates the API is returning `[]` (empty suggestions array). This happens when:

**Option A**: No ArgumentSchemeInstance records exist
- Arguments created before Phase 1 don't have `ArgumentSchemeInstance` records
- The old system used `schemeId` directly on `Argument` table
- The new system uses join table `ArgumentSchemeInstance` for multi-scheme support

**Option B**: Schemes don't have Critical Questions
- CQs may not be seeded for all schemes
- CQs need specific metadata: `burdenOfProof`, `requiresEvidence`, `attackType`

**Option C**: Test data mismatch
- Test arguments like `"test-single-space-arg"` may not have proper relations

## Data Requirements

### 1. Argument → ArgumentSchemeInstance → ArgumentScheme

```prisma
model ArgumentSchemeInstance {
  id          String           @id @default(cuid())
  argumentId  String
  schemeId    String
  argument    Argument         @relation(fields: [argumentId], references: [id])
  scheme      ArgumentScheme   @relation(fields: [schemeId], references: [id])
  // ... other fields
}
```

### 2. ArgumentScheme → CriticalQuestion

```prisma
model CriticalQuestion {
  id               String  @id @default(cuid())
  schemeId         String
  cqKey            String
  text             String
  burdenOfProof    String  // "proponent" or "challenger"
  requiresEvidence Boolean @default(false)
  attackType       String  // "REBUTS", "UNDERCUTS", "UNDERMINES"
  targetScope      String  // "conclusion", "inference", "premise"
  // ... other fields
}
```

### 3. Required CQ Metadata

For attack generation to work, CQs MUST have:
- ✅ `burdenOfProof` - Who bears the burden ("proponent" vs "challenger")
- ✅ `requiresEvidence` - Does answering this CQ need evidence?
- ✅ `attackType` - What kind of attack does this generate?
- ✅ `targetScope` - What does this attack?

## Integration Mismatch: Old vs New System

### Old Attack System (Legacy)

Located in components/arguments/:
- `AttackMenuProV2` - Manual attack selection
- `CommunityDefenseMenu` - Manual defense actions
- Direct relation: `Argument.schemeId → ArgumentScheme`

### New Attack System (Phase 3)

Located in components/argumentation/:
- `AttackSuggestions` - AI-generated suggestions
- `AttackConstructionWizard` - Guided construction
- Multi-scheme support: `Argument ← ArgumentSchemeInstance → ArgumentScheme`

### The Problem

DeepDivePanelV2 was built for the **old system**. Arguments displayed in AIFArgumentsListPro likely:
1. Were created with old direct `schemeId` relation
2. Don't have `ArgumentSchemeInstance` records
3. May have schemes without CQs

## Solution Options

### Option 1: Migrate Existing Arguments (Recommended)

Create a migration script to:
```typescript
// For each Argument with schemeId but no ArgumentSchemeInstance
const orphanedArguments = await prisma.argument.findMany({
  where: {
    schemeId: { not: null },
    argumentSchemes: { none: {} }
  }
});

for (const arg of orphanedArguments) {
  await prisma.argumentSchemeInstance.create({
    data: {
      argumentId: arg.id,
      schemeId: arg.schemeId!,
      isPrimary: true,
      // ... copy other scheme-related data
    }
  });
}
```

### Option 2: Add Fallback Logic to Service

Update `ArgumentGenerationService.suggestAttacks()` to:
```typescript
// Try new multi-scheme system first
let schemes = await this.getArgumentSchemes(argumentId);

// Fallback: Check old schemeId field
if (schemes.length === 0) {
  const argument = await prisma.argument.findUnique({
    where: { id: argumentId },
    include: { scheme: { include: { cqs: true } } }
  });
  
  if (argument?.scheme) {
    schemes = [{ scheme: argument.scheme, /* ... */ }];
  }
}
```

### Option 3: Seed CQs for Common Schemes

Ensure all commonly-used schemes have CQs defined:
```typescript
// scripts/seed-scheme-cqs.ts
const schemesNeedingCQs = [
  "expert-opinion",
  "causal-reasoning",
  "analogy",
  "sign",
  // ... others
];

for (const schemeKey of schemesNeedingCQs) {
  await seedCQsForScheme(schemeKey);
}
```

### Option 4: Show Helpful Empty State

Update AttackSuggestions EmptyState to guide users:
```tsx
<EmptyState>
  <p>Cannot generate attacks for this argument because:</p>
  <ul>
    <li>No argumentation scheme detected, or</li>
    <li>Scheme has no critical questions defined</li>
  </ul>
  <Button onClick={showLegacyAttackMenu}>
    Use Manual Attack Menu Instead
  </Button>
</EmptyState>
```

## Recommended Implementation Plan

### Phase 1: Diagnostic (30 min)

1. Check test argument structure:
```sql
SELECT 
  a.id,
  a.schemeId as old_scheme_id,
  COUNT(asi.id) as scheme_instances,
  s.key as scheme_key
FROM Argument a
LEFT JOIN ArgumentSchemeInstance asi ON asi.argumentId = a.id
LEFT JOIN ArgumentScheme s ON s.id = a.schemeId
WHERE a.id = 'test-single-space-arg'
GROUP BY a.id;
```

2. Check if schemes have CQs:
```sql
SELECT 
  s.key,
  s.name,
  COUNT(cq.id) as cq_count
FROM ArgumentScheme s
LEFT JOIN CriticalQuestion cq ON cq.schemeId = s.id
WHERE s.id IN (
  SELECT DISTINCT schemeId FROM Argument WHERE deliberationId = 'ludics-forest-demo'
)
GROUP BY s.id;
```

### Phase 2: Quick Fix (1 hour)

**Implement Option 4 + partial Option 2**

1. Add fallback logic in `ArgumentGenerationService`:
   - Check `ArgumentSchemeInstance` first (new system)
   - Fallback to `Argument.schemeId` (old system)
   - Return empty with helpful message if no schemes/CQs

2. Update `AttackSuggestions` empty state:
   - Show diagnostic info
   - Offer link to legacy attack menu
   - Guide user on what's needed

### Phase 3: Full Migration (2-4 hours)

**Implement Option 1 + Option 3**

1. Run migration script to create `ArgumentSchemeInstance` records
2. Seed CQs for all schemes used in existing arguments
3. Test attack generation works end-to-end

## Testing Checklist

After fix:

- [ ] Click "Generate Attack" on argument with scheme
- [ ] Modal shows loading state briefly
- [ ] AttackSuggestions displays 3-10 ranked suggestions
- [ ] Each suggestion shows:
  - [ ] Attack type badge (REBUTS/UNDERCUTS/UNDERMINES)
  - [ ] Strategic value score
  - [ ] Burden of proof indicator
  - [ ] Difficulty level
  - [ ] CQ text that triggered this attack
- [ ] Can select a suggestion
- [ ] AttackConstructionWizard opens with pre-filled template
- [ ] Can complete wizard and submit attack

## Files to Review

1. **Service layer**:
   - `app/server/services/ArgumentGenerationService.ts:171-220` (suggestAttacks method)
   - Check what `getArgumentSchemes()` returns

2. **Database queries**:
   - `app/server/services/ArgumentGenerationService.ts:363-385` (getArgumentWithSchemes)
   - `app/server/services/ArgumentGenerationService.ts:449-462` (getArgumentSchemes)

3. **Component**:
   - `components/argumentation/AttackSuggestions.tsx:165-170` (empty state check)

4. **API endpoint**:
   - `app/api/arguments/suggest-attacks/route.ts:40-47` (service call)

## Next Steps

1. Run diagnostic queries to see what data exists
2. Choose quick fix approach (recommend Option 4 + partial Option 2)
3. Test with existing deliberations
4. Plan full migration if needed
5. Update Week 6 completion document with findings

---

**Status**: Diagnostic complete, awaiting decision on fix approach  
**Blocker**: Attack generation requires ArgumentSchemeInstance + CQs with metadata  
**Recommendation**: Quick fix with fallback logic + helpful empty state, then plan migration
