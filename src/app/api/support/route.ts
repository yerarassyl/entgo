import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { getEntitlements } from "@/lib/entitlements";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { isSameOriginRequest } from "@/lib/request-security";

const schema = z.object({
  message: z.string().trim().min(5).max(2_000),
  pageUrl: z.string().url().max(1_000),
  screenshot: z.string().max(3_000_000).optional(),
});

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return Response.json({ error: "Недопустимый источник запроса." }, { status: 403 });
  const user = await getSessionUser();
  const rate = await checkRateLimit(request, `support:${user?.id ?? "guest"}`, 5, 3_600);
  if (!rate.allowed) return Response.json({ error: "Слишком много обращений. Попробуйте позже." }, { status: 429 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Проверьте текст обращения." }, { status: 400 });

  let screenshotUrl: string | undefined;
  const image = parsed.data.screenshot?.match(/^data:image\/jpeg;base64,(.+)$/);
  if (image) {
    const directory = path.join(process.cwd(), "public", "uploads", "support");
    await mkdir(directory, { recursive: true });
    const filename = `${randomUUID()}.jpg`;
    await writeFile(path.join(directory, filename), Buffer.from(image[1], "base64"));
    screenshotUrl = `/uploads/support/${filename}`;
  }
  const entitlements = user ? await getEntitlements(user.id) : null;
  const ticket = await prisma.supportTicket.create({
    data: {
      userId: user?.id,
      message: parsed.data.message,
      pageUrl: parsed.data.pageUrl,
      screenshotUrl,
      userAgent: request.headers.get("user-agent")?.slice(0, 500),
      subscription: entitlements?.plan ?? "guest",
    },
  });
  return Response.json({ id: ticket.id }, { status: 201 });
}
