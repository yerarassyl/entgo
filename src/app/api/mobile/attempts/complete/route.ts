import { z } from "zod";
import { awardAchievements } from "@/lib/achievements";
import { getMobileSessionUser } from "@/lib/mobile-auth";
import { mobileJson, mobileOptions } from "@/lib/mobile-response";
import { recordQuestionEvidence } from "@/lib/mastery";
import { prisma } from "@/lib/prisma";
import { calculateScore } from "@/lib/scoring";
import { regenerateCurrentStudyPlan } from "@/lib/study-plan";
import { getActiveSubscription } from "@/lib/subscription";
import { awardXp } from "@/lib/xp";

const schema = z.object({
  attemptId: z.string().min(1).max(100),
  timeSpentSec: z.number().int().min(0).max(14_400),
});

export function OPTIONS() {
  return mobileOptions();
}

export async function POST(request: Request) {
  const user = await getMobileSessionUser(request);
  if (!user) return mobileJson({ error: "Требуется вход." }, { status: 401 });
  if (!(await getActiveSubscription(user.id))) {
    return mobileJson({ error: "Завершение пробника доступно после оплаты подписки." }, { status: 403 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return mobileJson({ error: "Некорректные данные попытки." }, { status: 400 });
  const attempt = await prisma.testAttempt.findFirst({
    where: { id: parsed.data.attemptId, userId: user.id, status: "IN_PROGRESS" },
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
  if (!attempt) return mobileJson({ error: "Активная попытка не найдена." }, { status: 404 });
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
  return mobileJson({ attemptId: completed.id, score, correct, total, xpAwarded });
}
