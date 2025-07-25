import { notFound } from "next/navigation";
import SectionClient from "./SectionClient";

export default async function SectionPage({ params }: { params: { x?: string; y?: string } }) {
  const x = parseInt(params.x ?? "0", 10);
  const y = parseInt(params.y ?? "0", 10);

  if (Number.isNaN(x) || Number.isNaN(y)) {
    notFound();
  }

  return <SectionClient x={x} y={y} />;
}
