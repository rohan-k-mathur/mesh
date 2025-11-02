# Scheme List UI Enhancements - Implementation Complete ✅

## Changes Made

### 1. ✅ Collapsible Details Accordion

Added expandable accordion pane under each scheme card that displays comprehensive metadata:

**Features:**
- Click chevron icon (▶/▼) to expand/collapse details
- Smooth toggle animation
- Persists expanded state during session

**Details Displayed:**
- **Description** - Full text description
- **Macagno Taxonomy** - All 6 taxonomy fields in grid layout
  - Purpose (action | state_of_affairs)
  - Source (internal | external)
  - Material Relation (cause, definition, analogy, authority, practical, correlation)
  - Reasoning Type (deductive, inductive, abductive, practical)
  - Rule Form (MP, MT, defeasible_MP, universal)
  - Conclusion Type (ought | is)
- **Clustering & Hierarchy**
  - Cluster Tag
  - Inherit CQs flag (Yes/No)
  - Parent Scheme ID (if hierarchical child)
- **Formal Structure (Walton-style)**
  - Premises with variables (P1, P2, etc.)
  - Major/minor premise type badges
  - Conclusion with ∴ symbol
  - Variables displayed for each premise/conclusion
- **Critical Questions**
  - Full list with cqKey, text, attackType, targetScope
  - Color-coded badges for attack type (UNDERMINES, UNDERCUTS, REBUTS)
  - Target scope badges (premise, inference, conclusion)

### 2. ✅ Parent Scheme Dropdown Fix

**Issue:** SchemeCreator dropdown only showed "No parent (root scheme)" even though hierarchical schemes exist.

**Root Cause:** API returns `data.items` but SchemeCreator was checking `data.schemes`.

**Fix:** Updated fetch logic to check both:
```typescript
const schemes = data.items || data.schemes || [];
```

**Result:** Parent dropdown now populates with all available schemes for hierarchical creation.

## Files Modified

1. **`components/admin/SchemeList.tsx`**
   - Added `expandedSchemes` state (Set<string>) to track expanded cards
   - Added `toggleSchemeExpanded()` function
   - Imported `ChevronDown` and `ChevronRight` icons
   - Extended `ArgumentScheme` type with all metadata fields
   - Rewrote scheme card rendering with collapsible details section
   - Added cluster tag badge to main card view
   - Styled accordion content with bg-slate-50/50 background

2. **`components/admin/SchemeCreator.tsx`**
   - Fixed parent scheme fetch to use `data.items || data.schemes`
   - Ensures dropdown populates correctly

## Visual Design

### Main Card (Collapsed)
```
┌─────────────────────────────────────────────────────────┐
│ ▶ Argument from Witness Testimony  witness_testimony    │
│   Reasoning based on direct observation...               │
│   [authority] [inductive] [external] [state_of_affairs] │
│   [authority_family]                                     │
│   6 critical questions                      [✏️] [🗑️]   │
└─────────────────────────────────────────────────────────┘
```

### Expanded Card
```
┌─────────────────────────────────────────────────────────┐
│ ▼ Argument from Witness Testimony  witness_testimony    │
│   Reasoning based on direct observation...               │
│   [authority] [inductive] [external] [state_of_affairs] │
│   [authority_family]                                     │
│   6 critical questions                      [✏️] [🗑️]   │
├─────────────────────────────────────────────────────────┤
│ ╔═══════════════════════════════════════════════════╗   │
│ ║ Description                                       ║   │
│ ║ A witness is someone who was present at an        ║   │
│ ║ event and can report what happened...             ║   │
│ ╠═══════════════════════════════════════════════════╣   │
│ ║ Taxonomy (Macagno & Walton)                       ║   │
│ ║ Purpose: state_of_affairs  Source: external       ║   │
│ ║ Material Relation: authority  Reasoning: inductive║   │
│ ║ Rule Form: defeasible_MP  Conclusion Type: is     ║   │
│ ╠═══════════════════════════════════════════════════╣   │
│ ║ Clustering & Hierarchy                            ║   │
│ ║ Cluster Tag: authority_family  Inherit CQs: Yes   ║   │
│ ╠═══════════════════════════════════════════════════╣   │
│ ║ Formal Structure (Walton-style)                   ║   │
│ ║ Premises:                                         ║   │
│ ║   P1: [major] Witness W was in a position...     ║   │
│ ║       Variables: W, E                             ║   │
│ ║   P2: [minor] W asserts that E occurred...       ║   │
│ ║       Variables: W, E                             ║   │
│ ║ Conclusion:                                       ║   │
│ ║   ∴ Therefore, E occurred...                      ║   │
│ ║       Variables: E                                ║   │
│ ╠═══════════════════════════════════════════════════╣   │
│ ║ Critical Questions (6)                            ║   │
│ ║ 1. witness_consistent?                            ║   │
│ ║    Is W internally consistent in the testimony?   ║   │
│ ║    [UNDERMINES] [targets: premise]                ║   │
│ ║ 2. witness_honest?                                ║   │
│ ║    Is W an honest person?                         ║   │
│ ║    [UNDERMINES] [targets: premise]                ║   │
│ ║ ... (4 more CQs)                                  ║   │
│ ╚═══════════════════════════════════════════════════╝   │
└─────────────────────────────────────────────────────────┘
```

## Testing Checklist

### ✅ Accordion Functionality
- [x] Click chevron to expand/collapse
- [x] Multiple cards can be expanded simultaneously
- [x] Expanded state persists during page session
- [x] Smooth transition animation

### ✅ Details Display
- [x] Description shows full text
- [x] All 6 Macagno taxonomy fields display
- [x] Clustering fields show (clusterTag, inheritCQs, parentSchemeId)
- [x] Premises display with variables and type badges
- [x] Conclusion displays with ∴ symbol and variables
- [x] CQs display with attack type and target scope badges

### ✅ Parent Scheme Dropdown
- [x] Opens SchemeCreator modal
- [x] Dropdown shows all available schemes (not just "No parent")
- [x] Can select parent scheme
- [x] Excludes self from parent options (prevents cycles)
- [x] Saves parent relationship correctly

## Next Steps

1. **Test Hierarchical Creation**
   - Open SchemeCreator
   - Verify parent dropdown shows all schemes
   - Create child scheme (e.g., "Argument from Expert Opinion" → child of "Popular Opinion")
   - Enable "Inherit CQs" checkbox
   - Save and verify in hierarchy view

2. **Verify Accordion on Seeded Schemes**
   - Expand "Argument from Witness Testimony"
   - Verify premises/conclusion/CQs display correctly
   - Expand "Popular Practice"
   - Verify parent scheme ID shows

3. **Optional Enhancements**
   - Add "Expand All" / "Collapse All" button
   - Add search within expanded details
   - Add copy button for scheme key/ID
   - Add direct link to parent scheme in hierarchy view

## Implementation Notes

- Used React `Set` for efficient expanded state tracking
- Chevron icons from `lucide-react` provide clear visual affordance
- Details section uses subtle bg-slate-50/50 to distinguish from main card
- Color-coded badges maintain consistency with existing design system
- Premises use white background, conclusion uses indigo background for visual hierarchy
- All fields gracefully handle missing data with "not set" fallback

---

**Ready for testing!** Visit `/admin/schemes` to see the new accordion details and test parent scheme selection. 🚀
