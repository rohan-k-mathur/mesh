"use client";

import { useAuth } from "@/lib/AuthContext";
import { fetchUser } from "@/lib/actions/user.actions";
import { ThreadNode as ThreadNodeType } from "@/lib/reactflow/types";
import { NodeProps } from "@xyflow/react";
import { useEffect, useState } from "react";
import BaseNode from "./BaseNode";

function ThreadNode({ id, data }: NodeProps<ThreadNodeType>) {
  const currentUser = useAuth().user;
  const [author, setAuthor] = useState(data.author);

  useEffect(() => {
    if ("username" in author) return;
    fetchUser(data.author.id).then((user) => user && setAuthor(user));
  }, [data]);

  const isOwned = currentUser ? Number(currentUser.userId) === Number(data.author.id) : false;

  return (
    <BaseNode id={id} author={author} isOwned={isOwned} type={"THREAD"} isLocked={data.locked}>
      <div className="text-sm break-all">{data.threadId}</div>
    </BaseNode>
  );
}

export default ThreadNode;
