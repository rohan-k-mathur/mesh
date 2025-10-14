// components/issues/IssueDetail.tsx
'use client';
import * as React from 'react';
import useSWR, { mutate as globalMutate } from 'swr';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { LegalMoveChips } from '../dialogue/LegalMoveChips';
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


  const [resolveTarget, setResolveTarget] =
    React.useState<{ targetType:'argument'|'claim'|'card'|'inference'; targetId:string }|null>(null);


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
  async function unlinkPoly(tt:'argument'|'claim'|'card'|'inference', tid:string) {
    await fetch(`${key}?targetType=${encodeURIComponent(tt)}&targetId=${encodeURIComponent(tid)}`, { method:'DELETE' });
    window.dispatchEvent(new CustomEvent('issues:refresh', { detail: { deliberationId } }));
    await globalMutate(key);
  }

  async function setAssignee(uid: string) {
    await fetch(key, { method:'PATCH', headers:{'content-type':'application/json'}, body: JSON.stringify({ assigneeId: uid, state: 'pending' }) });
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
            {(data.links ?? []).map((l) => (
              <li key={`${l.targetType}:${l.targetId}`} className="flex items-center gap-2">
                <label className="inline-flex items-center gap-1">
                  <input
                    type="radio"
                    name="resolveTarget"
                    onChange={() => setResolveTarget({ targetType: l.targetType as any, targetId: l.targetId })}
                    checked={resolveTarget?.targetType===l.targetType && resolveTarget?.targetId===l.targetId}
                  />
                  <span className="text-[11px] px-1 py-0.5 rounded border bg-slate-50">{l.targetType}</span>
                </label>
                <a className="underline" href={`#${l.targetType}-${l.targetId}`} title="Jump">
                  {l.targetId.slice(0,8)}…
                </a>
                <button className="ml-2 text-[11px] underline"
                  onClick={() => l.argumentId ? unlink(l.argumentId) : unlinkPoly(l.targetType as any, l.targetId)}>
                  remove
                </button>
              </li>
            ))}
            {(data.links ?? []).length === 0 && <li className="text-neutral-500">No links</li>}
          </ul>
        </div>

         {resolveTarget && (
    <div className="mt-3 rounded-md border p-2 bg-slate-50">
      <div className="text-[11px] uppercase tracking-wide text-neutral-500 mb-1">Resolve here</div>
      <LegalMoveChips
        deliberationId={deliberationId}
        targetType={resolveTarget.targetType}
        targetId={resolveTarget.targetId}
        onPosted={() => globalMutate(key)}
      />
    </div>
  )}


  {/* (Optional) quick assign → pending */}
  <div className="mt-3 flex items-center gap-2">
    <span className="text-[11px] text-neutral-500">Assignee</span>
    <input className="border rounded px-1 py-0.5 text-xs w-40" placeholder="User ID…" onKeyDown={e=>{
      if (e.key==='Enter') setAssignee((e.target as HTMLInputElement).value.trim());
    }} />
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
