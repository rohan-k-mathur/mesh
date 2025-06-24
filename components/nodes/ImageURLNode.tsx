"use client";

import { updateRealtimePost } from "@/lib/actions/realtimepost.actions";
import { fetchUser } from "@/lib/actions/user.actions";
import { useAuth } from "@/lib/AuthContext";
import useStore from "@/lib/reactflow/store";
import { AppState, ImageUNode } from "@/lib/reactflow/types";
import { uploadFileToSupabase } from "@/lib/utils";
import { ImagePostValidation } from "@/lib/validations/thread";
import { NodeProps } from "@xyflow/react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useShallow } from "zustand/react/shallow";
import ImageNodeModal from "../modals/ImageNodeModal";
import BaseNode from "./BaseNode";

function ImageURLNode({ id, data }: NodeProps<ImageUNode>) {
  const path = usePathname();
  const currentActiveUser = useAuth().user;
  const store = useStore(
    useShallow((state: AppState) => ({
      closeModal: state.closeModal,
    }))
  );
  const [imageURL, setImageURL] = useState(data.imageurl);
  const [author, setAuthor] = useState(data.author);
  useEffect(() => {
    setImageURL(data.imageurl);
    if ("username" in author) {
      return;
    } else {
      fetchUser(data.author.id).then((user) => {
        setAuthor(user!);
      });
    }
  }, [data]);
  const isOwned = currentActiveUser
    ? Number(currentActiveUser!.userId) === Number(data.author.id)
    : false;

  async function onSubmit(values: z.infer<typeof ImagePostValidation>) {
    uploadFileToSupabase(values.image).then((result) => {
      if (result.error) {
        return;
      }
      setImageURL(result.fileURL);
      updateRealtimePost({
        id,
        imageUrl: result.fileURL,
        path,
      });
      store.closeModal();
    });
  }
  return (
    <BaseNode
      modalContent={
        <ImageNodeModal
          id={id}
          isOwned={isOwned}
          currentImageURL={imageURL}
          onSubmit={onSubmit}
        />
      }
      id={id}
      author={author}
      isOwned={isOwned}
      type={"TEXT"}
      isLocked={data.locked}
    >
      <div>
        <div className="img-container">
          <Image
            className="img-frame"
            src={data.imageurl}
            alt="404"
            width={0}
            height={0}
            sizes="200vw"
          />
        </div>
      </div>
    </BaseNode>
  );
}

export default ImageURLNode;
