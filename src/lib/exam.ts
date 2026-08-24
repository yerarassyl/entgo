import "server-only";
import { diagnosticBankQuestions } from "@/data/diagnostic-bank";
import { prisma } from "@/lib/prisma";

function slugPart(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, "-")
    .replace(/^-|-$/g, "");
}

const diagnosticSubjectOrder = [
  "История Казахстана",
  "Грамотность чтения",
  "Математическая грамотность",
  "Математика",
  "Физика",
];

function diagnosticSubjectRank(title: string) {
  const index = diagnosticSubjectOrder.indexOf(title);
  return index === -1 ? diagnosticSubjectOrder.length : index;
}

async function loadDiagnosticTest(testId: string) {
  const test = await prisma.test.findUniqueOrThrow({
    where: { id: testId },
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
  test.questions.sort((a, b) => {
    const rankDifference = diagnosticSubjectRank(a.question.subject.titleRu) - diagnosticSubjectRank(b.question.subject.titleRu);
    return rankDifference || a.position - b.position;
  });
  return test;
}

const globalForExam = globalThis as unknown as {
  diagnosticTestCache?: {
    expiresAt: number;
    value: Awaited<ReturnType<typeof loadDiagnosticTest>>;
  };
  diagnosticSeedPromise?: Promise<Awaited<ReturnType<typeof ensureDiagnosticTestInternal>>>;
};

async function ensureDiagnosticTestInternal() {
  const diagnosticQuestionCount = 120;
  const existingSummary = await prisma.test.findUnique({
    where: { slug: "demo-diagnostic" },
    select: { id: true, _count: { select: { questions: true } } },
  });

  if (existingSummary && existingSummary._count.questions >= diagnosticQuestionCount) {
    if (globalForExam.diagnosticTestCache?.expiresAt && globalForExam.diagnosticTestCache.expiresAt > Date.now()) {
      return globalForExam.diagnosticTestCache.value;
    }
    const readyTest = await loadDiagnosticTest(existingSummary.id);
    globalForExam.diagnosticTestCache = { expiresAt: Date.now() + 5 * 60_000, value: readyTest };
    return readyTest;
  }

  const test = await prisma.test.upsert({
    where: { slug: "demo-diagnostic" },
    update: {
      titleRu: "Диагностический пробный ЕНТ",
      titleKk: "Диагностикалық сынақ ҰБТ",
      durationSec: 14_400,
      isPublished: true,
    },
    create: {
      slug: "demo-diagnostic",
      type: "DIAGNOSTIC",
      titleRu: "Диагностический пробный ЕНТ",
      titleKk: "Диагностикалық сынақ ҰБТ",
      durationSec: 14_400,
      isPublished: true,
    },
  });

  let questions = await prisma.question.findMany({
    where: { status: "PUBLISHED", options: { some: {} } },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: diagnosticQuestionCount,
    select: { id: true, subjectId: true },
  });

  // The production database may still contain the old five-question demo bank.
  // Seed the bundled ENT bank once, then use the normal database path thereafter.
  if (questions.length < diagnosticQuestionCount) {
    const subjectIds = new Map<string, string>();
    for (const item of diagnosticBankQuestions) {
      if (subjectIds.has(item.subject)) continue;
      const subject = await prisma.subject.upsert({
        where: { slug: slugPart(item.subject) },
        update: { titleRu: item.subject, titleKk: item.subjectKk, isRequired: item.required },
        create: { slug: slugPart(item.subject), titleRu: item.subject, titleKk: item.subjectKk, isRequired: item.required },
      });
      subjectIds.set(item.subject, subject.id);
    }

    const topicIds = new Map<string, string>();
    for (const item of diagnosticBankQuestions) {
      const key = `${item.subject}:${item.topic}`;
      if (topicIds.has(key)) continue;
      const topic = await prisma.topic.upsert({
        where: { subjectId_slug: { subjectId: subjectIds.get(item.subject)!, slug: slugPart(item.topic) } },
        update: { titleRu: item.topic, titleKk: item.topic, status: "PUBLISHED" },
        create: { subjectId: subjectIds.get(item.subject)!, slug: slugPart(item.topic), titleRu: item.topic, titleKk: item.topic, status: "PUBLISHED" },
      });
      topicIds.set(key, topic.id);
    }

    for (let offset = 0; offset < diagnosticBankQuestions.length; offset += 20) {
      const batch = diagnosticBankQuestions.slice(offset, offset + 20);
      await Promise.all(batch.map(async (item) => {
        const subjectId = subjectIds.get(item.subject)!;
        const topicId = topicIds.get(`${item.subject}:${item.topic}`)!;
        const question = await prisma.question.upsert({
          where: { slug: item.id },
          update: { subjectId, topicId, status: "PUBLISHED", body: { text: item.question }, explanation: { text: item.explanation }, difficulty: item.difficulty, source: "entgo-imported-bank" },
          create: { id: item.id, slug: item.id, subjectId, topicId, status: "PUBLISHED", locale: "RU", difficulty: item.difficulty, body: { text: item.question }, explanation: { text: item.explanation }, source: "entgo-imported-bank" },
        });
        await Promise.all(item.options.map((content, position) => prisma.questionOption.upsert({
          where: { questionId_position: { questionId: question.id, position } },
          update: { content: { text: content }, isCorrect: position === item.answer },
          create: { questionId: question.id, position, content: { text: content }, isCorrect: position === item.answer },
        })));
      }));
    }

    questions = await prisma.question.findMany({
      where: { status: "PUBLISHED", options: { some: {} } },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: diagnosticQuestionCount,
      select: { id: true, subjectId: true },
    });
  }

  await prisma.$transaction([
    prisma.testQuestion.deleteMany({ where: { testId: test.id } }),
    prisma.testSection.deleteMany({ where: { testId: test.id } }),
    prisma.testQuestion.createMany({
      data: questions.map((question, position) => ({ testId: test.id, questionId: question.id, position })),
    }),
    prisma.testSection.createMany({
      data: [...new Set(questions.map((question) => question.subjectId))].map((subjectId, position) => ({ testId: test.id, subjectId, position })),
    }),
  ]);

  const readyTest = await loadDiagnosticTest(test.id);
  globalForExam.diagnosticTestCache = { expiresAt: Date.now() + 5 * 60_000, value: readyTest };
  return readyTest;
}

export async function ensureDiagnosticTest() {
  if (globalForExam.diagnosticSeedPromise) return globalForExam.diagnosticSeedPromise;
  const promise = ensureDiagnosticTestInternal();
  globalForExam.diagnosticSeedPromise = promise;
  try {
    return await promise;
  } finally {
    if (globalForExam.diagnosticSeedPromise === promise) delete globalForExam.diagnosticSeedPromise;
  }
}

export async function ensureDiagnosticTestReady() {
  const summary = await prisma.test.findUnique({
    where: { slug: "demo-diagnostic" },
    select: { id: true, _count: { select: { questions: true } } },
  });
  if (!summary || summary._count.questions < 120) await ensureDiagnosticTest();
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
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "text" in value && typeof value.text === "string") {
    return value.text;
  }
  return JSON.stringify(value);
}
