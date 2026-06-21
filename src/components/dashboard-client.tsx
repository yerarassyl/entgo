"use client";

import Link from "next/link";
import { Check, ChevronRight, Flame, Medal, Play, Target } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ProductHeader } from "@/components/product-header";

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
  examAt,
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
  examAt: string | null;
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
  const [countdown, setCountdown] = useState({ days: daysToExam, hours: 0, minutes: 0 });
  useEffect(() => {
    if (!examAt) {
      return;
    }
    const tick = () => {
      const diff = Math.max(0, new Date(examAt).getTime() - Date.now());
      const totalMinutesLeft = Math.floor(diff / 60_000);
      setCountdown({
        days: Math.floor(totalMinutesLeft / 1440),
        hours: Math.floor((totalMinutesLeft % 1440) / 60),
        minutes: totalMinutesLeft % 60,
      });
    };
    tick();
    const timer = window.setInterval(tick, 60_000);
    return () => window.clearInterval(timer);
  }, [daysToExam, examAt]);
  const goalGap = Math.max(0, targetScore - forecastScore);
  const grantChance = university?.chance ?? chanceTarget;

  return (
    <main className="mobile-app-page product-v2 min-h-screen bg-paper">
      <ProductHeader />
      <section className="min-w-0">

        <div className="container-shell min-w-0 pb-28 pt-8 sm:pt-12">
          <div className="flex flex-col justify-between gap-6 border-b border-line pb-9 sm:flex-row sm:items-end">
            <div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#2563eb]">{dateLabel} · {xp} XP</p><h1 className="display mt-3 max-w-4xl text-5xl leading-[.94] sm:text-7xl">До цели {targetScore} баллов осталось <span className="italic">{goalGap} баллов.</span></h1><p className="mt-4 text-base text-muted">{firstName}, AI подстраивает план под твои предметы, пробники и ошибки.</p></div>
            <div className="flex items-center gap-3"><div className="rounded-[24px] border border-line bg-white px-5 py-4 text-sm"><span className="text-muted">Шанс на грант</span><strong className="ml-3 text-2xl">{grantChance}%</strong></div><div className="grid size-12 place-items-center rounded-full bg-[#111] text-xs font-bold text-white">{initials}</div></div>
          </div>

          <section className="mt-8 grid gap-3 sm:grid-cols-4">
            {[
              ["Цель", `${targetScore}`],
              ["Осталось", `${goalGap} баллов`],
              ["Шанс на грант", `${grantChance}%`],
              ["До ЕНТ", `${countdown.days}д ${countdown.hours}ч ${countdown.minutes}м`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[24px] border border-line bg-white p-5">
                <p className="text-xs font-bold uppercase tracking-[.12em] text-muted">{label}</p>
                <strong className="mt-3 block text-2xl">{value}</strong>
              </div>
            ))}
          </section>

          <section className="mt-8 grid gap-6 rounded-[32px] border border-line bg-white p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
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
            <section id="plan" className="min-w-0 rounded-[32px] border border-line bg-white p-6 sm:p-9">
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

            <section className="rounded-[32px] bg-[#111] p-6 text-white shadow-[0_24px_70px_rgba(0,0,0,.16)] sm:p-8">
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

        </div>
      </section>
    </main>
  );
}
