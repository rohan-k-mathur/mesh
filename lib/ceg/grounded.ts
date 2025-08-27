// lib/ceg/grounded.ts
import { prisma } from '@/lib/prismaclient';

type Edge = { from: string; to: string; isAttack: boolean };
type Label = 'IN' | 'OUT' | 'UNDEC';

function groundedLabels(nodes: string[], edges: Edge[]): Map<string, Label> {
  // attackers map: claimId -> set of attackerIds
  const attackers = new Map<string, Set<string>>();
  nodes.forEach(n => attackers.set(n, new Set()));
  edges.forEach(e => {
    if (!e.isAttack) return;
    if (!attackers.has(e.to)) attackers.set(e.to, new Set());
    attackers.get(e.to)!.add(e.from);
  });

  const label = new Map<string, Label>();
  nodes.forEach(n => label.set(n, 'UNDEC'));

  let changed = true;
  while (changed) {
    changed = false;
    for (const n of nodes) {
      const atk = [...(attackers.get(n) ?? new Set())];
      const anyIn = atk.some(a => label.get(a) === 'IN');
      const allOut = atk.length === 0 || atk.every(a => label.get(a) === 'OUT');
      if (allOut && label.get(n) !== 'IN') { label.set(n, 'IN'); changed = true; continue; }
      if (anyIn && label.get(n) !== 'OUT') { label.set(n, 'OUT'); changed = true; continue; }
      // else stays UNDEC
    }
  }
  return label;
}

/**
 * Compute grounded labels for a deliberation's claims and persist ClaimLabel rows.
 * Edges count as ATTACK if (type='rebuts') OR (attackType in ['UNDERCUTS','UNDERMINES']).
 */
export async function recomputeGroundedForDelib(deliberationId?: string | null) {
  const claims = await prisma.claim.findMany({
    where: deliberationId ? { deliberationId } : {},
    select: { id: true },
  });
  const ids = claims.map(c => c.id);
  if (ids.length === 0) return { count: 0 };

  const edgesRaw = await prisma.claimEdge.findMany({
    where: deliberationId ? { deliberationId } : {},
    select: { fromClaimId: true, toClaimId: true, type: true, attackType: true },
  });

  const edges: Edge[] = edgesRaw.map(e => ({
    from: e.fromClaimId,
    to: e.toClaimId,
    isAttack: e.type === 'rebuts' || e.attackType === 'UNDERCUTS' || e.attackType === 'UNDERMINES',
  }));

  const labels = groundedLabels(ids, edges);

  // Build explanations (minimal: list current attackers labelled IN that force OUT)
  // and attackers of attackers causing IN.
  const attackersByTarget = new Map<string, string[]>();
  edges.forEach(e => {
    if (!e.isAttack) return;
    if (!attackersByTarget.has(e.to)) attackersByTarget.set(e.to, []);
    attackersByTarget.get(e.to)!.push(e.from);
  });

  const toUpsert = [...labels.entries()].map(([claimId, lab]) => {
    const atk = attackersByTarget.get(claimId) ?? [];
    const explain = {
      attackers: atk.map(id => ({ id, label: labels.get(id) })),
      note:
        lab === 'IN'
          ? 'All attackers are OUT'
          : lab === 'OUT'
          ? 'Has an attacker that is IN'
          : 'Neither condition holds',
    };
    return { claimId, label: lab, explainJson: explain };
  });

  // Upsert ClaimLabel (unique on claimId)
  for (const row of toUpsert) {
    await prisma.claimLabel.upsert({
      where: { claimId: row.claimId },
      update: {
        label: row.label as any,
        semantics: 'grounded',
        explainJson: row.explainJson as any,
        computedAt: new Date(),
        ...(deliberationId ? { deliberationId } : {}),
      },
      create: {
        claimId: row.claimId,
        semantics: 'grounded',
        label: row.label as any,
        explainJson: row.explainJson as any,
        computedAt: new Date(),
        ...(deliberationId ? { deliberationId } : {}),
      },
    });
  }

  return { count: ids.length };
}
