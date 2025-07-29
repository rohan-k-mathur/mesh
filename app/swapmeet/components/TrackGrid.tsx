"use client";
import { useCallback, useRef } from "react";

export default function TrackGrid({ stallId, items }: { stallId: number; items: any[] }) {
  const lastJoin = useRef(0);
  const sendJoin = useCallback((x:number,y:number)=>{
    const now=Date.now();
    if(now-lastJoin.current<400) return;
    lastJoin.current=now;
    fetch("/api/party/join",{method:"POST",body:JSON.stringify({partyId:`stall-${stallId}`,x,y})});
  },[stallId]);
  const enter = useCallback((idx: number) => {
    setTimeout(() => fetch("/api/track", {
      method: "POST",
      body: JSON.stringify({ stallId, cell: idx }),
    }), 500);
  }, [stallId]);

  return (
    <ul
      className="grid grid-cols-3 gap-2"
      onPointerMove={(e)=>{
        const rect=(e.currentTarget as HTMLElement).getBoundingClientRect();
        const x=((e.clientX-rect.left)/rect.width)*100;
        const y=((e.clientY-rect.top)/rect.height)*100;
        sendJoin(Math.round(x),Math.round(y));
      }}
    >
      {Array.from({ length: 9 }).map((_, i) => (
        <li
          key={i}
          onMouseEnter={() => enter(i)}
          className="border aspect-square flex items-center justify-center"
        >
          {items[i] ? items[i].name : null}
        </li>
      ))}
    </ul>
  );
}
