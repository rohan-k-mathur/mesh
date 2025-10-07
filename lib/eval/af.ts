// lib/eval/af.ts
export type AF = { nodes: string[]; attacks: [string, string][] };
export type Label = 'IN'|'OUT'|'UNDEC';

export function groundedLabels(af: AF): Record<string, Label> {
  const { nodes, attacks } = af;
  const attackersOf = new Map<string, Set<string>>();
  for (const n of nodes) attackersOf.set(n, new Set());
  for (const [a,b] of attacks) attackersOf.get(b)!.add(a);

  const IN = new Set<string>(), OUT = new Set<string>();
  let changed = true;
  while (changed) {
    changed = false;
    for (const x of nodes) {
      if (!IN.has(x) && !OUT.has(x)) {
        const atk = attackersOf.get(x)!;
        if (atk.size === 0 || [...atk].every(a => OUT.has(a))) { IN.add(x); changed = true; }
      }
    }
    for (const x of nodes) {
      if (!OUT.has(x)) {
        const atk = attackersOf.get(x)!;
        if ([...atk].some(a => IN.has(a))) { OUT.add(x); changed = true; }
      }
    }
  }
  const lab: Record<string, Label> = {};
  for (const x of nodes) lab[x] = IN.has(x) ? 'IN' : OUT.has(x) ? 'OUT' : 'UNDEC';
  return lab;
}

// naive preferred (skeptical) for small graphs
export function preferredLabels(af: AF): Record<string, Label> {
  const { nodes, attacks } = af;
  const out = new Map<string, Set<string>>();
  for (const n of nodes) out.set(n, new Set());
  for (const [a,b] of attacks) out.get(a)!.add(b);

  const conflictFree = (S:Set<string>) => { for (const a of S) for (const b of S) if (out.get(a)!.has(b)) return false; return true; };
  const defends = (S:Set<string>, x:string) =>
    [...out.entries()].filter(([,ts])=>ts.has(x)).map(([att])=>att).every(attacker => [...S].some(s => out.get(s)!.has(attacker)));

  const P: Set<string>[] = [];
  for (let m=0; m < (1<<nodes.length); m++) {
    const S = new Set(nodes.filter((_,i)=> (m>>i)&1 ));
    if (!conflictFree(S)) continue;
    let admissible = true;
    for (const x of S) if (!defends(S,x)) { admissible = false; break; }
    if (admissible) P.push(S);
  }
  const Preferred = P.filter(S => !P.some(T => S !== T && [...S].every(x=>T.has(x)) && T.size>S.size));

  const inAll = new Set(nodes.filter(n => Preferred.every(S => S.has(n))));
  const inSome = new Set(nodes.filter(n => Preferred.some(S => S.has(n))));
  const labels: Record<string, Label> = {};
  for (const n of nodes) labels[n] = inAll.has(n) ? 'IN' : inSome.has(n) ? 'UNDEC' : 'OUT';
  return labels;
}
