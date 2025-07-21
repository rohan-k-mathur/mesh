"use client";
import { updateRealtimePost } from "@/lib/actions/realtimepost.actions";
import { fetchUser } from "@/lib/actions/user.actions";
import { useAuth } from "@/lib/AuthContext";
import useStore from "@/lib/reactflow/store";
import { AppState, TextNode } from "@/lib/reactflow/types";
import { TextPostValidation } from "@/lib/validations/thread";
import { NodeProps } from "@xyflow/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import * as Y from "yjs";
import { supabase } from "@/lib/supabaseclient";
import { TEXT_UPDATE_EVENT } from "@/constants";
import TextNodeModal from "../modals/TextNodeModal";
import BaseNode from "./BaseNode";
import { useShallow } from "zustand/react/shallow";

function TextInputNode({ id, data }: NodeProps<TextNode>) {
  const path = usePathname();
  const currentActiveUser = useAuth().user;
  const store = useStore(
    useShallow((state: AppState) => ({
      closeModal: state.closeModal,
    }))
  );
  const [text, setText] = useState(data.text);
  const [author, setAuthor] = useState(data.author);
  const docRef = useRef(new Y.Doc());
  const channelRef = useRef<any>(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const ytext = docRef.current.getText("content");
    if (ytext.length === 0) {
      ytext.insert(0, data.text);
    }
    const handler = () => setText(ytext.toString());
    handler();
    ytext.observe(handler);

    channelRef.current = supabase.channel(`text-${id}`);
    channelRef.current
      .on("broadcast", { event: TEXT_UPDATE_EVENT }, ({ payload }) => {
        const update = Buffer.from(payload.update, "base64");
        Y.applyUpdate(docRef.current, update);
      })
      .subscribe();

    if (!("username" in author)) {
      fetchUser(data.author.id).then((user) => user && setAuthor(user));
    }

    return () => {
      ytext.unobserve(handler);
      supabase.removeChannel(channelRef.current);
    };
  }, [data, author, id]);

  const isOwned = currentActiveUser
    ? Number(currentActiveUser!.userId) === Number(data.author.id)
    : false;

  async function onSubmit(values: z.infer<typeof TextPostValidation>) {
    const ytext = docRef.current.getText("content");
    ytext.delete(0, ytext.length);
    ytext.insert(0, values.postContent);
    const update = Y.encodeStateAsUpdate(docRef.current);
    channelRef.current?.send({
      type: "broadcast",
      event: TEXT_UPDATE_EVENT,
      payload: { update: Buffer.from(update).toString("base64") },
    });
    updateRealtimePost({ id, text: values.postContent, path });
    store.closeModal();
  }

  return (
    <BaseNode
      modalContent={
        <TextNodeModal
          id={id}
          isOwned={isOwned}
          currentText={data.text}
          onSubmit={onSubmit}
        />
      }
      id={id}
      author={author}
      isOwned={isOwned}
      type={"TEXT"}
      isLocked={data.locked}
    >
      <div className="text-updater-node mt-2">
        <div className="text-node-block h-full px-2 py-2">{ text}</div>
      </div>
    </BaseNode>
  );
}
export default TextInputNode;
