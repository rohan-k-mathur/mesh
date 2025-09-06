'use client';

import * as React from 'react';
import useSWR, { mutate as globalMutate } from 'swr';
import { useMemo, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

type RebutScope = 'premise' | 'conclusion';
type Suggestion = { type: 'undercut' | 'rebut'; scope?: RebutScope } | null;
type CQ = { key: string; text: string; satisfied: boolean; suggestion?: Suggestion };
type Scheme = { key: string; title: string; cqs: CQ[] };
type CQsResponse = { targetType: 'claim'; targetId: string; schemes: Scheme[] };

const fetcher = async (u: string) => {
  const res = await fetch(u, { cache: 'no-store' });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as CQsResponse;
};


const CQS_KEY = (id: string, scheme?: string) =>
  `/api/cqs?targetType=claim&targetId=${id}${scheme ? `&scheme=${scheme}` : ''}`;
const TOULMIN_KEY = (id: string) => `/api/claims/${id}/toulmin`;
const GRAPH_KEY = (roomId: string, lens: string, audienceId?: string) =>
  `graph:${roomId}:${lens}:${audienceId ?? 'none'}`;

  const ATTACH_KEY = (id: string) => `/api/cqs/attachments?targetType=claim&targetId=${id}`;

export default function CriticalQuestions({
  targetType,
  targetId,
  createdById, // unused here, kept for parity
  deliberationId,          // 👈 add this

  roomId,
  currentLens,
  currentAudienceId,
  selectedAttackerClaimId,
  prefilterKeys, // [{schemeKey,cqKey}]
}: {
  targetType: 'claim';
  targetId: string;
  createdById: string;
  deliberationId: string;  // 👈 required

  prefilterKeys?: Array<{ schemeKey: string; cqKey: string }>;
  roomId?: string;
  currentLens?: string;
  currentAudienceId?: string;
  selectedAttackerClaimId?: string;
}) {
  // ----- hooks always run in the same order -----
  const { data, error, isLoading } = useSWR<CQsResponse>(CQS_KEY(targetId), fetcher);
    const { data: attachData } = useSWR<{ attached: Record<string, boolean> }>(ATTACH_KEY(targetId), fetcher);
  const [lingerKeys, setLingerKeys] = useState<Set<string>>(new Set());

  const [composeOpen, setComposeOpen] = useState(false);
  const [composeText, setComposeText] = useState('');
  const [composeLoading, setComposeLoading] = useState(false);
  const [pendingAttach, setPendingAttach] = useState<{ schemeKey: string; cqKey: string; suggestion?: Suggestion } | null>(null);
  const [attachError, setAttachError] = useState<string | null>(null);

  // Build filtered view *before* any early returns so hooks don't change count
  const filtered = useMemo(() => {
         if (!data || !prefilterKeys?.length) return data || null;
         const wanted = new Set(prefilterKeys.map(k => `${k.schemeKey}:${k.cqKey}`));
         const schemes = data.schemes
           .map((s) => ({
             ...s,
             cqs: s.cqs.filter((cq) => {
               const key = `${s.key}:${cq.key}`;
               // show if it’s wanted AND (still open OR temporarily lingering after being checked)
               return wanted.has(key) && (!cq.satisfied || lingerKeys.has(key));
             }),
           }))
           .filter((s) => s.cqs.length);
         return { ...data, schemes };
      }, [data, prefilterKeys, lingerKeys]);

  // Always compute `view` and `schemes` from filtered/data (no conditional hooks)
  const view = filtered ?? data ?? { targetType: 'claim', targetId, schemes: [] as Scheme[] };
  const schemes: Scheme[] = Array.isArray(view.schemes) ? view.schemes : [];

  // ----- after all hooks, render conditions -----
  if (isLoading) return <div className="text-xs text-neutral-500">Loading CQs…</div>;
  if (error) return <div className="text-xs text-red-600">Failed to load CQs.</div>;
  if (!schemes.length) return <div className="text-xs text-neutral-500">No critical questions yet.</div>;

  async function revalidateAll(schemeKey?: string) {
    await Promise.all([
      globalMutate(CQS_KEY(targetId, schemeKey)), // revalidate CQs (optionally narrowed to a scheme)
      globalMutate(TOULMIN_KEY(targetId)),        // refresh Toulmin mini
      roomId && currentLens
        ? globalMutate(GRAPH_KEY(roomId, currentLens, currentAudienceId))
        : Promise.resolve(),
        globalMutate(ATTACH_KEY(targetId)),
    ]);
  }

  async function toggleCQ(schemeKey: string, cqKey: string, next: boolean) {

    const sig = `${schemeKey}:${cqKey}`;
     // If marking satisfied, keep it visible briefly with a “Addressed ✓” affordance
     if (next) {
       setLingerKeys((prev) => new Set(prev).add(sig));
       setTimeout(() => {
         setLingerKeys((prev) => {
           const n = new Set(prev);
           n.delete(sig);
           return n;
         });
       }, 1000);
    }

    // optimistic update against the SWR cache
    globalMutate(
      CQS_KEY(targetId),
      (current: CQsResponse | undefined) => {
        if (!current) return current;
        return {
          ...current,
          schemes: current.schemes.map((s) =>
            s.key !== schemeKey ? s : { ...s, cqs: s.cqs.map((cq) => (cq.key === cqKey ? { ...cq, satisfied: next } : cq)) }
          ),
        };
      },
      { revalidate: false }
    );

    try {
      const res = await fetch('/api/cqs/toggle', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          targetType,
          targetId,
          schemeKey,
          cqKey,
          satisfied: next,
          deliberationId,       // 👈 use correct prop, not roomId
        }),
      });
      if (!res.ok) throw new Error(await res.text());
    } finally {
      await revalidateAll(schemeKey);
    }
  }

  async function onAttachClick(schemeKey: string, cqKey: string, suggestion?: Suggestion) {
    setAttachError(null);
    if (selectedAttackerClaimId) {
      await attachWithAttacker(schemeKey, cqKey, selectedAttackerClaimId, suggestion);
      return;
    }
    setPendingAttach({ schemeKey, cqKey, suggestion });
    setComposeText('');
    setComposeOpen(true);
  }

  async function attachWithAttacker(schemeKey: string, cqKey: string, attackerClaimId: string, suggestion?: Suggestion) {
    setAttachError(null);
    const res = await fetch('/api/cqs/toggle', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        targetType,
        targetId,
        schemeKey,
        cqKey,
        satisfied: false,
        attachSuggestion: true,
        attackerClaimId,
        suggestion,
        deliberationId,
      }),
    });
    if (!res.ok) {
      const msg = await res.text().catch(() => '');
      throw new Error(msg || 'Failed to attach');
    }
    await revalidateAll(schemeKey);
  }

  async function handleComposeSubmit() {
    if (!pendingAttach) return;
    try {
      setComposeLoading(true);
      setAttachError(null);
      const ccRes = await fetch('/api/claims/quick-create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ targetClaimId: targetId, text: composeText.trim() }),
      });
      if (!ccRes.ok) throw new Error(await ccRes.text());
      const { claimId: attackerClaimId } = (await ccRes.json()) as { claimId: string };
      await attachWithAttacker(pendingAttach.schemeKey, pendingAttach.cqKey, attackerClaimId, pendingAttach.suggestion);
  
      setComposeOpen(false);
      setPendingAttach(null);
      setComposeText('');
    } catch (e: any) {
      setAttachError(e?.message || 'Failed to attach');
    } finally {
      setComposeLoading(false);
    }
  }

  return (
    <>
      <div className="space-y-3 ">
        {schemes.map((s) => (
          <div key={s.key} className="rounded border border-black bg-white p-2">
            <div className="text-xs font-semibold">{s.title}</div>
            <ul className="mt-1 space-y-1">
              {s.cqs.map((cq) => {
                const id = `${s.key}__${cq.key}`;
                const sig = `${s.key}:${cq.key}`;
                const isLinger = lingerKeys.has(sig) && cq.satisfied;
                const isAttached = Boolean(attachData?.attached?.[sig]); // server truth: has undercut/rebut/evidence attached
            const canMarkAddressed = cq.satisfied || isAttached;
                const attachLabel =
                  cq.suggestion?.type === 'undercut'
                    ? 'Attach undercut'
                    : cq.suggestion?.type === 'rebut'
                    ? `Attach rebut (${cq.suggestion.scope ?? 'conclusion'})`
                    : 'Attach';

                return (
                  <li key={cq.key} className="flex items-center justify-between text-sm transition-opacity">
                     <label htmlFor={id} className="flex items-center gap-2 cursor-pointer">
                       <Checkbox
                         id={id}
                         checked={cq.satisfied}
                         onCheckedChange={(val) => toggleCQ(s.key, cq.key, Boolean(val))}
                         disabled={isLinger || !canMarkAddressed}
                       />
                       <span className={isLinger ? 'line-through opacity-60' : ''}>{cq.text}</span>
                       {isLinger && <span className="text-[10px] text-emerald-700 ml-2">Addressed ✓</span>}
                       {!cq.satisfied && !isAttached && (
                        <span className="text-[10px] text-neutral-500 ml-2">(attach a counter/evidence to enable)</span>
                      )}
                     </label>

                    {!cq.satisfied && cq.suggestion && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAttachClick(s.key, cq.key, cq.suggestion ?? undefined)} 
                        title={attachLabel}
                        className="text-[11px] px-2 py-1 h-7"
                      >
                        Attach
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Quick-compose dialog */}
      <Dialog open={composeOpen} onOpenChange={(o) => !composeLoading && setComposeOpen(o)}>
        <DialogContent className="bg-slate-200 rounded-xl sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Add a counter-claim</DialogTitle>
            <DialogDescription>
              Write a concise counter-claim to attach as an undercut/rebut for the unmet CQ.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <label className="text-xs font-medium">Counter-claim text</label>
            <Textarea
              value={composeText}
              onChange={(e) => setComposeText(e.target.value)}
              placeholder="e.g., The cited expert’s field is unrelated to the claim under discussion."
              disabled={composeLoading}
              rows={5}
            />
            {attachError && <div className="text-xs text-red-600">{attachError}</div>}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setComposeOpen(false)} disabled={composeLoading}>
              Cancel
            </Button>
            <Button onClick={handleComposeSubmit} disabled={composeLoading || composeText.trim().length < 3}>
              {composeLoading ? 'Attaching…' : 'Create & Attach'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
