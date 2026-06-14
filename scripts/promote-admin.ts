import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    console.error("Usage: npm run admin:promote -- admin@example.com");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  const user = await prisma.user.update({
    where: { email },
    data: { role: "SUPERADMIN" },
    select: { id: true, email: true, role: true },
  }).catch(() => null);

  if (!user) {
    console.error(`User ${email} was not found.`);
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log(`Promoted ${user.email} to ${user.role}.`);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
