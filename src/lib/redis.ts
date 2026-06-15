import "server-only";
import { createClient, type RedisClientType } from "redis";

const globalForRedis = globalThis as unknown as {
  redis: RedisClientType | undefined;
  redisPromise: Promise<RedisClientType | null> | undefined;
};

export async function getRedis() {
  if (!process.env.REDIS_URL) return null;
  if (globalForRedis.redis?.isReady) return globalForRedis.redis;
  if (globalForRedis.redisPromise) return globalForRedis.redisPromise;

  globalForRedis.redisPromise = (async () => {
    const client = createClient({
      url: process.env.REDIS_URL,
      socket: { connectTimeout: 1_500, reconnectStrategy: false },
    });
    client.on("error", () => undefined);

    try {
      await client.connect();
      globalForRedis.redis = client as RedisClientType;
      return globalForRedis.redis;
    } catch {
      return null;
    } finally {
      globalForRedis.redisPromise = undefined;
    }
  })();

  return globalForRedis.redisPromise;
}
