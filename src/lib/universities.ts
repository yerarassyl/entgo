import "server-only";
import { universityCatalog } from "@/data/universities";
import { prisma } from "@/lib/prisma";

export async function ensureUniversities() {
  const existingCount = await prisma.university.count();
  if (existingCount < universityCatalog.length) {
    await Promise.all(universityCatalog.map((university) => {
      const { logoPath, ...databaseUniversity } = university;
      void logoPath;
      return prisma.university.upsert({
        where: { slug: university.slug },
        update: databaseUniversity,
        create: databaseUniversity,
      });
    }));
  }
  return prisma.university.findMany({ orderBy: { grantScore: "desc" } });
}
