"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { puzzles } from "./data";
import { dictionaryArray, dictionary } from "./data";


const MAX_TURNS = 8;
const todayId = new Date().toISOString().slice(0, 10); // "2025-07-07"

interface Stats {
  plays: number;
  wins: number;
  streak: number;
}

function pickRandomSecret(): string {
    const idx = Math.floor(Math.random() * dictionaryArray.length);
    return dictionaryArray[idx];
  }

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
  st==="G" ? Gre.size : st==="Y" ? Yel.size : 0
  );
}

export default function Page() {
//   const { puzzle, index } = getTodayPuzzle();
//   const [guesses, setGuesses] = useState<{ word: string; digits: number[] }[]>([]);
const [secret] = useState<string>(pickRandomSecret);   // ← initialised once
const [guesses, setGuesses] = useState<
  { word: string; digits: number[] }[]
>([]);
  const [current, setCurrent] = useState("");
  // start with placeholder that matches server HTML
  const [stats, setStats] = useState<Stats>({
    plays: 0,
    wins: 0,
    streak: 0,
  });


  // read persisted stats only after the component has mounted
  useEffect(() => {
    const raw = localStorage.getItem("entropy-stats");
    if (raw) setStats(JSON.parse(raw));
  }, []);

  const addGuess = () => {
    if (current.length !== 6) return;
    if (!dictionary.has(current.trim())) return;   // <-- trim just in case
    // const digits = entropyDigits(puzzle.secret, current);
    const digits = entropyDigits(secret, current);
    setGuesses([...guesses, { word: current, digits }]);
    setCurrent("");
  };

//   const solved = guesses.some((g) => g.word === puzzle.secret);
const solved = guesses.some(g => g.word === secret);
  const turnsUsed = guesses.length;

  const shareResult = () => {
    const digitsStr = guesses.map((g) => g.digits.join(" ")).join(" / ");
    // const text = `Entropy #${index + 1} ${turnsUsed}/${MAX_TURNS} ${digitsStr}`;
    const text = `Entropy ${turnsUsed}/${MAX_TURNS} ${digitsStr}`;
    navigator.clipboard.writeText(text).catch(() => {});
  };

  useEffect(() => {
    if (!solved) return;
    setStats((prev) => {
      const updated = { plays: prev.plays + 1, wins: prev.wins + 1, streak: prev.streak + 1 };
      localStorage.setItem("entropy-stats", JSON.stringify(updated));
      return updated;
    });
  }, [solved]);

  useEffect(() => {
    if (solved || turnsUsed < MAX_TURNS) return;
    setStats((prev) => {
      const updated = { plays: prev.plays + 1, wins: prev.wins, streak: 0 };
      localStorage.setItem("entropy-stats", JSON.stringify(updated));
      return updated;
    });
  }, [solved, turnsUsed]);

  return (
    
    <main className="p-4 space-y-4">
        
      <h1 className="text-2xl font-bold">Entropy</h1>
      <p className="text-sm">Wins: {stats.wins} • Streak: {stats.streak}</p>
      <p>
      Puzzle • {todayId} • Guesses {turnsUsed}/{MAX_TURNS}
      </p>


      <ul className="space-y-2 font-mono">
        {Array.from({ length: MAX_TURNS }).map((_, i) => {
          const g = guesses[i];
          const isCurrent = i === guesses.length;
          const word = g ? g.word : isCurrent ? current.padEnd(6, " ") : "";
          const letters = word.padEnd(6, " ").split("");
          return (
            <li key={i} className="space-y-1">
              <div className="grid grid-cols-6 gap-1">
                {letters.map((ch, idx) => (
                  <div
                    key={idx}
                    className="w-8 h-8 border flex items-center justify-center"
                  >
                    {ch}
                  </div>
                ))}
              </div>
              {g && (
                <div className="grid grid-cols-6 gap-1 text-center text-sm" aria-live="polite">
                  {g.digits.map((d, idx) => (
                    <span key={idx}>{d}</span>
                  ))}
                </div>
              )}
            </li>
          );
        })}
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
        <div className="space-y-2 flex w-fit">
          <p className="font-semibold">Solved in {turnsUsed} guesses!</p>
          <Button onClick={shareResult}>Share Result</Button>
        </div>
      )}
      {!solved && turnsUsed >= MAX_TURNS && (
        // <p className="font-semibold">Secret was {puzzle.secret}</p>
        <p className="font-semibold">The word was {secret}</p>
      )}
      <div className="space-y-1">
  <label htmlFor="notes" className="text-sm font-medium">
    Scratch pad
    <span className="text-xs text-gray-500"> (auto-saves)</span>
  </label>

  {/* uncontrolled textarea that syncs to localStorage */}
  <textarea
    id="notes"
    defaultValue={typeof window !== "undefined"
      ? localStorage.getItem("entropy-notes") ?? ""
      : ""}
    onChange={e => localStorage.setItem("entropy-notes", e.target.value)}
    rows={6}
    className="w-full border rounded p-2 font-mono text-sm resize-y"
    placeholder="Type your deductions here…"
  />
</div>
    </main>
  );
}
