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

const ShareButton = ({ postId }: Props) => {
  const user = useAuth();
  const router = useRouter();
  const isUserSignedIn = !!user.user;
  const userObjectId = user?.user?.userId;


 
  return (

    <Image
                  src="/assets/send--alt.svg"
                  alt="share"
                  width={24}
                  height={24}
                  className="cursor-pointer object-contain likebutton"
                />

  );
  
};


export default ShareButton;
