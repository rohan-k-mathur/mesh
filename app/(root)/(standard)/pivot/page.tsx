"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const dictionary = new Set([
  "SOT",
  "MUG",
  "PIP",
  "HAG",
  "LOP",
  "MAG",
  "PEP",
  "HOG",
  "SOP",
  "PIN",
  "TAP",
  "NOG",
  "SUN",
  "MAP",
  "OIL",
  "PEG",
  "TAR",
  "HOP",
  "NET",
  "LOG",
  "MAN",
  "TAG",
  "LOT",
]);

function rotate(arr: string[], dir: number) {
  const copy = [...arr];
  if (dir === 1) {
    copy.unshift(copy.pop() as string);
  } else {
    copy.push(copy.shift() as string);
  }
  return copy;
}

export default function PivotPage() {
  const [r1, setR1] = useState<string[]>([
    "L",
    "S",
    "M",
    "O",
    "P",
    "T",
    "H",
    "N",
  ]);
  const [r2, setR2] = useState<string[]>([
    "E",
    "O",
    "U",
    "A",
    "I",
    "E",
    "A",
    "O",
  ]);
  const [r3, setR3] = useState<string[]>([
    "P",
    "T",
    "G",
    "N",
    "P",
    "L",
    "G",
    "R",
  ]);
  const [spins, setSpins] = useState(0);

  const spokes = r1.map((_, i) => r1[i] + r2[i] + r3[i]);
  const valid = spokes.map((w) => dictionary.has(w));
  const solved = valid.every(Boolean);

  return (
    <main className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Pivot</h1>
      <p>Spins: {spins}</p>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Button onClick={() => { setR1(rotate(r1, -1)); setSpins(spins + 1); }}>
            R1 ↺
          </Button>
          <div className="font-mono text-lg">{r1.join(" ")}</div>
          <Button onClick={() => { setR1(rotate(r1, 1)); setSpins(spins + 1); }}>
            R1 ↻
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => { setR2(rotate(r2, -1)); setSpins(spins + 1); }}>
            R2 ↺
          </Button>
          <div className="font-mono text-lg">{r2.join(" ")}</div>
          <Button onClick={() => { setR2(rotate(r2, 1)); setSpins(spins + 1); }}>
            R2 ↻
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => { setR3(rotate(r3, -1)); setSpins(spins + 1); }}>
            R3 ↺
          </Button>
          <div className="font-mono text-lg">{r3.join(" ")}</div>
          <Button onClick={() => { setR3(rotate(r3, 1)); setSpins(spins + 1); }}>
            R3 ↻
          </Button>
        </div>
      </div>
      <ul className="space-y-1 font-mono">
        {spokes.map((w, i) => (
          <li key={i} className={valid[i] ? "text-green-600" : "text-gray-500"}>
            {w}
          </li>
        ))}
      </ul>
      {solved && <p className="font-semibold">Victory in {spins} spins!</p>}
    </main>
  );
}
