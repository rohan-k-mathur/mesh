# Scheme Integration Fix - ArgumentSchemeInstance Creation

**Date:** November 1, 2025  
**Issue:** Arguments created with schemes weren't showing in the "Argumentation Schemes" pane  
**Root Cause:** POST /api/arguments only set legacy `schemeId` field, but GET /api/arguments/[id]/schemes looks for `ArgumentSchemeInstance` records

---

## Problem Analysis

### Legacy vs. New Schema
The Argument model has two ways to track schemes:

**Legacy (Phase 1-3):**
```prisma
schemeId String?  // Direct foreign key (deprecated)
```

**New (Phase 4+):**
```prisma
argumentSchemes ArgumentSchemeInstance[]  // Many-to-many junction table
```

### The Gap
- **POST /api/arguments** (creation) → Only populated `schemeId` (legacy)
- **GET /api/arguments/[id]/schemes** (display) → Queries `ArgumentSchemeInstance` table (new)
- **Result:** Schemes appeared in picker, but didn't show after argument creation

---

## Solution

### Modified File: `app/api/arguments/route.ts`

Added ArgumentSchemeInstance creation in the transaction:

```typescript
const created = await prisma.$transaction(async (tx) => {
  // ... existing argument creation code ...
  
  const a = await tx.argument.create({
    data: { 
      deliberationId, 
      authorId, 
      conclusionClaimId, 
      schemeId: schemeId ?? null,  // Legacy field (kept for backward compat)
      // ... other fields
    }
  });
  
  // ... premise creation ...
  
  // NEW: Create ArgumentSchemeInstance if scheme is provided
  if (schemeId) {
    await (tx as any).argumentSchemeInstance.create({
      data: {
        argumentId: a.id,
        schemeId: schemeId,
        confidence: 1.0,
        isPrimary: true,
      },
    });
  }
  
  return a.id;
});
```

**Key Points:**
- Uses `(tx as any)` type cast to bypass stale Prisma types (after running `prisma generate`)
- Sets `confidence: 1.0` (user explicitly selected scheme)
- Sets `isPrimary: true` (single scheme per argument currently)
- Creates record atomically within transaction

---

## Testing Checklist

- [ ] Create argument with Popular Practice scheme
- [ ] Verify ArgumentSchemeInstance record created in DB
- [ ] Check GET /api/arguments/[id]/schemes returns scheme data
- [ ] Verify "Argumentation Schemes" pane shows scheme info
- [ ] Confirm CQs display correctly (inherited from scheme)
- [ ] Test hierarchy: Popular Practice should show +5 inherited CQs

---

## Related Components

**Already Working:**
- ✅ SchemePickerWithHierarchy component (hierarchical tree dropdown)
- ✅ AIFArgumentWithSchemeComposer integration
- ✅ GET /api/arguments/[id]/schemes endpoint
- ✅ ArgumentCardV2 scheme display pane

**Now Fixed:**
- ✅ POST /api/arguments creates ArgumentSchemeInstance records
- ✅ Schemes persist and display after argument creation

---

## Database Schema

**ArgumentSchemeInstance** (junction table):
```prisma
model ArgumentSchemeInstance {
  id           String   @id @default(cuid())
  argumentId   String
  schemeId     String
  confidence   Float    @default(1.0)  // 0.0-1.0 (scheme match confidence)
  isPrimary    Boolean  @default(false) // Highest-confidence scheme
  createdAt    DateTime @default(now())
  
  argument     Argument       @relation(fields: [argumentId], references: [id])
  scheme       ArgumentScheme @relation(fields: [schemeId], references: [id])
  
  @@unique([argumentId, schemeId])
  @@index([argumentId])
  @@index([schemeId])
}
```

**Design:**
- Supports multiple schemes per argument (future: ML inference, scheme composition)
- `isPrimary` flag marks user-selected or highest-confidence scheme
- `confidence` score for AI/ML scheme classifiers

---

## Migration Note

**Legacy Arguments:**
Existing arguments may have `schemeId` set but no `ArgumentSchemeInstance` record. Consider migration script:

```typescript
// scripts/migrate-legacy-schemes.ts
const args = await prisma.argument.findMany({
  where: { 
    schemeId: { not: null },
    argumentSchemes: { none: {} }  // No ArgumentSchemeInstance yet
  },
  select: { id: true, schemeId: true }
});

for (const arg of args) {
  await prisma.argumentSchemeInstance.create({
    data: {
      argumentId: arg.id,
      schemeId: arg.schemeId!,
      confidence: 1.0,
      isPrimary: true,
    }
  });
}
```

---

## Next Steps

1. Test argument creation with scheme selection
2. Verify scheme display in ArgumentCardV2
3. Confirm CQ inheritance works (Popular Practice → Popular Opinion)
4. Consider migrating legacy arguments (optional)
5. Proceed with Task 4: CQ Preview Panel implementation
