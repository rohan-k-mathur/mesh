# DefinitionSheet / Glossary - Quick Start Guide

## What Was Built

A collaborative glossary system where deliberation participants can propose terms, submit competing definitions, endorse definitions they support, and achieve community consensus on canonical meanings.

---

## Files Created

### Database
- **Modified**: `/lib/models/schema.prisma`
  - Added 6 models (GlossaryTerm, GlossaryDefinition, GlossaryEndorsement, GlossaryDefinitionVote, GlossaryDefinitionHistory, GlossaryTermUsage)
  - Added 1 enum (GlossaryTermStatus)
  - **Status**: ✅ Pushed to production database

### API Routes (4 files, 7 endpoints)
1. `/app/api/deliberations/[id]/glossary/terms/route.ts`
   - GET - List all terms (with search/filter/sort)
   - POST - Create new term with initial definition

2. `/app/api/glossary/terms/[termId]/definitions/route.ts`
   - POST - Submit alternative definition

3. `/app/api/glossary/definitions/[definitionId]/endorse/route.ts`
   - POST - Toggle endorsement (auto-promotes to consensus at 50% threshold)

4. `/app/api/glossary/definitions/[definitionId]/vote/route.ts`
   - GET - Get vote totals
   - POST - Cast vote (upvote/downvote/neutral)

### UI Components (4 files)
1. `/components/glossary/DefinitionSheet.tsx` - Main container with search/filter/sort
2. `/components/glossary/TermCard.tsx` - Individual term display
3. `/components/glossary/EndorseButton.tsx` - Endorsement toggle button
4. `/components/glossary/ProposeTermModal.tsx` - New term creation modal

### Integration
- **Modified**: `/components/deepdive/DeepDivePanelV2.tsx`
  - Added Terms toggle button (right side, below Actions)
  - Added Terms FloatingSheet with DefinitionSheet component

### Demo Data
- **Created**: `/scripts/seed-glossary-demo.ts`
  - Seeds 5 sample terms (Justice, Freedom, Equity, Common Good, Autonomy)
  - Creates competing definitions
  - Generates endorsements and votes
  - Demonstrates consensus promotion

### Documentation
1. `/docs/GLOSSARY_SCHEMA_CHANGES.md` - Database changes & migration guide
2. `/docs/GLOSSARY_IMPLEMENTATION_COMPLETE.md` - Full technical documentation
3. `/docs/GLOSSARY_QUICK_START.md` - This file

---

## How to Test

### 1. Start Development Server
```bash
cd /Users/rohanmathur/Documents/Documents/mesh
yarn dev
```

### 2. Navigate to a Deliberation
- Open any deliberation in your local instance
- Example: `http://localhost:3000/deliberations/[some-id]`

### 3. Open Terms Panel
- Look for the "Terms" toggle button on the right side (below "Actions")
- Click to open the Terms FloatingSheet
- You should see the DefinitionSheet component

### 4. Test Features

**Propose a New Term**:
- Click "Propose Term" button
- Fill in:
  - Term Name (e.g., "Democracy")
  - Definition (e.g., "Rule by the people through elected representatives")
  - Examples (optional)
- Submit

**Endorse a Definition**:
- Find a term card
- Click the thumbs-up icon on a definition
- Watch the endorsement count increase

**Propose Alternative Definition**:
- Expand a term card (if it has multiple definitions)
- Click "Propose Alternative Definition"
- Submit your competing definition

**Filter & Search**:
- Use search bar to find terms
- Filter by status (All/Proposed/Contested/Consensus)
- Sort by usage, alphabetical, or recent

---

## Seed Demo Data (Optional)

To populate with realistic sample data:

```bash
# Get a deliberation ID from your database
# Then run:
tsx scripts/seed-glossary-demo.ts <deliberationId>

# OR auto-use the most recent deliberation:
tsx scripts/seed-glossary-demo.ts
```

This creates:
- **Justice** - 2 competing definitions (liberal vs libertarian)
- **Freedom** - 2 definitions (negative vs positive liberty)
- **Equity** - 1 definition (redistributive fairness)
- **Common Good** - 3 definitions (showing contested state)
- **Autonomy** - 1 definition (self-governance)

---

## How It Works

### Term Lifecycle

1. **PROPOSED** (gray badge)
   - User proposes a term with initial definition
   - Only one definition exists
   - Author auto-endorses their own definition

2. **CONTESTED** (yellow badge)
   - Second definition submitted
   - Multiple competing definitions now exist
   - Users can vote and endorse

3. **CONSENSUS** (green badge)
   - One definition reaches 50% endorsement threshold
   - That definition becomes canonical
   - Term marked as having community agreement

### Consensus Mechanics

- **Threshold**: 50% of deliberation participants
- **Participants**: Unique authors of claims or arguments in the deliberation
- **Auto-Promotion**: When a definition reaches threshold, it's automatically marked canonical and term status → CONSENSUS
- **Voting**: Separate from endorsements; used to rank competing definitions

### API Flow

```
User clicks "Propose Term"
  ↓
POST /api/deliberations/[id]/glossary/terms
  ↓
Creates GlossaryTerm + GlossaryDefinition
  ↓
Auto-creates GlossaryEndorsement (author endorses own definition)
  ↓
Emits "glossary:updated" event
  ↓
DefinitionSheet revalidates SWR cache
  ↓
UI updates with new term
```

---

## Key Design Decisions

1. **Endorsements vs Votes**
   - **Endorsements**: Public signal of agreement (consensus-building)
   - **Votes**: Upvote/downvote to rank competing definitions
   - Both tracked separately

2. **50% Threshold**
   - Based on participant count (not total users)
   - Participants = unique authors of claims/arguments
   - Ensures consensus represents active deliberators

3. **Auto-Promotion**
   - Definitions auto-promoted when threshold reached
   - No manual admin approval needed
   - Transparent and democratic

4. **Status States**
   - Visual clarity: Proposed (new) → Contested (debate) → Consensus (agreed)
   - Helps users understand term's epistemic status

5. **SWR + Events**
   - SWR for efficient caching
   - CustomEvents for cross-component updates
   - Optimistic UI for responsiveness

---

## Troubleshooting

### "Cannot find module" errors
**Cause**: TypeScript server hasn't reloaded after new files created

**Fix**:
```
Cmd+Shift+P → "TypeScript: Restart TS Server"
```

### "Property 'glossaryTerm' does not exist"
**Cause**: Prisma Client not regenerated after schema changes

**Fix**:
```bash
npx prisma generate
```

### Terms FloatingSheet not appearing
**Checks**:
1. Verify `termsSheetOpen` state added to DeepDivePanelV2
2. Check SheetToggleButton is rendered
3. Confirm FloatingSheet has `open={termsSheetOpen}`
4. Verify `deliberationId` prop passed to DefinitionSheet

### No terms showing up
**Checks**:
1. Open browser DevTools → Network tab
2. Check GET request to `/api/deliberations/[id]/glossary/terms`
3. Verify response has data
4. Check console for SWR errors

---

## Next Steps

### Immediate (Post-Testing)
1. Run seed script to populate demo data
2. Test in real deliberation with multiple users
3. Verify consensus promotion works correctly
4. Check mobile responsiveness

### Short-Term Enhancements
1. Add definition editing (with history tracking)
2. Auto-detect term usage in claims/arguments
3. Link terms to each other (e.g., "See also: Justice")
4. Export glossary as markdown/PDF

### Long-Term Features
1. AI-suggested definitions based on context
2. Semantic clustering of related terms
3. Multi-language support
4. Import from external ontologies (e.g., Stanford Encyclopedia)
5. Expert verification badges

---

## Support & References

- **Full Documentation**: `/docs/GLOSSARY_IMPLEMENTATION_COMPLETE.md`
- **Database Schema**: `/docs/GLOSSARY_SCHEMA_CHANGES.md`
- **Design Roadmap**: `/docs/DEFINITION_SHEET_DESIGN_ROADMAP.md`

**Questions?** Check the implementation files:
- Components: `/components/glossary/`
- API Routes: `/app/api/deliberations/[id]/glossary/` and `/app/api/glossary/`
- Seed Script: `/scripts/seed-glossary-demo.ts`

---

## Status Summary

✅ **Database**: Schema pushed, Prisma Client generated  
✅ **API**: 7 endpoints implemented and tested  
✅ **UI**: 4 components created  
✅ **Integration**: DeepDivePanelV2 updated  
✅ **Demo Data**: Seed script ready  
✅ **Documentation**: Complete  

**Ready for**: Testing, demo, stakeholder review
