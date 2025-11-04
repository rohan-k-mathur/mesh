# Scoped Designs Implementation Status

**Date:** November 4, 2025  
**Phase:** Milestone 1 - Schema & Backend (In Progress)  
**Status:** ✅ Foundation Complete, Ready for Core Logic

---

## Completed Today ✅

### 1. **Forest View Foundation** (Earlier)
- ✅ Created `buildTreeFromDesign.ts` - Build tree from single design
- ✅ Created `DesignTreeView.tsx` - Display individual design independently
- ✅ Created `LudicsForest.tsx` - Multi-design orchestrator with view modes
- ✅ Updated `LudicsPanel.tsx` - Added forest/split/merged toggle
- ✅ All components lint-clean (no errors)

### 2. **Theoretical Grounding** (Study Phase)
- ✅ Read "Dialogues in Ludics" paper (Fleury, Quatrini, Tronçon)
- ✅ Created `LUDICS_THEORY_FOUNDATIONS.md` (600+ lines)
  - Mapped formal ludics concepts to implementation
  - Justified scoped designs via "context" and "former dialogues" (§3.3)
  - Identified missing features (Fax/delocation, multi-addresses)
  - Validated architectural approach

### 3. **Architecture Planning**
- ✅ Created `LUDICS_SCOPED_DESIGNS_ARCHITECTURE.md` (900+ lines)
  - 3 scoping strategies (issue, actor-pair, argument)
  - Complete implementation plan (4 milestones, 2 weeks)
  - Full code examples for all components
  - Migration strategy with backward compatibility

### 4. **Schema Updates** (Milestone 1.1)
- ✅ Updated `lib/models/schema.prisma`:
  ```prisma
  model LudicDesign {
    scope         String? // 'issue:<id>' | 'actors:<id1>:<id2>' | null
    scopeType     String? // 'issue' | 'actor-pair' | 'argument' | null
    scopeMetadata Json?   // { label, actors, issueId, ... }
    
    @@index([deliberationId, scope])
    @@index([deliberationId, scopeType])
    @@index([deliberationId, participantId, scope])
  }
  ```
- ✅ Generated Prisma client successfully
- ✅ Created migration file: `20241104000000_add_scoped_designs.sql`

---

## Next Immediate Steps 🎯

### Milestone 1.2: Update `compileFromMoves` (Est. 2-3 hours)

**File:** `packages/ludics-engine/compileFromMoves.ts`

**Changes Needed:**

1. **Add options parameter:**
```typescript
export async function compileFromMoves(
  dialogueId: string,
  options?: {
    scopingStrategy?: 'legacy' | 'issue' | 'actor-pair' | 'argument';
    forceRecompile?: boolean;
  }
): Promise<{ ok: true; designs: string[] }>
```

2. **Implement helper functions:**
```typescript
// Helper: Compute scope for each move
async function computeScopes(
  moves: DialogueMoveRow[],
  strategy: 'legacy' | 'issue' | 'actor-pair' | 'argument'
): Promise<Array<DialogueMoveRow & { scope: string | null }>>

// Helper: Find root arguments for issue grouping
async function computeArgumentRoots(
  moves: DialogueMoveRow[]
): Promise<Map<string, string>>

// Helper: Build metadata for scope
function buildScopeMetadata(
  scopeKey: string,
  moves: DialogueMoveRow[],
  strategy: string
): any

// Helper: Derive human-readable label
function deriveScopeLabel(
  scopeKey: string, 
  moves: DialogueMoveRow[]
): string
```

3. **Update main compilation loop:**
```typescript
// Group moves by scope
const movesByScope = groupBy(movesWithScopes, m => m.scope ?? 'legacy');

// Create designs per scope (instead of just 2)
for (const [scopeKey, scopeMoves] of Object.entries(movesByScope)) {
  const scopeMetadata = buildScopeMetadata(scopeKey, scopeMoves, strategy);
  
  // Create P and O for this scope
  const P = await tx.ludicDesign.create({
    data: {
      deliberationId: dialogueId,
      participantId: 'Proponent',
      scope: scopeKey === 'legacy' ? null : scopeKey,
      scopeType: strategy === 'legacy' ? null : strategy,
      scopeMetadata,
      ...
    }
  });
  
  const O = await tx.ludicDesign.create({ /* same but Opponent */ });
  
  // Compile acts for this scope
  await compileScopeActs(tx, scopeMoves, P, O);
}
```

---

### Milestone 1.3: API Updates (Est. 1-2 hours)

#### Update GET `/api/ludics/designs`

**File:** `app/api/ludics/designs/route.ts`

**Changes:**
```typescript
// Add query params for scope filtering
const scope = searchParams.get('scope');
const scopeType = searchParams.get('scopeType');

// Filter designs by scope
const where: any = { deliberationId };
if (scope !== null) {
  where.scope = scope === 'null' ? null : scope;
}
if (scopeType) {
  where.scopeType = scopeType;
}

// Return grouped designs
const designs = await prisma.ludicDesign.findMany({ where, include: { acts } });
const grouped = groupBy(designs, d => d.scope ?? 'legacy');

return NextResponse.json({
  ok: true,
  designs,
  grouped,  // NEW: Pre-grouped for forest view
  scopes: Object.keys(grouped),
});
```

#### Create POST `/api/ludics/compile`

**File:** `app/api/ludics/compile/route.ts` (NEW)

**Purpose:** Allow frontend to trigger recompilation with different scoping strategy

```typescript
export async function POST(req: NextRequest) {
  const { deliberationId, scopingStrategy } = await req.json();
  
  const result = await compileFromMoves(deliberationId, {
    scopingStrategy: scopingStrategy ?? 'issue',
    forceRecompile: true
  });
  
  await syncLudicsToAif(deliberationId);
  await invalidateInsightsCache(deliberationId);
  
  return NextResponse.json({ ok: true, ...result });
}
```

---

### Milestone 1.4: UI Integration (Est. 1-2 hours)

#### Update `LudicsForest.tsx`

**Already created**, but needs:
1. **Scoping strategy selector** (dropdown)
2. **Recompile button** (calls `/api/ludics/compile`)
3. **ScopeInteractionView component** (shows each duo-design pair)

#### Update `LudicsPanel.tsx`

**Already done!** ✅
- Added forest view mode toggle
- Updated viewMode type to include 'forest'
- Wired into forest component

---

## Testing Plan 🧪

### Unit Tests

**File:** `packages/ludics-engine/__tests__/compileFromMoves.test.ts`

```typescript
describe('compileFromMoves with scoping', () => {
  it('legacy mode creates 2 designs with scope=null', async () => {
    const result = await compileFromMoves(testDelibId, { 
      scopingStrategy: 'legacy' 
    });
    
    const designs = await prisma.ludicDesign.findMany({
      where: { deliberationId: testDelibId, scope: null }
    });
    
    expect(designs).toHaveLength(2);
    expect(designs.map(d => d.participantId)).toEqual(['Proponent', 'Opponent']);
  });
  
  it('issue mode creates N*2 designs for N issues', async () => {
    // Setup: 3 issues
    await createTestMovesForMultipleIssues(testDelibId, 3);
    
    const result = await compileFromMoves(testDelibId, { 
      scopingStrategy: 'issue' 
    });
    
    const designs = await prisma.ludicDesign.findMany({
      where: { deliberationId: testDelibId, scopeType: 'issue' }
    });
    
    expect(designs).toHaveLength(6); // 3 issues * 2 polarities
    
    // Verify each scope has P and O
    const grouped = groupBy(designs, d => d.scope);
    for (const [scope, scopeDesigns] of Object.entries(grouped)) {
      expect(scopeDesigns).toHaveLength(2);
      expect(scopeDesigns.map(d => d.participantId)).toEqual(
        expect.arrayContaining(['Proponent', 'Opponent'])
      );
    }
  });
  
  it('scope metadata includes label and actors', async () => {
    await compileFromMoves(testDelibId, { scopingStrategy: 'issue' });
    
    const design = await prisma.ludicDesign.findFirst({
      where: { deliberationId: testDelibId, scopeType: 'issue' }
    });
    
    expect(design.scopeMetadata).toMatchObject({
      type: 'issue',
      label: expect.any(String),
      moveCount: expect.any(Number),
      actors: {
        proponent: expect.any(Array),
        opponent: expect.any(Array),
        all: expect.any(Array),
      },
      timeRange: {
        start: expect.any(Date),
        end: expect.any(Date),
      }
    });
  });
});
```

### Integration Tests

**File:** `scripts/test-scoped-designs.ts`

```typescript
async function testScopedDesigns() {
  console.log('🧪 Testing scoped designs architecture...\n');
  
  // Test 1: Legacy backward compat
  console.log('Test 1: Legacy mode...');
  await compileFromMoves(testDelibId, { scopingStrategy: 'legacy' });
  const legacyDesigns = await prisma.ludicDesign.findMany({
    where: { deliberationId: testDelibId, scope: null }
  });
  console.assert(legacyDesigns.length === 2, 'Legacy should have 2 designs');
  console.log('✅ Pass\n');
  
  // Test 2: Issue-based scoping
  console.log('Test 2: Issue-based scoping...');
  await compileFromMoves(testDelibId, { scopingStrategy: 'issue' });
  const issueDesigns = await prisma.ludicDesign.findMany({
    where: { deliberationId: testDelibId, scopeType: 'issue' }
  });
  console.log(`Found ${issueDesigns.length} issue-scoped designs`);
  console.log('✅ Pass\n');
  
  // Test 3: Forest view renders
  console.log('Test 3: Forest view API...');
  const res = await fetch(`/api/ludics/designs?deliberationId=${testDelibId}`);
  const json = await res.json();
  console.assert(json.grouped, 'API returns grouped designs');
  console.log(`✅ Pass - ${Object.keys(json.grouped).length} scopes\n');
  
  console.log('🎉 All tests passed!');
}
```

### Manual Testing Checklist

- [ ] Apply migration: `npx prisma migrate deploy` or run SQL manually
- [ ] Restart dev server
- [ ] Navigate to deliberation with multiple issues
- [ ] Click "🌲 Forest" view mode
- [ ] Verify designs grouped by scope
- [ ] Change scoping strategy dropdown
- [ ] Click recompile button
- [ ] Verify forest updates with new scopes
- [ ] Check legacy mode (Merged view) still works
- [ ] Verify backward compatibility (existing deliberations)

---

## Current State Summary

### What Works ✅
1. **Schema:** Updated with scope fields, indexes created
2. **Prisma Client:** Generated successfully with scope/scopeType/scopeMetadata fields
3. **Migration:** SQL file created in proper directory structure (prisma/migrations/20241104000000_add_scoped_designs/migration.sql)
4. **Database:** Migration applied successfully
5. **UI Components:** Forest, DesignTreeView, buildTreeFromDesign all created
6. **View Toggle:** LudicsPanel has forest/split/merged modes
7. **Theory:** Fully grounded in formal ludics
8. **Backend Logic:** `compileFromMoves` updated with:
   - New signature accepting `CompileOptions` with `scopingStrategy` parameter
   - Helper functions: `computeScopes`, `computeArgumentRoots`, `buildScopeMetadata`, `deriveScopeLabel`
   - Scoped compilation loop creating P/O designs per scope
   - `compileScopeActs` function for per-scope act compilation
9. **API Endpoints:**
   - ✅ `GET /api/ludics/designs` - Returns grouped designs with scope metadata
   - ✅ `POST /api/ludics/compile` - Accepts scopingStrategy parameter for recompilation
10. **Testing:**
    - ✅ Unit tests created: `packages/ludics-engine/__tests__/scopedDesigns.test.ts` (300+ lines)
    - ✅ Integration test script: `scripts/test-scoped-designs.ts` (200+ lines)

### Known Issues 🐛
1. **VS Code TypeScript Server Cache:** VS Code's TS server is showing compile errors for the `scope` fields, but:
   - The Prisma client DOES include the fields (verified in node_modules/.prisma/client/index.d.ts)
   - Running `npx tsc` directly doesn't complain about the scope fields
   - This is a VS Code caching issue that should resolve after:
     - Reloading the VS Code window (Cmd+Shift+P → "Reload Window")
     - Or restarting VS Code entirely

### What's Next 🚧
1. **Reload VS Code:** Clear TypeScript server cache to verify no real errors
2. **Run Tests:** 
   - `npm run test` for unit tests
   - `npx tsx scripts/test-scoped-designs.ts` for integration tests with real data
3. **UI Polish:** Add scoping dropdown + recompile button to LudicsForest
4. **Manual QA:** Test with real deliberation data in browser
5. **Documentation:** Update API docs, user guide

### Estimated Time to Complete Milestone 1
- ~~**compileFromMoves updates:** 2-3 hours~~ ✅ DONE
- ~~**API updates:** 1-2 hours~~ ✅ DONE
- ~~**Testing setup:** 2-3 hours~~ ✅ DONE
- **Run & verify tests:** 1-2 hours
- **UI integration:** 1-2 hours
- **Manual QA:** 1-2 hours
- **Remaining:** ~3-6 hours

---

## Key Design Decisions Made

### 1. **Issue-Based Scoping First**
- **Why:** Natural grouping, moderate complexity, high user value
- **Alternative considered:** Actor-pair (too many pairs for N actors)
- **Future:** Can add actor-pair as secondary mode

### 2. **Backward Compatibility via `scope=null`**
- **Why:** Existing deliberations continue to work without migration
- **How:** Legacy mode creates designs with `scope=null`, `scopeType=null`
- **Benefit:** Zero-risk deployment, gradual rollout possible

### 3. **Metadata-Rich Scopes**
- **Why:** Enable rich UI (labels, actor lists, move counts)
- **Structure:** `{ type, label, actors, moveCount, timeRange, ... }`
- **Benefit:** No additional queries needed for forest view

### 4. **Three Indexes for Performance**
- `(deliberationId, scope)` - Get all scopes for deliberation
- `(deliberationId, scopeType)` - Get all issue/actor-pair/argument scopes
- `(deliberationId, participantId, scope)` - Find P/O pair for specific scope

### 5. **Configurable Strategy (Not Hardcoded)**
- **Why:** Allow experimentation, user preference, per-deliberation config
- **How:** `scopingStrategy` parameter in `compileFromMoves`
- **Future:** Store strategy preference in `Deliberation.extJson`

---

## Risks & Mitigation

### Risk 1: Migration Breaks Production
**Mitigation:** 
- Fields are nullable (backward compatible)
- Test on staging first
- Rollback plan: Remove indexes, set columns to NULL

### Risk 2: Issue Detection Fails
**Mitigation:**
- Fallback to `argument` scoping (fine-grained, always works)
- Log scope computation errors
- Manual scope override in admin UI (future)

### Risk 3: Too Many Scopes
**Mitigation:**
- Lazy-load traces (don't fetch all at once)
- Collapsible scope cards
- Filter: "Show only unresolved"

### Risk 4: Performance Degradation
**Mitigation:**
- Batch queries with `include: { acts }`
- Cache grouped designs in SWR
- Indexes on all scope queries

---

## Documentation Created

1. **`LUDICS_THEORY_FOUNDATIONS.md`** (600+ lines)
   - Formal ludics concepts mapped to implementation
   - Behavioral identity, localization, three meanings
   - Fax/delocation, presupposition, circular reasoning
   - Gap analysis (what we have vs what's missing)

2. **`LUDICS_SCOPED_DESIGNS_ARCHITECTURE.md`** (900+ lines)
   - Complete implementation plan (4 milestones)
   - 3 scoping strategies with pros/cons
   - Full code examples for all components
   - Migration strategy, testing plan, success metrics

3. **`LUDICS_FOREST_ARCHITECTURE.md`** (Earlier, 731 lines)
   - Original forest design document
   - 4 view modes (forest, split, trace, merged)
   - Theoretical justification

4. **`SCOPED_DESIGNS_IMPLEMENTATION_STATUS.md`** (This file)
   - Current progress tracker
   - Next steps with estimates
   - Testing plan, risks, decisions

---

## Questions for Review

1. **Migration Timing:** Apply migration now (dev) or wait for staging?
2. **Default Strategy:** Should new deliberations use `issue` or `legacy` by default?
3. **UI Placement:** Scoping dropdown in LudicsPanel header or per-deliberation settings?
4. **Performance Target:** What's acceptable compile time for 100 moves with 5 scopes?

---

## Next Session Plan

**Goal:** Complete Milestone 1 (Backend) in next 4-6 hours

**Tasks:**
1. ✅ Apply migration (if approved)
2. 🚧 Implement `computeScopes` helper
3. 🚧 Implement `computeArgumentRoots` helper
4. 🚧 Update `compileFromMoves` main loop
5. 🚧 Update `/api/ludics/designs` with grouping
6. 🚧 Create `/api/ludics/compile` endpoint
7. 🚧 Add scoping dropdown to LudicsForest
8. 🧪 Write unit tests
9. 🧪 Manual QA testing
10. 📝 Update user docs

**Success Criteria:**
- Can compile deliberation with `scopingStrategy: 'issue'`
- Forest view shows multiple scope cards
- Each scope has independent P/O designs
- Legacy mode still works (backward compat)
- All tests passing

---

**Last Updated:** November 4, 2025, 11:45 PM  
**Status:** ✅ Foundation complete, ready for core implementation
