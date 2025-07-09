import { getWorkflowAction } from "@/lib/workflowActions";
import { registerDefaultWorkflowActions } from "@/lib/registerDefaultWorkflowActions";

test("registers default actions", () => {
  registerDefaultWorkflowActions();
  expect(getWorkflowAction("createRandomLineGraph")).toBeDefined();
  expect(getWorkflowAction("gmail:sendEmail")).toBeDefined();
  expect(getWorkflowAction("github:latestIssue")).toBeUndefined();
  expect(getWorkflowAction("slack:sendMessage")).toBeUndefined();
});

