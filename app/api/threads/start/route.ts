// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prismaclient";
// import { getUserFromCookies } from "@/lib/serverutils";
// import { jsonSafe } from "@/lib/bigintjson";
// import { supabase } from "@/lib/supabaseclient";

// export async function POST(req: NextRequest) {
//   try {
//     const me = await getUserFromCookies();
//     if (!me?.userId) return new NextResponse("Unauthorized", { status: 401 });

//     const { conversationId, rootMessageId } = await req.json();
//     if (!conversationId || !rootMessageId) {
//       return NextResponse.json({ ok: false, error: "conversationId and rootMessageId required" }, { status: 400 });
//     }

//     const convoId = BigInt(conversationId);
//     const rootId  = BigInt(rootMessageId);

//     // Membership
//     const member = await prisma.conversationParticipant.findFirst({
//       where: { conversation_id: convoId, user_id: me.userId },
//       select: { id: true },
//     });
//     if (!member) return new NextResponse("Forbidden", { status: 403 });

//     // Root belongs to conversation?
//     const root = await prisma.message.findUnique({
//       where: { id: rootId },
//       select: { conversation_id: true },
//     });
//     if (!root || root.conversation_id !== convoId) {
//       return NextResponse.json({ ok: false, error: "Root not in conversation" }, { status: 400 });
//     }

//     const existing = await prisma.drift.findFirst({
//         where: { kind: "THREAD", root_message_id: rootId },
//       });
      
//       const d = existing ?? await prisma.drift.create({
//         data: {
//           conversation_id: convoId,
//           created_by: me.userId,
//           kind: "THREAD",
//           title: "Thread",
//           root_message_id: rootId,
//           anchor_message_id: rootId, // critical
//         },
//       });

//     const driftDto = {
//       id: d.id.toString(),
//       kind: "THREAD" as const,
//       conversationId: String(convoId),
//       title: "Thread",
//       isClosed: d.is_closed,
//       isArchived: d.is_archived,
//       messageCount: d.message_count,
//       lastMessageAt: d.last_message_at ? d.last_message_at.toISOString() : null,
//       anchorMessageId: rootId.toString(), // index by root
//     };

//     // Broadcast (no anchor bubble for threads)
//     await supabase.channel(`conversation-${conversationId}`).send({
//       type: "broadcast",
//       event: "drift_create",
//       payload: jsonSafe({ drift: driftDto }),
//     });

//     return NextResponse.json(jsonSafe({ ok: true, drift: driftDto }), { status: 201 });
//   } catch (e: any) {
//     console.error("[POST /api/threads/start] error", e);
//     return NextResponse.json({ ok: false, error: e?.message ?? "Internal error" }, { status: 500 });
//   }
// }
// app/api/threads/start/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { getUserFromCookies } from "@/lib/serverutils";
import { supabase } from "@/lib/supabaseclient";
import { jsonSafe } from "@/lib/bigintjson";

export async function POST(req: NextRequest) {
  try {
    const me = await getUserFromCookies();
    if (!me?.userId) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const convId = BigInt(body.conversationId);
    const rootId = BigInt(body.rootMessageId);

    // Ensure participant & message ownership in the conversation
    const msg = await prisma.message.findUnique({
      where: { id: rootId },
      select: { conversation_id: true },
    });
    if (!msg || msg.conversation_id !== convId)
      return NextResponse.json({ ok: false, error: "Invalid root" }, { status: 400 });

    const isMember = await prisma.conversationParticipant.findFirst({
      where: { conversation_id: convId, user_id: me.userId },
      select: { user_id: true },
    });
    if (!isMember) return new NextResponse("Forbidden", { status: 403 });

    // One thread per root
    const existing = await prisma.drift.findFirst({
      where: { kind: "THREAD", root_message_id: rootId },
    });
    const d = existing ?? (await prisma.drift.create({
      data: {
        conversation_id: convId,
        created_by: me.userId,
        kind: "THREAD",
        title: "Thread",
        root_message_id: rootId,
        anchor_message_id: rootId, // critical
      },
    }));

    // Broadcast so clients index it
    await supabase
      .channel(`conversation-${convId.toString()}`)
      .send({ type: "broadcast", event: "drift_create", payload: jsonSafe({ drift: d }) })
      .catch(() => {});

    return NextResponse.json({ ok: true, drift: jsonSafe(d) }, { status: existing ? 200 : 201 });
  } catch (e: any) {
    console.error("[POST /api/threads/start] error", e);
    return NextResponse.json({ ok: false, error: e?.message ?? "Internal error" }, { status: 500 });
  }
}
