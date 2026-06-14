import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { createSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { isSameOriginRequest } from "@/lib/request-security";

const schema = z.object({
  phone: z.string().regex(/^\+7\d{10}$/),
  code: z.string().regex(/^\d{6}$/),
});

function codeHash(phone: string, code: string) {
  return createHmac("sha256", process.env.AUTH_SECRET ?? "local-development")
    .update(`${phone}:${code}`)
    .digest("hex");
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "Недопустимый источник запроса." }, { status: 403 });
  }
  const rate = await checkRateLimit(request, "phone-verify", 10, 15 * 60);
  if (!rate.allowed) {
    return Response.json({ error: "Слишком много попыток. Попробуйте позже." }, { status: 429 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Проверьте номер и код." }, { status: 400 });

  const verification = await prisma.phoneVerificationCode.findFirst({
    where: {
      phone: parsed.data.phone,
      usedAt: null,
      expiresAt: { gt: new Date() },
      attempts: { lt: 5 },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!verification) {
    return Response.json({ error: "Код истёк. Запросите новый." }, { status: 400 });
  }
  const expected = Buffer.from(verification.codeHash, "hex");
  const received = Buffer.from(codeHash(parsed.data.phone, parsed.data.code), "hex");
  const valid = expected.length === received.length && timingSafeEqual(expected, received);
  if (!valid) {
    await prisma.phoneVerificationCode.update({
      where: { id: verification.id },
      data: { attempts: { increment: 1 } },
    });
    return Response.json({ error: "Неверный код." }, { status: 401 });
  }

  const user = await prisma.$transaction(async (tx) => {
    await tx.phoneVerificationCode.update({
      where: { id: verification.id },
      data: { usedAt: new Date() },
    });
    const existing = await tx.user.findUnique({ where: { phone: parsed.data.phone } });
    if (existing) {
      return tx.user.update({
        where: { id: existing.id },
        data: { phoneVerified: existing.phoneVerified ?? new Date() },
      });
    }
    const created = await tx.user.create({
      data: {
        phone: parsed.data.phone,
        phoneVerified: new Date(),
        name: `Ученик ${parsed.data.phone.slice(-4)}`,
        trialEndsAt: null,
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: created.id,
        action: "PHONE_ACCOUNT_CREATED",
        entityType: "User",
        entityId: created.id,
      },
    });
    return created;
  });
  await createSession(user.id, request);
  return Response.json({ ok: true });
}
