"use client";
import useSWR from "swr";
import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { OfferLadder } from "./OfferLadder";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function StallSheet({ stallId }: { stallId: number }) {
  const [open, setOpen] = useState(false);
  const { data: stall } = useSWR(
    open ? `/swapmeet/api/stall/${stallId}` : null,
    fetcher,
  );

  return (
    <>
      <button onClick={() => setOpen(true)} className="absolute inset-0" />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="h-full rounded-t-lg overflow-y-auto"
        >
          <header className="flex items-center gap-2 pb-2 border-b">
            {stall?.avatar && (
              <img src={stall.avatar} className="w-8 h-8 rounded-full" />
            )}
            <h2 className="font-headline text-lg">{stall?.name}</h2>
          </header>
          <div className="relative mt-2">
            {stall?.liveSrc && (
              <video
                src={stall.liveSrc}
                className="w-full aspect-video bg-black"
                autoPlay
                muted
                playsInline
              />
            )}
          </div>
          <OfferLadder stallId={stallId} />
        </SheetContent>
      </Sheet>
    </>
  );
}
