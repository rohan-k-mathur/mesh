// components/agora/ConfidenceControls.tsx
"use client";
import { useConfidence } from './useConfidence';

export default function ConfidenceControls({ compact = false }: { compact?: boolean }) {
  const { mode, setMode, tau, setTau } = useConfidence();

  return (
    <div className="inline-flex items-center gap-2">
      <label className="text-[11px] text-neutral-600">Confidence</label>
      <select
        className="menuv2--lite rounded px-2 py-1 text-[12px]"
        value={mode}
        onChange={e => setMode(e.target.value as any)}
      >
        <option value="min">weakest‑link (min)</option>
        <option value="product">independent (product)</option>
        <option value="ds">DS (Bel/Pl)</option>
      </select>

      {!compact && (
        <>
          <label className="text-[11px] text-neutral-600">τ</label>
          <input
            type="range" min={0} max={1} step={0.01}
            value={tau ?? 0}
            onChange={e => setTau(Number(e.target.value))}
            onDoubleClick={() => setTau(null)}
          />
          <span className="text-[11px] tabular-nums w-[40px] text-right">
            {tau == null ? '—' : (tau).toFixed(2)}
          </span>
        </>
      )}
    </div>
  );
}
