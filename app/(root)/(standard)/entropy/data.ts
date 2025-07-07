export interface Puzzle {
  secret: string;
}

export const puzzles: Puzzle[] = [
  { secret: "CARNAL" },
];

export const dictionary = new Set([
  "CARNAL",
  "CASTLE",
  "PRIMES",
  "ORANGE",
  "PUZZLE",
  "FIDDLE",
]);
