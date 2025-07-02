export interface WorkflowNode {
  id: string;
  type: string;
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

export async function executeWorkflow(
  graph: WorkflowGraph,
  actions: Record<string, () => Promise<void>>,
  evaluate: (condition: string) => boolean = () => true
): Promise<string[]> {
  const executed: string[] = [];
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
  let current = graph.nodes[0];
  while (current) {
    const act = actions[current.id];
    if (act) {
      await act();
    }
    executed.push(current.id);
    const outgoing = graph.edges.filter((e) => e.source === current.id);
    if (outgoing.length === 0) break;
    const nextEdge = outgoing.find((e) => !e.condition || evaluate(e.condition));
    if (!nextEdge) break;
    current = nodeMap.get(nextEdge.target);
  }
  return executed;
}
