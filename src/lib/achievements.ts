import "server-only";
import { prisma } from "@/lib/prisma";

const definitions = [
  {
    slug: "first-test",
    titleRu: "Первый пробник",
    titleKk: "Бірінші сынақ",
    description: "Завершить первый пробный ЕНТ.",
  },
  {
    slug: "week-power",
    titleRu: "Неделя силы",
    titleKk: "Күш аптасы",
    description: "Заниматься в семь разных дней.",
  },
  {
    slug: "score-100",
    titleRu: "Сотня",
    titleKk: "Жүздік",
    description: "Набрать не меньше 100 баллов.",
  },
  {
    slug: "ten-tasks",
    titleRu: "Держу темп",
    titleKk: "Қарқынды ұстаймын",
    description: "Выполнить десять задач плана.",
  },
] as const;

export async function awardAchievements(userId: string) {
  const [attempts, activeDays, completedTasks] = await Promise.all([
    prisma.testAttempt.findMany({
      where: { userId, status: "COMPLETED" },
      select: { score: true },
    }),
    prisma.streak.count({ where: { userId, minutes: { gt: 0 } } }),
    prisma.studyTask.count({
      where: { plan: { userId }, completedAt: { not: null } },
    }),
  ]);

  const earned = new Set<string>();
  if (attempts.length >= 1) earned.add("first-test");
  if (activeDays >= 7) earned.add("week-power");
  if (attempts.some((attempt) => (attempt.score ?? 0) >= 100)) earned.add("score-100");
  if (completedTasks >= 10) earned.add("ten-tasks");

  for (const definition of definitions) {
    const achievement = await prisma.achievement.upsert({
      where: { slug: definition.slug },
      update: definition,
      create: definition,
    });
    if (earned.has(definition.slug)) {
      await prisma.userAchievement.upsert({
        where: {
          userId_achievementId: {
            userId,
            achievementId: achievement.id,
          },
        },
        update: {},
        create: { userId, achievementId: achievement.id },
      });
    }
  }
}
