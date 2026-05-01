# Hom-Set Confidence Analysis - Issue Report

## Current Behavior

All arguments display:
- **50.0% confidence** (identical across all arguments)
- **"Above avg" badge** (showing on every argument)
- **0 outgoing edges** (hardcoded)
- **Varying incoming edges** (correctly counted from attacks)

## Root Causes

### 1. Incorrect Confidence Formula

**Current implementation** (DeepDivePanelV2.tsx, line 365):
```tsx
homSetConfidence: arg.aif?.preferences?.preferredBy 
  ? (arg.aif.preferences.preferredBy / (arg.aif.preferences.preferredBy + (arg.aif.preferences.dispreferredBy || 0) + 1))
  : 0.5,
```

**Problems**:
- When `preferredBy = 0` and `dispreferredBy = 0` → defaults to `0.5` (50%)
- Formula divides by `(preferredBy + dispreferredBy + 1)` - the `+ 1` ensures non-zero denominator but skews results
- This counts **preference applications** (how many times the argument is preferred), not **morphism confidence scores**

**What hom-set confidence should mean**:
> "The aggregate confidence of all morphisms (edges) in the hom-set for this argument"

A hom-set in category theory is the collection of all morphisms (arrows) from one object to another. In our case:
- **Hom(A, -)**: All **outgoing** edges from argument A
- **Hom(-, A)**: All **incoming** edges to argument A
- **Hom-set confidence**: Average (or sum) of confidence scores on these edges

### 2. Using Wrong Data Source

**Current**: Uses `PreferenceApplication` counts
```typescript
preferences: {
  preferredBy: preferredBy[r.id] ?? 0,
  dispreferredBy: dispreferredBy[r.id] ?? 0,
}
```

**Should use**: `ArgumentEdge` confidence scores
```typescript
// Each ArgumentEdge has a confidence field
interface ArgumentEdge {
  id: string;
  fromArgumentId: string;
  toArgumentId: string;
  attackType: "REBUTS" | "UNDERCUTS" | "UNDERMINES";
  confidence?: number; // <-- This is what we should aggregate!
}
```

### 3. Missing Outgoing Edge Count

**Current** (DeepDivePanelV2.tsx, line 371):
```tsx
outgoingCount: 0, // TODO: Fetch outgoing attack counts from API
```

**Should fetch**: 
```typescript
outgoingCount: (arg.aif?.outgoingAttacks?.REBUTS || 0) + 
               (arg.aif?.outgoingAttacks?.UNDERCUTS || 0) + 
               (arg.aif?.outgoingAttacks?.UNDERMINES || 0)
```

### 4. Badge Logic Issue

When all values are 50%, average is also 50%, so every argument satisfies `arg.homSetConfidence >= avgConfidence`, causing all "Above avg" badges to show.

## Correct Implementation

### Step 1: Update API to Return Edge Confidences

**File**: `/app/api/deliberations/[id]/arguments/aif/route.ts`

Add after attack counting (around line 175):

```typescript
// 3) Aggregate edge confidence scores for hom-set confidence
const edgeConfidences = await prisma.argumentEdge.findMany({
  where: {
    OR: [
      { fromArgumentId: { in: argIds } }, // Outgoing edges
      { toArgumentId: { in: argIds } },   // Incoming edges
    ],
  },
  select: {
    fromArgumentId: true,
    toArgumentId: true,
    confidence: true,
    attackType: true,
  },
});

// Build hom-set confidence per argument
const homSetByArg: Record<string, {
  incomingConfidences: number[];
  outgoingConfidences: number[];
  totalConfidence: number;
  edgeCount: number;
}> = {};

for (const a of pageRows) {
  homSetByArg[a.id] = {
    incomingConfidences: [],
    outgoingConfidences: [],
    totalConfidence: 0,
    edgeCount: 0,
  };
}

for (const edge of edgeConfidences) {
  const conf = edge.confidence ?? 0.5; // Default confidence if not set
  
  // Incoming edge (arrow pointing TO this argument)
  if (edge.toArgumentId && homSetByArg[edge.toArgumentId]) {
    homSetByArg[edge.toArgumentId].incomingConfidences.push(conf);
    homSetByArg[edge.toArgumentId].totalConfidence += conf;
    homSetByArg[edge.toArgumentId].edgeCount += 1;
  }
  
  // Outgoing edge (arrow pointing FROM this argument)
  if (edge.fromArgumentId && homSetByArg[edge.fromArgumentId]) {
    homSetByArg[edge.fromArgumentId].outgoingConfidences.push(conf);
    homSetByArg[edge.fromArgumentId].totalConfidence += conf;
    homSetByArg[edge.fromArgumentId].edgeCount += 1;
  }
}

// Calculate average hom-set confidence
for (const argId of argIds) {
  const hs = homSetByArg[argId];
  if (hs.edgeCount > 0) {
    hs.totalConfidence = hs.totalConfidence / hs.edgeCount;
  }
}
```

Add to response type:

```typescript
type AifRow = {
  // ... existing fields
  aif: {
    // ... existing fields
    homSet?: {
      confidence: number;        // Average confidence across all edges
      incomingCount: number;     // Count of incoming edges
      outgoingCount: number;     // Count of outgoing edges
      totalEdges: number;        // Total edge count
    };
  };
};
```

Add to items construction:

```typescript
const items: AifRow[] = pageRows.map(r => {
  const hs = homSetByArg[r.id];
  const outgoingCount = hs?.outgoingConfidences.length ?? 0;
  
  return {
    // ... existing fields
    aif: {
      // ... existing fields
      homSet: {
        confidence: hs?.totalConfidence ?? 0,
        incomingCount: hs?.incomingConfidences.length ?? 0,
        outgoingCount: outgoingCount,
        totalEdges: hs?.edgeCount ?? 0,
      },
    }
  }
});
```

### Step 2: Update Frontend to Use New Data

**File**: `/components/deepdive/DeepDivePanelV2.tsx` (around line 365)

Replace the hom-set calculation:

```tsx
const argumentsWithHomSets = React.useMemo(() => {
  if (!data?.items) return [];
  
  return data.items
    .filter((arg: any) => arg.aif?.conclusion?.id)
    .map((arg: any) => {
      const homSet = arg.aif?.homSet;
      
      return {
        id: arg.id,
        title: arg.aif?.conclusion?.text || arg.text || 'Untitled Argument',
        
        // Use actual hom-set confidence from aggregated edge scores
        homSetConfidence: homSet?.confidence ?? 0,
        
        // Use actual counts from hom-set data
        incomingCount: homSet?.incomingCount ?? 0,
        outgoingCount: homSet?.outgoingCount ?? 0,
      };
    })
    .filter((arg: any) => arg.homSetConfidence > 0 || arg.incomingCount > 0 || arg.outgoingCount > 0)
    .slice(0, 20);
}, [data]);
```

### Step 3: Fix Badge Logic

**File**: `/components/agora/HomSetComparisonChart.tsx` (line 100)

Change badge condition to be more strict:

```tsx
{isAboveAvg && avgConfidence > 0 && (
  <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
    Above avg
  </span>
)}
```

Or use threshold-based approach:

```tsx
{arg.homSetConfidence > 0.6 && (
  <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
    Strong
  </span>
)}
{arg.homSetConfidence >= 0.4 && arg.homSetConfidence <= 0.6 && (
  <span className="text-[10px] text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded">
    Moderate
  </span>
)}
{arg.homSetConfidence < 0.4 && (
  <span className="text-[10px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
    Weak
  </span>
)}
```

## Alternative: Simpler Confidence Metric

If `ArgumentEdge.confidence` is not yet populated, we could use a simpler metric based on edge structure:

**Option A: Normalized Edge Count**
```typescript
homSetConfidence: (incomingCount + outgoingCount) / (maxEdges || 1)
```

**Option B: Ratio-Based**
```typescript
homSetConfidence: outgoingCount > 0 
  ? outgoingCount / (incomingCount + outgoingCount)
  : 0
```

**Option C: Attack Success Rate**
```typescript
// If argument has defenses against attacks
homSetConfidence: incomingCount > 0
  ? (defenseCount / incomingCount)
  : 1.0
```

## Current Data in Your Deliberation

Based on your output, here's what we're seeing:

| Argument | Confidence | Incoming | Outgoing | Total |
|----------|-----------|----------|----------|-------|
| aefrwqef | 50% | 1 | 0 | 1 |
| Climate education... | 50% | 0 | 0 | 0 |
| asdfasdfasdfa | 50% | 1 | 0 | 1 |
| aceas | 50% | 5 | 0 | 5 |
| hello | 50% | 0 | 0 | 0 |
| dominoes | 50% | 9 | 0 | 9 |
| Pilot programs... | 50% | 3 | 0 | 3 |

**Observations**:
1. All have 50% confidence (default fallback)
2. Incoming counts vary (0, 1, 3, 5, 9) - these are real attack counts
3. Outgoing counts are all 0 (not fetched)
4. Arguments with 0 edges still show 50% (should probably be hidden or show N/A)

## Recommended Fix Priority

### Priority 1: Show Meaningful Data Now
**Quick fix** that doesn't require API changes:

```tsx
// Use incoming edge count as proxy for "engagement"
homSetConfidence: (() => {
  const total = (arg.aif?.attacks?.REBUTS || 0) + 
                (arg.aif?.attacks?.UNDERCUTS || 0) + 
                (arg.aif?.attacks?.UNDERMINES || 0);
  if (total === 0) return 0; // No edges = no confidence to measure
  // Normalize by max observed (e.g., 10 attacks = 100%)
  return Math.min(total / 10, 1.0);
})(),
```

### Priority 2: Add Outgoing Counts
Update API to count outgoing edges:

```typescript
const outgoingAttacks = await prisma.argumentEdge.groupBy({
  by: ['fromArgumentId', 'attackType'],
  where: { fromArgumentId: { in: argIds } },
  _count: { _all: true },
});
```

### Priority 3: Implement True Hom-Set Confidence
Aggregate actual confidence scores from ArgumentEdge records.

## Expected Behavior After Fix

With proper confidence calculation:
- Arguments with strong supporting edges → High confidence (70-100%)
- Arguments with mixed support/attacks → Medium confidence (40-70%)
- Arguments with mostly attacks against them → Low confidence (0-40%)
- Arguments with no edges → Not shown (or grayed out with "N/A")

## Testing Checklist

- [ ] Arguments with no edges show 0% or are hidden
- [ ] Arguments with only incoming attacks show confidence based on edge scores
- [ ] Arguments with outgoing attacks show confidence including those edges
- [ ] "Above avg" badge only shows when actually above average (not on all items)
- [ ] Outgoing count is non-zero when argument has outgoing attacks
- [ ] Average line in chart aligns with actual average value
- [ ] Sorting by confidence produces meaningful ordering

## Questions for Discussion

1. **Should hom-set confidence include both incoming and outgoing edges?**
   - Current: Only incoming counted
   - Alternative: Separate metrics for Hom(A, -) vs Hom(-, A)

2. **Should we weight edge types differently?**
   - REBUTS (direct contradiction) = higher weight?
   - UNDERCUTS (inference attack) = medium weight?
   - UNDERMINES (premise attack) = lower weight?

3. **Should confidence consider defense responses?**
   - Attacked + defended = higher confidence?
   - Attacked + no defense = lower confidence?

4. **What does "confidence" mean in this context?**
   - Strength of connections (edge count)?
   - Quality of reasoning (edge confidence scores)?
   - Resilience to attacks (defense ratio)?
   - Community support (preference counts)?

## Conclusion

The hom-set confidence feature is **structurally correct** (UI, API, data flow) but using the **wrong data source and formula**. The fix requires:

1. Clarifying what "hom-set confidence" should represent
2. Updating the calculation to use ArgumentEdge confidence scores
3. Adding outgoing edge counts to the API response
4. Filtering out arguments with no edges from the display

The quick fix (Priority 1) can ship immediately. The complete fix (Priority 3) requires schema validation that ArgumentEdge.confidence is populated correctly.
