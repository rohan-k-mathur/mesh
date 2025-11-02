# Foundational Research Priority Analysis

**Review Date:** November 2, 2025  
**Purpose:** Evaluate FOUNDATIONAL_RESEARCH_SYNTHESIS.md to identify high-value vs. redundant/conflicting directions  
**Context:** System already 90%+ complete per REVIEW_STATUS_SUMMARY.md, dialogue visualization roadmap complete (Phases 1-7)

---

## 🎯 Executive Summary

The FOUNDATIONAL_RESEARCH_SYNTHESIS document proposes **7 major theoretical frameworks** from academic papers. After analyzing against the **current system state** (90% complete, production-ready), here's the priority breakdown:

### ✅ **KEEP/PURSUE:** Worth Pursuing (High ROI)
1. **Dialogue Visualization** (Phases 1-7 already documented) — **READY TO IMPLEMENT**
   - Roadmap complete, no conflicts, clear UX value
   - 16 weeks implementation time
2. **Per-Derivation Assumption Tracking** — **✅ ALREADY COMPLETE** (Gap 4 resolved Jan 2025)
   - Completed January 2025, now focus on UI visualization
3. **Confidence-Scheme Integration** — **HIGH VALUE, LOW EFFORT** (3-5 hours)
   - Backend exists, just needs wiring
   - Immediate value
4. **Ludics Formalization** — **UNIQUE INNOVATION** (already 95% done, needs documentation)
   - Already 95% implemented
   - Publication opportunity (8-10 hours documentation)

### ⏸️ **DEFERRED:** Side Project / Research Contribution (Not Blocking Production)
5. **Topological Argumentation Model** — **PhD-LEVEL RESEARCH PROJECT**
   - 3-4 weeks effort, no clear UX benefit
   - Better as academic paper than production feature
   - Consider as separate research contribution, not core platform feature

### ❌ **REMOVED:** Not Included in Any Roadmaps / Not Part of Project
6. **DDF 8-Stage Protocol** — **FRAMEWORK CLASH**
   - Conflicts with existing dialogue move system
   - 8 weeks effort, unclear benefit
   - Current system already works well
7. **Sentence Type Ontology** (6 types) — **BREAKING CHANGE**
   - Would require rewriting Claim model
   - Unclear user benefit
   - Better to use flexible `tags` field if needed
8. **Commitment Stores** — **REDUNDANT**
   - DialogueMove table already tracks this
   - Would duplicate data
9. **Haskell/Agda Verification** — **WRONG STACK**
   - 3-4 months to rewrite in different language
   - Property-based testing (QuickCheck) is 95% as good
10. **DisCoCat NLP** — **OVERKILL**
    - Current embeddings work fine
    - 2-3 weeks complexity for marginal benefit
11. **PCR5/PCR6 Conflict Resolution** — **NO USE CASE**
    - Solves problem that doesn't exist in Mesh's domain

---

## 📊 Framework-by-Framework Analysis

---

## 1. ✅ **Dialogue Visualization** (Phases 1-7 Roadmap)

### Status: **READY TO IMPLEMENT** — Roadmap complete, no theoretical conflicts

**What It Is:**
- Visual representation of dialogue moves in AIF diagrams
- Timeline playback with video-like controls
- Scheme provenance badges showing CQ dialogue history

**Why It's Worth Pursuing:**
- ✅ **Complements existing system** (doesn't require rewrites)
- ✅ **Clear UX benefit** (users can see dialogue flow)
- ✅ **Implementation ready** (detailed 9-phase roadmap exists)
- ✅ **No framework conflicts** (integrates with current DialogueMove model)

**Effort Estimate:** 16 weeks (documented in roadmap)

**ROI:** ⭐⭐⭐⭐⭐ **HIGHEST PRIORITY** — Clear path, high user value, no risks

**Recommendation:** **START IMMEDIATELY** with Phase 1 (database schema extensions)

---

## 2. ✅ **Per-Derivation Assumption Tracking** (Gap 4)

### Status: **✅ ALREADY COMPLETE** (January 2025)

**What It Was:**
- Track which assumptions each argument derivation relies on
- Compute minimal assumption sets
- Enable belief revision ("culprit set" identification)

**Why It Was Worth Pursuing:**
- ✅ **Enables belief revision UX** (show "if you reject X, you must also reject Y")
- ✅ **Research contribution** (unique to Mesh)
- ✅ **Categorical alignment** (proper morphism composition)

**What's Implemented:**
- ✅ `DerivationAssumption` table with per-derivation granularity
- ✅ Arrow type updated: `assumptions: Map<DerivationId, Set<AssumptionId>>`
- ✅ Four new API endpoints (fetch/link/minimal/graph)
- ✅ Client wrappers in `lib/client/evidential.ts`
- ✅ 30/30 tests passing

**ROI:** ⭐⭐⭐⭐⭐ **COMPLETED** — Major capability unlocked

**Recommendation:** **DONE** — Now focus on UI visualization of assumption graphs

---

## 3. ✅ **Confidence-Scheme Integration** (Quick Win)

### Status: **NOT IMPLEMENTED** — Backend exists, just needs wiring (3-5 hours)

**What It Is:**
- Use `ArgumentScheme.validators.baseConfidence` in confidence scoring
- Apply CQ satisfaction penalty: `strength *= 0.85^unsatisfiedCount`
- Add temporal decay: `decay = 0.5^(ageInDays / halfLife)`

**Why It's Worth Pursuing:**
- ✅ **Leverage existing data** (schemes already have validators)
- ✅ **Research-backed** (Macagno taxonomy already implemented)
- ✅ **Low effort** (API changes only, no UI required initially)
- ✅ **Immediate benefit** (more accurate confidence scores)

**Implementation Steps:**
```typescript
// In /api/evidential/score/route.ts:

// 1. Fetch scheme base confidence
const scheme = await prisma.argumentationScheme.findUnique({
  where: { id: argument.schemeId },
  select: { validators: true }
});
const baseConf = (scheme?.validators as any)?.baseConfidence ?? 0.6;

// 2. Apply CQ penalty
const unsatisfiedCQs = cqMap.get(argument.id) ?? 0;
const cqPenalty = Math.pow(0.85, unsatisfiedCQs);

// 3. Apply temporal decay (if halfLife set)
const ageInDays = (Date.now() - argument.createdAt.getTime()) / (1000*60*60*24);
const halfLife = (scheme?.validators as any)?.halfLife ?? Infinity;
const decay = Math.pow(0.5, ageInDays / halfLife);

// 4. Combine
const finalStrength = baseConf * cqPenalty * decay;
```

**Effort Estimate:** 3-5 hours

**ROI:** ⭐⭐⭐⭐⭐ **HIGH PRIORITY** — Low effort, immediate value

**Recommendation:** **DO NEXT** after dialogue viz Phase 1

---

## 4. ✅ **Ludics Formalization** (Documentation Only)

### Status: **95% IMPLEMENTED** — Just needs formal specification

**What It Is:**
- Formalize the daimon (†) closure rules
- Document when dialogue branches become "closable"
- Write specification for `stepInteraction` algorithm

**Why It's Worth Pursuing:**
- ✅ **Unique innovation** (no other system has this!)
- ✅ **Already working** (LudicsPanel, legal moves API)
- ✅ **Publication opportunity** (COMMA/IJCAI paper)
- ✅ **Low effort** (documentation, not code)

**What's Needed:**
1. Formal specification document (LaTeX or Markdown)
2. Ludics primer for developers
3. Research paper draft

**Effort Estimate:** 8-10 hours (documentation only)

**ROI:** ⭐⭐⭐⭐ **MEDIUM-HIGH PRIORITY** — Research contribution, low implementation cost

**Recommendation:** **DO IN PARALLEL** with Phase 2-3 of dialogue viz (documentation work doesn't block coding)

---

## 5. ⚠️ **DDF 8-Stage Protocol** (DEFER)

### Status: **NOT IMPLEMENTED** — Conflicts with existing dialogue system

**What It Is:**
- Formal 8-stage protocol: OPEN → INFORM → PROPOSE → CONSIDER → REVISE → RECOMMEND → CONFIRM → CLOSE
- Locutions: `assert`, `ask_justify`, `move(.)`, `retract`, `prefer`, `withdraw`
- Commitment stores (per-participant public assertions)
- Embedded persuasion dialogues

**Why It's Problematic:**

#### Conceptual Conflict 1: Current Dialogue Moves Already Work
**Existing System:**
- 9 move types: WHY, GROUNDS, CONCEDE, RETRACT, CLOSE, ACCEPT_ARGUMENT, THEREFORE, SUPPOSE, DISCHARGE
- Threaded replies with `replyTargetId`
- 8 validation rules (R1-R8)
- Ludics integration for closure detection

**DDF Requires:**
- Replace with locution types (completely different model)
- Stage-based validation (different from current R1-R8)
- CONFIRM stage requires unanimity (not compatible with current acceptance model)

**Impact:** ⚠️ **BREAKING CHANGE** — Would require rewriting entire `DialogueMove` system

---

#### Conceptual Conflict 2: Commitment Stores vs. Dialogue Moves
**DDF:** Each participant has a **Commitment Store** (CS) - explicit list of assertions

**Mesh:** Dialogue moves **implicitly** create commitments:
- WHY = challenging a claim
- GROUNDS = supporting a position
- CONCEDE = retracting opposition
- RETRACT = withdrawing a prior move

**Question:** What does commitment store add that dialogue moves don't already provide?

**Answer:** Very little. The moves **are** the commitments. Adding a separate CS would be:
- ❌ **Redundant:** Duplicates information in DialogueMove table
- ❌ **Synchronization risk:** CS and moves could diverge
- ❌ **UI complexity:** Which view is authoritative?

---

#### Conceptual Conflict 3: Embedded Dialogues vs. CQ System
**DDF:** `ask_justify` spawns embedded persuasion dialogue

**Mesh:** Critical Questions already provide justification mechanism:
- CQs challenge specific aspects of arguments
- Responses are submitted as CQResponse records
- Proof obligations enforce structural/semantic verification
- Multi-user collaborative answering

**Question:** What do embedded dialogues add that CQs don't provide?

**Answer:** Mostly just formalism. The CQ system **is** the justification protocol. Making it "embedded" would:
- ❌ **Complicate UI:** Nested dialogue contexts confusing
- ❌ **Breaking change:** Current CQ system works well
- ❌ **No clear benefit:** Users don't need "meta-dialogue" concept

---

#### Effort vs. Benefit Analysis:

| Feature | Effort | Benefit | Worth It? |
|---------|--------|---------|-----------|
| 8-stage tracking | 2 weeks | Formal protocol | ⚠️ Unclear UX value |
| Commitment stores | 1 week | Explicit positions | ❌ Redundant with moves |
| Embedded dialogues | 2 weeks | Nested justification | ❌ Redundant with CQs |
| Locution types | 3 weeks | Replace move types | ❌ Breaking change |
| **TOTAL** | **8 weeks** | **Formalism only** | **❌ NOT WORTH IT** |

**ROI:** ⭐ **LOW PRIORITY** — High effort, unclear benefit, framework clash

**Recommendation:** **DEFER INDEFINITELY** — Current dialogue system is production-ready and user-tested. DDF is an **academic framework** that doesn't map cleanly to the existing design. Unless there's a **specific user need** that DDF solves and current system doesn't, this is not worth pursuing.

**Alternative:** Document **how current system maps to DDF concepts** (for academic credibility) without rewriting code.

---

## 6. ⚠️ **Topological Argumentation Model** (DEFER)

### Status: **NOT IMPLEMENTED** — PhD-level research project

**What It Is:**
- Model evidence as **open sets** in topology τ
- Attack relation: e₁ ≺ e₂ iff e₁ ∩ e₂ = ∅
- Grounded belief: BP iff ∃f ∈ LFP_τ where f ⊆ P
- **Key property:** Belief is **not closed under conjunction** (BP ∧ Bψ ⇏ B(φ ∧ ψ))

**Why It's Interesting:**
- ✅ **Mathematically rigorous** foundation for belief
- ✅ **Handles closure failure** (reflects real reasoning)
- ✅ **Separates deductive capacity from belief formation**

**Why It's Problematic:**

#### Problem 1: No Clear UX Benefit
**Question:** How does a user benefit from topological semantics?

**Current System:**
- Confidence scores: 0.0 - 1.0 (intuitive)
- Three modes: min (skeptical), product (accrual), ds (uncertainty-aware)
- Users understand "this argument has 0.78 confidence"

**Topological System:**
- User sees "grounded belief in φ" (yes/no)
- No intermediate scores?
- How to visualize topologies?

**Gap:** ⚠️ **Unclear how to translate mathematical sophistication into user value**

---

#### Problem 2: Significant Implementation Effort

**Required:**
1. Define topology τ on evidence sets (how do claims combine?)
2. Compute attack graph A_τ = (τ, ≺)
3. Implement characteristic function d_τ
4. Compute least fixed point LFP_τ (iterative)
5. Check membership for grounded belief BP

**Estimated Effort:** 3-4 weeks (complex algorithm, testing, edge cases)

**Question:** What does this replace?
- Current confidence scoring works well
- Dung semantics (grounded/preferred) already implemented
- Users understand probabilistic confidence

**Answer:** ⚠️ **Alternative approach, not improvement** — Would coexist with (not replace) current system

---

#### Problem 3: Closure Failure is Philosophically Deep, Practically Rare

**Theoretical Issue:** BP ∧ Bψ ⇏ B(φ ∧ ψ) because grounded extension may exclude conjunctions

**Practical Reality:** In real deliberations:
- Users rarely ask "do I believe P AND Q?"
- Confidence is aggregated per-claim (not per-conjunction)
- If needed, can compute min(conf(P), conf(Q)) as conservative estimate

**Impact:** ⚠️ **Solves theoretical problem that rarely occurs in practice**

---

**ROI:** ⭐⭐ **LOW-MEDIUM PRIORITY** — High effort, unclear benefit, research-oriented

**Recommendation:** **DEFER** — This is a **research contribution** (worthy of publication), not a **production feature**. Better as:
1. Academic paper ("Topological Semantics for Argumentation Platforms")
2. Experimental backend (separate mode, not default)
3. PhD thesis topic

**Alternative:** Document **why current confidence scoring is sufficient** and when topological model would be needed (e.g., when closure failure causes actual user confusion).

---

## 7. ⚠️ **Sentence Type Ontology** (6 Types) (DEFER)

### Status: **NOT IMPLEMENTED** — Breaking change to core Claim model

**What It Is:**
- Replace generic "Claim" with 6 types:
  1. **Action** — "Implement feature X"
  2. **Goal** — "Increase user engagement"
  3. **Constraint** — "Budget < $50k"
  4. **Perspective** — "Moral, economic, feasibility"
  5. **Fact** — "Current traffic is 10k/day"
  6. **Evaluation** — "Feature X scores high on moral perspective"

**Why It's Proposed:**
- ✅ **DDF requirement** (deliberation protocol needs types)
- ✅ **Enables practical reasoning** (actions separate from facts)
- ✅ **Value-Based Practical Reasoning** (VPR) scheme needs this

**Why It's Problematic:**

#### Problem 1: Breaking Change to Core Model

**Current Schema:**
```prisma
model Claim {
  id      String @id @default(cuid())
  text    String
  roomId  String
  // ... 50+ other fields, 20+ relations
}
```

**Required Change:**
```prisma
model Claim {
  // ... existing fields
  sentenceType SentenceKind  // NEW REQUIRED FIELD
}

enum SentenceKind {
  ACTION
  GOAL
  CONSTRAINT
  PERSPECTIVE
  FACT
  EVALUATION
}
```

**Migration Issues:**
- ❌ **500+ existing claims** — How to classify retroactively?
- ❌ **Breaking change** — All queries need updates
- ❌ **UI overhaul** — Claim creation form needs type selector
- ❌ **Validation logic** — Type-specific rules (e.g., actions must have feasibility evaluation)

**Effort Estimate:** 2-3 weeks (schema + migration + UI + validation)

---

#### Problem 2: Unclear User Benefit

**Question:** Do users care about sentence types?

**User Perspective:**
- "I want to post a claim" (current UI)
- "I want to argue for/against something"

**DDF Perspective:**
- "You must first classify: Is this an Action, Goal, Constraint, Fact, Evaluation, or Perspective?"
- User thinks: "...what? I don't know. Just let me post it."

**UX Risk:** ⚠️ **Adds cognitive load** to already complex deliberation process

---

#### Problem 3: VPR Scheme is One of 60+ Schemes

**Current System:**
- 60+ argumentation schemes
- Most don't need sentence types (e.g., "Argument from Expert Opinion" = Fact + Authority)

**VPR Needs:**
- Action + Goal + Value + Evaluation
- Specific to practical reasoning

**Question:** Should we redesign **entire Claim model** for **one scheme**?

**Answer:** ⚠️ **No** — Better to:
1. Add `tags` field to Claim (flexible categorization)
2. VPR scheme checks for required tags
3. Other schemes ignore tags

**Alternative Design:**
```prisma
model Claim {
  // ... existing fields
  tags  Json?  // { "type": "action", "domain": "technical", ... }
}
```

**Benefits:**
- ✅ Backward compatible (existing claims have `tags: null`)
- ✅ Flexible (not locked to 6 types)
- ✅ Opt-in (only VPR users need tags)

---

**ROI:** ⭐⭐ **LOW PRIORITY** — High effort, unclear benefit, breaking change

**Recommendation:** **DEFER** — If practical reasoning becomes a major use case:
1. Start with `tags` field (flexible, non-breaking)
2. Add VPR scheme with tag requirements
3. Gather user feedback
4. **Only then** consider formalizing into enum

**Alternative:** Document **how current system supports practical reasoning** without sentence types (e.g., using claim text analysis or user-added tags).

---

## 8. ⚠️ **Commitment Stores** (DEFER)

### Status: **NOT IMPLEMENTED** — Redundant with DialogueMove table

**What It Is:**
- Per-participant public-write, public-read data structure
- Tracks all assertions, retractions, preferences
- Updated by locutions (assert/retract/prefer/move)

**Example:**
```
CommitmentStore (User Alice, Deliberation D):
  Assertions:
    - "Climate change is real" (Fact)
    - "We should reduce emissions" (Action)
  Retractions:
    - "Coal is safe" (retracted on 2025-10-15)
  Preferences:
    - Action("reduce emissions") > Action("do nothing")
```

**Why It's Proposed:**
- ✅ **DDF requirement** (formal protocol uses CS)
- ✅ **Burden of proof tracking** (who asserted what)
- ✅ **Enables ask_justify protocol** (challenge anything in CS)

**Why It's Redundant:**

#### Current System Already Tracks This

**DialogueMove table:**
```prisma
model DialogueMove {
  id              String @id
  userId          String           // WHO
  deliberationId  String           // WHERE
  type            DialogueMoveType // WHAT (WHY/GROUNDS/RETRACT/etc.)
  content         String?          // CONTENT
  timestamp       DateTime         // WHEN
  replyTargetId   String?          // CONTEXT
  targetClaimId   String?          // TARGET
  // ...
}
```

**This IS a commitment store!**
- **Assertions:** Moves of type GROUNDS, THEREFORE
- **Challenges:** Moves of type WHY
- **Retractions:** Moves of type RETRACT
- **Preferences:** (implicit in ACCEPT_ARGUMENT vs. attacks)

**Query for "What has Alice asserted in Deliberation D?":**
```typescript
const aliceCommitments = await prisma.dialogueMove.findMany({
  where: {
    userId: aliceId,
    deliberationId: D,
    type: { in: ['GROUNDS', 'THEREFORE', 'ACCEPT_ARGUMENT'] }
  }
});
```

**This query IS the commitment store lookup!**

---

#### Additional Redundancy: Claim.userId

**Every claim has:**
```prisma
model Claim {
  userId  String  // Author/proponent
  roomId  String  // Context
  text    String  // Content
}
```

**This also tracks commitments:**
- "Alice posted claim X" = Alice committed to X
- "Bob attacked claim X" = Bob challenged Alice's commitment

**Question:** What does a separate CommitmentStore table add?

**Answer:** Nothing except:
- ❌ Data duplication (same info in 3 places: Claim, DialogueMove, CommitmentStore)
- ❌ Synchronization risk (tables could diverge)
- ❌ Query complexity (now need joins across 3 tables)

---

**ROI:** ⭐ **VERY LOW PRIORITY** — Pure redundancy, no added value

**Recommendation:** **DO NOT IMPLEMENT** — Document that **DialogueMove table serves as commitment store**. Write mapping guide:
```
DDF Concept         Mesh Implementation
-----------         -------------------
assert(P, fact, φ)  Claim.create({ userId: P, text: φ })
retract(P, loc)     DialogueMove.create({ type: RETRACT, replyTargetId: loc })
CS_P                DialogueMove.findMany({ where: { userId: P } })
ask_justify(Q, P, t) DialogueMove.create({ type: WHY, targetClaimId: t })
```

---

## 9. ❌ **Haskell/Agda Verification** (NOT WORTH PURSUING)

### Status: **NOT IMPLEMENTED** — Wrong technology stack

**What It Is:**
- Rewrite argumentation engine in Haskell
- Formalize in Agda (dependent type theory)
- Prove correctness properties (grounded extension unique, conflict-free, etc.)

**Why It's Proposed:**
- ✅ **Machine-checkable proofs** (highest confidence in correctness)
- ✅ **Academic credibility** (formal verification)
- ✅ **Research contribution** (first verified argumentation platform)

**Why It's Not Worth It:**

#### Problem 1: Wrong Language

**Current Stack:**
- TypeScript (Next.js, React, Prisma)
- Node.js backend
- PostgreSQL database

**Haskell/Agda Requires:**
- Complete rewrite of `lib/argumentation/` (~2000 lines)
- Haskell web framework (Yesod? Servant?)
- FFI bindings or API gateway (TypeScript ↔ Haskell)

**Effort:** 3-4 months (full rewrite + integration)

---

#### Problem 2: Property-Based Testing is 95% as Good

**Alternative:** QuickCheck-style tests in TypeScript

**Example:**
```typescript
// test/argumentation/properties.test.ts
import fc from 'fast-check';

describe('Dung AF Properties', () => {
  it('grounded extension is unique', () => {
    fc.assert(fc.property(
      arbitraryAF(),  // Generate random AF
      (af) => {
        const groundedExts = computeGrounded(af);
        expect(groundedExts.length).toBeLessThanOrEqual(1);
      }
    ));
  });

  it('grounded extension is conflict-free', () => {
    fc.assert(fc.property(
      arbitraryAF(),
      (af) => {
        const [grounded] = computeGrounded(af);
        if (!grounded) return true;
        for (const arg of grounded) {
          for (const other of grounded) {
            expect(af.attacks).not.toContainEqual([arg, other]);
          }
        }
      }
    ));
  });
});
```

**Benefits:**
- ✅ **Automated testing** (runs in CI)
- ✅ **Same language** (TypeScript)
- ✅ **High confidence** (thousands of random cases)
- ✅ **Low effort** (2-3 days)

**Difference from Agda:**
- Agda: **100% certainty** (mathematical proof)
- QuickCheck: **99.9% confidence** (probabilistic)

**Trade-off:** Is 0.1% more confidence worth 3-4 months rewrite? **❌ NO**

---

**ROI:** ⭐ **NOT WORTH IT** — Massive effort, marginal benefit over property testing

**Recommendation:** **DO NOT PURSUE** — Instead:
1. Implement QuickCheck-style property tests (2-3 days)
2. Document key properties (uniqueness, conflict-free, etc.)
3. If academic verification needed: **Formalize in Agda separately** (research artifact, not production code)

---

## 10. ❌ **DisCoCat NLP** (NOT WORTH PURSUING)

### Status: **NOT IMPLEMENTED** — Overkill for current needs

**What It Is:**
- Parse sentences with **pregroup grammar** (rigid monoidal category)
- Map to **string diagrams** (boxes = words, wires = types)
- Apply functor to **vector spaces** (compose word embeddings via tensor contractions)
- Result: **Grammatically-aware sentence embeddings**

**Why It's Proposed:**
- ✅ **Respects syntax** (not just bag-of-words)
- ✅ **Compositional** (meaning of parts → meaning of whole)
- ✅ **Category theory** (functorial semantics)

**Why It's Not Worth It:**

#### Problem 1: Current Embeddings Work Fine

**Current System:**
- OpenAI embeddings for claims (via `text-embedding-ada-002`)
- Cosine similarity for claim matching
- Used in NLI fallback for CQ satisfaction (0.72 threshold)

**Results:**
- ✅ Works well in practice
- ✅ Fast (<100ms per claim)
- ✅ No complex setup

**Question:** What problem does DisCoCat solve that embeddings don't?

**Answer:** Edge cases like:
- "John loves Mary" vs. "Mary loves John" (word order matters)
- "The dog bit the man" vs. "The man bit the dog" (subject/object)

**Counter:** ⚠️ **These rarely occur in deliberation claims**
- Claims are usually **declarative statements** ("Climate change is real")
- Not complex sentences with role ambiguity
- Embeddings already distinguish "A causes B" from "B causes A" (tested empirically)

---

#### Problem 2: Significant Complexity

**Required:**
1. Install DisCoPy library (Python)
2. Set up pregroup grammar parser
3. Train/tune tensor contraction parameters
4. Build TypeScript ↔ Python bridge
5. Test accuracy vs. current embeddings

**Effort:** 2-3 weeks

**Benefit:** Marginal improvement on edge cases

---

**ROI:** ⭐ **NOT WORTH IT** — High complexity, marginal benefit

**Recommendation:** **DO NOT PURSUE** — Current embeddings are sufficient. If accuracy issues arise:
1. First try **fine-tuning** embeddings on deliberation data (easier)
2. Try **GPT-4 semantic similarity** (higher quality, same API)
3. **Only then** consider DisCoCat (last resort)

---

## 11. ❌ **PCR5/PCR6 Conflict Resolution** (NOT WORTH PURSUING)

### Status: **NOT IMPLEMENTED** — No use case

**What It Is:**
- Advanced Dempster-Shafer combination rules
- PCR5: Proportional conflict redistribution (rule 5)
- PCR6: Proportional conflict redistribution (rule 6)
- Handles **highly conflicting evidence** (e.g., expert A says 0.9, expert B says 0.1)

**Why It's Proposed:**
- ✅ **Better than Dempster's rule** (which fails for high conflict)
- ✅ **Research-backed** (Dezert-Smarandache theory)

**Why It's Not Worth It:**

#### Problem 1: No Real-World Conflict Scenarios

**Question:** When does Mesh encounter highly conflicting evidence?

**Scenarios:**
1. **User A posts claim "X is true"** (confidence 0.8)
2. **User B attacks with "X is false"** (creates ConflictApplication)

**Current System Handles This:**
- Attack reduces confidence of claim
- Dung semantics determines acceptance
- No need for probabilistic fusion

**PCR5/PCR6 Needed When:**
- **Same claim** has **multiple independent confidence sources** that **strongly conflict**
- Example: Expert A assigns belief mass [0.9, 0.05, 0.05] (bel=0.9, pl=0.95, unc=0.05)
           Expert B assigns belief mass [0.05, 0.9, 0.05] (bel=0.05, pl=0.1, unc=0.05)
- Dempster's rule fails (K = 0.86 conflict)

**Mesh Reality:**
- ❌ Claims don't have multiple confidence sources
- ❌ Confidence comes from argument structure (not expert testimony)
- ❌ Conflicts are **structural** (attacks) not **probabilistic** (masses)

---

#### Problem 2: Current DS Mode is Simplified

**Implementation in `/api/evidential/score/route.ts`:**
```typescript
const k = 1; // No conflict resolution
return { bel: mBel, pl: 1 }; // No explicit mass on ¬φ
```

**Status:** ✅ **Works for supportive evidence** (all arguments favor same conclusion)

**When It Breaks:**
- ❌ Conflicting expert opinions (doesn't occur)
- ❌ Contradictory sensor readings (doesn't occur)

**Conclusion:** PCR5/PCR6 solves problem that **doesn't exist** in Mesh's domain

---

**ROI:** ⭐ **NOT WORTH IT** — No use case, high complexity

**Recommendation:** **DO NOT IMPLEMENT** — Document DS mode limitation:
```typescript
/**
 * NOTE: Current DS mode assumes supportive evidence.
 * If highly conflicting evidence arises (e.g., expert disagreement),
 * consider implementing PCR5/PCR6 rules per Dezert-Smarandache theory.
 * 
 * Current limitation: k=1 (no conflict), pl=1 (no mass on ¬φ)
 * Impact: Works for argument accrual, not for conflicting testimony
 */
```

---

## 📊 Priority Matrix Summary

| Framework | Effort | Benefit | Framework Clash? | Status | Decision |
|-----------|--------|---------|------------------|--------|----------|
| **Dialogue Visualization** | 16 weeks | ⭐⭐⭐⭐⭐ | ✅ None | Ready | **✅ KEEP/PURSUE** |
| **Per-Derivation Assumptions** | 0 (done) | ⭐⭐⭐⭐⭐ | ✅ None | Complete | **✅ KEEP (UI work)** |
| **Confidence-Scheme Integration** | 3-5 hours | ⭐⭐⭐⭐ | ✅ None | Backend ready | **✅ KEEP/PURSUE** |
| **Ludics Formalization** | 8-10 hours | ⭐⭐⭐⭐ | ✅ None | 95% done | **✅ KEEP (docs)** |
| **Topological Argumentation** | 3-4 weeks | ⭐⭐ | ⚠️ Alternative | Research | **⏸️ DEFER (side project)** |
| **DDF 8-Stage Protocol** | 8 weeks | ⭐⭐ | ❌ **Yes** | N/A | **❌ REMOVED** |
| **Sentence Type Ontology** | 2-3 weeks | ⭐⭐ | ⚠️ Breaking | N/A | **❌ REMOVED** |
| **Commitment Stores** | 1 week | ⭐ | ❌ Redundant | N/A | **❌ REMOVED** |
| **Haskell/Agda Verification** | 3-4 months | ⭐⭐ | ❌ Wrong stack | N/A | **❌ REMOVED** |
| **DisCoCat NLP** | 2-3 weeks | ⭐ | ⚠️ Overkill | N/A | **❌ REMOVED** |
| **PCR5/PCR6 DS Rules** | 1-2 weeks | ⭐ | ⚠️ No use case | N/A | **❌ REMOVED** |

---

## 🎯 Recommended Roadmap (Post-Dialogue Viz)

### ✅ Phase A: Keep/Pursue - High-Value Immediate Work (1 week)
1. ✅ **Confidence-Scheme Integration** (3-5 hours)
   - Read `validators.baseConfidence`
   - Apply CQ penalty
   - Add temporal decay
2. ✅ **Ludics Documentation** (8-10 hours)
   - Formal specification
   - Developer guide
   - Research paper draft

### ✅ Phase B: Keep/Pursue - Dialogue Visualization (16 weeks)
- Follow Phases 1-7 roadmap (already documented)
- Parallel work: Ludics paper writing
- UI visualization for assumption graphs

### ✅ Phase C: Keep/Pursue - Research Contributions (Ongoing)
1. ✅ Publish ludics integration paper (COMMA 2026)
2. ✅ Publish proof obligation enforcement paper (COMMA 2026)
3. ✅ UI components for assumption graph visualization

### ⏸️ Phase D: Deferred - Future Research Considerations (6-12+ months, separate track)
- **Topological Argumentation Model** as **separate research project**
  - Not blocking production features
  - Consider as academic contribution / PhD thesis topic
  - Better as standalone research paper than platform feature
  - May inform future theoretical foundations but not immediate implementation

### ❌ Phase E: Removed - Not Part of Project Roadmap
The following frameworks are **explicitly removed** from all roadmaps and will **not** be implemented:
- ❌ DDF 8-Stage Protocol (framework clash with existing dialogue system)
- ❌ Sentence Type Ontology (breaking change, unclear benefit)
- ❌ Commitment Stores (redundant with DialogueMove table)
- ❌ Haskell/Agda Verification (wrong technology stack)
- ❌ DisCoCat NLP (overkill, current embeddings sufficient)
- ❌ PCR5/PCR6 Conflict Resolution (no use case in Mesh's domain)

---

## 💡 Key Insights

### What Makes a Framework Worth Pursuing?

✅ **Good Candidates:**
1. **Complements existing system** (no rewrites)
2. **Clear UX benefit** (users see value)
3. **Low-medium effort** (<2 weeks)
4. **No framework conflicts** (integrates cleanly)

❌ **Bad Candidates:**
1. **Requires breaking changes** (sentence types, locutions)
2. **Redundant with existing features** (commitment stores)
3. **No clear user benefit** (topological belief)
4. **Wrong technology stack** (Haskell/Agda)
5. **Solves non-problems** (PCR5/PCR6, DisCoCat)

### Why DDF Doesn't Fit

**DDF is designed for:**
- Formal protocol specification
- Academic rigor
- Agent-based systems
- Explicit commitment tracking

**Mesh is designed for:**
- Real humans collaborating
- Intuitive UX (not formal stages)
- Implicit commitments (via moves)
- Production reliability

**Gap:** DDF optimizes for **protocol correctness**. Mesh optimizes for **user experience**. These are different goals.

**Conclusion:** Better to document **how Mesh achieves DDF goals** using different mechanisms than force DDF protocol onto existing system.

---

## 📋 Action Items

### Immediate (This Week):
1. ✅ Complete this priority analysis (DONE)
2. ✅ Start dialogue visualization Phase 1 (database schema)
3. ✅ Implement confidence-scheme integration (3-5 hours)

### Short-Term (Next 2 Weeks):
4. ✅ Write ludics formalization document
5. ✅ Continue dialogue viz implementation
6. ✅ Document DDF→Mesh mapping (for academic papers)

### Medium-Term (Next 2 Months):
7. ✅ Complete dialogue visualization Phases 1-4
8. ✅ Submit ludics paper to COMMA 2026
9. ✅ UI for assumption graph visualization

### Long-Term (6-12 Months):
10. ⚠️ Revisit deferred frameworks **only if clear need arises**
11. ⚠️ Property-based testing (QuickCheck-style)
12. ⚠️ Consider topological model as research artifact

---

## 🎉 Wins Summary

**What We Learned:**
- ✅ Current system is **90% complete** (per status review)
- ✅ **Per-derivation assumptions already done** (Gap 4 resolved)
- ✅ Most "gaps" are **academic frameworks** not **missing features**
- ✅ **Dialogue visualization** is the clear next priority (roadmap ready)

**✅ What We're KEEPING/PURSUING:**
- ✅ **Dialogue visualization** (clear value, ready to implement, 16 weeks)
- ✅ **Confidence-scheme integration** (quick win, 3-5 hours)
- ✅ **Ludics documentation** (research contribution, 8-10 hours)
- ✅ **Assumption graph UI** (leverage completed backend)

**⏸️ What We're DEFERRING (Side Project):**
- ⏸️ **Topological Argumentation Model** (research contribution, not core feature)
  - Consider as separate academic paper / PhD research
  - Not blocking production work
  - May inform future theoretical foundations

**❌ What We're NOT DOING (Removed from All Roadmaps):**
- ❌ **DDF protocol** (framework clash with existing dialogue system)
- ❌ **Commitment stores** (redundant with DialogueMove table)
- ❌ **Sentence types** (breaking change, unclear benefit)
- ❌ **Haskell/Agda** (wrong technology stack)
- ❌ **DisCoCat** (overkill for current needs)
- ❌ **PCR5/PCR6** (no use case in practice)

**Strategic Insight:** The research synthesis identified **many theoretical frameworks**, but most don't map to **practical user needs**. The system is already production-ready. Focus should be on **completing dialogue viz**, **quick wins** (confidence-scheme integration), and **documenting existing innovations** (ludics, proof obligations) for research credit.

**Decision Rationale:** 
- Frameworks that **complement** existing system (dialogue viz, confidence integration) → **KEEP**
- Frameworks that **conflict** with existing system (DDF, commitment stores) → **REMOVE**
- Frameworks that are **research-oriented** with no clear UX benefit (topological model) → **DEFER** as side project
- Frameworks that require **wrong technology** or solve **non-problems** (Haskell, DisCoCat, PCR5/PCR6) → **REMOVE**

---

**Status:** ✅ READY TO PROCEED with dialogue visualization Phase 1

**Next Document:** Start implementing Phase 1 database schema extensions

---

**End of Priority Analysis**
