// app/swapmeet/components/ImageCard.tsx
"use client";

import Image from "next/image";
import { useState } from "react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import ViewImageModal from "../modals/ViewImageModal";

interface Props {
  id: bigint;           // keeping it in case you later support “edit”
  imageurl: string;
  caption?: string;
}

export default function ImageCard({ id, imageurl, caption }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [open,   setOpen]   = useState(false);

  return (
    <div className="flex flex-col">
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/*  wrapper ensures the whole card is clickable  */}
        <button
          type="button"
          className="flex justify-center items-center w-fit px-24 focus:outline-none
                     focus-visible:ring-2 ring-offset-2 ring-indigo-400"
        >
          {/*  skeleton while the <img> is downloading  */}
          {!loaded && (
            <Skeleton className="img-feed-frame mt-4 mb-4 w-full h-[300px]" />
          )}

          <Image
            src={imageurl}
            alt="posted image"
            width={0}
            height={0}
            sizes="(max-height: 468px) 100vw, 33vw"
              layout="responsive"
            onLoad={() => setLoaded(true)}
            className="img-feed-frame rounded-sm mt-2 mb-2"
          />
        </button>
      </DialogTrigger>

      {/*  Re‑use your existing modal in “view” mode  */}
      <ViewImageModal open={open} onOpenChange={setOpen} imageUrl={imageurl} />

    </Dialog>
     <div className="mt-4 w-full justify-center items-center  w-full ">
     <hr className="w-full h-px border-t-0 bg-transparent bg-gradient-to-r from-transparent via-slate-100 to-transparent opacity-55" />
     <p className="text-center tracking-wide mb-0 pt-3">{caption}</p>
     </div>
     </div>
  );
}
