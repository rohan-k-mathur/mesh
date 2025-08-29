// scripts/seed-demo-deliberation.ts
import 'dotenv/config';
import { prisma } from '@/lib/prismaclient';
import { maybeUpsertClaimEdgeFromArgumentEdge } from '@/lib/deepdive/claimEdgeHelpers';
import { recomputeGroundedForDelib } from '@/lib/ceg/grounded';

type SeedArg = {
  key: string; text: string; sources?: string[];
};
type SeedEdge = {
  from: string; to: string;
  kind: 'support'|'rebut'|'rebut_premise'|'undercut_inference';
};

async function ensureUser(email: string, name: string) {
  const u = await prisma.user.findFirst({ where: { email } });
  return u ?? prisma.user.create({ data: { email, name } });
}

export async function seedDeliberation(deliberationId: string) {
  // 0) test users for approvals
  const users = await Promise.all([
    ensureUser('demo1@example.com','Ada'),
    ensureUser('demo2@example.com','Bo'),
    ensureUser('demo3@example.com','Chen'),
    ensureUser('demo4@example.com','Dee'),
  ]);

  // 1) arguments
  const A: SeedArg[] = [
    { key: 'A1', text: 'Plurality can elect a Condorcet loser.' },
    { key: 'A2', text: 'Borda count is susceptible to rank manipulation.' },
    { key: 'A3', text: 'Arrow’s theorem shows no rank-order rule satisfies all four axioms.' },
    { key: 'A4', text: 'Condorcet cycles can occur in realistic electorates.' },
    { key: 'A5', text: 'Runoff reduces spoiler effects relative to plurality.' },
    { key: 'A6', text: 'IIA is a contentious normative requirement.' },
    { key: 'A7', text: 'Simplicity justifies plurality.' }, // foil
  ];

  const created: Record<string, { id: string }> = {};
  for (const a of A) {
    const arg = await prisma.argument.create({
      data: { deliberationId, authorId: users[0].id, text: a.text, mediaType: 'text' }
    });
    created[a.key] = { id: arg.id };
  }

  // 2) edges (argument-level)
  const E: SeedEdge[] = [
    { from: 'A3', to: 'A7', kind: 'rebut' },            // Arrow → rebut simplicity
    { from: 'A1', to: 'A7', kind: 'rebut' },            // Condorcet-loser → rebut simplicity
    { from: 'A2', to: 'A5', kind: 'rebut_premise' },    // undermine a premise in 'runoff reduces spoilers'
    { from: 'A6', to: 'A3', kind: 'undercut_inference' }, // undercut Arrow ⇒ “method is bad”
    { from: 'A4', to: 'A1', kind: 'support' },          // cycles support Condorcet-loser point
  ];

  const mapKind = (k: SeedEdge['kind']) =>
    k === 'support' ? { type: 'support' as const } :
    k === 'rebut' ? { type: 'rebut' as const, targetScope: 'conclusion' as const } :
    k === 'rebut_premise' ? { type: 'rebut' as const, targetScope: 'premise' as const } :
    { type: 'undercut' as const, targetScope: 'inference' as const };

  for (const e of E) {
    const fromArgumentId = created[e.from].id;
    const toArgumentId   = created[e.to].id;
    const { type, targetScope } = mapKind(e.kind);
    const edge = await prisma.argumentEdge.create({
      data: { deliberationId, fromArgumentId, toArgumentId, type, targetScope }
    });
    await maybeUpsertClaimEdgeFromArgumentEdge(edge.id);
  }

  // 3) promote arguments to claims (exercise route semantics)
  for (const key of Object.keys(created)) {
    const argId = created[key].id;
    const arg = await prisma.argument.findUnique({ where: { id: argId }, select: { claimId: true, text: true } });
    if (!arg?.claimId) {
      // simplest: directly create claim + back-link
      const claim = await prisma.claim.create({
        data: { deliberationId, text: arg!.text, createdById: String(users[0].id) }
      });
      await prisma.argument.update({ where: { id: argId }, data: { claimId: claim.id } });
      // materialize edges again (both ends now have claimId)
      const incident = await prisma.argumentEdge.findMany({
        where: { OR: [{ fromArgumentId: argId }, { toArgumentId: argId }] }, select: { id: true }
      });
      for (const ie of incident) await maybeUpsertClaimEdgeFromArgumentEdge(ie.id);
    }
  }

  // 4) approvals
  const allClaims = await prisma.claim.findMany({ where: { deliberationId } });
  for (const c of allClaims) {
    for (const u of users) {
      // sprinkle some approvals
      if (Math.random() < 0.55) {
        await prisma.argumentApproval.create({
          data: { deliberationId, argumentId: (await prisma.argument.findFirst({ where: { claimId: c.id }, select: { id: true } }))!.id, userId: u.id }
        });
      }
    }
  }

  // 5) recompute grounded + done
  await recomputeGroundedForDelib(deliberationId);
  console.log('Seeded demo deliberation:', deliberationId, { claims: allClaims.length });
}

if (require.main === module) {
  const id = process.argv[2];
  if (!id) throw new Error('Usage: tsx scripts/seed-demo-deliberation.ts <deliberationId>');
  seedDeliberation(id).then(() => process.exit(0));
}
