"use client";

import { Check, LoaderCircle } from "lucide-react";
import { useState } from "react";

type QuestionRow = {
  id: string;
  body: string;
  subject: string;
  topic: string;
  status: "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED";
  difficulty: number;
};

export function AdminQuestionList({ initialQuestions }: { initialQuestions: QuestionRow[] }) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  async function update(
    question: QuestionRow,
    patch: Partial<Pick<QuestionRow, "status" | "difficulty">>,
  ) {
    const next = { ...question, ...patch };
    setPendingId(question.id);
    const response = await fetch(`/api/admin/questions/${question.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next.status, difficulty: next.difficulty }),
    });
    if (response.ok) {
      setQuestions((rows) => rows.map((row) => row.id === question.id ? next : row));
      setSavedId(question.id);
      window.setTimeout(() => setSavedId(null), 1_200);
    }
    setPendingId(null);
  }

  return (
    <div className="mt-5 divide-y divide-line overflow-hidden rounded-[24px] border border-line bg-white">
      {questions.map((question) => (
        <div key={question.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_170px_120px] lg:items-center">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[.12em] text-muted">{question.subject} · {question.topic}</p>
            <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6">{question.body}</p>
          </div>
          <select value={question.status} onChange={(event) => update(question, { status: event.target.value as QuestionRow["status"] })} disabled={pendingId === question.id} className="h-11 rounded-xl border border-line bg-white px-3 text-sm">
            <option value="DRAFT">Черновик</option><option value="REVIEW">На проверке</option><option value="PUBLISHED">Опубликован</option><option value="ARCHIVED">Архив</option>
          </select>
          <div className="flex items-center gap-3">
            <label className="text-xs text-muted">Сложность</label>
            <select value={question.difficulty} onChange={(event) => update(question, { difficulty: Number(event.target.value) })} disabled={pendingId === question.id} className="h-11 flex-1 rounded-xl border border-line bg-white px-3 text-sm">
              {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
            {pendingId === question.id ? <LoaderCircle size={16} className="animate-spin" /> : savedId === question.id ? <Check size={16} className="text-success" /> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
