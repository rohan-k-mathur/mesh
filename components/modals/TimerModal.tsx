"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import useStore from "@/lib/reactflow/store";
import { AppState } from "@/lib/reactflow/types";
import { useShallow } from "zustand/react/shallow";

interface Props {
  isOwned: boolean;
  expirationDate?: string | null;
}

const TimerModal = ({ isOwned, expirationDate }: Props) => {
  const { closeModal } = useStore(
    useShallow((state: AppState) => ({
      closeModal: state.closeModal,
    }))
  );
  const [duration, setDuration] = useState("none");

  const remaining = useMemo(() => {
    if (!expirationDate) return "No expiration";
    const diff = new Date(expirationDate).getTime() - Date.now();
    if (diff <= 0) return "Expired";
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${minutes}m remaining`;
  }, [expirationDate]);

  const renderOwned = () => (
    <div>
      <DialogHeader className="dialog-header text-white text-lg py-4 mt-[-4rem]">
        <b>Set Expiration</b>
      </DialogHeader>
      <hr />
      <div className="py-4 text-white flex flex-col gap-4">
        <select
          className="p-2 bg-gray-800 border border-gray-700"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        >
          <option value="none">No expiration</option>
          <option value="1h">1 Hour</option>
          <option value="1d">1 Day</option>
          <option value="1w">1 Week</option>
        </select>
      </div>
      <hr />
      <div className="py-4 flex justify-end">
        <Button
          variant="outline"
          onClick={() => closeModal()}
          className="px-4"
        >
          Save
        </Button>
      </div>
    </div>
  );

  const renderView = () => (
    <div>
      <DialogHeader className="dialog-header text-white text-lg py-4 mt-[-4rem]">
        <b>Post Expiration</b>
      </DialogHeader>
      <hr />
      <div className="py-4 text-white">{remaining}</div>
      <hr />
      <div className="py-4">
        <DialogClose id="animateButton" className="form-submit-button pl-2 py-2 pr-[1rem]">
          <>Close</>
        </DialogClose>
      </div>
    </div>
  );

  return (
    <div>
      <DialogContent className="max-w-[30rem]">
        <DialogTitle>Timer</DialogTitle>
        <div className="grid rounded-md px-4 py-2">
          {isOwned ? renderOwned() : renderView()}
        </div>
      </DialogContent>
    </div>
  );
};

export default TimerModal;
