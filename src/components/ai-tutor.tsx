"use client";

import { Bot, ChevronDown, LoaderCircle, RotateCcw, Send, Sparkles, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

type ChatMessage = { role: "user" | "assistant"; content: string };

const QUICK_PROMPTS = [
  "Объясни эту тему простыми словами",
  "Дай похожую задачу для практики",
  "Какие формулы здесь нужно помнить?",
  "Как не ошибаться на таких вопросах в ЕНТ?",
];

export function AiTutor() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [threadId, setThreadId] = useState<string>();
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const hidden =
    pathname === "/" ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/exam") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/verify-email") ||
    pathname.startsWith("/phone-login") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password");

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, open]);

  const sendPrompt = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;
      setError("");
      const userMessage = text.trim();
      setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
      setInput("");
      setLoading(true);

      try {
        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userMessage,
            threadId,
            contextUrl: typeof window !== "undefined" ? window.location.href : undefined,
            pageTitle: typeof document !== "undefined" ? document.title : undefined,
          }),
        });

        const data = (await response.json()) as {
          answer?: string;
          error?: string;
          threadId?: string;
        };

        if (!response.ok || data.error) {
          throw new Error(data.error ?? "Не удалось получить ответ.");
        }

        if (data.threadId) setThreadId(data.threadId);
        setMessages((prev) => [...prev, { role: "assistant", content: data.answer ?? "" }]);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Ошибка связи с AI-тьютором.";
        setError(msg);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Не удалось получить ответ: ${msg}. Попробуй снова через минуту.`,
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, threadId]
  );

  useEffect(() => {
    const handleCustomPrompt = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      const prompt = customEvent.detail;
      if (prompt) {
        setOpen(true);
        void sendPrompt(prompt);
      }
    };

    window.addEventListener("entgo:ai-prompt", handleCustomPrompt);
    return () => window.removeEventListener("entgo:ai-prompt", handleCustomPrompt);
  }, [sendPrompt]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void sendPrompt(input);
  }

  function clearHistory() {
    setMessages([]);
    setThreadId(undefined);
    setError("");
  }

  if (hidden) return null;

  return (
    <div data-ai-tutor className="fixed bottom-4 right-4 z-[70] md:bottom-6 md:right-6">
      {open ? (
        <section
          className="flex h-[min(560px,calc(100vh-5rem))] w-[min(400px,calc(100vw-24px))] flex-col overflow-hidden rounded-[28px] border border-line bg-white shadow-2xl transition-all"
          aria-label="Диалог с AI-тьютором"
        >
          {/* Header */}
          <header className="flex items-center justify-between border-b border-line bg-[#172033] px-5 py-4 text-white">
            <div className="flex items-center gap-2.5">
              <div className="grid size-8 place-items-center rounded-full bg-[#2563eb] text-white">
                <Sparkles size={16} />
              </div>
              <div>
                <p className="text-sm font-bold leading-none">entgo.ai Тьютор</p>
                <span className="mt-1 flex items-center gap-1.5 text-[10px] text-[#8bb4ff]">
                  <span className="size-1.5 rounded-full bg-[#4ade80] animate-pulse" />
                  Готов помочь по ЕНТ
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={clearHistory}
                  title="Очистить диалог"
                  className="grid size-8 place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
                >
                  <RotateCcw size={15} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                title="Свернуть"
                className="grid size-8 place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
              >
                <ChevronDown size={18} />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                title="Закрыть"
                className="grid size-8 place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
              >
                <X size={17} />
              </button>
            </div>
          </header>

          {/* Chat Messages */}
          <div className="flex-1 space-y-3.5 overflow-y-auto p-4 text-sm">
            {messages.length === 0 && (
              <div className="py-4 text-center">
                <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#f0f4ff] text-[#2563eb]">
                  <Bot size={24} />
                </div>
                <h4 className="mt-3 font-bold text-ink">Привет! Я твой AI-тьютор ЕНТ</h4>
                <p className="mt-1 text-xs leading-5 text-muted">
                  Задай вопрос по любой теме, формуле или задаче. Я объясню по шагам и помогу закрепить.
                </p>

                <div className="mt-5 space-y-1.5 text-left">
                  <p className="px-1 text-[11px] font-bold uppercase tracking-wider text-muted">
                    Быстрые вопросы
                  </p>
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => void sendPrompt(prompt)}
                      className="block w-full rounded-xl border border-line bg-[#f8f9fc] p-2.5 text-left text-xs font-medium text-ink transition hover:border-[#2563eb] hover:bg-[#f0f4ff]"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[86%] rounded-2xl px-4 py-3 leading-6 ${
                    msg.role === "user"
                      ? "bg-[#2563eb] text-white rounded-br-none"
                      : "bg-[#f4f6fa] text-ink rounded-bl-none border border-line/60"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 rounded-xl bg-[#f4f6fa] p-3 text-xs text-muted">
                <LoaderCircle className="size-4 animate-spin text-[#2563eb]" />
                <span>entgo.ai думает и формулирует ответ…</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form onSubmit={handleSubmit} className="border-t border-line bg-white p-3">
            <div className="flex items-end gap-2 rounded-2xl border border-line bg-[#f8f9fc] p-1.5 focus-within:border-[#2563eb]">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void sendPrompt(input);
                  }
                }}
                placeholder="Спроси о задаче, теме или формуле…"
                rows={1}
                disabled={loading}
                className="max-h-24 min-h-10 flex-1 resize-none border-0 bg-transparent px-2.5 py-2 text-xs outline-none sm:text-sm"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                aria-label="Отправить вопрос"
                className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#2563eb] text-white transition hover:bg-[#1d4ed8] disabled:opacity-40"
              >
                {loading ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>
            {error && <p className="mt-1.5 text-[11px] text-danger">{error}</p>}
          </form>
        </section>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Открыть AI-тьютора"
          className="group flex h-13 items-center gap-2.5 rounded-full bg-[#172033] px-4 py-2.5 text-white shadow-xl ring-2 ring-[#2563eb]/30 transition hover:scale-105 hover:bg-[#1f2c44] active:scale-95"
        >
          <div className="grid size-7 place-items-center rounded-full bg-[#2563eb] text-white">
            <Sparkles size={15} />
          </div>
          <span className="text-xs font-bold sm:inline">AI-тьютор</span>
        </button>
      )}
    </div>
  );
}