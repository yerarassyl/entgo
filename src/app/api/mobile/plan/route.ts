import { calculateForecast } from "@/lib/forecast";
import { getMobileSessionUser } from "@/lib/mobile-auth";
import { mobileJson, mobileOptions } from "@/lib/mobile-response";
import { ensureCurrentStudyPlan } from "@/lib/study-plan";

export function OPTIONS() {
  return mobileOptions();
}

export async function GET(request: Request) {
  const user = await getMobileSessionUser(request);
  if (!user) return mobileJson({ error: "Требуется вход." }, { status: 401 });

  const [plan, forecast] = await Promise.all([
    ensureCurrentStudyPlan(user.id, user.targetScore ?? 120),
    calculateForecast(user.id),
  ]);
  const days = new Map<string, {
    key: string;
    weekday: string;
    date: string;
    isToday: boolean;
    tasks: Array<Record<string, unknown>>;
  }>();
  const todayKey = new Date().toDateString();

  for (const task of plan.tasks) {
    const key = task.scheduledAt.toDateString();
    const [label, activity] = task.activity.split(":");
    const day = days.get(key) ?? {
      key,
      weekday: new Intl.DateTimeFormat("ru-RU", { weekday: "long" }).format(task.scheduledAt),
      date: new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" }).format(task.scheduledAt),
      isToday: key === todayKey,
      tasks: [],
    };
    day.tasks.push({
      id: task.id,
      label,
      activity,
      title: task.title,
      durationMin: task.durationMin,
      completed: Boolean(task.completedAt),
    });
    days.set(key, day);
  }

  return mobileJson({
    targetScore: user.targetScore ?? 120,
    forecast: {
      current: forecast.current,
      expected: forecast.expected,
      minimum: forecast.minimum,
      optimistic: forecast.optimistic,
      chance: forecast.chanceTarget,
    },
    days: [...days.values()],
  });
}

