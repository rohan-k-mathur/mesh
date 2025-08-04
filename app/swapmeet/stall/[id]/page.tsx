import HeatWidget from "@/components/HeatWidget";
import PartyOverlay from "@/components/PartyOverlay";
import TrackGrid from "@/app/swapmeet/components/TrackGrid";
import { getStall } from "@/lib/actions/stall.server";
import { VideoPane } from "../../components/VideoPane";
const heatOn = true;

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
  const liveSrc = stall && "liveSrc" in stall ? (stall as any).liveSrc : undefined;

  return (
    <div className="relative p-2">
       <VideoPane
          stallId={stallId}
          live={Boolean((stall as any)?.live)}
          src={liveSrc}
          open={true}
        />
        <hr></hr>
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
