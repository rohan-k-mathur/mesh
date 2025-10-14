// components/arguments/ArgumentCard.tsx
'use client';
import * as React from 'react';
import { AttackMenu } from './AttackMenu';
import { createArgument, postAttack } from '@/lib/client/aifApi';
import { AttackMenuPro } from './AttackMenuPro';
type Prem = { id: string; text: string };

export function ArgumentCard({
  deliberationId, authorId,
  id, conclusion, premises,
  onAnyChange,
}: {
  deliberationId: string; authorId: string;
  id: string;
  conclusion: { id: string; text: string };
  premises: Prem[];
  onAnyChange?: () => void;
}) {
  const [expanded, setExpanded] = React.useState(false);

  async function handleAttack(sel: { attackType:'REBUTS'|'UNDERCUTS'|'UNDERMINES'; targetScope:'conclusion'|'inference'|'premise' }) {
    try {
      // For demo: attacker RA concludes a placeholder claim. Replace with a composer form if desired.
      const attackerConclusionId =
        sel.attackType === 'REBUTS' ? `counter:${conclusion.id}` :
        sel.attackType === 'UNDERMINES' ? `contrary:${premises[0]?.id ?? 'prem'}` :
        `exception:${id}`;
      const attackerId = await createArgument({
        deliberationId, authorId,
        conclusionClaimId: attackerConclusionId,
        premiseClaimIds: [],
        schemeId: null, implicitWarrant: null,
      });

      await postAttack(id, {
        deliberationId,
        createdById: authorId,
        fromArgumentId: attackerId,
        attackType: sel.attackType,
        targetScope: sel.targetScope,
        toArgumentId: sel.targetScope !== 'conclusion' ? id : null,
        targetClaimId:  sel.targetScope === 'conclusion' ? conclusion.id : null,
        targetPremiseId: sel.targetScope === 'premise' ? (premises[0]?.id ?? null) : null,
      });

      onAnyChange?.();
    } catch (e) { console.error(e); }
  }

  return (
    <div className="border rounded-md p-3 space-y-2 bg-white">
      <div className="flex items-center justify-between">
        <div className="font-medium">{conclusion.text}</div>
        <button className="text-xs underline" onClick={()=>setExpanded(x=>!x)}>{expanded ? 'Collapse' : 'Expand'}</button>
      </div>

      {expanded ? (
        <>
          {/* WARRANT BOX — undercuts attach here (AIF CA→RA) */}
          <div className="border rounded p-2 bg-indigo-50">
            <div className="text-xs text-gray-600 mb-1">Premises</div>
            <ul className="list-disc list-inside">
              {premises.map(p => <li key={p.id}>{p.text}</li>)}
            </ul>
            <div className="text-xs text-indigo-900 mt-2">Undercuts (challenge reasoning) land on this box.</div>
          </div>

          <AttackMenuPro
            deliberationId={deliberationId}
            authorId={authorId}
            target={{ id, conclusion, premises }}
            onDone={onAnyChange}
          />
        </>
      ) : (
        <div className="text-sm text-gray-600 truncate">
          Premises: {premises.map(p => p.text).join(' • ')}
        </div>
      )}
    </div>
  );
}
