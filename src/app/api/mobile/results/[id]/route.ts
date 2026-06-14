import { getEntitlements } from "@/lib/entitlements";
import { jsonText } from "@/lib/exam";
import { calculateAdmissionChance, calculateForecast } from "@/lib/forecast";
import { getMobileSessionUser } from "@/lib/mobile-auth";
import { mobileJson, mobileOptions } from "@/lib/mobile-response";
import { prisma } from "@/lib/prisma";
import { getActiveSubscription } from "@/lib/subscription";

export function OPTIONS() {
  return mobileOptions();
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getMobileSessionUser(request);
  if (!user) return mobileJson({ error: "Требуется вход." }, { status: 401 });
  if (!(await getActiveSubscription(user.id))) {
    return mobileJson({ error: "Разбор ошибок доступен после оплаты подписки." }, { status: 403 });
  }
  const { id } = await context.params;
  const attempt = await prisma.testAttempt.findFirst({
    where: { id, userId: user.id, status: "COMPLETED" },
    include: {
      answers: {
        include: {
          option: true,
          question: {
            include: { subject: true, topic: true, options: { orderBy: { position: "asc" } } },
          },
        },
      },
    },
  });
  if (!attempt) return mobileJson({ error: "Результат не найден." }, { status: 404 });
  const [forecast, profile, entitlements] = await Promise.all([
    calculateForecast(user.id),
    prisma.user.findUniqueOrThrow({ where: { id: user.id }, include: { desiredUniversity: true } }),
    getEntitlements(user.id),
  ]);
  const subjectMap = new Map<string, { correct: number; total: number }>();
  for (const answer of attempt.answers) {
    const key = answer.question.subject.titleRu;
    const row = subjectMap.get(key) ?? { correct: 0, total: 0 };
    row.total += 1;
    if (answer.isCorrect) row.correct += 1;
    subjectMap.set(key, row);
  }
  return mobileJson({
    locked: !entitlements.paid,
    score: attempt.score ?? 0,
    correct: attempt.correctAnswers ?? 0,
    total: attempt.totalQuestions ?? attempt.answers.length,
    timeSpentSec: attempt.timeSpentSec ?? 0,
    xpAwarded: attempt.xpAwarded,
    aiHelpCount: attempt.aiHelpCount,
    forecast: {
      expected: forecast.expected,
      minimum: forecast.minimum,
      optimistic: forecast.optimistic,
      chanceTarget: forecast.chanceTarget,
    },
    university: profile.desiredUniversity ? {
      name: profile.desiredUniversity.shortName,
      grantScore: profile.desiredUniversity.grantScore,
      chance: calculateAdmissionChance(forecast.expected, profile.desiredUniversity.grantScore),
    } : null,
    subjects: [...subjectMap.entries()].map(([name, row]) => ({
      name,
      percent: row.total ? Math.round(row.correct / row.total * 100) : 0,
    })),
    answers: attempt.answers.map((answer) => ({
      id: answer.id,
      isCorrect: Boolean(answer.isCorrect),
      usedAiHelp: answer.usedAiHelp,
      topic: answer.question.topic.titleRu,
      subject: answer.question.subject.titleRu,
      question: jsonText(answer.question.body),
      selected: answer.option ? jsonText(answer.option.content) : "Без ответа",
      correct: jsonText(answer.question.options.find((option) => option.isCorrect)?.content ?? ""),
      explanation: jsonText(answer.question.explanation),
    })),
  });
}
