// app/api/discussions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { getCurrentUserId } from "@/lib/serverutils";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const {
    title = "Discussion",
    description = null,
    attachedToType = null,
    attachedToId = null,
    createConversation = true,
  } = body ?? {};

  const discussion = await prisma.$transaction(async (tx) => {
    let conversationId: number | null = null;

    if (createConversation) {
      const conv = await tx.conversation.create({ data: {} });
      conversationId = conv.id;

      // Ensure creator is a participant
      try {
        await (tx as any).conversationParticipant.upsert({
          where: {
            conversation_id_user_id: { conversation_id: BigInt(conv.id), user_id: userId },
          },
          update: {},
          create: {
            conversation_id: BigInt(conv.id),
            user_id: userId,
            joined_at: new Date(), // optional
          },
        });
      } catch (e: any) {
        try {
          await (tx as any).conversationParticipant.create({
            data: {
              conversation_id: BigInt(conv.id),
              user_id: userId,
              joined_at: new Date(),
            },
          });
        } catch (err: any) {
          if (err?.code !== "P2002") console.warn("[discussions] add participant failed:", err?.code || err);
        }
      }
    }

    return tx.discussion.create({
      data: {
        title,
        description,
        createdById: String(userId),
        attachedToType,
        attachedToId,
        conversationId,
      },
    });
  });

  return NextResponse.json({ discussion }, { status: 201 });
}
