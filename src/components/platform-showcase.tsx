"use client";

import Image from "next/image";
import { ArrowDown, ArrowRight, BarChart3, BookOpen, CalendarDays, ClipboardCheck, GraduationCap, LayoutDashboard, Trophy } from "lucide-react";
import { useState } from "react";

const steps = [
  {
    number: "01",
    title: "Выбираешь университет",
    text: "ENTGO понимает, какой балл нужен для поступления.",
    icon: GraduationCap,
  },
  {
    number: "02",
    title: "Проходишь диагностику",
    text: "Чтобы подобрать план обучения, который подходит именно тебе.",
    icon: ClipboardCheck,
  },
  {
    number: "03",
    title: "Получаешь прогноз",
    text: "Видишь текущий уровень и сколько баллов не хватает до цели.",
    icon: BarChart3,
  },
  {
    number: "04",
    title: "Получаешь план",
    text: "Система сама показывает, что учить сегодня.",
    icon: CalendarDays,
  },
] as const;

const screens = [
  { key: "home", label: "Главная", image: "/platform/home.png", icon: LayoutDashboard },
  { key: "tests", label: "Пробники", image: "/platform/tests.png", icon: ClipboardCheck },
  { key: "topics", label: "Темы", image: "/platform/topics.png", icon: BookOpen },
  { key: "plan", label: "Мой план", image: "/platform/plan.png", icon: CalendarDays },
  { key: "statistics", label: "Статистика", image: "/platform/statistics.png", icon: BarChart3 },
  { key: "leaderboard", label: "Рейтинг", image: "/platform/leaderboard.png", icon: Trophy },
  { key: "rewards", label: "Программа 130+", image: "/platform/rewards.png", icon: GraduationCap },
] as const;

export function PlatformShowcase() {
  const [active, setActive] = useState<(typeof screens)[number]["key"]>("home");
  const screen = screens.find((item) => item.key === active) ?? screens[0];

  return (
    <section id="how" className="landing-connected-section bg-white pb-20 sm:pb-24">
      <div className="landing-shell">
        <div className="mx-auto h-px max-w-6xl bg-line" />

        <div className="mx-auto max-w-4xl pt-20 text-center sm:pt-24">
          <h2 className="text-4xl font-semibold leading-[1.02] tracking-[-.05em] sm:text-6xl lg:text-7xl">
            Как работает ENTGO
          </h2>
          <p className="mt-6 text-base leading-7 text-muted sm:text-xl">
            От первого пробника до нужного балла — по понятному плану.
          </p>
        </div>

        <div className="landing-steps mt-16 grid items-stretch gap-4 lg:grid-cols-[1fr_42px_1fr_42px_1fr_42px_1fr] lg:gap-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="contents">
                <article className="landing-step-card flex min-h-64 flex-col rounded-[24px] border border-line bg-white p-6">
                  <div className="flex items-center justify-between">
                    <span className="grid size-11 place-items-center rounded-full border border-[#2563eb]/20 text-[#2563eb]">
                      <Icon size={21} strokeWidth={1.7} />
                    </span>
                    <span className="text-xs font-bold tracking-[.14em] text-[#2563eb]">{step.number}</span>
                  </div>
                  <h3 className="mt-12 text-xl font-semibold tracking-[-.025em]">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted">{step.text}</p>
                </article>
                {index < steps.length - 1 && (
                  <div className="landing-step-arrow flex items-center justify-center text-[#2563eb]" aria-hidden="true">
                    <ArrowRight className="hidden lg:block" size={27} strokeWidth={1.7} />
                    <ArrowDown className="lg:hidden" size={27} strokeWidth={1.7} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mx-auto mt-20 max-w-6xl border-t border-line pt-20 sm:mt-24 sm:pt-24">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-4xl font-semibold leading-[1.02] tracking-[-.05em] sm:text-6xl lg:text-7xl">
              Как выглядит платформа
            </h2>
            <p className="mt-6 text-base leading-7 text-muted sm:text-lg">
              Все инструменты подготовки связаны в одном понятном интерфейсе.
            </p>
          </div>

          <div className="platform-tabs mx-auto mt-12 flex max-w-6xl flex-wrap justify-center gap-2">
            {screens.map((item) => {
              const Icon = item.icon;
              const selected = item.key === active;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActive(item.key)}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold ${selected ? "bg-[#2563eb] text-white" : "text-muted hover:bg-paper hover:text-ink"}`}
                  aria-pressed={selected}
                >
                  <Icon size={16} strokeWidth={1.8} />
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="platform-screen mx-auto mt-8 w-[min(92%,1380px)] overflow-hidden rounded-[18px] border border-line bg-[#f7f7f4]">
            <Image
              key={screen.key}
              src={screen.image}
              alt={`Интерфейс ENTGO: ${screen.label}`}
              width={1440}
              height={920}
              className="aspect-[36/23] h-auto w-full object-cover object-top"
              priority={screen.key === "home"}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
