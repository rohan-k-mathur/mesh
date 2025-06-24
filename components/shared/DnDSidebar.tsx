import useStore from "@/lib/reactflow/store";
import { AppNodeType, AppState } from "@/lib/reactflow/types";
import React from "react";
import { useShallow } from "zustand/react/shallow";

const selector = (state: AppState) => ({
  setSelectedNodeType: state.setSelectedNodeType,
});

function DnDSidebar() {
  const { setSelectedNodeType } = useStore(useShallow(selector));

  const onDragStart = (event: React.DragEvent, nodeType: AppNodeType) => {
    setSelectedNodeType(nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div>
      <div className="text-sm">
        You can drag these nodes to the pane on the right.
      </div>
      <div
        className="dndnode"
        onDragStart={(event) => onDragStart(event, "TEXT")}
        draggable
      >
        Text
      </div>
      <div
        className="dndnode"
        onDragStart={(event) => onDragStart(event, "VIDEO")}
        draggable
      >
        Youtube
      </div>
      <div
        className="dndnode"
        onDragStart={(event) => onDragStart(event, "IMAGE")}
        draggable
      >
        Image
      </div>
      <div
        className="dndnode"
        onDragStart={(event) => onDragStart(event, "LIVESTREAM")}
        draggable
      >
        Livestream
      </div>
      <div
        className="dndnode"
        onDragStart={(event) => onDragStart(event, "IMAGE_COMPUTE")}
        draggable
      >
        Image Compute
      </div>
    </div>
  );
}

export default DnDSidebar;
