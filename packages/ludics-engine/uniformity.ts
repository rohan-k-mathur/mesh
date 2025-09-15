type Pair = { posActId?: string; negActId?: string; locusPath: string; ts: number };

export function normalizeTrace(pairs: { posActId: string; negActId: string; ts: number }[], byId: Map<string, any>) {
  // Project to a locusPath-only shadow and stabilize child indices by first-seen order.
  const out: Pair[] = [];
  const ren: Record<string, number> = {};   // childSuffix -> 0/1/2 by first-seen
  let next = 0;

  const pathOf = (id?: string) => (id && byId.get(id)?.locus?.path) ?? '0';
  for (const p of pairs) {
    const L = pathOf(p.posActId) || pathOf(p.negActId);
    const comps = L.split('.');
    const base = comps.slice(0, -1).join('.');
    const tail = comps[comps.length - 1] ?? '';
    const k = Number(tail);
    let norm = L;
    if (Number.isInteger(k)) {
      if (!(tail in ren)) ren[tail] = next++;
      const nk = ren[tail];
      norm = base ? `${base}.${nk}` : String(nk);
    }
    out.push({ locusPath: norm, posActId: p.posActId, negActId: p.negActId, ts: p.ts });
  }
  return out;
}

export function alphaEquivalent(a: Pair[], b: Pair[]) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].locusPath !== b[i].locusPath) return false;
  }
  return true;
}
