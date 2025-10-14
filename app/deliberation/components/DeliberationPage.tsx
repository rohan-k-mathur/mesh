"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ArticleReader from "@/components/article/ArticleReader";
import CommentModal from "@/components/article/CommentModal";
import type { Anchor, CommentThread } from "@/types/comments";
import Image from "next/image";
// import DeepDivePanel from "@/components/deepdive/DeepDivePanel";
import { useRouter } from "next/navigation";
import HomeButton from "@/components/buttons/HomeButton";
import { RhetoricProvider } from "@/components/rhetoric/RhetoricContext";
import { DeepDiveBackdrop } from "@/components/article/DeepDiveBackground";
import { DialogueTargetProvider } from "@/components/dialogue/DialogueTargetContext";
import DeepDivePanel from "@/components/deepdive/DeepDivePanelV2";
type Props = {

    deliberationId?: string;
  };

export default function DeliberationReader({

  deliberationId,
}: Props) {
  

       return (
             <div className="relative  ">
               {/* Parity with ArticleReaderWithPins: top-left Home button overlay */}
               {/* <div className="absolute left-8 top-0 z-[9000]">
                 <HomeButton />
               </div> */}
         
                  {deliberationId && (
     <section className="relative isolate">
       {/* <DeepDiveBackdrop className="pointer-events-none absolute inset-0 -z-10" /> */}
       <h2 className="text-4xl font-semibold tracking-wide text-center my-4">Discussion</h2>
       <div className="mx-auto mb-4 mt-5 w-[75%] border-b border-slate-700/40" />
 
       {/* Mirror the article layout’s column exactly */}
       <div className="flex flex-col justify-center items-center mx-auto px-3 gap-6">
         <RhetoricProvider>
           <DialogueTargetProvider>
             <DeepDivePanel deliberationId={deliberationId}    
             containerClassName="flex flex-col  justify-center items-center mx-auto  gap-6"
             />
             
           </DialogueTargetProvider>
         </RhetoricProvider>
       </div>
     </section>
   )}
             </div>
           );
}
