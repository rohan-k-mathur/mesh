# Phase 5: Scoped Inference Implementation

## Summary

Implemented locus-scoped inference with parent inheritance and semantic divergence detection.

## What Was Implemented

### 1. Core Engine Functions (`packages/ludics-engine/commitments.ts`)

#### `getAncestorPaths(path: string): string[]`
Gets all ancestor paths for a given locus path.
- Example: `"0.1.2"` → `["0", "0.1", "0.1.2"]`

#### `getEffectiveCommitments(dialogueId, ownerId, locusPath)`
Returns all facts and rules at a locus, **including inherited from ancestors**.
- Each item marked with `inherited: boolean`
- Enables "what facts apply here?" queries

#### `interactCEScoped(dialogueId, ownerId, locusPath)`
Runs forward-chaining inference at a specific locus with inheritance.
- Inherits facts/rules from parent loci
- Runs saturation (same engine as before)
- Detects contradictions with **locus tracking**
- Returns:
  - `derivedFacts`: New facts derived at this locus
  - `contradictions`: With `aLocusPath`, `bLocusPath`, and `type: 'local' | 'inherited'`
  - `effectiveFacts`: All facts in scope (own + inherited)
  - `effectiveRules`: All rules in scope

#### `checkSemanticDivergence(dialogueId, ownerA, ownerB, locusPath)`
Checks if two participants have contradictory commitments at a locus.
- A asserts X, B denies X → divergent
- Returns list of conflicts with positions

#### `analyzeDialogueInference(dialogueId, ownerA, ownerB)`
Full dialogue analysis across all loci.
- Per-locus stats (fact count, rule count, derived, contradictions)
- Semantic divergence markers per locus

### 2. API Endpoints

#### `POST /api/commitments/infer`
Run scoped inference at a specific locus.
```json
{
  "dialogueId": "ludics-forest-demo",
  "ownerId": "Proponent",
  "locusPath": "0.1"
}
```

#### `POST /api/commitments/divergence`
Check for semantic divergence between participants.
```json
{
  "dialogueId": "ludics-forest-demo",
  "ownerA": "Proponent",
  "ownerB": "Opponent",
  "locusPath": "0.1"
}
```

#### `GET /api/commitments/analyze?dialogueId=X&ownerA=Proponent&ownerB=Opponent`
Full dialogue analysis with per-locus breakdown.

### 3. UI Updates (`CommitmentsPanel.tsx`)

- Added "🔍 Infer @{locus}" button
- Shows scoped inference results in a collapsible panel:
  - Inherited facts indicator
  - Derived facts with source locus
  - Contradictions with locus info and inherited/local type
  - Expandable effective facts list

## Example: Locus Inheritance in Action

```
Locus 0 (root)
  Proponent commits: traffic_flowing
  Rule: traffic_flowing -> low_congestion
  
Locus 0.1 (Opponent challenges)
  Opponent commits: weather_bad
  Rule: weather_bad -> not traffic_flowing

Running interactCEScoped("0.1", "Opponent") returns:
  effectiveFacts: [
    { label: "weather_bad", locusPath: "0.1", inherited: false }
  ]
  derivedFacts: [
    { label: "not traffic_flowing", derivedAt: "0.1" }
  ]

Running checkSemanticDivergence("0.1", "Proponent", "Opponent") returns:
  divergent: true
  conflicts: [{
    proposition: "traffic_flowing",
    ownerAPosition: "asserts",
    ownerBPosition: "denies",
    locusPath: "0.1"
  }]
```

## Testing

1. Add facts at root locus (0)
2. Add facts at child locus (0.1)
3. Click "🔍 Infer @0.1" → see inherited facts from 0
4. Add contradictory fact at 0.1 → see inherited conflict

## Files Changed

- `packages/ludics-engine/commitments.ts` - Core scoped inference functions
- `packages/ludics-react/CommitmentsPanel.tsx` - UI for scoped inference
- `app/api/commitments/infer/route.ts` - New endpoint
- `app/api/commitments/divergence/route.ts` - New endpoint
- `app/api/commitments/analyze/route.ts` - New endpoint

## Next Steps

- [ ] Integrate semantic divergence into stepper (mark DIVERGENT on conflict)
- [ ] Add divergence indicators to LociTree (color code conflicting loci)
- [ ] Persist derived facts per-locus (currently ephemeral)
- [ ] Add "hypothetical mode" for what-if reasoning
