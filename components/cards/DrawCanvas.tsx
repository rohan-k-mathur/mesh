"use client";

import { useEffect, useRef } from "react";
import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";

interface DrawCanvasProps {
  content?: string;
}

const DrawCanvas = ({ content }: DrawCanvasProps) => {
  const editorRef = useRef<any>(null);

  useEffect(() => {
    if (editorRef.current && content) {
      try {
        editorRef.current.store.loadStoreSnapshot(JSON.parse(content));
      } catch (e) {
        console.error(e);
      }
    }
  }, [content]);

  return (
    <div className="flex justify-center">
      <div className="w-[400px] h-[400px] border-black border-2 rounded-sm">
        <Tldraw onMount={(editor) => { editorRef.current = editor; }} />
      </div>
    </div>
  );
};

export default DrawCanvas;
