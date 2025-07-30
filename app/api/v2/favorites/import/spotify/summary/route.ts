// app/api/v2/favorites/spotify/summary/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromCookies }        from '@/lib/serverutils';
import { supabase }                  from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const user = await getUserFromCookies();
  const path = req.nextUrl.searchParams.get('path');
  if (!user?.userId || !path) return NextResponse.json({ error: 'bad req' }, { status: 400 });

  // Get a signed download URL and fetch the JSON
  const { data: urlObj, error } =
    await supabase.storage.from('favorites-raw').createSignedUrl(path, 60);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const raw  = await fetch(urlObj.signedUrl).then(r => r.json()) as any[];
  // --- quick aggregates ---
  const total      = raw.length;
  const byArtist   = new Map<string, number>();
  const byYear     = new Map<number, number>();

  raw.forEach(item => {
    const artist = item.track?.artists?.[0]?.name ?? 'Unknown';
    byArtist.set(artist, (byArtist.get(artist) ?? 0) + 1);
    const year   = Number(item.track?.album?.release_date?.slice(0, 4));
    if (year) byYear.set(year, (byYear.get(year) ?? 0) + 1);
  });

  // top 10 artists
  const topArtists = [...byArtist.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // year buckets
  const years = [...byYear.entries()].sort((a, b) => a[0] - b[0]);

  return NextResponse.json({ total, topArtists, years });
}
