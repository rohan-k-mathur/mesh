"use client";

import { NodeProps } from "@xyflow/react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { fetchUser } from "@/lib/actions/user.actions";
import { RoomCanvasNodeData } from "@/lib/reactflow/types";
import BaseNode from "./BaseNode";
import EmbeddedCanvas from "../cards/EmbeddedCanvas";

function RoomCanvasNode({ id, data }: NodeProps<RoomCanvasNodeData>) {
  const currentUser = useAuth().user;
  const [author, setAuthor] = useState(data.author);

  useEffect(() => {
    if ("username" in author) return;
    fetchUser(data.author.id).then((user) => user && setAuthor(user));
  }, [author, data.author.id]);

  const isOwned = currentUser ? Number(currentUser.userId) === Number(data.author.id) : false;

  return (
    <BaseNode id={id} author={author} isOwned={isOwned} type="ROOM_CANVAS" isLocked={data.locked}>
      <div className="w-[400px] h-[400px]">
        <EmbeddedCanvas canvas={data.canvas} roomId={data.roomId} />
      </div>
    </BaseNode>
  );
}

export default RoomCanvasNode;
