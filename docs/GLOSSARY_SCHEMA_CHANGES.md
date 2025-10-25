# Glossary System - Database Schema Changes

**Date**: October 24, 2025  
**Status**: ✅ Deployed (via `npx prisma db push`)  
**Location**: `lib/models/schema.prisma`

---

## Overview

Added a complete glossary system to enable collaborative term definition and semantic grounding within deliberations. This system allows participants to propose, vote on, and agree upon shared definitions for key terms used in debates.

---

## New Tables Created

### 1. `glossary_terms`
**Purpose**: Main terms table - stores each unique term in a deliberation's glossary

**Schema**:
```prisma
model GlossaryTerm {
  id              String   @id @default(cuid())
  deliberationId  String
  deliberation    Deliberation @relation(fields: [deliberationId], references: [id], onDelete: Cascade)
  
  term            String   // The word/phrase being defined (original case)
  termNormalized  String   // Lowercase, trimmed version for matching
  
  status          GlossaryTermStatus @default(PENDING)
  
  proposedById    String
  proposedBy      User   @relation("ProposedTerms", fields: [proposedById], references: [auth_id])
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  definitions     GlossaryDefinition[]
  usages          GlossaryTermUsage[]
  
  @@unique([deliberationId, termNormalized])
  @@index([deliberationId, status])
  @@index([termNormalized])
  @@map("glossary_terms")
}
```

**Key Fields**:
- `term` - Display name (preserves original case: "Justice", "freedom", etc.)
- `termNormalized` - Searchable lowercase version for duplicate detection
- `status` - One of: `PENDING`, `CONSENSUS`, `CONTESTED`, `ARCHIVED`
- `proposedById` - User who first proposed this term

**Indices**:
- Unique constraint on `(deliberationId, termNormalized)` - prevents duplicate terms per deliberation
- Index on `(deliberationId, status)` - fast filtering by status
- Index on `termNormalized` - fast term lookups

---

### 2. `glossary_definitions`
**Purpose**: Stores definitions for terms - multiple definitions per term enable competing views

**Schema**:
```prisma
model GlossaryDefinition {
  id              String   @id @default(cuid())
  termId          String
  term            GlossaryTerm @relation(fields: [termId], references: [id], onDelete: Cascade)
  
  definition      String   @db.Text
  examples        String?  @db.Text
  sources         Json?
  
  authorId        String
  author          User   @relation("AuthoredDefinitions", fields: [authorId], references: [auth_id])
  
  isCanonical     Boolean  @default(false)
  endorsementCount Int     @default(0)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  endorsements    GlossaryEndorsement[]
  votes           GlossaryDefinitionVote[]
  history         GlossaryDefinitionHistory[]
  
  @@index([termId, isCanonical])
  @@index([termId, endorsementCount])
  @@map("glossary_definitions")
}
```

**Key Fields**:
- `definition` - The actual definition text (up to TEXT size)
- `examples` - Optional usage examples
- `sources` - JSON array of references/citations
- `isCanonical` - True if this definition reached consensus or was moderator-endorsed
- `endorsementCount` - Cached count for performance (incremented/decremented on endorsements)

**Indices**:
- Index on `(termId, isCanonical)` - fast retrieval of canonical definition
- Index on `(termId, endorsementCount)` - sort by popularity

---

### 3. `glossary_endorsements`
**Purpose**: Tracks which users endorse which definitions

**Schema**:
```prisma
model GlossaryEndorsement {
  id             String   @id @default(cuid())
  definitionId   String
  definition     GlossaryDefinition @relation(fields: [definitionId], references: [id], onDelete: Cascade)
  
  userId         String
  user           User   @relation("DefinitionEndorsements", fields: [userId], references: [auth_id])
  
  createdAt      DateTime @default(now())
  
  @@unique([definitionId, userId])
  @@index([definitionId])
  @@index([userId])
  @@map("glossary_endorsements")
}
```

**Key Fields**:
- `definitionId` - Which definition is being endorsed
- `userId` - Who is endorsing it

**Unique Constraint**:
- `(definitionId, userId)` - Each user can endorse a definition only once

**Indices**:
- Index on `definitionId` - fast lookup of all endorsers
- Index on `userId` - fast lookup of all user endorsements

---

### 4. `glossary_definition_votes`
**Purpose**: Voting mechanism for competing definitions (upvote/downvote/neutral)

**Schema**:
```prisma
model GlossaryDefinitionVote {
  id             String   @id @default(cuid())
  definitionId   String
  definition     GlossaryDefinition @relation(fields: [definitionId], references: [id], onDelete: Cascade)
  
  userId         String
  user           User   @relation("DefinitionVotes", fields: [userId], references: [auth_id])
  
  value          Int      // +1 for upvote, -1 for downvote, 0 for neutral
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  @@unique([definitionId, userId])
  @@index([definitionId])
  @@map("glossary_definition_votes")
}
```

**Key Fields**:
- `value` - Vote value: `+1` (upvote), `-1` (downvote), `0` (neutral)
- Can be updated if user changes their vote

**Unique Constraint**:
- `(definitionId, userId)` - One vote per user per definition

---

### 5. `glossary_definition_history`
**Purpose**: Audit trail of definition changes (edits, merges, endorsements)

**Schema**:
```prisma
model GlossaryDefinitionHistory {
  id             String   @id @default(cuid())
  definitionId   String
  definition     GlossaryDefinition @relation(fields: [definitionId], references: [id], onDelete: Cascade)
  
  previousText   String   @db.Text
  newText        String   @db.Text
  changeType     String   // "created" | "edited" | "merged" | "endorsed" | "demoted"
  
  changedById    String
  changedBy      User   @relation("DefinitionChanges", fields: [changedById], references: [auth_id])
  
  createdAt      DateTime @default(now())
  
  @@index([definitionId, createdAt])
  @@map("glossary_definition_history")
}
```

**Key Fields**:
- `previousText` - Definition text before change
- `newText` - Definition text after change
- `changeType` - Type of change: `created`, `edited`, `merged`, `endorsed`, `demoted`
- `changedBy` - User who made the change

**Index**:
- `(definitionId, createdAt)` - Chronological history retrieval

---

### 6. `glossary_term_usages`
**Purpose**: Track where terms are used across the deliberation (claims, arguments, premises)

**Schema**:
```prisma
model GlossaryTermUsage {
  id             String   @id @default(cuid())
  termId         String
  term           GlossaryTerm @relation(fields: [termId], references: [id], onDelete: Cascade)
  
  targetType     String   // "claim" | "argument" | "premise" | "comment"
  targetId       String
  
  contextText    String?  @db.Text
  highlightStart Int?     // Character position where term starts
  highlightEnd   Int?     // Character position where term ends
  
  detectedAt     DateTime @default(now())
  
  @@index([termId])
  @@index([targetType, targetId])
  @@map("glossary_term_usages")
}
```

**Key Fields**:
- `targetType` - What type of entity uses this term
- `targetId` - ID of that entity
- `contextText` - Surrounding text for context
- `highlightStart`/`highlightEnd` - Exact position in text for highlighting

**Indices**:
- Index on `termId` - Find all usages of a term
- Index on `(targetType, targetId)` - Find all terms used in a specific entity

---

### 7. New Enum: `GlossaryTermStatus`

```prisma
enum GlossaryTermStatus {
  PENDING   // Awaiting endorsements
  CONSENSUS // Has consensus on one definition
  CONTESTED // Multiple competing definitions exist
  ARCHIVED  // No longer active/relevant
}
```

**Status Transitions**:
- `PENDING` → `CONSENSUS`: When a definition reaches endorsement threshold
- `PENDING` → `CONTESTED`: When a second definition is proposed
- `CONSENSUS` → `CONTESTED`: When a new competing definition is added
- `CONTESTED` → `CONSENSUS`: When one definition clearly wins
- Any → `ARCHIVED`: Manual moderation action

---

## Modified Tables

### Updated: `users` (User model)

**Added back-relations**:
```prisma
model User {
  // ... existing fields ...
  
  // Glossary system relations
  proposedTerms          GlossaryTerm[]              @relation("ProposedTerms")
  authoredDefinitions    GlossaryDefinition[]        @relation("AuthoredDefinitions")
  definitionEndorsements GlossaryEndorsement[]       @relation("DefinitionEndorsements")
  definitionVotes        GlossaryDefinitionVote[]    @relation("DefinitionVotes")
  definitionChanges      GlossaryDefinitionHistory[] @relation("DefinitionChanges")
}
```

**Purpose**: Allow querying:
- All terms a user has proposed
- All definitions a user has authored
- All definitions a user has endorsed
- All votes a user has cast
- All changes a user has made to definitions

---

### Updated: `Deliberation` model

**Added back-relation**:
```prisma
model Deliberation {
  // ... existing fields ...
  
  // Glossary system
  glossaryTerms GlossaryTerm[]
}
```

**Purpose**: Allow querying all glossary terms for a deliberation

---

## Database Statistics

**New Tables**: 6  
**Modified Tables**: 2  
**New Indices**: 12  
**New Enum Types**: 1  

**Estimated Row Growth**:
- **Small deliberation** (10 participants): ~5-10 terms, ~10-20 definitions
- **Medium deliberation** (50 participants): ~15-30 terms, ~30-60 definitions
- **Large deliberation** (200+ participants): ~30-50 terms, ~60-150 definitions

---

## Data Integrity Rules

### Cascading Deletes

1. **Delete Deliberation** → Cascades to:
   - All `GlossaryTerm` records
   - All nested `GlossaryDefinition`, `GlossaryEndorsement`, `GlossaryDefinitionVote`, `GlossaryDefinitionHistory`, `GlossaryTermUsage` records

2. **Delete GlossaryTerm** → Cascades to:
   - All `GlossaryDefinition` records
   - All nested `GlossaryEndorsement`, `GlossaryDefinitionVote`, `GlossaryDefinitionHistory` records
   - All `GlossaryTermUsage` records

3. **Delete GlossaryDefinition** → Cascades to:
   - All `GlossaryEndorsement` records
   - All `GlossaryDefinitionVote` records
   - All `GlossaryDefinitionHistory` records

### Unique Constraints

1. One term per deliberation (case-insensitive): `(deliberationId, termNormalized)`
2. One endorsement per user per definition: `(definitionId, userId)`
3. One vote per user per definition: `(definitionId, userId)`

### Foreign Key Constraints

All foreign keys use `onDelete: Cascade` for clean deletion.  
User references use `auth_id` field (not BigInt `id`).

---

## Performance Considerations

### Indices Created

1. **glossary_terms**:
   - `(deliberationId, termNormalized)` - Unique lookup
   - `(deliberationId, status)` - Filter by status
   - `(termNormalized)` - Global term search

2. **glossary_definitions**:
   - `(termId, isCanonical)` - Fast canonical lookup
   - `(termId, endorsementCount)` - Sort by popularity

3. **glossary_endorsements**:
   - `(definitionId, userId)` - Unique constraint + fast lookup
   - `(definitionId)` - Count endorsements
   - `(userId)` - User's endorsements

4. **glossary_definition_votes**:
   - `(definitionId, userId)` - Unique constraint + fast lookup
   - `(definitionId)` - Vote aggregation

5. **glossary_definition_history**:
   - `(definitionId, createdAt)` - Chronological history

6. **glossary_term_usages**:
   - `(termId)` - Find all usages
   - `(targetType, targetId)` - Find terms in entity

### Query Optimization

- **Endorsement counts** are denormalized (`endorsementCount` field) to avoid COUNT queries
- **Canonical status** is denormalized (`isCanonical` field) for fast filtering
- **Term normalization** is pre-computed for fast case-insensitive matching

---

## Migration Path

### From Scratch (New Deliberations)
- No migration needed - glossary system is opt-in
- Users can start proposing terms immediately

### Existing Deliberations
- Glossary tables are empty by default
- Optional: Run NLP extraction to auto-populate common terms from existing claims/arguments
- Recommended: Let users organically build glossary as they notice semantic confusion

### Backfilling (Optional)

If you want to pre-populate glossaries with common philosophical/political terms:

```sql
-- Example: Add common terms to an existing deliberation
INSERT INTO glossary_terms (id, deliberation_id, term, term_normalized, status, proposed_by_id, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'your-deliberation-id', 'Justice', 'justice', 'PENDING', 'system-user-id', NOW(), NOW()),
  (gen_random_uuid(), 'your-deliberation-id', 'Freedom', 'freedom', 'PENDING', 'system-user-id', NOW(), NOW()),
  (gen_random_uuid(), 'your-deliberation-id', 'Equity', 'equity', 'PENDING', 'system-user-id', NOW(), NOW());
```

---

## API Endpoints to Implement

### Phase 2: REST API (Next Step)

1. `GET /api/deliberations/[id]/glossary/terms` - List all terms
2. `POST /api/deliberations/[id]/glossary/terms` - Propose new term
3. `GET /api/glossary/terms/[termId]` - Get term with definitions
4. `POST /api/glossary/terms/[termId]/definitions` - Propose alternative definition
5. `POST /api/glossary/definitions/[definitionId]/endorse` - Toggle endorsement
6. `POST /api/glossary/definitions/[definitionId]/vote` - Upvote/downvote
7. `GET /api/glossary/definitions/[definitionId]/history` - View edit history
8. `PATCH /api/glossary/definitions/[definitionId]` - Edit definition (author only)
9. `DELETE /api/glossary/terms/[termId]` - Archive term (moderator only)

---

## Testing Checklist

- [ ] Create term with initial definition
- [ ] Prevent duplicate terms (case-insensitive)
- [ ] Propose alternative definition (creates CONTESTED status)
- [ ] Endorse definition (increment endorsementCount)
- [ ] Un-endorse definition (decrement endorsementCount)
- [ ] Promote to canonical when threshold reached
- [ ] Vote on competing definitions
- [ ] Track definition history on edits
- [ ] Delete term cascades to all nested records
- [ ] Query all terms for a deliberation
- [ ] Query all definitions for a term
- [ ] Query all endorsers for a definition

---

## Rollback Instructions

If you need to remove the glossary system:

```sql
-- Drop all glossary tables (in order due to foreign keys)
DROP TABLE IF EXISTS glossary_term_usages;
DROP TABLE IF EXISTS glossary_definition_history;
DROP TABLE IF EXISTS glossary_definition_votes;
DROP TABLE IF EXISTS glossary_endorsements;
DROP TABLE IF EXISTS glossary_definitions;
DROP TABLE IF EXISTS glossary_terms;

-- Drop enum
DROP TYPE IF EXISTS "GlossaryTermStatus";
```

Then remove the back-relations from User and Deliberation models in `schema.prisma`.

---

## Next Steps

✅ **Phase 1 Complete**: Database schema deployed  
⏭️ **Phase 2**: Implement REST API endpoints  
⏭️ **Phase 3**: Build UI components (DefinitionSheet, TermCard, etc.)  
⏭️ **Phase 4**: Create sample data and demo integration

---

**Schema Version**: 1.0  
**Deployed**: October 24, 2025 via `npx prisma db push`  
**Database**: Supabase PostgreSQL  
**Prisma Client**: v6.14.0 (regenerated)
