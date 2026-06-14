import { createHash } from "node:crypto";
import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { isSameOriginRequest } from "@/lib/request-security";

const schema = z.object({
  token: z.string().min(32).max(200),
  password: z.string().min(10).max(128),
});

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "Недопустимый источник запроса." }, { status: 403 });
  }
  const rateLimit = await checkRateLimit(request, "reset-password", 10, 15 * 60);
  if (!rateLimit.allowed) {
    return Response.json({ error: "Слишком много попыток. Попробуйте позже." }, { status: 429 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Ссылка или пароль некорректны." }, { status: 400 });
  }

  const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");
  const reset = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!reset || reset.usedAt || reset.expiresAt <= new Date()) {
    return Response.json({ error: "Ссылка недействительна или уже истекла." }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: reset.userId },
      data: { passwordHash: await hash(parsed.data.password, 12) },
    }),
    prisma.passwordResetToken.update({
      where: { id: reset.id },
      data: { usedAt: new Date() },
    }),
    prisma.session.deleteMany({ where: { userId: reset.userId } }),
    prisma.auditLog.create({
      data: {
        actorId: reset.userId,
        action: "PASSWORD_RESET",
        entityType: "User",
        entityId: reset.userId,
      },
    }),
  ]);
  return Response.json({ ok: true });
}
