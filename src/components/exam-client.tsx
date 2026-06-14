"use client";

import { ChevronLeft, ChevronRight, Clock3, Flag, Lightbulb, LoaderCircle } from "lucide-react";
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

export function ExamClient({ topicId }: { topicId?: string }) {
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

  useEffect(() => {
    let active = true;
    void fetch("/api/attempts/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topicId: topicId || undefined }),
    })
      .then(async (response) => {
        const result = (await response.json()) as StartPayload & { error?: string };
        if (!response.ok) throw new Error(result.error ?? "Не удалось начать пробник.");
        if (!active) return;
        setPayload(result);
        setSeconds(remainingSeconds(result.attempt.expiresAt, result.attempt.durationSec));
        setAnswers(Object.fromEntries(result.savedAnswers.filter((item) => item.optionId).map((item) => [item.questionId, item.optionId!])));
        setHelped(new Set(result.savedAnswers.filter((item) => item.usedAiHelp).map((item) => item.questionId)));
      })
      .catch((reason: unknown) => active && setError(reason instanceof Error ? reason.message : "Не удалось начать пробник."));
    return () => { active = false; };
  }, [topicId]);

  useEffect(() => {
    if (!payload || seconds <= 0) return;
    const timer = window.setInterval(() => setSeconds(remainingSeconds(payload.attempt.expiresAt, payload.attempt.durationSec)), 1_000);
    return () => window.clearInterval(timer);
  }, [payload, seconds]);

  const question = payload?.questions[current];
  const answeredCount = Object.keys(answers).length;
  const elapsed = payload ? Math.min(payload.attempt.durationSec, payload.attempt.durationSec - seconds) : 0;
  const time = useMemo(() => `${String(Math.floor(seconds / 3600)).padStart(2, "0")}:${String(Math.floor((seconds % 3600) / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`, [seconds]);

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

  async function answer(optionId: string, forceAiHelp = false) {
    if (!payload || !question || saving) return;
    const previous = answers[question.id];
    setAnswers((state) => ({ ...state, [question.id]: optionId }));
    setSaving(true);
    try {
      const response = await fetch(`/api/attempts/${payload.attempt.id}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: question.id, optionId, timeSpentSec: elapsed, usedAiHelp: forceAiHelp || helped.has(question.id) }),
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
  }

  async function askHelp() {
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
  }

  if (!payload || !question) {
    return <main className="grid min-h-screen place-items-center bg-paper px-5 text-center"><div>{error ? <><p className="font-semibold">{error}</p><button onClick={() => location.reload()} className="mt-5 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white">Попробовать снова</button></> : <><LoaderCircle className="mx-auto animate-spin" /><p className="mt-4 text-sm text-muted">Готовим пробник...</p></>}</div></main>;
  }

  return (
    <main className="min-h-screen bg-paper">
      <header className="border-b border-line bg-white"><div className="container-shell flex h-18 items-center justify-between"><Brand /><div className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 font-mono text-xs font-semibold text-white"><Clock3 size={14} /> {time}</div></div></header>
      <div className="landing-shell grid gap-6 py-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden rounded-[24px] border border-line bg-white p-5 lg:block">
          <p className="text-xs font-bold uppercase tracking-[.15em] text-muted">Пробный ЕНТ</p>
          <div className="mt-6 grid grid-cols-5 gap-2">{payload.questions.map((item, index) => <button key={item.id} onClick={() => setCurrent(index)} className={`relative aspect-square rounded-lg text-xs font-bold ${current === index ? "bg-ink text-white" : answers[item.id] ? "bg-[#e9f7ef] text-success" : "bg-paper"}`}>{index + 1}{flagged.has(item.id) && <span className="absolute right-1 top-1 size-1.5 rounded-full bg-[#ef7c30]" />}</button>)}</div>
          <div className="mt-7 border-t border-line pt-5 text-xs leading-5 text-muted"><p><strong className="text-ink">{answeredCount}</strong> отвечено</p><p><strong className="text-ink">{payload.questions.length - answeredCount}</strong> осталось</p></div>
          <p className="mt-5 rounded-xl bg-paper p-3 text-xs leading-5 text-muted">Правильные ответы и объяснения откроются только после завершения.</p>
        </aside>
        <section className="overflow-hidden rounded-[24px] border border-line bg-white">
          <div className="border-b border-line px-6 py-5 sm:px-9"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-muted">{question.subject}</p><p className="mt-1 text-xs text-muted">{question.topic}</p></div><span className="rounded-full bg-paper px-3 py-1.5 text-xs font-semibold">Вопрос {current + 1} из {payload.questions.length}</span></div></div>
          <div className="px-6 py-8 sm:px-9 sm:py-10">
            <h1 className="max-w-3xl text-xl font-semibold leading-8 sm:text-2xl">{question.body}</h1>
            <div className="mt-8 grid gap-3">{question.options.map((option, index) => { const selected = answers[question.id] === option.id; return <button key={option.id} data-testid="answer-option" disabled={saving} onClick={() => void answer(option.id)} className={`flex min-h-16 items-center gap-4 rounded-2xl border px-5 text-left text-sm font-medium ${selected ? "border-ink bg-ink text-white" : "border-line hover:border-black/40"}`}><span className={`grid size-8 shrink-0 place-items-center rounded-full border text-xs font-bold ${selected ? "border-white bg-white text-ink" : "border-line"}`}>{String.fromCharCode(65 + index)}</span>{option.content}</button>; })}</div>
            <button onClick={() => void askHelp()} disabled={askingHelp || Boolean(hints[question.id])} className="mt-6 inline-flex items-center gap-2 rounded-full border border-line px-5 py-3 text-sm font-semibold disabled:opacity-50"><Lightbulb size={17} /> {askingHelp ? "Готовим подсказку..." : hints[question.id] ? "AI уже помог" : "Попросить помощь у AI · −8 XP"}</button>
            {hints[question.id] && <div className="mt-4 rounded-2xl bg-[#fff8dc] p-5"><p className="text-xs font-bold uppercase tracking-[.12em]">AI-подсказка без ответа</p><p className="mt-2 text-sm leading-6 text-muted">{hints[question.id]}</p></div>}
            {error && <p role="alert" className="mt-5 rounded-xl bg-[#fff1ef] px-4 py-3 text-sm text-danger">{error}</p>}
          </div>
          <div className="flex items-center justify-between border-t border-line px-6 py-5 sm:px-9">
            <button onClick={() => setCurrent((value) => Math.max(0, value - 1))} disabled={current === 0} className="inline-flex items-center gap-2 text-sm font-semibold disabled:opacity-25"><ChevronLeft size={18} /> Назад</button>
            <button onClick={() => setFlagged((state) => { const next = new Set(state); if (next.has(question.id)) next.delete(question.id); else next.add(question.id); return next; })} className="hidden items-center gap-2 text-xs font-semibold text-muted sm:flex"><Flag size={15} fill={flagged.has(question.id) ? "currentColor" : "none"} /> Отметить</button>
            {current === payload.questions.length - 1 ? <button data-testid="finish-exam" disabled={finishing} onClick={() => void finish()} className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white disabled:opacity-50">{finishing ? "Сохраняем..." : `Завершить · ${answeredCount}/${payload.questions.length}`}</button> : <button data-testid="next-question" onClick={() => setCurrent((value) => Math.min(payload.questions.length - 1, value + 1))} className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white">Дальше <ChevronRight size={18} /></button>}
          </div>
        </section>
      </div>
    </main>
  );
}
