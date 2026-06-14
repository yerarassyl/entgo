import Link from "next/link";
import { ArrowLeft, Award, LockKeyhole, Medal } from "lucide-react";
import { Brand } from "@/components/brand";
import { requirePaidUser } from "@/lib/paid-access";
import { awardAchievements } from "@/lib/achievements";
import { prisma } from "@/lib/prisma";

export default async function AchievementsPage() {
  const user = await requirePaidUser();
  await awardAchievements(user.id);
  const achievements = await prisma.achievement.findMany({
    orderBy: { titleRu: "asc" },
    include: {
      users: {
        where: { userId: user.id },
        select: { earnedAt: true },
      },
    },
  });

  return (
    <main className="mobile-app-page min-h-screen bg-paper pb-16">
      <header className="border-b border-line bg-white">
        <div className="container-shell flex h-18 items-center justify-between">
          <Brand />
          <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-semibold"><ArrowLeft size={16} /> В кабинет</Link>
        </div>
      </header>
      <div className="container-shell py-10 sm:py-16">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-muted">Коллекция достижений</p>
        <h1 className="display mt-4 text-5xl sm:text-7xl">Маленькие победы <span className="italic">складываются в балл.</span></h1>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {achievements.map((achievement) => {
            const earnedAt = achievement.users[0]?.earnedAt;
            return (
              <article key={achievement.id} className={`rounded-[24px] border p-6 ${earnedAt ? "border-ink bg-ink text-white" : "border-line bg-white"}`}>
                {earnedAt ? <Medal size={24} /> : <LockKeyhole size={24} className="text-muted" />}
                <h2 className="mt-12 text-xl font-semibold">{achievement.titleRu}</h2>
                <p className={`mt-2 text-sm leading-6 ${earnedAt ? "text-white/55" : "text-muted"}`}>{achievement.description}</p>
                <p className={`mt-6 text-xs ${earnedAt ? "text-white/40" : "text-muted"}`}>{earnedAt ? `Получено ${new Intl.DateTimeFormat("ru-RU").format(earnedAt)}` : "Пока закрыто"}</p>
              </article>
            );
          })}
        </div>
        {!achievements.length && <div className="mt-10 rounded-2xl bg-white p-8 text-center"><Award className="mx-auto" /><p className="mt-3 font-semibold">Первое достижение уже близко</p></div>}
      </div>
    </main>
  );
}
