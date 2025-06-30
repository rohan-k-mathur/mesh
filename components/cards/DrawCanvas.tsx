"use client";

import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";

const DrawCanvas = () => {
  return (
    <div className="flex justify-center">
      <div className="w-[400px] h-[400px] border-black border-2 rounded-sm">
        <Tldraw />
      </div>
    </div>
  );
};

export default DrawCanvas;
