// app/swapmeet/components/StallSheet.tsx
"use client";
import useSWR from "swr";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { VideoPane } from "./VideoPane";
import { ItemsPane } from "./ItemsPane";
import { ChatPane } from "./ChatPane";
import Link from "next/link";

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
  const liveSrc = stall && "liveSrc" in stall ? (stall as any).liveSrc : undefined;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
     
      <SheetContent
        side="bottom"
        className="h-[90dvh] grid grid-rows-[auto_auto_1fr_auto] gap-3 p-0 overflow-hidden rounded-t-lg"
        motion={{
          initial: { y: "100%" },
          animate: { y: 0, transition: { type: "spring", stiffness: 260, damping: 24 } },
          exit: { y: "100%", transition: { duration: 0.25 } },
        }}
      >
        <div className="mx-auto my-2 h-1.5 w-12 rounded-full bg-gray-300" />
        <Link
          href={`/swapmeet/stall/${stallId}`}
          onClick={() => onOpenChange(false)}
          className="-mt-1 inline-block text-sm text-[var(--ubz-brand)] underline"
        >
          View full stall →
        </Link>
        <VideoPane src={liveSrc} open={open} />
        <ItemsPane stallId={stallId} />
        <ChatPane stallId={stallId} />
      </SheetContent>
    </Sheet>
  );
}
