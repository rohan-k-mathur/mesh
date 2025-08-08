import { NextRequest, NextResponse } from "next/server";
import { getUserFromCookies } from "@/lib/serverutils";
import { getOrCreateDM } from "@/lib/actions/conversation.actions";
import { jsonSafe } from "@/lib/bigintjson";
export async function POST(req: NextRequest) {
  const user = await getUserFromCookies();
  if (!user?.userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const { targetUserId } = await req.json();
  const conversation = await getOrCreateDM({
    userAId: user.userId,
    userBId: BigInt(targetUserId),
  });
  return NextResponse.json(jsonSafe({ id: conversation.id }), { status: 200 });
}
