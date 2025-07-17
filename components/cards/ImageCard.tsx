"use client";

import Image from "next/image";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface ImageCardProps {
  id: bigint;
  imageurl: string;
}

function ImageCard({ id, imageurl }: ImageCardProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="flex justify-center px-24 w-fit items-center align-center h-fit">
      <div className="mx-auto relative w-full max-w-[500px]">
        {!isLoaded && (
          <Skeleton className="img-feed-frame mt-[1rem] mb-[1rem] w-full h-[300px]" />
        )}
        <Image
           className="flex img-feed-frame rounded-sm mt-[1rem] mb-[1rem]" //${!isLoaded ? //flex img-feed-frame rounded-sm mt-[1rem] mb-[1rem]" : "flex img-feed-frame rounded-sm mt-[1rem] mb-[1rem]"}`}
          src={imageurl}
          alt="image not found"
          width={0}
          height={0}
          sizes="200vw"
          layout="responsive"
          onLoad={() => setIsLoaded(true)}
        />
      </div>
    </div>
  );
}

export default ImageCard;
