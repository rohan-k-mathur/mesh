'use client';
import * as React from 'react';

type WorkLite = { id: string; deliberationId: string; title: string; theoryType: 'DN'|'IH'|'TC'|'OP' };

type AdequacyItem = { id: string; criterion: string; result: 'pass'|'partial'|'fail' };

export default function EvaluationSheet() {
  const [open, setOpen] = React.useState(false);
  const [ctx, setCtx] = React.useState<{ toWorkId: string; fromWorkId: string } | null>(null);

  const [fromWork, setFromWork] = React.useState<WorkLite | null>(null);
  const [toWork, setToWork]     = React.useState<WorkLite | null>(null);
  const [deliberationId, setDeliberationId] = React.useState<string | null>(null);

  const [mcda, setMcda] = React.useState<any | null>(null);
  const [method, setMethod] = React.useState<'mcda'|'adequacy'>('mcda');
  const [verdict, setVerdict] = React.useState<string>('');

  const [adequacy, setAdequacy] = React.useState<AdequacyItem[]>([
    { id: crypto.randomUUID(), criterion: 'Completeness', result: 'pass' },
    { id: crypto.randomUUID(), criterion: 'Robustness',   result: 'partial' },
  ]);

  const [pending, setPending] = React.useState(false);
  const [error, setError]     = React.useState<string | null>(null);

  // open handler from outside
  React.useEffect(() => {
    const onOpen = (e: any) => {
      setCtx(e.detail);
      setOpen(true);
    };
    window.addEventListener('mesh:open-evaluation-sheet' as any, onOpen);
    return () => window.removeEventListener('mesh:open-evaluation-sheet' as any, onOpen);
  }, []);

  // load work basics + MCDA snapshot
  React.useEffect(() => {
    if (!open || !ctx) return;

    setError(null);
    setFromWork(null);
    setToWork(null);
    setDeliberationId(null);
    setMcda(null);

    (async () => {
      try {
        const [src, dst] = await Promise.all([
          fetch(`/api/works/${ctx.fromWorkId}`, { cache:'no-store' }).then(r=>r.ok?r.json():null),
          fetch(`/api/works/${ctx.toWorkId}`,   { cache:'no-store' }).then(r=>r.ok?r.json():null),
        ]);
        if (src?.work) setFromWork(src.work as WorkLite);
        if (dst?.work) {
          setToWork(dst.work as WorkLite);
          setDeliberationId(dst.work.deliberationId);
        }

        // pull MCDA snapshot if present
        try {
          const j = await fetch(`/api/works/${ctx.fromWorkId}/practical`, { cache:'no-store' }).then(r=>r.ok?r.json():null);
          const m = j?.justification?.result ?? null;
          setMcda(m);
          setMethod(m ? 'mcda' : 'adequacy');
        } catch {
          setMethod('adequacy');
        }
      } catch (err:any) {
        setError(err?.message ?? 'Failed to load works');
      }
    })();
  }, [open, ctx]);

  if (!open || !ctx) return null;

  function updateAdequacyItem(id: string, patch: Partial<AdequacyItem>) {
    setAdequacy(items => items.map(it => it.id === id ? { ...it, ...patch } : it));
  }
  function addAdequacyItem() {
    setAdequacy(items => [...items, { id: crypto.randomUUID(), criterion: '', result: 'pass' }]);
  }
  function removeAdequacyItem(id: string) {
    setAdequacy(items => items.filter(it => it.id !== id));
  }

  async function submit() {
    setPending(true);
    setError(null);
    try {
      if (!deliberationId) {
        setError('Missing deliberationId for target work');
        setPending(false);
        return;
      }

      const meta: any = { method, verdict };
      if (method === 'mcda') {
        meta.mcda = mcda ?? null;
        if (!meta.mcda) {
          setError('No MCDA snapshot found on source work; pick “Adequacy” or add a Practical result.');
          setPending(false);
          return;
        }
      } else {
        // pack adequacy checklist
        meta.adequacy = {
          items: adequacy
            .map(a => ({ criterion: a.criterion.trim(), result: a.result }))
            .filter(a => a.criterion.length > 0),
        };
      }

      const r = await fetch('/api/knowledge-edges', {
        method: 'POST',
        headers: { 'content-type':'application/json' },
        body: JSON.stringify({
          deliberationId,
          kind: 'EVALUATES',
          fromWorkId: ctx.fromWorkId,
          toWorkId: ctx.toWorkId,
          meta,
        }),
      });
      if (!r.ok) {
        const txt = await r.text();
        setError(`Save failed: ${r.status} ${txt}`);
        setPending(false);
        return;
      }

      // notify others (e.g. SupplyDrawer) to refresh
      window.dispatchEvent(new CustomEvent('mesh:edges-updated', { detail: { toWorkId: ctx.toWorkId } }));
      setOpen(false);
    } catch (err:any) {
      setError(err?.message ?? 'Unknown error');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/25" onClick={()=>setOpen(false)}>
      <div
        className="absolute right-0 top-0 h-full w-[460px] bg-white border-l p-3"
        onClick={e=>e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Evaluation</div>
          <button className="text-xs underline" onClick={()=>setOpen(false)}>Close</button>
        </div>

        <div className="mt-3 space-y-2 text-sm">
          <div className="text-[12px] text-neutral-600">
            Comparing <b>{fromWork?.title ?? ctx.fromWorkId}</b> → <b>{toWork?.title ?? ctx.toWorkId}</b>
          </div>

          {/* Method choice */}
          <div className="mt-2">
            <label className="text-xs text-neutral-600">Method</label>
            <div className="mt-1 flex items-center gap-3 text-xs">
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="eval-method"
                  value="mcda"
                  checked={method === 'mcda'}
                  onChange={()=>setMethod('mcda')}
                  disabled={!mcda}
                />
                MCDA snapshot {mcda ? 'found' : '(none)'}
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="eval-method"
                  value="adequacy"
                  checked={method === 'adequacy'}
                  onChange={()=>setMethod('adequacy')}
                />
                Adequacy checklist
              </label>
            </div>
          </div>

          {/* MCDA summary */}
          {method === 'mcda' && (
            <div className="rounded border p-2 bg-neutral-50 text-[12px]">
              {mcda ? (
                <>
                  <div>Best option: <b>{mcda.bestOptionId ?? '—'}</b></div>
                  <div>Options: {Object.keys(mcda.totals ?? {}).length}</div>
                </>
              ) : (
                <div className="text-neutral-500">No MCDA result on source work.</div>
              )}
            </div>
          )}

          {/* Adequacy editor */}
          {method === 'adequacy' && (
            <div className="rounded border p-2 bg-neutral-50">
              <div className="text-[11px] text-neutral-600 mb-1">Checklist</div>
              <div className="space-y-2">
                {adequacy.map(item => (
                  <div key={item.id} className="flex items-center gap-2">
                    <input
                      className="flex-1 border rounded px-2 py-1 text-xs"
                      placeholder="Criterion (e.g., Completeness)"
                      value={item.criterion}
                      onChange={e=>updateAdequacyItem(item.id, { criterion: e.target.value })}
                    />
                    <select
                      className="border rounded px-1 py-1 text-xs"
                      value={item.result}
                      onChange={e=>updateAdequacyItem(item.id, { result: e.target.value as any })}
                    >
                      <option value="pass">pass</option>
                      <option value="partial">partial</option>
                      <option value="fail">fail</option>
                    </select>
                    <button className="text-[11px] underline" onClick={()=>removeAdequacyItem(item.id)}>remove</button>
                  </div>
                ))}
                <button className="text-[11px] underline" onClick={addAdequacyItem}>+ add row</button>
              </div>
            </div>
          )}

          {/* Verdict */}
          <label className="block text-xs text-neutral-600">Verdict (optional)</label>
          <input
            className="w-full border rounded px-2 py-1"
            value={verdict}
            onChange={e=>setVerdict(e.target.value)}
            placeholder="e.g., Source dominates target on robustness and completeness"
          />

          <div className="text-[11px] text-neutral-500">
            If the source work has a Practical (MCDA) result and you choose “MCDA snapshot,” it will be included automatically.
          </div>

          {error && <div className="text-[12px] text-rose-600">{error}</div>}

          <button className="px-2 py-1 border rounded text-xs bg-white" onClick={submit} disabled={pending}>
            {pending ? 'Saving…' : 'Save EVALUATES edge'}
          </button>
        </div>
      </div>
    </div>
  );
}
