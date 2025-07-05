"use client";

import { useCallback, useEffect, useState } from "react";
import { NodeProps, NodeTypes } from "@xyflow/react";
import { WorkflowGraph } from "@/lib/workflowExecutor";
import {
  WorkflowExecutionProvider,
  useWorkflowExecution,
} from "../WorkflowExecutionContext";
import { WorkflowRunnerInner } from "../WorkflowRunner";
import { registerWorkflowAction, getWorkflowAction } from "@/lib/workflowActions";
import { fetchIntegrations } from "@/lib/actions/integration.actions";
import SendEmailModal from "@/components/modals/SendEmailModal";
import useStore from "@/lib/reactflow/store";
import { AppState } from "@/lib/reactflow/types";
import { useShallow } from "zustand/react/shallow";

function TriggerNode({ data }: NodeProps) {
  return (
    <div className="p-2 bg-white border rounded">
      <button className="nodrag" onClick={data.onTrigger}>
        Send Email
      </button>
    </div>
  );
}

function ActionNode() {
  return <div className="p-2 bg-white border rounded">Email Modal</div>;
}

function ExampleInner() {
  const { run } = useWorkflowExecution();
  const { openModal } = useStore(
    useShallow((state: AppState) => ({ openModal: state.openModal }))
  );
  const [cred, setCred] = useState<{ email: string; accessToken: string } | null>(
    null
  );

  useEffect(() => {
    fetchIntegrations().then((list) => {
      const gmail = list.find((i) => i.service === "gmail");
      if (gmail) {
        try {
          const c = JSON.parse(gmail.credential);
          if (c.email && c.accessToken) {
            setCred({ email: c.email, accessToken: c.accessToken });
          }
        } catch {
          // ignore json errors
        }
      }
    });
  }, []);

  useEffect(() => {
    registerWorkflowAction("openEmailModal", async () => {
      if (cred) {
        openModal(
          <SendEmailModal from={cred.email} accessToken={cred.accessToken} />
        );
      }
    });
  }, [cred, openModal]);

  const handleTrigger = useCallback(() => {
    const actions = {
      openEmailModal: getWorkflowAction("openEmailModal") ?? (async () => {})
    };
    const graph: WorkflowGraph = {
      nodes: [
        {
          id: "trigger",
          type: "trigger",
          action: "openEmailModal",
          data: { onTrigger: handleTrigger },
          position: { x: 0, y: 0 },
        },
        { id: "action", type: "action", position: { x: 150, y: 0 } },
      ],
      edges: [{ id: "e1", source: "trigger", target: "action" }],
    };
    run(graph, actions);
  }, [run]);

  useEffect(() => {
    if (cred) {
      handleTrigger();
    }
  }, [cred, handleTrigger]);

  const graph: WorkflowGraph = {
    nodes: [
      {
        id: "trigger",
        type: "trigger",
        action: "openEmailModal",
        data: { onTrigger: handleTrigger },
        position: { x: 0, y: 0 },
      },
      { id: "action", type: "action", position: { x: 150, y: 0 } },
    ],
    edges: [{ id: "e1", source: "trigger", target: "action" }],
  };

  const nodeTypes: NodeTypes = { trigger: TriggerNode, action: ActionNode };

  return <WorkflowRunnerInner graph={graph} nodeTypes={nodeTypes} />;
}

export default function GmailFlowExample() {
  return (
    <WorkflowExecutionProvider>
      <ExampleInner />
    </WorkflowExecutionProvider>
  );
}
