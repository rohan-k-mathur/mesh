import { NextRequest, NextResponse } from "next/server";
import { getUserFromCookies } from "@/lib/serverutils";
import { prisma } from "@/lib/prismaclient";
import redis from "@/lib/redis";
import axios from "axios";
import { refreshToken } from "@/lib/spotify";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const user = await getUserFromCookies();
  if (!user?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const kParam = parseInt(req.nextUrl.searchParams.get("k") || "50", 10);
  const k = Math.min(Math.max(kParam, 1), 100);
  const uid = Number(user.userId);

  let trackIds: string[];
  const cached = await redis.get(`candCache:${uid}`);
  if (cached) {
    trackIds = JSON.parse(cached) as string[];
  } else {
    const rows: { track_id: string }[] = await prisma.$queryRaw`
      SELECT  t.track_id
      FROM    track_embedding t
      JOIN    user_taste_vectors u ON u.user_id = ${uid}
      LEFT JOIN favorite_items f
             ON  f.user_id = ${uid} AND f.media_id = t.track_id
      WHERE   f.media_id IS NULL
      ORDER BY t.vector <#> u.taste
      LIMIT   500
    `;
    trackIds = rows.map((r) => r.track_id);
    await redis.set(
      `candCache:${uid}`,
      JSON.stringify(trackIds),
      "EX",
      300,
    );
  }

  const slice = trackIds.slice(0, k);

  const account = await prisma.linkedAccount.findFirst({
    where: { user_id: uid, provider: "spotify" },
  });
  if (!account) {
    return NextResponse.json({ error: "No Spotify account" }, { status: 400 });
  }

  let access = account.access_token;
  if (account.expires_at && account.expires_at.getTime() < Date.now()) {
    if (!account.refresh_token) {
      return NextResponse.json({ error: "Token expired" }, { status: 400 });
    }
    const tok = await refreshToken(account.refresh_token);
    access = tok.access_token;
    await prisma.linkedAccount.update({
      where: { id: account.id },
      data: {
        access_token: tok.access_token,
        expires_at: new Date(Date.now() + tok.expires_in * 1000),
      },
    });
  }

  const tracks: any[] = [];
  for (let i = 0; i < slice.length; i += 50) {
    const batch = slice.slice(i, i + 50);
    const { data } = await axios.get("https://api.spotify.com/v1/tracks", {
      params: { ids: batch.join(",") },
      headers: { Authorization: `Bearer ${access}` },
    });
    tracks.push(...(data.tracks ?? []));
  }

  return NextResponse.json(tracks);
}
