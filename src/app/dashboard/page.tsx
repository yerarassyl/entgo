import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard-client";
import { requirePaidUser } from "@/lib/paid-access";
import { prisma } from "@/lib/prisma";
import {
  ensureCurrentStudyPlan,
  recentDayRange,
  todayRange,
} from "@/lib/study-plan";
import { calculateAdmissionChance, calculateForecast } from "@/lib/forecast";
import { ensureUniversities } from "@/lib/universities";
import { isStaffRole } from "@/lib/authorization";

export default async function DashboardPage() {
  const user = await requirePaidUser();
  if (isStaffRole(user.role)) redirect("/admin");

  await ensureUniversities();
  const [forecast, profile] = await Promise.all([
    calculateForecast(user.id),
    prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      include: { desiredUniversity: true },
    }),
  ]);
  const now = new Date();
  const plan = await ensureCurrentStudyPlan(
    user.id,
    user.targetScore ?? 120,
    now,
  );
  const today = todayRange(now);
  const todayTasks = plan.tasks
    .filter(
      (task) =>
        task.scheduledAt >= today.start && task.scheduledAt < today.end,
    )
    .map((task) => {
      const [label, activity] = task.activity.split(":");
      return {
        id: task.id,
        label,
        activity,
        title: task.title,
        durationMin: task.durationMin,
        completedAt: task.completedAt?.toISOString() ?? null,
      };
    });
  const recentRange = recentDayRange(7, now);
  const streakRows = await prisma.streak.findMany({
    where: {
      userId: user.id,
      day: { gte: recentRange.start, lt: recentRange.end },
      minutes: { gt: 0 },
    },
    select: { day: true, minutes: true },
    orderBy: { day: "asc" },
  });
  const activeDays = new Set(
    streakRows.map((row) => row.day.toISOString().slice(0, 10)),
  );
  const streakDays = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(today.start);
    day.setDate(day.getDate() - (6 - index));
    return {
      key: day.toISOString().slice(0, 10),
      label: new Intl.DateTimeFormat("ru-RU", { weekday: "narrow" }).format(day),
      active: activeDays.has(day.toISOString().slice(0, 10)),
    };
  });
  let streakCount = 0;
  for (let index = streakDays.length - 1; index >= 0; index -= 1) {
    if (!streakDays[index].active) break;
    streakCount += 1;
  }
  const dateLabel = new Intl.DateTimeFormat("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(now);
  const daysToExam = user.examDate
    ? Math.max(0, Math.ceil((user.examDate.getTime() - now.getTime()) / 86_400_000))
    : 47;
  const relevantMastery = profile.profileSubjects.length
    ? forecast.mastery.filter((row) =>
        row.topic.subject.isRequired || profile.profileSubjects.includes(row.topic.subject.titleRu),
      )
    : forecast.mastery;

  return (
    <DashboardClient
      name={user.name ?? "Ученик"}
      targetScore={user.targetScore ?? 120}
      currentScore={forecast.current}
      forecastScore={forecast.expected}
      forecastMinimum={forecast.minimum}
      forecastOptimistic={forecast.optimistic}
      chanceTarget={forecast.chanceTarget}
      xp={profile.xp}
      university={profile.desiredUniversity ? {
        slug: profile.desiredUniversity.slug,
        name: profile.desiredUniversity.shortName,
        grantScore: profile.desiredUniversity.grantScore,
        chance: calculateAdmissionChance(forecast.expected, profile.desiredUniversity.grantScore),
      } : null}
      weakTopics={relevantMastery.slice(0, 3).map((row) => ({
        id: row.topicId,
        title: row.topic.titleRu,
        subject: row.topic.subject.titleRu,
        score: Math.round(row.effectiveMastery),
        expectedScoreGain: row.topic.expectedScoreGain,
      }))}
      dateLabel={dateLabel}
      daysToExam={daysToExam}
      examAt={user.examDate?.toISOString() ?? null}
      initialTasks={todayTasks}
      initialStreakDays={streakDays}
      initialStreakCount={streakCount}
    />
  );
}
