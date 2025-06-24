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
  likeCount: number;
  initialLikeState: Like | null;
}

const LikeButton = ({ postId, likeCount, initialLikeState }: Props) => {
  const user = useAuth();
  const router = useRouter();
  const isUserSignedIn = !!user.user;
  const userObjectId = user?.user?.userId;
  const [currentLikeType, setCurrentLikeType] = useState(
    initialLikeState?.type || "NONE"
  );
  const [displayLikeCount, setDisplayLikeCount] = useState(likeCount);

  function likeButtonClicked() {
    if (!isUserSignedIn) {
      router.push("/login");
      return;
    }
    if (!userObjectId) {
      router.push("/onboarding");
      return;
    }
    if (currentLikeType === "LIKE") {
      if (postId) {
        unlikePost({ userId: userObjectId, postId });
      }
      setCurrentLikeType("NONE");
      setDisplayLikeCount(displayLikeCount - 1);
    } else {
      if (postId) {
        likePost({ userId: userObjectId, postId });
      }
      if (currentLikeType === "NONE") {
        setDisplayLikeCount(displayLikeCount + 1);
      } else if (currentLikeType === "DISLIKE") {
        setDisplayLikeCount(displayLikeCount + 2);
      }
      setCurrentLikeType("LIKE");
    }
  }

  function dislikeButtonClicked() {
    if (!isUserSignedIn) {
      router.push("/login");
      return;
    }
    if (!userObjectId) {
      router.push("/onboarding");
      return;
    }
    if (currentLikeType === "DISLIKE") {
      if (postId) {
        unlikePost({ userId: userObjectId, postId });
      }
      setCurrentLikeType("NONE");
      setDisplayLikeCount(displayLikeCount + 1);
    } else {
      if (postId) {
        dislikePost({ userId: userObjectId, postId });
      }
      if (currentLikeType === "NONE") {
        setDisplayLikeCount(displayLikeCount - 1);
      } else if (currentLikeType === "LIKE") {
        setDisplayLikeCount(displayLikeCount - 2);
      }
      setCurrentLikeType("DISLIKE");
    }
  }
  return (
    <div className="flex flex-row items-center gap-2">
        <Image
        onClick={likeButtonClicked}
        src={
          currentLikeType === "LIKE"
            ? "/assets/triangle-up-filled.svg"
            : "/assets/triangle-up-stroke.svg"
        }
        alt="smile"
        width={28}
        height={28}
        className="cursor-pointer object-contain"
      />
  
      {/* Give this paragraph a fixed width (e.g. 24px or w-6) and text-center. */}
      <p className="w-2 text-center text-subtle-medium text-black">
        {displayLikeCount}
      </p>
  
    
      <Image
        onClick={dislikeButtonClicked}
        src={
          currentLikeType === "DISLIKE"
            ? "/assets/triangle-down-filled.svg"
            : "/assets/triangle-down-stroke.svg"
        }
        alt="frown"
        width={28}
        height={28}
        className="cursor-pointer object-contain"
      />
    </div>
  );
  
};

export default LikeButton;
