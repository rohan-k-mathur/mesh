import { Worker } from "bullmq";
import { spotifyIngestQueue } from "@/lib/queue";
import { prisma } from "@/lib/prismaclient";
import { refreshToken, uploadRaw } from "@/lib/spotify";
import redis, { setSyncStatus } from "@/lib/redis";
import axios from "axios";

async function fetchTracks(access: string) {
  let url: string | null = "https://api.spotify.com/v1/me/tracks?limit=50&offset=0";
  const tracks: any[] = [];
  while (url) {
    const res = await axios.get(url, { headers: { Authorization: `Bearer ${access}` } });
    tracks.push(...res.data.items);
    url = res.data.next;
  }
  return tracks;
}

new Worker(
  "spotify:ingest",
  async (job) => {
    const userId = job.data.userId as number;
    await setSyncStatus(userId, "syncing");
    const account = await prisma.linkedAccount.findFirst({
      where: { user_id: userId, provider: "spotify" },
    });
    if (!account) {
      await setSyncStatus(userId, "error:noaccount");
      return;
    }
    let access = account.access_token;
    try {
      const tracks = await fetchTracks(access);
      await uploadRaw(userId, tracks);
      await setSyncStatus(userId, "done");
    } catch (err: any) {
      if (err.response?.status === 401 && account.refresh_token) {
        try {
          const t = await refreshToken(account.refresh_token);
          access = t.access_token;
          await prisma.linkedAccount.update({
            where: { id: account.id },
            data: {
              access_token: t.access_token,
              expires_at: new Date(Date.now() + t.expires_in * 1000),
            },
          });
          const tracks = await fetchTracks(access);
          await uploadRaw(userId, tracks);
          await setSyncStatus(userId, "done");
        } catch (e) {
          await setSyncStatus(userId, "error:token");
        }
      } else {
        await setSyncStatus(userId, `error:${err.message}`);
      }
    }
  },
  { connection: redis }
);
