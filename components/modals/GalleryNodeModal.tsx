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
  isPublic: boolean;
  onSubmit?: (values: z.infer<typeof GalleryPostValidation>) => void;
  currentImages: string[];
}

const renderCreate = ({
  onSubmit,
  currentIsPublic,
}: {
  onSubmit?: (values: z.infer<typeof GalleryPostValidation>) => void;
  currentIsPublic: boolean;
}) => (
  <div >
    <DialogHeader className="dialog-header text-white text-lg py-4 mt-[-4rem]">
      <b>Create Gallery</b>
    </DialogHeader>
    <hr />
    <GalleryNodeForm
      onSubmit={onSubmit!}
      currentImages={[]}
      currentIsPublic={currentIsPublic}
      isOwned={true}
    />
  </div>
);

const renderEdit = ({
  onSubmit,
  currentImages,
  isOwned,
  currentIsPublic,
}: {
  onSubmit?: (values: z.infer<typeof GalleryPostValidation>) => void;
  currentImages: string[];
  isOwned: boolean;
  currentIsPublic: boolean;
}) => (
  <div>
    <DialogHeader className="dialog-header text-white text-lg py-4 mt-[-4rem]">
      <b>Edit Gallery</b>
    </DialogHeader>
    <hr />
    <GalleryNodeForm
      onSubmit={onSubmit!}
      currentImages={currentImages}
      currentIsPublic={currentIsPublic}
      isOwned={isOwned}
    />
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

const GalleryNodeModal = ({ id, isOwned, isPublic, onSubmit, currentImages }: Props) => {
  const isCreate = !id && isOwned;
  const isEdit = id && (isOwned || isPublic);
  const isView = id && !isOwned && !isPublic;
  return (
    <div>
      <DialogContent className="max-w-[57rem] w-fit bg-slate-800 border-[2px] border-blue">
        <div className="grid rounded-md px-4 py-8 mt-10">
          {isCreate && renderCreate({ onSubmit, currentIsPublic: isPublic })}
          {isEdit &&
            renderEdit({
              onSubmit,
              currentImages,
              isOwned,
              currentIsPublic: isPublic,
            })}
          {isView && renderView(currentImages)}
        </div>
      </DialogContent>
    </div>
  );
};

export default GalleryNodeModal;
