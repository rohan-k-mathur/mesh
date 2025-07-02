"use client";

import { replicatePost } from "@/lib/actions/thread.actions";
import { useAuth } from "@/lib/AuthContext";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";

interface Props {
  postId?: bigint;
  realtimePostId?: string;
}

const ReplicateButton = ({ postId }: Props) => {
  const user = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isUserSignedIn = !!user.user;
  const userObjectId = user?.user?.userId;

  async function handleClick() {
    if (!isUserSignedIn) {
      router.push("/login");
      return;
    }
    if (!userObjectId || !postId) {
      router.push("/onboarding");
      return;
    }
    await replicatePost({
      originalPostId: postId,
      userId: userObjectId,
      path: pathname,
    });
    router.refresh();
  }

  return (
    <button onClick={handleClick}>
      <Image
        src="/assets/replicate.svg"
        alt="replicate"
        width={24}
        height={24}
        className="cursor-pointer object-contain likebutton"
      />
    </button>
  );
};

export default ReplicateButton;
