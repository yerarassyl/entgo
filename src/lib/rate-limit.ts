import "server-only";
import { createHash } from "node:crypto";
import { getRedis } from "@/lib/redis";

function requestIdentity(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const value = forwarded || request.headers.get("x-real-ip") || "local";
  return createHash("sha256").update(value).digest("hex").slice(0, 24);
}

export async function checkRateLimit(
  request: Request,
  scope: string,
  limit: number,
  windowSeconds: number,
) {
  const redis = await getRedis();
  if (!redis) return { allowed: true, remaining: limit };

  const key = `rate:${scope}:${requestIdentity(request)}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, windowSeconds);

  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
  };
}
