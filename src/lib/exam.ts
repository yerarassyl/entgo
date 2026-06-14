import "server-only";
import { demoQuestions } from "@/data/demo-questions";
import { prisma } from "@/lib/prisma";

function slugPart(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, "-")
    .replace(/^-|-$/g, "");
}

export async function ensureDiagnosticTest() {
  const test = await prisma.test.upsert({
    where: { slug: "demo-diagnostic" },
    update: { durationSec: 14_400, isPublished: true },
    create: {
      slug: "demo-diagnostic",
      type: "DIAGNOSTIC",
      titleRu: "Диагностический пробный ЕНТ",
      titleKk: "Диагностикалық сынақ ҰБТ",
      durationSec: 14_400,
      isPublished: true,
    },
  });

  const subjectIds = new Map<string, string>();

  for (const [position, item] of demoQuestions.entries()) {
    const subject = await prisma.subject.upsert({
      where: { slug: slugPart(item.subject) },
      update: { titleRu: item.subject },
      create: {
        slug: slugPart(item.subject),
        titleRu: item.subject,
        titleKk: item.subject,
        isRequired: position < 3,
      },
    });
    subjectIds.set(item.subject, subject.id);

    const topic = await prisma.topic.upsert({
      where: {
        subjectId_slug: {
          subjectId: subject.id,
          slug: slugPart(item.topic),
        },
      },
      update: { titleRu: item.topic },
      create: {
        subjectId: subject.id,
        slug: slugPart(item.topic),
        titleRu: item.topic,
        titleKk: item.topic,
      },
    });

    const question = await prisma.question.upsert({
      where: { slug: `diagnostic-${position + 1}` },
      update: {
        subjectId: subject.id,
        topicId: topic.id,
        status: "PUBLISHED",
        body: item.question,
        explanation: item.explanation,
      },
      create: {
        slug: `diagnostic-${position + 1}`,
        subjectId: subject.id,
        topicId: topic.id,
        status: "PUBLISHED",
        locale: "RU",
        difficulty: 2 + (position % 3),
        body: item.question,
        explanation: item.explanation,
        source: "entgo-original-diagnostic",
      },
    });

    for (const [optionPosition, content] of item.options.entries()) {
      await prisma.questionOption.upsert({
        where: {
          questionId_position: {
            questionId: question.id,
            position: optionPosition,
          },
        },
        update: {
          content,
          isCorrect: optionPosition === item.answer,
        },
        create: {
          questionId: question.id,
          position: optionPosition,
          content,
          isCorrect: optionPosition === item.answer,
        },
      });
    }

    await prisma.testQuestion.upsert({
      where: {
        testId_questionId: {
          testId: test.id,
          questionId: question.id,
        },
      },
      update: { position },
      create: {
        testId: test.id,
        questionId: question.id,
        position,
      },
    });
  }

  for (const [position, subjectId] of [...subjectIds.values()].entries()) {
    await prisma.testSection.upsert({
      where: { testId_position: { testId: test.id, position } },
      update: { subjectId },
      create: { testId: test.id, subjectId, position },
    });
  }

  return prisma.test.findUniqueOrThrow({
    where: { id: test.id },
    include: {
      questions: {
        orderBy: { position: "asc" },
        include: {
          question: {
            include: {
              subject: true,
              topic: true,
              options: { orderBy: { position: "asc" } },
            },
          },
        },
      },
    },
  });
}

export async function ensureTopicTest(topicId: string) {
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: {
      subject: true,
      questions: {
        where: { status: "PUBLISHED" },
        orderBy: [{ difficulty: "asc" }, { createdAt: "asc" }],
        take: 10,
      },
    },
  });
  if (!topic || !topic.questions.length) return null;

  const test = await prisma.test.upsert({
    where: { slug: `topic-${topic.id}` },
    update: {
      titleRu: `Мини-тест: ${topic.titleRu}`,
      durationSec: Math.max(600, topic.questions.length * 120),
      isPublished: true,
    },
    create: {
      slug: `topic-${topic.id}`,
      type: "TOPIC",
      titleRu: `Мини-тест: ${topic.titleRu}`,
      titleKk: `Мини-тест: ${topic.titleKk}`,
      durationSec: Math.max(600, topic.questions.length * 120),
      isPublished: true,
    },
  });

  await prisma.testQuestion.deleteMany({ where: { testId: test.id } });
  await prisma.testQuestion.createMany({
    data: topic.questions.map((question, position) => ({
      testId: test.id,
      questionId: question.id,
      position,
    })),
  });
  await prisma.testSection.upsert({
    where: { testId_position: { testId: test.id, position: 0 } },
    update: { subjectId: topic.subjectId },
    create: { testId: test.id, subjectId: topic.subjectId, position: 0 },
  });

  return prisma.test.findUniqueOrThrow({
    where: { id: test.id },
    include: {
      questions: {
        orderBy: { position: "asc" },
        include: {
          question: {
            include: {
              subject: true,
              topic: true,
              options: { orderBy: { position: "asc" } },
            },
          },
        },
      },
    },
  });
}

export function jsonText(value: unknown) {
  return typeof value === "string" ? value : JSON.stringify(value);
}
