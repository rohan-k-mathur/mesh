"use client";

import Image from "next/image";
import { deletePost } from "@/lib/actions/thread.actions";
import { deleteRealtimePost } from "@/lib/actions/realtimepost.actions";
import { useRouter, usePathname } from "next/navigation";

interface Props {
  postId?: bigint;
  realtimePostId?: string;
}

const DeleteCardButton = ({ postId, realtimePostId }: Props) => {
  const router = useRouter();
  const pathname = usePathname();

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    if (realtimePostId) {
      await deleteRealtimePost({ id: realtimePostId, path: pathname });
    } else if (postId) {
      await deletePost({ id: postId, path: pathname });
    }
    router.refresh();
  };

  return (
    <button onClick={handleDelete}>
      <Image
        src="/assets/trash-can.svg"
        alt="trash"
        width={28}
        height={28}
        className="cursor-pointer object-contain likebutton"
      />
    </button>
  );
};
  

export default DeleteCardButton;
