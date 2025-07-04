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
          <div className="relative h-16 w-16 objects-cover">
            <Image
              src={imgUrl || "/assets/user-helsinki.svg"}
              alt="Profile Image"
              fill
              className="rounded-md object-cover shadow-2xl"
            />
          </div>
          <div className="flex-1 flex-col">
            <h2 className="text-left text-heading3-bold text-black">
              {name}
            </h2>
            <p className="text-base-light text-black">@{username}</p>
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
      <p className="mt-4 max-w-lg text-base-regular text-black">{bio}</p>
      <div className="mt-2 h-0.5 w-full bg-dark-3"></div>
    </div>
  );
};
export default ProfileHeader;
