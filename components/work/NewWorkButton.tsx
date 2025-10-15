// components/work/NewWorkButton.tsx
'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';

export function NewWorkButton({
  title = 'Untitled Work',
  theoryType = 'IH',
  deliberationId,
}: {
  title?: string;
  theoryType?: 'DN' | 'IH' | 'TC' | 'OP';
  deliberationId?: string;
}) {
  const router = useRouter();
  const [creating, setCreating] = React.useState(false);

  async function create() {
    setCreating(true);
    try {
      const r = await fetch('/api/works', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title, theoryType, deliberationId }),
      });
      if (!r.ok) {
        const txt = await r.text();
        throw new Error(`Create failed: ${r.status} ${txt}`);
      }
      const j = await r.json();
      const id = j?.work?.id;
      if (id) router.push(`/works/${id}`);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Failed to create work');
    } finally {
      setCreating(false);
    }
  }

  return (
    <button
      type="button"
      onClick={create}
      className="btnv2 bg-white/50 flex items-center gap-2 text-sm px-3 py-3 rounded-xl disabled:opacity-60"
      disabled={creating}
      title="Create a new work"
    >
      {creating ? <span className="kb-spinner" /> : '⨁ New Work'}
    </button>
  );
}
