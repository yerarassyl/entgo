"use client";

import { ArrowRight, Check, CreditCard, GraduationCap, RefreshCw, ShieldCheck } from "lucide-react";
import { useState } from "react";

export function PremiumClient({ activeUntil }: { activeUntil: string | null }) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function checkout(plan: "premium" | "until-ent") {
    setLoadingPlan(plan);
    setError("");
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const result = (await response.json()) as { checkoutUrl?: string; error?: string };
      if (!response.ok || !result.checkoutUrl) {
        setError(result.error ?? "Не удалось открыть оплату.");
        return;
      }
      window.location.assign(result.checkoutUrl);
    } catch {
      setError("Не удалось связаться с платежным сервисом. Попробуйте ещё раз.");
    } finally {
      setLoadingPlan(null);
    }
  }

  if (activeUntil) {
    return (
      <div className="mx-auto mt-12 max-w-3xl rounded-[30px] bg-[#2563eb] p-8 text-white shadow-[0_30px_90px_rgba(37,99,235,.2)] sm:p-11">
        <ShieldCheck size={32} />
        <h2 className="mt-6 text-4xl font-extrabold tracking-[-.04em]">Полный план разблокирован</h2>
        <p className="mt-3 text-sm leading-6 text-white/70">Доступ активен до {activeUntil}. Пробники, уроки, AI и прогноз поступления уже доступны.</p>
      </div>
    );
  }

  const plans = [
    {
      id: "premium" as const,
      title: "Premium",
      subtitle: "Самый популярный тариф для регулярной подготовки.",
      price: "4 990 ₸",
      oldPrice: "15 000 ₸",
      note: "в месяц",
      dark: true,
      items: [
        "Полный персональный план",
        "Все пробники ЕНТ",
        "Анализ ошибок",
        "Статистика прогресса",
        "Библиотека тем",
        "AI объяснение ошибок",
        "AI помощник 24/7",
      ],
    },
    {
      id: "until-ent" as const,
      title: "До ЕНТ",
      subtitle: "Разовый доступ до экзамена в текущем сезоне.",
      price: "19 990 ₸",
      oldPrice: "28 000 ₸",
      note: "один платёж до экзамена",
      dark: false,
      items: [
        "Всё из Premium",
        "AI объяснение ошибок",
        "AI помощник 24/7",
        "Персональные рекомендации",
        "Прогноз поступления",
        "Программа 130+",
      ],
    },
  ];

  return (
    <>
      <div className="mt-14 grid items-stretch gap-6 lg:grid-cols-2">
        {plans.map((plan) => (
          <article key={plan.id} className={`relative flex min-h-[620px] flex-col rounded-[30px] border p-7 sm:p-9 ${plan.dark ? "border-[#2563eb] bg-[#2563eb] text-white shadow-[0_30px_80px_rgba(37,99,235,.2)]" : "border-[#dfe5ef] bg-white text-[#172033]"}`}>
            {plan.dark && <span className="absolute -top-3 left-8 rounded-full bg-white px-4 py-1.5 text-xs font-extrabold text-[#2563eb] shadow-sm">Самый популярный</span>}
            <h2 className="text-3xl font-extrabold tracking-[-.04em]">{plan.title}</h2>
            <p className={`mt-3 min-h-12 text-sm leading-6 ${plan.dark ? "text-white/65" : "text-[#737d8e]"}`}>{plan.subtitle}</p>
            <p className="mt-8 text-5xl font-extrabold tracking-[-.055em]">{plan.price}</p>
            <p className={`mt-2 text-sm line-through ${plan.dark ? "text-white/45" : "text-[#9aa3b2]"}`}>раньше {plan.oldPrice}</p>
            <p className={`mt-2 text-sm ${plan.dark ? "text-white/55" : "text-[#7b8495]"}`}>{plan.note}</p>
            <div className={`my-8 h-px ${plan.dark ? "bg-white/15" : "bg-[#e2e7ef]"}`} />
            <p className="text-sm font-extrabold">Что входит</p>
            <ul className="mt-5 space-y-4 text-sm">
              {plan.items.map((item) => <li key={item} className="flex items-start gap-3"><Check className={plan.dark ? "text-[#8bb4ff]" : "text-[#2563eb]"} size={17} strokeWidth={3} />{item}</li>)}
            </ul>
            {plan.dark && (
              <div className="mt-7 rounded-2xl bg-white/10 p-4 text-sm font-semibold leading-6">
                <RefreshCw className="mb-2 text-[#8bb4ff]" size={18} />
                Система автоматически обновляет план после каждого пробника.
              </div>
            )}
            <button onClick={() => checkout(plan.id)} disabled={Boolean(loadingPlan)} className={`group mt-auto flex h-14 w-full items-center justify-center gap-2 rounded-full text-sm font-extrabold disabled:opacity-50 ${plan.dark ? "bg-white text-[#2563eb]" : "border border-[#2563eb] bg-white text-[#2563eb] hover:bg-[#f5f8ff]"}`}>
              {loadingPlan === plan.id ? "Открываем оплату..." : plan.dark ? "Разблокировать мой план" : "Выбрать тариф"}
              {loadingPlan !== plan.id && <ArrowRight className="transition-transform group-hover:translate-x-1" size={17} />}
            </button>
          </article>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-semibold text-[#737d8e]">
        <span className="flex items-center gap-2"><ShieldCheck size={15} /> Без скрытых платежей</span>
        <span className="flex items-center gap-2"><CreditCard size={15} /> Отмена в любой момент</span>
        <span className="flex items-center gap-2"><GraduationCap size={15} /> Доступ сразу после оплаты</span>
      </div>
      {error && <p role="alert" className="mx-auto mt-6 max-w-2xl rounded-xl bg-[#fff1ef] p-4 text-center text-sm font-medium text-danger">{error}</p>}
    </>
  );
}
