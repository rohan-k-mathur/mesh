"use client";

import Image from "next/image";
import useStore from "@/lib/reactflow/store";
import { AppState } from "@/lib/reactflow/types";
import { useShallow } from "zustand/react/shallow";
import TimerModal from "../modals/TimerModal";

interface Props {
  postId: bigint;
  isOwned: boolean;
  expirationDate?: string | null;
}

interface Props {
  postId?: bigint;
  realtimePostId?: string;
}

const DeleteCardButton = ({ postId, isOwned, expirationDate }: Props) => {
    const { openModal } = useStore(
      useShallow((state: AppState) => ({
        openModal: state.openModal,
      }))
    );
  
    return (
      <button>
      <Image
        src="/assets/trash-can.svg"
        alt="trash"
        width={24}
        height={24}
        className="cursor-pointer object-contain likebutton"
        onClick={() =>
          openModal(
            <TimerModal postId={postId} isOwned={isOwned} expirationDate={expirationDate} />
          )
        }
      />
      </button>
    );
  };
  

export default DeleteCardButton;
