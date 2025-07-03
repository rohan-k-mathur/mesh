import { getWorkflowAction } from "@/lib/workflowActions";
import { registerDefaultWorkflowActions } from "@/lib/registerDefaultWorkflowActions";

test("registers default actions", () => {
  registerDefaultWorkflowActions();
  expect(getWorkflowAction("github:latestIssue")).toBeDefined();
  expect(getWorkflowAction("slack:sendMessage")).toBeDefined();
});
