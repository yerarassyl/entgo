import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { isSameOriginRequest } from "@/lib/request-security";

const schema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "NEEDS_CHANGES"]),
  feedback: z.string().trim().max(2_000).optional(),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isSameOriginRequest(request)) return Response.json({ error: "Недопустимый источник запроса." }, { status: 403 });
  const user = await getSessionUser();
  if (!user || !isSuperAdmin(user.role)) return Response.json({ error: "Только суперадмин может модерировать контент." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Некорректные данные." }, { status: 400 });
  const { id } = await context.params;
  const submission = await prisma.contentSubmission.findUnique({ where: { id } });
  if (!submission) return Response.json({ error: "Предложение не найдено." }, { status: 404 });
  const payload = submission.payload && typeof submission.payload === "object" && !Array.isArray(submission.payload)
    ? submission.payload as Record<string, unknown>
    : {};

  if (parsed.data.status === "APPROVED") {
    if (submission.contentType === "QUESTION" && typeof payload.questionId === "string") {
      await prisma.question.update({ where: { id: payload.questionId }, data: { status: "PUBLISHED" } });
    }
    if (submission.contentType === "TOPIC" && typeof payload.topicId === "string") {
      await prisma.topic.update({ where: { id: payload.topicId }, data: { status: "PUBLISHED" } });
    }
    if (submission.contentType === "LESSON" && typeof payload.topicId === "string") {
      const steps = Array.isArray(payload.steps) ? payload.steps.filter((item): item is string => typeof item === "string") : [];
      const data = {
        summary: String(payload.summary ?? ""),
        rule: String(payload.rule ?? ""),
        example: String(payload.example ?? ""),
        mistake: String(payload.mistake ?? ""),
        steps,
        publishedAt: new Date(),
      };
      await prisma.lesson.upsert({ where: { topicId: payload.topicId }, update: data, create: { topicId: payload.topicId, ...data } });
    }
  }
  if (
    parsed.data.status !== "APPROVED" &&
    submission.contentType === "TOPIC" &&
    typeof payload.topicId === "string"
  ) {
    await prisma.topic.update({
      where: { id: payload.topicId },
      data: { status: parsed.data.status === "REJECTED" ? "ARCHIVED" : "REVIEW" },
    });
  }
  if (
    parsed.data.status !== "APPROVED" &&
    submission.contentType === "QUESTION" &&
    typeof payload.questionId === "string"
  ) {
    await prisma.question.update({
      where: { id: payload.questionId },
      data: { status: parsed.data.status === "REJECTED" ? "ARCHIVED" : "REVIEW" },
    });
  }
  const updated = await prisma.contentSubmission.update({
    where: { id },
    data: { ...parsed.data, moderatorId: user.id },
  });
  return Response.json(updated);
}
