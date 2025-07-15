import CardStack, { DiscoveryCardData } from "@/components/Discovery/CardStack";

const items: DiscoveryCardData[] = [
  { id: "1", content: <div className="p-6 bg-white rounded">First</div> },
  { id: "2", content: <div className="p-6 bg-white rounded">Second</div> },
  { id: "3", content: <div className="p-6 bg-white rounded">Third</div> },
];

export default function Page() {
  return (
    <section className="w-full h-full flex justify-center p-4">
      <CardStack items={items} onExhausted={() => {}} />
    </section>
  );
}
