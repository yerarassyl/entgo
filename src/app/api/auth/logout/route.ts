import { deleteSession } from "@/lib/auth";
import { isSameOriginRequest } from "@/lib/request-security";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "Недопустимый источник запроса." }, { status: 403 });
  }

  await deleteSession();
  return Response.json({ ok: true });
}
