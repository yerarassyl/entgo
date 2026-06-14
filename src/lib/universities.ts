import "server-only";
import { universityCatalog } from "@/data/universities";
import { prisma } from "@/lib/prisma";

export async function ensureUniversities() {
  for (const university of universityCatalog) {
    const { logoPath, ...databaseUniversity } = university;
    void logoPath;
    await prisma.university.upsert({
      where: { slug: university.slug },
      update: databaseUniversity,
      create: databaseUniversity,
    });
  }
  return prisma.university.findMany({ orderBy: { grantScore: "desc" } });
}
