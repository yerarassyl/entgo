"use client";

import { Bot, LoaderCircle, Send, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type ChatMessage = { role: "user" | "assistant"; content: string };

export function AiTutor() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [threadId, setThreadId] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [upgrade, setUpgrade] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function captureSelection() {
      const selection = window.getSelection()?.toString().trim() ?? "";
      if (selection.length >= 3) setSelectedText(selection.slice(0, 2_500));
    }
    document.addEventListener("selectionchange", captureSelection);
    return () => document.removeEventListener("selectionchange", captureSelection);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    function openWithPrompt(event: Event) {
      const prompt = (event as CustomEvent<string>).detail;
      if (!prompt) return;
      setOpen(true);
      setMessage(prompt);
    }
    window.addEventListener("entgo:ai-prompt", openWithPrompt);
    const openTutor = () => setOpen(true);
    window.addEventListener("entgo:ai-open", openTutor);
    return () => {
      window.removeEventListener("entgo:ai-prompt", openWithPrompt);
      window.removeEventListener("entgo:ai-open", openTutor);
    };
  }, []);

  if (
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/premium") ||
    pathname.startsWith("/exam") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/privacy") ||
    pathname.startsWith("/terms") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/phone-login") ||
    pathname.startsWith("/verify-email") ||
    pathname.startsWith("/reset-password")
  ) {
    return null;
  }

  async function ask(preset?: string) {
    const text = (preset ?? message).trim();
    if (!text || loading) return;
    setMessages((current) => [...current, { role: "user", content: text }]);
    setMessage("");
    setLoading(true);
    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          selectedText: selectedText || undefined,
          contextUrl: window.location.href,
          pageTitle: document.title,
          threadId,
          mode: pathname.startsWith("/exam") ? "exam_hint" : "tutor",
        }),
      });
      const result = (await response.json()) as {
        answer?: string;
        threadId?: string;
        error?: string;
        upgrade?: boolean;
      };
      if (!response.ok || !result.answer) {
        setUpgrade(Boolean(result.upgrade));
        throw new Error(result.error ?? "AI временно недоступен.");
      }
      setThreadId(result.threadId);
      setMessages((current) => [...current, { role: "assistant", content: result.answer! }]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        { role: "assistant", content: error instanceof Error ? error.message : "AI временно недоступен." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="floating-ai fixed right-3 z-[70] md:bottom-5 md:right-5">
      {open && (
        <section className="mb-3 flex h-[min(620px,calc(100vh-110px))] w-[min(390px,calc(100vw-28px))] flex-col overflow-hidden rounded-[26px] border border-black/10 bg-white shadow-2xl">
          <header className="flex items-center justify-between bg-[#2563eb] px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-full bg-white text-ink"><Bot size={18} /></span>
              <div><p className="text-sm font-bold">Твой AI-репетитор</p><p className="text-[11px] text-white/55">Видит контекст этой страницы</p></div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Закрыть AI"><X size={18} /></button>
          </header>
          {selectedText && (
            <div className="border-b border-line bg-[#fff8dc] px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <p className="line-clamp-3 text-xs leading-5"><strong>Выделено:</strong> {selectedText}</p>
                <button onClick={() => setSelectedText("")} className="shrink-0 text-muted"><X size={14} /></button>
              </div>
            </div>
          )}
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {!messages.length && (
              <>
                <p className="text-sm leading-6 text-muted">Выдели текст, вопрос или ошибку и спроси у ИИ. Я учту эту страницу, слабые места и прошлые ошибки.</p>
                <div className="grid gap-2">
                  {["Объясни проще", "Почему ответ такой?", "Дай похожую задачу", "Разбери мою ошибку", "Добавить в план обучения"].map((item) => (
                    <button key={item} onClick={() => void ask(item)} className="rounded-xl border border-line px-4 py-3 text-left text-xs font-semibold hover:bg-paper">{item}</button>
                  ))}
                </div>
              </>
            )}
            {messages.map((item, index) => (
              <div key={`${item.role}-${index}`} className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${item.role === "user" ? "ml-auto bg-[#2563eb] text-white" : "bg-paper text-ink"}`}>{item.content}</div>
            ))}
            {loading && <div className="flex items-center gap-2 text-xs text-muted"><LoaderCircle className="animate-spin" size={15} /> Разбираю контекст...</div>}
            {upgrade && <Link href="/premium" className="block rounded-xl bg-ink px-4 py-3 text-center text-xs font-bold text-white">Открыть Premium</Link>}
          </div>
          <form onSubmit={(event) => { event.preventDefault(); void ask(); }} className="flex gap-2 border-t border-line p-3">
            <input ref={inputRef} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Спроси о том, что на экране" className="min-w-0 flex-1 rounded-full border border-line px-4 py-3 text-sm outline-none focus:border-ink" />
            <button disabled={loading || !message.trim()} className="grid size-11 place-items-center rounded-full bg-ink text-white disabled:opacity-35" aria-label="Отправить"><Send size={16} /></button>
          </form>
        </section>
      )}
      <button
        onClick={() => setOpen((value) => !value)}
        aria-label={selectedText ? "Спросить про выделенное" : "Спросить у ИИ"}
        title={selectedText ? "Спросить про выделенное" : "Спросить у ИИ"}
        className="ml-auto hidden size-12 place-items-center rounded-full bg-[#2563eb] text-white shadow-[0_12px_30px_rgba(37,99,235,.28)] transition hover:scale-105 md:grid"
      >
        <Sparkles size={18} />
      </button>
    </div>
  );
}
