import { Worker } from "bullmq";
import { connection } from "@/lib/queue";
import { prisma } from "@/lib/prismaclient";
import redis from "@/lib/redis";

new Worker(
  "user-knn",
  async (job) => {
    const uid = Number(job.data.userId);

    /* ----- user-knn-builder.ts ------------------------------------- */
    const rows: { neighbour_id: bigint; sim: number }[] =
      await prisma.$queryRaw`
  SELECT  u2.user_id  AS neighbour_id,
          1 - (u1.taste <=> u2.taste) AS sim          
  FROM    user_taste_vectors u1,
          user_taste_vectors u2
  WHERE   u1.user_id = ${uid}
    AND   u2.user_id <> ${uid}
  ORDER BY u1.taste <=> u2.taste                     
  LIMIT   200
`;

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`DELETE FROM user_similarity_knn WHERE user_id = ${uid}`;
      if (rows.length)
        await tx.$executeRawUnsafe(
          `INSERT INTO user_similarity_knn (user_id, neighbour_id, sim)
           SELECT * FROM jsonb_to_recordset($1::jsonb)
                  AS x(user_id bigint, neighbour_id bigint, sim float4)`,
          JSON.stringify(rows.map((r) => ({ user_id: uid, ...r })))
        );
    });

    await redis.set(
      `friendSuggest:${uid}`,
      JSON.stringify(rows.map((r) => Number(r.neighbour_id))),
      "EX",
      300
    );
  },
  { connection, concurrency: 2 }
);
