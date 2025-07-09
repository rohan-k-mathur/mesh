"use client";

import { Handle, NodeProps, Position } from "@xyflow/react";

export function TriggerNode({ data }: NodeProps) {
  let content: React.ReactNode;
  if (data?.trigger === "onClick") {
    content = (
      <button className="nodrag" onClick={data.onTrigger}>
        Trigger
      </button>
    );
  } else {
    content = data?.label;
  }
  return (
    <div className="relative p-2 bg-white border rounded">
      {content}
      <Handle
        type="target"
        position={Position.Top}
        className="orange-node_handle"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="orange-node_handle"
      />
    </div>
  );
}

export function ActionNode({ data }: NodeProps) {
  if (data?.action === "createRandomLineGraph") {
    const points: [number, number][] = data.points ?? [];
    const width = 200;
    const height = 100;
    if (points.length === 0) {
      return <div className="p-2 bg-white border rounded">No Data</div>;
    }
    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const scaleX = (x: number) => ((x - minX) / (maxX - minX || 1)) * width;
    const scaleY = (y: number) => height - ((y - minY) / (maxY - minY || 1)) * height;
    const path = points
      .map((p, i) => `${i === 0 ? "M" : "L"}${scaleX(p[0])},${scaleY(p[1])}`)
      .join(" ");
    return (
      <div className="relative p-2 bg-white border rounded">
        <svg width={width} height={height}>
          <path d={path} fill="none" stroke="black" />
          {points.map((p, i) => (
            <circle key={i} cx={scaleX(p[0])} cy={scaleY(p[1])} r={3} fill="red" />
          ))}
        </svg>
        <Handle
          type="target"
          position={Position.Top}
          className="orange-node_handle"
        />
        <Handle
          type="source"
          position={Position.Bottom}
          className="orange-node_handle"
        />
      </div>
    );
  }
  return (
    <div className="relative p-2 bg-white border rounded">
      {data?.label}
      <Handle
        type="target"
        position={Position.Top}
        className="orange-node_handle"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="orange-node_handle"
      />
    </div>
  );
}
