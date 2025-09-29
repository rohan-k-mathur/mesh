import { grounded, preferred } from '@/lib/argumentation/afEngine'; // you already have these
import { projectToAF } from './af';

export function computeAcceptance(nodes, edges, mode: 'grounded'|'preferred'|'hybrid') {
  const { ids, attacks } = projectToAF(nodes, edges);
  const labels: Record<string, 'undecided'|'skeptical-accepted'|'credulous-accepted'|'rejected'> = {};
  if (mode === 'grounded' || mode === 'hybrid') {
    const g = grounded(ids.map(id => ({ id })), attacks);
    for (const id of ids) labels[id] = g.in.has(id) ? 'skeptical-accepted'
                         : g.out.has(id) ? 'rejected'
                         : 'undecided';
  }
  if (mode === 'preferred' || mode === 'hybrid') {
    const p = preferred(ids.map(id => ({ id })), attacks);
    for (const id of ids) {
      if (labels[id] === 'undecided' && p.in.has(id)) labels[id] = 'credulous-accepted';
    }
  }
  return labels;
}
