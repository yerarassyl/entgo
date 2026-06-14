import Image from "next/image";
import { BadgeCheck, Gift, Trophy } from "lucide-react";

const benefits = [
  { icon: Trophy, label: "Только для учеников ENTGO" },
  { icon: BadgeCheck, label: "Официальный результат ЕНТ" },
  { icon: Gift, label: "Подарки каждого сезона" },
];

export function RewardShowcase() {
  return (
    <section
      className="landing-reward-section overflow-hidden bg-white"
      aria-labelledby="reward-title"
    >
      <div className="landing-shell">
        <div className="mx-auto h-px max-w-6xl bg-line" />
      </div>

      <div className="landing-shell flex min-h-[700px] flex-col items-center pb-20 pt-20 text-center sm:min-h-[830px] sm:pb-24 sm:pt-24">
        <div>
          <h2
            id="reward-title"
            className="text-4xl font-semibold leading-[1.02] tracking-[-.045em] sm:text-6xl lg:text-7xl"
          >
            Набрал 130+ на ЕНТ?
            <span className="mt-2 block">Забери награду.</span>
          </h2>
        </div>

        <div className="reward-benefits mt-10 grid w-full max-w-4xl grid-cols-3 gap-2 sm:mt-12 sm:gap-4">
          {benefits.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex min-w-0 flex-col items-center justify-center gap-2 rounded-2xl border border-[#2563eb]/18 bg-white px-2 py-4 text-[10px] font-semibold leading-4 sm:flex-row sm:gap-3 sm:px-5 sm:py-4 sm:text-sm"
            >
              <Icon
                className="size-5 shrink-0 text-[#2563eb]"
                strokeWidth={1.8}
                aria-hidden="true"
              />
              <span>{label}</span>
            </div>
          ))}
        </div>

        <div className="reward-image mt-8 flex min-h-0 w-full flex-1 items-center justify-center sm:mt-10">
          <Image
            src="/rewards/airpods-season-v2.png"
            alt="Белые беспроводные наушники в открытом зарядном кейсе"
            width={896}
            height={770}
            priority={false}
            className="h-auto max-h-[430px] w-auto max-w-[92vw] object-contain sm:max-h-[570px]"
          />
        </div>

        <p className="mt-5 max-w-2xl text-xs leading-5 text-muted sm:text-sm">
          Награды сезона могут меняться. Актуальные условия публикуются внутри платформы.
        </p>
      </div>
    </section>
  );
}
