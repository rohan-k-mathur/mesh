// app/api/comments/lift/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { getCurrentUserId } from "@/lib/serverutils";
import { emitBus } from "@/lib/server/bus";
import { DeliberationHostType } from "@prisma/client";

function normalizeHostType(input: string): DeliberationHostType {
  // happy path
  if (Object.values(DeliberationHostType).includes(input as DeliberationHostType)) {
    return input as DeliberationHostType;
  }
  // aliases
  if (input === "stack" || input === "stacks" || input === "library") {
    return DeliberationHostType.library_stack; // ← adjust if your enum literal differs
  }
  // last-resort default
  return DeliberationHostType.library_stack;
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    const { commentId, hostType, hostId, as = "claim" } = await req.json();
    if (!commentId || !hostType || !hostId) {
      return NextResponse.json({ error: "commentId, hostType, hostId required" }, { status: 400 });
    }
    if (as !== "claim") return NextResponse.json({ error: "Unsupported lift type" }, { status: 400 });

    const hostTypeEnum = normalizeHostType(String(hostType));
    const hostIdStr = String(hostId);

    // find-or-create (works even before you add/clean the unique)
    let d = await prisma.deliberation.findFirst({
      where: { hostType: hostTypeEnum, hostId: hostIdStr },
      select: { id: true },
    });
    if (!d) {
      d = await prisma.deliberation.create({
        data: { hostType: hostTypeEnum, hostId: hostIdStr, createdById: String(userId) },
        select: { id: true },
      });
    }

    const post = await prisma.feedPost.findUnique({
      where: { id: BigInt(commentId) },
      select: { content: true },
    });
    if (!post) return NextResponse.json({ error: "Comment not found" }, { status: 404 });

    const text = (post.content ?? "").trim();
    if (!text) return NextResponse.json({ error: "Cannot lift an empty comment" }, { status: 400 });

    const claim = await prisma.claim.create({
      data: {
        text: text.slice(0, 4000),
        createdById: String(userId),
        moid: `cm-${commentId}-${Date.now()}`,
        deliberationId: d.id,
      },
      select: { id: true, text: true },
    });

    const move = await prisma.dialogueMove.create({
      data: {
        deliberationId: d.id,
        targetType: "claim",
        targetId: claim.id,
        kind: "ASSERT",
        payload: { text: claim.text },
        actorId: String(userId),
        signature: `lift:${commentId}:${Date.now()}`,
      },
      select: { id: true },
    });

    // if you've added the XRef model, you can safely enable this:
    // await prisma.xRef.create({ data: { fromType: "comment", fromId: String(commentId), toType: "claim", toId: claim.id, relation: "originates-from" } });

    emitBus("deliberations:created", { id: d.id, deliberationId: d.id, hostType: hostTypeEnum, hostId: hostIdStr, source: "lift" });
    emitBus("dialogue:moves:refresh", { moveId: move.id, deliberationId: d.id, kind: "ASSERT" });

    return NextResponse.json({ deliberationId: d.id, claimId: claim.id });
  } catch (e) {
    console.error("lift error", e);
    return NextResponse.json({ error: "Lift failed" }, { status: 500 });
  }
}
