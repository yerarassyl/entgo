import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSameOriginRequest } from "@/lib/request-security";

const profileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  city: z.string().trim().max(80).nullable().optional(),
  school: z.string().trim().max(120).nullable().optional(),
  targetScore: z.number().int().min(60).max(140).optional(),
  dailyMinutes: z.number().int().min(15).max(240).optional(),
  examDate: z.string().date().nullable().optional(),
  locale: z.enum(["RU", "KK"]).optional(),
  desiredUniversityId: z.string().nullable().optional(),
  profileSubjects: z.array(z.string()).optional(),
  emailReminders: z.boolean().optional(),
  weeklySummary: z.boolean().optional(),
  studyReminderAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
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

  const {
    emailReminders = true,
    weeklySummary = true,
    studyReminderAt = "18:00",
    examDate,
    desiredUniversityId,
    profileSubjects,
    ...profile
  } = parsed.data;

  const updateData: Record<string, unknown> = {
    ...profile,
  };
  if (profile.city !== undefined) updateData.city = profile.city || null;
  if (profile.school !== undefined) updateData.school = profile.school || null;
  if (examDate !== undefined) updateData.examDate = examDate ? new Date(`${examDate}T09:00:00`) : null;
  if (desiredUniversityId !== undefined) updateData.desiredUniversityId = desiredUniversityId || null;
  if (profileSubjects !== undefined) updateData.profileSubjects = profileSubjects;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: updateData,
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
