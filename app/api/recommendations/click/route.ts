import { NextRequest, NextResponse } from "next/server";
import { getUserFromCookies } from "@/lib/serverutils";
import { logRecommendationClick } from "@/lib/actions/recommendation.actions";

export async function POST(req: NextRequest) {
  const user = await getUserFromCookies();
  if (!user?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const { recommendedUserId, recommendedRoomId } = await req.json();
  await logRecommendationClick({
    userId: user.userId,
    recommendedUserId: recommendedUserId ? BigInt(recommendedUserId) : undefined,
    recommendedRoomId,
  });
  return NextResponse.json({ success: true });
}
