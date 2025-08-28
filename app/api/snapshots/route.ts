import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sha256Hex } from '@/lib/ids/canonicalize';
import { SNAPSHOTS_BUCKET } from '@/lib/storage/constants';


const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: NextRequest) {
  const { url, excerpt } = await req.json();
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 });

  const res = await fetch(url, { redirect: 'follow' });
  const buf = Buffer.from(await res.arrayBuffer());
  const now = new Date().toISOString().replace(/[:.]/g, '-');
  const key = `snapshots/${now}-${sha256Hex(url).slice(0,8)}.http`;

  const { error } = await supabase.storage.from(SNAPSHOTS_BUCKET).upload(key, buf, {
    contentType: res.headers.get('content-type') ?? 'application/octet-stream',
    upsert: false,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const excerptHash = excerpt ? sha256Hex(excerpt) : null;
  return NextResponse.json({ snapshotKey: key, excerptHash });
}
