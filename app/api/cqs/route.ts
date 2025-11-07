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
      // @ts-expect-error - groundsText exists in schema but Prisma types may be cached
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
        whyCount: number; // Phase 8: Dialogue move counts
        groundsCount: number; // Phase 8: Dialogue move counts
      }
    >
  >();
  keys.forEach((k) => statusMap.set(k, new Map()));
  
  // Phase 8: Fetch DialogueMove counts for each CQ
  const dialogueMoves = await prisma.dialogueMove.findMany({
    where: {
      targetType: targetType as TargetType,
      targetId,
    },
    select: {
      kind: true,
      payload: true,
    },
  });

  // Build counts map: schemeKey -> cqKey -> { whyCount, groundsCount }
  const dialogueCountsMap = new Map<string, Map<string, { whyCount: number; groundsCount: number }>>();
  
  for (const move of dialogueMoves) {
    const payload = move.payload as any;
    const cqKey = payload?.cqKey;
    if (!cqKey) continue;

    // Infer schemeKey from statuses (we need to match cqKey to schemeKey)
    for (const [schemeKey, cqMap] of statusMap) {
      if (cqMap.has(cqKey)) {
        if (!dialogueCountsMap.has(schemeKey)) {
          dialogueCountsMap.set(schemeKey, new Map());
        }
        if (!dialogueCountsMap.get(schemeKey)!.has(cqKey)) {
          dialogueCountsMap.get(schemeKey)!.set(cqKey, { whyCount: 0, groundsCount: 0 });
        }
        
        const counts = dialogueCountsMap.get(schemeKey)!.get(cqKey)!;
        if (move.kind === 'WHY') {
          counts.whyCount++;
        } else if (move.kind === 'GROUNDS') {
          counts.groundsCount++;
        }
      }
    }
  }
  
  statuses.forEach((s) => {
    // @ts-expect-error - Prisma types may be cached, these fields exist in schema
    const pendingCount = s.responses.filter((r: any) => r.responseStatus === "PENDING").length;
    // @ts-expect-error - Prisma types may be cached, these fields exist in schema
    const approvedCount = s.responses.filter(
      (r: any) => r.responseStatus === "APPROVED" || r.responseStatus === "CANONICAL"
    ).length;
    
    // Phase 8: Get dialogue move counts for this CQ
    const dialogueCounts = dialogueCountsMap.get(s.schemeKey)?.get(s.cqKey) ?? { whyCount: 0, groundsCount: 0 };
    
    statusMap.get(s.schemeKey)?.set(s.cqKey, {
      id: s.id, // ✅ Include CQ status ID for frontend queries
      satisfied: s.satisfied,
      // @ts-expect-error - Prisma types may be cached, these fields exist in schema
      groundsText: s.groundsText ?? undefined,
      // @ts-expect-error - Prisma types may be cached, these fields exist in schema
      statusEnum: s.statusEnum,
      // @ts-expect-error - Prisma types may be cached, these fields exist in schema
      canonicalResponse: s.canonicalResponse,
      pendingCount,
      approvedCount,
      // @ts-expect-error - Prisma types may be cached, these fields exist in schema
      totalResponseCount: s.responses.length,
      whyCount: dialogueCounts.whyCount, // Phase 8
      groundsCount: dialogueCounts.groundsCount, // Phase 8
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
        // @ts-expect-error - Prisma types may be cached, groundsText exists in schema
        groundsText: groundsText ?? null,
        updatedAt: new Date(),
      },
      create: {
        targetType: targetType as TargetType,
        targetId,
        schemeKey,
        cqKey,
        satisfied,
        // @ts-expect-error - Prisma types may be cached, groundsText exists in schema
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
