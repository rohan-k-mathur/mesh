"use client";

import { fetchUser } from "@/lib/actions/user.actions";
import {
  fetchRealtimePostById,
  updateRealtimePost,
} from "@/lib/actions/realtimepost.actions";
import { useAuth } from "@/lib/AuthContext";
import { AuthorOrAuthorId } from "@/lib/reactflow/types";
import BaseNode from "./BaseNode";
import { NodeProps } from "@xyflow/react";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";

interface DrawNodeData {
  author: AuthorOrAuthorId;
  locked: boolean;
  content?: string;
}

function DrawNode({ id, data }: NodeProps<DrawNodeData>) {
  const currentUser = useAuth().user;
  const path = usePathname();
  const [author, setAuthor] = useState(data.author);
  const editorRef = useRef<any>(null);
  const lastLoaded = useRef<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if ("username" in author) return;
    fetchUser(data.author.id).then((user) => user && setAuthor(user));
  }, [data]);

  useEffect(() => {
    if (!editorRef.current) return;
    fetchRealtimePostById({ id }).then((post) => {
      if (post?.content) {
        try {
          editorRef.current.store.loadStoreSnapshot(
            JSON.parse(post.content)
          );
          lastLoaded.current = post.content;
        } catch (e) {
          console.error(e);
        }
      }
    });

    const unsub = editorRef.current.store.listen(() => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        const snapshot = editorRef.current.store.getStoreSnapshot();
        const json = JSON.stringify(snapshot);
        lastLoaded.current = json;
        updateRealtimePost({ id, path, content: json });
      }, 500);
    });
    return () => {
      unsub();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [id, path]);

  useEffect(() => {
    if (editorRef.current && data.content && data.content !== lastLoaded.current) {
      try {
        editorRef.current.store.loadStoreSnapshot(JSON.parse(data.content));
        lastLoaded.current = data.content;
      } catch (e) {
        console.error(e);
      }
    }
  }, [data.content]);

  const isOwned = currentUser
    ? Number(currentUser.userId) === Number(data.author.id)
    : false;

  return (
    <BaseNode
      modalContent={null}
      id={id}
      author={author}
      isOwned={isOwned}
      type={"DRAW"}
      isLocked={data.locked}
    >
      <div className="draw-container">
        <div className="nodrag nopan">
          <div className="w-[400px] h-[400px] border-black border-2 rounded-sm">
            <Tldraw onMount={(editor) => { editorRef.current = editor; }} />
          </div>
        </div>
      </div>
    </BaseNode>
  );
}

export default DrawNode;
