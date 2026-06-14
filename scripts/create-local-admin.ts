import { hash } from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Local admin bootstrap is disabled in production.");
  }
  const email = "admin@entgo.local";
  const password = "AdminDemo2026!";
  const prisma = new PrismaClient();
  await prisma.user.upsert({
    where: { email },
    update: {
      role: "SUPERADMIN",
      passwordHash: await hash(password, 12),
      emailVerified: new Date(),
    },
    create: {
      email,
      name: "ENTGO Admin",
      role: "SUPERADMIN",
      passwordHash: await hash(password, 12),
      emailVerified: new Date(),
    },
  });
  await prisma.$disconnect();
  console.log(`Local admin ready: ${email}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
