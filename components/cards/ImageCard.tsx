"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseclient";
import { useAuth } from "@/lib/AuthContext";
import { fetchUser } from "@/lib/actions/user.actions";

interface ImageCardProps {
  id: bigint;
  imageurl: string;
}

function ImageCard({ id, imageurl }: ImageCardProps) {
  const { user: currentUser } = useAuth();
  

  return (

    <div className="flex justify-center px-24 w-fit items-center align-center h-fit">
       <div className="mx-auto">

        <Image
          className=" flex img-feed-frame  rounded-sm mt-[1rem] mb-[1rem] "
          src={imageurl}
          alt="image not found"
          width={0}
          height={0}
          sizes="200vw"
          layout="responsive"
        />
        </div>
</div>
  );
}

export default ImageCard;
