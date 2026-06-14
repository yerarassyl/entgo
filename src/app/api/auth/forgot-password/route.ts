import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { sendPasswordResetEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { isSameOriginRequest } from "@/lib/request-security";

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
});

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "Недопустимый источник запроса." }, { status: 403 });
  }
  const rateLimit = await checkRateLimit(request, "forgot-password", 5, 15 * 60);
  if (!rateLimit.allowed) {
    return Response.json({ error: "Слишком много запросов. Попробуйте позже." }, { status: 429 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Укажите корректный email." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  let developmentResetPath: string | undefined;
  if (user) {
    const token = randomBytes(32).toString("base64url");
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: createHash("sha256").update(token).digest("hex"),
        expiresAt: new Date(Date.now() + 30 * 60 * 1_000),
      },
    });
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
    const resetPath = `/reset-password?token=${encodeURIComponent(token)}`;
    await sendPasswordResetEmail(user.email!, `${appUrl}${resetPath}`);
    if (process.env.NODE_ENV !== "production" && !process.env.RESEND_API_KEY) {
      developmentResetPath = resetPath;
    }
  }

  return Response.json({
    ok: true,
    message: "Если аккаунт существует, ссылка отправлена на email.",
    developmentResetPath,
  });
}
