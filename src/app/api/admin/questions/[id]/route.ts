import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { canEditContent, isSuperAdmin } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { isSameOriginRequest } from "@/lib/request-security";

const schema = z.object({
  status: z.enum(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"]),
  difficulty: z.number().int().min(1).max(5),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "Недопустимый источник запроса." }, { status: 403 });
  }
  const user = await getSessionUser();
  if (!user || !canEditContent(user.role)) {
    return Response.json({ error: "Недостаточно прав." }, { status: 403 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Некорректные данные." }, { status: 400 });
  const { id } = await context.params;
  if (!isSuperAdmin(user.role) && parsed.data.status !== "REVIEW" && parsed.data.status !== "DRAFT") {
    return Response.json({ error: "Публикация доступна только суперадмину." }, { status: 403 });
  }
  const question = await prisma.question.update({
    where: { id },
    data: parsed.data,
    select: { id: true, status: true, difficulty: true },
  }).catch(() => null);
  if (!question) return Response.json({ error: "Вопрос не найден." }, { status: 404 });
  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "QUESTION_UPDATED",
      entityType: "Question",
      entityId: id,
      metadata: parsed.data,
    },
  });
  return Response.json(question);
}
