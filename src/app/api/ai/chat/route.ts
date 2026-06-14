import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { getEntitlements } from "@/lib/entitlements";
import { getMasteryMap } from "@/lib/mastery";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { isSameOriginRequest } from "@/lib/request-security";
import { generateQwenText } from "@/lib/llm";

const schema = z.object({
  message: z.string().trim().min(2).max(2_000),
  selectedText: z.string().trim().max(2_500).optional(),
  contextUrl: z.string().trim().max(500).optional(),
  pageTitle: z.string().trim().max(200).optional(),
  threadId: z.string().trim().max(100).optional(),
  mode: z.enum(["tutor", "exam_hint"]).default("tutor"),
});

function fallbackAnswer(message: string, selectedText?: string, examHint?: boolean) {
  const context = selectedText ? `По выделенному фрагменту «${selectedText.slice(0, 180)}»: ` : "";
  if (examHint) {
    return `${context}не выбирай ответ сразу. Выпиши, что дано, определи тему и исключи варианты, которые противоречат условию. Затем проверь оставшиеся варианты обратным действием.`;
  }
  return `${context}сначала сформулируй идею одним предложением, затем примени одно правило на простом примере. Вопрос «${message.slice(0, 120)}» лучше разобрать через шаги: что известно, какое правило подходит и как проверить результат.`;
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "Недопустимый источник запроса." }, { status: 403 });
  }
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Требуется вход." }, { status: 401 });
  const entitlements = await getEntitlements(user.id);
  if (!entitlements.canUseAiTutor) {
    return Response.json(
      { error: "AI-репетитор доступен во время пробного периода и в Premium.", upgrade: true },
      { status: 403 },
    );
  }
  const rate = await checkRateLimit(request, `ai-chat:${user.id}`, 30, 60 * 60);
  if (!rate.allowed) {
    return Response.json({ error: "Лимит AI-запросов на этот час исчерпан." }, { status: 429 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Проверьте текст вопроса." }, { status: 400 });

  const mastery = await getMasteryMap(user.id);
  const weakTopics = mastery
    .slice(0, 3)
    .map((row) => `${row.topic.titleRu}: ${Math.round(row.effectiveMastery)}%`)
    .join(", ");
  const thread = parsed.data.threadId
    ? await prisma.aiThread.findFirst({ where: { id: parsed.data.threadId, userId: user.id } })
    : null;
  const activeThread =
    thread ??
    (await prisma.aiThread.create({
      data: {
        userId: user.id,
        title: parsed.data.pageTitle ?? "Разбор с AI",
        contextUrl: parsed.data.contextUrl,
      },
    }));
  const context = {
    selectedText: parsed.data.selectedText,
    contextUrl: parsed.data.contextUrl,
    pageTitle: parsed.data.pageTitle,
    mode: parsed.data.mode,
  };
  await prisma.aiMessage.create({
    data: { threadId: activeThread.id, role: "user", content: parsed.data.message, context },
  });

  let answer = fallbackAnswer(
    parsed.data.message,
    parsed.data.selectedText,
    parsed.data.mode === "exam_hint",
  );
  let generated = false;
  const system =
    parsed.data.mode === "exam_hint"
      ? "Ты AI-репетитор ЕНТ. Дай короткую наводящую подсказку, но не называй правильный вариант, букву ответа или готовое решение. Объясняй простым русским языком."
      : "Ты персональный AI-репетитор ЕНТ. Объясняй простым русским языком: сначала суть, затем короткие шаги и один пример. Учитывай контекст страницы и выделенный текст. Не выдумывай факты.";
  const text = await generateQwenText({
    system,
    user: [
      parsed.data.pageTitle ? `Страница: ${parsed.data.pageTitle}` : "",
      parsed.data.selectedText ? `Выделенный текст: ${parsed.data.selectedText}` : "",
      weakTopics ? `Слабые места ученика: ${weakTopics}` : "",
      `Вопрос ученика: ${parsed.data.message}`,
    ].filter(Boolean).join("\n"),
  });
  if (text) {
    answer = text;
    generated = true;
  }
  await prisma.aiMessage.create({
    data: { threadId: activeThread.id, role: "assistant", content: answer, context },
  });
  return Response.json({ answer, threadId: activeThread.id, generated });
}
