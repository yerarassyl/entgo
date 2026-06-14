import { z } from "zod";
import { getMobileSessionUser } from "@/lib/mobile-auth";
import { mobileJson, mobileOptions } from "@/lib/mobile-response";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  targetScore: z.number().int().min(50).max(140).optional(),
  examDate: z.string().date().nullable().optional(),
  dailyMinutes: z.number().int().min(10).max(240).optional(),
});

export function OPTIONS() {
  return mobileOptions();
}

export async function PATCH(request: Request) {
  const user = await getMobileSessionUser(request);
  if (!user) return mobileJson({ error: "Требуется вход." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return mobileJson({ error: "Проверьте данные профиля." }, { status: 400 });
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...parsed.data,
      examDate: parsed.data.examDate ? new Date(`${parsed.data.examDate}T12:00:00.000Z`) : parsed.data.examDate,
    },
    include: { desiredUniversity: true },
  });
  return mobileJson({
    user: {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      targetScore: updated.targetScore,
      examDate: updated.examDate?.toISOString() ?? null,
      dailyMinutes: updated.dailyMinutes,
      xp: updated.xp,
      university: updated.desiredUniversity?.shortName ?? null,
    },
  });
}
