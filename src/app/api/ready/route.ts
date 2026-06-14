import { prisma } from "@/lib/prisma";
import { getRedis } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const redis = await getRedis();
    if (!redis?.isReady) throw new Error("Redis unavailable");
    return Response.json({ ok: true, database: "ready", redis: "ready" });
  } catch {
    return Response.json(
      { ok: false, database: "unavailable", redis: "unavailable" },
      { status: 503 },
    );
  }
}
