import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { isSameOriginRequest } from "@/lib/request-security";
import { generateQwenText, qwenConfigured } from "@/lib/llm";

const schema = z.object({
  question: z.string().trim().min(5).max(2_000),
  explanation: z.string().trim().min(5).max(4_000),
});

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "Недопустимый источник запроса." }, { status: 403 });
  }
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Требуется вход." }, { status: 401 });
  const rate = await checkRateLimit(request, `ai-explain:${user.id}`, 15, 60 * 60);
  if (!rate.allowed) {
    return Response.json({ error: "Лимит объяснений на этот час исчерпан." }, { status: 429 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Некорректный вопрос." }, { status: 400 });

  if (!qwenConfigured()) {
    return Response.json({
      explanation: `Проще: ${parsed.data.explanation} Сначала найди, что известно, затем выбери одно правило и проверь ответ обратным действием.`,
      generated: false,
    });
  }

  const explanation = await generateQwenText({
    system: "Ты объясняешь задания ЕНТ школьнику простым русским языком. Ответь кратко: суть, один пример, типичная ошибка. Не выдумывай факты.",
    user: `Вопрос: ${parsed.data.question}\nТекущее объяснение: ${parsed.data.explanation}\nОбъясни ещё проще.`,
    maxTokens: 350,
  });
  if (!explanation) {
    return Response.json({ error: "ИИ временно недоступен." }, { status: 503 });
  }
  return Response.json({ explanation, generated: true });
}
