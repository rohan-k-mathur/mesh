'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';

export function NewDiscussionButton({
  variant = 'solid',
  title,
  description,
  attachedToType,
  attachedToId,
  createConversation = true,
}: {
  variant?: 'solid' | 'ghost';
  title?: string;
  description?: string | null;
  attachedToType?: string | null;
  attachedToId?: string | null;
  createConversation?: boolean;
}) {
  const router = useRouter();
  const href = React.useMemo(() => {
    const u = new URL('/discussions/new', window.location.origin);
    if (title) u.searchParams.set('title', title);
    if (description) u.searchParams.set('description', description);
    if (attachedToType) u.searchParams.set('attachedToType', attachedToType);
    if (attachedToId) u.searchParams.set('attachedToId', attachedToId);
    if (!createConversation) u.searchParams.set('createConversation', '0');
    return u.toString();
  }, [title, description, attachedToType, attachedToId, createConversation]);

  return (
    <button
      type="button"
      onClick={() => router.push(href)}
      className={
        variant === 'solid'
          ? 'rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-800'
          : 'rounded-md border px-3 py-1.5 text-sm hover:bg-slate-50'
      }
      title="Create a new discussion"
    >
      New Discussion
    </button>
  );
}
