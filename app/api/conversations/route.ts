// app/api/messages/[conversationId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { getUserFromCookies } from "@/lib/serverutils";
import { sendMessage, fetchMessages } from "@/lib/actions/message.actions";

const s = (b: bigint) => b.toString();

// ---------- GET: initial timeline page (include meta + driftId!) ----------
export async function GET(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const me = await getUserFromCookies();
    if (!me?.userId) return new NextResponse("Unauthorized", { status: 401 });

    const convId = BigInt(params.conversationId);
    // ensure membership
    const isMember = await prisma.conversationParticipant.findFirst({
      where: { conversation_id: convId, user_id: me.userId },
      select: { user_id: true },
    });
    if (!isMember) return new NextResponse("Forbidden", { status: 403 });

    const { searchParams } = new URL(req.url);
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
    const cursorStr = searchParams.get("cursor"); // older-than pagination (id DESC)
    const cursor = cursorStr ? BigInt(cursorStr) : undefined;

    const rows = await fetchMessages({ conversationId: convId, cursor, limit });
    const payload = rows.map((m) => ({
      id: s(m.id),
      text: m.text,
      createdAt: m.created_at.toISOString(),
      senderId: s(m.sender_id),
      isRedacted: m.is_redacted,
      meta: (m.meta as any) ?? null,        // ← include
      driftId: m.drift_id ? s(m.drift_id) : null, // ← include
      sender: { name: m.sender?.name ?? null, image: m.sender?.image ?? null },
      attachments: m.is_redacted
        ? []
        : m.attachments.map((a) => ({
            id: s(a.id),
            path: a.path,
            type: a.type,
            size: a.size,
          })),
    }));

    return NextResponse.json({ ok: true, messages: payload });
  } catch (e: any) {
    console.error("[GET /api/messages/:conversationId] error", e);
    return NextResponse.json({ ok: false, error: e?.message ?? "Internal error" }, { status: 500 });
  }
}

// ---------- POST: create message (plain OR drift/thread) ----------
export async function POST(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const me = await getUserFromCookies();
    if (!me?.userId) return new NextResponse("Unauthorized", { status: 401 });

    const convId = BigInt(params.conversationId);

    // ensure participant
    const isMember = await prisma.conversationParticipant.findFirst({
      where: { conversation_id: convId, user_id: me.userId },
      select: { user_id: true },
    });
    if (!isMember) return new NextResponse("Forbidden", { status: 403 });

    const form = await req.formData();
    const text = (form.get("text") as string | null) ?? null;
    const files = form.getAll("files").filter(Boolean) as File[];
    const clientId = (form.get("clientId") as string | null) ?? undefined;
    const driftIdIn = (form.get("driftId") as string | null) ?? null;

    let meta: any | undefined = undefined;
    const metaRaw = form.get("meta");
    if (typeof metaRaw === "string" && metaRaw.trim()) {
      try { meta = JSON.parse(metaRaw); } catch {}
    }

    const driftId = driftIdIn ? BigInt(driftIdIn) : undefined;

    // DEBUG (optional): you can keep this while validating:
    // console.log("[messages POST]", { conv: params.conversationId, driftId: driftIdIn, clientId });

    const saved = await sendMessage({
      senderId: me.userId,
      conversationId: convId,
      text: text ?? undefined,
      files: files.length ? files : undefined,
      driftId,
      clientId,
      meta,
    });

    return NextResponse.json({ ok: true, message: saved }, { status: 201 });
  } catch (e: any) {
    console.error("[POST /api/messages/:conversationId] error", e);
    return NextResponse.json({ ok: false, error: e?.message ?? "Internal error" }, { status: 500 });
  }
}
