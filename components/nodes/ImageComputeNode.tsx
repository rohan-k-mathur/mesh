"use client";

import { generateImage } from "@/lib/actions/openai.actions";
import { updateRealtimePost } from "@/lib/actions/realtimepost.actions";
import { fetchUser } from "@/lib/actions/user.actions";
import { useAuth } from "@/lib/AuthContext";
import useStore from "@/lib/reactflow/store";
import {
  AppState,
  ImageComputeNodeProps,
  TextNode,
} from "@/lib/reactflow/types";
import { getIncomers, NodeProps } from "@xyflow/react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import BaseNode from "./BaseNode";
import { useShallow } from "zustand/react/shallow";

function ImageComputeNode({ id, data }: NodeProps<ImageComputeNodeProps>) {
  const path = usePathname();
  const currentActiveUser = useAuth().user;
  const store = useStore(
    useShallow((state: AppState) => ({
      closeModal: state.closeModal,
      nodes: state.nodes,
      edges: state.edges,
    }))
  );
  const [imageUrl, setImageUrl] = useState(data.imageurl);
  const [author, setAuthor] = useState(data.author);

  useEffect(() => {
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

  const generateOnClick = async (evt: React.MouseEvent<HTMLButtonElement>) => {
    try {
      const incomingNodes = getIncomers({ id: id }, store.nodes, store.edges);
      const nodeData = incomingNodes
        .filter((node) => node.type === "TEXT")
        .map((node) => (node as TextNode).data.text)
        .filter((nodeText) => nodeText && nodeText.trim().length !== 0);
      if (nodeData.length === 0) {
        console.error("No prompt provided");
        return;
      }
      const prompt = Array.from(new Set(nodeData)).join(", as well as ");
      const image = await generateImage({
        prompt: prompt,
        imageSize: "1024x1024",
      });
      if (!image) {
        throw new Error("Image URL not found");
      }
      setImageUrl(image);
      await updateRealtimePost({
        id,
        imageUrl: image,
        path,
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <BaseNode
      modalContent={null}
      id={id}
      author={author}
      isOwned={isOwned}
      type={"IMAGE_COMPUTE"}
      generateOnClick={generateOnClick}
      isLocked={data.locked}
    >
      <div>
        <div className="img-container">
          <div>
            <Image
              className="img-frame"
              src={imageUrl}
              alt="404"
              width={0}
              height={0}
              sizes="200vw"
            />
          </div>
        </div>
      </div>
    </BaseNode>
  );
}

export default ImageComputeNode;
