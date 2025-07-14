import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
export const TTL_SECONDS = 86400;

export async function getCached(key: string): Promise<string | null> {
  return redis.get(key);
}

export async function setCached(key: string, value: string): Promise<void> {
  await redis.set(key, value, "EX", 86400);
}

export default redis;
