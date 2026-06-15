import Image from "next/image";
import Link from "next/link";
import { ArrowRight, GraduationCap } from "lucide-react";
import { ProductHeader } from "@/components/product-header";
import { universityCatalog } from "@/data/universities";
import { ensureUniversities } from "@/lib/universities";

export const dynamic = "force-dynamic";

export default async function UniversitiesPage() {
  const universities = await ensureUniversities();
  return (
    <main className="mobile-app-page product-v2 min-h-screen bg-paper pb-24">
      <ProductHeader />
      <div className="container-shell py-12 sm:py-20">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-muted">Университеты Казахстана</p>
        <h1 className="display mt-4 max-w-4xl text-5xl leading-none sm:text-7xl">Выбери цель и узнай <span className="italic">шанс на грант.</span></h1>
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {universities.map((university) => (
            <Link key={university.id} href={`/universities/${university.slug}`} className="group rounded-[32px] border border-line bg-white p-8 hover:-translate-y-1 hover:border-[#111] hover:shadow-[0_22px_60px_rgba(0,0,0,.07)]">
              <div className="flex items-start justify-between"><div className="grid h-16 w-24 place-items-center overflow-hidden rounded-2xl border border-line bg-[#f8f9fc] p-2"><Image src={universityCatalog.find((item) => item.slug === university.slug)?.logoPath ?? "/universities/aitu.svg"} alt={`Логотип ${university.shortName}`} width={120} height={64} className="h-full w-full object-contain" /></div><ArrowRight className="text-[#2563eb] transition-transform group-hover:translate-x-1" /></div>
              <h2 className="mt-6 text-xl font-semibold">{university.shortName}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{university.name}</p>
              <div className="mt-6 flex items-center gap-2 text-sm font-semibold"><GraduationCap size={17} /> Ориентир для гранта: {university.grantScore}</div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
