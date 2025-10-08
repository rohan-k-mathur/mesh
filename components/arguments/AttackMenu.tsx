'use client';
import * as React from 'react';
import type { AttackType, TargetScope } from '@/lib/client/aifApi';

type Props = {
  onSelect: (sel: { attackType: AttackType; targetScope: TargetScope }) => void;
};

export function AttackMenu({ onSelect }: Props) {
  return (
    <div className="flex gap-2 flex-wrap">
      <button className="px-3 py-1 rounded-full bg-red-100 hover:bg-red-200"
              onClick={() => onSelect({ attackType:'REBUTS', targetScope:'conclusion' })}
              title="Dispute the claim’s truth (rebuttal)">Challenge claim</button>
      <button className="px-3 py-1 rounded-full bg-amber-100 hover:bg-amber-200"
              onClick={() => onSelect({ attackType:'UNDERCUTS', targetScope:'inference' })}
              title="Challenge the warrant/inference (undercut)">Challenge reasoning</button>
      <button className="px-3 py-1 rounded-full bg-blue-100 hover:bg-blue-200"
              onClick={() => onSelect({ attackType:'UNDERMINES', targetScope:'premise' })}
              title="Attack a specific premise (undermine)">Challenge premise</button>
    </div>
  );
}
