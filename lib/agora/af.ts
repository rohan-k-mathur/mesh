// lib/agora/af.ts
import type { DebateNode, DebateEdge } from './types/types';


// Project debate edges into AF attacks
export function projectToAF(nodes: DebateNode[], edges: DebateEdge[]) {
  const ids = nodes.map(n => n.id);
  const attacks: Array<[string, string]> = [];
  for (const e of edges) {
    if (e.kind === 'rebuts' || e.kind === 'objects' || e.kind === 'undercuts') {
      attacks.push([e.fromId, e.toId]);
    }
  }
  return { ids, attacks };
}
