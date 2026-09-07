"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Search } from "lucide-react";

export interface TopicItem {
  id: string;
  titleRu: string;
  questionsCount: number;
  progressPercent: number;
  totalAnswers: number;
}

export interface SubjectItem {
  id: string;
  titleRu: string;
  isRequired: boolean;
  topics: TopicItem[];
}

interface TopicsClientProps {
  subjects: SubjectItem[];
}

function countWord(value: number, one: string, few: string, many: string) {
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export function TopicsClient({ subjects }: TopicsClientProps) {
  const [search, setSearch] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("all");

  const filteredSubjects = useMemo(() => {
    const q = search.trim().toLowerCase();

    return subjects
      .filter((s) => {
        if (selectedSubjectId !== "all" && s.id !== selectedSubjectId) return false;
        return true;
      })
      .map((s) => {
        if (!q) return s;
        const matchingTopics = s.topics.filter((t) => t.titleRu.toLowerCase().includes(q));
        return {
          ...s,
          topics: matchingTopics,
        };
      })
      .filter((s) => s.topics.length > 0);
  }, [subjects, search, selectedSubjectId]);

  const totalMatchingTopics = filteredSubjects.reduce((acc, s) => acc + s.topics.length, 0);

  return (
    <div className="mt-8 space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
          <input
            type="text"
            placeholder="Поиск по темам..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-line bg-white py-3 pl-11 pr-4 text-sm font-medium outline-none transition focus:border-ink"
          />
        </div>

        {/* Subject Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setSelectedSubjectId("all")}
            className={`rounded-full px-4 py-2 font-semibold transition ${
              selectedSubjectId === "all"
                ? "bg-ink text-white"
                : "border border-line bg-white text-muted hover:border-ink hover:text-ink"
            }`}
          >
            Все предметы
          </button>
          {subjects.map((sub) => (
            <button
              key={sub.id}
              type="button"
              onClick={() => setSelectedSubjectId(sub.id)}
              className={`whitespace-nowrap rounded-full px-4 py-2 font-semibold transition ${
                selectedSubjectId === sub.id
                  ? "bg-ink text-white"
                  : "border border-line bg-white text-muted hover:border-ink hover:text-ink"
              }`}
            >
              {sub.titleRu}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count if filtering */}
      {(search || selectedSubjectId !== "all") && (
        <p className="text-xs font-semibold text-muted">
          Найдено тем: {totalMatchingTopics}
        </p>
      )}

      {/* Subject Sections */}
      <div className="space-y-6">
        {filteredSubjects.map((subject) => (
          <section key={subject.id} className="rounded-[32px] border border-line bg-white p-6 sm:p-9">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.14em] text-muted">
                  {subject.isRequired ? "Обязательный предмет" : "Профильный предмет"}
                </p>
                <h2 className="mt-2 text-2xl font-semibold">{subject.titleRu}</h2>
              </div>
              <span className="rounded-full bg-paper px-3 py-2 text-xs font-bold">
                {subject.topics.length} {countWord(subject.topics.length, "тема", "темы", "тем")}
              </span>
            </div>

            <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-3">
              {subject.topics.map((topic) => (
                <Link
                  key={topic.id}
                  href={`/topics/${topic.id}`}
                  className="group rounded-2xl border border-line p-5 transition hover:border-ink hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <BookOpen size={18} className="text-ink" />
                      <h3 className="mt-4 font-semibold leading-snug">{topic.titleRu}</h3>
                      <p className="mt-1 text-xs text-muted">
                        {topic.questionsCount} {countWord(topic.questionsCount, "вопрос", "вопроса", "вопросов")} в базе
                      </p>
                    </div>
                    <ArrowRight size={17} className="text-black/25 transition-transform group-hover:translate-x-1" />
                  </div>
                  <div className="mt-5 flex items-center justify-between text-xs">
                    <span className="text-muted">
                      {topic.totalAnswers ? `${topic.totalAnswers} ответов` : "Ещё не изучено"}
                    </span>
                    <strong>{topic.progressPercent}%</strong>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper">
                    <div
                      className={`h-full rounded-full ${
                        topic.progressPercent >= 70
                          ? "bg-emerald-500"
                          : topic.progressPercent >= 40
                          ? "bg-amber-500"
                          : "bg-ink"
                      }`}
                      style={{ width: `${topic.progressPercent}%` }}
                    />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}

        {filteredSubjects.length === 0 && (
          <div className="rounded-[26px] border border-line bg-white p-12 text-center">
            <BookOpen className="mx-auto text-muted" size={36} />
            <p className="mt-4 font-semibold text-ink">Ничего не найдено</p>
            <p className="mt-1 text-sm text-muted">Попробуйте изменить поисковый запрос или выбрать другой предмет.</p>
          </div>
        )}
      </div>
    </div>
  );
}