import { prisma } from "@/lib/prisma";
import { getRedis } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  let database = "unavailable";
  let redis = process.env.REDIS_URL ? "unavailable" : "not-configured";

  try {
    await prisma.$queryRaw`SELECT 1`;
    database = "ready";
  } catch {
    return Response.json({ ok: false, database, redis }, { status: 503 });
  }

  if (process.env.REDIS_URL) {
    const client = await getRedis();
    redis = client?.isReady ? "ready" : "unavailable";
  }

  return Response.json({
    ok: database === "ready",
    database,
    redis,
  });
}
