import { StatisticsView } from "@/components/statistics-view";
import { requirePaidUser } from "@/lib/paid-access";
import { prisma } from "@/lib/prisma";
import { calculateForecast } from "@/lib/forecast";

export default async function StatisticsPage() {
  const user = await requirePaidUser();

  const [attempts, streakRows, tasks, forecast, closedTopics, fixedErrors] = await Promise.all([
    prisma.testAttempt.findMany({
      where: { userId: user.id, status: "COMPLETED", score: { not: null } },
      orderBy: { completedAt: "asc" },
      select: {
        id: true,
        score: true,
        completedAt: true,
        test: { select: { titleRu: true } },
      },
      take: 20,
    }),
    prisma.streak.findMany({
      where: { userId: user.id },
      orderBy: { day: "asc" },
      select: { day: true, minutes: true, points: true },
      take: 60,
    }),
    prisma.studyTask.findMany({
      where: { plan: { userId: user.id } },
      select: { completedAt: true, durationMin: true, activity: true },
    }),
    calculateForecast(user.id),
    prisma.lessonProgress.count({ where: { userId: user.id, completedAt: { not: null } } }),
    prisma.errorMemory.count({ where: { userId: user.id, status: "MASTERED" } }),
  ]);

  const completedTasks = tasks.filter((task) => task.completedAt);
  const latestScore = attempts.at(-1)?.score ?? 0;
  const latestAttemptAt = attempts.at(-1)?.completedAt?.getTime() ?? 0;
  const scoreAtOrBefore = (daysAgo: number) => {
    const boundary = latestAttemptAt - daysAgo * 86_400_000;
    return [...attempts]
      .reverse()
      .find((attempt) => (attempt.completedAt?.getTime() ?? 0) <= boundary)
      ?.score ?? attempts[0]?.score ?? latestScore;
  };
  const activityTotals = completedTasks.reduce<Record<string, number>>(
    (totals, task) => {
      const [, activity = "OTHER"] = task.activity.split(":");
      totals[activity] = (totals[activity] ?? 0) + task.durationMin;
      return totals;
    },
    {},
  );

  return (
    <StatisticsView
      name={user.name ?? "Ученик"}
      targetScore={user.targetScore ?? 120}
      attempts={attempts.map((attempt) => ({
        id: attempt.id,
        title: attempt.test.titleRu,
        score: attempt.score ?? 0,
        date: attempt.completedAt
          ? new Intl.DateTimeFormat("ru-RU", {
              day: "numeric",
              month: "short",
            }).format(attempt.completedAt)
          : "—",
      }))}
      studyDays={streakRows.map((row) => ({
        day: row.day.toISOString().slice(0, 10),
        minutes: row.minutes,
        points: row.points,
      }))}
      completedTasks={completedTasks.length}
      totalTasks={tasks.length}
      activityTotals={activityTotals}
      forecast={{ expected: forecast.expected, minimum: forecast.minimum, optimistic: forecast.optimistic }}
      closedTopics={closedTopics}
      fixedErrors={fixedErrors}
      weeklyGrowth={latestScore - scoreAtOrBefore(7)}
      monthlyGrowth={latestScore - scoreAtOrBefore(30)}
    />
  );
}
