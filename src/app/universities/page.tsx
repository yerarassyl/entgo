import { ProductHeader } from "@/components/product-header";
import { UniversitiesClient, type UniversityItem } from "@/components/universities-client";
import { universityCatalog } from "@/data/universities";
import { getSessionUser } from "@/lib/auth";
import { calculateAdmissionChance, calculateForecast } from "@/lib/forecast";
import { ensureUniversities } from "@/lib/universities";

export const dynamic = "force-dynamic";

export default async function UniversitiesPage() {
  const [rawUniversities, user] = await Promise.all([
    ensureUniversities(),
    getSessionUser(),
  ]);

  const forecast = user ? await calculateForecast(user.id) : null;
  const currentExpected = forecast?.expected ?? null;

  const universities: UniversityItem[] = rawUniversities.map((u) => {
    const catalogEntry = universityCatalog.find((c) => c.slug === u.slug);
    const programs = Array.isArray(u.programs)
      ? u.programs.filter((item): item is string => typeof item === "string")
      : [];
    const chance = currentExpected === null ? null : calculateAdmissionChance(currentExpected, u.grantScore);

    return {
      id: u.id,
      slug: u.slug,
      name: u.name,
      shortName: u.shortName,
      city: u.city,
      grantScore: u.grantScore,
      description: u.description,
      website: u.website,
      programs: programs.length ? programs : [...(catalogEntry?.programs ?? [])],
      logoPath: catalogEntry?.logoPath ?? "/universities/aitu.svg",
      chance,
    };
  });

  return (
    <main className="mobile-app-page product-v2 min-h-screen bg-paper pb-24">
      <ProductHeader />
      <div className="container-shell py-12 sm:py-20">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-muted">Университеты Казахстана</p>
        <h1 className="display mt-4 max-w-4xl text-5xl leading-none sm:text-7xl">
          Выбери цель и узнай <span className="italic">шанс на грант.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
          Сравнивай проходные баллы казахстанских вузов, фильтруй по городам и рассчитывай свои шансы на поступление.
        </p>
        <div className="mt-10">
          <UniversitiesClient
            universities={universities}
            userTargetId={user?.desiredUniversityId ?? null}
            userForecast={currentExpected}
          />
        </div>
      </div>
    </main>
  );
}

