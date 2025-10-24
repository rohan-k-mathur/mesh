//components/arguments/AIFArgumentsListPro.tsx
'use client';

import * as React from 'react';
import { mutate as swrMutate } from 'swr';
import useSWRInfinite from 'swr/infinite';
import useSWR from 'swr';
import { Virtuoso } from 'react-virtuoso';
import { EntityPicker } from '../kb/EntityPicker';
import dynamic from 'next/dynamic';
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  Search,
  Filter,
  Link2,
  TrendingUp,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  HelpCircle,
} from 'lucide-react';

import { listSchemes, getArgumentCQs, askCQ, exportAif } from '@/lib/client/aifApi';
import PromoteToClaimButton from '@/components/claims/PromoteToClaimButton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { ClaimPicker } from '@/components/claims/ClaimPicker';
import { ConfidenceProvider, useConfidence } from '@/components/agora/useConfidence';
import { set } from 'lodash';
import { ArgumentCard } from './ArgumentCard';
import { ArgumentCardV2 } from './ArgumentCardV2';
import { SchemeComposerPicker } from '../SchemeComposerPicker';


const AttackMenuProV2 = dynamic(() => import('@/components/arguments/AttackMenuProV2').then(m => m.AttackMenuProV2), { ssr: false });
const CommunityDefenseMenu = dynamic(() => import('@/components/agora/CommunityDefenseMenu').then(m => m.CommunityDefenseMenu), { ssr: false });
const ClarificationRequestButton = dynamic(() => import('@/components/issues/ClarificationRequestButton').then(m => m.ClarificationRequestButton), { ssr: false });
const SchemeSpecificCQsModal = dynamic(() => import('@/components/arguments/SchemeSpecificCQsModal').then(m => m.SchemeSpecificCQsModal), { ssr: false });
// LegalMoveToolbar - Not needed in argument browsing context. See COMPONENT_ANALYSIS_LMT_vs_AMP.md
// const LegalMoveToolbar = dynamic(() => import('@/components/dialogue/LegalMoveToolbar').then(m => m.LegalMoveToolbar), { ssr: false });

// ============================================================================
// TYPES
// ============================================================================

type Arg = {
  id: string;
  text: string;
  createdAt: string;
  authorId: string;
  mediaType?: 'text' | 'image' | 'video' | 'audio' | null;
  mediaUrl?: string | null;
  claimId?: string | null;
  schemeId?: string | null;
  approvalsCount?: number;
};

type AifMeta = {
  scheme?: { id: string; key: string; name: string; slotHints?: { premises?: { role: string; label: string }[] } | null } | null;
  conclusion?: { id: string; text: string } | null;
  premises?: Array<{ id: string; text: string; isImplicit?: boolean }> | null;
  implicitWarrant?: { text?: string } | null;
  attacks?: { REBUTS: number; UNDERCUTS: number; UNDERMINES: number };
  cq?: { required: number; satisfied: number };
  preferences?: { preferredBy?: number; dispreferredBy?: number };
};

type AifRow = {
  id: string;
  deliberationId: string;
  authorId: string;
  createdAt: string;
  text: string;
  mediaType: 'text' | 'image' | 'video' | 'audio' | null;
  aif: AifMeta;
  claimId?: string | null;
};

// ============================================================================
// CONSTANTS & UTILITIES
// ============================================================================

const PAGE = 20;

const fetcher = (u: string) => fetch(u, { cache: 'no-store' }).then(async r => {
  const j = await r.json().catch(() => ({}));
  if (!r.ok || (j && j.ok === false)) throw new Error(j?.error || `HTTP ${r.status}`);
  return j;
});

function metaSig(m?: AifMeta) {
  if (!m) return '';
  const a = m.attacks || { REBUTS: 0, UNDERCUTS: 0, UNDERMINES: 0 };
  const cq = m.cq || { required: 0, satisfied: 0 };
  const p = m.preferences || { preferredBy: 0, dispreferredBy: 0 };
  return [
    m.scheme?.key || '',
    m.conclusion?.id || '',
    (m.premises?.length || 0),
    a.REBUTS, a.UNDERCUTS, a.UNDERMINES,
    cq.required, cq.satisfied,
    p.preferredBy || 0, p.dispreferredBy || 0,
  ].join('|');
}

// ============================================================================
// UI COMPONENTS
// ============================================================================

function SupportBar({ value }: { value: number }) {
  const v = Math.max(0, Math.min(1, value || 0));
  return (
    <div className="h-2 w-28 rounded bg-slate-200 overflow-hidden">
      <div className="h-full bg-emerald-500" style={{ width: `${(v * 100).toFixed(1)}%` }} />
    </div>
  );
}

function SchemeBadge({ scheme }: { scheme?: AifMeta['scheme'] }) {
  if (!scheme) return null;

  return (
    <div
      className="
        inline-flex items-center gap-1.5 px-3 py-1 rounded-full
        bg-gradient-to-r from-indigo-50 to-purple-50
        border border-indigo-200 text-indigo-700
        text-xs font-medium shadow-sm
        transition-all duration-200 hover:shadow-md
      "
      title={scheme?.slotHints?.premises?.length ? scheme.slotHints.premises.map(p => p.label).join(' · ') : scheme?.name}
    >
      {scheme.name}
    </div>
  );
}

function PreferenceCounts({ p }: { p?: { preferredBy?: number; dispreferredBy?: number } }) {
  if (!p || (p.preferredBy === 0 && p.dispreferredBy === 0)) return null;

  return (
    <div className="inline-flex items-center gap-1.5">
      {p.preferredBy !== 0 && (
        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
          <ArrowUp className="w-3 h-3" />
          {"preferred by " + p.preferredBy}
        </div>
      )}
      {p.dispreferredBy !== 0 && (
        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
          <ArrowDown className="w-3 h-3" />
          {"dispreferred by " + p.dispreferredBy}
        </div>
      )}
    </div>
  );
}

function CqMeter({ cq }: { cq?: { required: number; satisfied: number } }) {
  const r = cq?.required ?? 0;
  const s = cq?.satisfied ?? 0;
  const pct = r ? Math.round((s / r) * 100) : 0;

  const colorClass =
    pct === 100 ? 'bg-emerald-100 border-emerald-300 text-emerald-700' :
      pct >= 50 ? 'bg-amber-100 border-amber-300 text-amber-700' :
        pct > 0 ? 'bg-orange-100 border-orange-300 text-orange-700' :
          'bg-slate-100 border-slate-300 text-slate-600';

  const Icon = pct === 100 ? CheckCircle2 : pct > 0 ? AlertTriangle : AlertTriangle;

  return (
    <div
      className={`
        inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-medium
        transition-all duration-200
        ${colorClass}
      `}
      title={r ? `${s}/${r} Critical Questions satisfied` : 'No CQs yet'}
    >
      <Icon className="w-3 h-3" />
      CQ {pct}%
    </div>
  );
}

function AttackCounts({ a }: { a?: AifMeta['attacks'] }) {
  if (!a || (a.REBUTS === 0 && a.UNDERCUTS === 0 && a.UNDERMINES === 0)) return null;

  return (
    <div className="inline-flex items-center gap-1.5">
      {a.REBUTS > 0 && (
        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium"
          title="Rebuts (attacks conclusion)">
          {a.REBUTS}
        </div>
      )}
      {a.UNDERCUTS > 0 && (
        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium"
          title="Undercuts (attacks inference)">
          {a.UNDERCUTS}
        </div>
      )}
      {a.UNDERMINES > 0 && (
        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium"
          title="Undermines (attacks premise)">
          {a.UNDERMINES}
        </div>
      )}
    </div>
  );
}

function ClampedBody({ text, lines = 4, onOpen }: { text: string; lines?: number; onOpen: () => void }) {
  return (
    <div className="relative">
      <div className={`text-sm leading-relaxed text-slate-700 whitespace-pre-wrap line-clamp-${lines}`}>
        {text}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none" />
      <button
        className="
          absolute bottom-0 right-0 px-3 py-1 text-xs font-medium
          bg-white border border-slate-200 rounded-full
          text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50
          transition-all duration-200 shadow-sm hover:shadow
          flex items-center gap-1
        "
        onClick={onOpen}
      >
        Read more
        <ChevronDown className="w-3 h-3" />
      </button>
    </div>
  );
}

// ============================================================================
// PREFERENCE ATTACK WIDGET
// ============================================================================

function PreferenceQuick({
  deliberationId,
  argumentId,
  authorId,
  onDone,
}: {
  deliberationId: string;
  argumentId: string;
  authorId: string;
  onDone?: () => void;
}) {
  const [open, setOpen] = React.useState<null | 'prefer' | 'disprefer'>(null);
  const [selectedClaim, setSelectedClaim] = React.useState<{ id: string; label: string } | null>(null);
  const [showPicker, setShowPicker] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  async function submit() {
    if (!open || !selectedClaim || busy) return;
    setBusy(true);
    try {
      const body = open === 'prefer'
        ? { deliberationId, preferredArgumentId: argumentId, dispreferredArgumentId: selectedClaim.id }
        : { deliberationId, preferredArgumentId: selectedClaim.id, dispreferredArgumentId: argumentId };
      const r = await fetch('/api/pa', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j?.ok === false) throw new Error(j?.error || `HTTP ${r.status}`);
      setSelectedClaim(null);
      setOpen(null);
      onDone?.();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="inline-flex items-center gap-2 flex-wrap">
      <button
        className={`
          inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium
          transition-all duration-200
          ${open === 'prefer'
            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
            : 'bg-emerald-50/50 text-slate-600 border border-slate-200 hover:bg-emerald-50 hover:border-emerald-300'
          }
        `}
        onClick={() => setOpen(open === 'prefer' ? null : 'prefer')}
      >
        <ArrowUp className="w-3 h-3" />
        Prefer over…
      </button>
      <button
        className={`
          inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium
          transition-all duration-200
          ${open === 'disprefer'
            ? 'bg-rose-100 text-rose-700 border border-rose-200'
            : 'bg-rose-50/50 text-slate-600 border border-slate-200 hover:bg-rose-50 hover:border-rose-300'
          }
        `}
        onClick={() => setOpen(open === 'disprefer' ? null : 'disprefer')}
      >
        <ArrowDown className="w-3 h-3" />
        Disprefer to…
      </button>
      
      {open && (
        <div className="absolute z-50 inline-flex items-center gap-2 px-3 py-3 bg-slate-50/20 backdrop-blur-xl rounded-lg border border-slate-200 animate-in slide-in-from-top duration-200">
          <button
            className="px-3 py-1.5 rounded-lg w-full text-xs font-medium bg-white border border-slate-300 hover:bg-slate-50 transition-all"
            onClick={() => setShowPicker(true)}
          >
            {selectedClaim ? selectedClaim.label : 'Select claim…'}
          </button>
          <EntityPicker
            kind="claim"
            open={showPicker}
            onClose={() => setShowPicker(false)}
            onPick={(item) => setSelectedClaim(item)}
          />
          <button
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-all"
            disabled={!selectedClaim || busy}
            onClick={submit}
          >
            {busy ? 'Posting…' : 'Post'}
          </button>
          <button
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200 transition-all"
            onClick={() => {
              setOpen(null);
              setSelectedClaim(null);
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// FILTER CONTROLS
// ============================================================================

function Controls({
  schemes,
  schemeKey,
  setSchemeKey,
  q,
  setQ,
  showPremises,
  setShowPremises,
  onExport,
}: {
  schemes: Array<{ key: string; name: string }>;
  schemeKey: string;
  setSchemeKey: (k: string) => void;
  q: string;
  setQ: (s: string) => void;
  showPremises: boolean;
  setShowPremises: (v: boolean) => void;
  onExport: () => void;
}) {
  const [showFilters, setShowFilters] = React.useState(false);
  const activeFilters = (schemeKey || q.trim()) ? 1 : 0;

  return (
    <div className="px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <h2 className="text-lg font-semibold text-slate-900">Arguments (AIF)</h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onExport}
            className="inline-flex btnv2--ghost bg-white items-center gap-2 px-2 py-2 font-medium rounded-lg text-xs "
            title="Download AIF JSON‑LD export"
          >
            Export
          </button>
          <button
            onClick={() => setShowPremises(!showPremises)}
            className={`
              inline-flex  btnv2--ghost  items-center gap-2 px-2 py-2 rounded-lg text-xs font-medium
              transition-all duration-200
              ${showPremises
                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }
            `}
            title={showPremises ? 'Hide premises' : 'Show premises'}
          >
            {showPremises ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            Premises
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`
             inline-flex btnv2--ghost items-center gap-2 px-2 py-2 font-medium rounded-lg text-xs
              ${showFilters || activeFilters > 0
                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                : 'bg-white text-slate-600 '
              }
            `}
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFilters > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-xs font-bold">
                {activeFilters}
              </span>
            )}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200 animate-in slide-in-from-top duration-200">
          <div className="flex flex-wrap gap-3">
            <label className="flex-1 min-w-[240px]">
              <span className="block text-xs font-medium text-slate-700 mb-1">Search</span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder="Search conclusion or premise…"
                  className="
                    w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300
                    focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100
                    transition-all duration-200 text-sm
                  "
                  aria-label="Search arguments"
                />
              </div>
            </label>

            <label className="min-w-[200px]">
              <span className="block text-xs font-medium text-slate-700 mb-1">Scheme</span>
              <select
                value={schemeKey}
                onChange={e => setSchemeKey(e.target.value)}
                className="
                  w-full px-3 py-2 rounded-lg border border-slate-300
                  focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100
                  transition-all duration-200 text-sm bg-white
                "
                aria-label="Filter by scheme"
              >
                <option value="">All Schemes</option>
                {schemes.map(s => (
                  <option key={s.key} value={s.key}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ROW COMPONENT
// ============================================================================

function RowImpl({
  a,
  meta,
  deliberationId,
  showPremises,
  onPromoted,
  onRefreshRow,
  isVisible,
  support,
  accepted,
}: {
  a: AifRow;
  meta?: AifMeta;
  deliberationId: string;
  showPremises: boolean;
  onPromoted: () => void;
  onRefreshRow: (id: string) => void;
  isVisible: boolean;
  support?: number;
  accepted?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [cqs, setCqs] = React.useState<Array<{ cqKey: string; text: string; status: 'open' | 'answered'; attackType: string; targetScope: string }>>([]);
  const [showCopied, setShowCopied] = React.useState(false);
  const [cqsLoaded, setCqsLoaded] = React.useState(false);

  // Lazy load CQs when modal opens
  const loadCQs = React.useCallback(async () => {
    if (cqsLoaded) return;
    try {
      const items = await getArgumentCQs(a.id);
      setCqs(items || []);
      setCqsLoaded(true);
    } catch (err) {
      console.error('[AIFArgumentsListPro] Failed to load CQs:', err);
    }
  }, [cqsLoaded, a.id]);

  const conclusionText = meta?.conclusion?.text || a.text || '';
  const created = new Date(a.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const copyLink = () => {
    const url = `${location.origin}${location.pathname}#arg-${a.id}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
      })
      .catch(() => { });
  };

  return (
    <article
      id={`arg-${a.id}`}
      className="
        group relative py-5 px-8 bg-slate-50 w-full border border-indigo-400 shadow-md shadow-slate-400/50 rounded-xl
        hover:shadow-slate-500/60 transition-all duration-100
  
      "
      aria-label={`Argument ${a.id}`}
    >
      {meta?.conclusion?.id && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-emerald-500 to-transparent" />
      )}

      <div className="flex flex-col gap-4">
        {/* Header section */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h4 className="text-base font-semibold text-slate-900 leading-snug mb-2">
              {conclusionText}
            </h4>

            {showPremises && meta?.premises && meta.premises.length > 0 && (
              <ul className="flex flex-wrap gap-1.5 mb-2" aria-label="Premises">
                {meta.premises.map(p => (
                  <li
                    key={p.id}
                    className="
                      inline-flex items-center gap-1 px-2.5 py-1 rounded-full
                      bg-slate-100 border border-slate-200 text-slate-700
                      text-xs transition-all duration-200
                      hover:bg-slate-200
                    "
                  >
                    {p.text || p.id}
                  </li>
                ))}
              </ul>
            )}

            {meta?.implicitWarrant?.text && (
              <div className="mt-2 px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 w-fit">
                <div className="flex items-start gap-2">
                  {/* <Sparkles className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" /> */}
                  <div className='flex gap-1'>
                    <div className="text-xs font-medium text-amber-900 mb-0.5">Implicit Warrant:</div>
                    <div className="text-xs text-amber-800">{meta.implicitWarrant.text}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Metadata badges */}
          <div className="shrink-0 flex flex-col items-end gap-2">
            <div className="flex items-center flex-wrap gap-1.5 justify-end">
              <time className="text-xs text-slate-500 font-medium">{created}</time>
              <SchemeBadge scheme={meta?.scheme} />
              <CqMeter cq={meta?.cq} />
              {typeof support === 'number' && (
                <div className="inline-flex items-center gap-2 ml-1">
                  <SupportBar value={support} />
                  {accepted && (
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700">
                      Accepted
                    </span>
                  )}
                </div>
              )}

            </div>
            <div className="flex items-center flex-wrap gap-1.5 justify-end">
              <PreferenceCounts p={meta?.preferences} />
              <AttackCounts a={meta?.attacks} />
            </div>
          </div>
        </div>

        {/* Body text */}
        {a.text && (
          <section className="p-4 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200">
            {a.text.length > 240 ? (
              <ClampedBody text={a.text} onOpen={() => setOpen(true)} />
            ) : (
              <div className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{a.text}</div>
            )}
          </section>
        )}

        {/* ArgumentCardV2 - shows interactive argument structure with improved UX */}
        {meta?.conclusion && (
          <ArgumentCardV2 
            deliberationId={deliberationId} 
            authorId={a.authorId} 
            id={a.id} 
            conclusion={meta.conclusion}
            premises={meta.premises || []}
            schemeKey={meta.scheme?.key}
            schemeName={meta.scheme?.name}
            onAnyChange={() => onRefreshRow(a.id)}
          />
        )}



        <footer className="flex flex-wrap items-center gap-2">
          <PreferenceQuick deliberationId={deliberationId} argumentId={a.id} authorId={a.authorId} onDone={() => onRefreshRow(a.id)} />

          <AttackMenuProV2
            deliberationId={deliberationId}
            authorId={a.authorId ?? 'current'}
            target={{
              id: a.id,
              conclusion: { id: meta?.conclusion?.id ?? '', text: conclusionText ?? '' },
              premises: meta?.premises ?? [],
            }}
            onDone={() => onRefreshRow(a.id)}
          />

          <CommunityDefenseMenu
            deliberationId={deliberationId}
            authorId={a.authorId ?? 'current'}
            target={{
              id: a.id,
              conclusion: { id: meta?.conclusion?.id ?? '', text: conclusionText ?? '' },
              premises: meta?.premises ?? [],
            }}
            onDone={() => onRefreshRow(a.id)}
          />

          <ClarificationRequestButton
            deliberationId={deliberationId}
            targetType="argument"
            targetId={a.id}
            targetLabel={conclusionText ?? `Argument ${a.id.slice(0, 8)}`}
            onSuccess={(issueId) => {
              console.log('Clarification request created:', issueId);
              // Optionally refresh or show success message
            }}
          />

          {/* Scheme-specific Critical Questions Modal */}
          {meta?.scheme && (
            <SchemeSpecificCQsModal
              argumentId={a.id}
              deliberationId={deliberationId}
              authorId={a.authorId}
              cqs={cqs}
              meta={meta}
              onRefresh={() => {
                onRefreshRow(a.id);
                setCqsLoaded(false); // Force reload CQs next time
              }}
              triggerButton={
                <button
                  onClick={loadCQs}
                  className="
                    inline-flex items-center gap-2 px-3 py-1.5 btnv2 rounded-lg text-xs font-medium
                    bg-white text-slate-600 border border-slate-200
                    hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700
                    transition-all duration-200
                  "
                  title="View and answer critical questions for this argument scheme"
                >
                  <HelpCircle className="w-4 h-4" />
                  CQs
                  {meta.cq && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                      {meta.cq.satisfied}/{meta.cq.required}
                    </span>
                  )}
                </button>
              }
            />
          )}

          <div className="flex-1" />

          {meta?.conclusion?.id ? (
            <a
              href={`/claim/${meta.conclusion.id}`}
              className="
                inline-flex items-center gap-2 px-3 py-1 btnv2 rounded-lg text-xs font-medium
                bg-emerald-100 text-emerald-700 border border-emerald-200
                hover:bg-emerald-200 transition-all duration-200 shadow-sm hover:shadow
              "
            >
              {/* <TrendingUp className="w-4 h-4" /> */}
              View Claim
            </a>
          ) : (
            <PromoteToClaimButton
              deliberationId={deliberationId}
              target={{ type: 'argument', id: a.id }}
              onClaim={async () => {
                onPromoted();
                onRefreshRow(a.id);
              }}
            />
          )}

          <button
            className="
                inline-flex items-center gap-2 px-3 py-1 btnv2 rounded-lg text-xs font-medium
              bg-white text-slate-600 border border-slate-200
              hover:border-slate-300 hover:bg-slate-50
              transition-all duration-200
            "
            onClick={copyLink}
            title="Copy link to this argument"
          >
            <Link2 className="w-4 h-4" />
            {showCopied ? 'Copied!' : 'Share'}
          </button>
        </footer>
      </div>

      {/* Full text dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[60vh] bg-white rounded-xl overflow-y-auto p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Full Argument</DialogTitle>
          </DialogHeader>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 mt-4">{a.text}</div>
          <div className="mt-6 flex justify-end">
            <DialogClose className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-all">
              Close
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </article>
  );
}

export const Row = React.memo(RowImpl, (prev, next) => {
  return (
    prev.a.id === next.a.id &&
    prev.showPremises === next.showPremises &&
    metaSig(prev.meta) === metaSig(next.meta)
  );
});

// ============================================================================
// MAIN LIST COMPONENT
// ============================================================================

export default function AIFArgumentsListPro({
  deliberationId,
  onVisibleTextsChanged,
}: {
  deliberationId: string;
  onVisibleTextsChanged?: (texts: string[]) => void;
}) {
  // Confidence settings
  const { mode, tau } = useConfidence();
  const apiMode = mode === 'product' ? 'prod' : mode;
  const [sortBySupport, setSortBySupport] = React.useState<boolean>(false);

  // Schemes
  const [schemes, setSchemes] = React.useState<Array<{ key: string; name: string }>>([]);
  React.useEffect(() => {
    let cancelled = false;
    listSchemes()
      .then(items => {
        if (!cancelled) setSchemes((items || []).map((s: any) => ({ key: s.key, name: s.name })));
      })
      .catch(() => setSchemes([]));
    return () => { cancelled = true; };
  }, []);

  // AIF metadata map
  const [aifMap, setAifMap] = React.useState<Record<string, AifMeta>>({});
  const [refreshing, setRefreshing] = React.useState<Set<string>>(new Set());
  const aifMapRef = React.useRef(aifMap);
  React.useEffect(() => { aifMapRef.current = aifMap; }, [aifMap]);

  const refreshAifForId = React.useCallback(async (id: string) => {
    try {
      setRefreshing(prev => new Set(prev).add(id));
      const one = await fetch(`/api/arguments/${id}/aif`).then(r => (r.ok ? r.json() : null));
      if (one?.aif) {
        setAifMap(prev => ({
          ...prev,
          [id]: {
            scheme: one.aif.scheme ?? null,
            conclusion: one.aif.conclusion ?? null,
            premises: one.aif.premises ?? [],
            implicitWarrant: one.aif.implicitWarrant ?? null,
            attacks: one.aif.attacks ?? { REBUTS: 0, UNDERCUTS: 0, UNDERMINES: 0 },
            cq: one.aif.cq ?? { required: 0, satisfied: 0 },
            preferences: one.aif.preferences ?? { preferredBy: 0, dispreferredBy: 0 },
          }
        }));
      }
    } catch {/* ignore */ }
    finally {
      setRefreshing(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  }, []);

  // Filters
  const [schemeKey, setSchemeKey] = React.useState('');
  const [q, setQ] = React.useState('');
  const dq = React.useDeferredValue(q);
  const [showPremises, setShowPremises] = React.useState(true);
  const [visibleRange, setVisibleRange] = React.useState({ startIndex: 0, endIndex: 20 });

  // Base list with pagination
  const getKey = (_idx: number, prev: any) => {
    if (prev && !prev.nextCursor) return null;
    const cursor = prev?.nextCursor ? `&cursor=${encodeURIComponent(prev.nextCursor)}` : '';
    return `/api/deliberations/${encodeURIComponent(deliberationId)}/arguments/aif?limit=${PAGE}${cursor}`;
  };

  const { data, error, size, setSize, isLoading, isValidating, mutate } =
    useSWRInfinite(getKey, fetcher, {
      revalidateOnFocus: false,
      keepPreviousData: true,
      dedupingInterval: 1500,
    });

  const pages = data ?? [];
  const rows: AifRow[] = pages.flatMap(p => p?.items ?? []);

  // Build stable key from row IDs
  const rowIdsKey = React.useMemo(() => rows.map(r => r.id).join(','), [rows]);

  // Hydrate AIF metadata for rows
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const byId: Record<string, AifMeta> = {};
      const pending = rows
        .filter(r => !r.aif && !aifMapRef.current[r.id])
        .map(r => r.id);

      await Promise.all(
        pending.map(async id => {
          try {
            const one = await fetch(`/api/arguments/${id}/aif`)
              .then(r => (r.ok ? r.json() : null))
              .catch(() => null);
            if (one?.aif) {
              byId[id] = {
                scheme: one.aif.scheme ?? null,
                conclusion: one.aif.conclusion ?? null,
                premises: one.aif.premises ?? [],
                implicitWarrant: one.aif.implicitWarrant ?? null,
                attacks: one.aif.attacks ?? { REBUTS: 0, UNDERCUTS: 0, UNDERMINES: 0 },
                cq: one.aif.cq ?? { required: 0, satisfied: 0 },
                preferences: one.aif.preferences ?? { preferredBy: 0, dispreferredBy: 0 },
              };
              return;
            }

            // Fallback: fetch CQs and attacks separately
            const aCq = await fetch(`/api/arguments/${id}/aif-cqs`)
              .then(r => (r.ok ? r.json() : null))
              .catch(() => null);
            const cq = Array.isArray(aCq?.items)
              ? { required: aCq.items.length, satisfied: aCq.items.filter((x: any) => x.status === 'answered').length }
              : undefined;

            const ca = await fetch(`/api/ca?targetArgumentId=${encodeURIComponent(id)}&limit=200`)
              .then(r => (r.ok ? r.json() : null))
              .catch(() => null);
            const g = { REBUTS: 0, UNDERCUTS: 0, UNDERMINES: 0 };
            for (const e of ca?.items ?? []) {
              const t = String(e.legacyAttackType || '').toUpperCase();
              if (t && t in g) (g as any)[t] += 1;
            }

            byId[id] = { cq, attacks: g };
          } catch {/* ignore */ }
        })
      );

      if (!cancelled) setAifMap(m => ({ ...m, ...byId }));
    })();
    return () => { cancelled = true; };
  }, [rowIdsKey]);

  // Search bucket cache
  const bucketRef = React.useRef<Record<string, string>>({});
  React.useEffect(() => {
    for (const r of rows) {
      const m = r.aif || aifMap[r.id];
      const sig = `${m?.conclusion?.id || ''}:${m?.premises?.length || 0}`;
      const key = `${r.id}::${sig}`;

      if ((bucketRef.current as any)[`${r.id}__sig`] !== key) {
        (bucketRef.current as any)[`${r.id}__sig`] = key;
        bucketRef.current[r.id] = [
          m?.conclusion?.text || r.text || '',
          ...(m?.premises?.map(p => p.text || '') ?? []),
          m?.implicitWarrant?.text || '',
        ].join(' ').toLowerCase();
      }
    }
  }, [rows, aifMap]);

  // Filtering
  const filtered: AifRow[] = React.useMemo(() => {
    const lower = dq.trim().toLowerCase();
    return rows.filter(a => {
      const m = a.aif || aifMap[a.id];
      const schemeOk = !schemeKey || m?.scheme?.key === schemeKey;
      const bucket = bucketRef.current[a.id] || '';
      const qOk = !lower || bucket.includes(lower);
      return schemeOk && qOk;
    });
  }, [rows, aifMap, schemeKey, dq]);

  // Conclusion IDs for score fetching
  const conclusionIds = React.useMemo(() => {
    const s = new Set<string>();
    for (const r of filtered) {
      const id = r.aif?.conclusion?.id || aifMap[r.id]?.conclusion?.id;
      if (id) s.add(id);
    }
    return Array.from(s);
  }, [filtered, aifMap]);

  // Fetch evidential scores
  const scoreKey = conclusionIds.length
    ? `/api/evidential/score?${new URLSearchParams({
      deliberationId,
      mode: apiMode,
      ...(tau != null ? { tau: String(tau) } : {}),
      ids: conclusionIds.join(',')
    }).toString()}`
    : null;

  const { data: scoreDoc } = useSWR<{ ok: boolean; items: Array<{ id: string; score?: number; bel?: number; accepted?: boolean }> }>(
    scoreKey,
    (u) => fetch(u, { cache: 'no-store' }).then(r => r.json()),
    { revalidateOnFocus: false }
  );

  const byClaimScore = React.useMemo(() => {
    const m = new Map<string, { v: number; acc: boolean }>();
    for (const it of (scoreDoc?.items ?? [])) {
      const v = (typeof it.score === 'number' ? it.score : (typeof (it as any).bel === 'number' ? (it as any).bel : 0)) || 0;
      m.set(it.id, { v, acc: !!it.accepted });
    }
    return m;
  }, [scoreDoc]);

  // Sorting by support
  const sorted = React.useMemo(() => {
    if (!sortBySupport) return filtered;
    const cp = [...filtered];
    cp.sort((a, b) => {
      const aid = a.aif?.conclusion?.id || aifMap[a.id]?.conclusion?.id || '';
      const bid = b.aif?.conclusion?.id || aifMap[b.id]?.conclusion?.id || '';
      const av = byClaimScore.get(aid)?.v ?? 0;
      const bv = byClaimScore.get(bid)?.v ?? 0;
      return (bv - av) || (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    });
    return cp;
  }, [filtered, aifMap, sortBySupport, byClaimScore]);

  // Notify parent of visible texts
  React.useEffect(() => {
    if (!onVisibleTextsChanged || sorted.length === 0) return;
    const start = Math.max(0, visibleRange.startIndex);
    const end = Math.min(sorted.length - 1, visibleRange.endIndex);
    const texts: string[] = [];
    for (let i = start; i <= end; i++) {
      const r = sorted[i];
      const t = r.aif?.conclusion?.text ?? aifMap[r.id]?.conclusion?.text ?? r.text ?? '';
      if (t) texts.push(t);
    }
    onVisibleTextsChanged(texts);
  }, [onVisibleTextsChanged, visibleRange, sorted, aifMap]);

  // Loading state
  if (isLoading && rows.length === 0) {
    return (
      <section className="w-full rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="p-8 text-center">
          <div className="inline-block w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
          <p className="text-sm text-slate-600">Loading arguments...</p>
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="w-full rounded-xl border border-rose-200 bg-rose-50 shadow-sm">
        <div className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-100 mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-sm font-medium text-rose-900 mb-2">Failed to load arguments</h3>
          <p className="text-xs text-rose-700 mb-4">{String(error?.message || 'Unknown error')}</p>
          <button
            onClick={() => swrMutate(getKey, undefined, { revalidate: true })}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-rose-600 text-white hover:bg-rose-700 transition-all duration-200 shadow-sm hover:shadow"
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  // Empty state
  if (!rows.length) {
    return (
      <section className="w-full rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white shadow-sm">
        <div className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 mb-4">
            <Shield className="w-8 h-8 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No arguments yet</h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto">Arguments will appear here as they are created with structured reasoning using AIF format.</p>
        </div>
      </section>
    );
  }

  const nextCursor = data?.[data.length - 1]?.nextCursor ?? null;

  return (

    <section aria-label="AIF arguments list" className="w-full rounded-xl bg-white panel-edge border border-zinc-500/50 overflow-hidden flex flex-col h-full">
      <Controls
        schemes={schemes}
        schemeKey={schemeKey}
        setSchemeKey={setSchemeKey}
        q={q}
        setQ={setQ}
        showPremises={showPremises}
        setShowPremises={setShowPremises}
        onExport={async () => {
          try {
            const doc = await exportAif(deliberationId, { includeLocutions: false, includeCQs: true });
            const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/ld+json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `aif-${deliberationId}.jsonld`;
            a.click();
            URL.revokeObjectURL(url);
          } catch (e) { console.error(e); }
        }}
      />

      {/* Confidence & sorting toolbar */}
      <div className="px-4 py-2 border-b-2 border-b-zinc-400 rounded-b-xl  bg-zinc-100/70 shadow-md flex items-center justify-between ">
        <div className="text-xs text-slate-600">
          Confidence: <b>{mode.toUpperCase()}</b>
          {tau != null && <span> · τ={tau.toFixed(2)}</span>}
        </div>
        <button
          className="text-xs px-2 py-1 rounded border border-slate-200 hover:bg-slate-50"
          onClick={() => setSortBySupport(v => !v)}
          title="Sort list by support of each row's conclusion"
        >
          {sortBySupport ? 'Sort: Default' : 'Sort: Support'}
        </button>
      </div>

      {/* Virtualized list */}
      <div className="h-[564px]">
        <Virtuoso
          data={sorted}
          computeItemKey={(_i, a) => a.id}
          increaseViewportBy={{ top: 200, bottom: 400 }}
          itemContent={(index, a) => {
            const meta = a.aif || aifMap[a.id];
            const cid = meta?.conclusion?.id;
            const sRec = cid ? byClaimScore.get(cid) : undefined;
            const isVisible = index >= visibleRange.startIndex - 2 && index <= visibleRange.endIndex + 2;
            const isRefreshing = refreshing.has(a.id);

            return (
              <div className='px-2 relative'>
                {isRefreshing && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <hr className='border-slate-300 h-1 my-3' />
              <Row
                a={a}
                meta={meta}
                deliberationId={deliberationId}
                showPremises={showPremises}
                onPromoted={() => window.dispatchEvent(new CustomEvent('claims:changed', { detail: { deliberationId } } as any))}
                onRefreshRow={refreshAifForId}
                isVisible={isVisible}
                support={sRec?.v}
                accepted={sRec?.acc}
              />
              </div>
            );
          }}
          rangeChanged={(r) => setVisibleRange(r)}
          endReached={() => !isValidating && nextCursor && setSize(s => s + 1)}
          components={{
            Footer: () => (
              <div className="py-6 text-center border-t border-slate-100">
                {isLoading ? (
                  <div className="inline-flex items-center gap-2 text-sm text-slate-600">
                    <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                    Loading more...
                  </div>
                ) : nextCursor ? (
                  <p className="text-sm text-slate-500">Scroll to load more</p>
                ) : (
                  <p className="text-sm text-slate-400">You&#39;ve reached the end</p>
                )}
              </div>
            ),
          }}
        />
      </div>
        {/* <Controls
          schemes={schemes}
          schemeKey={schemeKey}
          setSchemeKey={setSchemeKey}
          q={q}
          setQ={setQ}
          showPremises={showPremises}
          setShowPremises={setShowPremises}
          onExport={async () => {
            try {
              const doc = await exportAif(deliberationId, { includeLocutions: false, includeCQs: true });
              const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/ld+json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `aif-${deliberationId}.jsonld`;
              a.click();
              URL.revokeObjectURL(url);
            } catch (e) { console.error(e); }
          }}
        /> */}
    </section>

  );
}
