import WorkflowBuilder from "@/components/workflow/WorkflowBuilder";
import { createWorkflow } from "@/lib/actions/workflow.actions";
import { ReactFlowProvider } from "@xyflow/react";
import React from "react";
import Modal from "@/components/modals/Modal";
import IntegrationButtons from "@/components/workflow/IntegrationButtons";

export default function Page() {
  return (
    <div className="relative -top-12">
      <IntegrationButtons />
      <div className="w-[100%] h-full border-2 border-blue overscroll-none">
        <ReactFlowProvider>
          <Modal />
          <WorkflowBuilder
            onSave={async (graph) => {
              "use server";
              const workflow = await createWorkflow({
                name: "New Workflow",
                graph,
              });
              return { id: workflow.id.toString() };
            }}
          />
        </ReactFlowProvider>
      </div>
    </div>
  );
}
