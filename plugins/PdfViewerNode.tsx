"use client";

import { NodeProps } from "@xyflow/react";
import { PluginDescriptor } from "@/lib/pluginLoader";
import BaseNode from "@/components/nodes/BaseNode";
import { AuthorOrAuthorId } from "@/lib/reactflow/types";
import { useAuth } from "@/lib/AuthContext";
import { fetchUser } from "@/lib/actions/user.actions";
import { useEffect, useState } from "react";

export interface PdfViewerData {
  url: string;
  author: AuthorOrAuthorId;
  locked: boolean;
}

function PdfViewerNode({ id, data }: NodeProps<PdfViewerData>) {
  const currentUser = useAuth().user;
  const [author, setAuthor] = useState(data.author);

  useEffect(() => {
    if ("username" in author) return;
    fetchUser(data.author.id).then((user) => user && setAuthor(user));
  }, [author, data.author.id]);

  const isOwned = currentUser ? Number(currentUser.userId) === Number(data.author.id) : false;

  return (
    <BaseNode id={id} author={author} isOwned={isOwned} type="PDF_VIEWER" isLocked={data.locked}>
      <iframe src={data.url} className="w-full h-[400px] border-none" title="PDF Viewer" />
    </BaseNode>
  );
}

export const descriptor: PluginDescriptor = {
  type: "PDF_VIEWER",
  component: PdfViewerNode,
  config: { label: "PDF Viewer" },
};

export default PdfViewerNode;
