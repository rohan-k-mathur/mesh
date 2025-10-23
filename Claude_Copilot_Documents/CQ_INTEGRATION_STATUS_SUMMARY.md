# CQ & Dialogical Moves: Integration Status Summary

Quick visual reference for which components have CQ and dialogical move support.

---

## Integration Status Grid

```
┌────────────────────────────────────────────────────────────────────────┐
│                    COMPONENT INTEGRATION STATUS                        │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ✅ FULLY INTEGRATED (Complete)                                        │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                        │
│  📋 ClaimMiniMap                                                       │
│     • CriticalQuestionsV2 ✅                                           │
│     • LegalMoveChips ✅                                                │
│     • CQ badges (CQ 75%) ✅                                            │
│     • Open WHY count (?2) ✅                                           │
│     • GROUNDS count (G:1) ✅                                           │
│     • "CQs" button → dialog ✅                                         │
│     • "Moves" button → LegalMoveChips ✅                               │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ⚠️ PARTIALLY INTEGRATED (Incomplete)                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                        │
│  📄 AIFArgumentsListPro                                                │
│     • LegalMoveToolbar ✅                                              │
│     • CQ data in metadata ✅                                           │
│     • CriticalQuestions component ❌                                   │
│     • CQ badges on cards ❌                                            │
│     • "CQs" button ❌                                                  │
│                                                                        │
│  🎴 CommandCard                                                        │
│     • WHY/GROUNDS moves ✅                                             │
│     • legalMovesToCommandCard adapter ✅                               │
│     • Used in DeepDivePanelV2 ✅                                       │
│     • CQ context panel ❌                                              │
│     • CQ text shown ❌                                                 │
│     • Users don't know what "E1" means ❌                              │
│                                                                        │
│  🎨 SchemeComposer                                                     │
│     • LegalMoveToolbarAIF ✅                                           │
│     • CriticalQuestions display ❌                                     │
│     • CQ preview during composition ❌                                 │
│                                                                        │
│  🎯 DeepDivePanelV2                                                    │
│     • CommandCard with legal moves ✅                                  │
│     • ClaimMiniMap (has CQs) ✅                                        │
│     • CegMiniMap (no CQs) ❌                                           │
│     • AIFArgumentsListPro (partial) ⚠️                                 │
│     • Inconsistent integration across sub-components ❌                │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ❌ NOT INTEGRATED (None)                                              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                        │
│  🗺️ CegMiniMap (CRITICAL)                                             │
│     • Graph visualization only                                        │
│     • No CQ badges on nodes ❌                                         │
│     • No open WHY indicators ❌                                        │
│     • No CriticalQuestions dialog ❌                                   │
│     • No legal move UI ❌                                              │
│                                                                        │
│  ⚔️ AttackMenuPro                                                      │
│     • Attack types only (REBUT/UNDERCUT/UNDERMINE)                    │
│     • No CriticalQuestions integration ❌                              │
│     • No WHY/GROUNDS workflow ❌                                       │
│     • No CQ-guided attack suggestions ❌                               │
│                                                                        │
│  🌐 GraphExplorer                                                      │
│     • No CQ integration ❌                                             │
│     • No dialogical move UI ❌                                         │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  🟠 LEGACY (To be phased out)                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                        │
│  📜 DialogicalPanel                                                    │
│     • Uses OLD CriticalQuestions (not V2) 🟠                           │
│     • Full dialogical move support ✅                                  │
│     • Needs update to V2 ⚠️                                            │
│                                                                        │
│  📋 ArgumentsList                                                      │
│     • Uses OLD CriticalQuestions (not V2) 🟠                           │
│     • Has AttackMenuPro ✅                                             │
│     • Replace with AIFArgumentsListPro 🔄                              │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Priority Matrix

```
                HIGH IMPACT ↑
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        │   1. CegMiniMap  │  2. CommandCard  │  CRITICAL
        │   (graph nodes)  │  (CQ context)    │  DO FIRST
        │                  │                  │
        ├──────────────────┼──────────────────┤
        │                  │                  │
  LOW   │ 4. SchemeComposer│ 3. AttackMenuPro │  HIGH
  EFFORT│ (CQ preview)     │ (CQ button)      │  PRIORITY
  ←─────┼──────────────────┼──────────────────┼─────→ HIGH
        │                  │                  │  EFFORT
        │ 6. Legacy Update │ 5. AIFArgsList   │
        │ (DialogicalPanel)│ (CQ badges)      │  MEDIUM
        │                  │                  │  PRIORITY
        └──────────────────┼──────────────────┘
                           │
                LOW IMPACT ↓
```

**Legend:**
- **Quadrant 1 (Top-Left):** High impact, low effort → Do immediately
- **Quadrant 2 (Top-Right):** High impact, high effort → Schedule soon
- **Quadrant 3 (Bottom-Right):** Low impact, high effort → Defer
- **Quadrant 4 (Bottom-Left):** Low impact, low effort → Quick wins

---

## Integration Roadmap (Visual Timeline)

```
Week 1 (Critical)          Week 2 (High Priority)      Week 3 (Cleanup)
┌──────────────────┐      ┌──────────────────┐        ┌──────────────────┐
│                  │      │                  │        │                  │
│ Task 1.1         │      │ Task 2.1         │        │ Task 3.1         │
│ CegMiniMap       │      │ AIFArgsList      │        │ Legacy Update    │
│ • CQ badges      │──────▶ • CQ buttons     │────────▶ • DialogicalPanel│
│ • WHY count      │      │ • CQ dialog      │        │ • ArgumentsList  │
│ • Click→CQ       │      │                  │        │                  │
│                  │      │ Task 2.2         │        │                  │
│ Task 1.2         │      │ SchemeComposer   │        │                  │
│ CommandCard      │      │ • CQ preview     │        │                  │
│ • CQContextPanel │      │ • Inline CQs     │        │                  │
│ • Show CQ text   │      │                  │        │                  │
│                  │      │ Task 2.3         │        │                  │
│ Task 1.3         │      │ DeepDivePanel    │        │                  │
│ AttackMenuPro    │      │ • Unified CQs    │        │                  │
│ • CQ button      │      │ • CQ summary     │        │                  │
│                  │      │                  │        │                  │
└──────────────────┘      └──────────────────┘        └──────────────────┘
```

---

## Component Hierarchy & Integration

```
DeepDivePanelV2 (Main Container)
├─ Left Sheet: Graph Explorer
│  ├─ CegMiniMap ❌ NO CQs
│  │  └─ [TODO] Add CQ badges, open WHY count, click→dialog
│  │
│  ├─ Claim Info Panel
│  │
│  └─ CommandCard ⚠️ PARTIAL (has moves, no CQ context)
│     └─ [TODO] Add CQContextPanel above CommandCard
│
├─ Right Sheet: Actions
│  └─ (empty or other actions)
│
└─ Main Content Area
   ├─ ClaimMiniMap ✅ FULLY INTEGRATED
   │  ├─ CriticalQuestionsV2 ✅
   │  ├─ LegalMoveChips ✅
   │  └─ Dialogical badges ✅
   │
   └─ AIFArgumentsListPro ⚠️ PARTIAL (has toolbar, no CQ UI)
      ├─ LegalMoveToolbar ✅
      ├─ AttackMenuPro ❌ NO CQs
      │  └─ [TODO] Add "View CQs" button
      │
      └─ ArgumentCard
         └─ [TODO] Add CQ badge + "CQs" button
```

---

## Data Flow (Current vs Desired)

### Current State (Partial)

```
ClaimMiniMap
    │
    ├─ GET /api/cqs ───────────────────────┐
    ├─ GET /api/deliberations/{id}/moves ──┤
    ├─ GET /api/claims/edges ──────────────┤
    │                                      │
    └─ Enrichment logic ───────────────────┘
         │
         ├─ CQ badges: "CQ 75%"
         ├─ Open WHY count: "?2"
         ├─ GROUNDS count: "G:1"
         │
         └─ CriticalQuestions component
              ├─ LegalMoveChips
              └─ WHY/GROUNDS workflow ✅

vs.

CegMiniMap
    │
    └─ (no CQ data fetched) ❌
         │
         └─ Nodes show label only
              └─ No CQ context ❌
```

### Desired State (Full Integration)

```
All Components (ClaimMiniMap, CegMiniMap, AIFArgsList, etc.)
    │
    ├─ GET /api/cqs ───────────────────────┐
    ├─ GET /api/deliberations/{id}/moves ──┤
    ├─ GET /api/dialogue/legal-moves ──────┤
    │                                      │
    └─ Unified enrichment ─────────────────┘
         │
         ├─ CQ badges everywhere ✅
         ├─ Open WHY counts everywhere ✅
         ├─ GROUNDS counts everywhere ✅
         │
         └─ CriticalQuestions dialog available ✅
              ├─ LegalMoveChips ✅
              └─ Full dialogical workflow ✅
```

---

## Key Metrics (Before → After)

| Metric | Before | After (Target) |
|--------|--------|----------------|
| Components with CQ support | 1 (ClaimMiniMap) | 6+ (all active) |
| Components with dialogical moves | 3 (partial) | 6+ (full) |
| User can access CQs from... | 1 view | 5+ views |
| Consistency across UI | 🔴 Low | 🟢 High |
| Legacy components | 2 (old CQ version) | 0 (updated or removed) |

---

## Quick Decision Guide

**Q: Should I integrate CQs into this component?**

```
Is the component active/current (not legacy)? ──No──▶ Update later
           │
          Yes
           │
           ▼
Does it display claims or arguments? ──No──▶ Probably not needed
           │
          Yes
           │
           ▼
Do users interact with these items? ──No──▶ Maybe badges only
           │
          Yes
           │
           ▼
      ✅ YES, INTEGRATE CQs + Dialogical Moves
         │
         └─ Follow ClaimMiniMap pattern:
            1. Import CriticalQuestionsV2
            2. Import LegalMoveChips
            3. Add CQ badges
            4. Add "CQs" button → dialog
            5. Add "Moves" button → chips
            6. Fetch CQ data via SWR
            7. Use useBusEffect for updates
```

---

## Files to Reference

**Gold Standard Implementation:**
- `components/claims/ClaimMiniMap.tsx` ← Copy this pattern

**Shared Components:**
- `components/claims/CriticalQuestionsV2.tsx`
- `components/dialogue/LegalMoveChips.tsx`
- `components/dialogue/LegalMoveToolbarAIF.tsx`
- `components/dialogue/command-card/CommandCard.tsx`
- `components/dialogue/command-card/adapters.ts`

**Integration Targets (need updates):**
- `components/deepdive/CegMiniMap.tsx` ← CRITICAL
- `components/dialogue/command-card/CommandCard.tsx` ← CRITICAL
- `components/arguments/AttackMenuPro.tsx` ← HIGH
- `components/arguments/AIFArgumentsListPro.tsx` ← HIGH
- `components/arguments/SchemeComposer.tsx` ← MEDIUM

---

## Summary

**Answer to your question:**

> "are the cqs and dialogical moves ie with grounds/why asking etc integrated with the currently in use components like claimminimap, cegminimap/commandcard/graphexplorer and aifarguentslistpro/attackmenupro etc or are they only in argumentslist/dialogicalpanel related components"

**Answer:** ⚠️ **PARTIALLY INTEGRATED**

- ✅ **ClaimMiniMap** - Fully integrated (gold standard)
- ❌ **CegMiniMap** - NO integration at all
- ⚠️ **CommandCard** - Has dialogical moves but NO CQ context
- ⚠️ **AIFArgumentsListPro** - Has move toolbar but NO CQ UI
- ❌ **AttackMenuPro** - NO integration at all
- 🟠 **ArgumentsList/DialogicalPanel** - Have integration but use OLD version

**Recommendation:** Follow the 3-week integration plan in `CQ_DIALOGICAL_INTEGRATION_ANALYSIS.md` to achieve consistent CQ + dialogical move support across all active components.

**Start here:** Task 1.1 - Add CQ badges to CegMiniMap graph nodes (highest impact, most visible).
