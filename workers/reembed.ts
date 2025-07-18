// workers/reembed.ts
import { Worker } from 'bullmq';
import { connection }   from '@/lib/queue';        // ✅ one shared connection
import { prisma }       from '@/lib/prismaclient';
import axios            from 'axios';
import { redis }        from '@/lib/redis';        // only for cache-clear helper

async function handler(job: any) {
  const userId = Number(job.data.userId);          // BullMQ payload → number

  const attrs = await prisma.userAttributes.findUnique({
    where: { user_id: BigInt(userId) },
  });
  if (!attrs) return;

  // Build a single descriptive string
  const desc = [
    attrs.interests.join(' '),
    attrs.hobbies.join(' '),
    attrs.location ?? '',
  ].join(' ');

  // Call your embedding service
  const { data } = await axios.post(
    process.env.EMBEDDING_URL ?? 'http://localhost:3000/embed',
    { text: desc },
  );
  const vector = data.vector as number[];

  // Upsert into Postgres (vector-extension)
  await prisma.$executeRaw`
    INSERT INTO user_taste_vectors (user_id, taste, updated_at)
    VALUES (${BigInt(userId)}, ${vector}::vector, NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET taste = ${vector}::vector, updated_at = NOW()
  `;

  // Invalidate cached discovery candidates
  await redis.del(`candCache:${userId}`);
}

// Register the worker (one line)
new Worker('reembed', handler, { connection, concurrency: 4 });
