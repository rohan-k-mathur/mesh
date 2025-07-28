import { notFound } from "next/navigation";
import { NavArrow } from "@/app/swapmeet/components/NavArrow";
import { Minimap } from "@/app/swapmeet/components/Minimap";
import { TeleportButton } from "@/app/swapmeet/components/TeleportButton";
import { StallCard } from "@/app/swapmeet/components/StallCard";
import { getSection } from "swapmeet-api";
import { NavHook } from "@/app/swapmeet/components/NavHook";
import { EdgeNav } from "@/app/swapmeet/components/EdgeNav";

export default async function SectionPage({ params }: { params: { x?: string; y?: string } }) {
  const x = parseInt(params.x ?? "0", 10);
  const y = parseInt(params.y ?? "0", 10);

  if (Number.isNaN(x) || Number.isNaN(y)) {
    notFound();
  }
  const { stalls } = await getSection(x, y);

  const cells = Array.from({ length: 9 }, (_, i) => stalls[i] ?? null);


  return (
    <main className="relative h-dvh  items-center justify-center bg-[var(--ubz-bg)]">
    
    <NavHook x={x} y={y} />
      <EdgeNav x={x} y={y} />
      {/* <NavArrow dir="N" x={x} y={y} />
      <NavArrow dir="E" x={x} y={y} />
      <NavArrow dir="S" x={x} y={y} />
      <NavArrow dir="W" x={x} y={y} /> */}
      <TeleportButton />
            <Minimap cx={x} cy={y} />
<hr></hr>

 {/* the grid */}
<div className="flex items-center justify-center h-full">
    <div className="grid grid-cols-3 grid-rows-3 gap-[3%]
                    w-[min(90vmin,640px)] h-[min(90vmin,640px)]">
      {Array.from({ length: 9 }).map((_, i) => {
        const stall = stalls[i];
        return (
          <div key={stall ? stall.id : `empty-${i}`}
               className="w-full aspect-square relative">
            {stall
              ? <StallCard stall={stall} />
              : <div className="w-full h-full border-2
                               border-gray-400/30 rounded-lg" />}
          </div>
        );
      })}
    </div>
  </div>
{/* 3×3 board */}

      <hr></hr>
  
      {/* tooltip */}
      <hr></hr>

      <div className="kbdTip fixed bottom-2 left-1/2 -translate-x-1/2
                      text-xs text-[var(--ubz-street)] select-none">
        WASD&nbsp;/&nbsp;← ↑ ↓ →
      </div>
    </main>
  );
}
