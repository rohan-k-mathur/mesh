'use client';
import * as React from 'react';
import useSWR, { mutate as globalMutate } from 'swr';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const fetcher = (u:string)=>fetch(u,{cache:'no-store'}).then(r=>r.json());

export default function IssueDetail({
  deliberationId,
  issueId,
  onClose,
}: {
  deliberationId: string;
  issueId: string;
  onClose: () => void;
}) {
  const key = `/api/deliberations/${encodeURIComponent(deliberationId)}/issues/${encodeURIComponent(issueId)}`;
  const { data, isLoading } = useSWR<{ ok:true; issue:any; links:any[] }>(key, fetcher, { revalidateOnFocus:false });

  async function setState(next:'open'|'closed') {
    await fetch(key, { method:'PATCH', headers:{'content-type':'application/json'}, body: JSON.stringify({ state: next }) });
    window.dispatchEvent(new CustomEvent('issues:refresh', { detail: { deliberationId } }));
    await globalMutate(key);
  }

  async function unlink(argumentId: string) {
    await fetch(`${key}?argumentId=${encodeURIComponent(argumentId)}`, { method:'DELETE' });
    window.dispatchEvent(new CustomEvent('issues:refresh', { detail: { deliberationId } }));
    await globalMutate(key);
  }

  if (isLoading || !data?.issue) return null;
  const it = data.issue;

  return (
    <Dialog open onOpenChange={(o)=>!o && onClose()}>
      <DialogContent className="bg-white rounded-xl sm:max-w-[700px] max-h-[70vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{it.label}</DialogTitle>
        </DialogHeader>
        <div className="text-[11px] mb-2">
          <span className={`px-1.5 py-0.5 rounded border ${it.state==='open'?'bg-amber-50 border-amber-200 text-amber-800':'bg-slate-50 border-slate-200 text-slate-700'}`}>
            {it.state}
          </span>
        </div>

        {it.description && <div className="text-sm mb-3">{it.description}</div>}

        <div className="mb-3">
          <div className="text-[11px] uppercase tracking-wide text-neutral-500 mb-1">Links</div>
          <ul className="list-disc ml-5 text-sm space-y-1">
            {(data.links ?? []).map((l:any) => (
              <li key={l.argumentId}>
                <a className="underline" href={`#arg-${l.argumentId}`} title="Jump to argument">{l.argumentId.slice(0,8)}…</a>
                <button className="ml-2 text-[11px] underline" onClick={()=>unlink(l.argumentId)}>remove</button>
              </li>
            ))}
            {(data.links ?? []).length === 0 && <li className="text-neutral-500">No links</li>}
          </ul>
        </div>

        {/* Easy future hook: comments block (hidden by default if route missing) */}
        {/* You can add IssueComment UI here later */}

        <DialogFooter className="flex items-center justify-between">
          <button className="px-2 py-1 border rounded text-xs" onClick={onClose}>Close</button>
          {it.state === 'open' ? (
            <button className="px-2 py-1 border rounded text-xs bg-amber-50" onClick={()=>setState('closed')}>Close issue</button>
          ) : (
            <button className="px-2 py-1 border rounded text-xs bg-emerald-50" onClick={()=>setState('open')}>Reopen</button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
