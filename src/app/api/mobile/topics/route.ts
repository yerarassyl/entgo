import { ensureDiagnosticTest } from "@/lib/exam";
import { getMobileSessionUser } from "@/lib/mobile-auth";
import { mobileJson, mobileOptions } from "@/lib/mobile-response";
import { prisma } from "@/lib/prisma";

export function OPTIONS() {
  return mobileOptions();
}

export async function GET(request: Request) {
  const user = await getMobileSessionUser(request);
  if (!user) return mobileJson({ error: "Требуется вход." }, { status: 401 });
  await ensureDiagnosticTest();
  const [subjects, answers] = await Promise.all([
    prisma.subject.findMany({
      include: {
        topics: {
          where: { status: "PUBLISHED" },
          orderBy: { titleRu: "asc" },
          include: { _count: { select: { questions: true } }, lesson: true },
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
  return mobileJson({
    subjects: subjects.map((subject) => ({
      id: subject.id,
      title: subject.titleRu,
      required: subject.isRequired,
      topics: subject.topics.map((topic) => {
        const row = progress.get(topic.id);
        return {
          id: topic.id,
          title: topic.titleRu,
          questions: topic._count.questions,
          hasLesson: Boolean(topic.lesson),
          progress: row?.total ? Math.round(row.correct / row.total * 100) : 0,
        };
      }),
    })),
  });
}
