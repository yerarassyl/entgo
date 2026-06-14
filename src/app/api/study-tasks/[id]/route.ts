import { z } from "zod";
import { awardAchievements } from "@/lib/achievements";
import { getSessionUser } from "@/lib/auth";
import { recordQuestionEvidence } from "@/lib/mastery";
import { prisma } from "@/lib/prisma";
import { isSameOriginRequest } from "@/lib/request-security";
import { getActiveSubscription } from "@/lib/subscription";
import { awardXp } from "@/lib/xp";

const updateSchema = z.object({
  completed: z.boolean(),
  durationSec: z.number().int().min(0).max(14_400).optional(),
  answers: z.record(z.string(), z.string()).optional(),
});

function startOfToday() {
  const day = new Date();
  day.setHours(0, 0, 0, 0);
  return day;
}

function xpForAccuracy(correct: number, total: number) {
  if (!total) return 0;
  const accuracy = (correct / total) * 100;
  if (accuracy <= 40) return 0;
  if (accuracy <= 60) return 10;
  if (accuracy <= 80) return 20;
  return 25;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<unknown> },
) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "Недопустимый источник запроса." }, { status: 403 });
  }

  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Требуется вход." }, { status: 401 });

  if (!(await getActiveSubscription(user.id))) {
    return Response.json({ error: "Персональный план доступен после оплаты подписки." }, { status: 403 });
  }

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Некорректный статус задачи." }, { status: 400 });
  }

  const { id } = (await context.params) as { id?: string };
  if (!id) return Response.json({ error: "Задача не найдена." }, { status: 404 });
  const task = await prisma.studyTask.findFirst({
    where: { id, plan: { userId: user.id } },
    select: { id: true, durationMin: true, completedAt: true, activity: true, topicId: true, xpAwarded: true },
  });
  if (!task) return Response.json({ error: "Задача не найдена." }, { status: 404 });

  const activityType = task.activity.split(":").at(-1) ?? task.activity;
  const requiresCheck = ["REVIEW", "PRACTICE", "MINI_TEST", "THEORY"].includes(activityType);
  const questions = requiresCheck && task.topicId
    ? await prisma.question.findMany({
        where: { topicId: task.topicId, status: "PUBLISHED" },
        orderBy: [{ difficulty: "asc" }, { createdAt: "asc" }],
        take: 5,
        include: { options: true },
      })
    : [];
  const checkedAnswers = questions.map((question) => {
    const optionId = parsed.data.answers?.[question.id];
    const option = question.options.find((item) => item.id === optionId);
    return { question, isCorrect: Boolean(option?.isCorrect) };
  });
  const correctAnswers = checkedAnswers.filter((item) => item.isCorrect).length;
  const accuracy = questions.length
    ? Math.round((correctAnswers / questions.length) * 100)
    : 0;
  const xpAmount = xpForAccuracy(correctAnswers, questions.length);
  if (
    parsed.data.completed &&
    questions.length > 0 &&
    (checkedAnswers.length !== Object.keys(parsed.data.answers ?? {}).length ||
      accuracy <= 40)
  ) {
    return Response.json(
      { error: "Для завершения нужно набрать больше 40%." },
      { status: 400 },
    );
  }

  const completedAt = parsed.data.completed ? new Date() : null;
  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.studyTask.update({
      where: { id: task.id },
      data: { completedAt },
      select: { id: true, completedAt: true },
    });
    if (
      parsed.data.completed &&
      !task.completedAt &&
      parsed.data.durationSec &&
      parsed.data.durationSec > 0
    ) {
      await tx.learningSession.create({
        data: {
          userId: user.id,
          taskId: task.id,
          durationSec: parsed.data.durationSec,
        },
      });
    }
    return row;
  });

  const day = startOfToday();
  if (parsed.data.completed && !task.completedAt) {
    await prisma.streak.upsert({
      where: { userId_day: { userId: user.id, day } },
      update: {
        minutes: { increment: task.durationMin },
        points: { increment: 10 },
      },
      create: {
        userId: user.id,
        day,
        minutes: task.durationMin,
        points: 10,
      },
    });
  } else if (!parsed.data.completed && task.completedAt) {
    const streak = await prisma.streak.findUnique({
      where: { userId_day: { userId: user.id, day } },
    });
    if (streak) {
      await prisma.streak.update({
        where: { id: streak.id },
        data: {
          minutes: Math.max(0, streak.minutes - task.durationMin),
          points: Math.max(0, streak.points - 10),
        },
      });
    }
  }

  if (parsed.data.completed) await awardAchievements(user.id);
  if (parsed.data.completed && !task.completedAt && questions.length > 0) {
    for (const item of checkedAnswers) {
      await recordQuestionEvidence({
        userId: user.id,
        questionId: item.question.id,
        isCorrect: item.isCorrect,
        difficulty: item.question.difficulty,
        timeSpentSec: Math.round((parsed.data.durationSec ?? 0) / Math.max(1, questions.length)),
        usedAiHelp: false,
      });
    }
    await awardXp({
      userId: user.id,
      reason: "PRACTICE_COMPLETED",
      amount: xpAmount,
      sourceType: "study-task",
      sourceId: task.id,
      metadata: { correctAnswers, totalAnswers: questions.length, accuracy },
    });
    await prisma.studyTask.update({
      where: { id: task.id },
      data: { xpAwarded: true },
    });
  }
  return Response.json({
    id: updated.id,
    completedAt: updated.completedAt?.toISOString() ?? null,
    xp: xpAmount,
    accuracy,
    forecastGain: Number(Math.min(2.5, accuracy / 50).toFixed(1)),
  });
}
