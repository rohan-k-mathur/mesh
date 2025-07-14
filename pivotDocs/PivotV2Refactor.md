Below is a **developer‑oriented, sequential migration plan** for replacing the current `page.tsx` with a cleaner, extensible implementation that realises the Phase‑0.2 requirements in the SRS and the design improvements you listed (variable ring sizes 9‑8‑7‑6, lock mechanic, par score, soft feedback, etc.).

---

## 0 Prerequisites

| Item              | Version / Note                            |
| ----------------- | ----------------------------------------- |
| Node              | ≥ 18                                      |
| Next.js           | 14 app‑router or pages‑router (unchanged) |
| TypeScript        | Strict mode on                            |
| ESLint + Prettier | As already configured                     |

---

## 1 Add & Refactor Core Types

1. **Create** `types/pivot.ts`

   ```ts
   // RingState represents one concentric ring
   export interface RingState {
     letters: readonly string[];
     len: number;               // cache letters.length
     offset: number;            // 0 … len-1   (rotational state)
   }

   export interface ColumnState {
     pattern: [string, string, string, string];
     locked: boolean;
     heat: number;              // #words still possible
   }

   export interface GameMeta {
     puzzleId: string;
     par: number;
     spinsLimit: number;
   }

   export interface GameState {
     mode: 'classic' | 'time' | 'blindfold';
     rings: RingState[];        // always length 4
     columns: ColumnState[];    // always length 9  (max ring size)
     spins: number;
     solved: boolean;
   }
   ```

2. **Replace** all individual `useState` declarations in `page.tsx` with a single `useReducer` (`pivotReducer.ts`).

---

## 2 Move Heavy Logic into a Web Worker

### 2.1 Create `workers/pivotWorker.ts`

* Expose two RPC‑style functions:

  * `generatePuzzle(seed?: number): GeneratedPuzzle`
  * `solve(rings): { par: number; isUnique: boolean }`

The worker should import and reuse `pivotGenerator.ts`, now updated for 9‑8‑7‑6 lengths and BFS uniqueness check.

### 2.2 Integrate with the UI

* In `page.tsx`, call `await worker.generatePuzzle()` inside `useEffect` on mount (or when `"New Puzzle"` clicked).
* Dispatch `INIT_GAME` with the returned rings, par, puzzleId.

---

## 3 Rewrite `page.tsx` (now `PivotPage.tsx`) Step by Step

> **Tip:** Keep the old file until the new one compiles; then delete.

### 3.1 Skeleton

```tsx
export default function PivotPage() {
  const [state, dispatch] = usePivotReducer();

  if (!state) return <LoadingSpinner />;

  return (
    <main className="flex flex-col items-center">
      <Header meta={state.meta} />
      <Board rings={state.rings} columns={state.columns} />
      <Controls state={state} dispatch={dispatch} />
      <ColumnList columns={state.columns} />
      {state.solved && <VictoryPanel spins={state.spins} />}
    </main>
  );
}
```

*Break UI into pure presentational components; only `usePivotReducer` holds logic.*

### 3.2 Reducer outline (`pivotReducer.ts`)

```ts
import { produce } from 'immer';           // keeps code readable
import { GameState, RingState } from '@/types/pivot';

export type Action =
  | { type: 'INIT_GAME'; payload: InitPayload }
  | { type: 'ROTATE'; ringIndex: 0|1|2|3; dir: 1|-1 }
  | { type: 'GIVE_UP' }
  | { type: 'PEEK_HINT'; column: number };

export function pivotReducer(state: GameState, action: Action): GameState {
  return produce(state, draft => {
    switch (action.type) {
      case 'INIT_GAME':
        return action.payload.initialState;

      case 'ROTATE':
        handleRotate(draft, action.ringIndex, action.dir);
        return;

      case 'PEEK_HINT':
        revealLetter(draft, action.column);
        return;

      /* …more… */
    }
  });
}
```

*Implement helper `handleRotate` that:*

1. Computes new `offset` modulo `len`.
2. Updates **only affected column patterns** (use `(oldIdx + dir + len) % len`).
3. Checks each changed column against dictionary trie:

   * If pattern is a word ⇒ set `locked = true`.
   * If any lock would be broken by the rotation ⇒ abort rotation, flash UI.
4. Recalculate `heat` counts for affected columns.
5. Increment `spins`; mark `solved` if all `locked`.

### 3.3 SVG Ring component

* Accepts `len` and `offset`; compute `stepDeg = 360 / len`.
* Rotate group by `offset * stepDeg`.
* If column is locked, colour the circle green.

```tsx
function Ring({ ring, radius }: { ring: RingState; radius: number }) {
  const step = 360 / ring.len;
  const angle = ring.offset * step;
  /* render children … */
}
```

### 3.4 Controls component

* Map **one** handler per ring:

```tsx
onClick={() => dispatch({ type: 'ROTATE', ringIndex: 0, dir: 1 })}
```

* Disable button when `state.solved` or `state.spins >= state.meta.spinsLimit`.

### 3.5 Column heat‑map

*For each `ColumnState`, draw a small bar whose height ∝ `heat / maxHeat`.*

---

## 4 Update `pivotGenerator.ts`

1. **Change constants**

```ts
const RING_LENGTHS = [9, 8, 7, 6] as const;
```

2. **Pick words**

*Ensure exactly 9 words (outer ring length). If dictionary exhausts, fallback.*

3. **Return new structure**

```ts
export interface GeneratedPuzzle {
  rings: RingState[];
  par: number;
  puzzleId: string;
}
```

4. **BFS path‑length & uniqueness**

*Add `bfsShortestSolution(rings)`; reject puzzle if par ∉ \[10,25] or not unique.*

---

## 5 Dictionary Trie & Heat Counts

1. **Build once** in worker:

```ts
interface TrieNode { next: Record<string, TrieNode>; word?: boolean; }
```

2. **Pattern count**

`count(pattern)` where pattern may contain `'_'` for blank.
Cache counts in `Map<string, number>` with key = pattern string.

3. **Expose to UI**

Worker returns an array `initialHeat[9]`.

---

## 6 Visual / Asset Changes

* SVG circles radii: adjust to fit 9‑8‑7‑6 layout (e.g. 140 / 110 / 80 / 50 px).
* `rotate` animations: CSS `transition: transform 150ms` but multiply by `abs(dir)` when chain gear rotates multiple rings.

---

## 7 Testing

1. **Unit** – reducer cases: rotate, lock, invalid move.
2. **Property** – quick‑check 50 random puzzles → every valid rotation preserves dictionary integrity.
3. **Playwright** – start puzzle, auto‑solve with offsets from worker, ensure Victory appears.

---

## 8 Remove Legacy Code

* Delete old `rotateSteps`, `angleX` state, `valid`/`solved` derivations.
* Delete fixed length assumptions (`/ 45`).

---

## 9 Commit & Verify

```bash
git checkout -b feature/pivot-v2
git add .
git commit -m "feat: Pivot v2 variable rings, locks, heatmap"
pnpm test && pnpm lint
pnpm dev             # manual smoke test
```

---

### **Result**

Following these steps you will have:

* **Deterministic puzzles** with 9‑8‑7‑6 co‑prime rings.
* **Lock mechanic** preventing trivial cascade.
* **Real‑time heat hints** and par displayed.
* **Unified, reducer‑driven state**—cleaner, faster, easier to extend for gears, hints, or new modes.

Happy refactor!
