import { NodeProps } from "@xyflow/react";
import { PluginDescriptor } from "@/lib/pluginLoader";

function SplineViewerNode({ id }: NodeProps<any>) {
  return <div className="bg-blue-200 p-2 rounded">Spline viewer {id}</div>;
}

export const descriptor: PluginDescriptor = {
  type: "SPLINE_VIEWER",
  component: SplineViewerNode,
  config: { label: "Spline Viewer" },
};

export default SplineViewerNode;
