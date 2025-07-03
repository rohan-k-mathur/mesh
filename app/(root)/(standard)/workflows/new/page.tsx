import WorkflowBuilder from "@/components/workflow/WorkflowBuilder";
import { createWorkflow } from "@/lib/actions/workflow.actions";
import { ReactFlowProvider } from "@xyflow/react";
import React from "react";

export default function Page() {
  return (
    <div className="w-[100%] h-full border-2 border-blue">
    <ReactFlowProvider>
      <WorkflowBuilder
        onSave={async (graph) => {
          "use server";
          const workflow = await createWorkflow({ name: "New Workflow", graph });
          return { id: workflow.id.toString() };
        }}
      />
    </ReactFlowProvider>
    </div>
  );
}
