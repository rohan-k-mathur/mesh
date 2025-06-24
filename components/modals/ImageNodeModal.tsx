import {
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImagePostValidation } from "@/lib/validations/thread";
import Image from "next/image";
import { z } from "zod";
import ImageNodeForm from "../forms/ImageNodeForm";

interface Props {
  id?: string;
  isOwned: boolean;
  onSubmit?: (values: z.infer<typeof ImagePostValidation>) => void;
  currentImageURL: string;
}

const renderCreate = ({
  onSubmit,
}: {
  onSubmit?: (values: z.infer<typeof ImagePostValidation>) => void;
}) => {
  return (
    <div>
      <DialogHeader className="dialog-header text-white text-lg py-4 mt-[-4rem]">
        <b> Create Post</b>
      </DialogHeader>
      <hr />
      <ImageNodeForm onSubmit={onSubmit!} currentImageURL={""} />
    </div>
  );
};

const renderEdit = ({
  onSubmit,
  currentImageURL,
}: {
  onSubmit?: (values: z.infer<typeof ImagePostValidation>) => void;
  currentImageURL: string;
}) => {
  return (
    <div>
      <DialogHeader className="dialog-header text-white text-lg py-4 mt-[-4rem]">
        <b> Edit Post</b>
      </DialogHeader>
      <hr />
      <ImageNodeForm onSubmit={onSubmit!} currentImageURL={currentImageURL} />
    </div>
  );
};

const renderView = (currentImageURL: string) => {
  return (
    <div>
      <DialogHeader className="dialog-header text-white text-lg py-4 ">
        <b> View Post</b>
      </DialogHeader>
      <hr />

      <div className="py-4 grid mt-4">
        <Image
          className="img-frame"
          src={currentImageURL}
          alt="404"
          width={0}
          height={0}
          sizes="200vw"
        />
      </div>
      <hr />
      <div className="py-4">
        <DialogClose
          id="animateButton"
          className={`form-submit-button pl-2 py-2 pr-[1rem]`}
        >
          <div className="w-2"></div>
          <> Close </>
        </DialogClose>
      </div>
    </div>
  );
};

const ImageNodeModal = ({ id, isOwned, onSubmit, currentImageURL }: Props) => {
  const isCreate = !id && isOwned;
  const isEdit = id && isOwned;
  const isView = id && !isOwned;
  return (
    <div>
      <DialogContent className="max-w-[57rem]">
        <DialogTitle>TextNodeModal</DialogTitle>
        <div className="grid rounded-md px-4 py-2">
          {isCreate && renderCreate({ onSubmit })}
          {isEdit && renderEdit({ onSubmit, currentImageURL })}
          {isView && renderView(currentImageURL)}
        </div>
      </DialogContent>
    </div>
  );
};

export default ImageNodeModal;
