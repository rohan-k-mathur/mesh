# AIF Correspondence Verification - Phase 2 Implementation

## Overview

Phase 2 implements **correspondence verification** ensuring that the Ludics DDS operations `Disp(D)` (disputes of a design) and `Ch(S)` (chronicles of a strategy) produce isomorphic AIF structures.

This is based on:
- **Faggian & Hyland (2002)** - Proposition 4.27-4.28
- **Lecomte (2013)** - Ludics, dialogue and inferentialism

## Theoretical Foundation

### The Four Isomorphisms

From Faggian & Hyland (2002):

1. **Plays(Views(S)) ≅ S** - Plays reconstructed from views equal original strategy
2. **Views(Plays(V)) ≅ V** - Views extracted from generated plays equal original views  
3. **Disp(Ch(S)) ≅ S** - Disputes of chronicles equal original strategy (Prop 4.27)
4. **Ch(Disp(D)) ≅ D** - Chronicles of disputes equal original design (Prop 4.27)

### Key Correspondence

The fundamental result is that:
- **Innocent strategies** are in **bijective correspondence** with **designs**
- This means every innocent strategy can be uniquely reconstructed from its design, and vice versa
- The operations `Disp` and `Ch` implement this correspondence

## Implementation

### Files Created

1. **`lib/ludics/aifCorrespondence.ts`** - Main verification module
   - `verifyAifCorrespondence(deliberationId)` - Full verification
   - `isCorrespondenceValid(deliberationId)` - Quick check
   - `getCorrespondenceIssues(deliberationId)` - Issues summary
   - `repairCorrespondence(deliberationId)` - Auto-repair by re-syncing

2. **`app/api/ludics/dds/correspondence/verify-aif/route.ts`** - API endpoint
   - POST with `action: "verify"` - Full verification
   - POST with `action: "quick-check"` - Quick validity check
   - POST with `action: "issues"` - Get issues summary
   - POST with `action: "repair"` - Repair correspondence
   - GET - Quick validity check

### Integration Points

This connects:
- **DDS correspondence modules** (`packages/ludics-core/dds/correspondence/`)
- **AIF sync layer** (`lib/ludics/syncToAif.ts`)
- **Existing correspondence API** (`app/api/ludics/dds/correspondence/`)

## Usage

### API Usage

```typescript
// Full verification
POST /api/ludics/dds/correspondence/verify-aif
{
  "deliberationId": "xxx",
  "action": "verify"
}

// Quick check
GET /api/ludics/dds/correspondence/verify-aif?deliberationId=xxx

// Repair issues
POST /api/ludics/dds/correspondence/verify-aif
{
  "deliberationId": "xxx",
  "action": "repair"
}
```

### Programmatic Usage

```typescript
import { verifyAifCorrespondence, repairCorrespondence } from "@/lib/ludics/aifCorrespondence";

// Verify correspondence
const result = await verifyAifCorrespondence(deliberationId);
if (!result.valid) {
  console.log("Issues:", result.issues);
  
  // Optionally repair
  const repairResult = await repairCorrespondence(deliberationId);
}
```

## Response Structure

```typescript
type AifCorrespondenceResult = {
  deliberationId: string;
  valid: boolean;
  
  // Isomorphism checks
  isomorphisms: {
    playsViews: IsomorphismCheck;
    viewsPlays: IsomorphismCheck;
    dispCh: IsomorphismCheck;
    chDisp: IsomorphismCheck;
  };
  allIsomorphismsHold: boolean;
  
  // Structure comparison
  structureComparison: {
    designsCount: number;
    strategiesCount: number;
    aifNodesCount: number;
    aifEdgesCount: number;
    designsCovered: number;
    strategiesCovered: number;
    correspondenceRate: number;
  };
  
  // Detailed results
  designs: DesignCorrespondenceDetail[];
  strategies: StrategyCorrespondenceDetail[];
  
  // Issues found
  issues: CorrespondenceIssue[];
  
  // Metadata
  verifiedAt: Date;
  durationMs: number;
};
```

## Issue Types

| Type | Severity | Description |
|------|----------|-------------|
| `MISSING_AIF_NODE` | ERROR | LudicAct has no corresponding AifNode |
| `ORPHANED_AIF_NODE` | WARNING | AifNode exists without LudicAct |
| `ISOMORPHISM_FAILURE` | ERROR | One of the four isomorphisms failed |
| `STRUCTURE_MISMATCH` | WARNING | Verification could not complete |
| `ROUND_TRIP_FAILURE` | WARNING | Ch(Disp(D)) ≠ D or Disp(Ch(S)) ≠ S |
| `INNOCENCE_VIOLATION` | INFO | Strategy is not innocent |
| `PROPAGATION_VIOLATION` | WARNING | Strategy doesn't satisfy propagation |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Deliberation                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐     Disp(D)      ┌─────────────┐               │
│  │   Design    │ ─────────────→  │   Strategy   │               │
│  │  (LudicAct) │ ←───────────────│   (Plays)    │               │
│  └─────────────┘      Ch(S)      └─────────────┘               │
│         │                               │                        │
│         │ sync                          │ sync                   │
│         ↓                               ↓                        │
│  ┌─────────────────────────────────────────────────┐            │
│  │              AIF Graph (Nodes + Edges)          │            │
│  │                                                  │            │
│  │  I-nodes ←→ Positive Acts (Commitments)        │            │
│  │  CA-nodes ←→ Negative Acts (Attacks)           │            │
│  │  DM-nodes ←→ Daimon Acts (Acknowledgments)     │            │
│  │  Edges ←→ Justification/Visibility             │            │
│  └─────────────────────────────────────────────────┘            │
│                          │                                       │
│                          │ verify                                │
│                          ↓                                       │
│  ┌─────────────────────────────────────────────────┐            │
│  │        Correspondence Verification              │            │
│  │                                                  │            │
│  │  ✓ Plays(Views(S)) ≅ S                         │            │
│  │  ✓ Views(Plays(V)) ≅ V                         │            │
│  │  ✓ Disp(Ch(S)) ≅ S                             │            │
│  │  ✓ Ch(Disp(D)) ≅ D                             │            │
│  └─────────────────────────────────────────────────┘            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Relation to ASPIC+

The AIF correspondence connects to ASPIC+ argumentation:

- **Innocent strategies** → **Grounded extensions** (both are minimal/canonical)
- **Propagation** → **Consistency** (non-circular dependencies)
- **Correspondence validity** → **Well-formed argument graphs**

This will be further developed in **Phase 3**: Connect Innocence to Grounded Extension.

## Next Steps

- **Phase 3**: Connect Innocence to Grounded Extension
- **Phase 4**: Bidirectional translation (full AIF ↔ ASPIC+ interoperability)
