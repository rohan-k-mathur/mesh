"use client";
import { updateRealtimePost } from "@/lib/actions/realtimepost.actions";
import { fetchUser } from "@/lib/actions/user.actions";
import { useAuth } from "@/lib/AuthContext";
import useStore from "@/lib/reactflow/store";
import { AppState, TextNode } from "@/lib/reactflow/types";
import { TextPostValidation } from "@/lib/validations/thread";
import { NodeProps } from "@xyflow/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { z } from "zod";
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
  useEffect(() => {
    setText(data.text);
    if ("username" in author) {
      return;
    } else {
      fetchUser(data.author.id).then((user) => {
        setAuthor(user!);
      });
    }
  }, [data]);

  const isOwned = currentActiveUser
    ? Number(currentActiveUser!.userId) === Number(data.author.id)
    : false;

  async function onSubmit(values: z.infer<typeof TextPostValidation>) {
    setText(values.postContent);
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
      <div className="text-updater-node">
        <div className="text-block ">{text}</div>
      </div>
    </BaseNode>
  );
}
export default TextInputNode;
