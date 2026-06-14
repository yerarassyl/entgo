import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { isSameOriginRequest } from "@/lib/request-security";

const schema = z.object({
  role: z.enum(["STUDENT", "ADMIN", "SUPERADMIN"]).optional(),
  premium: z.boolean().optional(),
}).refine((data) => data.role !== undefined || data.premium !== undefined);

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!isSameOriginRequest(request)) return Response.json({ error: "Недопустимый источник запроса." }, { status: 403 });
  const actor = await getSessionUser();
  if (!actor || !isSuperAdmin(actor.role)) return Response.json({ error: "Только суперадмин может управлять пользователями." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Некорректные данные." }, { status: 400 });
  const { id } = await context.params;
  if (id === actor.id && parsed.data.role && parsed.data.role !== "SUPERADMIN") {
    return Response.json({ error: "Нельзя снять роль с текущего суперадмина." }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    if (parsed.data.role) {
      await tx.user.update({ where: { id }, data: { role: parsed.data.role } });
    }
    if (parsed.data.premium === true) {
      const now = new Date();
      const end = new Date(now);
      end.setDate(end.getDate() + 30);
      await tx.subscription.upsert({
        where: { externalId: `admin-grant-${id}` },
        update: { status: "ACTIVE", plan: "premium", currentStart: now, currentEnd: end },
        create: { userId: id, provider: "admin", externalId: `admin-grant-${id}`, status: "ACTIVE", plan: "premium", currentStart: now, currentEnd: end },
      });
    }
    if (parsed.data.premium === false) {
      await tx.subscription.updateMany({
        where: { userId: id, status: "ACTIVE" },
        data: { status: "CANCELED", currentEnd: new Date() },
      });
    }
    await tx.auditLog.create({
      data: { actorId: actor.id, action: "USER_ACCESS_UPDATED", entityType: "User", entityId: id, metadata: parsed.data },
    });
  });
  return Response.json({ ok: true });
}
