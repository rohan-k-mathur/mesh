import { Queue, QueueEvents } from "bullmq";
import redis from "./redis";
import IORedis from 'ioredis';

export const runtime = 'nodejs';        // <-- prevents Edge bundling if imported elsewhere

// const res = await fetch(
//   `${process.env.UPSTASH_REDIS_REST_URL}/get/foo`,
//   { headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` } }
// );
const redisUrl = process.env.UPSTASH_REDIS_URL!;
if (!redisUrl) {
  throw new Error('UPSTASH_REDIS_URL missing – set it in Vercel & .env.local');
}
export const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

//const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });
export const spotifyIngestQueue = new Queue('spotify-ingest', { connection }); // <-- no colon
export const reembedQueue       = new Queue('reembed',       { connection });
export const tasteVectorQueue   = new Queue('taste-vector',   { connection });
export const tasteVectorEvents  = new QueueEvents('taste-vector',   { connection });

// export const spotifyIngestQueue = new Queue("spotify-ingest", {
//   connection: new IORedis(redisUrl, { maxRetriesPerRequest: null }),
// });

// export const reembedQueue = new Queue("reembed", {
//   connection: redis,
// });
