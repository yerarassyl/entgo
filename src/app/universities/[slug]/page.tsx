import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, ExternalLink, GraduationCap } from "lucide-react";
import { notFound } from "next/navigation";
import { Brand } from "@/components/brand";
import { getSessionUser } from "@/lib/auth";
import { calculateAdmissionChance, calculateForecast } from "@/lib/forecast";
import { ensureUniversities } from "@/lib/universities";
import { prisma } from "@/lib/prisma";

export default async function UniversityPage({ params }: { params: Promise<{ slug: string }> }) {
  await ensureUniversities();
  const { slug } = await params;
  const university = await prisma.university.findUnique({ where: { slug } });
  if (!university) notFound();
  const user = await getSessionUser();
  const forecast = user ? await calculateForecast(user.id) : null;
  const current = forecast?.expected ?? null;
  const chance = current === null ? null : calculateAdmissionChance(current, university.grantScore);
  const programs = Array.isArray(university.programs) ? university.programs.filter((item): item is string => typeof item === "string") : [];

  return (
    <main className="min-h-screen bg-paper pb-16">
      <header className="border-b border-line bg-white"><div className="container-shell flex h-18 items-center justify-between"><Brand /><Link href="/universities" className="inline-flex items-center gap-2 text-sm font-semibold"><ArrowLeft size={16} /> Все вузы</Link></div></header>
      <div className="container-shell grid gap-8 py-12 lg:grid-cols-[1.15fr_.85fr] lg:py-20">
        <section>
          <div className="grid size-20 place-items-center rounded-[24px] bg-ink text-xl font-bold text-white">{university.logoText}</div>
          <p className="mt-8 text-xs font-bold uppercase tracking-[.16em] text-muted">{university.city}</p>
          <h1 className="display mt-3 text-5xl leading-none sm:text-7xl">{university.shortName}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">{university.description}</p>
          <h2 className="mt-10 text-lg font-semibold">Популярные направления</h2>
          <div className="mt-4 flex flex-wrap gap-2">{programs.map((program) => <span key={program} className="rounded-full border border-line bg-white px-4 py-2 text-sm">{program}</span>)}</div>
          {university.website && <a href={university.website} target="_blank" rel="noreferrer" className="mt-8 inline-flex items-center gap-2 text-sm font-bold underline underline-offset-4">Официальный сайт <ExternalLink size={15} /></a>}
        </section>
        <aside className="h-fit rounded-[28px] bg-ink p-7 text-white sm:p-9 lg:sticky lg:top-8">
          <div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-[.15em] text-white/45">Твой прогноз поступления</p><GraduationCap size={20} /></div>
          <h2 className="display mt-6 text-5xl">{university.shortName}</h2>
          {forecast ? (
            <div className="mt-8 space-y-4">
              <div className="flex justify-between border-b border-white/15 pb-4"><span className="text-white/55">Текущий прогноз</span><strong>{forecast.expected}</strong></div>
              <div className="flex justify-between border-b border-white/15 pb-4"><span className="text-white/55">Для гранта нужно</span><strong>{university.grantScore}</strong></div>
              <div className="flex justify-between border-b border-white/15 pb-4"><span className="text-white/55">Не хватает</span><strong>{Math.max(0, university.grantScore - forecast.expected)}</strong></div>
              <div className="flex justify-between"><span className="text-white/55">Шанс поступления</span><strong>{chance}%</strong></div>
              <Link href="/dashboard" className="mt-7 flex h-13 items-center justify-center gap-2 rounded-full bg-white text-sm font-semibold text-ink">Открыть мой план <ArrowRight size={16} /></Link>
            </div>
          ) : (
            <div className="mt-8">
              <CheckCircle2 />
              <p className="mt-4 text-lg font-semibold">Сдай пробник и узнай свой шанс</p>
              <p className="mt-2 text-sm leading-6 text-white/55">ENTGO сравнит твой прогноз с ориентиром на грант и покажет, какие темы быстрее закроют разрыв.</p>
              <Link href="/onboarding" className="mt-7 flex h-13 items-center justify-center gap-2 rounded-full bg-white text-sm font-semibold text-ink">Узнать прогноз <ArrowRight size={16} /></Link>
            </div>
          )}
        </aside>
      </div>
      <section className="container-shell pb-12 lg:pb-20">
        <div className="grid gap-4 rounded-[28px] border border-line bg-white p-6 sm:grid-cols-3 sm:p-8">
          <div><p className="text-xs font-bold uppercase tracking-[.12em] text-muted">Ориентир</p><p className="display mt-3 text-4xl">{university.grantScore}</p><p className="mt-2 text-sm text-muted">баллов для конкурентной заявки на грант</p></div>
          <div><p className="text-xs font-bold uppercase tracking-[.12em] text-muted">Как использовать</p><p className="mt-3 text-sm leading-6">Сравни прогноз с ориентиром и выбери темы с самым быстрым ожидаемым приростом.</p></div>
          <div><p className="text-xs font-bold uppercase tracking-[.12em] text-muted">Важно</p><p className="mt-3 text-sm leading-6">Проходные баллы меняются по программам и годам. Перед подачей проверь официальные условия университета.</p></div>
        </div>
      </section>
    </main>
  );
}
