# Attack Flow Patterns Analysis - Legacy Systems

**Date**: November 12, 2025  
**Purpose**: Document existing attack creation patterns to guide AttackConstructionWizard redesign

---

## Overview

There are **3 existing attack/challenge systems** in the codebase, each with different workflows:

1. **ArgumentAttackModal** - Manual ASPIC+ attacks using existing claims/arguments
2. **SchemeSpecificCQsModal** - CQ-based attacks by argument authors
3. **CriticalQuestionsV3** - CQ attachment and response system

All three systems create **ConflictApplication** records via `/api/ca` endpoint.

---

## Pattern 1: ArgumentAttackModal (Manual ASPIC+ Attacks)

**Location**: `components/arguments/ArgumentAttackModal.tsx`  
**Trigger**: "Attack" button in ArgumentCardV2 header  
**User Flow**:
1. User selects attack type (REBUTS/UNDERMINES/UNDERCUTS)
2. User selects attacker type (existing claim OR existing argument)
3. User selects specific attacker from dropdown
4. System creates ConflictApplication linking attacker → target

**Key Characteristics**:
- **Uses existing entities** - no new content created
- **Full ASPIC+ awareness** - targetScope, attackType explicit
- **Select-based UI** - dropdowns for all choices
- **No wizard** - single modal with all options
- **Direct CA creation** - no intermediate steps

**API Call**:
```typescript
POST /api/ca
{
  deliberationId,
  legacyAttackType: "REBUTS" | "UNDERCUTS" | "UNDERMINES",
  legacyTargetScope: "conclusion" | "inference" | "premise",
  conflictingClaimId: selectedAttackerId, // OR conflictingArgumentId
  conflictedClaimId: targetClaimId,       // OR conflictedArgumentId
  metaJson: {
    createdVia: "argument-attack-modal",
    attackType,
    targetArgumentId,
    schemeKey,
    schemeName,
  }
}
```

**Pros**:
- ✅ Reuses existing content
- ✅ Fast for users who know what they want
- ✅ Clean ASPIC+ integration

**Cons**:
- ❌ Requires existing claim/argument to use as attacker
- ❌ No guidance for users unfamiliar with ASPIC+
- ❌ Doesn't leverage CQ intelligence

---

## Pattern 2: SchemeSpecificCQsModal (Author CQ Defense)

**Location**: `components/arguments/SchemeSpecificCQsModal.tsx`  
**Trigger**: "Critical Questions" badge on argument card  
**User Flow**:

### For REBUTS (attacking conclusion):
1. User expands CQ
2. System shows ClaimPicker
3. User selects existing counter-claim
4. System creates CA: `conflictingClaimId → conflictedClaimId (conclusion)`

### For UNDERCUTS (attacking inference):
1. User expands CQ
2. User **writes exception text** in textarea
3. System creates **new claim** from text
4. System creates CA: `newClaimId → conflictedArgumentId`

### For UNDERMINES (attacking premise):
1. User expands CQ
2. User selects which premise to undermine (dropdown)
3. User selects contradicting claim (ClaimPicker)
4. System creates CA: `conflictingClaimId → conflictedClaimId (premise)`

**Key Characteristics**:
- **CQ-aware** - each objection linked to specific CQ
- **Mixed creation pattern** - UNDERCUTS creates new claim, others use existing
- **Author-only** - permission guard checks `isAuthor`
- **Embedded in CQ list** - forms appear inline when CQ expanded
- **metaJson tracking** - stores cqKey, cqText, schemeKey

**API Calls**:
```typescript
// For UNDERCUTS - create claim first
POST /api/claims
{ deliberationId, authorId, text: userWrittenText }

// Then create CA
POST /api/ca
{
  deliberationId,
  conflictingClaimId: newClaimId,
  conflictedArgumentId,
  legacyAttackType: "UNDERCUTS",
  legacyTargetScope: "inference",
  metaJson: {
    schemeKey,
    cqKey,
    cqText,
    source: "scheme-specific-cqs-modal-undercut",
  }
}
```

**Pros**:
- ✅ CQ-guided - users understand why they're attacking
- ✅ Allows text input for UNDERCUTS
- ✅ Strong metadata tracking (cqKey links attack to question)

**Cons**:
- ❌ Author-only restriction
- ❌ Still requires existing claims for REBUTS/UNDERMINES
- ❌ No evidence guidance
- ❌ No quality validation

---

## Pattern 3: CriticalQuestionsV3 (Community CQ Responses)

**Location**: `components/claims/CriticalQuestionsV3.tsx`  
**Trigger**: CQ list in claim/argument details  
**User Flow**:

### Attach Mode (using existing claim):
1. User searches for claims
2. User selects claim from results
3. System calls `/api/cqs/toggle` with `attachSuggestion: true`
4. Backend creates CA linking selected claim → target

### Quick Compose Mode:
1. User clicks "Quick Compose"
2. User writes text in dialog
3. System creates **new claim** from text
4. System attaches new claim as objection

**Key Characteristics**:
- **Search-first** - emphasizes finding existing claims
- **Community-friendly** - not restricted to authors
- **Suggestion system** - backend determines attack type/scope from CQ metadata
- **Dialog-based** - separate modal for text entry

**API Call**:
```typescript
POST /api/cqs/toggle
{
  targetType: "claim" | "argument",
  targetId,
  schemeKey,
  cqKey,
  satisfied: false,
  attachSuggestion: true,
  attackerClaimId,
  deliberationId,
}
```

**Pros**:
- ✅ Search integration
- ✅ Not restricted to authors
- ✅ Backend determines attack metadata automatically

**Cons**:
- ❌ Less transparent about attack type
- ❌ No evidence linking
- ❌ No quality scoring

---

## Synthesis: What AttackConstructionWizard Should Do

Based on these patterns, the **AI-generated CQ-based attack wizard** should:

### ✅ Adopt from SchemeSpecificCQsModal:
1. **Text input for attack content** (like UNDERCUTS pattern)
2. **CQ metadata tracking** (cqKey, cqText in metaJson)
3. **Create new claim** from user's response text
4. **Direct CA creation** after claim created

### ✅ Adopt from ArgumentAttackModal:
1. **Clear ASPIC+ labels** (attack type, target scope)
2. **Full argument context** display
3. **Single-flow workflow** (not overly complex)

### ✅ Add NEW features (from Phase 3 Overhaul):
1. **Evidence linking** - attach sources to claim
2. **Quality scoring** - validate attack strength
3. **Burden guidance** - show who has burden of proof
4. **AI suggestions** - provide example attacks

---

## Proposed Simplified Flow for AttackConstructionWizard

### Step 1: Overview (Keep as-is)
- Show CQ question
- Show attack type (REBUTS/UNDERCUTS/UNDERMINES)
- Show burden advantage
- Show construction steps
- Show evidence requirements

### Step 2: Write Response (NEW - replace Premises step)
**Purpose**: User writes their response to the Critical Question

**UI**:
```tsx
<Textarea
  value={attackText}
  onChange={(e) => setAttackText(e.target.value)}
  placeholder="Write your response to this critical question..."
  rows={8}
/>

{/* Real-time quality indicator */}
<QualityMeter value={textQuality} />

{/* AI suggestions */}
{suggestion.exampleAttacks.map(example => (
  <ExampleCard 
    text={example} 
    onUse={() => setAttackText(example)}
  />
))}
```

**Backend**: No API call yet, just local state

### Step 3: Add Evidence (Keep but simplify)
**Purpose**: Link sources to strengthen claim

**UI**: Keep existing evidence linking UI but make it optional

### Step 4: Review & Submit (Modify)
**Purpose**: Create claim and ConflictApplication

**API Sequence**:
```typescript
// 1. Create claim from attack text
const claimRes = await fetch("/api/claims", {
  method: "POST",
  body: JSON.stringify({
    deliberationId,
    authorId: currentUserId,
    text: attackText,
  }),
});
const { id: attackClaimId } = await claimRes.json();

// 2. Link evidence (if any)
if (evidenceLinks.length > 0) {
  await Promise.all(evidenceLinks.map(link => 
    fetch(`/api/claims/${attackClaimId}/citations`, {
      method: "POST",
      body: JSON.stringify({ url: link }),
    })
  ));
}

// 3. Create ConflictApplication
await fetch("/api/ca", {
  method: "POST",
  body: JSON.stringify({
    deliberationId,
    conflictingClaimId: attackClaimId,
    conflictedArgumentId: targetArgumentId,  // OR conflictedClaimId
    legacyAttackType: suggestion.attackType,
    legacyTargetScope: suggestion.targetScope,
    metaJson: {
      createdVia: "attack-construction-wizard",
      cqKey: suggestion.cq.id,
      cqText: suggestion.cq.text,
      schemeKey: suggestion.targetSchemeInstance.scheme.key,
      aiGenerated: true,
      suggestionId: suggestion.id,
    },
  }),
});

// 4. Refresh UI
onComplete(attackClaimId);
```

---

## Key Differences from Current Implementation

### Current (Wrong):
- ❌ Tries to fill **premises** (for building arguments)
- ❌ Uses ArgumentTemplate with premise templates
- ❌ Expects scheme-based argument construction
- ❌ Designed for SUPPORT arguments, not ATTACKS

### Proposed (Correct):
- ✅ User writes **single text response** to CQ
- ✅ Text becomes new **claim**
- ✅ Claim is linked to target via **ConflictApplication**
- ✅ CQ metadata tracked in metaJson
- ✅ Optional evidence strengthens claim
- ✅ Quality validation ensures substance

---

## Implementation Checklist

### Phase 1: Simplify Wizard (2 hours)
- [ ] Remove premise-filling step
- [ ] Add "Write Response" step with textarea
- [ ] Keep Overview and Evidence steps
- [ ] Simplify Review step

### Phase 2: Wire to /api/ca (1 hour)
- [ ] Create claim from attackText
- [ ] Link evidence to claim
- [ ] Create ConflictApplication with proper metadata
- [ ] Fire refresh events

### Phase 3: Quality & Guidance (1 hour)
- [ ] Add text quality scoring
- [ ] Show AI example attacks
- [ ] Add burden of proof guidance
- [ ] Validate minimum quality (40%)

### Phase 4: Testing (1 hour)
- [ ] Test UNDERCUTS flow
- [ ] Test REBUTS flow
- [ ] Test UNDERMINES flow
- [ ] Verify CA creation
- [ ] Verify AIF graph updates

**Total Effort**: ~5 hours

---

## Success Criteria

1. ✅ User can write text response to CQ
2. ✅ System creates new claim from text
3. ✅ System creates ConflictApplication linking claim → target
4. ✅ CQ metadata preserved (cqKey, cqText)
5. ✅ Evidence can be attached to claim
6. ✅ Quality validation blocks weak attacks
7. ✅ Arguments tab refreshes after submission
8. ✅ AIF graph shows new attack relationship

---

## Next Steps

1. **Update AttackConstructionWizard.tsx**:
   - Replace PremisesStep with WriteResponseStep
   - Simplify submit handler to create claim → CA
   - Add quality validation

2. **Test with existing data**:
   - Use test-single-space-arg (has CQs)
   - Generate attack suggestions
   - Complete full wizard flow

3. **Document in completion summary**:
   - Update WEEK6_TASK_6_1_COMPLETION_SUMMARY.md
   - Note alignment with legacy patterns
   - Record API integration details
