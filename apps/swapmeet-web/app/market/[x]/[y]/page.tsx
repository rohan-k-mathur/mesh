import { notFound } from "next/navigation";

export default function SectionPage({ params }: { params: { x?: string; y?: string } }) {
  const x = parseInt(params.x ?? "0", 10);
  const y = parseInt(params.y ?? "0", 10);

  if (Number.isNaN(x) || Number.isNaN(y)) {
    notFound();
  }

  return <div>{`Section (${x}, ${y})`}</div>;
}
