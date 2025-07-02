"use client";

import { useAuth } from "@/lib/AuthContext";
import { fetchUser } from "@/lib/actions/user.actions";
import { CodeNode as CodeNodeType } from "@/lib/reactflow/types";
import { NodeProps } from "@xyflow/react";
import { useEffect, useState } from "react";
import BaseNode from "./BaseNode";

function CodeNode({ id, data }: NodeProps<CodeNodeType>) {
  const currentUser = useAuth().user;
  const [author, setAuthor] = useState(data.author);

  useEffect(() => {
    if ("username" in author) return;
    fetchUser(data.author.id).then((user) => user && setAuthor(user));
  }, [data]);

  const isOwned = currentUser ? Number(currentUser.userId) === Number(data.author.id) : false;

  return (
    <BaseNode id={id} author={author} isOwned={isOwned} type={"CODE"} isLocked={data.locked}>
      <pre className="text-xs whitespace-pre-wrap">{data.code}</pre>
    </BaseNode>
  );
}

export default CodeNode;
