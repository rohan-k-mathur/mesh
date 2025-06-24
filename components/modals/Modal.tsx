"use client";

import React from "react";
import { Dialog } from "../ui/dialog";
import useStore from "../../lib/reactflow/store";
import { useShallow } from "zustand/react/shallow";
import { AppState } from "@/lib/reactflow/types";

const Modal = () => {
  const { isModalOpen, modalContent, closeModal } = useStore(
    useShallow((state: AppState) => ({
      isModalOpen: state.isModalOpen,
      modalContent: state.modalContent,
      closeModal: state.closeModal,
    }))
  );

  return (
    <div className="absolute">
      <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <div>{modalContent}</div>
      </Dialog>
    </div>
  );
};

export default Modal;
