import Link from "next/link";
import { ArrowLeft, BookOpen, CheckCircle2, CircleHelp, Lightbulb, Target, TriangleAlert } from "lucide-react";
import { notFound } from "next/navigation";
import { Brand } from "@/components/brand";
import { requirePaidUser } from "@/lib/paid-access";
import { prisma } from "@/lib/prisma";
import { lessonForTopic } from "@/lib/topic-content";
import { LessonActions } from "@/components/lesson-actions";
import { jsonText } from "@/lib/exam";

export default async function TopicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePaidUser();
  const { id } = await params;
  const topic = await prisma.topic.findUnique({
    where: { id },
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
  if (!topic) notFound();
  const fallbackLesson = lessonForTopic(topic.slug, topic.titleRu);
  const lesson = topic.lesson ? {
    summary: topic.lesson.summary,
    rule: topic.lesson.rule,
    example: topic.lesson.example,
    mistake: topic.lesson.mistake,
    steps: Array.isArray(topic.lesson.steps) ? topic.lesson.steps.filter((item): item is string => typeof item === "string") : fallbackLesson.steps,
  } : fallbackLesson;
  const [progress, mastery] = await Promise.all([
    prisma.lessonProgress.findUnique({
      where: { userId_topicId: { userId: user.id, topicId: topic.id } },
      select: { completedAt: true },
    }),
    prisma.topicMastery.findUnique({
      where: { userId_topicId: { userId: user.id, topicId: topic.id } },
      select: { masteryScore: true, totalAnswers: true, correctAnswers: true, errorScore: true },
    }),
  ]);
  const readiness = Math.round(mastery?.masteryScore ?? 0);

  return (
    <main className="mobile-app-page min-h-screen bg-paper pb-16">
      <header className="border-b border-line bg-white">
        <div className="container-shell flex h-18 items-center justify-between">
          <Brand />
          <Link href="/topics" className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-semibold"><ArrowLeft size={16} /> Все темы</Link>
        </div>
      </header>
      <article className="container-shell grid gap-8 py-10 lg:grid-cols-[1fr_300px] lg:py-16">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.16em] text-muted">{topic.subject.titleRu}</p>
          <h1 className="display mt-4 text-5xl leading-none sm:text-7xl">{topic.titleRu}</h1>
          <section className="mt-7 rounded-[24px] border border-line bg-white p-6">
            <div className="flex items-center justify-between text-sm"><span className="font-semibold">Готовность по теме</span><strong>{readiness}%</strong></div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-paper"><div className="h-full rounded-full bg-ink" style={{ width: `${readiness}%` }} /></div>
            <p className="mt-3 text-xs text-muted">Освоено: {Math.min(10, Math.floor((mastery?.totalAnswers ?? 0) / 2))} из 10 шагов · ожидаемый прирост +{topic.expectedScoreGain.toFixed(1)} балла</p>
          </section>
          <p className="mt-6 max-w-3xl text-xl leading-8">{lesson.summary}</p>

          <section className="mt-10 rounded-[26px] bg-ink p-7 text-white sm:p-9">
            <p className="text-xs font-bold uppercase tracking-[.15em] text-white/45">Главное правило</p>
            <p className="display mt-5 text-3xl leading-tight sm:text-5xl">{lesson.rule}</p>
          </section>
          <section className="mt-5 rounded-[26px] border border-line bg-white p-7 sm:p-9">
            <div className="flex items-center gap-3"><Lightbulb size={20} /><h2 className="text-lg font-semibold">Пример</h2></div>
            <p className="mt-5 text-base leading-7 text-muted">{lesson.example}</p>
          </section>
          <section className="mt-5 rounded-[26px] border border-line bg-white p-7 sm:p-9">
            <div className="flex items-center gap-3"><CircleHelp size={20} /><h2 className="text-lg font-semibold">Задачи для закрепления</h2></div>
            <p className="mt-3 text-sm leading-6 text-muted">Сначала похожие на твои ошибки, затем закрепление и мини-тест.</p>
            <div className="mt-6 space-y-3">
              {topic.questions.length ? topic.questions.map((question, index) => <div key={question.id} className="rounded-2xl bg-paper p-5"><div className="flex items-start gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-ink text-xs font-bold text-white">{index + 1}</span><div><p className="text-sm font-semibold leading-6">{jsonText(question.body)}</p><p className="mt-2 text-xs text-muted">Сложность {question.difficulty} из 5 · ответ и объяснение откроются после проверки</p></div></div></div>) : <p className="rounded-2xl bg-paper p-5 text-sm text-muted">Задачи по теме добавляются редакторами контента.</p>}
            </div>
          </section>
          <section className="mt-5 rounded-[26px] border border-line bg-white p-7 sm:p-9">
            <div className="flex items-center gap-3"><TriangleAlert size={20} /><h2 className="text-lg font-semibold">Типичная ошибка</h2></div>
            <p className="mt-5 text-base leading-7 text-muted">{lesson.mistake}</p>
          </section>
        </div>

        <aside className="h-fit rounded-[26px] border border-line bg-white p-6 lg:sticky lg:top-24">
          <BookOpen size={20} />
          <h2 className="mt-4 text-lg font-semibold">Как закрепить тему</h2>
          <ol className="mt-5 space-y-4">
            {lesson.steps.map((step, index) => <li key={step} className="flex gap-3 text-sm leading-6"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-ink text-xs font-bold text-white">{index + 1}</span>{step}</li>)}
          </ol>
          <LessonActions topicId={topic.id} initiallyCompleted={Boolean(progress?.completedAt)} />
          <div className="mt-6 rounded-2xl bg-paper p-4 text-xs leading-5"><div className="flex items-center gap-2 font-bold"><Target size={15} /> Классификация ошибок</div><p className="mt-2 text-muted">{(mastery?.errorScore ?? 0) > 30 ? "Не знаешь тему: ошибки повторяются. Нужна теория и серия похожих задач." : (mastery?.totalAnswers ?? 0) > 0 ? "Вероятна невнимательность: проверь промежуточные шаги и скорость." : "После первых ответов система определит: незнание темы, невнимательность или угадывание."}</p></div>
          {progress?.completedAt && <p className="mt-4 flex items-center gap-2 text-xs font-semibold text-success"><CheckCircle2 size={15} /> Знание подтверждено проверкой</p>}
        </aside>
      </article>
    </main>
  );
}
