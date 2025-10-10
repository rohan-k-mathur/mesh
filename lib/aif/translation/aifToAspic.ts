// src/lib/aif/translation/aifToAspic.ts
import type { AIFGraph } from '../types';

export interface Rule {
  id: string;
  antecedents: string[];
  consequent: string;
  type: 'strict' | 'defeasible';
}

export interface ArgumentationTheory {
  language: Set<string>;
  contraries: Map<string, Set<string>>;
  strictRules: Rule[];
  defeasibleRules: Rule[];
  axioms: Set<string>;
  premises: Set<string>;
  assumptions: Set<string>;
}

export function aifToASPIC(graph: AIFGraph): ArgumentationTheory {
  const language = new Set<string>();
  const contraries = new Map<string, Set<string>>();
  const strictRules: Rule[] = [];
  const defeasibleRules: Rule[] = [];
  const axioms = new Set<string>();
  const premises = new Set<string>();
  const assumptions = new Set<string>();

  // Language: all I-node contents + RA ids
  for (const n of graph.nodes) {
    if (n.nodeType === 'I') language.add(n.content);
    if (n.nodeType === 'RA') language.add(n.id);
  }

  // KB: initial I-nodes (no predecessors)
  const incomingByTarget = new Map<string, number>();
  for (const e of graph.edges) {
    incomingByTarget.set(e.targetId, (incomingByTarget.get(e.targetId) ?? 0) + 1);
  }
  for (const n of graph.nodes) {
    if (n.nodeType !== 'I') continue;
    const incoming = incomingByTarget.get(n.id) ?? 0;
    if (incoming === 0) {
      // Default: ordinary premise (can be overridden via metadata if needed)
      premises.add(n.content);
    }
  }

  // Rules from RA: premises -> conclusion
  for (const ra of graph.nodes.filter(n => n.nodeType === 'RA')) {
    const premiseEdges = graph.edges.filter(e => e.targetId === ra.id && e.edgeType === 'premise');
    const antecedents = premiseEdges.map(e => {
      const src = graph.nodes.find(n => n.id === e.sourceId);
      return src?.content ?? '';
    }).filter(Boolean);

    const concl = graph.edges.find(e => e.sourceId === ra.id && e.edgeType === 'conclusion');
    if (!concl) continue;
    const conclNode = graph.nodes.find(n => n.id === concl.targetId);
    if (!conclNode) continue;

    const type = (ra as any).schemeType === 'deductive' ? 'strict' : 'defeasible';
    const rule = { id: ra.id, antecedents, consequent: (conclNode as any).content, type } as Rule;
    if (type === 'strict') strictRules.push(rule); else defeasibleRules.push(rule);
  }

  // Contraries from CA
  for (const ca of graph.nodes.filter(n => n.nodeType === 'CA')) {
    const attackerE = graph.edges.find(e => e.targetId === ca.id && e.edgeType === 'conflicting');
    const attackedE = graph.edges.find(e => e.sourceId === ca.id && e.edgeType === 'conflicted');
    if (!attackerE || !attackedE) continue;
    const attackerNode = graph.nodes.find(n => n.id === attackerE.sourceId);
    const attackedNode = graph.nodes.find(n => n.id === attackedE.targetId);
    if (!attackerNode || !attackedNode) continue;

    const attackerSymbol = attackerNode.nodeType === 'I' ? attackerNode.content : attackerNode.id;
    const attackedSymbol = attackedNode.nodeType === 'I' ? attackedNode.content : attackedNode.id;

    if (!contraries.has(attackerSymbol)) contraries.set(attackerSymbol, new Set());
    contraries.get(attackerSymbol)!.add(attackedSymbol);
  }

  return { language, contraries, strictRules, defeasibleRules, axioms, premises, assumptions };
}
