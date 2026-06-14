"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

const forecasts = [
  { university: "MNU", logo: "/hero-universities/mnu-v2.png", logoClass: "bg-[#a51920]", current: 94, target: 125 },
  { university: "AITU", logo: "/universities/aitu.svg", logoClass: "bg-white", current: 88, target: 118 },
  { university: "NARXOZ", logo: "/hero-universities/narxoz-v2.png", logoClass: "bg-[#df0038]", current: 91, target: 115 },
  { university: "KIMEP", logo: "/hero-universities/kimep.png", logoClass: "bg-white", current: 97, target: 128 },
  { university: "SDU", logo: "/hero-universities/sdu.png", logoClass: "bg-white", current: 90, target: 120 },
] as const;

export function LandingHero() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(
      () => setActive((current) => (current + 1) % forecasts.length),
      8_000,
    );
    return () => window.clearInterval(interval);
  }, []);

  const forecast = forecasts[active];
  const missing = forecast.target - forecast.current;

  return (
    <div className="landing-hero landing-shell grid items-center gap-14 pb-16 lg:grid-cols-[1.16fr_.84fr] lg:gap-14 lg:pb-20">
      <div className="landing-hero-copy">
        <h1
          className="display hero-title max-w-[940px] text-4xl uppercase leading-[1.02] sm:text-6xl lg:text-7xl"
          aria-label="Получи желаемый балл с первой попытки"
        >
          <span className="block whitespace-nowrap">Получи</span>
          <span className="block whitespace-nowrap">Желаемый</span>
          <span className="block whitespace-nowrap">Балл с первой</span>
          <span className="block whitespace-nowrap">попытки</span>
        </h1>
        <p className="mt-8 max-w-2xl text-xl leading-9 text-muted sm:text-2xl">
          ENTGO находит слабые места, прогнозирует балл и показывает самый быстрый путь до выбранного университета.
        </p>
        <div className="landing-hero-action mt-10">
          <Link
            href="/onboarding"
            className="inline-flex h-16 items-center gap-3 rounded-full bg-[#2563eb] px-9 text-base font-semibold text-white shadow-[0_14px_35px_rgba(37,99,235,.24)] hover:-translate-y-0.5 hover:bg-[#1d4ed8]"
          >
            Получить персональный план <ArrowRight size={20} />
          </Link>
        </div>
      </div>

      <div className="landing-forecast-card rounded-[38px] border border-black/10 bg-[#f5f7fb] p-3 shadow-[0_35px_100px_rgba(0,0,0,.13)] lg:scale-105">
        <div className="rounded-[29px] bg-white p-7 sm:p-9">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="min-w-0 flex-1 pl-2 pt-2 sm:pl-4 sm:pt-3">
              <p className="whitespace-nowrap text-[clamp(11px,3.2vw,18px)] font-semibold tracking-[-.03em] sm:text-lg">Желаемый университет</p>
            </div>
            <span className={`grid h-[68px] w-[clamp(80px,25vw,140px)] shrink-0 place-items-center overflow-hidden rounded-2xl px-2 ring-1 ring-black/8 sm:h-[88px] sm:w-40 sm:px-3 ${forecast.logoClass}`}>
              <Image
                key={forecast.university}
                src={forecast.logo}
                alt={forecast.university}
                width={220}
                height={80}
                className="h-10 w-auto max-w-[72px] object-contain sm:h-14 sm:max-w-36"
              />
            </span>
          </div>

          <div className="landing-forecast-stats mt-8 rounded-[24px] bg-[#f4f6fa] p-5">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <p className="text-xs uppercase tracking-[.1em] text-muted">Текущий балл</p>
                <p className="mt-2 text-4xl font-semibold tracking-[-.04em]">{forecast.current}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[.1em] text-muted">Цель</p>
                <p className="mt-2 text-4xl font-semibold tracking-[-.04em]">{forecast.target}+</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[.1em] text-muted">Не хватает</p>
                <p className="mt-2 text-4xl font-semibold tracking-[-.04em]">{missing}</p>
              </div>
              <div className="flex items-center gap-2 text-[#2563eb]">
                <CheckCircle2 size={22} />
                <p className="text-sm font-bold">План составлен</p>
              </div>
            </div>
          </div>

          <div className="landing-forecast-priority mt-5 flex items-center justify-between gap-4 rounded-2xl bg-[#2563eb] px-5 py-4 text-white">
            <div>
              <p className="text-xs font-semibold text-white/70">Первый приоритет</p>
              <p className="mt-1 font-semibold">15 ключевых тем до цели</p>
            </div>
            <ArrowRight className="shrink-0" size={22} />
          </div>

          <div className="mt-5 flex justify-center gap-2" aria-label="Смена прогноза университета">
            {forecasts.map((item, index) => (
              <button
                key={item.university}
                type="button"
                onClick={() => setActive(index)}
                className={`h-1.5 rounded-full transition-all ${index === active ? "w-8 bg-[#2563eb]" : "w-1.5 bg-black/15"}`}
                aria-label={`Показать прогноз для ${item.university}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
