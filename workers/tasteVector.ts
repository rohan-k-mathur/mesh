import { Worker }          from 'bullmq';
import { tasteVectorQueue,
         connection }      from '@/lib/queue';
import { prisma }          from '@/lib/prismaclient';
import redis               from '@/lib/redis';
import { createClient }    from '@supabase/supabase-js';
import { Readable }        from 'node:stream';
import { parser }          from 'stream-json';
import { streamArray }     from 'stream-json/streamers/StreamArray';



// service-role Supabase client (server only)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

new Worker(
  'taste-vector',
  async ({ data }) => {
    const userId = Number(data.userId);

    /* --- 1. find latest raw file ----------------------------------------- */
    const prefix = `spotify/${userId}/`;
    const { data: list } = await supabase
      .storage.from('favorites-raw')
      .list(prefix, { limit: 1, sortBy: { column: 'name', order: 'desc' }});

    if (!list?.[0]) throw new Error('no raw file found');
    const key = prefix + list[0].name;

    /* --- 2. download & stream-parse track IDs ---------------------------- */
    const { data: blob } = await supabase.storage.from('favorites-raw').download(key);
    if (!blob) throw new Error('download failed');

    const trackIds: number[] = [];

    await new Promise<void>((res, rej) => {
      Readable.fromWeb(blob.stream())
        .pipe(parser())
        .pipe(streamArray())
        .on('data', ({ value }) => {
          if (value.track?.id) trackIds.push(value.track.id);
        })
        .on('end',   res)
        .on('error', rej);
    });

    // /* --- 3. fetch / compute embeddings ---------------------------------- */
    // const embeddings = await prisma.trackEmbedding.findMany({
    //   where: { id: { in: trackIds } },
    //   select: { vector: true }
    // });


    // const dim = embeddings[0]?.vector.length ?? 0;
    // const agg = Array(dim).fill(0) as number[];

    // embeddings.forEach(e =>
    //   e.vector.forEach((v, i) => (agg[i] += v)));

    // const taste = agg.map(v => v / embeddings.length);

    // /* --- 4. write to user_taste_vectors (upsert) ------------------------- */
    // await prisma.$executeRaw`
    //   INSERT INTO user_taste_vectors (user_id, taste, updated_at)
    //   VALUES (${BigInt(userId)}, ${taste}::vector, NOW())
    //   ON CONFLICT (user_id)
    //   DO UPDATE SET taste = ${taste}::vector, updated_at = NOW()
    // `;
    /* --- 3. fetch / compute embeddings ---------------------------------- */
const rows: { vector: number[] }[] = await prisma.$queryRaw`
SELECT vector::float8[] AS vector
FROM   track_embedding
WHERE  track_id = ANY(${trackIds})   -- 👈 use the right column
`;
console.log('[taste‑vector]', userId, 'parsed', trackIds.length, 'ids');

if (rows.length === 0) {
console.log('[taste-vector] no embeddings for user', userId);
return;                              // or throw → worker “failed”
}

/* average the vectors */
const dim  = rows[0].vector.length;
const mean = Array(dim).fill(0) as number[];
rows.forEach(r => r.vector.forEach((v, i) => (mean[i] += v)));
for (let i = 0; i < dim; i++) mean[i] /= rows.length;

/* upsert */
await prisma.$executeRaw`
INSERT INTO user_taste_vectors (user_id, taste, updated_at)
VALUES (${BigInt(userId)}, ${mean}::vector, NOW())
ON CONFLICT (user_id)
DO UPDATE SET taste = ${mean}::vector, updated_at = NOW()
`;

    /* --- 5. invalidate downstream caches -------------------------------- */
    await redis.del(`candCache:${userId}`);
    await redis.del(`friendSuggest:${userId}`);
  },
  { connection, concurrency: 2 }
);
