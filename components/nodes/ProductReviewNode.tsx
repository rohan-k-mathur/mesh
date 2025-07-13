"use client";

import { updateRealtimePost } from "@/lib/actions/realtimepost.actions";
import { fetchUser } from "@/lib/actions/user.actions";
import { useAuth } from "@/lib/AuthContext";
import useStore from "@/lib/reactflow/store";
import { AppState, ProductReviewNodeData } from "@/lib/reactflow/types";
import { ProductReviewValidation } from "@/lib/validations/thread";
import { NodeProps } from "@xyflow/react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { z } from "zod";
import { useShallow } from "zustand/react/shallow";
import BaseNode from "./BaseNode";
import ProductReviewNodeModal from "../modals/ProductReviewNodeModal";
import ProductPhotoGalleryModal from "../modals/ProductPhotoGalleryModal";
import { Button } from "../ui/button";
import { uploadFileToSupabase } from "@/lib/utils";

function ProductReviewNode({ id, data }: NodeProps<ProductReviewNodeData>) {
  const path = usePathname();
  const currentUser = useAuth().user;
  const store = useStore(
    useShallow((state: AppState) => ({
      closeModal: state.closeModal,
    }))
  );
  const [author, setAuthor] = useState(data.author);
  const [productName, setProductName] = useState(data.productName);
  const [rating, setRating] = useState(data.rating);
  const [summary, setSummary] = useState(data.summary);
  const [productLink, setProductLink] = useState(data.productLink);
  const [claims, setClaims] = useState<string[]>(data.claims || []);
  const [images, setImages] = useState<string[]>(data.images || []);
  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => {
    if ("username" in author) return;
    fetchUser(data.author.id).then((user) => user && setAuthor(user));
  }, [data.author.id, author]);

  useEffect(() => {
    setProductName(data.productName);
    setRating(data.rating);
    setSummary(data.summary);
    setProductLink(data.productLink);
    setClaims(data.claims || []);
    setImages(data.images || []);
  }, [data]);

  const isOwned = currentUser ? Number(currentUser.userId) === Number(data.author.id) : false;

  async function onSubmit(values: z.infer<typeof ProductReviewValidation>) {
    const filtered = values.claims.filter((c) => c.trim() !== "");
    const uploads = await Promise.all(
      (values.images || []).map((img) => uploadFileToSupabase(img))
    );
    const urls = uploads.filter((r) => !r.error).map((r) => r.fileURL);
    const updatedImages = urls.length > 0 ? [...images, ...urls] : images;
    setProductName(values.productName);
    setRating(values.rating);
    setSummary(values.summary);
    setProductLink(values.productLink);
    setClaims(filtered);
    if (urls.length > 0) setImages(updatedImages);
    await updateRealtimePost({
      id,
      path,
      ...(urls.length > 0 && { imageUrl: updatedImages[0] }),
      content: JSON.stringify({ ...values, images: updatedImages, claims: filtered }),
    });
    store.closeModal();
  }

  return (
    <BaseNode
      modalContent={
      <ProductReviewNodeModal
        id={id}
        isOwned={isOwned}
        currentProductName={productName}
        currentRating={rating}
        currentSummary={summary}
        currentProductLink={productLink}
        currentClaims={claims}
        currentImages={images}
        onSubmit={onSubmit}
      />
      }
      id={id}
      author={author}
      isOwned={isOwned}
      type={"PRODUCT_REVIEW"}
      isLocked={data.locked}
    >
      <div className="flex flex-col img-container w-[30rem] h-fit">
        <div className="font-bold">{productName}</div>
        <div>Rating: {rating}/5</div>
        <div className="text-sm mt-1">{summary}</div>
        <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
          {claims.map((c, idx) => (
            <li key={idx}>{c}</li>
          ))}
        </ul>
        <div className="flex gap-2 mt-2">
          <Button>
            <a
              href={productLink}
              className="text-xs text-blue-500"
              target="_blank"
              rel="noopener noreferrer"
            >
              View Product
            </a>
          </Button>
          {images.length > 0 && (
            <Button onClick={() => setViewerOpen(true)} className="text-xs">
              View Photos
            </Button>
          )}
        </div>
        <ProductPhotoGalleryModal
          images={images}
          open={viewerOpen}
          onOpenChange={setViewerOpen}
        />
      </div>
    </BaseNode>
  );
}

export default ProductReviewNode;
