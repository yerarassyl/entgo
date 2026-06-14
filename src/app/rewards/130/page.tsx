import Link from "next/link";
import { ArrowLeft, Gift, ShieldCheck, Trophy } from "lucide-react";
import { Brand } from "@/components/brand";
import { RewardClaimForm } from "@/components/reward-claim-form";
import { requirePaidUser } from "@/lib/paid-access";
import { prisma } from "@/lib/prisma";

export default async function Reward130Page() {
  const user = await requirePaidUser();
  const [claim, winners, winnerProfiles] = await Promise.all([
    prisma.rewardClaim.findUnique({ where: { userId: user.id } }),
    prisma.rewardClaim.count({ where: { status: { in: ["APPROVED", "DELIVERED"] } } }),
    prisma.rewardClaim.findMany({
      where: { status: { in: ["APPROVED", "DELIVERED"] } },
      orderBy: { updatedAt: "desc" },
      take: 3,
      select: {
        officialScore: true,
        user: { select: { name: true, city: true } },
      },
    }),
  ]);
  const now = new Date();
  const daysToExam = user.examDate ? Math.max(0, Math.ceil((user.examDate.getTime() - now.getTime()) / 86_400_000)) : 47;
  return (
    <main className="mobile-app-page min-h-screen bg-paper pb-16">
      <header className="border-b border-line bg-white"><div className="container-shell flex h-18 items-center justify-between"><Brand /><Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold"><ArrowLeft size={16} /> В кабинет</Link></div></header>
      <div className="container-shell grid gap-8 py-12 lg:grid-cols-[1fr_.8fr] lg:py-20">
        <section><span className="grid size-16 place-items-center rounded-2xl bg-ink text-white"><Trophy /></span><h1 className="display mt-7 text-6xl leading-none sm:text-8xl">130+ на ЕНТ? <span className="italic">Это достойно подарка.</span></h1><p className="mt-6 max-w-2xl text-lg leading-8 text-muted">Участники, которые готовились в ENTGO и подтвердили официальный результат 130+, могут получить AirPods из текущей призовой программы.</p><div className="mt-8 grid gap-3 sm:grid-cols-2"><p className="rounded-2xl bg-white p-5 text-sm"><Gift size={17} /><strong className="mt-4 block">{winners ? `Уже ${winners} учеников получили подарки` : "Первые подтверждённые победители появятся здесь"}</strong><span className="mt-1 block text-muted">Публикуем только проверенные результаты и только с согласия участника.</span></p><p className="rounded-2xl bg-white p-5 text-sm"><ShieldCheck size={17} /><strong className="mt-4 block">До ЕНТ осталось {daysToExam} дней</strong><span className="mt-1 block text-muted">Возможно, следующим обладателем AirPods станешь ты.</span></p></div>
        {winnerProfiles.length > 0 && <div className="mt-4 grid gap-3 sm:grid-cols-3">{winnerProfiles.map((winner, index) => { const name = winner.user.name ?? `Ученик ${index + 1}`; return <div key={`${name}-${winner.officialScore}`} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4"><span className="grid size-11 shrink-0 place-items-center rounded-full bg-ink text-sm font-bold text-white">{name.slice(0, 1).toUpperCase()}</span><div><p className="text-sm font-semibold">{name}</p><p className="text-xs text-muted">{winner.officialScore} баллов · {winner.user.city ?? "Казахстан"}</p></div></div>; })}</div>}
        <div className="mt-8 grid grid-cols-4 gap-2 text-center text-xs">{["Отправлена", "Проверяется", "Одобрена", "Подарок"].map((step, index) => <div key={step}><span className="mx-auto grid size-8 place-items-center rounded-full bg-ink font-bold text-white">{index + 1}</span><p className="mt-2 text-muted">{step}</p></div>)}</div><p className="mt-8 text-xs leading-5 text-muted">В сезоне осталось {Math.max(0, 20 - winners)} подарков. Приём заявок действует до 31 августа 2026 года. Заявка не гарантирует выдачу до завершения проверки.</p></section>
        <RewardClaimForm existingStatus={claim?.status ?? null} />
      </div>
    </main>
  );
}
