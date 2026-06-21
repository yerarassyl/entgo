import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Local premium bootstrap is disabled in production.");
  }

  const email = "premium@entgo.kz";
  const password = "PremiumDemo2026!";
  const now = new Date();
  const currentEnd = new Date(now);
  currentEnd.setFullYear(currentEnd.getFullYear() + 1);
  const prisma = new PrismaClient();

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: "Premium Student",
      passwordHash: await hash(password, 12),
      emailVerified: now,
      trialEndsAt: null,
    },
    create: {
      email,
      name: "Premium Student",
      passwordHash: await hash(password, 12),
      emailVerified: now,
    },
  });

  await prisma.subscription.upsert({
    where: { externalId: "local-premium-demo" },
    update: {
      userId: user.id,
      status: "ACTIVE",
      plan: "premium",
      currentStart: now,
      currentEnd,
      cancelAtPeriod: false,
    },
    create: {
      userId: user.id,
      provider: "local",
      externalId: "local-premium-demo",
      status: "ACTIVE",
      plan: "premium",
      currentStart: now,
      currentEnd,
    },
  });

  await prisma.$disconnect();
  console.log(`Local Premium user ready: ${email}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
