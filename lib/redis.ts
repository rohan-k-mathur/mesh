import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
const memory = new Map<string, string>();

export function setSyncStatus(userId: number, status: string) {
  return redis.set(`fav:sync:${userId}`, status);
}

export async function getOrSet<T>(
  key: string,
  ttl: number,
  fn: () => Promise<T>,
): Promise<T> {
  const cached =
    process.env.NODE_ENV === "test" ? memory.get(key) : await redis.get(key);
  if (cached) return JSON.parse(cached) as T;
  const result = await fn();
  if (process.env.NODE_ENV === "test") {
    memory.set(key, JSON.stringify(result));
  } else {
    await redis.setex(key, ttl, JSON.stringify(result));
  }
  return result;
}

export default redis;
