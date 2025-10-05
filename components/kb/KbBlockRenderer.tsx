'use client';
import * as React from 'react';
import { ProvenanceChip } from './ProvenanceChip';

export function KbBlockRenderer({ block, hydrated }: { block: any; hydrated: any }) {
  const t = block.type as string;

  // TEXT & IMAGE blocks render from dataJson without transclusion
  if (t === 'text') {
    const md = String(block?.dataJson?.md ?? '').trim();
    return (
      <div className="rounded-lg border bg-white/80 p-4 prose prose-sm max-w-none">
        {md ? <pre className="whitespace-pre-wrap">{md}</pre> : <div className="text-slate-500 text-sm">Empty text block</div>}
      </div>
    );
  }

  if (!hydrated) {
    return <div className="rounded-lg border bg-white/60 p-3 text-xs text-slate-500">Loading…</div>;
  }

  // CLAIM
  if (t === 'claim' && hydrated.kind === 'claim') {
    const d = hydrated.data || {};
    return (
      <div className="rounded-lg border bg-white/80 p-4">
        <div className="text-sm font-medium">{d.text || '—'}</div>
        <div className="mt-1 text-xs text-slate-600">Bel {pct(d.bel)} • Pl {pct(d.pl)}</div>
        {!!(d.top?.length) && (
          <ul className="mt-1 text-xs text-slate-700 list-disc pl-4">
            {d.top.slice(0,3).map((x:any) => <li key={x.argumentId}>arg {x.argumentId.slice(0,8)}… · {pct(x.score)}</li>)}
          </ul>
        )}
        <div className="mt-2"><ProvenanceChip item={hydrated} /></div>
      </div>
    );
  }

  // ARGUMENT (diagram)
  if (t === 'argument' && hydrated.kind === 'argument') {
    return (
      <div className="rounded-lg border bg-white/80 p-4">
        <div className="text-sm font-medium mb-2">Argument (diagram)</div>
        <pre className="text-[11px] bg-slate-50 border rounded p-2 overflow-auto max-h-56">{JSON.stringify(hydrated.data?.diagram, null, 2)}</pre>
        <div className="mt-2"><ProvenanceChip item={hydrated} /></div>
      </div>
    );
  }

  // ROOM SUMMARY
  if (t === 'room_summary' && hydrated.kind === 'room_summary') {
    const claims = hydrated.data?.claims || [];
    return (
      <div className="rounded-lg border bg-white/80 p-4">
        <div className="text-sm font-medium mb-2">Room summary</div>
        <ul className="text-xs space-y-1">
          {claims.map((c:any) => (
            <li key={c.id} className="flex justify-between gap-2">
              <span className="truncate">{c.text}</span>
              <span className="text-slate-600">{pct(c.bel ?? c.score)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-2"><ProvenanceChip item={hydrated} /></div>
      </div>
    );
  }

  // SHEET
  if (t === 'sheet' && hydrated.kind === 'sheet') {
    const s = hydrated.data || {};
    return (
      <div className="rounded-lg border bg-white/80 p-4">
        <div className="text-sm font-medium mb-2">{s?.title ?? 'Sheet'}</div>
        <pre className="text-[11px] bg-slate-50 border rounded p-2 overflow-auto max-h-56">{JSON.stringify(s, null, 2)}</pre>
        <div className="mt-2"><ProvenanceChip item={hydrated} /></div>
      </div>
    );
  }

  // TRANSPORT
  if (t === 'transport' && hydrated.kind === 'transport') {
    const m = hydrated.data?.claimMap || {};
    const pairs = Object.entries(m);
    return (
      <div className="rounded-lg border bg-white/80 p-4">
        <div className="text-sm font-medium mb-2">Room functor map</div>
        {pairs.length ? (
          <ul className="text-xs space-y-1">
            {pairs.map(([a,b]) => <li key={a}><code>{a.slice(0,8)}…</code> → <code>{b.slice(0,8)}…</code></li>)}
          </ul>
        ) : <div className="text-xs text-slate-500">No mapped claims yet.</div>}
        <div className="mt-2"><ProvenanceChip item={hydrated} /></div>
      </div>
    );
  }

  return <div className="rounded-lg border bg-white/60 p-3 text-xs text-amber-600">Unsupported block type</div>;
}

function pct(x:number) { return `${Math.round((x ?? 0)*100)}%`; }
