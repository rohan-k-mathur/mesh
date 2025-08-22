// app/api/proposals/list/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prismaclient";
import { getUserFromCookies } from "@/lib/serverutils";

export const runtime = "nodejs";

const q = z.object({ rootMessageId: z.union([z.string(), z.number(), z.bigint()]).transform(v => BigInt(v)) });

export async function GET(req: NextRequest) {
  const me = await getUserFromCookies();
  if (!me?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rootMessageId } = q.parse(Object.fromEntries(new URL(req.url).searchParams.entries()));

  // Validate root + membership
  const root = await prisma.message.findUnique({
    where: { id: rootMessageId },
    select: { id: true, conversation_id: true },
  });
  if (!root) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Optional: ensure participant
  const part = await prisma.conversationParticipant.findFirst({
    where: { conversation_id: root.conversation_id, user_id: me.userId },
    select: { user_id: true },
  });
  if (!part) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // List proposal drifts for that root
  const drifts = await prisma.drift.findMany({
    where: { root_message_id: root.id, kind: "PROPOSAL" as any },
    orderBy: { created_at: "asc" },
    select: {
      id: true, title: true, created_at: true, updated_at: true,
      created_by: true, is_closed: true, is_archived: true,
    } as any,
  });

  // Attach author name (optional)
  const authorIds = [...new Set(drifts.map(d => (d as any).created_by).filter(Boolean))] as bigint[];
  const authors = authorIds.length
    ? await prisma.user.findMany({ where: { id: { in: authorIds } }, select: { id: true, name: true } })
    : [];
  const nameBy = new Map(authors.map(a => [a.id.toString(), a.name]));

  return NextResponse.json({
    items: drifts.map((d) => ({
      id: d.id.toString(),
      title: d.title || "Proposal",
      createdAt: (d as any).created_at ?? null,
      updatedAt: (d as any).updated_at ?? null,
      authorId: (d as any).created_by ? (d as any).created_by.toString() : null,
      authorName: (d as any).created_by ? (nameBy.get((d as any).created_by.toString()) ?? null) : null,
      isClosed: Boolean((d as any).is_closed),
      isArchived: Boolean((d as any).is_archived),
    })),
  });
}
