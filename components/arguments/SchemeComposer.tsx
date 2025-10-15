'use client';
import * as React from 'react';
import { listSchemes, createArgument, getArgumentCQs, askCQ } from '@/lib/client/aifApi';
import { ClaimPicker } from '@/components/claims/ClaimPicker';
import dynamic from 'next/dynamic';
import { LegalMoveToolbarAIF } from '@/components/dialogue/LegalMoveToolbarAIF';
import { SchemeComposerPicker } from '../SchemeComposerPicker';
import { ClaimConfidence } from '@/components/evidence/ClaimConfidence';

export type AttackContext =
  | { mode: 'REBUTS'; targetClaimId: string; hint?: string }
  | { mode: 'UNDERCUTS'; targetArgumentId: string; hint?: string }
  | { mode: 'UNDERMINES'; targetPremiseId: string; hint?: string }
  | null;

type Props = {
  deliberationId: string;
  authorId: string;
  conclusionClaim: { id?: string; text?: string };      // ⬅️ allow missing id
  defaultSchemeKey?: string | null;
  attackContext?: AttackContext;                             // ✅ NEW
  onCreated?: (argumentId: string) => void;
  onCreatedDetail?: (arg: {
    id: string;
    conclusion: { id: string; text: string };
    premises: { id: string; text: string }[];
  }) => void;
  onChangeConclusion?: (c: { id: string; text?: string }) => void;   // ⬅️ NEW
};

type Prem = { id: string; text: string };
type Scheme = {
  id: string; key: string; name: string;
  slotHints?: { premises?: { role: string; label: string }[] } | null;
  cqs?: Array<{ cqKey: string; text: string; attackType: 'REBUTS'|'UNDERCUTS'|'UNDERMINES'; targetScope: 'conclusion'|'inference'|'premise' }>;
};

export function SchemeComposer({
  deliberationId, authorId, conclusionClaim, defaultSchemeKey,
  attackContext = null, onCreated, onCreatedDetail, onChangeConclusion,
}: Props) {
  const [schemes, setSchemes] = React.useState<Array<{ id:string; key:string; name:string; slotHints?: any; cqs?: any[]}>>([]);
  const [schemeKey, setSchemeKey] = React.useState(defaultSchemeKey ?? '');
  const [premises, setPremises] = React.useState<Prem[]>([]);
  const [notes, setNotes] = React.useState('');
  const [creating, setCreating] = React.useState(false);
  const [argumentId, setArgumentId] = React.useState<string | null>(null);
  const [cqs, setCqs] = React.useState<Array<{ cqKey:string; text:string; status:'open'|'answered'; attackType:string; targetScope:string }>>([]);
  const [err, setErr] = React.useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = React.useState(false);

  React.useEffect(() => { listSchemes().then(setSchemes).catch(() => setSchemes([])); }, []);

  const selected = schemes.find(s => s.key === schemeKey) || null;
  const hasConclusion = Boolean(conclusionClaim?.id);
  const canCreate = Boolean(authorId && hasConclusion && premises.length > 0);

  function removePremise(id: string) { setPremises(ps => ps.filter(p => p.id !== id)); }


  // small helper to post CA (conflict application)
  async function postCA(body: any, signal?: AbortSignal) {
    const r = await fetch('/api/ca', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j?.ok === false) throw new Error(j?.error || `HTTP ${r.status}`);
  }

  async function handleCreate() {
    if (!canCreate) {
      setErr(!premises.length ? 'Add at least one premise.' :
            !hasConclusion ? 'Pick a conclusion claim.' : 'User not ready.');
      return;
    }
    setErr(null); setCreating(true);
    const ctrl = new AbortController();
    try {
      const id = await createArgument({
        deliberationId,
        authorId,
        conclusionClaimId: conclusionClaim.id!,                 // now guaranteed
        premiseClaimIds: premises.map(p => p.id),
        schemeId: selected?.id ?? null,
        implicitWarrant: notes ? { text: notes } : null
      });
      setArgumentId(id);
      onCreated?.(id);
      onCreatedDetail?.({
        id,
        conclusion: { id: conclusionClaim.id!, text: conclusionClaim.text ?? conclusionClaim.id! },
        premises,
      });
      // If launched in attack mode, attach CA now (use the *new* argument's conclusion as conflicting claim)
      if (attackContext) {
        if (attackContext.mode === 'REBUTS') {
          await postCA({
            deliberationId,
            conflictingClaimId: conclusionClaim.id,
            conflictedClaimId: attackContext.targetClaimId,
            legacyAttackType: 'REBUTS',
            legacyTargetScope: 'conclusion',
          }, ctrl.signal);
        } else if (attackContext.mode === 'UNDERCUTS') {
          await postCA({
            deliberationId,
            conflictingClaimId: conclusionClaim.id,
            conflictedArgumentId: attackContext.targetArgumentId,
            legacyAttackType: 'UNDERCUTS',
            legacyTargetScope: 'inference',
          }, ctrl.signal);
        } else if (attackContext.mode === 'UNDERMINES') {
          await postCA({
            deliberationId,
            conflictingClaimId: conclusionClaim.id,
            conflictedClaimId: attackContext.targetPremiseId,
            legacyAttackType: 'UNDERMINES',
            legacyTargetScope: 'premise',
          }, ctrl.signal);
        }
      }

      const items = await getArgumentCQs(id);
      setCqs(items || []);
      window.dispatchEvent(new CustomEvent('claims:changed', { detail: { deliberationId } }));
    } catch (e:any) {
      setErr(e.message || 'create_failed');
    } finally {
      setCreating(false);
      ctrl.abort();
    }
  }
  
  return (
    <div className="bg-transparent space-y-4">
      <div className="rounded-md border bg-transparent p-4 ">
        <div className="text-[14px] text-gray-500 ">
          {selected ? <>Using scheme: <b>{selected.name}</b></> : 'Freeform argument'}
        </div>
        <hr className="border-slate-200 my-2" />

        <div className="grid gap-3 md:grid-cols-3">
          <label className="flex flex-col gap-1 md:col-span-1">
            <span className="text-sm text-gray-800">Scheme</span>
            <select
              className="w-full border rounded px-2 py-1 text-xs menuv2--lite"
              value={schemeKey}
              onChange={e=>setSchemeKey(e.target.value)}
            >
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

          {/* ⇩ Conclusion: readable + change/pick control */}
          <label className="flex flex-col gap-1 md:col-span-2">
            <span className="text-sm text-gray-800">Conclusion</span>
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0 border border-slate-500 rounded px-3 py-1 text-xs bg-white">
                {hasConclusion ? (conclusionClaim.text ?? conclusionClaim.id) : <span className="text-slate-400">No conclusion selected</span>}
              </div>
               <SchemeComposerPicker
        kind="claim"
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(it) => {
          setPremises(ps => ps.some(p => p.id === it.id) ? ps : [...ps, { id: it.id, text: it.label }]);
          setPickerOpen(false);
        }}
      />
            </div>
          </label>
        </div>

        <hr className="border-slate-200 my-3" />

        {/* Premises picker */}
        <div className="mt-2">
          <div className="flex items-center justify-start gap-3">
            <span className="text-sm text-gray-800">Premises</span>
            <button className="text-xs px-2 py-1 rounded-lg btnv2--ghost" onClick={() => setPickerOpen(true)}>
              + Add premise
            </button>
          </div>
          {premises.length ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {premises.map(p => (
                <li key={p.id} className="flex items-center gap-2 px-2 py-1 rounded-full border bg-slate-50">
                  <span className="text-xs">{p.text || p.id}</span>
                  <button className="text-[10px] text-slate-500 underline" onClick={()=>removePremise(p.id)}>remove</button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-slate-500 mt-2">No premises yet.</div>
          )}
        </div>

        <hr className="border-slate-200 my-3" />

        {/* Optional notes / warrant */}
        <label className="flex flex-col gap-2 mt-0">
          <span className="text-sm text-gray-800">Justification</span>
          <textarea className="w-full articlesearchfield rounded-lg text-xs p-3 mt-1"
           cols={3} value={notes} 
           placeholder='If [premises], then [conclusion] (unless [exception]).' onChange={e=>setNotes(e.target.value)} />
        </label>

        <div className="flex items-center gap-3 mt-4">
          <button
            className="px-3 py-2 text-sm tracking-wide font-medium rounded-xl btnv2 disabled:opacity-50"
            disabled={creating || !canCreate}
            onClick={handleCreate}
          >
            {creating ? 'Creating…' : 'Create argument'}
          </button>
          {err && <span className="text-sm text-rose-700">{err}</span>}
        </div>

        {!!argumentId && !!cqs.length && (
          <div className="mt-4 border-t pt-3">
            {/* CQs section unchanged */}
          </div>
        )}
      </div>

      {/* Confidence & moves */}
      {hasConclusion && (
        <>
          <ClaimConfidence deliberationId={deliberationId} claimId={conclusionClaim.id!} mode="min" tau={0.7} />
          {hasConclusion && (
  <div className={!argumentId ? "opacity-60 pointer-events-none" : ""}>
    <LegalMoveToolbarAIF
      deliberationId={deliberationId}
      targetType="claim"
      targetId={conclusionClaim.id!}
      onPosted={() => window.dispatchEvent(new CustomEvent('dialogue:moves:refresh', { detail:{ deliberationId } } as any))}
    />
    {!argumentId && (
      <div className="text-xs text-slate-500 mt-1">
        Create the argument first to enable GROUNDS/CLOSE here.
      </div>
    )}
  </div>
)}
        </>
      )}

      {/* Premise picker modal */}
      <SchemeComposerPicker
        kind="claim"
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(it) => {
          setPremises(ps => ps.some(p => p.id === it.id) ? ps : [...ps, { id: it.id, text: it.label }]);
          setPickerOpen(false);
        }}
      />
    </div>
  );
}