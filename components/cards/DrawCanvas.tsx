"use client";

import { useEffect, useRef, useState } from "react";
import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";

interface DrawCanvasProps {
  content?: string;
}

const DrawCanvas = ({ content }: DrawCanvasProps) => {
  const editorRef = useRef<any>(null);
  const [editorReady, setEditorReady] = useState(false);

  useEffect(() => {
    if (editorReady && editorRef.current && content) {
      try {
        editorRef.current.store.loadStoreSnapshot(JSON.parse(content));
      } catch (e) {
        console.error(e);
      }
    }
  }, [editorReady, content]);

  return (
    <div className="flex justify-center">
      <div className="w-[400px] h-[400px]  rounded-md">
        <Tldraw
          onMount={(editor) => {
            editorRef.current = editor;
            setEditorReady(true);
          }}
        />
      </div>
    </div>
  );
};

export default DrawCanvas;
