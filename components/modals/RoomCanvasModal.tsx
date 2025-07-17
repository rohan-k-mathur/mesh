"use client";
import { z } from "zod";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import RoomCanvasForm from "../forms/RoomCanvasForm";
import { RoomCanvasPostValidation } from "@/lib/validations/thread";

interface Props {
  onSubmit?: (values: z.infer<typeof RoomCanvasPostValidation>) => void;
}

export default function RoomCanvasModal({ onSubmit }: Props) {
  return (
    <div>
      <DialogContent className="max-w-[40rem]">
      <DialogTitle hidden>ProductReviewNodeModal</DialogTitle>

        <DialogHeader className="dialog-header text-white text-lg py-4 mt-[-2rem]">
          <b>Share Room Canvas</b>
        </DialogHeader>
        <RoomCanvasForm onSubmit={onSubmit!} currentRoomId="" currentDescription="" />
      </DialogContent>
    </div>
  );
}
