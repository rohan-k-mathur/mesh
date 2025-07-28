import SkeletonSquare from "@/components/SkeletonSquare";
import { ThumbPad } from "@/app/swapmeet/components/ThumbPad";

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
      <ThumbPad x={0} y={0} />
    </main>
  );
}
