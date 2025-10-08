'use client';

import * as React from 'react';
import useSWR, { mutate as swrMutate } from "swr";
import useSWRInfinite from 'swr/infinite';
import { Virtuoso } from 'react-virtuoso';
import { AttackMenuPro } from '@/components/arguments/AttackMenuPro';
import { LegalMoveToolbar } from '@/components/dialogue/LegalMoveToolbar';
import { listSchemes, getArgumentCQs, askCQ } from '@/lib/client/aifApi';
import PromoteToClaimButton from '@/components/claims/PromoteToClaimButton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import Spinner from '@/components/ui/spinner';



type Arg = {
  id: string;
  text: string;
  createdAt: string;
  authorId: string;
  mediaType?: 'text'|'image'|'video'|'audio'|null;
  mediaUrl?: string|null;
  claimId?: string|null;
  schemeId?: string|null;
  approvalsCount?: number;
};

type AifMeta = {
  scheme?: { id: string; key: string; name: string; slotHints?: { premises?: { role: string; label: string }[] } | null } | null;
  conclusion?: { id: string; text: string } | null;
  premises?: Array<{ id: string; text: string; isImplicit?: boolean }> | null;
  implicitWarrant?: { text?: string } | null;
  attacks?: { REBUTS: number; UNDERCUTS: number; UNDERMINES: number };
  cq?: { required: number; satisfied: number };
};


type AifRow = {
  id: string;
  deliberationId: string;
  authorId: string;
  createdAt: string;
  text: string;
  mediaType: 'text'|'image'|'video'|'audio' | null;
  aif: AifMeta;
  // optional: legacy fields may not exist on this route
  claimId?: string | null;
};

const fetcher = (u: string) => fetch(u, { cache: 'no-store' }).then(r => {
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
});



const PAGE = 20;

/** -------------------------------------------
 * Small visual atoms
 * ------------------------------------------*/

/* ---------- Small atoms ---------- */
function SchemeBadge({ scheme }: { scheme?: AifMeta['scheme'] }) {
  if (!scheme) return null;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border bg-indigo-50 text-indigo-700 border-indigo-200 px-2 py-0.5 text-[11px]"
      title={scheme?.slotHints?.premises?.length ? scheme!.slotHints!.premises!.map(p => p.label).join(' · ') : scheme?.name}
    >
      {scheme?.name}
    </span>
  );
}
function CqMeter({ cq }: { cq?: { required: number; satisfied: number } }) {
  const r = cq?.required ?? 0, s = cq?.satisfied ?? 0;
  const pct = r ? Math.round((s / r) * 100) : 0;
  return (
    <span className="text-[10px] px-1 py-0.5 rounded border bg-white" title={r ? `${s}/${r} CQs satisfied` : 'No CQs yet'}>
      CQ {pct}%
    </span>
  );
}
function AttackCounts({ a }: { a?: AifMeta['attacks'] }) {
  if (!a) return null;
  return (
    <div className="inline-flex items-center gap-1 text-[11px]">
      <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200" title="Rebuts (attacks conclusion)">{a.REBUTS ?? 0}</span>
      <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200" title="Undercuts (attacks inference)">{a.UNDERCUTS ?? 0}</span>
      <span className="px-1.5 py-0.5 rounded bg-slate-50 text-slate-700 border border-slate-200" title="Undermines (attacks premise)">{a.UNDERMINES ?? 0}</span>
    </div>
  );
}
function ClampedBody({ text, lines = 4, onOpen }: { text: string; lines?: number; onOpen: () => void }) {
  return (
    <div className="relative">
      <div className={`text-sm whitespace-pre-wrap line-clamp-${lines}`}>{text}</div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white/90 to-transparent" />
      <button className="btnv2--ghost py-0 px-3 rounded btnv2--sm absolute right-0 bottom-0 translate-y-1 translate-x-2"
              onClick={onOpen}>More</button>
    </div>
  );
}


/** -------------------------------------------
 * Filter bar (client-side search + scheme filter)
 * ------------------------------------------*/
function Controls({
  schemes, schemeKey, setSchemeKey, q, setQ, showPremises, setShowPremises
}: {
  schemes: Array<{ key:string; name:string }>;
  schemeKey: string; setSchemeKey: (k:string)=>void;
  q: string; setQ: (s:string)=>void;
  showPremises: boolean; setShowPremises: (v:boolean)=>void;
}) {
  return (
    <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between p-2 border-b bg-white/70 rounded-t-md">
      <div className="flex items-center gap-2">
        <label className="text-xs text-slate-600">
          <span className="mr-1">Scheme</span>
          <select value={schemeKey} onChange={e=>setSchemeKey(e.target.value)}
                  className="px-2 py-1 rounded border bg-white text-sm" aria-label="Filter by scheme">
            <option value="">All</option>
            {schemes.map(s => <option key={s.key} value={s.key}>{s.name}</option>)}
          </select>
        </label>
        <label className="text-xs text-slate-600">
          <span className="mr-1">Search</span>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Conclusion or premise…"
                 className="px-2 py-1 rounded border bg-white text-sm min-w-[16rem]" aria-label="Search arguments" />
        </label>
      </div>
      <label className="text-xs text-slate-600 inline-flex items-center gap-2">
        <input type="checkbox" checked={showPremises} onChange={e=>setShowPremises(e.target.checked)} />
        Show premise chips
      </label>
    </div>
  );
}

/** -------------------------------------------
 * AIF row
 * ------------------------------------------*/

/* ---------- Row ---------- */
function Row({
  a, meta, deliberationId, showPremises, onPromoted, onRefresh
}: {
  a: AifRow;
  meta: AifMeta;
  deliberationId: string;
  showPremises: boolean;
  onPromoted: () => void;
  onRefresh: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [cqs, setCqs] = React.useState<Array<{ cqKey:string; text:string; status:'open'|'answered'; attackType:string; targetScope:string }>>([]);

  React.useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const items = await getArgumentCQs(a.id); // safe: handled internally; errors ignored
        if (!cancel) setCqs(items || []);
      } catch {/* ignore; protected by asJson and effect */ }
    })();
    return () => { cancel = true; };
  }, [a.id]);

  const conclusionText = meta?.conclusion?.text || a.text || '';

  return (
    <article id={`arg-${a.id}`} className="rounded border bg-white/80 p-2" aria-label={`Argument ${a.id}`}>
      <header className="flex items-start gap-2 justify-between">
        <div className="flex-1">
          <h4 className="text-sm font-medium leading-snug">{conclusionText}</h4>

          {showPremises && !!(meta?.premises?.length) && (
            <ul className="mt-1 flex flex-wrap gap-1" aria-label="Premises">
              {meta!.premises!.map(p => (
                <li key={p.id} className="text-[11px] px-1.5 py-0.5 rounded-full border bg-slate-50">
                  {p.text || p.id}
                </li>
              ))}
            </ul>
          )}

          {!!meta?.implicitWarrant?.text && (
            <div className="mt-1 text-[11px] px-2 py-1 rounded bg-amber-50 border border-amber-200 text-amber-800">
              Warrant: {meta.implicitWarrant.text}
            </div>
          )}
        </div>

        <div className="shrink-0 flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <SchemeBadge scheme={meta?.scheme} />
            <CqMeter cq={meta?.cq} />
          </div>
          <AttackCounts a={meta?.attacks} />
        </div>
      </header>

      <section className="mt-2">
        {a.text.length > 240 ? (
          <ClampedBody text={a.text} onOpen={()=>setOpen(true)} />
        ) : (
          <div className="text-sm whitespace-pre-wrap">{a.text}</div>
        )}
      </section>

      <footer className="mt-2 flex flex-wrap items-center gap-2">
        <LegalMoveToolbar
          deliberationId={deliberationId}
          targetType="argument"
          targetId={a.id}
          onPosted={() => window.dispatchEvent(new CustomEvent('dialogue:moves:refresh', { detail:{ deliberationId } } as any))}
        />

        {!!cqs.length && (
          <div className="ml-1 flex gap-1 flex-wrap" aria-label="Critical questions">
            {cqs.map(c => (
              <button
                key={c.cqKey}
                className={`px-2 py-0.5 rounded-full text-[11px] border ${c.status==='answered' ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}
                onClick={async () => {
                  await askCQ(a.id, c.cqKey, { authorId: a.authorId, deliberationId });
                  setCqs(cs => cs.map(x => x.cqKey === c.cqKey ? { ...x, status:'open' } : x));
                }}
                title={`${c.text} (${c.attackType.toLowerCase()}/${c.targetScope})`}
              >
                {c.status === 'answered' ? '✅' : '⚠️'} {c.cqKey}
              </button>
            ))}
          </div>
        )}

        <span className="ml-auto" />
        <AttackMenuPro
          deliberationId={deliberationId}
          authorId={a.authorId ?? 'current'}
          target={{
            id: a.id,
            conclusion: { id: meta?.conclusion?.id ?? '', text: conclusionText ?? '' },
            premises: meta?.premises ?? []
          }}
        />

        {/* “Promoted ✓” in the legacy sense is “has a claim record”.
            With AIF v0.5, we have a conclusion claim always; keep the affordance:
        */}
        {meta?.conclusion?.id ? (
          <span className="text-[11px] px-2 py-1 rounded border border-emerald-300 bg-emerald-50 text-emerald-700">Promoted ✓</span>
        ) : (
          <PromoteToClaimButton
            deliberationId={deliberationId}
            target={{ type: 'argument', id: a.id }}
            onClaim={async () => { onPromoted(); onRefresh(); }}
          />
        )}

        <button
          className="px-2 py-1 btnv2--ghost rounded text-xs"
          onClick={() => {
            const url = `${location.origin}${location.pathname}#arg-${a.id}`;
            navigator.clipboard.writeText(url).catch(()=>{});
          }}
          title="Copy a direct link to this argument"
        >
          Copy link
        </button>
      </footer>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[60vh] bg-slate-50 rounded-xl overflow-y-auto p-4">
          <DialogHeader><DialogTitle>Full argument</DialogTitle></DialogHeader>
          <div className="whitespace-pre-wrap text-sm">{a.text}</div>
          <div className="mt-3 flex justify-end"><DialogClose className="btnv2">Close</DialogClose></div>
        </DialogContent>
      </Dialog>
    </article>
  );
}

/** -------------------------------------------
 * Main list (non-destructive; lives next to existing ArgumentsList)
 * ------------------------------------------*/
export default function AIFArgumentsListPro({
  deliberationId,
  onVisibleTextsChanged,
}: {
  deliberationId: string;
  onVisibleTextsChanged?: (texts: string[]) => void;
}) {
  // scheme list for filter UI
  const [schemes, setSchemes] = React.useState<Array<{ key:string; name:string }>>([]);
  React.useEffect(() => {
    let c = false;
    listSchemes().then(items => {
      if (!c) setSchemes((items || []).map((s:any) => ({ key: s.key, name: s.name })));
    }).catch(()=>setSchemes([]));
    return () => { c = true; };
  }, []);

  // client-side filters
  const [schemeKey, setSchemeKey] = React.useState('');
  const [q, setQ] = React.useState('');
  const [showPremises, setShowPremises] = React.useState(true);

  // base list
  const getKey = (idx: number, prev: any) => {
  if (prev && !prev.nextCursor) return null;
  const cursor = prev?.nextCursor ? `&cursor=${encodeURIComponent(prev.nextCursor)}` : '';
  return `/api/deliberations/${encodeURIComponent(deliberationId)}/arguments/aif?limit=20${cursor}`;
};

const { data, error, size, setSize, isLoading } = useSWRInfinite(getKey, fetcher, { revalidateOnFocus: false });
const pages = data ?? [];
const rows = pages.flatMap(p => p?.items ?? []);            // each is AifRow

// No need for extra AIF fetches:
const aifBatch: { items?: AifMeta[] } | undefined = undefined;
const [aifMap, setAifMap] = React.useState<Record<string, AifMeta>>({});

  // AIF meta hydration: batch → row fallbacks
  const ids = React.useMemo(() => rows.map(r => r.id), [rows]);
  const idsParam = ids.length ? `ids=${ids.map(encodeURIComponent).join(',')}` : '';
//   const { data: aifBatch } = useSWR<{ items?: AifMeta[] }>(
//     ids.length ? `/api/arguments/batch?${idsParam}&include=aif` : null,
//     fetcher,
//     { revalidateOnFocus:false }
//   );

//   const [aifMap, setAifMap] = React.useState<Record<string, AifMeta>>({});
// AIF meta hydration: batch → row fallbacks
//   const ids = React.useMemo(() => rows.map(r => r.id), [rows]);
//   const idsParam = ids.length ? `ids=${ids.map(encodeURIComponent).join(',')}` : '';
//   const { data: aifBatch } = useSWR<{ items?: AifMeta[] }>(
//     ids.length ? `/api/arguments/batch?${idsParam}&include=aif` : null,
//     fetcher,
//     { revalidateOnFocus:false }
//   );

//   const [aifMap, setAifMap] = React.useState<Record<string, AifMeta>>({}); 
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const byId: Record<string, AifMeta> = {};
      // 1) batch
      for (const it of ((aifBatch as { items?: AifMeta[] } | undefined)?.items ?? [])) byId[it.id] = it;

      // 2) per-row fill (premises, warrant, CQ meter, attack counts)
      const pending = ids.filter(id => !byId[id]);
      await Promise.all(pending.map(async (id) => {
        try {
          // 1) try the one-shot AIF view
          const aAif = await fetch(`/api/arguments/${id}/aif`).then(r => r.ok ? r.json() : null).catch(()=>null);
          if (aAif?.aif) {
            byId[id] = {
              id,
              scheme: aAif.aif.scheme ?? null,
              conclusion: aAif.aif.conclusion ?? null,
              premises: aAif.aif.premises ?? [],
              implicitWarrant: aAif.aif.implicitWarrant ?? null,
              attacks: aAif.aif.attacks ?? { REBUTS: 0, UNDERCUTS: 0, UNDERMINES: 0 },
              cq: aAif.aif.cq ?? { required: 0, satisfied: 0 }
            };
       return;
          }
          // 2) fallback: assemble piecemeal
          const meta = { id } as AifMeta;
          const aAss = await fetch(`/api/arguments/${id}/assumptions`).then(r=>r.ok ? r.json() : null).catch(()=>null);
          if (aAss?.premises) meta.premises = aAss.premises;
          if (aAss?.implicitWarrant) meta.implicitWarrant = aAss.implicitWarrant;
          const conc = await fetch(`/api/arguments/${id}/conclusion`).then(r=>r.ok ? r.json() : null).catch(()=>null);
          if (conc?.id) meta.conclusion = conc;
          const aCq = await fetch(`/api/arguments/${id}/cqs`).then(r=>r.ok ? r.json() : null).catch(()=>null);
          if (Array.isArray(aCq?.items)) {
            const req = aCq.items.length;
            const sat = aCq.items.filter((x:any) => x.status === 'answered').length;
            meta.cq = { required: req, satisfied: sat };
          }
     const aAtk = await fetch(`/api/arguments/${id}/attacks`).then(r=>r.ok ? r.json() : null).catch(()=>null);
     if (Array.isArray(aAtk?.items)) {
       const g = { REBUTS: 0, UNDERCUTS: 0, UNDERMINES: 0 };
       for (const e of aAtk.items) {
         const t = String(e.attackType || '').toUpperCase();
         if (t in g) (g as any)[t] += 1;
       }
       meta.attacks = g;
     }

          byId[id] = meta;
        } catch {/* ignore */}
      }));

      if (!cancelled) setAifMap(byId);
    })();
    return () => { cancelled = true; };
  }, [ids.join(','), aifBatch?.items?.length]);

  // visible texts (power other panels)
  React.useEffect(() => {
    if (!onVisibleTextsChanged) return;
    const texts: string[] = [];
    for (const r of rows) {
      const claimText = (aifMap[r.id]?.conclusion?.text) ?? '';
      const t = claimText || r.text || '';
      if (t) texts.push(t);
    }
    onVisibleTextsChanged(texts);
  }, [rows, aifMap, onVisibleTextsChanged]);

  // Apply client-side filters
  const filtered: Arg[] = React.useMemo(() => {
    const lower = q.trim().toLowerCase();
    return rows.filter(a => {
      //const meta = aifMap[a.id] || aifBatch?.items?.find(x => x.id === a.id);
const meta = (a as any).aif || aifMap[a.id];
      const schemeOk = !schemeKey || (meta?.scheme?.key === schemeKey);
      const textBucket = [
        meta?.conclusion?.text || a.text || '',
        ...(meta?.premises?.map(p => p.text || '') ?? []),
        meta?.implicitWarrant?.text || ''
      ].join(' ').toLowerCase();
      const qOk = !lower || textBucket.includes(lower);
      return schemeOk && qOk;
    });
  }, [rows, aifMap, aifBatch?.items, schemeKey, q]);

  // List states
  if (isLoading && rows.length === 0) {
    return (
      <section className="rounded-md border bg-white/60 p-3">
        <header className="text-md font-medium mb-2">Arguments (AIF)</header>
        <div className="flex items-center gap-2 text-sm text-slate-500"><Spinner /> Loading…</div>
      </section>
    );
  }
  if (error) {
    function mutate(): void {
      swrMutate(
        getKey, 
        undefined, 
        { revalidate: true }
      );
    }
    return (
      <section className="rounded-md border bg-white/60 p-3">
        <header className="text-md font-medium mb-2">Arguments (AIF)</header>
        <div className="text-xs text-rose-700">{String(error?.message || 'Failed to load')}</div>
        <button className="text-xs underline mt-1" onClick={()=>mutate()}>Retry</button>
      </section>
    );
  }
  if (!rows.length) {
    return (
      <section className="rounded-md border bg-white/60 p-3">
        <header className="text-md font-medium mb-1">Arguments (AIF)</header>
        <p className="text-xs text-slate-600">No arguments yet.</p>
      </section>
    );
  }

  const nextCursor = data?.[data.length - 1]?.nextCursor ?? null;

  return (
    <section aria-label="AIF arguments list" className="w-full rounded-xl border bg-white/70 h-full 
    flex flex-col min-h-[300px] overflow-y-auto">
      <Controls
        schemes={schemes}
        schemeKey={schemeKey}
        setSchemeKey={setSchemeKey}
        q={q}
        setQ={setQ}
        showPremises={showPremises}
        setShowPremises={setShowPremises}
      />
      <div className="h-[560px]">
        <Virtuoso
          data={filtered}
          computeItemKey={(_i, a) => a.id}
          itemContent={(index, a) => {
           const meta = (a as any).aif || aifMap[a.id] || aifBatch?.items?.find(x => x.id === a.id);

            return (
              <div className="px-2 py-1">
                <Row
                  a={a}
                  meta={meta}
                  deliberationId={deliberationId}
                  showPremises={showPremises}
                  onPromoted={() => window.dispatchEvent(new CustomEvent('claims:changed', { detail: { deliberationId } }))}
                  onRefresh={() => mutate()}
                />
              </div>
            );
          }}
          endReached={() => !isLoading && nextCursor && setSize(s => s + 1)}
          components={{
            Footer: () => (
              <div className="py-3 px-4 text-center text-[12px] text-neutral-500">
                {nextCursor ? 'Scroll to load more' : 'End'}
              </div>
            ),
          }}
        />
      </div>
    </section>
  );
}
