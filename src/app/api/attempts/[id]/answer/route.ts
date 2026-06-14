import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSameOriginRequest } from "@/lib/request-security";
import { getActiveSubscription } from "@/lib/subscription";

const answerSchema = z.object({
  questionId: z.string().min(1).max(100),
  optionId: z.string().min(1).max(100),
  timeSpentSec: z.number().int().min(0).max(14_400),
  usedAiHelp: z.boolean().default(false),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "Недопустимый источник запроса." }, { status: 403 });
  }

  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Требуется вход." }, { status: 401 });

  if (!(await getActiveSubscription(user.id))) {
    return Response.json({ error: "Ответы в пробнике доступны после оплаты подписки." }, { status: 403 });
  }

  const parsed = answerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Некорректный ответ." }, { status: 400 });
  }

  const { id } = await context.params;
  const attempt = await prisma.testAttempt.findFirst({
    where: { id, userId: user.id, status: "IN_PROGRESS" },
    select: { id: true, testId: true, expiresAt: true },
  });
  if (!attempt) {
    return Response.json({ error: "Активная попытка не найдена." }, { status: 404 });
  }
  if (attempt.expiresAt && attempt.expiresAt <= new Date()) {
    await prisma.testAttempt.update({
      where: { id: attempt.id },
      data: { status: "ABANDONED" },
    });
    return Response.json({ error: "Время попытки истекло." }, { status: 410 });
  }

  const testQuestion = await prisma.testQuestion.findFirst({
    where: { testId: attempt.testId, questionId: parsed.data.questionId },
    include: {
      question: {
        include: { options: { orderBy: { position: "asc" } } },
      },
    },
  });
  if (!testQuestion) {
    return Response.json({ error: "Вопрос не относится к этому тесту." }, { status: 400 });
  }

  const selected = testQuestion.question.options.find(
    (option) => option.id === parsed.data.optionId,
  );
  if (!selected) {
    return Response.json({ error: "Вариант ответа не найден." }, { status: 400 });
  }
  await prisma.attemptAnswer.upsert({
    where: {
      attemptId_questionId: {
        attemptId: attempt.id,
        questionId: testQuestion.questionId,
      },
    },
    update: {
      optionId: selected.id,
      isCorrect: selected.isCorrect,
      timeSpentSec: parsed.data.timeSpentSec,
      answeredAt: new Date(),
      usedAiHelp: parsed.data.usedAiHelp,
    },
    create: {
      attemptId: attempt.id,
      questionId: testQuestion.questionId,
      optionId: selected.id,
      isCorrect: selected.isCorrect,
      timeSpentSec: parsed.data.timeSpentSec,
      usedAiHelp: parsed.data.usedAiHelp,
    },
  });

  return Response.json({ saved: true });
}
