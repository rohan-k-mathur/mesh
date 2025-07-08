"use client";

import { NodeProps } from "@xyflow/react";

export function TriggerNode({ data }: NodeProps) {
  if (data.trigger === "onClick") {
    return (
      <div className="p-2 bg-white border rounded">
        <button className="nodrag" onClick={data.onTrigger}>
          Trigger
        </button>
      </div>
    );
  }
  return <div className="p-2 bg-white border rounded">{data.label}</div>;
}

export function ActionNode({ data }: NodeProps) {
  if (data.action === "createRandomLineGraph") {
    const points: [number, number][] = data.points || [];
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
      <div className="p-2 bg-white border rounded">
        <svg width={width} height={height}>
          <path d={path} fill="none" stroke="black" />
          {points.map((p, i) => (
            <circle key={i} cx={scaleX(p[0])} cy={scaleY(p[1])} r={3} fill="red" />
          ))}
        </svg>
      </div>
    );
  }
  return <div className="p-2 bg-white border rounded">{data.label}</div>;
}
