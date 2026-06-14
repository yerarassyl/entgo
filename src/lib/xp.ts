import "server-only";
import type { Prisma, XpReason } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export async function awardXp({
  userId,
  reason,
  amount,
  sourceType,
  sourceId,
  metadata,
}: {
  userId: string;
  reason: XpReason;
  amount: number;
  sourceType: string;
  sourceId: string;
  metadata?: Prisma.InputJsonValue;
}) {
  if (!amount) return 0;
  const existing = await prisma.xpTransaction.findUnique({
    where: {
      userId_reason_sourceType_sourceId: {
        userId,
        reason,
        sourceType,
        sourceId,
      },
    },
  });
  if (existing) return 0;

  await prisma.$transaction([
    prisma.xpTransaction.create({
      data: { userId, reason, amount, sourceType, sourceId, metadata },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: amount } },
    }),
  ]);
  return amount;
}
