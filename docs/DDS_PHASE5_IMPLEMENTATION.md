# DDS Phase 5 Implementation Guide

## Overview

Phase 5 implements the Advanced Features from Faggian & Hyland's "Designs, Disputes and Strategies" (2002):

- **Part 1**: Orthogonality & Behaviours (Definition 6.1)
- **Part 2**: Incarnation & Types (Definitions 6.3, 6.4)
- **Part 3**: Saturation & Advanced Analysis (Proposition 4.17)

## Architecture

### Package Structure

```
packages/ludics-core/dds/
├── behaviours/           # Part 1: Orthogonality & Behaviours
│   ├── types.ts          # Type definitions
│   ├── orthogonality.ts  # Orthogonality checking (⊥)
│   ├── closure.ts        # Biorthogonal closure (D⊥⊥)
│   ├── game.ts           # Game construction
│   └── index.ts
├── types/                # Part 2: Type System
│   ├── types.ts          # Type definitions (LudicsType, TypeStructure)
│   ├── incarnation.ts    # Lax/sharp incarnation (⊂, ⊂⊂)
│   ├── operations.ts     # Type operations
│   ├── inference.ts      # Type inference engine
│   └── index.ts
├── analysis/             # Part 3: Advanced Analysis
│   ├── types.ts          # Analysis type definitions
│   ├── saturation.ts     # Saturation checking (Views(S) = S)
│   ├── correspondence.ts # Full correspondence validation
│   ├── properties.ts     # Property analysis
│   ├── performance.ts    # Performance tracking
│   └── index.ts
└── index.ts              # Main exports
```

### API Routes

```
app/api/ludics/dds/
├── behaviours/
│   ├── orthogonality/route.ts  # POST: Check orthogonality
│   └── closure/route.ts        # POST: Compute biorthogonal closure
├── types/
│   ├── incarnation/route.ts    # POST: Check incarnation
│   └── infer/route.ts          # GET: Infer type from design
└── analysis/
    ├── saturation/route.ts     # GET: Check saturation property
    └── properties/route.ts     # GET: Analyze design/strategy properties
```

### UI Components

```
components/ludics/analysis/
├── TypeSystemPanel.tsx      # Type inference & incarnation UI
├── SaturationPanel.tsx      # Saturation analysis UI
├── BehaviourPanel.tsx       # Orthogonality & closure UI
└── PerformanceMonitor.tsx   # Performance tracking UI
```

## Database Models

### Part 1: Orthogonality & Behaviours

| Model | Purpose |
|-------|---------|
| `LudicOrthogonalityCheck` | Cached orthogonality checks between strategies |
| `LudicBiorthogonalClosure` | Biorthogonal closure computation results |
| `LudicGame` | Games constructed from behaviour pairs |
| `LudicGamePosition` | Positions within games |

### Part 2: Incarnation & Types

| Model | Purpose |
|-------|---------|
| `LudicIncarnation` | Incarnation relationships (lax/sharp) |
| `LudicType` | Types as behaviours |
| `LudicTyping` | Design typing judgments (D : A) |
| `LudicTypeInference` | Type inference results |
| `LudicTypeEquivalence` | Type equivalence checks |

### Part 3: Saturation & Analysis

| Model | Purpose |
|-------|---------|
| `LudicSaturation` | Saturation property checks |
| `LudicCorrespondenceValidation` | Full correspondence chain validation |
| `LudicPropertyAnalysis` | Property analysis for designs/strategies |
| `LudicComplexity` | Complexity metrics |
| `LudicPerformanceMetric` | Operation performance tracking |

## Core Concepts

### Orthogonality (⊥)

Two designs D and E are **orthogonal** (D ⊥ E) if their interaction normalizes successfully.

```typescript
import { checkOrthogonality } from "@/packages/ludics-core/dds";

const result = await checkOrthogonality(strategyA, strategyB);
// result.isOrthogonal: boolean
// result.counterExamples: failed pairs if not orthogonal
```

### Biorthogonal Closure (D⊥⊥)

The biorthogonal closure is the smallest **behaviour** containing a set of designs:

```typescript
import { biorthogonalClosure } from "@/packages/ludics-core/dds";

const closure = await biorthogonalClosure(designs, allDesigns, { maxIterations: 10 });
// closure.designIds: designs in the closure
// closure.reachedFixpoint: whether fixpoint was achieved
```

### Incarnation (⊂)

Design D **incarnates** in E if D's actions are contained in E's:

- **Lax**: D ⊂ E (action containment)
- **Sharp**: D ⊂⊂ E (branch containment)

```typescript
import { checkIncarnation, laxIncarnation, sharpIncarnation } from "@/packages/ludics-core/dds";

const result = laxIncarnation(sourceDesign, targetDesign);
// result.isValid: boolean
// result.witnessActions: proof actions
```

### Type System

Types are specific behaviours with categorization:

- **Base types**: Primitive types
- **Arrow types**: A → B (functions)
- **Product types**: A × B (pairs)
- **Sum types**: A + B (variants)

```typescript
import { inferType, checkTyping } from "@/packages/ludics-core/dds";

const inference = await inferType(design);
// inference.inferredType: TypeStructure
// inference.confidence: 0-1 confidence score
// inference.method: "structural" | "behavioural"
```

### Saturation (Proposition 4.17)

A strategy S is **saturated** if Views(S) = S:

```typescript
import { checkSaturation } from "@/packages/ludics-core/dds";

const result = await checkSaturation(strategy, allDesigns);
// result.isSaturated: boolean
// result.violations: what's missing/extra if not saturated
```

## Correspondence Chain

The full correspondence chain validates:

```
Design ↔ Strategy ↔ Game ↔ Type
```

```typescript
import { validateFullCorrespondence } from "@/packages/ludics-core/dds";

const validation = await validateFullCorrespondence(design);
// validation.isValid: boolean
// validation.chain: transformation steps
// validation.strategyId, gameId, typeId: intermediate IDs
```

## Usage in UI

### AnalysisPanel Integration

The Phase 5 components are integrated into `AnalysisPanel.tsx` with three new tabs:

1. **τ Types**: TypeSystemPanel + SaturationPanel
2. **⊥ Behaviours**: BehaviourPanel
3. **📈 Perf**: PerformanceMonitor

### Example Usage

```tsx
import { 
  TypeSystemPanel, 
  SaturationPanel, 
  BehaviourPanel,
  PerformanceMonitor 
} from "@/components/ludics/analysis";

// In your component:
<TypeSystemPanel designId={designId} strategyId={strategyId} />
<SaturationPanel designId={designId} strategyId={strategyId} />
<BehaviourPanel designId={designId} strategyId={strategyId} />
<PerformanceMonitor designId={designId} />
```

## Performance Considerations

### Closure Computation

Biorthogonal closure can be expensive. Default limit is 10 iterations:

```typescript
const closure = await biorthogonalClosure(designs, allDesigns, {
  maxIterations: 10,
  earlyExit: true  // Stop when no new designs found
});
```

### Saturation Checking

Saturation checking involves Views/Plays operations. Cache results:

```typescript
// Results are automatically cached in LudicSaturation table
const cached = await prisma.ludicSaturation.findUnique({
  where: { strategyId }
});
```

### Performance Tracking

All operations can be tracked:

```typescript
import { trackPerformance } from "@/packages/ludics-core/dds";

const { result, metric } = await trackPerformance(
  "saturation-check",
  designs.length,
  () => checkSaturation(strategy, designs)
);
```

## Testing

### Unit Tests

Located in `packages/ludics-core/dds/*/\__tests__/`:

```bash
npm run test -- packages/ludics-core/dds
```

### Test Coverage

- Orthogonality: symmetric, reflexive properties
- Closure: fixpoint convergence
- Incarnation: lax implies sharp containment
- Types: inference confidence thresholds
- Saturation: Views(S) = S property

## Migration

To apply Phase 5 database models:

```bash
# Generate Prisma client
npx prisma generate

# Push schema changes (dev)
npx prisma db push

# Or create migration (prod)
npx prisma migrate dev --name add_dds_phase5_models
```

## References

- Faggian, C., & Hyland, M. (2002). *Designs, Disputes and Strategies*
- Definition 6.1: Orthogonality
- Definition 6.3: Incarnation (lax/sharp)
- Definition 6.4: Types as behaviours
- Proposition 4.17: Saturation property
