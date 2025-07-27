import { notFound } from "next/navigation";
import { NavArrow } from "@/app/swapmeet/components/NavArrow";
import { Minimap } from "@/app/swapmeet/components/Minimap";
import { TeleportButton } from "@/app/swapmeet/components/TeleportButton";
import { StallCard } from "@/app/swapmeet/components/StallCard";
import { getSection } from "swapmeet-api";
import { NavHook } from "@/app/swapmeet/components/NavHook";

export default async function SectionPage({ params }: { params: { x?: string; y?: string } }) {
  const x = parseInt(params.x ?? "0", 10);
  const y = parseInt(params.y ?? "0", 10);

  if (Number.isNaN(x) || Number.isNaN(y)) {
    notFound();
  }
  const { stalls } = await getSection(x, y);

  return (
    <main className="relative h-dvh bg-[var(--ubz-bg)]">
      <NavHook x={x} y={y} />
      <NavArrow dir="N" x={x} y={y} />
      <NavArrow dir="E" x={x} y={y} />
      <NavArrow dir="S" x={x} y={y} />
      <NavArrow dir="W" x={x} y={y} />
      <TeleportButton />
      <Minimap cx={x} cy={y} />
      <div className="absolute inset-0 section-grid gap-[3%] p-[clamp(16px,4vw,40px)]">
        {stalls.map((s) => (
          <StallCard key={s.id} stall={s} />
        ))}
      </div>
    </main>
  );
}
