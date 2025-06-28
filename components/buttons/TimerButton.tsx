"use client";

import Image from "next/image";
import useStore from "@/lib/reactflow/store";
import { AppState } from "@/lib/reactflow/types";
import { useShallow } from "zustand/react/shallow";
import TimerModal from "../modals/TimerModal";

interface Props {
  isOwned: boolean;
  expirationDate?: string | null;
}

const TimerButton = ({ isOwned, expirationDate }: Props) => {
  const { openModal } = useStore(
    useShallow((state: AppState) => ({
      openModal: state.openModal,
    }))
  );

  return (
    <Image
      src="/assets/time.svg"
      alt="clock"
      width={24}
      height={24}
      className="cursor-pointer object-contain likebutton"
      onClick={() =>
        openModal(
          <TimerModal isOwned={isOwned} expirationDate={expirationDate} />
        )
      }
    />
  );
};

export default TimerButton;
