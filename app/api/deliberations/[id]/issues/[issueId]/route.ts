// app/api/deliberations/[id]/issues/[issueId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prismaclient';
import { getCurrentUserId } from '@/lib/serverutils';
import { asUserIdString } from '@/lib/auth/normalize';

const LinkBody = z.object({ argumentId: z.string().min(1), role: z.string().optional() });
const PatchBody = z.object({ state: z.enum(['open','closed']).optional() });

export async function GET(_req: NextRequest, { params }: { params: { id: string; issueId: string } }) {
  const issue = await prisma.issue.findUnique({
    where: { id: params.issueId },
    include: {
      links: { select: { argumentId: true, role: true } },
      _count: { select: { links: true } },
    },
  });
  if (!issue) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true, issue, links: issue.links, commentCount: 0 });
}

// Link/Relink an argument
export async function POST(req: NextRequest, { params }: { params: { id: string; issueId: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { argumentId, role } = LinkBody.parse(await req.json());
  await prisma.issueLink.upsert({
    where: { issueId_argumentId: { issueId: params.issueId, argumentId } },
    create: { issueId: params.issueId, argumentId, role: role ?? 'related' },
    update: { role: role ?? 'related' },
  });
  return NextResponse.json({ ok: true });
}

// Close/Reopen
export async function PATCH(req: NextRequest, { params }: { params: { id: string; issueId: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const uid = asUserIdString(userId);
  const body = await req.json().catch(() => ({}));
  const { state } = PatchBody.parse(body ?? {});
  const nextState = state ?? 'closed';

  const updated = await prisma.issue.update({
    where: { id: params.issueId },
    data:
      nextState === 'closed'
        ? { state: 'closed', closedById: uid, closedAt: new Date() }
        : { state: 'open', closedById: null, closedAt: null },
  });

  return NextResponse.json({ ok: true, issue: updated });
}

// Optional: remove a link
export async function DELETE(req: NextRequest, { params }: { params: { id: string; issueId: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const url = new URL(req.url);
  const argumentId = url.searchParams.get('argumentId') || '';
  if (!argumentId) return NextResponse.json({ error: 'argumentId required' }, { status: 400 });

  await prisma.issueLink.delete({
    where: { issueId_argumentId: { issueId: params.issueId, argumentId } },
  });

  return NextResponse.json({ ok: true });
}
