'use client';
import * as React from 'react';
import { useChatStore } from '@/contexts/useChatStore';
import { supabase } from '@/lib/supabaseclient';

const QUICK = ['👍', '❤️', '🎉', '😄', '🙏', '👀'];

export function ReactionBar(props: {
  conversationId: string;   // for Supabase channel
  messageId: string;
  userId: string;
  activeFacetId?: string | null; // pass current facet for Sheaf messages
}) {
  const { conversationId, messageId, userId, activeFacetId } = props;
  const applyDelta = useChatStore((s) => s.applyReactionDelta);
  const current = useChatStore((s) => s.reactionsByMessageId[messageId] ?? []);
  const mine = new Set(current.filter((r) => r.mine).map((r) => r.emoji));

  async function toggle(emoji: string) {
    // optimistic
    const isMine = mine.has(emoji);
    applyDelta(messageId, emoji, isMine ? 'remove' : 'add', true);

    try {
      const res = await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          messageId,
          facetId: activeFacetId ?? null,
          emoji,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Failed');

      // broadcast (clients are already subscribed in ChatRoom)
      supabase
        .channel(`conversation-${conversationId}`)
        .send({
          type: 'broadcast',
          event: `reaction_${data.action}`, // 'reaction_add' | 'reaction_remove'
          payload: {
            messageId,
            facetId: activeFacetId ?? null,
            emoji,
            userId,
          },
        });
    } catch (e) {
      // revert optimistic
      applyDelta(messageId, emoji, isMine ? 'add' : 'remove', true);
    }
  }

  return (
    <div className="mt-1 flex items-center gap-1">
      {QUICK.map((e) => {
        const selected = mine.has(e);
        return (
          <button
            key={e}
            type="button"
            onClick={() => toggle(e)}
            className={[
              'rounded-full border px-2 py-[2px] text-xs bg-white/70 hover:bg-white transition',
              selected ? 'ring-1 ring-indigo-400' : '',
            ].join(' ')}
            aria-pressed={selected}
            title={selected ? 'Remove reaction' : 'Add reaction'}
          >
            {e}
          </button>
        );
      })}
    </div>
  );
}
