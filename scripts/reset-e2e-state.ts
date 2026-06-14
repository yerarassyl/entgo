import { createClient } from "redis";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  const databaseUrl = new URL(process.env.DATABASE_URL ?? "");
  const redisUrl = new URL(process.env.REDIS_URL ?? "");
  const localHosts = new Set(["127.0.0.1", "localhost", "::1"]);
  if (!localHosts.has(databaseUrl.hostname) || !localHosts.has(redisUrl.hostname)) {
    throw new Error("E2E reset is allowed only for local database and Redis hosts.");
  }

  const prisma = new PrismaClient();
  await prisma.user.deleteMany({
    where: { email: { startsWith: "e2e-" } },
  });
  await prisma.$disconnect();

  const redis = createClient({ url: redisUrl.toString() });
  await redis.connect();
  const keys = await redis.keys("rate:*");
  if (keys.length) await redis.del(keys);
  await redis.quit();
  console.log("Local E2E state reset.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
