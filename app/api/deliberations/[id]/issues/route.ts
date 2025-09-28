// app/api/deliberations/[id]/issues/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prismaclient';
import { getCurrentUserId } from '@/lib/serverutils';
import { asUserIdString } from '@/lib/auth/normalize';
 import { emitBus } from '@/lib/server/bus';

const CreateBody = z.object({
  label: z.string().min(2).max(120),
  description: z.string().max(2000).optional(),
  links: z.array(z.string()).optional(), // argumentIds
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const uid = asUserIdString(userId);

  const deliberationId = params.id;
  const { label, description, links } = CreateBody.parse(await req.json());

  const issue = await prisma.issue.create({
    data: {
      deliberationId,
      label,
      description: description ?? null,
      createdById: uid,
      links: links?.length
        ? { createMany: { data: links.map((argumentId) => ({ argumentId })) } }
        : undefined,
    },
    include: { links: true, _count: { select: { links: true } } },
  });
  try { emitBus('issues:changed', { deliberationId }); } catch {}
  return NextResponse.json({ ok: true, issue });
}

// NEW: richer list with filters/search
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const deliberationId = params.id;
  const url = new URL(req.url);
  const state = (url.searchParams.get('state') || 'open') as 'open' | 'closed' | 'all';
  const search = url.searchParams.get('search') || '';
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') ?? '50'), 1), 200);
  const argumentId = url.searchParams.get('argumentId') || '';
  const claimId = url.searchParams.get('claimId') || '';
  const baseWhere: any = {
    deliberationId,
    ...(state !== 'all' ? { state } : {}),
    ...(search
      ? {
          OR: [
            { label: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

   let where: any = { ...baseWhere };
    if (argumentId) {
      where = { ...where, links: { some: { argumentId } } };
    } else if (claimId) {
      // find arguments that belong to this claim within the deliberation
      const args = await prisma.argument.findMany({
        where: { deliberationId, claimId },
        select: { id: true },
      });
      const argIds = args.map(a => a.id);
      if (argIds.length) {
        where = { ...where, links: { some: { argumentId: { in: argIds } } } };
      } else {
        // return empty list early if no arguments map to the claim
        return NextResponse.json({ ok: true, issues: [] });
      }
  }
  const list = await prisma.issue.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      links: true,
      _count: { select: { links: true } }, // comments can be added later
    },
  });

  return NextResponse.json({ ok: true, issues: list });
}
