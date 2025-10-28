# CHUNK 4B: Argument Pop-out & Dual-Mode Rendering

**Review Date:** October 27, 2025  
**Reviewer:** Architecture Deep-Dive Continuation  
**Phase:** 4 of 6 - Two-Level Representation (Second Part)

---

## 📋 Context: Phase 4 Completion

**Previous chunk:** Chunk 4A covered core UI components (DebateSheetReader, ArgumentCard, DialogueActionsModal, DeepDivePanel)

**This chunk focuses on:**
- ArgumentPopoutDualMode component (sunburst→detail pattern)
- DiagramViewer integration
- Expand/collapse mechanics for argument internals
- Two-level representation (debate-level ↔ argument-level)

---

## 📦 Files to Review

### Primary Components:
1. `components/arguments/ArgumentPopoutDualMode.tsx` - Dual-mode rendering
2. `components/dialogue/deep-dive/DiagramViewer.tsx` - AIF graph visualization
3. `components/arguments/ArgumentExpandable.tsx` - Collapsible argument display

### Supporting Components:
4. `components/dialogue/minimap/AFMinimap.tsx` - Abstract Framework minimap
5. `components/claims/ClaimMiniMap.tsx` - Claim structure minimap
6. `components/deepdive/CegMiniMap.tsx` - Claim Evidence Graph minimap

### Layout & Navigation:
7. `components/ui/FloatingSheet.tsx` - Slide-out panels
8. `components/deepdive/TopologyWidget.tsx` - Graph topology controls

---

## 🔍 Component Analysis

Let me read the key components:
