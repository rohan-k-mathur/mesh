// packages/entail/dialogical.ts
// Minimal dialogical entailment helper (no DB). Classical patterns only.

export type EntailStatus = 'ENTAILED' | 'UNDECIDED' | 'CONTRADICTS';

export type EntailRequest = {
  textSentences: string[];        // T
  hypothesis: string;             // H
  nliAssist?: boolean;            // optional hook (not used here yet)
};

export type EntailRule =
  | 'AND_ELIM'          // A ∧ B ⟹ A or B
  | 'MODUS_PONENS'      // A, (A → B) ⟹ B
  | 'UNIVERSAL_INSTANT' // All X are Y; Z is X ⟹ Z is Y
  | 'DIRECT_MATCH'      // H appears directly in facts
  | 'NEGATION_CONFLICT' // ┴ via conflicting negative
  ;

export type EntailTraceStep = {
  rule: EntailRule;
  used: string[];       // human-readable premises used in this step
  derived?: string;     // conclusion obtained in this step
};

export type EntailResponse = {
  status: EntailStatus;
  derived: string[];           // fact closure (strings)
  usedRules: EntailRule[];     // applied rules in order
  steps: EntailTraceStep[];    // “proof-ish” breadcrumb
  classicalPatterns: EntailRule[]; // alias of usedRules (for UI label)
};

/** ---------- Light normalization ---------- */
function norm(s: string): string {
  return s
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.?!]+$/g, '')
    .toLowerCase();
}

/** Primitive shapes we recognize */
type Prem =
  | { kind: 'atom'; text: string }
  | { kind: 'imp';  antecedent: string; consequent: string }                 // A -> B
  | { kind: 'and';  parts: string[] }                                        // A and B
  | { kind: 'all';  subj: string; pred: string }                             // all X are Y  (predicate-level)
  | { kind: 'is';   entity: string; type: string }                           // Z is X
  | { kind: 'no';   subj: string; pred: string };                            // no X are Y   (for conflicts)



// --- NEW: ultra-light lemmatizer for noun types ---
function lemmaType(s: string): string {
    const x = norm(s);
    // special plurals first
    if (x.endsWith('men')) return x.replace(/men$/, 'man');
    if (x.endsWith('women')) return x.replace(/women$/, 'woman');
    // crude plural strip
    return x.replace(/^(an?\s+)?/, '').replace(/s$/, '');
  }

/** Naive surface parser for a few patterns */
export function parseSentence(s: string): Prem[] {
  const x = norm(s);

  // 1) Implication: "if A then B" / "A implies B"
  const ifThen = x.match(/^if (.+?)(?:,?\s*then\s+|\s*then\s+)(.+)$/);
  if (ifThen) return [{ kind: 'imp', antecedent: ifThen[1], consequent: ifThen[2] }];

  const implies = x.match(/^(.+?)\s+implies\s+(.+)$/);
  if (implies) return [{ kind: 'imp', antecedent: implies[1], consequent: implies[2] }];

  // 2) Conjunction: "A and B"  (single split for demo; refine as needed)
  if (x.includes(' and ')) {
    const parts = x.split(/\s+and\s+/).map(norm);
    if (parts.length >= 2) return [{ kind: 'and', parts }];
  }

  // 3) Universal
  const all1 = x.match(/^(all|every)\s+([a-z ]+?)\s+(?:are|is)\s+([a-z ]+)$/);
  if (all1) return [{ kind: 'all', subj: lemmaType(all1[2]), pred: lemmaType(all1[3]) }];

  // 4) Negative universal: "no X are Y"
  const none = x.match(/^no\s+([a-z ]+?)\s+(?:are|is)\s+([a-z ]+)$/);
  if (none) return [{ kind: 'no', subj: lemmaType(none[1]), pred: lemmaType(none[2]) }];

  // 5) Instantiation: "z is (a) x"
  const is1 = x.match(/^([a-z][a-z0-9_-]*)\s+is\s+(?:an?\s+)?([a-z ]+)$/);
  if (is1) return [{ kind: 'is', entity: norm(is1[1]), type: lemmaType(is1[2]) }];


  // Default: treat as atom
  return [{ kind: 'atom', text: x }];
}

export function entailDialogical(req: EntailRequest): EntailResponse {
  const facts = new Set<string>();      // ground atoms & “is” facts as rendered strings
  const rulesImp: Array<{ a: string; b: string; raw: string }> = [];
  const rulesAll: Array<{ s: string; p: string; raw: string }> = [];
  const negAll:  Array<{ s: string; p: string; raw: string }> = [];
  const steps: EntailTraceStep[] = [];
  const usedRules: EntailRule[] = [];

  // helper to push a fact (normalized)
  const addFact = (t: string, why?: EntailTraceStep) => {
    const v = norm(t);
    if (!facts.has(v)) {
      facts.add(v);
      if (why) steps.push(why);
    }
  };
  const addIsFact = (entity: string, type: string, used: string[]) => {
    const t = `${norm(entity)} is ${lemmaType(type)}`;
    addFact(t, { rule: 'DIRECT_MATCH', used, derived: t });
  };

  // Seed: parse text T
  for (const sent of req.textSentences) {
    const ps = parseSentence(sent);
    for (const p of ps) {
      switch (p.kind) {
        case 'atom':
          addFact(p.text, { rule: 'DIRECT_MATCH', used: [sent], derived: p.text });
          break;
        case 'and':
          // A ∧ B expands to {A,B}
          for (const q of p.parts) {
            addFact(q, { rule: 'AND_ELIM', used: [sent], derived: q });
            usedRules.push('AND_ELIM');
          }
          break;
        case 'imp':
          rulesImp.push({ a: p.antecedent, b: p.consequent, raw: sent });
          break;
          case 'is':
  addIsFact(p.entity, p.type, [sent]);
  break;

        case 'all':
          rulesAll.push({ s: p.subj, p: p.pred, raw: sent });
          break;
        case 'is':
          addFact(`${p.entity} is ${p.type}`, { rule: 'DIRECT_MATCH', used: [sent], derived: `${p.entity} is ${p.type}` });
          break;
        case 'no':
          negAll.push({ s: p.subj, p: p.pred, raw: sent });
          break;
      }
    }
  }

  // Forward-chaining loop
  let changed = true;
  while (changed) {
    changed = false;

    // (a) Modus Ponens: A, (A→B) ⟹ B
    for (const r of rulesImp) {
      if (facts.has(norm(r.a)) && !facts.has(norm(r.b))) {
        addFact(r.b, { rule: 'MODUS_PONENS', used: [r.a, r.raw], derived: r.b });
        usedRules.push('MODUS_PONENS');
        changed = true;
      }
    }

    // (b) Universal instantiation: All S are P; z is S ⟹ z is P
    // facts of the “is …” shape

const isFacts = Array.from(facts).map(f => {
  const m = f.match(/^([a-z][a-z0-9_-]*)\s+is\s+([a-z ]+)$/);
  return m ? { entity: m[1], type: m[2], raw: f } : null;
}).filter(Boolean) as Array<{entity:string; type:string; raw:string}>;

 
for (const r of rulesAll) {
    for (const inst of isFacts) {
      if (lemmaType(inst.type) === lemmaType(r.s)) {
        const concl = `${inst.entity} is ${lemmaType(r.p)}`;
        if (!facts.has(norm(concl))) {
          addFact(concl, {
            rule: 'UNIVERSAL_INSTANT',
            used: [inst.raw, `all ${r.s} are ${r.p}`],
            derived: concl
          });
          usedRules.push('UNIVERSAL_INSTANT');
          changed = true;
        }
      }
    }
  }
  

  // Quick contradiction detector for “no X are Y” vs derived “z is Y” & “z is X”
  const contradiction = negAll.some(({ s, p }) => {
    const targetS = ` is ${lemmaType(s)}`;
    const targetP = ` is ${lemmaType(p)}`;
    const zIsS = Array.from(facts).find(f => f.endsWith(targetS));
    const zIsP = Array.from(facts).find(f => f.endsWith(targetP));
    return zIsS && zIsP;
  });

  if (contradiction) {
    steps.push({ rule: 'NEGATION_CONFLICT', used: ['no X are Y', 'z is X', 'z is Y'] });
    return {
      status: 'CONTRADICTS',
      derived: Array.from(facts.values()),
      usedRules: [...usedRules, 'NEGATION_CONFLICT'],
      steps,
      classicalPatterns: [...usedRules, 'NEGATION_CONFLICT'],
    };
  }

  // Check hypothesis
  const H = norm(req.hypothesis);
  const parsedH = parseSentence(H)[0];

  const hText = (() => {
    switch (parsedH.kind) {
      case 'atom': return parsedH.text;
      case 'is':   return `${parsedH.entity} is ${parsedH.type}`;
      case 'and':  // accept if all conjuncts present
        return parsedH.parts.every(p => facts.has(norm(p))) ? parsedH.parts.join(' & ') : '';
      case 'imp':  // accept if consequent present (weak)
        return facts.has(norm(parsedH.consequent)) ? parsedH.consequent : '';
      case 'all':
      case 'no':
        // minimal: treat as atom of the surface string
        return H;
    }
  })();

  if (hText && facts.has(norm(hText))) {
    // Add a final step if not already recorded
    steps.push({ rule: 'DIRECT_MATCH', used: ['T ⊢ …'], derived: hText });
    if (!usedRules.includes('DIRECT_MATCH')) usedRules.push('DIRECT_MATCH');
    return {
      status: 'ENTAILED',
      derived: Array.from(facts.values()),
      usedRules,
      steps,
      classicalPatterns: usedRules,
    };
  }

  return {
    status: 'UNDECIDED',
    derived: Array.from(facts.values()),
    usedRules,
    steps,
    classicalPatterns: usedRules,
  };
}
}