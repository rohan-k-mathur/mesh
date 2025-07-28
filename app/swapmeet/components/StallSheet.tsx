// app/swapmeet/components/StallSheet.tsx
"use client";
import useSWR from "swr";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { OfferLadder } from "./OfferLadder";

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Props {
  stallId: number;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function StallSheet({ stallId, open, onOpenChange }: Props) {
  // SWR only when visible
  const { data: stall } = useSWR(

    open ? `/swapmeet/api/stall/${stallId}` : null,
    fetcher
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-full overflow-y-auto rounded-t-lg">
        <header className="flex items-center gap-2 border-b pb-2">
          {stall?.avatar && (
            <img src={stall.avatar} className="h-8 w-8 rounded-full" />
          )}
          <h2 className="font-headline text-lg">{stall?.name}</h2>
        </header>

        {/* video pane */}
        {stall?.liveSrc && (
          <video
            src={stall.liveSrc}
            className="mt-2 w-full aspect-video bg-black"
            autoPlay
            muted
            playsInline
          />
        )}

        {/* items / offer ladder  */}
        <OfferLadder stallId={stallId} />
      </SheetContent>
    </Sheet>
  );
}
