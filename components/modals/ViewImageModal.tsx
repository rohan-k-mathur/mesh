import {
    DialogClose,
    DialogContent,
    DialogHeader,
    DialogTitle,
  } from "@/components/ui/dialog";
  import { AnimatedDialog } from "../ui/AnimatedDialog";
  import { motion } from "framer-motion";
  
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
      <div className="h-full w-full justify-center items-center flex p-0 flex-col  ">
        <DialogHeader className=" text-white text-lg  ">
          <DialogTitle hidden> view </DialogTitle>
        </DialogHeader>
  
        <div className="grid ">
          <Image
            className="img-view-modal justify-center items-center mx-auto w-fit h-fit  transition-opacity duration-400"
            src={currentImageURL}
            alt="404"
            width={0}
            height={0}
            sizes="200vw"
          />
        </div>
        <div className="py-0 relative justify-center items-center mx-auto ">
          <DialogClose
            id="animateButton"
            className={`w-2`}
          >
            
          </DialogClose>
        </div>
      </div>
    );
  };
  
  const ViewImageModal = ({ id, isOwned, onSubmit, currentImageURL }: Props) => {
    const isCreate = !id && isOwned;
    const isEdit = id && isOwned;
    const isView = id && !isOwned;
    return (
      <div>
        <DialogContent className="max-w-[60%] max-h-[90%] h-full bg-black bg-opacity-50  border-blue">
          <div className="mt-0 grid rounded-xl ">
            {isCreate && renderCreate({ onSubmit })}
            {isEdit && renderEdit({ onSubmit, currentImageURL })}
            {isView && renderView(currentImageURL)}
          </div>
        </DialogContent>
      </div>
    );
  };
  
  export default ViewImageModal;
  