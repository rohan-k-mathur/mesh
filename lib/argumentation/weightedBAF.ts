// lib/argumentation/weightedBAF.ts
export type NodeId = string;
export type Edge = { from: NodeId; to: NodeId; kind: 'support' | 'attack'; weight?: number };

export function propagate(
  nodes: NodeId[],
  edges: Edge[],
  base: Record<NodeId, number>, // prior belief/confidence 0..1
  iters = 20,
  damp = 0.85
): Record<NodeId, number> {
  const idx = new Map(nodes.map((n,i)=>[n,i]));
  const N = nodes.length;
  const s = new Float64Array(N).fill(0);
  const v = new Float64Array(N);
  nodes.forEach((n,i)=> v[i] = Math.max(0, Math.min(1, base[n] ?? 0.5)));

  const outAdj: Edge[][] = nodes.map(()=>[]);
  for (const e of edges) {
    const fi = idx.get(e.from), ti = idx.get(e.to);
    if (fi==null||ti==null) continue;
    outAdj[fi].push(e);
  }

  for (let t=0;t<iters;t++){
    s.fill(0);
    for (let i=0;i<N;i++){
      for (const e of outAdj[i]){
        const w = e.weight ?? 1;
        const delta = w * v[i];
        s[idx.get(e.to)!] += (e.kind === 'support' ? delta : -delta);
      }
    }
    for (let i=0;i<N;i++){
      const x = (1-damp)*v[i] + damp*(0.5 + 0.5*Math.tanh(s[i]));
      v[i] = Math.max(0, Math.min(1, x));
    }
  }
  const out: Record<NodeId, number> = {};
  nodes.forEach((n,i)=> out[n] = v[i]);
  return out;
}
