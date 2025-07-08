import NewWorkflowClient from "@/components/workflow/NewWorkflowClient";
import { createWorkflow, WorkflowGraph } from "@/lib/actions/workflow.actions";
import React from "react";

export const metadata = {
  title: "New Workflow",
  description:
    "Start building with the analytics dashboard template and schedule automated reports.",
};

export default function Page() {
  async function handleSave(graph: WorkflowGraph, name: string) {
    "use server";
    const workflow = await createWorkflow({ name, graph });
    return { id: workflow.id.toString() };
  }

  return (
    <section className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Create Workflow</h1>
      <p className="text-sm text-gray-600">
        This page initializes a sample analytics workflow that fetches sales and
        social metrics, aggregates the data, and sends a report via email or
        Slack.
      </p>
      <NewWorkflowClient onSave={handleSave} />
    </section>
  );
}
