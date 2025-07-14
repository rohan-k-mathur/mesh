import { Worker } from "bullmq";
import { prisma } from "@/lib/prismaclient";
import axios from "axios";
import redis from "@/lib/redis";

new Worker(
  "reembed",
  async (job) => {
    const userId = job.data.userId as number;
    const attrs = await prisma.userAttributes.findUnique({
      where: { user_id: BigInt(userId) },
    });
    if (!attrs) return;
    const desc = [
      attrs.interests.join(" "),
      attrs.hobbies.join(" "),
      attrs.location ?? "",
    ].join(" ");
    const { data } = await axios.post(
      process.env.EMBEDDING_URL || "http://localhost:3000/embed",
      { text: desc },
    );
    const vector = data.vector as number[];
    await prisma.$executeRaw`INSERT INTO user_taste_vectors (user_id, taste, updated_at) VALUES (${BigInt(
      userId,
    )}, ${vector}::vector, NOW()) ON CONFLICT (user_id) DO UPDATE SET taste = ${vector}::vector, updated_at = NOW()`;
    await redis.del(`candCache:${userId}`);
  },
  { connection: redis, concurrency: 4 },
);
