import { registerWorkflowAction } from "@/lib/workflowActions";

export function registerDefaultWorkflowActions() {
  registerWorkflowAction("createRandomLineGraph", async () => {
    // action handled in WorkflowRunner
  });
}
