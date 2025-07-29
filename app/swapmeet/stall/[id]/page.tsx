import HeatWidget from "@/components/HeatWidget";
import PartyOverlay from "@/components/PartyOverlay";
import TrackGrid from "@/app/swapmeet/components/TrackGrid";
import { getStall } from "@/lib/actions/stall.server";

export default async function Page({ params }: { params: { id: string } }) {
  const stallId = Number(params.id);
  const stall = await getStall(stallId);
  if (!stall) return <div>Not found</div>;
  const items = stall.items as any[];
  return (
    <div className="relative p-4">
      <TrackGrid stallId={stallId} items={items} />
      <PartyOverlay partyId={`stall-${stallId}`} />
      <div className="mt-4">
        <HeatWidget stallId={stallId} />
      </div>
    </div>
  );
}
