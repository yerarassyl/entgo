"use client";

import { ArrowLeft, LoaderCircle, Send, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Brand } from "@/components/brand";

type ChatMessage = { role: "user" | "assistant"; content: string };
type Lesson = { summary: string; rule: string; example: string; mistake: string; steps: string[] };

function lessonMessage(title: string, subject: string, lesson: Lesson) {
  return [
    "Привет! Я entgo.ai — твой репетитор по подготовке к ЕНТ.",
    `Сегодня разбираем тему «${title}» (${subject}).`, "",
    "О чём эта тема", lesson.summary, "", "Главное правило", lesson.rule, "",
    "Пример", lesson.example, "", "Типичная ошибка", lesson.mistake,
    ...(lesson.steps.length ? ["", "Как действовать", ...lesson.steps.map((step, index) => `${index + 1}. ${step}`)] : []),
    "", "Можешь задать вопрос по уроку — объясню другой формулировкой, разберу пример или помогу найти ошибку в рассуждении.",
  ].join("\n");
}

export function LessonChat({
  subject,
  title,
  lesson,
}: { subject: string; title: string; lesson: Lesson }) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [{ role: "assistant", content: lessonMessage(title, subject, lesson) }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [threadId, setThreadId] = useState<string>();
  const [selection, setSelection] = useState<{ text: string; top: number; left: number } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, loading]);

  const detectSelection = useCallback(() => {
    const current = window.getSelection();
    const text = current?.toString().trim() ?? "";
    if (text.length < 3 || !current?.rangeCount) { setSelection(null); return; }
    const range = current.getRangeAt(0).getBoundingClientRect();
    setSelection({ text: text.slice(0, 2500), top: Math.max(12, range.top - 54), left: Math.min(window.innerWidth - 220, Math.max(12, range.left + range.width / 2 - 110)) });
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", detectSelection);
    return () => document.removeEventListener("selectionchange", detectSelection);
  }, [detectSelection]);

  async function sendMessage(event?: FormEvent, selectedText?: string) {
    event?.preventDefault();
    const text = selectedText ? "Объясни этот фрагмент урока простыми словами." : input.trim();
    if (!text || loading) return;
    setMessages((current) => [...current, { role: "user", content: selectedText ? `${text}\n«${selectedText}»` : text }]);
    setInput(""); setSelection(null); setLoading(true);
    try {
      const response = await fetch("/api/ai/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text, selectedText, threadId, contextUrl: window.location.href, pageTitle: `Урок: ${title}` }) });
      const data = await response.json() as { answer?: string; error?: string; threadId?: string };
      if (!response.ok || data.error) throw new Error(data.error);
      if (data.threadId) setThreadId(data.threadId);
      setMessages((current) => [...current, { role: "assistant", content: data.answer ?? "" }]);
    } catch {
      setMessages((current) => [...current, { role: "assistant", content: "Не получилось получить ответ. Попробуй ещё раз чуть позже." }]);
    } finally { setLoading(false); }
  }

  return (
    <main className="mobile-app-page min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur-xl"><div className="container-shell flex h-16 items-center justify-between"><Brand /><Link href="/topics" className="grid size-10 place-items-center rounded-full border border-line bg-white" aria-label="Вернуться к темам"><ArrowLeft size={17} /></Link></div></header>
      <div className="container-shell flex min-h-[calc(100vh-4rem)] flex-col py-4 sm:py-8">
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden rounded-[28px] border border-line bg-white shadow-[0_24px_70px_rgba(0,0,0,.045)]">
          <div className="border-b border-line px-5 py-5 sm:px-8"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#2563eb]">{subject} · урок</p><h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1><p className="mt-2 text-sm text-muted">Урок в формате диалога с entgo.ai</p></div>
          <div className="relative flex-1 space-y-5 overflow-y-auto px-4 py-6 sm:px-8" onMouseUp={detectSelection}>
            {selection && <div className="fixed z-50 flex items-center gap-1 rounded-full bg-ink p-1 text-white shadow-xl" style={{ top: selection.top, left: selection.left }}><button type="button" onClick={() => void sendMessage(undefined, selection.text)} className="rounded-full px-3 py-2 text-xs font-semibold hover:bg-white/15">Объяснить выделенное</button><button type="button" onClick={() => setSelection(null)} className="grid size-8 place-items-center rounded-full hover:bg-white/15" aria-label="Закрыть"><X size={14} /></button></div>}
            {messages.map((message, index) => <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}><article className={`max-w-[92%] rounded-3xl px-4 py-3.5 text-sm leading-6 sm:max-w-[84%] sm:px-5 ${message.role === "user" ? "rounded-br-md bg-[#2563eb] text-white" : "rounded-bl-md bg-[#f3f4f6] text-ink"}`}>{message.role === "assistant" && <div className="mb-2 flex items-center gap-2 text-xs font-bold text-[#2563eb]"><Sparkles size={14} /> entgo.ai</div>}<p className="whitespace-pre-wrap">{message.content}</p></article></div>)}
            {loading && <div className="flex items-center gap-2 px-2 text-xs text-muted"><LoaderCircle className="animate-spin" size={14} /> entgo.ai печатает…</div>}<div ref={endRef} />
          </div>
          <form onSubmit={(event) => void sendMessage(event)} className="border-t border-line bg-white p-3 sm:p-4"><div className="flex items-end gap-2 rounded-2xl border border-line bg-[#f8f9fb] p-2 focus-within:border-[#2563eb]"><textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} placeholder="Напиши вопрос по уроку…" rows={1} disabled={loading} className="max-h-32 min-h-11 flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm outline-none" /><button type="submit" disabled={loading || !input.trim()} className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#2563eb] text-white disabled:opacity-35" aria-label="Отправить вопрос">{loading ? <LoaderCircle className="animate-spin" size={18} /> : <Send size={18} />}</button></div><p className="mt-2 text-center text-[11px] text-muted">Выдели любой фрагмент урока — сверху появится действие для объяснения.</p></form>
        </div>
      </div>
    </main>
  );
}
