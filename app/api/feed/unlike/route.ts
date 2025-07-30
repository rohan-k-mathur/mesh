// app/api/feed/like/route.ts
import { NextResponse } from "next/server";
import { likeFeedPost, unlikeFeedPost } from "@/lib/actions/feed.actions";

export async function POST(req: Request) {
  const { id } = await req.json();
  await unlikeFeedPost({ id: BigInt(id) });
  return NextResponse.json({ ok: true });
}
