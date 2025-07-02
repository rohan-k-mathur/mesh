"use client";

import Image from "next/image";
import { deletePost } from "@/lib/actions/thread.actions";
import { deleteRealtimePost } from "@/lib/actions/realtimepost.actions";

interface Props {
  postId?: bigint;
  realtimePostId?: string;
}

const DeleteCardButton = ({ postId, realtimePostId }: Props) => {
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    if (realtimePostId) {
      await deleteRealtimePost({ id: realtimePostId });
    } else if (postId) {
      await deletePost({ id: postId });
    }
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
