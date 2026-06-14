import { getMobileSessionUser } from "@/lib/mobile-auth";
import { mobileJson, mobileOptions } from "@/lib/mobile-response";
import { prisma } from "@/lib/prisma";
import { getEntitlements } from "@/lib/entitlements";

export function OPTIONS() {
  return mobileOptions();
}

export async function GET(request: Request) {
  const user = await getMobileSessionUser(request);
  if (!user) return mobileJson({ error: "Требуется вход." }, { status: 401 });
  const [profile, entitlements] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      include: { desiredUniversity: true },
    }),
    getEntitlements(user.id),
  ]);
  return mobileJson({
    id: profile.id,
    name: profile.name,
    email: profile.email,
    city: profile.city,
    school: profile.school,
    targetScore: profile.targetScore ?? 120,
    dailyMinutes: profile.dailyMinutes ?? 45,
    examDate: profile.examDate?.toISOString() ?? null,
    xp: profile.xp,
    university: profile.desiredUniversity
      ? { name: profile.desiredUniversity.shortName, grantScore: profile.desiredUniversity.grantScore }
      : null,
    premium: entitlements.paid,
  });
}

