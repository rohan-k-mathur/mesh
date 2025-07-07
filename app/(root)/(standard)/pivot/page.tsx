"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

// const dictionary = new Set([
//   "SOT",
//   "MUG",
//   "PIP",
//   "HAG",
//   "LOP",
//   "MAG",
//   "PEP",
//   "HOG",
//   "SOP",
//   "PIN",
//   "TAP",
//   "NOG",
//   "SUN",
//   "MAP",
//   "OIL",
//   "PEG",
//   "TAR",
//   "HOP",
//   "NET",
//   "LOG",
//   "MAN",
//   "TAG",
//   "LOT",
// ]);

// const dictionary = new Set([
//   "LENS", "LIPS", "LAPS", "LUGS",
//   "SOPS", "SIPS", "SITS", "SINS",
//   "MOPS", "MIPS", "MENS", "MINS",
//   "OATS", "OOPS",
//   "PENS", "PINS", "PANS", "POPS",
//   "TENS", "TIPS", "TAPS", "TANS",
//   "HENS", "HOPS", "HAGS", "HUGS",
//   "NAPS", "NIPS", "NOGS",
// ]);
const dictionary = new Set([
    "LAMP", "SOAR", "MINT", "OAKS",
    "PLOT", "TREE", "HORN", "NEST",
  ]);

function rotateSteps(arr: string[], steps: number) {
  const copy = [...arr];
  const count = Math.abs(steps) % arr.length;
  for (let i = 0; i < count; i++) {
    if (steps > 0) {
      copy.push(copy.shift() as string);
    } else {
      copy.unshift(copy.pop() as string);
    }
  }
  return copy;
}

function Ring({
  letters,
  radius,
  angle,
  speed,
}: {
  letters: string[];
  radius: number;
  angle: number;
  speed: number;
}) {
  const step = 360 / letters.length;
  return (
    <g
    style={
        {
          "--angle": `${angle}deg`,
          transformOrigin: "center",
          transformBox: "fill-box",
          transform: "rotate(var(--angle))",
          transition: `transform ${speed}ms`,
        } as React.CSSProperties
      }
      className="transition-transform"
    >
      {letters.map((l, i) => {
        const a = (i * step * Math.PI) / 180;
        const x = radius*.5 * Math.sin(a);
        const y = -radius*.5 * Math.cos(a);
        return (
            <g
            key={i}
            style={{
              transform: `translate(${x}px, ${y}px) rotate(calc(-1 * var(--angle)))`,
              transformBox: "fill-box",
              transformOrigin: "center",
            }}
          >            <circle cx={x} cy={y} r={12} fill="#E2E8F0" stroke="blue" strokeWidth={.5} />
            <text
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className=" text-[.9rem] text-gray-800 "
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
    "I",
    "A",
    "L",
    "R",
    "O",
    "E",
    "A",
    "O",
  ]);
  const [r3, setR3] = useState<string[]>([
    "A",
    "N",
    "K",
    "O",
    "E",
    "R",
    "S",
    "M",    
  ]);
  const [r4, setR4] = useState<string[]>(["S","T","E","N","T","P","R","T"]);

  const [angle1, setAngle1] = useState(0);
  const [angle2, setAngle2] = useState(0);
  const [angle3, setAngle3] = useState(0);
  const [angle4, setAngle4] = useState(0);
  const [spins, setSpins] = useState(0);
  const MIN_SPINS = 6;
  const SPIN_LIMIT = MIN_SPINS * 2;
  const [speed, setSpeed] = useState(8000);

  const offset1 = -Math.round(angle1 / 45);
  const offset2 = -Math.round(angle2 / 45);
  const offset3 = -Math.round(angle3 / 45);
  const offset4 = -Math.round(angle4 / 45);

  const r1Rot = rotateSteps(r1, offset1);
  const r2Rot = rotateSteps(r2, offset2);
  const r3Rot = rotateSteps(r3, offset3);
  const r4Rot = rotateSteps(r4, offset4);

  const spokes = r1Rot.map((_, i) => r1Rot[i] + r2Rot[i] + r3Rot[i] + r4Rot[i]);
  const valid = spokes.map((w) => dictionary.has(w));
  const solved = valid.every(Boolean);

  return (
    <main className=" flex flex-col items-center">
      <h1 className="text-[2rem] mt-[-3rem] text-black font-bold">Pivot</h1>
      <p>Spins: {spins}/{SPIN_LIMIT}</p>
      {spins >= SPIN_LIMIT && !solved && (
        <p className="text-red-700">Spin limit reached</p>
      )}
      <p className="fixed p-2 border-white border-2 rounded-lg justify-center -left-[-16rem] bottom-[18rem] flex text-wrap max-w-[12rem] text-[1.0rem]">Rotate the outer, middle, inner, and core rings in 45° steps with the ↺ / ↻ buttons. <br></br><br></br>
        When every vertical stack of letters—read outer → middle → inner → core—forms a real 4-letter word, you win. <br></br> <br></br>
        Try to finish with as few spins as possible.</p>
      <div className="flex items-center gap-2">
      
      </div>
      <svg width={430} height={430} viewBox="-160 -160 320 320" className="mx-auto">

        <circle r={130} className="fill-none stroke-slate-200 stroke-2" />
        <circle r={100} className="fill-none stroke-slate-200 stroke-2" />
        <circle r={70} className="fill-none stroke-slate-200 stroke-2" />
        <circle r={40} className="fill-none stroke-slate-200 stroke-2" />
        <Ring letters={r1} radius={130} angle={angle1} speed={speed} />
        <Ring letters={r2} radius={100} angle={angle2} speed={speed} />
        <Ring letters={r3} radius={70} angle={angle3} speed={speed} />
        <Ring letters={r4} radius={40} angle={angle4} speed={speed} />
      </svg>
      <div className=" mt-[-0rem] space-y-2">
      <div className="flex gap-6 ">
        <div className="flex flex-col items-center gap-3">
        <Button
              variant={"outline"}
              className="likebutton bg-white bg-opacity-50 border-none outline-blue"
              disabled={spins >= SPIN_LIMIT || solved}
            onClick={() => {
              if (spins >= SPIN_LIMIT || solved) return;
              setAngle1(angle1 + 45);
              setSpins(spins + 1);
            }}
          >
            Crust ↻
          </Button>
          <Button
          variant={"outline"}
          className="likebutton bg-white bg-opacity-50 border-none outline-blue"
            disabled={spins >= SPIN_LIMIT || solved}
            onClick={() => {
              if (spins >= SPIN_LIMIT || solved) return;
              setAngle1(angle1 - 45);
              setSpins(spins + 1);
            }}
          >
            Crust ↺
          </Button>
      
        </div>
        <div className="flex flex-col items-center  gap-3">
        <Button
              variant={"outline"}
              className="likebutton bg-white bg-opacity-50 border-none outline-blue"
              disabled={spins >= SPIN_LIMIT || solved}
            onClick={() => {
              if (spins >= SPIN_LIMIT || solved) return;
              setAngle2(angle2 + 45);
              setSpins(spins + 1);
            }}
          >
            Outer Core ↻
          </Button>
          <Button
              variant={"outline"}
              className="likebutton bg-white bg-opacity-50 border-none outline-blue"
              disabled={spins >= SPIN_LIMIT || solved}
            onClick={() => {
              if (spins >= SPIN_LIMIT || solved) return;
              setAngle2(angle2 - 45);
              setSpins(spins + 1);
            }}
          >
            Outer Core ↺
          </Button>
     
        </div>
        <div className="flex flex-col items-center gap-3">
        <Button
              variant={"outline"}
              className="likebutton bg-white bg-opacity-50 border-none outline-blue"
              disabled={spins >= SPIN_LIMIT || solved}
            onClick={() => {
              if (spins >= SPIN_LIMIT || solved) return;
              setAngle3(angle3 + 45);
              setSpins(spins + 1);
            }}
          >
            Inner Core ↻
          </Button>
          <Button
              variant={"outline"}
              className="likebutton bg-white bg-opacity-50 border-none outline-blue"
              disabled={spins >= SPIN_LIMIT || solved}
            onClick={() => {
              if (spins >= SPIN_LIMIT || solved) return;
              setAngle3(angle3 - 45);
              setSpins(spins + 1);
            }}
          >
            Inner Core ↺
          </Button>
    
        </div>
        <div className="flex flex-col items-center gap-3">
        <Button
              variant={"outline"}
              className="likebutton bg-white bg-opacity-50 border-none outline-blue"
              disabled={spins >= SPIN_LIMIT || solved}
            onClick={() => {
              if (spins >= SPIN_LIMIT || solved) return;
              setAngle4(angle4 + 45);
              setSpins(spins + 1);
            }}
          >
            Core ↻
          </Button>
          <Button
              variant={"outline"}
              className="likebutton bg-white bg-opacity-50 border-none outline-blue"
              disabled={spins >= SPIN_LIMIT || solved}
            onClick={() => {
              if (spins >= SPIN_LIMIT || solved) return;
              setAngle4(angle4 - 45);
              setSpins(spins + 1);
            }}
          >
            Core ↺
          </Button>
   
        </div>
        </div>
      </div>
      
      <ul className="py-8 grid grid-cols-4 grid-rows-2 gap-x-4 gap-y-2 mt-2 text-[1rem]">
        
        {spokes.map((w, i) => (
            
          <li key={i} className={valid[i] ? "text-green-800 text-[1.2rem]" : "text-gray-700 text-[1.2rem]"}>
            
            {w}
          </li>
        ))}
      </ul>
      {solved && <p className="fixed p-2 border-white border-2 rounded-lg justify-center -right-[-16rem] bottom-[28rem] text-block text-[2rem] mt-[-1rem]">Victory in {spins} spins!</p>}
    </main>
  );
}
