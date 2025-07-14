import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

export function setSyncStatus(userId: number, status: string) {
  return redis.set(`fav:sync:${userId}`, status);
}

export async function getOrSet<T>(
  key: string,
  ttl: number,
  fn: () => Promise<T>,
): Promise<T> {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached) as T;
  const result = await fn();
  await redis.setex(key, ttl, JSON.stringify(result));
  return result;
}

export default redis;
