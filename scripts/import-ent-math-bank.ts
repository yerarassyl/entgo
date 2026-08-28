import { readFile } from "node:fs/promises";
import { Prisma, PrismaClient, QuestionKind } from "@prisma/client";

type LessonSource = {
  lesson_id: string;
  title_ru: string;
  title_kz: string;
  theory_ru: string;
  theory_kz: string;
  formulas: string[];
  example_ru: string;
  example_kz: string;
};

type TopicSource = {
  topic_id: string;
  title_ru: string;
  title_kz: string;
  grade: number;
  ent_section: string;
  lessons: LessonSource[];
};

type QuestionSource = {
  q_id: string;
  topic_id: string;
  lesson_id: string;
  grade: number;
  ent_section: string;
  difficulty: "базовый" | "средний" | "повышенный";
  type: "single" | "multi" | "context" | "match";
  context_ru: string | null;
  context_kz: string | null;
  question_ru: string;
  question_kz: string;
  options_ru: string[];
  options_kz: string[];
  left_ru?: string[];
  left_kz?: string[];
  right_ru?: string[];
  right_kz?: string[];
  correct: string[];
  answer_ru: string;
  answer_kz: string;
  solution_ru: string;
  solution_kz: string;
};

type BankSource = {
  subject: string;
  parts: Array<{
    part_id: string;
    section: string;
    section_kz: string;
    topics: TopicSource[];
    questions: QuestionSource[];
  }>;
};

const difficultyMap = { базовый: 1, средний: 2, повышенный: 3 } as const;
const kindMap: Record<QuestionSource["type"], QuestionKind> = {
  single: "SINGLE",
  context: "SINGLE",
  multi: "MULTI",
  match: "MATCHING",
};

function stripLabel(value: string) {
  return value.replace(/^\s*[A-HА-З1-9][).]\s*/u, "").trim();
}

function questionBody(question: QuestionSource, locale: "ru" | "kz") {
  const context = locale === "ru" ? question.context_ru : question.context_kz;
  const prompt = locale === "ru" ? question.question_ru : question.question_kz;
  const right = locale === "ru" ? question.right_ru : question.right_kz;
  return [context, prompt, right?.length ? right.join("\n") : null].filter(Boolean).join("\n\n");
}

function questionOptions(question: QuestionSource, locale: "ru" | "kz") {
  if (question.type === "match") {
    const left = (locale === "ru" ? question.left_ru : question.left_kz) ?? [];
    const matches = new Map(question.correct.map((value) => value.split("-", 2) as [string, string]));
    return left.map((content, position) => {
      const key = String.fromCharCode(65 + position);
      return { content: stripLabel(content), isCorrect: true, matchKey: matches.get(key) ?? null };
    });
  }
  const options = locale === "ru" ? question.options_ru : question.options_kz;
  const correct = new Set(question.correct);
  return options.map((content, position) => ({
    content: stripLabel(content),
    isCorrect: correct.has(String.fromCharCode(65 + position)),
    matchKey: null,
  }));
}

function validate(bank: BankSource) {
  const topics = bank.parts.flatMap((part) => part.topics);
  const lessons = topics.flatMap((topic) => topic.lessons);
  const questions = bank.parts.flatMap((part) => part.questions);
  const topicIds = new Set(topics.map((topic) => topic.topic_id));
  const invalid = questions.filter((question) => !topicIds.has(question.topic_id) || !question.correct.length);
  if (topics.length !== 148 || lessons.length !== 299 || questions.length !== 760 || invalid.length) {
    throw new Error(`Unexpected bank shape: topics=${topics.length}, lessons=${lessons.length}, questions=${questions.length}, invalid=${invalid.length}`);
  }
  return { topics, lessons, questions };
}

async function main() {
  const path = process.argv[2];
  if (!path) throw new Error("Usage: tsx scripts/import-ent-math-bank.ts path/to/ent_math_db.json [--dry-run]");
  const bank = JSON.parse(await readFile(path, "utf8")) as BankSource;
  const { topics, lessons, questions } = validate(bank);
  if (process.argv.includes("--dry-run")) {
    console.log(JSON.stringify({ sections: bank.parts.length, topics: topics.length, lessons: lessons.length, sourceQuestions: questions.length, localizedQuestions: questions.length * 2 }));
    return;
  }

  const prisma = new PrismaClient();
  try {
    const subject = await prisma.subject.upsert({
      where: { slug: "matematika" },
      update: { titleRu: "Математика", titleKk: "Математика", isRequired: false },
      create: { slug: "matematika", titleRu: "Математика", titleKk: "Математика", isRequired: false },
    });
    const topicIds = new Map<string, string>();
    for (const topic of topics) {
      const saved = await prisma.topic.upsert({
        where: { subjectId_slug: { subjectId: subject.id, slug: topic.topic_id.toLowerCase() } },
        update: { titleRu: topic.title_ru, titleKk: topic.title_kz, grade: String(topic.grade), description: topic.ent_section, status: "PUBLISHED" },
        create: { subjectId: subject.id, slug: topic.topic_id.toLowerCase(), titleRu: topic.title_ru, titleKk: topic.title_kz, grade: String(topic.grade), description: topic.ent_section, status: "PUBLISHED" },
      });
      topicIds.set(topic.topic_id, saved.id);
      const contentRu = topic.lessons.map((lesson) => ({ id: lesson.lesson_id, title: lesson.title_ru, theory: lesson.theory_ru, formulas: lesson.formulas, example: lesson.example_ru }));
      const contentKk = topic.lessons.map((lesson) => ({ id: lesson.lesson_id, title: lesson.title_kz, theory: lesson.theory_kz, formulas: lesson.formulas, example: lesson.example_kz }));
      const first = topic.lessons[0];
      await prisma.lesson.upsert({
        where: { topicId: saved.id },
        update: { summary: first.title_ru, rule: first.theory_ru, example: first.example_ru, mistake: "Проверь каждый шаг решения и сопоставь его с условием.", steps: first.formulas, contentRu: contentRu as Prisma.InputJsonValue, contentKk: contentKk as Prisma.InputJsonValue, publishedAt: new Date() },
        create: { topicId: saved.id, summary: first.title_ru, rule: first.theory_ru, example: first.example_ru, mistake: "Проверь каждый шаг решения и сопоставь его с условием.", steps: first.formulas, contentRu: contentRu as Prisma.InputJsonValue, contentKk: contentKk as Prisma.InputJsonValue, publishedAt: new Date() },
      });
    }

    let imported = 0;
    for (const question of questions) {
      const topicId = topicIds.get(question.topic_id);
      if (!topicId) throw new Error(`Topic not found: ${question.topic_id}`);
      for (const locale of ["ru", "kz"] as const) {
        const options = questionOptions(question, locale);
        const slug = `ent-math-${question.q_id.toLowerCase()}-${locale}`;
        const saved = await prisma.question.upsert({
          where: { slug },
          update: { subjectId: subject.id, topicId, status: "REVIEW", locale: locale === "ru" ? "RU" : "KK", difficulty: difficultyMap[question.difficulty], kind: kindMap[question.type], body: questionBody(question, locale), explanation: locale === "ru" ? question.solution_ru : question.solution_kz, source: "ENT Mathematics Bank 2026", sourceYear: 2026 },
          create: { slug, subjectId: subject.id, topicId, status: "REVIEW", locale: locale === "ru" ? "RU" : "KK", difficulty: difficultyMap[question.difficulty], kind: kindMap[question.type], body: questionBody(question, locale), explanation: locale === "ru" ? question.solution_ru : question.solution_kz, source: "ENT Mathematics Bank 2026", sourceYear: 2026 },
        });
        await prisma.questionOption.deleteMany({ where: { questionId: saved.id } });
        await prisma.questionOption.createMany({ data: options.map((option, position) => ({ questionId: saved.id, position, content: option.content, isCorrect: option.isCorrect, matchKey: option.matchKey })) });
        imported += 1;
      }
    }
    console.log(JSON.stringify({ topics: topicIds.size, lessons: lessons.length, importedQuestions: imported, status: "REVIEW" }));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => { console.error(error); process.exit(1); });
