"use client";

import { useState } from "react";
import Image from "next/image";
import React from "react";
import useStore from "@/lib/reactflow/store";
import { AppState } from "@/lib/reactflow/types";
import { useShallow } from "zustand/react/shallow";

interface Props {
  modalContent: React.ReactNode;
}

const EditButton = ({ modalContent }: Props) => {
  const [isHovering, setIsHovered] = useState(false);
  const store = useStore(
    useShallow((state: AppState) => ({
      openModal: state.openModal,
    }))
  );

  // Handlers to set and clear the hovering state
  const onMouseEnter = () => setIsHovered(true);
  const onMouseLeave = () => setIsHovered(false);
  return (
    <div>
      <div
        id="editButton"
        className="flex justify-center items-center bg-transparent overlay 
        bg-transparent shadow-lg select-text"
      >
        <div
          className="flex hover-area nodrag hover:bg-black hover:bg-opacity-40 hover:shadow-none z-50"
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onClick={() => store.openModal(modalContent)}
        >
          {isHovering ? (
            <div className="flex items-center">
              <Image
                src={"/assets/edit-animated.svg"}
                alt="edit"
                width={60}
                height={60}
                className="cursor-pointer object-contain"
              />
            </div>
          ) : (
            <div></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditButton;
