import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { canEditContent, isSuperAdmin } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { isSameOriginRequest } from "@/lib/request-security";

const schema = z.object({
  subjectId: z.string().min(1).max(100),
  title: z.string().trim().min(3).max(160),
  grade: z.string().trim().min(1).max(20),
  description: z.string().trim().min(10).max(2_000),
  tags: z.array(z.string().trim().min(1).max(60)).max(20),
  difficulty: z.number().int().min(1).max(5),
  expectedScoreGain: z.number().min(0.1).max(20),
});

function slugPart(value: string) {
  return value.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, "-").replace(/^-|-$/g, "");
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return Response.json({ error: "Недопустимый источник запроса." }, { status: 403 });
  const user = await getSessionUser();
  if (!user || !canEditContent(user.role)) return Response.json({ error: "Недостаточно прав." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Проверьте данные темы." }, { status: 400 });
  const topic = await prisma.topic.create({
    data: {
      subjectId: parsed.data.subjectId,
      slug: `${slugPart(parsed.data.title)}-${Date.now().toString(36)}`,
      titleRu: parsed.data.title,
      titleKk: parsed.data.title,
      difficulty: parsed.data.difficulty,
      expectedScoreGain: parsed.data.expectedScoreGain,
      grade: parsed.data.grade,
      description: parsed.data.description,
      tags: parsed.data.tags,
      weight: Math.max(0.5, parsed.data.expectedScoreGain / 2),
      status: isSuperAdmin(user.role) ? "PUBLISHED" : "REVIEW",
    },
  });
  if (!isSuperAdmin(user.role)) {
    await prisma.contentSubmission.create({
      data: {
        adminId: user.id,
        contentType: "TOPIC",
        payload: {
          topicId: topic.id,
          title: parsed.data.title,
          grade: parsed.data.grade,
          description: parsed.data.description,
          tags: parsed.data.tags,
          difficulty: parsed.data.difficulty,
          expectedScoreGain: parsed.data.expectedScoreGain,
        },
      },
    });
  }
  return Response.json({ id: topic.id, status: topic.status }, { status: 201 });
}
