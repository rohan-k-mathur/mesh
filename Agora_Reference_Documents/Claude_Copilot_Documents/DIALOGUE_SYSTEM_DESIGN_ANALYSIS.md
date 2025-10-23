# Dialogue System Design Analysis
**Date**: 2025-01-26  
**Context**: Phase 1 grid fixes completed; evaluating fundamental design decisions

---

## Executive Summary

After fixing the CommandCard grid display issues (Phase 1), fundamental questions emerged about the dialogue system's theoretical foundation and implementation:

1. **WHY Restriction**: Are generic WHY moves correctly restricted to the `CriticalQuestions` component?
2. **Structural Moves**: What should THEREFORE/SUPPOSE/DISCHARGE do theoretically, and what do they actually do?
3. **UI Design**: Is CommandCard the optimal affordance for these moves?

This document provides:
- **Theoretical foundation** from dialogical logic research
- **Current implementation** analysis
- **Gap assessment** between theory and practice
- **Recommendations** for alignment

---

## 1. Theoretical Foundation

### 1.1 Dialogical Logic Core Concepts

From `/Internal_Documents/ludics-documents/dialogical-logic-sep.md`:

**Two-Level System**:
- **Play level**: Single dialogue governed by **particle rules** (logical operators) and **structural rules** (global constraints)
- **Strategy level**: Sets of plays; **validity** = Proponent has winning strategy

**Particle Rules** (Local Meaning):
```
Connective    | Challenge          | Defense
─────────────┼───────────────────┼──────────────────
φ ∧ ψ         | ?L^∧ or ?R^∧      | φ or ψ
φ ∨ ψ         | ?∨                | φ or ψ (defender chooses)
φ ⊃ ψ         | φ                 | ψ
¬φ            | φ                 | (role flip)
∀x φ(x)       | [x/aᵢ]            | φ(aᵢ)
∃x φ(x)       | ?∃                | φ(aᵢ) (fresh)
```

**Structural Rules** (Global Constraints):
- **SR0** (Start): P states thesis; O chooses repetition rank `n`; P chooses rank
- **SR1i** (Intuitionistic): React to earlier moves; max `n` repetitions per target; **Last-Duty-First** (defend latest open attack)
- **SR2** (Formal/Copy-Cat): P may play atoms **only if O played them earlier** (analyticity)
- **SR3** (Win): No legal move on your turn → you lose
- **SR1c** (Classical variant): Replaces SR1i for classical logic

**Key Insight**: Dialogical logic is **rule-packable** — same particle rules + different SR-packs = different logics (intuitionistic vs. classical).

### 1.2 What WHY Moves Should Do (Theory)

From dialogical logic tradition:

**WHY = Challenge Move**:
- Opponent challenges Proponent's claim/inference
- Opens an **attack** that requires defense (GROUNDS)
- Must be **specific** to a logical form (particle rule)
- Examples from theory:
  - Challenge conjunction: `?L^∧` (ask for left conjunct)
  - Challenge universal: `[x/a]` (demand instantiation)
  - Challenge implication: State antecedent φ (demand consequent ψ)

**Critical Design Principle**: 
In pure dialogical logic, challenges are **typed by particle rules** (specific to connective). Generic "WHY?" is **not** a dialogical primitive — it's a **natural language approximation** of multiple particle rules.

### 1.3 What Structural Moves Should Do (Theory)

**THEREFORE**: Not present in classical dialogical logic (Lorenzen-Lorenz tradition).
- Appears to be a **Mesh extension** for consequence chaining
- Documented purpose (COMMANDCARD_ACTIONS_EXPLAINED.md): "Introduce logical consequence from premises"
- Force: ATTACK (can be challenged)
- Use case: Chaining inferences in multi-step proofs

**SUPPOSE**: From **proof theory** / natural deduction
- Opens a **hypothetical scope** for conditional reasoning
- Documented purpose: "Introduce supposition (neutral)" — paired with DISCHARGE
- Force: NEUTRAL (not an attack)
- Use case: "If X, then Y" arguments; counterfactual reasoning

**DISCHARGE**: Closes scope opened by SUPPOSE
- Marks end of hypothetical assumption
- Documented purpose: "Close supposition (neutral)"
- Force: NEUTRAL
- Use case: Validate conclusions derived within supposition scope

**Theoretical Alignment**:
- SUPPOSE/DISCHARGE map to **natural deduction's assumption-discharge** mechanism
- In dialogical logic, this is modeled by **branch structure** and **Last-Duty-First** (defend nested attacks before outer)
- Mesh appears to be **externalizing scope management** that would normally be implicit in locus paths

---

## 2. Current Implementation

### 2.1 WHY Restriction Design Decision

**Current Rule** (`app/api/dialogue/legal-moves/route.ts` lines 124-126):
```typescript
// WHY moves are ONLY offered through CriticalQuestions component with proper cqId
// Generic WHY without cqId is no longer supported (causes malformed moves)
// Users should use AttackMenuPro for structural attacks or CriticalQuestions for scheme-specific WHY
```

**Why This Exists**:
1. **Protocol Enforcement**: WHY moves require `cqId` to track which critical question is being asked
2. **Prevents Malformed Moves**: Generic WHY without context caused issues in validation (R2_NO_OPEN_CQ)
3. **Architectural Intent**: Separate UI concerns:
   - `CriticalQuestions`: Scheme-specific challenges (argumentation theory)
   - `AttackMenuPro`: AIF structural attacks (rebut/undercut/undermine)
   - `CommandCard`: General dialogue moves (GROUNDS, CONCEDE, CLOSE)

**Implementation Details**:
- `CriticalQuestions` component generates WHY moves with proper `cqId` from scheme templates
- Validation (`lib/dialogue/validate.ts`) enforces:
  - **R2**: GROUNDS must answer open WHY with matching `cqId`
  - **R4**: Duplicate WHY on same cqId rejected
  - **R5**: No attacks after CLOSE/CONCEDE
- `CQStatus` table tracks open/answered status per scheme

### 2.2 How WHY Actually Works

**Flow**:

1. **User clicks CQ in CriticalQuestions component**:
   ```typescript
   // Components: CriticalQuestionsV2.tsx
   POST /api/dialogue/move
   {
     kind: 'WHY',
     targetType: 'claim',
     targetId: 'claim_xyz',
     payload: {
       cqId: 'eo-1',              // ✅ REQUIRED
       schemeKey: 'expert_opinion',
       expression: 'Is the expert qualified?',
       locusPath: '0'
     }
   }
   ```

2. **Server creates move** (`app/api/dialogue/move/route.ts`):
   - Validates `cqId` present (lines 164-171)
   - Creates `CQStatus` record: `status='open', satisfied=false`
   - Synthesizes dialogue act: `{ polarity:'neg', locusPath, expression }`
   - Computes signature: `WHY:claim:claim_xyz:eo-1`
   - Deduplication via unique constraint on signature

3. **Grid displays GROUNDS response** (when legal):
   - `legal-moves` API checks for open WHY moves
   - Returns GROUNDS move with matching `cqId`
   - `movesToActions()` adapter shows "Answer…" button

4. **User answers via GROUNDS**:
   - Grid button or modal creates GROUNDS move with same `cqId`
   - Updates `CQStatus`: `status='answered', satisfied=true`
   - **NEW FEATURE**: Creates AIF Argument node from GROUNDS text (lines 29-66)

**Critical Detail**: WHY without `cqId` **fails validation** at API layer (400 error).

### 2.3 How Structural Moves Work

**THEREFORE**:

**API Implementation** (`app/api/dialogue/move/route.ts`):
```typescript
// Line 116: Synthesize act
if (kind === 'THEREFORE') 
  return [{ polarity:'pos', locusPath, openings:[], expression: expr, additive:false }];

// Line 128: Signature
if (kind === 'THEREFORE') 
  return ['THEREFORE', targetType, targetId, locusPath, hashExpr(expression)].join(':');
```

**What happens**:
1. User clicks "Therefore…" in CommandCard grid
2. Modal collects consequence text
3. POST creates DialogueMove with `kind='THEREFORE'`
4. Ludics engine compilation (`packages/ludics-engine/compileFromMoves.ts`):
   - Creates LudicAct at specified locus
   - Act has positive polarity (ATTACK force)
   - Can be challenged by opponent

**Current State**: **Minimally wired** — creates move/act but no special ludics semantics beyond polarity.

**SUPPOSE**:

```typescript
// Line 117: Synthesize act
if (kind === 'SUPPOSE') 
  return [{ polarity:'pos', locusPath, expression: expr || '+supposition', additive:false }];
```

**What happens**:
1. User clicks "Suppose…" in CommandCard grid
2. Modal collects hypothetical assumption text
3. POST creates DialogueMove with `kind='SUPPOSE'`
4. Ludics engine: Creates positive act at locus with expression `'+supposition'`

**Current State**: **No scope tracking** — SUPPOSE/DISCHARGE moves create acts but don't manage nested scope validation.

**DISCHARGE**:

```typescript
// Line 118: Synthesize act
if (kind === 'DISCHARGE') 
  return [{ polarity:'pos', locusPath, expression:'discharge', additive:false }];
```

**What happens**:
1. User clicks "Discharge" in CommandCard grid (no modal)
2. POST creates DialogueMove with `kind='DISCHARGE'`
3. Ludics engine: Creates act with expression `'discharge'`

**Current State**: **Marker only** — signals end of scope but no validation that it pairs with SUPPOSE.

### 2.4 Current UI Architecture

**Three Attack Mechanisms**:

1. **AttackMenuPro** (`components/arguments/AttackMenuPro.tsx`):
   - **Purpose**: AIF structural attacks (rebut/undercut/undermine)
   - **Creates**: ConflictingArgument records via `/api/ca`
   - **Shows**: Critical Questions panel (integrated)
   - **UI**: Dialog with three attack types + premise selection
   - **Does NOT create WHY moves** (pure AIF, not dialogical)

2. **CriticalQuestions** (`components/claims/CriticalQuestionsV2.tsx`):
   - **Purpose**: Scheme-specific WHY challenges
   - **Creates**: WHY DialogueMoves with proper `cqId`
   - **Shows**: Template-driven questions from ArgumentationScheme
   - **UI**: Collapsible list of CQ buttons
   - **Integrates with**: AttackMenuPro (shown in panel)

3. **CommandCard** (`components/dialogue/command-card/CommandCard.tsx`):
   - **Purpose**: General dialogue moves in deliberation context
   - **Creates**: GROUNDS, CONCEDE, RETRACT, CLOSE, THEREFORE, SUPPOSE, DISCHARGE
   - **Shows**: 3×3 grid grouped by force (ATTACK/SURRENDER/NEUTRAL)
   - **UI**: Fixed grid layout with hover/hotkey support
   - **Context**: DeepDivePanel deliberation view

**Architectural Intent** (inferred):
- **AttackMenuPro**: Natural language argumentation (AIF graph attacks)
- **CriticalQuestions**: Formal scheme interrogation (typed challenges)
- **CommandCard**: Ludics dialogue protocol (formal logic moves)

---

## 3. Gap Analysis: Theory vs. Implementation

### 3.1 WHY Restriction Assessment

**Is the restriction theoretically sound?**

**YES** — with important nuances:

**Strengths**:
1. ✅ **Aligns with particle rules**: Pure dialogical logic has **typed challenges** (`?L^∧`, `?∨`, `[x/a]`), not generic "WHY?"
2. ✅ **Enforces protocol discipline**: Requiring `cqId` ensures challenges are specific and trackable
3. ✅ **Prevents malformed moves**: Generic WHY caused validation issues (R2_NO_OPEN_CQ)
4. ✅ **Separation of concerns**: 
   - CriticalQuestions = scheme-specific interrogation (argumentation theory)
   - AttackMenuPro = AIF structural attacks (graph relations)
   - CommandCard = formal dialogue moves (ludics)

**Weaknesses**:
1. ⚠️ **User confusion**: Users expect "Why?" button in CommandCard (natural language intuition)
2. ⚠️ **Incomplete coverage**: Not all challenges map to CQ schemes (e.g., "Why this inference?")
3. ⚠️ **Awkward for newcomers**: Requires understanding three different attack mechanisms

**Recommendation**: 
- ✅ **Keep restriction** (theoretically sound)
- 🔄 **Improve UX**: Add tooltip/help text explaining WHY is available via CriticalQuestions
- 🔄 **Consider**: Generic WHY that auto-generates `cqId` (e.g., `cqId: 'generic-why-' + Date.now()`) for free-form challenges
  - Would need to relax R2 validation for generic cqId
  - Useful for exploratory dialogue before formalizing into schemes

### 3.2 Structural Moves Assessment

**Are THEREFORE/SUPPOSE/DISCHARGE properly implemented?**

**PARTIAL** — functional but semantically incomplete:

**THEREFORE**:
- ✅ Creates moves and acts (basic wiring works)
- ✅ Documented force (ATTACK) matches implementation
- ⚠️ **Missing**: No validation of logical consequence (acts as freeform claim)
- ⚠️ **Missing**: No inference checking (doesn't verify "therefore" follows from premises)
- **Status**: Works as **soft assertion** but not as **validated inference**

**Recommendation**:
- For MVP/Phase 2: **Keep as-is** (soft assertion useful for user intent signaling)
- For formal proof system: **Add inference validation**:
  ```typescript
  // Validate that THEREFORE expression is entailed by prior GROUNDS/premises
  const validConsequence = await checkInference({
    premises: priorGroundsInLocus,
    conclusion: thereforeExpression
  });
  if (!validConsequence) return 400; // "Invalid inference"
  ```

**SUPPOSE**:
- ✅ Creates moves and acts (basic wiring works)
- ✅ Documented force (NEUTRAL) matches implementation
- ❌ **Missing**: No scope tracking (doesn't create nested locus)
- ❌ **Missing**: No validation that DISCHARGE pairs with SUPPOSE
- ❌ **Missing**: No enforcement that conclusions in scope are conditional

**Current Behavior**: Acts as **annotation** ("I'm making an assumption") but doesn't enforce scope semantics.

**Recommendation**:
- **Short-term** (Phase 2): Add validation:
  ```typescript
  // When DISCHARGE is used, check for matching SUPPOSE
  const openSuppose = await findOpenSuppose(locusPath);
  if (!openSuppose) return 400; // "No open supposition to discharge"
  ```
- **Long-term** (formal proof): Implement **nested loci**:
  ```typescript
  // SUPPOSE creates child locus: 0 → 0.supp1
  // All moves in 0.supp1 are hypothetical
  // DISCHARGE at 0.supp1 marks scope closed
  // Conclusions valid only if SUPPOSE holds
  ```

**DISCHARGE**:
- ✅ Creates move (basic wiring works)
- ❌ **Missing**: No validation of pairing with SUPPOSE
- ❌ **Missing**: No scope closure semantics

**Recommendation**: See SUPPOSE — needs pairing validation.

### 3.3 UI Design Assessment

**Is CommandCard the right place for structural moves?**

**YES** — but needs refinement:

**Strengths**:
1. ✅ **Deliberation context**: Structural moves are ludics/dialogical constructs (not AIF attacks)
2. ✅ **Fixed layout**: 3×3 grid gives spatial consistency (muscle memory)
3. ✅ **Force grouping**: ATTACK/SURRENDER/NEUTRAL rows align with theory
4. ✅ **Available everywhere**: Unlike AttackMenuPro (argument-specific), CommandCard works on any target

**Weaknesses**:
1. ⚠️ **Lack of guidance**: Users don't understand what THEREFORE/SUPPOSE/DISCHARGE do
2. ⚠️ **No visibility of state**: Can't see open suppositions or scope depth
3. ⚠️ **Missing WHY explanation**: No hint that WHY exists in CriticalQuestions

**Recommendations**:

**Immediate (Phase 2)**:
1. **Add tooltips** to structural moves:
   ```tsx
   <Tooltip>
     <TooltipTrigger>Therefore…</TooltipTrigger>
     <TooltipContent>
       State a logical consequence from prior premises.
       Can be challenged. Use for multi-step reasoning.
     </TooltipContent>
   </Tooltip>
   ```

2. **Add WHY help text** in ATTACK row:
   ```tsx
   <div className="text-xs text-slate-500 mt-1">
     💡 To ask "Why?", use Critical Questions panel
   </div>
   ```

3. **Disable DISCHARGE when no open SUPPOSE**:
   ```tsx
   // In movesToActions.ts
   const openSuppose = moves.find(m => 
     m.kind === 'SUPPOSE' && !hasMatchingDischarge(m)
   );
   actions.push({
     id: 'discharge',
     kind: 'DISCHARGE',
     disabled: !openSuppose,  // ✅ Gray out if no SUPPOSE open
     disabledReason: 'No open supposition to discharge'
   });
   ```

**Long-term (Phase 3)**:
1. **Scope visualization**: Show nested loci as indented tree
2. **Pairing indicators**: Highlight SUPPOSE/DISCHARGE pairs
3. **Inference validation**: Check THEREFORE logic before allowing post

---

## 4. Design Recommendations

### 4.1 Keep Core Architecture

**Decision**: ✅ **Maintain current three-mechanism design**

**Rationale**:
- Separation of concerns is theoretically sound
- Maps cleanly to three paradigms:
  - **AIF** (natural language argumentation graph)
  - **Argumentation schemes** (typed interrogation patterns)
  - **Dialogical logic** (formal proof system)

### 4.2 Improve WHY Discovery

**Option A**: Add generic WHY with auto-cqId (Easy)
```typescript
// In legal-moves/route.ts
if (actorId !== 'system') {
  moves.push({
    kind: 'WHY',
    label: 'Why? (general)',
    payload: {
      cqId: `generic-${Date.now()}`,  // ✅ Auto-generate unique cqId
      locusPath,
      isGeneric: true
    }
  });
}
```

**Option B**: Add discovery link in CommandCard (Medium)
```tsx
// In CommandCard.tsx ATTACK row
<div className="col-span-3 text-xs text-center text-slate-500 mt-1">
  💡 For specific challenges, see{' '}
  <button onClick={() => scrollToCQ()} className="text-indigo-600 hover:underline">
    Critical Questions
  </button>
</div>
```

**Recommendation**: Implement **both** (A for flexibility, B for education)

### 4.3 Formalize SUPPOSE/DISCHARGE Semantics

**Phase 2** (MVP validation):
```typescript
// In validate.ts
if (kind === 'DISCHARGE') {
  const openSuppose = await prisma.dialogueMove.findFirst({
    where: {
      deliberationId,
      targetType,
      targetId,
      kind: 'SUPPOSE',
      payload: { path: ['locusPath'], equals: locusPath }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  const matchingDischarge = openSuppose && await prisma.dialogueMove.findFirst({
    where: {
      deliberationId,
      kind: 'DISCHARGE',
      payload: { path: ['locusPath'], equals: locusPath },
      createdAt: { gt: openSuppose.createdAt }
    }
  });
  
  if (!openSuppose || matchingDischarge) {
    reasons.push('R8_NO_OPEN_SUPPOSE');
  }
}
```

**Phase 3** (full scope tracking):
- Implement nested loci (`0.supp1`, `0.supp1.supp2`)
- Track scope depth in LudicLocus
- Validate conclusions are conditional on open suppositions
- Render scope tree in UI

### 4.4 Add User Education

**CommandCard Enhancement**:
```tsx
// Add help icon in grid header
<div className="flex items-center justify-between mb-2">
  <h3 className="font-semibold">Dialogue Moves</h3>
  <Dialog>
    <DialogTrigger>
      <HelpCircle className="w-4 h-4 text-slate-400" />
    </DialogTrigger>
    <DialogContent>
      <DialogTitle>Dialogue Move Reference</DialogTitle>
      <div className="space-y-3">
        <div>
          <h4 className="font-semibold">ATTACK Moves</h4>
          <ul className="text-sm space-y-1 mt-1">
            <li><strong>Why?</strong> — Available via Critical Questions panel</li>
            <li><strong>Therefore…</strong> — State a logical consequence</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold">NEUTRAL Moves</h4>
          <ul className="text-sm space-y-1 mt-1">
            <li><strong>Suppose…</strong> — Introduce hypothetical assumption</li>
            <li><strong>Discharge</strong> — End assumption scope</li>
          </ul>
        </div>
        {/* ... */}
      </div>
    </DialogContent>
  </Dialog>
</div>
```

---

## 5. Conclusion

### 5.1 Is the Design Correct?

**Overall Assessment**: ✅ **Fundamentally sound** — with implementation gaps

**Theoretical Alignment**:
- ✅ WHY restriction aligns with dialogical logic (typed challenges)
- ✅ Three-mechanism architecture maps to distinct paradigms
- ✅ Structural moves (THEREFORE/SUPPOSE/DISCHARGE) rooted in proof theory
- ⚠️ Implementation is **semantically incomplete** (missing validation/scope tracking)

**User Experience**:
- ⚠️ Confusing for newcomers (three attack paths not obvious)
- ⚠️ Structural moves lack guidance (tooltips/help needed)
- ⚠️ WHY "missing" from CommandCard creates friction

### 5.2 Should Anything Change?

**High Priority** (Phase 2):
1. ✅ **Keep WHY restriction** (correct design)
2. 🔄 **Add generic WHY option** with auto-cqId (UX improvement)
3. 🔄 **Add tooltips** to THEREFORE/SUPPOSE/DISCHARGE (education)
4. 🔄 **Validate DISCHARGE pairing** with SUPPOSE (basic semantics)
5. 🔄 **Add help link** to CriticalQuestions from CommandCard

**Medium Priority** (Phase 3):
1. 🔄 Implement nested loci for SUPPOSE scope tracking
2. 🔄 Add inference validation for THEREFORE
3. 🔄 Visualize scope depth in UI
4. 🔄 Create comprehensive dialogue move tutorial

**Low Priority** (Future):
1. Full dialogical logic engine (SR0-SR3 enforcement)
2. Strategy explorer (winning strategy computation)
3. Particle rule dispatcher (typed challenges per connective)

### 5.3 Next Steps

**Recommended Action Plan**:

1. **Document current state** ✅ (this file)
2. **User test** current grid with 3-5 users (measure confusion points)
3. **Implement Phase 2 quick wins**:
   - Generic WHY option
   - Tooltips for structural moves
   - SUPPOSE/DISCHARGE pairing validation
4. **Iterate based on feedback**
5. **Plan Phase 3 scope tracking** after MVP validates demand

**Files to Modify** (Phase 2):
- `app/api/dialogue/legal-moves/route.ts` — Add generic WHY
- `lib/dialogue/movesToActions.ts` — Add tooltip content
- `lib/dialogue/validate.ts` — Add R8_NO_OPEN_SUPPOSE
- `lib/dialogue/codes.ts` — Add R8 code
- `components/dialogue/command-card/CommandCard.tsx` — Add help dialog + CQ link

---

## Appendix A: Key File Reference

**API Layer**:
- `app/api/dialogue/move/route.ts` — Move creation handler (WHY/GROUNDS/structural)
- `app/api/dialogue/legal-moves/route.ts` — Computes available moves per state

**Validation**:
- `lib/dialogue/validate.ts` — Protocol rules R1-R7
- `lib/dialogue/codes.ts` — Reason codes for validation failures

**UI Components**:
- `components/dialogue/command-card/CommandCard.tsx` — 3×3 grid display
- `components/claims/CriticalQuestionsV2.tsx` — WHY move generator
- `components/arguments/AttackMenuPro.tsx` — AIF structural attacks

**Adapters**:
- `lib/dialogue/movesToActions.ts` — Converts API moves → CommandCard actions

**Ludics Engine**:
- `packages/ludics-engine/compileFromMoves.ts` — Converts moves → LudicActs
- `packages/ludics-engine/stepper.ts` — Interaction simulation

**Documentation**:
- `Internal_Documents/ludics-documents/dialogical-logic-sep.md` — Theory
- `COMMANDCARD_ACTIONS_EXPLAINED.md` — Move specifications

---

**End of Analysis**
