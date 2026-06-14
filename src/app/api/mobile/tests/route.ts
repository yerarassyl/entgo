import { getEntitlements } from "@/lib/entitlements";
import { ensureDiagnosticTest } from "@/lib/exam";
import { getMobileSessionUser } from "@/lib/mobile-auth";
import { mobileJson, mobileOptions } from "@/lib/mobile-response";
import { prisma } from "@/lib/prisma";

export function OPTIONS() {
  return mobileOptions();
}

export async function GET(request: Request) {
  const user = await getMobileSessionUser(request);
  if (!user) return mobileJson({ error: "Требуется вход." }, { status: 401 });
  await ensureDiagnosticTest();
  const [tests, entitlements] = await Promise.all([
    prisma.test.findMany({
      where: { isPublished: true },
      include: { _count: { select: { questions: true } } },
      orderBy: { createdAt: "asc" },
    }),
    getEntitlements(user.id),
  ]);
  return mobileJson({
    canTakeFullTest: entitlements.canTakeFullTest,
    canUseTopics: entitlements.canUseTopics,
    plan: entitlements.plan,
    tests: tests.map((test) => ({
      id: test.id,
      title: test.titleRu,
      type: test.type,
      durationSec: test.durationSec,
      questions: test._count.questions,
    })),
  });
}
