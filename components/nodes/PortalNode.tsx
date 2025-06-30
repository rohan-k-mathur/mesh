"use client";

import { fetchUser } from "@/lib/actions/user.actions";
import { useAuth } from "@/lib/AuthContext";
import { AuthorOrAuthorId } from "@/lib/reactflow/types";
import BaseNode from "./BaseNode";
import { NodeProps, useReactFlow } from "@xyflow/react";
import { useEffect, useState, useCallback } from "react";

interface PortalNodeData {
  x: number;
  y: number;
  author: AuthorOrAuthorId;
  locked: boolean;
}

function PortalNode({ id, data }: NodeProps<PortalNodeData>) {
  const currentUser = useAuth().user;
  const [author, setAuthor] = useState(data.author);
  const { setViewport } = useReactFlow();

  useEffect(() => {
    if ("username" in author) return;
    fetchUser(data.author.id).then((user) => user && setAuthor(user));
  }, [data]);

  const isOwned = currentUser
    ? Number(currentUser.userId) === Number(data.author.id)
    : false;

  const handleTeleport = useCallback(() => {
    setViewport({ x: data.x, y: data.y, zoom: 0.75 }, { duration: 800 });
  }, [data.x, data.y, setViewport]);

  return (
    <BaseNode
      modalContent={null}
      id={id}
      author={author}
      isOwned={isOwned}
      type={"PORTAL"}
      isLocked={data.locked}
    >
      <div className="portal-node">
        <div className="portal-block">
          <button  onClick={handleTeleport} className="portalbutton w-[15rem] p-4">
            Go to ({data.x}, {data.y})
          </button>
        </div>
      </div>
    </BaseNode>
  );
}

export default PortalNode;

