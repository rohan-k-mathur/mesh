"use client";


import Image from "next/image";

import useStore from "@/lib/reactflow/store";
import { AppState } from "@/lib/reactflow/types";
import { useShallow } from "zustand/react/shallow";
import SharePostModal from "../modals/SharePostModal";

interface Props {
  postId?: bigint;
  realtimePostId?: string;
}

const ShareButton = ({ postId, realtimePostId }: Props) => {
  const { openModal } = useStore(
    useShallow((state: AppState) => ({
      openModal: state.openModal,
    }))
  );
  return (

  <button>
  <Image
    src="/assets/send--alt.svg"
    alt="share"
    width={28}
    height={28}
    className="cursor-pointer object-contain likebutton"
    onClick={() =>
      openModal(
        <SharePostModal postId={postId} realtimePostId={realtimePostId} />
      )
    }
  />
</button>
    );

};


export default ShareButton;
