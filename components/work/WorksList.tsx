'use client';
import * as React from 'react';

type Work = {
  id: string;
  title: string;
  theoryType: 'DN'|'IH'|'TC'|'OP';
  standardOutput?: string | null;
  authorId: string;
  createdAt: string;
};

export default function WorksList({
  deliberationId,
  currentUserId,
}: {
  deliberationId: string;
  currentUserId?: string;
}) {
  const [mineOnly, setMineOnly] = React.useState(false);
  const [theoryFilter, setTheoryFilter] = React.useState<'ALL'|'DN'|'IH'|'TC'|'OP'>('ALL');
  const [loading, setLoading] = React.useState(false);
  const [works, setWorks] = React.useState<Work[]>([]);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('deliberationId', deliberationId);
      if (mineOnly && currentUserId) params.set('authorId', currentUserId);
      if (theoryFilter !== 'ALL') params.set('theoryType', theoryFilter);
      const res = await fetch(`/api/works?${params.toString()}`, { cache:'no-store' });
      const json = await res.json();
      setWorks(json.works ?? []);
    } finally {
      setLoading(false);
    }
  }

//   React.useEffect(() => { load(); }, [deliberationId, mineOnly, theoryFilter]);
React.useEffect(() => {
    if (!deliberationId) {
      setWorks([]);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('deliberationId', deliberationId);
        if (mineOnly && currentUserId) params.set('authorId', currentUserId);
        if (theoryFilter !== 'ALL') params.set('theoryType', theoryFilter);
        const res = await fetch(`/api/works?${params.toString()}`, { cache:'no-store' });
        const json = await res.json();
        setWorks(json.works ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, [deliberationId, mineOnly, theoryFilter, currentUserId]);

  const onCreateWork = () => {
    // 1) Scroll to the Composer anchor
    const anchor = document.getElementById('work-composer');
    if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // 2) Ask the composer to open its “Save as a Theory Work” section
    window.dispatchEvent(new CustomEvent('mesh:open-work-fields', {
      detail: { deliberationId }
    }));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          className="px-2 py-1 border rounded text-xs bg-white"
          onClick={onCreateWork}
        >
          Create Work
        </button>

        <div className="h-4 w-px bg-neutral-300" />

        <label className="text-xs flex items-center gap-1">
          <input
            type="checkbox"
            checked={mineOnly}
            onChange={e => setMineOnly(e.target.checked)}
            disabled={!currentUserId}
          />
          My Works
        </label>

        <label className="text-xs flex items-center gap-1">
          Type:
          <select
            className="border rounded px-1 py-0.5 text-xs"
            value={theoryFilter}
            onChange={e => setTheoryFilter(e.target.value as any)}
          >
            <option value="ALL">All</option>
            <option value="DN">DN</option>
            <option value="IH">IH</option>
            <option value="TC">TC</option>
            <option value="OP">OP</option>
          </select>
        </label>

        <button
          className="px-2 py-1 border rounded text-xs"
          onClick={load}
          disabled={loading}
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {!works.length && (
        <div className="text-xs text-neutral-500">
          {loading ? 'Loading…' : 'No works yet.'}
        </div>
      )}

      <div className="space-y-2">
        {works.map(w => (
          <a key={w.id} href={`/works/${w.id}`} className="block rounded border p-2 hover:bg-neutral-50">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">{w.title}</div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100">{w.theoryType}</span>
            </div>
            {w.theoryType !== 'DN' && w.standardOutput && (
              <div className="text-[11px] text-neutral-600 mt-1">
                Std. Output: {w.standardOutput}
              </div>
            )}
            <div className="text-[11px] text-neutral-500">
              Created {new Date(w.createdAt).toLocaleString()}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
