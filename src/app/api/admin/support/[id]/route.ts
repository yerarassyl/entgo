import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { isSameOriginRequest } from "@/lib/request-security";

const schema = z.object({
  status: z.enum(["NEW", "IN_PROGRESS", "ANSWERED", "CLOSED"]),
  response: z.string().trim().max(4_000).optional(),
});

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user || !isSuperAdmin(user.role)) return Response.json({ error: "Только суперадмин может просматривать вложения." }, { status: 403 });
  const { id } = await context.params;
  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    select: { screenshotUrl: true },
  });
  if (!ticket?.screenshotUrl) return Response.json({ error: "Скриншот не найден." }, { status: 404 });

  const image = ticket.screenshotUrl.match(/^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/);
  if (image) {
    return new Response(Buffer.from(image[1], "base64"), {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `inline; filename="support-${id}.jpg"`,
        "Content-Type": "image/jpeg",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  if (ticket.screenshotUrl.startsWith("/uploads/support/")) {
    return Response.redirect(new URL(ticket.screenshotUrl, request.url));
  }
  return Response.json({ error: "Некорректное вложение." }, { status: 422 });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isSameOriginRequest(request)) return Response.json({ error: "Недопустимый источник запроса." }, { status: 403 });
  const user = await getSessionUser();
  if (!user || !isSuperAdmin(user.role)) return Response.json({ error: "Только суперадмин может отвечать на обращения." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Некорректные данные." }, { status: 400 });
  const { id } = await context.params;
  const ticket = await prisma.supportTicket.update({
    where: { id },
    data: { ...parsed.data, assigneeId: user.id },
  }).catch(() => null);
  if (!ticket) return Response.json({ error: "Обращение не найдено." }, { status: 404 });
  return Response.json(ticket);
}
