export const runtime = 'nodejs';  

import { NextRequest, NextResponse } from "next/server";
import { getUserFromCookies } from "@/lib/serverutils";
import { prisma } from "@/lib/prismaclient";
import { exchangeCode } from "@/lib/spotify";
import { spotifyIngestQueue } from "@/lib/queue";

export async function POST(req: NextRequest) {
  const user = await getUserFromCookies();
  if (!user?.userId) {
    return NextResponse.redirect("https://accounts.spotify.com/authorize", 302);
  }
  const body = await req.json();
  const code = body.code as string | undefined;
  if (!code) return NextResponse.json({ error: "code required" }, { status: 400 });
  const tokens = await exchangeCode(code);
  await prisma.linkedAccount.upsert({
    where: { user_id_provider: { user_id: user.userId, provider: "spotify" } },
    update: {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: new Date(Date.now() + tokens.expires_in * 1000),
    },
    create: {
      user_id: user.userId,
      provider: "spotify",
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: new Date(Date.now() + tokens.expires_in * 1000),
    },
  });
  const job = await spotifyIngestQueue.add("ingest", { userId: user.userId });
  return NextResponse.json({ jobId: job.id }, { status: 202 });
}
