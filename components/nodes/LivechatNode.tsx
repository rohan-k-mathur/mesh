"use client";
import { fetchUser } from "@/lib/actions/user.actions";
import { updateRealtimePost } from "@/lib/actions/realtimepost.actions";
import { useAuth } from "@/lib/AuthContext";
import { AuthorOrAuthorId, AppState } from "@/lib/reactflow/types";
import { NodeProps } from "@xyflow/react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseclient";
import { usePathname } from "next/navigation";
import BaseNode from "./BaseNode";
import LivechatNodeModal from "../modals/LivechatNodeModal";
import useStore from "@/lib/reactflow/store";
import { useShallow } from "zustand/react/shallow";
import { LivechatInviteValidation } from "@/lib/validations/thread";
import { z } from "zod";

interface LivechatNodeData {
  inviteeId: number;
  author: AuthorOrAuthorId;
  locked: boolean;
}

function LivechatNode({ id, data }: NodeProps<LivechatNodeData>) {
  const path = usePathname();
  const currentUser = useAuth().user;
  const [author, setAuthor] = useState(data.author);
  const store = useStore(
    useShallow((state: AppState) => ({
      closeModal: state.closeModal,
    }))
  );
  const [myText, setMyText] = useState("");
  const [otherText, setOtherText] = useState("");
  const [channel, setChannel] = useState<any>(null);

  useEffect(() => {
    if ("username" in author) return;
    fetchUser(data.author.id).then((user) => user && setAuthor(user));
  }, [data]);

  useEffect(() => {
    const ch = supabase.channel(`livechat-${id}`);
    ch
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload.sender !== currentUser?.userId) {
          setOtherText(payload.text);
        }
      })
      .on("broadcast", { event: "send" }, () => {
        setOtherText("");
      })
      .subscribe();
    setChannel(ch);
    return () => {
      supabase.removeChannel(ch);
    };
  }, [id, currentUser]);

  const isOwned = currentUser ? Number(currentUser.userId) === Number(data.author.id) : false;

  async function onSubmit(values: z.infer<typeof LivechatInviteValidation>) {
    await updateRealtimePost({
      id,
      path,
      content: JSON.stringify({ inviteeId: values.inviteeId }),
    });
    store.closeModal();
  }

  const sendMessage = () => {
    if (!channel) return;
    channel.send({ type: "broadcast", event: "send", payload: { sender: currentUser?.userId } });
    setMyText("");
    channel.send({ type: "broadcast", event: "typing", payload: { sender: currentUser?.userId, text: "" } });
  };

  const handleTyping = (val: string) => {
    setMyText(val);
    channel?.send({ type: "broadcast", event: "typing", payload: { sender: currentUser?.userId, text: val } });
  };

  if (currentUser &&
      currentUser.userId !== data.inviteeId &&
      currentUser.userId !== ("id" in data.author ? data.author.id : data.author.id)) {
    return null;
  }

  return (
    <BaseNode
      modalContent={
        <LivechatNodeModal
          id={id}
          isOwned={isOwned}
          currentInviteeId={data.inviteeId}
          onSubmit={onSubmit}
        />
      }
      id={id}
      author={author}
      isOwned={isOwned}
      type={"LIVECHAT"}
      isLocked={data.locked}
    >
      <div className="flex flex-col space-y-2 p-2">
        <textarea className="w-full border rounded text-black p-1" disabled value={otherText} rows={2} />
        <textarea
          className="w-full border rounded text-black p-1"
          value={myText}
          onChange={(e) => handleTyping(e.target.value)}
          rows={2}
        />
        <button onClick={sendMessage} className="bg-blue-500 text-white rounded px-2 py-1">
          Send
        </button>
      </div>
    </BaseNode>
  );
}

export default LivechatNode;
