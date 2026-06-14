import "server-only";
import { prisma } from "@/lib/prisma";

export async function getActiveSubscription(userId: string) {
  return prisma.subscription.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      currentEnd: { gt: new Date() },
    },
    orderBy: { currentEnd: "desc" },
  });
}

export async function hasPremium(userId: string) {
  return Boolean(await getActiveSubscription(userId));
}
