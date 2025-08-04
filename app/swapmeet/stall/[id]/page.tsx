import HeatWidget from "@/components/HeatWidget";
import PartyOverlay from "@/components/PartyOverlay";
import TrackGrid from "@/app/swapmeet/components/TrackGrid";
import { getStall } from "@/lib/actions/stall.server";
const heatOn = false;

export async function generateMetadata({ params }: { params: { id: string } }) {
  const stall = await getStall(Number(params.id));
  if (!stall) return {};
  const img = stall.images?.[0]?.url;
  return {
    title: stall.name,
    openGraph: {
      images: img ? [img] : [],
    },
  };
}

export default async function Page({ params }: { params: { id: string } }) {
  const stallId = Number(params.id);
  const stall = await getStall(stallId);
  
  if (!stall) return <div>Not found</div>;
  const items = stall.items as any[];
  return (
    <div className="relative p-4">
      <TrackGrid stallId={stallId} items={items} />
      <hr></hr>
      <PartyOverlay partyId={`stall-${stallId}`} />
      <hr></hr>

      {heatOn &&
      <div className="mt-8 mb-4 w-full p-4">
        <HeatWidget stallId={stallId} />
      </div>
      }
    </div>
  );
}
