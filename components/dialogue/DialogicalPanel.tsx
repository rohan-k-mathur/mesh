// components/dialogue/DialogicalPanel.tsx
'use client';
import * as React from 'react';
import type { AFNode, AFEdge } from '@/lib/argumentation/afEngine';
import { projectToAF, grounded, preferred, labelingFromExtension } from '@/lib/argumentation/afEngine';
import { inferSchemesFromText, questionsForScheme, cqUndercuts } from '@/lib/argumentation/criticalQuestions';
import { useDialogueMoves } from '@/components/dialogue/useDialogueMoves';
import { WinningnessBadge } from './WinningnessBadge';

type Props = {
  deliberationId: string;
  nodes: AFNode[];                    // arguments in scope (e.g., visible items)
  edges: AFEdge[];                    // support/rebut/undercut edges between those nodes
};

function hoursLeft(iso?: string) {
  if (!iso) return null;
  const ms = Date.parse(iso) - Date.now();
  return Math.max(0, Math.ceil(ms / 36e5)); // hours
}
// Simple stable extension enumerator (OK for small panels; falls back to grounded for big AFs)
function computeStableExtension(
  A: { id: string }[],
  R: Array<[string, string]>
): Set<string> | null {
  const ids = A.map(a => a.id);
  if (ids.length > 18) return null; // keep it safe; use grounded fallback for large sets
  const attacks = new Set(R.map(([x, y]) => `${x}→${y}`));

  const n = ids.length;
  const total = 1 << n;
  for (let mask = 0; mask < total; mask++) {
    const E = new Set<string>();
    for (let i = 0; i < n; i++) if (mask & (1 << i)) E.add(ids[i]);

    // conflict-free
    let ok = true;
    outer: for (const a of E) for (const b of E) {
      if (a !== b && attacks.has(`${a}→${b}`)) { ok = false; break outer; }
    }
    if (!ok) continue;

    // attacks every outside node
    const outside = ids.filter(x => !E.has(x));
    for (const y of outside) {
      let attacked = false;
      for (const a of E) if (attacks.has(`${a}→${y}`)) { attacked = true; break; }
      if (!attacked) { ok = false; break; }
    }
    if (ok) return E;
  }
  return null; // no stable extension exists
}

export default function DialogicalPanel({ deliberationId, nodes, edges }: Props) {
    // include 'stable' so the <option value="stable"> doesn't violate the union
    const [semantics, setSemantics] = React.useState<'grounded'|'preferred'|'stable'>('grounded');
  
  const [supportProp, setSupportProp] = React.useState(true);
  const [selected, setSelected] = React.useState<string | null>(null);
  const selectedNode = nodes.find(n => n.id === selected) || null;



// Track any locally opened CQs (checkboxes) → implicit undercuts
 const [openCQs, setOpenCQs] = React.useState<Record<string, string[]>>({});

   // NEW: unresolved WHY moves → implicit undercuts (virtual attackers)
   const { unresolvedByTarget, moves, mutate: refetchMoves } = useDialogueMoves(deliberationId);

    // 🔔 Listen for “dialogue:moves:refresh” and revalidate SWR
    React.useEffect(() => {
      const h = () => refetchMoves();
      window.addEventListener('dialogue:moves:refresh', h as any);
      return () => window.removeEventListener('dialogue:moves:refresh', h as any);
    }, [refetchMoves]);
  
    // Optional: auto-select the first node if nothing is selected and list is hidden
    React.useEffect(() => {
      if (!selected && nodes.length) setSelected(nodes[0].id);
    }, [selected, nodes]);

  const cqVirtual = React.useMemo(() => {
    const n: AFNode[] = [];
    const e: AFEdge[] = [];
    // unresolvedByTarget is latest-only per target (Map<string, DialogueMove>)
    for (const [targetId, entry] of unresolvedByTarget.entries()) {
        const latest = Array.isArray(entry) ? entry[entry.length - 1] : entry;
        if (!latest) continue;
    
        const u = cqUndercuts(targetId, [
          { id: `WHY-${latest.id}`, text: latest.payload?.note || 'Open WHY challenge' }
        ]);
        n.push(...u.nodes);
        e.push(...u.edges);
      }
       // Local inspector CQs
  for (const argId of Object.keys(openCQs)) {
    const u = cqUndercuts(
      argId,
      (openCQs[argId] || []).map(id => ({ id, text: id }))
    );
    n.push(...u.nodes);
    e.push(...u.edges);
  }

  return { nodes: n, edges: e };
}, [unresolvedByTarget, openCQs]);
    
//       // Also inject *local* CQs you toggled in the inspector
//     for (const argId of Object.keys(openCQs)) {
//           const u = cqUndercuts(argId, (openCQs[argId] || []).map(id => ({ id, text: id })) as any);
//           n.push(...u.nodes);
//           e.push(...u.edges);
//         }
//     return { nodes: n, edges: e };
// }, [unresolvedByTarget, openCQs]);

  const AF = React.useMemo(() => {
    const mergedNodes = [...nodes, ...cqVirtual.nodes];
    const mergedEdges = [...edges, ...cqVirtual.edges];
    return projectToAF(mergedNodes, mergedEdges, { supportDefensePropagation: supportProp, supportClosure: false });
  }, [nodes, edges, supportProp, cqVirtual]);

  const labeling = React.useMemo(() => {
    if (semantics === 'grounded') {
      const E = grounded(AF.A, AF.R);
      return labelingFromExtension(AF.A, AF.R, E);
    }
    if (semantics === 'preferred') {
      const prefs = preferred(AF.A, AF.R);
      // Keep your previous behavior: union of IN across preferred
      const INunion = new Set<string>();
      for (const E of prefs) for (const a of E) INunion.add(a);
      return labelingFromExtension(AF.A, AF.R, INunion);
    }
    // stable
    if (semantics === 'stable') {
      const ext = computeStableExtension(AF.A, AF.R) || grounded(AF.A, AF.R);
      return labelingFromExtension(AF.A, AF.R, ext);
    }
    // fallback
    const E = grounded(AF.A, AF.R);
    return labelingFromExtension(AF.A, AF.R, E);
  }, [AF, semantics]);

  const status = (id: string): 'IN'|'OUT'|'UNDEC' => {
    if (labeling.IN.has(id)) return 'IN';
    if (labeling.OUT.has(id)) return 'OUT';
    return 'UNDEC';
  };
     // Simple attacker explainer for hover (local utils on AF)
     const attackersOf = React.useCallback((a: string) => {
       const res: string[] = [];
       for (const [x, y] of AF.R) if (y === a) res.push(x);
       return res;
     }, [AF]);
   
     const explain = (id: string) => {
       const st = status(id);
       if (st === 'IN')   return 'Accepted (all attackers are counterattacked)';
       if (st === 'OUT')  {
         const atks = attackersOf(id);
         return atks.length ? `Out: attacked by ${atks.length} accepted/defended nodes` : 'Out: attacked';
       }
       return 'Undecided';
    };
   
  return (
    <div className="rounded-md border p-3 space-y-3">
      <div className="flex items-center gap-3 text-xs">
        <label className="flex items-center gap-1">
          Semantics:
          <select className="border rounded px-1 py-0.5" value={semantics} onChange={e => setSemantics(e.target.value as any)}>
            <option value="grounded">Grounded (skeptical)</option>
            <option value="preferred">Preferred (credulous union)</option>
           <option value="stable">Stable (if exists)</option>

          </select>
        </label>
        <label className="flex items-center gap-1" title="Treat supporters of a node as defenders against its attackers">
          <input type="checkbox" checked={supportProp} onChange={e => setSupportProp(e.target.checked)} />
          Support→Defense
        </label>
      </div>

             {/* Node list with statuses   open-CQ badge */}
             <div className="max-h-[260px] overflow-y-auto border rounded">
  {nodes.map(n => {
    const st = status(n.id);
    const stCls = st === 'IN' ? 'bg-emerald-600' : st === 'OUT' ? 'bg-rose-600' : 'bg-amber-600';
    const openWhy = unresolvedByTarget.has(n.id);
    const whyMove = unresolvedByTarget.get(n.id) as any | undefined;
const dueHrs = hoursLeft(whyMove?.payload?.deadlineAt);


    return (
      <div
        key={n.id}
        className={`px-2 py-1 text-sm cursor-pointer border-b last:border-0 ${selected === n.id ? 'bg-slate-50' : ''}`}
        onClick={() => setSelected(n.id)}
      >
        <span
          className={`mr-2 inline-block min-w-[44px] text-[10px] text-white px-1.5 py-0.5 rounded ${stCls}`}
          title={explain(n.id)}
        >
          {st}
        </span>

        <span className="text-neutral-800">{(n.text || n.label || '').slice(0, 120)}</span>

        {openWhy && (
          <span className="ml-2 px-1.5 py-0.5 rounded border text-[10px] bg-rose-50 border-rose-200 text-rose-700">
               WHY{typeof dueHrs === 'number' ? ` · ⏱ ${dueHrs}h` : ''}

          </span>
        )}

        <span className="ml-2 align-middle">
          <WinningnessBadge moves={moves} targetId={n.id} />
        </span>
      </div>
    );
  })}
</div>




      {/* Edge summary */}
      <div className="text-xs text-neutral-600">
        AF: |A|={AF.A.length}, |R|={AF.R.length}
      </div>
       {/* Selected argument: winningness meter + scheme/CQs */}
       {selectedNode && (
  <>
    <div className="mt-2">
      <WinningnessBadge
        moves={moves}                // <- array of DialogueMove
        targetId={selectedNode.id}   // <- the node currently selected
      />
    </div>

    <ArgumentInspector
      deliberationId={deliberationId}
      node={selectedNode}
      onCqToggle={(cqId, on) => setOpenCQs(prev => {
        const arr = new Set(prev[selectedNode.id] || []);
        on ? arr.add(cqId) : arr.delete(cqId);
        return { ...prev, [selectedNode.id]: Array.from(arr) };
      })}
    />
  </>
)}
      {/* Selected argument: scheme + CQs
      {selectedNode && (
        <ArgumentInspector
          deliberationId={deliberationId}
          node={selectedNode}
          onCqToggle={(cqId, on) => setOpenCQs(prev => {
            const arr = new Set(prev[selectedNode.id] || []);
            on ? arr.add(cqId) : arr.delete(cqId);
            return { ...prev, [selectedNode.id]: Array.from(arr) };
          })}
        />
      )} */}
    </div>
  );
}

function ArgumentInspector({
  deliberationId,
  node,
  onCqToggle,
}: {
  deliberationId: string;
  node: AFNode;
  onCqToggle: (cqId: string, on: boolean) => void;
}) {
  const schemes = inferSchemesFromText(node.text || node.label || '');
  const [scheme, setScheme] = React.useState(schemes[0] || 'Consequences');
  const cqs = questionsForScheme(scheme);

//   const postMove = async (kind: 'WHY'|'GROUNDS', payload: any) => {
//     await fetch('/api/dialogue/move', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         deliberationId,
//         targetType: 'argument',
//         targetId: node.id,
//         kind,
//         payload,
//         actorId: 'me', // TODO: replace with real user id
//       }),
//     });
//      // ask the panel to re-read moves and recompute AF
//     // (we access SWR via window event to avoid prop-drilling; simple and safe)
//     window.dispatchEvent(new CustomEvent('dialogue:moves:refresh'));
//   };

const [posting, setPosting] = React.useState(false);
   const [ok, setOk] = React.useState<null|boolean>(null);
   const postMove = async (kind: 'WHY'|'GROUNDS', payload: any) => {
     if (posting) return;
     setPosting(true); setOk(null);
     try {
       await fetch('/api/dialogue/move', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           deliberationId,
           targetType: 'argument',
           targetId: node.id,
           kind,
           payload,
           autoCompile: true,
           autoStep: true,
         }),
       });
       window.dispatchEvent(new CustomEvent('dialogue:moves:refresh'));
       setOk(true);
       setTimeout(()=>setOk(null), 1000);
     } catch {
       setOk(false);
       setTimeout(()=>setOk(null), 1500);
     } finally {
       setPosting(false);
     }
   };
const onToggleCQ = (cqId: string, on: boolean) => {
  onCqToggle(cqId, on);
  if (on) postMove('WHY', { cqId });
  else postMove('GROUNDS', { cqId });
};

  return (
    <div className="rounded border p-2 space-y-2">
      <div className="flex items-center gap-2">
        <div className="font-medium text-sm">Critical questions</div>
        <select className="border rounded px-1 py-0.5 text-xs" value={scheme} onChange={e => setScheme(e.target.value as any)}>
          {schemes.concat(scheme).filter((v, i, a) => a.indexOf(v) === i).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {ok === true && <span className="text-[10px] text-emerald-700">✓</span>}
        {ok === false && <span className="text-[10px] text-rose-700">✕</span>}
      </div>
      <div className="space-y-1">
        {cqs.map(q => (
          <label key={q.id} className="flex items-center gap-2 text-sm">
            <input type="checkbox" onChange={e => onToggleCQ(q.id, e.target.checked)} disabled={posting} />
            <span>{q.text}</span>
            {q.severity && <span className={`ml-1 text-[10px] px-1 rounded ${q.severity==='high'?'bg-rose-100 text-rose-700':q.severity==='med'?'bg-amber-100 text-amber-700':'bg-slate-100 text-slate-700'}`}>{q.severity}</span>}
          </label>
        ))}
      </div>
      <div className="flex gap-2">
      <button className="px-2 py-1 border rounded text-xs" onClick={() => postMove('WHY', { note: 'Please address open critical questions' })} disabled={posting}>
         {posting ? 'Posting…' : 'Challenge (WHY)'}
        </button>
        <button className="px-2 py-1 border rounded text-xs" onClick={() => postMove('GROUNDS', { note: 'Grounds submitted' })} disabled={posting}>
          {posting ? 'Posting…' : 'Provide grounds'}
        </button>
      </div>
    </div>
  );
}
