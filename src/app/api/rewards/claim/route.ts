import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { isSameOriginRequest } from "@/lib/request-security";

const schema = z.object({
  officialScore: z.number().int().min(130).max(140),
  proofUrl: z.string().url().max(1_000),
  contact: z.string().trim().min(5).max(100),
});

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return Response.json({ error: "Недопустимый источник запроса." }, { status: 403 });
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Требуется вход." }, { status: 401 });
  const rate = await checkRateLimit(request, `reward:${user.id}`, 3, 86_400);
  if (!rate.allowed) return Response.json({ error: "Заявка уже отправлялась сегодня." }, { status: 429 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Проверь балл, ссылку и контакт." }, { status: 400 });
  const claim = await prisma.rewardClaim.upsert({
    where: { userId: user.id },
    update: { ...parsed.data, status: "SUBMITTED", reviewerNote: null },
    create: { userId: user.id, ...parsed.data },
  });
  await prisma.auditLog.create({ data: { actorId: user.id, action: "REWARD_130_SUBMITTED", entityType: "RewardClaim", entityId: claim.id } });
  return Response.json({ status: claim.status });
}
