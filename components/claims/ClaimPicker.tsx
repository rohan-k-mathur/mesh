'use client';
import * as React from 'react';
import { searchClaims, createClaim, ClaimLite } from '@/lib/client/aifApi';

type Props = {
  deliberationId: string;
  authorId: string;
  label?: string;
  placeholder?: string;
  onPick: (c: ClaimLite) => void;
  allowCreate?: boolean;
  /** Minimum characters before search triggers (default 2) */
  minChars?: number;
  /** Max results to render (UI; does not change server limit unless aifApi supports it) */
  limit?: number;
  /** Result cache TTL in ms (default 45s) */
  ttlMs?: number;
  /** Autofocus input (default false) */
  autoFocus?: boolean;
};

export function ClaimPicker({
  deliberationId,
  authorId,
  label = 'Claim',
  placeholder = 'Search or enter new…',
  onPick,
  allowCreate = true,
  minChars = 2,
  limit = 30,
  ttlMs = 45_000,
  autoFocus = false,
}: Props) {
  const inputId = React.useId();
  const [q, setQ] = React.useState('');
  const deferredQ = React.useDeferredValue(q); // smoother typing
  const [busyCreate, setBusyCreate] = React.useState(false);
  const [items, setItems] = React.useState<ClaimLite[]>([]);
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [sel, setSel] = React.useState<number>(-1); // keyboard selection
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  // in-flight search cancellation
  const searchCtrlRef = React.useRef<AbortController | null>(null);

  // tiny LRU-like cache (keyed by deliberationId|query)
  const cacheRef = React.useRef<Map<string, { at: number; rows: ClaimLite[] }>>(new Map());

  // clean up on unmount
  React.useEffect(() => {
    return () => {
      searchCtrlRef.current?.abort();
    };
  }, []);

  // search effect (debounced + abortable + cached)
  React.useEffect(() => {
    const query = deferredQ.trim();
    if (query.length < minChars) {
      // below threshold: clear list, reset selection
      setItems([]);
      setSel(-1);
      setLoading(false);
      setErr(null);
      // cancel any in-flight
      searchCtrlRef.current?.abort();
      searchCtrlRef.current = null;
      return;
    }

    const key = `${deliberationId}|${query.toLowerCase()}`;
    const cached = cacheRef.current.get(key);
    const now = Date.now();
    if (cached && now - cached.at < ttlMs) {
      // serve cache synchronously
      React.startTransition(() => {
        setItems(cached.rows.slice(0, limit));
        setSel(cached.rows.length ? 0 : -1);
        setErr(null);
      });
      return;
    }

    // debounce
    const t = setTimeout(async () => {
      // cancel previous search
      searchCtrlRef.current?.abort();
      const ctrl = new AbortController();
      searchCtrlRef.current = ctrl;

      try {
        setLoading(true);
        setErr(null);

        // prefer aifApi with { signal, limit } if supported; otherwise ignore
        const rows: ClaimLite[] =
          // @ts-expect-error: optional options shape if your aifApi supports it
          await searchClaims(query, deliberationId, { signal: ctrl.signal, limit })
          // fallback if older signature (silently retries without options)
          .catch(async (e: any) => {
            if (e?.name === 'AbortError') throw e;
            return searchClaims(query, deliberationId);
          });

        if (ctrl.signal.aborted) return;

        // cache full set (not just first `limit`)
        cacheRef.current.set(key, { at: Date.now(), rows });
        React.startTransition(() => {
          setItems(rows.slice(0, limit));
          setSel(rows.length ? 0 : -1);
        });
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
        setErr(e?.message || 'Search failed');
      } finally {
        if (!searchCtrlRef.current?.signal.aborted) setLoading(false);
      }
    }, 250); // slightly longer than before to avoid bursty opens

    return () => clearTimeout(t);
  }, [deferredQ, deliberationId, minChars, limit, ttlMs]);

  // Create new on demand
  const createNew = React.useCallback(async () => {
    const text = q.trim();
    if (!text || busyCreate) return;
    setBusyCreate(true);
    setErr(null);
    try {
      const id = await createClaim({ deliberationId, authorId, text });
      onPick({ id, text } as ClaimLite);
      setQ('');
      setItems([]);
      setSel(-1);
      // prime cache so immediate re-open is instant
      const key = `${deliberationId}|${text.toLowerCase()}`;
      cacheRef.current.set(key, { at: Date.now(), rows: [{ id, text } as ClaimLite] });
    } catch (e: any) {
      setErr(e?.message || 'Failed');
    } finally {
      setBusyCreate(false);
    }
  }, [q, busyCreate, deliberationId, authorId, onPick]);

  // Keyboard shortcuts
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSel((s) => Math.min(s + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSel((s) => Math.max(s - 1, items.length ? 0 : -1));
    } else if (e.key === 'Enter') {
      // pick selection, else create if allowed
      if (sel >= 0 && sel < items.length) {
        onPick(items[sel]);
        setQ('');
        setItems([]);
        setSel(-1);
      } else if (allowCreate && q.trim()) {
        createNew();
      }
    } else if (e.key === 'Escape') {
      setQ('');
      setItems([]);
      setSel(-1);
    }
  };

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="text-xs text-neutral-600">
          {label}
        </label>
      )}

      <input
        id={inputId}
        ref={inputRef}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="w-full border rounded px-2 py-1 text-sm"
        autoFocus={autoFocus}
        aria-autocomplete="list"
        aria-controls={items.length ? `${inputId}-listbox` : undefined}
        aria-expanded={!!items.length}
        aria-activedescendant={sel >= 0 ? `${inputId}-opt-${sel}` : undefined}
      />

      {err && <div className="text-[11px] text-rose-700">{err}</div>}

      {/* Results */}
      {(loading || items.length > 0 || (allowCreate && q.trim())) && (
        <div
          ref={listRef}
          id={`${inputId}-listbox`}
          role="listbox"
          className="rounded border bg-white divide-y max-h-44 overflow-auto"
        >
          {loading && (
            <div className="px-2 py-1 text-xs text-slate-500">Searching…</div>
          )}

          {items.slice(0, limit).map((x, i) => (
            <button
              key={x.id}
              id={`${inputId}-opt-${i}`}
              role="option"
              aria-selected={sel === i}
              className={`w-full text-left px-2 py-1 text-sm hover:bg-slate-50 ${
                sel === i ? 'bg-indigo-50' : ''
              }`}
              onMouseEnter={() => setSel(i)}
              onClick={() => {
                onPick(x);
                setQ('');
                setItems([]);
                setSel(-1);
              }}
              title={x.text}
            >
              {x.text}
            </button>
          ))}

          {allowCreate && q.trim() && (
            <button
              disabled={busyCreate}
              className="w-full text-left px-2 py-1 text-sm bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50"
              onClick={createNew}
              title="Create and select"
            >
              {busyCreate ? 'Creating…' : `+ Create “${q.trim()}”`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
