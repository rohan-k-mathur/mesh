# Pre-Implementation Analysis: Executive Summary

**Date:** November 6, 2025  
**Purpose:** Quick reference guide to SYSTEM_INTEGRATION_ANALYSIS.md  
**Status:** Ready for team review

---

## **TL;DR - Critical Findings**

### **The Gap Between Theory and Implementation**

**What the research says we should have:**
- Full ASPIC+ argumentation engine with attack computation, defeat resolution, and grounded semantics
- Bidirectional AIF ↔ ASPIC+ translation with semantic preservation
- CQs formally mapped to ASPIC+ attack types (undermining/undercutting/rebutting)
- DialogueMoves creating ASPIC+ arguments and triggering ludics compilation with rich metadata

**What we actually have:**
- ✅ AIF → ASPIC+ data structure extraction (10% complete)
- ✅ DialogueMove storage and legal move generation (70% complete)
- ✅ Ludics compilation from moves (60% complete - lossy metadata)
- ⚠️ CQ system with metadata but NO formal connections (40% complete)
- ❌ No ASPIC+ semantic computation engine (0% complete)
- ❌ No CQ → ASPIC+ attack formalization (0% complete)

---

## **Key Document Sections**

### **Part 1: Theoretical Foundations (Pages 1-8)**
📖 Comprehensive summary of three research papers:
1. ASPIC+ framework structure (argumentation systems, theories, attacks, defeats)
2. AIF ↔ ASPIC+ bidirectional translation specification
3. Incomplete information handling (stability, relevance, complexity results)

**Key Takeaway:** The research provides a **complete formal specification** for what we're trying to build. We're not inventing new theory—we're implementing established formal methods.

### **Part 2: Current Implementation (Pages 8-13)**
🔍 File-by-file analysis of what exists:
- `aifToAspic.ts`: Data structure extraction only (107 lines)
- `compileFromMoves.ts`: Ludics compilation (lossy CQ metadata)
- DialogueMove system: Strong infrastructure, weak semantics
- CQ components: Rich UI, zero formal integration

**Key Takeaway:** We have **foundations without the building**. Infrastructure exists but core computation engines are missing.

### **Part 3: Integration Gap Analysis (Pages 13-15)**
🔴 5×5 matrix showing system interconnections:
- **Strong (✅):** Only 3 connections exist
- **Weak (⚠️):** 5 partial integrations
- **Missing (❌):** 17 critical gaps

**Key Takeaway:** Systems operate in **parallel**, not as **integrated pipeline**.

### **Part 4: Architectural Recommendations (Pages 15-20)**
🏗️ Three immediate priorities BEFORE starting roadmap:

**Priority 0.1: ASPIC+ Core Engine (1-2 weeks)**
Build the missing computation layer:
- Argument construction from rules
- Attack computation (3 types)
- Defeat resolution with preferences
- Grounded extension calculation
- Rationality postulate checking

**Priority 0.2: CQ → ASPIC+ Mapping (3-4 days)**
Formalize attack types:
- UNDERMINES → identify target premise
- UNDERCUTS → identify target rule + name function
- REBUTS → identify defeasible conclusion

**Priority 0.3: ArgumentScheme Enhancement (1-2 days)**
Add ASPIC+ metadata to CQ definitions:
```typescript
{
  cqKey: string;
  aspicMapping: {
    ruleId?: string;        // For undercutting
    premiseIndex?: number;  // For undermining
  }
}
```

### **Part 5: Deprecation/Promotion Plan (Pages 20-23)**
📊 Component-by-component decisions:

**PROMOTE (strengthen):**
- DialogueMove → Core orchestrator
- SchemeSpecificCQsModal → Primary CQ interface
- AIF Graph → Source of truth

**DEPRECATE (phase out):**
- AttackMenuProV2 (heuristic CQ detection)
- CriticalQuestionsV3 (merge into scheme modal)
- Keyword-based attack classification

**REFACTOR (major changes):**
- compileFromMoves.ts (preserve rich metadata)
- aifToAspic.ts (add reverse translation + semantics)

### **Part 6: Pre-Implementation Checklist (Pages 23-24)**
✅ Must complete before Phase 1:
- [ ] Architecture Decision Records (4 ADRs)
- [ ] API specifications for new endpoints
- [ ] Entity relationship diagrams
- [ ] Unit test stubs for ASPIC+ core
- [ ] Performance benchmarks baseline

### **Part 7: Success Metrics (Pages 24-25)**
📈 Measurable goals:

**Technical:**
- ASPIC+ implementation: 10% → 90%
- Test coverage: >85%
- Argument construction: <100ms (p99)
- Zero rationality postulate violations

**Functional:**
- Asking CQ auto-creates WHY DialogueMove
- CA-nodes have correct attack type metadata
- LudicActs preserve CQ semantic context
- Round-trip AIF↔ASPIC+ preserves semantics

### **Part 8: Next Steps (Pages 25-26)**
📅 Immediate actions (this week):
1. Team review meeting (2 hours)
2. Create ASPIC+ core module stubs (4 hours)
3. Enhance ArgumentScheme CQ metadata (2 hours)
4. Database schema planning (3 hours)

---

## **Critical Questions for Team Discussion**

### **Question 1: Implementation Priority**
Should we:
- **Option A:** Build ASPIC+ core engine first (1-2 weeks), THEN start roadmap Phase 1
- **Option B:** Start roadmap Phase 1 (database schema), build ASPIC+ engine in parallel
- **Option C:** Minimal ASPIC+ stub, iterate as we implement roadmap phases

**Recommendation:** Option A. ASPIC+ engine is foundational—without it, we're just shuffling data structures without semantic computation.

### **Question 2: Scope Boundaries**
How complete should ASPIC+ implementation be?
- **Minimal:** Argument construction + attack types only
- **Standard:** Add defeat resolution + grounded extension
- **Complete:** Add all rationality postulates + preference orderings

**Recommendation:** Standard. We need grounded semantics for DialogueMove integration, but can defer advanced features (weakest-link preferences, multi-level extensions).

### **Question 3: Testing Strategy**
When to write tests?
- **Test-First:** Write ASPIC+ tests before implementation (TDD)
- **Test-Alongside:** Write tests as we implement features
- **Test-After:** Implement first, test during integration phase

**Recommendation:** Test-Alongside for core ASPIC+ (too complex for pure TDD), Test-First for integration points (CQ→ASPIC+ mapping).

### **Question 4: Performance Targets**
How much optimization needed initially?
- **Research-Grade:** Correct but potentially slow (1-2 seconds for complex arguments)
- **Production-Ready:** Optimized for real-world use (<100ms for typical cases)
- **Enterprise-Scale:** Handle 1000+ arguments (<1s for complex deliberations)

**Recommendation:** Research-Grade initially. Use profiling after Phase 3 of roadmap to identify bottlenecks, then optimize hot paths.

---

## **Risk Assessment**

### **High-Risk Items** 🔴

1. **ASPIC+ Complexity:** Full implementation is 2-3 weeks of work
   - *Mitigation:* Implement incrementally, test each component
   
2. **Data Migration:** Adding foreign keys to production database
   - *Mitigation:* Use nullable FKs, staging environment first

3. **Breaking Changes:** Refactoring CQ components affects user workflows
   - *Mitigation:* Feature flags, gradual rollout

### **Medium-Risk Items** 🟡

4. **Performance Degradation:** Adding ASPIC+ computation to CQ actions
   - *Mitigation:* Background jobs, caching, profiling

5. **Test Coverage:** Need comprehensive tests for formal systems
   - *Mitigation:* Allocate 30% of time to testing

### **Low-Risk Items** 🟢

6. **UI Changes:** Deprecation warnings, component refactoring
   - *Mitigation:* Standard React patterns, user communication

---

## **Resource Estimates**

### **Phase 0 (Pre-Implementation): 2-3 weeks**
- ASPIC+ core engine: 60 hours
- CQ → ASPIC+ mapping: 20 hours
- Documentation: 15 hours
- Testing setup: 15 hours
- **Total:** ~110 hours (3 weeks @ 40 hrs/week for 1 dev)

### **Roadmap Phases 1-8: 4-6 weeks**
- As specified in CQ_DIALOGICAL_LUDICS_INTEGRATION_ROADMAP.md
- Assumes Phase 0 complete

### **Total Project: 6-9 weeks**
- 3 weeks Phase 0 (this document)
- 4-6 weeks Phases 1-8 (roadmap)
- Assumes 1 full-time developer
- Can parallelize some work with 2+ developers

---

## **Decision Points**

### **GO/NO-GO Decision 1: Week 1**
After ASPIC+ core stubs created:
- ✅ GO if: Core types compile, basic tests pass, team agrees on architecture
- 🛑 NO-GO if: Design flaws discovered, complexity too high, team wants alternative approach

### **GO/NO-GO Decision 2: Week 2**
After ASPIC+ argument construction implemented:
- ✅ GO if: Can construct arguments from ArgumentScheme, performance acceptable
- 🛑 NO-GO if: Performance issues, correctness bugs, need to redesign

### **GO/NO-GO Decision 3: Week 3**
After CQ → ASPIC+ mapping complete:
- ✅ GO if: CQs correctly map to attacks, integration tests pass
- 🛑 NO-GO if: Formal semantics mismatched, need research consultation

---

## **Recommended Reading Order**

### **For Architects/Tech Leads:**
1. Part 3 (Integration Gap Analysis) - understand current state
2. Part 4 (Architectural Recommendations) - see proposed solution
3. Part 1 (Theoretical Foundations) - verify formal correctness
4. Part 5 (Deprecation/Promotion) - agree on component decisions

### **For Developers:**
1. Part 2 (Current Implementation) - understand existing code
2. Part 4.1 (Priority 0.1-0.3) - see immediate work
3. Part 6 (Pre-Implementation Checklist) - know what to build
4. Part 7 (Success Metrics) - understand acceptance criteria

### **For Project Managers:**
1. This summary (you're reading it!)
2. Part 8 (Next Steps) - timeline and actions
3. Risk Assessment (above) - understand risks
4. Resource Estimates (above) - budget planning

---

## **Quick Links**

- **Full Analysis:** `SYSTEM_INTEGRATION_ANALYSIS.md`
- **Implementation Roadmap:** `CQ_DIALOGICAL_LUDICS_INTEGRATION_ROADMAP.md`
- **Research Papers:** `docs/arg-computation-research/*.txt`
- **Current Code:**
  - ASPIC+: `lib/aif/translation/aifToAspic.ts`
  - Ludics: `packages/ludics-engine/compileFromMoves.ts`
  - CQ System: `components/claims/CriticalQuestionsV3.tsx`

---

## **Action Items for Next Meeting**

1. **Review this summary** (30 min)
2. **Answer 4 critical questions** (30 min)
3. **Assign ownership** for Phase 0 tasks (15 min)
4. **Set GO/NO-GO decision dates** (15 min)
5. **Create project tracking board** (30 min)

**Total Meeting Time:** 2 hours

---

**Questions?** Start with the full analysis document, then schedule architecture review meeting.

**Ready to proceed?** Begin with Priority 0.1 (ASPIC+ Core Engine) after team approval.
