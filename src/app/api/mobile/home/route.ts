import { calculateAdmissionChance, calculateForecast } from "@/lib/forecast";
import { getMobileSessionUser } from "@/lib/mobile-auth";
import { mobileJson, mobileOptions } from "@/lib/mobile-response";
import { prisma } from "@/lib/prisma";
import { ensureCurrentStudyPlan, todayRange } from "@/lib/study-plan";

export function OPTIONS() {
  return mobileOptions();
}

export async function GET(request: Request) {
  const user = await getMobileSessionUser(request);
  if (!user) return mobileJson({ error: "Требуется вход." }, { status: 401 });

  const [forecast, profile, plan] = await Promise.all([
    calculateForecast(user.id),
    prisma.user.findUniqueOrThrow({ where: { id: user.id }, include: { desiredUniversity: true } }),
    ensureCurrentStudyPlan(user.id, user.targetScore ?? 120),
  ]);
  const today = todayRange();
  const tasks = plan.tasks
    .filter((task) => task.scheduledAt >= today.start && task.scheduledAt < today.end)
    .map((task) => {
      const [label, activity] = task.activity.split(":");
      return {
        id: task.id,
        label,
        activity,
        title: task.title,
        durationMin: task.durationMin,
        completed: Boolean(task.completedAt),
      };
    });

  return mobileJson({
    user: { name: profile.name ?? "Ученик", xp: profile.xp },
    forecast: {
      current: forecast.current,
      expected: forecast.expected,
      minimum: forecast.minimum,
      optimistic: forecast.optimistic,
      target: forecast.target,
      chance: forecast.chanceTarget,
    },
    university: profile.desiredUniversity
      ? {
          name: profile.desiredUniversity.shortName,
          grantScore: profile.desiredUniversity.grantScore,
          chance: calculateAdmissionChance(forecast.expected, profile.desiredUniversity.grantScore),
        }
      : null,
    tasks,
    weakTopics: forecast.mastery.slice(0, 3).map((row) => ({
      id: row.topicId,
      title: row.topic.titleRu,
      subject: row.topic.subject.titleRu,
      mastery: Math.round(row.effectiveMastery),
    })),
  });
}

