'use client';
import * as React from 'react';
import useSWR from 'swr';
import { LociTree } from 'packages/ludics-react/LociTree';
import { TraceRibbon } from 'packages/ludics-react/TraceRibbon';
import { JudgeConsole } from 'packages/ludics-react/JudgeConsole';
import { CommitmentsPanel } from 'packages/ludics-react/CommitmentsPanel';
import { DefenseTree } from 'packages/ludics-react/DefenseTree';
import { ActInspector } from '@/packages/ludics-react/ActInspector';
const fetcher = (u:string)=>fetch(u,{cache:'no-store'}).then(r=>r.json());

export function LudicsPanel({ deliberationId }: { deliberationId: string }) {
  const { data, mutate } = useSWR(`/api/ludics/designs?deliberationId=${encodeURIComponent(deliberationId)}`, fetcher);
  const [trace, setTrace] = React.useState<{
    steps: any[];
    status: 'ONGOING' | 'CONVERGENT' | 'DIVERGENT';
    endedAtDaimonForParticipantId?: string;
    endorsement?: { locusPath: string; byParticipantId: string; viaActId: string };
    decisiveIndices?: number[];
    usedAdditive?: Record<string,string>;
  } | null>(null);
  const [stable, setStable] = React.useState<number|null>(null);
  const [focusIdx, setFocusIdx] = React.useState<number | null>(null);
  const [usedAdditive, setUsedAdditive] = React.useState<Record<string,string>>({});
  const [badges, setBadges] = React.useState<Record<number,string>>({});
  const [orthogonal, setOrthogonal] = React.useState<boolean|null>(null);
  const [decisive, setDecisive] = React.useState<number[]|null>(null);
  const [focusTarget, setFocusTarget] = React.useState<string|null>(null);


  async function analyzeNLI() {
    if (!trace || !data?.designs) return;
  
    const steps = Array.isArray(trace.steps) ? trace.steps : [];  // ← guard
    if (steps.length === 0) return;
  
    const byId = new Map<string, any>();
    for (const d of data.designs) for (const a of d.acts ?? []) byId.set(a.id, a);
  
    const pairs = steps.map(p => ({
      premise: (byId.get(p.posActId)?.expression ?? '').toString(),
      hypothesis: (byId.get(p.negActId)?.expression ?? '').toString(),
    }));
  
    const res = await fetch('/api/nli/batch', {
      method:'POST',
      headers:{ 'content-type':'application/json' },
      body: JSON.stringify({ items: pairs })
    }).then(r => r.json());
  
    const TAU = Number(process?.env?.NEXT_PUBLIC_CQ_NLI_THRESHOLD ?? '0.72');
    const b: Record<number,string> = {};
    res?.results?.forEach((r: any, i: number) => {
      if (r?.relation === 'contradicts' && (r.score ?? 0) >= TAU) b[i] = 'NLI⊥';
    });
    setBadges(b);
  }
  

  function findActById(id: string) {
    if (!data?.designs) return null;
    for (const d of data.designs) {
      const a = d.acts?.find((x:any) => x.id === id);
      if (a) return { ...a, _who: d.participantId };
    }
    return null;
  }

  async function checkStable() {
    const res = await fetch(`/api/af/stable?deliberationId=${encodeURIComponent(deliberationId)}`).then(r=>r.json());
    setStable(res.count ?? 0);
  }

  const compRef = React.useRef(false);

 // compile  step in one hop (keeps ribbon/trace fresh)
   async function compileStep(phase: 'focus-P'|'focus-O'|'neutral' = 'neutral') {
    if (compRef.current) return;
    compRef.current = true;
    try {
      const r  = await fetch('/api/ludics/compile-step', {
          method:'POST', headers:{'content-type':'application/json'},
          body: JSON.stringify({ deliberationId, phase })
        }).then(r=>r.json()).catch(()=>null);
        if (r?.trace) {
          setTrace({
            steps: r.trace.pairs ?? [],
            status: r.trace.status,
            endedAtDaimonForParticipantId: r.trace.endedAtDaimonForParticipantId,
            endorsement: r.trace.endorsement,
            decisiveIndices: r.trace.decisiveIndices,
            usedAdditive: r.trace.usedAdditive,
          });
        }
      }
      finally {
        compRef.current = false;
      }
    }
    
      async function compile() { await compileStep('neutral'); mutate(); }
  async function step() {
    if (!data?.designs?.length) return;
    const pos = data.designs.find((d:any)=>d.participantId==='Proponent') ?? data.designs[0];
    const neg = data.designs.find((d:any)=>d.participantId==='Opponent')  ?? data.designs[1] ?? data.designs[0];
    const res = await fetch('/api/ludics/step', 
    { method:'POST', headers:{'content-type':'application/json'}, 
    body: JSON.stringify({ dialogueId: deliberationId, posDesignId: pos.id, negDesignId: neg.id }) })
    .then(r=>r.json());
    setTrace({
      steps: res.pairs || [],
      status: res.status,
      endedAtDaimonForParticipantId: res.endedAtDaimonForParticipantId,
      endorsement: res.endorsement,
      decisiveIndices: res.decisiveIndices,
      usedAdditive: res.usedAdditive,
    });
  }
  async function appendDaimonToNext() {
    if (!data?.designs?.length) return;
    const [,B] = data.designs;
    await fetch('/api/ludics/acts', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ designId: B.id, enforceAlternation:false, acts: [{ kind:'DAIMON' }] }) });
    await step();
  }
  async function pickAdditive(parentPath: string, child: string) {
    if (!data?.designs?.length) return;
    const pos = data.designs.find((d:any)=>d.participantId==='Proponent') ?? data.designs[0];
    const neg = data.designs.find((d:any)=>d.participantId==='Opponent')  ?? data.designs[1] ?? data.designs[0];
    await fetch('/api/ludics/additive/pick', {
      method:'POST', headers:{'content-type':'application/json'},
      body: JSON.stringify({ dialogueId: deliberationId, posDesignId: pos.id, negDesignId: neg.id, parentPath, childSuffix: child })
    });
    await compileStep('focus-P'); // gated traversal until choice is consumed
  }
// 5) keep only one orthogonal check function (this one)
async function checkOrthogonal() {
    if (!data?.designs?.length) return;
    const [A, B] = data.designs;
    const r = await fetch(
      `/api/ludics/orthogonal?dialogueId=${encodeURIComponent(deliberationId)}&posDesignId=${A.id}&negDesignId=${B.id}`
    ).then(r => r.json());
  
    setOrthogonal(r?.orthogonal ?? null);
  
    // Normalize StepResult from API (which has `pairs`) into panel `trace` (which expects `steps`)
    if (r?.trace) {
      setTrace({
        steps: r.trace.pairs ?? [],                           // ← key fix
        status: r.trace.status,
        endedAtDaimonForParticipantId: r.trace.endedAtDaimonForParticipantId,
        endorsement: r.trace.endorsement,
        decisiveIndices: r.trace.decisiveIndices,
        usedAdditive: r.trace.usedAdditive,
      });
    } else {
      setTrace(null);
    }
  }

  async function onConcede(locus:string, proposition:string) {
    await fetch('/api/ludics/concession', {
      method:'POST', headers:{'content-type':'application/json'},
      body: JSON.stringify({
        dialogueId: deliberationId,
        concedingParticipantId: 'Opponent',
        anchorLocus: locus,
        proposition: { text: proposition }
      })
    });
    await mutate(); await step();
  }
     // Focus a locus from anywhere (e.g., WHY chip in other panels)
     React.useEffect(() => {
       const onFocus = async (e: any) => {
         const { phase } = e?.detail || {};
         await compileStep(phase ?? 'focus-P');
       };
       window.addEventListener('ludics:focus', onFocus as any);
       return () => window.removeEventListener('ludics:focus', onFocus as any);
     }, [deliberationId]);
   
     // Keep in sync when other components post moves
     React.useEffect(() => {
       const refresh = () => compileStep('neutral');
       window.addEventListener('dialogue:moves:refresh', refresh as any);
       return () => window.removeEventListener('dialogue:moves:refresh', refresh as any);
    }, [deliberationId]);
  
  async function onForceConcession(locus: string, text: string) {
    if (!data?.designs?.length) return;
    const [,B] = data.designs;
    await fetch('/api/ludics/judge/force', { method:'POST', headers:{'content-type':'application/json'},
      body: JSON.stringify({ dialogueId: deliberationId, action: 'FORCE_CONCESSION', target: { designId: B.id, locusPath: locus }, data: { text } }) });
    mutate(); await step();
  }
  async function onCloseBranch(locus: string) {
    if (!data?.designs?.length) return;
    const [,B] = data.designs;
    await fetch('/api/ludics/judge/force', { method:'POST', headers:{'content-type':'application/json'},
      body: JSON.stringify({ dialogueId: deliberationId, action: 'CLOSE_BRANCH', target: { designId: B.id, locusPath: locus } }) });
    mutate(); await step();
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button className="px-2 py-1 border rounded" onClick={compile}>Compile from moves</button>
        <button className="px-2 py-1 border rounded" onClick={step}>Step</button>
        <button className="px-2 py-1 border rounded" onClick={appendDaimonToNext}>Append † to next</button>
        <button className="px-2 py-1 border rounded" onClick={checkOrthogonal}>Check orthogonality</button>
{orthogonal === true && <span className="text-xs px-2 py-0.5 border rounded bg-green-50">✔ Orthogonal</span>}
{orthogonal === false && <span className="text-xs px-2 py-0.5 border rounded bg-amber-50">Not orthogonal</span>}
        <button className="px-2 py-1 border rounded" onClick={analyzeNLI}>Analyze NLI</button>

        <button className="px-2 py-1 border rounded" onClick={checkStable}>Stable sets</button>
  {stable !== null && <span className="text-xs px-2 py-1 rounded border bg-slate-50">stable: {stable}</span>}
        
      </div>

      {trace && (
  <TraceRibbon
  steps={trace.steps || []}   // ← keep this guard

    status={trace.status as any}
    badges={badges}
    onFocus={(i)=>setFocusIdx(i)}
  />
)}

{trace?.endorsement && (
  <div className="text-xs opacity-80">
    Accepted at <code>{trace.endorsement.locusPath}</code> by <b>{trace.endorsement.byParticipantId}</b>
  </div>
)}

      <div className="grid md:grid-cols-2 gap-4">
        {data?.designs?.map((d:any) => (
        <div key={d.id} className="border rounded p-2">
          {(() => {
            const first = (d.acts ?? [])[0];
            const start =
              first?.polarity === 'O' ? 'Start: Negative'
              : first?.polarity === 'P' ? 'Start: Positive'
              : 'Start: —';
            return (
              <div className="text-xs mb-1 flex items-center gap-2">
                <b>{d.participantId}</b> · {d.id.slice(0,6)}
                <span className="px-1.5 py-0.5 rounded border bg-slate-50">{start}</span>
              </div>
            );
          })()}
          <LociTree root={shapeToTree(d)} onPickBranch={pickAdditive} usedAdditive={trace?.usedAdditive} />
       </div>
        ))}
      </div>

      {/* NEW: Commitments per side */}
      <div className="grid md:grid-cols-2 gap-4">
        <CommitmentsPanel dialogueId={deliberationId} ownerId="Proponent" onChanged={() => { /* optional toast */ }} />
        <CommitmentsPanel dialogueId={deliberationId} ownerId="Opponent" onChanged={() => { /* optional toast */ }} />
      </div>

      {/* NEW: “why accepted” (replay chain) */}
      {trace && data?.designs && (
  <DefenseTree
    designs={data.designs}
    trace={trace ?? { steps: [], status: 'ONGOING' }}

    decisiveWindow={3}
    highlightIndices={trace.decisiveIndices}
  />
)}


  {/* {trace?.endorsement && (
  <div className="text-xs opacity-80">
    Accepted at <code>{trace.endorsement.locusPath}</code> by <b>{trace.endorsement.byParticipantId}</b>
  </div>
)} */}
  {/* inspector */}
  {focusIdx !== null && trace && (
    <ActInspector
      pos={findActById(trace.steps[focusIdx]?.posActId)}
      neg={findActById(trace.steps[focusIdx]?.negActId)}
      onClose={()=>setFocusIdx(null)}
    />
  )}

<JudgeConsole
  onForceConcession={onForceConcession}   // (locus, text, target?) — target is ignored by your current handler
  onCloseBranch={onCloseBranch}           // (locus, target?)
  onConcede={onConcede}                   // (locus, prop, conceding?)
//   onAssignBurden={(locus, to) => fetch('/api/ludics/judge/force', { /* action:'ASSIGN_BURDEN' */ })}
// onEndWithDaimon={(to, reason) => fetch('/api/ludics/daimon', { /* finalize → †(accept|fail) */ })}

  onStepNow={step}                        // step after action if “step after action” is checked
  locusSuggestions={['0','0.1','0.2']}    // optional
  defaultTarget="Opponent"
  
/>
    </div>
  );
}

function shapeToTree(d:any){
  const nodes = new Map<string, any>();
  const ensure = (path:string) => { if (!nodes.has(path)) nodes.set(path, { id:path, path, acts:[], children:[] }); return nodes.get(path); };
  for (const a of d.acts) {
    const p = a.locus?.path ?? '0';
    ensure(p).acts.push({ id:a.id, polarity:a.polarity, expression:a.expression, isAdditive:a.isAdditive });
    const parts = p.split('.'); for (let i=1;i<parts.length;i++){ ensure(parts.slice(0,i).join('.')); }
  }
  const all = Array.from(nodes.values());
  const byPath = Object.fromEntries(all.map((n:any)=>[n.path,n]));
  for (const n of all) {
    const parent = n.path.includes('.') ? n.path.split('.').slice(0,-1).join('.') : null;
    if (parent && byPath[parent]) byPath[parent].children.push(n);
  }
  return byPath['0'] || all[0];
}
