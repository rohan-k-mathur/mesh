// lib/dialogue/movesToActions.ts
import type { CommandCardAction, TargetRef } from '@/components/dialogue/command-card/types';

export type Move = {
  kind: 'ASSERT'|'WHY'|'GROUNDS'|'RETRACT'|'CONCEDE'|'CLOSE'|'THEREFORE'|'SUPPOSE'|'DISCHARGE';
  label: string;
  payload?: any;
  disabled?: boolean;
  reason?: string;
  force?: 'ATTACK'|'SURRENDER'|'NEUTRAL';
  relevance?: 'likely'|'unlikely'|null;
  postAs?: { targetType: 'argument'|'claim'|'card'; targetId: string };
};

/**
 * Convert legal moves from the dialogue API into CommandCard actions
 * for the 3×3 grid interface.
 */
export function movesToActions(
  moves: Move[],
  targetRef: TargetRef
): CommandCardAction[] {
  const actions: CommandCardAction[] = [];

  // Top row: WHY, GROUNDS, CLOSE
  const whyMoves = moves.filter(m => m.kind === 'WHY');
  whyMoves.forEach((why, i) => {
    actions.push({
      id: `why-${i}`,
      kind: 'WHY',
      label: why.label || 'WHY',
      force: (why.force || 'ATTACK') as any,
      disabled: why.disabled,
      reason: why.reason,
      relevance: why.relevance,
      group: 'top',
      move: {
        kind: 'WHY',
        payload: why.payload
      },
      target: targetRef
    });
  });

  const groundsMoves = moves.filter(m => m.kind === 'GROUNDS');
  groundsMoves.forEach((g, i) => {
    actions.push({
      id: `grounds-${i}`,
      kind: 'GROUNDS',
      label: g.label || 'GROUNDS',
      force: (g.force || 'ATTACK') as any,
      disabled: g.disabled,
      reason: g.reason,
      relevance: g.relevance,
      group: 'top',
      move: {
        kind: 'GROUNDS',
        payload: g.payload
      },
      target: targetRef
    });
  });

  const close = moves.find(m => m.kind === 'CLOSE');
  if (close) {
    actions.push({
      id: 'close',
      kind: 'CLOSE',
      label: close.label || 'Close (†)',
      force: (close.force || 'SURRENDER') as any,
      disabled: close.disabled,
      reason: close.reason,
      relevance: close.relevance,
      group: 'top',
      tone: 'primary',
      move: {
        kind: 'CLOSE',
        payload: close.payload
      },
      target: targetRef
    });
  }

  // Mid row: CONCEDE, RETRACT, ACCEPT_ARGUMENT
  const concede = moves.find(m => m.kind === 'CONCEDE');
  if (concede) {
    actions.push({
      id: 'concede',
      kind: 'CONCEDE',
      label: concede.label || 'Concede',
      force: (concede.force || 'SURRENDER') as any,
      disabled: concede.disabled,
      reason: concede.reason,
      relevance: concede.relevance,
      group: 'mid',
      move: {
        kind: 'CONCEDE',
        payload: concede.payload
      },
      target: targetRef
    });
  }

  const retract = moves.find(m => m.kind === 'RETRACT');
  if (retract) {
    actions.push({
      id: 'retract',
      kind: 'RETRACT',
      label: retract.label || 'Retract',
      force: (retract.force || 'SURRENDER') as any,
      disabled: retract.disabled,
      reason: retract.reason,
      relevance: retract.relevance,
      group: 'mid',
      move: {
        kind: 'RETRACT',
        payload: retract.payload
      },
      target: targetRef
    });
  }

  // Accept argument (R7 - accept argument as-is)
  const acceptArg = moves.find(m => m.label?.toLowerCase().includes('accept argument'));
  if (acceptArg) {
    actions.push({
      id: 'accept-argument',
      kind: 'ACCEPT_ARGUMENT',
      label: 'Accept Arg',
      force: (acceptArg.force || 'SURRENDER') as any,
      disabled: acceptArg.disabled,
      reason: acceptArg.reason,
      relevance: acceptArg.relevance,
      group: 'mid',
      tone: 'primary',
      move: {
        kind: acceptArg.kind as any,
        payload: acceptArg.payload,
        postAs: acceptArg.postAs as any
      },
      target: targetRef
    });
  }

  // Bottom row: Scaffolds (client-side templates)
  // These are inferred from WHY label hints
  const anyWhy = whyMoves[0];
  if (anyWhy) {
    if (anyWhy.label.includes('∀')) {
      actions.push({
        id: 'forall-inst',
        kind: 'FORALL_INSTANTIATE',
        label: '∀‑inst',
        force: 'NEUTRAL',
        group: 'bottom',
        scaffold: {
          template: 'Consider the specific case of [INSTANCE]...',
          analyticsName: 'scaffold:forall'
        },
        target: targetRef
      });
    }

    if (anyWhy.label.includes('∃')) {
      actions.push({
        id: 'exists-witness',
        kind: 'EXISTS_WITNESS',
        label: '∃‑witness',
        force: 'NEUTRAL',
        group: 'bottom',
        scaffold: {
          template: 'A counterexample is [WITNESS]...',
          analyticsName: 'scaffold:exists'
        },
        target: targetRef
      });
    }

    if (anyWhy.label.toLowerCase().includes('presupposition')) {
      actions.push({
        id: 'presup-challenge',
        kind: 'PRESUP_CHALLENGE',
        label: 'Presup?',
        force: 'NEUTRAL',
        group: 'bottom',
        scaffold: {
          template: 'The presupposition that [P] is questionable because...',
          analyticsName: 'scaffold:presupposition'
        },
        target: targetRef
      });
    }
  }

  return actions;
}
