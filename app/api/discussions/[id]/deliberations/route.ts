// app/api/discussions/[id]/deliberations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { getCurrentUserId } from "@/lib/serverutils";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const uid = await getCurrentUserId();
  if (!uid) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { deliberationId } = await req.json().catch(() => ({}));
  if (!deliberationId) return NextResponse.json({ error: "deliberationId required" }, { status: 400 });

  const row = await prisma.discussionDeliberation.upsert({
    where: { discussionId_deliberationId: { discussionId: params.id, deliberationId } },
    update: {},
    create: { discussionId: params.id, deliberationId, createdById: String(uid) },
  });
  return NextResponse.json({ link: row }, { status: 201 });
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const rows = await prisma.discussionDeliberation.findMany({
    where: { discussionId: params.id },
  });
  return NextResponse.json({ items: rows });
}
