"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Focus,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Brand } from "@/components/brand";

type SessionTask = {
  id: string;
  title: string;
  label: string;
  activity: string;
  durationMin: number;
  completedAt: string | null;
  scheduledAt: string;
  stage: number;
};

type PracticeQuestion = {
  id: string;
  body: string;
  explanation: string;
  options: Array<{ id: string; text: string; correct: boolean }>;
};

const activityNames: Record<string, string> = {
  THEORY: "Теория",
  MINI_TEST: "Мини-тест",
  PRACTICE: "Практика",
  REVIEW: "Разбор",
  PLANNING: "Планирование",
};

const sessionContent: Record<
  string,
  { lead: string; rule: string; example: string; mistake: string }
> = {
  THEORY: {
    lead: "Сначала пойми идею, затем запомни формулу. Так знание не исчезнет после первого теста.",
    rule: "Разбери правило на три части: что известно, что нужно найти и какое действие связывает эти данные.",
    example: "Прочитай пример, закрой решение и попробуй повторить ход мысли своими словами.",
    mistake: "Не пытайся запомнить весь абзац. Сохрани одну ключевую мысль и один пример.",
  },
  MINI_TEST: {
    lead: "Решай спокойно: сейчас важнее увидеть тип ошибки, чем ответить максимально быстро.",
    rule: "После каждого вопроса назови правило, которое помогло выбрать ответ.",
    example: "Если сомневаешься между двумя вариантами, сначала исключи тот, который противоречит условию.",
    mistake: "Не меняй ответ без конкретной причины. Первое решение часто верное, если оно основано на правиле.",
  },
  PRACTICE: {
    lead: "Практика закрепляет шаблон решения. Сделай несколько задач подряд одним способом.",
    rule: "Записывай промежуточный шаг, даже если он кажется очевидным.",
    example: "После правильной задачи измени одно число в условии и проверь, сохраняется ли метод.",
    mistake: "Не смотри решение сразу. Дай себе минимум две минуты на самостоятельную попытку.",
  },
  REVIEW: {
    lead: "Ошибка полезна, если ты можешь объяснить, почему она произошла и как не повторить её.",
    rule: "Для каждой ошибки запиши: неверная мысль → правильное правило → новый пример.",
    example: "Реши похожую задачу сразу после разбора, не подсматривая в предыдущий ответ.",
    mistake: "Не ограничивайся фразой «был невнимателен». Найди конкретный момент, где ход решения сломался.",
  },
  PLANNING: {
    lead: "Хороший план реалистичен: лучше 25 минут каждый день, чем три часа один раз.",
    rule: "Выбери одну главную тему, одну поддерживающую и один короткий повтор.",
    example: "Поставь самую сложную задачу в начало сессии, пока концентрация выше.",
    mistake: "Не заполняй план только сложными темами. Чередование помогает не выгореть.",
  },
};

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

export function StudySessionClient({
  task,
  lesson,
  questions,
}: {
  task: SessionTask;
  lesson: { summary: string; rule: string; example: string; mistake: string } | null;
  questions: PracticeQuestion[];
}) {
  const router = useRouter();
  const initialSeconds = task.durationMin * 60;
  const [seconds, setSeconds] = useState(initialSeconds);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(Boolean(task.completedAt));
  const [saving, setSaving] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [completion, setCompletion] = useState<{
    xp: number;
    accuracy: number;
    forecastGain: number;
  } | null>(null);
  const fallback = sessionContent[task.activity] ?? sessionContent.PRACTICE;
  const content = lesson
    ? { lead: lesson.summary, rule: lesson.rule, example: lesson.example, mistake: lesson.mistake }
    : fallback;
  const stageLabels = ["Понять основу", "Применить правило", "Закрепить без подсказки"];
  const stageLabel = stageLabels[(task.stage - 1) % stageLabels.length];
  const progress = completed ? 100 : ((initialSeconds - seconds) / initialSeconds) * 100;
  const answeredCount = Object.keys(answers).length;
  const correctCount = questions.filter((question) =>
    question.options.find((option) => option.id === answers[question.id])?.correct,
  ).length;
  const requiresCheck = questions.length > 0 && ["REVIEW", "PRACTICE", "MINI_TEST", "THEORY"].includes(task.activity);
  const accuracy = questions.length ? Math.round((correctCount / questions.length) * 100) : 0;
  const checkPassed = !requiresCheck || (answeredCount === questions.length && accuracy > 40);

  useEffect(() => {
    if (!running || seconds <= 0) return;
    const timer = window.setInterval(
      () => setSeconds((value) => Math.max(0, value - 1)),
      1_000,
    );
    return () => window.clearInterval(timer);
  }, [running, seconds]);

  useEffect(() => {
    if (seconds === 0) {
      const timer = window.setTimeout(() => setRunning(false), 0);
      return () => window.clearTimeout(timer);
    }
  }, [seconds]);

  const status = useMemo(() => {
    if (completed) return "Задача выполнена";
    if (seconds === 0) return "Фокус-сессия завершена";
    if (running) return "Сейчас работаем";
    return "Готов к фокусу";
  }, [completed, running, seconds]);

  async function finish() {
    if (saving || completed) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/study-tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completed: true,
          durationSec: initialSeconds - seconds,
          answers,
        }),
      });
      if (!response.ok) return;
      const result = await response.json() as {
        xp: number;
        accuracy: number;
        forecastGain: number;
      };
      setCompletion(result);
      setCompleted(true);
      setRunning(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className={`study-page product-v2 min-h-screen ${focusMode ? "bg-[#111] text-white" : "bg-paper text-ink"}`}>
      <header className={`sticky top-0 z-40 border-b ${focusMode ? "border-white/10 bg-[#111]/95" : "border-line bg-white/95"} backdrop-blur-xl`}>
        <div className="container-shell flex h-15 items-center justify-between sm:h-18">
          <Brand inverse={focusMode} />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFocusMode((value) => !value)}
              className={`grid size-10 place-items-center rounded-full border sm:inline-flex sm:w-auto sm:px-4 ${focusMode ? "border-white/20 hover:bg-white/10" : "border-line hover:bg-paper"}`}
              aria-label={focusMode ? "Обычный режим" : "Режим фокуса"}
            >
              <Focus size={16} /> <span className="hidden text-xs font-semibold sm:inline">{focusMode ? "Обычный режим" : "Режим фокуса"}</span>
            </button>
            <Link href="/plan" className={`grid size-10 place-items-center rounded-full border ${focusMode ? "border-white/20" : "border-line bg-white"}`} aria-label="Вернуться к плану">
              <ArrowLeft size={17} />
            </Link>
          </div>
        </div>
      </header>

      <div className={`container-shell grid gap-5 py-4 sm:py-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-8 lg:py-10 ${focusMode ? "max-w-5xl lg:grid-cols-1" : ""}`}>
        <section className={`order-2 rounded-[30px] p-5 sm:p-7 lg:order-1 ${focusMode ? "mx-auto block w-full max-w-xl border border-white/15 bg-white/[.04]" : "hidden h-fit bg-[#111] text-white shadow-[0_24px_70px_rgba(0,0,0,.16)] lg:block lg:sticky lg:top-28"}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-[.16em] opacity-50">{status}</span>
            <Clock3 size={20} className="opacity-60" />
          </div>
          <div className="mt-5 text-center lg:mt-9">
            <p className="display text-5xl leading-none sm:text-6xl">{completed ? "Готово" : formatTime(seconds)}</p>
            <p className="mt-2 text-sm opacity-60">{completed ? "Результат сохранён в плане" : `${task.durationMin} минут на эту задачу`}</p>
          </div>
          <div className="mt-10 h-2 overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-white transition-all" style={{ width: `${progress}%` }} />
          </div>
          {!completed && <div className="mt-6 flex justify-center gap-3">
            <button onClick={() => setRunning((value) => !value)} disabled={seconds === 0} className="inline-flex h-12 min-w-36 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-ink disabled:opacity-35">
              {running ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}
              {running ? "Пауза" : "Начать"}
            </button>
            <button onClick={() => { setRunning(false); setSeconds(initialSeconds); }} className="grid size-12 place-items-center rounded-full border border-white/20" aria-label="Сбросить таймер">
              <RotateCcw size={17} />
            </button>
          </div>}
        </section>

        {!focusMode && (
          <section className="order-1 rounded-[32px] border border-line bg-white p-5 shadow-[0_24px_70px_rgba(0,0,0,.045)] sm:p-9 lg:order-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.15em] text-muted">{task.label} · {activityNames[task.activity] ?? "Занятие"} · этап {task.stage}</p>
                <h1 className="display mt-2 text-[2.55rem] leading-[.94] sm:mt-3 sm:text-6xl">{task.title}</h1>
                <p className="mt-3 text-sm font-semibold text-success">Цель этапа: {stageLabel}</p>
              </div>
              {completed && <span className="inline-flex items-center gap-2 rounded-full bg-[#e9f7ef] px-3 py-2 text-xs font-bold text-success"><CheckCircle2 size={15} /> Выполнено</span>}
            </div>

            <div className="mt-5 rounded-2xl bg-paper p-4 sm:p-5">
              <div className="flex gap-3"><Sparkles className="mt-0.5 shrink-0" size={19} /><p className="text-sm font-semibold leading-6">{content.lead}</p></div>
            </div>
            <div className="mt-4 rounded-[22px] bg-[#111] p-4 text-white lg:hidden">
              <div className="flex items-center justify-between gap-3">
                <div><p className="text-[10px] font-bold uppercase tracking-[.13em] text-white/55">{status}</p><p className="display mt-1 text-4xl">{completed ? "Готово" : formatTime(seconds)}</p></div>
                {!completed && <button onClick={() => setRunning((value) => !value)} className="grid size-12 place-items-center rounded-full bg-white text-ink" aria-label={running ? "Поставить таймер на паузу" : "Запустить таймер"}>{running ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}</button>}
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-white" style={{ width: `${progress}%` }} /></div>
            </div>
            <details className="mt-4 rounded-2xl border border-line p-4 sm:hidden">
              <summary className="cursor-pointer text-sm font-bold">Короткая теория и подсказки</summary>
              <div className="mt-4 space-y-4 border-t border-line pt-4">
                <div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-muted">Правило</p><p className="mt-2 text-sm leading-6">{content.rule}</p></div>
                <div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-muted">Как сделать</p><p className="mt-2 text-sm leading-6">{content.example}</p></div>
                <div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-muted">Не ошибись</p><p className="mt-2 text-sm leading-6">{content.mistake}</p></div>
              </div>
            </details>
            <div className="mt-6 hidden gap-5 sm:grid sm:grid-cols-3">
              <div><p className="text-xs font-bold uppercase tracking-[.14em] text-muted">Правило</p><p className="mt-2 text-base leading-7">{content.rule}</p></div>
              <div className="border-l border-line pl-5"><p className="text-xs font-bold uppercase tracking-[.14em] text-muted">Как сделать сейчас</p><p className="mt-2 text-sm leading-6">{content.example}</p></div>
              <div className="border-l border-line pl-5"><p className="text-xs font-bold uppercase tracking-[.14em] text-muted">Типичная ошибка</p><p className="mt-2 text-sm leading-6">{content.mistake}</p></div>
            </div>

            {questions.length > 0 && (
              <div className="mt-6 border-t border-line pt-6 sm:mt-9 sm:pt-8">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[.14em] text-muted">Проверка и работа над ошибками</p>
                    <h2 className="mt-2 text-xl font-semibold">Проверь себя</h2>
                  </div>
                  <span className="rounded-full bg-paper px-3 py-2 text-xs font-bold">{activeQuestion + 1} / {questions.length}</span>
                </div>
                <div className="mt-5 space-y-5">
                  {questions.map((question, questionIndex) => {
                    const selectedId = answers[question.id];
                    const selected = question.options.find((option) => option.id === selectedId);
                    return (
                      <article key={question.id} className={`${questionIndex === activeQuestion ? "block" : "hidden"} rounded-2xl bg-paper p-4 sm:block sm:p-5`}>
                        <p className="text-xs font-bold text-muted">Задача {questionIndex + 1}</p>
                        <h3 className="mt-2 font-semibold leading-6">{question.body}</h3>
                        <div className="mt-4 grid gap-2">
                          {question.options.map((option) => (
                            <button
                              key={option.id}
                              type="button"
                              disabled={Boolean(selectedId)}
                              onClick={() => setAnswers((current) => ({ ...current, [question.id]: option.id }))}
                              className={`min-h-13 rounded-xl border px-4 py-3 text-left text-sm leading-5 ${
                                selectedId
                                  ? option.correct
                                    ? "border-success bg-[#edf9f2]"
                                    : option.id === selectedId
                                      ? "border-danger bg-[#fff1ef]"
                                      : "border-line bg-white"
                                  : "border-line bg-white hover:border-ink"
                              }`}
                            >
                              {option.text}
                            </button>
                          ))}
                        </div>
                        {selected && (
                          <div className="mt-4 rounded-xl bg-white p-4 text-sm leading-6">
                            <p className={`font-bold ${selected.correct ? "text-success" : "text-danger"}`}>
                              {selected.correct ? "Верно · тема закрепляется" : "Ошибка: тема ещё не освоена"}
                            </p>
                            <p className="mt-1 text-muted">{question.explanation}</p>
                            {!selected.correct && <p className="mt-2 text-xs font-semibold">Уровень уверенности: нужно повторение, это не случайная отметка.</p>}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
                <div className="mt-4 flex items-center justify-between sm:hidden">
                  <button type="button" onClick={() => setActiveQuestion((value) => Math.max(0, value - 1))} disabled={activeQuestion === 0} className="grid size-11 place-items-center rounded-full border border-line disabled:opacity-30" aria-label="Предыдущая задача"><ChevronLeft size={19} /></button>
                  <span className="text-xs font-semibold text-muted">{answeredCount} ответов из {questions.length}</span>
                  <button type="button" onClick={() => setActiveQuestion((value) => Math.min(questions.length - 1, value + 1))} disabled={activeQuestion === questions.length - 1} className="grid size-11 place-items-center rounded-full bg-ink text-white disabled:opacity-30" aria-label="Следующая задача"><ChevronRight size={19} /></button>
                </div>
                {answeredCount === questions.length && (
                  <p className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${checkPassed ? "bg-[#edf9f2] text-success" : "bg-[#fff1ef] text-danger"}`}>
                    {checkPassed ? `Проверка пройдена: ${correctCount} из ${questions.length} (${accuracy}%).` : `Правильно ${correctCount} из ${questions.length}. Повтори теорию и попробуй ещё раз.`}
                  </p>
                )}
                {answeredCount === questions.length && !checkPassed && (
                  <button type="button" onClick={() => setAnswers({})} className="mt-3 rounded-full border border-ink px-5 py-2.5 text-sm font-semibold">
                    Пройти проверку ещё раз
                  </button>
                )}
                <div className="mt-5 rounded-[20px] border border-line bg-white p-2 sm:hidden">
                  <button onClick={finish} disabled={saving || completed || !checkPassed} className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-ink px-5 text-sm font-bold text-white disabled:bg-line disabled:text-muted">
                    {completed ? <><Check size={17} /> Выполнено</> : saving ? "Сохраняем..." : checkPassed ? "Завершить и получить XP" : `Ответь на вопросы · ${answeredCount}/${questions.length}`}
                  </button>
                </div>
              </div>
            )}

            {completion && (
              <div className="mt-7 grid gap-3 rounded-2xl bg-[#edf9f2] p-5 sm:grid-cols-3">
                <div><p className="text-xs text-muted">Результат</p><strong className="mt-1 block text-xl">{completion.accuracy}%</strong></div>
                <div><p className="text-xs text-muted">Получено</p><strong className="mt-1 block text-xl">+{completion.xp} XP</strong></div>
                <div><p className="text-xs text-muted">Влияние на прогноз</p><strong className="mt-1 block text-xl">до +{completion.forecastGain}</strong></div>
              </div>
            )}

            <button onClick={finish} disabled={saving || completed || !checkPassed} className="mt-9 hidden h-14 w-full items-center justify-center gap-3 rounded-full bg-ink px-6 text-sm font-semibold text-white disabled:opacity-45 sm:flex">
              {completed ? <><Check size={17} /> Задача выполнена</> : saving ? "Сохраняем..." : "Завершить задачу"}
            </button>
            {requiresCheck && !checkPassed && <p className="mt-3 text-center text-xs text-muted">Для завершения набери больше 40%. XP зависит от результата: 41–60% — 10 XP, 61–80% — 20 XP, 81–100% — 25 XP.</p>}
          </section>
        )}
      </div>
    </main>
  );
}
