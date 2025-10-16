//lib/aif/validate.ts
import type { AIFGraph, AnyNode, Edge, EdgeType, NodeType } from './types';

const VALID_EDGE_CONNECTIONS: Record<EdgeType, {from: NodeType[], to: NodeType[]}> = {
  premise: { from: ['I','RA'], to: ['RA','TA'] },
  conclusion: { from: ['RA'], to: ['I'] },
  presumption: { from: ['I'], to: ['RA','TA'] },
  conflicting: { from: ['I'], to: ['CA'] },
  conflicted: { from: ['CA'], to: ['I','RA'] },
  preferred: { from: ['I','RA'], to: ['PA'] },
  dispreferred: { from: ['PA'], to: ['I','RA'] },
  start: { from: ['L'], to: ['TA'] },
  end: { from: ['TA'], to: ['L'] },
};

export function validateEdge(edge: Edge, source: AnyNode, target: AnyNode): string[] {
  const errors: string[] = [];
  if (source.nodeType === 'I' && target.nodeType === 'I') {
    errors.push('I-nodes cannot connect directly.');
  }
  const rule = VALID_EDGE_CONNECTIONS[edge.edgeType];
  if (!rule) {
    errors.push(`Unknown edge type ${edge.edgeType}`);
    return errors;
  }
  if (!rule.from.includes(source.nodeType) || !rule.to.includes(target.nodeType)) {
    errors.push(`Invalid ${edge.edgeType} edge: ${source.nodeType} -> ${target.nodeType}`);
  }
  if (edge.sourceId === edge.targetId) {
    errors.push('Self-loops are not allowed.');
  }
  return errors;
}

export function validateGraph(graph: AIFGraph): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // No I->I edges & type-safe endpoints
  for (const e of graph.edges) {
    const s = graph.nodes.find(n => n.id === e.sourceId);
    const t = graph.nodes.find(n => n.id === e.targetId);
    if (!s || !t) {
      errors.push(`Edge ${e.id} references missing node(s).`);
      continue;
    }
    errors.push(...validateEdge(e, s, t));
  }

  // RA must have exactly one conclusion
  const raNodes = graph.nodes.filter(n => n.nodeType === 'RA');
  for (const ra of raNodes) {
    const outConcls = graph.edges.filter(e => e.sourceId === ra.id && e.edgeType === 'conclusion');
    if (outConcls.length !== 1) {
      errors.push(`RA-node ${ra.id} must have exactly one conclusion (has ${outConcls.length}).`);
    }
  }

  // CA/PA cardinalities
  const caNodes = graph.nodes.filter(n => n.nodeType === 'CA');
  for (const ca of caNodes) {
    const incom = graph.edges.filter(e => e.targetId === ca.id && e.edgeType === 'conflicting');
    const out = graph.edges.filter(e => e.sourceId === ca.id && e.edgeType === 'conflicted');
    if (incom.length !== 1 || out.length !== 1) {
      errors.push(`CA-node ${ca.id} must have exactly one conflicting in and one conflicted out.`);
    }
  }

  const paNodes = graph.nodes.filter(n => n.nodeType === 'PA');
  for (const pa of paNodes) {
    const incom = graph.edges.filter(e => e.targetId === pa.id && e.edgeType === 'preferred');
    const out = graph.edges.filter(e => e.sourceId === pa.id && e.edgeType === 'dispreferred');
    if (incom.length !== 1 || out.length !== 1) {
      errors.push(`PA-node ${pa.id} must have exactly one preferred in and one dispreferred out.`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}
