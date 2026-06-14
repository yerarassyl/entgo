"use client";

import Link from "next/link";
import { BarChart3, BookOpen, CalendarDays, Check, ChevronRight, Clock3, Flame, Home, ListChecks, Medal, Play, Settings, Target, Trophy } from "lucide-react";
import { useMemo } from "react";
import { Brand } from "@/components/brand";
import { LogoutButton } from "@/components/logout-button";

const nav = [
  ["Главная", "/dashboard", Home], ["Пробники", "/tests", ListChecks], ["Темы", "/topics", BookOpen], ["Мой план", "/plan", CalendarDays], ["Статистика", "/statistics", BarChart3], ["Рейтинг", "/leaderboard", Trophy], ["Программа 130+", "/rewards/130", Medal],
];

type DashboardTask = {
  id: string;
  label: string;
  activity: string;
  title: string;
  durationMin: number;
  completedAt: string | null;
};

type StreakDay = {
  key: string;
  label: string;
  active: boolean;
};

const activityNames: Record<string, string> = {
  THEORY: "теория",
  MINI_TEST: "мини-тест",
  PRACTICE: "практика",
  REVIEW: "разбор",
  PLANNING: "планирование",
};

function dayWord(value: number) {
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return "день";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "дня";
  return "дней";
}

export function DashboardClient({
  name,
  targetScore,
  currentScore,
  forecastScore,
  forecastMinimum,
  forecastOptimistic,
  chanceTarget,
  xp,
  university,
  weakTopics,
  dateLabel,
  daysToExam,
  initialTasks,
  initialStreakDays,
  initialStreakCount,
}: {
  name: string;
  targetScore: number;
  currentScore: number;
  forecastScore: number;
  forecastMinimum: number;
  forecastOptimistic: number;
  chanceTarget: number;
  xp: number;
  university: { slug: string; name: string; grantScore: number; chance: number } | null;
  weakTopics: Array<{ id: string; title: string; subject: string; score: number; expectedScoreGain: number }>;
  dateLabel: string;
  daysToExam: number;
  initialTasks: DashboardTask[];
  initialStreakDays: StreakDay[];
  initialStreakCount: number;
}) {
  const tasks = initialTasks;
  const streakDays = initialStreakDays;
  const streakCount = initialStreakCount;
  const firstName = name.trim().split(/\s+/)[0] || "Ученик";
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "У";
  const completedTasks = tasks.filter((task) => task.completedAt).length;
  const totalMinutes = tasks.reduce((sum, task) => sum + task.durationMin, 0);
  const progress = tasks.length ? (completedTasks / tasks.length) * 100 : 0;
  const completedMinutes = useMemo(
    () =>
      tasks
        .filter((task) => task.completedAt)
        .reduce((sum, task) => sum + task.durationMin, 0),
    [tasks],
  );

  return (
    <main className="mobile-app-page min-h-screen bg-paper lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="hidden min-h-screen border-r border-line bg-white p-5 pb-24 lg:flex lg:flex-col">
        <div className="px-2 py-2"><Brand /></div>
        <nav className="mt-8 space-y-1">
          {nav.map(([label, href, Icon], index) => {
            const IconComponent = Icon as typeof Home;
            return <Link key={label as string} href={href as string} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${index === 0 ? "bg-ink text-white" : "text-muted hover:bg-paper hover:text-ink"}`}><IconComponent size={18} />{label as string}</Link>;
          })}
        </nav>
        <div className="mt-auto rounded-2xl bg-paper p-4">
          <p className="text-xs font-bold">Открыть Premium</p>
          <p className="mt-1 text-xs leading-5 text-muted">Все тесты, AI и полный персональный план.</p>
          <Link href="/premium" className="mt-3 block w-full rounded-full bg-ink py-2.5 text-center text-xs font-semibold text-white">Попробовать</Link>
        </div>
        <Link href="/settings" className="mt-3 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-muted hover:bg-paper hover:text-ink"><Settings size={18} />Настройки</Link>
        <LogoutButton />
      </aside>

      <section className="min-w-0">
        <header className="border-b border-line bg-white">
          <div className="flex h-18 items-center justify-between px-5 sm:px-8">
            <div className="lg:hidden"><Brand /></div>
            <p className="hidden text-sm font-semibold capitalize lg:block">{dateLabel}</p>
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-full bg-[#fff1df] px-3 py-2 text-xs font-bold sm:flex"><Flame size={16} /> {xp} XP</div>
              <div className="grid size-10 place-items-center rounded-full bg-ink text-xs font-bold text-white">{initials}</div>
            </div>
          </div>
        </header>

        <div className="mx-auto min-w-0 max-w-6xl p-4 sm:p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div><p className="text-sm text-muted">Доброе утро, {firstName}</p><h1 className="display mt-1 text-4xl sm:text-6xl">Сегодня станем <span className="italic">на балл ближе.</span></h1></div>
            <div className="rounded-2xl border border-line bg-white px-5 py-3 text-sm"><span className="text-muted">До ЕНТ</span><strong className="ml-3 text-xl">{daysToExam} дней</strong></div>
          </div>

          <section className="mt-6 grid gap-4 rounded-[24px] border border-line bg-white p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.14em] text-muted">Твой прогресс сегодня</p>
              <h2 className="mt-2 text-xl font-semibold">Сегодня ты ближе к цели на {completedTasks ? `+${Math.min(4, completedTasks * 1.4).toFixed(1)} балла` : "0 баллов"}</h2>
              <p className="mt-2 text-sm text-muted">{completedTasks ? `Выполнено ${completedTasks} из ${tasks.length} задач. Продолжай, чтобы закрепить рост.` : "Начни с первой задачи: план уже расставлен по влиянию на прогноз."}</p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl bg-paper px-4 py-3"><p className="text-[10px] text-muted">Сейчас</p><strong className="mt-1 block text-xl">{currentScore}</strong></div>
              <div className="rounded-2xl bg-paper px-4 py-3"><p className="text-[10px] text-muted">Прогноз</p><strong className="mt-1 block text-xl">{forecastScore}</strong></div>
              <div className="rounded-2xl bg-paper px-4 py-3"><p className="text-[10px] text-muted">До цели</p><strong className="mt-1 block text-xl">{Math.max(0, targetScore - forecastScore)}</strong></div>
            </div>
          </section>

          <div className="mt-8 grid min-w-0 gap-5 xl:grid-cols-[1.4fr_.6fr]">
            <section id="plan" className="min-w-0 rounded-[26px] border border-line bg-white p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[.14em] text-muted">План на сегодня · до цели {targetScore}</p><h2 className="mt-2 text-lg font-semibold sm:text-xl">Сегодня нужно закрыть {tasks.length} темы</h2><p className="mt-1 text-xs text-muted">Ожидаемый прирост к прогнозу: +2–4 балла</p></div>
                <span className="ml-3 shrink-0 text-sm font-bold">{completedTasks} / {tasks.length}</span>
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-paper"><div className="h-full rounded-full bg-ink transition-all" style={{ width: `${progress}%` }} /></div>
              <div className="mt-7 divide-y divide-line">
                {tasks.map((task) => {
                  const done = Boolean(task.completedAt);
                  return (
                  <div key={task.title} className="flex items-center gap-4 py-5">
                    <span aria-label={done ? `Задача выполнена: ${task.title}` : `Задача ожидает прохождения: ${task.title}`} className={`grid size-9 shrink-0 place-items-center rounded-full border ${done ? "border-ink bg-ink text-white" : "border-line bg-paper"}`}>{done && <Check size={16} />}</span>
                    <div className="min-w-0 flex-1"><p className="text-[11px] font-bold uppercase tracking-[.12em] text-muted">{task.activity === "PRACTICE" ? "Самый быстрый рост" : task.activity === "REVIEW" ? "Частая ошибка" : "Новая тема"} · {task.label}</p><p className={`mt-1 text-sm font-semibold leading-5 ${done ? "text-muted line-through" : ""}`}>{task.title}</p><p className="mt-1 text-xs text-muted">{task.durationMin} минут · {activityNames[task.activity] ?? "занятие"} · до +{task.activity === "PRACTICE" ? "1.8" : task.activity === "REVIEW" ? "1.2" : "0.8"} балла</p></div>
                    <Link href={`/study/${task.id}`} className="grid size-11 shrink-0 place-items-center rounded-full bg-paper" aria-label={done ? `Открыть задачу: ${task.title}` : `Начать задачу: ${task.title}`}><Play size={16} fill="currentColor" /></Link>
                  </div>
                )})}
              </div>
              <p className="border-t border-line pt-4 text-xs text-muted">Выполнено сегодня: {completedMinutes} из {totalMinutes} минут</p>
            </section>

            <section className="rounded-[26px] bg-ink p-6 text-white sm:p-8">
              <div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-[.14em] text-white/45">Прогноз</p><Target size={19} /></div>
              <p className="display mt-8 text-7xl">{forecastScore}</p>
              <p className="mt-1 text-sm text-white/45">прогноз ЕНТ · {forecastMinimum}–{forecastOptimistic}</p>
              <div className="mt-8 border-t border-white/15 pt-6">
                <div className="flex justify-between text-xs"><span className="text-white/45">Сейчас</span><strong>{currentScore}</strong></div>
                <div className="mt-3 flex justify-between text-xs"><span className="text-white/45">Цель</span><strong>{targetScore}</strong></div>
                <div className="mt-3 flex justify-between text-xs"><span className="text-white/45">До цели</span><strong>{Math.max(0, targetScore - forecastScore)} баллов</strong></div>
                <div className="mt-3 flex justify-between text-xs"><span className="text-white/45">Шанс набрать цель</span><strong>{chanceTarget}%</strong></div>
                <div className="mt-3 flex justify-between text-xs"><span className="text-white/45">Последнее обновление</span><strong>сегодня</strong></div>
                <div className="mt-5 grid gap-2">
                  <p className="rounded-xl bg-white/10 p-3 text-xs font-semibold">+{Math.max(1, Math.round((forecastScore - currentScore) / 3))} балла за неделю при текущем темпе</p>
                  {weakTopics[0] && <p className="rounded-xl bg-white/10 p-3 text-xs font-semibold">{weakTopics[0].title}: до +{weakTopics[0].expectedScoreGain.toFixed(1)} балла к прогнозу</p>}
                </div>
                {university && <Link href={`/universities/${university.slug}`} className="mt-5 block rounded-xl bg-white/10 p-3 text-xs leading-5"><strong>{university.name}</strong><br /><span className="text-white/55">Для гранта: {university.grantScore} · шанс {university.chance}%</span></Link>}
                <p className="mt-5 rounded-xl bg-white/10 p-3 text-xs leading-5 text-white/65">{currentScore >= targetScore ? "Цель уже достигнута. Теперь удерживаем форму и закрываем слабые места." : "Ты идёшь по плану. Не пропускай занятия 3 дня подряд."}</p>
              </div>
            </section>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-3">
            <section className="rounded-[24px] border border-line bg-white p-6 md:col-span-2">
              <div className="flex items-center justify-between"><h2 className="font-semibold">Слабые места</h2><Link href="/topics" className="flex min-h-11 items-center gap-1 rounded-full px-3 text-xs font-bold">Все темы <ChevronRight size={15} /></Link></div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {weakTopics.length ? weakTopics.map((topic) => (
                  <Link href={`/topics/${topic.id}`} key={topic.id} className="rounded-2xl bg-paper p-4"><p className="text-xs text-muted">{topic.subject}</p><p className="mt-2 min-h-10 text-sm font-semibold">{topic.title}</p><div className="mt-5 flex items-center justify-between text-xs"><span>Mastery</span><strong>{topic.score}%</strong></div></Link>
                )) : <p className="text-sm text-muted sm:col-span-3">Пройди первый пробник, чтобы система нашла устойчивые слабые места.</p>}
              </div>
            </section>
            <section className="rounded-[24px] border border-line bg-white p-6">
              <div className="flex items-center justify-between"><h2 className="font-semibold">Серия</h2><Flame className="text-[#ef7c30]" /></div>
              <p className="display mt-5 text-5xl">{streakCount} <span className="font-sans text-sm text-muted">{dayWord(streakCount)}</span></p>
              <div className="mt-6 grid grid-cols-7 gap-1.5">
                {streakDays.map((day) => <div key={day.key} className="text-center"><div className={`mx-auto grid size-7 place-items-center rounded-full text-[10px] font-bold ${day.active ? "bg-ink text-white" : "bg-paper text-muted"}`}>{day.active ? <Check size={12} /> : ""}</div><p className="mt-2 text-[10px] uppercase text-muted">{day.label}</p></div>)}
              </div>
              <div className="mt-6 flex items-center gap-3 rounded-xl bg-paper p-3"><Medal size={20} /><p className="text-xs leading-5"><strong>{Math.max(0, 7 - streakCount)} дней до награды</strong><br /><span className="text-muted">бейдж «Неделя силы»</span></p></div>
            </section>
          </div>

          <section className="mt-5 flex flex-col gap-5 rounded-[24px] border border-line bg-white p-6 sm:flex-row sm:items-center">
            <div className="grid size-12 shrink-0 place-items-center rounded-full bg-ink text-white"><Clock3 size={20} /></div>
            <div className="flex-1"><h2 className="font-semibold">Время сфокусироваться</h2><p className="mt-1 text-sm text-muted">Запусти 25-минутную сессию без отвлечений.</p></div>
            <Link href={tasks.find((task) => !task.completedAt) ? `/study/${tasks.find((task) => !task.completedAt)!.id}` : "/plan"} className="rounded-full border border-ink bg-ink px-6 py-3 text-center text-sm font-semibold text-white">Запустить Pomodoro</Link>
          </section>
        </div>
      </section>
    </main>
  );
}
