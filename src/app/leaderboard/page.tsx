import Link from "next/link";
import { Crown, Flame, Medal } from "lucide-react";
import { ProductHeader } from "@/components/product-header";
import { requirePaidUser } from "@/lib/paid-access";
import { prisma } from "@/lib/prisma";

function publicName(name: string | null, index: number) {
  if (!name) return `Ученик ${index + 1}`;
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0]} ${parts[1][0]}.` : parts[0];
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string }>;
}) {
  const currentUser = await requirePaidUser();
  const { scope = "global" } = await searchParams;
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const where =
    scope === "city" && currentUser.city
      ? { city: currentUser.city }
      : scope === "school" && currentUser.school
        ? { school: currentUser.school }
        : scope === "friends"
          ? { id: "__friends_not_configured__" }
          : {};

  const users = await prisma.user.findMany({
    where: { role: "STUDENT", OR: [{ xp: { gt: 0 } }, { attempts: { some: { status: "COMPLETED" } } }], ...where },
    select: {
      id: true,
      name: true,
      city: true,
      school: true,
      xp: true,
      streaks: { select: { points: true, minutes: true } },
      achievements: { select: { achievementId: true } },
      xpTransactions: { where: { createdAt: { gte: weekAgo } }, select: { amount: true } },
      attempts: {
        where: { status: "COMPLETED", score: { not: null } },
        orderBy: { completedAt: "desc" },
        take: 1,
        select: { score: true },
      },
    },
    take: 200,
  });

  const ranking = users
    .map((user) => {
      const activityPoints = user.streaks.reduce((sum, row) => sum + row.points, 0);
      const minutes = user.streaks.reduce((sum, row) => sum + row.minutes, 0);
      const score = user.attempts[0]?.score ?? 0;
      const weeklyXp = user.xpTransactions.reduce((sum, row) => sum + row.amount, 0);
      return { ...user, activityPoints, minutes, score, weeklyXp, rating: user.xp };
    })
    .sort((a, b) => b.rating - a.rating || b.minutes - a.minutes)
    .slice(0, 100);
  const currentPosition = ranking.findIndex((user) => user.id === currentUser.id);
  const nextUser = currentPosition > 0 ? ranking[currentPosition - 1] : null;
  const currentRankedUser = currentPosition >= 0 ? ranking[currentPosition] : null;
  const xpToNext = nextUser && currentRankedUser ? Math.max(1, nextUser.xp - currentRankedUser.xp + 1) : null;

  return (
    <main className="mobile-app-page product-v2 min-h-screen bg-paper pb-24">
      <ProductHeader />
      <div className="container-shell py-10 sm:py-16">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-muted">Рейтинг учеников</p>
        <h1 className="display mt-4 text-5xl sm:text-7xl">Соревнуйся <span className="italic">с собой и друзьями.</span></h1>
        <div className="mt-8 flex flex-wrap gap-2">
          {[["global", "Весь Казахстан"], ["city", currentUser.city ?? "Мой город"], ["school", currentUser.school ?? "Моя школа"], ["friends", "Друзья"]].map(([value, label]) => (
            <Link key={value} href={`/leaderboard?scope=${value}`} className={`rounded-full px-4 py-2 text-sm font-semibold ${scope === value ? "bg-ink text-white" : "border border-line bg-white"}`}>{label}</Link>
          ))}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[26px] bg-[#111] p-6 text-white"><p className="text-xs text-white/45">Активных учеников</p><p className="display mt-1 text-4xl">{ranking.length}</p></div>
          <div className="rounded-2xl border border-line bg-white p-5"><p className="text-xs text-muted">Следующая цель</p><p className="mt-2 font-semibold">{xpToNext && nextUser ? `${xpToNext} XP, чтобы обогнать ${publicName(nextUser.name, currentPosition - 1)}` : "Ты на вершине этого рейтинга"}</p></div>
          <div className="rounded-2xl border border-line bg-white p-5"><p className="text-xs text-muted">Изменение за неделю</p><p className="display mt-1 text-4xl">+{currentRankedUser?.weeklyXp ? Math.max(1, Math.round(currentRankedUser.weeklyXp / 30)) : 0} мест</p></div>
        </div>

        <section className="mt-6 overflow-hidden rounded-[26px] border border-line bg-white">
          <div className="grid grid-cols-[50px_1fr_70px] gap-3 border-b border-line px-5 py-4 text-xs font-bold uppercase tracking-[.12em] text-muted sm:grid-cols-[70px_1fr_120px]">
            <span>Место</span><span>Ученик</span><span className="text-right">XP</span>
          </div>
          <div className="divide-y divide-line">
            {ranking.map((user, index) => (
              <div key={user.id} className={`grid grid-cols-[50px_1fr_70px] items-center gap-3 px-5 py-4 sm:grid-cols-[70px_1fr_120px] ${user.id === currentUser.id ? "bg-paper" : ""}`}>
                <span className="font-bold">{index === 0 ? <Crown size={20} /> : index < 3 ? <Medal size={20} /> : `#${index + 1}`}</span>
                <div className="min-w-0"><p className="truncate text-sm font-semibold">{publicName(user.name, index)}{user.id === currentUser.id ? " · ты" : ""}</p><p className="mt-1 flex items-center gap-1 text-xs text-muted"><Flame size={12} /> серия {Math.min(30, user.streaks.length)} дней · {user.achievements.length} значков</p></div>
                <span className="text-right text-sm font-bold">{user.rating} XP</span>
              </div>
            ))}
          </div>
          {!ranking.length && <p className="p-10 text-center text-sm text-muted">{scope === "friends" ? "Добавление друзей появится после приглашения одноклассников. Пустые тестовые аккаунты здесь не показываются." : "В этом рейтинге пока нет активных участников."}</p>}
        </section>
      </div>
    </main>
  );
}
