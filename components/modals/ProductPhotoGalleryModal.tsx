import Image from "next/image";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

interface Props {
  images: string[];
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

const ProductPhotoGalleryModal = ({ images, open, onOpenChange }: Props) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const handlePrev = () =>
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  const handleNext = () =>
    setCurrentIndex((prev) => (prev + 1) % images.length);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[40rem]">
        <DialogHeader>
          <DialogTitle>Photos</DialogTitle>
        </DialogHeader>
        {images.length > 0 && (
          <div className="relative flex justify-center">
            <Image
              src={images[currentIndex]}
              alt={`photo-${currentIndex}`}
              width={0}
              height={0}
              sizes="200vw"
              className="max-h-[30rem] w-auto"
            />
            {images.length > 1 && (
              <>
                <button
                  className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/50 text-white px-2"
                  onClick={handlePrev}
                >
                  ‹
                </button>
                <button
                  className="absolute right-0 top-1/2 -translate-y-1/2 bg-black/50 text-white px-2"
                  onClick={handleNext}
                >
                  ›
                </button>
              </>
            )}
          </div>
        )}
        <div className="pt-4 text-right">
          <DialogClose className="px-4 py-2 border border-blue rounded-md">Close</DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductPhotoGalleryModal;
