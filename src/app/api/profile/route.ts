import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSameOriginRequest } from "@/lib/request-security";

const profileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  city: z.string().trim().max(80).nullable(),
  school: z.string().trim().max(120).nullable(),
  targetScore: z.number().int().min(60).max(140),
  dailyMinutes: z.number().int().min(15).max(240),
  examDate: z.string().date().nullable(),
  locale: z.enum(["RU", "KK"]),
  emailReminders: z.boolean(),
  weeklySummary: z.boolean(),
  studyReminderAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
});

export async function PATCH(request: Request) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "Недопустимый источник запроса." }, { status: 403 });
  }
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Требуется вход." }, { status: 401 });

  const parsed = profileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Проверьте заполненные поля." }, { status: 400 });
  }

  const { emailReminders, weeklySummary, studyReminderAt, examDate, ...profile } =
    parsed.data;
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        ...profile,
        city: profile.city || null,
        school: profile.school || null,
        examDate: examDate ? new Date(`${examDate}T09:00:00`) : null,
      },
    }),
    prisma.notificationPreference.upsert({
      where: { userId: user.id },
      update: { emailReminders, weeklySummary, studyReminderAt },
      create: {
        userId: user.id,
        emailReminders,
        weeklySummary,
        studyReminderAt,
      },
    }),
    prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "PROFILE_UPDATED",
        entityType: "User",
        entityId: user.id,
      },
    }),
  ]);

  return Response.json({ ok: true });
}
