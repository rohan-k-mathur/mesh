import React from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getBezierPath,
  getSmoothStepPath,

  MarkerType,
  useReactFlow,
} from "@xyflow/react";
import { deleteRealtimeEdge } from "@/lib/actions/realtimeedge.actions";
import useStore from "@/lib/reactflow/store";
import { useShallow } from "zustand/react/shallow";
import { AppState } from "@/lib/reactflow/types";

export default function DefaultEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = { strokeWidth: 2, stroke: "#ffffff" },
  markerEnd = MarkerType.ArrowClosed,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 4,

  });
  const store = useStore(
    useShallow((state: AppState) => ({
      removeEdge: state.removeEdge,
    }))
  );

  const onEdgeClick = () => {
    store.removeEdge(id);
    deleteRealtimeEdge({
      id: id,
    });
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 12,
            pointerEvents: "all",
          }}
        >
          <button className="edgebutton  shadow-none hover:bg-slate-500" onClick={onEdgeClick}>
            x
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
