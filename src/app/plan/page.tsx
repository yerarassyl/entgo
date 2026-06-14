import { WeeklyPlanClient } from "@/components/weekly-plan-client";
import { requirePaidUser } from "@/lib/paid-access";
import { calculateAdmissionChance, calculateForecast } from "@/lib/forecast";
import { ensureCurrentStudyPlan } from "@/lib/study-plan";
import { prisma } from "@/lib/prisma";

export default async function PlanPage() {
  const user = await requirePaidUser();

  const [plan, forecast, profile] = await Promise.all([
    ensureCurrentStudyPlan(user.id, user.targetScore ?? 120),
    calculateForecast(user.id),
    prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      include: { desiredUniversity: true },
    }),
  ]);
  const grouped = new Map<
    string,
    {
      key: string;
      weekday: string;
      date: string;
      isToday: boolean;
      tasks: Array<{
        id: string;
        label: string;
        activity: string;
        title: string;
        durationMin: number;
        completedAt: string | null;
      }>;
    }
  >();
  const todayKey = new Date().toDateString();

  for (const task of plan.tasks) {
    const key = task.scheduledAt.toDateString();
    const [label, activity] = task.activity.split(":");
    const day = grouped.get(key) ?? {
      key,
      weekday: new Intl.DateTimeFormat("ru-RU", { weekday: "long" }).format(
        task.scheduledAt,
      ),
      date: new Intl.DateTimeFormat("ru-RU", {
        day: "numeric",
        month: "short",
      }).format(task.scheduledAt),
      isToday: key === todayKey,
      tasks: [],
    };
    day.tasks.push({
      id: task.id,
      label,
      activity,
      title: task.title,
      durationMin: task.durationMin,
      completedAt: task.completedAt?.toISOString() ?? null,
    });
    grouped.set(key, day);
  }

  return (
    <WeeklyPlanClient
      name={user.name ?? "Ученик"}
      targetScore={user.targetScore ?? 120}
      forecast={{
        current: forecast.current,
        expected: forecast.expected,
        minimum: forecast.minimum,
        optimistic: forecast.optimistic,
        chance: profile.desiredUniversity
          ? calculateAdmissionChance(
              forecast.expected,
              profile.desiredUniversity.grantScore,
            )
          : forecast.chanceTarget,
        weeklyGrowth: forecast.growthPerTest,
      }}
      days={[...grouped.values()]}
    />
  );
}
