import CreatePredictionPost from "../forms/CreatePredictionPost";
import { DialogContent, DialogHeader } from "@/components/ui/dialog";
import { z } from "zod";
import { PredictionPostValidation } from "@/lib/validations/thread";

interface Props {
  onSubmit: (values: z.infer<typeof PredictionPostValidation>) => void;
}

export default function PredictionMarketModal({ onSubmit }: Props) {
  return (
    <DialogContent className="p-4">
      <DialogHeader className="dialog-header text-lg mb-4">
        Create Prediction Market
      </DialogHeader>
      <CreatePredictionPost onSubmit={onSubmit} />
    </DialogContent>
  );
}
