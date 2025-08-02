"use client";

import { dislikePost, likePost, unlikePost } from "@/lib/actions/like.actions";
import { useAuth } from "@/lib/AuthContext";
import { Like } from "@prisma/client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
// interface Props {
//   postId?: bigint;
//   realtimePostId?: string;
//   commentCount?: number;
// }
interface ExpandButtonProps {
  targetId: bigint;
  commentCount: number;
}


export default function ExpandButton({ targetId, commentCount }: ExpandButtonProps) {
  const user = useAuth();
  const router = useRouter();
  const isUserSignedIn = !!user.user;
  const userObjectId = user?.user?.userId;


 
  // const href = realtimePostId ? `/post/${realtimePostId}` : `/thread/${postId}`;

  return (
    <button className="flex items-center gap-1">
      <Link       href={`/thread/${targetId}`}
   data-testid="expand"
      data-id={targetId.toString()}
>        <Image
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


// export default ExpandButton;
