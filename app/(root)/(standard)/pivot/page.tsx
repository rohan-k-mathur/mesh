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

function Ring({
  letters,
  radius,
  angle,
}: {
  letters: string[];
  radius: number;
  angle: number;
}) {
  const step = 360 / letters.length;
  return (
    <g
      style={{ transformOrigin: "center", transformBox: "fill-box" }}
      className="transition-transform"
      transform={`rotate(${angle})`}
    >
      {letters.map((l, i) => {
        const a = (i * step * Math.PI) / 180;
        const x = radius * Math.sin(a);
        const y = -radius * Math.cos(a);
        return (
          <text
            key={i}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="font-mono text-lg"
          >
            {l}
          </text>
        );
      })}
    </g>
  );
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
  const [angle1, setAngle1] = useState(0);
  const [angle2, setAngle2] = useState(0);
  const [angle3, setAngle3] = useState(0);
  const [spins, setSpins] = useState(0);

  const spokes = r1.map((_, i) => r1[i] + r2[i] + r3[i]);
  const valid = spokes.map((w) => dictionary.has(w));
  const solved = valid.every(Boolean);

  return (
    <main className="p-4 space-y-4 flex flex-col items-center">
      <h1 className="text-2xl font-bold">Pivot</h1>
      <p>Spins: {spins}</p>
      <svg
        width={260}
        height={260}
        viewBox="-130 -130 260 260"
        className="mx-auto"
      >
        <circle r={100} className="fill-none stroke-gray-300" />
        <circle r={70} className="fill-none stroke-gray-300" />
        <circle r={40} className="fill-none stroke-gray-300" />
        <Ring letters={r1} radius={100} angle={angle1} />
        <Ring letters={r2} radius={70} angle={angle2} />
        <Ring letters={r3} radius={40} angle={angle3} />
      </svg>
      <div className="flex gap-4">
        <div className="flex flex-col items-center gap-1">
          <Button
            onClick={() => {
              setR1(rotate(r1, -1));
              setAngle1(angle1 - 45);
              setSpins(spins + 1);
            }}
          >
            R1 ↺
          </Button>
          <Button
            onClick={() => {
              setR1(rotate(r1, 1));
              setAngle1(angle1 + 45);
              setSpins(spins + 1);
            }}
          >
            R1 ↻
          </Button>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Button
            onClick={() => {
              setR2(rotate(r2, -1));
              setAngle2(angle2 - 45);
              setSpins(spins + 1);
            }}
          >
            R2 ↺
          </Button>
          <Button
            onClick={() => {
              setR2(rotate(r2, 1));
              setAngle2(angle2 + 45);
              setSpins(spins + 1);
            }}
          >
            R2 ↻
          </Button>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Button
            onClick={() => {
              setR3(rotate(r3, -1));
              setAngle3(angle3 - 45);
              setSpins(spins + 1);
            }}
          >
            R3 ↺
          </Button>
          <Button
            onClick={() => {
              setR3(rotate(r3, 1));
              setAngle3(angle3 + 45);
              setSpins(spins + 1);
            }}
          >
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
