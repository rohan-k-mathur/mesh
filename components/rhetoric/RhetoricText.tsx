// components/rhetoric/RhetoricText.tsx
'use client';

import * as React from 'react';
import { useRhetoric, RhetoricCategory } from './RhetoricContext';
import { analyzeText, Hit, Category } from './detectors';
import { analyzeNlp } from './nlpLite';
import { scanLexiconHits } from './lexiconAnalyzers';

// Priority order (remove duplicate 'allcaps')
const ORDER: Category[] = [
  'analogy','metaphor',
  'booster','absolute','hedge',
   // Prefer Logos over bare evidence numbers
  'logos',
  'connective-support','connective-result','connective-contrast','connective-concession','connective-condition',
  'weasel','evidence','ethos','rhet-question',

  'inference-deductive','inference-inductive','inference-abductive',

  // Prefer Frames over Affect/Pathos to keep multi-word policy frames
  'frame-economic','frame-morality','frame-security','frame-fairness','frame-capacity',
  'affect-positive','affect-negative',
  'pathos',
  'allcaps',
  // Layer B
  'imperative','passive','nominalization','parallelism',
  'modal-certainty','modal-uncertainty','negation','pronoun-you','pronoun-we',
];

type Props = { text: string; onHits?: (hits: Hit[]) => void };

const TOGGLE_MAP = {
  hedge: 'hedge',
  booster: 'intensifier',
  absolute: 'absolute',
  analogy: 'analogy',
  metaphor: 'metaphor',
  allcaps: 'allcaps',
  exclaim: 'exclaim',
  'connective-support': 'connectives',
  'connective-result': 'connectives',
  'connective-contrast': 'connectives',
  'connective-concession': 'connectives',
  'connective-condition': 'connectives',
  evidence: 'evidence',
  ethos: 'ethos',
  pathos: 'pathos',
  logos: 'logos',
} as const;



//  type Span = {
//        start: number;
//        end: number;
//        cues: {
//          source: 'detector' | 'nlp' | 'lexicon';
//          key: string; // e.g., 'hedge', 'logos:evidence', etc.
//          label: string;
//        }[];
//      };
     
//      const PRIORITY: Record<Span['cues'][number]['source'], number> = {
//        detector: 3,
//        nlp: 2,
//        lexicon: 1,
//      };
     
//      function tooltipForLexKind(k: LexKind): string {
//        const family = k.family;
//        const tag = (k as any).tag;
//        if (family === 'emotion') return `Emotion (${tag})`;
//        if (family === 'frames') return `Frame (${tag})`;
//        if (family === 'liwc') return `LIWC-lite (${tag})`;
//        if (family === 'logos') {
//          const map: Record<string, string> = {
//            evidence: 'Logos: evidentiary term',
//            quant: 'Logos: quantitative term',
//            logic: 'Logos: logical connective/term',
//            method: 'Logos: methodological term',
//          };
//          return map[tag] ?? 'Logos';
//        }
//        if (family === 'ethos') {
//          const map: Record<string, string> = {
//            credentials: 'Ethos: credential signal',
//            duty: 'Ethos: duty/standard',
//            integrity: 'Ethos: integrity/neutrality',
//            collective: 'Ethos: collective/representation',
//          };
//          return map[tag] ?? 'Ethos';
//        }
//        return 'Lexicon';
//      }
     
//      function classForCue(sources: Span['cues']): string {
//        // Choose the highest-priority cue to color the background lightly; add underline for multiples
//        const top = [...sources].sort((a, b) => PRIORITY[b.source] - PRIORITY[a.source])[0];
//        const multi = sources.length > 1;
//        // Tailwind utility blend: subtle background   dotted underline for stacked cues
//        const base =
//          top?.source === 'detector'
//            ? 'bg-blue-200/40 dark:bg-blue-900/20 ring-1 ring-blue-400/40'
//            : top?.source === 'nlp'
//            ? 'bg-purple-200/40 dark:bg-purple-900/20 ring-1 ring-purple-400/40'
//            : 'bg-amber-200/30 dark:bg-amber-900/20 ring-1 ring-amber-400/30';
//        const emphasis = multi ? ' underline decoration-dotted underline-offset-2' : '';
//        return `rounded-sm ${base}${emphasis} px-0.5`;
//      }
     
//      function mergeSpans(length: number, layers: Span[]): Span[] {
//        // Sweep line: create change events for efficient merge of overlapping spans
//        type Ev = { i: number; open?: Span['cues']; close?: Span['cues'] };
//        const events: Ev[] = [];
//        for (const s of layers) {
//          events.push({ i: s.start, open: s.cues });
//          events.push({ i: s.end, close: s.cues });
//        }
//        events.sort((a, b) => a.i - b.i);
//        const out: Span[] = [];
//        let active: Span['cues'] = [];
//        let cursor = 0;
//        const flush = (to: number) => {
//          if (to <= cursor) return;
//          if (active.length) out.push({ start: cursor, end: to, cues: [...active] });
//          cursor = to;
//        };
//        for (const ev of events) {
//          flush(ev.i);
//          if (ev.close) {
//            // remove by identity (best‑effort)
//            for (const c of ev.close) {
//              const idx = active.findIndex((x) => x.source === c.source && x.key === c.key);
//              if (idx >= 0) active.splice(idx, 1);
//            }
//          }
//          if (ev.open) {
//            for (const c of ev.open) {
//              if (!active.find((x) => x.source === c.source && x.key === c.key)) active.push(c);
//            }
//          }
//        }
//        flush(length);
//        return out;
//      }
    


export default function RhetoricText({ text, onHits }: Props) {
  const { mode, settings, enabled } = useRhetoric();

  

  // Layer A
  const heur = React.useMemo(() => analyzeText(text || ''), [text]);

  // Layer B (optional)
  const [nlpHits, setNlpHits] = React.useState<Hit[]>([]);
  React.useEffect(() => {
    let alive = true;
    (async () => {
      if (mode !== 'style' || !settings.enableNlp || !text) {
        if (alive) setNlpHits([]);
        return;
      }
      try {
        const extra = await analyzeNlp(text, {
          imperatives: true,
          passives: true,
          nominalizations: true,
          parallelism: true,
          modals: true,
          negation: true,
          pronouns: true,
        });
// Normalize: only keep well-formed hits
        const normalized = Array.isArray(extra)
          ? extra.filter((h: any) =>
              h &&
              typeof h.start === 'number' &&
              typeof h.end === 'number' &&
              typeof h.match === 'string' &&
              typeof h.cat === 'string'
            )
          : [];
        if (alive) setNlpHits(normalized as Hit[]);      } catch {
        if (alive) setNlpHits([]);
      }
    })();
    return () => { alive = false; };
  }, [text, mode, settings.enableNlp]);

  // Layer C (optional)
  const lexHits = React.useMemo<Hit[]>(() => {
    if (mode !== 'style' || !settings.highlightLexicon || !text) return [];
    return scanLexiconHits(text);
  }, [mode, settings.highlightLexicon, text]);

  // Filter by toggles
  const filteredHeur = React.useMemo(
    () => filterByToggles(heur.hits, enabled),
    [heur.hits, enabled]
  );
  const filteredNlp = React.useMemo(
    () => filterByToggles(nlpHits, enabled),
    [nlpHits, enabled]
  );

  const exclaimHits = React.useMemo(() => {
    if (!enabled.exclaim || !text) return [];
    const out: Hit[] = [];
    const re = /!+/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      out.push({ cat: 'exclaim', start: m.index, end: m.index + m[0].length, match: m[0] });
      if (m.index === re.lastIndex) re.lastIndex++;
    }
    return out;
  }, [enabled.exclaim, text]);

  // ✅ Always compute merged (empty in content mode) to keep hook order stable
  const merged = React.useMemo(() => {
    if (mode === 'content') return [] as Hit[];
    return mergeByPriority([...filteredHeur, ...filteredNlp, ...lexHits, ...exclaimHits]);
  }, [mode, filteredHeur, filteredNlp, lexHits, exclaimHits]);

  // ✅ Always run this effect (no-op if onHits is undefined or merged is empty)
  React.useEffect(() => {
    if (onHits) onHits(merged);
  }, [onHits, merged]);

  // Render branch
  if (mode === 'content') return <>{text}</>;
  return <span>{renderWithHighlights(text, merged)}</span>;
}

/* ----------------- helpers ----------------- */

function filterByToggles(hits: Hit[], enabled: Record<RhetoricCategory, boolean>): Hit[] {
  return hits.filter(h => {
    const key = TOGGLE_MAP[h.cat as keyof typeof TOGGLE_MAP];
    if (!key) return true;           // categories not controlled by dropdown stay visible
    return !!enabled[key];
  });
}

function mergeByPriority(hits: Hit[]): Hit[] {
      // Defensive: drop malformed entries
      const safe = hits.filter((h: any) =>
        h && typeof h.start === 'number' && typeof h.end === 'number' && typeof h.match === 'string' && typeof h.cat === 'string'
      ) as Hit[];
      const sorted = [...safe].sort((a, b) => {
    const p = ORDER.indexOf(a.cat) - ORDER.indexOf(b.cat);
    return p !== 0 ? p : a.start - b.start;
  });
  const out: Hit[] = [];
  let lastEnd = -1;
  for (const h of sorted) {
    if (h.start >= lastEnd) { out.push(h); lastEnd = h.end; }
  }
  return out;
}

function renderWithHighlights(text: string, hits: Hit[]) {
  const parts: React.ReactNode[] = [];
  let i = 0;
  hits.forEach((h, idx) => {
    if (h.start > i) parts.push(<span key={`p-${i}`}>{text.slice(i, h.start)}</span>);
    parts.push(<Mark key={`m-${idx}`} hit={h} />);
    i = h.end;
  });
  if (i < text.length) parts.push(<span key={`tail-${i}`}>{text.slice(i)}</span>);
  return parts;
}

function Mark({ hit }: { hit: Hit }) {
  const base = 'px-0.5 rounded';
    const c = (hit as any)?.cat as string | undefined;
    const cls =
    c === 'hedge' ? 'bg-yellow-50 underline decoration-yellow-400' :
         c === 'booster' ? 'bg-rose-50 underline decoration-rose-400' :
         c === 'absolute' ? 'bg-amber-50 underline decoration-amber-400' :
         c?.startsWith('connective') ? 'bg-blue-50' :
         (c === 'analogy' || c === 'metaphor') ? 'bg-indigo-50' :
         c === 'weasel' ? 'bg-fuchsia-50' :
         c === 'evidence' ? 'bg-emerald-50' :
         c === 'ethos' ? 'bg-sky-50' :
         c === 'pathos' ? 'bg-pink-50' :
         c === 'logos' ? 'bg-green-50' :
         c === 'rhet-question' ? 'bg-purple-50' :
         c === 'allcaps' ? 'opacity-60' :
         c === 'affect-positive' ? 'bg-green-50 ring-1 ring-green-200' :
         c === 'affect-negative' ? 'bg-rose-50 ring-1 ring-rose-200' :
         c === 'frame-economic'  ? 'bg-blue-50 ring-1 ring-blue-200' :
         c === 'frame-morality'  ? 'bg-amber-50 ring-1 ring-amber-200' :
         c === 'frame-security'  ? 'bg-indigo-50 ring-1 ring-indigo-200' :
         c === 'frame-fairness'  ? 'bg-teal-50 ring-1 ring-teal-200' :
         c === 'frame-capacity'  ? 'bg-slate-50 ring-1 ring-slate-200' :
         c === 'imperative' ? 'bg-red-50 underline decoration-red-400' :
         c === 'passive' ? 'bg-neutral-50 ring-1 ring-neutral-200' :
         c === 'nominalization' ? 'bg-amber-50' :
         c === 'parallelism' ? 'bg-teal-50' :
         c === 'modal-certainty' ? 'bg-lime-50' :
         c === 'modal-uncertainty' ? 'bg-yellow-50' :
         c === 'negation' ? 'bg-purple-50' :
         c === 'pronoun-you' ? 'bg-sky-50' :
         c === 'pronoun-we' ? 'bg-sky-100' :
        c === 'exclaim' ? 'bg-orange-50' :
        c === 'inference-deductive' ? 'bg-green-50 ring-1 ring-green-200' :
        c === 'inference-inductive' ? 'bg-amber-50 ring-1 ring-amber-200' :
        c === 'inference-abductive' ? 'bg-sky-50 ring-1 ring-sky-200' :
    'bg-neutral-100';

  return (
    <span className={`${base} ${cls}`} title={c ?? ''}>
      {hit.match}
    </span>
  );
}
