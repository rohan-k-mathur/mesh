"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { puzzles, dictionary } from "./data";

const MAX_TURNS = 8;

function getTodayPuzzle() {
  const index = Math.floor(Date.now() / 86400000) % puzzles.length;
  return { puzzle: puzzles[index], index };
}

function entropyDigits(secret: string, guess: string): number[] {
  const status: ("G" | "Y" | "X")[] = Array(6).fill("X");
  const secretRem = secret.split("");

  for (let i = 0; i < 6; i++) {
    if (guess[i] === secret[i]) {
      status[i] = "G";
      secretRem[i] = "_";
    }
  }

  for (let i = 0; i < 6; i++) {
    if (status[i] === "X") {
      const idx = secretRem.indexOf(guess[i]);
      if (idx !== -1) {
        status[i] = "Y";
        secretRem[idx] = "_";
      }
    }
  }

  const Gre = new Set<string>();
  const Yel = new Set<string>();
  const Gry = new Set<string>();

  status.forEach((st, i) => {
    const c = guess[i];
    if (st === "G") Gre.add(c);
    else if (st === "Y") Yel.add(c);
    else Gry.add(c);
  });

  return status.map((st) =>
    st === "G" ? Gre.size : st === "Y" ? Yel.size : Gry.size
  );
}

export default function Page() {
  const { puzzle, index } = getTodayPuzzle();
  const [guesses, setGuesses] = useState<{ word: string; digits: number[] }[]>([]);
  const [current, setCurrent] = useState("");

  const addGuess = () => {
    if (current.length !== 6) return;
    if (!dictionary.has(current)) return;
    const digits = entropyDigits(puzzle.secret, current);
    setGuesses([...guesses, { word: current, digits }]);
    setCurrent("");
  };

  const solved = guesses.some((g) => g.word === puzzle.secret);
  const turnsUsed = guesses.length;

  const shareResult = () => {
    const text = `Entropy #${index + 1} ${turnsUsed}/${MAX_TURNS}`;
    navigator.clipboard.writeText(text).catch(() => {});
  };

  return (
    <main className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Entropy</h1>
      <p>
        Puzzle #{index + 1} • Guesses {turnsUsed}/{MAX_TURNS}
      </p>
      <ul className="space-y-1 font-mono">
        {guesses.map((g, i) => (
          <li key={i}>
            {g.word.toUpperCase()} {" "}
            {g.digits.join(" ")}
          </li>
        ))}
      </ul>
      {!solved && turnsUsed < MAX_TURNS && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addGuess();
          }}
          className="space-y-2"
        >
          <Input
            value={current}
            onChange={(e) => setCurrent(e.target.value.toUpperCase())}
            className="w-48"
          />
          <Button type="submit">Submit</Button>
        </form>
      )}
      {solved && (
        <div className="space-y-2">
          <p className="font-semibold">Solved in {turnsUsed} guesses!</p>
          <Button onClick={shareResult}>Share Result</Button>
        </div>
      )}
      {!solved && turnsUsed >= MAX_TURNS && (
        <p className="font-semibold">Secret was {puzzle.secret}</p>
      )}
    </main>
  );
}
