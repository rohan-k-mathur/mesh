"use client";

import useSWR from "swr";
import { Skeleton } from "@/components/ui/skeleton";
import AuctionBar from "./AuctionBar";
import CreateAuctionDialog from "./CreateAuctionDialog";

import Image from "next/image";
const fetcher = (u: string) => fetch(u).then((r) => r.json());

export function ItemsPane({
  stallId,
  isOwner = true,

}: {
  stallId: number;
  isOwner?: boolean;
}) {
  const { data, mutate } = useSWR(
    `/api/stalls/${stallId}/items`,
    (url: string) => fetch(url).then((r) => r.json())
  );

  // const { data = [{ name: "Mock item", price_cents: 10 }], isLoading } = useSWR(
  //   stallId ? `/swapmeet/api/items?stall=${stallId}` : null,
  //   fetcher,
  //   { fallbackData: [] }
  // );

  return (
    <>
      <div className="overflow-y-auto px-4 space-y-2">
        {/* {isLoading && Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-6 w-full" />
      ))} */}
        {!data ? (
          <p>Loading…</p>
        ) : data.length === 0 ? (
          <p className="text-gray-500">No items yet.</p>
        ) : (
          <ul className="flex w-full flex-wrap max-w-[70%] gap-4 ">
            {data.map((item: any) => (
              <>
                {/* <li
                  key={item.id}
                  className="rounded-xl justify-center items-center border-2 p-4 space-y-2"
                >
                  <h3 className="text-center text-[1.2rem] font-medium">
                    {item.name}
                  </h3>
                  <hr></hr>
                  <p className="text-center text-[1.1rem]">
                    ${(item.price_cents / 100).toFixed(2)} &middot; {item.stock}{" "}
                    Left&nbsp;
                  </p>{" "}
                  {item.sold && <span className="text-green-600">Sold</span>}
                  <Image
                    src={item.images[0]}
                    alt="stallimg"
                    width={200}
                    height={200}
                    className="justify-center items-center object-contain rounded"
                  />
                </li> */}
                <div
                  key={item.id ?? item.name}
                  className="flex justify-between"
                >
                  {item.auction ? (
                    <AuctionBar
                      auctionId={item.auction.id}
                      reserve={item.auction.reserve_cents}
                      endsAt={item.auction.ends_at}
                    />
                  ) : isOwner ? (<> <p>{"acution"}</p>
                    <CreateAuctionDialog stallId={stallId} itemId={item.id} /> </>
                  ) : (
                    <>
                      <li
                  key={item.id}
                  className="rounded-xl justify-center items-center border-2 p-4 space-y-2"
                >
                  {/* <img src={item.images[0]} width={50} height={50}  className="h-fit w-fit object-cover rounded" /> */}
                  <h3 className="text-center text-[1.2rem] font-medium">
                    {item.name}
                  </h3>
                  <hr></hr>
                  <p className="text-center text-[1.1rem]">
                    ${(item.price_cents / 100).toFixed(2)} &middot; {item.stock}{" "}
                    Left&nbsp;
                  </p>{" "}
                  {item.sold && <span className="text-green-600">Sold</span>}
                  <Image
                    src={item.images[0]}
                    alt="stallimg"
                    width={200}
                    height={200}
                    className="justify-center items-center object-contain rounded"
                  />
                </li>
                    </>
                  )}
                </div>
              </>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
