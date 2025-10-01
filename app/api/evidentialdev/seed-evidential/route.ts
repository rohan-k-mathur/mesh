import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
import { $Enums } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function uid(n=6){ return Math.random().toString(36).slice(2,2+n); }
function nowSlug(s: string){ return `seed:${s}:${Date.now()}:${uid(4)}`; }

export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST(_req: NextRequest) {
  // 1) Create or reuse a deliberation
  let deliberationId: string;
  try {
    const hostTypeAny =
      (Object.values(($Enums as any)?.DeliberationHostType ?? {})[0] as any) ?? 'topic';
    const delib = await prisma.deliberation.create({
      data: {
        hostType: hostTypeAny,            // pick the first enum value available at runtime
        hostId: nowSlug('host'),
        createdById: 'system',
        rule: 'utilitarian' as any,       // safe default (enum default in your schema)
      },
      select: { id: true },
    });
    deliberationId = delib.id;
  } catch {
    // Fallback: reuse an existing room if enum mismatch prevents create
    const anyRoom = await prisma.deliberation.findFirst({ select: { id: true } });
    if (!anyRoom) {
      return NextResponse.json({ ok:false, error: 'No deliberations and cannot create one (hostType mismatch). Please set a valid DeliberationHostType.' }, { status: 500 });
    }
    deliberationId = anyRoom.id;
  }

  // 2) Claims φ, ψ (+ an assumption α used by A0)
  const phi = await prisma.claim.create({
    data: { id: undefined as any, text: 'φ: Seed claim — the policy is beneficial', createdById: 'system',
            moid: nowSlug('φ'), deliberationId },
    select: { id: true }
  });
  const psi = await prisma.claim.create({
    data: { text: 'ψ: Secondary seed claim', createdById: 'system',
            moid: nowSlug('ψ'), deliberationId },
    select: { id: true }
  });
  const alpha = await prisma.claim.create({
    data: { text: 'α: Background assumption holds', createdById: 'system',
            moid: nowSlug('α'), deliberationId },
    select: { id: true }
  });

  // 3) Arguments: concluding A0 for φ; premises P1,P2; atomic A1 for φ; atomic B1 for ψ
  const A0 = await prisma.argument.create({
    data: {
      deliberationId, authorId: 'system',
      text: 'A0: Main case for φ (composed)',
      claimId: phi.id
    }, select: { id: true }
  });
  const P1 = await prisma.argument.create({
    data: { deliberationId, authorId:'system', text: 'P1: first premise' },
    select: { id: true }
  });
  const P2 = await prisma.argument.create({
    data: { deliberationId, authorId:'system', text: 'P2: second premise' },
    select: { id: true }
  });
  const A1 = await prisma.argument.create({
    data: { deliberationId, authorId:'system', text: 'A1: Atomic support for φ', claimId: phi.id },
    select: { id: true }
  });
  const B1 = await prisma.argument.create({
    data: { deliberationId, authorId:'system', text: 'B1: Weak atomic support for ψ', claimId: psi.id },
    select: { id: true }
  });

  // 4) Premise edges (argument → argument)
  await prisma.argumentEdge.createMany({
    data: [
      { deliberationId, fromArgumentId: P1.id, toArgumentId: A0.id, type: 'support' as any, createdById: 'system' },
      { deliberationId, fromArgumentId: P2.id, toArgumentId: A0.id, type: 'support' as any, createdById: 'system' },
    ],
    skipDuplicates: true
  });

  // 5) Materialized ArgumentSupport (base snapshots)
  await prisma.argumentSupport.createMany({
    data: [
      { deliberationId, claimId: phi.id, argumentId: A0.id, mode:'product', strength: 0.62, base: 0.62, composed: true, rationale: 'seed' },
      { deliberationId, claimId: phi.id, argumentId: A1.id, mode:'product', strength: 0.35, base: 0.35, composed: false, rationale: 'seed' },
      { deliberationId, claimId: psi.id, argumentId: B1.id, mode:'product', strength: 0.28, base: 0.28, composed: false, rationale: 'seed' },
    ] as any,
    skipDuplicates: true
  });

  // 6) AssumptionUse on A0
  await prisma.assumptionUse.create({
    data: {
      deliberationId,
      argumentId: A0.id,
      id: alpha.id,
      role: 'default',
      weight: 0.75,
      metaJson: { note: 'seed' }
    }
  });

  return NextResponse.json({
    ok: true,
    deliberationId,
    urls: {
      evidential_product: `/api/deliberations/${deliberationId}/evidential?mode=product`,
      evidential_min:     `/api/deliberations/${deliberationId}/evidential?mode=min`,
      graph_gate:         `/api/deliberations/${deliberationId}/graph?semantics=preferred&confidence=0.6&mode=product`,
      sheet:              `/api/sheets/delib:${deliberationId}`,
    },
    created: {
      claims: [phi.id, psi.id],
      arguments: { A0: A0.id, P1: P1.id, P2: P2.id, A1: A1.id, B1: B1.id }
    }
  }, { headers: { 'Cache-Control': 'no-store' }});
}
