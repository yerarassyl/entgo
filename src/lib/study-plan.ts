import "server-only";
import { topicsForSubjects } from "@/data/profile-topic-catalog";
import { getMasteryMap } from "@/lib/mastery";
import { prisma } from "@/lib/prisma";

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function startOfWeek(date: Date) {
  const result = startOfDay(date);
  const day = result.getDay();
  result.setDate(result.getDate() - (day === 0 ? 6 : day - 1));
  return result;
}

export function todayRange(now = new Date()) {
  const start = startOfDay(now);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export function recentDayRange(days: number, now = new Date()) {
  const end = new Date(startOfDay(now));
  end.setDate(end.getDate() + 1);
  const start = new Date(end);
  start.setDate(start.getDate() - days);
  return { start, end };
}

type PlanTopic = {
  id: string;
  title: string;
  subject: string;
  mastery: number;
  priority: number;
  expectedGain: number;
};

function slugPart(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, "-")
    .replace(/^-|-$/g, "");
}

async function ensureSelectedSubjectTopics(subjects: string[]) {
  if (!subjects.length) return;
  for (const subjectName of subjects) {
    const subject = await prisma.subject.upsert({
      where: { slug: slugPart(subjectName) },
      update: { titleRu: subjectName, titleKk: subjectName, isRequired: false },
      create: {
        slug: slugPart(subjectName),
        titleRu: subjectName,
        titleKk: subjectName,
        isRequired: false,
      },
    });
    for (const topic of topicsForSubjects([subjectName])) {
      await prisma.topic.upsert({
        where: { subjectId_slug: { subjectId: subject.id, slug: slugPart(topic.name) } },
        update: {
          titleRu: topic.name,
          titleKk: topic.name,
          expectedScoreGain: topic.growth,
          description: topic.reason,
          weight: Math.max(1, topic.growth / 2),
          status: "PUBLISHED",
        },
        create: {
          subjectId: subject.id,
          slug: slugPart(topic.name),
          titleRu: topic.name,
          titleKk: topic.name,
          expectedScoreGain: topic.growth,
          description: topic.reason,
          weight: Math.max(1, topic.growth / 2),
          status: "PUBLISHED",
        },
      });
    }
  }
}

function taskFor(topic: PlanTopic, activity: "THEORY" | "PRACTICE" | "REVIEW", duration: number) {
  if (activity === "THEORY") {
    return {
      title: `${topic.title}: понять главное правило`,
      activity: "Новая тема:THEORY",
      durationMin: duration,
    };
  }
  if (activity === "REVIEW") {
    return {
      title: `${topic.title}: повторить ошибки`,
      activity: "Разбор ошибок:REVIEW",
      durationMin: duration,
    };
  }
  return {
    title: `${topic.title}: закрепить на задачах`,
    activity: `${topic.expectedGain >= 2 ? "Быстрый рост балла" : topic.mastery >= 60 ? "Повторение" : "Слабое место"}:PRACTICE`,
    durationMin: duration,
  };
}

async function buildTopicQueue(userId: string): Promise<PlanTopic[]> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { profileSubjects: true },
  });
  await ensureSelectedSubjectTopics(user.profileSubjects);
  const subjectFilter = user.profileSubjects.length
    ? {
        OR: [
          { subject: { is: { isRequired: true } } },
          { subject: { is: { titleRu: { in: user.profileSubjects } } } },
        ],
      }
    : undefined;
  const [mastery, topics] = await Promise.all([
    getMasteryMap(userId),
    prisma.topic.findMany({
      where: subjectFilter,
      include: { subject: true },
      orderBy: [{ weight: "desc" }, { titleRu: "asc" }],
    }),
  ]);
  const observed = new Map(mastery.map((row) => [row.topicId, row]));
  return topics
    .map((topic) => {
      const row = observed.get(topic.id);
      return {
        id: topic.id,
        title: topic.titleRu,
        subject: topic.subject.titleRu,
        mastery: row?.effectiveMastery ?? 50,
        priority: row?.priorityScore ?? 45 + topic.weight * 12,
        expectedGain: topic.expectedScoreGain,
      };
    })
    .sort((a, b) => b.priority - a.priority);
}

export async function ensureCurrentStudyPlan(
  userId: string,
  targetScore: number,
  now = new Date(),
) {
  const weekStart = startOfWeek(now);
  const existing = await prisma.studyPlan.findUnique({
    where: { userId_weekStart: { userId, weekStart } },
    include: { tasks: { orderBy: [{ scheduledAt: "asc" }, { position: "asc" }] } },
  });
  if (existing) return existing;

  const [queue, user, openErrors] = await Promise.all([
    buildTopicQueue(userId),
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { dailyMinutes: true } }),
    prisma.errorMemory.groupBy({
      by: ["topicId"],
      where: { userId, status: { not: "MASTERED" } },
      _count: true,
      orderBy: { _count: { topicId: "desc" } },
    }),
  ]);
  const errorTopics = new Set(openErrors.map((row) => row.topicId));
  const dailyMinutes = Math.max(20, Math.min(90, user.dailyMinutes ?? 35));
  const practiceMinutes = Math.max(12, Math.round(dailyMinutes * 0.5));
  const reviewMinutes = Math.max(8, Math.round(dailyMinutes * 0.3));
  const theoryMinutes = Math.max(6, dailyMinutes - practiceMinutes - reviewMinutes);
  const fallback: PlanTopic = {
    id: queue[0]?.id ?? "",
    title: "Диагностическая практика",
    subject: "ЕНТ",
    mastery: 50,
    priority: 50,
    expectedGain: 1,
  };

  return prisma.studyPlan.create({
    data: {
      userId,
      weekStart,
      targetScore,
      generatedBy: "MASTERY_70_20_10_V2",
      tasks: {
        create: Array.from({ length: 7 }).flatMap((_, dayIndex) => {
          const scheduledAt = new Date(weekStart);
          scheduledAt.setDate(scheduledAt.getDate() + dayIndex);
          scheduledAt.setHours(12, 0, 0, 0);
          const weak = queue[(dayIndex * 2) % Math.max(1, queue.length)] ?? fallback;
          const review =
            queue.find((topic, index) => errorTopics.has(topic.id) && index !== dayIndex) ??
            queue[(dayIndex * 2 + 1) % Math.max(1, queue.length)] ??
            weak;
          const newTopic =
            [...queue].reverse().find((topic) => topic.mastery <= 52) ??
            queue[(dayIndex * 3 + 2) % Math.max(1, queue.length)] ??
            weak;
          return [
            { ...taskFor(weak, "PRACTICE", practiceMinutes), topicId: weak.id || null, scheduledAt, position: 0 },
            { ...taskFor(review, "REVIEW", reviewMinutes), topicId: review.id || null, scheduledAt, position: 1 },
            { ...taskFor(newTopic, "THEORY", theoryMinutes), topicId: newTopic.id || null, scheduledAt, position: 2 },
          ];
        }),
      },
    },
    include: { tasks: { orderBy: [{ scheduledAt: "asc" }, { position: "asc" }] } },
  });
}

export async function regenerateCurrentStudyPlan(userId: string, now = new Date()) {
  const weekStart = startOfWeek(now);
  const plan = await prisma.studyPlan.findUnique({
    where: { userId_weekStart: { userId, weekStart } },
    include: { tasks: true },
  });
  if (!plan) return null;
  const queue = await buildTopicQueue(userId);
  const incomplete = plan.tasks
    .filter((task) => !task.completedAt && task.scheduledAt >= startOfDay(now))
    .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime() || a.position - b.position);
  await prisma.$transaction(
    incomplete.map((task, index) => {
      const topic = queue[index % Math.max(1, queue.length)];
      if (!topic) return prisma.studyTask.update({ where: { id: task.id }, data: {} });
      const activity = task.activity.includes("REVIEW")
        ? "REVIEW"
        : task.activity.includes("THEORY")
          ? "THEORY"
          : "PRACTICE";
      return prisma.studyTask.update({
        where: { id: task.id },
        data: {
          topicId: topic.id,
          title: taskFor(topic, activity, task.durationMin).title,
        },
      });
    }),
  );
  return prisma.studyPlan.update({
    where: { id: plan.id },
    data: { generatedBy: "MASTERY_70_20_10_V2_REFRESHED" },
    include: { tasks: { orderBy: [{ scheduledAt: "asc" }, { position: "asc" }] } },
  });
}
