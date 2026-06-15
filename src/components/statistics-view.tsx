import Link from "next/link";
import {
  BarChart3,
  CalendarCheck,
  Clock3,
  Flame,
  Target,
  Trophy,
} from "lucide-react";
import { ProductHeader } from "@/components/product-header";

type Attempt = {
  id: string;
  title: string;
  score: number;
  date: string;
};

type StudyDay = {
  day: string;
  minutes: number;
  points: number;
};

const activityNames: Record<string, string> = {
  THEORY: "Теория",
  MINI_TEST: "Тесты",
  PRACTICE: "Практика",
  REVIEW: "Разбор",
  PLANNING: "Планирование",
};

function studyDayLabel(value: number) {
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return "учебный день";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return "учебных дня";
  }
  return "учебных дней";
}

export function StatisticsView({
  name,
  targetScore,
  attempts,
  studyDays,
  completedTasks,
  totalTasks,
  activityTotals,
  forecast,
  closedTopics,
  fixedErrors,
  weeklyGrowth,
  monthlyGrowth,
}: {
  name: string;
  targetScore: number;
  attempts: Attempt[];
  studyDays: StudyDay[];
  completedTasks: number;
  totalTasks: number;
  activityTotals: Record<string, number>;
  forecast: { expected: number; minimum: number; optimistic: number };
  closedTopics: number;
  fixedErrors: number;
  weeklyGrowth: number;
  monthlyGrowth: number;
}) {
  const totalMinutes = studyDays.reduce((sum, day) => sum + day.minutes, 0);
  const totalPoints = studyDays.reduce((sum, day) => sum + day.points, 0);
  const latestScore = attempts.at(-1)?.score ?? 0;
  const remaining = Math.max(0, targetScore - latestScore);
  const maxAttemptScore = Math.max(targetScore, ...attempts.map((item) => item.score), 1);
  const maxActivity = Math.max(...Object.values(activityTotals), 1);

  return (
    <main className="mobile-app-page product-v2 min-h-screen bg-paper">
      <ProductHeader />

      <div className="container-shell py-10 sm:py-16">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.16em] text-muted">Твой рост в цифрах</p>
          <h1 className="display mt-4 max-w-4xl text-5xl leading-none sm:text-7xl">
            {name.split(/\s+/)[0]}, прогресс уже <span className="italic">видно.</span>
          </h1>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            [latestScore, "текущий балл", Target],
            [remaining, "до цели осталось", BarChart3],
            [`${totalMinutes} мин`, "время подготовки", Clock3],
            [totalPoints, "очков активности", Trophy],
          ].map(([value, label, Icon]) => {
            const IconComponent = Icon as typeof Target;
            return (
              <div key={label as string} className="rounded-[22px] border border-line bg-white p-6">
                <IconComponent size={19} />
                <p className="display mt-8 text-5xl">{value as string | number}</p>
                <p className="mt-1 text-sm text-muted">{label as string}</p>
              </div>
            );
          })}
        </div>

        <section className="mt-7 rounded-[32px] bg-[#111] p-7 text-white shadow-[0_24px_70px_rgba(0,0,0,.16)] sm:p-9">
          <div className="grid gap-5 sm:grid-cols-3">
            <div><p className="text-xs text-white/45">Сейчас</p><p className="display mt-2 text-5xl">{latestScore}</p></div>
            <div><p className="text-xs text-white/45">Через месяц</p><p className="display mt-2 text-5xl">{forecast.minimum}–{forecast.optimistic}</p></div>
            <div><p className="text-xs text-white/45">Цель</p><p className="display mt-2 text-5xl">{targetScore}</p></div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2 border-t border-white/15 pt-5 text-xs"><span className="rounded-full bg-white/10 px-3 py-2">Лучше чем {Math.min(92, Math.max(12, latestScore - 16))}% учеников</span><span className="rounded-full bg-white/10 px-3 py-2">{weeklyGrowth >= 0 ? "+" : ""}{weeklyGrowth} балла за неделю</span><span className="rounded-full bg-white/10 px-3 py-2">{monthlyGrowth >= 0 ? "+" : ""}{monthlyGrowth} балла за месяц</span><span className="rounded-full bg-white/10 px-3 py-2">Прогноз: {forecast.expected}</span></div>
        </section>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.3fr_.7fr]">
          <section className="rounded-[26px] border border-line bg-white p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div><p className="text-xs font-bold uppercase tracking-[.14em] text-muted">Пробные ЕНТ</p><h2 className="mt-2 text-xl font-semibold">Динамика балла</h2></div>
              <span className="rounded-full bg-paper px-3 py-2 text-xs font-bold">Цель: {targetScore}</span>
            </div>
            {attempts.length ? (
              <div className="mt-9 flex min-h-64 items-end gap-4 border-b border-line px-2">
                {attempts.map((attempt) => (
                  <div key={attempt.id} className="flex min-w-0 flex-1 flex-col items-center">
                    <span className="mb-2 text-xs font-bold">{attempt.score}</span>
                    <div className="w-full max-w-20 rounded-t-xl bg-ink transition-all" style={{ height: `${Math.max(16, (attempt.score / maxAttemptScore) * 210)}px` }} />
                    <span className="mt-3 pb-3 text-[10px] text-muted">{attempt.date}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-8 rounded-2xl bg-paper p-8 text-center"><p className="font-semibold">Пока нет завершённых пробников</p><Link href="/exam" className="mt-4 inline-block text-sm font-bold underline">Пройти первый</Link></div>
            )}
            {attempts.length > 0 && attempts.length < 3 && <p className="mt-5 rounded-xl bg-paper p-4 text-sm text-muted">Нужны ещё {3 - attempts.length} пробника для точного прогноза динамики.</p>}
          </section>

          <section className="rounded-[30px] bg-[#111] p-6 text-white sm:p-8">
            <div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-[.14em] text-white/45">План недели</p><CalendarCheck size={19} /></div>
            <p className="display mt-8 text-7xl">{completedTasks}<span className="font-sans text-base text-white/35"> / {totalTasks}</span></p>
            <p className="mt-2 text-sm text-white/45">задач выполнено</p>
            <div className="mt-7 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-white" style={{ width: `${totalTasks ? (completedTasks / totalTasks) * 100 : 0}%` }} /></div>
            <div className="mt-8 border-t border-white/15 pt-6">
              <div className="flex items-center gap-3"><Flame size={20} className="text-[#ff9e57]" /><div><p className="text-sm font-semibold">{studyDays.length} {studyDayLabel(studyDays.length)}</p><p className="text-xs text-white/40">за всё время</p></div></div>
            </div>
          </section>
        </div>

        <section className="mt-5 rounded-[26px] border border-line bg-white p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-muted">Распределение времени</p>
          <h2 className="mt-2 text-xl font-semibold">На что ушла подготовка</h2>
          <div className="mt-7 grid gap-5 md:grid-cols-2">
            {Object.entries(activityNames).map(([key, label]) => {
              const minutes = activityTotals[key] ?? 0;
              return (
                <div key={key}>
                  <div className="mb-2 flex justify-between text-sm"><span className="font-semibold">{label}</span><span className="text-muted">{minutes} мин</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-paper"><div className="h-full rounded-full bg-ink" style={{ width: `${(minutes / maxActivity) * 100}%` }} /></div>
                </div>
              );
            })}
          </div>
          <div className="mt-8 grid gap-3 border-t border-line pt-6 sm:grid-cols-4">
            {[["Практика", `${activityTotals.PRACTICE ?? 0} мин`], ["Закрыто тем", closedTopics], ["Исправлено ошибок", fixedErrors], ["Выполнено задач", completedTasks]].map(([label, value]) => <div key={label as string} className="rounded-2xl bg-paper p-4"><p className="text-xs text-muted">{label}</p><p className="mt-2 text-xl font-bold">{value}</p></div>)}
          </div>
        </section>
      </div>
    </main>
  );
}
