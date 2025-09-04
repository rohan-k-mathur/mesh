// components/work/WorkDetailClient.tsx
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { TheoryFraming } from '@/components/compose/TheoryFraming';

export default function WorkDetailClient(props: {
  id: string;
  deliberationId: string;
  title: string;
  theoryType: 'DN'|'IH'|'TC'|'OP';
  standardOutput?: string;
}) {
  const { id, deliberationId, title, theoryType, standardOutput } = props;
  const router = useRouter();

  const [framing, setFraming] = React.useState<{
    theoryType: 'DN'|'IH'|'TC'|'OP';
    standardOutput?: string;
  }>({
    theoryType,
    standardOutput,
  });

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      {/* Back to Deep Dive button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push(`/deepdive/${deliberationId}`)}
          className="px-3 py-1 text-xs rounded-md border border-slate-300 bg-white hover:bg-slate-50"
        >
          ← Back to Discussion
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">{title}</div>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100">
          {theoryType}
        </span>
      </div>

      <TheoryFraming
        value={framing}
        onChange={setFraming}
        workId={id}
        canEditPractical={true}
        defaultOpenBuilder={true}
      />
    </div>
  );
}
