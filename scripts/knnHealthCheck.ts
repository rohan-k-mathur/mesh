import { Queue, QueueEvents } from 'bullmq';
import { connection } from '@/lib/queue';




import 'dotenv/config';
const safeStringify = (v: unknown) =>
  JSON.stringify(v, (_, val) => (typeof val === 'bigint' ? val.toString() : val));

const q = new Queue('user-knn', { connection });
const ev = new QueueEvents('user-knn', { connection });

(async () => {
  const job = await q.add('probe', { userId: 12 });
  console.log('added', job.id);

  ev.on('completed', ({ jobId }) => {
    console.log('✅ completed', jobId);
    process.exit(0);
  });
  ev.on('failed', ({ jobId, failedReason }) => {
    console.error('❌ failed', jobId, failedReason);
    process.exit(1);
  });
})();