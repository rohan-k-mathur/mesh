"use client";
import { fetchUser, fetchUserByUsername } from "@/lib/actions/user.actions";
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
  const [inviteeUsername, setInviteeUsername] = useState("");

  useEffect(() => {
    if ("username" in author) return;
    fetchUser(data.author.id).then((user) => user && setAuthor(user));
  }, [data]);

  useEffect(() => {
    if (!data.inviteeId) return;
    fetchUser(BigInt(data.inviteeId)).then((u) => u && setInviteeUsername(u.username));
  }, [data.inviteeId]);

  useEffect(() => {
    const ch = supabase.channel(`livechat-${id}`);
    ch
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (Number(payload.sender) !== Number(currentUser?.userId)) {
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
    const username = values.invitee.replace(/^@/, "");
    const user = await fetchUserByUsername(username);
    if (user) {
      await updateRealtimePost({
        id,
        path,
        content: JSON.stringify({ inviteeId: Number(user.id) }),
      });
      setInviteeUsername(user.username);
    }
    store.closeModal();
  }

  const sendMessage = () => {
    if (!channel) return;
    channel.send({ type: "broadcast", event: "send", payload: { sender: Number(currentUser?.userId) } });
    setMyText("");
    channel.send({ type: "broadcast", event: "typing", payload: { sender: Number(currentUser?.userId), text: "" } });
  };

  const handleTyping = (val: string) => {
    setMyText(val);
    channel?.send({ type: "broadcast", event: "typing", payload: { sender: Number(currentUser?.userId), text: val } });
  };

  if (
    currentUser &&
    Number(currentUser.userId) !== Number(data.inviteeId) &&
    Number(currentUser.userId) !==
      Number("id" in data.author ? data.author.id : data.author.id)
  ) {
    return null;
  }

  return (
    <BaseNode
      modalContent={
        isOwned ? (
          <LivechatNodeModal
            id={id}
            isOwned={isOwned}
            currentInvitee={inviteeUsername}
            onSubmit={onSubmit}
          />
        ) : null
      }
      id={id}
      author={author}
      isOwned={isOwned}
      type={"LIVECHAT"}
      isLocked={data.locked}
      
    >

      <div className="livechat-updater-node  flex flex-col py-[4rem] gap-4 ">
      <label htmlFor="other" className="text-[1rem] mb-0 mt-0">Other Person</label>

        <textarea 
        id="other"
        className="w-[90%]  text-block border rounded text-black p-3  custom-scrollbar " 
        disabled value={otherText} 
        rows={7} />
        <label htmlFor="you" className="text-[1rem] mb-0 mt-0">You</label>

        <textarea
        id="you"
          className="w-[90%] text-block border rounded text-black p-3  mb-4 custom-scrollbar
          "
          value={myText}
          onChange={(e) => handleTyping(e.target.value)}
          rows={7}
        />

        <button onClick={sendMessage} className="bg-transparent likebutton border-none outline-black outline-blue  w-[50%] text-black text-[1rem] rounded-xl px-2 py-2">
          Clear
        </button>
      </div>
    </BaseNode>
  );
}

export default LivechatNode;
