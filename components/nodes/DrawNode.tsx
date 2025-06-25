"use client";

import { fetchUser } from "@/lib/actions/user.actions";
import { useAuth } from "@/lib/AuthContext";
import { AuthorOrAuthorId } from "@/lib/reactflow/types";
import BaseNode from "./BaseNode";
import { NodeProps } from "@xyflow/react";
import { useEffect, useState } from "react";
import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";

interface DrawNodeData {
  author: AuthorOrAuthorId;
  locked: boolean;
}

function DrawNode({ id, data }: NodeProps<DrawNodeData>) {
  const currentUser = useAuth().user;
  const [author, setAuthor] = useState(data.author);

  useEffect(() => {
    if ("username" in author) return;
    fetchUser(data.author.id).then((user) => user && setAuthor(user));
  }, [data]);

  const isOwned = currentUser
    ? Number(currentUser.userId) === Number(data.author.id)
    : false;

  return (
    <BaseNode
      modalContent={null}
      id={id}
      author={author}
      isOwned={isOwned}
      type={"DRAW"}
      isLocked={data.locked}
    >
      <div className="draw-container">
        <div className="nodrag nopan">
          <div className="w-[400px] h-[400px] border-black border-2 rounded-sm">
            <Tldraw />
          </div>
        </div>
      </div>
    </BaseNode>
  );
}

export default DrawNode;
