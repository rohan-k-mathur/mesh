"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import Image from "next/image";

interface Props {
  lockOnClick: (lockState: boolean) => void;
  isLocked: boolean;
  isOwned: boolean;
}

const LockButton = ({ lockOnClick, isLocked, isOwned }: Props) => {
  return (
    <div className="relative -bottom-1  likebutton">
   
        {isLocked ? (
          <Image src="/assets/locked.svg" width={24} height={24} alt="locked" />
        ) : (
          <Image
            src="/assets/unlocked.svg"
            width={24}
            height={24}
            alt="unlocked"

          />
        )}
    </div>
  );
};

export default LockButton;
