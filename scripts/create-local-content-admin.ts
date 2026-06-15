import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Local admin bootstrap is disabled in production.");
  }

  const email = "content-admin@entgo.local";
  const password = "ContentAdmin2026!";
  const prisma = new PrismaClient();

  await prisma.user.upsert({
    where: { email },
    update: {
      name: "ENTGO Content Admin",
      role: "ADMIN",
      passwordHash: await hash(password, 12),
      emailVerified: new Date(),
    },
    create: {
      email,
      name: "ENTGO Content Admin",
      role: "ADMIN",
      passwordHash: await hash(password, 12),
      emailVerified: new Date(),
    },
  });

  await prisma.$disconnect();
  console.log(`Local content admin ready: ${email}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
