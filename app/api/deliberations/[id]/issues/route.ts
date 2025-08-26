import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth';
import { asUserIdString } from '@/lib/auth/normalize';

const CreateBody = z.object({
  label: z.string().min(2).max(120),
  description: z.string().max(2000).optional(),
  links: z.array(z.string()).optional(), // argumentIds
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId(); if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const uid = asUserIdString(userId);
  const deliberationId = params.id;
  const { label, description, links } = CreateBody.parse(await req.json());

  const issue = await prisma.issue.create({
    data: {
      deliberationId, label, description: description ?? null, createdById: uid,
      links: links?.length ? {
        createMany: { data: links.map(aid => ({ argumentId: aid })) }
      } : undefined
    },
    include: { links: true }
  });
  return NextResponse.json({ ok: true, issue });
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const deliberationId = params.id;
  const list = await prisma.issue.findMany({
    where: { deliberationId, state: 'open' },
    orderBy: { createdAt: 'desc' },
    include: { links: true }
  });
  return NextResponse.json({ ok: true, issues: list });
}
