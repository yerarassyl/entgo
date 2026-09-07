"use client";

import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flag,
  HelpCircle,
  Keyboard,
  LayoutGrid,
  Lightbulb,
  LoaderCircle,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Brand } from "@/components/brand";

type ExamQuestion = {
  id: string;
  subject: string;
  topic: string;
  body: string;
  options: Array<{ id: string; content: string }>;
};

type StartPayload = {
  attempt: { id: string; startedAt: string; expiresAt: string | null; durationSec: number };
  questions: ExamQuestion[];
  savedAnswers: Array<{ questionId: string; optionId: string | null; usedAiHelp: boolean }>;
};

function remainingSeconds(expiresAt: string | null, durationSec: number) {
  if (!expiresAt) return durationSec;
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1_000));
}

function FormattedContent({ text }: { text: string }) {
  const parts = text.split(/(\$[^$]+\$|\^\{[0-9a-zA-Z+-]+\}|\^[0-9a-zA-Z+-]+)/g);
  return (
    <span>
      {parts.map((part, index) => {
        if (part.startsWith("$") && part.endsWith("$") && part.length > 1) {
          const inner = part.slice(1, -1);
          return (
            <span key={index} className="font-mono text-[0.95em] font-semibold text-[#1e40af]">
              {inner}
            </span>
          );
        }
        if (part.startsWith("^")) {
          const exp = part.startsWith("^{") ? part.slice(2, -1) : part.slice(1);
          return <sup key={index} className="text-[0.75em] font-bold">{exp}</sup>;
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}

export function ExamClient({
  topicId,
  testId,
  errorReview,
}: {
  topicId?: string;
  testId?: string;
  errorReview?: boolean;
}) {
  const router = useRouter();
  const [payload, setPayload] = useState<StartPayload | null>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [helped, setHelped] = useState<Set<string>>(new Set());
  const [hints, setHints] = useState<Record<string, string>>({});
  const [seconds, setSeconds] = useState(0);
  const [saving, setSaving] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [askingHelp, setAskingHelp] = useState(false);
  const [error, setError] = useState("");
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [showMobileGrid, setShowMobileGrid] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [showHotkeysHelp, setShowHotkeysHelp] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    let active = true;
    void fetch("/api/attempts/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topicId: topicId || undefined,
        testId: testId || undefined,
        errorReview: errorReview || undefined,
      }),
    })
      .then(async (response) => {
        const result = (await response.json()) as StartPayload & { error?: string };
        if (!response.ok) throw new Error(result.error ?? "Не удалось начать пробник.");
        if (!active) return;
        setPayload(result);
        setSeconds(remainingSeconds(result.attempt.expiresAt, result.attempt.durationSec));

        // Restore from server and merge with any local cache backup
        const serverAnswers = Object.fromEntries(
          result.savedAnswers.filter((item) => item.optionId).map((item) => [item.questionId, item.optionId!])
        );
        try {
          const cachedRaw = localStorage.getItem(`entgo:attempt_answers:${result.attempt.id}`);
          const cached = cachedRaw ? JSON.parse(cachedRaw) : {};
          setAnswers({ ...serverAnswers, ...cached });
        } catch {
          setAnswers(serverAnswers);
        }

        setHelped(new Set(result.savedAnswers.filter((item) => item.usedAiHelp).map((item) => item.questionId)));
      })
      .catch((reason: unknown) =>
        active && setError(reason instanceof Error ? reason.message : "Не удалось начать пробник.")
      );
    return () => {
      active = false;
    };
  }, [topicId, testId, errorReview]);

  useEffect(() => {
    if (!payload || seconds <= 0) return;
    const timer = window.setInterval(
      () => setSeconds(remainingSeconds(payload.attempt.expiresAt, payload.attempt.durationSec)),
      1_000
    );
    return () => window.clearInterval(timer);
  }, [payload, seconds]);

  const question = payload?.questions[current];
  const subjectGroups = useMemo(() => {
    if (!payload) return [];
    const groups = new Map<string, Array<{ item: ExamQuestion; index: number }>>();
    payload.questions.forEach((item, index) => {
      const group = groups.get(item.subject) ?? [];
      group.push({ item, index });
      groups.set(item.subject, group);
    });
    return [...groups.entries()];
  }, [payload]);

  const answeredCount = Object.keys(answers).length;
  const elapsed = payload ? Math.min(payload.attempt.durationSec, payload.attempt.durationSec - seconds) : 0;
  const time = useMemo(
    () =>
      `${String(Math.floor(seconds / 3600)).padStart(2, "0")}:${String(
        Math.floor((seconds % 3600) / 60)
      ).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`,
    [seconds]
  );

  const finish = useCallback(async () => {
    if (!payload || finishing) return;
    setFinishing(true);
    try {
      const response = await fetch("/api/attempts/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId: payload.attempt.id, timeSpentSec: elapsed }),
      });
      const result = (await response.json()) as { attemptId?: string; error?: string };
      if (!response.ok || !result.attemptId) throw new Error(result.error ?? "Не удалось завершить пробник.");
      try {
        localStorage.removeItem(`entgo:attempt_answers:${payload.attempt.id}`);
      } catch {
        // Ignore
      }
      router.push(`/results?attempt=${encodeURIComponent(result.attemptId)}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось завершить пробник.");
      setFinishing(false);
    }
  }, [elapsed, finishing, payload, router]);

  useEffect(() => {
    if (!payload || seconds !== 0 || finishing) return;
    const timer = window.setTimeout(() => void finish(), 0);
    return () => window.clearTimeout(timer);
  }, [finish, finishing, payload, seconds]);

  const answer = useCallback(
    async (optionId: string, forceAiHelp = false) => {
      if (!payload || !question || saving) return;
      const previous = answers[question.id];
      const nextAnswers = { ...answers, [question.id]: optionId };
      setAnswers(nextAnswers);
      try {
        localStorage.setItem(`entgo:attempt_answers:${payload.attempt.id}`, JSON.stringify(nextAnswers));
      } catch {
        // Ignore
      }
      setSaving(true);
      try {
        const response = await fetch(`/api/attempts/${payload.attempt.id}/answer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId: question.id,
            optionId,
            timeSpentSec: elapsed,
            usedAiHelp: forceAiHelp || helped.has(question.id),
          }),
        });
        const result = (await response.json()) as { error?: string };
        if (!response.ok) throw new Error(result.error ?? "Ответ не сохранился.");
      } catch (reason) {
        setAnswers((state) => {
          const next = { ...state };
          if (previous) next[question.id] = previous;
          else delete next[question.id];
          return next;
        });
        setError(reason instanceof Error ? reason.message : "Ответ не сохранился.");
      } finally {
        setSaving(false);
      }
    },
    [answers, elapsed, helped, payload, question, saving]
  );

  const askHelp = useCallback(async () => {
    if (!payload || !question || askingHelp) return;
    setAskingHelp(true);
    try {
      const response = await fetch(`/api/attempts/${payload.attempt.id}/help`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: question.id }),
      });
      const result = (await response.json()) as { hint?: string; error?: string };
      if (!response.ok || !result.hint) throw new Error(result.error ?? "Подсказка недоступна.");
      setHints((state) => ({ ...state, [question.id]: result.hint! }));
      setHelped((state) => new Set(state).add(question.id));
      if (answers[question.id]) await answer(answers[question.id], true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Подсказка недоступна.");
    } finally {
      setAskingHelp(false);
    }
  }, [answer, answers, askingHelp, payload, question]);

  // Keyboard navigation
  useEffect(() => {
    if (!payload || !question) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.key === "ArrowLeft") {
        setCurrent((val) => Math.max(0, val - 1));
      } else if (e.key === "ArrowRight") {
        setCurrent((val) => Math.min(payload!.questions.length - 1, val + 1));
      } else if (e.key === "f" || e.key === "F" || e.key === "а" || e.key === "А") {
        setFlagged((state) => {
          const next = new Set(state);
          if (next.has(question!.id)) next.delete(question!.id);
          else next.add(question!.id);
          return next;
        });
      } else {
        // Options 1-5 or A-E
        const digit = parseInt(e.key, 10);
        if (digit >= 1 && digit <= question!.options.length) {
          const opt = question!.options[digit - 1];
          if (opt) void answer(opt.id);
        } else {
          const char = e.key.toUpperCase();
          const letterIndex = char.charCodeAt(0) - 65; // A=0, B=1, ...
          if (letterIndex >= 0 && letterIndex < question!.options.length) {
            const opt = question!.options[letterIndex];
            if (opt) void answer(opt.id);
          }
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [answer, payload, question]);

  if (!payload || !question) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f7f4] px-5 text-center">
        <div>
          {error ? (
            <>
              <p className="font-semibold text-danger">{error}</p>
              <button
                onClick={() => location.reload()}
                className="mt-5 rounded-full bg-[#2563eb] px-6 py-3 text-sm font-semibold text-white"
              >
                Попробовать снова
              </button>
            </>
          ) : (
            <>
              <LoaderCircle className="mx-auto animate-spin text-[#2563eb]" />
              <p className="mt-4 text-sm text-muted">Готовим пробник...</p>
            </>
          )}
        </div>
      </main>
    );
  }

  const remainingCount = payload.questions.length - answeredCount;

  return (
    <main className="product-v2 min-h-screen bg-paper">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur-md">
        <div className="container-shell flex h-[70px] items-center justify-between gap-3">
          <Brand />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowMobileGrid(true)}
              className="flex items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-1.5 text-xs font-bold lg:hidden"
            >
              <LayoutGrid size={15} />
              <span>
                {current + 1} / {payload.questions.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setShowHotkeysHelp(true)}
              title="Горячие клавиши"
              className="hidden size-9 place-items-center rounded-full border border-line bg-paper text-muted hover:text-ink md:grid"
            >
              <Keyboard size={16} />
            </button>
            {!isOnline && (
              <span className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">
                <WifiOff size={14} />
                <span className="hidden sm:inline">Офлайн (сохраняем локально)</span>
              </span>
            )}
            <div
              className={`flex items-center gap-2 rounded-full px-4 py-2 font-mono text-xs font-bold transition-all ${
                seconds > 0 && seconds < 300
                  ? "bg-rose-600 text-white animate-pulse shadow-md shadow-rose-600/30"
                  : seconds > 0 && seconds <= 600
                  ? "bg-amber-500 text-white"
                  : "bg-[#111] text-white"
              }`}
            >
              <Clock3 size={14} /> {time}
            </div>
          </div>
        </div>
      </header>

      <div className="landing-shell grid gap-6 py-5 lg:grid-cols-[280px_minmax(0,1fr)] lg:py-8">
        {/* Desktop Sidebar Navigator */}
        <aside className="hidden rounded-[30px] border border-line bg-white p-6 lg:block self-start sticky top-24">
          <p className="text-xs font-bold uppercase tracking-[.15em] text-muted">Навигатор вопросов</p>
          <div className="mt-5 space-y-5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            {subjectGroups.map(([subject, items]) => (
              <div key={subject}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="truncate text-[11px] font-bold uppercase tracking-[.08em] text-muted">{subject}</p>
                  <span className="text-[11px] text-muted">{items.length}</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {items.map(({ item, index }) => (
                    <button
                      key={item.id}
                      aria-label={`${subject}, вопрос ${index + 1}`}
                      onClick={() => setCurrent(index)}
                      className={`relative aspect-square rounded-xl text-xs font-bold transition-all ${
                        current === index
                          ? "bg-ink text-white ring-2 ring-[#2563eb]"
                          : answers[item.id]
                          ? "bg-[#e9f7ef] text-success hover:bg-[#dcf3e5]"
                          : "bg-paper hover:bg-[#eae9e4]"
                      }`}
                    >
                      {index + 1}
                      {flagged.has(item.id) && (
                        <span className="absolute right-1 top-1 size-1.5 rounded-full bg-[#ef7c30]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 border-t border-line pt-4 text-xs leading-5 text-muted">
            <div className="flex justify-between">
              <span>Отвечено:</span>
              <strong className="text-ink">{answeredCount}</strong>
            </div>
            <div className="flex justify-between">
              <span>Осталось:</span>
              <strong className="text-ink">{remainingCount}</strong>
            </div>
          </div>
        </aside>

        {/* Question Content */}
        <section className="overflow-hidden rounded-[32px] border border-line bg-white shadow-[0_24px_70px_rgba(0,0,0,.05)]">
          <div className="border-b border-line px-6 py-4 sm:px-9 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.14em] text-[#2563eb]">{question.subject}</p>
              <p className="mt-0.5 text-xs text-muted">{question.topic}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setFlagged((state) => {
                    const next = new Set(state);
                    if (next.has(question.id)) next.delete(question.id);
                    else next.add(question.id);
                    return next;
                  })
                }
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  flagged.has(question.id)
                    ? "bg-[#fff2e8] text-[#ef7c30]"
                    : "bg-paper text-muted hover:text-ink"
                }`}
              >
                <Flag size={14} fill={flagged.has(question.id) ? "currentColor" : "none"} />
                <span>{flagged.has(question.id) ? "Отмечен" : "Отметить"}</span>
              </button>
              <span className="rounded-full bg-paper px-3 py-1.5 text-xs font-semibold">
                {current + 1} из {payload.questions.length}
              </span>
            </div>
          </div>

          <div className="px-6 py-8 sm:px-9 sm:py-10">
            <h1 className="max-w-4xl text-xl font-semibold leading-[1.4] tracking-[-.02em] sm:text-2xl">
              <FormattedContent text={question.body} />
            </h1>

            {/* Answer Options */}
            <div className="mt-8 grid gap-3">
              {question.options.map((option, index) => {
                const selected = answers[question.id] === option.id;
                return (
                  <button
                    key={option.id}
                    data-testid="answer-option"
                    disabled={saving}
                    onClick={() => void answer(option.id)}
                    className={`flex min-h-16 items-center gap-4 rounded-2xl border px-5 text-left text-sm font-medium transition-all ${
                      selected
                        ? "border-ink bg-ink text-white shadow-md"
                        : "border-line bg-white hover:border-black/40 hover:bg-[#faf9f6]"
                    }`}
                  >
                    <span
                      className={`grid size-8 shrink-0 place-items-center rounded-full border text-xs font-bold ${
                        selected ? "border-white bg-white text-ink" : "border-line bg-paper"
                      }`}
                    >
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="leading-5">
                      <FormattedContent text={option.content} />
                    </span>
                  </button>
                );
              })}
            </div>

            {/* AI Hint Section */}
            <div className="mt-6">
              {hints[question.id] ? (
                <div className="rounded-2xl border border-[#fbbf24] bg-[#fffdf0] p-5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.12em] text-[#b45309]">
                    <Lightbulb size={16} />
                    <span>Подсказка entgo.ai</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#78350f]">{hints[question.id]}</p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => void askHelp()}
                  disabled={askingHelp}
                  className="inline-flex items-center gap-2 rounded-full border border-[#fbbf24] bg-[#fffdf0] px-4 py-2 text-xs font-bold text-[#b45309] hover:bg-[#fef9c3] transition"
                >
                  {askingHelp ? (
                    <LoaderCircle size={14} className="animate-spin" />
                  ) : (
                    <Lightbulb size={14} />
                  )}
                  <span>Подсказка без прямого ответа (-10 XP)</span>
                </button>
              )}
            </div>

            {error && (
              <p role="alert" className="mt-5 rounded-xl bg-[#fff1ef] px-4 py-3 text-sm text-danger">
                {error}
              </p>
            )}
          </div>

          {/* Bottom Bar */}
          <div className="flex items-center justify-between border-t border-line px-6 py-4 sm:px-9 bg-[#fdfdfc]">
            <button
              onClick={() => setCurrent((value) => Math.max(0, value - 1))}
              disabled={current === 0}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold disabled:opacity-25 hover:bg-paper"
            >
              <ChevronLeft size={16} /> Назад
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                data-testid="finish-exam"
                disabled={finishing}
                onClick={() => {
                  if (remainingCount > 0) {
                    setShowFinishConfirm(true);
                  } else {
                    void finish();
                  }
                }}
                className="rounded-full border border-line bg-paper px-4 py-2.5 text-xs sm:text-sm font-bold text-ink hover:bg-white transition"
              >
                Завершить · {answeredCount}/{payload.questions.length}
              </button>

              {current < payload.questions.length - 1 && (
                <button
                  data-testid="next-question"
                  onClick={() => setCurrent((value) => Math.min(payload.questions.length - 1, value + 1))}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#2563eb] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md hover:bg-[#1d4ed8]"
                >
                  Дальше <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Mobile Question Navigator Drawer */}
      {showMobileGrid && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm lg:hidden">
          <div className="max-h-[80vh] overflow-y-auto rounded-t-[32px] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <h3 className="font-bold text-lg">Вопросы теста</h3>
                <p className="text-xs text-muted">
                  Отвечено: {answeredCount} из {payload.questions.length}
                </p>
              </div>
              <button
                onClick={() => setShowMobileGrid(false)}
                className="grid size-9 place-items-center rounded-full bg-paper"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mt-5 space-y-6">
              {subjectGroups.map(([subject, items]) => (
                <div key={subject}>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">{subject}</p>
                  <div className="grid grid-cols-6 gap-2">
                    {items.map(({ item, index }) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setCurrent(index);
                          setShowMobileGrid(false);
                        }}
                        className={`relative aspect-square rounded-xl text-xs font-bold ${
                          current === index
                            ? "bg-ink text-white ring-2 ring-[#2563eb]"
                            : answers[item.id]
                            ? "bg-[#e9f7ef] text-success"
                            : "bg-paper"
                        }`}
                      >
                        {index + 1}
                        {flagged.has(item.id) && (
                          <span className="absolute right-1 top-1 size-1.5 rounded-full bg-[#ef7c30]" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Finish Confirmation Dialog */}
      {showFinishConfirm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-line bg-white p-7 text-center shadow-2xl">
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#fff1ef] text-danger">
              <HelpCircle size={24} />
            </div>
            <h3 className="mt-4 text-xl font-bold">Завершить пробник?</h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              У вас осталось <strong className="text-ink">{remainingCount} неотвеченных</strong> вопросов из{" "}
              {payload.questions.length}. После завершения ответы нельзя будет изменить.
            </p>

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                disabled={finishing}
                onClick={() => {
                  setShowFinishConfirm(false);
                  void finish();
                }}
                className="h-12 w-full rounded-full bg-danger text-sm font-bold text-white hover:bg-red-700 transition"
              >
                {finishing ? "Завершаем..." : "Да, завершить и получить результат"}
              </button>
              <button
                type="button"
                onClick={() => setShowFinishConfirm(false)}
                className="h-12 w-full rounded-full border border-line bg-paper text-sm font-semibold hover:bg-[#e9e8e3] transition"
              >
                Вернуться к вопросам
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hotkeys Modal */}
      {showHotkeysHelp && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-line bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2 font-bold">
                <Keyboard size={18} />
                <span>Горячие клавиши</span>
              </div>
              <button onClick={() => setShowHotkeysHelp(false)} className="grid size-8 place-items-center rounded-full bg-paper">
                <X size={16} />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-xs leading-5">
              <div className="flex justify-between items-center py-1 border-b border-line/60">
                <span className="text-muted">Выбор вариантов A, B, C, D, E</span>
                <span className="rounded bg-paper px-2 py-1 font-mono font-bold">1 – 5</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-line/60">
                <span className="text-muted">Предыдущий вопрос</span>
                <span className="rounded bg-paper px-2 py-1 font-mono font-bold">← Стрелка влево</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-line/60">
                <span className="text-muted">Следующий вопрос</span>
                <span className="rounded bg-paper px-2 py-1 font-mono font-bold">→ Стрелка вправо</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted">Отметить вопрос флажком</span>
                <span className="rounded bg-paper px-2 py-1 font-mono font-bold">F</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

