import { z } from "zod";
import { awardAchievements } from "@/lib/achievements";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSameOriginRequest } from "@/lib/request-security";
import { calculateScore } from "@/lib/scoring";
import { awardXp } from "@/lib/xp";
import { recordQuestionEvidence } from "@/lib/mastery";
import { regenerateCurrentStudyPlan } from "@/lib/study-plan";
import { getActiveSubscription } from "@/lib/subscription";

const attemptSchema = z.object({
  attemptId: z.string().min(1).max(100),
  timeSpentSec: z.number().int().min(0).max(14_400),
});

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "Недопустимый источник запроса." }, { status: 403 });
  }

  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Требуется вход." }, { status: 401 });
  if (!(await getActiveSubscription(user.id))) {
    return Response.json({ error: "Завершение пробника доступно после оплаты подписки.", upgrade: true }, { status: 403 });
  }

  const parsed = attemptSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Некорректные данные попытки." }, { status: 400 });
  }

  const attempt = await prisma.testAttempt.findFirst({
    where: {
      id: parsed.data.attemptId,
      userId: user.id,
      status: "IN_PROGRESS",
    },
    include: {
      answers: {
        select: {
          questionId: true,
          isCorrect: true,
          timeSpentSec: true,
          usedAiHelp: true,
          question: { select: { difficulty: true } },
        },
      },
      test: { select: { _count: { select: { questions: true } } } },
    },
  });
  if (!attempt) {
    return Response.json({ error: "Активная попытка не найдена." }, { status: 404 });
  }

  const correct = attempt.answers.filter((answer) => answer.isCorrect).length;
  const total = attempt.test._count.questions;
  const score = calculateScore(correct, total);
  const aiHelpCount = attempt.answers.filter((answer) => answer.usedAiHelp).length;
  const baseXp = 40 + correct * 5;
  const xpAwarded = Math.max(10, baseXp - aiHelpCount * 8);
  const completed = await prisma.testAttempt.update({
    where: { id: attempt.id },
    data: {
      status: "COMPLETED",
      score,
      correctAnswers: correct,
      totalQuestions: total,
      timeSpentSec: parsed.data.timeSpentSec,
      completedAt: new Date(),
      expiresAt: null,
      aiHelpCount,
      xpAwarded,
    },
    select: { id: true, score: true },
  });
  for (const answer of attempt.answers) {
    await recordQuestionEvidence({
      userId: user.id,
      questionId: answer.questionId,
      isCorrect: Boolean(answer.isCorrect),
      difficulty: answer.question.difficulty,
      timeSpentSec: answer.timeSpentSec,
      usedAiHelp: answer.usedAiHelp,
    });
  }
  await awardXp({
    userId: user.id,
    reason: "TEST_COMPLETED",
    amount: baseXp,
    sourceType: "attempt",
    sourceId: completed.id,
    metadata: { correct, total, aiHelpCount },
  });
  if (aiHelpCount) {
    await awardXp({
      userId: user.id,
      reason: "AI_HELP_PENALTY",
      amount: -aiHelpCount * 8,
      sourceType: "attempt",
      sourceId: completed.id,
      metadata: { aiHelpCount },
    });
  }
  await awardAchievements(user.id);
  await regenerateCurrentStudyPlan(user.id).catch(() => undefined);

  return Response.json({
    attemptId: completed.id,
    score: completed.score,
    correct,
    total,
    xpAwarded,
  });
}
