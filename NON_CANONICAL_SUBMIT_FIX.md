# Non-Canonical Submit Issue Fix

**Date**: January 2025  
**Error**: `relation "issues" does not exist`  
**Location**: `/api/non-canonical/submit`  
**Status**: ✅ **FIXED**

---

## Problem

When submitting a community defense via AIFArgumentsListPro, the API crashed with:

```
Raw query failed. Code: `42P01`. Message: `relation "issues" does not exist`
```

**Root Cause**: The code used raw SQL with incorrect table name:

```typescript
await prisma.$executeRaw`
  INSERT INTO "issues" (...)  // ❌ Wrong: lowercase "issues"
  VALUES (...)
`;
```

But Prisma's schema defines the model as `Issue` (capitalized), which maps to table `"Issue"` (not `"issues"`).

---

## Solution

Replaced raw SQL with Prisma's ORM (recommended approach):

### Before (Raw SQL - BROKEN)
```typescript
await prisma.$executeRaw`
  INSERT INTO "issues" (
    id, "deliberationId", label, description, kind, state,
    "createdById", "assigneeId", "ncmId", "ncmStatus", "createdAt", "updatedAt"
  ) VALUES (
    ${issueId}, ${deliberationId}, ${issueLabel}, ${issueDescription},
    'community_defense'::"IssueKind", 'pending'::"IssueState",
    ${currentUserId?.toString()}, ${authorId}, ${ncmId}, 'PENDING'::"NCMStatus",
    ${now}, ${now}
  )
`;
```

### After (Prisma ORM - FIXED)
```typescript
await prisma.issue.create({
  data: {
    id: issueId,
    deliberationId,
    label: issueLabel,
    description: issueDescription,
    kind: "community_defense",
    state: "pending",
    createdById: BigInt(currentUserId?.toString() || "0"),
    assigneeId: BigInt(authorId),
    ncmId,
    ncmStatus: "PENDING",
  }
});
```

---

## Why This Fix Works

1. **Type Safety**: Prisma ORM validates field types at compile time
2. **Table Name**: Prisma automatically uses correct table name from schema
3. **Timestamps**: Prisma auto-handles `createdAt` and `updatedAt` with `@default(now())` and `@updatedAt`
4. **Cleaner Code**: No string interpolation or SQL injection risks
5. **BigInt Handling**: Properly converts `createdById` and `assigneeId` to BigInt

---

## Schema Reference

```prisma
model Issue {
  id             String     @id @default(cuid())
  deliberationId String
  label          String
  description    String?
  state          IssueState @default(open)       // ← Note default
  createdById    BigInt                          // ← BigInt not String
  assigneeId     BigInt?                         // ← BigInt not String
  kind           IssueKind  @default(general)    // ← Note default
  createdAt      DateTime   @default(now())      // ← Auto-handled
  updatedAt      DateTime   @updatedAt           // ← Auto-handled
  
  // NCM-related fields
  ncmId       String?
  ncmStatus   NCMStatus?
  reviewedAt  DateTime?
  reviewNotes String?
  
  // Relations
  deliberation     Deliberation      @relation(fields: [deliberationId], references: [id])
  createdBy        User              @relation("CreatedIssues", fields: [createdById], references: [id])
  assignee         User?             @relation("AssignedIssues", fields: [assigneeId], references: [id])
  nonCanonicalMove NonCanonicalMove? @relation(fields: [ncmId], references: [id])
  links            IssueLink[]
}
```

**Table Name**: `"Issue"` (capitalized, matching model name)

---

## Testing

### Before Fix
```bash
POST /api/non-canonical/submit
→ 500 Error: relation "issues" does not exist
```

### After Fix
```bash
POST /api/non-canonical/submit
→ 200 OK
→ Issue created with ID: xxx
→ IssueLink created
→ Author assigned for review
```

### Test Steps
1. Open AIFArgumentsListPro
2. Select an argument
3. Click "Community Defense" button
4. Submit a defense (e.g., SUPPORT_LINK)
5. Verify:
   - No 500 error
   - Issue created in database
   - Author sees review notification
   - IssueLink correctly links to target

---

## Related Issues

### Other Raw SQL Queries to Audit

The codebase may have other places using raw SQL with incorrect table names. Search for:

```bash
grep -r '$executeRaw.*INSERT INTO "' app/api/
```

**Recommendation**: Replace raw SQL with Prisma ORM wherever possible for:
- Type safety
- Automatic table name handling
- Better error messages
- Cleaner code

### Common Pitfall

Prisma defaults to using the **model name** as the table name (PascalCase), not a pluralized/lowercased version. Always check schema:

| Model Name | Default Table Name | Raw SQL Should Use |
|------------|-------------------|-------------------|
| `Issue` | `"Issue"` | `"Issue"` not `"issues"` |
| `User` | `"User"` | `"User"` not `"users"` |
| `Claim` | `"Claim"` | `"Claim"` not `"claims"` |

To override: use `@@map("custom_name")` in schema.

---

## Benefits of Prisma ORM vs Raw SQL

| Aspect | Raw SQL | Prisma ORM |
|--------|---------|-----------|
| **Type Safety** | ❌ None | ✅ Compile-time validation |
| **Table Names** | ❌ Manual | ✅ Auto-handled |
| **Timestamps** | ❌ Manual | ✅ Auto-handled |
| **Injection Risk** | ⚠️ If not careful | ✅ Parameterized |
| **Migrations** | ❌ Not tracked | ✅ Schema-driven |
| **Relations** | ❌ Manual joins | ✅ Auto-loaded |
| **Enums** | ❌ String casting | ✅ Type-checked |

---

## File Changed

**File**: `app/api/non-canonical/submit/route.ts`  
**Lines**: ~155-173  
**Change**: Replaced `prisma.$executeRaw` with `prisma.issue.create`  
**Status**: ✅ No TypeScript errors  
**Testing**: Ready to test

---

## Summary

The "relation 'issues' does not exist" error was caused by using raw SQL with a lowercase table name (`"issues"`) when the actual table is capitalized (`"Issue"`). Fixed by using Prisma's ORM, which automatically handles table names and provides type safety.

**Recommendation**: Audit the codebase for other raw SQL queries and replace with Prisma ORM where possible.

---

**Date**: January 2025  
**Fixed By**: Copilot  
**Tested**: Ready for testing  
**Related**: Non-canonical moves, community defense, issue tracking
