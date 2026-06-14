import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { isSameOriginRequest } from "@/lib/request-security";

const schema = z.object({ plan: z.enum(["premium", "until-ent"]) });

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "Недопустимый источник запроса." }, { status: 403 });
  }
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Требуется вход." }, { status: 401 });
  const rate = await checkRateLimit(request, `checkout:${user.id}`, 5, 10 * 60);
  if (!rate.allowed) {
    return Response.json({ error: "Слишком много запросов. Попробуйте позже." }, { status: 429 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Тариф не найден." }, { status: 400 });

  const checkoutBase = process.env.PAYMENT_CHECKOUT_URL;
  if (!checkoutBase) {
    return Response.json(
      { error: "Платёжный провайдер ещё не настроен администратором." },
      { status: 503 },
    );
  }

  const externalId = `entgo-${randomUUID()}`;
  const now = new Date();
  await prisma.subscription.create({
    data: {
      userId: user.id,
      provider: process.env.PAYMENT_PROVIDER ?? "external",
      externalId,
      status: "PAST_DUE",
      plan: parsed.data.plan,
      currentStart: now,
      currentEnd: new Date(now.getTime() + 30 * 60 * 1_000),
    },
  });

  const checkoutUrl = new URL(checkoutBase);
  checkoutUrl.searchParams.set("reference", externalId);
  checkoutUrl.searchParams.set("plan", parsed.data.plan);
  if (user.email) checkoutUrl.searchParams.set("email", user.email);
  checkoutUrl.searchParams.set(
    "return_url",
    `${process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin}/premium?payment=return`,
  );
  return Response.json({ checkoutUrl: checkoutUrl.toString() });
}
