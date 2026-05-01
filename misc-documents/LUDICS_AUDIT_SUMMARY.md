# Ludics System Audit: Executive Summary

**Date:** November 26, 2025  
**Auditor:** System Review  
**Scope:** Compile & Step operations post-Phase 4 scoped designs  

---

## 🎯 Key Findings

### The Good News ✅

1. **Scoped Designs Architecture is Complete**
   - Phase 4 fully implemented (November 4, 2025)
   - Schema updated with `scope`, `scopeType`, `scopeMetadata`
   - `compileFromMoves()` supports 4 scoping strategies
   - Forest view (`LudicsForest.tsx`) correctly visualizes multiple scopes
   - Backward compatibility maintained via legacy mode

2. **Core Stepper Logic is Sound**
   - Alternation, locality, additivity invariants preserved
   - Convergence/divergence detection unchanged
   - Decisive indices (explain-why chain) working correctly
   - Support for consensus testers and composition modes

3. **Integration Points are Solid**
   - ASPIC+ metadata preserved through compilation
   - AIF sync capability exists (though not always called)
   - Insights cache framework in place
   - Hooks system for extensibility

### The Bad News ⚠️

1. **LudicsPanel UI is Outdated**
   - "Compile" button doesn't accept `scopingStrategy` parameter
   - "Step" button picks first P/O pair found (non-deterministic in multi-scope)
   - No way for users to select which scope to operate on
   - Commands assume single global scope (wrong for multi-scope deliberations)

2. **Commands Not Updated for Scopes**
   - **Orthogonality Check:** Global, not per-scope (misleading)
   - **Append Daimon:** No locus/scope specification
   - **NLI Analysis:** Operates on arbitrary trace
   - **Stable Sets:** Mixes all scopes (semantically wrong)
   - **Attach Testers:** Can't target specific scope

3. **Documentation Lag**
   - Many docs still reference single P/O pair assumption
   - No user guide for scoped designs feature
   - API reference doesn't document scope parameters
   - Component comments outdated

---

## 🔍 Detailed Gap Analysis

### Critical Gaps (High Priority)

| Component | Issue | Impact | Est. Fix Time |
|-----------|-------|--------|---------------|
| **LudicsPanel Compile** | Doesn't pass `scopingStrategy` | Users can't change scoping mode | 1 hour |
| **LudicsPanel Step** | Picks arbitrary scope | Non-deterministic results | 1 hour |
| **Scope Selector** | Missing from UI | No way to choose active scope | 1 hour |
| **Orthogonality Check** | Global, not per-scope | Wrong results for multi-scope | 1 hour |

**Total Critical Fix Time:** 4 hours

### Medium Priority Gaps

| Component | Issue | Impact | Est. Fix Time |
|-----------|-------|--------|---------------|
| **Append Daimon** | No scope/locus picker | Appends to wrong place | 1.5 hours |
| **NLI Analysis** | Arbitrary trace | Confusing results | 1.5 hours |
| **Stable Sets** | Global computation | Semantically incorrect | 1 hour |
| **Testers** | No scope targeting | Tests wrong scope | 1 hour |

**Total Medium Fix Time:** 5 hours

### Documentation Gaps

| Document | Issue | Est. Update Time |
|----------|-------|------------------|
| LUDICS_DIALOGUE_INTEGRATION_EXPLAINED.md | Stale assumptions | 30 mins |
| LUDICS_SYSTEM_ARCHITECTURE_MAP.md | No scoped flow | 30 mins |
| ludics-commands.ts | Comments outdated | 15 mins |
| **NEW: SCOPED_DESIGNS_USER_GUIDE.md** | Missing | 1.5 hours |
| **NEW: LUDICS_API_REFERENCE.md** | Missing | 1 hour |

**Total Documentation Time:** 3.5 hours

---

## 🚀 Recommended Action Plan

### Week 1: Critical Fixes (4 hours)

**Goal:** Make LudicsPanel work correctly with scoped designs

1. **Add Scope Selector to LudicsPanel** (30 mins)
   ```tsx
   // Add to LudicsPanel header
   <select value={activeScope} onChange={e => setActiveScope(e.target.value)}>
     {scopes.map(scope => (
       <option key={scope} value={scope}>
         {scopeLabels[scope] || scope}
       </option>
     ))}
   </select>
   ```

2. **Update Compile Button** (1 hour)
   - Use `/api/ludics/compile` endpoint (not `/api/ludics/compile-step`)
   - Pass `scopingStrategy` parameter
   - Add strategy selector dropdown
   - Call AIF sync after compilation

3. **Update Step Button** (1 hour)
   - Filter designs by `activeScope`
   - Show scope label in toast message
   - Handle "no P/O pair in scope" error gracefully

4. **Update Orthogonality Check** (1.5 hours)
   - Add scope parameter to API call
   - Display per-scope orthogonality status
   - Add badges in forest view

**Success Criteria:**
- [x] User can select scoping strategy
- [x] User can choose which scope to step
- [x] Orthogonality shows per-scope results
- [x] All operations respect active scope

### Week 2: Command Enhancements (5 hours)

**Goal:** Make all commands scope-aware

5. **Improve Append Daimon** (1.5 hours)
   - Add locus picker (dropdown of available loci)
   - Add scope selector
   - Only re-step affected scope
   - Show confirmation with scope + locus

6. **Add NLI Per-Scope** (1.5 hours)
   - Run NLI for selected scope's trace
   - Persist results to `LudicTrace.extJson`
   - Display NLI badges per scope in forest view
   - Add "Analyze All Scopes" batch operation

7. **Update Stable Sets** (1 hour)
   - Add `scope` parameter to `/api/af/stable`
   - Compute per scope
   - Display in forest view: "2 stable extensions"

8. **Update Testers Attach** (1 hour)
   - Add scope selector
   - Filter works by scope relevance
   - Only attach to selected scope
   - Show which scope was tested

**Success Criteria:**
- [x] All commands accept scope parameter
- [x] Results are clearly labeled with scope
- [x] Batch operations available for multi-scope
- [x] Forest view shows per-scope metrics

### Week 3: Documentation & Testing (4 hours)

**Goal:** Complete documentation and test coverage

9. **Update Existing Docs** (1 hour)
   - Fix outdated assumptions in integration docs
   - Update architecture diagrams
   - Update component JSDoc comments

10. **Write New User Guide** (1.5 hours)
    - SCOPED_DESIGNS_USER_GUIDE.md
    - When to use each strategy
    - How to interpret forest view
    - Troubleshooting tips

11. **Write API Reference** (1 hour)
    - LUDICS_API_REFERENCE.md
    - All endpoints with scope parameters
    - Example requests/responses
    - Error codes

12. **Write Tests** (30 mins)
    - Unit tests for scope filtering
    - Integration tests for multi-scope operations
    - Manual QA checklist

**Success Criteria:**
- [x] All docs accurate and up-to-date
- [x] User guide available for scoped designs
- [x] API reference complete
- [x] Test coverage >80%

---

## 📊 Architecture Evolution Timeline

### Foundational Implementation (Pre-Phase 4)
```
DialogueMove → compileFromMoves() → 2 Designs (P + O) → stepInteraction() → 1 Trace
```
- **Assumption:** One monolithic deliberation
- **Design Count:** Always 2
- **Scope:** Not present
- **UI:** Single tree view

### Phase 4 Scoped Designs (November 4, 2025)
```
DialogueMove 
    ↓
computeScopes(strategy) 
    ↓
Group by scope 
    ↓
compileFromMoves() → 2N Designs (N scopes × 2 polarities) 
    ↓
stepInteraction() per scope → N Traces
```
- **Assumption:** Multiple independent topics/actors
- **Design Count:** 2N (N = number of scopes)
- **Scope:** `scope: string | null`, `scopeType: string | null`
- **UI:** Forest view with per-scope trees

### Current State (November 26, 2025)
- ✅ **Backend:** Fully implemented (Phase 4 complete)
- ⚠️ **UI:** Partially updated (forest view works, panel buttons don't)
- ⚠️ **Commands:** Not updated for scopes
- ⚠️ **Docs:** Outdated

---

## 🎯 Success Metrics

### Technical Metrics
- [ ] All LudicsPanel buttons accept scope parameter
- [ ] Step operation deterministic in multi-scope mode
- [ ] Orthogonality computed per scope
- [ ] NLI, stable sets, testers scope-aware
- [ ] Test coverage >80% for scoped operations

### User Experience Metrics
- [ ] Users can select scoping strategy from UI
- [ ] Users can choose which scope to operate on
- [ ] Per-scope metrics visible in forest view
- [ ] Clear error messages when scope not found
- [ ] Documentation guides users through scoped mode

### Performance Metrics
- [ ] Compilation time <5s for 100 moves with 5 scopes
- [ ] Step operation <2s per scope
- [ ] Forest view renders 10 scopes without lag
- [ ] AIF sync completes <3s after compilation

---

## 🔄 Migration Path for Existing Deliberations

### Automatic Migration (Backward Compatible)
```sql
-- Existing deliberations compile with scope = NULL (legacy mode)
-- No data migration needed!
```

### Opt-In Migration
```typescript
// Users can re-compile existing deliberation with new strategy
await fetch('/api/ludics/compile', {
  method: 'POST',
  body: JSON.stringify({
    deliberationId: 'existing_delib_123',
    scopingStrategy: 'topic',  // ← Change from legacy
    forceRecompile: true,
  }),
});

// Result: Old designs deleted, new scoped designs created
```

### Rollback Plan
```sql
-- If scoped designs cause issues, revert to legacy:
UPDATE LudicDesign 
SET scope = NULL, scopeType = NULL, scopeMetadata = NULL
WHERE deliberationId = 'problematic_delib';

-- Or just re-compile with legacy strategy:
POST /api/ludics/compile { scopingStrategy: 'legacy' }
```

---

## 📝 Code Examples

### Before (Legacy Mode)
```tsx
// Compile: No strategy selection
const compileStep = async () => {
  await fetch("/api/ludics/compile-step", {
    method: "POST",
    body: JSON.stringify({ deliberationId }),
  });
};

// Step: Picks first P/O pair found (non-deterministic)
const step = async () => {
  const pos = designs.find(d => d.participantId === "Proponent");
  const neg = designs.find(d => d.participantId === "Opponent");
  await fetch("/api/ludics/step", {
    method: "POST",
    body: JSON.stringify({ 
      dialogueId: deliberationId,
      posDesignId: pos.id,
      negDesignId: neg.id,
    }),
  });
};
```

### After (Scoped Mode)
```tsx
// Compile: With strategy selection
const [scopingStrategy, setScopingStrategy] = useState<ScopingStrategy>('topic');

const compile = async () => {
  await fetch("/api/ludics/compile", {
    method: "POST",
    body: JSON.stringify({ 
      deliberationId,
      scopingStrategy,  // ← User-selected strategy
      forceRecompile: true,
    }),
  });
  
  // Sync to AIF
  await fetch("/api/ludics/sync-to-aif", {
    method: "POST",
    body: JSON.stringify({ deliberationId }),
  });
};

// Step: With scope selection
const [activeScope, setActiveScope] = useState<string | null>(null);

const step = async () => {
  const scopeDesigns = designs.filter(d => d.scope === activeScope);
  const pos = scopeDesigns.find(d => d.participantId === "Proponent");
  const neg = scopeDesigns.find(d => d.participantId === "Opponent");
  
  if (!pos || !neg) {
    toast.show(`No P/O pair in scope: ${activeScope}`, "err");
    return;
  }
  
  await fetch("/api/ludics/step", {
    method: "POST",
    body: JSON.stringify({ 
      dialogueId: deliberationId,
      posDesignId: pos.id,
      negDesignId: neg.id,
    }),
  });
  
  toast.show(`Stepped scope: ${scopeLabels[activeScope]}`, "ok");
};
```

---

## 🔗 Related Documents

- **Full Audit:** `LUDICS_COMPILE_STEP_AUDIT.md` (comprehensive 50+ page analysis)
- **Scoped Designs Architecture:** `LUDICS_SCOPED_DESIGNS_ARCHITECTURE.md`
- **Implementation Status:** `SCOPED_DESIGNS_IMPLEMENTATION_STATUS.md`
- **Phase 4 Complete:** `PHASE_4_IMPLEMENTATION_COMPLETE.md`
- **Theory Foundations:** `LUDICS_THEORY_FOUNDATIONS.md`
- **Forest View:** `LUDICS_FOREST_ARCHITECTURE.md`

---

## ❓ Questions for Discussion

1. **Scoping Strategy Default:** Should new deliberations default to `topic` or `legacy`?
2. **UI Placement:** Should scope selector be in LudicsPanel header or per-deliberation settings?
3. **Performance:** What's acceptable compile time for large deliberations (e.g., 500 moves, 20 scopes)?
4. **Migration:** Should we auto-migrate existing deliberations to topic-based, or require manual opt-in?
5. **Forest View:** Should it be the default view mode, or keep merged (legacy) as default?

---

**Status:** Audit Complete ✅  
**Next Action:** Review findings with team and prioritize fixes  
**Estimated Total Fix Time:** 12-13 hours (1.5-2 weeks)
