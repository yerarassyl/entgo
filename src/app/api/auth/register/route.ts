import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { createSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { isSameOriginRequest } from "@/lib/request-security";
import { createEmailVerification } from "@/lib/email-verification";
import { ensureUniversities } from "@/lib/universities";

const registrationSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email().max(254),
  password: z
    .string()
    .min(10)
    .max(128)
    .regex(/[A-Za-zА-Яа-яЁё]/)
    .regex(/\d/),
  consent: z.literal(true),
  desiredUniversitySlug: z.string().min(2).max(80),
  examDate: z.string().date().nullable().optional(),
  city: z.string().trim().max(80).nullable().optional(),
  school: z.string().trim().max(120).nullable().optional(),
  onboarding: z.object({
    score: z.number().int().min(60).max(140),
    date: z.array(z.string()).max(1),
    subjects: z.array(z.string().trim().min(2).max(80)).max(2),
    time: z.array(z.string()).max(1),
    method: z.array(z.string()).max(1),
  }),
});

function dailyMinutes(value: string | undefined) {
  if (value === "30–45 минут") return 45;
  if (value === "1–1.5 часа") return 90;
  if (value === "2+ часа") return 120;
  return null;
}

function targetExamDate(value: string | undefined) {
  const days =
    value === "Меньше месяца"
      ? 21
      : value === "1–2 месяца"
        ? 45
        : value === "2–4 месяца"
          ? 90
          : value === "Больше 4 месяцев"
            ? 150
            : null;
  if (!days) return null;

  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(9, 0, 0, 0);
  return date;
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "Недопустимый источник запроса." }, { status: 403 });
  }

  const rateLimit = await checkRateLimit(request, "register", 5, 15 * 60);
  if (!rateLimit.allowed) {
    return Response.json(
      { error: "Слишком много попыток. Попробуйте позже." },
      { status: 429 },
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 20_000) {
    return Response.json({ error: "Слишком большой запрос." }, { status: 413 });
  }

  const body = await request.json().catch(() => null);
  const parsed = registrationSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Проверьте заполненные поля." }, { status: 400 });
  }

  try {
    const { name, email, password, onboarding, desiredUniversitySlug, examDate, city, school } = parsed.data;
    await ensureUniversities();
    const university = await prisma.university.findUnique({
      where: { slug: desiredUniversitySlug },
      select: { id: true },
    });
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: await hash(password, 12),
        targetScore: onboarding.score,
        dailyMinutes: dailyMinutes(onboarding.time[0]),
        examDate: examDate ? new Date(`${examDate}T09:00:00`) : targetExamDate(onboarding.date[0]),
        desiredUniversityId: university?.id,
        city: city || null,
        school: school || null,
      },
    });
    await prisma.$transaction([
      prisma.notificationPreference.create({
        data: { userId: user.id },
      }),
      prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: "USER_REGISTERED",
          entityType: "User",
          entityId: user.id,
        },
      }),
    ]);

    await createSession(user.id, request);
    const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
    const verification = await createEmailVerification(user.id, email, origin);
    return Response.json({ ok: true, verification }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return Response.json(
        { error: "Аккаунт с таким email уже существует." },
        { status: 409 },
      );
    }

    console.error("Registration failed", error);
    return Response.json(
      { error: "Не удалось создать аккаунт. Попробуйте ещё раз." },
      { status: 500 },
    );
  }
}
