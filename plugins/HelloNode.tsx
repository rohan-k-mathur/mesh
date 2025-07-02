import { NodeProps } from "@xyflow/react";
import { PluginDescriptor } from "@/lib/pluginLoader";

function HelloNode({ id }: NodeProps<any>) {
  return <div className="bg-green-200 p-2 rounded">Hello from plug-in {id}</div>;
}

export const descriptor: PluginDescriptor = {
  type: "HELLO", 
  component: HelloNode,
  config: { label: "Hello" },
};

export default HelloNode;
