import { z } from "zod";
import { getEntitlements } from "@/lib/entitlements";
import { generateQwenText } from "@/lib/llm";
import { getMasteryMap } from "@/lib/mastery";
import { getMobileSessionUser } from "@/lib/mobile-auth";
import { mobileJson, mobileOptions } from "@/lib/mobile-response";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  message: z.string().trim().min(2).max(2_000),
  selectedText: z.string().trim().max(2_500).optional(),
  pageTitle: z.string().trim().max(200).optional(),
  threadId: z.string().trim().max(100).optional(),
  mode: z.enum(["tutor", "exam_hint"]).default("tutor"),
});

export function OPTIONS() {
  return mobileOptions();
}

export async function POST(request: Request) {
  const user = await getMobileSessionUser(request);
  if (!user) return mobileJson({ error: "Требуется вход." }, { status: 401 });
  const entitlements = await getEntitlements(user.id);
  if (!entitlements.canUseAiTutor) {
    return mobileJson({ error: "AI-репетитор доступен в Premium.", upgrade: true }, { status: 403 });
  }
  const rate = await checkRateLimit(request, `mobile-ai:${user.id}`, 30, 60 * 60);
  if (!rate.allowed) return mobileJson({ error: "Лимит AI-запросов на этот час исчерпан." }, { status: 429 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return mobileJson({ error: "Проверьте текст вопроса." }, { status: 400 });

  const mastery = await getMasteryMap(user.id);
  const weakTopics = mastery.slice(0, 3).map((row) => `${row.topic.titleRu}: ${Math.round(row.effectiveMastery)}%`).join(", ");
  const existing = parsed.data.threadId
    ? await prisma.aiThread.findFirst({ where: { id: parsed.data.threadId, userId: user.id } })
    : null;
  const thread = existing ?? await prisma.aiThread.create({
    data: { userId: user.id, title: parsed.data.pageTitle ?? "Разбор с AI", contextUrl: "entgo://ai" },
  });
  await prisma.aiMessage.create({
    data: {
      threadId: thread.id,
      role: "user",
      content: parsed.data.message,
      context: { selectedText: parsed.data.selectedText, pageTitle: parsed.data.pageTitle, mode: parsed.data.mode },
    },
  });
  const examHint = parsed.data.mode === "exam_hint";
  const generated = await generateQwenText({
    system: examHint
      ? "Ты AI-репетитор ЕНТ. Дай короткую наводящую подсказку, но не называй правильный вариант или готовое решение. Пиши простым русским языком."
      : "Ты персональный AI-репетитор ЕНТ. Объясняй простым русским языком: сначала суть, затем короткие шаги и один пример. Не выдумывай факты.",
    user: [
      parsed.data.pageTitle ? `Страница: ${parsed.data.pageTitle}` : "",
      parsed.data.selectedText ? `Контекст: ${parsed.data.selectedText}` : "",
      weakTopics ? `Слабые места ученика: ${weakTopics}` : "",
      `Вопрос: ${parsed.data.message}`,
    ].filter(Boolean).join("\n"),
  });
  const answer = generated ?? (examHint
    ? "Определи тему задачи, выпиши данные и исключи варианты, которые противоречат условию. Затем проверь оставшиеся варианты обратным действием."
    : "Сначала сформулируй главную идею одним предложением. Затем выбери подходящее правило и проверь его на простом примере.");
  await prisma.aiMessage.create({
    data: {
      threadId: thread.id,
      role: "assistant",
      content: answer,
      context: { selectedText: parsed.data.selectedText, pageTitle: parsed.data.pageTitle, mode: parsed.data.mode },
    },
  });
  return mobileJson({ answer, threadId: thread.id, generated: Boolean(generated) });
}
