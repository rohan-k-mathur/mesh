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

  // fetch current statuses with response data
  const statuses = await prisma.cQStatus.findMany({
    where: { 
      targetType: targetType as TargetType,
      targetId,
      schemeKey: { in: keys },
    },
    select: {
      id: true,
      schemeKey: true,
      cqKey: true,
      satisfied: true,
      groundsText: true,
      statusEnum: true,
      canonicalResponseId: true,
      canonicalResponse: {
        select: {
          id: true,
          groundsText: true,
          contributorId: true,
          upvotes: true,
          downvotes: true,
          createdAt: true,
        },
      },
      responses: {
        where: {
          responseStatus: { in: ["PENDING", "APPROVED", "CANONICAL"] },
        },
        select: {
          id: true,
          responseStatus: true,
        },
      },
    },
  });

  const statusMap = new Map<
    string,
    Map<
      string,
      {
        id: string; // ✅ CQStatus ID
        satisfied: boolean;
        groundsText?: string;
        statusEnum?: string;
        canonicalResponse?: any;
        pendingCount: number;
        approvedCount: number;
        totalResponseCount: number;
      }
    >
  >();
  keys.forEach((k) => statusMap.set(k, new Map()));
  statuses.forEach((s) => {
    const pendingCount = s.responses.filter((r) => r.responseStatus === "PENDING").length;
    const approvedCount = s.responses.filter(
      (r) => r.responseStatus === "APPROVED" || r.responseStatus === "CANONICAL"
    ).length;
    statusMap.get(s.schemeKey)?.set(s.cqKey, {
      id: s.id, // ✅ Include CQ status ID for frontend queries
      satisfied: s.satisfied,
      groundsText: s.groundsText ?? undefined,
      statusEnum: s.statusEnum,
      canonicalResponse: s.canonicalResponse,
      pendingCount,
      approvedCount,
      totalResponseCount: s.responses.length,
    });
  });

  const schemes = filtered.map((i) => {
    const key = i.scheme?.key ?? 'generic';
    const title = i.scheme?.title ?? key;

    // ✅ validate cq JSON here
    const parsedCqs = ArgCQArraySchema.safeParse(i.scheme?.cq ?? []);
    const cqs: ArgCQ[] = parsedCqs.success ? parsedCqs.data : [];

    const merged = cqs.map((cq) => {
      const status = statusMap.get(key)?.get(cq.key);
      return {
        id: status?.id, // Include CQStatus ID
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

// POST handler for legacy CQ satisfaction (backward compatibility)
const PostSchema = z.object({
  targetType: z.enum(['claim', 'argument']),
  targetId: z.string().min(1),
  schemeKey: z.string().min(1),
  cqKey: z.string().min(1),
  satisfied: z.boolean(),
  groundsText: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = PostSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { targetType, targetId, schemeKey, cqKey, satisfied, groundsText } = parsed.data;

    // Upsert CQStatus record
    const status = await prisma.cQStatus.upsert({
      where: {
        targetType_targetId_schemeKey_cqKey: {
          targetType: targetType as TargetType,
          targetId,
          schemeKey,
          cqKey,
        },
      },
      update: {
        satisfied,
        groundsText: groundsText ?? null,
        updatedAt: new Date(),
      },
      create: {
        targetType: targetType as TargetType,
        targetId,
        schemeKey,
        cqKey,
        satisfied,
        groundsText: groundsText ?? null,
        createdById: 'system', // TODO: Get from auth session
        statusEnum: satisfied ? 'SATISFIED' : 'OPEN',
      },
    });

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error('[POST /api/cqs] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update CQ status' },
      { status: 500 }
    );
  }
}
