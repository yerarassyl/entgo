import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { canEditContent, isSuperAdmin } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { isSameOriginRequest } from "@/lib/request-security";

const schema = z.object({
  subjectId: z.string().min(1).max(100),
  topicId: z.string().min(1).max(100),
  body: z.string().trim().min(5).max(5_000),
  explanation: z.string().trim().min(5).max(5_000),
  options: z.array(z.string().trim().min(1).max(1_000)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  difficulty: z.number().int().min(1).max(5),
  status: z.enum(["DRAFT", "REVIEW", "PUBLISHED"]),
});

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "Недопустимый источник запроса." }, { status: 403 });
  }
  const user = await getSessionUser();
  if (!user || !canEditContent(user.role)) {
    return Response.json({ error: "Недостаточно прав." }, { status: 403 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Проверьте поля вопроса." }, { status: 400 });
  }
  const topic = await prisma.topic.findFirst({
    where: { id: parsed.data.topicId, subjectId: parsed.data.subjectId },
    select: { id: true },
  });
  if (!topic) return Response.json({ error: "Тема не найдена." }, { status: 404 });

  const question = await prisma.question.create({
    data: {
      subjectId: parsed.data.subjectId,
      topicId: parsed.data.topicId,
      locale: "RU",
      body: parsed.data.body,
      explanation: parsed.data.explanation,
      difficulty: parsed.data.difficulty,
      status: isSuperAdmin(user.role) ? parsed.data.status : "REVIEW",
      source: "entgo-admin",
      options: {
        create: parsed.data.options.map((content, position) => ({
          content,
          position,
          isCorrect: position === parsed.data.correctIndex,
        })),
      },
    },
    select: { id: true },
  });
  if (!isSuperAdmin(user.role)) {
    await prisma.contentSubmission.create({
      data: {
        adminId: user.id,
        contentType: "QUESTION",
        payload: { questionId: question.id, body: parsed.data.body },
      },
    });
  }
  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "QUESTION_CREATED",
      entityType: "Question",
      entityId: question.id,
    },
  });
  return Response.json(question, { status: 201 });
}
