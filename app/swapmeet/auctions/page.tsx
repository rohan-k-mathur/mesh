import { prisma } from '@/lib/prismaclient';
import { AuctionCard } from '../components/AuctionCard';
export const runtime = "nodejs";

export const dynamic = "force-dynamic";

export default async function Auctions() {
  const auctions = await prisma.auction.findMany({
    where: { state: "LIVE" },          // ← change
    include: { item: { select: { name: true, images: true } } },
  });

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold mb-6">Live Auctions</h1>
      <div className="flex flex-wrap gap-4">
        {auctions.map(a => <AuctionCard key={a.id} auction={a} />)}
      </div>
    </main>
  );
}
