'use client';

import * as React from 'react';
import useSWR from 'swr';
import { LociTree } from 'packages/ludics-react/LociTree';
import { TraceRibbon } from 'packages/ludics-react/TraceRibbon';
import { JudgeConsole } from 'packages/ludics-react/JudgeConsole';
import { CommitmentsPanel } from 'packages/ludics-react/CommitmentsPanel';
import { DefenseTree } from 'packages/ludics-react/DefenseTree';
import { ActInspector } from '@/packages/ludics-react/ActInspector';
import { narrateTrace } from '@/components/dialogue/narrateTrace';
import { mergeDesignsToTree } from 'packages/ludics-react/mergeDesignsToTree';
import { CommitmentDelta } from '@/components/dialogue/CommitmentDelta';
import { NLCommitPopover } from '@/components/dialogue/NLCommitPopover';
import { useDialogueTarget } from '@/components/dialogue/DialogueTargetContext';


const fetcher = (u: string) => fetch(u, { cache: 'no-store' }).then(r => r.json());

/* ------------------------ UI helpers (consistent) ----------------------- */
function ChipBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex flex-wrap items-center gap-1.5 rounded-md border border-slate-200/80 bg-white/70 px-2.5 py-1 text-[11px] backdrop-blur">
      {children}
    </div>
  );
}

function useMicroToast() {
  const [msg, setMsg] = React.useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const show = React.useCallback((text: string, kind: 'ok' | 'err' = 'ok', ms = 1600) => {
    setMsg({ kind, text });
    const id = setTimeout(() => setMsg(null), ms);
    return () => clearTimeout(id);
  }, []);
  const node = msg ? (
    <div
      aria-live="polite"
      className={[
        'fixed bottom-4 right-4 z-50 rounded-md border px-3 py-2 text-xs shadow',
        'backdrop-blur bg-white/90',
        msg.kind === 'ok' ? 'border-emerald-200 text-emerald-700' : 'border-rose-200 text-rose-700',
      ].join(' ')}
    >
      {msg.text}
    </div>
  ) : null;
  return { show, node };
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  ariaLabel?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="inline-flex rounded-md border border-slate-200/80 bg-white/70 p-0.5 backdrop-blur"
    >
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={['px-2.5 py-1 text-xs rounded transition', active ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-white'].join(' ')}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="border rounded-lg p-3 bg-white/60">
      <div className="h-4 w-28 bg-slate-200/60 rounded mb-2" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-3 w-full bg-slate-200/50 rounded mb-1" />
      ))}
    </div>
  );
}

/* ------------------------------- Types ---------------------------------- */
type StepResult = {
  steps: Array<{ posActId: string; negActId: string; ts?: number }>;
  status: 'ONGOING' | 'CONVERGENT' | 'DIVERGENT';
  endedAtDaimonForParticipantId?: string;
  endorsement?: { locusPath: string; byParticipantId: string; viaActId: string };
  decisiveIndices?: number[];
  usedAdditive?: Record<string, string>;
};

/* -------------------------------- Panel --------------------------------- */
export function LudicsPanel({ deliberationId }: { deliberationId: string }) {
  // Designs SWR
  const {
    data: designsData,
    mutate: mutateDesigns,
    error: designsError,
    isLoading: isDesignsLoading,
  } = useSWR(
    `/api/ludics/designs?deliberationId=${encodeURIComponent(deliberationId)}`,
    fetcher,
    { revalidateOnFocus: false }
  );
  const designs = designsData?.designs ?? [];

  // Panel local UI state
  const [trace, setTrace] = React.useState<StepResult | null>(null);
  const [badges, setBadges] = React.useState<Record<number, string>>({});
  const [stable, setStable] = React.useState<number | null>(null);
  const [orthogonal, setOrthogonal] = React.useState<boolean | null>(null);
  const [focusIdx, setFocusIdx] = React.useState<number | null>(null);
  const [showGuide, setShowGuide] = React.useState(false);
  const [phase, setPhase] = React.useState<'neutral' | 'focus-P' | 'focus-O'>('neutral');
  const [viewMode, setViewMode] = React.useState<'unified' | 'split'>('unified');
  const [commitOpen, setCommitOpen] = React.useState(false);
const [commitPath, setCommitPath] = React.useState<string | null>(null);

const { target } = useDialogueTarget();
const targetIdFromContext = target?.id ?? null;
const targetTypeFromContext = target?.type ?? 'claim'; // sensible default

const commitAtPath = React.useCallback((path: string) => {
  setCommitPath(path);
  setCommitOpen(true);
}, []);


  // Broadcast phase so other components (e.g., row chips) can derive commitOwner
  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent('ludics:phase', { detail: { phase } }));
  }, [phase]);

  // Throttled compile-step control
  const compRef = React.useRef(false);
  const lastCompileAt = React.useRef(0);
  const [busy, setBusy] = React.useState<false | 'compile' | 'step' | 'nli' | 'orth' | 'append'>(false);
  const toast = useMicroToast();

  // Map acts by id from current designs (for NLI/Inspector, heatmap)
  const byAct = React.useMemo(() => {
    const map = new Map<string, any>();
    for (const d of designs) for (const a of d.acts ?? []) map.set(a.id, a);
    return map;
  }, [designs]);

     // ------------------------------------------------------------------
   // Orthogonal SWR (trace   acts for narration & stable heatmap)
   const { data: orthoData, mutate: refreshOrth } = useSWR(
     deliberationId
       ? `/api/ludics/orthogonal?dialogueId=${encodeURIComponent(deliberationId)}&phase=neutral`
       : null,
     fetcher,
     { revalidateOnFocus: false }
   );
 
   React.useEffect(() => {
     const h = () => refreshOrth();
     window.addEventListener('dialogue:moves:refresh', h as any);
     return () => window.removeEventListener('dialogue:moves:refresh', h as any);
   }, [refreshOrth]);
 
   // keep local trace in sync with ortho trace
   React.useEffect(() => {
     const t = orthoData?.trace;
     if (t) {
       setTrace({
         steps: t.pairs ?? [],
         status: t.status,
         endedAtDaimonForParticipantId: t.endedAtDaimonForParticipantId,
         endorsement: t.endorsement,
         decisiveIndices: t.decisiveIndices,
         usedAdditive: t.usedAdditive,
       });
     }
   }, [orthoData]);


  // 1) step index by act id (for tiny ① ② superscripts)
  const stepIndexByActId = React.useMemo(() => {
    const m: Record<string, number> = {};
    (trace?.steps ?? []).forEach((p, i) => {
      m[p.posActId] = i + 1;
      m[p.negActId] = i + 1;
    });
    return m;
  }, [trace]);

  // 2) locus heatmap (frequency; bump decisive hits)
   const heatmap = React.useMemo(() => {
       const hm: Record<string, number> = {};
       const t = orthoData?.trace;
       const acts = (orthoData?.acts ?? {}) as Record<string, { locusPath?: string }>;
       if (!t) return hm;
       (t.pairs ?? []).forEach((p) => {
         const path = acts[p.posActId]?.locusPath ?? acts[p.negActId]?.locusPath;
         if (!path) return;
         hm[path] = (hm[path] ?? 0) + 1;
      });
      (t.decisiveIndices ?? []).forEach((i) => {
        const p = t.pairs?.[i]; if (!p) return;
        const path = acts[p.posActId]?.locusPath ?? acts[p.negActId]?.locusPath;
        if (!path) return;
        hm[path] = (hm[path] ?? 0) + 2; // extra weight for decisive
      });
      return hm;
    }, [orthoData]);

  // 3) focused locus path (keeps narration ↔ tree synced)
  const focusPath = React.useMemo(() => {
    if (focusIdx == null || !trace) return null;
    const p = trace.steps[focusIdx];
    const pos = byAct.get(p.posActId);
    const neg = byAct.get(p.negActId);
    return pos?.locus?.path ?? neg?.locus?.path ?? null;
  }, [focusIdx, trace, byAct]);

  // Handle "Focus" click from the tree toolbar
  const onFocusPathChange = React.useCallback((path: string) => {
    const idx = (trace?.steps ?? []).findIndex(
      (p) =>
        byAct.get(p.posActId)?.locus?.path === path ||
        byAct.get(p.negActId)?.locus?.path === path
    );
    if (idx >= 0) setFocusIdx(idx);
  }, [trace, byAct]);

  

  // Narration lines
  const actsForNarration = orthoData?.acts ?? {};
  const lines = orthoData?.trace ? narrateTrace(orthoData.trace, actsForNarration) : [];

  /* ------------------------------- Actions ------------------------------- */
  const compileStep = React.useCallback(
    async (p: 'neutral' | 'focus-P' | 'focus-O' = phase) => {
      const now = Date.now();
      if (now - lastCompileAt.current < 1200) return;
      if (compRef.current) return;
      compRef.current = true;
      setBusy('compile');
      try {
        const r = await fetch('/api/ludics/compile-step', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ deliberationId, phase: p }),
        }).then((r) => r.json()).catch(() => null);

        if (r?.trace) {
          setTrace({
            steps: r.trace.pairs ?? [],
            status: r.trace.status,
            endedAtDaimonForParticipantId: r.trace.endedAtDaimonForParticipantId,
            endorsement: r.trace.endorsement,
            decisiveIndices: r.trace.decisiveIndices,
            usedAdditive: r.trace.usedAdditive,
          });
        }
      } finally {
        compRef.current = false;
        setBusy(false);
        lastCompileAt.current = Date.now();
        mutateDesigns();
      }
    },
    [deliberationId, phase]
  );
  const compileStepRef = React.useRef(compileStep);
  React.useEffect(() => { compileStepRef.current = compileStep; }, [compileStep]);

  React.useEffect(() => {
    function onRefresh(e: any) {
      const id = e?.detail?.deliberationId;
      if (id && id !== deliberationId) return;
      compileStepRef.current('neutral');
    }
    window.addEventListener('dialogue:moves:refresh', onRefresh);
    return () => window.removeEventListener('dialogue:moves:refresh', onRefresh);
  }, [deliberationId]);

  React.useEffect(() => {
    compileStepRef.current('neutral');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliberationId]);

  const step = React.useCallback(async () => {
    if (!designs?.length) return;
    setBusy('step');
    try {
      const pos = designs.find((d: any) => d.participantId === 'Proponent') ?? designs[0];
      const neg = designs.find((d: any) => d.participantId === 'Opponent') ?? designs[1] ?? designs[0];
      const res = await fetch('/api/ludics/step', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ dialogueId: deliberationId, posDesignId: pos.id, negDesignId: neg.id }),
      }).then((r) => r.json());
      setTrace({
        steps: res.pairs || [],
        status: res.status,
        endedAtDaimonForParticipantId: res.endedAtDaimonForParticipantId,
        endorsement: res.endorsement,
        decisiveIndices: res.decisiveIndices,
        usedAdditive: res.usedAdditive,
      });
      toast.show('Stepped', 'ok');
    } finally {
      setBusy(false);
    }
  }, [deliberationId, designs, toast]);

  const appendDaimonToNext = React.useCallback(async () => {
    if (!designs?.length) return;
    setBusy('append');
    try {
      const [, B] = designs;
      await fetch('/api/ludics/acts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ designId: B.id, enforceAlternation: false, acts: [{ kind: 'DAIMON' }] }),
      });
      await step();
    } finally {
      setBusy(false);
    }
  }, [designs, step]);

  const pickAdditive = React.useCallback(
    async (parentPath: string, child: string) => {
      if (!designs?.length) return;
      const pos = designs.find((d: any) => d.participantId === 'Proponent') ?? designs[0];
      const neg = designs.find((d: any) => d.participantId === 'Opponent') ?? designs[1] ?? designs[0];
      try {
        const r = await fetch('/api/ludics/additive/pick', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ dialogueId: deliberationId, posDesignId: pos.id, negDesignId: neg.id, parentPath, childSuffix: child }),
        });
        const j = await r.json().catch(() => null);
        if (!r.ok || !j?.ok) throw new Error(j?.error || 'Pick failed');
        toast.show(`Choice locked for ${parentPath} → ${child}`, 'ok');
        await compileStep('focus-P');
      } catch (e: any) {
        toast.show(`Pick failed: ${e?.message ?? 'error'}`, 'err');
      }
    },
    [designs, deliberationId, compileStep, toast]
  );

  const checkOrthogonal = React.useCallback(async () => {
    if (!designs?.length) return;
    setBusy('orth');
    try {
      const [A, B] = designs;
      const r = await fetch(
        `/api/ludics/orthogonal?dialogueId=${encodeURIComponent(deliberationId)}&posDesignId=${A.id}&negDesignId=${B.id}`
      ).then((r) => r.json());
      setOrthogonal(r?.orthogonal ?? null);
      if (r?.trace) {
        setTrace({
          steps: r.trace.pairs ?? [],
          status: r.trace.status,
          endedAtDaimonForParticipantId: r.trace.endedAtDaimonForParticipantId,
          endorsement: r.trace.endorsement,
          decisiveIndices: r.trace.decisiveIndices,
          usedAdditive: r.trace.usedAdditive,
        });
      }
      toast.show(r?.orthogonal ? 'Orthogonal ✓' : 'Not orthogonal', r?.orthogonal ? 'ok' : 'err');
      refreshOrth();
    } finally {
      setBusy(false);
    }
  }, [designs, deliberationId, toast, refreshOrth]);

  const analyzeNLI = React.useCallback(async () => {
    if (!trace || !designs?.length) return;
    setBusy('nli');
    try {
      const pairs = (trace.steps ?? []).map((p) => ({
        premise: String(byAct.get(p.posActId)?.expression ?? ''),
        hypothesis: String(byAct.get(p.negActId)?.expression ?? ''),
      }));
      const res = await fetch('/api/nli/batch', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ items: pairs }),
      }).then((r) => r.json());

      const TAU = Number(process.env.NEXT_PUBLIC_CQ_NLI_THRESHOLD ?? '0.72');
      const b: Record<number, string> = {};
      res?.results?.forEach((r: any, i: number) => {
        if (r?.relation === 'contradicts' && (r.score ?? 0) >= TAU) b[i] = 'NLI⊥';
      });
      setBadges(b);
    } finally {
      setBusy(false);
    }
  }, [trace, designs, byAct]);

  const checkStable = React.useCallback(async () => {
    const res = await fetch(`/api/af/stable?deliberationId=${encodeURIComponent(deliberationId)}`).then((r) => r.json());
    setStable(res.count ?? 0);
  }, [deliberationId]);

  const onConcede = React.useCallback(
    async (locus: string, proposition: string) => {
      await fetch('/api/ludics/concession', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          dialogueId: deliberationId,
          concedingParticipantId: 'Opponent',
          anchorLocus: locus,
          proposition: { text: proposition },
        }),
      });
      await mutateDesigns();
      await step();
    },
    [deliberationId, mutateDesigns, step]
  );

  const onForceConcession = React.useCallback(
    async (locus: string, text: string) => {
      if (!designs?.length) return;
      const [, B] = designs;
      await fetch('/api/ludics/judge/force', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          dialogueId: deliberationId,
          action: 'FORCE_CONCESSION',
          target: { designId: B.id, locusPath: locus },
          data: { text },
        }),
      });
      await mutateDesigns();
      await step();
    },
    [designs, deliberationId, mutateDesigns, step]
  );

  const onCloseBranch = React.useCallback(
    async (locus: string) => {
      if (!designs?.length) return;
      const [, B] = designs;
      await fetch('/api/ludics/judge/force', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          dialogueId: deliberationId,
          action: 'CLOSE_BRANCH',
          target: { designId: B.id, locusPath: locus },
        }),
      });
      await mutateDesigns();
      await step();
    },
    [designs, deliberationId, mutateDesigns, step]
  );

  //    const commitAtPath = React.useCallback(async (path: string) => {
  //    const label = window.prompt('New commitment label (fact):', '');
  //    if (!label) return;
  //    try {
  //      await fetch('/api/commitments/apply', {
  //        method:'POST', headers:{'content-type':'application/json'},
  //        body: JSON.stringify({
  //          dialogueId: deliberationId,
  //          ownerId: 'Proponent',               // or current side
  //          autoPersistDerived: false,
  //          ops: { add: [{ label, basePolarity: 'pos', baseLocusPath: path, entitled: true }] }
  //        })
  //      });
  //      window.dispatchEvent(new CustomEvent('dialogue:cs:refresh', { detail: { dialogueId: deliberationId, ownerId: 'Proponent' }}));
  //      toast.show(`Committed “${label}” @ ${path}`, 'ok');
  //    } catch (e:any) {
  //      toast.show('Commit failed', 'err');
  //    }
  // }, [deliberationId, toast]);

  /* ------------------------- Sync + keyboard hooks ----------------------- */
  React.useEffect(() => {
    const onFocus = async (e: any) => {
      const { phase } = e?.detail || {};
      await compileStep(phase ?? 'focus-P');
    };
    window.addEventListener('ludics:focus', onFocus as any);
    return () => window.removeEventListener('ludics:focus', onFocus as any);
  }, [compileStep]);

  React.useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'c') compileStep();
      else if (e.key === 's') step();
      else if (e.key === 'o') checkOrthogonal();
      else if (e.key === 'n') analyzeNLI();
      else if (e.key === 'l') setShowGuide((v) => !v);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [compileStep, step, checkOrthogonal, analyzeNLI]);

  /* ------------------------------ Rendering ------------------------------ */
  const steps = trace?.steps ?? [];
  const actsCount = designs.reduce((acc: number, d: any) => acc + (d.acts?.length ?? 0), 0);

  return (
    <div className="space-y-3 rounded-2xl  bg-slate-50/70 p-3 panel-edge backdrop-blur">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ChipBar>
            <span>|D| {designs.length}</span>
            <span>|acts| {actsCount}</span>
            <span>|pairs| {steps.length}</span>
            {trace?.status && (
              <span
                className={[
                  'px-1.5 py-0.5 rounded border',
                  trace.status === 'CONVERGENT'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : trace.status === 'DIVERGENT'
                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                    : 'bg-slate-50 border-slate-200 text-slate-700',
                ].join(' ')}
              >
                {trace.status === 'CONVERGENT' ? '† CONVERGENT' : trace.status}
              </span>
            )}
            {typeof stable === 'number' && <span>stable {stable}</span>}
            {orthogonal !== null && (
              <span
                className={[
                  'px-1.5 py-0.5 rounded border',
                  orthogonal ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700',
                ].join(' ')}
              >
                {orthogonal ? 'orthogonal ✓' : 'not orthogonal'}
              </span>
            )}
          </ChipBar>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            ariaLabel="Phase"
            value={phase}
            onChange={(v) => {
              setPhase(v);
              compileStep(v);
            }}
            options={[
              { value: 'neutral', label: 'Neutral' },
              { value: 'focus-P', label: 'Focus P' },
              { value: 'focus-O', label: 'Focus O' },
            ]}
          />
          <Segmented
            ariaLabel="Tree layout"
            value={viewMode}
            onChange={(v) => setViewMode(v)}
            options={[
              { value: 'unified', label: 'Unified' },
              { value: 'split', label: 'Split' },
            ]}
          />

          <button className="btnv2" aria-label="Compile from moves" onClick={() => compileStep('neutral')} disabled={!!busy}>
            {busy === 'compile' ? 'Compiling…' : 'Compile'}
          </button>
          <button className="btnv2" aria-label="Step" onClick={step} disabled={!!busy}>
            {busy === 'step' ? 'Stepping…' : 'Step'}
          </button>
          <button className="btnv2" aria-label="Append daimon to next" onClick={appendDaimonToNext} disabled={!!busy}>
            {busy === 'append' ? 'Working…' : 'Append †'}
          </button>
          <button className="btnv2" aria-label="Check orthogonality" onClick={checkOrthogonal} disabled={!!busy}>
            {busy === 'orth' ? 'Checking…' : 'Orthogonality'}
          </button>
          <button className="btnv2" aria-label="Analyze NLI" onClick={analyzeNLI} disabled={!!busy}>
            {busy === 'nli' ? 'Analyzing…' : 'NLI'}
          </button>
          <button className="btnv2 btnv2--ghost" aria-label="Legend & narrative" onClick={() => setShowGuide((v) => !v)}>
            {showGuide ? 'Hide legend' : 'Legend & narrative'}
          </button>
          <button className="btnv2 btnv2--ghost" aria-label="Stable sets" onClick={checkStable}>
            Stable sets
          </button>
        </div>
      </div>

      {/* Ribbon */}
      <div className="rounded-md border border-slate-200 bg-white/60 p-2">
        {trace ? (
          <TraceRibbon
            steps={trace.steps}
            status={trace.status}
            badges={badges}
            focusIndex={focusIdx ?? undefined}
            decisiveIndices={trace.decisiveIndices ?? []}
            onFocus={(i) => setFocusIdx(i)}
          />
        ) : (
          <div className="text-xs text-neutral-500">No traversal yet.</div>
        )}
        {trace?.decisiveIndices?.length ? (
          <div className="mt-1 text-[11px] text-indigo-700">decisive: {trace.decisiveIndices.map((i) => i + 1).join(', ')}</div>
        ) : null}
        {/* commitment delta overlay */}
  <CommitmentDelta dialogueId={deliberationId} refreshKey={`${trace?.status}:${trace?.steps?.length ?? 0}`} />
 </div>


      {/* Legend + narrative */}
      {showGuide && (
        <div className="grid gap-2 md:grid-cols-2">
          <div className="border rounded p-2 bg-slate-50">
            <div className="font-semibold text-sm mb-1">Legend</div>
            <ul className="list-disc ml-4 space-y-1 text-xs">
              <li><b>P</b> / <b>O</b>: Proponent / Opponent</li>
              <li><b>† Daimon</b>: branch ends (accept/fail)</li>
              <li><b>⊕ Additive</b>: choice node</li>
              <li><b>Locus</b> <code>0.1.2</code>: root → child 1 → child 2</li>
              <li><b>Orthogonal</b>: no illegal reuse across designs</li>
            </ul>
          </div>

          <div className="border rounded p-2 bg-slate-50">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-sm mb-1">Narrated trace</div>
              <button
                className="text-[11px] underline decoration-dotted"
                onClick={() => {
                  if (!lines.length) return;
                  const txt = lines.map((l, i) => `${i + 1}) ${l.text}`).join('\n');
                  navigator.clipboard?.writeText(txt).catch(() => {});
                }}
                title="Copy narrated trace"
              >
                Copy
              </button>
            </div>

            {!trace ? (
              <div className="text-xs text-neutral-500">No trace yet — post a WHY or GROUNDS.</div>
            ) : (
              <ol className="list-decimal ml-5 space-y-1 text-sm">
                {lines.map((ln, i) => (
                  <li key={i}>
                    <button
                      className={[
                        'text-left underline decoration-dotted',
                        focusIdx === i ? 'text-sky-700' : 'text-neutral-800',
                        ln.decisive ? 'font-semibold' : '',
                      ].join(' ')}
                      onClick={() => setFocusIdx(i)}
                      title={ln.hover} 
                    >
                      {i + 1}) {ln.text}
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}

      {/* Trees */}
      <div className="grid gap-4">
        {viewMode === 'unified' ? (
          <div className="border rounded-lg p-2 bg-white/60">
            <div className="text-xs mb-1 flex items-center gap-2">
              <b>Unified loci</b>
              <span className="px-1.5 py-0.5 rounded border bg-slate-50">acts {actsCount}</span>
            </div>
            <LociTree
              root={mergeDesignsToTree(designs)}
              usedAdditive={trace?.usedAdditive}
              onPickBranch={pickAdditive}
              focusPath={focusPath}
              onCommitHere={commitAtPath}
              onFocusPathChange={onFocusPathChange}
              defaultCollapsedDepth={1}
              showExpressions
              heatmap={heatmap}
              stepIndexByActId={stepIndexByActId}
              autoScrollOnFocus
              enableKeyboardNav
            />
{commitOpen && commitPath && targetIdFromContext && (
  <NLCommitPopover
    open={commitOpen}
    onOpenChange={setCommitOpen}
    deliberationId={deliberationId}
    targetType={targetTypeFromContext}
    targetId={targetIdFromContext}
    locusPath={commitPath}
    defaultOwner="Proponent"
    onDone={() => {/* refresh */}}
  />
)}
          </div>
        ) : (
          // Split view: one per design (kept for debugging/teaching)
          <div className="grid md:grid-cols-2 gap-4">
            {isDesignsLoading && (
              <>
                <SkeletonCard lines={4} />
                <SkeletonCard lines={4} />
              </>
            )}
            {designsError && (
              <div className="col-span-2 text-xs text-rose-600 border rounded p-2">
                Failed to load designs.
              </div>
            )}
            {designs?.map((d: any) => (
              <div key={d.id} className="border rounded-lg p-2 bg-white/60">
                <div className="text-xs mb-1 flex items-center gap-2">
                  <b>{d.participantId}</b> · {d.id.slice(0, 6)}
                  {(() => {
                    const first = (d.acts ?? [])[0];
                    const start =
                      first?.polarity === 'O' ? 'Start: Negative'
                        : first?.polarity === 'P' ? 'Start: Positive'
                        : 'Start: —';
                    return <span className="px-1.5 py-0.5 rounded border bg-slate-50">{start}</span>;
                  })()}
                  <span className="px-1.5 py-0.5 rounded border bg-slate-50">acts {d.acts?.length ?? 0}</span>
                </div>
                <LociTree
                  root={shapeToTree(d)}
                  onPickBranch={pickAdditive}
                  usedAdditive={trace?.usedAdditive}
                  focusPath={focusPath}
                  onFocusPathChange={onFocusPathChange}
                  defaultCollapsedDepth={1}
                  showExpressions
                  heatmap={heatmap}
                  stepIndexByActId={stepIndexByActId}
                  autoScrollOnFocus
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Commitments */}
      <div className="grid md:grid-cols-2 gap-4">
        <CommitmentsPanel dialogueId={deliberationId} ownerId="Proponent" onChanged={() => {}} />
        <CommitmentsPanel dialogueId={deliberationId} ownerId="Opponent" onChanged={() => {}} />
      </div>

      {/* Defense tree */}
      <DefenseTree designs={designs} trace={trace ?? { steps: [], status: 'ONGOING' }} decisiveWindow={3} highlightIndices={trace?.decisiveIndices} />

      {/* Inspector */}
      {focusIdx !== null && trace && (
        <ActInspector pos={byAct.get(trace.steps[focusIdx]?.posActId)} neg={byAct.get(trace.steps[focusIdx]?.negActId)} onClose={() => setFocusIdx(null)} />
      )}

      {/* Judge tools */}
      <JudgeConsole
        onForceConcession={onForceConcession}
        onCloseBranch={onCloseBranch}
        onConcede={onConcede}
        onStepNow={step}
        locusSuggestions={['0', '0.1', '0.2']}
        defaultTarget="Opponent"
      />
      {toast.node}
    </div>
  );
}

/* ------------------------------ Utilities ------------------------------- */
function shapeToTree(d: any) {
  const nodes = new Map<string, any>();
  const ensure = (path: string) => {
    if (!nodes.has(path)) nodes.set(path, { id: path, path, acts: [], children: [] });
    return nodes.get(path);
  };

  for (const a of d.acts ?? []) {
    const p = a?.locus?.path ?? '0';
    ensure(p).acts.push({
      id: a.id,
      polarity: a.polarity,
      expression: a.expression,
      isAdditive: a.isAdditive || a.additive,
    });
    const parts = p.split('.');
    for (let i = 1; i < parts.length; i++) ensure(parts.slice(0, i).join('.'));
  }

  const all = Array.from(nodes.values());
  const byPath = Object.fromEntries(all.map((n: any) => [n.path, n]));
  for (const n of all) {
    const parent = n.path.includes('.') ? n.path.split('.').slice(0, -1).join('.') : null;
    if (parent && byPath[parent]) byPath[parent].children.push(n);
  }
  return byPath['0'] || all[0] || { id: '0', path: '0', acts: [], children: [] };
}
