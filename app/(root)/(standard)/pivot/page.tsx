"use client";

import { useEffect, useState } from 'react';
import generatePuzzle, { RING_LENGTHS } from "./pivotGenerator";
import { Button } from "@/components/ui/button";

// Dictionary of solution words is set when a puzzle loads

function rotateSteps(arr: string[], steps: number) {
  const len = arr.length;
  if (!len) return [];
  const k = ((steps % len) + len) % len; // normalize steps
  return [...arr.slice(k), ...arr.slice(0, k)];
}

function Ring({
  letters,
  radius,
  offset,
  speed,
}: {
  letters: string[];
  radius: number;
  offset: number;
  speed: number;
}) {
  const step = 360 / letters.length;
  const angle = offset * step;
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

  const [r1, setR1] = useState<string[]>(Array(RING_LENGTHS[0]).fill("?"));
  const [r2, setR2] = useState<string[]>(Array(RING_LENGTHS[1]).fill("?"));
  const [r3, setR3] = useState<string[]>(Array(RING_LENGTHS[2]).fill("?"));
  const [r4, setR4] = useState<string[]>(Array(RING_LENGTHS[3]).fill("?"));
  const [dictionary, setDictionary] = useState<Set<string>>(new Set());


  // const [r1, setR1] = useState<string[]>([
  //   "L",
  //   "S",
  //   "M",
  //   "O",
  //   "P",
  //   "T",
  //   "H",
  //   "N",
  // ]);
  // const [r2, setR2] = useState<string[]>([
  //   "I",
  //   "A",
  //   "L",
  //   "R",
  //   "O",
  //   "E",
  //   "A",
  //   "O",
  // ]);
  // const [r3, setR3] = useState<string[]>([
  //   "A",
  //   "N",
  //   "K",
  //   "O",
  //   "E",
  //   "R",
  //   "S",
  //   "M",    
  // ]);
  // const [r4, setR4] = useState<string[]>(["S","T","E","N","T","P","R","T"]);

    // ► (optional) offsets if you want a “Give up / show solution” button
 


  const [offset1, setOffset1] = useState(0);
  const [offset2, setOffset2] = useState(0);
  const [offset3, setOffset3] = useState(0);
  const [offset4, setOffset4] = useState(0);
  const [spins, setSpins] = useState(0);
  const MIN_SPINS = 6;
  const SPIN_LIMIT = MIN_SPINS * 4;
  const [speed, setSpeed] = useState(800);


  const r1Rot = rotateSteps(r1, offset1);
  const r2Rot = rotateSteps(r2, offset2);
  const r3Rot = rotateSteps(r3, offset3);
  const r4Rot = rotateSteps(r4, offset4);

  const spokes = r1Rot.map((_, i) =>
    r1Rot[i] +
    r2Rot[i % r2Rot.length] +
    r3Rot[i % r3Rot.length] +
    r4Rot[i % r4Rot.length]
  );
  const valid = spokes.map((w) => dictionary.has(w));
  const solved = valid.every(Boolean);

  const [solutionOffsets, setSolutionOffsets] =
  useState<[0, number, number, number]>([0, 0, 0, 0]);

  const newPuzzle = async () => {
    const { rings: [R1, R2, R3, R4], solutionOffsets, words } =
      await generatePuzzle();
    setR1(R1); setR2(R2); setR3(R3); setR4(R4);
    setSolutionOffsets(solutionOffsets);
    setDictionary(new Set(words));
    // reset offsets and spin count
    setOffset1(0); setOffset2(0); setOffset3(0); setOffset4(0);
    setSpins(0);
  };

  useEffect(() => { newPuzzle(); }, []);    // one puzzle per page load

  return (
    <main className=" flex flex-col items-center">
      <h1 className="text-[2rem] mt-[-3rem] text-black font-bold">Pivot</h1>
    
      <p>Spins: {spins}/{SPIN_LIMIT}</p>
      {spins >= SPIN_LIMIT && !solved && (
        <p className="text-red-700">Spin limit reached</p>
      )}
      <p className="fixed p-2 border-white border-2 rounded-lg justify-center -left-[-16rem] bottom-[18rem] flex text-wrap max-w-[12rem] text-[1.0rem]">Rotate the outer, middle, inner, and core rings one step at a time with the ↺ / ↻ buttons. <br></br><br></br>
        When every vertical stack of letters—read outer → middle → inner → core—forms a real 4-letter word, you win. <br></br> <br></br>
        Try to finish with as few spins as possible.</p>
      <div className="flex items-center gap-2">
      
      </div>
      <Button className="absolute flex z-1000 -right-[-70%] top-8 justify-center items-center" onClick={newPuzzle}>
        New Puzzle
      </Button>
      <svg width={430} height={430} viewBox="-160 -160 320 320" className="mx-auto">

        <circle r={140} className="fill-none stroke-slate-200 stroke-2" />
        <circle r={110} className="fill-none stroke-slate-200 stroke-2" />
        <circle r={80} className="fill-none stroke-slate-200 stroke-2" />
        <circle r={50} className="fill-none stroke-slate-200 stroke-2" />
        <Ring letters={r1} radius={140} offset={offset1} speed={speed} />
        <Ring letters={r2} radius={110} offset={offset2} speed={speed} />
        <Ring letters={r3} radius={80} offset={offset3} speed={speed} />
        <Ring letters={r4} radius={50} offset={offset4} speed={speed} />
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
              setOffset1((offset1 + 1) % RING_LENGTHS[0]);
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
              setOffset1((offset1 - 1 + RING_LENGTHS[0]) % RING_LENGTHS[0]);
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
              setOffset2((offset2 + 1) % RING_LENGTHS[1]);
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
              setOffset2((offset2 - 1 + RING_LENGTHS[1]) % RING_LENGTHS[1]);
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
              setOffset3((offset3 + 1) % RING_LENGTHS[2]);
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
              setOffset3((offset3 - 1 + RING_LENGTHS[2]) % RING_LENGTHS[2]);
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
              setOffset4((offset4 + 1) % RING_LENGTHS[3]);
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
              setOffset4((offset4 - 1 + RING_LENGTHS[3]) % RING_LENGTHS[3]);
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
