// app/api/works/[id]/pascal/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prismaclient';
import { getUserFromCookies } from '@/lib/serverutils';
import { canEditWorkOrClaimOrphan } from '@/lib/permissions/canEditWork';

export const dynamic = 'force-dynamic';

const Proposition = z.object({ id: z.string(), statement: z.string() });
const Action = z.object({ id: z.string(), label: z.string() });
const Utilities = z.record(z.string(), z.record(z.string(), z.number())); // aId -> wId -> u

const Body = z.object({
  propositions: z.array(Proposition),
  actions: z.array(Action),
  utilities: Utilities,
  assumption: z.string().nullable().optional(),
  method: z.enum(['laplace','minimax','regret']),
});

export async function GET(_req: NextRequest, { params }:{ params:{ id:string }}) {
  const pascal = await prisma.workPascalModel.findUnique({ where: { workId: params.id }});
  return NextResponse.json({ ok:true, pascal: pascal ?? null });
}

export async function PUT(req: NextRequest, { params }:{ params:{ id:string }}) {
  const user = await getUserFromCookies();
  if (!user?.userId) return NextResponse.json({ error:'Unauthorized' }, { status: 401 });

  const work = await prisma.theoryWork.findUnique({ where: { id: params.id }});
  if (!work) return NextResponse.json({ error:'Work not found' }, { status: 404 });
  const perm = await canEditWorkOrClaimOrphan(params.id, String(user.userId));
  if (!perm.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const j = await req.json();
  const parsed = Body.safeParse(j);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const saved = await prisma.workPascalModel.upsert({
    where: { workId: params.id },
    create: { workId: params.id, ...parsed.data, decision: { method: parsed.data.method } as any },
    update: { ...parsed.data, decision: { method: parsed.data.method } as any },
  });
  return NextResponse.json({ ok:true, pascal: saved });
}
