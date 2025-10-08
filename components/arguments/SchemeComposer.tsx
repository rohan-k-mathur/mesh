// components/arguments/SchemeComposer.tsx
'use client';
import * as React from 'react';
import { listSchemes, createArgument, getArgumentCQs, askCQ } from '@/lib/client/aifApi';
import { ClaimPicker } from '@/components/claims/ClaimPicker';
import { LegalMoveToolbarAIF } from '@/components/dialogue/LegalMoveToolbarAIF';
import { AttackMenuPro } from '@/components/arguments/AttackMenuPro';
import { EntityPicker } from '@/components/kb/EntityPicker';



type Props = {
  deliberationId: string;
  authorId: string;
  conclusionClaim: { id: string; text?: string };
  defaultSchemeKey?: string | null;
  onCreated?: (argumentId: string) => void;
};

type Prem = { id: string; text: string };


type Scheme = {
  id: string; key: string; name: string;
  slotHints?: { premises?: { role: string; label: string }[] } | null;
  cqs?: Array<{ cqKey: string; text: string; attackType: 'REBUTS'|'UNDERCUTS'|'UNDERMINES'; targetScope: 'conclusion'|'inference'|'premise' }>;
};


export function SchemeComposer({ deliberationId, authorId, conclusionClaim, defaultSchemeKey, onCreated }: Props) {
  const [schemes, setSchemes] = React.useState<Array<{ id:string; key:string; name:string; slotHints?: any; cqs?: any[]}>>([]);
  const [schemeKey, setSchemeKey] = React.useState(defaultSchemeKey ?? '');
  // was: const [premiseIds, setPremiseIds] = React.useState<string[]>([]);
  const [premises, setPremises] = React.useState<Prem[]>([]);
  const [notes, setNotes] = React.useState('');
  const [creating, setCreating] = React.useState(false);
  const [argumentId, setArgumentId] = React.useState<string | null>(null);
  const [cqs, setCqs] = React.useState<Array<{ cqKey:string; text:string; status:'open'|'answered'; attackType:string; targetScope:string }>>([]);
  const [err, setErr] = React.useState<string | null>(null);


  const [pickerOpen, setPickerOpen] = React.useState(false);

    React.useEffect(() => { listSchemes().then(setSchemes).catch(() => setSchemes([])); }, []);



  const selected = schemes.find(s => s.key === schemeKey) || null;
  const canCreate = Boolean(
    authorId && conclusionClaim?.id && premises.length > 0
  );

  function removePremise(id: string) {
    setPremises(ps => ps.filter(p => p.id !== id));
  }



  async function handleCreate() {
    if (!canCreate) {
      setErr(!premises.length ? 'Add at least one premise.' : !conclusionClaim?.id ? 'Pick a conclusion claim.' : 'User not ready.');
      return;
    }
    setErr(null); setCreating(true);
    try {
      const id = await createArgument({
        deliberationId,
        authorId,
        conclusionClaimId: conclusionClaim.id,              // guaranteed non-empty now
        premiseClaimIds: premises.map(p => p.id),
        schemeId: selected?.id ?? null,
        implicitWarrant: notes ? { text: notes } : null
      });
      setArgumentId(id);
      onCreated?.(id);

      const items = await getArgumentCQs(id);
      setCqs(items);

      window.dispatchEvent(new CustomEvent('claims:changed', { detail: { deliberationId } }));
    } catch (e:any) {
      setErr(e.message || 'create_failed');
    } finally {
      setCreating(false);
    }
  }


  async function openCQ(cqKey: string) {
    if (!argumentId) return;
    await askCQ(argumentId, cqKey, { authorId, deliberationId });
    setCqs(cs => cs.map(c => c.cqKey === cqKey ? { ...c, status:'open' } : c));
  }

  return (
    <div className=" space-y-4">
      <div className="rounded-md border bg-white p-4">
        <div className="text-sm text-gray-500 mb-2">
          {selected ? <>Using scheme: <b>{selected.name}</b></> : 'Freeform argument'}
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="block md:col-span-1">
            <span className="text-xs text-gray-600">Scheme</span>
            <select className="w-full border rounded px-2 py-1"
                    value={schemeKey}
                    onChange={e=>setSchemeKey(e.target.value)}>
              <option value="">(Choose)</option>
              {schemes.map(s => <option key={s.key} value={s.key}>{s.name}</option>)}
            </select>
            {selected?.slotHints?.premises?.length ? (
              <div className="mt-1 flex gap-1 flex-wrap">
                {selected.slotHints.premises.map((p: any) => (
                  <span key={p.role} className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs">{p.label}</span>
                ))}
              </div>
            ) : null}
          </label>

          <label className="block md:col-span-2">
            <span className="text-xs text-gray-600">Conclusion</span>
            <div className="w-full border rounded px-2 py-1 bg-gray-50">
              {conclusionClaim.text ?? conclusionClaim.id}
            </div>
          </label>
        </div>

        {/* Premises picker (replaces comma-separated IDs) */}
        <div className="mt-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Premises</span>
            <button className="text-xs px-2 py-1 rounded border bg-white hover:bg-slate-50"
                    onClick={() => setPickerOpen(true)}>
              + Add premise
            </button>
          </div>
          {premises.length ? (
            <ul className="mt-2 flex flex-wrap gap-2">
              {premises.map(p => (
                <li key={p.id} className="flex items-center gap-2 px-2 py-1 rounded-full border bg-slate-50">
                  <span className="text-xs">{p.text || p.id}</span>
                  <button className="text-[10px] text-slate-500 underline" onClick={()=>removePremise(p.id)}>remove</button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-xs text-slate-500 mt-1">No premises yet.</div>
          )}
        </div>

        {/* Optional notes / warrant */}
        <label className="block mt-3">
          <span className="text-xs text-gray-600">Notes / implicit warrant (optional)</span>
          <textarea className="w-full border rounded px-2 py-1" value={notes} onChange={e=>setNotes(e.target.value)} />
        </label>

        <div className="flex items-center gap-3 mt-4">
       <button
    className="px-3 py-1 rounded bg-black text-white disabled:opacity-50"
    disabled={creating || !canCreate}
    onClick={handleCreate}
  >
    {creating ? 'Creating…' : 'Create argument'}
  </button>
          {err && <span className="text-sm text-rose-700">{err}</span>}
        </div>

        {!!argumentId && !!cqs.length && (
          <div className="mt-4 border-t pt-3">
            <div className="text-xs text-gray-600 mb-1">Critical Questions</div>
            <div className="flex gap-2 flex-wrap">
              {cqs.map(c => (
                <button key={c.cqKey}
                        className={`px-2 py-0.5 rounded-full text-xs border ${c.status==='answered' ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}
                        onClick={() => askCQ(argumentId!, c.cqKey, { authorId, deliberationId })}
                        title={`${c.text} (${c.attackType.toLowerCase()}/${c.targetScope})`}>
                  {c.status === 'answered' ? '✅' : '⚠️'} {c.cqKey}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {!!argumentId && (
        <div className="rounded-md border bg-white p-3">
          <div className="text-xs text-gray-600 mb-2">Challenge options</div>
          <AttackMenuPro
            deliberationId={deliberationId}
            authorId={authorId}
            target={{
              id: argumentId!,
              conclusion: { id: conclusionClaim.id, text: conclusionClaim.text ?? "" },
              premises: premises
            }}
          />
        </div>
      )}

      <LegalMoveToolbarAIF
        deliberationId={deliberationId}
        targetType="claim"
        targetId={conclusionClaim.id}
        onPosted={() => window.dispatchEvent(new CustomEvent('dialogue:moves:refresh', { detail:{ deliberationId } } as any))}
      />

      {/* ---- EntityPicker modal (reuse KB picker) ---- */}
      <EntityPicker
        kind="claim"
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(it) => {
          setPremises(ps => {
            const exists = ps.some(p => p.id === it.id);
            return exists ? ps : [...ps, { id: it.id, text: it.label }];
          });
          setPickerOpen(false);
        }}
      />
    </div>
  );
}