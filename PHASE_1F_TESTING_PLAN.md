# Phase 1f: Testing & Validation Plan

**Priority**: CRITICAL (validates 6,727 lines of untested code)  
**Duration**: 1 week  
**Status**: Ready to Start

---

## Testing Strategy

### Three-Layer Approach
1. **Unit Tests**: Individual functions in isolation
2. **Integration Tests**: Full pipeline workflows
3. **Performance Tests**: Scale and stress testing

---

## Day 1-2: Unit Tests

### Test File Structure
```
__tests__/
  aspic/
    conflictHelpers.test.ts
    core.test.ts
  ludics/
    compileFromMoves.test.ts (ASPIC+ extraction)
    syncToAif.test.ts (CA-node generation)
```

### 1. Test `lib/aspic/conflictHelpers.ts`

**File**: `__tests__/aspic/conflictHelpers.test.ts`

```typescript
import { 
  computeAspicConflictMetadata, 
  extractAspicMetadataFromMove,
  checkDefeatStatus 
} from '@/lib/aspic/conflictHelpers';

describe('computeAspicConflictMetadata', () => {
  it('should compute metadata for undermining attack', () => {
    const cqMetadata = {
      cqId: 'cq_123',
      cqKey: 'CQ_PREMISE_ACCEPTABILITY',
      cqText: 'Is this premise acceptable?',
      schemeKey: 'modus-ponens'
    };
    
    const aspicAttack = {
      type: 'UNDERMINES',
      attackerId: 'arg_A',
      defenderId: 'arg_B',
      succeeded: true
    };
    
    const result = computeAspicConflictMetadata(
      cqMetadata,
      aspicAttack,
      'arg_A',
      'claim_X'
    );
    
    expect(result.aspicAttackType).toBe('undermining');
    expect(result.aspicDefeatStatus).toBe(true);
    expect(result.aspicMetadata.cqKey).toBe('CQ_PREMISE_ACCEPTABILITY');
    expect(result.aspicMetadata.targetScope).toBe('premise');
  });
  
  it('should compute metadata for undercutting attack', () => {
    // Test undercutting (inference attack)
  });
  
  it('should compute metadata for rebutting attack', () => {
    // Test rebutting (conclusion attack)
  });
  
  it('should handle missing ASPIC attack', () => {
    // Test with aspicAttack = null
  });
});

describe('extractAspicMetadataFromMove', () => {
  it('should extract ASPIC metadata from DialogueMove payload', () => {
    const payload = {
      cqId: 'cq_123',
      cqKey: 'CQ_EXCEPTIONAL_CASE',
      cqText: 'Is there an exceptional case?',
      aspicAttack: {
        type: 'UNDERCUTS',
        attackerId: 'arg_A',
        defenderId: 'arg_B',
        succeeded: true
      },
      aspicMetadata: {
        targetScope: 'inference',
        reason: 'Rule may not apply in this case'
      }
    };
    
    const result = extractAspicMetadataFromMove(payload);
    
    expect(result).not.toBeNull();
    expect(result.attackType).toBe('UNDERCUTS');
    expect(result.targetScope).toBe('inference');
    expect(result.cqKey).toBe('CQ_EXCEPTIONAL_CASE');
  });
  
  it('should return null when no ASPIC attack present', () => {
    const result = extractAspicMetadataFromMove({});
    expect(result).toBeNull();
  });
});

describe('checkDefeatStatus', () => {
  it('should return true when no preferences block attack', () => {
    const attack = {
      type: 'UNDERMINES',
      attacker: { id: 'arg_A', premises: ['p1'], conclusion: 'c1' },
      target: { id: 'arg_B', premises: ['p2'], conclusion: 'c2' }
    };
    
    const theory = {
      arguments: [attack.attacker, attack.target],
      preferences: []
    };
    
    const result = checkDefeatStatus(attack, theory);
    expect(result).toBe(true);
  });
  
  it('should return false when preference blocks attack', () => {
    // Test with preferences that reverse defeat
  });
});
```

**Run**: `npm run test -- conflictHelpers.test.ts`

### 2. Test Ludics ASPIC+ Extraction

**File**: `__tests__/ludics/compileFromMoves.test.ts`

```typescript
import { expandActsFromMove } from '@/packages/ludics-engine/compileFromMoves';

describe('expandActsFromMove - ASPIC+ Integration', () => {
  it('should extract ASPIC+ metadata from DialogueMove', () => {
    const move = {
      id: 'move_123',
      kind: 'WHY',
      payload: {
        acts: [
          {
            polarity: 'neg',
            locusPath: '0.1',
            expression: 'Why is this true?',
            openings: [],
            additive: false
          }
        ],
        cqKey: 'CQ_PREMISE_ACCEPTABILITY',
        cqText: 'Is premise P1 acceptable?',
        aspicAttack: {
          type: 'UNDERMINES',
          attackerId: 'arg_A',
          defenderId: 'arg_B',
          succeeded: true
        },
        aspicMetadata: {
          targetScope: 'premise',
          reason: 'Premise lacks evidence'
        }
      },
      targetType: 'argument',
      targetId: 'arg_B',
      actorId: 'user_123'
    };
    
    const acts = expandActsFromMove(move);
    
    expect(acts).toHaveLength(1);
    expect(acts[0].aspic).not.toBeNull();
    expect(acts[0].aspic.attackType).toBe('UNDERMINES');
    expect(acts[0].aspic.cqKey).toBe('CQ_PREMISE_ACCEPTABILITY');
    expect(acts[0].aspic.targetScope).toBe('premise');
  });
  
  it('should handle moves without ASPIC metadata', () => {
    const move = {
      id: 'move_456',
      kind: 'ASSERT',
      payload: {
        acts: [{ polarity: 'pos', locusPath: '0', expression: 'Claim' }]
      },
      targetType: 'claim',
      targetId: 'claim_X',
      actorId: 'user_123'
    };
    
    const acts = expandActsFromMove(move);
    
    expect(acts[0].aspic).toBeNull();
  });
});
```

### 3. Test AIF CA-Node Generation

**File**: `__tests__/ludics/syncToAif.test.ts`

```typescript
import { createCANodeForAspicAttack } from '@/lib/ludics/syncToAif';

describe('CA-node Generation', () => {
  it('should create CA-node from ASPIC metadata', async () => {
    const attackerAct = {
      id: 'act_123',
      kind: 'PROPER',
      polarity: 'O',
      locus: { path: '0.1' },
      metaJson: {
        moveId: 'move_123',
        targetId: 'arg_B',
        aspic: {
          attackType: 'undercutting',
          attackerId: 'arg_A',
          defenderId: 'arg_B',
          succeeded: true,
          cqKey: 'CQ_EXCEPTIONAL_CASE'
        }
      }
    };
    
    // Mock setup for defender act, nodes, etc.
    const result = await createCANodeForAspicAttack(
      'delib_123',
      attackerAct,
      attackerNode,
      attackerAct.metaJson.aspic,
      allActs,
      nodesByActId
    );
    
    expect(result.caNodeCreated).toBe(true);
    expect(result.edgesCreated).toBe(2);
    
    // Verify CA-node created in database
    const caNode = await prisma.aifNode.findFirst({
      where: {
        nodeKind: 'CA',
        deliberationId: 'delib_123'
      }
    });
    
    expect(caNode).not.toBeNull();
    expect(caNode.dialogueMetadata.aspicAttackType).toBe('undercutting');
  });
});
```

---

## Day 3-4: Integration Tests

### End-to-End Provenance Chain

**File**: `__tests__/integration/cq-to-aif.test.ts`

```typescript
describe('CQ → DialogueMove → Ludics → AIF Pipeline', () => {
  it('should preserve ASPIC+ metadata through full stack', async () => {
    // 1. Create deliberation and arguments
    const delib = await createTestDeliberation();
    const argB = await createTestArgument(delib.id);
    
    // 2. Select Critical Question (Phase 1c)
    const cqResponse = await POST('/api/cqs/dialogue-move', {
      deliberationId: delib.id,
      argumentId: argB.id,
      cqKey: 'CQ_PREMISE_ACCEPTABILITY',
      cqText: 'Is premise P1 acceptable?'
    });
    
    expect(cqResponse.status).toBe(200);
    const { dialogueMoveId } = cqResponse.data;
    
    // 3. Verify DialogueMove has ASPIC+ payload
    const dialogueMove = await prisma.dialogueMove.findUnique({
      where: { id: dialogueMoveId }
    });
    
    expect(dialogueMove.payload.aspicAttack).toBeDefined();
    expect(dialogueMove.payload.aspicAttack.type).toBe('UNDERMINES');
    
    // 4. Run Ludics compilation
    await POST(`/api/deliberations/${delib.id}/compile-ludics`);
    
    // 5. Verify LudicAct has ASPIC+ metadata
    const ludicActs = await prisma.ludicAct.findMany({
      where: {
        design: { deliberationId: delib.id }
      }
    });
    
    const actWithAspic = ludicActs.find(a => 
      a.metaJson?.aspic?.attackType
    );
    
    expect(actWithAspic).toBeDefined();
    expect(actWithAspic.metaJson.aspic.attackType).toBe('UNDERMINES');
    expect(actWithAspic.metaJson.aspic.cqKey).toBe('CQ_PREMISE_ACCEPTABILITY');
    
    // 6. Run AIF synchronization
    await POST(`/api/deliberations/${delib.id}/sync-aif`);
    
    // 7. Verify CA-node generated
    const caNode = await prisma.aifNode.findFirst({
      where: {
        deliberationId: delib.id,
        nodeKind: 'CA'
      }
    });
    
    expect(caNode).toBeDefined();
    expect(caNode.dialogueMetadata.aspicAttackType).toBe('undermining');
    expect(caNode.dialogueMetadata.cqKey).toBe('CQ_PREMISE_ACCEPTABILITY');
    
    // 8. Verify edges: attacker → CA → defender
    const edges = await prisma.aifEdge.findMany({
      where: {
        OR: [
          { sourceId: caNode.id },
          { targetId: caNode.id }
        ]
      }
    });
    
    expect(edges).toHaveLength(2);
    expect(edges.some(e => e.edgeRole === 'attacks_via')).toBe(true);
    expect(edges.some(e => e.edgeRole === 'conflicts_with')).toBe(true);
  });
});
```

---

## Day 5: Performance Tests

**File**: `__tests__/performance/large-deliberation.test.ts`

```typescript
describe('Performance: Large Deliberations', () => {
  it('should compile 1000+ moves with ASPIC+ metadata in < 5s', async () => {
    const delib = await createTestDeliberation();
    
    // Create 1000 moves with ASPIC+ attacks
    const moves = [];
    for (let i = 0; i < 1000; i++) {
      moves.push({
        kind: 'WHY',
        deliberationId: delib.id,
        payload: {
          acts: [{ polarity: 'neg', locusPath: `0.${i}` }],
          aspicAttack: {
            type: 'UNDERMINES',
            attackerId: `arg_${i}`,
            defenderId: `arg_${i-1}`,
            succeeded: true
          }
        }
      });
    }
    
    await prisma.dialogueMove.createMany({ data: moves });
    
    // Time compilation
    const start = Date.now();
    await POST(`/api/deliberations/${delib.id}/compile-ludics`);
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(5000); // < 5 seconds
    
    // Verify all acts have ASPIC+ metadata
    const acts = await prisma.ludicAct.findMany({
      where: { design: { deliberationId: delib.id } }
    });
    
    const actsWithAspic = acts.filter(a => a.metaJson?.aspic);
    expect(actsWithAspic.length).toBeGreaterThan(900); // 90%+ coverage
  });
  
  it('should sync AIF with 500+ CA-nodes in < 3s', async () => {
    // Similar test for AIF sync performance
  });
});
```

---

## Day 6-7: Documentation & Coverage

### 1. Test Coverage Report
```bash
npm run test:coverage
```

**Target**: 80%+ coverage for:
- `lib/aspic/conflictHelpers.ts`
- `packages/ludics-engine/compileFromMoves.ts` (ASPIC+ extraction)
- `lib/ludics/syncToAif.ts` (CA-node generation)

### 2. Update Documentation

**File**: `docs/arg-computation-research/TESTING_SUMMARY.md`

- Test results summary
- Coverage percentages
- Known limitations
- Performance benchmarks

### 3. Create Test Data Generators

**File**: `__tests__/helpers/generators.ts`

```typescript
export function createTestDeliberation() { ... }
export function createTestArgument(argId: string, scheme: string) { ... }
export function createTestDialogueMove(kind: string, aspicAttack: any) { ... }
export function createTestCQ(cqKey: string) { ... }
```

---

## Success Criteria

- [ ] 80%+ test coverage for Phase 0-1e code
- [ ] All unit tests pass (100+ tests)
- [ ] All integration tests pass (10+ scenarios)
- [ ] Performance tests meet targets (< 5s compilation, < 3s AIF sync)
- [ ] Documentation updated with test results
- [ ] CI/CD pipeline includes all tests
- [ ] Zero regressions in existing functionality

---

## Risk Mitigation

### If Tests Reveal Bugs

**Priority 1 Bugs** (breaks provenance chain):
- Fix immediately before proceeding
- Re-run full test suite after fix

**Priority 2 Bugs** (edge cases):
- Document in known issues
- Create follow-up tickets
- Continue with CQ roadmap

**Priority 3 Bugs** (minor issues):
- Log for future cleanup
- Continue as planned

---

## Next Steps After Phase 1f

1. **Review CQ_DIALOGICAL_LUDICS_INTEGRATION_ROADMAP**
   - Mark completed phases
   - Identify gaps
   - Update timeline

2. **Complete Remaining CQ Work** (2-3 weeks)
   - UI improvements
   - Additional API endpoints
   - User flows

3. **Phase 5 Ludics** (3-4 weeks)
   - Interactive features on tested foundation
   - Commitment store visualization
   - Cross-scope navigation

---

## Estimated Effort

- **Day 1-2**: Unit tests (16 hours)
- **Day 3-4**: Integration tests (16 hours)
- **Day 5**: Performance tests (8 hours)
- **Day 6-7**: Documentation & fixes (16 hours)

**Total**: ~56 hours (1 full week)

**Value**: Validates 6,727 lines of code, prevents future bugs, documents system behavior

---

**Ready to start Phase 1f?** Let me know and I can begin creating the first test file!
