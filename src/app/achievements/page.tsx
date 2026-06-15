import { Award, LockKeyhole, Medal } from "lucide-react";
import { ProductHeader } from "@/components/product-header";
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
    <main className="mobile-app-page product-v2 min-h-screen bg-paper pb-24">
      <ProductHeader />
      <div className="container-shell py-10 sm:py-16">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-muted">Коллекция достижений</p>
        <h1 className="display mt-4 text-5xl sm:text-7xl">Маленькие победы <span className="italic">складываются в балл.</span></h1>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {achievements.map((achievement) => {
            const earnedAt = achievement.users[0]?.earnedAt;
            return (
              <article key={achievement.id} className={`rounded-[30px] border p-7 ${earnedAt ? "border-[#111] bg-[#111] text-white shadow-[0_20px_55px_rgba(0,0,0,.14)]" : "border-line bg-white"}`}>
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
