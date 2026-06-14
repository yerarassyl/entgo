import { calculateForecast } from "@/lib/forecast";
import { getMobileSessionUser } from "@/lib/mobile-auth";
import { mobileJson, mobileOptions } from "@/lib/mobile-response";
import { prisma } from "@/lib/prisma";

export function OPTIONS() {
  return mobileOptions();
}

export async function GET(request: Request) {
  const user = await getMobileSessionUser(request);
  if (!user) return mobileJson({ error: "Требуется вход." }, { status: 401 });
  const [attempts, tasks, streaks, forecast, closedTopics, fixedErrors] = await Promise.all([
    prisma.testAttempt.findMany({
      where: { userId: user.id, status: "COMPLETED", score: { not: null } },
      orderBy: { completedAt: "asc" },
      select: { id: true, score: true, completedAt: true, test: { select: { titleRu: true } } },
      take: 20,
    }),
    prisma.studyTask.findMany({
      where: { plan: { userId: user.id } },
      select: { completedAt: true, durationMin: true },
    }),
    prisma.streak.findMany({
      where: { userId: user.id },
      orderBy: { day: "desc" },
      select: { day: true, minutes: true, points: true },
      take: 30,
    }),
    calculateForecast(user.id),
    prisma.lessonProgress.count({ where: { userId: user.id, completedAt: { not: null } } }),
    prisma.errorMemory.count({ where: { userId: user.id, status: "MASTERED" } }),
  ]);
  return mobileJson({
    target: user.targetScore ?? 120,
    forecast: { expected: forecast.expected, minimum: forecast.minimum, optimistic: forecast.optimistic },
    attempts: attempts.map((attempt) => ({
      id: attempt.id,
      title: attempt.test.titleRu,
      score: attempt.score ?? 0,
      date: attempt.completedAt?.toISOString() ?? null,
    })),
    completedTasks: tasks.filter((task) => task.completedAt).length,
    totalTasks: tasks.length,
    studyMinutes: tasks.filter((task) => task.completedAt).reduce((sum, task) => sum + task.durationMin, 0),
    closedTopics,
    fixedErrors,
    streaks: streaks.map((row) => ({ day: row.day.toISOString(), minutes: row.minutes, points: row.points })),
  });
}
