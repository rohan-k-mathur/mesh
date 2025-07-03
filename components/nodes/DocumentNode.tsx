"use client";

import { useAuth } from "@/lib/AuthContext";
import { fetchUser } from "@/lib/actions/user.actions";
import { DocumentNode as DocumentNodeType } from "@/lib/reactflow/types";
import { NodeProps } from "@xyflow/react";
import { useEffect, useState } from "react";
import BaseNode from "./BaseNode";

function DocumentNode({ id, data }: NodeProps<DocumentNodeType>) {
  const currentUser = useAuth().user;
  const [author, setAuthor] = useState(data.author);

  useEffect(() => {
    if ("username" in author) return;
    fetchUser(data.author.id).then((user) => user && setAuthor(user));
  }, [author, data.author.id]);

  const isOwned = currentUser ? Number(currentUser.userId) === Number(data.author.id) : false;

  return (
    <BaseNode id={id} author={author} isOwned={isOwned} type={"DOCUMENT"} isLocked={data.locked}>
      <a href={data.documentUrl} target="_blank" rel="noreferrer" className="underline text-blue-500 break-all">
        {data.documentUrl || "Document"}
      </a>
    </BaseNode>
  );
}

export default DocumentNode;
