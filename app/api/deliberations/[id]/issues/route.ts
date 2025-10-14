// app/api/deliberations/[id]/issues/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prismaclient";
import { getCurrentUserId } from "@/lib/serverutils";
import { asUserIdString } from "@/lib/auth/normalize";
import { emitBus } from "@/lib/server/bus";
import type { Prisma } from "@prisma/client";
import { IssueLinkRole, IssueLinkTargetType } from "@prisma/client";

const CreateBody = z.object({
  label: z.string().min(2).max(120),
  description: z.string().max(2000).optional(),
  links: z.array(z.string()).optional(), // legacy: argumentIds
  targets: z.array(z.object({
    type: z.enum(['argument','claim','card','inference']),
   id: z.string().min(1),
    role: z.string().optional(),
  })).optional(),
  kind: z.enum(['general','cq','moderation','evidence','structural','governance']).optional(),
  key: z.string().optional(), // e.g. cqKey
});


export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const uid = asUserIdString(userId);

  const deliberationId = params.id;
  const body = CreateBody.parse(await req.json());
  
    const linkCreates =
      body.targets?.map(t => ({
      targetType: t.type,
      targetId: t.id,
      role: (t.role ?? 'related') as any,
      argumentId: t.type === 'argument' ? t.id : null, // back‑compat
    })) ??
    body.links?.map(argumentId => ({
      targetType: 'argument' as const,
      targetId: argumentId,
      role: 'related' as const,
      argumentId,
    })) ?? [];

  const issue = await prisma.issue.create({
    data: {
      deliberationId,
      label: body.label,
      description: body.description ?? null,
      kind: body.kind ?? 'general',
      key: body.key ?? null,
      createdById: uid,
       ...(linkCreates.length ? { links: { createMany: { data: linkCreates } } } : {}),
    },
    include: { links: true, _count: { select: { links: true } } },
  });

  try { emitBus("issues:changed", { deliberationId }); } catch {}
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
  const cardId = url.searchParams.get('cardId') || '';
  const targetType = url.searchParams.get('targetType') as 'argument'|'claim'|'card'|'inference'|null;
  const targetId = url.searchParams.get('targetId') || '';
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

  // Direct polymorphic filter first (if provided)
  if (targetType && targetId) {
    where = { ...where, links: { some: { targetType, targetId } } };
  } else if (argumentId) {
    where = { ...where, links: { some: { argumentId } } };
  } else if (claimId) {
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
        } else if (cardId) {
      // map card -> claim -> arguments
      const card = await prisma.deliberationCard.findUnique({ where: { id: cardId }, select: { claimId: true } });
      if (card?.claimId) {
        const args = await prisma.argument.findMany({ where: { deliberationId, claimId: card.claimId }, select: { id: true } });
        where = { ...where, links: { some: { argumentId: { in: args.map(a=>a.id) } } } };
      } else {
        return NextResponse.json({ ok: true, issues: [] });
      }
  }
  const list = await prisma.issue.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      links: { select: { targetType: true, targetId: true, role: true, argumentId: true } },

      _count: { select: { links: true } }, // comments can be added later
    },
  });

  return NextResponse.json({ ok: true, issues: list });
}
}
