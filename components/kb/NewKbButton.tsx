'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';

export function NewKbButton({ variant='solid' }: { variant?: 'solid'|'ghost' }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.push('/kb/new')}
      className={
        variant === 'solid'
          ? 'rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-800'
          : 'rounded-md border px-3 py-1.5 text-sm hover:bg-slate-50'
      }
      title="Create a new Knowledge Base page"
    >
      New KB Page
    </button>
  );
}
