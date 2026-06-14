import { z } from "zod";
import { getMobileSessionUser } from "@/lib/mobile-auth";
import { mobileJson, mobileOptions } from "@/lib/mobile-response";
import { prisma } from "@/lib/prisma";
import { getActiveSubscription } from "@/lib/subscription";

const schema = z.object({
  questionId: z.string().min(1).max(100),
  optionId: z.string().min(1).max(100),
  timeSpentSec: z.number().int().min(0).max(14_400),
  usedAiHelp: z.boolean().default(false),
});

export function OPTIONS() {
  return mobileOptions();
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getMobileSessionUser(request);
  if (!user) return mobileJson({ error: "Требуется вход." }, { status: 401 });
  if (!(await getActiveSubscription(user.id))) {
    return mobileJson({ error: "Ответы в пробнике доступны после оплаты подписки." }, { status: 403 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return mobileJson({ error: "Некорректный ответ." }, { status: 400 });
  const { id } = await context.params;
  const attempt = await prisma.testAttempt.findFirst({
    where: { id, userId: user.id, status: "IN_PROGRESS" },
    select: { id: true, testId: true, expiresAt: true },
  });
  if (!attempt) return mobileJson({ error: "Активная попытка не найдена." }, { status: 404 });
  if (attempt.expiresAt && attempt.expiresAt <= new Date()) {
    await prisma.testAttempt.update({ where: { id }, data: { status: "ABANDONED" } });
    return mobileJson({ error: "Время попытки истекло." }, { status: 410 });
  }
  const row = await prisma.testQuestion.findFirst({
    where: { testId: attempt.testId, questionId: parsed.data.questionId },
    include: { question: { include: { options: true } } },
  });
  const selected = row?.question.options.find((option) => option.id === parsed.data.optionId);
  if (!row || !selected) return mobileJson({ error: "Вариант ответа не найден." }, { status: 400 });
  await prisma.attemptAnswer.upsert({
    where: { attemptId_questionId: { attemptId: id, questionId: row.questionId } },
    update: {
      optionId: selected.id,
      isCorrect: selected.isCorrect,
      timeSpentSec: parsed.data.timeSpentSec,
      usedAiHelp: parsed.data.usedAiHelp,
      answeredAt: new Date(),
    },
    create: {
      attemptId: id,
      questionId: row.questionId,
      optionId: selected.id,
      isCorrect: selected.isCorrect,
      timeSpentSec: parsed.data.timeSpentSec,
      usedAiHelp: parsed.data.usedAiHelp,
    },
  });
  return mobileJson({ saved: true });
}
