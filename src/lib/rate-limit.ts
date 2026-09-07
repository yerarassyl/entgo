import "server-only";
import { createHash } from "node:crypto";
import { getRedis } from "@/lib/redis";

function requestIdentity(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const value = forwarded || request.headers.get("x-real-ip") || "local";
  return createHash("sha256").update(value).digest("hex").slice(0, 24);
}

const memoryStore = new Map<string, { count: number; expiresAt: number }>();

export async function checkRateLimit(
  request: Request,
  scope: string,
  limit: number,
  windowSeconds: number,
) {
  const identity = requestIdentity(request);
  const key = `rate:${scope}:${identity}`;

  const redis = await getRedis();
  if (redis) {
    try {
      const count = await redis.incr(key);
      if (count === 1) await redis.expire(key, windowSeconds);
      return {
        allowed: count <= limit,
        remaining: Math.max(0, limit - count),
      };
    } catch {
      // Fall through to memory store
    }
  }

  // Robust in-memory fallback
  const now = Date.now();
  const entry = memoryStore.get(key);
  if (!entry || entry.expiresAt <= now) {
    memoryStore.set(key, { count: 1, expiresAt: now + windowSeconds * 1000 });
    return { allowed: true, remaining: limit - 1 };
  }

  entry.count += 1;
  return {
    allowed: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
  };
}
