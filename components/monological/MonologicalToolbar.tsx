'use client';
import * as React from 'react';
import useSWR from 'swr';
import InlineSlotEditor from './InlineSlotEditor';
import QualityBadgeBreakdown from './QualityBadgeBreakdown';
import { QuantifierModalityPicker } from './QuantifierModalityPicker';

type Slot = 'ground'|'warrant'|'backing'|'qualifier'|'rebuttal';

const fetcher = (u: string)=>fetch(u,{cache:'no-store'}).then(r=>r.json());

export default function MonologicalToolbar({
  deliberationId,
  argument,
  cqSummary,              // optional: { satisfied:number, required:number }
  onChanged,
}: {
  deliberationId: string;
  argument: { id: string; text: string; claimId?: string | null };
  cqSummary?: { satisfied: number; required: number };
  onChanged?: () => void;
}) {
  const { data: ex } = useSWR<{ ok: boolean; slots: Record<string,string[]> }>(
    argument?.id ? `/api/monological/extract?argumentId=${encodeURIComponent(argument.id)}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const slots = ex?.slots ?? { claim:[], grounds:[], warrant:[], backing:[], qualifier:[], rebuttal:[] } as any;
  const have = {
    grounds:  (slots.grounds?.length ?? 0) > 0,
    warrant:  (slots.warrant?.length ?? 0) > 0,
    claim:    (slots.claim?.length ?? 0)   > 0,
  };
  const completeness = Math.round(100 * (['grounds','warrant','claim'].filter(k => (have as any)[k]).length / 3));

  const [editing, setEditing] = React.useState<Slot | null>(null);

  function MissingChecklist() {
    const need: Slot[] = [];
    if (!have.grounds) need.push('ground');
    if (!have.warrant) need.push('warrant');
    // backing/qualifier/rebuttal are optional by design but we surface them:
    if ((slots.backing?.length ?? 0) === 0) need.push('backing');
    if ((slots.qualifier?.length ?? 0) === 0) need.push('qualifier');
    if ((slots.rebuttal?.length ?? 0) === 0) need.push('rebuttal');
    if (!need.length) return null;
    return (
      <div className="text-[11px] text-neutral-600 flex flex-wrap gap-2">
        {need.map(s => (
          <button key={s} className="px-1.5 py-0.5 border rounded" onClick={() => setEditing(s)}>
            □ {s}
          </button>
        ))}
      </div>
    );
  }
// inside QuantifierModalityPicker consumer row
const saveQualifier = React.useMemo(() => {
    let t: any; 
    return (id: string, q: any, m: any) => {
      clearTimeout(t);
      t = setTimeout(() => {
        fetch(`/api/arguments/${id}/qualifier`, {
          method:'PUT', headers:{'content-type':'application/json'},
          body: JSON.stringify({ quantifier:q, modality:m })
        }).catch(()=>{});
      }, 400);
    };
  }, []);
  
  return (
    <div className="mt-2 rounded-lg border bg-white/90 p-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] px-1.5 py-0.5 rounded border bg-slate-50">
          Toulmin completeness: {completeness}%
        </span>

        <QualityBadgeBreakdown
          argumentText={argument.text}
          toulminPresence={have}
          fallacyCount={0}
          cqSatisfied={cqSummary?.satisfied ?? 0}
          cqRequired={cqSummary?.required ?? 0}
        />

        <div className="ml-2">
          <QuantifierModalityPicker
            initialQuantifier={null}
            initialModality={null}
            onChange={(q,m)=>saveQualifier(a.id, q, m)}
            />
        </div>

        <div className="ml-auto flex gap-2">
          {(['ground','warrant','backing','rebuttal'] as Slot[]).map(s => (
            <button key={s}
              className="px-2 py-1 border rounded text-[11px]"
              onClick={() => setEditing(s)}
              title={`Add ${s}`}
            >
              + {s}
            </button>
          ))}

          <button className="px-2 py-1 border rounded text-[11px]"
            title="Extract & review"
            onClick={()=>{/* SWR already fetched; opening missing checklist helps */}}>
            Extract
          </button>
        </div>
      </div>

      <div className="mt-2">
        <MissingChecklist />
      </div>
      <button
  className="px-2 py-1 border rounded text-[11px]"
  onClick={async ()=>{
    await fetch('/api/monological/bridge',{
      method:'POST', headers:{'content-type':'application/json'},
      body: JSON.stringify({ argumentId: a.id })
    });
    // let panels refresh
    window.dispatchEvent(new CustomEvent('dialogue:moves:refresh'));
  }}
>
  Open in dialogue
</button>
      {editing && (
        <InlineSlotEditor
          argumentId={argument.id}
          deliberationId={deliberationId}
          claimId={argument.claimId ?? undefined}
          slot={editing}
          onSaved={() => { setEditing(null); onChanged?.(); }}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  );
}
