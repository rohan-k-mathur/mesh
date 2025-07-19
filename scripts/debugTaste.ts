// scripts/debugTaste.ts
import 'dotenv/config';
import { prisma } from '@/lib/prismaclient';
import { tasteVectorQueue } from '@/lib/queue';

// tiny helper so we can use await without ESM
(async () => {
  const uid = Number(process.argv[2] ?? '1');

  // grab the latest taste‑vector row (if any)
  const row = await prisma.$queryRaw<
    { user_id: bigint; dims: number; updated_at: Date }[]
  >`
    SELECT user_id,
           vector_dims(taste) AS dims,
           updated_at
    FROM   user_taste_vectors
    WHERE  user_id = ${BigInt(uid)}
  `;

  console.table(row);
  console.log('\nEnqueuing a fresh job …');
  await tasteVectorQueue.add('debug‑manual', { userId: uid });
  console.log('✅  enqueued taste‑vector job for user', uid);
  process.exit(0);
})();
