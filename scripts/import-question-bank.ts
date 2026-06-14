import { readFile } from "node:fs/promises";
import { PrismaClient } from "../src/generated/prisma/client";
import { z } from "zod";

const optionSchema = z.object({
  content: z.string().min(1).max(4_000),
  isCorrect: z.boolean(),
});

const itemSchema = z.object({
  slug: z.string().min(2).max(160),
  locale: z.enum(["RU", "KK"]),
  difficulty: z.number().int().min(1).max(5),
  body: z.string().min(5).max(10_000),
  explanation: z.string().min(5).max(10_000),
  source: z.string().max(500).optional(),
  sourceYear: z.number().int().min(1990).max(2100).optional(),
  subject: z.object({
    slug: z.string().min(2).max(100),
    titleRu: z.string().min(2).max(160),
    titleKk: z.string().min(2).max(160),
    isRequired: z.boolean().default(false),
  }),
  topic: z.object({
    slug: z.string().min(2).max(100),
    titleRu: z.string().min(2).max(160),
    titleKk: z.string().min(2).max(160),
  }),
  options: z.array(optionSchema).min(2).max(10).refine(
    (options) => options.filter((option) => option.isCorrect).length === 1,
    "Each question must have exactly one correct option.",
  ),
});

const bankSchema = z.array(itemSchema).min(1);

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: npm run questions:import -- path/to/questions.json");
    process.exit(1);
  }

  const parsed = bankSchema.safeParse(JSON.parse(await readFile(file, "utf8")));
  if (!parsed.success) {
    console.error(z.prettifyError(parsed.error));
    process.exit(1);
  }

  const prisma = new PrismaClient();
  let imported = 0;
  for (const item of parsed.data) {
  const subject = await prisma.subject.upsert({
    where: { slug: item.subject.slug },
    update: item.subject,
    create: item.subject,
  });
  const topic = await prisma.topic.upsert({
    where: {
      subjectId_slug: { subjectId: subject.id, slug: item.topic.slug },
    },
    update: {
      titleRu: item.topic.titleRu,
      titleKk: item.topic.titleKk,
    },
    create: { subjectId: subject.id, ...item.topic },
  });
  const question = await prisma.question.upsert({
    where: { slug: item.slug },
    update: {
      subjectId: subject.id,
      topicId: topic.id,
      locale: item.locale,
      difficulty: item.difficulty,
      body: item.body,
      explanation: item.explanation,
      source: item.source,
      sourceYear: item.sourceYear,
      status: "REVIEW",
    },
    create: {
      slug: item.slug,
      subjectId: subject.id,
      topicId: topic.id,
      locale: item.locale,
      difficulty: item.difficulty,
      body: item.body,
      explanation: item.explanation,
      source: item.source,
      sourceYear: item.sourceYear,
      status: "REVIEW",
    },
  });
  await prisma.questionOption.deleteMany({ where: { questionId: question.id } });
  await prisma.questionOption.createMany({
    data: item.options.map((option, position) => ({
      questionId: question.id,
      position,
      content: option.content,
      isCorrect: option.isCorrect,
    })),
  });
    imported += 1;
  }

  console.log(`Imported ${imported} questions with REVIEW status.`);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
