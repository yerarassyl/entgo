import { getSessionUser } from "@/lib/auth";
import { createEmailVerification } from "@/lib/email-verification";
import { checkRateLimit } from "@/lib/rate-limit";
import { isSameOriginRequest } from "@/lib/request-security";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "Недопустимый источник запроса." }, { status: 403 });
  }
  const user = await getSessionUser();
  if (!user?.email) return Response.json({ error: "Email не найден." }, { status: 400 });
  if (user.emailVerified) return Response.json({ ok: true, alreadyVerified: true });
  const rate = await checkRateLimit(request, `verify-email:${user.id}`, 3, 60 * 60);
  if (!rate.allowed) {
    return Response.json({ error: "Попробуйте повторить через час." }, { status: 429 });
  }
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  const result = await createEmailVerification(user.id, user.email, origin);
  return Response.json({ ok: true, ...result });
}
