import { getSessionUser } from "@/lib/auth";
import {
  ensureDiagnosticTest,
  ensureErrorReviewTest,
  ensureSpecificTest,
  ensureTopicTest,
  jsonText,
} from "@/lib/exam";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { isSameOriginRequest } from "@/lib/request-security";
import { getEntitlements } from "@/lib/entitlements";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "Недопустимый источник запроса." }, { status: 403 });
  }

  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Требуется вход." }, { status: 401 });

  const rateLimit = await checkRateLimit(request, `attempt-start:${user.id}`, 10, 60);
  if (!rateLimit.allowed) {
    return Response.json({ error: "Слишком много попыток. Подождите минуту." }, { status: 429 });
  }
  const entitlements = await getEntitlements(user.id);
  const body = (await request.json().catch(() => ({}))) as {
    topicId?: unknown;
    testId?: unknown;
    errorReview?: unknown;
  };
  const topicId = typeof body.topicId === "string" && body.topicId.length <= 100 ? body.topicId : undefined;
  const testId = typeof body.testId === "string" && body.testId.length <= 100 ? body.testId : undefined;
  const errorReview = Boolean(body.errorReview);

  if (!entitlements.canTakeFullTest) {
    return Response.json(
      { error: "Пробники доступны после оплаты подписки.", upgrade: true },
      { status: 403 },
    );
  }
  if (topicId && !entitlements.canUseTopics) {
    return Response.json({ error: "Тематические тесты доступны после оплаты подписки.", upgrade: true }, { status: 403 });
  }

  let test = null;
  if (errorReview) {
    test = await ensureErrorReviewTest(user.id);
    if (!test) {
      return Response.json({ error: "У вас пока нет сохраненных ошибок для повторения." }, { status: 404 });
    }
  } else if (testId) {
    test = await ensureSpecificTest(testId);
  } else if (topicId) {
    test = await ensureTopicTest(topicId);
  } else {
    test = await ensureDiagnosticTest();
  }

  if (!test) {
    return Response.json({ error: "Для этого теста пока нет опубликованных заданий." }, { status: 404 });
  }

  const now = new Date();
  const existing = await prisma.testAttempt.findFirst({
    where: {
      userId: user.id,
      testId: test.id,
      status: "IN_PROGRESS",
      expiresAt: { gt: now },
    },
    orderBy: { startedAt: "desc" },
  });

  const attempt =
    existing ??
    (await prisma.testAttempt.create({
      data: {
        userId: user.id,
        testId: test.id,
        status: "IN_PROGRESS",
        totalQuestions: test.questions.length,
        expiresAt: new Date(now.getTime() + test.durationSec * 1_000),
      },
    }));

  const savedAnswers = await prisma.attemptAnswer.findMany({
    where: { attemptId: attempt.id },
    select: { questionId: true, optionId: true, usedAiHelp: true },
  });

  return Response.json({
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
      options: question.options.map((option) => ({
        id: option.id,
        content: jsonText(option.content),
      })),
    })),
    savedAnswers,
  });
}
