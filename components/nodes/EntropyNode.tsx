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
import EntropyNodeModal from "../modals/EntropyNodeModal";
import useStore from "@/lib/reactflow/store";
import { useShallow } from "zustand/react/shallow";
import { EntropyInviteValidation } from "@/lib/validations/thread";
import { z } from "zod";
import { entropyDigits } from "@/lib/entropy/utils";

interface EntropyNodeData {
  inviteeId: number;
  author: AuthorOrAuthorId;
  locked: boolean;
  secret?: string;
  guesses?: string[];
}

function EntropyNode({ id, data }: NodeProps<EntropyNodeData>) {
  const path = usePathname();
  const currentUser = useAuth().user;
  const [author, setAuthor] = useState(data.author);
  const store = useStore(
    useShallow((state: AppState) => ({
      closeModal: state.closeModal,
    }))
  );
  const [secret, setSecret] = useState(data.secret || "SECRET");
  const [guesses, setGuesses] = useState<string[]>(data.guesses || []);
  const [channel, setChannel] = useState<any>(null);
  const [inviteeUsername, setInviteeUsername] = useState("");
  const otherUsername =
    Number(currentUser?.userId) === Number(data.author.id)
      ? inviteeUsername
      : "username" in author
      ? author.username
      : "";

  useEffect(() => {
    if ("username" in author) return;
    fetchUser(data.author.id).then((user) => user && setAuthor(user));
  }, [data, author]);

  useEffect(() => {
    if (!data.inviteeId) return;
    fetchUser(BigInt(data.inviteeId)).then((u) => u && setInviteeUsername(u.username));
  }, [data.inviteeId]);

  useEffect(() => {
    const ch = supabase.channel(`entropy-${id}`);
    ch.on("broadcast", { event: "guess" }, ({ payload }) => {
      setGuesses((g) => [...g, payload.guess]);
    });
    ch.subscribe();
    setChannel(ch);
    return () => {
      supabase.removeChannel(ch);
    };
  }, [id]);

  const isOwned = currentUser ? Number(currentUser.userId) === Number(data.author.id) : false;

  async function onSubmit(values: z.infer<typeof EntropyInviteValidation>) {
    const username = values.invitee.replace(/^@/, "");
    const user = await fetchUserByUsername(username);
    if (user) {
      await updateRealtimePost({
        id,
        path,
        content: JSON.stringify({ inviteeId: Number(user.id), secret, guesses }),
      });
      setInviteeUsername(user.username);
    }
    store.closeModal();
  }

  const [current, setCurrent] = useState("");

  const sendGuess = async () => {
    if (!channel) return;
    if (current.length !== 6) return;
    channel.send({ type: "broadcast", event: "guess", payload: { guess: current } });
    const updated = [...guesses, current];
    setGuesses(updated);
    setCurrent("");
    await updateRealtimePost({ id, path, content: JSON.stringify({ inviteeId: data.inviteeId, secret, guesses: updated }) });
  };

  if (
    currentUser &&
    Number(currentUser.userId) !== Number(data.inviteeId) &&
    Number(currentUser.userId) !== Number("id" in data.author ? data.author.id : data.author.id)
  ) {
    return null;
  }

  return (
    <BaseNode
      modalContent={
        isOwned ? (
          <EntropyNodeModal
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
      type={"ENTROPY"}
      isLocked={data.locked}
    >
      <div className="flex flex-col gap-2 p-2">
        <label className="text-[1rem]">{otherUsername || "Other"}</label>
        <ul className="font-mono text-sm space-y-1">
          {guesses.map((g, i) => {
            const res = entropyDigits(secret, g);
            return (
              <li key={i} className="flex gap-2">
                <span>{g}</span>
                <span>{res.tiles.map((t) => t.digit).join(" ")}</span>
              </li>
            );
          })}
        </ul>
        <div className="flex gap-2 mt-2">
          <input
            value={current}
            onChange={(e) => setCurrent(e.target.value.toUpperCase())}
            className="border p-1 text-black text-sm"
            maxLength={6}
          />
          <button onClick={sendGuess} className="likebutton border-none px-2 rounded">
            Guess
          </button>
        </div>
      </div>
    </BaseNode>
  );
}

export default EntropyNode;
