import { createHmac, randomInt } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { isSameOriginRequest } from "@/lib/request-security";
import { sendSms } from "@/lib/sms";

const schema = z.object({
  phone: z.string().regex(/^\+7\d{10}$/),
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
  const rate = await checkRateLimit(request, "phone-code", 5, 15 * 60);
  if (!rate.allowed) {
    return Response.json({ error: "Слишком много запросов. Попробуйте позже." }, { status: 429 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Введите номер в формате +7XXXXXXXXXX." }, { status: 400 });
  }
  const code = String(randomInt(100_000, 1_000_000));
  await prisma.phoneVerificationCode.create({
    data: {
      phone: parsed.data.phone,
      codeHash: codeHash(parsed.data.phone, code),
      expiresAt: new Date(Date.now() + 10 * 60 * 1_000),
    },
  });
  const sent = await sendSms(
    parsed.data.phone,
    `Код входа entgo.kz: ${code}. Действует 10 минут.`,
  ).catch(() => false);
  return Response.json({
    ok: true,
    sent,
    developmentCode:
      process.env.NODE_ENV !== "production" && !process.env.SMS_SEND_URL
        ? code
        : undefined,
  });
}
