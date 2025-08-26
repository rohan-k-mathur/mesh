'use client';
import { useEffect, useState } from 'react';
import DeliberationComposer from './DeliberationComposer';
import { RepresentativeViewpoints } from './RepresentativeViewpoints';
import ArgumentsList from './ArgumentsList';
import IssueRegister from './IssueRegister';

type Selection = {
  id: string; rule: 'utilitarian'|'harmonic'|'maxcov'; k: number;
  coverageAvg: number; coverageMin: number; jrSatisfied: boolean;
  views: { index: number; arguments: { id: string; text: string; confidence?: number|null }[] }[];
};

export default function DeepDivePanel({ deliberationId }: { deliberationId: string }) {
  const [sel, setSel] = useState<Selection | null>(null);
  const [pending, setPending] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const compute = async (rule?: 'utilitarian'|'harmonic'|'maxcov') => {
    setPending(true);
    try {
      const res = await fetch(`/api/deliberations/${deliberationId}/viewpoints/select`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ k: 3, rule: rule ?? 'utilitarian' }),
      });
      const data = await res.json();
      if (data.selection) setSel(data.selection);
    } finally {
      setPending(false);
    }
  };

  useEffect(() => { compute(); }, []);

  return (
    <div className="space-y-4">
 <ArgumentsList
        deliberationId={deliberationId}
       onReplyTo={(id) => setReplyTo(id)}
        onChanged={() => compute(sel?.rule)}
      />
      <DeliberationComposer
        deliberationId={deliberationId}
        onPosted={() => { setReplyTo(null); compute(sel?.rule); }}
        targetArgumentId={replyTo ?? undefined}
      />      {pending && <div className="text-xs text-neutral-500">Computing representative viewpoints…</div>}
      <RepresentativeViewpoints deliberationId={deliberationId} selection={sel} onReselect={compute} />
    </div>
  );
}
