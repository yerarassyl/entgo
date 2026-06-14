import "server-only";
import { prisma } from "@/lib/prisma";
import { getActiveSubscription } from "@/lib/subscription";

export async function getEntitlements(userId: string) {
  const [user, subscription, completedTests] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    getActiveSubscription(userId),
    prisma.testAttempt.count({ where: { userId, status: "COMPLETED" } }),
  ]);
  const now = new Date();
  const trialActive = false;
  const paid = Boolean(subscription);
  const plan = subscription?.plan ?? "free";
  return {
    checkedAt: now,
    plan,
    paid,
    trialActive,
    trialEndsAt: user.trialEndsAt,
    canTakeFullTest: paid,
    canUseAiTutor: paid,
    canUseTopics: paid,
    canSeeFullPlan: paid,
    canSeeGrantForecast: paid,
    canSeeDetailedAnalytics: paid,
    completedTests,
  };
}
