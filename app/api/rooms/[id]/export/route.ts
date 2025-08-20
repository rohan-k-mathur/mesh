// app/api/rooms/[id]/export/route.ts
import { NextRequest } from 'next/server';
import { pack } from 'tar-stream';
import { spawn } from 'node:child_process';

export const dynamic = 'force-dynamic';

/**
 * Streams a tar.zst containing:
 * - db.sql (schema-scoped dump)
 * - media/ (copied from room bucket — TODO: wire from S3)
 * - manifest.json (hashes, counts) + export.signature (detached Ed25519)
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const roomId = params.id;
  const tar = pack();

  // 1) db.sql via pg_dump (ensure pg_dump available in runtime)
  const schemaName = `room_${roomId}`;
  const pgDump = spawn('pg_dump', ['--no-owner', '--schema', schemaName, process.env.PGDATABASE || 'postgres'], { env: process.env });

  // Note: tar-stream supports streams; we pipe stdout into the 'db.sql' entry.
  const dbEntry = tar.entry({ name: 'db.sql' });
  pgDump.stdout.on('data', chunk => dbEntry.write(chunk));
  pgDump.stdout.on('end', () => dbEntry.end());

  // 2) TODO: Add media/** entries by streaming S3 objects from the room bucket.
  // Placeholder: empty folder entry
  tar.entry({ name: 'media/' }, Buffer.from([]));

  // 3) TODO: manifest.json + export.signature
  tar.entry({ name: 'manifest.json' }, Buffer.from(JSON.stringify({ roomId, version: 1, createdAt: new Date().toISOString() }, null, 2)));

  // Finalize and compress with zstd
  const zstd = spawn('zstd', ['-q', '--stdout']);
  const body = new ReadableStream({
    start(controller) {
      tar.pipe(zstd.stdin);
      zstd.stdout.on('data', (chunk) => controller.enqueue(chunk));
      zstd.on('close', () => controller.close());
      tar.finalize();
    }
  });

  return new Response(body, {
    headers: {
      'Content-Type': 'application/zstd',
      'Content-Disposition': `attachment; filename="room_${roomId}.tar.zst"`
    }
  });
}
