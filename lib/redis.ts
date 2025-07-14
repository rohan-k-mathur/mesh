import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

export function setSyncStatus(userId: number, status: string) {
  return redis.set(`fav:sync:${userId}`, status);
}

export default redis;
