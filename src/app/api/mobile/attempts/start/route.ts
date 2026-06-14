import { getEntitlements } from "@/lib/entitlements";
import { ensureDiagnosticTest, ensureTopicTest, jsonText } from "@/lib/exam";
import { getMobileSessionUser } from "@/lib/mobile-auth";
import { mobileJson, mobileOptions } from "@/lib/mobile-response";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

export function OPTIONS() {
  return mobileOptions();
}

export async function POST(request: Request) {
  const user = await getMobileSessionUser(request);
  if (!user) return mobileJson({ error: "Требуется вход." }, { status: 401 });
  const rate = await checkRateLimit(request, `mobile-attempt-start:${user.id}`, 10, 60);
  if (!rate.allowed) return mobileJson({ error: "Подождите минуту перед новой попыткой." }, { status: 429 });

  const body = await request.json().catch(() => ({})) as { topicId?: unknown };
  const topicId = typeof body.topicId === "string" && body.topicId.length <= 100 ? body.topicId : undefined;
  const entitlements = await getEntitlements(user.id);
  if (!entitlements.canTakeFullTest) {
    return mobileJson({ error: "Пробники доступны после оплаты подписки.", upgrade: true }, { status: 403 });
  }
  if (topicId && !entitlements.canUseTopics) {
    return mobileJson({ error: "Тематические тесты доступны после оплаты подписки.", upgrade: true }, { status: 403 });
  }
  const test = topicId ? await ensureTopicTest(topicId) : await ensureDiagnosticTest();
  if (!test) return mobileJson({ error: "Для этой темы пока нет заданий." }, { status: 404 });

  const now = new Date();
  const existing = await prisma.testAttempt.findFirst({
    where: { userId: user.id, testId: test.id, status: "IN_PROGRESS", expiresAt: { gt: now } },
    orderBy: { startedAt: "desc" },
  });
  const attempt = existing ?? await prisma.testAttempt.create({
    data: {
      userId: user.id,
      testId: test.id,
      totalQuestions: test.questions.length,
      expiresAt: new Date(now.getTime() + test.durationSec * 1_000),
    },
  });
  const savedAnswers = await prisma.attemptAnswer.findMany({
    where: { attemptId: attempt.id },
    select: { questionId: true, optionId: true, usedAiHelp: true },
  });
  return mobileJson({
    attempt: {
      id: attempt.id,
      startedAt: attempt.startedAt.toISOString(),
      expiresAt: attempt.expiresAt?.toISOString() ?? null,
      durationSec: test.durationSec,
    },
    questions: test.questions.map(({ question }) => ({
      id: question.id,
      subject: question.subject.titleRu,
      topic: question.topic.titleRu,
      body: jsonText(question.body),
      options: question.options.map((option) => ({ id: option.id, content: jsonText(option.content) })),
    })),
    savedAnswers,
  });
}
