import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { isSameOriginRequest } from "@/lib/request-security";

const schema = z.object({
  status: z.enum(["SUBMITTED", "REVIEWING", "APPROVED", "REJECTED", "DELIVERED"]),
  reviewerNote: z.string().trim().max(2_000).optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!isSameOriginRequest(request)) return Response.json({ error: "Недопустимый источник запроса." }, { status: 403 });
  const actor = await getSessionUser();
  if (!actor || !isSuperAdmin(actor.role)) return Response.json({ error: "Только суперадмин может проверять заявки." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Некорректный статус." }, { status: 400 });
  const { id } = await context.params;
  const claim = await prisma.rewardClaim.update({ where: { id }, data: parsed.data });
  await prisma.auditLog.create({ data: { actorId: actor.id, action: "REWARD_CLAIM_UPDATED", entityType: "RewardClaim", entityId: id, metadata: { status: claim.status } } });
  return Response.json({ status: claim.status });
}
