import { EventEmitter } from "events";
import { WorkflowGraph } from "./workflowExecutor";
import { runWorkflowWithSocket } from "./workflowSocketRunner";

export function scheduleWorkflow(
  graph: WorkflowGraph,
  actions: Record<string, () => Promise<any>>,
  delay: number,
  emitter: EventEmitter
): NodeJS.Timeout {
  return setTimeout(() => {
    void runWorkflowWithSocket(graph, actions, emitter);
  }, delay);
}
