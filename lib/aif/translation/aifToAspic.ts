// // src/lib/aif/translation/aifToAspic.ts
// import type { AIFGraph } from '../types';

// export interface Rule {
//   id: string;
//   antecedents: string[];
//   consequent: string;
//   type: 'strict' | 'defeasible';
// }

// export interface ArgumentationTheory {
//   language: Set<string>;
//   contraries: Map<string, Set<string>>;
//   strictRules: Rule[];
//   defeasibleRules: Rule[];
//   axioms: Set<string>;
//   premises: Set<string>;
//   assumptions: Set<string>;
// }

// export function aifToASPIC(graph: AIFGraph): ArgumentationTheory {
//   const language = new Set<string>();
//   const contraries = new Map<string, Set<string>>();
//   const strictRules: Rule[] = [];
//   const defeasibleRules: Rule[] = [];
//   const axioms = new Set<string>();
//   const premises = new Set<string>();
//   const assumptions = new Set<string>();

//   // Language: all I-node contents + RA ids
//   for (const n of graph.nodes) {
//     if (n.nodeType === 'I') language.add(n.content);
//     if (n.nodeType === 'RA') language.add(n.id);
//   }

//   // KB: initial I-nodes (no predecessors)
//   const incomingByTarget = new Map<string, number>();
//   for (const e of graph.edges) {
//     incomingByTarget.set(e.targetId, (incomingByTarget.get(e.targetId) ?? 0) + 1);
//   }
//   for (const n of graph.nodes) {
//     if (n.nodeType !== 'I') continue;
//     const incoming = incomingByTarget.get(n.id) ?? 0;
//     if (incoming === 0) {
//       // Default: ordinary premise (can be overridden via metadata if needed)
//       premises.add(n.content);
//     }
//   }

//   // Rules from RA: premises -> conclusion
//   for (const ra of graph.nodes.filter(n => n.nodeType === 'RA')) {
//     const premiseEdges = graph.edges.filter(e => e.targetId === ra.id && e.edgeType === 'premise');
//     const antecedents = premiseEdges.map(e => {
//       const src = graph.nodes.find(n => n.id === e.sourceId);
//       return src?.content ?? '';
//     }).filter(Boolean);

//     const concl = graph.edges.find(e => e.sourceId === ra.id && e.edgeType === 'conclusion');
//     if (!concl) continue;
//     const conclNode = graph.nodes.find(n => n.id === concl.targetId);
//     if (!conclNode) continue;

//     const type = (ra as any).schemeType === 'deductive' ? 'strict' : 'defeasible';
//     const rule = { id: ra.id, antecedents, consequent: (conclNode as any).content, type } as Rule;
//     if (type === 'strict') strictRules.push(rule); else defeasibleRules.push(rule);
//   }

//   // Contraries from CA
//   for (const ca of graph.nodes.filter(n => n.nodeType === 'CA')) {
//     const attackerE = graph.edges.find(e => e.targetId === ca.id && e.edgeType === 'conflicting');
//     const attackedE = graph.edges.find(e => e.sourceId === ca.id && e.edgeType === 'conflicted');
//     if (!attackerE || !attackedE) continue;
//     const attackerNode = graph.nodes.find(n => n.id === attackerE.sourceId);
//     const attackedNode = graph.nodes.find(n => n.id === attackedE.targetId);
//     if (!attackerNode || !attackedNode) continue;

//     const attackerSymbol = attackerNode.nodeType === 'I' ? attackerNode.content : attackerNode.id;
//     const attackedSymbol = attackedNode.nodeType === 'I' ? attackedNode.content : attackedNode.id;

//     if (!contraries.has(attackerSymbol)) contraries.set(attackerSymbol, new Set());
//     contraries.get(attackerSymbol)!.add(attackedSymbol);
//   }

//   return { language, contraries, strictRules, defeasibleRules, axioms, premises, assumptions };
// }
// lib/aif/translation/aifToAspic.ts
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
  preferences: Array<{ preferred: string; dispreferred: string }>; // NEW: from PA-nodes
}

export function aifToASPIC(graph: AIFGraph): ArgumentationTheory {
  const language = new Set<string>();
  const contraries = new Map<string, Set<string>>();
  const strictRules: Rule[] = [];
  const defeasibleRules: Rule[] = [];
  const axioms = new Set<string>();
  const premises = new Set<string>();
  const assumptions = new Set<string>();
  const preferences: Array<{ preferred: string; dispreferred: string }> = [];

  const incomingByTarget = new Map<string, number>();
  for (const e of graph.edges) incomingByTarget.set(e.targetId, (incomingByTarget.get(e.targetId) ?? 0) + 1);

  // Language base
  for (const n of graph.nodes) {
    if (n.nodeType === 'I') language.add((n as any).content ?? (n as any).text ?? n.id);
    if (n.nodeType === 'RA') language.add(n.id);
  }

  // KB premises: I-nodes with no incoming edges
  for (const n of graph.nodes) {
    if (n.nodeType !== 'I') continue;
    const incoming = incomingByTarget.get(n.id) ?? 0;
    if (incoming === 0) premises.add((n as any).content ?? (n as any).text ?? n.id);
  }

  // RA: rules
  for (const ra of graph.nodes.filter(n => n.nodeType === 'RA')) {
    const premiseEdges = graph.edges.filter(e => e.targetId === ra.id && e.edgeType === 'premise');
    const antecedents = premiseEdges.map(e => {
      const src = graph.nodes.find(n => n.id === e.sourceId);
      return (src as any)?.content ?? (src as any)?.text ?? src?.id ?? '';
    }).filter(Boolean);

    const concl = graph.edges.find(e => e.sourceId === ra.id && e.edgeType === 'conclusion');
    if (!concl) continue;
    const conclNode = graph.nodes.find(n => n.id === concl.targetId);
    if (!conclNode) continue;

    const type = (ra as any).schemeType === 'deductive' ? 'strict' : 'defeasible';
    const rule = { id: ra.id, antecedents, consequent: (conclNode as any).content ?? (conclNode as any).text ?? conclNode.id, type } as Rule;
    (type === 'strict' ? strictRules : defeasibleRules).push(rule);
  }

  // CA: contraries
  for (const ca of graph.nodes.filter(n => n.nodeType === 'CA')) {
    const attackerE = graph.edges.find(e => e.targetId === ca.id && e.edgeType === 'conflicting');
    const attackedE = graph.edges.find(e => e.sourceId === ca.id && e.edgeType === 'conflicted');
    if (!attackerE || !attackedE) continue;
    const attackerNode = graph.nodes.find(n => n.id === attackerE.sourceId);
    const attackedNode = graph.nodes.find(n => n.id === attackedE.targetId);
    if (!attackerNode || !attackedNode) continue;

    const attackerSymbol = attackerNode.nodeType === 'I'
      ? ((attackerNode as any).content ?? (attackerNode as any).text ?? attackerNode.id)
      : attackerNode.id;
    const attackedSymbol = attackedNode.nodeType === 'I'
      ? ((attackedNode as any).content ?? (attackedNode as any).text ?? attackedNode.id)
      : attackedNode.id;

    if (!contraries.has(attackerSymbol)) contraries.set(attackerSymbol, new Set());
    contraries.get(attackerSymbol)!.add(attackedSymbol);
  }

  // PA: preferences (preferred over dispreferred)
  for (const pa of graph.nodes.filter(n => n.nodeType === 'PA')) {
    const prefE = graph.edges.find(e => e.targetId === pa.id && /preferred/i.test(e.edgeType));
    const dispE = graph.edges.find(e => e.sourceId === pa.id && /dispreferred/i.test(e.edgeType));
    if (!prefE || !dispE) continue;
    const prefNode = graph.nodes.find(n => n.id === prefE.sourceId);
    const dispNode = graph.nodes.find(n => n.id === dispE.targetId);
    if (!prefNode || !dispNode) continue;
    const preferred = prefNode.nodeType === 'I'
      ? ((prefNode as any).content ?? (prefNode as any).text ?? prefNode.id)
      : prefNode.id;
    const dispreferred = dispNode.nodeType === 'I'
      ? ((dispNode as any).content ?? (dispNode as any).text ?? dispNode.id)
      : dispNode.id;
    preferences.push({ preferred, dispreferred });
  }

  return { language, contraries, strictRules, defeasibleRules, axioms, premises, assumptions, preferences };
}
