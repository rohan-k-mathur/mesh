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

export function getRedis() {
  // Skip redis entirely at build-time or when env vars are missing
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.NODE_ENV === "production") {
    if (!process.env.REDIS_HOST) return null;   // change to your var names
  }
  if (!process.env.REDIS_HOST) return null;

  // cache the instance so you don’t create many
  globalThis._redis ??= new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT ?? 6379),
    username: process.env.REDIS_USER,
    password: process.env.REDIS_PASS,
  });
  return globalThis._redis as Redis;
}

export default redis;
