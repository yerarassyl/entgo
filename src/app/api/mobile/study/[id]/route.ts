import { z } from "zod";
import { awardAchievements } from "@/lib/achievements";
import { getMobileSessionUser } from "@/lib/mobile-auth";
import { mobileJson, mobileOptions } from "@/lib/mobile-response";
import { jsonText } from "@/lib/exam";
import { recordQuestionEvidence } from "@/lib/mastery";
import { prisma } from "@/lib/prisma";
import { getActiveSubscription } from "@/lib/subscription";
import { awardXp } from "@/lib/xp";

const completeSchema = z.object({
  answers: z.record(z.string(), z.string()),
  durationSec: z.number().int().min(0).max(14_400).default(0),
});

export function OPTIONS() {
  return mobileOptions();
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getMobileSessionUser(request);
  if (!user) return mobileJson({ error: "Требуется вход." }, { status: 401 });
  if (!(await getActiveSubscription(user.id))) {
    return mobileJson({ error: "Учебный план доступен после оплаты подписки." }, { status: 403 });
  }
  const { id } = await context.params;
  const task = await prisma.studyTask.findFirst({
    where: { id, plan: { userId: user.id } },
    include: {
      topic: {
        include: {
          lesson: true,
          questions: {
            where: { status: "PUBLISHED" },
            orderBy: [{ difficulty: "asc" }, { createdAt: "asc" }],
            take: 5,
            include: { options: { orderBy: { position: "asc" } } },
          },
        },
      },
    },
  });
  if (!task) return mobileJson({ error: "Задача не найдена." }, { status: 404 });
  const [label, activity] = task.activity.split(":");
  return mobileJson({
    task: {
      id: task.id,
      title: task.title,
      label,
      activity,
      durationMin: task.durationMin,
      completed: Boolean(task.completedAt),
    },
    lesson: task.topic?.lesson
      ? {
          summary: task.topic.lesson.summary,
          rule: task.topic.lesson.rule,
          example: task.topic.lesson.example,
          mistake: task.topic.lesson.mistake,
        }
      : null,
    questions: (task.topic?.questions ?? []).map((question) => ({
      id: question.id,
      body: jsonText(question.body),
      explanation: jsonText(question.explanation),
      options: question.options.map((option) => ({
        id: option.id,
        text: jsonText(option.content),
      })),
    })),
  });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getMobileSessionUser(request);
  if (!user) return mobileJson({ error: "Требуется вход." }, { status: 401 });
  if (!(await getActiveSubscription(user.id))) {
    return mobileJson({ error: "Учебный план доступен после оплаты подписки." }, { status: 403 });
  }
  const parsed = completeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return mobileJson({ error: "Проверьте ответы." }, { status: 400 });
  const { id } = await context.params;
  const task = await prisma.studyTask.findFirst({
    where: { id, plan: { userId: user.id } },
    include: { topic: { include: { questions: { where: { status: "PUBLISHED" }, take: 5, include: { options: true } } } } },
  });
  if (!task) return mobileJson({ error: "Задача не найдена." }, { status: 404 });
  const questions = task.topic?.questions ?? [];
  const correct = questions.filter((question) =>
    question.options.some((option) => option.id === parsed.data.answers[question.id] && option.isCorrect),
  ).length;
  const accuracy = questions.length ? Math.round((correct / questions.length) * 100) : 100;
  if (questions.length && accuracy <= 40) {
    return mobileJson({ error: "Для завершения нужно набрать больше 40%.", accuracy }, { status: 400 });
  }
  const xp = questions.length ? (accuracy > 80 ? 25 : accuracy > 60 ? 20 : 10) : 0;
  if (!task.completedAt) {
    await prisma.$transaction([
      prisma.studyTask.update({
        where: { id: task.id },
        data: { completedAt: new Date(), xpAwarded: questions.length > 0 },
      }),
      prisma.learningSession.create({
        data: { userId: user.id, taskId: task.id, durationSec: parsed.data.durationSec },
      }),
    ]);
    for (const question of questions) {
      const selected = question.options.find((option) => option.id === parsed.data.answers[question.id]);
      await recordQuestionEvidence({
        userId: user.id,
        questionId: question.id,
        isCorrect: Boolean(selected?.isCorrect),
        difficulty: question.difficulty,
        timeSpentSec: Math.round(parsed.data.durationSec / Math.max(1, questions.length)),
        usedAiHelp: false,
      });
    }
    if (xp) {
      await awardXp({
        userId: user.id,
        reason: "PRACTICE_COMPLETED",
        amount: xp,
        sourceType: "study-task",
        sourceId: task.id,
        metadata: { correct, total: questions.length, accuracy },
      });
    }
    await awardAchievements(user.id);
  }
  return mobileJson({ completed: true, accuracy, xp });
}
