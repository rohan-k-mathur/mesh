import WorkflowBuilder from "@/components/workflow/WorkflowBuilder";
import { createWorkflow, WorkflowGraph } from "@/lib/actions/workflow.actions";
import { ReactFlowProvider } from "@xyflow/react";
import React from "react";
import Modal from "@/components/modals/Modal";
import IntegrationButtons from "@/components/workflow/IntegrationButtons";
import analyticsTemplate from "@/templates/analytics-dashboard.json";

export default function Page() {
  async function handleSave(graph: WorkflowGraph, name: string) {
    "use server";
    const workflow = await createWorkflow({ name, graph });
    return { id: workflow.id.toString() };
  }

  const initialGraph = analyticsTemplate.graph as WorkflowGraph;

  return (
    <div className="relative -top-12 space-y-4">
      <IntegrationButtons />
      <p className="mx-2 text-sm">
        This builder starts with a sample analytics workflow fetching metrics,
        generating a report, and sending it via email or Slack. It demonstrates
        the unified analytics dashboard concept outlined in the product
        roadmap.
      </p>
      <div className="w-[100%] h-full border-2 border-blue overscroll-none">
        <ReactFlowProvider>
          <Modal />
          <WorkflowBuilder
            onSave={handleSave}
            initialGraph={initialGraph}
          />
        </ReactFlowProvider>
      </div>
    </div>
  );
}
