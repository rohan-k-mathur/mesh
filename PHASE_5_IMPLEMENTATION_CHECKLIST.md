# Phase 5 Implementation Checklist: API Integration

> **Status**: ✅ Complete  
> **Start Date**: 2025-01-17  
> **Completed**: 2025-01-17  
> **Target**: Full REST API integration for DDS modules

---

## Overview

Phase 5 integrates the Phase 3 (Extraction) and Phase 4 (Landscape) modules with the existing Next.js API infrastructure. This provides REST endpoints for:
- Arena management (create from deliberation, query)
- Interaction lifecycle (start, move, simulate)
- Path extraction (visitable paths, chronicles)
- Landscape analysis (heat maps, position strength, visualization)

---

## Existing API Infrastructure Analysis

### Current DDS API Structure (`app/api/ludics/dds/`)
```
dds/
├── arena/route.ts          # POST createUniversalArena, createArenaFromDesigns
├── games/
│   ├── route.ts            # POST create game, GET list (mock in-memory)
│   ├── play/route.ts       # POST move, initialize, ai-move
│   └── simulate/route.ts   # POST run simulations (AI vs AI, batch)
├── views/
│   ├── route.ts            # GET/POST views from disputes
│   └── extract/route.ts    # POST extract view from dispute/trace
├── analysis/
│   ├── properties/route.ts # POST design property analysis
│   └── saturation/         # Saturation analysis
├── behaviours/             # Behaviour CRUD
├── chronicles/             # Chronicle management
├── disputes/               # Dispute management  
├── positions/              # Position queries
├── strategies/             # Strategy CRUD + generation
└── types/                  # Type definitions
```

### Key Patterns Observed
1. **In-memory stores**: Used for demo/dev (`mockGames`, `gameStates` Map)
2. **Prisma integration**: Production data via `@/lib/prismaclient`
3. **Package imports**: `@/packages/ludics-core/dds/*` for computation
4. **Response format**: `{ ok: true, data, stats? }` or `{ ok: false, error }`

---

## Task Checklist

### 1. Arena API Routes

#### 1.1 `app/api/ludics/arenas/route.ts`
- [x] **POST**: Create new arena
  - Input: `{ deliberationId, name?, maxDepth?, maxRamification?, fromDesigns?: string[] }`
  - Uses: `createUniversalArena`, `createArenaFromDesigns` from arena module
  - Stores: Arena configuration in Prisma or in-memory
  - Returns: `{ ok, arena: { id, base, moves, moveCount } }`
  
- [x] **GET**: List arenas
  - Query: `?deliberationId=xxx`
  - Returns: `{ ok, arenas: [...], count }`

#### 1.2 `app/api/ludics/arenas/[id]/route.ts`
- [x] **GET**: Get single arena by ID
  - Returns: Full arena with moves and metadata
  - Include: Move tree structure, player assignments

#### 1.3 `app/api/ludics/arenas/from-deliberation/route.ts`
- [x] **POST**: Build arena from deliberation's designs
  - Input: `{ deliberationId, scope?, includeChronicles? }`
  - Uses: `createDeliberationArena` from arena module
  - Logic: Fetch all P/O designs, compute shared loci, build arena tree
  - Returns: `{ ok, arena, designCount, sharedLociCount }`

---

### 2. Interaction API Routes

#### 2.1 `app/api/ludics/interactions/route.ts`
- [x] **POST**: Start new interaction
  - Input: `{ arenaId, posDesignId, negDesignId, mode?: "manual"|"auto"|"step" }`
  - Uses: `stepInteraction`, `InteractionResult` from interaction module
  - Returns: `{ ok, interaction: { id, state, currentPlayer, status } }`

- [x] **GET**: List interactions
  - Query: `?arenaId=xxx&status=xxx`
  - Returns: `{ ok, interactions: [...], count }`

#### 2.2 `app/api/ludics/interactions/[id]/route.ts`
- [x] **GET**: Get interaction state
  - Returns: Current position, move history, available moves, status

- [x] **POST**: Make move / advance interaction
  - Input: `{ action: "move"|"step"|"auto-complete"|"reset"|"analyze", moveAddress?, ramification? }`
  - Uses: `stepInteraction` for single step, loops for auto
  - Returns: Updated state, new position, interaction result

#### 2.3 `app/api/ludics/interactions/simulate/route.ts`
- [ ] **POST**: Run interaction simulation (DEFERRED - can use existing dds/games/simulate)
  - Input: `{ arenaId?, posDesignId, negDesignId, maxSteps?, strategy? }`
  - Uses: `runSimulations`, `computeAIMove` 
  - Returns: `{ ok, result, trace, winner, moveCount }`

---

### 3. Path Extraction API Routes (Phase 3 Integration)

#### 3.1 `app/api/ludics/interactions/[id]/path/route.ts`
- [x] **GET**: Extract visitable paths from interaction
  - Query: `?format=json|markdown|html&includeIncarnation=true`
  - Uses Phase 3: `extractPath`, `extractAllPaths`, `computeIncarnation`
  - Returns: `{ ok, paths: VisitablePath[], chronicles: Chronicle[] }`

- [x] **POST**: Extract paths with options
  - Input: `{ action: "extract"|"all"|"narrative"|"incarnation", format?, computeViews?, computeIncarnation? }`
  - Uses: `formatAsNarrative`, `narrativeToMarkdown/JSON/HTML`
  - Returns: Formatted paths and narrative

#### 3.2 `app/api/ludics/extraction/route.ts` (optional consolidation)
- [ ] **POST**: Generic extraction endpoint (DEFERRED - covered by path route)
  - Input: `{ type: "path"|"incarnation"|"completion"|"narrative", sourceId, options }`
  - Dispatches to appropriate Phase 3 function
  - Returns: Type-specific results

---

### 4. Landscape API Routes (Phase 4 Integration)

#### 4.1 `app/api/ludics/landscape/[arenaId]/route.ts`
- [x] **GET**: Get landscape data for arena
  - Query: `?includeHeatMap=true&includeFlowPaths=true&format=json|svg`
  - Uses Phase 4: `generateLandscapeData`, `layoutAsTree`
  - Returns: `{ ok, landscape: LandscapeData }`

- [x] **POST**: Compute detailed landscape analysis
  - Input: `{ action: "full"|"strength"|"behaviours"|"completeness", computeStrength?, runSimulations?, generateVisualization? }`
  - Uses: `analyzeFullLandscape`, `findCriticalPoints`, `extractFlowPaths`
  - Returns: Full landscape with heat map, critical points, flow paths

#### 4.2 `app/api/ludics/landscape/strength/route.ts`
- [ ] **POST**: Analyze position strength (DEFERRED - covered by landscape/[arenaId] route)

#### 4.3 `app/api/ludics/landscape/behaviours/route.ts`
- [ ] **POST**: Compute behaviours (DEFERRED - covered by landscape/[arenaId] route)

#### 4.4 `app/api/ludics/landscape/completeness/route.ts`
- [ ] **POST**: Check behaviour completeness (DEFERRED - covered by landscape/[arenaId] route)

---

### 5. Update Existing Routes

#### 5.1 `app/api/ludics/compile-step/route.ts`
- [x] Add action: `"extract-path"` - Extract paths from compiled interaction
- [x] Add action: `"compute-landscape"` - Generate landscape for result
- [x] Add action: `"analyze-strength"` - Quick strength analysis
- [x] Return landscape hints in step results

---

### 6. Tests

#### 6.1 Unit Tests (`packages/ludics-core/dds/__tests__/api-integration.test.ts`)
- [x] Test arena creation helpers
- [x] Test interaction state management
- [x] Test path extraction via API layer
- [x] Test landscape computation via API layer

#### 6.2 API Route Tests (optional: Vitest with mock requests)
- [ ] Test POST /arenas (DEFERRED - would require HTTP mocking)
- [ ] Test POST /interactions (DEFERRED - would require HTTP mocking)
- [ ] Test GET /interactions/:id/path (DEFERRED - would require HTTP mocking)
- [ ] Test GET /landscape/:arenaId (DEFERRED - would require HTTP mocking)

---

## Dependencies

### Phase 3 Modules (Extraction)
```typescript
import { extractPath, extractAllPaths, validatePath, comparePaths, mergePaths } from "@/packages/ludics-core/dds/extraction/path-extractor";
import { computeIncarnation, computeView, justifies } from "@/packages/ludics-core/dds/extraction/incarnation";
import { completeDesign, isChronicleComplete, addDaimonEnding } from "@/packages/ludics-core/dds/extraction/completion";
import { formatAsNarrative, narrativeToMarkdown, narrativeToJSON, narrativeToHTML } from "@/packages/ludics-core/dds/extraction/narrative-formatter";
```

### Phase 4 Modules (Landscape)
```typescript
import { converges, computeOrthogonal, computeBiorthogonalClosure, computeBehaviour } from "@/packages/ludics-core/dds/landscape/behaviour-computer";
import { analyzePositionStrength, analyzeAllPositions, runSimulations, hasWinningStrategy } from "@/packages/ludics-core/dds/landscape/position-analyzer";
import { generateLandscapeData, layoutAsTree, findCriticalPoints, extractFlowPaths, landscapeToJSON, landscapeToSVG } from "@/packages/ludics-core/dds/landscape/visualization-data";
import { checkBehaviourCompleteness, checkDesignCompleteness, findMissingDesigns, validateBehaviourStructure } from "@/packages/ludics-core/dds/landscape/completeness-checker";
import { analyzeFullLandscape, quickStrengthCheck } from "@/packages/ludics-core/dds/landscape";
```

### Existing DDS Modules
```typescript
import { createUniversalArena, createArenaFromDesigns, createArenaMove } from "@/packages/ludics-core/dds/arena";
import { initializeGame, makeGameMove, isGameOver, getGameWinner } from "@/packages/ludics-core/dds/game";
import { stepInteraction, InteractionResult } from "@/packages/ludics-core/dds/interaction";
```

---

## Implementation Priority

1. **Arena routes** (1.1, 1.2, 1.3) - Foundation for all interactions
2. **Interaction routes** (2.1, 2.2) - Core gameplay/stepping
3. **Path extraction** (3.1) - Uses Phase 3 modules
4. **Landscape routes** (4.1, 4.2) - Uses Phase 4 modules  
5. **Compile-step updates** (5.1) - Enhance existing
6. **Tests** (6.1, 6.2) - Verify integration

---

## Success Criteria

- [x] All new endpoints return proper `{ ok, ... }` format
- [x] Phase 3 extraction functions accessible via `/interactions/:id/path`
- [x] Phase 4 landscape functions accessible via `/landscape/:arenaId`
- [x] Existing 121 tests still pass (Phase 3: 59, Phase 4: 62)
- [x] New API tests added and passing (28 tests)
- [x] Total tests ≥ 130 (**149 tests passing**: 59 + 62 + 28)

---

## Implementation Summary

### Routes Created

| Route | Methods | Status |
|-------|---------|--------|
| `app/api/ludics/arenas/route.ts` | POST, GET | ✅ Complete |
| `app/api/ludics/arenas/[id]/route.ts` | GET | ✅ Complete |
| `app/api/ludics/arenas/from-deliberation/route.ts` | POST | ✅ Complete |
| `app/api/ludics/interactions/route.ts` | POST, GET | ✅ Complete |
| `app/api/ludics/interactions/[id]/route.ts` | GET, POST | ✅ Complete |
| `app/api/ludics/interactions/[id]/path/route.ts` | GET, POST | ✅ Complete |
| `app/api/ludics/landscape/[arenaId]/route.ts` | GET, POST | ✅ Complete |
| `app/api/ludics/compile-step/route.ts` | POST (updated) | ✅ Complete |

### Test Results

```
packages/ludics-core/dds/__tests__/extraction.test.ts    59 tests ✓
packages/ludics-core/dds/__tests__/landscape.test.ts     62 tests ✓
packages/ludics-core/dds/__tests__/api-integration.test.ts 28 tests ✓
─────────────────────────────────────────────────────────────────
Total                                                    149 tests ✓
```

---

## Notes

- Follow existing patterns from `dds/games/route.ts` and `dds/views/route.ts`
- Use in-memory stores for demo, Prisma for production where tables exist
- Keep response structure consistent with existing DDS API
- Include `stats` object in responses for debugging/metrics
