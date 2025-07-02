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
  commentCount?: number;
}

const ExpandButton = ({ postId, realtimePostId, commentCount = 0 }: Props) => {
  const user = useAuth();
  const router = useRouter();
  const isUserSignedIn = !!user.user;
  const userObjectId = user?.user?.userId;


 
  const href = realtimePostId ? `/post/${realtimePostId}` : `/thread/${postId}`;

  return (
    <button className="flex items-center gap-1">
      <Link href={href}>
        <Image
          src="/assets/add-comment.svg"
          alt="reply"
          width={28}
          height={28}
          className="cursor-pointer object-contain likebutton"
        />
      </Link>
      <span className="text-subtle-medium text-black">{commentCount}</span>
    </button>
  );
  
};


export default ExpandButton;
