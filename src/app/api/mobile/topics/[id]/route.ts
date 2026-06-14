import { jsonText } from "@/lib/exam";
import { getMobileSessionUser } from "@/lib/mobile-auth";
import { mobileJson, mobileOptions } from "@/lib/mobile-response";
import { prisma } from "@/lib/prisma";

export function OPTIONS() {
  return mobileOptions();
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getMobileSessionUser(request);
  if (!user) return mobileJson({ error: "Требуется вход." }, { status: 401 });
  const { id } = await context.params;
  const topic = await prisma.topic.findFirst({
    where: { id, status: "PUBLISHED" },
    include: {
      subject: true,
      lesson: true,
      questions: {
        where: { status: "PUBLISHED" },
        orderBy: [{ difficulty: "asc" }, { createdAt: "asc" }],
        take: 5,
        include: { options: { orderBy: { position: "asc" } } },
      },
      lessonProgress: { where: { userId: user.id }, take: 1 },
    },
  });
  if (!topic) return mobileJson({ error: "Тема не найдена." }, { status: 404 });
  return mobileJson({
    id: topic.id,
    title: topic.titleRu,
    subject: topic.subject.titleRu,
    description: topic.description,
    completed: Boolean(topic.lessonProgress[0]?.completedAt),
    lesson: topic.lesson ? {
      summary: topic.lesson.summary,
      rule: topic.lesson.rule,
      example: topic.lesson.example,
      mistake: topic.lesson.mistake,
    } : null,
    questions: topic.questions.map((question) => ({
      id: question.id,
      body: jsonText(question.body),
      options: question.options.map((option) => ({ id: option.id, text: jsonText(option.content) })),
    })),
  });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getMobileSessionUser(request);
  if (!user) return mobileJson({ error: "Требуется вход." }, { status: 401 });
  const { id } = await context.params;
  const topic = await prisma.topic.findFirst({ where: { id, status: "PUBLISHED" }, select: { id: true } });
  if (!topic) return mobileJson({ error: "Тема не найдена." }, { status: 404 });
  await prisma.lessonProgress.upsert({
    where: { userId_topicId: { userId: user.id, topicId: id } },
    update: { completedAt: new Date() },
    create: { userId: user.id, topicId: id, completedAt: new Date() },
  });
  return mobileJson({ completed: true });
}
