// app/api/deliberations/[id]/issues/[issueId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prismaclient';
import { getCurrentUserId } from '@/lib/serverutils';
import { asUserIdString } from '@/lib/auth/normalize';
 import { emitBus } from '@/lib/server/bus';


const LinkBody = z.union([
  z.object({ argumentId: z.string().min(1), role: z.string().optional() }), // legacy
  z.object({ targetType: z.enum(['argument','claim','card','inference']), targetId: z.string().min(1), role: z.string().optional() })
]);
const PatchBody = z.object({
  state: z.enum(['open','pending','closed']).optional(),
  assigneeId: z.string().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: { id: string; issueId: string } }) {
  const issue = await prisma.issue.findUnique({
    where: { id: params.issueId },
    include: { links: { select: { targetType: true, targetId: true, role: true, argumentId: true } }, _count: { select: { links: true } } },
  });
  if (!issue || issue.deliberationId !== params.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true, issue, links: issue.links, commentCount: 0 });
}


// Link/Relink an argument
export async function POST(req: NextRequest, { params }: { params: { id: string; issueId: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const b = LinkBody.parse(await req.json());
  if ('argumentId' in b) {
    await prisma.issueLink.upsert({
      where: { issueId_argumentId: { issueId: params.issueId, argumentId: b.argumentId } },
      create: { issueId: params.issueId, argumentId: b.argumentId, targetType: 'argument', targetId: b.argumentId, role: b.role ?? 'related' },
      update: { role: b.role ?? 'related', targetType: 'argument', targetId: b.argumentId },
    });
  } else {
    await prisma.issueLink.upsert({
      where: { issueId_targetType_targetId: { issueId: params.issueId, targetType: b.targetType, targetId: b.targetId } } as any,
      create: { issueId: params.issueId, targetType: b.targetType, targetId: b.targetId, role: b.role ?? 'related', argumentId: b.targetType==='argument' ? b.targetId : null },
      update: { role: b.role ?? 'related' },
    });
  }
  try { emitBus('issues:changed', { deliberationId: params.id }); } catch {}
  return NextResponse.json({ ok: true });
}

// Close/Reopen
export async function PATCH(req: NextRequest, { params }: { params: { id: string; issueId: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const uid = asUserIdString(userId);
  const body = await req.json().catch(() => ({}));
  const { state, assigneeId } = PatchBody.parse(body ?? {});
  const nextState = state ?? undefined;
  const current = await prisma.issue.findUnique({ where: { id: params.issueId }, select: { deliberationId: true } });
  if (!current || current.deliberationId !== params.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updated = await prisma.issue.update({
    where: { id: params.issueId },
    data: {
      ...(nextState ? (
        nextState === 'closed'
          ? { state: 'closed', closedById: uid, closedAt: new Date() }
          : { state: nextState, ...(nextState==='open' ? { closedById: null, closedAt: null } : {}) }
      ) : {}),
      ...(assigneeId ? { assigneeId: BigInt(assigneeId) } : {}),
    },
  });

   try { emitBus('issues:changed', { deliberationId: params.id }); } catch {}
  return NextResponse.json({ ok: true, issue: updated });
}

// Optional: remove a link
export async function DELETE(req: NextRequest, { params }: { params: { id: string; issueId: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
const url = new URL(req.url);
   const argumentId = url.searchParams.get('argumentId') || '';
   const tt = url.searchParams.get('targetType') as any;
   const tid = url.searchParams.get('targetId') || '';
   if (!argumentId && !(tt && tid)) return NextResponse.json({ error: 'argumentId or (targetType,targetId) required' }, { status: 400 });

  const current = await prisma.issue.findUnique({ where: { id: params.issueId }, select: { deliberationId: true } });
  if (!current || current.deliberationId !== params.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

   if (argumentId) {
     await prisma.issueLink.delete({ where: { issueId_argumentId: { issueId: params.issueId, argumentId } } });
   } else {
     await prisma.issueLink.delete({ where: { issueId_targetType_targetId: { issueId: params.issueId, targetType: tt, targetId: tid } } } as any);
   }
  try { emitBus('issues:changed', { deliberationId: params.id }); } catch {}
  return NextResponse.json({ ok: true });
}