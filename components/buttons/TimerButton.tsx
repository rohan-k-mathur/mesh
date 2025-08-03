"use client";

import Image from "next/image";
import useStore from "@/lib/reactflow/store";
import { AppState } from "@/lib/reactflow/types";
import { useShallow } from "zustand/react/shallow";
import TimerModal from "../modals/TimerModal";

interface Props {
  realtimePostId?: string;
  feedPostId?: bigint;
  isOwned: boolean;
  expirationDate?: string | null;
}

const TimerButton = ({
  realtimePostId,
  feedpostId,
  isOwned,
  expirationDate,
}: Props) => {
  const { openModal } = useStore(
    useShallow((state: AppState) => ({
      openModal: state.openModal,
    }))
  );

  return (
    <button>
    <Image
      src="/assets/time.svg"
      alt="clock"
      width={28}
                  height={28}
      className="cursor-pointer object-contain likebutton"
      onClick={() =>
        openModal(
          <TimerModal
            realtimePostId={realtimePostId}
            feedPostId={feedpostId}
            isOwned={isOwned}
            expirationDate={expirationDate}
          />
        )
      }
    />
    </button>
  );
};

export default TimerButton;
