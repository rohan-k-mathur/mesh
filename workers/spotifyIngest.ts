import { Worker, QueueEvents } from 'bullmq';
import { connection } from '@/lib/queue';          // only the Redis conn
import { prisma } from '@/lib/prismaclient';
import { refreshToken, uploadRaw } from '@/lib/spotify'; // uploadRaw uses the service-role key
import { setSyncStatus } from '@/lib/redis';
import axios from 'axios';

async function fetchTracks(access: string) {
  let url: string | null =
    'https://api.spotify.com/v1/me/tracks?limit=50&offset=0';
  const tracks: any[] = [];

  while (url) {
    const { data } = await axios.get(url, {
      headers: { Authorization: `Bearer ${access}` },
    });
    tracks.push(...data.items);
    url = data.next;
  }
  console.log('[spotify-ingest] tracks:', tracks.length);
  return tracks;
}

async function jobHandler(job: { data: { userId: number } }) {
  const userId = Number(job.data.userId);
  await setSyncStatus(userId, 'syncing');

  const account = await prisma.linkedAccount.findFirst({
    where: { user_id: userId, provider: 'spotify' },
  });
  if (!account) {
    await setSyncStatus(userId, 'error:noaccount');
    throw new Error('linkedAccount not found');
  }

  let access = account.access_token;

  try {
    const tracks = await fetchTracks(access);
    await uploadRaw(userId, tracks);          // throws if bucket/key wrong
    await setSyncStatus(userId, 'done');
  } catch (err: any) {
    // 401 = expired access token → refresh once
    const needsRefresh = err?.response?.status === 401 && account.refresh_token;

    if (needsRefresh) {
      const tok = await refreshToken(account.refresh_token);
      access = tok.access_token;

      await prisma.linkedAccount.update({
        where: { id: account.id },
        data: {
          access_token: tok.access_token,
          expires_at: new Date(Date.now() + tok.expires_in * 1_000),
        },
      });

      const tracks = await fetchTracks(access);
      await uploadRaw(userId, tracks);
      await setSyncStatus(userId, 'done');
      return;
    }

    // log + surface any other error
    console.error('[spotify-ingest] ERROR', err);
    await setSyncStatus(userId, `error:${err.message}`);
    throw err;                               // mark job FAILED
  }
}

/* ---------- BullMQ wiring ---------- */
new Worker('spotify-ingest', jobHandler, { connection });

const qEvents = new QueueEvents('spotify-ingest', { connection });
qEvents.on('completed',  ({ jobId })           => console.log('[spotify-ingest] DONE',   jobId));
qEvents.on('failed',     ({ jobId, failedReason }) => console.error('[spotify-ingest] FAILED', jobId, failedReason));
