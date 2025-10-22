import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
import { z } from 'zod';
import crypto from 'node:crypto';
import { suggestionForCQ } from '@/lib/argumentation/cqSuggestions';
import { ArgCQArraySchema, ArgCQ } from '@/lib/types/argument';
import { TargetType } from '@prisma/client';
import { T } from 'tldraw';
const QuerySchema = z.object({
  targetType: z.enum(['claim', 'argument']),
  targetId: z.string().min(1),
  scheme: z.string().min(1).optional(),
});

export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  // ✅ validate query params first
  const parsed = QuerySchema.safeParse({
    targetType: url.searchParams.get('targetType') ?? '',
    targetId: url.searchParams.get('targetId') ?? '',
    scheme: url.searchParams.get('scheme') ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { targetType, targetId, scheme: filterScheme } = parsed.data;

  // fetch scheme instances
  const instances = await prisma.schemeInstance.findMany({
    where: { targetType, targetId },
    select: {
      scheme: { select: { key: true, title: true, cq: true } },
    },
  });

  // optional filter by scheme
  const filtered = filterScheme
    ? instances.filter((i) => i.scheme?.key === filterScheme)
    : instances;

  const keys = filtered
    .map((i) => i.scheme?.key)
    .filter(Boolean) as string[];

  // fetch current statuses
  const statuses = await prisma.cQStatus.findMany({
    where: { targetType , targetId, schemeKey: { in: keys } },
    select: { schemeKey: true, cqKey: true, satisfied: true, groundsText: true },
  });

  const statusMap = new Map<string, Map<string, { satisfied: boolean; groundsText?: string }>>();
  keys.forEach((k) => statusMap.set(k, new Map()));
  statuses.forEach((s) => 
    statusMap.get(s.schemeKey)?.set(s.cqKey, { 
      satisfied: s.satisfied, 
      groundsText: s.groundsText ?? undefined 
    })
  );

  const schemes = filtered.map((i) => {
    const key = i.scheme?.key ?? 'generic';
    const title = i.scheme?.title ?? key;

    // ✅ validate cq JSON here
    const parsedCqs = ArgCQArraySchema.safeParse(i.scheme?.cq ?? []);
    const cqs: ArgCQ[] = parsedCqs.success ? parsedCqs.data : [];

    const merged = cqs.map((cq) => {
      const status = statusMap.get(key)?.get(cq.key);
      return {
        key: cq.key,
        text: cq.text,
        satisfied: status?.satisfied ?? false,
        groundsText: status?.groundsText, // Include stored grounds text
        suggestion: suggestionForCQ(key, cq.key),
      };
    });

    return { key, title, cqs: merged };
  });

  // ETag handling
  const body = { targetType, targetId, schemes };
  const etag = crypto
    .createHash('sha1')
    .update(JSON.stringify(body))
    .digest('base64');

  const ifNoneMatch = req.headers.get('if-none-match');
  if (ifNoneMatch && ifNoneMatch === etag) {
    return new NextResponse(null, {
      status: 304,
      headers: { ETag: etag, 'Cache-Control': 'private, max-age=30, must-revalidate' },
    });
  }

  return NextResponse.json(body, {
    headers: { ETag: etag, 'Cache-Control': 'private, max-age=30, must-revalidate' },
  });
}
