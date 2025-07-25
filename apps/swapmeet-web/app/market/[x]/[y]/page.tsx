import { notFound } from "next/navigation";
import { getSection } from "swapmeet-api";

export default async function SectionPage({ params }: { params: { x?: string; y?: string } }) {
  const x = parseInt(params.x ?? "0", 10);
  const y = parseInt(params.y ?? "0", 10);

  if (Number.isNaN(x) || Number.isNaN(y)) {
    notFound();
  }

  const { stalls } = await getSection(x, y);

  return (
    <div>
      <h1>{`Section (${x}, ${y})`}</h1>
      <ul>
        {stalls.map((s) => (
          <li key={s.id}>{s.name}</li>
        ))}
      </ul>
    </div>
  );
}
