# Component Analysis: LegalMoveToolbar vs AttackMenuProV2

## Executive Summary

**Recommendation**: Remove LegalMoveToolbar from AIFArgumentsListPro. AttackMenuProV2 provides superior UX and covers the primary use case (attacking arguments). LegalMoveToolbar is better suited for formal dialogue systems where WHY/GROUNDS/CLOSE moves are central.

---

## Detailed Comparison

### Purpose & Scope

| Aspect | LegalMoveToolbar | AttackMenuProV2 |
|--------|------------------|-----------------|
| **Primary Focus** | Dialogue protocol moves (WHY, GROUNDS, CLOSE, CONCEDE) | Argumentation attacks (REBUT, UNDERCUT, UNDERMINE) |
| **Use Case** | Formal dialogue systems with turn-based protocols | Argumentation-first interfaces |
| **CQ Integration** | Indirect (GROUNDS moves can satisfy CQs) | Direct (dedicated CQ tab with full UI) |
| **Target Types** | argument, claim, card | argument only |
| **Presentation** | Segmented toolbar (Challenge/Resolve/More) | Dialog modal with tabs |

### Feature Matrix

| Feature | LegalMoveToolbar | AttackMenuProV2 | Winner |
|---------|------------------|-----------------|--------|
| **Visual Design** | Minimal toolbar | Rich modal with gradients/cards | AMP ✅ |
| **Attack Types** | Via legal moves API | Explicit REBUT/UNDERCUT/UNDERMINE | AMP ✅ |
| **CQ Display** | None | Dedicated tab with CriticalQuestionsV2 | AMP ✅ |
| **WHY Moves** | ✅ Inline input | ❌ Not supported | LMT ✅ |
| **GROUNDS Moves** | ✅ With NLCommitPopover | ❌ Not supported | LMT ✅ |
| **CLOSE/CONCEDE** | ✅ Full support | ❌ Not supported | LMT ✅ |
| **Preference Attacks** | ❌ Not supported | ❌ Not supported | Tie |
| **Ease of Use** | Complex 3-tab interface | Focused attack workflow | AMP ✅ |
| **Mobile Friendly** | Compact toolbar | Full-screen modal | LMT ✅ |
| **Attack Metadata** | Basic | Rich (CQ detection, scheme context) | AMP ✅ |

### Code Architecture

#### LegalMoveToolbar
```typescript
Dependencies:
- useSWR → /api/dialogue/legal-moves
- NLCommitPopover (for GROUNDS)
- CommandCard (for grid view)
- movesToActions transformer

State Management:
- 7 useState hooks
- SWR caching for legal moves
- Complex intent switching (challenge/resolve/more)

Lines of Code: ~270
```

#### AttackMenuProV2
```typescript
Dependencies:
- Dialog components
- SchemeComposerPicker
- CriticalQuestionsV2
- Direct API calls (/api/ca, /api/claims, /api/cqs)

State Management:
- 8 useState hooks per attack type
- Lazy mounting for performance
- Tab-based organization

Lines of Code: ~780
```

### UX Comparison

#### LegalMoveToolbar UX Flow
1. Select intent (Challenge/Resolve/More)
2. Find move in filtered list
3. Click button (or open inline editor for WHY)
4. For GROUNDS: NLCommitPopover opens
5. Submit move

**Strengths**: 
- Follows dialogue protocol strictly
- Compact UI (fits in footer)
- Shows illegal moves with reasons

**Weaknesses**:
- Cognitive overhead (3 intents to understand)
- Hidden features (need to expand "More")
- Attack metaphor buried in legal moves
- No visual guidance on attack types

#### AttackMenuProV2 UX Flow
1. Click "Challenge Argument"
2. See 3 clear attack types with descriptions
3. Expand desired attack card
4. Fill in required fields (claim/text/premise)
5. Submit attack

**Strengths**:
- Clear metaphor (attacking an argument)
- Visual hierarchy (cards, icons, gradients)
- Guided workflow (expand → fill → submit)
- CQs in dedicated tab

**Weaknesses**:
- Modal interrupts flow
- Not suitable for rapid-fire dialogue
- No support for WHY/GROUNDS/CLOSE

---

## Context: AIFArgumentsListPro

### Current Usage
```typescript
<footer className="flex flex-wrap items-center gap-2">
  {/* COMMENTED OUT:
  <LegalMoveToolbar
    deliberationId={deliberationId}
    targetType="argument"
    targetId={a.id}
    onPosted={() => window.dispatchEvent(...)}
  />
  */}
  
  <PreferenceQuick ... />
  
  <AttackMenuProV2
    deliberationId={deliberationId}
    authorId={a.authorId}
    target={{ id: a.id, conclusion: ..., premises: ... }}
    onDone={() => onRefreshRow(a.id)}
  />
  
  {/* Other actions */}
</footer>
```

### Needs Analysis for AIFArgumentsListPro

| Need | LMT | AMP | Winner |
|------|-----|-----|--------|
| Attack arguments | Via legal moves | ✅ Primary purpose | **AMP** |
| View/answer CQs | No | ✅ Dedicated tab | **AMP** |
| WHY questions | ✅ | No | **LMT** |
| Close dialogue | ✅ | No | **LMT** |
| Visual appeal | Basic | ✅ Modern | **AMP** |
| Space efficiency | ✅ Toolbar | Modal | **LMT** |

**Verdict**: AIFArgumentsListPro is an argument-browsing interface. Attacking arguments is the primary action. WHY/CLOSE moves are secondary (can be added elsewhere if needed).

---

## Recommendation: Remove LegalMoveToolbar

### Rationale
1. **Overlap**: Both components enable attacks via different metaphors
2. **Confusion**: Users see two ways to do the same thing
3. **UI Clutter**: Footer is already crowded (PreferenceQuick + AttackMenuProV2 + other actions)
4. **Design Inconsistency**: LMT toolbar vs AMP modal breaks visual consistency
5. **Primary Use Case**: Users want to attack arguments, not engage in formal dialogue protocol

### Where LegalMoveToolbar SHOULD Be Used
- **Formal dialogue interfaces** (e.g., structured debates with turns)
- **Protocol-driven flows** (e.g., Walton's dialogue systems)
- **Deliberation workspaces** where WHY/GROUNDS/CLOSE are first-class actions
- **Expert user interfaces** where legal move vocabulary is understood

### Alternative: Hybrid Approach
If WHY/GROUNDS/CLOSE are needed in AIFArgumentsListPro:

```typescript
<footer className="flex flex-wrap items-center gap-2">
  {/* Primary action - attacking */}
  <AttackMenuProV2 ... />
  
  {/* Secondary actions - protocol moves */}
  <DropdownMenu>
    <DropdownMenuTrigger>More Actions ▾</DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem onClick={openWhyDialog}>Ask WHY</DropdownMenuItem>
      <DropdownMenuItem onClick={openGroundsDialog}>Provide GROUNDS</DropdownMenuItem>
      <DropdownMenuItem onClick={handleClose}>Close Dialogue</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</footer>
```

---

## Schema-Specific CQs Issue

### Current Implementation (Inline)
```typescript
{cqs.map(c => (
  <div key={c.cqKey}>
    <button>{c.cqKey}</button>
    <button onClick={() => setObCq(c.cqKey)}>objection…</button>
    
    {obCq === c.cqKey && (
      <span className="inline-flex">
        {c.attackType === 'REBUTS' && <ClaimPicker ... />}
        {c.attackType === 'UNDERCUTS' && <input ... />}
        {c.attackType === 'UNDERMINES' && <><select .../><ClaimPicker .../></>}
      </span>
    )}
  </div>
))}
```

**Problems**:
1. ❌ Cluttered inline UI (expands horizontally)
2. ❌ Poor mobile experience
3. ❌ No context on what CQ means
4. ❌ No guidance on attack types
5. ❌ Doesn't match new V2 design system

### Proposed Solution: SchemeSpecificCQsModal

New component that:
- Opens in a dialog modal
- Shows CQ full text (not just key)
- Explains attack type and target scope
- Provides guided form for objection
- Matches AttackMenuProV2 design language

---

## Implementation Plan

### Phase 1: Create SchemeSpecificCQsModal ✅ (Next)
- Modal dialog with CQ list
- Each CQ card shows: text, status, attack type, target scope
- Objection form per CQ (collapsible)
- Rose/Amber/Slate theming matching attack types

### Phase 2: Integrate Modal into AIFArgumentsListPro
- Replace inline CQ section with button: "View Critical Questions"
- Opens SchemeSpecificCQsModal
- Pass `cqs` array, `meta`, `deliberationId`, `authorId`
- Handle objection submissions with proper metadata

### Phase 3: Remove LegalMoveToolbar (Optional)
- Comment out import
- Remove from footer
- Test that attack flows still work
- Document where LMT should be used instead

### Phase 4: E2E Testing
- Test each CQ objection type (REBUT/UNDERCUT/UNDERMINE)
- Verify metadata propagation
- Check event firing (claims:changed, arguments:changed)
- Test mobile responsiveness

---

## Wiring Review Checklist

### AttackMenuProV2 Integration ✅
- [x] Imported dynamically
- [x] Receives `deliberationId`, `authorId`, `target`
- [x] `target.conclusion` has id and text
- [x] `target.premises` is array with id and text
- [x] `onDone` calls `onRefreshRow(a.id)`
- [x] Posts to `/api/ca` with proper payload
- [x] Fires `claims:changed` and `arguments:changed` events

### SchemeSpecificCQs Integration (To Verify)
- [ ] `getArgumentCQs(argumentId)` returns correct structure
- [ ] `askCQ(argumentId, cqKey, context)` marks CQ as asked
- [ ] CQ objections post to `/api/ca` with correct metadata
- [ ] `metaJson` includes `{ schemeKey, cqKey, source }`
- [ ] Objections trigger `onRefreshRow` to reload AIF metadata
- [ ] CQ count updates after objection posted

### Event Propagation (To Verify)
- [ ] `window.dispatchEvent('claims:changed')` after attack
- [ ] `window.dispatchEvent('arguments:changed')` after attack
- [ ] `onRefreshRow` calls `refreshAifForId` which fetches `/api/arguments/:id/aif`
- [ ] AIF metadata includes updated attack counts
- [ ] CQ meter updates with new satisfied/required counts

---

## Next Steps

1. **Create `SchemeSpecificCQsModal.tsx`** ✅ (Immediate)
2. **Integrate modal into `AIFArgumentsListPro.tsx`**
3. **Test CQ objection flows end-to-end**
4. **Review and potentially remove `LegalMoveToolbar`**
5. **Document component usage in AGENTS.md**
