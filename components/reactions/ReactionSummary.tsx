'use client';
import * as React from 'react';
import { useChatStore } from '@/contexts/useChatStore';

export function ReactionSummary({ messageId }: { messageId: string }) {
  const items = useChatStore((s) => s.reactionsByMessageId[messageId] ?? []);
  if (!items.length) return null;

  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {items.map((r) => (
        <span
          key={r.emoji}
          className={[
            'inline-flex items-center gap-1 rounded-full border px-2 py-[2px] text-xs bg-white/70',
            r.mine ? 'ring-1 ring-indigo-400' : '',
          ].join(' ')}
          title={r.mine ? 'You reacted' : undefined}
        >
          <span>{r.emoji}</span>
          <span className="tabular-nums">{r.count}</span>
        </span>
      ))}
    </div>
  );
}
