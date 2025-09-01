// components/rhetoric/RhetoricText.tsx
'use client';
import React from 'react';
import { useRhetoric } from './RhetoricContext';
import { RX } from './detect';

const CI_ORDER: (keyof typeof RX)[] = ['hedge','intensifier','absolute','analogy','metaphor'];
const CS_ORDER: (keyof typeof RX)[] = ['allcaps','exclaim']; // case-sensitive cats

export default function RhetoricText({ text }: { text: string }) {
  const { mode, enabled } = useRhetoric();
  if (mode === 'content') return <>{text}</>;

  // 1) build combined CI regex once (gi)
  const activesCI = CI_ORDER.filter(k => enabled[k]);
  const sources = activesCI.map(k => ({ kind: k, re: new RegExp(RX[k].source, 'gi') }));
  const parts: React.ReactNode[] = [];

  if (sources.length === 0) {
    // no CI highlights → defer to CS pass only
    return <>{applyCaseSensitive([text], enabled)}</>;
  }

  const alt = sources.map((s, i) => `(?<g${i}>${s.re.source})`).join('|');
  const re = new RegExp(alt, 'gi');

  let idx = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const start = m.index, end = re.lastIndex;
    if (start > idx) parts.push(text.slice(idx, start));

    // find which named group matched
    let gi = -1;
    const groups = m.groups ?? {};
    Object.keys(groups).forEach((g, _i) => { if (groups[g]) gi = _i; });
    const kind = sources[gi].kind;
    parts.push(
      <mark key={`${start}-${end}`} data-rhetoric={kind} title={titleFor(kind)}>
        {text.slice(start, end)}
      </mark>
    );
    idx = end;
  }
  if (idx < text.length) parts.push(text.slice(idx));

  // 2) case-sensitive pass on string chunks only
  return <>{applyCaseSensitive(parts, enabled)}</>;
}

function applyCaseSensitive(nodes: React.ReactNode[], enabled: Record<string, boolean>) {
  // run CS regexes one by one, only on *string* nodes
  const out: React.ReactNode[] = [];
  nodes.forEach((node, ni) => {
    if (typeof node !== 'string') { out.push(node); return; }

    let fragments: React.ReactNode[] = [node];

    if (enabled.allcaps) {
      fragments = splitAndWrap(fragments, /\b[A-Z]{3,}\b/g, 'allcaps');
    }
    if (enabled.exclaim) {
      fragments = splitAndWrap(fragments, /!+/g, 'exclaim');
    }
    out.push(...fragments);
  });
  return out;
}

function splitAndWrap(nodes: React.ReactNode[], re: RegExp, kind: string) {
  const out: React.ReactNode[] = [];
  nodes.forEach((n) => {
    if (typeof n !== 'string') { out.push(n); return; }
    let idx = 0; let m: RegExpExecArray | null;
    while ((m = re.exec(n))) {
      const start = m.index, end = re.lastIndex;
      if (start > idx) out.push(n.slice(idx, start));
      out.push(<mark key={`${kind}-${start}-${end}`} data-rhetoric={kind} title={titleFor(kind as any)}>{n.slice(start, end)}</mark>);
      idx = end;
    }
    if (idx < n.length) out.push(n.slice(idx));
  });
  return out;
}

function titleFor(k: keyof typeof RX | string) {
  switch (k) {
    case 'hedge': return 'Hedge / cautious language';
    case 'intensifier': return 'Intensifier';
    case 'absolute': return 'Absolute / sweeping claim';
    case 'analogy': return 'Analogy marker';
    case 'metaphor': return 'Possible metaphor';
    case 'allcaps': return 'ALL CAPS (shouting)';
    case 'exclaim': return 'Exclamatory punctuation';
    default: return 'Rhetorical device';
  }
}
