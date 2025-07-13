"use client";

import { PortfolioNodeValidation } from "@/lib/validations/thread";
import { z } from "zod";
import PortfolioNodeForm from "../forms/PortfolioNodeForm";
import {
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  id?: string;
  isOwned: boolean;
  onSubmit?: (values: z.infer<typeof PortfolioNodeValidation>) => void;
  currentText: string;
  currentImages: string[];
  currentLinks: string[];
  currentLayout: "grid" | "column";
  currentColor: string;
}

const renderCreate = ({
  onSubmit,
  currentText,
  currentImages,
  currentLinks,
  currentLayout,
  currentColor,
}: Omit<Props, "id" | "isOwned">) => (
  <div>
    <DialogHeader className="dialog-header text-white text-lg py-4 mt-[-4rem]">
      <b>Create Portfolio</b>
    </DialogHeader>
    <hr />
    <PortfolioNodeForm
      onSubmit={onSubmit!}
      currentText={currentText}
      currentImages={currentImages}
      currentLinks={currentLinks}
      currentLayout={currentLayout}
      currentColor={currentColor}
    />
  </div>
);

const renderEdit = ({
  onSubmit,
  currentText,
  currentImages,
  currentLinks,
  currentLayout,
  currentColor,
}: Omit<Props, "id" | "isOwned">) => (
  <div>
    <DialogHeader className="dialog-header text-white text-lg py-4 mt-[-4rem]">
      <b>Edit Portfolio</b>
    </DialogHeader>
    <hr />
    <PortfolioNodeForm
      onSubmit={onSubmit!}
      currentText={currentText}
      currentImages={currentImages}
      currentLinks={currentLinks}
      currentLayout={currentLayout}
      currentColor={currentColor}
    />
  </div>
);

const PortfolioNodeModal = ({
  id,
  isOwned,
  onSubmit,
  currentText,
  currentImages,
  currentLinks,
  currentLayout,
  currentColor,
}: Props) => {
  const isCreate = !id && isOwned;
  const isEdit = id && isOwned;
  return (
    <div>
      <DialogContent className="max-w-[57rem]">
        <DialogTitle>PortfolioNodeModal</DialogTitle>
        <div className="grid rounded-md px-4 py-2">
          {isCreate &&
            renderCreate({
              onSubmit,
              currentText,
              currentImages,
              currentLinks,
              currentLayout,
              currentColor,
            })}
          {isEdit &&
            renderEdit({
              onSubmit,
              currentText,
              currentImages,
              currentLinks,
              currentLayout,
              currentColor,
            })}
          {!isOwned && (
            <DialogClose
              id="animateButton"
              className={`form-submit-button pl-2 py-2 pr-[1rem]`}
            >
              <> Close </>
            </DialogClose>
          )}
        </div>
      </DialogContent>
    </div>
  );
};

export default PortfolioNodeModal;
