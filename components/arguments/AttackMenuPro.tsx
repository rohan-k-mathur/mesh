//components/arguments/AttackMenuPro.tsx
'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  ShieldX,
  ShieldAlert,
  Shield,
  Target,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Swords,
} from 'lucide-react';

// Lazy-load: ClaimPicker can be heavy (Command list, filters, fetches)
const ClaimPicker = dynamic(
  () => import('@/components/claims/ClaimPicker').then(m => m.ClaimPicker ),
  { ssr: false, loading: () => <div className="h-9 rounded bg-slate-100 animate-pulse" /> }
);

type ClaimRef = { id: string; text: string };
type Prem = { id: string; text: string };

export function AttackMenuPro({
  deliberationId,
  authorId,
  target,
  onDone,
}: {
  deliberationId: string;
  authorId: string;
  target: { id: string; conclusion: ClaimRef; premises: Prem[] };
  onDone?: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false); // mount content lazily on first open
  const titleRef = React.useRef<HTMLDivElement | null>(null);

  const handleOpenChange = React.useCallback((v: boolean) => {
    setOpen(v);
    if (v) {
      // allow overlay/portal to paint first, then mount heavy content
      requestAnimationFrame(() => setMounted(true));
    }
  }, []);

  const handleDone = React.useCallback(() => {
    setOpen(false);
    onDone?.();
  }, [onDone]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          className="
            inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-medium
            bg-white text-slate-700 border border-slate-300 btnv2 
            hover:bg-slate-50 hover:border-slate-400
            transition-all duration-200 shadow-sm hover:shadow
          "
        >
          {/* <Swords className="w-4 h-4" /> */}
          Counter
        </button>
      </DialogTrigger>

      <DialogContent
        className="max-w-3xl max-h-[85vh] overflow-y-auto bg-slate-50  "
        // Avoid a big focus-scan; focus our heading instead.
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          titleRef.current?.focus();
        }}
      >
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <DialogTitle
              ref={titleRef as any}
              tabIndex={-1}
              className="outline-none focus-visible:ring-2 ring-indigo-200 text-xl font-bold text-slate-900 flex items-center gap-2"
            >
              {/* <Swords className="w-5 h-5 text-slate-600" /> */}
              Challenge This Argument
            </DialogTitle>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Choose how to challenge this argument using a formal attack type.
          </p>
        </DialogHeader>

        <div className="mt-0">
          {mounted ? (
            <AttackMenuContent
              deliberationId={deliberationId}
              authorId={authorId}
              target={target}
              onDone={handleDone}
            />
          ) : (
            // Lightweight placeholder while we lazily mount
            <div className="space-y-5">
              <div className="h-28 rounded-lg border border-slate-200 bg-white animate-pulse" />
              <div className="h-28 rounded-lg border border-slate-200 bg-white animate-pulse" />
              <div className="h-28 rounded-lg border border-slate-200 bg-white animate-pulse" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AttackMenuContent({
  deliberationId,
  authorId,
  target,
  onDone,
}: {
  deliberationId: string;
  authorId: string;
  target: { id: string; conclusion: ClaimRef; premises: Prem[] };
  onDone?: () => void;
}) {
  const [busy, setBusy] = React.useState<null | 'REBUTS' | 'UNDERCUTS' | 'UNDERMINES'>(null);

  // GATE heavy pickers behind user intent
  const [showRebut, setShowRebut] = React.useState(false);
  const [showUndermine, setShowUndermine] = React.useState(false);

  const [rebut, setRebut] = React.useState<ClaimRef | null>(null);
  const [undercutText, setUndercutText] = React.useState('');
  const [premiseId, setPremiseId] = React.useState(target.premises[0]?.id ?? '');
  const [undermine, setUndermine] = React.useState<ClaimRef | null>(null);

  React.useEffect(() => {
    // if target changes while open, reset premise selection to first
    setPremiseId(target.premises[0]?.id ?? '');
  }, [target.premises]);

  const createClaim = React.useCallback(async (text: string, signal?: AbortSignal) => {
    const r = await fetch('/api/claims', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ deliberationId, authorId, text }),
      signal,
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j?.ok === false) throw new Error(j?.error || `HTTP ${r.status}`);
    return j.id as string;
  }, [authorId, deliberationId]);

  const postCA = React.useCallback(async (body: any, signal?: AbortSignal) => {
    const r = await fetch('/api/ca', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      throw new Error(j?.error || `HTTP ${r.status}`);
    }
  }, []);

  const fire = React.useCallback(async (kind: 'REBUTS' | 'UNDERCUTS' | 'UNDERMINES') => {
    if (busy) return;
    setBusy(kind);
    const ctrl = new AbortController();
    try {
      if (kind === 'REBUTS') {
        if (!rebut) return;
        await postCA({
          deliberationId,
          conflictingClaimId: rebut.id,
          conflictedClaimId: target.conclusion.id,
          legacyAttackType: 'REBUTS',
          legacyTargetScope: 'conclusion',
        }, ctrl.signal);
      } else if (kind === 'UNDERCUTS') {
        const txt = undercutText.trim();
        if (!txt) return;
        const exceptionClaimId = await createClaim(txt, ctrl.signal);
        await postCA({
          deliberationId,
          conflictingClaimId: exceptionClaimId,
          conflictedArgumentId: target.id,
          legacyAttackType: 'UNDERCUTS',
          legacyTargetScope: 'inference',
        }, ctrl.signal);
      } else {
        if (!premiseId || !undermine) return;
        await postCA({
          deliberationId,
          conflictingClaimId: undermine.id,
          conflictedClaimId: premiseId,
          legacyAttackType: 'UNDERMINES',
          legacyTargetScope: 'premise',
        }, ctrl.signal);
      }

      // Clear local state & notify
      setRebut(null);
      setUndercutText('');
      setUndermine(null);
      onDone?.();
    } finally {
      setBusy(null);
      ctrl.abort(); // be tidy
    }
  }, [busy, rebut, undercutText, premiseId, undermine, postCA, createClaim, deliberationId, target.id, target.conclusion.id, onDone]);

  return (
    <div className="space-y-6">
      {/* REBUT */}
      <div className="group relative rounded-lg border border-rose-200 bg-rose-50  p-4 transition-all duration-200 hover:shadow-md">
        <div className="flex items-start gap-3 mb-3">
          {/* <div className="flex items-center justify-center w-10 h-10 rounded-full bg-rose-100 text-rose-600 shrink-0">
            <ShieldX className="w-5 h-5" strokeWidth={2.5} />
          </div> */}
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-rose-900 mb-1">Rebut</h3>
            <p className="text-xs text-rose-700 leading-relaxed">
              Challenge the <span className="font-semibold">conclusion</span> by providing a conflicting claim
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="p-2.5 bg-white rounded-lg border border-rose-100">
            <div className="flex items-start gap-2">
              {/* <Target className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" /> */}
              <div>
                <div className="text-xs font-medium text-rose-700 mb-1">Target Conclusion</div>
                <div className="text-xs text-slate-700 leading-relaxed">{target.conclusion.text}</div>
              </div>
            </div>
          </div>

          {!showRebut ? (
            <button
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-rose-300 text-rose-700 hover:bg-rose-50 transition"
              onClick={() => setShowRebut(true)}
            >
              {/* <ShieldX className="w-4 h-4" /> */}
              Start rebuttal
            </button>
          ) : (
            <>
              <label className="block text-xs font-medium text-slate-700 mb-2">
                Your Counter-Claim
              </label>
              <ClaimPicker
                deliberationId={deliberationId}
                authorId={authorId}
                label="Select or create counter-claim"
                onPick={setRebut}
              />
              {rebut && (
                <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    {/* <Sparkles className="w-3 h-3 text-emerald-600 mt-0.5 shrink-0" /> */}
                    <div className="text-xs text-emerald-800">{rebut.text}</div>
                  </div>
                </div>
              )}

              <button
                className="
                  w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
                  text-sm font-semibold bg-rose-600 text-white hover:bg-rose-700
                  disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md active:scale-95
                "
                disabled={!rebut || !!busy}
                onClick={() => fire('REBUTS')}
                aria-busy={busy === 'REBUTS'}
              >
                {busy === 'REBUTS' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Posting rebuttal...
                  </>
                ) : (
                  <>
                    {/* <ShieldX className="w-4 h-4" /> */}
                    Post Rebuttal
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* UNDERCUT */}
      <div className="group relative rounded-lg border border-amber-200 bg-amber-50 p-4 transition-all duration-200 hover:shadow-md">
        <div className="flex items-start gap-3 mb-3">
          {/* <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 text-amber-600 shrink-0">
            <ShieldAlert className="w-5 h-5" strokeWidth={2.5} />
          </div> */}
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-amber-900 mb-1">Undercut</h3>
            <p className="text-xs text-amber-700 leading-relaxed">
              Challenge the <span className="font-semibold">reasoning</span> by stating an exception or rule-defeater
            </p>
          </div>
        </div>

        <div className="space-y-3 ">
          <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
            {/* <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" /> */}
            <p className="text-xs text-amber-800 leading-relaxed">
              Explain why the inference from premises to conclusion might not hold in this case
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">
              Exception or Rule-Defeater
            </label>
            <textarea
              value={undercutText}
              onChange={e => setUndercutText(e.target.value)}
              placeholder="E.g., 'However, the expert's opinion was given before key evidence emerged...'"
              className="
                w-full px-3 py-2.5 rounded-lg border border-amber-300
                focus:border-amber-400 focus:ring-2 focus:ring-amber-100
                transition-all duration-200 resize-none text-sm leading-relaxed
              "
              rows={3}
            />
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs text-slate-500">{undercutText.length} characters</span>
              {undercutText.trim() && <span className="text-xs text-emerald-600 font-medium">Ready to post</span>}
            </div>
          </div>

          <button
            className="
              w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
              text-sm font-semibold bg-amber-600 text-white hover:bg-amber-700
              disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md active:scale-95
            "
            disabled={!undercutText.trim() || !!busy}
            onClick={() => fire('UNDERCUTS')}
            aria-busy={busy === 'UNDERCUTS'}
          >
            {busy === 'UNDERCUTS' ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Posting undercut...
              </>
            ) : (
              <>
                {/* <ShieldAlert className="w-4 h-4" /> */}
                Post Undercut
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* UNDERMINE */}
      <div className="group relative rounded-lg border border-slate-200 bg-slate-100 p-4 transition-all duration-200 hover:shadow-md">
        <div className="flex items-start gap-3 mb-3">
          {/* <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 text-slate-600 shrink-0">
            <Shield className="w-5 h-5" strokeWidth={2.5} />
          </div> */}
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">Undermine</h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              Challenge a <span className="font-semibold">premise</span> by providing a contradicting claim
            </p>
          </div>
        </div>

        <div className="space-y-3 ">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">
              Select Target Premise
            </label>
            <select
              className="
                w-full px-3 py-2.5 rounded-lg border border-slate-300
                focus:border-slate-400 focus:ring-2 focus:ring-slate-100
                transition-all duration-200 text-sm bg-white
              "
              value={premiseId}
              onChange={e => setPremiseId(e.target.value)}
            >
              {target.premises.map(p => (
                <option key={p.id} value={p.id}>
                  {p.text}
                </option>
              ))}
            </select>
          </div>

          {premiseId && (
            <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-lg">
              <div className="flex items-start gap-2">
                {/* <Target className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" /> */}
                <div>
                  <div className="text-xs font-medium text-slate-700 mb-1">Target Premise</div>
                  <div className="text-xs text-slate-600 leading-relaxed">
                    {target.premises.find(p => p.id === premiseId)?.text}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!showUndermine ? (
            <button
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
              onClick={() => setShowUndermine(true)}
            >
              {/* <Shield className="w-4 h-4" /> */}
              Pick contradicting claim
            </button>
          ) : (
            <>
              <label className="block text-xs font-medium text-slate-700 mb-2">
                Your Contradicting Claim
              </label>
              <ClaimPicker
                deliberationId={deliberationId}
                authorId={authorId}
                label="Select or create contradicting claim"
                onPick={setUndermine}
              />
              {undermine && (
                <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    {/* <Sparkles className="w-3 h-3 text-emerald-600 mt-0.5 shrink-0" /> */}
                    <div className="text-xs text-emerald-800">{undermine.text}</div>
                  </div>
                </div>
              )}

              <button
                className="
                  w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
                  text-sm font-semibold bg-slate-700 text-white hover:bg-slate-800
                  disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md active:scale-95
                "
                disabled={!premiseId || !undermine || !!busy}
                onClick={() => fire('UNDERMINES')}
                aria-busy={busy === 'UNDERMINES'}
              >
                {busy === 'UNDERMINES' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Posting undermine...
                  </>
                ) : (
                  <>
                    {/* <Shield className="w-4 h-4" /> */}
                    Post Undermine
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
