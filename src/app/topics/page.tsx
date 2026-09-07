import { ProductHeader } from "@/components/product-header";
import { TopicsClient, type SubjectItem } from "@/components/topics-client";
import { requirePaidUser } from "@/lib/paid-access";
import { prisma } from "@/lib/prisma";

export default async function TopicsPage() {
  const user = await requirePaidUser();

  const [rawSubjects, answers] = await Promise.all([
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

  const subjects: SubjectItem[] = rawSubjects.map((subject) => ({
    id: subject.id,
    titleRu: subject.titleRu,
    isRequired: subject.isRequired,
    topics: subject.topics.map((topic) => {
      const row = progress.get(topic.id);
      const percent = row?.total ? Math.round((row.correct / row.total) * 100) : 0;
      return {
        id: topic.id,
        titleRu: topic.titleRu,
        questionsCount: topic._count.questions,
        progressPercent: percent,
        totalAnswers: row?.total ?? 0,
      };
    }),
  }));

  return (
    <main className="mobile-app-page product-v2 min-h-screen bg-paper pb-24">
      <ProductHeader />
      <div className="container-shell py-10 sm:py-16">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-muted">Библиотека знаний</p>
        <h1 className="display mt-4 max-w-4xl text-5xl leading-none sm:text-7xl">
          Каждая тема — <span className="italic">понятным языком.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted">
          Готовность рассчитывается по твоим реальным ответам. Начинай с тем с самым низким процентом.
        </p>

        <TopicsClient subjects={subjects} />
      </div>
    </main>
  );
}
