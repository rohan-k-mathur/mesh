import { NextRequest, NextResponse } from "next/server";
import { getUserFromCookies } from "@/lib/serverutils";
import { fetchRecommendations } from "@/lib/actions/recommendation.actions";

export async function GET(req: NextRequest) {
  const user = await getUserFromCookies();
  if (!user || !user.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const limitUsers = parseInt(req.nextUrl.searchParams.get("users") || "7", 10);
  const limitRooms = parseInt(req.nextUrl.searchParams.get("rooms") || "5", 10);
  const data = await fetchRecommendations({
    userId: user.userId,
    limitUsers,
    limitRooms,
  });
  return NextResponse.json(data);
}
