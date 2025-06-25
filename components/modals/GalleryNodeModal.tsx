import {
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GalleryPostValidation } from "@/lib/validations/thread";
import { z } from "zod";
import GalleryNodeForm from "../forms/GalleryNodeForm";
import Image from "next/image";

interface Props {
  id?: string;
  isOwned: boolean;
  onSubmit?: (values: z.infer<typeof GalleryPostValidation>) => void;
  currentImages: string[];
}

const renderCreate = ({ onSubmit }: { onSubmit?: (values: z.infer<typeof GalleryPostValidation>) => void }) => (
  <div>
    <DialogHeader className="dialog-header text-white text-lg py-4 mt-[-4rem]">
      <b>Create Gallery</b>
    </DialogHeader>
    <hr />
    <GalleryNodeForm onSubmit={onSubmit!} currentImages={[]} />
  </div>
);

const renderEdit = ({ onSubmit, currentImages }: { onSubmit?: (values: z.infer<typeof GalleryPostValidation>) => void; currentImages: string[] }) => (
  <div>
    <DialogHeader className="dialog-header text-white text-lg py-4 mt-[-4rem]">
      <b>Edit Gallery</b>
    </DialogHeader>
    <hr />
    <GalleryNodeForm onSubmit={onSubmit!} currentImages={currentImages} />
  </div>
);

const renderView = (images: string[]) => (
  <div>
    <DialogHeader className="dialog-header text-white text-lg py-4">
      <b>View Gallery</b>
    </DialogHeader>
    <hr />
    <div className="py-4 grid mt-4 grid-cols-3 gap-2">
      {images.map((url, idx) => (
        <Image key={idx} src={url} alt={`img-${idx}`} width={100} height={100} className="object-cover" />
      ))}
    </div>
    <hr />
    <div className="py-4">
      <DialogClose id="animateButton" className={`form-submit-button pl-2 py-2 pr-[1rem]`}>
        <> Close </>
      </DialogClose>
    </div>
  </div>
);

const GalleryNodeModal = ({ id, isOwned, onSubmit, currentImages }: Props) => {
  const isCreate = !id && isOwned;
  const isEdit = id && isOwned;
  const isView = id && !isOwned;
  return (
    <div>
      <DialogContent className="max-w-[57rem]">
        <DialogTitle>GalleryNodeModal</DialogTitle>
        <div className="grid rounded-md px-4 py-2">
          {isCreate && renderCreate({ onSubmit })}
          {isEdit && renderEdit({ onSubmit, currentImages })}
          {isView && renderView(currentImages)}
        </div>
      </DialogContent>
    </div>
  );
};

export default GalleryNodeModal;
