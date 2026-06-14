import { z } from "zod";
import { prisma } from "@/lib/prisma";

const webhookSchema = z.object({
  reference: z.string().min(10).max(200),
  status: z.enum(["ACTIVE", "PAST_DUE", "CANCELED", "EXPIRED"]),
  currentEnd: z.string().datetime().optional(),
});

export async function POST(request: Request) {
  const configuredSecret = process.env.PAYMENT_WEBHOOK_SECRET;
  const authorization = request.headers.get("authorization");
  if (!configuredSecret || authorization !== `Bearer ${configuredSecret}`) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }
  const parsed = webhookSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid payload." }, { status: 400 });

  const subscription = await prisma.subscription.findUnique({
    where: { externalId: parsed.data.reference },
  });
  if (!subscription) return Response.json({ error: "Subscription not found." }, { status: 404 });

  const defaultEnd = new Date();
  if (subscription.plan === "until-ent") defaultEnd.setMonth(7, 1);
  else defaultEnd.setMonth(defaultEnd.getMonth() + 1);
  await prisma.$transaction([
    prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: parsed.data.status,
        currentStart: parsed.data.status === "ACTIVE" ? new Date() : subscription.currentStart,
        currentEnd: parsed.data.currentEnd ? new Date(parsed.data.currentEnd) : defaultEnd,
      },
    }),
    prisma.auditLog.create({
      data: {
        actorId: subscription.userId,
        action: `SUBSCRIPTION_${parsed.data.status}`,
        entityType: "Subscription",
        entityId: subscription.id,
      },
    }),
  ]);
  return Response.json({ ok: true });
}
