"use client";

import useSWR from "swr";
import { Skeleton } from "@/components/ui/skeleton";
import AuctionBar from "./AuctionBar";
import CreateAuctionDialog from "./CreateAuctionDialog";

const fetcher = (u: string) => fetch(u).then(r => r.json());

export function ItemsPane({ stallId, isOwner = false }: { stallId: number; isOwner?: boolean }) {
  const { data = [{ name: "Mock item", price_cents: 10 }], isLoading } = useSWR(
    stallId ? `/swapmeet/api/items?stall=${stallId}` : null,
    fetcher,
    { fallbackData: [] }
  );

  return (
    <div className="overflow-y-auto px-4 space-y-2">
      {isLoading && Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-6 w-full" />
      ))}
      {data.map((item: any) => (
        <div key={item.id ?? item.name} className="flex justify-between">
          {item.auction ? (
            <AuctionBar
              auctionId={item.auction.id}
              reserve={item.auction.reserve_cents}
              endsAt={item.auction.ends_at}
            />
          ) : isOwner ? (
            <CreateAuctionDialog stallId={stallId} itemId={item.id} />
          ) : (
            <>
              <span>{item.name}</span>
              <span>${(item.price_cents / 100).toFixed(2)}</span>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

