import WorkflowBuilder from "@/components/workflow/WorkflowBuilder";
import { createWorkflow } from "@/lib/actions/workflow.actions";

export default function Page() {
  return (
    <WorkflowBuilder
      onSave={async (graph) => {
        "use server";
        await createWorkflow({ name: "New Workflow", graph });
      }}
    />
  );
}
