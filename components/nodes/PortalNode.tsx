"use client";

import { fetchUser } from "@/lib/actions/user.actions";
import { useAuth } from "@/lib/AuthContext";
import { AuthorOrAuthorId } from "@/lib/reactflow/types";
import BaseNode from "./BaseNode";
import { NodeProps } from "@xyflow/react";
import { useEffect, useState } from "react";

interface PortalNodeData {
  roomId: string;
  author: AuthorOrAuthorId;
  locked: boolean;
}

function PortalNode({ id, data }: NodeProps<PortalNodeData>) {
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
      type={"PORTAL"}
      isLocked={data.locked}
    >
      <div className="p-25 text-center portal-node">
        <div className="portal-block">        <p>Portal to room {data.roomId}</p>
</div>
      </div>
    </BaseNode>
  );
}

export default PortalNode;