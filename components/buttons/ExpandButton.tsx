"use client";

import { dislikePost, likePost, unlikePost } from "@/lib/actions/like.actions";
import { useAuth } from "@/lib/AuthContext";
import { Like } from "@prisma/client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
interface Props {
  postId?: bigint;
  realtimePostId?: string;
}

const ExpandButton = ({ postId }: Props) => {
  const user = useAuth();
  const router = useRouter();
  const isUserSignedIn = !!user.user;
  const userObjectId = user?.user?.userId;


 
  return (

    <Link href={`/post/${postId}`}>
                    <Image
                      src="/assets/expand-all.svg"
                      alt="reply"
                      width={28}
                      height={28}
                      className="cursor-pointer object-contain likebutton"
                    />
                  </Link>

  );
  
};


export default ExpandButton;
