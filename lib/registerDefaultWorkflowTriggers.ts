import { registerWorkflowTriggerType } from "@/lib/workflowTriggers";

export function registerDefaultWorkflowTriggers() {
  registerWorkflowTriggerType("manual:start");
  registerWorkflowTriggerType("schedule:cron");
  registerWorkflowTriggerType("onClick");
}
