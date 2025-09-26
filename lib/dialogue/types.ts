export type MoveKind = 'ASSERT'|'WHY'|'GROUNDS'|'RETRACT'|'CLOSE';
export type MoveForce = 'ATTACK'|'SURRENDER'|'NEUTRAL';

// We treat "concede" as ASSERT with a marker
export function isConcedePayload(p?: any): boolean {
  return !!p && p.as === 'CONCEDE';
}

export function classifyForce(kind: MoveKind, payload?: any): MoveForce {
  if (kind === 'WHY') return 'ATTACK';
  if (kind === 'GROUNDS') return 'ATTACK';            // attack was raised, answer keeps branch live until closed
  if (kind === 'RETRACT') return 'SURRENDER';
  if (kind === 'CLOSE') return 'SURRENDER';
  if (kind === 'ASSERT' && isConcedePayload(payload)) return 'SURRENDER';
  return 'NEUTRAL';
}
