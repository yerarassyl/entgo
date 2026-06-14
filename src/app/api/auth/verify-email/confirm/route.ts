import { createHash } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isSameOriginRequest } from "@/lib/request-security";

const schema = z.object({ token: z.string().min(32).max(200) });

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "Недопустимый источник запроса." }, { status: 403 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Ссылка некорректна." }, { status: 400 });
  const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");
  const verification = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
  });
  if (!verification || verification.usedAt || verification.expiresAt <= new Date()) {
    return Response.json({ error: "Ссылка истекла или уже использована." }, { status: 400 });
  }
  await prisma.$transaction([
    prisma.emailVerificationToken.update({
      where: { id: verification.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: verification.userId },
      data: { emailVerified: new Date() },
    }),
    prisma.auditLog.create({
      data: {
        actorId: verification.userId,
        action: "EMAIL_VERIFIED",
        entityType: "User",
        entityId: verification.userId,
      },
    }),
  ]);
  return Response.json({ ok: true });
}
