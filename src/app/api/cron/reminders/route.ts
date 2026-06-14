import { prisma } from "@/lib/prisma";
import { sendStudyReminderEmail } from "@/lib/email";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const users = await prisma.user.findMany({
    where: {
      email: { not: null },
      preferences: { emailReminders: true },
      plans: {
        some: {
          tasks: {
            some: {
              scheduledAt: { gte: today, lt: tomorrow },
              completedAt: null,
            },
          },
        },
      },
    },
    select: { id: true, email: true, name: true },
    take: 1_000,
  });

  let sent = 0;
  for (let offset = 0; offset < users.length; offset += 10) {
    const batch = users.slice(offset, offset + 10);
    const results = await Promise.all(
      batch.map((user) =>
        sendStudyReminderEmail(user.email!, user.name).catch(() => false),
      ),
    );
    sent += results.filter(Boolean).length;
  }
  return Response.json({
    ok: true,
    eligible: users.length,
    sent,
  });
}
