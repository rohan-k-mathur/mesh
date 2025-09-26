import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prismaclient";

const Q = z.object({
  deliberationId: z.string().min(5),
  participantId: z.string().optional(),
  activeOnly: z.string().optional().transform(v => v === 'true'),
});

export async function GET(req: NextRequest) {
  const parsed = Q.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  if (!parsed.success) return NextResponse.json({ ok:false, error: parsed.error.flatten() }, { status: 400 });

  const { deliberationId, participantId, activeOnly } = parsed.data;

  const where: any = { deliberationId, ...(participantId ? { participantId } : {}) };
  if (activeOnly) where.isRetracted = false;

  const items = await prisma.commitment.findMany({
    where,
    orderBy: [{ participantId: 'asc' }, { createdAt: 'desc' }],
  });

  return NextResponse.json({ ok:true, items }, { headers: { 'Cache-Control': 'no-store' } });
}
