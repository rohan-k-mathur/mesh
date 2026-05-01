# ASPIC+ Attack UI Architecture Review

**Date**: November 7, 2025  
**Context**: Phase F (Attack Creation UI) - Analyzing optimal integration strategy  
**Question**: Should we enhance AttackMenuProV2 or create new AttackCreationModal?

---

## Current Component Landscape

### 1. AIFArgumentsListPro (Row-Level Actions)

**Location**: `components/arguments/AIFArgumentsListPro.tsx` (lines 655-765)

**Footer Button Layout**:
```tsx
<footer className="flex flex-wrap items-center gap-2">
  <PreferenceQuick />                    // Preference attacks
  <AttackMenuProV2 />                    // Legacy attack modal (REBUTS/UNDERCUTS/UNDERMINES)
  <CommunityDefenseMenu />               // Community defense modal
  <ClarificationRequestButton />         // Clarification requests
  <SchemeSpecificCQsModal />             // Scheme-specific critical questions
  <PromoteToClaimButton />               // Promote to claim
  <button>Share</button>                 // Copy link
</footer>
```

**Characteristics**:
- **7 different action buttons** in argument row footer
- Modal-heavy architecture (AttackMenuProV2, CommunityDefenseMenu, SchemeSpecificCQsModal)
- Row-level context (argument ID, deliberation ID, author ID)
- Triggers refresh via `onRefreshRow(a.id)`

---

### 2. ArgumentCardV2 (Element-Level Actions)

**Location**: `components/arguments/ArgumentCardV2.tsx` (lines 677-707)

**Header Badge Layout**:
```tsx
<div className="flex items-center gap-2">
  <DialogueProvenanceBadge />           // Phase 3: Dialogue move provenance
  <StaleArgumentBadge />                // Phase 3: Temporal decay
  <ConfidenceDisplay />                 // Phase 3: DS mode confidence
  <button>View Scheme</button>          // Scheme breakdown modal
  <CQStatusPill />                      // CQ status (click → modal)
  <DialogueActionsButton />             // Comprehensive dialogue modal (WHY/GROUNDS/CONCEDE/etc)
  <AttackMenuProV2 />                   // Phase F: NEW - Attack button
  <CQStatusPill />                      // Argument-level CQs
</div>
```

**Characteristics**:
- **Element-specific actions** (conclusion claim, individual premises)
- DialogueActionsButton provides **comprehensive dialogue moves** (WHY, GROUNDS, CONCEDE, RETRACT, CLOSE, THEREFORE, SUPPOSE, DISCHARGE)
- AttackMenuProV2 **just added** in Phase F (line 688-696)
- Each element can have dialogue actions (conclusion, premise1, premise2, etc.)

---

### 3. AttackMenuProV2 (Legacy Attack Modal)

**Location**: `components/arguments/AttackMenuProV2.tsx` (918 lines)

**Purpose**: Direct attack creation (bypassing dialogue protocol)

**Features**:
- **Attack Types**: REBUTS, UNDERCUTS, UNDERMINES
- **Attacker Selection**: Claim picker + PropositionComposerPro integration
- **API**: Creates ConflictApplication via `/api/ca`
- **Deprecation Status**: ⚠️ Phase 6 added soft deprecation warning banner
  - Recommends using SchemeSpecificCQsModal instead
  - Still functional (backward compatibility preserved)

**Design**:
```
┌─────────────────────────────────────────┐
│ ⚠️ DEPRECATION WARNING BANNER           │
│ "Consider using Critical Questions"     │
├─────────────────────────────────────────┤
│ Attack Type Selection:                  │
│  ┌─────────────┐ ┌─────────────┐       │
│  │   REBUTS    │ │  UNDERCUTS  │       │
│  └─────────────┘ └─────────────┘       │
│  ┌─────────────┐                       │
│  │ UNDERMINES  │                       │
│  └─────────────┘                       │
│                                         │
│ Attacker Selection:                     │
│  • Claim Picker (select existing)      │
│  • PropositionComposerPro (create new)  │
│                                         │
│ [Post Attack Button]                    │
└─────────────────────────────────────────┘
```

**Integration Points**:
- Used in **AIFArgumentsListPro footer** (argument-level attacks)
- Used in **ArgumentCardV2 header** (Phase F: just added)
- Creates **ConflictApplication** records (attackerId, targetId, attackType)

---

### 4. DialogueActionsButton → DialogueActionsModal

**Location**: 
- Button: `components/dialogue/DialogueActionsButton.tsx` (97 lines)
- Modal: `components/dialogue/DialogueActionsModal.tsx` (600+ lines)

**Purpose**: Comprehensive dialogue protocol moves

**Features**:
- **Protocol Moves**: WHY, GROUNDS, CONCEDE, RETRACT, CLOSE, ACCEPT_ARGUMENT
- **Structural Moves**: THEREFORE, SUPPOSE, DISCHARGE
- **Critical Questions**: CQContextPanel integration
- **Tabbed Interface**: Protocol / Structural / CQs
- **Nested Modals**: NLCommitPopover (GROUNDS), StructuralMoveModal, WhyChallengeModal
- **API**: Creates DialogueMove via `/api/dialogue/move`

**Design**:
```
┌─────────────────────────────────────────┐
│ Dialogue Actions                        │
├─────────────────────────────────────────┤
│ [Protocol] [Structural] [CQs]           │
├─────────────────────────────────────────┤
│ Protocol Tab:                           │
│  • Ask WHY                              │
│  • Provide GROUNDS → NLCommitPopover    │
│  • CONCEDE                              │
│  • RETRACT                              │
│  • CLOSE                                │
│                                         │
│ Structural Tab:                         │
│  • THEREFORE → StructuralMoveModal      │
│  • SUPPOSE → StructuralMoveModal        │
│  • DISCHARGE → StructuralMoveModal      │
│                                         │
│ CQs Tab:                                │
│  • CQContextPanel (scheme-specific CQs) │
└─────────────────────────────────────────┘
```

**Integration Points**:
- Used in **ArgumentCardV2** for **conclusion claim** (line 677)
- Can be used for **individual premises** (element-level dialogue)
- Creates **DialogueMove** records → converts to LudicActs → AIF nodes → ASPIC+ theory

---

### 5. SchemeSpecificCQsModal

**Location**: `components/arguments/SchemeSpecificCQsModal.tsx`

**Purpose**: Scheme-specific critical questions (WHY moves in dialogue protocol)

**Features**:
- Scheme-aware CQ templates
- WHY dialogue moves with CQ context
- Objection forms (GROUNDS moves)
- DialogueMove integration (Option A architecture)

**Integration Points**:
- Used in **AIFArgumentsListPro footer** (argument-level CQs)
- Button shows CQ satisfaction count: "CQs 3/5"

---

### 6. AttackCreationModal (NEW - Phase F)

**Location**: `components/aspic/AttackCreationModal.tsx` (400 lines)

**Purpose**: Direct ASPIC+ attack creation with semantic guidance

**Features**:
- **Attack Types**: UNDERMINES, REBUTS, UNDERCUTS (ASPIC+ semantics)
- **Attacker Type Toggle**: Claim vs Argument
- **Dynamic Dropdown**: Fetches attackers from `/api/claims` or `/api/arguments`
- **ASPIC+ Explanations**: Semantic descriptions for each attack type
- **API**: Creates ConflictApplication via `/api/ca`

**Design**:
```
┌─────────────────────────────────────────┐
│ Create ASPIC+ Attack                    │
├─────────────────────────────────────────┤
│ Attack Type:                            │
│  ┌──────────────────────────────────┐   │
│  │ 🎯 UNDERMINES                    │   │
│  │ Attack a premise (K_a always    │   │
│  │ succeeds, K_p needs preference) │   │
│  └──────────────────────────────────┘   │
│  ┌──────────────────────────────────┐   │
│  │ ⚔️ REBUTS                        │   │
│  │ Attack the conclusion            │   │
│  └──────────────────────────────────┘   │
│  ┌──────────────────────────────────┐   │
│  │ 🛡️ UNDERCUTS                     │   │
│  │ Attack the inference rule        │   │
│  └──────────────────────────────────┘   │
│                                         │
│ Attacker Type: [Claim] [Argument]      │
│                                         │
│ Select Attacker:                        │
│  ┌──────────────────────────────────┐   │
│  │ Dropdown of claims/arguments     │   │
│  └──────────────────────────────────┘   │
│                                         │
│ [Create Attack]                         │
└─────────────────────────────────────────┘
```

**Integration Points**:
- **ClaimDetailPanel**: Attack button + modal rendering (✅ COMPLETE)
- **ArgumentCardV2**: Attack button + modal rendering (✅ COMPLETE)
- Creates **ConflictApplication** records (same as AttackMenuProV2)

---

## Architecture Comparison Matrix

| Feature | AttackMenuProV2 | AttackCreationModal | DialogueActionsButton |
|---------|-----------------|---------------------|----------------------|
| **Purpose** | Legacy attack creation | ASPIC+ attack creation | Dialogue protocol moves |
| **Attack Types** | REBUTS, UNDERCUTS, UNDERMINES | UNDERMINES, REBUTS, UNDERCUTS | WHY, GROUNDS (indirect attacks) |
| **Attacker Selection** | Claim picker + create new | Claim/Argument dropdown | N/A (dialogue moves) |
| **ASPIC+ Semantics** | ❌ Generic attack labels | ✅ K_a/K_p/K_n explanations | ❌ Dialogue metaphor |
| **API Endpoint** | `/api/ca` (ConflictApplication) | `/api/ca` (ConflictApplication) | `/api/dialogue/move` (DialogueMove) |
| **ASPIC+ Integration** | ✅ Via CA-nodes | ✅ Via CA-nodes | ✅ Via DialogueMove → CA-nodes |
| **Deprecation Status** | ⚠️ Soft deprecated (Phase 6) | ✅ New, recommended | ✅ Canonical dialogue system |
| **UI Complexity** | 918 lines (heavy) | 400 lines (focused) | 600+ lines (comprehensive) |
| **Current Usage** | AIFArgumentsListPro footer, ArgumentCardV2 header | ClaimDetailPanel, ArgumentCardV2 (Phase F) | ArgumentCardV2 elements |
| **Creation Workflow** | Select type → pick/create claim → post | Select type → toggle claim/arg → select attacker → post | Select move → fill form → post |
| **Scheme Integration** | ❌ No scheme awareness | ❌ No scheme awareness | ✅ Via CQs tab |
| **PropositionComposer** | ✅ Embedded | ❌ Not integrated | ❌ Not integrated |

---

## User Flow Analysis

### Current State (Before Phase F)

**Attacking an Argument (Row-Level)**:
```
AIFArgumentsListPro
  ↓
User clicks "Challenge Argument" button
  ↓
AttackMenuProV2 modal opens
  ↓
User sees deprecation warning
  ↓
Option A: Ignore warning, select attack type, pick claim, post attack
Option B: Close modal, click "CQs" button, use SchemeSpecificCQsModal
```

**Attacking a Claim/Premise (Element-Level)**:
```
ArgumentCardV2
  ↓
User clicks "Dialogue" button on conclusion claim
  ↓
DialogueActionsModal opens
  ↓
User selects WHY (challenge) or GROUNDS (provide evidence)
  ↓
DialogueMove created → converts to CA-node → ASPIC+ attack
```

### Phase F State (With AttackCreationModal)

**Attacking a Claim (Detail Panel)**:
```
ClaimDetailPanel
  ↓
User clicks "Create ASPIC+ Attack" button
  ↓
AttackCreationModal opens
  ↓
User sees ASPIC+ semantic explanations (K_a/K_p/K_n)
  ↓
User selects attack type (UNDERMINES/REBUTS/UNDERCUTS)
  ↓
User toggles attacker type (Claim/Argument)
  ↓
User selects attacker from dropdown
  ↓
Creates ConflictApplication → ASPIC+ attack
```

**Attacking an Argument (ArgumentCardV2)**:
```
ArgumentCardV2 header
  ↓
User clicks "Attack" button (new Phase F button)
  ↓
AttackCreationModal opens
  ↓
Same flow as above
```

---

## Redundancy & Overlap Issues

### Problem 1: Three Ways to Attack

**Current situation**:
1. **AttackMenuProV2** (row-level + ArgumentCardV2 header)
   - Direct ConflictApplication creation
   - Legacy approach (soft deprecated)
   
2. **AttackCreationModal** (Phase F - ClaimDetailPanel + ArgumentCardV2 header)
   - Direct ConflictApplication creation
   - ASPIC+ semantics (new, recommended)
   
3. **DialogueActionsButton → DialogueActionsModal** (ArgumentCardV2 elements)
   - Indirect via DialogueMove → CA-nodes
   - Dialogue protocol approach

**User Confusion**: ArgumentCardV2 header now has **BOTH** AttackMenuProV2 **AND** AttackCreationModal buttons!

### Problem 2: Inconsistent Metaphors

- **AttackMenuProV2**: Military metaphor (Challenge, Swords icon)
- **AttackCreationModal**: ASPIC+ theory metaphor (K_a undermining, preference-based defeats)
- **DialogueActionsButton**: Dialogue protocol metaphor (WHY challenges, GROUNDS responses)

### Problem 3: API Endpoint Duplication

Both AttackMenuProV2 and AttackCreationModal create ConflictApplications via `/api/ca`. They do the **same backend operation** with different UI.

### Problem 4: Scattered Attack Buttons

**AIFArgumentsListPro footer**:
- AttackMenuProV2 button (legacy)
- SchemeSpecificCQsModal button (CQs → attacks via dialogue)
- PreferenceQuick button (preference attacks)

**ArgumentCardV2 header**:
- DialogueActionsButton (WHY/GROUNDS → attacks via dialogue)
- AttackMenuProV2 button (Phase F: just added)
- AttackCreationModal button (Phase F: just added) ← **PROBLEM: Not actually added yet!**

---

## API Error Analysis

**Error**:
```
GET /api/arguments?deliberationId=ludics-forest-demo
Status: 405 Method Not Allowed
```

**Root Cause**: AttackCreationModal tries to fetch arguments via GET `/api/arguments?deliberationId=X`, but the endpoint doesn't support GET method.

**Location**: `AttackCreationModal.tsx` line 50-63:
```typescript
const fetchAttackers = async () => {
  const endpoint = attackerType === "claim" 
    ? `/api/claims?deliberationId=${deliberationId}`
    : `/api/arguments?deliberationId=${deliberationId}`; // ❌ 405 error
  
  const res = await fetch(endpoint);
  const data = await res.json();
  setAttackers(data.claims || data.arguments || []);
};
```

**Solution**: Need to create `/api/arguments/route.ts` with GET handler or use existing AIF search endpoint.

---

## Recommendations

### Option A: Deprecate AttackMenuProV2, Enhance AttackCreationModal ✅ **RECOMMENDED**

**Rationale**:
1. **AttackMenuProV2 is already soft deprecated** (Phase 6 warning banner)
2. **AttackCreationModal provides ASPIC+ semantics** (aligns with Phase F goals)
3. **Cleaner user experience** (one attack modal, not two)
4. **Consistent with project direction** (ASPIC+ theory integration)

**Implementation**:
1. ✅ Fix API error: Add GET handler to `/api/arguments/route.ts` or use `/api/arguments/search`
2. ✅ Enhance AttackCreationModal with PropositionComposerPro (create new attackers)
3. ❌ Remove AttackMenuProV2 from ArgumentCardV2 header (just added in Phase F)
4. ⏳ Keep AttackMenuProV2 in AIFArgumentsListPro for now (gradual deprecation)
5. ⏳ Add full deprecation banner to AttackMenuProV2: "Use ASPIC+ Attack button instead"

**User Flow After Changes**:
```
ArgumentCardV2 header
  ↓
User clicks "Attack" button (AttackCreationModal)
  ↓
AttackCreationModal opens with ASPIC+ semantics
  ↓
Select attack type (UNDERMINES/REBUTS/UNDERCUTS)
  ↓
Toggle attacker type (Claim/Argument)
  ↓
Select existing OR create new attacker (PropositionComposerPro)
  ↓
Creates ConflictApplication → ASPIC+ evaluates
```

**Benefits**:
- ✅ Single attack modal (AttackCreationModal)
- ✅ ASPIC+ semantics front-and-center
- ✅ Gradual migration path (keep old button in AIFArgumentsListPro)
- ✅ Consistent with Phase F goals
- ✅ Reduces UI clutter in ArgumentCardV2

---

### Option B: Keep Both, Clarify Use Cases

**Rationale**: Different use cases for different modals

**AttackMenuProV2 Use Case**:
- Quick attacks from argument list view
- Familiar workflow for existing users
- Includes PropositionComposerPro integration

**AttackCreationModal Use Case**:
- ASPIC+ theory-driven attacks
- Educational (shows K_a/K_p/K_n semantics)
- Claim/argument detail panels

**Problems**:
- ❌ User confusion (which button to use?)
- ❌ Redundant code maintenance
- ❌ Inconsistent UX across application
- ❌ Two buttons for same action in ArgumentCardV2

---

### Option C: Merge into DialogueActionsModal ❌ **NOT RECOMMENDED**

**Rationale**: Add "Attacks" tab to DialogueActionsModal

**Problems**:
- ❌ DialogueActionsModal is already 600+ lines (complexity)
- ❌ Mixing dialogue protocol with direct attacks (conceptual mismatch)
- ❌ Attacks tab would duplicate WHY/GROUNDS functionality
- ❌ Violates single responsibility principle

---

## Proposed Architecture (Option A)

### Phase F Final State

**AIFArgumentsListPro Footer**:
```tsx
<footer className="flex flex-wrap items-center gap-2">
  <PreferenceQuick />                    // Preference attacks
  <AttackMenuProV2 />                    // ⚠️ Legacy (full deprecation warning)
  <CommunityDefenseMenu />               // Community defense
  <ClarificationRequestButton />         // Clarifications
  <SchemeSpecificCQsModal />             // Scheme CQs
  <PromoteToClaimButton />               // Promote
  <button>Share</button>                 // Copy link
</footer>
```

**ArgumentCardV2 Header**:
```tsx
<div className="flex items-center gap-2">
  <DialogueProvenanceBadge />           // Phase 3
  <StaleArgumentBadge />                // Phase 3
  <ConfidenceDisplay />                 // Phase 3
  <button>View Scheme</button>          // Scheme modal
  <CQStatusPill />                      // Claim CQs
  <DialogueActionsButton />             // Dialogue moves (WHY/GROUNDS/etc)
  <button>Attack</button>               // AttackCreationModal (ASPIC+ attacks)
  <CQStatusPill />                      // Argument CQs
</div>
```

**ClaimDetailPanel**:
```tsx
<ClaimContraryManager />               // Explicit contraries
<button>Create ASPIC+ Attack</button>  // AttackCreationModal
```

### Component Responsibilities

| Component | Responsibility | Target Type | API Endpoint |
|-----------|---------------|-------------|--------------|
| **AttackCreationModal** | Direct ASPIC+ attacks (UNDERMINES/REBUTS/UNDERCUTS) | Claim, Argument | `/api/ca` |
| **DialogueActionsModal** | Dialogue protocol moves (WHY/GROUNDS/CONCEDE/etc) | Claim, Argument, Premise | `/api/dialogue/move` |
| **SchemeSpecificCQsModal** | Scheme-based critical questions | Argument (scheme-aware) | `/api/dialogue/move` |
| **AttackMenuProV2** | ⚠️ Legacy attack creation (soft deprecated) | Argument | `/api/ca` |
| **CommunityDefenseMenu** | Community defense responses | Argument | `/api/dialogue/non-canonical-move` |
| **PreferenceQuick** | Preference-based defeats | Argument | `/api/preferences` |

---

## Implementation Roadmap (Option A)

### Immediate (Phase F Completion)

1. ✅ **Fix API Error**: Add GET handler to `/api/arguments/route.ts`
   - Accept `deliberationId` query param
   - Return arguments with id, text, conclusion
   
2. ✅ **Enhance AttackCreationModal**: Add PropositionComposerPro integration
   - "Create New Attacker" button
   - Embed PropositionComposerPro modal
   - On creation → refresh attackers dropdown → auto-select new attacker
   
3. ✅ **Remove AttackMenuProV2 from ArgumentCardV2**: 
   - Delete lines 688-707 (AttackMenuProV2 button)
   - Keep only AttackCreationModal button (lines 688-696 new version)
   
4. ✅ **Update AttackMenuProV2 Deprecation**: Add stronger warning
   - "This attack method is deprecated. Use the ASPIC+ Attack button for theory-aligned attacks."
   - Link to documentation

### Short-Term (Post Phase F)

5. **User Education**: Update documentation
   - When to use AttackCreationModal (ASPIC+ theory)
   - When to use DialogueActionsButton (dialogue protocol)
   - Migration guide from AttackMenuProV2

6. **Analytics**: Track usage
   - AttackMenuProV2 usage (should decline)
   - AttackCreationModal usage (should increase)
   - DialogueActionsModal usage (baseline)

### Long-Term (Phase G or later)

7. **Full Deprecation**: Remove AttackMenuProV2
   - Remove from AIFArgumentsListPro footer
   - Remove component file
   - Remove from codebase entirely

8. **Consolidation**: Simplify attack architecture
   - AttackCreationModal → Direct ASPIC+ attacks
   - DialogueActionsModal → Dialogue protocol (indirect attacks via WHY/GROUNDS)
   - SchemeSpecificCQsModal → Scheme-aware dialogue

---

## Decision Matrix

| Criterion | Option A (Enhance AttackCreationModal) | Option B (Keep Both) | Option C (Merge to DialogueActionsModal) |
|-----------|---------------------------------------|---------------------|----------------------------------------|
| **User Clarity** | ✅ Single attack button | ❌ Two attack buttons | ⚠️ Tab overload |
| **ASPIC+ Alignment** | ✅ Explicit semantics | ⚠️ Split semantics | ❌ Hidden in tabs |
| **Code Maintenance** | ✅ One modal to maintain | ❌ Two modals (duplicate logic) | ⚠️ One massive modal |
| **Migration Path** | ✅ Gradual (deprecate old) | ❌ No migration | ❌ Breaking change |
| **Backward Compatibility** | ✅ Keep old in AIFArgumentsListPro | ✅ Both coexist | ❌ Remove old entirely |
| **UI Consistency** | ✅ ASPIC+ button everywhere | ❌ Different buttons in different views | ⚠️ Dialogue button for attacks |
| **Complexity** | ⭐⭐ Low (enhance existing) | ⭐⭐⭐⭐ High (maintain both) | ⭐⭐⭐⭐⭐ Very High (massive modal) |

**Winner**: **Option A** (Enhance AttackCreationModal, deprecate AttackMenuProV2)

---

## Next Steps

1. **Confirm Approach**: Get user approval for Option A
2. **Fix API Error**: Implement GET `/api/arguments` handler
3. **Enhance AttackCreationModal**: Add PropositionComposerPro
4. **Remove Redundancy**: Delete AttackMenuProV2 from ArgumentCardV2
5. **Update Documentation**: User guide and migration path
6. **Test Phase F**: Verify attack creation workflow end-to-end
7. **Monitor Adoption**: Track AttackCreationModal usage vs AttackMenuProV2

---

## Success Metrics

- ✅ AttackCreationModal works from ArgumentCardV2 and ClaimDetailPanel
- ✅ Attacks appear in ASPIC+ evaluation tab
- ✅ Users understand ASPIC+ semantics (K_a/K_p/K_n)
- ✅ No 405 errors from attacker fetching
- ✅ PropositionComposerPro integration seamless
- ✅ AttackMenuProV2 usage declines over time
