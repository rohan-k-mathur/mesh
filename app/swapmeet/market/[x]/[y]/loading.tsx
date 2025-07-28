import SkeletonSquare from "@/components/SkeletonSquare";
import { ThumbPad } from "@/app/swapmeet/components/ThumbPad";
import SpinnerBlue from "@/components/ui/spinner-blue";

export default function Loading() {
  return (
    <main className="relative h-dvh  items-center bg-transparent justify-center mt-[-2rem]">
  

  <div className="flex items-center justify-center h-full ">
        <div
          className="grid grid-cols-3 grid-rows-3 gap-[7%] animate-pulse bg-transparent
                     w-[min(90vmin,640px)] h-[min(90vmin,640px)]"
        >
          {Array.from({ length: 9 }).map((_, i) => (
            <SkeletonSquare key={i} />
          ))}
        </div>
      </div>
      <SpinnerBlue    className=" fixed bottom-[35%] right-16 border-2 border-slate-300/70
                 w-28 h-28 bg-white/20 rounded-full backdrop-blur
                 flex items-center justify-center text-gray-700" />
    </main>
  );
}
