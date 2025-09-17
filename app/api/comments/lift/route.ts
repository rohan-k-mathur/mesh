// app/api/comments/lift/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { getCurrentUserId } from "@/lib/serverutils";
import { emitBus } from "@/lib/bus";

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { commentId, hostType, hostId, as = "claim" } = await req.json(); // as: "claim"|"argument"
  if (!commentId || !hostType || !hostId) return NextResponse.json({ error: "commentId, hostType, hostId required" }, { status: 400 });

  // ensure deliberation
  const d = await prisma.deliberation.upsert({
    where: { hostType_hostId: { hostType, hostId } } as any, // If you don't have this compound index, findFirst+create instead
    update: {},
    create: { hostType, hostId, createdById: String(userId) },
    select: { id: true },
  });

  const comment = await prisma.feedPost.findUnique({ where: { id: BigInt(commentId) }, select: { content: true } });
  if (!comment) return NextResponse.json({ error: "Comment not found" }, { status: 404 });

  // make a claim from the comment text
  const claim = await prisma.claim.create({
    data: { text: comment.content.slice(0, 4000), createdById: String(userId), moid: `cm-${commentId}-${Date.now()}`, deliberationId: d.id },
    select: { id: true, text: true },
  });

  // assert move
  await prisma.dialogueMove.create({
    data: {
      deliberationId: d.id,
      targetType: "claim",
      targetId: claim.id,
      kind: "ASSERT",
      payload: { text: claim.text },
      actorId: String(userId),
      signature: `lift:${commentId}:${Date.now()}`,
    },
  });

  // traceability
  await prisma.xRef.create({ data: { fromType: "comment", fromId: String(commentId), toType: "claim", toId: claim.id, relation: "originates-from" } });

  emitBus("deliberations:created", { deliberationId: d.id, liftedFrom: { type: "comment", id: commentId } });
  return NextResponse.json({ deliberationId: d.id, claimId: claim.id });
}
