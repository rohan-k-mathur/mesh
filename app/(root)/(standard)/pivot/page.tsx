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
      className="transition-transform "
    >
      {letters.map((l, i) => {
        const a = (i * step * Math.PI) / 180;
        const x = radius * Math.sin(a);
        const y = -radius * Math.cos(a);
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={12} fill="#E2E8F0" stroke="blue" strokeWidth={.5} />
            <text
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className=" text-[.9rem] text-gray-800"
            >
              {l}
            </text>
          </g>
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
    <main className=" flex flex-col items-center">
      <h1 className="text-[2rem] mt-[-2rem] font-bold">Pivot</h1>
      <p>Spins: {spins}</p>
      <svg
        width={370}
        height={370}
        viewBox="-130 -130 260 260"
        className="mx-auto"
      >
        <circle r={100} className="fill-none stroke-slate-200" />
        <circle r={70} className="fill-none stroke-slate-200" />
        <circle r={40} className="fill-none stroke-slate-200" />
        <Ring letters={r1} radius={100} angle={angle1} />
        <Ring letters={r2} radius={70} angle={angle2} />
        <Ring letters={r3} radius={40} angle={angle3} />
      </svg>
      <div className=" mt-[-0rem] space-y-2">
      <div className="flex gap-6 ">
        <div className="flex flex-col items-center gap-3">
          <Button
          variant={"outline"}
          className="likebutton bg-white bg-opacity-50 border-none outline-blue"
            onClick={() => {
              setR1(rotate(r1, -1));
              setAngle1(angle1 - 45);
              setSpins(spins + 1);
            }}
          >
            Outer ↺
          </Button>
          <Button
              variant={"outline"}
              className="likebutton bg-white bg-opacity-50 border-none outline-blue"
            onClick={() => {
              setR1(rotate(r1, 1));
              setAngle1(angle1 + 45);
              setSpins(spins + 1);
            }}
          >
            Outer ↻
          </Button>
        </div>
        <div className="flex flex-col items-center  gap-3">
          <Button
              variant={"outline"}
              className="likebutton bg-white bg-opacity-50 border-none outline-blue"
            onClick={() => {
              setR2(rotate(r2, -1));
              setAngle2(angle2 - 45);
              setSpins(spins + 1);
            }}
          >
            Middle ↺
          </Button>
          <Button
              variant={"outline"}
              className="likebutton bg-white bg-opacity-50 border-none outline-blue"
            onClick={() => {
              setR2(rotate(r2, 1));
              setAngle2(angle2 + 45);
              setSpins(spins + 1);
            }}
          >
            Middle ↻
          </Button>
        </div>
        <div className="flex flex-col items-center gap-3">
          <Button
              variant={"outline"}
              className="likebutton bg-white bg-opacity-50 border-none outline-blue"
            onClick={() => {
              setR3(rotate(r3, -1));
              setAngle3(angle3 - 45);
              setSpins(spins + 1);
            }}
          >
            Inner ↺
          </Button>
          <Button
              variant={"outline"}
              className="likebutton bg-white bg-opacity-50 border-none outline-blue"
            onClick={() => {
              setR3(rotate(r3, 1));
              setAngle3(angle3 + 45);
              setSpins(spins + 1);
            }}
          >
            Inner ↻
          </Button>
        </div>
        </div>
      </div>
      <ul className="py-8 grid grid-cols-4 grid-rows-2 gap-x-4 gap-y-2 mt-2 font-mono text-[1rem]">
        {spokes.map((w, i) => (
          <li key={i} className={valid[i] ? "text-green-800 text-[1.2rem]" : "text-gray-700 text-[1.2rem]"}>
            {w}
          </li>
        ))}
      </ul>
      {solved && <p className="font-semibold">Victory in {spins} spins!</p>}
    </main>
  );
}
