"use client";
import { StallSheet } from "./StallSheet";

export function StallCard({ stall }: { stall: any }) {
  return (
    <div className="relative flex inline-flex flex-wrap ubz-card ubz-card-h group rounded-lg overflow-hidden ">
      <div className="relative flex aspect-square">
        <img
          src={stall.img ?? "/placeholder-stall.svg"}
          width={300}
          height={300}
          alt={stall.name}
          className="object-cover w-full h-full transition-transform"
        />
        {stall.live && <span className="ubz-ring ubz-pulse absolute top-1 right-1 w-3 h-3" />}
      </div>
      <div className="p-2">
        <p className="font-headline text-[1rem]">{stall.name}</p>
        {/* <span className="text-xs bg-white/60 px-1 rounded">{stall.visitors}👥</span> */}
      </div>
      <StallSheet stallId={stall.id} />
    </div>
  );
}
