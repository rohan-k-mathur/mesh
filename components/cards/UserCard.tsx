"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import FollowButton from "@/components/buttons/FollowButton";
import { areFriends, isFollowing } from "@/lib/actions/follow.actions";
import { useAuth } from "@/lib/AuthContext";

interface Props {
  userId: bigint;
  name: string;
  username: string;
  imgUrl: string | null;
  personType: string;
}

const UserCard = ({ userId, name, username, imgUrl, personType }: Props) => {
  const router = useRouter();
  const { user } = useAuth();
  const [isFollowingState, setIsFollowingState] = useState(false);
  const [isFriendState, setIsFriendState] = useState(false);

  useEffect(() => {
    async function load() {
      if (user?.userId && user.userId !== userId) {
        const follow = await isFollowing({ followerId: user.userId, followingId: userId });
        const friend = await areFriends({ userId: user.userId, targetUserId: userId });
        setIsFollowingState(follow);
        setIsFriendState(friend);
      }
    }
    load();
  }, [user, userId]);

  return (
    <div>
      <article className="user-card">
        <div className="user-card_avatar">
          <Image
            src={imgUrl || ""}
            alt="logo"
            width={48}
            height={48}
            className="rounded-full"
          />
          <div className="flex-1 text-ellipsis">
            <h4 className="text-base-semibold text-light-1">{name}</h4>
            <p className="text-small-medium text-gray-1">@{username}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            className="user-card_btn"
            onClick={() => router.push(`/profile/${userId}`)}
          >
            View
          </Button>
          {user?.userId && user.userId !== userId && (
            <FollowButton
              targetUserId={userId}
              initialIsFollowing={isFollowingState}
              initialIsFriend={isFriendState}
            />
          )}
        </div>
      </article>
    </div>
  );
};

export default UserCard;
