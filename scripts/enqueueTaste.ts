#!/usr/bin/env tsx
/**
 * Manually enqueue a taste‑vector job.
 *
 *   $ npx tsx scripts/enqueueTaste.ts 42
 *   enqueued taste‑vector job for user 42  ✅
 */
import 'dotenv/config';                // load .env / .env.local
import { tasteVectorQueue } from '@/lib/queue';

const uid = Number(process.argv[2] || 1);   // fallback to 1

(async () => {
  await tasteVectorQueue.add('debug', { userId: uid });
  console.log(`enqueued taste‑vector job for user ${uid}  ✅`);
  process.exit(0);
})();
