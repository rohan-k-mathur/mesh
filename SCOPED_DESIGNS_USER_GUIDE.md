# Scoped Designs User Guide

**Version:** 1.0  
**Date:** November 27, 2025  
**For:** Mesh Users & Moderators  
**Feature:** Phase 4 Multi-Scope Deliberations

---

## Table of Contents

1. [Introduction](#introduction)
2. [What Are Scoped Designs?](#what-are-scoped-designs)
3. [When to Use Scoping](#when-to-use-scoping)
4. [Scoping Strategies](#scoping-strategies)
5. [Using the Scope Selector](#using-the-scope-selector)
6. [Per-Scope Commands](#per-scope-commands)
7. [Forest View Interpretation](#forest-view-interpretation)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)
10. [FAQ](#faq)

---

## Introduction

**Scoped Designs** is a Phase 4 feature (November 2025) that enables Ludics analysis of **multi-topic deliberations**. Instead of treating all dialogue moves as a single monolithic interaction, the system can now:

- **Separate topics** (e.g., Climate, Budget, Healthcare)
- **Track actor pairs** (e.g., Alice-vs-Bob, Alice-vs-Carol)
- **Isolate arguments** (each argument analyzed independently)

This guide will help you understand when and how to use scoped designs effectively.

---

## What Are Scoped Designs?

### The Problem (Legacy Mode)

Before Phase 4, Ludics created exactly **2 designs** per deliberation:
- **Proponent (P):** All assertions and defenses
- **Opponent (O):** All challenges and attacks

This worked well for single-topic deliberations but caused issues with multi-topic discussions:

```
Topic: Climate Change
  Alice: "Carbon tax is effective"
  Bob: "It hurts the economy"

Topic: Budget
  Alice: "Increase education spending"
  Carol: "Deficit is too high"

→ Ludics mixed all these into ONE P/O pair
→ Orthogonality check meaningless (different topics!)
→ Convergence detection confused
```

### The Solution (Scoped Designs)

Phase 4 creates **multiple P/O pairs** (one per scope):

```
Scope: topic:climate
  ├─ Climate:P (Alice's climate assertions)
  └─ Climate:O (Bob's climate challenges)

Scope: topic:budget
  ├─ Budget:P (Alice's budget assertions)
  └─ Budget:O (Carol's budget challenges)

→ Each scope analyzed independently
→ Clear convergence per topic
→ Orthogonality meaningful within scope
```

**Key Benefit:** You can now have productive Ludics analysis even in complex, multi-threaded deliberations.

---

## When to Use Scoping

### ✅ Use Scoping When:

1. **Multiple Topics Discussed**
   - Deliberation covers 2+ distinct subjects
   - Example: "Climate Policy and Economic Reform Town Hall"

2. **Different Actor Pairs Interact**
   - Alice debates Bob, Carol debates Dave (independent discussions)
   - Example: "Multi-Party Negotiation"

3. **Argument-Level Analysis Needed**
   - Each argument should be analyzed in isolation
   - Example: "Thesis Defense with Multiple Claims"

4. **Convergence Per-Topic Matters**
   - You want to know if Climate discussion converged (even if Budget didn't)

### ❌ Don't Use Scoping When:

1. **Single Topic Deliberation**
   - Everyone discussing the same subject
   - Legacy mode is simpler and sufficient

2. **Small Deliberations (<10 moves)**
   - Overhead of scoping not worth it
   - Use legacy mode

3. **You Want Global Orthogonality**
   - Sometimes you DO want to check if Alice's entire position is orthogonal to Bob's
   - Scoping would fragment this

---

## Scoping Strategies

Four strategies are available. Choose based on your deliberation structure:

### 1. Legacy (Default) — Single Scope

**Use Case:** Traditional single-topic deliberations

```typescript
scopingStrategy: "legacy"
```

**Result:**
- 2 designs (P + O)
- All moves in one scope
- Backward compatible with existing deliberations

**Example:** "Should we adopt carbon pricing?"
- All moves → 1 P/O pair

---

### 2. Topic-Based Scoping

**Use Case:** Multi-topic town halls, policy forums

```typescript
scopingStrategy: "topic"
```

**Result:**
- 2N designs (N = number of topics)
- Each topic gets separate P/O pair
- Topic metadata from deliberation structure

**Example:** "Climate & Budget Town Hall"
- Climate moves → Climate:P, Climate:O
- Budget moves → Budget:P, Budget:O

**Best For:**
- Town halls covering multiple policy areas
- Conferences with parallel sessions
- Multi-issue debates

---

### 3. Actor-Pair Scoping

**Use Case:** Multi-party negotiations, coalition building

```typescript
scopingStrategy: "actor-pair"
```

**Result:**
- 2N designs (N = number of unique actor pairs)
- Each pair gets separate P/O pair
- Tracks who is debating whom

**Example:** "Three-Way Negotiation" (Alice, Bob, Carol)
- Alice-vs-Bob moves → AliceBob:P, AliceBob:O
- Alice-vs-Carol moves → AliceCarol:P, AliceCarol:O
- Bob-vs-Carol moves → BobCarol:P, BobCarol:O

**Best For:**
- Multi-party negotiations
- Coalition formation analysis
- Social network argument mapping

---

### 4. Argument-Level Scoping

**Use Case:** Thesis defenses, structured debates

```typescript
scopingStrategy: "argument"
```

**Result:**
- 2N designs (N = number of arguments)
- Each argument analyzed independently
- Fine-grained convergence tracking

**Example:** "Thesis Defense" (3 main claims)
- Claim 1 moves → Arg1:P, Arg1:O
- Claim 2 moves → Arg2:P, Arg2:O
- Claim 3 moves → Arg3:P, Arg3:O

**Best For:**
- Academic thesis defenses
- Structured argument evaluation
- Claim-by-claim analysis

---

## Using the Scope Selector

### Location

The **Scope Selector** appears at the top of the Ludics Panel (DeepDive tab):

```
┌─────────────────────────────────────┐
│ Ludics Panel                        │
├─────────────────────────────────────┤
│ Scope: [Topic: Climate Policy ▼]   │ ← Scope Selector
│                                     │
│ [Compile] [Step] [Orthogonal] ...  │
└─────────────────────────────────────┘
```

### How to Use

1. **Select Active Scope**
   - Click dropdown to see all available scopes
   - Options determined by scoping strategy used during compilation

2. **Scope Labels**
   - **Legacy:** "Legacy (All)"
   - **Topic:** "Topic: Climate Policy", "Topic: Budget Reform"
   - **Actor-Pair:** "Alice vs Bob", "Carol vs Dave"
   - **Argument:** "Argument: Carbon tax is effective"

3. **Commands Apply to Active Scope**
   - All buttons (Step, Orthogonal, NLI, etc.) operate on selected scope
   - Results displayed are for that scope only

4. **Switching Scopes**
   - Simply select different scope from dropdown
   - Previous results cached (no re-computation needed)

---

## Per-Scope Commands

All Ludics commands are now **scope-aware**. Here's what each button does:

### Compile Button

**What It Does:** Recompiles all dialogue moves into Ludics designs

**Scope Behavior:**
- Creates 2N designs based on scoping strategy
- Wipes existing designs (fresh compilation)
- Scope selector populates after compilation

**Usage:**
```
1. Choose scoping strategy from dropdown (Legacy/Topic/Actor-Pair/Argument)
2. Click "Compile"
3. Wait for compilation (1-5 seconds)
4. Scope selector appears with available scopes
```

**When to Use:**
- After adding new dialogue moves
- When changing scoping strategy
- After major deliberation structure changes

---

### Step Button

**What It Does:** Runs one interaction step for the active scope

**Scope Behavior:**
- Finds P/O designs in active scope
- Steps only those designs (others untouched)
- Trace shown is for this scope only

**Usage:**
```
1. Select scope from dropdown
2. Click "Step"
3. View trace ribbon for this scope
```

**When to Use:**
- To advance interaction in one topic
- After adding moves to a specific scope
- When you want to see convergence for one topic

**Tip:** Use "Step All Scopes" (future feature) to step all scopes at once.

---

### Orthogonality Check

**What It Does:** Checks if P and O designs in active scope are orthogonal

**Scope Behavior:**
- Checks only the active scope
- Result shown in button: ✓ or ✗
- Badge shows "orthogonal" or "not orthogonal"

**Usage:**
```
1. Select scope
2. Click "Orthogonal"
3. See result badge
```

**Interpretation:**
- ✅ **Orthogonal:** P and O reach convergence (one side wins)
- ❌ **Not Orthogonal:** Interaction diverges (no resolution)

**Per-Scope Meaning:**
- Climate scope orthogonal → Climate discussion resolved
- Budget scope not orthogonal → Budget still under debate

---

### Append Daimon (†)

**What It Does:** Adds a convergence marker (daimon) at a specific locus

**Scope Behavior (NEW - Week 2):**
- Panel shows scope selector + locus dropdown
- Locus options pulled from Opponent design in selected scope
- Daimon appended only to that scope

**Usage:**
```
1. Click "Append †" to open panel
2. Select target scope
3. Select locus from dropdown (sorted by depth)
4. Click "Append †"
5. Toast shows: "Daimon appended at 0.1.2 in scope: Climate"
```

**When to Use:**
- To manually close a discussion thread
- Mark a locus as "accepted" or "conceded"
- Test convergence scenarios

---

### NLI Analysis

**What It Does:** Detects contradictions in active scope using Natural Language Inference

**Scope Behavior (NEW - Week 2):**
- Analyzes only acts in active scope
- Counts contradictions (relation="contradicts", score≥0.85)
- Button shows count: "NLI (5)" for 5 contradictions
- Results cached per scope

**Usage:**
```
1. Select scope
2. Click "NLI"
3. Wait for analysis (1-3 seconds)
4. See contradiction count in button
5. Hover for tooltip: "5 contradiction(s) in this scope"
```

**Interpretation:**
- High count → Many conflicting positions in this topic
- Low count → Relatively aligned discussion
- 0 → No contradictions detected (rare)

**Use Case:** Identify which topics have most disagreement.

---

### Stable Sets

**What It Does:** Computes stable extensions for arguments in active scope

**Scope Behavior (NEW - Week 2):**
- Queries Argumentation Framework (AF) for active scope
- Shows extension count: "Stable sets (3)"
- Cached per scope

**Usage:**
```
1. Select scope
2. Click "Stable sets"
3. Wait for computation (1-2 seconds)
4. See extension count in button
```

**Interpretation:**
- 1 extension → Unique acceptable set of arguments
- Multiple extensions → Ambiguous (several valid positions)
- 0 extensions → Paradox (no coherent position)

**Per-Scope Meaning:**
- Climate has 1 stable set → Clear consensus on climate arguments
- Budget has 3 stable sets → Multiple valid budget positions

---

### Attach Testers

**What It Does:** Attaches consensus testers to guide interaction

**Scope Behavior (NEW - Week 2):**
- Panel shows scope selector + work selector
- Testers attached only to selected scope
- Filters designs by scope to find P/O pair

**Usage:**
```
1. Click "Attach testers" to open panel
2. Select target scope
3. Choose IH/TC work from dropdown
4. Click "Attach"
5. Toast shows: "Testers attached to scope: Healthcare"
```

**When to Use:**
- Force convergence in one topic
- Test "what if" scenarios per topic
- Guide interaction toward consensus

---

## Forest View Interpretation

### What Is Forest View?

**Forest View** (`LudicsForest.tsx`) displays multiple Ludics trees side-by-side, one per scope.

### Layout

```
┌──────────────┬──────────────┬──────────────┐
│ Climate Tree │ Budget Tree  │ Health Tree  │
│              │              │              │
│   P ←→ O     │   P ←→ O     │   P ←→ O     │
│   Converged  │   Diverging  │   Converged  │
└──────────────┴──────────────┴──────────────┘
```

### Visual Cues

**Color Coding:**
- 🟢 **Green Badge:** Orthogonal (converged)
- 🔴 **Red Badge:** Not orthogonal (diverging)
- 🔵 **Blue Badge:** Stepped (in progress)
- ⚪ **Gray Badge:** Not stepped yet

**Tree Structure:**
- **Vertical lines:** Locus paths (0.1, 0.1.1, etc.)
- **P/O markers:** Proponent (blue) vs Opponent (red) acts
- **† symbol:** Daimon (convergence point)

### Reading a Tree

**Example: Climate Tree**

```
0 (root)
├─ 0.1 [P] "Carbon tax is effective"
│  ├─ 0.1 [O] "WHY: Premise doubtful?"
│  └─ 0.1.1 [P] "Studies show 30% reduction"
│     └─ 0.1.1 [O] "WHY: Causation unclear?"
│        └─ 0.1.1.1 [P] "Randomized trials..."
│           └─ † [Converged]
└─ 0.2 [P] "Creates jobs"
   └─ 0.2 [O] "Economic impact overstated"
      └─ 0.2.1 [P] ...
```

**Interpretation:**
- Locus 0.1 converged (daimon reached)
- Locus 0.2 still active
- P winning on carbon effectiveness argument

### Comparing Scopes

**Use Forest View to:**
- See which topics converged vs diverged
- Compare depth of discussion (tree height)
- Identify which scope needs more work
- Spot patterns (e.g., all topics diverge at premise challenges)

**Example Analysis:**

| Scope | Status | Depth | Decisive Steps |
|-------|--------|-------|----------------|
| Climate | ✅ Converged | 4 levels | 3, 7, 12 |
| Budget | ❌ Diverged | 3 levels | None |
| Healthcare | ✅ Converged | 5 levels | 2, 9 |

**Insight:** Budget needs more dialogue; Climate and Healthcare resolved.

---

## Best Practices

### Choosing Scoping Strategy

1. **Start with Legacy** if unsure
   - Simplest option
   - Can recompile later with scoping

2. **Use Topic Scoping** for most multi-issue deliberations
   - Clear separation by subject
   - Easy to interpret

3. **Actor-Pair Scoping** for network analysis
   - When WHO debates WHO matters
   - Social dynamics important

4. **Argument Scoping** for structured debates
   - Formal thesis defenses
   - Claim-by-claim evaluation

### Workflow Tips

1. **Compile Early**
   - Run after 5-10 moves to establish scopes
   - Don't wait until deliberation is complete

2. **Check All Scopes Regularly**
   - Use Forest View to monitor all topics
   - Focus efforts on diverging scopes

3. **Step Per-Scope, Not Globally**
   - Gives you control over which topics to advance
   - Avoid stepping all scopes blindly

4. **Use NLI to Prioritize**
   - High contradiction count = needs moderation
   - Focus energy on contentious scopes

5. **Stable Sets for Synthesis**
   - Run at end of deliberation
   - Identify coherent positions per topic

### Performance Tips

1. **Limit Scopes for Large Deliberations**
   - 10+ scopes gets unwieldy
   - Consider grouping related topics

2. **Don't Re-Compile Unnecessarily**
   - Compilation is O(N) where N = scope count
   - Only recompile after major changes

3. **Cache Results**
   - Per-scope results are cached
   - Switching scopes is instant

---

## Troubleshooting

### Issue: "No P/O designs found in scope"

**Cause:** Selected scope has no dialogue moves yet

**Solution:**
- Check if moves have been added to this topic
- Verify scoping strategy matches deliberation structure
- Try recompiling with different strategy

---

### Issue: "Scope selector is empty"

**Cause:** Deliberation not compiled with scoping strategy

**Solution:**
1. Click "Compile" button
2. Select scoping strategy (not Legacy)
3. Wait for compilation
4. Scope selector should populate

---

### Issue: "All scopes show 'Legacy (All)'"

**Cause:** Compiled in legacy mode (no scoping)

**Solution:**
- Recompile with topic/actor-pair/argument strategy
- Check deliberation has topics/actors/arguments defined

---

### Issue: "Orthogonality meaningless (always false)"

**Cause:** Scopes not separated properly; mixed topics in one scope

**Solution:**
- Review scoping strategy choice
- Check if topics properly tagged in moves
- Consider manual scope assignment (advanced)

---

### Issue: "Forest view too crowded (can't see trees)"

**Cause:** Too many scopes (10+)

**Solution:**
- Use forest view zoom controls
- Click individual scope to focus
- Consider consolidating related topics

---

### Issue: "Step button does nothing"

**Cause:** No designs in selected scope or already converged

**Solution:**
- Check if scope has moves (compile first)
- Verify P/O pair exists in scope
- Check if already converged (daimon reached)

---

### Issue: "NLI shows 0 contradictions (unexpected)"

**Cause:** Expressions too short, NLI threshold too high, or genuinely aligned

**Solution:**
- Check act expressions have meaningful content
- Verify moves were compiled (not empty acts)
- Try different scope (may be agreement in this one)

---

### Issue: "Stable sets shows 0 extensions"

**Cause:** Argumentation framework has paradox or no arguments in scope

**Solution:**
- Check if arguments exist in this scope
- Review attack relations (may have cycles)
- Verify AF constructed correctly

---

## FAQ

### Q: Can I switch scoping strategy after compilation?

**A:** Yes! Simply:
1. Click "Compile"
2. Choose new strategy
3. Re-compile (wipes old designs)

Existing dialogue moves are preserved; only Ludics designs are rebuilt.

---

### Q: Do scopes share data?

**A:** No. Each scope is **completely independent**:
- Separate P/O designs
- Separate traces
- Separate orthogonality checks
- No cross-scope interactions

This is by design to enable clean per-topic analysis.

---

### Q: Can I manually assign scopes?

**A:** Not currently in UI. Scopes are computed automatically based on strategy.

**Workaround:** Tag moves with topic/actor metadata before compilation, then use appropriate strategy.

---

### Q: What if one scope has 100 moves and another has 3?

**A:** Works fine. Each scope is independent:
- Large scope takes longer to compile/step
- Small scope may be trivial (quick convergence)
- Forest view shows both (may want to zoom)

---

### Q: Can I merge scopes later?

**A:** Not directly. You would need to:
1. Recompile with legacy strategy (merges all)
2. Or manually combine topics in deliberation structure
3. Then recompile

---

### Q: Does scoping affect performance?

**A:** Yes, but favorably:
- **Compilation:** Linear in scope count (O(N))
- **Stepping:** Each scope independent (parallelizable)
- **UI:** Forest view uses virtualization (handles 20+ scopes)

**Recommendation:** 3-10 scopes is sweet spot.

---

### Q: Can I export per-scope results?

**A:** Yes. Future feature: "Export Scope Report" button.

**Current workaround:** 
- Switch to each scope
- Take screenshots
- Use browser dev tools to copy state

---

### Q: What happens to legacy deliberations?

**A:** They continue working unchanged:
- `scope: null` in database
- Treated as single "legacy" scope
- Backward compatible forever

---

### Q: Can I use multiple strategies at once?

**A:** No. One strategy per compilation.

**Workaround:** Run multiple compilations in test environment, compare results.

---

### Q: How do I know which strategy to use?

**Decision Tree:**

```
Is deliberation single-topic?
├─ Yes → Legacy
└─ No → Multi-topic
    ├─ Topics defined in structure? → Topic Scoping
    ├─ Tracking who debates whom? → Actor-Pair Scoping
    └─ Claim-by-claim analysis? → Argument Scoping
```

---

## Conclusion

Scoped Designs unlock powerful multi-topic deliberation analysis in Mesh. Key takeaways:

1. **Choose strategy based on deliberation structure** (topic/actor/argument)
2. **Use scope selector to focus commands** (all buttons scope-aware)
3. **Interpret forest view to see big picture** (which topics converged?)
4. **Per-scope results are cached** (switching scopes is instant)
5. **Start simple (legacy), add scoping later** if needed

For technical details, see:
- `LUDICS_SYSTEM_ARCHITECTURE_MAP.md` - Architecture overview
- `LUDICS_DIALOGUE_INTEGRATION_EXPLAINED.md` - Compilation details
- `LUDICS_API_REFERENCE.md` - API documentation

**Happy deliberating!** 🌲🌳🌲

---

**Version History:**
- **1.0** (Nov 27, 2025): Initial release with Phase 4 scoped designs documentation
