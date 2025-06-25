"use client";

import { useEffect, useState } from "react";
import { NodeProps, useReactFlow } from "@xyflow/react";
import { useAuth } from "@/lib/AuthContext";
import { fetchUser } from "@/lib/actions/user.actions";
import BaseNode from "./BaseNode";
import { PortalNodeData, AuthorOrAuthorId } from "@/lib/reactflow/types";

function PortalNode({ id, data }: NodeProps<PortalNodeData>) {
  const reactFlow = useReactFlow();
  const currentActiveUser = useAuth().user;
  const [author, setAuthor] = useState<AuthorOrAuthorId>(data.author);

  useEffect(() => {
    if ("username" in author) {
      return;
    }
    fetchUser(data.author.id).then((user) => {
      if (user) setAuthor(user);
    });
  }, [data]);

  const isOwned = currentActiveUser
    ? Number(currentActiveUser.userId) === Number(data.author.id)
    : false;

  const goToTarget = () => {
    reactFlow.setViewport({ x: data.targetX, y: data.targetY, zoom: 1 }, {
      duration: 800,
    });
  };

  return (
    <BaseNode
      modalContent={null}
      id={id}
      author={author}
      isOwned={isOwned}
      type={"PORTAL"}
      isLocked={data.locked}
    >
      <div className="p-2">
        <button className="button" onClick={goToTarget}>
          Go To Target
        </button>
      </div>
    </BaseNode>
  );
}

export default PortalNode;
