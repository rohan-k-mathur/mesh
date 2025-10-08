// packages/aif-core/src/invariants.ts
import type { AifGraph } from './types';
import { assertCreateArgumentLegality, assertAttackLegality } from './guards';

/** Minimal, fast structural checks to keep graphs AIF-legal. */
export function validateAifGraph(g: AifGraph) {
  const errors: string[] = [];

  const claimIds = new Set(g.claims.map(c => c.id));
  const argById = new Map(g.arguments.map(a => [a.id, a]));

  for (const a of g.arguments) {
    try {
      assertCreateArgumentLegality({
        deliberationId: 'graph',
        authorId: 'graph',
        conclusionClaimId: a.conclusionClaimId,
        premiseClaimIds: a.premiseClaimIds,
        schemeId: a.schemeKey ?? null,
        implicitWarrant: a.implicitWarrant,
      });
    } catch (e: any) {
      errors.push(`Argument ${a.id} illegal: ${e.message}`);
    }

    if (!claimIds.has(a.conclusionClaimId)) {
      errors.push(`Argument ${a.id} conclusionClaimId missing/unknown`);
    }
    for (const pid of a.premiseClaimIds) {
      if (!claimIds.has(pid)) errors.push(`Argument ${a.id} premise missing/unknown ${pid}`);
      if (pid === a.conclusionClaimId) errors.push(`Argument ${a.id} uses conclusion as a premise`);
    }
  }

  for (const at of g.attacks) {
    try {
      assertAttackLegality({
        deliberationId: 'graph',
        createdById: 'graph',
        fromArgumentId: at.fromArgumentId,
        attackType: at.attackType,
        targetScope: at.targetScope,
        toArgumentId: at.toArgumentId ?? undefined,
        targetClaimId: at.targetClaimId ?? undefined,
        targetPremiseId: at.targetPremiseId ?? undefined,
        cqKey: at.cqKey ?? null
      });
    } catch (e: any) {
      errors.push(`Attack ${at.id} illegal: ${e.message}`);
    }
    if (at.targetScope === 'premise' && at.toArgumentId) {
      // undermines should hit an actual premise of target RA
      const target = argById.get(at.toArgumentId);
      if (!target) errors.push(`Attack ${at.id} targets missing RA ${at.toArgumentId}`);
      const prem = at.targetPremiseId;
      if (target && prem && !target.premiseClaimIds.includes(prem)) {
        errors.push(`Attack ${at.id} undermines non-premise ${prem} on RA ${at.toArgumentId}`);
      }
    }
  }

  return { ok: errors.length === 0, errors };
}
