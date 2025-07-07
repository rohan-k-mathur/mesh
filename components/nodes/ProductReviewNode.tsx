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
import { Button } from "../ui/button";

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

  useEffect(() => {
    if ("username" in author) return;
    fetchUser(data.author.id).then((user) => user && setAuthor(user));
  }, [data.author.id, author]);

  useEffect(() => {
    setProductName(data.productName);
    setRating(data.rating);
    setSummary(data.summary);
    setProductLink(data.productLink);
  }, [data]);

  const isOwned = currentUser ? Number(currentUser.userId) === Number(data.author.id) : false;

  async function onSubmit(values: z.infer<typeof ProductReviewValidation>) {
    setProductName(values.productName);
    setRating(values.rating);
    setSummary(values.summary);
    setProductLink(values.productLink);
    await updateRealtimePost({
      id,
      path,
      content: JSON.stringify(values),
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
        <Button>
        <a href={productLink} className="text-xs text-blue-500" target="_blank" rel="noopener noreferrer">
          View Product
        </a>
        </Button>
      </div>
    </BaseNode>
  );
}

export default ProductReviewNode;
