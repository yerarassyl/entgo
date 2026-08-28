"use client";

import Link from "next/link";
import { ArrowRight, BrainCircuit, Check, ChevronRight, Clock3, Flame, Play, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ProductHeader } from "@/components/product-header";

type DashboardTask = { id: string; label: string; activity: string; title: string; durationMin: number; completedAt: string | null };
type StreakDay = { key: string; label: string; active: boolean };
const activityNames: Record<string, string> = { THEORY: "Теория", MINI_TEST: "Мини-тест", PRACTICE: "Практика", REVIEW: "Повторение", PLANNING: "Планирование" };

function pluralDays(value: number) {
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return "день";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "дня";
  return "дней";
}

export function DashboardClient({ name, targetScore, currentScore, chanceTarget, xp, university, weakTopics, dateLabel, daysToExam, examAt, examDateLabel, profileSubjects, specialty, dailyMinutes, hasDiagnostic, hasCompletedAttempt, initialTasks, initialStreakDays, initialStreakCount }: {
  name: string; targetScore: number; currentScore: number; forecastScore: number; forecastMinimum: number; forecastOptimistic: number; chanceTarget: number; xp: number;
  university: { slug: string; name: string; grantScore: number; chance: number } | null;
  weakTopics: Array<{ id: string; title: string; subject: string; score: number; expectedScoreGain: number }>;
  dateLabel: string; daysToExam: number; examAt: string | null; examDateLabel: string | null; profileSubjects: string[]; specialty: string | null; dailyMinutes: number; hasDiagnostic: boolean; hasCompletedAttempt: boolean;
  initialTasks: DashboardTask[]; initialStreakDays: StreakDay[]; initialStreakCount: number;
}) {
  const completedTasks = initialTasks.filter((task) => task.completedAt).length;
  const totalMinutes = initialTasks.reduce((sum, task) => sum + task.durationMin, 0);
  const completedMinutes = useMemo(() => initialTasks.filter((task) => task.completedAt).reduce((sum, task) => sum + task.durationMin, 0), [initialTasks]);
  const progress = initialTasks.length ? Math.round((completedTasks / initialTasks.length) * 100) : 0;
  const allDone = initialTasks.length > 0 && completedTasks === initialTasks.length;
  const firstName = name.trim().split(/\s+/)[0] || "Ученик";
  const [countdown, setCountdown] = useState({ days: daysToExam, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: "instant" }); }, []);
  useEffect(() => {
    if (!examAt) return;
    const tick = () => {
      const diff = Math.max(0, new Date(examAt).getTime() - Date.now());
      setCountdown({ days: Math.floor(diff / 86_400_000), hours: Math.floor((diff % 86_400_000) / 3_600_000), minutes: Math.floor((diff % 3_600_000) / 60_000), seconds: Math.floor((diff % 60_000) / 1_000) });
    };
    tick();
    const timer = window.setInterval(tick, 1_000);
    return () => window.clearInterval(timer);
  }, [examAt]);

  const goalGap = hasDiagnostic ? Math.max(0, targetScore - currentScore) : null;
  const grantChance = university?.chance ?? chanceTarget;
  const firstTask = initialTasks.find((task) => !task.completedAt) ?? initialTasks[0];
  const recommendation = weakTopics[0]
    ? `Сегодня удели больше внимания теме «${weakTopics[0].title}». Сейчас это самая полезная точка роста в ${weakTopics[0].subject}.`
    : hasCompletedAttempt ? "Продолжай сегодняшний план — новые рекомендации появятся после следующих ответов." : "Начни с первого пробника, чтобы я определил твой уровень и нашёл реальные слабые темы.";

  return <main className="mobile-app-page product-v2 min-h-screen bg-[#f6f8fc] text-[#172033]">
    <ProductHeader name={name} />
    <div className="container-shell pb-28 pt-7 sm:pt-10">
      <section className="overflow-hidden rounded-[32px] border border-[#dfe5ef] bg-white p-6 shadow-[0_18px_60px_rgba(24,50,100,.06)] sm:p-9">
        <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.14em] text-[#2563eb]">{dateLabel} · {xp} XP</p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-[-.045em] sm:text-5xl">Добро пожаловать, {firstName} 👋</h1>
            <div className="mt-7 flex flex-wrap items-end gap-x-8 gap-y-4">
              <div><p className="text-sm text-[#7b8495]">Твоя цель</p><strong className="mt-1 block text-5xl tracking-[-.06em] text-[#2563eb]">{targetScore} <span className="text-lg tracking-normal">баллов</span></strong></div>
              <div className="border-l border-[#e2e7ef] pl-6"><strong className="block text-lg">{university?.name ?? "Университет не выбран"}</strong><span className="mt-1 block text-sm text-[#7b8495]">{specialty ?? (profileSubjects.join(" + ") || "Профиль подготовки")}</span></div>
            </div>
          </div>
          <div className="min-w-[280px] rounded-[24px] bg-[#172033] p-5 text-white">
            <div className="flex items-center gap-2 text-sm text-white/60"><Clock3 size={16} /> ЕНТ {examDateLabel ?? "дата не указана"}</div>
            <p className="mt-4 text-xs font-bold uppercase tracking-[.12em] text-white/45">До экзамена</p>
            {examAt ? <div className="mt-2 grid grid-cols-4 gap-2 text-center">{[[countdown.days, "дн"], [countdown.hours, "ч"], [countdown.minutes, "мин"], [countdown.seconds, "сек"]].map(([value, label]) => <div key={label} className="rounded-xl bg-white/10 px-2 py-3"><strong className="block text-xl tabular-nums">{value}</strong><span className="text-[10px] text-white/45">{label}</span></div>)}</div> : <p className="mt-3 text-sm text-white/65">Укажи дату в настройках, чтобы включить точный отсчёт.</p>}
          </div>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Текущий балл" value={hasDiagnostic ? String(currentScore) : "Не определён"} note={!hasDiagnostic ? "Пройди первый пробник" : hasCompletedAttempt ? "Последний полный пробник" : "Стартовый результат из квиза"} />
          <Metric label="До цели" value={goalGap === null ? "После диагностики" : `${goalGap} баллов`} />
          <Metric label="Цель" value={`${targetScore} баллов`} note={`${dailyMinutes} минут подготовки в день`} />
          <Metric label="Шанс на грант" value={hasDiagnostic ? `${grantChance}%` : "Расчётный прогноз"} note={hasDiagnostic ? "Не является гарантией" : "Появится после первого пробника"} />
        </div>
        <Link href="/plan" scroll className="mt-6 inline-flex min-h-13 items-center gap-2 rounded-full bg-[#2563eb] px-6 text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(37,99,235,.2)]">Мой план <ArrowRight size={17} /></Link>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.42fr_.58fr]">
        <section className="rounded-[32px] border border-[#dfe5ef] bg-white p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#2563eb]">Сегодня</p><h2 className="mt-2 text-2xl font-extrabold tracking-[-.03em]">{allDone ? "День завершён ✓" : "Что делать сегодня"}</h2><p className="mt-2 text-sm text-[#7b8495]">План рассчитан примерно на {totalMinutes || dailyMinutes} минут и меняется по твоим результатам.</p></div><span className="rounded-full bg-[#eef5ff] px-4 py-2 text-sm font-bold text-[#2563eb]">{completedTasks} из {initialTasks.length}</span></div>
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#edf0f5]"><div className="h-full rounded-full bg-[#2563eb] transition-all duration-700" style={{ width: `${progress}%` }} /></div>
          <div className="mt-5 divide-y divide-[#e6eaf1]">{initialTasks.map((task, index) => {
            const done = Boolean(task.completedAt);
            return <div key={task.id} className="flex items-center gap-4 py-5"><span className={`grid size-10 shrink-0 place-items-center rounded-full text-sm font-extrabold ${done ? "bg-[#e9f8ef] text-[#17834b]" : "bg-[#eef5ff] text-[#2563eb]"}`}>{done ? <Check size={17} /> : index + 1}</span><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-[.1em] text-[#7b8495]">{task.label} · {activityNames[task.activity] ?? "Занятие"}</p><p className={`mt-1 font-bold ${done ? "text-[#8a93a3] line-through" : ""}`}>{task.title}</p><p className="mt-1 text-xs text-[#7b8495]">{task.durationMin} минут</p></div><Link href={`/study/${task.id}`} className="grid size-11 shrink-0 place-items-center rounded-full bg-[#172033] text-white" aria-label={`Открыть: ${task.title}`}><Play size={15} fill="currentColor" /></Link></div>;
          })}{!initialTasks.length && <p className="py-8 text-sm text-[#7b8495]">План на сегодня формируется. Открой «Мой план», чтобы проверить расписание.</p>}</div>
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#e6eaf1] pt-5"><p className="text-sm font-semibold">Примерно {Math.floor(totalMinutes / 60) ? `${Math.floor(totalMinutes / 60)} ч ` : ""}{totalMinutes % 60} мин · выполнено {completedMinutes} мин</p>{firstTask && !allDone && <Link href={`/study/${firstTask.id}`} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#2563eb] px-5 text-sm font-extrabold text-white">Начать подготовку <ArrowRight size={16} /></Link>}</div>
        </section>

        <div className="grid gap-6">
          <section className="rounded-[28px] bg-[#172033] p-6 text-white sm:p-7"><div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#8bb4ff]">entgo.ai рекомендует</p><BrainCircuit size={20} /></div><p className="mt-6 text-lg font-semibold leading-7">{recommendation}</p><Link href={hasCompletedAttempt && weakTopics[0] ? `/topics/${weakTopics[0].id}` : "/tests"} className="mt-6 inline-flex items-center gap-2 text-sm font-extrabold text-white">{hasCompletedAttempt ? "Начать" : "Пройти пробник"} <ArrowRight size={16} /></Link></section>
          <section className="rounded-[28px] border border-[#dfe5ef] bg-white p-6"><div className="flex items-center justify-between"><h2 className="font-extrabold">Серия занятий</h2><Flame className="text-[#ef7c30]" /></div><p className="mt-4 text-4xl font-extrabold tracking-[-.05em]">{initialStreakCount} <span className="text-sm font-medium tracking-normal text-[#7b8495]">{pluralDays(initialStreakCount)}</span></p><div className="mt-5 grid grid-cols-7 gap-1.5">{initialStreakDays.map((day) => <div key={day.key} className="text-center"><div className={`mx-auto grid size-7 place-items-center rounded-full text-[10px] font-bold ${day.active ? "bg-[#2563eb] text-white" : "bg-[#edf0f5] text-[#8a93a3]"}`}>{day.active ? <Check size={12} /> : ""}</div><p className="mt-2 text-[10px] uppercase text-[#8a93a3]">{day.label}</p></div>)}</div></section>
        </div>
      </div>

      <section className="mt-6 rounded-[28px] border border-[#dfe5ef] bg-white p-6 sm:p-8"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#7b8495]">Адаптивная подготовка</p><h2 className="mt-2 text-xl font-extrabold">Темы, которым нужен приоритет</h2></div><Link href="/results" className="inline-flex items-center gap-1 text-sm font-bold text-[#2563eb]">Разбор ошибок <ChevronRight size={16} /></Link></div><div className="mt-6 grid gap-3 md:grid-cols-3">{weakTopics.length ? weakTopics.map((topic) => <Link href={`/topics/${topic.id}`} key={topic.id} className="rounded-2xl bg-[#f6f8fc] p-5"><p className="text-xs text-[#7b8495]">{topic.subject}</p><p className="mt-2 font-bold">{topic.title}</p><div className="mt-5 flex items-center justify-between text-xs"><span>Освоено</span><strong>{topic.score}%</strong></div></Link>) : <div className="flex items-start gap-3 rounded-2xl bg-[#f6f8fc] p-5 text-sm text-[#667083] md:col-span-3"><Sparkles className="shrink-0 text-[#2563eb]" size={19} /><p>После первого пробника здесь появятся только твои реальные слабые темы — без случайных предметов.</p></div>}</div></section>
    </div>
  </main>;
}

function Metric({ label, value, note }: { label: string; value: string; note?: string }) {
  return <div className="rounded-[22px] border border-[#e2e7ef] bg-[#fbfcfe] p-5"><p className="text-xs font-bold uppercase tracking-[.1em] text-[#7b8495]">{label}</p><strong className="mt-3 block text-xl tracking-[-.025em]">{value}</strong>{note && <p className="mt-2 text-xs leading-5 text-[#8a93a3]">{note}</p>}</div>;
}
