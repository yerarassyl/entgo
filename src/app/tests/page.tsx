import Link from "next/link";
import { ArrowRight, BrainCircuit, Clock3, ListChecks, Target } from "lucide-react";
import { ProductHeader } from "@/components/product-header";
import { requirePaidUser } from "@/lib/paid-access";
import { getEntitlements } from "@/lib/entitlements";
import { ensureDiagnosticTest } from "@/lib/exam";
import { prisma } from "@/lib/prisma";

export default async function TestsPage() {
  const user = await requirePaidUser();
  await ensureDiagnosticTest();
  const [tests, entitlements] = await Promise.all([
    prisma.test.findMany({
      where: { isPublished: true },
      include: { _count: { select: { questions: true } } },
      orderBy: { createdAt: "asc" },
    }),
    getEntitlements(user.id),
  ]);
  return (
    <main className="mobile-app-page product-v2 min-h-screen bg-paper pb-24">
      <ProductHeader />
      <div className="container-shell py-12 sm:py-16">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-muted">Пробники и практика</p>
        <h1 className="display mt-4 text-5xl sm:text-7xl">Проверь уровень <span className="italic">без подсматривания.</span></h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted">Ответы и объяснения открываются только после завершения. AI во время теста даёт намёк, но уменьшает награду XP.</p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {tests.map((test, index) => (
            <article key={test.id} className={`flex min-h-64 flex-col rounded-[32px] border p-7 md:min-h-80 ${index === 0 ? "border-[#111] bg-[#111] text-white shadow-[0_24px_70px_rgba(0,0,0,.16)]" : "border-line bg-white"}`}>
              {test.type === "DIAGNOSTIC" ? <Target /> : test.type === "TOPIC" ? <BrainCircuit /> : <ListChecks />}
              <h2 className="mt-8 text-xl font-semibold">{test.titleRu}</h2>
              <div className={`mt-4 flex gap-4 text-xs ${index === 0 ? "text-white/55" : "text-muted"}`}><span>{test._count.questions} вопросов</span><span className="inline-flex items-center gap-1"><Clock3 size={13} /> {Math.round(test.durationSec / 60)} мин</span></div>
              <Link href={entitlements.canTakeFullTest ? "/exam" : "/premium"} className={`mt-auto flex h-12 items-center justify-center gap-2 rounded-full text-sm font-semibold ${index === 0 ? "bg-white text-ink" : "bg-ink text-white"}`}>{entitlements.canTakeFullTest ? "Начать" : "Открыть Premium"} <ArrowRight size={16} /></Link>
            </article>
          ))}
          <article className="flex min-h-64 flex-col rounded-[26px] border border-dashed border-line bg-white p-7 md:min-h-80"><BrainCircuit /><h2 className="mt-8 text-xl font-semibold">Тематические тесты</h2><p className="mt-4 text-sm leading-6 text-muted">Короткие проверки по слабым темам появляются в персональном плане.</p><Link href="/topics" className="mt-auto flex h-12 items-center justify-center gap-2 rounded-full border border-ink text-sm font-semibold">Выбрать тему <ArrowRight size={16} /></Link></article>
        </div>
      </div>
    </main>
  );
}
