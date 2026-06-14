import { compare } from "bcryptjs";
import { z } from "zod";
import { createMobileSession } from "@/lib/mobile-auth";
import { mobileJson, mobileOptions } from "@/lib/mobile-response";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(128),
});

export function OPTIONS() {
  return mobileOptions();
}

export async function POST(request: Request) {
  const rate = await checkRateLimit(request, "mobile-login", 12, 15 * 60);
  if (!rate.allowed) return mobileJson({ error: "Слишком много попыток. Попробуйте позже." }, { status: 429 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return mobileJson({ error: "Проверьте email и пароль." }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user?.passwordHash || !(await compare(parsed.data.password, user.passwordHash))) {
    return mobileJson({ error: "Неверный email или пароль." }, { status: 401 });
  }
  if (user.role !== "STUDENT") {
    return mobileJson({ error: "Административный аккаунт открывается в веб-панели." }, { status: 403 });
  }

  const session = await createMobileSession(user.id, request);
  return mobileJson({
    token: session.token,
    expiresAt: session.expires.toISOString(),
    user: { id: user.id, name: user.name, email: user.email },
  });
}

