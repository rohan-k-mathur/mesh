"use client";

import { followUser, unfollowUser, areFriends } from "@/lib/actions/follow.actions";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  targetUserId: bigint;
  initialIsFollowing: boolean;
  initialIsFriend: boolean;
}

const MessageButton = ({ targetUserId, initialIsFollowing, initialIsFriend }: Props) => {
  const { user } = useAuth();
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isFriend, setIsFriend] = useState(initialIsFriend);

  async function handleClick() {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!user.userId) {
      router.push("/onboarding");
      return;
    }
    if (isFollowing) {
      await unfollowUser({ followerId: user.userId, followingId: targetUserId });
      setIsFollowing(false);
      setIsFriend(false);
    } else {
      await followUser({ followerId: user.userId, followingId: targetUserId });
      setIsFollowing(true);
      const friend = await areFriends({ userId: user.userId, targetUserId });
      setIsFriend(friend);
    }
  }

  const label = isFriend ? "Send Message" : isFollowing ? "Send Message" : "Send Message";

  return (
    <Button variant="whiteborder" onClick={handleClick} className=" bg-transparent hover:bg-transparent">
      {label}
    </Button>
  );
};

export default MessageButton;
