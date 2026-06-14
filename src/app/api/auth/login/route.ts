import { compare } from "bcryptjs";
import { z } from "zod";
import { createSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { isSameOriginRequest } from "@/lib/request-security";
import { isStaffRole } from "@/lib/authorization";
import { getActiveSubscription } from "@/lib/subscription";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "Недопустимый источник запроса." }, { status: 403 });
  }

  const rateLimit = await checkRateLimit(request, "login", 10, 15 * 60);
  if (!rateLimit.allowed) {
    return Response.json(
      { error: "Слишком много попыток. Попробуйте позже." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Проверьте email и пароль." }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });

    if (
      !user?.passwordHash ||
      !(await compare(parsed.data.password, user.passwordHash))
    ) {
      return Response.json(
        { error: "Неверный email или пароль." },
        { status: 401 },
      );
    }

    await createSession(user.id, request);
    const destination = isStaffRole(user.role)
      ? "/admin"
      : (await getActiveSubscription(user.id))
        ? "/dashboard"
        : "/premium?required=1";
    return Response.json({ ok: true, destination });
  } catch (error) {
    console.error("Login failed", error);
    return Response.json(
      { error: "Не удалось войти. Попробуйте ещё раз." },
      { status: 500 },
    );
  }
}
