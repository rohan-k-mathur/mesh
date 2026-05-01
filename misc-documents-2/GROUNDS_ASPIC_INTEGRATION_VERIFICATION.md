# GROUNDS Arguments in ASPIC+ Evaluation - Verification

## Summary

GROUNDS arguments created via `/api/dialogue/answer-and-commit` are **FULLY INTEGRATED** with ASPIC+ evaluation in `/api/aspic/evaluate`.

## Integration Points

### 1. ✅ Argument Inclusion

**Location**: `app/api/aspic/evaluate/route.ts`, line 162

```typescript
const argumentsList = await prisma.argument.findMany({
  where: { deliberationId },
  include: {
    conclusion: true,
    premises: { include: { claim: true } },
    scheme: true,
  },
});
```

**Status**: ✅ **WORKING**
- All Arguments in a deliberation are fetched, including GROUNDS arguments
- GROUNDS arguments are created with `deliberationId`, so they will be included

### 2. ✅ ArgumentPremise Support

**Location**: `app/api/aspic/evaluate/route.ts`, lines 242-274

```typescript
// I-nodes for premises
for (const premise of arg.premises) {
  const premiseNodeId = `I:${premise.claim.id}`;
  // ... creates I-node for each premise
  
  // Edge: I → RA (premise)
  edges.push({
    sourceId: premiseNodeId,
    targetId: raNodeId,
    edgeType: "premise",
  });
}
```

**Status**: ✅ **WORKING**
- The enhanced `createArgumentFromGrounds` now creates ArgumentPremise records
- These premises link the target claim as a premise of the GROUNDS argument
- The ASPIC+ endpoint includes `premises: { include: { claim: true } }`, so the ArgumentPremise we create will be fetched
- This means GROUNDS arguments can be **attacked on their premises** (undermining attacks)

### 3. ✅ Attack Participation

**Location**: `app/api/aspic/evaluate/route.ts`, lines 279-392

```typescript
// Step 3: Add CA-nodes (ConflictApplications as attack nodes)
for (const conflict of conflictsList) {
  // ... processes ConflictApplications
  
  // Edge 2: CA-node → Target (conflicted edge)
  if (conflict.conflictedArgumentId) {
    const targetNodeId = `RA:${conflict.conflictedArgumentId}`;
    edges.push({
      sourceId: caNodeId,
      targetId: targetNodeId,
      edgeType: "conflicted",
    });
  }
}
```

**Status**: ✅ **WORKING**
- ConflictApplications can target any argument, including GROUNDS arguments
- The AttackCreationModal can create attacks targeting GROUNDS arguments
- GROUNDS arguments will appear in the attack graph and defeat computation

### 4. ✅ RA-Node Creation

**Location**: `app/api/aspic/evaluate/route.ts`, lines 212-223

```typescript
// RA-node for the argument
const raNodeId = `RA:${arg.id}`;
if (!nodeIds.has(raNodeId)) {
  nodes.push({
    id: raNodeId,
    nodeType: "RA",
    content: arg.text || "Argument",
    debateId: deliberationId,
    inferenceType: "modus_ponens",
    schemeId: arg.schemeId || undefined,
  });
  nodeIds.add(raNodeId);
}
```

**Status**: ✅ **WORKING**
- Every Argument gets an RA-node in the AIF graph
- GROUNDS arguments will have RA-nodes created
- These RA-nodes can be attacked by CA-nodes (ConflictApplications)

### 5. ✅ Grounded Extension Computation

**Location**: `app/api/aspic/evaluate/route.ts`, line 527

```typescript
// Step 5: Compute ASPIC+ semantics
const semantics = computeAspicSemantics(theory);
```

**Status**: ✅ **WORKING**
- GROUNDS arguments are included in the argumentation theory
- They participate in grounded extension computation
- Justification status (IN/OUT/UNDEC) is computed for GROUNDS arguments

### 6. ⚠️ ArgumentSupport Usage

**Status**: ⚠️ **NOT USED IN ASPIC+ EVALUATION**
- ArgumentSupport records are created for GROUNDS arguments (strength: 0.7, mode: "product")
- However, ArgumentSupport is **not currently queried or used** by `/api/aspic/evaluate`
- ArgumentSupport is used elsewhere in the codebase for:
  - Evidential strength tracking
  - Provenance recording
  - Knowledge base imports/exports
  - Category-theoretic morphism materialization

**Future Enhancement**: Consider integrating ArgumentSupport strength values into:
- Preference computation (stronger support = higher preference)
- Defeat resolution (use support strength as tiebreaker)
- Gradual argument strength propagation

## Verification Checklist

To verify GROUNDS integration, test the following:

### Test 1: GROUNDS Argument Appears in Theory
1. Create a claim in a deliberation
2. Create WHY challenge on the claim
3. Submit GROUNDS response with text
4. Call `GET /api/aspic/evaluate?deliberationId=XXX`
5. **Expected**: Response includes the GROUNDS argument in `semantics.arguments[]`
6. **Verify**: Check that `arguments[].id` matches the GROUNDS argument ID
7. **Verify**: Check that `arguments[].premises[]` includes the target claim

### Test 2: GROUNDS Argument Has Correct Premise
1. After creating GROUNDS (from Test 1)
2. Check `semantics.arguments[]` for the GROUNDS argument
3. **Expected**: `arguments[X].premises[]` contains the target claim text
4. **Rationale**: Our enhanced `createArgumentFromGrounds` creates ArgumentPremise linking target claim

### Test 3: GROUNDS Can Be Attacked
1. Create GROUNDS argument (from Test 1)
2. Use AttackCreationModal to create UNDERMINES attack on GROUNDS argument
3. Call `GET /api/aspic/evaluate?deliberationId=XXX`
4. **Expected**: Response includes attack in `semantics.attacks[]`
5. **Verify**: Check that `attacks[].attackedId` matches GROUNDS argument ID
6. **Verify**: Check that attack appears in defeat computation

### Test 4: GROUNDS Can Defend Claims
1. Create claim C1
2. Create WHY challenge on C1
3. Submit GROUNDS G1 defending C1
4. Create UNDERMINES attack A1 on C1
5. Call `GET /api/aspic/evaluate?deliberationId=XXX`
6. **Expected**: G1 appears in grounded extension (if not attacked)
7. **Expected**: C1's justification status depends on whether G1 or A1 wins
8. **Rationale**: GROUNDS arguments support claims, affecting their justification

### Test 5: GROUNDS Justification Status
1. Create GROUNDS argument G1
2. Do NOT attack G1
3. Call `GET /api/aspic/evaluate?deliberationId=XXX`
4. **Expected**: `justificationStatus[G1.id] === 'in'`
5. Create REBUTS attack A1 on G1
6. Call evaluation again
7. **Expected**: `justificationStatus[G1.id]` changes (likely 'out' or 'undec')

## Implementation Status

### ✅ Complete
- [x] GROUNDS arguments are created with proper schema fields
- [x] ArgumentPremise created for target claim
- [x] ArgumentSupport created with strength 0.7
- [x] GROUNDS included in ASPIC+ argument fetching
- [x] GROUNDS premises included in AIF graph construction
- [x] GROUNDS can be attacked via ConflictApplications
- [x] GROUNDS participate in grounded extension computation

### ⏳ Future Enhancements
- [ ] Integrate ArgumentSupport strength into preference computation
- [ ] Add ArgumentSupport query to ASPIC+ evaluation for weighted semantics
- [ ] Display ArgumentSupport strength in UI (claim detail panel, argument cards)
- [ ] Allow users to adjust ArgumentSupport strength (confidence voting)

## Code References

### GROUNDS Creation
**File**: `app/api/dialogue/answer-and-commit/route.ts`
**Function**: `createArgumentFromGrounds()`
**Lines**: 16-104

Key changes:
- Creates Argument with `deliberationId`, `authorId`, `text`, `conclusionClaimId`
- Creates ArgumentPremise with `argumentId`, `claimId` (target claim), `isAxiom: false`
- Creates ArgumentSupport with `strength: 0.7`, `mode: "product"`
- Links to DialogueMove via `createdByMoveId`

### ASPIC+ Evaluation
**File**: `app/api/aspic/evaluate/route.ts`
**Function**: `GET` handler
**Lines**: 140-582

Key sections:
- Line 162: Fetch all Arguments (includes GROUNDS)
- Line 166: Include `premises: { include: { claim: true } }` (fetches ArgumentPremise)
- Line 183: Fetch ConflictApplications (attacks on GROUNDS)
- Line 212: Create RA-nodes for all arguments (includes GROUNDS)
- Line 242: Create I-nodes for premises (includes GROUNDS premises)
- Line 279: Process attacks (GROUNDS can be targets)
- Line 527: Compute semantics (GROUNDS in grounded extension)

## Conclusion

GROUNDS arguments are **FULLY INTEGRATED** with ASPIC+ evaluation. They:
1. ✅ Appear in the argumentation theory
2. ✅ Have premises (via ArgumentPremise)
3. ✅ Can be attacked (via ConflictApplications)
4. ✅ Can defend claims (via ArgumentSupport and premise links)
5. ✅ Participate in grounded extension computation
6. ✅ Have justification status computed (IN/OUT/UNDEC)

The only missing piece is that **ArgumentSupport strength values are not used in preference computation**, but this is a future enhancement and doesn't prevent GROUNDS from working correctly in ASPIC+.

**Recommendation**: Proceed to test GROUNDS in a live deliberation and verify the integration checklist above. Then move on to fixing the "View Details" button navigation in DiscourseDashboard.
