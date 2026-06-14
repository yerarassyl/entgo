import { mobileJson, mobileOptions } from "@/lib/mobile-response";
import { prisma } from "@/lib/prisma";
import { ensureUniversities } from "@/lib/universities";

export function OPTIONS() {
  return mobileOptions();
}

export async function GET() {
  await ensureUniversities();
  const universities = await prisma.university.findMany({
    orderBy: { shortName: "asc" },
    select: { slug: true, shortName: true, name: true, grantScore: true },
  });
  return mobileJson({ universities });
}
