import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSameOriginRequest } from "@/lib/request-security";
import { getActiveSubscription } from "@/lib/subscription";

export async function POST(
  request: Request,
  context: { params: Promise<{ topicId: string }> },
) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "Недопустимый источник запроса." }, { status: 403 });
  }
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Требуется вход." }, { status: 401 });
  if (!(await getActiveSubscription(user.id))) {
    return Response.json({ error: "Уроки доступны после оплаты подписки." }, { status: 403 });
  }
  const { topicId } = await context.params;
  const topic = await prisma.topic.findUnique({ where: { id: topicId }, select: { id: true, weight: true } });
  if (!topic) return Response.json({ error: "Тема не найдена." }, { status: 404 });
  const existing = await prisma.lessonProgress.findUnique({
    where: { userId_topicId: { userId: user.id, topicId } },
  });
  if (existing?.completedAt) return Response.json({ ok: true, xp: 0 });

  const day = new Date();
  day.setHours(0, 0, 0, 0);
  await prisma.$transaction([
    prisma.lessonProgress.upsert({
      where: { userId_topicId: { userId: user.id, topicId } },
      update: { completedAt: new Date(), xpAwarded: 0 },
      create: { userId: user.id, topicId, completedAt: new Date(), xpAwarded: 0 },
    }),
    prisma.masteryEvidence.create({
      data: { userId: user.id, topicId, type: "LESSON", day },
    }),
    prisma.topicMastery.upsert({
      where: { userId_topicId: { userId: user.id, topicId } },
      update: {
        masteryScore: { increment: 1 },
        confidenceScore: { increment: 2 },
        lastPracticedAt: new Date(),
      },
      create: {
        userId: user.id,
        topicId,
        masteryScore: 51,
        confidenceScore: 2,
        priorityScore: Math.min(100, 55 + topic.weight * 10),
        lastPracticedAt: new Date(),
      },
    }),
  ]);
  return Response.json({ ok: true, xp: 0 });
}
