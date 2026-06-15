import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2 } from "lucide-react";
import { ProductHeader } from "@/components/product-header";
import { requirePaidUser } from "@/lib/paid-access";
import { ensureDiagnosticTest } from "@/lib/exam";
import { prisma } from "@/lib/prisma";

function countWord(value: number, one: string, few: string, many: string) {
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export default async function TopicsPage() {
  const user = await requirePaidUser();
  await ensureDiagnosticTest();

  const [subjects, answers] = await Promise.all([
    prisma.subject.findMany({
      include: {
        topics: {
          orderBy: { titleRu: "asc" },
          include: { _count: { select: { questions: true } } },
        },
      },
      orderBy: [{ isRequired: "desc" }, { titleRu: "asc" }],
    }),
    prisma.attemptAnswer.findMany({
      where: { attempt: { userId: user.id } },
      select: { isCorrect: true, question: { select: { topicId: true } } },
    }),
  ]);

  const progress = new Map<string, { correct: number; total: number }>();
  for (const answer of answers) {
    const row = progress.get(answer.question.topicId) ?? { correct: 0, total: 0 };
    row.total += 1;
    if (answer.isCorrect) row.correct += 1;
    progress.set(answer.question.topicId, row);
  }

  return (
    <main className="mobile-app-page product-v2 min-h-screen bg-paper pb-24">
      <ProductHeader />
      <div className="container-shell py-10 sm:py-16">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-muted">Библиотека знаний</p>
        <h1 className="display mt-4 max-w-4xl text-5xl leading-none sm:text-7xl">Каждая тема — <span className="italic">понятным языком.</span></h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted">Готовность рассчитывается по твоим реальным ответам. Начинай с тем с самым низким процентом.</p>

        <div className="mt-12 space-y-6">
          {subjects.map((subject) => (
            <section key={subject.id} className="rounded-[32px] border border-line bg-white p-6 sm:p-9">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><p className="text-xs font-bold uppercase tracking-[.14em] text-muted">{subject.isRequired ? "Обязательный предмет" : "Профильный предмет"}</p><h2 className="mt-2 text-2xl font-semibold">{subject.titleRu}</h2></div>
                <span className="rounded-full bg-paper px-3 py-2 text-xs font-bold">{subject.topics.length} {countWord(subject.topics.length, "тема", "темы", "тем")}</span>
              </div>
              <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-3">
                {subject.topics.map((topic) => {
                  const row = progress.get(topic.id);
                  const percent = row?.total ? Math.round((row.correct / row.total) * 100) : 0;
                  return (
                    <Link key={topic.id} href={`/topics/${topic.id}`} className="group rounded-2xl border border-line p-5 hover:border-ink">
                      <div className="flex items-start justify-between gap-4">
                        <div><BookOpen size={18} /><h3 className="mt-4 font-semibold">{topic.titleRu}</h3><p className="mt-1 text-xs text-muted">{topic._count.questions} {countWord(topic._count.questions, "вопрос", "вопроса", "вопросов")} в базе</p></div>
                        <ArrowRight size={17} className="text-black/25 transition-transform group-hover:translate-x-1" />
                      </div>
                      <div className="mt-5 flex items-center justify-between text-xs"><span className="text-muted">{row?.total ? `${row.total} ответов` : "Ещё не изучено"}</span><strong>{percent}%</strong></div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper"><div className="h-full rounded-full bg-ink" style={{ width: `${percent}%` }} /></div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
        {!subjects.length && <div className="mt-12 rounded-[26px] border border-line bg-white p-10 text-center"><CheckCircle2 className="mx-auto" /><p className="mt-4 font-semibold">Библиотека готовится</p></div>}
      </div>
    </main>
  );
}
