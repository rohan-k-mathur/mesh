export interface WorkflowNode {
  id: string;
  type: string;
  action?: string;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
}

export interface WorkflowGraph {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export function defaultEvaluate(
  condition: string,
  context: Record<string, any> = {}
): boolean {
  try {
    const vm = require("vm");
    const script = new vm.Script(condition);
    const sandbox = { ...context };
    const result = script.runInNewContext(sandbox);
    return !!result;
  } catch {
    return false;
  }
}

export type ConditionEvaluator = (
  condition: string,
  context?: Record<string, any>
) => boolean;

export async function executeWorkflow(
  graph: WorkflowGraph,
  actions: Record<string, () => Promise<any>>,
  evaluate: ConditionEvaluator = () => true,
  context: Record<string, any> = {},
  onNodeExecuted?: (id: string) => void
): Promise<string[]> {
  const executed: string[] = [];
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
  let current = graph.nodes[0];
  while (current) {
    const actionKey = current.action ?? current.id;
    const act = actions[actionKey];
    if (act) {
      await act();
    }
    executed.push(current.id);
    if (onNodeExecuted) onNodeExecuted(current.id);
    const outgoing = graph.edges.filter((e) => e.source === current.id);
    if (outgoing.length === 0) break;
    const nextEdge = outgoing.find(
      (e) => !e.condition || evaluate(e.condition, context)
    );
    if (!nextEdge) break;
    current = nodeMap.get(nextEdge.target);
  }
  return executed;
}
