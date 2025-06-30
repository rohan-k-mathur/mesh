"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseclient";
import { useAuth } from "@/lib/AuthContext";

interface LivechatCardProps {
  id: string;
  inviteeId: number;
  authorId: number;
}

function LivechatCard({ id, inviteeId, authorId }: LivechatCardProps) {
  const { user: currentUser } = useAuth();
  const [myText, setMyText] = useState("");
  const [otherText, setOtherText] = useState("");
  const [channel, setChannel] = useState<any>(null);

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

  const sendMessage = () => {
    if (!channel) return;
    channel.send({
      type: "broadcast",
      event: "send",
      payload: { sender: Number(currentUser?.userId) },
    });
    setMyText("");
    channel.send({
      type: "broadcast",
      event: "typing",
      payload: { sender: Number(currentUser?.userId), text: "" },
    });
  };

  const handleTyping = (val: string) => {
    setMyText(val);
    channel?.send({
      type: "broadcast",
      event: "typing",
      payload: { sender: Number(currentUser?.userId), text: val },
    });
  };

  if (
    currentUser &&
    Number(currentUser.userId) !== Number(inviteeId) &&
    Number(currentUser.userId) !== Number(authorId)
  ) {
    return null;
  }

  return (
    <div className="livechat-updater-node flex flex-col py-[2rem] gap-4">
      <label htmlFor="other" className="text-[1rem] mb-0 mt-0">
        Other Person
      </label>
      <textarea
        id="other"
        className="w-[90%] text-block border rounded text-black p-3 custom-scrollbar"
        disabled
        value={otherText}
        rows={5}
      />
      <label htmlFor="you" className="text-[1rem] mb-0 mt-0">
        You
      </label>
      <textarea
        id="you"
        className="w-[90%] text-block border rounded text-black p-3 mb-4 custom-scrollbar"
        value={myText}
        onChange={(e) => handleTyping(e.target.value)}
        rows={5}
      />
      <button
        onClick={sendMessage}
        className="bg-transparent likebutton border-none outline-black outline-blue w-[50%] text-black text-[1rem] rounded-xl px-2 py-2"
      >
        Clear
      </button>
    </div>
  );
}

export default LivechatCard;
