import WorkflowBuilder from "@/components/workflow/WorkflowBuilder";
import { createWorkflow } from "@/lib/actions/workflow.actions";
import { ReactFlowProvider } from "@xyflow/react";

export default function Page() {
  return (
    <ReactFlowProvider>
      <WorkflowBuilder
        onSave={async (graph) => {
          "use server";
          const workflow = await createWorkflow({ name: "New Workflow", graph });
          return { id: workflow.id.toString() };
        }}
      />
    </ReactFlowProvider>
  );
}
