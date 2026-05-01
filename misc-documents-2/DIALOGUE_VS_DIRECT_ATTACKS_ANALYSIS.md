# Dialogue Protocol vs Direct Attacks: Theoretical & Architectural Analysis

**Date**: November 7, 2025  
**Context**: Phase F implementation - Understanding attack creation pathways  
**Question**: Are CQ-based attacks complementary or alternative to direct ASPIC+ attacks?

---

## Executive Summary

**Short Answer**: Critical Questions (CQs) and direct ASPIC+ attacks are **COMPLEMENTARY, not either/or**.

**Why AttackMenuProV2 was soft deprecated**:
- **NOT because CQs replace direct attacks**
- **BECAUSE scheme-based attacks should use scheme-aware CQs** (educational + provenance)
- Direct attacks still needed for ad-hoc arguments without schemes

**Optimal Architecture**:
- **DialogueActionsModal** → Protocol moves (WHY/GROUNDS/CONCEDE) for **any target** (claim, premise, argument)
- **AttackCreationModal** (or enhanced AttackMenuProV2) → Direct ASPIC+ attacks for **arguments only**
- **SchemeSpecificCQsModal** → Scheme-aware CQs for **scheme-based arguments only**

---

## Part 1: Theoretical Distinctions

### 1.1 DialogueActionsModal (Dialogue Protocol Moves)

**Theoretical Foundation**: Walton's dialogue systems + formal dialectic

**Purpose**: Structured argumentation through dialogue protocol

**Metaphor**: **Legal proceedings** - participants make moves according to rules

**Attack Types** (Indirect):
1. **WHY move** → "Challenge the justification"
   - Creates obligation to provide GROUNDS
   - If unanswered → argument weakened
   - Can be CQ-specific (scheme-aware) or generic
   
2. **GROUNDS move** → "Provide evidence/reasoning"
   - Fulfills WHY obligation
   - Can include counter-claim (creates REBUTS attack)
   - Can challenge premise (creates UNDERMINES attack)
   
3. **CONCEDE move** → "Accept opponent's claim"
   - Terminates challenge branch
   - No attack created (agreement)

**ASPIC+ Integration Path**:
```
WHY DialogueMove
  ↓
Creates obligation (tracked in CQStatus or dialogue state)
  ↓
Opponent posts GROUNDS DialogueMove
  ↓
GROUNDS may create Claim (objection)
  ↓
ConflictApplication created (attackType from context)
  ↓
aspicAttackType computed via computeAspicConflictMetadata()
  ↓
AIF CA-node created
  ↓
ASPIC+ attack in theory graph
```

**Key Characteristics**:
- ✅ **Educational**: Makes dialectical structure explicit
- ✅ **Provenance**: Full dialogue history preserved
- ✅ **Scheme-Aware**: CQs map to specific argument schemes
- ✅ **Protocol-Driven**: Structured turn-taking
- ✅ **Granular Targeting**: Can target individual premises (element-level)
- ⚠️ **Indirect**: Attacks emerge from dialogue, not created directly
- ⚠️ **Complex**: Multiple steps (WHY → GROUNDS → ConflictApplication)

**Use Cases**:
- Scheme-based arguments (argumentation pedagogy)
- Structured debates with explicit protocol
- Educational contexts (students learning argumentation)
- Cross-deliberation discourse (formal dialogue systems)

**Current Integration**:
- **DialogueActionsButton** in ArgumentCardV2 header (per conclusion, per premise)
- **SchemeSpecificCQsModal** in AIFArgumentsListPro footer (per argument, scheme-aware)
- **CriticalQuestionsV3** embedded in ArgumentCardV2 (inline CQ panel)

---

### 1.2 AttackCreationModal / AttackMenuProV2 (Direct ASPIC+ Attacks)

**Theoretical Foundation**: ASPIC+ formal argumentation theory

**Purpose**: Direct creation of ASPIC+ attacks without dialogue wrapper

**Metaphor**: **Military engagement** - direct attacks on argument structures

**Attack Types** (Direct):
1. **UNDERMINES** → Attack ordinary premise (K_p)
   - **ASPIC+ Semantics**: Succeeds unless premise preference B' ≺' A
   - **K_a Special Case**: Always succeeds (weak premises)
   - **K_n Protection**: Cannot undermine axioms
   
2. **REBUTS** → Attack defeasible conclusion
   - **ASPIC+ Semantics**: Succeeds unless rule preference B' ≺ A
   - **Restriction**: Cannot rebut strict conclusions
   
3. **UNDERCUTS** → Attack inference rule applicability
   - **ASPIC+ Semantics**: Always succeeds (preference-independent)
   - **Rationale**: Challenging rule applicability defeats stronger arguments

**ASPIC+ Integration Path**:
```
User selects attack type (UNDERMINES/REBUTS/UNDERCUTS)
  ↓
User selects or creates attacker (Claim or Argument)
  ↓
ConflictApplication created DIRECTLY
  ↓
aspicAttackType = user's selection
  ↓
aspicDefeatStatus computed from preferences
  ↓
AIF CA-node created
  ↓
ASPIC+ attack in theory graph
```

**Key Characteristics**:
- ✅ **Direct**: One-step attack creation
- ✅ **ASPIC+ Explicit**: K_a/K_p/K_n semantics visible to user
- ✅ **Fast**: Minimal clicks to create attack
- ✅ **Theory-Aligned**: Directly maps to ASPIC+ attack types
- ⚠️ **No Dialogue Provenance**: Bypasses DialogueMove system
- ⚠️ **Not Scheme-Aware**: Generic attacks (no CQ context)
- ⚠️ **Argument-Level Only**: Cannot target individual premises (current implementation)

**Use Cases**:
- Ad-hoc arguments without schemes
- Quick attacks in exploratory deliberations
- Expert users who understand ASPIC+ theory
- Computational experiments (batch attack creation)

**Current Integration**:
- **AttackMenuProV2** in AIFArgumentsListPro footer (per argument)
- **AttackMenuProV2** in ArgumentCardV2 header (just added Phase F) ← **REDUNDANT with AttackCreationModal**
- **AttackCreationModal** in ClaimDetailPanel (per claim)
- **AttackCreationModal** in ArgumentCardV2 header (just added Phase F)

---

### 1.3 Comparison Matrix

| Dimension | DialogueActionsModal | AttackCreationModal | SchemeSpecificCQsModal |
|-----------|---------------------|---------------------|----------------------|
| **Theoretical Basis** | Walton dialogue systems | ASPIC+ attack theory | Walton CQ templates |
| **Abstraction Level** | Dialogue protocol (high) | Formal attack (low) | Scheme-specific (medium) |
| **ASPIC+ Mapping** | Indirect (WHY/GROUNDS → attacks) | Direct (1:1 attack creation) | Indirect (CQ → WHY → GROUNDS → attacks) |
| **Provenance** | Full dialogue history | Minimal (just ConflictApplication) | Full (CQ → DialogueMove → CA) |
| **Educational Value** | ⭐⭐⭐⭐⭐ (teaches dialectic) | ⭐⭐ (shows theory) | ⭐⭐⭐⭐⭐ (teaches schemes + CQs) |
| **Speed** | ⭐⭐ (multi-step) | ⭐⭐⭐⭐⭐ (one-step) | ⭐⭐⭐ (CQ selection + objection) |
| **Scheme Awareness** | ⚠️ CQs tab only | ❌ No | ✅ Yes (CQ templates) |
| **Granularity** | ✅ Element-level (premises) | ⚠️ Argument-level only | ⚠️ Argument-level only |
| **Target Types** | Claim, Premise, Argument | Argument (AttackMenuProV2), Claim (AttackCreationModal) | Argument only |
| **Attack Metaphor** | Legal obligation | Military strike | Critical inquiry |
| **User Expertise** | Intermediate (knows dialogue) | Advanced (knows ASPIC+) | Beginner (guided by CQs) |

---

## Part 2: Why AttackMenuProV2 Was Soft Deprecated

### 2.1 Original Problem (Pre-Phase 6)

**User Confusion**:
```
Scheme-Based Argument Card
  ↓
User sees TWO attack options:
  1. "Challenge Argument" button → AttackMenuProV2 (generic attacks)
  2. "Critical Questions" button → SchemeSpecificCQsModal (scheme-specific)
  ↓
Which to use? 🤔
```

**Issue**: AttackMenuProV2 provides generic REBUTS/UNDERCUTS/UNDERMINES without scheme context. For scheme-based arguments, this bypasses the **educational value** of scheme-specific CQs.

**Example**:
- **Argument from Analogy**: "COVID is like flu, so we should treat it similarly"
- **AttackMenuProV2 approach**: User posts generic REBUTS attack
- **SchemeSpecificCQsModal approach**: User asks CQ "Are there critical differences?" (scheme-aware)

The CQ approach is **pedagogically superior** because it:
1. Teaches users **why** analogies can fail (critical differences CQ)
2. Creates **structured provenance** (CQ → WHY move → GROUNDS objection)
3. Enables **scheme-specific reasoning** (analogy template guides thinking)

### 2.2 Phase 6 Solution

**Soft Deprecation Strategy**:
```typescript
// AttackMenuProV2.tsx (Phase 6 warning banner)
⚠️ DEPRECATION NOTICE
This attack menu provides generic attacks. For scheme-based arguments,
consider using Critical Questions instead for richer provenance and
educational value.

[Learn More] [Use CQs Instead]
```

**Key Points**:
- ✅ **NOT removing AttackMenuProV2 entirely**
- ✅ **Guiding users** toward scheme-aware CQs for scheme-based arguments
- ✅ **Preserving backward compatibility** (AttackMenuProV2 still works)
- ✅ **Keeping direct attacks** for ad-hoc arguments without schemes

### 2.3 Intended User Flow (Post-Phase 6)

**Scheme-Based Argument**:
```
User sees argument with "Argument from Analogy" scheme
  ↓
User clicks "Critical Questions" button (recommended)
  ↓
SchemeSpecificCQsModal opens with CQ templates
  ↓
User asks CQ "Are there critical differences?"
  ↓
WHY DialogueMove created with cqKey: "critical_diffs"
  ↓
User provides GROUNDS objection "COVID has much higher mortality"
  ↓
GROUNDS DialogueMove + ConflictApplication created
  ↓
ASPIC+ attack type: UNDERMINES (attacks premise analogy holds)
  ↓
Full provenance: CQ → WHY → GROUNDS → CA → ASPIC+
```

**Ad-Hoc Argument (No Scheme)**:
```
User sees argument without scheme
  ↓
User clicks "Challenge Argument" button (AttackMenuProV2)
  ↓
AttackMenuProV2 opens (no deprecation warning)
  ↓
User selects REBUTS attack type
  ↓
User picks/creates counter-claim
  ↓
ConflictApplication created directly
  ↓
ASPIC+ attack type: REBUTS
  ↓
Minimal provenance: CA → ASPIC+
```

---

## Part 3: Are CQs and Direct Attacks Complementary?

### 3.1 YES - They Serve Different Purposes

**Critical Questions (via DialogueActionsModal / SchemeSpecificCQsModal)**:

**Purpose**: **Educational argumentation** with structured provenance

**When to Use**:
- ✅ Scheme-based arguments (pedagogy)
- ✅ Formal debates with protocol
- ✅ Cross-deliberation discourse
- ✅ Learning argumentation theory
- ✅ Targeting individual premises (element-level via DialogueActionsButton)

**ASPIC+ Integration**: Indirect (WHY → GROUNDS → ConflictApplication)

**Provenance**: Full dialogue history (CQ → DialogueMove → LudicAct → AifNode → ASPIC+)

---

**Direct Attacks (via AttackCreationModal / AttackMenuProV2)**:

**Purpose**: **Fast ASPIC+ attack creation** for expert users

**When to Use**:
- ✅ Ad-hoc arguments without schemes
- ✅ Quick exploratory attacks
- ✅ Computational experiments
- ✅ Users who understand ASPIC+ theory
- ✅ Batch operations (future: API-driven attack creation)

**ASPIC+ Integration**: Direct (ConflictApplication → ASPIC+)

**Provenance**: Minimal (just ConflictApplication record)

---

### 3.2 Complementary Relationship

**Example Scenario**: Challenging an Argument from Analogy

**Option A: CQ-Based Attack (Educational)**
```
1. User asks CQ "Are there critical differences?" (WHY move)
   → Creates CQStatus, DialogueMove
   
2. User provides objection "COVID mortality 10x higher than flu" (GROUNDS move)
   → Creates Claim, ConflictApplication, DialogueMove
   
3. ASPIC+ evaluates:
   → Attack type: UNDERMINES (attacks analogy premise)
   → Provenance: CQ "critical_diffs" → WHY → GROUNDS → CA
   
4. User learns:
   → Why analogies fail (critical differences)
   → How to structure objections (CQ templates)
   → Dialogue protocol (WHY/GROUNDS)
```

**Option B: Direct Attack (Fast)**
```
1. User clicks "Attack" button
   → AttackCreationModal opens
   
2. User selects UNDERMINES attack type
   → Sees ASPIC+ explanation: "Attack premise (K_p needs preference, K_a always succeeds)"
   
3. User selects attacking claim "COVID is 10x deadlier"
   → Creates ConflictApplication directly
   
4. ASPIC+ evaluates:
   → Attack type: UNDERMINES
   → Provenance: CA only (no CQ, no dialogue)
   
5. User learns:
   → ASPIC+ attack semantics (K_a/K_p/K_n)
   → Direct theory application
   → (But misses scheme-specific reasoning)
```

**Both are valid!** The choice depends on:
- **User expertise**: Beginners → CQs, Experts → Direct
- **Context**: Scheme-based → CQs, Ad-hoc → Direct
- **Goal**: Learning → CQs, Speed → Direct

---

## Part 4: Architectural Recommendations

### 4.1 Current Redundancy Problem

**ArgumentCardV2 header currently has** (after Phase F):
```tsx
<DialogueActionsButton />      // WHY/GROUNDS/CONCEDE (dialogue protocol)
<AttackMenuProV2 />           // REBUTS/UNDERCUTS/UNDERMINES (legacy)
<AttackCreationModal />       // UNDERMINES/REBUTS/UNDERCUTS (new, ASPIC+ focused)
```

**Problem**: **THREE ways to create attacks** in the same header!

### 4.2 Recommended Architecture

#### Option 1: Keep Separation by Purpose ✅ **RECOMMENDED**

**ArgumentCardV2 Header** (element-level actions on conclusion claim):
```tsx
<DialogueProvenanceBadge />    // Phase 3 provenance
<StaleArgumentBadge />         // Phase 3 temporal decay
<ConfidenceDisplay />          // Phase 3 confidence
<button>View Scheme</button>   // Scheme modal
<CQStatusPill />               // Claim-level CQs
<DialogueActionsButton         // Dialogue protocol (WHY/GROUNDS/CONCEDE/THEREFORE/etc)
  deliberationId={deliberationId}
  targetType="claim"
  targetId={conclusion.id}
  label="Dialogue"
  variant="compact"
/>
```

**AIFArgumentsListPro Footer** (argument-level actions):
```tsx
<PreferenceQuick />                    // Preference attacks
<AttackCreationModal />                // Direct ASPIC+ attacks (RECOMMENDED)
  OR
<AttackMenuProV2 />                    // Legacy (if keeping during transition)

<CommunityDefenseMenu />               // Community defense
<ClarificationRequestButton />         // Clarifications
<SchemeSpecificCQsModal />             // Scheme-specific CQs
<PromoteToClaimButton />               // Promote
<button>Share</button>                 // Copy link
```

**Rationale**:
- **DialogueActionsButton**: Element-level dialogue moves (claim, premise targeting)
- **AttackCreationModal OR AttackMenuProV2**: Argument-level direct attacks
- **SchemeSpecificCQsModal**: Argument-level scheme-aware CQs
- **NO duplication**: Each button serves distinct purpose

---

#### Option 2: Consolidate All Attacks in DialogueActionsModal ❌ **NOT RECOMMENDED**

**Problem**: DialogueActionsModal already has 3 tabs (Protocol/Structural/CQs). Adding "Attacks" tab:
- ❌ Violates single responsibility (dialogue protocol vs direct attacks)
- ❌ Increases complexity (600+ lines → 800+ lines)
- ❌ Conceptual mismatch (dialogue moves ≠ direct attacks)
- ❌ User confusion (mixing metaphors)

---

#### Option 3: Make AttackCreationModal Element-Aware ⭐ **ALTERNATIVE**

**Enhance AttackCreationModal to target**:
- Claims (current: ✅ works in ClaimDetailPanel)
- Arguments (current: ✅ works in ArgumentCardV2)
- **NEW: Individual premises** (element-level targeting)

**Implementation**:
```tsx
<AttackCreationModal
  deliberationId={deliberationId}
  targetType="premise"           // NEW: Support premise targeting
  targetId={premise.id}
  targetText={premise.text}
  onClose={() => ...}
  onCreated={() => ...}
/>
```

**Benefits**:
- ✅ **Unified attack interface** across all granularities
- ✅ **ASPIC+ semantics** for all attacks
- ✅ **Reduces button clutter** (one attack button per element)
- ⚠️ **Competes with DialogueActionsButton** (both can target premises)

**Differentiation**:
- **DialogueActionsButton**: Dialogue protocol (WHY/GROUNDS) → **process-oriented**
- **AttackCreationModal**: Direct ASPIC+ attacks → **outcome-oriented**

---

### 4.3 Final Recommendation

**Keep DialogueActionsButton AND AttackCreationModal as complementary**:

**DialogueActionsButton** (Element-Level Dialogue):
- **Where**: ArgumentCardV2 header (per conclusion claim)
- **Where**: ArgumentCardV2 premises section (per premise) ← **ADD THIS**
- **Purpose**: Structured dialogue protocol (WHY/GROUNDS/CONCEDE/etc)
- **Targets**: Individual elements (claim, premise)
- **Metaphor**: Legal/dialectical
- **Users**: Intermediate (understands dialogue)

**AttackCreationModal** (Argument-Level Direct Attacks):
- **Where**: AIFArgumentsListPro footer (per argument)
- **Where**: ClaimDetailPanel (per claim)
- **Purpose**: Fast ASPIC+ attack creation
- **Targets**: Whole arguments or claims
- **Metaphor**: Military/theoretical
- **Users**: Experts (understands ASPIC+)

**SchemeSpecificCQsModal** (Argument-Level CQs):
- **Where**: AIFArgumentsListPro footer (per argument, if scheme exists)
- **Purpose**: Scheme-aware critical questioning
- **Targets**: Whole arguments
- **Metaphor**: Socratic inquiry
- **Users**: Beginners (guided by CQ templates)

**Remove**:
- ❌ AttackMenuProV2 from ArgumentCardV2 header (redundant with AttackCreationModal)
- ❌ AttackMenuProV2 from AIFArgumentsListPro footer (replace with AttackCreationModal after transition period)

---

## Part 5: Implementation Plan

### Phase F Immediate (This Session)

1. ✅ **Remove AttackMenuProV2 from ArgumentCardV2**
   - Delete lines 688-707 (AttackMenuProV2 button + modal)
   - Keep only AttackCreationModal button
   
2. ✅ **Fix AttackCreationModal API Error**
   - Add GET handler to `/api/arguments/route.ts`
   - Return arguments with deliberationId filter
   
3. ✅ **Enhance AttackCreationModal**
   - Add PropositionComposerPro integration (create new attackers)
   - Improve ASPIC+ semantic explanations

4. ⏳ **Add DialogueActionsButton to Premises**
   - In ArgumentCardV2, add DialogueActionsButton to each premise
   - Enable element-level dialogue moves (WHY/GROUNDS per premise)

### Phase F+ (Post-Testing)

5. **User Testing**: Validate complementary workflow
   - Beginners → SchemeSpecificCQsModal → CQ-driven attacks
   - Intermediate → DialogueActionsButton → WHY/GROUNDS dialogue
   - Advanced → AttackCreationModal → Direct ASPIC+ attacks

6. **Documentation**: Update user guides
   - When to use CQs vs dialogue vs direct attacks
   - ASPIC+ theory explanations for each attack type
   - Provenance benefits of CQ/dialogue path

7. **Analytics**: Track usage patterns
   - SchemeSpecificCQsModal usage (should be high for scheme-based args)
   - DialogueActionsButton usage (should be high for element-level moves)
   - AttackCreationModal usage (should be moderate for ad-hoc args)

### Phase G (Full Deprecation)

8. **Remove AttackMenuProV2 Entirely**
   - Remove from AIFArgumentsListPro footer
   - Delete component file
   - Update all references to AttackCreationModal

---

## Part 6: User Mental Models

### 6.1 Three User Personas

**Persona 1: Socratic Sam (Beginner)**
- **Goal**: Learn argumentation by doing
- **Tool**: SchemeSpecificCQsModal
- **Workflow**: "I see 'Argument from Analogy' → Click 'Critical Questions' → Ask 'Are there critical differences?' → Provide objection"
- **Learning**: Scheme templates guide reasoning

**Persona 2: Dialectic Dana (Intermediate)**
- **Goal**: Engage in structured dialogue
- **Tool**: DialogueActionsButton
- **Workflow**: "I challenge this premise → Click 'Dialogue' → Select WHY → Opponent provides GROUNDS → I CONCEDE or continue"
- **Learning**: Dialogue protocol structures debate

**Persona 3: Theory Tom (Expert)**
- **Goal**: Fast ASPIC+ experimentation
- **Tool**: AttackCreationModal
- **Workflow**: "This argument has weak assumption → Click 'Attack' → Select UNDERMINES → Pick attacking claim → Done"
- **Learning**: ASPIC+ semantics (K_a always succeeds)

**All three are valid!** System supports all workflows.

---

### 6.2 Attack Pathway Comparison

**CQ-Based Attack** (Socratic Sam):
```
Argument from Analogy: "COVID is like flu"
  ↓
Ask CQ: "Are there critical differences?"
  → WHY DialogueMove created
  → CQStatus: open
  ↓
Provide Objection: "COVID mortality 10x higher"
  → GROUNDS DialogueMove created
  → Claim created
  → ConflictApplication created (aspicAttackType: undermining)
  → CQStatus: answered
  ↓
ASPIC+ Evaluation:
  → Attack: UNDERMINES premise "COVID is like flu"
  → Provenance: CQ "critical_diffs" → WHY → GROUNDS → CA
  → User sees: "Critical difference found (mortality rate)"
```

**Dialogue-Based Attack** (Dialectic Dana):
```
Argument premise: "COVID has low mortality"
  ↓
Click "Dialogue" on premise
  → DialogueActionsModal opens
  ↓
Select WHY move: "Why should we accept this?"
  → WHY DialogueMove created
  → Obligation created (opponent must provide GROUNDS)
  ↓
Opponent provides GROUNDS: "CDC data shows 1% mortality"
  → GROUNDS DialogueMove created
  → Claim created
  → No conflict (accepted)
  ↓
OR User provides counter-GROUNDS: "Actually 3% in elderly"
  → GROUNDS DialogueMove created
  → Claim created
  → ConflictApplication created (aspicAttackType: undermining)
  ↓
ASPIC+ Evaluation:
  → Attack: UNDERMINES premise "low mortality"
  → Provenance: WHY → GROUNDS → CA
  → Dialogue continues (structured back-and-forth)
```

**Direct Attack** (Theory Tom):
```
Argument premise: "Assume GDP growth continues"
  ↓
Click "Attack" on argument
  → AttackCreationModal opens
  ↓
Select UNDERMINES attack type
  → Sees explanation: "Attack premise (K_a always succeeds)"
  ↓
Toggle attacker type: Claim
  ↓
Select attacking claim: "Economic recession likely"
  → ConflictApplication created (aspicAttackType: undermining)
  ↓
ASPIC+ Evaluation:
  → Attack: UNDERMINES assumption (K_a)
  → Defeats premise (K_a undermining always succeeds)
  → Argument labeled OUT
  → No dialogue provenance (direct attack)
```

---

## Part 7: Answers to Your Questions

### Q1: How do DialogueActionsModal and AttackCreationModal differ?

**Short Answer**:
- **DialogueActionsModal** = Process-oriented (dialogue protocol)
- **AttackCreationModal** = Outcome-oriented (direct ASPIC+ attacks)

**Long Answer**:

**DialogueActionsModal**:
- **Abstraction**: High-level dialogue moves (WHY, GROUNDS, CONCEDE)
- **ASPIC+ Mapping**: Indirect (moves → ConflictApplications → attacks)
- **Provenance**: Full dialogue history (DialogueMove chain)
- **Granularity**: Element-level (can target individual premises)
- **Educational**: Teaches dialectical structure
- **Speed**: Slower (multi-step process)
- **Use Case**: Structured debates, education, scheme-based arguments

**AttackCreationModal**:
- **Abstraction**: Low-level ASPIC+ attacks (UNDERMINES, REBUTS, UNDERCUTS)
- **ASPIC+ Mapping**: Direct (1:1 attack creation)
- **Provenance**: Minimal (just ConflictApplication)
- **Granularity**: Argument-level (current) or claim-level
- **Educational**: Teaches ASPIC+ theory (K_a/K_p/K_n)
- **Speed**: Fast (one-step creation)
- **Use Case**: Ad-hoc arguments, expert users, quick exploration

---

### Q2: Should CQ attacks be additive/complementary to direct attacks?

**YES - They are complementary, not either/or.**

**Why AttackMenuProV2 was soft deprecated**:
- **NOT** because CQs replace all attacks
- **BECAUSE** scheme-based attacks should use scheme-aware CQs (better pedagogy)
- Direct attacks still needed for:
  - Ad-hoc arguments without schemes
  - Expert users who understand ASPIC+ theory
  - Quick exploratory attacks

**Complementary Use Cases**:

| Scenario | Recommended Tool | Why |
|----------|-----------------|-----|
| Argument from Analogy (scheme) | SchemeSpecificCQsModal | CQs teach why analogies fail |
| Ad-hoc claim with no scheme | AttackCreationModal | No CQs available, direct attack faster |
| Individual premise challenge | DialogueActionsButton | Element-level WHY/GROUNDS dialogue |
| Expert ASPIC+ experiment | AttackCreationModal | Direct theory application |
| Student learning argumentation | SchemeSpecificCQsModal | Guided by CQ templates |
| Cross-deliberation dialogue | DialogueActionsButton | Structured protocol moves |

---

### Q3: Should AttackCreationModal be per-element (like DialogueActionsButton) or per-argument (like AttackMenuProV2)?

**Both have merits. Recommended: Keep argument-level, but consider adding element-level targeting in Phase G.**

**Current State**:
- **DialogueActionsButton**: Element-level (conclusion, premise1, premise2, etc.)
- **AttackMenuProV2**: Argument-level only
- **AttackCreationModal**: Claim-level (ClaimDetailPanel) + Argument-level (ArgumentCardV2)

**Option A: Keep Argument-Level Only** ✅ **RECOMMENDED FOR PHASE F**
- **Pro**: Clear separation (dialogue = element-level, attack = argument-level)
- **Pro**: Less UI clutter (one attack button per argument)
- **Pro**: Matches current AttackMenuProV2 pattern
- **Con**: Cannot directly attack individual premises (must use DialogueActionsButton → WHY → GROUNDS)

**Option B: Add Element-Level Targeting** ⭐ **FUTURE ENHANCEMENT (Phase G)**
- **Pro**: Unified ASPIC+ interface at all granularities
- **Pro**: Flexibility (direct premise attacks without dialogue)
- **Con**: Overlaps with DialogueActionsButton (two ways to attack premises)
- **Con**: More UI complexity (attack button on every element)

**Recommended Strategy**:
1. **Phase F**: Keep AttackCreationModal argument-level only
2. **Phase F**: Ensure DialogueActionsButton works on all elements (conclusion + premises)
3. **Phase G**: User testing to determine if element-level direct attacks needed
4. **Phase G**: If yes, add targetType="premise" support to AttackCreationModal

**Differentiation If Both Exist**:
- **DialogueActionsButton** (premise) → "Why should we accept this premise?" (process)
- **AttackCreationModal** (premise) → "Attack this premise with claim X" (outcome)

---

## Part 8: Final Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      Argument Attack Architecture                │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐
│   ArgumentCardV2 Header  │ (Element-Level Actions)
├──────────────────────────┤
│ • DialogueProvenanceBadge│
│ • StaleArgumentBadge     │
│ • ConfidenceDisplay      │
│ • View Scheme Button     │
│ • CQStatusPill           │
│                          │
│ ┌──────────────────────┐ │
│ │ DialogueActionsButton│ │ ← WHY/GROUNDS/CONCEDE (conclusion claim)
│ └──────────────────────┘ │
│                          │
│ [NO ATTACK BUTTON HERE]  │ ← Removed AttackMenuProV2/AttackCreationModal
└──────────────────────────┘

┌──────────────────────────┐
│ ArgumentCardV2 Premises  │ (Element-Level Actions)
├──────────────────────────┤
│ Premise 1: "X"           │
│   ┌──────────────────────┐│
│   │ DialogueActionsButton││ ← WHY/GROUNDS (per premise) **ADD THIS**
│   └──────────────────────┘│
│                          │
│ Premise 2: "Y"           │
│   ┌──────────────────────┐│
│   │ DialogueActionsButton││
│   └──────────────────────┘│
└──────────────────────────┘

┌──────────────────────────────────────────┐
│   AIFArgumentsListPro Footer              │ (Argument-Level Actions)
├──────────────────────────────────────────┤
│ • PreferenceQuick                        │
│ • AttackCreationModal                    │ ← Direct ASPIC+ attacks
│   (or AttackMenuProV2 during transition) │
│ • CommunityDefenseMenu                   │
│ • ClarificationRequestButton             │
│ • SchemeSpecificCQsModal                 │ ← Scheme-aware CQs
│ • PromoteToClaimButton                   │
│ • Share Button                           │
└──────────────────────────────────────────┘

┌──────────────────────────┐
│   ClaimDetailPanel       │
├──────────────────────────┤
│ • ClaimContraryManager   │
│ • AttackCreationModal    │ ← Direct ASPIC+ attacks on claims
└──────────────────────────┘

Attack Pathways:
═══════════════

1. CQ-Based (Socratic)
   SchemeSpecificCQsModal → WHY DialogueMove → GROUNDS DialogueMove → CA → ASPIC+
   
2. Dialogue-Based (Dialectic)
   DialogueActionsButton → WHY/GROUNDS DialogueMoves → CA → ASPIC+
   
3. Direct (Theory)
   AttackCreationModal → ConflictApplication → ASPIC+

All paths converge at ASPIC+ theory evaluation ✅
```

---

## Conclusion

**CQs and direct attacks are COMPLEMENTARY, not alternatives.**

**Optimal Architecture**:
- **Remove**: AttackMenuProV2 from ArgumentCardV2 header (redundant)
- **Keep**: AttackCreationModal in AIFArgumentsListPro footer (argument-level direct attacks)
- **Keep**: DialogueActionsButton in ArgumentCardV2 (element-level dialogue moves)
- **Keep**: SchemeSpecificCQsModal in AIFArgumentsListPro (scheme-aware CQs)
- **Add**: DialogueActionsButton to individual premises (element-level targeting)

**User Journey**:
- **Beginners** → SchemeSpecificCQsModal (guided by CQ templates)
- **Intermediate** → DialogueActionsButton (structured dialogue)
- **Advanced** → AttackCreationModal (direct ASPIC+ theory)

**All three workflows are valid and supported!** ✅
