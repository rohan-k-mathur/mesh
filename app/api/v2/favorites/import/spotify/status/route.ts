// app/api/v2/favorites/spotify/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromCookies }      from '@/lib/serverutils';
import { supabase }                from '@/lib/supabaseServer'; // service‑role client
import redis                       from '@/lib/redis';

export async function GET(req: NextRequest) {
  const user = await getUserFromCookies();
  if (!user?.userId) return NextResponse.json({ error: 'unauth' }, { status: 401 });

  const key    = `fav:sync:${user.userId}`;
  const status = (await redis.get(key)) ?? 'none';

  if (status === 'done') {
    // find newest file in favorites_raw/spotify/{uid}/
    const prefix = `spotify/${user.userId}/`;
    const { data } = await supabase.storage.from('favorites-raw').list(prefix, { limit: 1, sortBy: { column: 'name', order: 'desc' }});
    const latest  = data?.[0]?.name ? prefix + data[0].name : null;
    return NextResponse.json({ status, path: latest });
  }

  return NextResponse.json({ status });
}
