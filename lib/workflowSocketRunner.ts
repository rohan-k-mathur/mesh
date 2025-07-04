import { EventEmitter } from "events";
import { WorkflowGraph, defaultEvaluate } from "./workflowExecutor";

export async function runWorkflowWithSocket(
  graph: WorkflowGraph,
  actions: Record<string, () => Promise<any>>,
  emitter: EventEmitter,
  evaluate: (condition: string, context?: Record<string, any>) => boolean = defaultEvaluate,
  context: Record<string, any> = {}
): Promise<void> {
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
  let current = graph.nodes[0];
  while (current) {
    emitter.emit("update", current.id);
    const actionKey = current.action ?? current.id;
    await actions[actionKey]?.();
    const outgoing = graph.edges.filter((e) => e.source === current.id);
    if (outgoing.length === 0) break;
    const nextEdge = outgoing.find(
      (e) => !e.condition || evaluate(e.condition, context)
    );
    if (!nextEdge) break;
    current = nodeMap.get(nextEdge.target)!;
  }
  emitter.emit("done");
}
