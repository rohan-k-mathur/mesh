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
}

export default function ImageCard({ id, imageurl }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [open,   setOpen]   = useState(false);

  return (
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
            sizes="200vw"
            layout="responsive"
            onLoad={() => setLoaded(true)}
            className="img-feed-frame rounded-sm mt-4 mb-4"
          />
        </button>
      </DialogTrigger>

      {/*  Re‑use your existing modal in “view” mode  */}
      <ViewImageModal
        id={String(id)}          // ← any truthy string marks “view”
        isOwned={false}          // not editable from the feed
        currentImageURL={imageurl}
      />
    </Dialog>
  );
}
