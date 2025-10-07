// components/arguments/AttackMenu.tsx
import React from 'react';

type ClaimRef = { id: string; text?: string };
type PremiseRef = ClaimRef;

type TargetArgument = {
  id: string;
  conclusion: ClaimRef;
  premises: PremiseRef[]; // provide to enable “undermine” targeting
};

type Props = {
  deliberationId: string;
  authorId: string;
  target: TargetArgument;
  onCreated?: (edgeId: string) => void;
};

export function AttackMenu({ deliberationId, authorId, target, onCreated }: Props) {
  const [busy, setBusy] = React.useState<string | null>(null);
  const [rebutClaimId, setRebutClaimId] = React.useState<string>('');
  const [underPremiseId, setUnderPremiseId] = React.useState<string>(target.premises[0]?.id || '');

  async function createAttackerRA(conclusionClaimId: string): Promise<string> {
    const res = await fetch('/api/arguments', {
      method: 'POST', headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({
        deliberationId, authorId,
        conclusionClaimId,
        premiseClaimIds: [], // keep simple; you can add warranting premises later
        schemeId: null, implicitWarrant: null
      })
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j?.error || 'Failed to create attacker argument');
    return j.argumentId;
  }

  async function postAttack(payload: any) {
    const res = await fetch(`/api/arguments/${encodeURIComponent(target.id)}/attacks`, {
      method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload)
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j?.error || 'Failed to create attack');
    onCreated?.(j.edge?.id);
  }

  return (
    <div className="attack-menu">
      <div className="group">
        <button
          className="pill"
          disabled={busy !== null}
          onClick={async () => {
            const claimId = rebutClaimId.trim();
            if (!claimId) return;
            setBusy('rebut');
            try {
              const fromArgumentId = await createAttackerRA(claimId);
              await postAttack({
                deliberationId, createdById: authorId,
                fromArgumentId,
                attackType: 'REBUTS', targetScope: 'conclusion',
                targetClaimId: target.conclusion.id
              });
            } finally { setBusy(null); }
          }}
          title="Challenge the claim (rebuttal)"
        >
          ⟲ Challenge claim
        </button>
        <input
          className="cid"
          placeholder="counter-claim id"
          value={rebutClaimId}
          onChange={(e)=>setRebutClaimId(e.target.value)}
          title="Provide the claimId of the counter-claim (wire to your ClaimPicker/autocomplete in production)"
        />
      </div>

      <div className="group">
        <button
          className="pill"
          disabled={busy !== null}
          onClick={async () => {
            setBusy('undercut');
            try {
              // Minimal: attacker RA concludes some “exception” claim; your UX can author it in detail
              const fromArgumentId = await createAttackerRA(`exception:${target.id}`);
              await postAttack({
                deliberationId, createdById: authorId,
                fromArgumentId,
                attackType: 'UNDERCUTS', targetScope: 'inference',
                toArgumentId: target.id
              });
            } finally { setBusy(null); }
          }}
          title="Challenge the reasoning (undercut the warrant)"
        >
          ⟂ Challenge reasoning
        </button>
        <span className="hint">lands on the warrant box</span>
      </div>

      <div className="group">
        <button
          className="pill"
          disabled={busy !== null || !underPremiseId}
          onClick={async () => {
            setBusy('undermine');
            try {
              const fromArgumentId = await createAttackerRA(`contrary:${underPremiseId}`);
              await postAttack({
                deliberationId, createdById: authorId,
                fromArgumentId,
                attackType: 'UNDERMINES', targetScope: 'premise',
                toArgumentId: target.id, targetPremiseId: underPremiseId
              });
            } finally { setBusy(null); }
          }}
          title="Challenge a premise (undermining)"
        >
          ⊖ Challenge premise
        </button>
        <select className="cid" value={underPremiseId} onChange={(e)=>setUnderPremiseId(e.target.value)}>
          {target.premises.map(p => <option key={p.id} value={p.id}>{p.text || p.id}</option>)}
        </select>
      </div>

      <style jsx>{`
        .attack-menu { display:flex; flex-direction:column; gap:10px; }
        .group { display:flex; align-items:center; gap:8px; }
        .pill { border:1px solid #d1d5db; background:#fff; border-radius:999px; padding:6px 12px; font-size:13px; }
        .cid { border:1px solid #e5e7eb; border-radius:8px; padding:6px 8px; min-width:220px; }
        .hint { font-size:12px; color:#6b7280; }
      `}</style>
    </div>
  );
}
