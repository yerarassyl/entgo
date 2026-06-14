import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { getEntitlements } from "@/lib/entitlements";
import { jsonText } from "@/lib/exam";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { isSameOriginRequest } from "@/lib/request-security";
import { generateQwenText } from "@/lib/llm";

const schema = z.object({ questionId: z.string().min(1).max(100) });

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "Недопустимый источник запроса." }, { status: 403 });
  }
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Требуется вход." }, { status: 401 });
  const entitlements = await getEntitlements(user.id);
  if (!entitlements.canUseAiTutor) {
    return Response.json({ error: "AI-помощь доступна во время trial и в Premium.", upgrade: true }, { status: 403 });
  }
  const rate = await checkRateLimit(request, `exam-help:${user.id}`, 20, 60 * 60);
  if (!rate.allowed) return Response.json({ error: "Лимит подсказок исчерпан." }, { status: 429 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Некорректный вопрос." }, { status: 400 });
  const { id } = await context.params;
  const attempt = await prisma.testAttempt.findFirst({
    where: { id, userId: user.id, status: "IN_PROGRESS" },
    select: { testId: true },
  });
  if (!attempt) return Response.json({ error: "Активная попытка не найдена." }, { status: 404 });
  const row = await prisma.testQuestion.findFirst({
    where: { testId: attempt.testId, questionId: parsed.data.questionId },
    include: { question: { include: { topic: true } } },
  });
  if (!row) return Response.json({ error: "Вопрос не найден." }, { status: 404 });

  let hint = `Определи, к какой части темы «${row.question.topic.titleRu}» относится условие. Выпиши данные, выбери одно подходящее правило и исключи явно противоречащие варианты. Я намеренно не называю готовый ответ.`;
  const generatedHint = await generateQwenText({
    system: "Дай ученику ЕНТ только наводящую подсказку. Не называй букву, вариант, правильный ответ и не решай задачу до конца.",
    user: `Тема: ${row.question.topic.titleRu}\nВопрос: ${jsonText(row.question.body)}`,
    maxTokens: 260,
  });
  if (generatedHint) {
    hint = generatedHint;
  }
  await prisma.testAttempt.update({ where: { id }, data: { aiHelpCount: { increment: 1 } } });
  return Response.json({ hint, xpPenalty: 8 });
}
