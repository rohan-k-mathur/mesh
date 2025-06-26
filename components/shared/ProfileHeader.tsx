import Image from "next/image";

import FollowButton from "../buttons/FollowButton";

interface Props {
  accountId: bigint;
  name: string;
  username: string;
  imgUrl: string | null;
  bio: string | null;
  currentUserId: bigint | null;
  isFollowing: boolean;
  isFriend: boolean;
}
const ProfileHeader = ({
  accountId,
  name,
  username,
  imgUrl,
  bio,
  currentUserId,
  isFollowing,
  isFriend,
}: Props) => {
  return (
    <div className="flex w-full flex-col justify-start">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative h-20 w-20 objects-cover">
            <Image
              src={imgUrl || ""}
              alt="Profile Image"
              fill
              className="rounded-none object-cover shadow-2xl"
            />
          </div>
          <div className="flex-1">
            <h2 className="text-left text-heading3-bold text-light-1">
              {name}
            </h2>
            <p className="text-base-medium text-gray-1">@{username}</p>
            {currentUserId && currentUserId !== accountId && (
              <FollowButton
                targetUserId={accountId}
                initialIsFollowing={isFollowing}
                initialIsFriend={isFriend}
              />
            )}
          </div>
        </div>
      </div>
      <p className="mt-6 max-w-lg text-base-regular text-light-2">{bio}</p>
      <div className="mt-12 h-0.5 w-full bg-dark-3"></div>
    </div>
  );
};
export default ProfileHeader;
