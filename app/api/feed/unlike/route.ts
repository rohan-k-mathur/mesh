// app/api/feed/like/route.ts
import { NextResponse } from "next/server";
import { likeFeedPost } from "@/lib/actions/feed.actions";

export async function POST(req: Request) {
  const { id } = await req.json();
  await likeFeedPost({ id: BigInt(id) });
  return NextResponse.json({ ok: true });
}
