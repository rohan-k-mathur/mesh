# Chronicle-Based Type Inference

## Overview

This document describes the new chronicle-based type inference system for Ludics designs, leveraging the verified Faggian-Hyland Prop 4.27 correspondence.

## Theoretical Foundation

The key insight comes from Faggian & Hyland (2002) Proposition 4.27:

> **Ch(Disp(D)) ≅ D**
> 
> The chronicle extraction from a design's dispute representation is isomorphic to the original design.

This means **chronicles faithfully represent design structure**. We can therefore extract types directly from chronicle patterns with high confidence.

## Implementation

### New Functions Added

#### `packages/ludics-core/dds/types/inference.ts`

1. **`analyzeChronicles(chronicles: Chronicle[]): ChronicleAnalysis`**
   - Extracts structural metrics from chronicles
   - Returns: `chronicleCount`, `maxDepth`, `uniqueLoci`, `terminals`, `branching`, `polarity`

2. **`inferTypeFromChronicles(chronicles: Chronicle[]): TypeStructure`**
   - Core type inference from chronicle patterns
   - Detects: Arrow, Product, Sum, Unit, Void types

3. **`inferTypeFromDesignChronicles(design: DesignForCorrespondence)`**
   - Entry point: converts design → strategy → chronicles → type
   - Returns: `{ type, analysis, confidence }`

4. **`computeChronicleConfidence(chronicles, inferredType): number`**
   - Computes confidence score based on pattern clarity

### Updated API Endpoint

`POST /api/ludics/dds/types/infer` now supports `mode: "chronicle"`:

```json
{
  "designId": "design-uuid",
  "mode": "chronicle"
}
```

Response:
```json
{
  "ok": true,
  "designId": "design-uuid",
  "mode": "chronicle",
  "type": { "kind": "arrow", "left": {...}, "right": {...} },
  "confidence": 0.85,
  "details": {
    "method": "chronicle",
    "actCount": 5,
    "chronicleAnalysis": {
      "chronicleCount": 3,
      "maxDepth": 4,
      "uniqueLoci": 7,
      "terminals": { "positive": 2, "negative": 1 },
      "branching": { "firstActionRamification": 2, "maxRamification": 2, "isLinear": false },
      "polarity": { "startsPositive": true, "alternatesConsistently": true }
    }
  }
}
```

## Type Detection Patterns

### Arrow Type (→)
- **Pattern**: Chronicles with alternating P/O polarity, depth > 1
- **Interpretation**: Input on O moves, output on P moves
- **Higher-order**: Depth > 2 indicates nested functions

### Product Type (×)
- **Pattern**: Root ramification ≥ 2 with parallel branches
- **Interpretation**: Each branch represents a component
- **N-ary**: Built as right-associative nested binary products

### Sum Type (+)
- **Pattern**: Root ramification = 1, different chronicles take different branches
- **Interpretation**: Single injection taken per play
- **Detection**: Multiple chronicles with different single branches at root

### Unit Type (1)
- **Pattern**: Single linear chronicle, single positive terminal, depth ≤ 1
- **Interpretation**: Trivial successful interaction

### Void Type (0)
- **Pattern**: All negative terminals (daimons) or empty chronicles
- **Interpretation**: No successful completion possible

## Confidence Scoring

Base confidence: 0.7

Bonuses:
- Multiple chronicles: +0.05 per chronicle (max 4)
- Consistent polarity alternation: +0.1
- Clear type pattern match: +0.1
- Positive terminals present: +0.05

## Integration with Existing Inference

The `inferDesignType` function now considers all three methods:
1. **Structural** - Based on design shape
2. **Behavioural** - Based on interaction patterns with other designs
3. **Chronicle** - Based on chronicle analysis (new)

The method with highest confidence is selected. Alternatives are preserved if they meet the minimum confidence threshold.

## Exports

From `@/packages/ludics-core/dds/types`:
- `analyzeChronicles`
- `inferTypeFromChronicles`
- `inferTypeFromDesignChronicles`
- `computeChronicleConfidence`
- `type ChronicleAnalysis`

## Usage Example

```typescript
import { 
  inferTypeFromDesignChronicles,
  type ChronicleAnalysis 
} from "@/packages/ludics-core/dds/types";

const design: DesignForCorrespondence = { /* ... */ };

const result = inferTypeFromDesignChronicles(design);
console.log("Type:", result.type);
console.log("Confidence:", result.confidence);
console.log("Analysis:", result.analysis);
```

## Verification Status

✅ Prop 4.18 (Plays ↔ Views): **Verified**
✅ Prop 4.27 (Disp ↔ Ch): **Verified**

The isomorphism verification ensures chronicle-based type extraction is theoretically sound.

---

*Implementation date: 2024*
*Based on: Faggian & Hyland (2002) "Designs, Disputes and Strategies"*
