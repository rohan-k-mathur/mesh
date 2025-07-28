// app/swapmeet/components/StallSheet.tsx
"use client";
import useSWR from "swr";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { VideoPane } from "./VideoPane";
import { ItemsPane } from "./ItemsPane";
import { ChatPane } from "./ChatPane";

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
      <SheetContent
        side="bottom"
        className="h-[90dvh] grid grid-rows-[auto_1fr_auto] gap-3 p-0 overflow-hidden rounded-t-lg"
      >
        <div className="mx-auto my-2 h-1.5 w-12 rounded-full bg-gray-300" />
        <VideoPane src={stall?.liveSrc} open={open} />
        <ItemsPane stallId={stallId} />
        <ChatPane stallId={stallId} />
      </SheetContent>
    </Sheet>
  );
}
