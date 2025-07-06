import { ProductReviewValidation } from "@/lib/validations/thread";
import { z } from "zod";
import ProductReviewNodeForm from "../forms/ProductReviewNodeForm";
import {
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  id?: string;
  isOwned: boolean;
  onSubmit?: (values: z.infer<typeof ProductReviewValidation>) => void;
  currentProductName: string;
  currentRating: number;
  currentSummary: string;
}

const renderCreate = ({ onSubmit, currentProductName, currentRating, currentSummary }: Omit<Props, "id" | "isOwned">) => (
  <div>
    <DialogHeader className="dialog-header text-white text-lg py-4 mt-[-4rem]">
      <b>Create Review</b>
    </DialogHeader>
    <ProductReviewNodeForm
      onSubmit={onSubmit!}
      currentProductName={currentProductName}
      currentRating={currentRating}
      currentSummary={currentSummary}
    />
  </div>
);

const renderEdit = ({ onSubmit, currentProductName, currentRating, currentSummary }: Omit<Props, "id" | "isOwned">) => (
  <div>
    <DialogHeader className="dialog-header text-white text-lg py-4 mt-[-4rem]">
      <b>Edit Review</b>
    </DialogHeader>
    <ProductReviewNodeForm
      onSubmit={onSubmit!}
      currentProductName={currentProductName}
      currentRating={currentRating}
      currentSummary={currentSummary}
    />
  </div>
);

const ProductReviewNodeModal = ({
  id,
  isOwned,
  onSubmit,
  currentProductName,
  currentRating,
  currentSummary,
}: Props) => {
  const isCreate = !id && isOwned;
  const isEdit = id && isOwned;
  return (
    <div>
      <DialogContent className="max-w-[40rem]">
        <DialogTitle>ProductReviewNodeModal</DialogTitle>
        <div className="grid rounded-md px-4 py-2">
          {isCreate &&
            renderCreate({ onSubmit, currentProductName, currentRating, currentSummary })}
          {isEdit &&
            renderEdit({ onSubmit, currentProductName, currentRating, currentSummary })}
          {!isOwned && (
            <DialogClose id="animateButton" className={`form-submit-button pl-2 py-2 pr-[1rem]`}>
              <> Close </>
            </DialogClose>
          )}
        </div>
      </DialogContent>
    </div>
  );
};

export default ProductReviewNodeModal;
