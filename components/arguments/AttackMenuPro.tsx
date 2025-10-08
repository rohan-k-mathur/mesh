// components/arguments/AttackMenuPro.tsx
'use client';
import * as React from 'react';
import { ClaimPicker } from '@/components/claims/ClaimPicker';
import { createArgument, postAttack } from '@/lib/client/aifApi';

type ClaimRef = { id: string; text: string };
type Prem = { id: string; text: string };

export function AttackMenuPro({
  deliberationId, authorId,
  target,
  onDone,
}: {
  deliberationId: string;
  authorId: string;
  target: { id: string; conclusion: ClaimRef; premises: Prem[] };
  onDone?: () => void;
}) {
  const [busy, setBusy] = React.useState<string | null>(null);
  const [rebut, setRebut] = React.useState<ClaimRef | null>(null);
  const [undercutText, setUndercutText] = React.useState('');
  const [premiseId, setPremiseId] = React.useState(target.premises[0]?.id ?? '');
  const [undermine, setUndermine] = React.useState<ClaimRef | null>(null);

  async function fire(kind: 'REBUTS' | 'UNDERCUTS' | 'UNDERMINES') {
    if (busy) return;
    setBusy(kind);
    try {
      let attackerConclusionId: string;
      if (kind === 'REBUTS') {
        if (!rebut) return;
        attackerConclusionId = rebut.id;
      } else if (kind === 'UNDERCUTS') {
        const txt = undercutText.trim();
        if (!txt) return;
        // Create a minimal claim for the exception/warrant defeater
        attackerConclusionId = await (async () => {
          const res = await fetch('/api/claims', { method:'POST', headers:{'content-type':'application/json'},
            body: JSON.stringify({ deliberationId, authorId, text: txt }) });
          const { id } = await res.json();
          return id as string;
        })();
      } else { // UNDERMINES
        if (!premiseId || !undermine) return;
        attackerConclusionId = undermine.id;
      }

      // Create attacker RA (premises can be added later; we keep this minimal)
      const attackerId = await createArgument({
        deliberationId, authorId,
        conclusionClaimId: attackerConclusionId,
        premiseClaimIds: [],
        schemeId: null, implicitWarrant: null,
      });

      // Send typed attack
      await postAttack(target.id, {
        deliberationId,
        createdById: authorId,
        fromArgumentId: attackerId,
        attackType: kind,
        targetScope: kind === 'UNDERCUTS' ? 'inference' : (kind === 'REBUTS' ? 'conclusion' : 'premise'),
        toArgumentId: kind === 'REBUTS' ? null : target.id,
        targetClaimId: kind === 'REBUTS' ? target.conclusion.id : null,
        targetPremiseId: kind === 'UNDERMINES' ? premiseId : null,
      });

      onDone?.();
      setRebut(null); setUndercutText(''); setUndermine(null);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      {/* REBUT: challenge the conclusion */}
      <div className="border rounded p-2">
        <div className="text-xs text-neutral-600 mb-1">Challenge the <b>claim</b> (rebut)</div>
        <ClaimPicker
          deliberationId={deliberationId}
          authorId={authorId}
          label="Counter‑claim"
          onPick={setRebut}
        />
        <button
          className="mt-2 text-xs rounded px-2 py-1 border border-amber-300 hover:bg-amber-50"
          disabled={!rebut || !!busy}
          onClick={() => fire('REBUTS')}
        >Post rebuttal</button>
      </div>

      {/* UNDERCUT: challenge the inference */}
      <div className="border rounded p-2">
        <div className="text-xs text-neutral-600 mb-1">Challenge the <b>reasoning</b> (undercut)</div>
        <input
          value={undercutText}
          onChange={(e)=>setUndercutText(e.target.value)}
          placeholder="Briefly state the exception / rule‑defeater"
          className="w-full border rounded px-2 py-1 text-sm"
        />
        <button
          className="mt-2 text-xs rounded px-2 py-1 border border-amber-300 hover:bg-amber-50"
          disabled={!undercutText.trim() || !!busy}
          onClick={() => fire('UNDERCUTS')}
        >Post undercut</button>
      </div>

      {/* UNDERMINE: challenge a specific premise */}
      <div className="border rounded p-2">
        <div className="text-xs text-neutral-600 mb-1">Challenge a <b>premise</b> (undermine)</div>
        <div className="flex items-start gap-2">
          <select className="text-sm border rounded px-2 py-1"
                  value={premiseId} onChange={e=>setPremiseId(e.target.value)}>
            {target.premises.map(p => <option key={p.id} value={p.id}>{p.text}</option>)}
          </select>
          <div className="flex-1">
            <ClaimPicker
              deliberationId={deliberationId}
              authorId={authorId}
              label="Contradicting claim"
              onPick={setUndermine}
            />
          </div>
        </div>
        <button
          className="mt-2 text-xs rounded px-2 py-1 border border-amber-300 hover:bg-amber-50"
          disabled={!premiseId || !undermine || !!busy}
          onClick={() => fire('UNDERMINES')}
        >Post undermine</button>
      </div>
    </div>
  );
}
