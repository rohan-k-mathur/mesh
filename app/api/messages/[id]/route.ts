import { NextRequest, NextResponse } from "next/server";
import { fetchMessages, sendMessage } from "@/lib/actions/message.actions";
import { ensureParticipant } from "../ensureParticipant";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const conversationId = BigInt(params.id);
  const userCheck = await ensureParticipant(req, conversationId);
  if (userCheck instanceof NextResponse) return userCheck;

  const cursorParam = req.nextUrl.searchParams.get("cursor");
  const limitParam = req.nextUrl.searchParams.get("limit");
  const cursor = cursorParam ? BigInt(cursorParam) : undefined;
  const limit = limitParam ? parseInt(limitParam, 10) : undefined;
  const messages = await fetchMessages({ conversationId, cursor, limit });
  return NextResponse.json(messages, { status: 200 });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const conversationId = BigInt(params.id);
  const userCheck = await ensureParticipant(req, conversationId);
  if (userCheck instanceof NextResponse) return userCheck;
  const { userId } = userCheck;

  const form = await req.formData();
  const text = form.get("text") as string | null;
  const files = form.getAll("files").filter(Boolean) as File[];
  const message = await sendMessage({
    conversationId,
    senderId: userId,
    text: text ?? undefined,
    files: files.length ? files : undefined,
  });
  return NextResponse.json(message, { status: 201 });
}
