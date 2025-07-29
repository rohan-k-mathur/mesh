// app/api/feed/replicate/route.ts
import { NextResponse } from "next/server";
import { replicateFeedPost } from "@/lib/actions/feed.actions";

export async function POST(req: Request) {
  const body = await req.json();
  // body already contains originalPostId, userId, text, path
  await replicateFeedPost(body);
  return NextResponse.json({ ok: true });
}
