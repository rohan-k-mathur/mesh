import { NextRequest, NextResponse } from "next/server";
import { getUserFromCookies } from "@/lib/serverutils";
import { getOrCreateConversation } from "@/lib/actions/message.actions";

export async function POST(req: NextRequest) {
  const user = await getUserFromCookies();
  if (!user?.userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const { targetUserId } = await req.json();
  const conversation = await getOrCreateConversation({
    userId: user.userId,
    targetUserId: BigInt(targetUserId),
  });
  return NextResponse.json({ id: conversation.id });
}
