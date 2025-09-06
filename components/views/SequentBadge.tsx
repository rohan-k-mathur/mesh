'use client';
import React from 'react';
import { useSequentStatus } from './useSequentStatus';

export default function SequentBadge({
  gammaTexts,
  deltaTexts,
  onClick,
}: {
  gammaTexts: string[];
  deltaTexts: string[];
  onClick?: () => void;
}) {
  const { sequent, isValidating } = useSequentStatus({ gammaTexts, deltaTexts });
  const { label, sequentEntail } = sequent;

  const style = label === 'strong'
    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
    : label === 'weak'
    ? 'bg-amber-50 border-amber-300 text-amber-800'
    : 'bg-rose-50 border-rose-300 text-rose-700';

  return (
    <button
      type="button"
      className={`px-2 py-0.5 rounded border text-[11px] ${style}`}
      onClick={onClick}
      title={isValidating ? 'Evaluating…' : `Min entailment: ${(sequentEntail*100).toFixed(0)}%`}
    >
      Entailment: {isValidating ? '…' : label}
    </button>
  );
}
