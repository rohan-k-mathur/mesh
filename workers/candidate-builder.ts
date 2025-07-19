import { Worker } from "bullmq";
import { connection } from "@/lib/queue";
import { prisma } from "@/lib/prismaclient";
import redis from "@/lib/redis";

new Worker(
  "candidate-builder",
  async (job) => {
    const uid = Number(job.data.userId);

    const rows: { track_id: string }[] = await prisma.$queryRaw`
      SELECT  t.track_id
      FROM    track_embedding t
      JOIN    user_taste_vectors u ON u.user_id = ${uid}
      LEFT JOIN favorite_items f
             ON  f.user_id = ${uid} AND f.media_id = t.track_id
      WHERE   f.media_id IS NULL
      ORDER BY t.vector <#> u.taste
      LIMIT   500
    `;

    await redis.set(
      `candCache:${uid}`,
      JSON.stringify(rows.map((r) => r.track_id)),
      "EX",
      300,
    );
  },
  { connection, concurrency: 2 },
);
