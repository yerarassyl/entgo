import Link from "next/link";
import { ArrowLeft, ArrowRight, GraduationCap } from "lucide-react";
import { Brand } from "@/components/brand";
import { ensureUniversities } from "@/lib/universities";

export const dynamic = "force-dynamic";

export default async function UniversitiesPage() {
  const universities = await ensureUniversities();
  return (
    <main className="min-h-screen bg-paper pb-16">
      <header className="border-b border-line bg-white"><div className="container-shell flex h-18 items-center justify-between"><Brand /><Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold"><ArrowLeft size={16} /> На главную</Link></div></header>
      <div className="container-shell py-12 sm:py-20">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-muted">Университеты Казахстана</p>
        <h1 className="display mt-4 max-w-4xl text-5xl leading-none sm:text-7xl">Выбери цель и узнай <span className="italic">шанс на грант.</span></h1>
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {universities.map((university) => (
            <Link key={university.id} href={`/universities/${university.slug}`} className="group rounded-[26px] border border-line bg-white p-7 hover:border-ink">
              <div className="flex items-start justify-between"><div className="grid size-14 place-items-center rounded-2xl bg-ink font-bold text-white">{university.logoText}</div><ArrowRight className="transition-transform group-hover:translate-x-1" /></div>
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
