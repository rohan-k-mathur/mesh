import { NextRequest, NextResponse } from "next/server";
import { getUserFromCookies } from "@/lib/serverutils";
import { fetchMessages, sendMessage, fetchConversation } from "@/lib/actions/message.actions";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromCookies();
  if (!user?.userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const conversationId = BigInt(params.id);
  const conv = await fetchConversation({ conversationId });
  if (!conv || (conv.user1_id !== user.userId && conv.user2_id !== user.userId)) {
    return new NextResponse("Not Found", { status: 404 });
  }
  const messages = await fetchMessages({ conversationId });
  return NextResponse.json(messages);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromCookies();
  if (!user?.userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const conversationId = BigInt(params.id);
  const conv = await fetchConversation({ conversationId });
  if (!conv || (conv.user1_id !== user.userId && conv.user2_id !== user.userId)) {
    return new NextResponse("Not Found", { status: 404 });
  }
  const { text } = await req.json();
  await sendMessage({ conversationId, senderId: user.userId, text, path: `/messages/${params.id}` });
  return NextResponse.json({ status: "ok" });
}
