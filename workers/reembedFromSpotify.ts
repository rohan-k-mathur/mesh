// workers/reembedFromSpotify.ts
import { Worker }          from 'bullmq';
import { connection }      from '@/lib/queue';
import { prisma }          from '@/lib/prismaclient';
import redis, { setSyncStatus } from '@/lib/redis';
import { createClient }    from '@supabase/supabase-js';
import { Readable }        from 'node:stream';
import { parser }          from 'stream-json';
import { streamArray }     from 'stream-json/streamers/StreamArray';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,      // service‑role, **NOT** the anon key
  { auth: { persistSession: false } }
);

new Worker(
  'reembed',                                    // queue name
  async job => {
    const userId: number = job.data.userId;
    await setSyncStatus(userId, 'reembedding');

    /* 1 — locate the newest raw‑json object */
    const prefix = `spotify/${userId}/`;
    const { data: list, error: listErr } =
      await supabase.storage
        .from('favorites-raw')
        .list(prefix, { limit: 1, sortBy: { column: 'name', order: 'desc' } });

    if (listErr || !list?.[0]) throw listErr ?? new Error('no raw file found');
    const path = prefix + list[0].name;

    /* 2 — download + stream‑parse just the track IDs */
    const { data: blob, error: dlErr } =
      await supabase.storage.from('favorites-raw').download(path);
    if (dlErr || !blob) throw dlErr ?? new Error('download failed');

    const trackIds: string[] = [];
    await new Promise<void>((res, rej) => {
      Readable.fromWeb(blob.stream())
        .pipe(parser())
        .pipe(streamArray())
        .on('data', ({ value }) => trackIds.push(value.track.id))
        .on('end', res)
        .on('error', rej);
    });

    /* 3 — fetch existing 512‑D embeddings for these tracks */
    const embeddings = await prisma.track_embedding.findMany({
      where: { track_id: { in: trackIds } },
      select: { vector: true },
    });

    if (!embeddings.length) throw new Error('No embeddings found for tracks');

    /* 4 — cheap average vector */
    const dim = embeddings[0].vector.length;
    const sum = new Array<number>(dim).fill(0);
    embeddings.forEach(e => e.vector.forEach((v, i) => (sum[i] += v)));
    const userVec = sum.map(v => v / embeddings.length);

    /* 5 — upsert → user_taste_vectors */
    await prisma.$executeRaw`
      INSERT INTO user_taste_vectors (user_id, taste, updated_at)
      VALUES (${BigInt(userId)}, ${userVec}::vector, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET taste = ${userVec}::vector, updated_at = NOW()
    `;

    /* 6 — clear caches */
    await redis.del(`candCache:${userId}`);
    await redis.del(`friendSuggest:${userId}`);
    await setSyncStatus(userId, 'done');
  },
  { connection, concurrency: 2 }
);
