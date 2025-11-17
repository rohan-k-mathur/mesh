# ASPIC+ Full Implementation TODO

**Current Status**: Basic ASPIC theory panel integrated (Week 2 Task 2.5 ✅)  
**Location**: Arguments → ASPIC nested tab  
**Completion**: ~40% (theory viewer, extension panel, basic visualization)

---

## 🎯 Remaining Work

### Phase 1: Strict Rules & Axioms System ⚠️ HIGH PRIORITY

**Goal**: Implement formal ASPIC+ strict rules (axioms) as defined in ASPIC+ framework

**Tasks**:
- [ ] Define strict rule schema in Prisma
  ```prisma
  model StrictRule {
    id          String   @id @default(cuid())
    name        String   // e.g., "Modus Ponens", "Transitivity"
    formula     String   // Logical formula (P → Q, P ⊢ Q)
    type        RuleType // AXIOM | THEOREM | LEMMA
    domain      String   // Which domain this rule applies to
    isDefeasible Boolean @default(false)
    deliberationId String?
    // ... relations
  }
  ```

- [ ] Create StrictRuleLibrary (pre-defined axioms)
  - Common logical axioms (modus ponens, modus tollens, etc.)
  - Domain-specific axioms (legal, scientific, ethical)
  - User-defined custom strict rules

- [ ] Build StrictRuleEditor component
  - Add/edit/delete strict rules
  - Validate rule syntax
  - Test rule application

- [ ] Integrate strict rules into ASPIC+ theory construction
  - Update AspicTheoryViewer to show strict rules
  - Separate strict vs defeasible rules visually
  - Show which strict rules are used in argumentation

- [ ] API endpoints:
  - `GET /api/aspic/rules/strict` - Fetch all strict rules
  - `POST /api/aspic/rules/strict` - Create new strict rule
  - `GET /api/aspic/evaluate?includeStrictRules=true` - Include in theory

**Documentation**:
- ASPIC+ strict rules formal definition
- Examples of strict vs defeasible rules
- How strict rules affect grounded semantics

---

### Phase 2: Enhanced Attack Graph Visualization (SHELVED --IGNORE PHASE FOR NOW)

**Tasks**:
- [ ] Complete AttackGraphVisualization component (currently disabled)
- [ ] Show attack types (rebut, undercut, undermine) with different colors
- [ ] Interactive graph with zoom, pan, and node selection
- [ ] Highlight attack paths on hover
- [ ] Show preference ordering visually

**Components**:
- `components/aspic/AttackGraphVisualization.tsx` (stub exists)
- Integration with AspicTheoryPanel (currently disabled in tabs)

---

### Phase 3: Rationality Postulates Checker

**Tasks**:
- [ ] Complete RationalityChecklist component (currently disabled)
- [ ] Check Dung's fundamental properties:
  - Conflict-free
  - Admissible
  - Complete
  - Preferred
  - Stable
  - Grounded
- [ ] Check ASPIC+ specific rationality postulates:
  - Closure under strict rules
  - Consistency
  - Satisfaction
- [ ] Display which postulates are satisfied/violated
- [ ] Explain why violations occur (with examples)

**Components**:
- `components/aspic/RationalityChecklist.tsx` (stub exists)
- Integration with AspicTheoryPanel (currently disabled in tabs)

---

### Phase 4: Preference & Ordering System

**Tasks**:
- [ ] Implement preference relations between arguments
- [ ] Support different ordering types:
  - Elitist ordering (last defeasible rule)
  - Weakest link ordering
  - Custom user-defined ordering
- [ ] Visualize preference ordering in UI
- [ ] Update attack success based on preferences
- [ ] Show how preferences affect extension

**API**:
- `POST /api/aspic/preferences` - Define preference relations
- `GET /api/aspic/evaluate?ordering=elitist` - Compute with ordering

---

### Phase 5: ASPIC+ Theory Export & Import

**Tasks**:
- [ ] Export ASPIC+ theory to standard format (JSON, AIF, TGF)
- [ ] Import external ASPIC+ theories
- [ ] Interoperability with other argumentation tools
- [ ] Version control for theories

**Formats**:
- AIF (Argument Interchange Format)
- TGF (Trivial Graph Format)
- ASPIC+ native JSON

---

### Phase 6: Advanced Features

**Nice-to-have enhancements**:
- [ ] Argument strength calculation (based on preferences + ordering)
- [ ] Counter-argument generation (suggest attacks)
- [ ] Argumentation games (proponent vs opponent dialogues)
- [ ] Burden of proof tracking in ASPIC+ framework
- [ ] Integration with dialogue moves (link DialogueMove → ASPIC argument)

---

## 📚 Reference Materials

**ASPIC+ Papers**:
- Prakken & Sartor (1997) - Original ASPIC
- Modgil & Prakken (2014) - ASPIC+ framework
- Caminada & Amgoud (2007) - Rationality postulates

**Code References**:
- Current implementation: `components/aspic/AspicTheoryPanel.tsx`
- Theory viewer: `components/aspic/AspicTheoryViewer.tsx`
- Extension panel: `components/aspic/GroundedExtensionPanel.tsx`
- API: `app/api/aspic/evaluate/route.ts`

---

## 🗓️ Suggested Timeline

**Week 3-4**: Strict Rules & Axioms (Phase 1) - ~3-4 days  
**Week 5**: Attack Graph Visualization (Phase 2) - ~2-3 days  
**Week 6**: Rationality Checker (Phase 3) - ~2-3 days  
**Week 7**: Preferences & Ordering (Phase 4) - ~3-4 days  
**Week 8**: Export/Import (Phase 5) - ~2 days  
**Week 9+**: Advanced Features (Phase 6) - ongoing

**Total Estimated Effort**: ~15-20 days of focused work

---

## ✅ Completed Work

- [x] Basic ASPIC theory structure
- [x] Theory viewer with arguments/rules display
- [x] Grounded extension computation
- [x] Integration into DeepDivePanelV2 (now in nested tab)
- [x] API endpoint `/api/aspic/evaluate`
- [x] Week 2 migration to nested tabs complete

---

## 🚀 Next Steps (Immediate)

1. **Review ASPIC+ specification** - Ensure alignment with formal framework
2. **Design strict rule schema** - Database model and TypeScript types
3. **Create StrictRuleLibrary** - Start with 5-10 common axioms
4. **Build basic StrictRuleEditor** - CRUD operations for rules
5. **Test integration** - Ensure strict rules appear in theory viewer

**Priority**: Phase 1 (Strict Rules) should be completed before Phase 2-6

---

**Last Updated**: November 11, 2025 (Week 2 Task 2.5 completion)  
**Owner**: Mesh Development Team  
**Status**: Planning phase → Ready to implement Phase 1
