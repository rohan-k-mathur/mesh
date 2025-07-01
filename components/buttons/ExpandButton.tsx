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

const ExpandButton = ({ postId, realtimePostId }: Props) => {
  const user = useAuth();
  const router = useRouter();
  const isUserSignedIn = !!user.user;
  const userObjectId = user?.user?.userId;


 
  const href = realtimePostId ? `/post/${realtimePostId}` : `/thread/${postId}`;

  return (
    <button>
    <Link href={href}>
      <Image
        src="/assets/add-comment.svg"
        alt="reply"
        width={28}
        height={28}
        className="cursor-pointer object-contain likebutton"
      />
    </Link>
    </button>
  );
  
};


export default ExpandButton;
