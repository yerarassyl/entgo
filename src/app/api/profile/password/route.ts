import { compare, hash } from "bcryptjs";
import { z } from "zod";
import { deleteSession, getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { isSameOriginRequest } from "@/lib/request-security";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(8).max(128),
    newPassword: z.string().min(10).max(128),
  })
  .refine((value) => value.currentPassword !== value.newPassword, {
    message: "Новый пароль должен отличаться от текущего.",
  });

export async function PATCH(request: Request) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "Недопустимый источник запроса." }, { status: 403 });
  }
  const user = await getSessionUser();
  if (!user?.passwordHash) {
    return Response.json({ error: "Смена пароля недоступна." }, { status: 401 });
  }
  const rateLimit = await checkRateLimit(request, `password:${user.id}`, 5, 15 * 60);
  if (!rateLimit.allowed) {
    return Response.json({ error: "Слишком много попыток. Попробуйте позже." }, { status: 429 });
  }

  const parsed = passwordSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Проверьте пароль." }, { status: 400 });
  }
  if (!(await compare(parsed.data.currentPassword, user.passwordHash))) {
    return Response.json({ error: "Текущий пароль указан неверно." }, { status: 401 });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hash(parsed.data.newPassword, 12) },
    }),
    prisma.session.deleteMany({ where: { userId: user.id } }),
    prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "PASSWORD_CHANGED",
        entityType: "User",
        entityId: user.id,
      },
    }),
  ]);
  await deleteSession();
  return Response.json({ ok: true });
}
