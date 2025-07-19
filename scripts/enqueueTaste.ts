// scripts/enqueueTaste.ts
import 'dotenv/config';                 // ⬅️ add this line

import { tasteVectorQueue } from '@/lib/queue';

(async () => {
  const uid = Number(process.argv[2] ?? '1');      // default → 1
  await tasteVectorQueue.add('debug‑manual', { userId: uid });
  console.log('enqueued taste‑vector job for user', uid, '✅');
})();
