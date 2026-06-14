import { hash } from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";
import { z } from "zod";
import { createEmailVerification } from "@/lib/email-verification";
import { createMobileSession } from "@/lib/mobile-auth";
import { mobileJson, mobileOptions } from "@/lib/mobile-response";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { ensureUniversities } from "@/lib/universities";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(10).max(128).regex(/[A-Za-zА-Яа-яЁё]/).regex(/\d/),
  targetScore: z.number().int().min(60).max(140),
  dailyMinutes: z.number().int().min(10).max(240).default(45),
  desiredUniversitySlug: z.string().min(2).max(80),
  examDate: z.string().date().nullable().optional(),
});

export function OPTIONS() {
  return mobileOptions();
}

export async function POST(request: Request) {
  const rate = await checkRateLimit(request, "mobile-register", 5, 15 * 60);
  if (!rate.allowed) return mobileJson({ error: "Слишком много попыток. Попробуйте позже." }, { status: 429 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return mobileJson({ error: "Проверьте заполненные поля и пароль." }, { status: 400 });
  try {
    await ensureUniversities();
    const university = await prisma.university.findUnique({
      where: { slug: parsed.data.desiredUniversitySlug },
      select: { id: true },
    });
    if (!university) return mobileJson({ error: "Выберите университет." }, { status: 400 });
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash: await hash(parsed.data.password, 12),
        targetScore: parsed.data.targetScore,
        dailyMinutes: parsed.data.dailyMinutes,
        examDate: parsed.data.examDate ? new Date(`${parsed.data.examDate}T09:00:00`) : null,
        desiredUniversityId: university.id,
      },
    });
    await prisma.$transaction([
      prisma.notificationPreference.create({ data: { userId: user.id } }),
      prisma.auditLog.create({
        data: { actorId: user.id, action: "USER_REGISTERED_MOBILE", entityType: "User", entityId: user.id },
      }),
    ]);
    const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
    const verification = await createEmailVerification(user.id, parsed.data.email, origin);
    const session = await createMobileSession(user.id, request);
    return mobileJson({
      token: session.token,
      expiresAt: session.expires.toISOString(),
      verification,
      user: { id: user.id, name: user.name, email: user.email },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return mobileJson({ error: "Аккаунт с таким email уже существует." }, { status: 409 });
    }
    console.error("Mobile registration failed", error);
    return mobileJson({ error: "Не удалось создать аккаунт." }, { status: 500 });
  }
}
