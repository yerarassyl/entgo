import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { canEditContent, isSuperAdmin } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { isSameOriginRequest } from "@/lib/request-security";

const schema = z.object({
  summary: z.string().trim().min(10).max(5_000),
  rule: z.string().trim().min(5).max(5_000),
  example: z.string().trim().min(5).max(5_000),
  mistake: z.string().trim().min(5).max(5_000),
  steps: z.array(z.string().trim().min(1).max(1_000)).min(1).max(20),
  published: z.boolean(),
});

export async function PUT(
  request: Request,
  context: { params: Promise<{ topicId: string }> },
) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "Недопустимый источник запроса." }, { status: 403 });
  }
  const user = await getSessionUser();
  if (!user || !canEditContent(user.role)) {
    return Response.json({ error: "Недостаточно прав." }, { status: 403 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Проверьте содержание урока." }, { status: 400 });
  }
  const { topicId } = await context.params;
  const topic = await prisma.topic.findUnique({ where: { id: topicId }, select: { id: true } });
  if (!topic) return Response.json({ error: "Тема не найдена." }, { status: 404 });
  if (!isSuperAdmin(user.role)) {
    const submission = await prisma.contentSubmission.create({
      data: {
        adminId: user.id,
        contentType: "LESSON",
        payload: { topicId, ...parsed.data },
      },
    });
    return Response.json({ id: submission.id, status: "REVIEW" });
  }

  const data = {
    summary: parsed.data.summary,
    rule: parsed.data.rule,
    example: parsed.data.example,
    mistake: parsed.data.mistake,
    steps: parsed.data.steps,
    publishedAt: parsed.data.published ? new Date() : null,
  };
  const lesson = await prisma.lesson.upsert({
    where: { topicId },
    update: data,
    create: { topicId, ...data },
    select: { id: true, topicId: true, publishedAt: true },
  });
  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "LESSON_UPSERTED",
      entityType: "Lesson",
      entityId: lesson.id,
      metadata: { topicId, published: parsed.data.published },
    },
  });
  return Response.json(lesson);
}
