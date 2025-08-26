'use client';
import { useState } from 'react';

const choices = [
  'OK','NEEDS_SOURCES','WORKSHOP','OFF_TOPIC_REDIRECT','DUPLICATE_MERGE','DISPUTED','OUT_OF_BOUNDS'
] as const;

export default function StatusDropdown(props: {
  roomId: string;
  actorId: string;
  targetType: 'article'|'post'|'room_thread'|'deliberation'|'argument'|'card'|'claim'|'brief'|'brief_version';
  targetId: string;
  current?: string;
  panelId?: string | null;
}) {
  const [val, setVal] = useState(props.current ?? 'OK');
  const [busy, setBusy] = useState(false);

  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value;
    setVal(newStatus);
    setBusy(true);
    await fetch('/api/governance/status', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        roomId: props.roomId,
        actorId: props.actorId,
        targetType: props.targetType,
        targetId: props.targetId,
        newStatus,
        panelId: props.panelId ?? undefined,
      }),
    });
    setBusy(false);
  }

  return (
    <select value={val} onChange={onChange} disabled={busy} className="border rounded px-2 py-1 text-sm">
      {choices.map(c => <option key={c} value={c}>{c}</option>)}
    </select>
  );
}
