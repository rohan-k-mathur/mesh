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
import { Tldraw, track, useEditor } from 'tldraw'
import "tldraw/tldraw.css";

interface DrawNodeData {
  author: AuthorOrAuthorId;
  locked: boolean;
  content?: string;
}
// [2]
const CustomUi = track(() => {
	const editor = useEditor()

	useEffect(() => {
		const handleKeyUp = (e: KeyboardEvent) => {
			switch (e.key) {
				case 'Delete':
				case 'Backspace': {
					editor.deleteShapes(editor.getSelectedShapeIds())
					break
				}
				case 'v': {
					editor.setCurrentTool('select')
					break
				}
				case 'e': {
					editor.setCurrentTool('eraser')
					break
				}
				case 'x':
				case 'p':
				case 'b':
				case 'd': {
					editor.setCurrentTool('draw')
					break
				}
			}
		}

		window.addEventListener('keyup', handleKeyUp)
		return () => {
			window.removeEventListener('keyup', handleKeyUp)
		}
	})

	return (
		<div className="custom-layout-draw">
			<div className="custom-toolbar-draw">
				<button
					className="custom-button-draw"
					data-isactive={editor.getCurrentToolId() === 'select'}
					onClick={() => editor.setCurrentTool('select')}
				>
					Select
				</button>
				<button
					className="custom-button-draw"
					data-isactive={editor.getCurrentToolId() === 'draw'}
					onClick={() => editor.setCurrentTool('draw')}
				>
					Pencil
				</button>
				<button
					className="custom-button-draw"
					data-isactive={editor.getCurrentToolId() === 'eraser'}
					onClick={() => editor.setCurrentTool('eraser')}
				>
					Eraser
				</button>
			</div>
		</div>
	)
})

function DrawNode({ id, data }: NodeProps<DrawNodeData>) {
  const currentUser = useAuth().user;
  const path = usePathname();
  const [author, setAuthor] = useState(data.author);
  const editorRef = useRef<any>(null);
  const [editorReady, setEditorReady] = useState(false);
  const lastLoaded = useRef<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if ("username" in author) return;
    fetchUser(data.author.id).then((user) => user && setAuthor(user));
  }, [author, data.author.id]);

  useEffect(() => {
    if (!editorReady || !editorRef.current) return;
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
  }, [editorReady, id, path]);

  useEffect(() => {
    if (editorReady && editorRef.current && data.content && data.content !== lastLoaded.current) {
      try {
        editorRef.current.store.loadStoreSnapshot(JSON.parse(data.content));
        lastLoaded.current = data.content;
      } catch (e) {
        console.error(e);
      }
    }
  }, [editorReady, data.content]);

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
            <Tldraw hideUi
             options={{ maxPages: 1 }} 
              onMount={(editor) => {
                editorRef.current = editor;
                editor.setCurrentTool('draw');
                setEditorReady(true);
              }}
            >
            				<CustomUi />
</Tldraw>
          </div>
        </div>
      </div>
    </BaseNode>
  );
}

export default DrawNode;
