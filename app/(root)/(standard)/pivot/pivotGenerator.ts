// lib/pivotGenerator.ts
import { shuffle } from "fast-shuffle";
import { loadWords4 } from "./words4";

const RING_LENGTHS = [9, 8, 7, 6] as const;

export type Rings = [string[], string[], string[], string[]];

export interface Puzzle {
  rings: Rings;           // already rotated, ready for setState
  solutionOffsets: [0, number, number, number]; // where 0 means "no rotation"
  words: string[];
}

async function generatePuzzle(): Promise<Puzzle> {
  const words = await pickWords(RING_LENGTHS[0]); // pick outer ring length words
  const [r1, r2, r3, r4] = splitIntoRings(words);    // step 2
  const { rings, solutionOffsets } = scrambleRings([r1, r2, r3, r4]); // step 3

  return { rings, solutionOffsets, words };
}

/* ---------- helpers ---------- */

async function pickWords(n: number): Promise<string[]> {
  const dict = await loadWords4();

  // Draw without replacement until we have n distinct words
  // *Optionally*: reject sets where any ring would hold 2 identical letters,
  //               which prevents ambiguous alternative solutions.
  const selected = new Set<string>();
  while (selected.size < n) {
    selected.add(dict[Math.floor(Math.random() * dict.length)]);
  }
  return Array.from(selected);
}

function splitIntoRings(words: string[]): Rings {
  const r1: string[] = [];
  const r2: string[] = [];
  const r3: string[] = [];
  const r4: string[] = [];
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    r1.push(w[0]);
    if (i < RING_LENGTHS[1]) r2.push(w[1]);
    if (i < RING_LENGTHS[2]) r3.push(w[2]);
    if (i < RING_LENGTHS[3]) r4.push(w[3]);
  }
  return [r1, r2, r3, r4];
}
function scrambleRings([r1, r2, r3, r4]: Rings) {
    const rand = (len: number) => Math.floor(Math.random() * len);

    const offset2 = rand(RING_LENGTHS[1]);
    let   offset3 = rand(RING_LENGTHS[2]);
    let   offset4 = rand(RING_LENGTHS[3]);

    if (offset2 === 0 && offset3 === 0 && offset4 === 0) {
      offset3 = (offset3 + 1) % RING_LENGTHS[2];
    }

    const rings: Rings = [
      r1,
      rotate(r2, offset2),
      rotate(r3, offset3),
      rotate(r4, offset4),
    ];
  
    // 👇 Either way is fine — pick one
  
    // 1.  const assertion
    const solutionOffsets: [0, number, number, number] =
    [0, offset2, offset3, offset4];

  return { rings, solutionOffsets };  
    // 2.  explicit tuple type
    // const solutionOffsets: [0, number, number, number] = [0, offset2, offset3, offset4];
  
  }
function rotate<T>(arr: readonly T[], k: number): T[] {
  // positive k => rotate right
  return [...arr.slice(-k), ...arr.slice(0, -k)];
}

export default generatePuzzle;
export { RING_LENGTHS };