# Mesh Agora Development Roadmap

**Document Version:** 1.0  
**Created:** October 28, 2025  
**Status:** In Progress  
**Overall System Grade:** A- (90%)

---

## 📋 Executive Summary

This roadmap consolidates findings from comprehensive architecture review (Phases 1-6, 11 chunks) into actionable development stages. The Mesh Agora system demonstrates excellent theoretical foundations (AIF 2.0, ASPIC+, Ludics integration) with strong implementation quality (90% grade), but requires targeted fixes in integration gaps, UI completeness, and external tool validation.

**Total Tasks Identified:** 120+ specific improvements  
**Implementation Horizon:** 6-8 months for full completion  
**Priority Distribution:**
- 🔴 Critical (Tier 1): 15 tasks — 2-4 weeks total
- 🟠 High (Tier 2): 28 tasks — 8-12 weeks total  
- 🟡 Medium (Tier 3): 42 tasks — 12-16 weeks total
- 🟢 Low (Tier 4): 35+ tasks — ongoing polish

---

## 🎯 System Status Overview

### Phase Grades Summary

| Phase | Focus Area | Grade | Status | Key Strengths | Critical Gaps |
|-------|-----------|-------|--------|---------------|---------------|
| **1A** | AIF Core Types | A+ (96%) | ✅ Excellent | Full AIF 2014 compliance, export/import | Scheme round-trip, PA import |
| **1B** | Argument Graph | A+ (96%) | ✅ Excellent | AssumptionUse integrated, neighborhoods | Hom-set grouping, confidence scoring |
| **2A** | Evidential Backend | A+ (95%) | ✅ Excellent | ArgumentSupport table, categorical ops | rulesetJson not wired |
| **2B** | Confidence UI | A- (90%) | ✅ Strong | Global context, τ-gating innovation | DS mode incomplete, no explanation UI |
| **3A** | Scheme System | A (93%) | ✅ Strong | Macagno taxonomy, proof obligations | Scheme→confidence disconnected |
| **3B** | Dialogue Protocol | A (93%) | ✅ Strong | Ludics integration, 9 move types | R6 incoherence check missing |
| **4A** | UI Integration | A- (90%) | ✅ Strong | 95% API coverage, rich components | Property bugs, dialogue state |
| **4B** | ArgumentPopout | A- (90%) | ✅ Strong | Dual-mode rendering | Minor UX polish needed |
| **5B** | Plexus Network | A- (90%) | ✅ Strong | 5-edge typology, multi-room joins | Semantic identity, confidence UI |
| **6A** | Knowledge Base | B+ (87%) | ⚠️ Good | Live/pinned architecture, transclude API | Minimal UI, no bidirectional links |
| **6B** | AIF Export | B (83%) | ⚠️ Good | All node types exported | Import lossy (50%), no validation |

**Overall Average: A- (90%)**

### Research-Grade Innovations

1. **Proof Obligation Enforcement for CQs** ⭐⭐⭐⭐⭐  
   *First system requiring structural/semantic proof for CQ satisfaction*

2. **Ludics Integration** ⭐⭐⭐⭐⭐  
   *Unique: Automatic daimon closure detection in argumentation platform*

3. **τ-Gating Across Deliberation Networks** ⭐⭐⭐⭐  
   *Threshold-based filtering for inter-deliberation confidence propagation*

4. **Dual-Persistence Confidence Management** ⭐⭐⭐⭐  
   *Client-side (instant UX) + server-side (shareable defaults)*

5. **Multi-Response Collaborative CQ System** ⭐⭐⭐  
   *Community-validated responses vs. single-author requirement*

---

## 🏗️ Roadmap Structure

Development organized into 6 phases over 6-8 months:

- **Phase 1: Critical Integration Fixes** (2-4 weeks) — Wire disconnected systems
- **Phase 2: Core Feature Completion** (6-8 weeks) — Implement missing backend logic
- **Phase 3: UI Completeness & Polish** (4-6 weeks) — Expose all backend capabilities
- **Phase 4: Interoperability & Validation** (3-4 weeks) — External tool integration
- **Phase 5: Advanced Features** (8-10 weeks) — DDF protocol, commitment stores
- **Phase 6: Performance & Scale** (4-6 weeks) — Optimization, caching, analytics

---

## 📍 Phase 1: Critical Integration Fixes

**Duration:** 2-4 weeks  
**Priority:** 🔴 Critical (Blocks other features)  
**Effort:** Low-Medium (mostly wiring existing systems)  
**Risk:** Low (changes are localized)

**Objective:** Connect already-implemented backend systems to confidence calculation, fix UI property bugs, and establish proper round-trip data flows. These fixes unblock dependent features and significantly improve user experience with minimal risk.

---

### 1.1 Confidence System Integration

#### Task 1.1.1: Integrate CQ Satisfaction with Confidence
**Priority:** 🔴 Critical  
**Effort:** 3 hours  
**Files:**
- `/app/api/evidential/score/route.ts`
- `/lib/client/evidential.ts`

**Current State:** CQ satisfaction status tracked but ignored by confidence calculation

**Implementation:**
```typescript
// In /app/api/evidential/score/route.ts
const argument = await prisma.argument.findUnique({
  where: { id: argumentId },
  include: {
    scheme: { include: { criticalQuestions: true } },
    criticalQuestionStatuses: true
  }
});

const unsatisfiedCount = argument.criticalQuestionStatuses.filter(
  cq => !cq.satisfied
).length;

const cqPenalty = Math.pow(0.85, unsatisfiedCount);
argumentConfidence *= cqPenalty;
```

**Acceptance Criteria:**
- [ ] Arguments with 0 unsatisfied CQs: no penalty
- [ ] Arguments with 1 unsatisfied CQ: 15% penalty (0.85x)
- [ ] Arguments with 3 unsatisfied CQs: 39% penalty (0.85³ ≈ 0.61x)
- [ ] Penalty documented in `/api/evidential/score?explain=1` response
- [ ] Unit test covers 0, 1, 3, 5 unsatisfied CQs scenarios

**Dependencies:** None  
**Blocks:** Temporal decay (Task 1.1.3)

---

#### Task 1.1.2: Add Scheme Base Confidence
**Priority:** 🔴 Critical  
**Effort:** 2 hours  
**Files:**
- `/app/api/evidential/score/route.ts`
- `prisma/schema.prisma` (validators field already exists)

**Current State:** `ArgumentScheme.validators.baseConfidence` field exists but unused

**Implementation:**
```typescript
// In /app/api/evidential/score/route.ts
const schemeBase = argument.scheme?.validators?.baseConfidence ?? 0.6;
let argumentConfidence = schemeBase;

// Then apply other modifiers (CQ penalty, premise strengths, etc.)
argumentConfidence *= premiseProduct;
argumentConfidence *= cqPenalty;
```

**Scheme Base Confidence Values:**
- Expert Opinion: 0.75 (high baseline)
- Analogy: 0.55 (moderate baseline)
- Popular Opinion: 0.45 (low baseline)
- Correlation to Cause: 0.40 (very low baseline)

**Acceptance Criteria:**
- [ ] Schemes without `baseConfidence` default to 0.6
- [ ] Expert Opinion arguments start at 75% confidence
- [ ] Popular Opinion arguments start at 45% confidence
- [ ] Base confidence shown in explanation API response
- [ ] Seed script creates schemes with varied base confidence values

**Dependencies:** None  
**Blocks:** Scheme similarity search (Task 2.3.1)

---

#### Task 1.1.3: Wire `rulesetJson.confidence.mode` Through API
**Priority:** 🔴 Critical  
**Effort:** 2 hours  
**Files:**
- `/app/api/evidential/score/route.ts`
- `/app/api/deliberations/[id]/evidential/route.ts`

**Current State:** Room default mode stored in `Deliberation.rulesetJson` but not read by API

**Implementation:**
```typescript
// In /app/api/evidential/score/route.ts
const deliberation = await prisma.deliberation.findUnique({
  where: { id: deliberationId },
  select: { rulesetJson: true }
});

const defaultMode = deliberation?.rulesetJson?.confidence?.mode ?? "product";
const mode = (req.query.mode ?? defaultMode) as Mode;
```

**Acceptance Criteria:**
- [ ] Room with `rulesetJson.confidence.mode = "min"` uses min by default
- [ ] Query param `?mode=product` overrides room default
- [ ] Missing rulesetJson falls back to "product"
- [ ] API response includes `"modeUsed": "min"` field
- [ ] Integration test verifies room default + override behavior

**Dependencies:** None  
**Blocks:** None (improves UX but not blocking)

---

#### Task 1.1.4: Read Room Default Mode on Client Load
**Priority:** 🟠 High  
**Effort:** 1 hour  
**Files:**
- `/components/confidence/ConfidenceProvider.tsx`
- `/lib/hooks/useDebateSheet.ts`

**Current State:** Client always initializes to localStorage, ignoring room defaults

**Implementation:**
```tsx
// In ConfidenceProvider.tsx
React.useEffect(() => {
  const roomMode = debateSheet?.rulesetJson?.confidence?.mode;
  if (roomMode && mode !== roomMode) {
    setMode(roomMode); // Sync to room default on mount
  }
}, [debateSheet?.rulesetJson]);
```

**Acceptance Criteria:**
- [ ] Opening room with `mode="min"` sets client to min
- [ ] User can override room default (localStorage takes precedence after explicit change)
- [ ] Tooltip shows "Room default: min" when using room default
- [ ] Switching rooms updates mode to new room's default

**Dependencies:** Task 1.1.3  
**Blocks:** None

---

### 1.2 UI Property & Display Fixes

#### Task 1.2.1: Fix DiagramViewer Property Path Bug
**Priority:** 🔴 Critical  
**Effort:** 30 minutes  
**Files:**
- `/components/dialogue/deep-dive/DiagramViewer.tsx`

**Current State:** Crashes when `diag.aif` undefined (expects `diag.diagram.aif`)

**Implementation:**
```tsx
// In DiagramViewer.tsx
const aifGraph = diag?.diagram?.aif ?? diag?.aif;
if (!aifGraph) {
  return <div className="text-muted">No diagram data available</div>;
}
```

**Acceptance Criteria:**
- [ ] Component handles both `diag.aif` and `diag.diagram.aif`
- [ ] Graceful fallback message when no AIF data
- [ ] No console errors on missing property
- [ ] Works with ArgumentPopoutDualMode and DeepDivePanel

**Dependencies:** None  
**Blocks:** None

---

#### Task 1.2.2: Add Confidence Explanation Popover
**Priority:** 🔴 Critical  
**Effort:** 2 hours  
**Files:**
- `/components/confidence/SupportBar.tsx` (add popover trigger)
- `/components/confidence/ConfidenceBreakdown.tsx` (NEW component)

**Current State:** API returns breakdown via `?explain=1` but UI doesn't show it

**Implementation:**
```tsx
// NEW: /components/confidence/ConfidenceBreakdown.tsx
export function ConfidenceBreakdown({ explain }: { explain: ExplainData }) {
  return (
    <div className="space-y-2 text-sm">
      <div>Base: {(explain.base * 100).toFixed(0)}%</div>
      <div>Premises: {(explain.premiseProduct * 100).toFixed(0)}%</div>
      <div>CQ Penalty: {(explain.cqPenalty * 100).toFixed(0)}%</div>
      <Separator />
      <div className="font-semibold">
        Final: {(explain.final * 100).toFixed(0)}%
      </div>
    </div>
  );
}

// Update SupportBar.tsx
<Popover>
  <PopoverTrigger asChild>
    <div className="cursor-help"><SupportBar value={v} /></div>
  </PopoverTrigger>
  <PopoverContent>
    <ConfidenceBreakdown explain={fetchedExplanation} />
  </PopoverContent>
</Popover>
```

**Acceptance Criteria:**
- [ ] Hovering SupportBar shows hand cursor
- [ ] Clicking SupportBar opens popover with breakdown
- [ ] Breakdown shows: base, premises, CQ penalty, final
- [ ] API called with `?explain=1` on popover open
- [ ] Loading state while fetching explanation

**Dependencies:** Task 1.1.1 (CQ penalty), Task 1.1.2 (scheme base)  
**Blocks:** None

---

### 1.3 Import/Export Round-Trip Fixes

#### Task 1.3.1: Fix Scheme Round-Trip in Import
**Priority:** 🔴 Critical  
**Effort:** 2 hours  
**Files:**
- `/packages/aif-core/src/import.ts`

**Current State:** Import loses scheme references (schemeKey → null)

**Implementation:**
```typescript
// In import.ts, when creating Argument from RA-node
const schemeKey = raNode.scheme; // AIF stores scheme as string key
const scheme = schemeKey 
  ? await prisma.argumentScheme.findFirst({ where: { key: schemeKey } })
  : null;

const argument = await prisma.argument.create({
  data: {
    text: raNode.text,
    schemeId: scheme?.id ?? null,
    deliberationId: targetDeliberationId,
    // ... other fields
  }
});
```

**Acceptance Criteria:**
- [ ] Exporting argument with "expert_opinion" scheme → imports with scheme preserved
- [ ] Unknown scheme keys log warning, set schemeId = null
- [ ] Round-trip test: `export(arg) → import(arg') ⇒ arg.scheme === arg'.scheme`
- [ ] Seed script tests scheme preservation

**Dependencies:** None  
**Blocks:** Task 1.3.3 (full round-trip test)

---

#### Task 1.3.2: Add PA-Node Import Support
**Priority:** 🟠 High  
**Effort:** 3 hours  
**Files:**
- `/packages/aif-core/src/import.ts`
- `prisma/schema.prisma` (PreferenceApplication model already exists)

**Current State:** Import skips PA-nodes (preferences not restored)

**Implementation:**
```typescript
// In import.ts, after CA-node processing
const PA_nodes = graph.nodes.filter(n => n.kind === "PA");

for (const pa of PA_nodes) {
  const preferredArg = raMap.get(pa.preferredElement);
  const dispreferredArg = raMap.get(pa.dispreferredElement);
  
  if (preferredArg && dispreferredArg) {
    await prisma.preferenceApplication.create({
      data: {
        deliberationId: targetDeliberationId,
        preferredArgumentId: preferredArg,
        dispreferredArgumentId: dispreferredArg,
        createdById: importerId,
        reason: pa.reason ?? null
      }
    });
  }
}
```

**Acceptance Criteria:**
- [ ] PA-nodes create PreferenceApplication rows
- [ ] Preferred/dispreferredArgumentId correctly mapped
- [ ] Missing references logged as warnings
- [ ] Round-trip preserves preference relationships

**Dependencies:** Task 1.3.1  
**Blocks:** Task 1.3.3

---

#### Task 1.3.3: Create Round-Trip Test Suite
**Priority:** 🔴 Critical  
**Effort:** 4 hours  
**Files:**
- `/tests/aif-roundtrip.test.ts` (NEW)
- `/.github/workflows/ci.yml` (add to CI pipeline)

**Current State:** No automated testing of export → import → compare

**Implementation:**
```typescript
// /tests/aif-roundtrip.test.ts
describe("AIF Round-Trip", () => {
  it("preserves all node types", async () => {
    const deliberationId = await seedFixture(); // Uses seed-aif-v05
    const exported = await exportDeliberationAsAifJSONLD(deliberationId);
    const importedId = await importAifJSONLD(exported);
    
    const original = await fetchGraphStructure(deliberationId);
    const restored = await fetchGraphStructure(importedId);
    
    expect(original.claimCount).toBe(restored.claimCount);
    expect(original.argumentCount).toBe(restored.argumentCount);
    expect(original.attackCount).toBe(restored.attackCount);
    expect(original.preferenceCount).toBe(restored.preferenceCount);
    // Schemes preserved
    expect(original.schemeKeys).toEqual(restored.schemeKeys);
  });
  
  it("preserves confidence metadata", async () => {
    // Test ArgumentSupport.strength survives round-trip
  });
});
```

**Acceptance Criteria:**
- [ ] Test passes with seed-aif-v05 fixture
- [ ] Node counts match (claims, arguments, attacks, preferences)
- [ ] Scheme keys preserved
- [ ] Premise/conclusion relationships intact
- [ ] CI fails if round-trip loses >5% of nodes

**Dependencies:** Task 1.3.1, Task 1.3.2  
**Blocks:** None (validates fixes)

---

### 1.4 Knowledge Base Bidirectional Linking

#### Task 1.4.1: Add DebateCitation Model
**Priority:** 🟠 High  
**Effort:** 2 hours  
**Files:**
- `prisma/schema.prisma`
- `prisma/migrations/` (auto-generated)

**Current State:** Deliberations don't know which KB pages cite them

**Implementation:**
```prisma
// Add to schema.prisma
model DebateCitation {
  id              String   @id @default(cuid())
  deliberationId  String
  kbPageId        String
  kbBlockId       String
  citedAt         DateTime @default(now())
  
  deliberation    Deliberation @relation(fields: [deliberationId], references: [id], onDelete: Cascade)
  kbPage          KbPage       @relation(fields: [kbPageId], references: [id], onDelete: Cascade)
  kbBlock         KbBlock      @relation(fields: [kbBlockId], references: [id], onDelete: Cascade)
  
  @@unique([deliberationId, kbPageId, kbBlockId])
  @@index([deliberationId])
  @@index([kbPageId])
}
```

**Acceptance Criteria:**
- [ ] Migration runs successfully
- [ ] Foreign key constraints enforced
- [ ] Cascade delete removes citations when page/deliberation deleted
- [ ] Unique constraint prevents duplicate citations

**Dependencies:** None  
**Blocks:** Task 1.4.2

---

#### Task 1.4.2: Create Citations Tracking API
**Priority:** 🟠 High  
**Effort:** 3 hours  
**Files:**
- `/app/api/deliberations/[id]/citations/route.ts` (NEW)
- `/app/api/kb/blocks/route.ts` (update to create citations)

**Current State:** No tracking when KB blocks embed deliberation content

**Implementation:**
```typescript
// POST /api/kb/blocks (update)
if (block.type === "claim" || block.type === "argument") {
  const deliberationId = block.dataJson.deliberationId;
  await prisma.debateCitation.upsert({
    where: {
      deliberationId_kbPageId_kbBlockId: {
        deliberationId,
        kbPageId: block.pageId,
        kbBlockId: block.id
      }
    },
    create: { deliberationId, kbPageId: block.pageId, kbBlockId: block.id },
    update: { citedAt: new Date() }
  });
}

// NEW: GET /api/deliberations/[id]/citations
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const citations = await prisma.debateCitation.findMany({
    where: { deliberationId: params.id },
    include: {
      kbPage: { select: { id: true, title: true } },
      kbBlock: { select: { id: true, type: true } }
    }
  });
  
  const grouped = citations.reduce((acc, c) => {
    if (!acc[c.kbPageId]) acc[c.kbPageId] = { page: c.kbPage, blocks: [] };
    acc[c.kbPageId].blocks.push(c.kbBlock);
    return acc;
  }, {});
  
  return Response.json({ pages: Object.values(grouped) });
}
```

**Acceptance Criteria:**
- [ ] Creating claim block creates DebateCitation
- [ ] Deleting block removes citation
- [ ] GET `/api/deliberations/[id]/citations` returns grouped pages
- [ ] Response includes page title and block count
- [ ] API handles deliberations with 0 citations gracefully

**Dependencies:** Task 1.4.1  
**Blocks:** Task 3.2.3 (UI display)

---

### Phase 1 Summary

**Total Tasks:** 11  
**Estimated Effort:** 26 hours (3-4 working days)  
**Critical Path:** Task 1.3.1 → 1.3.2 → 1.3.3 (round-trip fixes)

**Deliverables:**
- ✅ Confidence calculation includes CQ satisfaction and scheme base
- ✅ Room default confidence mode wired through API and client
- ✅ UI property bugs fixed (DiagramViewer, SupportBar explanation)
- ✅ Import preserves schemes and preferences
- ✅ Round-trip test suite added to CI
- ✅ Bidirectional KB ↔ Deliberation linking established

**Success Metrics:**
- [ ] Round-trip test passes with <5% node loss
- [ ] Confidence explanation popover shows on 100% of SupportBars
- [ ] No console errors on DiagramViewer render
- [ ] Room default mode respected on 100% of page loads
- [ ] DebateCitation tracking active for all KB block creates

**Next Phase Preview:** Phase 2 implements missing backend logic (dialogue state computation, temporal decay, AssumptionUse lifecycle) and completes DS mode Dempster-Shafer calculations.

---

## 🚦 Implementation Notes

### Development Workflow

1. **Branch Strategy:** Feature branches from `main` (e.g., `feat/confidence-cq-integration`)
2. **Commit Convention:** Use double quotes, present-tense ("Add CQ penalty to confidence calculation")
3. **Testing:** Run `npm run lint` and `npm run test` before PR
4. **Review:** All PRs require passing CI + round-trip tests

### Common Patterns

**Prisma Transactions:**
```typescript
await prisma.$transaction(async (tx) => {
  const claim = await tx.claim.create({ data });
  await tx.debateCitation.create({ data: { ... } });
});
```

**SWR Caching:**
```typescript
const { data, mutate } = useSWR(
  `/api/evidential/score?id=${id}&explain=1`,
  fetcher,
  { revalidateOnFocus: false, dedupingInterval: 5000 }
);
```

**Zod Validation:**
```typescript
const ExplainResponseSchema = z.object({
  base: z.number(),
  premiseProduct: z.number(),
  cqPenalty: z.number(),
  final: z.number()
});
```

### Risk Mitigation

**Breaking Changes:**
- Phase 1 changes are additive (new fields, new endpoints)
- Existing API contracts preserved
- Confidence calculation backward-compatible (new factors multiply)

**Data Migration:**
- No schema changes requiring backfill
- DebateCitation created going forward (no historical data)
- Schemes already have validators field (just unused)

**Rollback Plan:**
- Feature flags for confidence changes: `ENABLE_CQ_PENALTY=true`
- Disable via env var if issues detected
- Round-trip test prevents bad merges

---

## 📊 Success Metrics

### Phase 1 KPIs

**Technical Metrics:**
- Code coverage: >80% for new confidence logic
- Round-trip test: 100% pass rate
- API response time: <200ms for confidence calculation (unchanged)
- Zero regression bugs in existing confidence UI

**User Experience:**
- Confidence explanation: 90%+ of users interact with popover (analytics)
- Room mode persistence: 95%+ rooms use custom mode (vs. default)
- KB citation usage: 50%+ of pages cite at least 1 deliberation

**Quality Metrics:**
- Zero critical bugs in Phase 1 features
- <3 minor bugs per 10 PRs
- 100% documentation coverage for new APIs

---

*End of Phase 1. Phase 2-6 details will be added in subsequent updates to keep document manageable.*

**Last Updated:** October 28, 2025  
**Next Update:** Add Phase 2 tasks (Core Feature Completion)
