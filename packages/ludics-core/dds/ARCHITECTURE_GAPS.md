# Architecture Gaps: Current vs Target

**Phase 0 Analysis**  
**Date:** December 4, 2025

---

## Executive Summary

This document identifies gaps between the current ludics-core implementation and the target architecture for deliberation-ludics integration.

**Overall Assessment:** ~70% alignment with clear migration path

---

## Current State

### What We Have ✅

| Component | Location | Status |
|-----------|----------|--------|
| UniversalArena | `dds/arena/types.ts` | Working |
| ArenaMove/Position | `dds/arena/types.ts`, `positions.ts` | Working |
| DDS Game Types | `dds/game/types.ts` | Working |
| AI Strategy (Minimax) | `dds/game/ai.ts` | Fixed & Working |
| View/Chronicle Extraction | `dds/views.ts`, `dds/chronicles.ts` | Working |
| Behaviour Types | `dds/behaviours/types.ts` | Working |
| Incarnation Types | `dds/types/incarnation.ts` | Working |
| Prisma Models | `lib/models/schema.prisma` | Defined |

### What's Missing ❌

| Feature | Priority | Gap |
|---------|----------|-----|
| Arena from Deliberation | High | Need parser to build arena from argument tree |
| DialogueAct formalization | High | ✅ **NOW ADDED** in `types/ludics-theory.ts` |
| Address-based polarity | High | ✅ **NOW ADDED** with `polarityAtAddress()` |
| Visitable Path extraction | High | Need path extractor for proof traces |
| Incarnation computation | Medium | Need algorithm from "Visitable Paths" paper |
| Behaviour closure | Medium | Need biorthogonal closure computation |
| Multi-party perspectives | Medium | Need perspective transformation |
| Landscape mapping | Low | New feature for Vision E |

---

## Gap Analysis

### 1. Arena Construction

**Current:**
- `UniversalArena` built manually or from mock data
- Moves added individually
- No automatic derivation from deliberation structure

**Target:**
- Arena automatically built from deliberation arguments
- Addresses derived from argument tree paths
- Ramification computed from possible responses

**Gap:** Need `buildArenaFromDeliberation(deliberationId)` function

**Migration:**
1. ✅ Define `DeliberationArena` type (done in `ludics-theory.ts`)
2. Create `arena/deliberation-parser.ts`
3. Implement address mapping from argument IDs
4. Compute ramifications from argument children

### 2. Address System

**Current:**
- Uses string paths like "0.1.2"
- Polarity determined by `player` field on moves

**Target:**
- Uses `LudicAddress` (number array)
- Polarity derived from address depth (even = +, odd = -)

**Gap:** Minor - utility functions bridge the difference

**Migration:**
1. ✅ Define `LudicAddress` type (done)
2. ✅ Add `polarityAtAddress()` function (done)
3. ✅ Create adapters for conversion (done in `legacy-adapter.ts`)

### 3. Dialogue Act Formalization

**Current:**
- `DialogueAct` in `types.ts` is loose, has multiple optional fields
- Mixed polarity representations ("P", "O", "pos", "neg", "daimon")

**Target:**
- Strict `DialogueAct` from Fouqueré & Quatrini
- Clean polarity ("+" or "-")
- Required fields: polarity, focus, ramification, expression, type

**Gap:** ✅ **RESOLVED** - New type in `ludics-theory.ts`

### 4. Chronicle Structure

**Current:**
- Chronicles in `dds/types.ts` track actions
- `isPositive` indicates ending polarity

**Target:**
- Chronicles have `isComplete` (ends in daimon or terminal)
- Build from theory DialogueActs

**Gap:** ✅ **RESOLVED** - New Chronicle type in `ludics-theory.ts`

### 5. Visitable Path / Proof Trace

**Current:**
- No explicit visitable path extraction
- Game results include winner but not trace analysis

**Target:**
- `VisitablePath` with full trace and incarnation
- `JustifiedNarrative` for human-readable output

**Gap:** Need implementation in Phase 3

**Migration:**
1. ✅ Define `VisitablePath`, `JustifiedNarrative` types (done)
2. Create `extraction/path-extractor.ts`
3. Implement view computation for incarnation
4. Create narrative formatter

### 6. Interaction State

**Current:**
- `GamePlayState` in `game/types.ts`
- Tracks position, strategies, mode

**Target:**
- `InteractionState` with full path, polarity, designs

**Gap:** ✅ **RESOLVED** - New type in `ludics-theory.ts`

### 7. Winner Semantics

**Current:**
- ✅ Faggian-Hyland semantics implemented
- Stuck player loses
- Fixed in recent work

**Target:**
- Same semantics
- Integrate with daimon detection

**Gap:** Mostly aligned, need daimon integration

### 8. Multi-Party Support

**Current:**
- Fixed P/O roles
- Two-player only

**Target:**
- P/O are perspectives, not fixed roles
- Same system for 1-N participants

**Gap:** Need perspective transformation layer

**Migration:**
1. ✅ Document perspective model in type comments (done)
2. Create `interaction/multi-party.ts`
3. Implement `getParticipantPerspective()`

---

## Type Compatibility Matrix

| Theory Type | Legacy Type | Adapter |
|-------------|-------------|---------|
| `LudicAddress` | `string` (locus path) | `locusPathToAddress()` |
| `Polarity` (+/-) | `Polarity` (P/O/pos/neg) | `legacyToTheoryPolarity()` |
| `DialogueAct` | `DialogueAct` | `legacyActToTheory()` |
| `Chronicle` | `Chronicle` | `legacyChronicleToTheory()` |
| `LudicDesignTheory` | `LudicDesign` | `legacyDesignToTheory()` |
| `DeliberationArena` | `UniversalArena` | `legacyArenaToTheory()` |
| `VisitablePath` | (none) | New type |
| `LudicBehaviourTheory` | Behaviour types | `prismaBehaviourToTheory()` |

---

## Prisma Model Alignment

| Theory Type | Prisma Model | Status |
|-------------|--------------|--------|
| `DialogueAct` | `LudicAct` | ✅ Mapped via adapter |
| `Chronicle` | `LudicChronicle` | ✅ Mapped via adapter |
| `LudicDesignTheory` | `LudicDesign` | ✅ Mapped via adapter |
| `LudicBehaviourTheory` | `LudicBehaviour` | ✅ Mapped via adapter |
| `DeliberationArena` | (none) | Runtime only (derived) |
| `VisitablePath` | (none) | Runtime only |
| `InteractionState` | (none) | Runtime only |

---

## Migration Path

### Phase 0 (Current) ✅
1. ✅ Define theory-aligned types in `ludics-theory.ts`
2. ✅ Create adapters for legacy types
3. ✅ Create adapters for Prisma models
4. ✅ Document architecture gaps

### Phase 1 (Next)
1. Create `arena/deliberation-parser.ts`
2. Implement `buildArenaFromDeliberation()`
3. Add address mapping utilities
4. Add ludicability validation

### Phase 2
1. Refactor stepper to use `InteractionState`
2. Implement `detectOutcome()` with daimon support
3. Add multi-party perspective handling

### Phase 3
1. Implement `extractPath()` 
2. Implement `computeIncarnation()`
3. Create narrative formatter

### Phase 4-7
Continue as per roadmap...

---

## Breaking Changes

**None identified.** The migration is additive:
- New types exist alongside legacy types
- Adapters bridge the gap
- Existing APIs continue to work

---

## Files Modified in Phase 0

### New Files
- `dds/types/ludics-theory.ts` - Theory-aligned type definitions
- `dds/adapters/index.ts` - Adapter exports
- `dds/adapters/dialogue-move-adapter.ts` - DialogueMove ↔ DialogueAct
- `dds/adapters/prisma-adapter.ts` - Prisma ↔ Theory types
- `dds/adapters/legacy-adapter.ts` - Legacy DDS ↔ Theory types
- `dds/ARCHITECTURE_GAPS.md` - This document

### Modified Files
- `dds/types/index.ts` - Added theory type exports
- `dds/index.ts` - Added adapter exports

---

## Verification Checklist

Before Phase 1:
- [ ] All new types compile without errors
- [ ] Adapters have test coverage
- [ ] Existing DDS tests still pass
- [ ] Legacy APIs continue to work
