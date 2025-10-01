// app/api/_dev/seed-evidential/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';

export async function POST() {
  // create a throwaway deliberation
  const d = await prisma.deliberation.create({
    data: { hostType: 'discussion', hostId: 'seed', createdById: 'system' }
  });

  const c = await prisma.claim.create({
    data: { text: 'φ: The city should add protected bike lanes on Maple Ave.', deliberationId: d.id, createdById: 'system', moid: `seed:${Date.now()}` }
  });

  // two supporting arguments with different approvals → different base scores
  const a1 = await prisma.argument.create({ data: { deliberationId: d.id, authorId: 'system', text: 'P1: Lanes reduce injuries by ~45%.', claimId: c.id } });
  const a2 = await prisma.argument.create({ data: { deliberationId: d.id, authorId: 'system', text: 'P2: Heavy school traffic on Maple.', claimId: c.id } });

  await prisma.argumentApproval.createMany({
    data: [
      { deliberationId: d.id, argumentId: a1.id, userId: 'u1' },
      { deliberationId: d.id, argumentId: a1.id, userId: 'u2' },
      { deliberationId: d.id, argumentId: a2.id, userId: 'u3' }
    ],
    skipDuplicates: true
  });

  // seed ArgumentSupport (atomic base == initial strength)
  await prisma.argumentSupport.createMany({
    data: [
      { deliberationId: d.id, claimId: c.id, argumentId: a1.id, mode: 'product', base: 0.72, strength: 0.72 },
      { deliberationId: d.id, claimId: c.id, argumentId: a2.id, mode: 'product', base: 0.63, strength: 0.63 }
    ],
    skipDuplicates: true
  });

  return NextResponse.json({ ok: true, deliberationId: d.id, claimId: c.id });
}
