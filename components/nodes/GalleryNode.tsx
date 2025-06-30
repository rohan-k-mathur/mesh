"use client";

import { NodeProps } from "@xyflow/react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";

import { useAuth } from "@/lib/AuthContext";
import useStore from "@/lib/reactflow/store";
import { GalleryNodeData, AppState } from "@/lib/reactflow/types";
import { updateRealtimePost } from "@/lib/actions/realtimepost.actions";
import { uploadFileToSupabase } from "@/lib/utils";
import { GalleryPostValidation } from "@/lib/validations/thread";
import BaseNode from "./BaseNode";
import { useShallow } from "zustand/react/shallow";
import GalleryNodeModal from "../modals/GalleryNodeModal";
import { z } from "zod";

function GalleryNode({ id, data }: NodeProps<GalleryNodeData>) {
  const path = usePathname();
  const currentActiveUser = useAuth().user;
  const store = useStore(
    useShallow((state: AppState) => ({
      closeModal: state.closeModal,
    }))
  );
  const [images, setImages] = useState<string[]>(data.images || []);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setImages(data.images || []);
  }, [data.images]);

  const isOwned = currentActiveUser
    ? Number(currentActiveUser.userId) === Number(data.author.id)
    : false;
  const isPublic = data.isPublic;

  async function onGallerySubmit(values: z.infer<typeof GalleryPostValidation>) {
    try {
      const uploads = await Promise.all(
        values.images.map((img) => uploadFileToSupabase(img))
      );
      const urls = uploads
        .filter((r) => !r.error)
        .map((r) => r.fileURL);
      const updatedGallery = urls.length > 0 ? [...images, ...urls] : images;

      if (urls.length > 0) {
        setImages(updatedGallery);
        setCurrentIndex(0);
      }

      await updateRealtimePost({
        id,
        path,
        ...(urls.length > 0 && {
          imageUrl: updatedGallery[0],
          text: JSON.stringify(updatedGallery),
        }),
        ...(isOwned && { isPublic: values.isPublic }),
      });
      store.closeModal();
    } catch (e) {
      console.error(e);
    }
  }

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };
  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  return (
    <BaseNode
      modalContent={
        <GalleryNodeModal
          id={id}
          isOwned={isOwned}
          isPublic={isPublic}
          currentImages={images}
          onSubmit={onGallerySubmit}
        />
      }
      id={id}
      author={data.author}
      isOwned={isOwned}
      type="GALLERY"
      isLocked={data.locked}
    >
      {images.length > 0 && (
        <div className=" img-container">
          
          <Image
            className="img-frame"

            src={images[currentIndex]}
            alt={`img-${currentIndex}`}
            width={0}
            height={0}
            sizes="200vw"
          />
          {images.length > 1 && (
            <>
              <button
                className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/50 text-white px-1"
                onClick={handlePrev}
              >
                ‹
              </button>
              <button
                className="absolute right-0 top-1/2 -translate-y-1/2 bg-black/50 text-white px-1"
                onClick={handleNext}
              >
                ›
              </button>
            </>
          )}
        </div>
      )}
    </BaseNode>
  );
}

export default GalleryNode;
