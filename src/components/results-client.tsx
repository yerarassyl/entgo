"use client";

import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Download,
  Filter,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { ProductHeader } from "@/components/product-header";
import { useMemo, useRef, useState } from "react";

type Result = {
  locked: boolean;
  id: string;
  score: number;
  correct: number;
  total: number;
  timeSpentSec: number;
  betterThan: number;
  xpAwarded: number;
  aiHelpCount: number;
  forecast: { expected: number; minimum: number; optimistic: number; chanceTarget: number };
  university: { slug: string; name: string; grantScore: number; chance: number } | null;
  subjects: Array<{ name: string; percent: number }>;
  answers: Array<{
    isCorrect: boolean;
    usedAiHelp: boolean;
    timeSpentSec: number;
    topicId: string;
    topic: string;
    subject: string;
    question: string;
    selected: string;
    correct: string;
    explanation: string;
    expectedScoreGain: number;
  }>;
};

function durationLabel(seconds: number) {
  const hours = Math.floor(seconds / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  return hours ? `${hours} ч ${minutes} мин` : `${Math.max(1, minutes)} мин`;
}

export function ResultsClient({ result }: { result: Result }) {
  const [addedTopics, setAddedTopics] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<"all" | "mistakes" | "correct">("all");
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [sharing, setSharing] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);

  const accuracy = result.total ? Math.round((result.correct / result.total) * 100) : 0;
  const circumference = 2 * Math.PI * 76;
  const offset = circumference - (result.score / 140) * circumference;
  const strongest = [...result.subjects].sort((a, b) => b.percent - a.percent)[0];
  const weakest = [...result.subjects].sort((a, b) => a.percent - b.percent)[0];
  const mistakes = result.answers.filter((answer) => !answer.isCorrect);
  const potential = result.forecast.expected;
  const target = result.university?.grantScore ?? Math.max(result.forecast.expected, 115);
  const missing = Math.max(0, target - result.forecast.expected);
  const weakTopicNames = [...new Set(mistakes.map((item) => item.topic))].slice(0, 4);
  const fastestGrowth = [...new Map(
    mistakes.map((item) => [item.topic, { topic: item.topic, gain: item.expectedScoreGain }]),
  ).values()]
    .sort((a, b) => b.gain - a.gain)
    .slice(0, 3);
  const firstMistakeByTopic = new Set<string>();

  const allSubjects = useMemo(() => {
    return [...new Set(result.answers.map((a) => a.subject))];
  }, [result.answers]);

  const filteredAnswers = useMemo(() => {
    return result.answers.filter((item) => {
      if (filterType === "mistakes" && item.isCorrect) return false;
      if (filterType === "correct" && !item.isCorrect) return false;
      if (filterSubject !== "all" && item.subject !== filterSubject) return false;
      return true;
    });
  }, [result.answers, filterType, filterSubject]);

  function errorReason(answer: Result["answers"][number]) {
    if (answer.timeSpentSec <= 5) return "Угадывание";
    if (answer.timeSpentSec <= 20) return "Ошибка из-за невнимательности";
    return "Не знаешь тему";
  }

  function askAi(prompt: string) {
    window.dispatchEvent(new CustomEvent("entgo:ai-prompt", { detail: prompt }));
  }

  async function addToPlan(topicId: string) {
    const response = await fetch("/api/plan/add-topic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topicId }),
    });
    if (response.ok) {
      setAddedTopics((current) => current.includes(topicId) ? current : [...current, topicId]);
    }
  }

  async function downloadShareCard() {
    if (!shareCardRef.current || sharing) return;
    setSharing(true);
    try {
      const { default: html2canvas } = await import("html2canvas-pro");
      const canvas = await html2canvas(shareCardRef.current, {
        scale: 2,
        backgroundColor: "#111111",
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `entgo-score-${result.score}-140.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Failed to generate share image", err);
    } finally {
      setSharing(false);
    }
  }

  return (
    <main className="mobile-app-page product-v2 min-h-screen bg-paper pb-24">
      <ProductHeader />

      <div className="container-shell py-10 sm:py-16">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#e9f7ef] px-3 py-1.5 text-xs font-bold text-success">
            <CheckCircle2 size={15} /> Пробник завершён
          </span>
          <h1 className="display mt-5 text-5xl sm:text-7xl">
            Вот твоя <span className="italic">точка старта.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-muted">
            Результат сохранён в аккаунте. Ниже видно, какие темы дадут самый быстрый прирост балла.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {mistakes.length > 0 && (
              <Link
                href="/exam?errorReview=true"
                className="inline-flex items-center gap-2 rounded-full bg-[#2563eb] px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-[#1d4ed8] transition"
              >
                <RefreshCw size={15} /> Пройти работу над ошибками ({mistakes.length})
              </Link>
            )}
            <button
              type="button"
              onClick={downloadShareCard}
              disabled={sharing}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-5 py-3 text-xs font-bold text-ink shadow-sm hover:bg-paper transition"
            >
              <Download size={15} />
              {sharing ? "Создаем карточку..." : "Скачать результат (Instagram / TG)"}
            </button>
          </div>
        </div>

        {/* Mobile Sticky Bar */}
        <div className="sticky top-2 z-30 mt-6 grid grid-cols-3 gap-2 rounded-2xl border border-line bg-white/95 p-2 shadow-lg backdrop-blur-xl sm:hidden">
          <div className="rounded-xl bg-paper p-2 text-center">
            <p className="text-[10px] text-muted">Балл</p>
            <strong>{result.score}</strong>
          </div>
          <div className="rounded-xl bg-paper p-2 text-center">
            <p className="text-[10px] text-muted">Прогноз</p>
            <strong>{result.forecast.expected}</strong>
          </div>
          <div className="rounded-xl bg-paper p-2 text-center">
            <p className="text-[10px] text-muted">До цели</p>
            <strong>{missing}</strong>
          </div>
        </div>

        {/* Score & Analytics Grid */}
        <div className="mt-12 grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
          {/* Shareable Card Ref */}
          <section
            ref={shareCardRef}
            className="flex min-h-96 flex-col items-center justify-center rounded-[32px] bg-[#111] p-8 text-white shadow-[0_24px_70px_rgba(0,0,0,.16)] relative"
          >
            <div className="absolute top-6 left-7 flex items-center gap-2 text-xs font-bold text-white/70">
              <Sparkles size={15} className="text-[#2563eb]" />
              <span>entgo.ai ЕНТ</span>
            </div>

            <div className="relative grid size-52 place-items-center mt-4">
              <svg className="absolute inset-0 -rotate-90" width="208" height="208" viewBox="0 0 208 208" aria-hidden="true">
                <circle cx="104" cy="104" r="76" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="12" />
                <circle
                  cx="104"
                  cy="104"
                  r="76"
                  fill="none"
                  stroke="white"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                />
              </svg>
              <div className="text-center">
                <p className="display text-7xl">{result.score}</p>
                <p className="text-xs text-white/45">из 140 баллов</p>
              </div>
            </div>

            <div className="mt-7 grid grid-cols-3 gap-7 text-center text-xs">
              <div>
                <p className="text-lg font-bold">{accuracy}%</p>
                <p className="text-white/45">верных</p>
              </div>
              <div>
                <p className="text-lg font-bold">{durationLabel(result.timeSpentSec)}</p>
                <p className="text-white/45">время</p>
              </div>
              <div>
                <p className="text-lg font-bold">{result.betterThan}%</p>
                <p className="text-white/45">ниже тебя</p>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-line bg-white p-7 sm:p-9">
            <div className="flex items-center gap-3">
              <BrainCircuit size={22} />
              <h2 className="text-lg font-semibold">Персональный анализ результата</h2>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-paper p-4">
                <p className="text-xs text-muted">Текущий прогноз</p>
                <p className="display mt-2 text-4xl">{result.forecast.expected}</p>
              </div>
              <div className="rounded-2xl bg-paper p-4">
                <p className="text-xs text-muted">Цель</p>
                <p className="display mt-2 text-4xl">{target}</p>
              </div>
              <div className="rounded-2xl bg-paper p-4">
                <p className="text-xs text-muted">До гранта</p>
                <p className="display mt-2 text-4xl">{missing}</p>
              </div>
            </div>
            <p className="mt-6 text-base leading-7 text-muted">
              {strongest ? (
                <>
                  Сильнее всего сейчас выглядит <strong className="text-ink">{strongest.name}</strong>: {strongest.percent}% верных ответов.{" "}
                </>
              ) : null}
              {weakest ? (
                <>
                  Главный резерв роста — <strong className="text-ink">{weakest.name}</strong>. Начни с ошибок по этому предмету и закрепи их коротким тестом.
                </>
              ) : (
                "Пройди больше вопросов, чтобы анализ стал точнее."
              )}
            </p>
            <p className="mt-4 text-base leading-7 text-muted">
              При регулярной работе с ошибками ближайшая реалистичная цель — <strong className="text-ink">{potential} баллов</strong>.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {[
                [`+${potential - result.score}`, "потенциал роста", TrendingUp],
                [mistakes.length, "ошибок в разборе", XCircle],
                [result.subjects.length, "предметов оценено", Target],
              ].map(([value, label, Icon]) => {
                const IconComponent = Icon as typeof TrendingUp;
                return (
                  <div key={label as string} className="rounded-2xl bg-paper p-4">
                    <IconComponent size={17} />
                    <p className="mt-5 text-lg font-bold">{value as string | number}</p>
                    <p className="mt-1 text-xs text-muted">{label as string}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 rounded-2xl bg-ink p-5 text-white">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-white/45">Прогноз</p>
                  <p className="display mt-1 text-4xl">{result.forecast.expected}</p>
                </div>
                <div>
                  <p className="text-xs text-white/45">Диапазон</p>
                  <p className="mt-3 font-bold">
                    {result.forecast.minimum}–{result.forecast.optimistic}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/45">Шанс цели</p>
                  <p className="mt-3 font-bold">{result.forecast.chanceTarget}%</p>
                </div>
              </div>
              <p className="mt-4 border-t border-white/15 pt-4 text-xs text-white/55">
                Начислено {result.xpAwarded} XP{result.aiHelpCount ? ` · entgo.ai-подсказок: ${result.aiHelpCount}` : ""}
              </p>
              {result.university && (
                <Link
                  href={`/universities/${result.university.slug}`}
                  className="mt-3 flex items-center justify-between rounded-xl bg-white/10 p-3 text-xs hover:bg-white/15 transition"
                >
                  <span>
                    {result.university.name}: грант от {result.university.grantScore}
                  </span>
                  <strong>{result.university.chance}%</strong>
                </Link>
              )}
            </div>
          </section>
        </div>

        {/* Growth Topics */}
        <section className="mt-5 rounded-[28px] border border-line bg-white p-7 sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[.15em] text-muted">Следующий шаг после анализа</p>
          <h2 className="mt-2 text-2xl font-semibold">Самый быстрый рост</h2>
          <p className="mt-2 text-sm text-muted">Темы расставлены по ожидаемому влиянию на итоговый балл.</p>
          <div className={`mt-6 grid gap-3 sm:grid-cols-3 ${result.locked ? "select-none blur-[6px]" : ""}`}>
            {(fastestGrowth.length
              ? fastestGrowth
              : [
                  { topic: "Проценты", gain: 4 },
                  { topic: "Механика", gain: 3 },
                  { topic: "Квадратные уравнения", gain: 2 },
                ]
            ).map((item, index) => (
              <div key={item.topic} className="rounded-2xl bg-paper p-5">
                <span className="text-xs font-bold text-muted">0{index + 1}</span>
                <p className="mt-5 font-semibold">{item.topic}</p>
                <p className="mt-2 text-sm text-success">до +{item.gain.toFixed(1)} балла</p>
              </div>
            ))}
          </div>
          {result.locked && (
            <div className="mt-5 text-center">
              <Link href="/premium" className="inline-flex rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white">
                Открыть темы роста
              </Link>
            </div>
          )}
        </section>

        {/* Breakdown by Subject */}
        <section className="relative mt-5 overflow-hidden rounded-[28px] border border-line bg-white p-7 sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[.15em] text-muted">По предметам</p>
          <h2 className="mt-2 text-xl font-semibold">Где теряются баллы</h2>
          <div className={`mt-7 space-y-6 ${result.locked ? "select-none blur-[7px]" : ""}`}>
            {result.subjects.map((subject) => (
              <div key={subject.name}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-semibold">{subject.name}</span>
                  <span>{subject.percent}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-paper">
                  <div className="h-full rounded-full bg-ink" style={{ width: `${subject.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
          {result.locked && (
            <div className="absolute inset-0 grid place-items-center bg-white/55 p-6 backdrop-blur-[2px]">
              <div className="max-w-md rounded-[24px] bg-ink p-7 text-center text-white shadow-2xl">
                <h3 className="display text-4xl">Найдено {Math.max(weakTopicNames.length, 4)} слабых мест</h3>
                <p className="mt-3 text-sm leading-6 text-white/60">
                  Слабые места и приоритет исправления уже рассчитаны. Открой полный анализ, чтобы увидеть их.
                </p>
                <Link href="/premium" className="mt-6 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink">
                  Получить доступ
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* Detailed Question Review with Filters */}
        <section className="relative mt-5 overflow-hidden rounded-[28px] border border-line bg-white p-7 sm:p-9">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.15em] text-muted">Полный разбор</p>
              <h2 className="mt-2 text-xl font-semibold">Объяснение каждого ответа</h2>
            </div>
            <span className="text-xs text-muted">
              Показано {filteredAnswers.length} из {result.answers.length} вопросов
            </span>
          </div>

          {/* Filter Bar */}
          <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-line pb-5">
            <div className="flex items-center gap-1 rounded-2xl bg-paper p-1">
              <button
                type="button"
                onClick={() => setFilterType("all")}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  filterType === "all" ? "bg-ink text-white" : "text-muted hover:text-ink"
                }`}
              >
                Все ({result.answers.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType("mistakes")}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  filterType === "mistakes" ? "bg-danger text-white" : "text-muted hover:text-ink"
                }`}
              >
                Ошибки ({mistakes.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType("correct")}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  filterType === "correct" ? "bg-success text-white" : "text-muted hover:text-ink"
                }`}
              >
                Верные ({result.answers.length - mistakes.length})
              </button>
            </div>

            {allSubjects.length > 1 && (
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="h-10 rounded-xl border border-line bg-white px-3 text-xs font-semibold outline-none focus:border-ink"
              >
                <option value="all">Все предметы</option>
                {allSubjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            )}
          </div>

          {filteredAnswers.length ? (
            <div className={`mt-7 space-y-3 ${result.locked ? "max-h-80 select-none overflow-hidden blur-[8px]" : ""}`}>
              {filteredAnswers.map((answer, index) => {
                const canAddTopic = !answer.isCorrect && !firstMistakeByTopic.has(answer.topicId);
                if (!answer.isCorrect) firstMistakeByTopic.add(answer.topicId);
                return (
                  <details key={`${answer.topic}-${index}`} className="group rounded-2xl border border-line bg-white open:bg-paper">
                    <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 p-4">
                      <span className="min-w-0">
                        <span className="block text-[10px] font-bold uppercase tracking-[.12em] text-muted">
                          {answer.subject} · {answer.topic}
                        </span>
                        <span className="mt-1 block line-clamp-2 text-sm font-semibold">{answer.question}</span>
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-bold ${
                          answer.isCorrect ? "bg-[#edf9f2] text-success" : "bg-[#fff1ef] text-danger"
                        }`}
                      >
                        {answer.isCorrect ? "Верно" : "Разобрать"}
                      </span>
                    </summary>
                    <article className="border-t border-line p-4 sm:p-5">
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <p className={`rounded-xl p-4 text-sm ${answer.isCorrect ? "bg-[#edf9f2]" : "bg-[#fff1ef]"}`}>
                          <span className={`block text-xs font-bold ${answer.isCorrect ? "text-success" : "text-danger"}`}>
                            Твой ответ
                          </span>
                          <span className="mt-1 block">{answer.selected}</span>
                        </p>
                        <p className="rounded-xl bg-[#edf9f2] p-4 text-sm">
                          <span className="block text-xs font-bold text-success">Правильный ответ</span>
                          <span className="mt-1 block">{answer.correct}</span>
                        </p>
                      </div>
                      {!answer.isCorrect && (
                        <p className="mt-3 inline-flex rounded-full bg-paper px-3 py-2 text-xs font-bold">
                          Причина ошибки: {errorReason(answer)}
                        </p>
                      )}
                      <p className="mt-4 text-sm leading-6 text-muted">{answer.explanation}</p>
                      {!answer.isCorrect && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              askAi(
                                `Дай похожую задачу по теме «${answer.topic}». Вопрос: ${answer.question}. Мой ответ: ${answer.selected}. Правильный ответ: ${answer.correct}. Причина: ${errorReason(
                                  answer
                                )}.`
                              )
                            }
                            className="min-h-11 rounded-full border border-ink px-4 py-2 text-xs font-bold hover:bg-paper transition"
                          >
                            Дай похожую задачу (entgo.ai)
                          </button>
                          {canAddTopic && (
                            <button
                              type="button"
                              onClick={() => void addToPlan(answer.topicId)}
                              disabled={addedTopics.includes(answer.topicId)}
                              className="min-h-11 rounded-full bg-ink px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                            >
                              {addedTopics.includes(answer.topicId) ? "Добавлено в план" : "Добавить тему в план"}
                            </button>
                          )}
                        </div>
                      )}
                    </article>
                  </details>
                );
              })}
            </div>
          ) : (
            <div className="mt-7 rounded-2xl bg-[#edf9f2] p-6 text-sm font-semibold text-success text-center">
              По выбранным фильтрам нет вопросов.
            </div>
          )}
          {result.locked && (
            <div className="absolute inset-x-0 bottom-0 flex h-72 items-end justify-center bg-gradient-to-t from-white via-white/90 to-transparent p-7">
              <div className="text-center">
                <p className="font-semibold">Персональный разбор ошибок уже готов</p>
                <p className="mt-2 text-sm text-muted">Открой объяснения, слабые места и задания для исправления.</p>
                <Link href="/premium" className="mt-5 inline-flex rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white">
                  Открыть полный анализ
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* CTA Section */}
        <section className="mt-5 rounded-[28px] bg-ink px-7 py-10 text-center text-white sm:px-12 sm:py-14">
          <Clock3 className="mx-auto text-white/55" />
          <h2 className="display mt-4 text-4xl sm:text-6xl">
            Чтобы набрать {target} баллов, <span className="italic">начни с этих тем.</span>
          </h2>
          <div className="mx-auto mt-5 flex max-w-xl flex-wrap justify-center gap-2">
            {(weakTopicNames.length ? weakTopicNames : ["Проценты", "Механика", "Квадратные уравнения"])
              .slice(0, 3)
              .map((topic) => (
                <span key={topic} className={`rounded-full border border-white/20 px-4 py-2 text-sm ${result.locked ? "blur-sm" : ""}`}>
                  {result.locked ? "Слабое место" : topic}
                </span>
              ))}
          </div>
          <p className="mx-auto mt-5 max-w-lg text-sm leading-6 text-white/55">
            Персональный план уже построен. Каждое действие показывает ожидаемый прирост к прогнозу.
          </p>
          <Link
            href={result.locked ? "/premium" : "/dashboard"}
            className="mt-7 inline-flex items-center gap-3 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-ink hover:bg-paper transition"
          >
            {result.locked ? "Получить доступ" : "Открыть персональный план"} <ArrowRight size={17} />
          </Link>
        </section>
      </div>
    </main>
  );
}

