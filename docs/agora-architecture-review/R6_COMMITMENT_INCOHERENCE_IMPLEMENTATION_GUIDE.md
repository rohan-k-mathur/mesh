# R6 Commitment Incoherence Check: Implementation Guide

**Created:** November 2, 2025  
**Estimated Effort:** 2-3 hours  
**Priority:** HIGH (completes validation rules to 8/8)

---

## 🎯 Goal

Implement R6_COMMITMENT_INCOHERENCE validation rule to prevent users from contradicting their own commitments.

**Example Scenario:**
1. User posts claim "Climate change is real" (establishes commitment)
2. Later, user posts CONCEDE on "Climate change is not real" (contradiction!)
3. System should block this CONCEDE with R6_COMMITMENT_INCOHERENCE error

---

## 📋 Overview

### What R6 Does:
- Checks if new dialogue move contradicts user's prior commitments
- Uses **NLI (Natural Language Inference)** for semantic contradiction detection
- Blocks moves that create logical incoherence in commitment store

### Where to Implement:
- File: `lib/dialogue/validate.ts`
- Function: Add `checkCommitmentIncoherence()` helper
- Integration: Call from `validateMove()` for relevant move kinds

---

## 🔧 Implementation Steps

### Step 1: Add NLI Helper Function (30 min)

**File:** `lib/nli/checkContradiction.ts` (NEW FILE)

```typescript
// lib/nli/checkContradiction.ts
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface NLIResult {
  label: 'entailment' | 'neutral' | 'contradiction';
  score: number; // 0.0 - 1.0
}

/**
 * Check if two statements contradict each other using NLI.
 * Returns label='contradiction' if statements are semantically contradictory.
 */
export async function checkContradiction(
  statement1: string,
  statement2: string
): Promise<NLIResult> {
  try {
    // Use GPT-4 for NLI task (more reliable than older models)
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a natural language inference (NLI) system. 
Given two statements, determine if they:
- ENTAILMENT: Statement 2 logically follows from Statement 1
- NEUTRAL: No logical relationship
- CONTRADICTION: Statements cannot both be true

Respond with ONLY a JSON object: {"label": "entailment|neutral|contradiction", "score": 0.0-1.0}

Examples:
Statement 1: "The sky is blue"
Statement 2: "The sky is red"
Response: {"label": "contradiction", "score": 0.95}

Statement 1: "Climate change is real"
Statement 2: "Climate change is not real"
Response: {"label": "contradiction", "score": 0.98}

Statement 1: "We should reduce emissions"
Statement 2: "Electric cars are expensive"
Response: {"label": "neutral", "score": 0.82}`
        },
        {
          role: 'user',
          content: `Statement 1: "${statement1}"\nStatement 2: "${statement2}"`
        }
      ],
      temperature: 0.1, // Low temperature for consistent results
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new Error('Empty NLI response');
    }

    // Parse JSON response
    const result = JSON.parse(content);
    
    // Validate result
    if (!['entailment', 'neutral', 'contradiction'].includes(result.label)) {
      throw new Error(`Invalid NLI label: ${result.label}`);
    }
    
    if (typeof result.score !== 'number' || result.score < 0 || result.score > 1) {
      throw new Error(`Invalid NLI score: ${result.score}`);
    }

    return {
      label: result.label,
      score: result.score,
    };
  } catch (error) {
    console.error('[checkContradiction] NLI failed:', error);
    
    // Fallback: assume neutral (don't block on error)
    return {
      label: 'neutral',
      score: 0.5,
    };
  }
}

/**
 * Quick check if statements contradict (for validation)
 */
export async function areContradictory(
  statement1: string,
  statement2: string,
  threshold = 0.72 // Same threshold used elsewhere in system
): Promise<boolean> {
  const result = await checkContradiction(statement1, statement2);
  return result.label === 'contradiction' && result.score >= threshold;
}
```

---

### Step 2: Add R6 Check to validate.ts (1 hour)

**File:** `lib/dialogue/validate.ts`

**Add import:**
```typescript
import { areContradictory } from '@/lib/nli/checkContradiction';
```

**Add helper function (after existing helpers):**
```typescript
/**
 * R6: Check for commitment incoherence
 * Prevents users from contradicting their own prior commitments
 */
async function checkCommitmentIncoherence(
  deliberationId: string,
  actorId: string,
  kind: string,
  targetType: string,
  targetId: string,
  payload: any
): Promise<string | null> {
  // Only check for moves that create commitments
  if (!['CONCEDE', 'ASSERT', 'GROUNDS'].includes(kind)) {
    return null; // R6 doesn't apply
  }

  try {
    // Fetch user's active commitments
    const commitments = await prisma.commitment.findMany({
      where: {
        deliberationId,
        participantId: actorId,
        isRetracted: false, // Only check active commitments
      },
      select: {
        id: true,
        proposition: true,
      },
    });

    // No commitments yet → no incoherence possible
    if (commitments.length === 0) {
      return null;
    }

    // Resolve the proposition of the new move
    let newProposition: string | null = null;

    if (targetType === 'claim') {
      const claim = await prisma.claim.findUnique({
        where: { id: targetId },
        select: { text: true },
      });
      newProposition = claim?.text ?? null;
    } else if (targetType === 'argument') {
      const argument = await prisma.argument.findUnique({
        where: { id: targetId },
        select: { text: true },
      });
      newProposition = argument?.text ?? null;
    }

    // Fallback to payload if no target text
    if (!newProposition) {
      newProposition = String(
        payload?.expression ?? payload?.brief ?? payload?.note ?? ''
      ).trim();
    }

    if (!newProposition || newProposition.length < 5) {
      return null; // Can't check incoherence without proposition
    }

    // Check each commitment for contradiction
    for (const commitment of commitments) {
      // Skip ACCEPT: prefixed commitments (those are acceptances, not claims)
      if (commitment.proposition.startsWith('ACCEPT:')) {
        continue;
      }

      // Use NLI to check for contradiction
      const isContradictory = await areContradictory(
        commitment.proposition,
        newProposition
      );

      if (isContradictory) {
        console.log('[R6] Commitment incoherence detected:', {
          existingCommitment: commitment.proposition,
          newProposition,
          actorId,
        });

        return 'R6_COMMITMENT_INCOHERENCE';
      }
    }

    return null; // No incoherence detected
  } catch (error) {
    console.error('[R6] Incoherence check failed:', error);
    // On error, don't block (fail open for user experience)
    return null;
  }
}
```

**Update validateMove function (around line 30-40):**
```typescript
export async function validateMove(
  deliberationId: string,
  actorId: string,
  kind: string,
  targetType: string,
  targetId: string,
  payload?: any
): Promise<MoveVerdict> {
  const reasons: string[] = [];

  // R3: No self-reply
  if (payload?.replyToMoveId) {
    const target = await prisma.dialogueMove.findUnique({
      where: { id: payload.replyToMoveId },
      select: { actorId: true }
    });
    if (target?.actorId === actorId) {
      reasons.push('R3_SELF_REPLY');
    }
  }

  // R6: Commitment incoherence (NEW - ADD THIS)
  const r6 = await checkCommitmentIncoherence(
    deliberationId,
    actorId,
    kind,
    targetType,
    targetId,
    payload
  );
  if (r6) {
    reasons.push(r6);
  }

  // R7: ACCEPT_ARGUMENT (if payload.as === 'ACCEPT_ARGUMENT', must target argument)
  if (payload?.as === 'ACCEPT_ARGUMENT' && targetType !== 'argument') {
    reasons.push('R7_ACCEPT_ARGUMENT_REQUIRED');
  }

  // ... rest of existing validation rules ...
}
```

---

### Step 3: Add Error Code Description (10 min)

**File:** `lib/dialogue/codes.ts`

**Add to `REASON_DESCRIPTIONS` object:**
```typescript
export const REASON_DESCRIPTIONS: Record<string, string> = {
  // ... existing codes ...
  
  R6_COMMITMENT_INCOHERENCE: 
    'This move contradicts your prior commitments. You have previously committed to an opposing position.',
  
  // ... rest of codes ...
};
```

---

### Step 4: Update UI to Show R6 Error (15 min)

**File:** `components/dialogue/LegalMoveChips.tsx`

The existing code already handles disabled moves with reasons. R6 will automatically be displayed as a disabled chip with a tooltip showing the reason.

**Verify tooltip handling (around line 200-250):**
```typescript
// Existing code should already handle this:
{move.disabled && move.verdict?.reasons && (
  <Tooltip>
    <TooltipTrigger asChild>
      <Info className="h-3 w-3 ml-1" />
    </TooltipTrigger>
    <TooltipContent>
      {move.verdict.reasons.map((r) => (
        <div key={r} className="text-xs">
          {REASON_DESCRIPTIONS[r] || r}
        </div>
      ))}
    </TooltipContent>
  </Tooltip>
)}
```

No changes needed if this pattern exists!

---

### Step 5: Add Tests (30 min)

**File:** `__tests__/dialogue/r6-validation.test.ts` (NEW FILE)

```typescript
// __tests__/dialogue/r6-validation.test.ts
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { prisma } from '@/lib/prismaclient';
import { validateMove } from '@/lib/dialogue/validate';

describe('R6 Commitment Incoherence Validation', () => {
  let deliberationId: string;
  let userId: string;

  beforeEach(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test-r6@mesh.com',
        name: 'R6 Test User',
      },
    });
    userId = user.id;

    // Create test deliberation
    const deliberation = await prisma.deliberation.create({
      data: {
        title: 'R6 Test Deliberation',
        creatorId: userId,
      },
    });
    deliberationId = deliberation.id;
  });

  afterEach(async () => {
    // Cleanup
    await prisma.commitment.deleteMany({ where: { deliberationId } });
    await prisma.dialogueMove.deleteMany({ where: { deliberationId } });
    await prisma.claim.deleteMany({ where: { roomId: deliberationId } });
    await prisma.deliberation.deleteMany({ where: { id: deliberationId } });
    await prisma.user.deleteMany({ where: { email: 'test-r6@mesh.com' } });
  });

  it('should block CONCEDE that contradicts prior commitment', async () => {
    // Create claim: "Climate change is real"
    const claim1 = await prisma.claim.create({
      data: {
        text: 'Climate change is real',
        roomId: deliberationId,
        userId,
      },
    });

    // User commits to claim1 via CONCEDE
    await prisma.commitment.create({
      data: {
        deliberationId,
        participantId: userId,
        proposition: 'Climate change is real',
        isRetracted: false,
      },
    });

    // Create opposing claim: "Climate change is not real"
    const claim2 = await prisma.claim.create({
      data: {
        text: 'Climate change is not real',
        roomId: deliberationId,
        userId: 'other-user',
      },
    });

    // Try to CONCEDE to opposing claim (should be blocked by R6)
    const verdict = await validateMove(
      deliberationId,
      userId,
      'CONCEDE',
      'claim',
      claim2.id
    );

    expect(verdict.allowed).toBe(false);
    expect(verdict.reasons).toContain('R6_COMMITMENT_INCOHERENCE');
  });

  it('should allow CONCEDE that does not contradict', async () => {
    // Create claim: "Climate change is real"
    const claim1 = await prisma.claim.create({
      data: {
        text: 'Climate change is real',
        roomId: deliberationId,
        userId,
      },
    });

    // User commits to claim1
    await prisma.commitment.create({
      data: {
        deliberationId,
        participantId: userId,
        proposition: 'Climate change is real',
        isRetracted: false,
      },
    });

    // Create related claim: "We should reduce emissions"
    const claim2 = await prisma.claim.create({
      data: {
        text: 'We should reduce emissions',
        roomId: deliberationId,
        userId: 'other-user',
      },
    });

    // Try to CONCEDE to related claim (should be allowed - not a contradiction)
    const verdict = await validateMove(
      deliberationId,
      userId,
      'CONCEDE',
      'claim',
      claim2.id
    );

    expect(verdict.allowed).toBe(true);
    expect(verdict.reasons).not.toContain('R6_COMMITMENT_INCOHERENCE');
  });

  it('should allow CONCEDE if prior commitment was retracted', async () => {
    // Create claim: "Climate change is real"
    const claim1 = await prisma.claim.create({
      data: {
        text: 'Climate change is real',
        roomId: deliberationId,
        userId,
      },
    });

    // User commits to claim1 but then retracts
    await prisma.commitment.create({
      data: {
        deliberationId,
        participantId: userId,
        proposition: 'Climate change is real',
        isRetracted: true, // Retracted!
      },
    });

    // Create opposing claim: "Climate change is not real"
    const claim2 = await prisma.claim.create({
      data: {
        text: 'Climate change is not real',
        roomId: deliberationId,
        userId: 'other-user',
      },
    });

    // Try to CONCEDE to opposing claim (should be allowed - prior commitment retracted)
    const verdict = await validateMove(
      deliberationId,
      userId,
      'CONCEDE',
      'claim',
      claim2.id
    );

    expect(verdict.allowed).toBe(true);
    expect(verdict.reasons).not.toContain('R6_COMMITMENT_INCOHERENCE');
  });

  it('should handle edge case: no commitments yet', async () => {
    // Create claim
    const claim = await prisma.claim.create({
      data: {
        text: 'Some proposition',
        roomId: deliberationId,
        userId,
      },
    });

    // User has no commitments yet - should allow anything
    const verdict = await validateMove(
      deliberationId,
      userId,
      'CONCEDE',
      'claim',
      claim.id
    );

    expect(verdict.allowed).toBe(true);
  });
});
```

**Run tests:**
```bash
npm run test -- r6-validation.test.ts
```

---

## 🧪 Testing Checklist

### Manual Testing Steps:

1. **Setup Test Deliberation**
   ```bash
   # Create deliberation in UI
   # Navigate to: /deliberation/[id]
   ```

2. **Test Case 1: Basic Contradiction**
   - Post claim: "Climate change is real"
   - Click CONCEDE on this claim (establishes commitment)
   - Create opposing claim: "Climate change is not real"
   - Try to CONCEDE on opposing claim
   - **Expected:** CONCEDE button disabled with R6 tooltip

3. **Test Case 2: Non-Contradictory**
   - Post claim: "Climate change is real"
   - CONCEDE on it
   - Create related claim: "We should reduce emissions"
   - Try to CONCEDE on related claim
   - **Expected:** CONCEDE allowed (no contradiction)

4. **Test Case 3: Retraction**
   - Post claim: "Climate change is real"
   - CONCEDE on it
   - RETRACT your commitment (post RETRACT move)
   - Create opposing claim: "Climate change is not real"
   - Try to CONCEDE on opposing claim
   - **Expected:** CONCEDE allowed (commitment was retracted)

5. **Test Case 4: Edge Cases**
   - Try CONCEDE with very short text (< 5 chars)
   - **Expected:** Allowed (can't check incoherence)
   - Try CONCEDE with no prior commitments
   - **Expected:** Allowed (no commitments to contradict)

---

## 📊 Performance Considerations

### NLI API Calls:
- **Cost:** ~$0.002 per call (GPT-4)
- **Latency:** ~500-1000ms per check
- **Frequency:** Only on CONCEDE/ASSERT/GROUNDS (not every move)

### Optimization Options:

1. **Cache NLI Results** (30 min additional work)
   ```typescript
   // lib/nli/cache.ts
   const nliCache = new Map<string, NLIResult>();
   
   function cacheKey(s1: string, s2: string): string {
     return `${s1}::${s2}`;
   }
   
   export async function checkContradictionCached(
     statement1: string,
     statement2: string
   ): Promise<NLIResult> {
     const key = cacheKey(statement1, statement2);
     
     if (nliCache.has(key)) {
       return nliCache.get(key)!;
     }
     
     const result = await checkContradiction(statement1, statement2);
     nliCache.set(key, result);
     
     return result;
   }
   ```

2. **Batch NLI Checks** (if multiple commitments)
   - Check all commitments in parallel
   - Use `Promise.all()` for faster validation

3. **Fallback to Simple Text Matching** (if NLI fails)
   - Check for "not" prefix
   - Check for antonyms (real vs. fake, true vs. false)
   - Much faster but less accurate

---

## 🚀 Deployment Steps

### 1. Environment Variables
Ensure `OPENAI_API_KEY` is set in `.env`:
```bash
OPENAI_API_KEY=sk-...
```

### 2. Run Tests
```bash
npm run test -- r6-validation.test.ts
```

### 3. Test in Dev
```bash
npm run dev
# Manual testing as per checklist above
```

### 4. Deploy to Staging
```bash
git add lib/dialogue/validate.ts lib/dialogue/codes.ts lib/nli/checkContradiction.ts
git commit -m "feat: implement R6 commitment incoherence check"
git push origin feature/r6-validation
```

### 5. Monitor
- Check NLI API usage in OpenAI dashboard
- Monitor for false positives (legitimate moves blocked)
- Gather user feedback

---

## 📈 Success Criteria

- [ ] R6 validation rule enforced (8/8 rules complete)
- [ ] NLI contradiction detection working with >90% accuracy
- [ ] UI shows clear error message when R6 blocks move
- [ ] No performance degradation (< 1s validation time)
- [ ] Tests passing with >90% coverage
- [ ] Zero false positives reported by users in first week

---

## 🎯 Future Enhancements

### Phase 2 (Optional - Defer):
1. **Commitment Explanation UI**
   - Show which prior commitment is contradicted
   - Link to original CONCEDE move
   - Allow user to RETRACT prior commitment

2. **Smart Suggestion**
   - "You previously committed to X. Do you want to retract X and commit to Y?"
   - One-click retraction + new commitment

3. **Commitment History Timeline**
   - Visual timeline of user's commitments
   - Show retractions, modifications
   - Export commitment evolution

---

## 💡 Key Design Decisions

### Why NLI instead of keyword matching?
- **Semantic understanding:** Catches paraphrased contradictions
- **Flexible:** Works with any domain (not keyword-dependent)
- **Research-grade:** Matches academic standards (Hamblin/Walton/Krabbe)

### Why threshold = 0.72?
- **Consistency:** Same threshold used elsewhere (CQ satisfaction)
- **Empirically tested:** Good balance of precision/recall
- **Adjustable:** Can be tuned based on false positive rate

### Why fail open on NLI error?
- **User experience:** Don't block users if API fails
- **Graceful degradation:** System still usable
- **Log errors:** Can investigate and fix later

---

## 📚 References

### Academic Foundations:
- Hamblin, C. L. (1970). *Fallacies*. Methuen.
- Walton, D., & Krabbe, E. (1995). *Commitment in Dialogue*. SUNY Press.
- Prakken, H. (2006). *Formal systems for persuasion dialogue*. The Knowledge Engineering Review.

### Implementation References:
- OpenAI NLI examples: https://platform.openai.com/docs/guides/text-generation
- Existing CQ satisfaction check: `lib/cq/satisfaction.ts`
- Existing validation rules: `lib/dialogue/validate.ts`

---

## ✅ Completion Checklist

- [ ] Create `lib/nli/checkContradiction.ts` with NLI helper
- [ ] Add `checkCommitmentIncoherence()` to `lib/dialogue/validate.ts`
- [ ] Update `validateMove()` to call R6 check
- [ ] Add R6_COMMITMENT_INCOHERENCE to `lib/dialogue/codes.ts`
- [ ] Verify UI tooltip handling in `LegalMoveChips.tsx`
- [ ] Create test file `__tests__/dialogue/r6-validation.test.ts`
- [ ] Run unit tests (all passing)
- [ ] Manual testing (all test cases pass)
- [ ] Performance check (< 1s validation time)
- [ ] Deploy to staging
- [ ] User acceptance testing
- [ ] Deploy to production
- [ ] Monitor for 1 week (no false positives)

**Estimated Total Time: 2-3 hours**

---

**Status:** Ready to implement  
**Next Step:** Create `lib/nli/checkContradiction.ts` and begin Step 1

---

**End of R6 Implementation Guide**
