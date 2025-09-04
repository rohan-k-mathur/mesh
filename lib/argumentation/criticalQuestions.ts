// lib/argumentation/criticalQuestions.ts
export type SchemeId = 'ExpertOpinion' | 'Consequences' | 'Analogy' | 'Sign';

export type CriticalQuestion = { id: string; text: string; severity?: 'low'|'med'|'high' };

const CQS: Record<SchemeId, CriticalQuestion[]> = {
  ExpertOpinion: [
    { id: 'eo-1', text: 'Is the cited person a genuine expert in the relevant domain?', severity: 'high' },
    { id: 'eo-2', text: 'Is the expert unbiased and credible (conflicts of interest disclosed)?', severity: 'high' },
    { id: 'eo-3', text: 'Did the expert actually assert the stated claim?', severity: 'med' },
    { id: 'eo-4', text: 'Is the expert’s field relevant to the specific claim?', severity: 'med' },
    { id: 'eo-5', text: 'Is the expert view consistent with the balance of expert opinion?', severity: 'med' },
  ],
  Consequences: [
    { id: 'ac-1', text: 'Are the predicted consequences likely (with evidence/uncertainty)?', severity: 'high' },
    { id: 'ac-2', text: 'Are important consequences (incl. side-effects) omitted?', severity: 'high' },
    { id: 'ac-3', text: 'Are value trade-offs explicit and reasonable?', severity: 'med' },
    { id: 'ac-4', text: 'Are there alternatives with better net consequences?', severity: 'med' },
  ],
  Analogy: [
    { id: 'an-1', text: 'Are the compared cases alike in the relevant respects?', severity: 'high' },
    { id: 'an-2', text: 'Are there critical disanalogies that weaken the analogy?', severity: 'high' },
  ],
  Sign: [
    { id: 'sg-1', text: 'Is the cited sign reliably correlated with the conclusion?', severity: 'high' },
    { id: 'sg-2', text: 'Could there be confounders producing the same sign?', severity: 'high' },
  ],
};

/** Heuristic scheme hints from shallow features (optional). */
export function inferSchemesFromText(text: string): SchemeId[] {
  const t = text.toLowerCase();
  const out = new Set<SchemeId>();
  if (/(phd|m\.?d\.?|prof|dr\.|licensed|certified|peer[-\s]reviewed|randomized|trial|cohort)/i.test(text)) {
    out.add('ExpertOpinion');
  }
  if (/(cost[-\s]?benefit|economic|security|threat|risk|burden|benefit|impact)/i.test(text)) {
    out.add('Consequences');
  }
  if (/\b(like|similar to|as if|as though|akin to)\b/i.test(text)) out.add('Analogy');
  if (/\b(sign|indicator|symptom|signal|proxy)\b/i.test(text)) out.add('Sign');
  return Array.from(out.size ? out : ['Consequences']); // default to consequences
}

export function questionsForScheme(s: SchemeId): CriticalQuestion[] {
  return CQS[s] || [];
}

/**
 * Convert unresolved critical questions to *implicit undercuts* on an argument.
 * Each unresolved CQ creates a virtual node "cq:<id>" that undercuts targetId.
 */
export function cqUndercuts(targetId: string, unresolved: CriticalQuestion[]) {
  const nodes = unresolved.map(q => ({ id: `cq:${targetId}:${q.id}`, label: `CQ: ${q.id}`, text: q.text }));
  const edges = unresolved.map(q => ({ from: `cq:${targetId}:${q.id}`, to: targetId, type: 'undercut' as const }));
  return { nodes, edges };
}
