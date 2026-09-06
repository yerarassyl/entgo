import { notFound } from "next/navigation";
import { LessonChat } from "@/components/lesson-chat";
import { requirePaidUser } from "@/lib/paid-access";
import { prisma } from "@/lib/prisma";
import { lessonForTopic } from "@/lib/topic-content";

export default async function TopicPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePaidUser();
  const { id } = await params;
  const topic = await prisma.topic.findUnique({ where: { id }, include: { subject: true, lesson: true } });
  if (!topic) notFound();

  const fallback = lessonForTopic(topic.slug, topic.titleRu);
  const lesson = topic.lesson
    ? {
        summary: topic.lesson.summary,
        rule: topic.lesson.rule,
        example: topic.lesson.example,
        mistake: topic.lesson.mistake,
        steps: Array.isArray(topic.lesson.steps) && topic.lesson.steps.length > 0
          ? topic.lesson.steps.filter((item): item is string => typeof item === "string")
          : fallback.steps,
      }
    : fallback;

  return <LessonChat subject={topic.subject.titleRu} title={topic.titleRu} lesson={lesson} />;
}
