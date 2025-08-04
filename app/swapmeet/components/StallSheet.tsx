// app/swapmeet/components/StallSheet.tsx
import useSWR from "swr";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { VideoPane } from "./VideoPane";
import { ItemsPane } from "./ItemsPane";
import { ChatPane } from "./ChatPane";
import { ImageCarousel } from "./ImageCarousel";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { LivePanel } from "./dashboard/LivePanel";
import { ReviewPane } from "./ReviewPane";
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
  const { user } = useAuth();
  const liveSrc = stall && "liveSrc" in stall ? (stall as any).liveSrc : undefined;
  const isOwner =
    !!user && !!stall && "owner" in stall && Number((stall as any).owner?.id) === Number(user.userId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
     
      <SheetContent
        side="bottom"
        className="flex flex-col flex-1 h-[90dvh] max-h-[91dvh]   p-0 overflow-auto bg-slate-200 rounded-t-lg"
        motion={{
          initial: { y: "100%" },
          animate: { y: 0, transition: { type: "spring", stiffness: 260, damping: 24 } },
          exit: { y: "100%", transition: { duration: 0.25 } },
        }}
      >
        <div className="mx-auto my-2 h-1.5 w-12 rounded-full bg-gray-300 "></div>
        {stall && "images" in stall && (
          <ImageCarousel images={(stall as any).images} />
        )}
        <button className="fixed right-8 mt-4 likebutton bg-white bg-opacity-50 w-fit mx-8 text-[1.1rem] text-center tracking-wide rounded-xl">
          <Link
            href={`/swapmeet/stall/${stallId}`}
            onClick={() => onOpenChange(false)}
            className=" py-1 px-2 inline-block text-sm text-[var(--ubz-brand)] "
          >
            Enter Stall
          </Link>
        </button>
        <VideoPane
          stallId={stallId}
          live={Boolean((stall as any)?.live)}
          src={liveSrc}
          open={open}
        />
        <ItemsPane stallId={stallId} isOwner={Boolean(isOwner)} />
        <hr className="border-black h-2"></hr>
        <div className="flex justify-end items-end flex-col px-2 mb-2 gap-4">
        {/* <LivePanel stallId={stallId} /> */}

        <ChatPane stallId={stallId} />
        <ReviewPane stallId={stallId} />

        </div>
      </SheetContent>
    </Sheet>
  );
}
