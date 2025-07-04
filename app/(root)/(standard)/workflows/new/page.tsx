import WorkflowBuilder from "@/components/workflow/WorkflowBuilder";
import { createWorkflow } from "@/lib/actions/workflow.actions";
import { ReactFlowProvider } from "@xyflow/react";
import React from "react";
import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <div className="relative -top-12">
      <div className="mb-3 flex ">
      <Button className="p-4 mr-2">Connect Accounts </Button>
      <Button className="p-4 ">Configure Integrations </Button>
      </div>
    <div className="w-[100%] h-full border-2 border-blue overscroll-none">

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
    </div>
  );
}
