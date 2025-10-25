# Glossary/DefinitionSheet Implementation - Complete Guide

**Status**: ✅ Implementation Complete  
**Date**: 2025  
**Feature**: Collaborative term definition system for deliberations

---

## Overview

The DefinitionSheet is a collaborative glossary system that allows deliberation participants to:
- Propose key terms that need shared definitions
- Submit competing definitions for contested terms
- Endorse definitions they agree with
- Vote on competing definitions
- Achieve community consensus on canonical definitions

This feature supports the epistemic foundation of productive deliberation by establishing shared conceptual ground.

---

## Architecture

### Database Layer (Prisma Schema)

**Models Added** (6 total):

1. **GlossaryTerm** - Core term entries
   - `id`, `deliberationId`, `name`, `proposedBy`, `status`, `usageCount`
   - Status: `PROPOSED` → `CONTESTED` → `CONSENSUS`
   - Index: `deliberationId_name` (unique), `deliberationId_status`

2. **GlossaryDefinition** - Proposed definitions
   - `id`, `termId`, `text`, `examples`, `authorId`, `isCanonical`
   - Index: `termId`, `authorId`, `isCanonical`

3. **GlossaryEndorsement** - User endorsements
   - `definitionId`, `userId`, `createdAt`
   - Unique: `definitionId_userId`

4. **GlossaryDefinitionVote** - Upvote/downvote
   - `definitionId`, `userId`, `value` (-1, 0, 1)
   - Unique: `definitionId_userId`

5. **GlossaryDefinitionHistory** - Audit trail
   - Tracks all edits with `oldText`, `newText`, `editedBy`, `editedAt`

6. **GlossaryTermUsage** - Usage tracking
   - Links terms to claims/arguments where used
   - Index: `termId`, `targetId`

**Schema Status**: 
- ✅ Pushed to production (`npx prisma db push` successful)
- ✅ Prisma Client generated (v6.14.0)

---

## API Layer

### 1. Terms Management
**Endpoint**: `GET/POST /api/deliberations/[id]/glossary/terms`

**GET Query Params**:
- `search` - Filter by term name
- `status` - Filter by PROPOSED/CONTESTED/CONSENSUS
- `sort` - Sort by "usage", "alphabetical", or "recent"

**POST Body**:
```typescript
{
  name: string;        // Required, max 100 chars
  definition: string;  // Required, max 2000 chars
  examples?: string;   // Optional, max 500 chars
}
```

**Returns**: Array of `GlossaryTerm` with nested definitions, endorsements, votes

**Features**:
- Duplicate detection (case-insensitive)
- Auto-endorsement by author
- Sort/filter/search support

---

### 2. Alternative Definitions
**Endpoint**: `POST /api/glossary/terms/[termId]/definitions`

**Body**:
```typescript
{
  text: string;      // Required, max 2000 chars
  examples?: string; // Optional, max 500 chars
}
```

**Logic**:
- Creates new definition
- Auto-endorses by author
- Updates term status to `CONTESTED` (if multiple definitions exist)

---

### 3. Endorsements
**Endpoint**: `POST /api/glossary/definitions/[definitionId]/endorse`

**Body**: (none - toggles endorsement)

**Logic**:
- Toggles endorsement (creates or deletes)
- Checks consensus threshold (50% of participants)
- Auto-promotes to `CONSENSUS` if threshold met
- Returns updated endorsement count

**Participant Counting**:
```typescript
// Counts unique authors of claims + arguments in the deliberation
const participants = await prisma.claim.findMany({
  where: { deliberationId },
  select: { authorId: true },
  distinct: ["authorId"],
});
```

---

### 4. Voting
**Endpoint**: `GET/POST /api/glossary/definitions/[definitionId]/vote`

**POST Body**:
```typescript
{
  value: -1 | 0 | 1;  // -1 = downvote, 0 = neutral, 1 = upvote
}
```

**GET Returns**:
```typescript
{
  votes: [
    { value: 1, count: 5 },
    { value: -1, count: 2 }
  ]
}
```

---

## UI Components

### 1. DefinitionSheet (Container)
**Path**: `/components/glossary/DefinitionSheet.tsx`

**Props**:
```typescript
{
  deliberationId: string;
}
```

**Features**:
- Search bar (real-time filtering)
- Status filter (All/Proposed/Contested/Consensus)
- Sort dropdown (Usage/Alphabetical/Recent)
- "Propose Term" button → opens modal
- Virtualized term list (performance for 100+ terms)
- Event-driven updates (listens to `glossary:updated` events)

**State Management**:
- SWR for data fetching (`/api/deliberations/${id}/glossary/terms`)
- Optimistic UI updates
- Automatic revalidation on focus/reconnect

---

### 2. TermCard (Individual Term)
**Path**: `/components/glossary/TermCard.tsx`

**Props**:
```typescript
{
  term: GlossaryTerm & {
    definitions: Array<GlossaryDefinition & {
      author: { id: string; displayName?: string };
      endorsements: Array<{ userId: string }>;
      _count: { endorsements: number; votes: number };
    }>;
    _count: { definitions: number };
  };
}
```

**UI Structure**:
- **Header**: Term name + status badge
- **Canonical Definition** (if consensus reached):
  - Green highlight
  - Endorsement count
  - Author attribution
  - EndorseButton
- **Competing Definitions** (if contested):
  - Expandable accordion
  - Vote counts (↑upvotes / ↓downvotes)
  - "Propose Alternative" button

**Status Badges**:
- 🟢 Consensus - Green with checkmark
- 🟡 Contested - Yellow with alert icon
- ⚪ Proposed - Gray with info icon

---

### 3. EndorseButton
**Path**: `/components/glossary/EndorseButton.tsx`

**Props**:
```typescript
{
  definitionId: string;
  initialEndorsed: boolean;
  initialCount: number;
}
```

**Features**:
- Thumbs-up icon (filled when endorsed)
- Endorsement count display
- Optimistic UI (immediate visual feedback)
- Loading state during API call
- Error rollback on failure

**API Call**:
```typescript
POST /api/glossary/definitions/${definitionId}/endorse
```

---

### 4. ProposeTermModal
**Path**: `/components/glossary/ProposeTermModal.tsx`

**Props**:
```typescript
{
  deliberationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

**Form Fields**:
- **Term Name** (required, 100 char limit)
- **Definition** (required, 2000 char limit, textarea)
- **Examples** (optional, 500 char limit, textarea)

**Validation**:
- Required field checks
- Character limits with live count
- Server-side duplicate detection
- Error message display

**Events**:
- Emits `glossary:updated` on successful creation
- Auto-closes modal on success

---

## Integration

### DeepDivePanelV2
**Path**: `/components/deepdive/DeepDivePanelV2.tsx`

**Changes**:
1. Import: `import { DefinitionSheet } from "@/components/glossary/DefinitionSheet"`
2. State:
   ```typescript
   const [termsSheetOpen, setTermsSheetOpen] = useState(false);
   ```
3. Toggle Button:
   ```tsx
   <SheetToggleButton
     side="right"
     open={termsSheetOpen}
     onClick={() => setTermsSheetOpen(!termsSheetOpen)}
     icon={<BookOpenIcon />}
     label="Terms"
   />
   ```
4. FloatingSheet:
   ```tsx
   <FloatingSheet
     open={termsSheetOpen}
     onOpenChange={setTermsSheetOpen}
     side="right"
     width={520}
     title="Deliberation Terms"
     subtitle="Community definitions & consensus"
   >
     <DefinitionSheet deliberationId={deliberationId} />
   </FloatingSheet>
   ```

---

## Demo Data

### Seed Script
**Path**: `/scripts/seed-glossary-demo.ts`

**Usage**:
```bash
# Seed specific deliberation
tsx scripts/seed-glossary-demo.ts <deliberationId>

# Seed most recent deliberation
tsx scripts/seed-glossary-demo.ts
```

**Sample Data**:
- **Justice** (2 competing definitions - liberal vs libertarian perspectives)
- **Freedom** (2 definitions - negative vs positive liberty)
- **Equity** (1 definition - redistributive fairness)
- **Common Good** (3 definitions - individualist vs collectivist vs emergent)
- **Autonomy** (1 definition - self-governance)

**Generated Data**:
- Automatic author endorsements
- Random endorsements from other users
- Random upvotes/downvotes on contested terms
- Automatic consensus promotion (50% threshold)

**Requirements**:
- At least 2 users in database
- At least 1 deliberation exists

---

## Testing Checklist

### Database
- [x] Schema pushed successfully
- [x] All indices created
- [x] Foreign key constraints working
- [ ] Query performance tested with 100+ terms

### API Endpoints
- [ ] GET terms - filtering, sorting, search
- [ ] POST terms - validation, duplicate detection
- [ ] POST definitions - status update to CONTESTED
- [ ] POST endorse - toggle, consensus promotion
- [ ] GET/POST vote - vote aggregation

### UI Components
- [ ] DefinitionSheet - search, filter, sort
- [ ] TermCard - expand/collapse competing definitions
- [ ] EndorseButton - optimistic updates
- [ ] ProposeTermModal - validation, error handling
- [ ] DeepDivePanelV2 - FloatingSheet integration

### Edge Cases
- [ ] Multiple users endorsing same definition simultaneously
- [ ] Definition deletion when endorsed by others
- [ ] Term deletion with existing usages
- [ ] Consensus threshold with even participant counts
- [ ] Very long term names/definitions (UI overflow)

### Performance
- [ ] Virtualized list with 100+ terms
- [ ] SWR caching effectiveness
- [ ] Database query optimization (N+1 prevention)
- [ ] Optimistic UI responsiveness

---

## Deployment Steps

1. **Database Migration**:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

2. **Verify TypeScript**:
   ```bash
   npm run lint
   tsc --noEmit
   ```

3. **Seed Demo Data** (optional):
   ```bash
   tsx scripts/seed-glossary-demo.ts [deliberationId]
   ```

4. **Build & Deploy**:
   ```bash
   npm run build
   npm run start
   ```

5. **Test in Production**:
   - Navigate to a deliberation
   - Click "Terms" toggle button (right side)
   - Verify FloatingSheet opens with DefinitionSheet
   - Test proposing new term
   - Test endorsing definitions

---

## Future Enhancements

### Phase 2 (Post-MVP)
- **Etymology/Sources**: Add optional etymology or source citations
- **Definition Editing**: Allow authors to edit with history tracking
- **Definition Merging**: Merge similar definitions with community approval
- **Usage Highlighting**: Auto-detect term usage in claims/arguments
- **Term Linking**: Link terms to each other (e.g., "See also: Justice")
- **Expert Badges**: Mark definitions proposed by domain experts
- **Version Control**: Full diff view of definition history

### Phase 3 (Advanced)
- **AI Assistance**: Suggest definitions based on context
- **Semantic Clustering**: Group related terms automatically
- **Export Glossary**: Download as markdown/PDF
- **Import Standards**: Import from external ontologies
- **Multi-language**: Support term translations
- **Citation Linking**: Link definitions to external sources

---

## Troubleshooting

### TypeScript Errors
**Issue**: `Property 'glossaryTerm' does not exist on type 'PrismaClient'`

**Solution**:
```bash
npx prisma generate
# Restart TypeScript server in VS Code: Cmd+Shift+P → "TypeScript: Restart TS Server"
```

### Database Sync Issues
**Issue**: Schema out of sync with database

**Solution**:
```bash
npx prisma db push --force-reset  # ⚠️ WARNING: Deletes all data
# OR
npx prisma db push --accept-data-loss
```

### SWR Not Updating
**Issue**: UI not reflecting new data after mutations

**Solution**:
- Ensure `mutate()` is called after POST requests
- Check `glossary:updated` event dispatch in ProposeTermModal
- Verify `revalidateOnFocus` and `revalidateOnReconnect` in SWR config

### Consensus Not Promoting
**Issue**: Definitions not auto-promoting to canonical despite endorsements

**Debug**:
1. Check participant count calculation in `/api/glossary/definitions/[definitionId]/endorse/route.ts`
2. Verify 50% threshold logic
3. Ensure `isCanonical` flag updates correctly

---

## Documentation References

- **Schema Changes**: `/docs/GLOSSARY_SCHEMA_CHANGES.md`
- **Design Roadmap**: `/docs/DEFINITION_SHEET_DESIGN_ROADMAP.md`
- **This Guide**: `/docs/GLOSSARY_IMPLEMENTATION_COMPLETE.md`

---

## Summary

**Files Created/Modified**: 14 total
- 1 Prisma schema modification
- 4 API routes (7 endpoints)
- 4 UI components
- 1 integration (DeepDivePanelV2)
- 1 seed script
- 3 documentation files

**Lines of Code**: ~1,500+ (excluding docs)

**Status**: ✅ Ready for testing and demo
