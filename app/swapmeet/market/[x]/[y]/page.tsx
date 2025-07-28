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

  return (
    <main className="relative flex  flex-wrap h-dvh bg-slate-400">
      <NavHook x={x} y={y} />
      <EdgeNav x={x} y={y} />
      <NavArrow dir="N" x={x} y={y} />
      <NavArrow dir="E" x={x} y={y} />
      <NavArrow dir="S" x={x} y={y} />
      <NavArrow dir="W" x={x} y={y} />
      <TeleportButton />
      <Minimap cx={x} cy={y} />
      <div className="relative flex flex-wrap  gap-[3%] ">
        {stalls.map((s) => (
          <StallCard key={s.id} stall={s} />
        ))}
      </div>
      <div className="kbdTip fixed bottom-2 left-1/2 -translate-x-1/2 text-xs text-[var(--ubz-street)] select-none">
        ← ↑ ↓ → &nbsp; / &nbsp; WASD
      </div>
    </main>
  );
}
