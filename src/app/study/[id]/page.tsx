import { notFound } from "next/navigation";
import { StudySessionClient } from "@/components/study-session-client";
import { requirePaidUser } from "@/lib/paid-access";
import { jsonText } from "@/lib/exam";
import { prisma } from "@/lib/prisma";

export default async function StudyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePaidUser();

  const { id } = await params;
  const task = await prisma.studyTask.findFirst({
    where: { id, plan: { userId: user.id } },
    select: {
      id: true,
      title: true,
      activity: true,
      durationMin: true,
      completedAt: true,
      scheduledAt: true,
      topic: {
        include: {
          lesson: true,
          questions: {
            where: { status: "PUBLISHED" },
            orderBy: [{ difficulty: "asc" }, { createdAt: "asc" }],
            take: 5,
            include: { options: { orderBy: { position: "asc" } } },
          },
        },
      },
    },
  });
  if (!task) notFound();

  const [label, activity] = task.activity.split(":");
  const siblingTasks = task.topic
    ? await prisma.studyTask.findMany({
        where: {
          plan: { userId: user.id },
          topicId: task.topic.id,
          activity: task.activity,
        },
        orderBy: [{ scheduledAt: "asc" }, { position: "asc" }],
        select: { id: true },
      })
    : [];
  const stage = Math.max(1, siblingTasks.findIndex((item) => item.id === task.id) + 1);
  return (
    <StudySessionClient
      task={{
        id: task.id,
        title: task.title,
        label,
        activity,
        durationMin: task.durationMin,
        completedAt: task.completedAt?.toISOString() ?? null,
        scheduledAt: task.scheduledAt.toISOString(),
        stage,
      }}
      lesson={task.topic?.lesson ? {
        summary: task.topic.lesson.summary,
        rule: task.topic.lesson.rule,
        example: task.topic.lesson.example,
        mistake: task.topic.lesson.mistake,
      } : null}
      questions={(task.topic?.questions ?? []).map((question) => ({
        id: question.id,
        body: jsonText(question.body),
        explanation: jsonText(question.explanation),
        options: question.options.map((option) => ({
          id: option.id,
          text: jsonText(option.content),
          correct: option.isCorrect,
        })),
      }))}
    />
  );
}
