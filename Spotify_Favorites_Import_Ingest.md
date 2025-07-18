### **Spotify Favorites Import & Ingest — End-to-End Checklist**

Use this flow whenever you need to wire up (or revisit) the */api/v2/favorites/import/spotify* end-point, Redis/BullMQ worker, and Supabase Storage upload.

| Phase                    | Goal                                                                    | Where you touch code                           |
| ------------------------ | ----------------------------------------------------------------------- | ---------------------------------------------- |
| **A – Auth & API route** | Obtain an OAuth “code”, exchange it for tokens, enqueue a job.          | `app/api/v2/favorites/import/spotify/route.ts` |
| **B – Queue & Worker**   | Pull jobs, fetch “Liked Songs”, upload raw JSON, mark status.           | `lib/queue.ts`, `workers/spotifyIngest.ts`     |
| **C – Storage**          | Persist `favorites_raw/spotify/{userId}/{YYYY-MM-DD}.json` to Supabase. | `lib/spotify.ts` (`uploadRaw`)                 |
| **D – UX callback**      | Tell the user “Sync started!” (or errors).                              | `app/spotify/callback/page.tsx`                |
| **E – Monitoring**       | Check Redis keys, Supabase bucket, worker logs.                         | Upstash & Supabase dashboards                  |

---

## A  Route & OAuth exchange

1. **Create/confirm a Spotify App**
   *Dashboard → Your Apps → *redirect URI* = `http://localhost:3000/spotify/callback`*
   Grab `SPOTIFY_CLIENT_ID` & `SPOTIFY_CLIENT_SECRET`.

2. **Environment vars** (`.env.local`, Vercel)

   ```env
   SPOTIFY_CLIENT_ID=…
   SPOTIFY_CLIENT_SECRET=…
   REDIRECT_URI=http://localhost:3000/spotify/callback
   ```

3. **Callback page** (`app/spotify/callback/page.tsx`)
   *— already implemented; fetches the POST route and shows status.*

4. **API route** (`/api/v2/favorites/import/spotify/route.ts`)
   *✓ Expects `{ code }` JSON; returns 202 with `{ jobId }`.*
   *Checklist:*

   * `getUserFromCookies()` → verify user.
   * `exchangeCode(code)` → POST *accounts.spotify.com/api/token*.
   * Upsert tokens in `linkedAccount`.
   * `spotifyIngestQueue.add('ingest', { userId })`.

---

## B  Redis, Queue & Worker

> **Redis URL rules**
> *Upstash TLS URL* → `rediss://default:<token>@<host>.upstash.io:6379`
> Set `UPSTASH_REDIS_URL` (for BullMQ) **and** `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_TOKEN` (if you do REST calls elsewhere).

1. **`lib/queue.ts`**

   ```ts
   const connection = new IORedis(process.env.UPSTASH_REDIS_URL!, {
     maxRetriesPerRequest: null, // BullMQ requirement
   });
   export { connection };
   export const spotifyIngestQueue = new Queue('spotify-ingest', { connection });
   ```

2. **`workers/spotifyIngest.ts`** (minified essentials)

   ```ts
   import { Worker, QueueEvents } from 'bullmq';
   import { connection, spotifyIngestQueue } from '@/lib/queue';
   import { prisma } from '@/lib/prismaclient';
   import { refreshToken, uploadRaw } from '@/lib/spotify';
   import { setSyncStatus } from '@/lib/redis';
   import axios from 'axios';

   async function fetchTracks(access: string) { /* paginated /v1/me/tracks */ }

   new QueueEvents('spotify-ingest', { connection })
     .on('failed',    ({ jobId, failedReason }) => console.error('[spotify-ingest] FAILED', jobId, failedReason))
     .on('completed', ({ jobId })               => console.log('[spotify-ingest] DONE',   jobId));

   new Worker('spotify-ingest', async job => {
     const userId = Number(job.data.userId);
     await setSyncStatus(userId, 'syncing');

     const account = await prisma.linkedAccount.findFirst({ where: { user_id: userId, provider: 'spotify' } });
     if (!account) return setSyncStatus(userId, 'error:noaccount');

     let access = account.access_token;

     try {
       const tracks = await fetchTracks(access);
       await uploadRaw(userId, tracks);                // ← uploads JSON
       await setSyncStatus(userId, 'done');
     } catch (err: any) {
       if (err.response?.status === 401 && account.refresh_token) {
         const t = await refreshToken(account.refresh_token);
         await prisma.linkedAccount.update({ where: { id: account.id }, data: { access_token: t.access_token }});
         const tracks = await fetchTracks(t.access_token);
         await uploadRaw(userId, tracks);
         await setSyncStatus(userId, 'done');
       } else {
         await setSyncStatus(userId, `error:${err.message}`);
         throw err;                                  // surfaces to QueueEvents
       }
     }
   }, { connection });
   ```

3. **Run the worker locally**

   ```bash
   # one-off
   pnpm run worker            # tsx -r dotenv/config workers/index.ts

   # dev reload
   npx nodemon --exec 'tsx -r dotenv/config workers/index.ts' workers
   ```

4. **Pause/stop when done**
   `Ctrl-C` to kill locally or `await spotifyIngestQueue.pause()` remotely.

---

## C  Supabase Storage upload

1. **Bucket naming**
   Create **`favorites_raw`** (underscore) in **Storage → Buckets**.
   Ensure **Public** toggle = *off* (private).

2. **Service-role key**
   `SUPABASE_SERVICE_ROLE_KEY=` (Settings → API → Service role).

3. **`uploadRaw` helper** (`lib/spotify.ts`)

   ```ts
   const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,
                                 process.env.SUPABASE_SERVICE_ROLE_KEY!);

   export async function uploadRaw(userId: number, data: unknown) {
     const ymd   = new Date().toISOString().split('T')[0];
     const key   = `spotify/${userId}/${ymd}.json`;
     const { data: signed } = await supabase.storage
       .from('favorites_raw')
       .createSignedUploadUrl(key, 60);

     await fetch(signed.signedUrl, {
       method:  'PUT',
       headers: { 'Content-Type': 'application/json' },
       body:    JSON.stringify(data),
     });

     console.log('[uploadRaw] upload complete →', signed.path);
   }
   ```

---

## D  Client-side callback UX

1. **`app/spotify/callback/page.tsx`**

   ```tsx
   'use client';
   export const dynamic = 'force-dynamic';

   const Callback = () => {
     const [msg, setMsg] = useState('Linking your Spotify account…');
     const params = useSearchParams();

     useEffect(() => {
       const code = params.get('code');
       if (!code) return setMsg('Missing code');

       (async () => {
         try {
           const res  = await fetch('/api/v2/favorites/import/spotify', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body:    JSON.stringify({ code }),
           });
           const json = await res.json().catch(() => ({}));

           res.ok && res.status === 202
             ? setMsg('Sync started! You can close this tab.')
             : setMsg(`Error: ${json.error ?? 'unknown'}`);
         } catch (e) {
           console.error(e);
           setMsg('Network error');
         }
       })();
     }, [params]);

     return <p style={{ padding: 32 }}>{msg}</p>;
   };
   export default Callback;
   ```

---

## E  Verification & Troubleshooting

| Where to look                     | What to expect                                                                                               |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Browser Network tab**           | `POST /api/v2/favorites/import/spotify` → 202                                                                |
| **Redis CLI / Upstash dashboard** | <br>`GET fav:sync:{userId}` → `"syncing"` → `"done"`<br>`KEYS bull:spotify-ingest:*` show `:completed` entry |
| **Worker console**                | `tracks: ####` → `upload complete → favorites_raw/…` → `DONE jobId`                                          |
| **Supabase Storage**              | File appears under `favorites_raw/spotify/{userId}/YYYY-MM-DD.json`                                          |
| **Command quota**                 | Commands flat-line when worker is stopped/queue paused                                                       |

---

### Quick “it broke” table

| Symptom                                                      | Usual cause                                      | Fix                                          |
| ------------------------------------------------------------ | ------------------------------------------------ | -------------------------------------------- |
| 500 from `/import/spotify`                                   | Bad/expired `code` or missing env vars           | Confirm redirect URI & env; redo OAuth flow  |
| Worker error `StorageApiError 400 "resource does not exist"` | Bucket name mismatch                             | Create `favorites_raw` or update `from('…')` |
| `ERR_INVALID_URL` in `uploadRaw`                             | Using full `data` object instead of `.signedUrl` | See fixed `uploadRaw` above                  |
| Continuous Redis writes                                      | Worker still running                             | `Ctrl-C`, `queue.pause()`, or shut container |

---

## Shutting everything down

```bash
# locally
Ctrl-C               # stops nodemon / worker

# or pause if deployed
await spotifyIngestQueue.pause();
await spotifyIngestQueue.close();
```

No worker → no polling → **no extra Upstash usage**.

---

### **Template commit checklist**

* [ ] `.env.[local|prod]` updated (`SPOTIFY_*`, `SUPABASE_SERVICE_ROLE_KEY`, `UPSTASH_REDIS_*`)
* [ ] Bucket **favorites\_raw** exists
* [ ] Route compiles (`next build`)
* [ ] Worker compiles (`pnpm run worker`)
* [ ] Manual test: Like → OAuth → 202 → file in Storage
* [ ] Docs updated (this file!)

Happy syncing 🎧
