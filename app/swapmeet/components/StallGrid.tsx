// "use client"
// import { useState } from "react"
// import { StallSheet } from "./StallSheet"


// import { notFound } from "next/navigation";
// import { NavArrow } from "@/app/swapmeet/components/NavArrow";
// import { Minimap } from "@/app/swapmeet/components/Minimap";
// import { TeleportButton } from "@/app/swapmeet/components/TeleportButton";
// import { StallCard } from "@/app/swapmeet/components/StallCard";
// import { getSection } from "swapmeet-api";
// import { NavHook } from "@/app/swapmeet/components/NavHook";
// import { EdgeNav } from "@/app/swapmeet/components/EdgeNav";


// export function StallGrid({ stall }) {

// {/* 3×3 board */}
// <div className="flex items-center justify-center h-full">

// <div className="
//             grid grid-cols-3 grid-rows-3 gap-[3%]
//             w-[min(90vmin,640px)] h-[min(90vmin,640px)]
//             p-[clamp(16px,4vw,40px)]
//           ">        {Array.from({ length: 9 }).map((_, i) => {
//           const stall = stalls[i];        // maybe undefined
//           return  <div                // ←‑‑ SQUARE WRAPPER
//           key={stall ? stall.id : `empty-${i}`}
//           className="relative w-full h-full min-w-0 min-h-0"
//           >
//           {stall ? (
//             <StallCard  stall={stall} />
//           ) : (
//             <div className="w-[100px] h-[100px]  border-2 bg-black 
//                             border-black  rounded-lg" ><p className="w-[100px] h-[100px]  border-2 bg-black 
//                             border-black  rounded-lg">Hello</p></div> 
                            

//           )}
//         </div>;
//         })}
//       </div>
//       </div>