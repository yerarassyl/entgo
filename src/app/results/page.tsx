import { notFound } from "next/navigation";
import { ResultsClient } from "@/components/results-client";
import { requirePaidUser } from "@/lib/paid-access";
import { jsonText } from "@/lib/exam";
import { prisma } from "@/lib/prisma";
import { calculateAdmissionChance, calculateForecast } from "@/lib/forecast";
import { getEntitlements } from "@/lib/entitlements";

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ attempt?: string }>;
}) {
  const user = await requirePaidUser();

  const { attempt: requestedAttempt } = await searchParams;
  const attempt = await prisma.testAttempt.findFirst({
    where: {
      userId: user.id,
      status: "COMPLETED",
      ...(requestedAttempt ? { id: requestedAttempt } : {}),
    },
    orderBy: { completedAt: "desc" },
    include: {
      answers: {
        include: {
          option: true,
          question: {
            include: {
              subject: true,
              topic: true,
              options: { orderBy: { position: "asc" } },
            },
          },
        },
      },
    },
  });
  if (!attempt) notFound();
  const entitlements = await getEntitlements(user.id);
  const [allAttempts, lowerAttempts, forecast, profile] = await Promise.all([
    prisma.testAttempt.count({ where: { status: "COMPLETED", score: { not: null } } }),
    prisma.testAttempt.count({
      where: { status: "COMPLETED", score: { lt: attempt.score ?? 0 } },
    }),
    calculateForecast(user.id),
    prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      include: { desiredUniversity: true },
    }),
  ]);

  const subjectMap = new Map<string, { correct: number; total: number }>();
  for (const answer of attempt.answers) {
    const subject = answer.question.subject.titleRu;
    const current = subjectMap.get(subject) ?? { correct: 0, total: 0 };
    current.total += 1;
    if (answer.isCorrect) current.correct += 1;
    subjectMap.set(subject, current);
  }

  return (
    <ResultsClient
      result={{
        locked: !entitlements.paid,
        id: attempt.id,
        score: attempt.score ?? 0,
        correct: attempt.correctAnswers ?? attempt.answers.filter((item) => item.isCorrect).length,
        total: attempt.totalQuestions ?? attempt.answers.length,
        timeSpentSec: attempt.timeSpentSec ?? 0,
        betterThan: allAttempts ? Math.round((lowerAttempts / allAttempts) * 100) : 0,
        xpAwarded: attempt.xpAwarded,
        aiHelpCount: attempt.aiHelpCount,
        forecast: {
          expected: forecast.expected,
          minimum: forecast.minimum,
          optimistic: forecast.optimistic,
          chanceTarget: forecast.chanceTarget,
        },
        university: profile.desiredUniversity ? {
          slug: profile.desiredUniversity.slug,
          name: profile.desiredUniversity.shortName,
          grantScore: profile.desiredUniversity.grantScore,
          chance: calculateAdmissionChance(forecast.expected, profile.desiredUniversity.grantScore),
        } : null,
        subjects: [...subjectMap.entries()].map(([name, value]) => ({
          name,
          percent: value.total ? Math.round((value.correct / value.total) * 100) : 0,
        })),
        answers: attempt.answers
          .map((answer) => ({
            isCorrect: Boolean(answer.isCorrect),
            usedAiHelp: answer.usedAiHelp,
            timeSpentSec: answer.timeSpentSec,
            topicId: answer.question.topic.id,
            topic: answer.question.topic.titleRu,
            subject: answer.question.subject.titleRu,
            question: jsonText(answer.question.body),
            selected: answer.option ? jsonText(answer.option.content) : "Без ответа",
            correct: jsonText(answer.question.options.find((option) => option.isCorrect)?.content ?? ""),
            explanation: jsonText(answer.question.explanation),
            expectedScoreGain: answer.question.topic.expectedScoreGain,
          })),
      }}
    />
  );
}
