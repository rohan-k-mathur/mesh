"use client";
import { useCallback, useRef } from "react";
import { BuyNowButton } from "./BuyNowButton";
import Image from "next/image";
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
      className="flex flex-wrap w-fit h-fit gap-4 p-[3rem]"
      onPointerMove={(e)=>{
        const rect=(e.currentTarget as HTMLElement).getBoundingClientRect();
        const x=((e.clientX-rect.left)/rect.width)*100;
        const y=((e.clientY-rect.top)/rect.height)*100;
        sendJoin(Math.round(x),Math.round(y));
      }}
    >
      {Array.from({ length: 14 }).map((_, i) => {
     const item = items[i]; // undefined when out of bounds
     const imgSrc =
       item?.images?.[0] ?? '/assets/barcode.svg';

     return (
        <li
          key={i}
          onMouseEnter={() => enter(i)}
          className="border-[2px] rounded-xl max-w-[20rem] flex flex-col mb-4 space-y-4 bg-white/20 shadow-lg py-4 px-6 mx-auto items-center justify-center"
        >
          <div className="flex  flex-col justify-center mx-auto space-y-5  p-4 tracking-wide text-center text-[1.2rem]">
          {item ? item.name : null }
          {item &&     <hr className="mt-2"></hr>}
<div className="w-[200px] h-[200px]">
          <Image

                src={imgSrc }
                alt={items[i] ? items[i].name : 'placeholder'}
                width={200}
                height={200}
                className="justify-center h-full items-center align-center my-auto fill rounded"
              />
              </div>
              {item && <BuyNowButton itemId={item.id.toString()} />}
              </div>
          </li>
        );
      })}
    </ul>
  );
}