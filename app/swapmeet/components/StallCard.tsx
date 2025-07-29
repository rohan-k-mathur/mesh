
// // export function StallCard({ stall }: { stall: any }) {
// //   return (
// //     <div className="relative flex flex-col ubz-card ubz-card-h rounded-lg overflow-hidden">
// //       <div className="relative w-full pt-[100%]">
// //                 <img
// //           src={stall.img ?? "/placeholder-stall.svg"}
       
// //           alt={stall.name}
// //           className="absolute inset-0 w-full h-full object-cover transition-transform"
// //         />
// //         {stall.live && <span className="ubz-ring ubz-pulse absolute top-1 right-1 w-3 h-3" />}
// //       </div>
// //       <div className="p-2">
// //         <p className="font-headline text-[1rem]">{stall.name}</p>
// //         {/* <span className="text-xs bg-white/60 px-1 rounded">{stall.visitors}👥</span> */}
// //       </div>
// //       <StallSheet stallId={stall.id} />
// //     </div>
// //   );
// // }


// export function StallCard({ stall }) {
//   return (
//     <div /* clickable area for sheet – simplifies tab order */
//       className="relative w-full h-full min-w-0 min-h-0 group bg-white rounded-xl likebutton 
//                  overflow-hidden hover-tilt hover:scale-105">
//       <img src={stall.img ?? "/placeholder-stall.svg"}
//            alt={stall.name}

//            className="absolute inset-0 object-contain w-full h-full object-cover rounded-xl transition-transform 
//                       " />
//       <span className="absolute inset-x-0 bottom-0 bg-white pb-1 text-xs
//                        px-3  text-center tracking-wide py-0 line-clamp-1 truncate pointer-events-none">{stall.name}</span>
//       {stall.live && (
//         <span className="ubz-ring ubz-pulse absolute top-1 right-1 w-3 h-3" />
//       )}
//       {/* sheet lives outside so it can use React portals */}
//       <StallSheet stallId={stall.id} />
//     </div>
//   );
// }

// app/swapmeet/components/StallCard.tsx
"use client"
import { useState } from "react"
import { StallSheet } from "./StallSheet"

export function StallCard({ stall }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative w-full h-full min-w-0 min-h-0 group bg-white rounded-xl likebutton 
        overflow-hidden hover-tilt hover:scale-105">
      
      <img src={("img" in stall ? (stall as any).img : undefined) ?? "/placeholder-stall.svg"}
           alt={stall.name}

           className="absolute inset-0 object-contain w-full h-full object-cover rounded-xl transition-transform 
                      " />
      <span className="absolute inset-x-0 bottom-0 bg-white pb-1 text-xs
                       px-3  text-center tracking-wide py-0 line-clamp-1 truncate pointer-events-none">{stall.name}</span>
      {stall.live && (
        <span className="ubz-ring ubz-pulse absolute top-1 right-1 w-3 h-3" />
      )}



        {stall.live && (
          <span className="ubz-ring ubz-pulse absolute top-1 right-1 w-3 h-3" />
        )}

        {/* caption strip */}
        <div className="absolute bottom-0 inset-x-0 text-center text-sm
                        bg-white/75 backdrop-blur-sm">
          {stall.name}
        </div>
      </button>

      <StallSheet open={open} onOpenChange={setOpen} stallId={stall.id} />
    </>
  )
}

