// components/sheaf/ViewAsBar.tsx
'use client';

import * as React from 'react';

export function ViewAsBar(props: {
  facets: { id: string; audience: any; sharePolicy?: string; body: any; attachments?: any[] }[];
  authorId: string|number;
  onResult?: (r: { visible: string[]; defaultFacetId: string|null }) => void;
}) {
  const { facets, authorId, onResult } = props;
  const [who, setWho] = React.useState<'everyone'|'mod'|'me'>('me');
  const [result, setResult] = React.useState<{ visible: string[]; defaultFacetId: string|null } | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function run() {
    setLoading(true);
    setErr(null);
    try {
      const viewer =
        who === 'everyone' ? { everyone: true } :
        who === 'mod' ? { role: 'MOD' } :
        { userId: authorId };

      const res = await fetch('/api/sheaf/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ viewer, facets }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        // ignore parse errors; we’ll show a soft error
      }

      if (!res.ok) {
        setErr(typeof data?.error === 'string' ? data.error : 'Preview failed');
        setResult(null);
        return;
      }

      setResult(data);
      onResult?.(data);
    } catch (e: any) {
      setErr(e?.message || 'Network error');
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [who, JSON.stringify(facets)]);

  return (
    <div className="rounded border bg-amber-50 text-amber-900 px-3 py-2 text-xs flex items-center gap-2">
      <span className="font-medium">View as:</span>
      <select
        className="border rounded px-2 py-1 bg-white/80"
        value={who}
        onChange={(e) => setWho(e.target.value as any)}
      >
        <option value="me">You (author)</option>
        <option value="mod">Role: MOD</option>
        <option value="everyone">Everyone</option>
      </select>
      {loading && <span>Calculating…</span>}
      {!loading && err && <span className="text-rose-700">• {err}</span>}
      {!loading && !err && result && (
        <span>
          Visible layers: <strong>{result.visible.length}</strong>
          {result.defaultFacetId ? ` • default: ${result.defaultFacetId}` : null}
        </span>
      )}
    </div>
  );
}
