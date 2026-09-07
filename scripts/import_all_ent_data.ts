import { execSync } from "child_process";
import { readFileSync } from "fs";
import { Prisma, PrismaClient, QuestionKind } from "@prisma/client";

const prisma = new PrismaClient();

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

const difficultyMap: Record<string, number> = {
  базовый: 1,
  средний: 2,
  повышенный: 3,
};

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

function parseVariantsFromDocx(docxPath: string, tagPrefix: string, questionsPerVariant: number) {
  const xml = execSync(`tar -xOf "${docxPath}" word/document.xml`, { maxBuffer: 50 * 1024 * 1024 }).toString("utf8");
  const text = xml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const keysStart = text.search(/КЛЮЧИ И РЕШЕНИЯ|ЖАУАПТАРЫ/i);
  if (keysStart === -1) return {};
  const keysText = text.slice(keysStart);
  const regex = new RegExp(`\\[(${tagPrefix}\\d+-[A-Z0-9]+)\\]`, "gi");
  const allIds: string[] = [];
  let match;
  while ((match = regex.exec(keysText)) !== null) {
    allIds.push(match[1].toUpperCase());
  }
  const variants: Record<number, string[]> = {};
  for (let v = 1; v <= 10; v++) {
    variants[v] = allIds.slice((v - 1) * questionsPerVariant, v * questionsPerVariant);
  }
  return variants;
}

async function importSubjectBank(
  subjectSlug: string,
  subjectTitleRu: string,
  subjectTitleKk: string,
  isRequired: boolean,
  jsonPath: string,
  slugPrefix: string,
  sourceName: string
) {
  console.log(`\n======================================================`);
  console.log(`Starting import for: ${subjectTitleRu} (${subjectSlug})`);
  console.log(`Source: ${jsonPath}`);

  const raw = readFileSync(jsonPath, "utf8");
  const bank = JSON.parse(raw) as BankSource;
  const topics = bank.parts.flatMap((p) => p.topics);
  const questions = bank.parts.flatMap((p) => p.questions);

  console.log(`Found: ${bank.parts.length} parts, ${topics.length} topics, ${questions.length} questions`);

  // 1. Upsert Subject
  const subject = await prisma.subject.upsert({
    where: { slug: subjectSlug },
    update: { titleRu: subjectTitleRu, titleKk: subjectTitleKk, isRequired },
    create: { slug: subjectSlug, titleRu: subjectTitleRu, titleKk: subjectTitleKk, isRequired },
  });
  console.log(`Subject ready: ${subject.id} (${subject.slug})`);

  // 2. Upsert Topics and Lessons
  const topicIdMap = new Map<string, string>();
  for (const topic of topics) {
    const topicSlug = topic.topic_id.toLowerCase();
    const savedTopic = await prisma.topic.upsert({
      where: {
        subjectId_slug: { subjectId: subject.id, slug: topicSlug },
      },
      update: {
        titleRu: topic.title_ru,
        titleKk: topic.title_kz,
        grade: String(topic.grade),
        description: topic.ent_section,
        status: "PUBLISHED",
      },
      create: {
        subjectId: subject.id,
        slug: topicSlug,
        titleRu: topic.title_ru,
        titleKk: topic.title_kz,
        grade: String(topic.grade),
        description: topic.ent_section,
        status: "PUBLISHED",
      },
    });
    topicIdMap.set(topic.topic_id.toUpperCase(), savedTopic.id);

    if (topic.lessons?.length) {
      const first = topic.lessons[0];
      const contentRu = topic.lessons.map((l) => ({
        id: l.lesson_id,
        title: l.title_ru,
        theory: l.theory_ru,
        formulas: l.formulas,
        example: l.example_ru,
      }));
      const contentKk = topic.lessons.map((l) => ({
        id: l.lesson_id,
        title: l.title_kz,
        theory: l.theory_kz,
        formulas: l.formulas,
        example: l.example_kz,
      }));

      await prisma.lesson.upsert({
        where: { topicId: savedTopic.id },
        update: {
          summary: first.title_ru,
          rule: first.theory_ru,
          example: first.example_ru,
          mistake: "Внимательно проверь каждый шаг решения и ограничения задачи.",
          steps: first.formulas,
          contentRu: contentRu as Prisma.InputJsonValue,
          contentKk: contentKk as Prisma.InputJsonValue,
          publishedAt: new Date(),
        },
        create: {
          topicId: savedTopic.id,
          summary: first.title_ru,
          rule: first.theory_ru,
          example: first.example_ru,
          mistake: "Внимательно проверь каждый шаг решения и ограничения задачи.",
          steps: first.formulas,
          contentRu: contentRu as Prisma.InputJsonValue,
          contentKk: contentKk as Prisma.InputJsonValue,
          publishedAt: new Date(),
        },
      });
    }
  }
  console.log(`Saved ${topicIdMap.size} topics with theory lessons.`);

  // 3. Upsert Questions
  const questionMapRu = new Map<string, string>(); // q_id -> questionId in DB
  const questionMapKk = new Map<string, string>(); // q_id -> questionId in DB
  let importedCount = 0;

  for (let i = 0; i < questions.length; i += 25) {
    const batch = questions.slice(i, i + 25);
    await Promise.all(
      batch.map(async (q) => {
        const topicId = topicIdMap.get(q.topic_id.toUpperCase());
        if (!topicId) {
          console.warn(`Topic not found for question: ${q.q_id} (${q.topic_id})`);
          return;
        }

        // RU question
        const slugRu = `${slugPrefix}-${q.q_id.toLowerCase()}-ru`;
        const optionsRu = questionOptions(q, "ru");
        const qRu = await prisma.question.upsert({
          where: { slug: slugRu },
          update: {
            subjectId: subject.id,
            topicId,
            status: "PUBLISHED",
            locale: "RU",
            difficulty: difficultyMap[q.difficulty] || 2,
            kind: kindMap[q.type] || "SINGLE",
            body: questionBody(q, "ru"),
            explanation: q.solution_ru,
            source: sourceName,
            sourceYear: 2026,
          },
          create: {
            slug: slugRu,
            subjectId: subject.id,
            topicId,
            status: "PUBLISHED",
            locale: "RU",
            difficulty: difficultyMap[q.difficulty] || 2,
            kind: kindMap[q.type] || "SINGLE",
            body: questionBody(q, "ru"),
            explanation: q.solution_ru,
            source: sourceName,
            sourceYear: 2026,
          },
        });
        await prisma.questionOption.deleteMany({ where: { questionId: qRu.id } });
        await prisma.questionOption.createMany({
          data: optionsRu.map((opt, pos) => ({
            questionId: qRu.id,
            position: pos,
            content: opt.content,
            isCorrect: opt.isCorrect,
            matchKey: opt.matchKey,
          })),
        });
        questionMapRu.set(q.q_id.toUpperCase(), qRu.id);

        // KK question
        const slugKk = `${slugPrefix}-${q.q_id.toLowerCase()}-kk`;
        const optionsKk = questionOptions(q, "kz");
        const qKk = await prisma.question.upsert({
          where: { slug: slugKk },
          update: {
            subjectId: subject.id,
            topicId,
            status: "PUBLISHED",
            locale: "KK",
            difficulty: difficultyMap[q.difficulty] || 2,
            kind: kindMap[q.type] || "SINGLE",
            body: questionBody(q, "kz"),
            explanation: q.solution_kz,
            source: sourceName,
            sourceYear: 2026,
          },
          create: {
            slug: slugKk,
            subjectId: subject.id,
            topicId,
            status: "PUBLISHED",
            locale: "KK",
            difficulty: difficultyMap[q.difficulty] || 2,
            kind: kindMap[q.type] || "SINGLE",
            body: questionBody(q, "kz"),
            explanation: q.solution_kz,
            source: sourceName,
            sourceYear: 2026,
          },
        });
        await prisma.questionOption.deleteMany({ where: { questionId: qKk.id } });
        await prisma.questionOption.createMany({
          data: optionsKk.map((opt, pos) => ({
            questionId: qKk.id,
            position: pos,
            content: opt.content,
            isCorrect: opt.isCorrect,
            matchKey: opt.matchKey,
          })),
        });
        questionMapKk.set(q.q_id.toUpperCase(), qKk.id);

        importedCount += 2;
      })
    );
    if ((i + 25) % 100 === 0 || i + 25 >= questions.length) {
      console.log(`  Imported ${Math.min(i + 25, questions.length)} / ${questions.length} questions (RU + KK)`);
    }
  }

  console.log(`Completed questions: ${importedCount} localized question entries created/updated.`);
  return { subject, questionMapRu, questionMapKk };
}

async function createMockTests(
  subjectRu: any,
  subjectSlug: string,
  testTitlePrefixRu: string,
  testTitlePrefixKk: string,
  durationSec: number,
  docxPath: string,
  tagPrefix: string,
  questionsPerVariant: number,
  questionMapRu: Map<string, string>,
  questionMapKk: Map<string, string>
) {
  console.log(`\nParsing and creating mock tests for: ${testTitlePrefixRu}`);
  const variants = parseVariantsFromDocx(docxPath, tagPrefix, questionsPerVariant);

  for (let v = 1; v <= 10; v++) {
    const qIds = variants[v] || [];
    if (!qIds.length) continue;

    // 1. RU Test
    const slugRu = `test-${subjectSlug}-v${v}-ru`;
    const testRu = await prisma.test.upsert({
      where: { slug: slugRu },
      update: {
        type: "FULL",
        titleRu: `${testTitlePrefixRu} · Вариант ${v}`,
        titleKk: `${testTitlePrefixKk} · ${v}-нұсқа`,
        durationSec,
        isPublished: true,
      },
      create: {
        slug: slugRu,
        type: "FULL",
        titleRu: `${testTitlePrefixRu} · Вариант ${v}`,
        titleKk: `${testTitlePrefixKk} · ${v}-нұсқа`,
        durationSec,
        isPublished: true,
      },
    });

    await prisma.testSection.upsert({
      where: { testId_position: { testId: testRu.id, position: 0 } },
      update: { subjectId: subjectRu.id },
      create: { testId: testRu.id, subjectId: subjectRu.id, position: 0 },
    });

    await prisma.testQuestion.deleteMany({ where: { testId: testRu.id } });
    const testQuestionsRuData = qIds
      .map((qId, pos) => {
        const questionId = questionMapRu.get(qId);
        if (!questionId) return null;
        return { testId: testRu.id, questionId, position: pos };
      })
      .filter(Boolean) as Array<{ testId: string; questionId: string; position: number }>;

    if (testQuestionsRuData.length) {
      await prisma.testQuestion.createMany({ data: testQuestionsRuData });
    }

    // 2. KK Test
    const slugKk = `test-${subjectSlug}-v${v}-kk`;
    const testKk = await prisma.test.upsert({
      where: { slug: slugKk },
      update: {
        type: "FULL",
        titleRu: `${testTitlePrefixRu} · Вариант ${v} (ҚАЗ)`,
        titleKk: `${testTitlePrefixKk} · ${v}-нұсқа`,
        durationSec,
        isPublished: true,
      },
      create: {
        slug: slugKk,
        type: "FULL",
        titleRu: `${testTitlePrefixRu} · Вариант ${v} (ҚАЗ)`,
        titleKk: `${testTitlePrefixKk} · ${v}-нұсқа`,
        durationSec,
        isPublished: true,
      },
    });

    await prisma.testSection.upsert({
      where: { testId_position: { testId: testKk.id, position: 0 } },
      update: { subjectId: subjectRu.id },
      create: { testId: testKk.id, subjectId: subjectRu.id, position: 0 },
    });

    await prisma.testQuestion.deleteMany({ where: { testId: testKk.id } });
    const testQuestionsKkData = qIds
      .map((qId, pos) => {
        const questionId = questionMapKk.get(qId);
        if (!questionId) return null;
        return { testId: testKk.id, questionId, position: pos };
      })
      .filter(Boolean) as Array<{ testId: string; questionId: string; position: number }>;

    if (testQuestionsKkData.length) {
      await prisma.testQuestion.createMany({ data: testQuestionsKkData });
    }

    console.log(`  Variant ${v}: ${testQuestionsRuData.length} RU / ${testQuestionsKkData.length} KK questions linked.`);
  }
}

async function main() {
  console.log("================================================================================");
  console.log("ENTGO Full Question Bank Database Importer - Tests Generation");
  console.log("================================================================================");

  // 1. Get Subjects
  const mgSubject = await prisma.subject.findUniqueOrThrow({
    where: { slug: "математическая-грамотность" },
  });
  const mathSubject = await prisma.subject.findUniqueOrThrow({
    where: { slug: "математика" },
  });

  // 2. Build question maps from DB slugs
  console.log("Loading question IDs from database...");
  const questions = await prisma.question.findMany({
    where: {
      subjectId: { in: [mgSubject.id, mathSubject.id] },
    },
    select: { id: true, slug: true, locale: true },
  });
  console.log(`Loaded ${questions.length} questions from database.`);

  const mgRuMap = new Map<string, string>();
  const mgKkMap = new Map<string, string>();
  const mathRuMap = new Map<string, string>();
  const mathKkMap = new Map<string, string>();

  for (const q of questions) {
    if (!q.slug) continue;
    // Format: ent-mg-m01-q001-ru or ent-math-p01-q001-ru
    if (q.slug.startsWith("ent-mg-")) {
      const parts = q.slug.split("-");
      const qId = `${parts[2]}-${parts[3]}`.toUpperCase();
      if (q.locale === "RU") mgRuMap.set(qId, q.id);
      else mgKkMap.set(qId, q.id);
    } else if (q.slug.startsWith("ent-math-")) {
      const parts = q.slug.split("-");
      const qId = `${parts[2]}-${parts[3]}`.toUpperCase();
      if (q.locale === "RU") mathRuMap.set(qId, q.id);
      else mathKkMap.set(qId, q.id);
    }
  }

  console.log(`Mapped Math Literacy: ${mgRuMap.size} RU, ${mgKkMap.size} KK`);
  console.log(`Mapped Profile Math: ${mathRuMap.size} RU, ${mathKkMap.size} KK`);

  // 3. Create 10 Mock Variants for Mathematical Literacy (type: FULL)
  await createMockTests(
    mgSubject,
    "mg",
    "Матграмотность (ЕНТ)",
    "Математикалық сауаттылық (ҰБТ)",
    1800, // 30 mins
    "C:/Users/erasy/Downloads/Telegram Desktop/ENT_Gramotnost_Probniki_10_RU.docx",
    "M",
    10,
    mgRuMap,
    mgKkMap
  );

  // 4. Create 10 Mock Variants for Profile Mathematics (type: FULL)
  await createMockTests(
    mathSubject,
    "math",
    "Профильная математика (ЕНТ)",
    "Бейіндік математика (ҰБТ)",
    5400, // 90 mins
    "C:/Users/erasy/Downloads/Telegram Desktop/ENT_Probniki_10_variantov_RU.docx",
    "P",
    40,
    mathRuMap,
    mathKkMap
  );

  // Summary counts
  const totalSubjects = await prisma.subject.count();
  const totalTopics = await prisma.topic.count();
  const totalLessons = await prisma.lesson.count();
  const totalQuestions = await prisma.question.count();
  const totalTests = await prisma.test.count();

  console.log("\n================================================================================");
  console.log("IMPORT AND TEST VARIANTS COMPLETED SUCCESSFULLY!");
  console.log(`Total Subjects in DB:  ${totalSubjects}`);
  console.log(`Total Topics in DB:    ${totalTopics}`);
  console.log(`Total Lessons in DB:   ${totalLessons}`);
  console.log(`Total Questions in DB: ${totalQuestions}`);
  console.log(`Total Tests in DB:     ${totalTests}`);
  console.log("================================================================================");
}

main()
  .catch((e) => {
    console.error("Import failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
