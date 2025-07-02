"use client";

import { replicatePost } from "@/lib/actions/thread.actions";
import { replicateRealtimePost } from "@/lib/actions/realtimepost.actions";
import { useAuth } from "@/lib/AuthContext";
import { Like } from "@prisma/client";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";


interface Props {
  postId?: bigint;
  realtimePostId?: string;
}

const ReplicateButton = ({ postId, realtimePostId }: Props) => {
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
    if (!userObjectId) {
      return;
    }
    if (realtimePostId) {
      await replicateRealtimePost({
        originalPostId: realtimePostId.toString(),
        userId: userObjectId.toString(),
        path: pathname,
      });
    } else if (postId) {
      await replicatePost({
        originalPostId: postId.toString(),
        userId: userObjectId.toString(),
        path: pathname,
      });
    } else {
      return;
    }
    router.refresh();
  }
 
  return (
    <button onClick={handleClick}>
    <Image
      src="/assets/replicate.svg"
      alt="replicate"
      width={28}
      height={28}
      className="cursor-pointer object-contain likebutton"
    />
  </button>
);
  
};


export default ReplicateButton;
