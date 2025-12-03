# Ludics Game/Arena Feature Design Document

## Overview

This document outlines the comprehensive design for implementing a **Game/Arena feature** in the Ludics module, based on Faggian & Hyland (2002) "Designs, Disputes and Strategies" (DDS).

---

## 1. Theoretical Foundation

### 1.1 Universal Arena (Definition 3.1)

The **Universal Arena** is the fundamental structure for all ludics games:

```
Arena A = (Moves, Labels, Enabling)
```

**Components:**
- **Moves**: All actions (ξ, J) where ξ is an address and J ∈ ℘fin(N)
- **Labels**: Implicit in address parity (even-length ↔ one player, odd-length ↔ other)
- **Enabling**: (ξ, I) justifies (ξi, J) if i ∈ I

**Key Properties:**
- Can be **delocated** to any initial address ξ → creates **atomic arenas**
- Universal arena has base ⊢<>
- Players determined by address parity

### 1.2 Players and Polarity

**Players:**
- **Proponent (P)**: Starts the game (owns initial moves)
- **Opponent (O)**: Responds to Proponent

**Polarity** (relative to player):
- **Positive** = "mine" (same parity)
- **Negative** = "yours" (opposite parity)

### 1.3 Legal Positions / Plays (Definition 3.7)

A **play** is a linear sequence of actions satisfying:

1. **Parity**: Alternates between P and O
2. **Justification**: Each non-initial move is justified by earlier move
3. **Linearity**: Any address appears at most once
4. **Visibility**: If tκ ⊑ p where κ is non-initial, justifier of κ occurs in view tκ⁺

### 1.4 Views (Definition 3.5)

The **view** extracts the relevant history from a player's perspective:

```
• ε̅ = ε
• s̅κ⁺ = s̅⁻κ⁺
• s̅κ⁻ = κ⁻ if κ is initial
• s̅κ'tκ⁻ = s̅⁻κ'κ if κ = (ξi, J) and κ' = (ξ, I)⁺
```

### 1.5 Games from Behaviours (Definition 6.2)

A **game** G is derived from a behaviour B:
- G = (A, A⊥) where A is the positive behaviour and A⊥ is negative
- Strategies in A play against strategies in A⊥
- A ⊥ A⊥ means all strategies are pairwise orthogonal

---

## 2. Architecture Design

### 2.1 Type System

```typescript
// packages/ludics-core/dds/arena/types.ts

/**
 * Universal Arena (Definition 3.1)
 */
export type UniversalArena = {
  id: string;
  /** Base address (e.g., "<>" for universal, or specific address for atomic) */
  base: string;
  /** All moves in this arena */
  moves: ArenaMove[];
  /** Enabling relation graph */
  enablingRelation: EnablingEdge[];
  /** Whether this is universal (base ⊢<>) or atomic */
  isUniversal: boolean;
  /** Delocalization address (if atomic arena) */
  delocalizationAddress?: string;
};

/**
 * Move in the arena (Definition 3.1)
 */
export type ArenaMove = {
  id: string;
  /** Focus address ξ */
  address: string;
  /** Ramification J ∈ ℘fin(N) */
  ramification: number[];
  /** Computed from address parity */
  player: "P" | "O";
  /** Is this an initial move (focus is <>) */
  isInitial: boolean;
  /** Parent move that justifies this one */
  justifierId?: string;
};

/**
 * Enabling edge in arena
 */
export type EnablingEdge = {
  /** Move (ξ, I) that enables */
  justifierId: string;
  /** Move (ξi, J) that is enabled */
  enabledId: string;
  /** The index i ∈ I */
  index: number;
};

/**
 * Legal Position / Play (Definition 3.7)
 */
export type LegalPosition = {
  id: string;
  arenaId: string;
  /** Sequence of moves */
  sequence: ArenaMove[];
  /** Length of sequence */
  length: number;
  /** Whose turn is next */
  currentPlayer: "P" | "O";
  /** P-view of this position */
  pView: ArenaMove[];
  /** O-view of this position */
  oView: ArenaMove[];
  /** Is this position terminal? */
  isTerminal: boolean;
  /** Validation status */
  validity: PositionValidity;
};

/**
 * Position validity check results
 */
export type PositionValidity = {
  isValid: boolean;
  /** Parity alternation satisfied */
  parityOk: boolean;
  /** All non-initial moves justified */
  justificationOk: boolean;
  /** No address repeated */
  linearityOk: boolean;
  /** Visibility condition satisfied */
  visibilityOk: boolean;
  /** Error details if invalid */
  errors?: string[];
};

/**
 * Player View (Definition 3.5)
 */
export type PlayerView = {
  player: "P" | "O";
  position: LegalPosition;
  /** The computed view sequence */
  viewSequence: ArenaMove[];
  /** Chronicles extractable from this view */
  chronicles: Chronicle[];
};

/**
 * Chronicle extracted from view
 */
export type Chronicle = {
  id: string;
  /** Sequence of actions in chronicle */
  actions: ArenaMove[];
  /** The move this chronicle identifies */
  targetMove: ArenaMove;
};

/**
 * Ludics Game (from behaviours)
 */
export type LudicsGame = {
  id: string;
  name?: string;
  deliberationId: string;
  /** Positive behaviour (A) */
  positiveBehaviourId: string;
  /** Negative behaviour (A⊥) */
  negativeBehaviourId: string;
  /** The arena structure */
  arena: UniversalArena;
  /** All legal positions in this game */
  positions: LegalPosition[];
  /** Available strategies */
  strategies: GameStrategy[];
  /** Current game state (for live play) */
  gameState?: GamePlayState;
};

/**
 * Strategy in a game context
 */
export type GameStrategy = {
  id: string;
  gameId: string;
  /** Original design/strategy ID */
  sourceId: string;
  /** Which player uses this strategy */
  player: "P" | "O";
  /** Response map: position → move */
  responseMap: Map<string, ArenaMove>;
  /** Is this strategy winning? */
  isWinning?: boolean;
};

/**
 * Live game play state
 */
export type GamePlayState = {
  gameId: string;
  /** Current position */
  currentPosition: LegalPosition;
  /** History of positions */
  positionHistory: LegalPosition[];
  /** Selected strategy for P (if any) */
  pStrategy?: GameStrategy;
  /** Selected strategy for O (if any) */
  oStrategy?: GameStrategy;
  /** Game status */
  status: "setup" | "playing" | "p_wins" | "o_wins" | "draw";
  /** Move log */
  moveLog: MoveLogEntry[];
};

/**
 * Move log entry
 */
export type MoveLogEntry = {
  moveNumber: number;
  player: "P" | "O";
  move: ArenaMove;
  timestamp: Date;
  /** Position after this move */
  resultingPositionId: string;
};

/**
 * Daimon move (Definition 3.9)
 */
export type DaimonMove = {
  type: "daimon";
  symbol: "†";
  player: "P" | "O";
  /** Daimon is always positive for the player who plays it */
  polarity: "positive";
};
```

### 2.2 Core Functions

```typescript
// packages/ludics-core/dds/arena/arena.ts

/**
 * Create Universal Arena
 */
export function createUniversalArena(): UniversalArena;

/**
 * Create Atomic Arena by delocalizing to address
 */
export function delocateArena(
  arena: UniversalArena,
  address: string
): UniversalArena;

/**
 * Get player for an address based on parity
 */
export function getPlayerFromAddress(address: string): "P" | "O";

/**
 * Check if move justifies another (enabling relation)
 */
export function checkEnabling(
  justifier: ArenaMove,
  enabled: ArenaMove
): boolean;

/**
 * Get all moves enabled by a given move
 */
export function getEnabledMoves(
  move: ArenaMove,
  arena: UniversalArena
): ArenaMove[];


// packages/ludics-core/dds/arena/positions.ts

/**
 * Validate a position against all conditions
 */
export function validatePosition(
  sequence: ArenaMove[],
  arena: UniversalArena
): PositionValidity;

/**
 * Compute P-view of a position (Definition 3.5)
 */
export function computePView(position: LegalPosition): ArenaMove[];

/**
 * Compute O-view of a position (Definition 3.5)
 */
export function computeOView(position: LegalPosition): ArenaMove[];

/**
 * Compute view for specific player
 */
export function computeView(
  position: LegalPosition,
  player: "P" | "O"
): PlayerView;

/**
 * Get available moves from a position
 */
export function getAvailableMoves(
  position: LegalPosition,
  arena: UniversalArena
): ArenaMove[];

/**
 * Apply move to position, returning new position
 */
export function applyMove(
  position: LegalPosition,
  move: ArenaMove,
  arena: UniversalArena
): LegalPosition | null;

/**
 * Check visibility condition for a move
 */
export function checkVisibility(
  position: LegalPosition,
  move: ArenaMove,
  player: "P" | "O"
): boolean;


// packages/ludics-core/dds/arena/chronicles.ts

/**
 * Extract chronicles from position (Proposition 3.6)
 */
export function extractChronicles(
  position: LegalPosition,
  player: "P" | "O"
): Chronicle[];

/**
 * Extract P-slice from play (Proposition 3.12)
 */
export function extractPSlice(position: LegalPosition): Design;

/**
 * Extract O-slice from play (Proposition 3.12)
 */
export function extractOSlice(position: LegalPosition): Design;


// packages/ludics-core/dds/arena/game.ts

/**
 * Construct game from two orthogonal behaviours
 */
export function constructGame(
  positiveBehaviour: Behaviour,
  negativeBehaviour: Behaviour,
  designs: DesignForCorrespondence[]
): LudicsGame;

/**
 * Extract arena from behaviour designs
 */
export function extractArenaFromBehaviour(
  behaviour: Behaviour,
  designs: DesignForCorrespondence[]
): UniversalArena;

/**
 * Enumerate all legal positions in game (up to limit)
 */
export function enumerateLegalPositions(
  arena: UniversalArena,
  maxDepth: number
): LegalPosition[];

/**
 * Check if a strategy is winning
 */
export function analyzeWinningStrategy(
  strategy: GameStrategy,
  game: LudicsGame
): { isWinning: boolean; winningPositions: LegalPosition[] };


// packages/ludics-core/dds/arena/play.ts

/**
 * Initialize game play state
 */
export function initializeGamePlay(
  game: LudicsGame,
  pStrategy?: GameStrategy,
  oStrategy?: GameStrategy
): GamePlayState;

/**
 * Make a move in the game
 */
export function makeMove(
  state: GamePlayState,
  move: ArenaMove,
  game: LudicsGame
): GamePlayState;

/**
 * Get suggested move from strategy
 */
export function getSuggestedMove(
  state: GamePlayState,
  player: "P" | "O"
): ArenaMove | null;

/**
 * Play daimon (surrender / complete)
 */
export function playDaimon(
  state: GamePlayState,
  player: "P" | "O"
): GamePlayState;

/**
 * Simulate game between two strategies
 */
export function simulateGame(
  game: LudicsGame,
  pStrategy: GameStrategy,
  oStrategy: GameStrategy
): { winner: "P" | "O" | "draw"; trace: MoveLogEntry[] };
```

### 2.3 API Routes

```typescript
// app/api/ludics/arena/route.ts
POST /api/ludics/arena
- Create new arena from behaviour or from scratch

GET /api/ludics/arena/[arenaId]
- Get arena details with moves and enabling relation


// app/api/ludics/arena/delocate/route.ts
POST /api/ludics/arena/delocate
- Delocate universal arena to specific address


// app/api/ludics/arena/positions/route.ts
POST /api/ludics/arena/positions
- Enumerate legal positions in arena (with depth limit)

POST /api/ludics/arena/positions/validate
- Validate a specific position sequence


// app/api/ludics/arena/views/route.ts
POST /api/ludics/arena/views
- Compute P-view and O-view for a position


// app/api/ludics/games/route.ts
POST /api/ludics/games
- Create game from two orthogonal behaviours

GET /api/ludics/games/[gameId]
- Get game with arena, positions, strategies


// app/api/ludics/games/[gameId]/play/route.ts
POST /api/ludics/games/[gameId]/play
- Make a move in the game

GET /api/ludics/games/[gameId]/play
- Get current game state


// app/api/ludics/games/[gameId]/simulate/route.ts
POST /api/ludics/games/[gameId]/simulate
- Simulate game between two strategies


// app/api/ludics/games/[gameId]/analyze/route.ts
POST /api/ludics/games/[gameId]/analyze
- Analyze winning strategies
```

### 2.4 Database Schema Updates

```prisma
// Add to schema.prisma

model LudicsArena {
  id                    String   @id @default(cuid())
  deliberationId        String
  deliberation          Deliberation @relation(fields: [deliberationId], references: [id])
  
  name                  String?
  base                  String   // Base address (e.g., "<>" for universal)
  isUniversal           Boolean  @default(true)
  delocalizationAddress String?  // If atomic arena
  
  movesJson             Json     // Array of ArenaMove
  enablingJson          Json     // Array of EnablingEdge
  
  games                 LudicsGameV2[]
  positions             LudicsPosition[]
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}

model LudicsPosition {
  id                String   @id @default(cuid())
  arenaId           String
  arena             LudicsArena @relation(fields: [arenaId], references: [id])
  
  sequenceJson      Json     // Array of move IDs
  length            Int
  currentPlayer     String   // "P" | "O"
  pViewJson         Json     // P-view sequence
  oViewJson         Json     // O-view sequence
  isTerminal        Boolean  @default(false)
  validityJson      Json     // PositionValidity
  
  createdAt         DateTime @default(now())
}

model LudicsGameV2 {
  id                    String   @id @default(cuid())
  deliberationId        String
  deliberation          Deliberation @relation(fields: [deliberationId], references: [id])
  
  name                  String?
  arenaId               String
  arena                 LudicsArena @relation(fields: [arenaId], references: [id])
  positiveBehaviourId   String
  positiveBehaviour     LudicsBehaviour @relation("PositiveBehaviour", fields: [positiveBehaviourId], references: [id])
  negativeBehaviourId   String  
  negativeBehaviour     LudicsBehaviour @relation("NegativeBehaviour", fields: [negativeBehaviourId], references: [id])
  
  strategiesJson        Json?    // Array of GameStrategy
  gameStateJson         Json?    // Current GamePlayState
  
  playHistory           LudicsGameMove[]
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}

model LudicsGameMove {
  id                String   @id @default(cuid())
  gameId            String
  game              LudicsGameV2 @relation(fields: [gameId], references: [id])
  
  moveNumber        Int
  player            String   // "P" | "O"
  moveJson          Json     // ArenaMove
  positionId        String?  // Resulting position
  
  createdAt         DateTime @default(now())
}
```

---

## 3. UI Components

### 3.1 Component Hierarchy

```
components/ludics/arena/
├── ArenaPanel.tsx              # Main arena view panel
├── ArenaVisualizer.tsx         # Tree visualization of arena
├── MoveNode.tsx                # Single move in arena tree
├── EnablingEdge.tsx            # Edge showing enabling relation
├── PositionDisplay.tsx         # Display a legal position
├── PositionSequence.tsx        # Show move sequence
├── ViewPanel.tsx               # P-view and O-view display
└── ArenaControls.tsx           # Controls for arena manipulation

components/ludics/game/
├── GamePanel.tsx               # Main game panel
├── GameBoard.tsx               # Interactive game board
├── GamePlayArea.tsx            # Live game play interface
├── PlayerPanel.tsx             # Player info and controls
├── MoveSelector.tsx            # Select available moves
├── StrategySelector.tsx        # Choose strategy for player
├── GameHistory.tsx             # Move history display
├── GameSimulator.tsx           # Simulate games between strategies
├── WinningAnalysis.tsx         # Winning strategy analysis
└── GameSetupWizard.tsx         # Setup new game from behaviours
```

### 3.2 ArenaPanel Component

```tsx
// components/ludics/arena/ArenaPanel.tsx

interface ArenaPanelProps {
  deliberationId: string;
  selectedBehaviourId?: string;
}

export function ArenaPanel({ deliberationId, selectedBehaviourId }: ArenaPanelProps) {
  const [arena, setArena] = useState<UniversalArena | null>(null);
  const [positions, setPositions] = useState<LegalPosition[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<LegalPosition | null>(null);
  const [viewMode, setViewMode] = useState<"tree" | "list" | "graph">("tree");
  
  return (
    <div className="space-y-4">
      {/* Arena Info Header */}
      <div className="bg-slate-50 rounded-lg p-4">
        <h3 className="font-bold text-lg">Universal Arena</h3>
        <div className="text-sm text-slate-600">
          Base: {arena?.base || "⊢<>"} | 
          Moves: {arena?.moves.length || 0} |
          {arena?.isUniversal ? "Universal" : `Atomic (${arena?.delocalizationAddress})`}
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setViewMode("tree")}>Tree View</button>
        <button onClick={() => setViewMode("list")}>List View</button>
        <button onClick={() => setViewMode("graph")}>Graph View</button>
      </div>

      {/* Arena Visualization */}
      {viewMode === "tree" && <ArenaTreeView arena={arena} onSelectMove={...} />}
      {viewMode === "list" && <ArenaMoveList arena={arena} />}
      {viewMode === "graph" && <ArenaGraph arena={arena} />}

      {/* Position Explorer */}
      <div className="border-t pt-4">
        <h4 className="font-semibold mb-2">Legal Positions</h4>
        <PositionExplorer
          arena={arena}
          positions={positions}
          onSelectPosition={setSelectedPosition}
        />
      </div>

      {/* Selected Position Details */}
      {selectedPosition && (
        <PositionDetailPanel
          position={selectedPosition}
          arena={arena}
        />
      )}
    </div>
  );
}
```

### 3.3 GamePanel Component

```tsx
// components/ludics/game/GamePanel.tsx

interface GamePanelProps {
  deliberationId: string;
  gameId?: string;
}

export function GamePanel({ deliberationId, gameId }: GamePanelProps) {
  const [game, setGame] = useState<LudicsGame | null>(null);
  const [gameState, setGameState] = useState<GamePlayState | null>(null);
  const [mode, setMode] = useState<"setup" | "play" | "simulate" | "analyze">("setup");

  return (
    <div className="space-y-4">
      {/* Game Header */}
      <div className="bg-gradient-to-r from-blue-50 to-rose-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Ludics Game</h3>
          <div className="flex gap-2">
            {game && (
              <>
                <span className="px-2 py-1 bg-blue-100 rounded text-blue-700 text-sm">
                  A: {game.positiveBehaviourId.slice(0, 8)}...
                </span>
                <span className="text-slate-400">⊥</span>
                <span className="px-2 py-1 bg-rose-100 rounded text-rose-700 text-sm">
                  A⊥: {game.negativeBehaviourId.slice(0, 8)}...
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="flex border-b">
        <button 
          className={mode === "setup" ? "active" : ""} 
          onClick={() => setMode("setup")}
        >
          Setup
        </button>
        <button 
          className={mode === "play" ? "active" : ""} 
          onClick={() => setMode("play")}
        >
          Play
        </button>
        <button 
          className={mode === "simulate" ? "active" : ""} 
          onClick={() => setMode("simulate")}
        >
          Simulate
        </button>
        <button 
          className={mode === "analyze" ? "active" : ""} 
          onClick={() => setMode("analyze")}
        >
          Analyze
        </button>
      </div>

      {/* Mode Content */}
      {mode === "setup" && (
        <GameSetupPanel
          deliberationId={deliberationId}
          onGameCreated={setGame}
        />
      )}
      
      {mode === "play" && game && (
        <GamePlayPanel
          game={game}
          gameState={gameState}
          onStateChange={setGameState}
        />
      )}
      
      {mode === "simulate" && game && (
        <GameSimulatorPanel
          game={game}
        />
      )}
      
      {mode === "analyze" && game && (
        <WinningAnalysisPanel
          game={game}
        />
      )}
    </div>
  );
}
```

### 3.4 GamePlayPanel Component (Interactive Play)

```tsx
// components/ludics/game/GamePlayPanel.tsx

interface GamePlayPanelProps {
  game: LudicsGame;
  gameState: GamePlayState | null;
  onStateChange: (state: GamePlayState) => void;
}

export function GamePlayPanel({ game, gameState, onStateChange }: GamePlayPanelProps) {
  const [availableMoves, setAvailableMoves] = useState<ArenaMove[]>([]);

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Left: Proponent (P) Panel */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-bold text-blue-700 mb-2">Proponent (P)</h4>
        <PlayerControlPanel
          player="P"
          game={game}
          gameState={gameState}
          isCurrentTurn={gameState?.currentPosition.currentPlayer === "P"}
          onSelectStrategy={...}
          onMakeMove={...}
        />
      </div>

      {/* Center: Game Board */}
      <div className="bg-slate-50 rounded-lg p-4">
        <h4 className="font-semibold text-center mb-4">Game Board</h4>
        
        {/* Current Position Visualization */}
        <PositionVisualization
          position={gameState?.currentPosition}
          arena={game.arena}
        />

        {/* Move History */}
        <div className="mt-4 border-t pt-4">
          <h5 className="text-sm font-semibold mb-2">Move History</h5>
          <MoveHistory moves={gameState?.moveLog || []} />
        </div>

        {/* Available Moves */}
        {gameState && !gameState.currentPosition.isTerminal && (
          <div className="mt-4 border-t pt-4">
            <h5 className="text-sm font-semibold mb-2">
              Available Moves ({gameState.currentPosition.currentPlayer}'s turn)
            </h5>
            <MoveSelector
              moves={availableMoves}
              onSelect={(move) => handleMakeMove(move)}
            />
          </div>
        )}

        {/* Game Result */}
        {gameState?.currentPosition.isTerminal && (
          <div className={`mt-4 p-4 rounded-lg text-center ${
            gameState.status === "p_wins" ? "bg-blue-100" : "bg-rose-100"
          }`}>
            <div className="text-2xl font-bold">
              {gameState.status === "p_wins" ? "P Wins!" : "O Wins!"}
            </div>
          </div>
        )}
      </div>

      {/* Right: Opponent (O) Panel */}
      <div className="bg-rose-50 rounded-lg p-4">
        <h4 className="font-bold text-rose-700 mb-2">Opponent (O)</h4>
        <PlayerControlPanel
          player="O"
          game={game}
          gameState={gameState}
          isCurrentTurn={gameState?.currentPosition.currentPlayer === "O"}
          onSelectStrategy={...}
          onMakeMove={...}
        />
      </div>
    </div>
  );
}
```

---

## 4. Implementation Phases

### Phase 1: Arena Foundation (Week 1-2) ✅ COMPLETE
- [x] Implement `UniversalArena` type and creation
- [x] Implement `ArenaMove` with address parity detection
- [x] Implement enabling relation computation
- [x] Implement arena delocalization
- [x] Add arena API routes
- [x] Create `ArenaPanel` basic UI
- **Tests:** 27 passing

### Phase 2: Game Module (Week 2-3) ✅ COMPLETE
- [x] Implement `LudicsGame` type and construction
- [x] Implement game play (moves, undo, resign)
- [x] Implement AI move computation
- [x] Implement game simulation
- [x] Implement state encoding/decoding
- [x] Add game API routes (play, simulate)
- **Tests:** 43 passing

### Phase 3: UI Components (Week 3-4) ✅ COMPLETE
- [x] `ArenaPanel` - Main arena view with tree/list/stats modes
- [x] `ArenaTreeView` - Recursive tree visualization
- [x] `PositionExplorer` - Browse legal positions
- [x] `PositionDetailPanel` - Position details with P/O views
- [x] `GamePanel` - Main game panel with tabs
- [x] `GameSetupPanel` - Game creation wizard
- [x] `GamePlayPanel` - Interactive play with AI
- [x] `GameSimulatorPanel` - Strategy simulations
- [x] `WinningAnalysisPanel` - Strategy analysis

### Phase 4: Integration & Polish (Week 4-5) ✅ COMPLETE
- [x] Created demo page (`/test/ludics-arena-game`)
- [x] Integrated with BehaviourPanel "Game" tab
- [x] Implemented save/load game states (persistence.ts)
- [x] Added export (JSON) functionality with copy/download
- [x] Comprehensive testing (21 persistence tests)
- **Total Tests:** 91 passing (27 + 43 + 21)

### Phase 5: Advanced Features (Future)
- [ ] Performance optimization for large arenas
- [ ] Extended visualization (graph view, animations)
- [ ] Multiplayer support
- [ ] Tournament history and rankings persistence

---

## 5. Key Algorithms

### 5.1 View Computation (Definition 3.5)

```typescript
function computeView(
  position: LegalPosition,
  player: "P" | "O"
): ArenaMove[] {
  const sequence = position.sequence;
  if (sequence.length === 0) return [];

  const view: ArenaMove[] = [];
  
  for (let i = sequence.length - 1; i >= 0; i--) {
    const move = sequence[i];
    const isPositive = move.player === player;
    
    if (isPositive) {
      // sκ⁺ = s̅⁻κ⁺ — keep positive, recurse on prefix
      view.unshift(move);
    } else {
      // Negative move
      if (move.isInitial) {
        // sκ⁻ = κ⁻ if initial
        view.unshift(move);
        break; // View ends at initial negative move
      } else {
        // sκ'tκ⁻ = s̅⁻κ'κ — find justifier, continue
        view.unshift(move);
        const justifier = findJustifier(move, sequence.slice(0, i));
        if (justifier) {
          view.unshift(justifier);
          // Continue from justifier position
          i = sequence.indexOf(justifier);
        }
      }
    }
  }
  
  return view;
}
```

### 5.2 Position Validation

```typescript
function validatePosition(
  sequence: ArenaMove[],
  arena: UniversalArena
): PositionValidity {
  const errors: string[] = [];
  
  // 1. Parity check
  let parityOk = true;
  for (let i = 1; i < sequence.length; i++) {
    if (sequence[i].player === sequence[i - 1].player) {
      parityOk = false;
      errors.push(`Parity violation at move ${i + 1}`);
    }
  }
  
  // 2. Justification check
  let justificationOk = true;
  for (let i = 0; i < sequence.length; i++) {
    const move = sequence[i];
    if (!move.isInitial) {
      const hasJustifier = sequence.slice(0, i).some(
        prev => checkEnabling(prev, move)
      );
      if (!hasJustifier) {
        justificationOk = false;
        errors.push(`Move ${i + 1} has no justifier`);
      }
    }
  }
  
  // 3. Linearity check
  let linearityOk = true;
  const addresses = new Set<string>();
  for (const move of sequence) {
    if (addresses.has(move.address)) {
      linearityOk = false;
      errors.push(`Address ${move.address} appears twice`);
    }
    addresses.add(move.address);
  }
  
  // 4. Visibility check
  let visibilityOk = true;
  for (let i = 1; i < sequence.length; i++) {
    const move = sequence[i];
    if (!move.isInitial) {
      const prefix = sequence.slice(0, i);
      const view = computeViewForPrefix(prefix, move.player);
      const justifier = findJustifier(move, prefix);
      
      if (justifier && !view.includes(justifier)) {
        visibilityOk = false;
        errors.push(`Visibility violation: justifier of move ${i + 1} not in view`);
      }
    }
  }
  
  return {
    isValid: parityOk && justificationOk && linearityOk && visibilityOk,
    parityOk,
    justificationOk,
    linearityOk,
    visibilityOk,
    errors: errors.length > 0 ? errors : undefined,
  };
}
```

### 5.3 Game Simulation

```typescript
async function simulateGame(
  game: LudicsGame,
  pStrategy: GameStrategy,
  oStrategy: GameStrategy
): Promise<{ winner: "P" | "O" | "draw"; trace: MoveLogEntry[] }> {
  let state = initializeGamePlay(game, pStrategy, oStrategy);
  const trace: MoveLogEntry[] = [];
  const maxMoves = 1000; // Prevent infinite games
  
  while (!state.currentPosition.isTerminal && trace.length < maxMoves) {
    const currentPlayer = state.currentPosition.currentPlayer;
    const strategy = currentPlayer === "P" ? pStrategy : oStrategy;
    
    // Get move from strategy
    const positionKey = serializePosition(state.currentPosition);
    const move = strategy.responseMap.get(positionKey);
    
    if (!move) {
      // No response defined - play daimon
      state = playDaimon(state, currentPlayer);
      break;
    }
    
    // Apply move
    state = makeMove(state, move, game);
    trace.push({
      moveNumber: trace.length + 1,
      player: currentPlayer,
      move,
      timestamp: new Date(),
      resultingPositionId: state.currentPosition.id,
    });
  }
  
  // Determine winner
  const winner = state.currentPosition.isTerminal
    ? (state.currentPosition.sequence[state.currentPosition.sequence.length - 1]?.player || "draw")
    : "draw";
  
  return { winner, trace };
}
```

---

## 6. Testing Strategy

### 6.1 Unit Tests

```typescript
// Test arena creation
describe("UniversalArena", () => {
  it("creates universal arena with base ⊢<>", () => {...});
  it("correctly determines player from address parity", () => {...});
  it("computes enabling relation correctly", () => {...});
  it("delocalizes to atomic arena", () => {...});
});

// Test position validation
describe("LegalPosition", () => {
  it("validates parity alternation", () => {...});
  it("validates justification", () => {...});
  it("validates linearity", () => {...});
  it("validates visibility", () => {...});
});

// Test view computation
describe("Views", () => {
  it("computes P-view correctly", () => {...});
  it("computes O-view correctly", () => {...});
  it("extracts chronicles from views", () => {...});
});

// Test game construction
describe("LudicsGame", () => {
  it("constructs game from orthogonal behaviours", () => {...});
  it("extracts arena from behaviour designs", () => {...});
  it("enumerates legal positions", () => {...});
});
```

### 6.2 Integration Tests

```typescript
describe("Game Play Integration", () => {
  it("plays complete game between strategies", () => {...});
  it("handles daimon termination", () => {...});
  it("correctly determines winner", () => {...});
});

describe("Arena-Behaviour Integration", () => {
  it("constructs arena from real behaviour", () => {...});
  it("positions correspond to disputes", () => {...});
});
```

---

## 7. Dependencies & Prerequisites

### Required Existing Components
- `packages/ludics-core/dds/behaviours/` - Behaviour and orthogonality
- `packages/ludics-core/dds/strategy/` - Strategy types
- `packages/ludics-core/dds/correspondence/` - Design-strategy correspondence
- `components/ludics/analysis/BehaviourPanel.tsx` - Integration point

### New Dependencies
- None required (uses existing React/Next.js stack)
- Optional: `react-flow` or `d3` for arena visualization

---

## 8. Design Decisions (Finalized)

| Question | Decision | Rationale |
|----------|----------|-----------|
| **Arena Visualization** | Tree view | Shows enabling hierarchy naturally; sufficient for our use case |
| **Position Storage** | Compute on-demand with caching | Optimize for performance; avoid storing large position sets upfront |
| **Game State Persistence** | Compact encoded format | Space-efficient storage; decode/load on access (see §8.1) |
| **Multiplayer Support** | Not implemented | Future consideration; not needed for current requirements |
| **AI Opponent** | Simple greedy/heuristic | Minimal complexity; avoid expensive minimax for now |

### 8.1 Compact Game State Encoding

Games will be stored in a compact binary-like JSON structure for space efficiency:

```typescript
/**
 * Compact encoded game state for storage
 * Designed for minimal storage footprint
 */
export type EncodedGameState = {
  /** Version for forward compatibility */
  v: number;
  /** Game ID (compressed) */
  g: string;
  /** Arena reference (not duplicated) */
  a: string;
  /** Move sequence as address:ramification pairs */
  m: string; // e.g., "0:1,2|01:3|012:1,4" 
  /** Current player: 0=P, 1=O */
  p: 0 | 1;
  /** Status: 0=playing, 1=p_wins, 2=o_wins, 3=draw */
  s: 0 | 1 | 2 | 3;
  /** Timestamp (unix seconds) */
  t: number;
};

/**
 * Encode game state for storage
 */
export function encodeGameState(state: GamePlayState): EncodedGameState {
  return {
    v: 1,
    g: state.gameId,
    a: state.currentPosition.arenaId,
    m: state.moveLog.map(entry => 
      `${entry.move.address}:${entry.move.ramification.join(",")}`
    ).join("|"),
    p: state.currentPosition.currentPlayer === "P" ? 0 : 1,
    s: state.status === "playing" ? 0 
       : state.status === "p_wins" ? 1 
       : state.status === "o_wins" ? 2 : 3,
    t: Math.floor(Date.now() / 1000),
  };
}

/**
 * Decode game state from storage
 */
export function decodeGameState(
  encoded: EncodedGameState,
  arena: UniversalArena
): GamePlayState {
  const moves = encoded.m.split("|").filter(Boolean).map(moveStr => {
    const [address, ramStr] = moveStr.split(":");
    const ramification = ramStr ? ramStr.split(",").map(Number) : [];
    return reconstructMove(address, ramification, arena);
  });
  
  // Rebuild position by replaying moves
  let position = createInitialPosition(arena);
  for (const move of moves) {
    position = applyMoveToPosition(position, move, arena);
  }
  
  return {
    gameId: encoded.g,
    currentPosition: position,
    positionHistory: [], // Reconstructed on demand
    status: ["playing", "p_wins", "o_wins", "draw"][encoded.s] as any,
    moveLog: moves.map((m, i) => ({
      moveNumber: i + 1,
      player: i % 2 === 0 ? "P" : "O",
      move: m,
      timestamp: new Date(encoded.t * 1000),
      resultingPositionId: `pos-${i}`,
    })),
  };
}
```

**Storage Estimate:**
- Typical game (20 moves): ~200 bytes encoded vs ~5KB uncompressed
- Can store ~25x more games in same space

### 8.2 On-Demand Position Computation

Instead of pre-enumerating all positions, compute them lazily:

```typescript
/**
 * Position cache for on-demand computation
 */
class PositionCache {
  private cache = new Map<string, LegalPosition>();
  private maxSize = 1000;
  
  /**
   * Get or compute a position
   */
  getPosition(
    arena: UniversalArena,
    moveSequence: ArenaMove[]
  ): LegalPosition {
    const key = this.computeKey(moveSequence);
    
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }
    
    // Compute position
    const position = this.computePosition(arena, moveSequence);
    
    // Cache with LRU eviction
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, position);
    
    return position;
  }
  
  /**
   * Get available moves from position (computed, not stored)
   */
  getAvailableMoves(
    arena: UniversalArena,
    position: LegalPosition
  ): ArenaMove[] {
    // Compute valid next moves based on:
    // 1. Unused addresses in arena
    // 2. Current player
    // 3. Enabling relation (must be justified)
    // 4. Visibility constraint
    
    const usedAddresses = new Set(position.sequence.map(m => m.address));
    const currentPlayer = position.currentPlayer;
    
    return arena.moves.filter(move => {
      if (usedAddresses.has(move.address)) return false;
      if (move.player !== currentPlayer) return false;
      if (!move.isInitial && !this.hasJustifierInView(move, position)) return false;
      return true;
    });
  }
}
```

### 8.3 Simple AI Strategy

Use greedy heuristics instead of expensive minimax:

```typescript
/**
 * Simple greedy AI for game play
 * Prioritizes moves that maximize immediate advantage
 */
export function computeGreedyMove(
  position: LegalPosition,
  arena: UniversalArena,
  player: "P" | "O"
): ArenaMove | null {
  const availableMoves = getAvailableMoves(position, arena);
  
  if (availableMoves.length === 0) return null;
  
  // Score each move with simple heuristics
  const scoredMoves = availableMoves.map(move => ({
    move,
    score: scoreMove(move, position, arena, player),
  }));
  
  // Sort by score descending
  scoredMoves.sort((a, b) => b.score - a.score);
  
  return scoredMoves[0].move;
}

/**
 * Simple scoring heuristics
 */
function scoreMove(
  move: ArenaMove,
  position: LegalPosition,
  arena: UniversalArena,
  player: "P" | "O"
): number {
  let score = 0;
  
  // Prefer moves that open more sub-addresses (more options)
  score += move.ramification.length * 10;
  
  // Prefer moves closer to root (more central)
  score += (10 - move.address.length) * 5;
  
  // Prefer moves that limit opponent's options
  const nextPosition = applyMove(position, move, arena);
  if (nextPosition) {
    const opponentMoves = getAvailableMoves(nextPosition, arena);
    score += (10 - opponentMoves.length) * 3;
  }
  
  // Bonus for terminal moves (winning)
  if (nextPosition?.isTerminal) {
    score += 1000;
  }
  
  return score;
}
```

---

## 9. References

- Faggian, C., & Hyland, M. (2002). Designs, Disputes and Strategies. CSL 2002
- Definition 3.1 - Universal Arena
- Definition 3.5 - Views
- Definition 3.7 - Legal Positions
- Definition 6.2 - Behaviours and Games
- Proposition 3.6 - Chronicle Extraction
- Proposition 3.8 - Disputes as Plays
