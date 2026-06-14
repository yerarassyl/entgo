import { ArrowRight, Target, TrendingDown } from "lucide-react";
import { LandingHero } from "@/components/landing-hero";
import { LandingFinalCta } from "@/components/landing-final-cta";
import { PlatformShowcase } from "@/components/platform-showcase";
import { RewardShowcase } from "@/components/reward-showcase";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { UniversityCarousel } from "@/components/university-carousel";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="landing-page">
        <section className="landing-hero-screen overflow-hidden border-b border-line pt-16 sm:pt-24">
          <LandingHero />
          <div className="landing-universities relative left-1/2 w-screen -translate-x-1/2 overflow-hidden border-y border-line bg-[#f8f7f3] py-8">
            <p className="mb-5 text-center text-xs font-bold uppercase tracking-[.16em] text-muted">Выбери желаемый университет</p>
            <UniversityCarousel />
          </div>
        </section>

        <section id="features" className="landing-features-section bg-white pb-20 pt-24 sm:pb-24 sm:pt-36">
          <div className="landing-shell">
            <div className="mx-auto max-w-5xl text-center">
              <h2 className="text-4xl font-semibold leading-[1.02] tracking-[-.045em] sm:text-6xl lg:text-7xl">
                Почему большинство не могут поднять свой балл на ЕНТ
              </h2>
            </div>

            <div className="landing-comparison mt-16 grid items-stretch gap-6 lg:grid-cols-[1fr_72px_1fr] lg:gap-7">
              <article className="landing-comparison-card flex min-h-[570px] flex-col rounded-[32px] border border-line bg-[#f3f4f6] p-7 sm:p-9">
                <div className="flex items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-full border border-black/10 bg-white"><TrendingDown size={22} /></span>
                  <h3 className="text-xl font-semibold">Обычная подготовка</h3>
                </div>
                <div className="chaos-tags relative mt-10 min-h-[370px] flex-1">
                  {[
                    "Случайный пробник", "Новая тема", "Ещё один пробник", "Видео на YouTube",
                    "Конспекты", "Теория", "Репетитор", "Telegram канал", "Ещё теория", "Новые задания",
                  ].map((tag, index) => <span key={tag} className={`chaos-tag chaos-tag-${index + 1}`}>{tag}</span>)}
                </div>
                <p className="max-w-md border-t border-black/10 pt-6 text-base leading-7 text-muted">
                  Ученик не понимает, что действительно влияет на результат.
                </p>
              </article>

              <div className="landing-comparison-arrow flex items-center justify-center" aria-hidden="true">
                <ArrowRight size={42} className="rotate-90 text-[#2563eb] lg:rotate-0" strokeWidth={1.5} />
              </div>

              <article className="landing-comparison-card flex min-h-[570px] flex-col rounded-[32px] border border-[#2563eb]/20 bg-white p-7 shadow-[0_24px_80px_rgba(37,99,235,.10)] sm:p-9">
                <div className="flex items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-full bg-[#2563eb]/10 text-[#2563eb]"><Target size={23} /></span>
                  <h3 className="text-xl font-semibold text-[#2563eb]">ENTGO</h3>
                </div>
                <div className="mt-9 grid gap-3">
                  {[
                    ["Самое слабое место", "Проценты", "+4 потенциальных балла"],
                    ["Частая ошибка", "Логарифмы", "+3 потенциальных балла"],
                    ["Самый быстрый рост", "Механика", "+5 потенциальных баллов"],
                  ].map(([label, topic, value], index) => <div key={topic} className="rounded-[22px] border border-[#2563eb]/15 bg-[#f7f9ff] p-5 shadow-[0_10px_35px_rgba(37,99,235,.08)]"><div className="flex items-start justify-between gap-5"><div><p className="text-[11px] font-bold uppercase tracking-[.13em] text-[#2563eb]">{label}</p><p className="mt-2 text-xl font-semibold">{topic}</p></div><span className="text-sm font-bold text-[#2563eb]">0{index + 1}</span></div><p className="mt-5 text-sm font-semibold text-[#2563eb]">{value}</p></div>)}
                </div>
                <div className="mt-4 flex items-center justify-between gap-4 rounded-[22px] bg-[#2563eb] px-5 py-5 text-white">
                  <span className="text-sm font-semibold text-white/75">Найденный потенциал</span>
                  <strong className="text-2xl">+12 баллов</strong>
                </div>
              </article>
            </div>

            <p className="mx-auto mt-12 max-w-2xl text-center text-2xl font-semibold leading-9 tracking-[-.02em] sm:text-3xl">
              Не нужно учить всё.<br />
              <span className="text-[#2563eb]">Нужно знать, что учить дальше.</span>
            </p>
          </div>
        </section>

        <PlatformShowcase />

        <RewardShowcase />

        <LandingFinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
