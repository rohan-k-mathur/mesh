// app/api/v2/favorites/spotify/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromCookies }      from '@/lib/serverutils';
import redis                       from '@/lib/redis';
import { createClient } from '@supabase/supabase-js';
import { getRedis } from '@/lib/redis';
// Service-role key **must** stay on the server!
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,   // your project URL
  process.env.SUPABASE_SERVICE_ROLE_KEY!,  // service-role key
  {
    auth: { persistSession: false }        // no cookies on server
  }
);

export { supabase };
export async function GET(req: NextRequest) {
  const user = await getUserFromCookies();
  if (!user?.userId) return NextResponse.json({ error: 'unauth' }, { status: 401 });

  const key    = `fav:sync:${user.userId}`;
  const redis = getRedis();
if (redis) {
 
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
}
