// scripts/backfillArgumentSupport.ts
import { prisma } from '@/lib/prismaclient';

/**
 * Heuristic: base confidence for an argument promoting a claim.
 * - start from argument.confidence (0..1) if present, else 0.55
 * - n approvals ⇒ gentle lift; cap at 0.9
 */
function computeBase(conf?: number|null, approvals = 0) {
  const start = conf == null ? 0.55 : Math.max(0, Math.min(1, conf));
  const lift  = Math.log1p(approvals) * 0.08;           // ~ +0.08..0.20 typical
  return Math.min(0.9, +(start + lift).toFixed(3));
}

async function main() {
  const args = await prisma.argument.findMany({
    where: { claimId: { not: null } },
    select: { id:true, deliberationId:true, claimId:true, confidence:true }
  });

  if (!args.length) {
    console.log('No arguments with claimId found — nothing to backfill.');
    return;
  }

  // approvals per argument (if present in your schema)
  const approvals = await prisma.argumentApproval.groupBy({
    by: ['argumentId'],
    _count: { argumentId: true },
    where: { argumentId: { in: args.map(a => a.id) } }
  }).catch(()=>[] as any[]);
  const countBy = new Map(approvals.map(r => [r.argumentId, r._count.argumentId as number]));

  let created = 0, updated = 0;
  for (const a of args) {
    const base = computeBase(a.confidence as number|undefined, countBy.get(a.id) ?? 0);
    const existing = await prisma.argumentSupport.findFirst({
      where: { deliberationId: a.deliberationId, claimId: a.claimId!, argumentId: a.id },
      select: { id:true }
    }).catch(()=>null);

    if (existing) {
      await prisma.argumentSupport.update({
        where: { id: existing.id },
        data: { base }
      });
      updated++;
    } else {
      await prisma.argumentSupport.create({
        data: {
          deliberationId: a.deliberationId,
          claimId: a.claimId!,
          argumentId: a.id,
          base,
        }
      });
      created++;
    }
  }
  console.log(`ArgumentSupport backfill — created: ${created}, updated: ${updated}`);
}

main().catch(e => { console.error(e); process.exit(1); });
