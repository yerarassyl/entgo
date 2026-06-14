import "server-only";
import { prisma } from "@/lib/prisma";

function clamp(value: number) {
  return Math.min(100, Math.max(0, value));
}

function startOfDay(date = new Date()) {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return day;
}

function masteryDelta(difficulty: number, correct: boolean, usedAiHelp: boolean) {
  const positive = difficulty >= 4 ? 4 : difficulty >= 2 ? 2 : 1;
  const negative = difficulty >= 4 ? -4 : difficulty >= 2 ? -3 : -2;
  const delta = correct ? positive : negative;
  return usedAiHelp && delta > 0 ? delta * 0.35 : delta;
}

export async function recordQuestionEvidence({
  userId,
  questionId,
  isCorrect,
  difficulty,
  timeSpentSec,
  usedAiHelp,
}: {
  userId: string;
  questionId: string;
  isCorrect: boolean;
  difficulty: number;
  timeSpentSec: number;
  usedAiHelp: boolean;
}) {
  const question = await prisma.question.findUniqueOrThrow({
    where: { id: questionId },
    select: { topicId: true },
  });
  const day = startOfDay();
  await prisma.masteryEvidence.create({
    data: {
      userId,
      topicId: question.topicId,
      questionId,
      type: "TEST",
      isCorrect,
      difficulty,
      timeSpentSec,
      usedAiHelp,
      day,
    },
  });

  const [current, aggregate, studyDays, recentErrors] = await Promise.all([
    prisma.topicMastery.findUnique({
      where: { userId_topicId: { userId, topicId: question.topicId } },
    }),
    prisma.masteryEvidence.aggregate({
      where: { userId, topicId: question.topicId, isCorrect: { not: null } },
      _count: true,
      _avg: { timeSpentSec: true },
    }),
    prisma.masteryEvidence.groupBy({
      by: ["day"],
      where: { userId, topicId: question.topicId },
    }),
    prisma.masteryEvidence.count({
      where: {
        userId,
        topicId: question.topicId,
        isCorrect: false,
        createdAt: { gte: new Date(Date.now() - 30 * 86_400_000) },
      },
    }),
  ]);
  const totalAnswers = aggregate._count;
  const previousMastery = current?.masteryScore ?? 50;
  const rawMastery = clamp(
    previousMastery + masteryDelta(difficulty, isCorrect, usedAiHelp),
  );
  const confidence = clamp(
    Math.min(70, totalAnswers * 4) +
      Math.min(20, studyDays.length * 4) +
      Math.min(10, (Date.now() - (current?.firstObservedAt.getTime() ?? Date.now())) / 604_800_000 * 10),
  );
  const expectedSeconds = difficulty >= 4 ? 150 : difficulty >= 2 ? 100 : 70;
  const speed = clamp(100 - Math.max(0, ((aggregate._avg.timeSpentSec ?? expectedSeconds) - expectedSeconds) / expectedSeconds * 50));
  const daysSincePractice = current?.lastPracticedAt
    ? (Date.now() - current.lastPracticedAt.getTime()) / 86_400_000
    : 0;
  const forgetting = clamp(daysSincePractice * 1.4);
  const errorScore = clamp(recentErrors * 9);
  const topic = await prisma.topic.findUniqueOrThrow({
    where: { id: question.topicId },
    select: { weight: true },
  });
  const priority = clamp(
    (100 - rawMastery) * 0.5 +
      topic.weight * 18 +
      errorScore * 0.2 +
      forgetting * 0.12,
  );

  await prisma.topicMastery.upsert({
    where: { userId_topicId: { userId, topicId: question.topicId } },
    update: {
      masteryScore: rawMastery,
      confidenceScore: confidence,
      forgettingScore: forgetting,
      speedScore: speed,
      errorScore,
      priorityScore: priority,
      totalAnswers,
      correctAnswers: { increment: isCorrect ? 1 : 0 },
      currentCorrectStreak: isCorrect ? { increment: 1 } : 0,
      distinctStudyDays: studyDays.length,
      lastPracticedAt: new Date(),
    },
    create: {
      userId,
      topicId: question.topicId,
      masteryScore: rawMastery,
      confidenceScore: confidence,
      forgettingScore: forgetting,
      speedScore: speed,
      errorScore,
      priorityScore: priority,
      totalAnswers,
      correctAnswers: isCorrect ? 1 : 0,
      currentCorrectStreak: isCorrect ? 1 : 0,
      distinctStudyDays: studyDays.length,
      lastPracticedAt: new Date(),
    },
  });

  if (!isCorrect) {
    await prisma.errorMemory.upsert({
      where: { userId_questionId: { userId, questionId } },
      update: {
        status: "NEW",
        consecutiveCorrect: 0,
        lastErrorAt: new Date(),
      },
      create: { userId, topicId: question.topicId, questionId },
    });
  } else {
    const openErrors = await prisma.errorMemory.findMany({
      where: {
        userId,
        topicId: question.topicId,
        status: { not: "MASTERED" },
      },
    });
    for (const error of openErrors) {
      const consecutive = error.consecutiveCorrect + 1;
      const reviewedOnAnotherDay =
        !error.lastReviewedAt ||
        startOfDay(error.lastReviewedAt).getTime() !== startOfDay().getTime();
      const distinctCorrectDays = Math.min(
        3,
        error.distinctCorrectDays + (reviewedOnAnotherDay ? 1 : 0),
      );
      const status =
        consecutive >= 3 && distinctCorrectDays >= 3
          ? "MASTERED"
          : consecutive >= 2
            ? "CONSOLIDATED"
            : "REPEATING";
      await prisma.errorMemory.update({
        where: { id: error.id },
        data: {
          consecutiveCorrect: consecutive,
          distinctCorrectDays,
          status,
          lastReviewedAt: new Date(),
          masteredAt: status === "MASTERED" ? new Date() : null,
        },
      });
    }
  }
}

export async function getMasteryMap(userId: string) {
  const rows = await prisma.topicMastery.findMany({
    where: { userId },
    include: { topic: { include: { subject: true } } },
    orderBy: { priorityScore: "desc" },
  });
  return rows.map((row) => {
    const days = row.lastPracticedAt
      ? Math.max(0, (Date.now() - row.lastPracticedAt.getTime()) / 86_400_000)
      : 0;
    const effectiveMastery = clamp(row.masteryScore - Math.max(0, days - 7) * 0.28);
    return { ...row, effectiveMastery };
  });
}
