'use client';
import * as React from 'react';
import PracticalBuilder from '../practical/PracticalBuilder';
import PracticalSummary from '../practical/PracticalSummary';
import HermeneuticBuilder from '../hermeneutic/HermeneuticBuilder';
import PascalBuilder from '../pascal/PascalBuilder';
import DNThesesEditor from '@/components/work/editors/DNThesesEditor';
import IHThesesEditor from '@/components/work/editors/IHThesesEditor';
import TCThesesEditor from '@/components/work/editors/TCThesesEditor';
import OPThesesEditor from '@/components/work/editors/OPThesesEditor';
import CompareAlternativesPanel from '@/components/work/CompareAlternativesPanel';

type TheoryType = 'DN'|'IH'|'TC'|'OP';

export function TheoryFraming({
  value,
  onChange,
  workId,
  canEditPractical = true,
  defaultOpenBuilder = false,
  className = '',
}: {
  value: { theoryType: TheoryType; standardOutput?: string };
  onChange: (v: { theoryType: TheoryType; standardOutput?: string }) => void;
  workId?: string;
  canEditPractical?: boolean;
  defaultOpenBuilder?: boolean;
  className?: string;
}) {
  const t = value.theoryType;

  return (
    <div className={`rounded border p-3 space-y-3 ${className}`}>
      <div className="text-sm font-medium">Philosophical framing</div>

      <label className="block text-xs text-neutral-600">Theory Type</label>
      <select
        className="border rounded px-2 py-1 text-sm"
        value={t}
        onChange={(e) => onChange({ ...value, theoryType: e.target.value as TheoryType })}
      >
        <option value="DN">DN — Descriptive–Nomological (empirical)</option>
        <option value="IH">IH — Idealizing–Hermeneutic (interpret → idealize)</option>
        <option value="TC">TC — Technical–Constructive (design an instrument)</option>
        <option value="OP">OP — Ontic–Practical (as‑if decision under uncertainty)</option>
      </select>

      {(t === 'IH' || t === 'TC') && (
        <div>
          <label className="block text-xs text-neutral-600 mb-1">
            Standard Output (purpose of the instrument)
          </label>
          <input
            className="w-full border rounded px-2 py-1 text-sm"
            value={value.standardOutput ?? ''}
            onChange={(e) => onChange({ ...value, standardOutput: e.target.value })}
            placeholder="e.g., Maximize public health while preserving autonomy"
          />
          <div className="mt-1 text-[11px] text-neutral-500">
            This is the “key to all further findings” (Lumer TIH9/TTC2).
          </div>
        </div>
      )}

      {/* ==== Structured builders by type (requires a saved work) ==== */}
      {!workId && (
        <div className="text-[11px] text-neutral-500">
          Save this Work to enable structured builders for {t}.
        </div>
      )}

      {workId && (
        <div className="space-y-3">
          {/* {t === 'IH' && (
            <>
              <HermeneuticBuilder workId={workId} />
              <PracticalSummary workId={workId} />
              {canEditPractical && (
                <PracticalBuilder workId={workId} defaultOpen={defaultOpenBuilder} />
              )}
            </>
          )} */}

          {/* {t === 'TC' && (
            <>
              <PracticalSummary workId={workId} />
              {canEditPractical && (
                <PracticalBuilder workId={workId} defaultOpen={defaultOpenBuilder} />
              )}
              <div className="text-[11px] text-neutral-500">
                (Optional) Use the Hermeneutic builder if you want to ground your construction in
                interpreted practice.
              </div>
            </>
          )} */}
          {t === 'IH' && (
  <>
    <HermeneuticBuilder workId={workId} />
    <IHThesesEditor workId={workId} /> {/* NEW */}
    <CompareAlternativesPanel workId={workId} /> {/* NEW */}
    <PracticalSummary workId={workId} />
    {canEditPractical && (<PracticalBuilder workId={workId} defaultOpen={defaultOpenBuilder} />)}
  </>
)}

{t === 'TC' && (
  <>
    <TCThesesEditor workId={workId} /> {/* NEW */}
    <CompareAlternativesPanel workId={workId} /> {/* NEW */}
    <PracticalSummary workId={workId} />
    {canEditPractical && (<PracticalBuilder workId={workId} defaultOpen={defaultOpenBuilder} />)}
    <div className="text-[11px] text-neutral-500">
      (Optional) Use the Hermeneutic builder if you want to ground your construction in interpreted practice.
    </div>
  </>
)}

{t === 'OP' && (
  <>
    <OPThesesEditor workId={workId} /> {/* NEW */}
    <PascalBuilder workId={workId} />
  </>
)}

{t === 'DN' && (
  <>
    <DNThesesEditor workId={workId} /> {/* NEW */}
    <div className="text-[11px] text-neutral-500">
      DN posts supply empirical premises. Link them later via the Supply function graph.
    </div>
  </>
)}


          
        </div>
      )}
    </div>
  );
}
