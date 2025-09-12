// components/dialogue/DialogicalPanel.tsx
'use client';
import * as React from 'react';
import type { AFNode, AFEdge } from '@/lib/argumentation/afEngine';
import {
  projectToAF,
  grounded,
  preferred,
  labelingFromExtension,
} from '@/lib/argumentation/afEngine';
import {
  inferSchemesFromText,
  questionsForScheme,
  cqUndercuts,
} from '@/lib/argumentation/criticalQuestions';
import { useDialogueMoves, useOpenCqs } from '@/components/dialogue/useDialogueMoves';
import { WinningnessBadge } from './WinningnessBadge';
import MapCanvas from '@/components/map/MapCanvas';
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader,
  DialogTitle, DialogClose
} from "@/components/ui/dialog";
import useSWR from 'swr';
import CriticalQuestions from '@/components/claims/CriticalQuestions';




/* ------------------------------- Types ---------------------------------- */
type Props = {
  deliberationId: string;
  nodes: AFNode[];
  edges: AFEdge[];
};

/* -------------------------- Small local helpers ------------------------- */
function hoursLeft(iso?: string) {
  if (!iso) return null;
  const ms = Date.parse(iso) - Date.now();
  return Math.max(0, Math.ceil(ms / 36e5));
}

// Stable extension enumerator (safe for small AFs; otherwise falls back)
function computeStableExtension(A: { id: string }[], R: Array<[string, string]>): Set<string> | null {
  const ids = A.map((a) => a.id);
  if (ids.length > 18) return null;
  const attacks = new Set(R.map(([x, y]) => `${x}→${y}`));
  const n = ids.length, total = 1 << n;
  for (let mask = 0; mask < total; mask++) {
    const E = new Set<string>();
    for (let i = 0; i < n; i++) if (mask & (1 << i)) E.add(ids[i]);

    // conflict-free
    let ok = true;
    outer: for (const a of E) for (const b of E) {
      if (a !== b && attacks.has(`${a}→${b}`)) { ok = false; break outer; }
    }
    if (!ok) continue;

    // attacks every outside node
    const outside = ids.filter((x) => !E.has(x));
    for (const y of outside) {
      let attacked = false;
      for (const a of E) if (attacks.has(`${a}→${y}`)) { attacked = true; break; }
      if (!attacked) { ok = false; break; }
    }
    if (ok) return E;
  }
  return null;
}

/* ---------- Glassy UI helpers (no deps; consistent with your style) ----- */
function ChipBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-slate-200/80 bg-white/70 px-2.5 py-1 text-xs backdrop-blur">
      {children}
    </div>
  );
}


const FancyScroller = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function FancyScroller({ className = '', children, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={'relative overflow-y-auto ' + className}
        {...props}
        style={{
          WebkitMaskImage:
            'linear-gradient(to bottom, transparent, black 18px, black calc(100% - 18px), transparent)',
          maskImage:
            'linear-gradient(to bottom, transparent, black 18px, black calc(100% - 18px), transparent)',
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-5 bg-gradient-to-b from-white/75 to-transparent dark:from-slate-900/60"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t from-white/80 to-transparent dark:from-slate-900/60"
        />
        {children}
      </div>
    );
  }
);


function ClampedBody({
  text,
  lines = 4,
  onMore,
}: { text: string; lines?: number; onMore: () => void }) {
  return (
    <div className="relative">
      <div className="text-sm whitespace-pre-wrap line-clamp-4">{text}</div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white/90 to-transparent dark:from-slate-900/80" />
      <button className="btnv2--ghost py-0 px-6 rounded btnv2--sm absolute right-0 bottom-0 translate-y-1 translate-x-2"
              onClick={onMore}>
        More
      </button>
    </div>
  );
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value?: T | null;
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
            key={String(o.value)}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={[
              'px-2.5 py-1 text-xs rounded',
              active ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-white',
            ].join(' ')}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-600" /> IN</span>
      <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-600" /> UNDEC</span>
      <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-600" /> OUT</span>
    </div>
  );
}

function StatusPill({ st, title }: { st: 'IN' | 'OUT' | 'UNDEC'; title?: string }) {
  const cls = st === 'IN' ? 'bg-emerald-600' : st === 'OUT' ? 'bg-rose-600' : 'bg-amber-600';
  return (
    <span
      title={title}
      className={'inline-flex min-w-[44px] justify-center rounded text-[10px] text-white px-1.5 py-0.5 ' + cls}
    >
      {st}
    </span>
  );
}


function MapTab({ deliberationId }: { deliberationId: string }) {
  return (
    <div className="rounded border bg-white p-2">
      <div className="mb-2 text-sm font-semibold">Argument Map</div>
      <MapCanvas deliberationId={deliberationId} height={420} />
    </div>
  );
}

/* ----------------------------- Main panel ------------------------------- */
export default function DialogicalPanel({ deliberationId, nodes, edges }: Props) {
  const [semantics, setSemantics] = React.useState<'grounded' | 'preferred' | 'stable'>('grounded');
  const [supportProp, setSupportProp] = React.useState(true);

  const [selected, setSelected] = React.useState<string | null>(null);
  const selectedNode = nodes.find((n) => n.id === selected) || null;

  const [q, setQ] = React.useState('');
  const [onlyWhy, setOnlyWhy] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'IN' | 'UNDEC' | 'OUT'>('all');

  const [modalOpen, setModalOpen] = React.useState(false);


  // Local CQs → implicit undercuts
  const [openCQs, setOpenCQs] = React.useState<Record<string, string[]>>({});

  const fetcher = (u:string)=>fetch(u).then(r=>r.json());
const { data: des } = useSWR(
  deliberationId ? `/api/ludics/designs?deliberationId=${encodeURIComponent(deliberationId)}` : null,
  fetcher, { revalidateOnFocus:false }
);
const posId = des?.designs?.find((d:any)=>d.participantId==='Proponent')?.id ?? des?.designs?.[0]?.id;
const negId = des?.designs?.find((d:any)=>d.participantId==='Opponent')?.id  ?? des?.designs?.[1]?.id ?? des?.designs?.[0]?.id;

const { data: ortho } = useSWR(
  posId && negId
    ? `/api/ludics/orthogonal?dialogueId=${encodeURIComponent(deliberationId)}&posDesignId=${encodeURIComponent(posId)}&negDesignId=${encodeURIComponent(negId)}`
    : null,
  fetcher, { revalidateOnFocus:false }
);

  // Dialogue moves (WHY/GROUNDS), unresolved WHYs per target
  // Server-side moves + unresolved WHYs map
const { moves, unresolvedByTarget, mutate: refetchMoves } = useDialogueMoves(deliberationId);

// Server-authoritative open CQs for the currently selected node
// (Hook is called every render; it internally pauses when ids are missing)
const openCqIds = useOpenCqs(deliberationId, selectedNode?.id ?? '');


  // inside DialogicalPanel component (top-level)
function openCqIdsFor(targetId: string): Set<string> {
  const entry: any = unresolvedByTarget.get(targetId);
  const arr = Array.isArray(entry) ? entry : entry ? [entry] : [];
  const set = new Set<string>();
  for (const mv of arr) {
    const cid = mv?.payload?.cqId;
    if (cid) set.add(cid);
  }
  return set;
}




  React.useEffect(() => {
    const h = () => refetchMoves();
    window.addEventListener('dialogue:moves:refresh', h as any);
    return () => window.removeEventListener('dialogue:moves:refresh', h as any);
  }, [refetchMoves]);

  // Auto-select first node for quicker flow
  React.useEffect(() => {
    if (!selected && nodes.length) setSelected(nodes[0].id);
  }, [selected, nodes]);

  // Virtual attackers from unresolved WHY + locally toggled CQs
  const cqVirtual = React.useMemo(() => {
    const n: AFNode[] = [];
    const e: AFEdge[] = [];

    for (const [targetId, entry] of unresolvedByTarget.entries()) {
      const latest = Array.isArray(entry) ? entry[entry.length - 1] : entry;
      if (!latest) continue;
      const u = cqUndercuts(targetId, [{ id: `WHY-${latest.id}`, text: latest.payload?.note || 'Open WHY challenge' }]);
      n.push(...u.nodes);
      e.push(...u.edges);
    }

    for (const argId of Object.keys(openCQs)) {
      const u = cqUndercuts(
        argId,
        (openCQs[argId] || []).map((id) => ({ id, text: id }))
      );
      n.push(...u.nodes);
      e.push(...u.edges);
    }
    return { nodes: n, edges: e };
  }, [unresolvedByTarget, openCQs]);

  // Build AF with optional Support→Defense propagation
  const AF = React.useMemo(() => {
    const mergedNodes = [...nodes, ...cqVirtual.nodes];
    const mergedEdges = [...edges, ...cqVirtual.edges];
    return projectToAF(mergedNodes, mergedEdges, { supportDefensePropagation: supportProp, supportClosure: false });
  }, [nodes, edges, supportProp, cqVirtual]);

  // Labeling under chosen semantics
  const labeling = React.useMemo(() => {
    if (semantics === 'grounded') {
      const E = grounded(AF.A, AF.R);
      return labelingFromExtension(AF.A, AF.R, E);
    }
    if (semantics === 'preferred') {
      const prefs = preferred(AF.A, AF.R);
      const INunion = new Set<string>();
      for (const E of prefs) for (const a of E) INunion.add(a);
      return labelingFromExtension(AF.A, AF.R, INunion);
    }
    // stable (fallback to grounded if none)
    const ext = computeStableExtension(AF.A, AF.R) || grounded(AF.A, AF.R);
    return labelingFromExtension(AF.A, AF.R, ext);
  }, [AF, semantics]);

  const status = (id: string): 'IN' | 'OUT' | 'UNDEC' => {
    if (labeling.IN.has(id)) return 'IN';
    if (labeling.OUT.has(id)) return 'OUT';
    return 'UNDEC';
  };

  const attackersOf = React.useCallback(
    (a: string) => AF.R.filter(([x, y]) => y === a).map(([x]) => x),
    [AF]
  );

  const explain = (id: string) => {
    const st = status(id);
    if (st === 'IN')   return 'Accepted (all attackers are counterattacked)';
    if (st === 'OUT')  {
      const atks = attackersOf(id);
      return atks.length ? `Out: attacked by ${atks.length} accepted attackers` : 'Out: attacked';
    }
    return 'Undecided';
  };

  // Filter + sort list
  const list = React.useMemo(() => {
    const term = q.trim().toLowerCase();
    let arr = nodes.slice();

    if (term) arr = arr.filter((n) => (n.text || n.label || '').toLowerCase().includes(term));
    if (onlyWhy) arr = arr.filter((n) => unresolvedByTarget.has(n.id));
    if (statusFilter !== 'all') arr = arr.filter((n) => status(n.id) === statusFilter);

    const order: Record<'IN' | 'UNDEC' | 'OUT', number> = { IN: 0, UNDEC: 1, OUT: 2 };
    arr.sort((a, b) => {
      const entA: any = unresolvedByTarget.get(a.id);
      const entB: any = unresolvedByTarget.get(b.id);
      const la = Array.isArray(entA) ? entA.at(-1) : entA;
      const lb = Array.isArray(entB) ? entB.at(-1) : entB;
      const dueA = hoursLeft(la?.payload?.deadlineAt) ?? Infinity;
      const dueB = hoursLeft(lb?.payload?.deadlineAt) ?? Infinity;
      if (dueA !== dueB) return dueA - dueB;
      const sA = order[status(a.id)];
      const sB = order[status(b.id)];
      if (sA !== sB) return sA - sB;
      return (a.text || a.label || '').localeCompare(b.text || b.label || '');
    });

    return arr;
  }, [nodes, q, onlyWhy, statusFilter, unresolvedByTarget, labeling]);

  // Quick row actions (WHY/GROUNDS)
  const [postingId, setPostingId] = React.useState<string | null>(null);
const postMove = async (targetId: string, kind: 'WHY' | 'GROUNDS', payload: any) => {
  if (postingId === targetId) return;           // per-row idempotency
  setPostingId(targetId);
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const res = await fetch('/api/dialogue/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deliberationId,
        targetType: 'argument',
        targetId,
        kind,
        payload,
        autoCompile: true,
        autoStep: true,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    // (optional) if (!res.ok) console.warn(await res.text());
    window.dispatchEvent(new CustomEvent('dialogue:moves:refresh'));
  } catch {
    // swallow; UI will unstick on finally
  } finally {
    setPostingId(null);
  }
};

  return (
    <div className="relative rounded-2xl border border-slate-200 bg-slate-50/70 p-3 shadow-sm backdrop-blur space-y-3">
      <div className="pointer-events-none absolute inset-x-2 top-1 h-px bg-gradient-to-b from-white/70 to-transparent" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ChipBar>
            <span className="text-[11px] text-neutral-600">|A| {AF.A.length}</span>
            <span className="text-[11px] text-neutral-600">|R| {AF.R.length}</span>
            {ortho?.trace?.status && (
    <span className="text-[11px] text-neutral-600">
      trace {String(ortho.trace.status).toLowerCase()}
      {Array.isArray(ortho?.trace?.pairs) ? ` · ${ortho.trace.pairs.length} pairs` : ''}
    </span>
  )}
          </ChipBar>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            ariaLabel="Semantics"
            value={semantics}
            onChange={(v) => setSemantics(v)}
            options={[
              { value: 'grounded', label: 'Grounded' },
              { value: 'preferred', label: 'Preferred' },
              { value: 'stable', label: 'Stable' },
            ]}
          />
          <label
            className="flex items-center gap-1 text-xs rounded-md border py-1.5 px-2 bg-white/70"
            title="Treat supporters of a node as defenders against its attackers"
          >
            <input
              type="checkbox"
              checked={supportProp}
              onChange={(e) => setSupportProp(e.target.checked)}
              
            />
            Support→Defense
          </label>
          <button className="bg-white/70 rounded-md btnv2--ghost btnv2--sm" onClick={() => refetchMoves()}>
            Refresh
          </button>
        </div>
      </div>

      {/* Legend + filters */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Legend />
          <label className="text-xs flex items-center gap-1">
            Status:
            <select
              className="border rounded px-1 py-0.5 text-xs"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="all">All</option>
              <option value="IN">IN</option>
              <option value="UNDEC">UNDEC</option>
              <option value="OUT">OUT</option>
            </select>
          </label>
          <label className="text-xs flex items-center gap-1">
            <input type="checkbox" checked={onlyWhy} onChange={(e) => setOnlyWhy(e.target.checked)} />
            With open WHY
          </label>
        </div>
        <input
          className="w-56 rounded border border-slate-200 px-2 py-1 text-xs"
          placeholder="Search arguments…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {/* Two-pane layout */}
      <div className="grid gap-3 grid-cols-1 md:grid-cols-[320px_1fr]">
        {/* List */}
        <div className="rounded-lg border border-slate-200 bg-white/60">
          <FancyScroller className="max-h-[300px]">
            {list.map((n) => {
              const st = status(n.id);
              const isSel = selected === n.id;
              const entry: any = unresolvedByTarget.get(n.id);
              const latest = Array.isArray(entry) ? entry?.[entry.length - 1] : entry;
              const due = hoursLeft(latest?.payload?.deadlineAt);
              const openWhy = unresolvedByTarget.has(n.id);
              const acceptedAttackers = attackersOf(n.id).filter(id => labeling.IN.has(id)).slice(0,2);

              return (
                <div
                  key={n.id}
                  className={
                    'group relative border-b last:border-0 p-2 cursor-pointer transition-colors ' +
                    (isSel ? 'bg-slate-50' : 'hover:bg-white/70')
                  }
                  onClick={() => setSelected(n.id)}
                >
                  <div className="pointer-events-none absolute inset-x-2 top-0 h-px bg-gradient-to-b from-white/70 to-transparent" />
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <StatusPill st={st} title={explain(n.id)} />
                        {status(n.id)==='OUT' && acceptedAttackers.length>0 && (
  <div className="inline-block ml-2 relative group">
    <button className="text-[10px] underline decoration-dotted">why?</button>
    <div className="absolute z-20 hidden group-hover:block mt-1 rounded border bg-white p-2 shadow text-[11px] w-[220px]">
      <div className="font-medium mb-1">Out because:</div>
      <ul className="list-disc ml-4">
        {acceptedAttackers.map(a => (
          <li key={a}>
            <span className="font-mono">{a.slice(0,8)}</span> attacks this node
          </li>
        ))}
      </ul>
    </div>
  </div>
)}
                        <div className="truncate text-sm text-slate-800">
                          {(n.text || n.label || '').slice(0, 180)}
                        </div>
                      </div>
                      <div className="mt-1 hidden md:flex items-center gap-2 text-[11px]">
                        <span className="text-neutral-500">ID: {n.id.slice(0, 8)}</span>
                        {openWhy && (
                          <span className="rounded border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-rose-700">
                            WHY{typeof due === 'number' ? ` · ⏱ ${due}h` : ''}
                          </span>
                        )}
                        <WinningnessBadge moves={moves} targetId={n.id} />
                      </div>
                    </div>

                    {/* Quick actions */}
                    <div className="invisible group-hover:visible flex items-center gap-1">
                      <button
                        className="btnv2--ghost btnv2--sm"
                        disabled={postingId === n.id}
                        onClick={() => postMove(n.id, 'WHY', { note: 'Please address this point' })}
                      >
                        WHY
                      </button>
                      <button
                        className="btnv2--ghost btnv2--sm"
                        disabled={postingId === n.id}
                        onClick={() => postMove(n.id, 'GROUNDS', { note: 'Providing grounds' })}
                      >
                        Grounds
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {!list.length && (
              <div className="p-3 text-xs text-neutral-500">No items match the current filters.</div>
            )}
          </FancyScroller>
        </div>

        {/* Inspector */}
        <div className="rounded-lg border border-slate-200 bg-white/60 p-2">
          {!selectedNode ? (
            <div className="p-3 text-xs text-neutral-500">
              Select an argument to inspect its critical questions and status.
            </div>
          ) : (
            <>
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusPill st={status(selectedNode.id)} title={explain(selectedNode.id)} />
                  <div className="text-sm font-medium text-slate-800 truncate max-w-[48ch]">
                    {(selectedNode.text || selectedNode.label || '').slice(0, 160)}
                  </div>
                </div>
                <WinningnessBadge moves={moves} targetId={selectedNode.id} />
              </div>

              <ArgumentInspector
                deliberationId={deliberationId}
                node={selectedNode}
                openCqIds={openCqIds}

                onCqToggle={(cqId, on) =>
                  setOpenCQs((prev) => {
                    const arr = new Set(prev[selectedNode.id] || []);
                    on ? arr.add(cqId) : arr.delete(cqId);
                    return { ...prev, [selectedNode.id]: Array.from(arr) };
                  })
                }

              />

              {/* Attacker peek */}
              {(() => {
                const atks = attackersOf(selectedNode.id);
                if (!atks.length) return null;
                return (
                  <div className="mt-2 text-[11px] text-neutral-700">
                    Attackers:{' '}
                    {atks.slice(0, 4).map((id) => (
                      <span
                        key={id}
                        className="mr-2 rounded-full border border-slate-200 bg-white/70 px-2 py-0.5"
                      >
                        {id.slice(0, 8)}
                      </span>
                    ))}
                    {atks.length > 4 && <span>… +{atks.length - 4}</span>}
                  </div>
                );
              })()}

            </>

          )}
        </div>
        <div className="rounded border bg-white p-2">
  <Dialog open={modalOpen} onOpenChange={setModalOpen}>
    <DialogTrigger asChild>
      <button
        type="button"
        className="mb-2 text-sm font-semibold"
        aria-label="Open argument map"
      >
        Argument Map
      </button>
    </DialogTrigger>

    <DialogContent className="max-w-2xl bg-slate-50 rounded-xl p-0 overflow-hidden">
      <DialogHeader className="px-4 pt-4 pb-2 border-b">
        <DialogTitle>Argument Map</DialogTitle>
        {/* Optional: <DialogDescription>Explore relationships between claims and arguments.</DialogDescription> */}
      </DialogHeader>

      {/* Body */}
      <div className="p-4 max-h-[500px] overflow-y-auto">
        <MapCanvas deliberationId={deliberationId} height={420} />
      </div>

      <div className="px-4 pb-4 pt-2 border-t flex justify-end">
        <DialogClose asChild>
          <button id="closemap" type="button" className="btnv2">
            Close
          </button>
        </DialogClose>
      </div>
    </DialogContent>
  </Dialog>
</div>
      </div>
    </div>
  );
}
/* --------------------------- ArgumentInspector -------------------------- */

const fetcher = (u:string)=>fetch(u,{cache:'no-store'}).then(r=>r.json());

function ArgumentInspector({
  deliberationId,
  node,
  onCqToggle,
  openCqIds,                       // 👈 NEW: real open WHYs for this node (by cqId)
}: {
  deliberationId: string;
  node: AFNode;
  onCqToggle: (cqId: string, on: boolean) => void;
  openCqIds?: Set<string>;
}) {
  const schemes = inferSchemesFromText(node.text || node.label || '');
  const [scheme, setScheme] = React.useState(schemes[0] || 'Consequences');
  const cqs = questionsForScheme(scheme);

  // Per-row posting + UI-open state
  const [postingMap, setPostingMap] = React.useState<Record<string, boolean>>({});
  const [okSig, setOkSig] = React.useState<string | null>(null);
  const [uiOpen, setUiOpen] = React.useState<Set<string>>(new Set());


const isRowPosting = React.useCallback(
  (sig: string) => !!postingMap[sig],
  [postingMap]
);
const setRowPosting = React.useCallback((sig: string, v: boolean) => {
  setPostingMap((prev) => (v ? { ...prev, [sig]: true } : (() => {
    const n = { ...prev }; delete n[sig]; return n;
  })()));
}, []);

// AFTER
const openKey = React.useMemo(
  () => [...(openCqIds ?? new Set<string>())].sort().join('|'),
  [openCqIds]
);
React.useEffect(() => {
  setUiOpen(new Set(openCqIds ?? []));
}, [openKey, scheme]);

const { data: openFromServer } = useSWR(
  node?.id ? `/api/dialogue/open-cqs?deliberationId=${encodeURIComponent(deliberationId)}&targetId=${encodeURIComponent(node.id)}` : null,
  (u)=>fetch(u).then(r=>r.json()),
  { revalidateOnFocus:false }
);

React.useEffect(()=>{
  if (openFromServer?.ok && Array.isArray(openFromServer.cqOpen)) {
    setUiOpen(new Set(openFromServer.cqOpen));
  }
}, [openFromServer?.ok, openFromServer?.cqOpen?.length, scheme]);

  // const isRowPosting = (sig: string) => postingKey === sig;

  async function postMove(kind: 'WHY'|'GROUNDS', payload: any, sig: string) {
    if (isRowPosting(sig)) return true; // ignore duplicates while in flight
    setRowPosting(sig, true);
  
    let ok = false;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000); // 12s failsafe
      const res = await fetch('/api/dialogue/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliberationId,
          targetType: 'argument',
          targetId: node.id,
          kind,
          payload,                 // includes { schemeKey, cqId }
          autoCompile: true,
          autoStep: true,
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      ok = res.ok;
      // trigger refetch/AF recompute
      window.dispatchEvent(new CustomEvent('dialogue:moves:refresh'));
      if (ok) {
        setOkSig(sig);
        setTimeout(() => setOkSig((s) => (s === sig ? null : s)), 900);
      } else {
        // optional: console.warn(await res.text());
      }
    } catch (e) {
      // optional: console.error(e);
    } finally {
      setRowPosting(sig, false);
    }
    return ok;
  }
  
  // also clear any lingering "posting" on global refresh (extra safety)
  React.useEffect(() => {
    const h = () => setPostingMap({});
    window.addEventListener('dialogue:moves:refresh', h as any);
    return () => window.removeEventListener('dialogue:moves:refresh', h as any);
  }, []);

  // Idempotent toggle with scheme + cq in payload
  const onToggleCQ = async (schemeKey: string, cqId: string, on: boolean) => {
    const sig = `${schemeKey}:${cqId}`;
    const serverOpen = openCqIds?.has(cqId) ?? false;
    const locallyOpen = uiOpen.has(cqId);
  
    if (on) {
      // open in UI + AF injection
      setUiOpen((s) => new Set(s).add(cqId));
      onCqToggle(cqId, true);
  
      // idempotent WHY
      if (serverOpen || locallyOpen) return;
  
      await postMove('WHY', { schemeKey, cqId }, sig);
    } else {
      // close in UI + AF
      setUiOpen((s) => {
        const n = new Set(s);
        n.delete(cqId);
        return n;
      });
      onCqToggle(cqId, false);
  
      // only send GROUNDS if server had it open
      if (serverOpen) {
        await postMove('GROUNDS', { schemeKey, cqId }, sig);
      }
    }
  };
  // Claim lookup → enable full, guarded CQ flow
  const {
    data: argRes,
    mutate: refetchArg,
  } = useSWR(
    node?.id ? `/api/arguments/${encodeURIComponent(node.id)}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  
  const [claimIdOverride, setClaimIdOverride] = React.useState<string | null>(null);
  const claimId: string | undefined =
    claimIdOverride ?? argRes?.argument?.claimId ?? undefined;

  // Open claim-level panel (prefilter to all currently open CQs for this scheme)
  const [fullOpen, setFullOpen] = React.useState(false);
  const prefilterKeys = React.useMemo(() => {
    const open = new Set<string>([...(openCqIds ?? new Set()), ...uiOpen]);
    return cqs.filter(q => open.has(q.id)).map(q => ({ schemeKey: scheme, cqKey: q.id }));
  }, [openCqIds, uiOpen, cqs, scheme]);

  async function promoteThenOpen() {
    const res = await fetch('/api/claims/quick-create', {
      method: 'POST',
      headers: { 'content-type':'application/json' },
      body: JSON.stringify({
        targetArgumentId: node.id,
        text: node.text ?? node.label ?? '',
        deliberationId
      }),
    });
    if (!res.ok) {
      alert(await res.text());
      return;
    }
    const { claimId: newId } = await res.json() as { claimId: string };
    setClaimIdOverride(newId);     // <- use local override immediately
    setFullOpen(true);
    // optional: also refresh the argument so it now has claimId for future renders
    refetchArg().catch(() => {});
  }

  return (
    <div className="rounded border border-slate-200 bg-white/70 p-2 space-y-2">
      {/* Tier explainer + full CQ action */}
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] text-neutral-600">
          These CQs <b>simulate</b> attacks in the graph (WHY = attack, GROUNDS = release).
          For official, guarded resolution, open the <b>claim-level</b> panel.
        </div>
        {claimId ? (
          <button className="btnv2--ghost btnv2--sm" onClick={() => setFullOpen(true)}>
            Open full CQs
          </button>
        ) : (
          <button className="btnv2--ghost btnv2--sm" onClick={promoteThenOpen}>
            Promote → Open full CQs
          </button>
        )}
      </div>

      {/* Scheme picker */}
      <div className="flex items-center gap-2">
        <div className="font-medium text-sm">Critical questions</div>
        <select
          className="border rounded px-1 py-0.5 text-xs"
          value={scheme}
          onChange={(e) => setScheme(e.target.value as any)}
        >
          {schemes.concat(scheme).filter((v, i, a) => a.indexOf(v) === i).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
  
      </div>

      {/* Checklist (controlled; pre-checked from open WHYs) */}
      <div className="space-y-1">
      {cqs.map((q) => {
  const checked = (openCqIds?.has(q.id) ?? false) || uiOpen.has(q.id);
  const sig = `${scheme}:${q.id}`;
  return (
    <label key={q.id} className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onToggleCQ(scheme, q.id, e.target.checked)}
        disabled={isRowPosting(sig)}
      />
      <span>{q.text}</span>
      {okSig === sig && <span className="text-[10px] text-emerald-700">✓</span>}
      {q.severity && (
        <span className={
          'ml-1 text-[10px] px-1 rounded ' +
          (q.severity === 'high'
            ? 'bg-rose-100 text-rose-700'
            : q.severity === 'med'
            ? 'bg-amber-100 text-amber-700'
            : 'bg-slate-100 text-slate-700')
        }>
          {q.severity}
        </span>
      )}
    </label>
  );
})}
      </div>

      {/* Quick WHY / GROUNDS on selected scheme (optional helpers) */}
      <div className="flex gap-2">
        <button
          className="btnv2--ghost btnv2--sm"
          onClick={() => postMove('WHY', { note: 'Please address open critical questions', schemeKey: scheme }, `${scheme}:__bulk`)}
          disabled={isRowPosting(`${scheme}:__bulk`)}
        >
          {isRowPosting(`${scheme}:__bulk`) ? 'Posting…' : 'Challenge (WHY)'}
        </button>
        <button
          className="btnv2--ghost btnv2--sm"
          onClick={() => postMove('GROUNDS', { note: 'Grounds submitted', schemeKey: scheme }, `${scheme}:__bulkG`)}
          disabled={isRowPosting(`${scheme}:__bulkG`)}
        >
          {isRowPosting(`${scheme}:__bulkG`) ? 'Posting…' : 'Provide grounds'}
        </button>
      </div>

      {/* Claim-level CQ modal */}
      {claimId && (
        <Dialog open={fullOpen} onOpenChange={setFullOpen}>
          <DialogContent className="bg-white rounded-xl sm:max-w-[880px]">
            <DialogHeader>
              <DialogTitle>Claim-level Critical Questions</DialogTitle>
            </DialogHeader>
            <div className="mt-2">
              <CriticalQuestions
                targetType="claim"
                targetId={claimId}
                createdById={deliberationId}    // ok as a placeholder id in your app
                deliberationId={deliberationId}
                prefilterKeys={prefilterKeys}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
