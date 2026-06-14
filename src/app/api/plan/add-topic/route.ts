import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSameOriginRequest } from "@/lib/request-security";
import { ensureCurrentStudyPlan } from "@/lib/study-plan";
import { getActiveSubscription } from "@/lib/subscription";

const schema = z.object({
  topicId: z.string().min(1).max(100),
});

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "Недопустимый источник запроса." }, { status: 403 });
  }
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Требуется вход." }, { status: 401 });
  if (!(await getActiveSubscription(user.id))) {
    return Response.json({ error: "Персональный план доступен после оплаты подписки.", upgrade: true }, { status: 403 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Тема не найдена." }, { status: 400 });

  const [topic, plan] = await Promise.all([
    prisma.topic.findUnique({
      where: { id: parsed.data.topicId },
      select: { id: true, titleRu: true },
    }),
    ensureCurrentStudyPlan(user.id, user.targetScore ?? 120),
  ]);
  if (!topic) return Response.json({ error: "Тема не найдена." }, { status: 404 });

  const existing = plan.tasks.find(
    (task) =>
      task.topicId === topic.id &&
      task.activity.endsWith(":REVIEW") &&
      !task.completedAt,
  );
  if (existing) return Response.json({ id: existing.id, existing: true });

  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const lastPosition = plan.tasks.reduce(
    (max, task) => Math.max(max, task.position),
    0,
  );
  const task = await prisma.studyTask.create({
    data: {
      planId: plan.id,
      topicId: topic.id,
      title: `${topic.titleRu}: разобрать ошибку и закрепить`,
      activity: "Разбор ошибок:REVIEW",
      durationMin: 15,
      scheduledAt: today,
      position: lastPosition + 1,
    },
  });
  return Response.json({ id: task.id, existing: false }, { status: 201 });
}
