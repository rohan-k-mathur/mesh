import { NextResponse } from "next/server";
import { createPoll } from "@/lib/actions/poll.actions";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const poll = await createPoll({
      conversationId: BigInt(body.conversationId),
      messageId: BigInt(body.messageId),
      kind: body.kind,
      options: body.options,
    });
    return NextResponse.json({
      ok: true,
      poll: {
        ...poll,
        id: String(poll.id),
        conversationId: String(poll.conversation_id),
        messageId: String(poll.message_id),
        createdById: String(poll.created_by_id),
        kind: poll.kind,
        options: poll.options ?? undefined,
        maxOptions: poll.max_options,
        closesAt: poll.closes_at ? poll.closes_at.toISOString() : null,
        anonymous: poll.anonymous,
        createdAt: poll.created_at.toISOString(),
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}
