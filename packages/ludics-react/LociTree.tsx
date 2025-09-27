'use client';
import * as React from 'react';

export type LociNode = {
  id: string;
  path: string; // e.g., "0.1.2"
  acts: {
    id: string;
    polarity: 'P' | 'O' | null; // null used for †
    expression?: string;
    isAdditive?: boolean;
  }[];
  children: LociNode[];
};

type Props = {
  root: LociNode;
  onPickBranch?: (parentPath: string, childSuffix: string) => void;
  /** parentPath -> chosen child suffix (e.g., { "0.3": "2" }) */
  usedAdditive?: Record<string, string>;
  /** highlight this locus (e.g., current focus) and auto-scroll it into view */
  focusPath?: string | null;
  /** open nodes up to this depth initially (0=root only, 1=root+children, …) */
  defaultCollapsedDepth?: number;
  /** show a faint 1-line expression preview under the header */
  showExpressions?: boolean;

  /** --- extra polish --- */
  /** locusPath -> heat value (frequency/score/decisive hits). Renders a left stripe */
  heatmap?: Record<string, number>;
  /** actId -> step index (to show tiny superscripts on chips) */
  stepIndexByActId?: Record<string, number>;
  /** notify parent when user focuses a locus via toolbar/keys */
  onFocusPathChange?: (path: string) => void;
  onCommitHere?: (path: string) => void;      // NEW
  suggestCloseDaimonAt?: (path: string) => boolean;

  /** automatically scroll on focusPath */
  autoScrollOnFocus?: boolean;
  /** keyboard j/k navigation through visible loci */
  enableKeyboardNav?: boolean;
  /** ring highlight duration when focus changes (ms) */
  highlightDurationMs?: number;
};

export function LociTree({
  root,
  onPickBranch,
  usedAdditive,
  focusPath,
  defaultCollapsedDepth = 1,
  showExpressions = false,
  heatmap,
  stepIndexByActId,
  onFocusPathChange,
  onCommitHere,
  suggestCloseDaimonAt,
  autoScrollOnFocus = true,
  enableKeyboardNav = false,
  highlightDurationMs = 900,
}: Props) {

  // -------------------------- helpers --------------------------
  const isAdditiveParent = (n: LociNode) =>
    Array.isArray(n.acts) && n.acts.some((a) => !!a?.isAdditive);

  const childSuffixes = (n: LociNode) =>
    (Array.isArray(n.children) ? n.children : []).map((c) => c.path.split('.').slice(-1)[0]);

  const chooserLabel = (n: LociNode) => {
    if (!isAdditiveParent(n)) return null;
    if (n.acts?.some((a) => a.isAdditive && a.polarity === 'P')) return 'Proponent chooses';
    if (n.acts?.some((a) => a.isAdditive && a.polarity === 'O')) return 'Opponent chooses';
    return 'Choice';
  };

    // Always have a safe root to avoid early-return-before-hooks
    const SAFE_EMPTY: LociNode = React.useMemo(
      () => ({ id: '0', path: '0', acts: [], children: [] }),
      []
    );
  const treeRoot = root ?? SAFE_EMPTY;

  // --------------------- collapsed/open state -------------------
  const seedOpen = React.useCallback((node: LociNode, maxDepth: number) => {
    const open = new Set<string>();
    const walk = (n: LociNode, depth: number) => {
      if (depth <= maxDepth) open.add(n.path);
      for (const c of n.children ?? []) walk(c, depth + 1);
    };
    walk(node, 0);
    return open;
  }, []);

  const [open, setOpen] = React.useState<Set<string>>(() => seedOpen(treeRoot, defaultCollapsedDepth));

  React.useEffect(() => {
    setOpen(seedOpen(treeRoot, defaultCollapsedDepth));
  }, [treeRoot, defaultCollapsedDepth, seedOpen]);

  const isOpen = (p: string) => open.has(p);
  const toggle = (p: string, force?: boolean) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (force === true) next.add(p);
      else if (force === false) next.delete(p);
      else if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });

  // --------------------- heatmap normalization ------------------
  const [hMin, hMax] = React.useMemo(() => {
    if (!heatmap) return [0, 0];
    const vals = Object.values(heatmap);
    if (vals.length === 0) return [0, 0];
    return [Math.min(...vals), Math.max(...vals)];
  }, [heatmap]);

  const heatIntensity = (path: string) => {
    if (!heatmap || heatmap[path] == null) return 0;
    const v = heatmap[path];
    if (hMax === hMin) return v ? 1 : 0;
    return Math.max(0, Math.min(1, (v - hMin) / (hMax - hMin)));
  };

  // ---------------- focus & autoscroll + flash ring --------------
  const nodeRefs = React.useRef<Record<string, HTMLLIElement | null>>({});
      const setNodeRef = React.useCallback(
      (path: string) => (el: HTMLLIElement | null) => {
        nodeRefs.current[path] = el; // <-- returns void
      },
      []
    );
  const [flashPath, setFlashPath] = React.useState<string | null>(null);
  const effectiveFocusPath = focusPath ?? null;

  React.useEffect(() => {
    if (!effectiveFocusPath || !autoScrollOnFocus) return;
    const el = nodeRefs.current[effectiveFocusPath];
    if (!el) return;
    try {
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      setFlashPath(effectiveFocusPath);
      const id = setTimeout(
        () => setFlashPath((p) => (p === effectiveFocusPath ? null : p)),
        highlightDurationMs
      );
      return () => clearTimeout(id);
    } catch {}
  }, [effectiveFocusPath, autoScrollOnFocus, highlightDurationMs]);

  // ---------------- visible paths (for j/k nav) ------------------
  const visiblePaths = React.useMemo(() => {
    const out: string[] = [];
    const walk = (n: LociNode) => {
      out.push(n.path);
      if (isOpen(n.path)) for (const c of n.children ?? []) walk(c);
    };
    walk(treeRoot);
    return out;
   }, [treeRoot, open]);

  React.useEffect(() => {
    if (!enableKeyboardNav) return;
    const handler = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).closest('input, textarea, select, [contenteditable="true"]')) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const idx = effectiveFocusPath ? visiblePaths.indexOf(effectiveFocusPath) : -1;
      if (e.key === 'j') {
        const next = visiblePaths[Math.min(visiblePaths.length - 1, Math.max(0, idx + 1))];
        if (next) onFocusPathChange?.(next);
      } else if (e.key === 'k') {
        const prev = visiblePaths[Math.max(0, idx > 0 ? idx - 1 : 0)];
        if (prev) onFocusPathChange?.(prev);
      } else if ((e.key === ' ' || e.key === 'Enter') && effectiveFocusPath) {
        toggle(effectiveFocusPath);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enableKeyboardNav, visiblePaths, effectiveFocusPath, onFocusPathChange]);

  // ------------------------- chips -------------------------------
  function ActChip({ a }: { a: LociNode['acts'][number] }) {
    const base =
      a.polarity === 'P'
        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
        : a.polarity === 'O'
        ? 'bg-rose-50 border-rose-200 text-rose-700'
        : 'bg-slate-50 border-slate-200 text-slate-700'; // †

    const ring = a.isAdditive ? 'ring-1 ring-amber-300' : '';
    const label = a.polarity ?? '†';
    const stepIdx = stepIndexByActId?.[a.id];

    return (
      <span
        title={a.expression}
        className={[
          'text-[11px] px-1.5 py-0.5 rounded border',
          base,
          ring,
          'max-w-[20rem] truncate',
        ].join(' ')}
      >
        {label} {a.isAdditive ? '⊕' : ''}
        {typeof stepIdx === 'number' ? (
          <sup className="ml-1 text-[10px] text-indigo-600">{stepIdx}</sup>
        ) : null}
      </span>
    );
  }

  // ----------------------- node renderer -------------------------
  const render = (n: LociNode) => {
    const kids = Array.isArray(n.children) ? n.children : [];
    const additive = isAdditiveParent(n);
    const suffixes = childSuffixes(n);
    const chosen = usedAdditive?.[n.path];
    const chooser = chooserLabel(n);
    const heat = heatIntensity(n.path);
    const isFocused = effectiveFocusPath && effectiveFocusPath === n.path;
    const isFlashing = flashPath && flashPath === n.path;

    // Optional 1-line content preview (first act with text)
    const preview =
      showExpressions &&
      (n.acts ?? []).find((a) => (a.expression ?? '').trim().length > 0)?.expression;

    const actsP = (n.acts ?? []).filter((a) => a.polarity === 'P');
    const actsO = (n.acts ?? []).filter((a) => a.polarity === 'O');

    return (
      <li
        key={n.id}
        ref={setNodeRef(n.path)}
    role="treeitem"
    aria-level={n.path.split('.').length}
    aria-expanded={kids.length > 0 ? isOpen(n.path) : undefined}
     className="mb-1 group"
      >
        <div
          className={[
            'relative grid items-start gap-2 px-1.5 py-1 rounded-xl border transition bg-slate-100',
            // braided 3-column header: [P rail] [center locus+chooser] [O rail]
            'md:grid-cols-[minmax(6rem,1fr)_auto_minmax(6rem,1fr)]',
            isFocused ? 'ring-1 ring-sky-300 bg-sky-50/50' : '',
            isFlashing ? 'animate-pulse' : '',
          ].join(' ')}
        >
          {/* heat stripe */}
          {heat > 0 ? (
            <div
              aria-hidden
              className="absolute inset-y-0 left-0 w-1.5 rounded-l bg-indigo-500"
              style={{ opacity: 0.18 + 0.6 * heat }}
            />
          ) : null}

          {/* Left: P rail */}
          <div className="relative z-[1] flex flex-wrap gap-1 justify-start">
            {actsP.map((a) => (
              <ActChip key={a.id} a={a} />
            ))}
          </div>

          {/* Center: locus chip + chooser + toggler */}
          <div className="relative z-[1] flex flex-wrap items-center gap-2">
            {/* toggle only if children exist */}
            {kids.length > 0 ? (
              <button
                onClick={() => toggle(n.path)}
                aria-label={isOpen(n.path) ? 'Collapse node' : 'Expand node'}
                aria-expanded={isOpen(n.path)}
                className={[
                  'inline-flex h-5 w-5 items-center justify-center rounded border border-slate-200 bg-white text-[10px]',
                  'hover:bg-slate-50',
                ].join(' ')}
                title={isOpen(n.path) ? 'Collapse' : 'Expand'}
              >
                {isOpen(n.path) ? '▾' : '▸'}
              </button>
            ) : (
              <span className="inline-block h-5 w-5" />
            )}

            <code className="text-xs px-1.5 py-0.5 rounded border bg-slate-50">{n.path}</code>
            {suggestCloseDaimonAt?.(n.path) ? (
  <span className="text-[10px] px-1.5 py-0.5 rounded border bg-slate-50">
    † available
  </span>
) : null}

            {additive && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded border border-dashed bg-white text-slate-700"
                title="Additive locus (one branch must be chosen)"
              >
                ⊕ {chooser}
              </span>
            )}
            

<div className="ml-auto flex items-center gap-1 ">
            {onCommitHere && (
              <button
                className="text-[11px] px-1.5 py-1 rounded-full btnv2 btnv2--ghost bg-white/50"
                title="Add commitment at this locus"
                onClick={() => onCommitHere(n.path)}
              >
                Commit
              </button>
           )}
           </div>
            {/* hover toolbar (floats right within center col on wide screens) */}
            {/* <div className="ml-auto flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                className="text-[11px] px-1.5 py-0.5 rounded border bg-white hover:bg-slate-50"
                title="Copy path"
                onClick={() => navigator.clipboard?.writeText(n.path).catch(() => {})}
              >
                Copy
              </button>
              <button
                className="text-[11px] px-1.5 py-0.5 rounded border bg-white hover:bg-slate-50"
                title="Focus this locus"
                onClick={() => onFocusPathChange?.(n.path)}
              >
                Focus
              </button>
              {kids.length > 0 ? (
                <button
                  className="text-[11px] px-1.5 py-0.5 rounded border bg-white hover:bg-slate-50"
                  title={isOpen(n.path) ? 'Collapse' : 'Expand'}
                  onClick={() => toggle(n.path)}
                >
                  {isOpen(n.path) ? 'Collapse' : 'Expand'}
                </button>
              ) : null}
            </div> */}
          </div>

          {/* Right: O rail */}
          <div className="relative z-[1] flex flex-wrap gap-1 justify-end">
            {actsO.map((a) => (
              <ActChip key={a.id} a={a} />
            ))}
          </div>
        </div>

        {/* preview line */}
        {preview ? (
          <div className="ml-6 mt-0.5 text-[11px] text-slate-600 line-clamp-1">“{preview}”</div>
        ) : null}

        {/* branch picker */}
        {additive && suffixes.length > 0 && (
          <div className="ml-6 mt-1 flex flex-wrap items-center gap-2">
            <span className="text-[11px] opacity-70">choose:</span>
            {suffixes.map((s) => {
              const checked = chosen === s;
              const disabled = Boolean(chosen && chosen !== s);
              return (
                <label
                  key={s}
                  className={[
                    'inline-flex items-center gap-1 cursor-pointer',
                    disabled ? 'opacity-50 cursor-not-allowed' : '',
                  ].join(' ')}
                  title={disabled ? 'Branch already chosen' : 'Choose this branch'}
                >
                  <input
                    type="radio"
                    name={`pick-${n.path}`}
                    checked={checked}
                    disabled={disabled || !onPickBranch}
                    onChange={() => onPickBranch?.(n.path, s)}
                  />
                  <span
                    className={[
                      'text-[11px] px-1.5 py-0.5 rounded border',
                      checked ? 'bg-sky-50 border-sky-200' : 'bg-white border-slate-200',
                    ].join(' ')}
                  >
                    {s}
                  </span>
                </label>
              );
            })}
          </div>
        )}

        {/* children */}
               {kids.length > 0 && isOpen(n.path) && (
            <ul role="group" className="ml-6 mt-1 border-l border-slate-200 pl-3">
              {kids.map(render)}
            </ul>
          )}
      </li>
    );
  };
    return (
      <ul className="list-none pl-0" role="tree" aria-label="Loci tree">
        {render(root)}
      </ul>
    );
}
