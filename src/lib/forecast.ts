import "server-only";
import { getMasteryMap } from "@/lib/mastery";
import { prisma } from "@/lib/prisma";

function clampScore(value: number) {
  return Math.min(140, Math.max(0, Math.round(value)));
}

function sigmoid(value: number) {
  return 1 / (1 + Math.exp(-value));
}

export async function calculateForecast(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const [attempts, tasks, mastery] = await Promise.all([
    prisma.testAttempt.findMany({
      where: { userId, status: "COMPLETED", score: { not: null } },
      orderBy: { completedAt: "asc" },
      select: { score: true, completedAt: true },
      take: 8,
    }),
    prisma.studyTask.findMany({
      where: { plan: { userId } },
      select: { completedAt: true, scheduledAt: true },
      take: 100,
    }),
    getMasteryMap(userId),
  ]);
  const scores = attempts.map((attempt) => attempt.score ?? 0);
  const current = scores.at(-1) ?? 0;
  const recent = scores.slice(-4);
  const growth =
    recent.length > 1 ? (recent.at(-1)! - recent[0]) / (recent.length - 1) : 0;
  const completion = tasks.length
    ? tasks.filter((task) => task.completedAt).length / tasks.length
    : 0;
  const daysToExam = user.examDate
    ? Math.max(0, (user.examDate.getTime() - Date.now()) / 86_400_000)
    : 60;
  const weeks = Math.min(16, daysToExam / 7);
  const weakPotential = mastery.reduce(
    (sum, row) =>
      sum +
      Math.max(0, 70 - row.effectiveMastery) *
        Math.min(2, row.topic.weight) *
        (row.confidenceScore / 100),
    0,
  );
  const potentialBoost = Math.min(18, weakPotential / 32);
  const paceBoost = Math.max(-8, Math.min(16, growth * Math.min(weeks, 6)));
  const planBoost = (completion - 0.5) * 10;
  const expected = clampScore(current + potentialBoost + paceBoost + planBoost);
  const uncertainty = Math.max(
    4,
    Math.round(14 - Math.min(8, attempts.length * 1.3) - Math.min(3, mastery.length / 4)),
  );
  const minimum = clampScore(expected - uncertainty);
  const optimistic = clampScore(expected + uncertainty * 0.7);
  const target = user.targetScore ?? 120;
  const chanceTarget = Math.round(
    sigmoid((expected - target) / Math.max(4, uncertainty)) * 100,
  );
  return {
    current,
    expected,
    minimum,
    optimistic,
    chanceTarget,
    target,
    growthPerTest: Number(growth.toFixed(1)),
    planCompletion: Math.round(completion * 100),
    daysToExam: Math.round(daysToExam),
    weakTopics: mastery.filter((row) => row.effectiveMastery < 60).length,
    mastery,
  };
}

export function calculateAdmissionChance(forecast: number, grantScore: number) {
  return Math.round(sigmoid((forecast - grantScore) / 5.5) * 100);
}
