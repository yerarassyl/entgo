"use client";

import { BookOpen, CheckCircle2, CircleHelp, Lightbulb, Target, TriangleAlert, LoaderCircle } from "lucide-react";
import { notFound } from "next/navigation";
import { useEffect, useState } from "react";
import { prisma } from "@/lib/prisma";
import { lessonForTopic } from "@/lib/topic-content";
import { requirePaidUser } from "@/lib/paid-access";

type ChatMessage = { role: "user" | "assistant"; content: string };

interface TopicData {
  id: string;
  subject: { titleRu: string; titleKk?: string };
  titleRu: string;
  titleKk?: string;
  summary: string;
  rule: string;
  example: string;
  mistake: string;
  steps: string[];
  questions: Array<{ id: string; body: string; difficulty: number; options?: Array<{ id: string; content: string; isCorrect: boolean }> }>;
}

export default function TopicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [user, setUser] = useState<any | null>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [topic, setTopic] = useState<TopicData | null>(null);

  // Hooks called unconditionally at top level
  useEffect(() => {
    async function init() {
      const u = await requirePaidUser();
      setUser(u);
      if (!u) return;

      const { id: topicId } = await params;
      const t = await prisma.topic.findUnique({
        where: { id: topicId },
        include: {
          subject: true,
          lesson: true,
          questions: {
            where: { status: "PUBLISHED" },
            include: { options: { orderBy: { position: "asc" } } },
            take: 8,
          },
        },
      });
      if (!t) {
        notFound();
        return;
      }

      const fallbackLesson = lessonForTopic(t.slug, t.titleRu);
      const lesson = t.lesson
        ? {
            summary: t.lesson.summary,
            rule: t.lesson.rule,
            example: t.lesson.example,
            mistake: t.lesson.mistake,
            steps:
              Array.isArray(t.lesson.steps) && t.lesson.steps.length > 0
                ? t.lesson.steps.filter((item): item is string => typeof item === "string")
                : fallbackLesson.steps,
          }
        : fallbackLesson;

      const formattedQuestions = (t.questions || []).map((q) => ({
        id: q.id,
        body: String(q.body ?? ""),
        difficulty: q.difficulty ?? 1,
        options: (q.options || []).map((o) => ({
          id: o.id,
          content: String(o.content ?? ""),
          isCorrect: o.isCorrect ?? false,
        })),
      }));

      setTopic({
        id: t.id,
        subject: t.subject,
        titleRu: t.titleRu,
        titleKk: t.titleKk,
        summary: lesson.summary,
        rule: lesson.rule,
        example: lesson.example,
        mistake: lesson.mistake,
        steps: lesson.steps,
        questions: formattedQuestions,
      });
    }
    init();
  }, [params]);

  if (!user || !topic) {
    return null;
  }

// eslint-disable-next-line react-hooks/rules-of-hooks
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: `👋 Привет! Я entgo.ai — твой личный репетитор по подготовке к ЕНТ.

📚 **${topic.titleRu}** — ${topic.subject.titleRu}

${topic.summary}

${topic.rule ? `\n🔑 **Главное правило:** ${topic.rule}` : ""}

${topic.example ? `\n💡 **Пример:** ${topic.example}` : ""}

${topic.mistake ? `\n⚠️ **Типическая ошибка:** ${topic.mistake}` : ""}

${topic.steps.length > 0 ? `\n📝 **Шаги обучения:**` + topic.steps.map((step, i) => `\n${i + 1}. ${step}`) : ""}

Если у тебя есть вопросы по этой теме — пиши ниже, и я объясню!`
    },
  ]);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [input, setInput] = useState("");

// eslint-disable-next-line react-hooks/rules-of-hooks
  const [loading, setLoading] = useState(false);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const text = input.trim();
        if (text) {
          setMessages((msgs) => [...msgs, { role: "user", content: text }]);
          setInput("");
          setLoading(true);
          fetch("/api/ai/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: text,
              contextUrl: window.location.href,
              pageTitle: document.title,
            }),
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.error) throw new Error(data.error);
              setMessages((msgs) => [...msgs, { role: "assistant", content: data.answer ?? "" }]);
            })
            .catch((err) =>
              setMessages((msgs) => [...msgs, { role: "assistant", content: "entgo.ai временно недоступен. Попробуй позже." }])
            )
            .finally(() => setLoading(false));
        }
      }
    };

    const handleSelection = () => {
      const selection = window.getSelection()?.toString();
      if (selection && selection.length >= 3) {
        const popup = document.createElement("div");
        popup.style.position = "fixed";
        popup.style.top = "20px";
        popup.style.right = "20px";
        popup.style.background = "white";
        popup.style.border = "1px solid #2563eb";
        popup.style.borderRadius = "8px";
        popup.style.padding = "12px 16px";
        popup.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
        popup.style.zIndex = "9999";
        popup.style.maxWidth = "300px";
        popup.innerHTML = `
          <div style="font-weight: 500; margin-bottom: 8px;">Выделенный текст</div>
          <div style="font-size: 12px; color: #666; line-height: 1.4; margin-bottom: 12px;">${selection}</div>
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent("entgo:ai-prompt", { detail: selection }));
              popup.remove();
            }}
            style="width: 100%; background: #2563eb; color: white; border: none; padding: 8px; border-radius: 4px; font-size: 14px; cursor: pointer; margin-top: 8px;"
          >
            Спросить entgo.ai о выделении
          </button>
        `;
        document.body.appendChild(popup);

        setTimeout(() => popup.remove(), 5000);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("selectionchange", () => handleSelection());

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("selectionchange", () => handleSelection());
    };
  }, [input]);

  return (
    <main className="mobile-app-page min-h-screen bg-paper pb-6">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-muted">{topic.subject.titleRu}</p>
            <h1 className="display mt-2 text-3xl sm:text-4xl font-bold leading-tight">{topic.titleRu}</h1>
          </div>
          <div className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="size-6 hidden sm:block"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.21L7 14.14 2 9.27l6.91-1.02L12 2z" />
              <path d="M0 0h24v24H0V0zm0 0h24v24H0V0zm0 0h24v24H0V0z" fill="none" opacity="0.001" />
            </svg>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="size-6 sm:hidden"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM12 20c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
            </svg>
          </div>
        </header>

        <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto pb-6">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${msg.role === "user" ? "ml-auto bg-[#2563eb] text-white" : "bg-paper text-ink"}`}
            >
              <div className="break-all">{msg.content}</div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-muted">
              <LoaderCircle className="animate-spin" size={12} /> Разбираю контекст...
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const text = input.trim();
            if (text) {
              setMessages((msgs) => [...msgs, { role: "user", content: text }]);
              setInput("");
              setLoading(true);
              fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  message: text,
                  contextUrl: window.location.href,
                  pageTitle: document.title,
                }),
              })
                .then((res) => res.json())
                .then((data) => {
                  if (data.error) throw new Error(data.error);
                  setMessages((msgs) => [...msgs, { role: "assistant", content: data.answer ?? "" }]);
                })
                .catch((err) =>
                  setMessages((msgs) => [...msgs, { role: "assistant", content: "entgo.ai временно недоступен. Попробуй позже." }])
                )
                .finally(() => setLoading(false));
            }
          }}
          className="mt-6 flex gap-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Спроси у entgo.ai о чем угодно... "
            className="flex-1 rounded-full border border-line px-4 py-3 text-sm outline-none focus:border-ink resize-none"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-5 py-3 text-sm font-medium bg-[#2563eb] text-white rounded disabled:opacity-35"
          >
            {loading ? "Разбираю..." : "Отправить" }
          </button>
        </form>
      </div>
    </main>
  );
}

