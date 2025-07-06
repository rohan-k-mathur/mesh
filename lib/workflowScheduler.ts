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

import cron from "node-cron";
import { prisma } from "@/lib/prismaclient";
import { WorkflowGraph } from "@/lib/actions/workflow.actions";
import { executeWorkflow } from "@/lib/workflowExecutor";
import { getWorkflowAction } from "@/lib/workflowActions";
import { registerWorkflowTrigger } from "@/lib/workflowTriggers";

async function runWorkflow(workflowId: bigint) {
  const workflow = await prisma.workflow.findUniqueOrThrow({ where: { id: workflowId } });
  const graph = workflow.graph as WorkflowGraph;
  const actions: Record<string, () => Promise<string | void>> = {};
  for (const node of graph.nodes) {
    const act = node.action ? getWorkflowAction(node.action) : undefined;
    actions[node.action ?? node.id] = act ?? (async () => {});
  }
  await executeWorkflow(graph, actions);
}

export async function startWorkflowScheduler() {
  const schedules = await prisma.scheduledWorkflow.findMany();
  for (const sched of schedules) {
    if (sched.cron) {
      cron.schedule(sched.cron, async () => {
        await runWorkflow(sched.workflow_id);
      });
    }
    if (sched.trigger) {
      registerWorkflowTrigger(sched.trigger, async () => {
        await runWorkflow(sched.workflow_id);
      });
    }
  }
}
