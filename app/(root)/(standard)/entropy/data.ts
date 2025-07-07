export interface Puzzle {
  secret: string;
}

export const puzzles: Puzzle[] = [
  { secret: "CARNAL" },
  { secret: "CASTLE" },
  { secret: "PRIMES" },
  { secret: "ORANGE" },
  { secret: "PUZZLE" },
  { secret: "FIDDLE" },
];

export const dictionary = new Set([
  "CARNAL",
  "CASTLE",
  "PRIMES",
  "ORANGE",
  "PUZZLE",
  "FIDDLE",
  "WEALTH",
  "INSECT",
  "BATTLE",
  "FOLLOW",
  "GARDEN",
  "THRIVE",
  "DEGREE",
  "POCKET",
  "LATTER",
  "SIMPLE",
  "FIGURE",
  "JUNGLE",
  "KITTEN",
]);
