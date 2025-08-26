import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth';
import { asUserIdString } from '@/lib/auth/normalize';

const LinkBody = z.object({ argumentId: z.string().min(1), role: z.string().optional() });

export async function POST(req: NextRequest, { params }: { params: { id: string, issueId: string } }) {
  const userId = await getCurrentUserId(); if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { argumentId, role } = LinkBody.parse(await req.json());
  await prisma.issueLink.upsert({
    where: { issueId_argumentId: { issueId: params.issueId, argumentId } },
    create: { issueId: params.issueId, argumentId, role: role ?? 'related' },
    update: { role: role ?? 'related' }
  });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string, issueId: string } }) {
  const userId = await getCurrentUserId(); if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const uid = asUserIdString(userId);
  const closed = await prisma.issue.update({
    where: { id: params.issueId },
    data: { state: 'closed', closedById: uid, closedAt: new Date() }
  });
  return NextResponse.json({ ok: true, issue: closed });
}
