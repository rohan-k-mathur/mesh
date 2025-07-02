"use client";

import { NodeProps } from "@xyflow/react";
import { useAuth } from "@/lib/AuthContext";
import { fetchUser } from "@/lib/actions/user.actions";
import { updateRealtimePost } from "@/lib/actions/realtimepost.actions";
import useStore from "@/lib/reactflow/store";
import { PortfolioNodeValidation } from "@/lib/validations/thread";
import { uploadFileToSupabase } from "@/lib/utils";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { z } from "zod";
import BaseNode from "./BaseNode";
import { PortfolioNodeData, AppState } from "@/lib/reactflow/types";
import { useShallow } from "zustand/react/shallow";
import PortfolioNodeModal from "../modals/PortfolioNodeModal";

import Image from "next/image";

function PortfolioNode({ id, data }: NodeProps<PortfolioNodeData>) {
  const path = usePathname();
  const currentUser = useAuth().user;
  const store = useStore(
    useShallow((state: AppState) => ({
      closeModal: state.closeModal,
    }))
  );
  const [author, setAuthor] = useState(data.author);
  const [text, setText] = useState(data.text);
  const [images, setImages] = useState<string[]>(data.images || []);
  const [links, setLinks] = useState<string[]>(data.links || []);
  const [layout, setLayout] = useState<"grid" | "column">(data.layout);
  const [color, setColor] = useState(data.color);

  useEffect(() => {
    if ("username" in author) return;
    fetchUser(data.author.id).then((user) => user && setAuthor(user));
  }, [data.author, author]);

  useEffect(() => {
    setText(data.text);
    setImages(data.images || []);
    setLinks(data.links || []);
    setLayout(data.layout);
    setColor(data.color);
  }, [data]);

  const isOwned = currentUser
    ? Number(currentUser.userId) === Number(data.author.id)
    : false;

  const handleExport = async () => {
    const res = await fetch("/api/portfolio/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: data.text,
        images: data.images,
        links: data.links,
        layout: data.layout,
        color: data.color,
      }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "portfolio.zip";
    a.click();
    URL.revokeObjectURL(url);
  };

  async function onSubmit(values: z.infer<typeof PortfolioNodeValidation>) {
    const uploads = await Promise.all(
      (values.images || []).map((img) => uploadFileToSupabase(img))
    );
    const urls = uploads.filter((r) => !r.error).map((r) => r.fileURL);
    const updatedImages = urls.length > 0 ? [...images, ...urls] : images;

    setText(values.text);
    setImages(updatedImages);
    setLinks(values.links || []);
    setLayout(values.layout);
    setColor(values.color);

    await updateRealtimePost({
      id,
      path,
      text: values.text,
      imageUrl: updatedImages[0],
      videoUrl: (values.links && values.links[0]) || links[0],
      content: JSON.stringify({
        images: updatedImages,
        links: values.links || [],
        layout: values.layout,
        color: values.color,
      }),
    });
    store.closeModal();
  }

  return (
    <BaseNode
      modalContent={
        isOwned ? (
          <PortfolioNodeModal
            id={id}
            isOwned={isOwned}
            onSubmit={onSubmit}
            currentText={text}
            currentImages={images}
            currentLinks={links}
            currentLayout={layout}
            currentColor={color}
          />
        ) : null
      }
      id={id}
      author={author}
      isOwned={isOwned}
      type={"PORTFOLIO"}
      isLocked={data.locked}
      generateOnClick={handleExport}
    >
      <div className="p-2">
        <p className="mb-1">{text}</p>
        {images[0] && (
          <Image
            src={images[0]}
            alt="img"
            width={80}
            height={80}
            className="object-cover"
          />
        )}
        {links[0] && (
          <a
            href={links[0]}
            className="text-blue-500 underline"
            target="_blank"
            rel="noreferrer"
          >
            {links[0]}
          </a>
        )}
      </div>
    </BaseNode>
  );
}

export default PortfolioNode;
