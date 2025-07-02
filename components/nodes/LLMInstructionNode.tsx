"use client";

import { runLLMInstruction } from "@/lib/actions/llm.actions";
import { useAuth } from "@/lib/AuthContext";
import useStore from "@/lib/reactflow/store";
import { AppState, LLMInstructionNode as LLMNodeType } from "@/lib/reactflow/types";
import { NodeProps, getOutgoers } from "@xyflow/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import BaseNode from "./BaseNode";
import { fetchUser } from "@/lib/actions/user.actions";
import { useShallow } from "zustand/react/shallow";

function LLMInstructionNode({ id, data }: NodeProps<LLMNodeType>) {
  const path = usePathname();
  const currentUser = useAuth().user;
  const store = useStore(
    useShallow((state: AppState) => ({
      nodes: state.nodes,
      edges: state.edges,
      setNodes: state.setNodes,
    }))
  );
  const [prompt, setPrompt] = useState(data.prompt);
  const [output, setOutput] = useState(data.output);
  const [status, setStatus] = useState<"pending" | "running" | "complete">(
    data.status || "pending"
  );
  const [author, setAuthor] = useState(data.author);

  useEffect(() => {
    if ("username" in author) return;
    fetchUser(data.author.id).then((u) => u && setAuthor(u));
  }, [data.author]);

  const isOwned = currentUser ? Number(currentUser.userId) === Number(data.author.id) : false;

  const runInstruction = async () => {
    setStatus("running");
    try {
      const result = await runLLMInstruction({ prompt, model: data.model });
      setOutput(result);
      setStatus("complete");
      const updatedNodes = store.nodes.map((n) => {
        if (n.id === id && n.type === "LLM_INSTRUCTION") {
          return { ...n, data: { ...(n as any).data, prompt, output: result, status: "complete" } } as LLMNodeType;
        }
        if (n.id !== id && n.type === "LLM_INSTRUCTION") {
          return n;
        }
        return n;
      });
      const outgoers = getOutgoers({ id }, store.nodes, store.edges);
      outgoers.forEach((node) => {
        if (node.type === "LLM_INSTRUCTION") {
          (node as any).data.prompt = result;
        }
      });
      store.setNodes(updatedNodes);
    } catch (err) {
      console.error(err);
      setStatus("pending");
    }
  };

  return (
    <BaseNode
      modalContent={null}
      id={id}
      author={author}
      isOwned={isOwned}
      type={"LLM_INSTRUCTION"}
      generateOnClick={runInstruction}
      isLocked={data.locked}
    >
      <div className="flex flex-col gap-2 p-2">
        <textarea
          className="w-full rounded text-black p-1 text-sm"
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <div className="text-xs">Status: {status}</div>
        <div className="border rounded p-2 text-sm min-h-[3rem] bg-white text-black">
          {output || "No output"}
        </div>
      </div>
    </BaseNode>
  );
}

export default LLMInstructionNode;
