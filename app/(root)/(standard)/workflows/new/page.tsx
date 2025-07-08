import NewWorkflowClient from "@/components/workflow/NewWorkflowClient";
import { createWorkflow, WorkflowGraph } from "@/lib/actions/workflow.actions";
import React from "react";

export default function Page() {
  async function handleSave(graph: WorkflowGraph, name: string) {
    "use server";
    const workflow = await createWorkflow({ name, graph });
    return { id: workflow.id.toString() };
  }

  return <NewWorkflowClient onSave={handleSave} />;
}
