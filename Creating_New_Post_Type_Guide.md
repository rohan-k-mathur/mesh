Creating a New Post Type
------------------------

The PORTFOLIO post type is a good reference for how a fully featured post works. To add your own type, update both the backend and frontend as outlined below.

### Backend

1. **Prisma schema** – add the type to the `feed_post_type` and `realtime_post_type` enums in `lib/models/schema.prisma`. Add any new columns to `FeedPost` or `RealtimePost` if the post stores extra data.
2. **Migration** – create a SQL migration in `lib/models/migrations/<timestamp>_<name>/migration.sql` that adds the enum value and columns, for example:
   ```sql
   ALTER TYPE "realtime_post_type" ADD VALUE IF NOT EXISTS 'MY_NEW_TYPE';
   ALTER TYPE "feed_post_type"     ADD VALUE IF NOT EXISTS 'MY_NEW_TYPE';
   ALTER TABLE "realtime_posts" ADD COLUMN IF NOT EXISTS ...;
   ALTER TABLE "feed_posts"     ADD COLUMN IF NOT EXISTS ...;
   ```
3. **Server actions** – extend `CreateRealtimePostParams`, `UpdateRealtimePostParams`, `createRealtimePost`, and `updateRealtimePost` in `lib/actions/realtimepost.actions.ts`. If the type appears in the global feed, also update `CreateFeedPostArgs` and `createFeedPost` in `lib/actions/feed.actions.ts`.
4. **Expose the type** – add it to the default list in `app/api/realtime-posts/route.ts` and to the `postTypes` arrays passed to `RealtimeFeed` in pages such as `app/(root)/(standard)/lounges/[id]/page.tsx`.

### Frontend

5. **Display component** – create a card under `components/cards/` and import it in `components/cards/PostCard.tsx` to render the new type.
6. **React Flow node** – build a node component in `components/nodes/` and register it in:
   - `lib/reactflow/types.ts` (`NodeTypeMap`, `NodeTypeToModalMap`, `DEFAULT_NODE_VALUES`, and type definitions)
   - `components/reactflow/Room.tsx`
   - `lib/reactflow/reactflowutils.ts`
7. **Creation & editing UI** – add a form in `components/forms/` and a modal in `components/modals/`, define validation in `lib/validations/thread.ts`, and wire the modal into both `components/shared/NodeSidebar.tsx` (room canvas) and `components/forms/CreateFeedPost.tsx` (global feed) by updating their option lists and switch cases.
8. **Final checks** – verify styling, data persistence, and permissions against existing post types.

Raw → Taste-Vector integration checklist
---------------------------------------

0 — Folder & naming convention

```
workers/
  spotifyIngest.ts      ← writes the raw JSON to Supabase
  tasteVector.ts        ← **new** (or merge into reembed.ts if you prefer one worker)
```

Keep queue names snake-case (e.g. **taste-vector**) to match Redis keys.

1 — Emit the job right after a raw-file upload

Inside **uploadRaw( )** (or wherever you finish the Spotify import):

```ts
await tasteVectorQueue.add('build-vector', { userId, path });
```

*path* is optional; you can also let the worker look up the newest file.

2 — Create the BullMQ queue & events

```ts
// lib/queue.ts  (central queue factory)
export const tasteVectorQueue   = new Queue       ('taste-vector',   { connection });
export const tasteVectorEvents  = new QueueEvents ('taste-vector',   { connection });
```

*If you re-use **reembed**, skip this and just add a processor to that queue.*

3 — Worker skeleton (`workers/tasteVector.ts`)

```ts
import { Worker }          from 'bullmq';
import { tasteVectorQueue,
         connection }      from '@/lib/queue';
import { prisma }          from '@/lib/prismaclient';
import redis, { delKeys }  from '@/lib/redis';
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

    /* --- 3. fetch / compute embeddings ---------------------------------- */
    // 3-a) pull 512-D vectors already stored per track
    const embeddings = await prisma.trackEmbedding.findMany({
      where: { id: { in: trackIds } },
      select: { vector: true }
    });

    // 3-b) simple mean-pooling (replace with PCA/UMAP call if you prefer)
    const dim = embeddings[0]?.vector.length ?? 0;
    const agg = Array(dim).fill(0) as number[];

    embeddings.forEach(e =>
      e.vector.forEach((v, i) => (agg[i] += v)));

    const taste = agg.map(v => v / embeddings.length);

    /* --- 4. write to user_taste_vectors (upsert) ------------------------- */
    await prisma.$executeRaw`
      INSERT INTO user_taste_vectors (user_id, taste, updated_at)
      VALUES (${BigInt(userId)}, ${taste}::vector, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET taste = ${taste}::vector, updated_at = NOW()
    `;

    /* --- 5. invalidate downstream caches -------------------------------- */
    await redis.del(`candCache:${userId}`);
    await redis.del(`friendSuggest:${userId}`);
  },
  { connection, concurrency: 2 }
);
```

4 — Wire the worker into your dev scripts

```jsonc
// package.json
"scripts": {
  "worker": "tsx -r dotenv/config workers/index.ts", // index imports tasteVector.ts
  "dev":    "next dev & pnpm worker"
}
```

`workers/index.ts` should simply `import './tasteVector'` so nodemon/tsx picks it up.

5 — Update Supabase DB (if not already done)

```sql
create table if not exists user_taste_vectors (
  user_id    bigint primary key,
  taste      vector(512),  -- or 256 if you reduced
  updated_at timestamptz   not null
);
```

*(Install the pgvector extension first if your project doesn’t have it.)*

6 — Test locally

```bash
# 1. Trigger a Spotify import from the UI; wait until the raw JSON appears.
# 2. Watch the worker logs:
pnpm worker
# you should see:
# [taste-vector] processed job 42 in 3.2s
# 3. Hit the discovery API:
curl -H "Cookie: auth=<your session cookie>" \
     "http://localhost:3000/api/v2/discovery/candidates?k=50" | jq .
```

The returned list should now reflect the user’s newly-ingested favourites.

7 — Production checklist

| Item              | Why                                                                                                   |
| ----------------- | ----------------------------------------------------------------------------------------------------- |
| **Edge vs Node**  | Keep the summary & worker code on **Node runtime**—stream-json relies on Node streams.                |
| **Concurrency**   | Large files (15 MB) parse in ~2 s on a single core; set concurrency to the number of vCPUs.          |
| **Cron backfill** | Run a daily job that enqueues *taste-vector* for every user whose raw file changed but vector didn’t. |
| **Monitoring**    | Hook `tasteVectorEvents.on('failed')` to PostHog/Sentry so you see format or embedding errors.        |

That’s it—add these steps to your Codex page and your team will have an end-to-end pipeline from **raw favourites → vector → discovery feed** ready to replicate for Apple Music, Last.fm, etc.
