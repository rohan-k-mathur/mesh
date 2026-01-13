import { Queue, QueueEvents } from "bullmq";
import redis from "./redis";
import IORedis from 'ioredis';
import { getRedis } from "./redis";
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
export const candidateBuilderQueue = new Queue('candidate-builder', { connection });
export const userKnnQueue       = new Queue('user-knn',      { connection });

// Phase 3.1: Source Trust Infrastructure queues
export const sourceVerificationQueue = new Queue('source-verification', { connection });
export const sourceArchivingQueue = new Queue('source-archiving', { connection });
// export const tasteVectorEvents  = new QueueEvents('taste-vector',   { connection });


/** one reusable ioredis connection */



/* (optional) queue‑event helpers – keep a reference so GC doesn't kill them */
export const tasteVectorEvents  = new QueueEvents('taste-vector', { connection });
tasteVectorEvents.on('completed',
  ({ jobId }) => console.log('[taste-vector] completed', jobId));
tasteVectorEvents.on('failed',
  ({ jobId, failedReason }) => console.error('[taste-vector] FAILED', failedReason));


// export const spotifyIngestQueue = new Queue("spotify-ingest", {
//   connection: new IORedis(redisUrl, { maxRetriesPerRequest: null }),
// });

// export const reembedQueue = new Queue("reembed", {
//   connection: redis,
// });
