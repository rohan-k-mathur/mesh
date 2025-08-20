// app/api/rooms/import/route.ts
import { NextRequest, NextResponse } from 'next/server';
// import { provisionShard } from '@/server/provisioner/orchestrate';
// import { restore } from '@/server/import/restore';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const blob = await req.blob();
  // TODO: stream-decompress zstd, untar, psql restore, media upload, receipt emit.
  // For now, just acknowledge upload size.
  return NextResponse.json({ ok: true, bytes: blob.size });
}
