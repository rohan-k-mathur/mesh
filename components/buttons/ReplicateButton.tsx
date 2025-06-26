"use client";

import { dislikePost, likePost, unlikePost } from "@/lib/actions/like.actions";
import { useAuth } from "@/lib/AuthContext";
import { Like } from "@prisma/client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  postId?: bigint;
  realtimePostId?: string;
}

const ReplicateButton = ({ postId }: Props) => {
  const user = useAuth();
  const router = useRouter();
  const isUserSignedIn = !!user.user;
  const userObjectId = user?.user?.userId;


 
  return (

    <Image
                  src="/assets/replicate.svg"
                  alt="replicate"
                  width={24}
                  height={24}
                  className="cursor-pointer object-contain likebutton"
                />

  );
  
};


export default ReplicateButton;
