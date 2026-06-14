"use client";

import Link from "next/link";
import { ArrowLeft, Check, ChevronRight, Clock3, Target } from "lucide-react";
import { Brand } from "@/components/brand";
import { useState } from "react";

type PlanTask = {
  id: string;
  label: string;
  activity: string;
  title: string;
  durationMin: number;
  completedAt: string | null;
};

type PlanDay = {
  key: string;
  weekday: string;
  date: string;
  isToday: boolean;
  tasks: PlanTask[];
};

const activityNames: Record<string, string> = {
  THEORY: "теория",
  MINI_TEST: "мини-тест",
  PRACTICE: "практика",
  REVIEW: "разбор",
  PLANNING: "планирование",
};

export function WeeklyPlanClient({
  name,
  targetScore,
  forecast,
  days,
}: {
  name: string;
  targetScore: number;
  forecast: {
    current: number;
    expected: number;
    minimum: number;
    optimistic: number;
    chance: number;
    weeklyGrowth: number;
  };
  days: PlanDay[];
}) {
  const [showWholeWeek, setShowWholeWeek] = useState(false);
  const allTasks = days.flatMap((day) => day.tasks);
  const completed = allTasks.filter((task) => task.completedAt).length;
  const totalMinutes = allTasks.reduce((sum, task) => sum + task.durationMin, 0);
  const todayTasks = days.find((day) => day.isToday)?.tasks ?? [];
  const todayCompleted = todayTasks.filter((task) => task.completedAt).length;
  const todayGain = Math.min(4, todayCompleted * 1.4);

  return (
    <main className="mobile-app-page min-h-screen bg-paper">
      <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur-xl">
        <div className="container-shell flex h-18 items-center justify-between">
          <Brand />
          <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-semibold hover:bg-paper">
            <ArrowLeft size={16} /> В кабинет
          </Link>
        </div>
      </header>

      <div className="container-shell py-10 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-[1fr_340px] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-muted">Персональная неделя</p>
            <h1 className="display mt-4 max-w-3xl text-5xl leading-none sm:text-7xl">
              Чтобы выйти на {targetScore} баллов, сегодня нужно <span className="italic">закрыть {todayTasks.length || 3} темы.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted">Сегодняшние задачи дадут примерно +2–4 балла к прогнозу. В начале стоят действия с максимальным ожидаемым приростом.</p>
            <p className="mt-2 text-sm font-semibold">План для {name.split(/\s+/)[0]}</p>
          </div>
          <div className="rounded-[22px] bg-ink p-6 text-white">
            <div className="flex items-center justify-between text-xs text-white/50"><span>Прогноз до цели</span><Target size={17} /></div>
            <p className="mt-5 text-sm font-semibold">Сегодня ты ближе к цели на {todayGain ? `+${todayGain.toFixed(1)} балла` : "0 баллов"}</p>
            <div className="mt-5 space-y-3 border-t border-white/15 pt-5 text-xs">
              <div className="flex justify-between"><span className="text-white/45">Текущий прогноз</span><strong>{forecast.expected}</strong></div>
              <div className="flex justify-between"><span className="text-white/45">Диапазон</span><strong>{forecast.minimum}–{forecast.optimistic}</strong></div>
              <div className="flex justify-between"><span className="text-white/45">Цель</span><strong>{targetScore}</strong></div>
              <div className="flex justify-between"><span className="text-white/45">До цели</span><strong>{Math.max(0, targetScore - forecast.expected)} баллов</strong></div>
              <div className="flex justify-between"><span className="text-white/45">Шанс поступления</span><strong>{forecast.chance}%</strong></div>
              <div className="flex justify-between"><span className="text-white/45">Последнее обновление</span><strong>сегодня</strong></div>
            </div>
            <p className="mt-5 rounded-xl bg-white/10 p-3 text-xs font-semibold">{forecast.weeklyGrowth >= 0 ? "+" : ""}{forecast.weeklyGrowth} балла за последний цикл тестов</p>
          </div>
        </div>

        <section className="mt-6 rounded-[22px] border border-line bg-white p-5 sm:flex sm:items-center sm:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[.14em] text-muted">Связь действий с целью</p><h2 className="mt-2 text-xl font-semibold">Сейчас {forecast.current} → прогноз {forecast.expected} → цель {targetScore}</h2></div>
          <p className="mt-3 text-sm text-muted sm:mt-0">Неделя: {completed} из {allTasks.length} задач · {totalMinutes} минут в плане</p>
        </section>

        <div className="mt-8 flex items-center justify-between lg:hidden">
          <div><p className="text-xs font-bold uppercase tracking-[.13em] text-muted">Расписание</p><p className="mt-1 text-sm font-semibold">{showWholeWeek ? "Вся неделя" : "Только сегодня"}</p></div>
          <button type="button" onClick={() => setShowWholeWeek((value) => !value)} className="min-h-11 rounded-full border border-line bg-white px-4 text-xs font-bold">{showWholeWeek ? "Скрыть остальные дни" : "Показать неделю"}</button>
        </div>
        <div className="mt-4 grid min-w-0 gap-4 lg:mt-12 lg:grid-cols-2">
          {days.filter((day) => showWholeWeek || day.isToday).map((day) => {
            const dayCompleted = day.tasks.filter((task) => task.completedAt).length;
            return (
              <section key={day.key} className={`min-w-0 rounded-[24px] border p-6 ${day.isToday ? "border-ink bg-white shadow-[0_18px_55px_rgba(0,0,0,.08)]" : "border-line bg-white"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold capitalize">{day.weekday}</h2>
                      {day.isToday && <span className="rounded-full bg-ink px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-white">Сегодня</span>}
                    </div>
                    <p className="mt-1 text-xs text-muted">{day.date}</p>
                  </div>
                  <span className="text-sm font-bold">{dayCompleted} / {day.tasks.length}</span>
                </div>

                <div className="mt-5 divide-y divide-line">
                  {day.tasks.map((task) => {
                    const done = Boolean(task.completedAt);
                    return (
                      <div key={task.id} className="flex min-w-0 w-full items-center gap-4 py-4 text-left">
                        <span aria-label={done ? `Задача выполнена: ${task.title}` : `Задача ожидает прохождения: ${task.title}`} className={`grid size-8 shrink-0 place-items-center rounded-full border ${done ? "border-ink bg-ink text-white" : "border-line bg-paper"}`}>{done && <Check size={15} />}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[10px] font-bold uppercase tracking-[.12em] text-muted">{task.label}</span>
                          <span className={`mt-1 block text-sm font-semibold leading-5 ${done ? "text-muted line-through" : ""}`}>{task.title}</span>
                          <span className="mt-1 flex items-center gap-1.5 text-xs text-muted"><Clock3 size={12} /> {task.durationMin} минут · {activityNames[task.activity] ?? "занятие"}</span>
                          <span className="mt-2 inline-flex rounded-full bg-paper px-2.5 py-1 text-[10px] font-bold">{task.activity === "PRACTICE" ? "Самый быстрый рост · +1.8" : task.activity === "REVIEW" ? "Частая ошибка · исправление" : "Новая тема · +0.8"}</span>
                        </span>
                        <Link href={`/study/${task.id}`} aria-label={`Открыть задачу: ${task.title}`} className="grid size-11 shrink-0 place-items-center rounded-full bg-paper hover:bg-line"><ChevronRight size={19} /></Link>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
