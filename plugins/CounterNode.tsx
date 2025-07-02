import { useState } from "react";
import { NodeProps } from "@xyflow/react";
import { PluginDescriptor } from "@/lib/pluginLoader";

function CounterNode({ id }: NodeProps<any>) {
  const [count, setCount] = useState(0);
  return (
    <div className="bg-purple-200 p-2 rounded" onClick={() => setCount(count + 1)}>
      {id}: {count}
    </div>
  );
}

export const descriptor: PluginDescriptor = {
  type: "COUNTER",
  component: CounterNode,
  config: { label: "Counter" },
};

export default CounterNode;
