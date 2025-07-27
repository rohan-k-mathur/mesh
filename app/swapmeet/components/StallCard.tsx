"use client";
import Link from "next/link";

export function StallCard({ stall }: { stall: any }) {
  return (
    <Link href={`/swapmeet/stall/${stall.id}`} className="ubz-card ubz-card-h group rounded-lg overflow-hidden">
      <div className="relative aspect-square">
        <img src={stall.img} alt={stall.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform" />
        {stall.live && <span className="ubz-ring ubz-pulse absolute top-1 right-1 w-3 h-3"></span>}
      </div>
      <div className="p-2">
        <p className="font-headline text-sm">{stall.name}</p>
        <span className="text-xs bg-white/60 px-1 rounded">{stall.visitors}👥</span>
      </div>
    </Link>
  );
}
