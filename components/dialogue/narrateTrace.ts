// components/dialogue/narrateTrace.ts
type Act = {
    polarity: 'P' | 'O';
    locusPath: string;
    expression?: string;
    meta?: any;
    isAdditive?: boolean;
  };
  type Pair = { posActId: string; negActId: string; ts?: number };
  type StepResult = {
    status: 'ONGOING' | 'CONVERGENT' | 'DIVERGENT';
    pairs: Pair[];
    decisiveIndices?: number[];
    usedAdditive?: Record<string, string>;
    endedAtDaimonForParticipantId?: 'Proponent' | 'Opponent';
    endorsement?: { locusPath: string; byParticipantId: string; viaActId: string };
  };
  
  // Null-safe classifier; falls back to sensible defaults
  function classify(act?: Act | null) {
    const pol = act?.polarity ?? 'P';
    const meta = (act?.meta ?? {}) as any;
    const locusPath = act?.locusPath ?? '0';
    const locus = String(meta?.justifiedByLocus ?? locusPath);
    const cq = meta?.cqId ?? meta?.schemeKey ?? undefined;
  
    if (meta?.justifiedByLocus && pol === 'O') return { kind: 'WHY' as const, cq, locus, locusPath };
    if (meta?.justifiedByLocus && pol === 'P') return { kind: 'GROUNDS' as const, cq, locus, locusPath };
    return { kind: 'ASSERT' as const, locus, locusPath };
  }
  
  export function narrateTrace(trace: StepResult, acts: Record<string, Act | undefined>) {
    const lines: { text: string; decisive?: boolean }[] = [];
    const decisive = new Set(trace.decisiveIndices ?? []);
  
    for (let i = 0; i < (trace.pairs ?? []).length; i++) {
      const p = trace.pairs[i];
      const A = acts[p.posActId];
      const B = acts[p.negActId];
      const a = classify(A);
      const b = classify(B);
      const leftExpr = A?.expression ?? '—';
      const rightExpr = B?.expression ?? '—';
      const mark = decisive.has(i);
      const push = (t: string) => lines.push({ text: t, decisive: mark });
  
      if (a.kind === 'ASSERT')  push(`Proponent asserts at ${a.locus}: ${leftExpr}`);
      if (a.kind === 'WHY')     push(`Opponent challenges at ${a.locus}: ${leftExpr}${a.cq ? ` (${a.cq})` : ''}`);
      if (a.kind === 'GROUNDS') push(`Proponent supplies grounds at ${a.locusPath}: ${leftExpr} (answers ${a.locus}${a.cq ? ` • ${a.cq}` : ''})`);
  
      if (b.kind === 'ASSERT')  push(`Opponent asserts at ${b.locus}: ${rightExpr}`);
      if (b.kind === 'WHY')     push(`Proponent challenges at ${b.locus}: ${rightExpr}${b.cq ? ` (${b.cq})` : ''}`);
      if (b.kind === 'GROUNDS') push(`Opponent supplies grounds at ${b.locusPath}: ${rightExpr} (answers ${b.locus}${b.cq ? ` • ${b.cq}` : ''})`);
    }
  
    for (const [parent, child] of Object.entries(trace.usedAdditive ?? {})) {
      lines.push({ text: `Additive choice at ${parent}: chose branch ${child}` });
    }
  
    if (trace.status === 'CONVERGENT') {
      lines.push({ text: `→ Convergent: daimon by ${trace.endedAtDaimonForParticipantId}` });
      if (trace.endorsement) {
        lines.push({ text: `Endorsed by ${trace.endorsement.byParticipantId} at ${trace.endorsement.locusPath}` });
      }
    } else if (trace.status === 'DIVERGENT') {
      lines.push({ text: `→ Divergent: unresolved obligations remain` });
    } else {
      lines.push({ text: `→ Ongoing: partial traversal only` });
    }
  
    return lines;
  }
  