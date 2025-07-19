// import { Worker }          from 'bullmq';
// import { tasteVectorQueue,
//          connection }      from '@/lib/queue';
// import { prisma }          from '@/lib/prismaclient';
// import redis               from '@/lib/redis';
// import { createClient }    from '@supabase/supabase-js';
// import { Readable }        from 'node:stream';
// import { parser }          from 'stream-json';
// import { streamArray }     from 'stream-json/streamers/StreamArray';


import { Worker }                 from 'bullmq';
import { connection }             from '@/lib/queue';
import { prisma }                 from '@/lib/prismaclient';
import redis                      from '@/lib/redis';
import { createClient }           from '@supabase/supabase-js';
import { Readable }               from 'node:stream';
import { parser }                 from 'stream-json';
import { streamArray }            from 'stream-json/streamers/StreamArray';


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);
new Worker(
  'taste-vector',
  async (job) => {
    const userId = Number(job.data.userId);
    console.log('[taste‑vector] start', userId);

    /* 1 — locate newest raw file */
    const prefix = `spotify/${userId}/`;
    const { data: list } = await supabase
      .storage.from('favorites-raw')
      .list(prefix, { limit: 1, sortBy: { column: 'name', order: 'desc' } });

    if (!list?.[0]) throw new Error('no raw file found');
    const key = prefix + list[0].name;

    /* 2 — stream‑parse track ids */
    const { data: blob } = await supabase.storage
      .from('favorites-raw')
      .download(key);
    if (!blob) throw new Error('download failed');

    const ids: string[] = [];
    await new Promise<void>((res, rej) => {
      Readable.fromWeb(blob.stream())
        .pipe(parser())
        .pipe(streamArray())
        .on('data', ({ value }) => value.track?.id && ids.push(value.track.id))
        .on('end', res)
        .on('error', rej);
    });
    if (!ids.length) throw new Error('raw file had 0 ids');

    /* 3 — fetch the 512‑D embeddings and average them */
    // const rows: { vector: number[] }[] = await prisma.$queryRaw`
    // SELECT vector_to_array(vector) AS vector
    //   FROM   track_embedding
    //   WHERE  track_id = ANY(${ids})
    // `;
    // if (!rows.length) throw new Error('no embeddings for user ' + userId);

    // const dim   = rows[0].vector.length;
    // const mean  = Array(dim).fill(0) as number[];
    // rows.forEach(r => r.vector.forEach((v, i) => (mean[i] += v)));
    // for (let i = 0; i < dim; i++) mean[i] /= rows.length;

    /* 4 — upsert into user_taste_vectors */
    await prisma.$executeRawUnsafe(
      `
      WITH avg_vec AS (
        SELECT avg(vector) AS v
        FROM   track_embedding
        WHERE  track_id = ANY($1)
      )
      INSERT INTO user_taste_vectors (user_id, taste, updated_at)
      SELECT $2::bigint, v, NOW() FROM avg_vec
      ON CONFLICT (user_id) DO UPDATE
        SET taste = excluded.taste,
            updated_at = NOW()
      `,
      ids,                  // $1 – string[]
      BigInt(userId),       // $2 – bigint
    );

    /* 5 — invalidate caches */
    await redis.del(`candCache:${userId}`);
    await redis.del(`friendSuggest:${userId}`);
    console.log('[taste‑vector] done', userId);
  },
  { connection, concurrency: 2 },
);