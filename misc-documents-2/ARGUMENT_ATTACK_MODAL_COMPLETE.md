# Argument-Level Attack Modal - Implementation Complete ✅

## Overview

Implemented a unified **ArgumentAttackModal** at the ArgumentCardV2 header that provides full argument context for creating ASPIC+ attacks. This replaces the fragmented approach of having attack buttons scattered across individual ClaimDetailPanels.

## Problem Solved

### Before (Fragmented Approach)
```
ArgumentCardV2
├─ Conclusion (ClaimDetailPanel)
│  └─ Attack button (only sees conclusion claim)
├─ Premise 1 (ClaimDetailPanel)
│  └─ Attack button (only sees premise claim)
├─ Premise 2 (ClaimDetailPanel)
│  └─ Attack button (only sees premise claim)
└─ Inference (no attack context)
```

**Issues**:
- User has to expand sections to find attack options
- Attack UIs don't see the full argument structure
- REBUT button doesn't know about premises/scheme
- UNDERMINE button doesn't know about conclusion/scheme
- UNDERCUT has no natural home (inference section)
- Repetitive UI at each claim level

### After (Unified Approach) ✅
```
ArgumentCardV2
├─ HEADER
│  └─ [Attack] button → ArgumentAttackModal
│     ├─ Sees: Conclusion + All Premises + Scheme
│     ├─ REBUT: Auto-targets conclusion
│     ├─ UNDERMINE: Dropdown to select premise
│     └─ UNDERCUT: Targets argument/scheme
└─ Collapsible sections (cleaner)
```

**Benefits**:
- Single entry point for all attack types
- Full argument context available
- Intelligent target selection (auto-conclusion, dropdown premises)
- Clear ASPIC+ semantics in one place
- Cleaner UI (no duplicate buttons)

---

## Architecture

### New Component: `ArgumentAttackModal`

**File**: `components/arguments/ArgumentAttackModal.tsx`

**Purpose**: Argument-aware attack creation modal with ASPIC+ semantic guidance

**Props**:
```typescript
interface ArgumentAttackModalProps {
  deliberationId: string;
  argumentId: string;
  conclusion: { id: string; text: string };
  premises: Array<{ id: string; text: string }>;
  schemeKey?: string | null;
  schemeName?: string | null;
  onClose: () => void;
  onCreated?: () => void;
}
```

**Key Features**:
1. **Argument Context Card** - Shows full argument structure
2. **Smart Target Selection** - Auto-select or dropdown based on attack type
3. **Attack Type Education** - Clear ASPIC+ semantics with examples
4. **Unified Workflow** - All three attack types in one modal

---

## Attack Type Behaviors

### 1. REBUT (Attack Conclusion)

**Target**: Automatically targets the conclusion claim

**UI Flow**:
```
User selects REBUT
  ↓
Modal shows: "Target Conclusion: [conclusion.text]"
  ↓
User selects attacker (claim or argument)
  ↓
Creates ConflictApplication:
  - conflictedClaimId: conclusion.id
  - legacyTargetScope: "conclusion"
  - legacyAttackType: "REBUTS"
```

**Example**:
```
Argument: "P1: All men are mortal. Therefore: Socrates is mortal"
User clicks REBUT
Target automatically set to: "Socrates is mortal" (conclusion)
```

### 2. UNDERMINE (Attack Premise)

**Target**: User selects from dropdown of premises

**UI Flow**:
```
User selects UNDERMINE
  ↓
Modal shows dropdown:
  "2. Select Premise to Undermine"
  [ Premise 1: All men are mortal    ]
  [ Premise 2: Socrates is a man     ]
  ↓
User selects specific premise
  ↓
Modal shows: "Target Premise: [selected premise text]"
  ↓
User selects attacker
  ↓
Creates ConflictApplication:
  - conflictedClaimId: selectedPremiseId
  - legacyTargetScope: "premise"
  - legacyAttackType: "UNDERMINES"
```

**Special Handling**:
- If only 1 premise: Auto-select (no dropdown needed)
- If multiple premises: Dropdown shows all with "Premise N" labels
- Dropdown truncates long text: "Premise 1: All men are mort... (first 80 chars)"

**Example**:
```
Argument with 3 premises:
  P1: All men are mortal
  P2: Socrates is a man  
  P3: Historical records confirm Socrates existed
  
User clicks UNDERMINE
Dropdown appears with 3 options
User selects "Premise 2: Socrates is a man"
Target set to that premise claim
```

### 3. UNDERCUT (Attack Inference)

**Target**: Targets the argument itself (inference/scheme)

**UI Flow**:
```
User selects UNDERCUT
  ↓
Modal shows: "Undercut targets: inference"
  (No claim selection - targets reasoning itself)
  ↓
User selects attacker
  ↓
Creates ConflictApplication:
  - conflictedArgumentId: argumentId
  - legacyTargetScope: "inference"
  - legacyAttackType: "UNDERCUTS"
  - metaJson includes schemeKey/schemeName
```

**Example**:
```
Argument using "Modus Ponens" scheme:
  P1: If it rains, the ground is wet
  P2: It is raining
  → Therefore: The ground is wet

User clicks UNDERCUT
Target is the Modus Ponens inference itself
(Not P1, not P2, not conclusion - the reasoning rule)
```

---

## Integration with ArgumentCardV2

### Header Button

**Location**: ArgumentCardV2 header, after DialogueActionsButton

**Code** (lines ~680-690):
```tsx
{/* ASPIC+ Attack Button - Unified attack creation at argument level */}
<button
  onClick={() => setShowAttackModal(true)}
  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 transition-all cursor-pointer text-xs font-medium text-indigo-700"
  title="Create ASPIC+ attack (Rebut, Undermine, or Undercut)"
>
  <Swords className="w-3 h-3" />
  Attack
</button>
```

**Visual**:
```
┌─ ArgumentCardV2 Header ──────────────────────┐
│ ✓ Conclusion text                            │
│                                              │
│ [Dialogue] [⚔️ Attack] [CQ 66%] [Citations]  │
│                ↑                             │
│          Unified entry point                 │
└──────────────────────────────────────────────┘
```

### Modal Instantiation

**Location**: End of ArgumentCardV2, after DialogueMoveDetailModal

**Code** (lines ~1110-1130):
```tsx
{/* Argument-Level Attack Modal */}
{showAttackModal && (
  <ArgumentAttackModal
    deliberationId={deliberationId}
    argumentId={id}
    conclusion={conclusion}
    premises={premises}
    schemeKey={schemeKey || schemes[0]?.schemeKey}
    schemeName={schemeName || schemes[0]?.schemeName}
    onClose={() => setShowAttackModal(false)}
    onCreated={() => {
      onAnyChange?.();
      // Refetch attacks if section is expanded
      if (expandedSections.attacks) {
        setLoading(true);
      }
    }}
  />
)}
```

---

## Modal UI Structure

### Layout

```
┌──────────────────────────────────────────────────────┐
│ ⚔️  Create ASPIC+ Attack                       [X]   │
│    Challenge this argument with formal attack        │
├──────────────────────────────────────────────────────┤
│                                                      │
│ [Argument Context Card - Gray Background]           │
│ ┌──────────────────────────────────────────────┐   │
│ │ TARGET ARGUMENT                               │   │
│ │                                               │   │
│ │ Conclusion: Socrates is mortal                │   │
│ │                                               │   │
│ │ Premises:                                     │   │
│ │   1. All men are mortal                       │   │
│ │   2. Socrates is a man                        │   │
│ │                                               │   │
│ │ Inference Scheme: Modus Ponens                │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ 1. Select Attack Type                                │
│ ┌──────┐  ┌──────┐  ┌──────┐                       │
│ │ ⚔️   │  │ 🎯   │  │ 🔪   │                       │
│ │Rebut │  │Under │  │Under │                       │
│ │      │  │mine  │  │cut   │  ← Click to select   │
│ └──────┘  └──────┘  └──────┘                       │
│                                                      │
│ [Info Box - Attack type explanation]                │
│                                                      │
│ 2. Select Premise to Undermine (if UNDERMINE)       │
│ [Dropdown: Premise 1, Premise 2, ...]               │
│                                                      │
│ [Target Display - Shows selected target]            │
│                                                      │
│ 3. Select Attacker Type                              │
│ [Claim] [Argument] ← Toggle buttons                 │
│                                                      │
│ 4. Select Attacker Claim/Argument                    │
│ [Dropdown: List of claims or arguments]             │
│                                                      │
│ ┌──────────────────────────────────────────────┐   │
│ │ [Cancel]              [Create Rebut]          │   │
│ └──────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

### Color Coding

**Attack Type Cards**:
- **REBUTS**: Red theme (rose-50, rose-200, rose-700)
  - Icon: ⚔️
  - Description: "Challenge the conclusion claim"

- **UNDERMINES**: Purple theme (purple-50, purple-200, purple-700)
  - Icon: 🎯
  - Description: "Challenge a premise claim"

- **UNDERCUTS**: Amber theme (amber-50, amber-200, amber-700)
  - Icon: 🔪
  - Description: "Challenge the inference/scheme"

**Visual Feedback**:
- Selected attack type: Border highlight + colored background
- Info box: Colored border matching attack type
- Target display: Colored background matching attack type

---

## ASPIC+ Formal Alignment

### Attack Type Mapping

| User Action | ASPIC+ Concept | Target | Formal Definition |
|-------------|----------------|--------|-------------------|
| Select REBUT | Rebutting Attack | conc(B) | Attack on conclusion |
| Select UNDERMINE | Undermining Attack | φ ∈ Prem(B) | Attack on premise |
| Select UNDERCUT | Undercutting Attack | n(r) where r ∈ Rules(B) | Attack on inference rule |

### ConflictApplication Payload

**REBUT Example**:
```json
{
  "deliberationId": "delib-123",
  "conflictingClaimId": "claim-attacker",
  "conflictedClaimId": "claim-conclusion",
  "conflictedArgumentId": "arg-target",
  "legacyAttackType": "REBUTS",
  "legacyTargetScope": "conclusion",
  "metaJson": {
    "createdVia": "argument-attack-modal",
    "attackType": "REBUTS",
    "targetArgumentId": "arg-target",
    "schemeKey": "modus-ponens",
    "schemeName": "Modus Ponens"
  }
}
```

**UNDERMINE Example**:
```json
{
  "deliberationId": "delib-123",
  "conflictingClaimId": "claim-attacker",
  "conflictedClaimId": "claim-premise-2",
  "conflictedArgumentId": "arg-target",
  "legacyAttackType": "UNDERMINES",
  "legacyTargetScope": "premise",
  "metaJson": {
    "createdVia": "argument-attack-modal",
    "attackType": "UNDERMINES",
    "targetArgumentId": "arg-target",
    "schemeKey": "modus-ponens"
  }
}
```

**UNDERCUT Example**:
```json
{
  "deliberationId": "delib-123",
  "conflictingClaimId": "claim-attacker",
  "conflictedArgumentId": "arg-target",
  "legacyAttackType": "UNDERCUTS",
  "legacyTargetScope": "inference",
  "metaJson": {
    "createdVia": "argument-attack-modal",
    "attackType": "UNDERCUTS",
    "targetArgumentId": "arg-target",
    "schemeKey": "modus-ponens",
    "schemeName": "Modus Ponens"
  }
}
```

---

## User Experience Flow

### Example: Rebutting an Argument

```
1. User sees ArgumentCardV2 with conclusion "Socrates is mortal"
2. User clicks [⚔️ Attack] button in header
3. ArgumentAttackModal opens showing:
   - Full argument structure (conclusion, premises, scheme)
4. User clicks "Rebut" card (red theme)
5. Info box shows: "Rebut targets: conclusion"
   Target automatically set to: "Socrates is mortal"
6. User toggles to "Claim" attacker type
7. Dropdown populates with all claims in deliberation
8. User selects "All living things eventually die" (contradictory claim)
9. User clicks "Create Rebut"
10. ConflictApplication created, modal closes
11. ArgumentCardV2 updates to show attack badge
```

### Example: Undermining with Multiple Premises

```
1. User clicks [⚔️ Attack] on argument with 3 premises
2. ArgumentAttackModal shows all 3 premises in context card
3. User clicks "Undermine" card (purple theme)
4. Dropdown appears: "2. Select Premise to Undermine"
   Options:
   - Premise 1: All men are mortal
   - Premise 2: Socrates is a man
   - Premise 3: Historical records...
5. User selects "Premise 2: Socrates is a man"
6. Target display updates: "Target Premise: Socrates is a man"
7. User selects attacker claim: "Socrates may be fictional"
8. User clicks "Create Undermine"
9. ConflictApplication targets that specific premise claim
```

### Example: Undercutting Inference

```
1. User clicks [⚔️ Attack] on argument using "Argument from Expert"
2. ArgumentAttackModal shows scheme: "Argument from Expert"
3. User clicks "Undercut" card (amber theme)
4. Info shows: "Undercut targets: inference"
   (No claim dropdown - targets reasoning itself)
5. User selects attacker: "Expert biases can distort reasoning"
6. User clicks "Create Undercut"
7. ConflictApplication targets the argument's inference
8. Attack displayed in footer (argument-level, not claim-level)
```

---

## Educational Value

### ASPIC+ Concept Teaching

The modal teaches ASPIC+ attack semantics through:

1. **Visual Hierarchy**:
   - Argument structure displayed prominently
   - Attack types color-coded by target level
   - Clear labels: "Conclusion", "Premises", "Inference Scheme"

2. **Interactive Learning**:
   - Click REBUT → Target automatically shows conclusion
   - Click UNDERMINE → Dropdown reveals premise choices
   - Click UNDERCUT → No claim selection (teaches inference-level concept)

3. **Contextual Guidance**:
   - Info boxes explain each attack type
   - Examples: "Provide a contradictory conclusion claim"
   - Tooltips: "Undercut targets: inference"

4. **Consistent Vocabulary**:
   - Uses "Conclusion" not "Claim at end"
   - Uses "Premise" not "Input claim"
   - Uses "Inference Scheme" not "Rule"

---

## Technical Implementation Details

### State Management

**ArgumentCardV2.tsx**:
```typescript
const [showAttackModal, setShowAttackModal] = React.useState(false);
```

**ArgumentAttackModal.tsx**:
```typescript
const [attackType, setAttackType] = React.useState<AttackType>("REBUTS");
const [selectedPremiseId, setSelectedPremiseId] = React.useState<string>(premises[0]?.id || "");
const [attackerType, setAttackerType] = React.useState<"claim" | "argument">("claim");
const [selectedAttackerId, setSelectedAttackerId] = React.useState<string>("");
const [availableAttackers, setAvailableAttackers] = React.useState<any[]>([]);
```

### Data Fetching

**Attackers Dropdown**:
```typescript
React.useEffect(() => {
  const fetchAttackers = async () => {
    const endpoint = attackerType === "claim"
      ? `/api/deliberations/${deliberationId}/claims`
      : `/api/arguments?deliberationId=${deliberationId}`;
    
    const res = await fetch(endpoint);
    const data = await res.json();
    setAvailableAttackers(data.items || data || []);
  };
  fetchAttackers();
}, [deliberationId, attackerType]);
```

### Target Selection Logic

```typescript
let targetClaimId: string;
let targetScope: string;

if (attackType === "REBUTS") {
  targetClaimId = conclusion.id;        // Auto-select conclusion
  targetScope = "conclusion";
} else if (attackType === "UNDERMINES") {
  targetClaimId = selectedPremiseId;    // User-selected premise
  targetScope = "premise";
} else {
  targetClaimId = "";                   // No claim (targets argument)
  targetScope = "inference";
}
```

### Event Dispatch

```typescript
// Notify UI components of new attack
window.dispatchEvent(new CustomEvent("argument:attacked", { 
  detail: { argumentId, attackType } 
}));
```

---

## Comparison to Old Approach

### Old: ClaimDetailPanel Attack Buttons

**Problems**:
1. **Fragmented Context** - Each ClaimDetailPanel only knows about its claim
2. **No Argument Awareness** - Can't see premises when rebutting conclusion
3. **Redundant UI** - Identical attack buttons repeated for each claim
4. **Poor UNDERCUT Support** - Inference section has no natural attack entry point
5. **Educational Gap** - User doesn't see attack types in relation to argument structure

**Old Flow**:
```
Expand conclusion ClaimDetailPanel
  → Click "Create ASPIC+ Attack"
  → AttackCreationModal opens
  → Only sees conclusion claim (no premises/scheme context)
  → Creates attack

Expand premise 1 ClaimDetailPanel
  → Click "Create ASPIC+ Attack"
  → AttackCreationModal opens
  → Only sees premise 1 claim (no conclusion/scheme context)
  → Creates attack
```

### New: ArgumentAttackModal at Header

**Advantages**:
1. **Full Argument Context** - Sees conclusion, all premises, and scheme
2. **Smart Target Selection** - Auto-select conclusion, dropdown for premises
3. **Single Entry Point** - One button instead of N+1 buttons (conclusion + N premises)
4. **Natural UNDERCUT Home** - Argument-level modal naturally supports inference attacks
5. **Educational** - User sees full structure before choosing attack type

**New Flow**:
```
Click [⚔️ Attack] in header
  → ArgumentAttackModal opens
  → Sees: Conclusion + All Premises + Scheme
  → Chooses attack type:
    - REBUT → Auto-targets conclusion
    - UNDERMINE → Dropdown to select premise
    - UNDERCUT → Targets argument/scheme
  → Creates attack with full context
```

---

## Files Modified

### 1. `components/arguments/ArgumentAttackModal.tsx` (NEW)
- **Lines**: 351 total
- **Purpose**: Argument-aware attack creation modal
- **Key Features**:
  - Argument context card display
  - Smart target selection (auto-select vs dropdown)
  - ASPIC+ educational guidance
  - Unified workflow for all three attack types

### 2. `components/arguments/ArgumentCardV2.tsx` (MODIFIED)
- **Import added** (line 24):
  ```typescript
  import { ArgumentAttackModal } from "./ArgumentAttackModal";
  ```
- **Button added** (lines ~680-690):
  ```tsx
  <button onClick={() => setShowAttackModal(true)}>
    <Swords /> Attack
  </button>
  ```
- **Modal instantiation** (lines ~1110-1130):
  ```tsx
  {showAttackModal && (
    <ArgumentAttackModal
      deliberationId={deliberationId}
      argumentId={id}
      conclusion={conclusion}
      premises={premises}
      schemeKey={schemeKey || schemes[0]?.schemeKey}
      schemeName={schemeName || schemes[0]?.schemeName}
      onClose={() => setShowAttackModal(false)}
      onCreated={() => { onAnyChange?.(); }}
    />
  )}
  ```

---

## Testing Checklist

### Visual Testing
- [ ] Attack button appears in ArgumentCardV2 header
- [ ] Button has Swords icon and "Attack" label
- [ ] Button opens ArgumentAttackModal on click
- [ ] Modal shows full argument structure (conclusion, premises, scheme)
- [ ] Three attack type cards display correctly (Rebut, Undermine, Undercut)
- [ ] Attack type selection highlights correctly
- [ ] Info boxes update when attack type changes

### Functional Testing - REBUT
- [ ] Select REBUT → Conclusion automatically targeted
- [ ] Target display shows: "Target Conclusion: [conclusion.text]"
- [ ] No premise dropdown appears
- [ ] Attacker selection works (claims and arguments)
- [ ] Submit creates ConflictApplication with:
  - `conflictedClaimId`: conclusion.id
  - `legacyTargetScope`: "conclusion"
  - `legacyAttackType`: "REBUTS"

### Functional Testing - UNDERMINE
- [ ] Select UNDERMINE with single premise → Premise auto-selected
- [ ] Select UNDERMINE with multiple premises → Dropdown appears
- [ ] Premise dropdown shows all premises with labels
- [ ] Long premise text truncates to 80 chars
- [ ] Selecting premise updates target display
- [ ] Submit creates ConflictApplication with:
  - `conflictedClaimId`: selected premise id
  - `legacyTargetScope`: "premise"
  - `legacyAttackType`: "UNDERMINES"

### Functional Testing - UNDERCUT
- [ ] Select UNDERCUT → No claim selection UI
- [ ] Info shows: "Undercut targets: inference"
- [ ] Attacker selection works
- [ ] Submit creates ConflictApplication with:
  - `conflictedArgumentId`: argumentId
  - `legacyTargetScope`: "inference"
  - `legacyAttackType`: "UNDERCUTS"

### Integration Testing
- [ ] Modal closes on successful submission
- [ ] `onCreated` callback triggers ArgumentCardV2 refresh
- [ ] New attack appears in attacks section
- [ ] Attack counts update in header/footer
- [ ] Event "argument:attacked" dispatched correctly

### Edge Cases
- [ ] Argument with no premises → UNDERMINE disabled or shows message
- [ ] Argument with no scheme → UNDERCUT still works (targets argument)
- [ ] No available attackers → Dropdown shows "No claims/arguments"
- [ ] Submit without selecting attacker → Shows error
- [ ] API error → Shows error message without crashing

---

## Future Enhancements

### Phase 1: Attack Preview
Show preview of what will be created before submission:
```
[Preview Box]
Attack: REBUT
Attacker: "All living things eventually die" (claim)
Target: "Socrates is mortal" (conclusion)
This will create a rebutting attack challenging the conclusion.
```

### Phase 2: Visual Argument Diagram
Show clickable diagram:
```
    ┌─────────┐
    │  P1     │ ← Click to undermine
    └────┬────┘
         │
    ┌────▼────┐
    │  P2     │ ← Click to undermine
    └────┬────┘
         │
    ┌────▼────┐
    │ Scheme  │ ← Click to undercut
    └────┬────┘
         │
    ┌────▼────┐
    │  Conc   │ ← Click to rebut
    └─────────┘
```

### Phase 3: Attack Templates
Pre-fill common attack patterns:
```
UNDERMINE Templates:
- "This premise lacks evidence"
- "This premise is outdated"
- "This premise is biased"

UNDERCUT Templates:
- "This inference assumes X"
- "This scheme doesn't apply when Y"
- "Exception: Z"
```

### Phase 4: Compound Attacks
Allow creating multiple attacks at once:
```
[ ] Undermine Premise 1
[ ] Undermine Premise 2
[✓] Rebut Conclusion

Create 3 attacks simultaneously
```

### Phase 5: Attack Strength Indicator
Show how strong the attack would be:
```
Attacker Claim: "X" (confidence: 85%)
Target Claim: "Y" (confidence: 60%)
Expected Attack Strength: Medium
```

---

## Success Metrics

✅ **Implementation Complete**:
- ArgumentAttackModal created (351 lines)
- ArgumentCardV2 integrated (2 changes)
- Zero TypeScript errors
- All ASPIC+ attack types supported

✅ **User Experience**:
- Single entry point for attacks
- Full argument context visible
- Smart target selection
- Educational ASPIC+ guidance

✅ **ASPIC+ Alignment**:
- Formal attack type semantics preserved
- Correct target selection (conclusion/premise/inference)
- Proper ConflictApplication payload structure

✅ **Code Quality**:
- Clean component separation
- Reusable ArgumentAttackModal
- No breaking changes to existing code
- Event-based UI updates

---

## Conclusion

The ArgumentAttackModal successfully unifies attack creation at the argument level, providing full structural context and intelligent target selection. This architecture aligns with ASPIC+ formal theory while improving user experience through educational guidance and streamlined workflow.

**Key Achievement**: Users can now create all three ASPIC+ attack types (rebut, undermine, undercut) from a single, context-aware interface that teaches formal argumentation concepts through its design.
