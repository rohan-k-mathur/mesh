export type CQSuggestionType = 'undercut' | 'rebut';
export type RebutScope = 'premise' | 'conclusion';

export type CQSuggestion = {
  type: CQSuggestionType;
  scope?: RebutScope;
};

const MAP: Record<string, Record<string, CQSuggestion>> = {
  expert_opinion: {
    credibility: { type: 'undercut' },            // challenges the warrant
    consensus:   { type: 'rebut', scope: 'conclusion' }, // conclusion undermined
    context:     { type: 'rebut', scope: 'premise' },    // premise accuracy challenged
  },
  // consequences: {...}
  // analogy: {...}
};

export function suggestionForCQ(
  schemeKey: string,
  cqKey: string
): CQSuggestion | undefined {
  return MAP[schemeKey]?.[cqKey];
}
