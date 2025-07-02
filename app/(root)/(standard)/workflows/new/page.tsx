import WorkflowBuilder from "@/components/workflow/WorkflowBuilder";
import { createWorkflow } from "@/lib/actions/workflow.actions";

export default function Page() {
  return (
    <WorkflowBuilder
      onSave={async (graph) => {
        "use server";
        const workflow = await createWorkflow({ name: "New Workflow", graph });
        return { id: workflow.id.toString() };
      }}
    />
  );
}
