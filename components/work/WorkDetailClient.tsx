// components/work/WorkDetailClient.tsx
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { TheoryFraming } from '@/components/compose/TheoryFraming';
import EvaluationSheet from './EvaluationSheet';
export default function WorkDetailClient(props: {
  id: string;
  deliberationId: string;
  title: string;
  theoryType: 'DN'|'IH'|'TC'|'OP';
  standardOutput?: string;
  backHref?: string;
}) {
    const { id, deliberationId, title, theoryType, standardOutput, backHref } = props;
      const router = useRouter();


   //const [backHref, setBackHref] = React.useState<string | null>(null);
   const [computedBackHref, setComputedBackHref] = React.useState<string | null>(null);
   React.useEffect(() => {
          let cancelled = false;
          (async () => {
            try {
              const res = await fetch(`/api/deliberations/${deliberationId}`, { cache: 'no-store' });
              if (!res.ok) return;
              const data = await res.json();
              const hostType = data.hostType ?? data.deliberation?.hostType;
              const hostId   = data.hostId   ?? data.deliberation?.hostId;
              const href = computeBackHref(hostType, hostId, deliberationId);
              if (!cancelled) setComputedBackHref(href);
            } catch {}
          })();
          return () => { cancelled = true; };
        }, [deliberationId]);
 
   function computeBackHref(hostType?: string, hostId?: string, delibId?: string) {
     if (hostType && hostId) {
       switch (hostType) {
         case 'article':        return `/article/${hostId}`;
         case 'post':           return `/p/${hostId}`;
         case 'room_thread':    return `/rooms/${hostId}`;
         case 'library_stack':  return `/stacks/${hostId}`;
         case 'site':           return `/site/${hostId}`;
         case 'inbox_thread':   return `/inbox/thread/${hostId}`;
       }
     }
     // Fallback to Deep Dive if unknown
     return `/deepdive/${delibId ?? deliberationId}`;
   }


  const [framing, setFraming] = React.useState<{
    theoryType: 'DN'|'IH'|'TC'|'OP';
    standardOutput?: string;
  }>({
    theoryType,
    standardOutput,
  });

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      {/* Back to Deep Dive button */}
      <div className="flex items-center justify-between">
      <button onClick={() => router.push(props.backHref ?? computedBackHref ?? `/deepdive/${deliberationId}`)} 
          className="px-3 py-1 text-xs rounded-md border border-slate-300 bg-white hover:bg-slate-50"
        >
          ← Back to Discussion
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">{title}</div>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100">
          {theoryType}
        </span>
      </div>

      <TheoryFraming
        value={framing}
        onChange={setFraming}
        workId={id}
        canEditPractical={true}
        defaultOpenBuilder={true}
      />
      <EvaluationSheet />

    </div>
  );
}
