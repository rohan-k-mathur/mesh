// app/api/me/route.ts
import { NextResponse } from "next/server";
import { getUserFromCookies } from "@/lib/serverutils";   // existing util
import { jsonSafe } from "@/lib/bigintjson";

export async function GET() {
  const user = await getUserFromCookies();
  if (!user) return NextResponse.json(null, { status: 401 });

  // Send only what the client needs – keep it small
  return NextResponse.json(jsonSafe({
    userId: user.userId,
    email:  user.email,
    name:   user.displayName,
  }), { headers: { "Cache-Control": "no-store" } });
}
