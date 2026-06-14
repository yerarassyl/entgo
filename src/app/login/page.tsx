"use client";

import Link from "next/link";
import {
  Apple,
  ArrowDown,
  ArrowRight,
  BookOpen,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Mail,
  Target,
  TrendingUp,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Brand } from "@/components/brand";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    const form = new FormData(event.currentTarget);
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      const result = (await response.json()) as { error?: string; destination?: string };
      if (!response.ok) {
        setError(result.error ?? "Не удалось войти.");
        return;
      }
      router.push(result.destination ?? "/dashboard");
    } catch {
      setError("Нет связи с сервером. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[3fr_2fr]">
      <section className="relative hidden overflow-hidden bg-[#10234d] p-10 text-white lg:flex lg:flex-col xl:p-14">
        <Brand inverse />
        <div className="my-auto max-w-2xl py-10">
          <h1 className="max-w-xl text-6xl font-extrabold leading-[.98] tracking-[-.055em] xl:text-7xl">До гранта осталось меньше, чем кажется.</h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-white/70">Войди в аккаунт и продолжи обучение с того места, где остановился.</p>
          <div className="mt-9 space-y-5">
            {[
              [Target, "Узнаешь, сколько баллов не хватает до цели"],
              [BookOpen, "Получишь список тем с максимальным влиянием на результат"],
              [TrendingUp, "Сможешь отслеживать прогресс до ЕНТ"],
            ].map(([Icon, label]) => {
              const ItemIcon = Icon as typeof Target;
              return <div key={label as string} className="flex items-center gap-4 text-sm font-semibold"><span className="grid size-10 place-items-center rounded-xl bg-white/10 text-[#8bb4ff]"><ItemIcon size={19} /></span>{label as string}</div>;
            })}
          </div>
          <div className="mt-10 max-w-lg rounded-[28px] border border-white/12 bg-white/[.07] p-6 backdrop-blur-sm">
            <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-4 text-center">
              <span><small className="block text-white/50">Текущий уровень</small><strong className="mt-2 block text-3xl">90</strong></span>
              <ArrowDown className="-rotate-90 text-[#8bb4ff]" size={18} />
              <span><small className="block text-white/50">Цель</small><strong className="mt-2 block text-3xl">125</strong></span>
              <ArrowDown className="-rotate-90 text-[#8bb4ff]" size={18} />
              <span><small className="block text-white/50">План</small><strong className="mt-2 block text-3xl">18</strong><small className="text-white/50">тем</small></span>
            </div>
            <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="login-growth-line h-full rounded-full bg-[#6ea1ff]" /></div>
          </div>
        </div>
        <p className="text-xs text-white/40">© 2026 entgo.kz</p>
      </section>

      <section className="flex min-h-screen flex-col bg-[#f8faff]">
        <header className="flex min-h-18 items-center justify-between border-b border-[#e3e8f0] px-5 sm:px-9 lg:justify-end">
          <div className="lg:hidden"><Brand /></div>
          <p className="text-sm text-[#737d8e]">Нет аккаунта? <Link href="/onboarding" className="font-extrabold text-[#172033]">Создать</Link></p>
        </header>
        <div className="flex flex-1 items-center justify-center px-5 py-10">
          <form onSubmit={submit} className="w-full max-w-[480px] rounded-[30px] border border-[#e0e6ef] bg-white p-6 shadow-[0_28px_90px_rgba(24,50,100,.09)] sm:p-9">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#eef5ff] px-3 py-2 text-xs font-bold text-[#2563eb]"><LockKeyhole size={14} /> Безопасный вход</span>
            <h2 className="mt-6 text-4xl font-extrabold tracking-[-.045em] text-[#172033]">Войти в аккаунт</h2>
            <p className="mt-3 text-sm leading-6 text-[#737d8e]">Продолжи работу со своим персональным планом подготовки.</p>

            <div className="mt-8 space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-bold">Email</span>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8a93a3]" size={18} />
                  <input name="email" required type="email" maxLength={254} autoComplete="email" placeholder="you@example.com" className="h-14 w-full rounded-2xl border border-[#dfe5ef] pl-12 pr-4 text-sm outline-none focus:border-[#2563eb]" />
                </div>
              </label>
              <label className="block">
                <div className="mb-2 flex justify-between"><span className="text-sm font-bold">Пароль</span><Link href="/forgot-password" className="text-xs font-semibold text-[#737d8e] hover:text-[#2563eb]">Забыли пароль?</Link></div>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8a93a3]" size={18} />
                  <input name="password" required minLength={8} maxLength={128} type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Ваш пароль" className="h-14 w-full rounded-2xl border border-[#dfe5ef] pl-12 pr-12 text-sm outline-none focus:border-[#2563eb]" />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-2 top-2 grid size-10 place-items-center rounded-xl text-[#737d8e] hover:bg-[#f4f6fa]" aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}>
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </label>
            </div>

            {error && <p role="alert" className="mt-5 rounded-xl bg-[#fff1ef] px-4 py-3 text-sm font-medium text-danger">{error}</p>}

            <button disabled={loading} className="group mt-7 flex h-14 w-full items-center justify-center gap-3 rounded-full bg-[#2563eb] px-6 text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(37,99,235,.2)] disabled:opacity-50">
              {loading ? "Входим..." : "Продолжить"} {!loading && <ArrowRight className="transition-transform group-hover:translate-x-1" size={17} />}
            </button>
            <div className="my-5 flex items-center gap-3 text-xs text-[#8a93a3]"><span className="h-px flex-1 bg-[#e2e7ef]" />или<span className="h-px flex-1 bg-[#e2e7ef]" /></div>
            <Link href="/api/auth/google" className="flex h-14 w-full items-center justify-center gap-3 rounded-full border border-[#dfe5ef] text-sm font-bold hover:bg-[#f7f9fc]">
              <span className="text-lg font-extrabold text-[#4285f4]">G</span> Google
            </Link>
            <button type="button" disabled title="Вход через Apple скоро появится" className="mt-3 flex h-14 w-full items-center justify-center gap-3 rounded-full border border-[#dfe5ef] text-sm font-bold opacity-55">
              <Apple size={19} fill="currentColor" /> Apple
            </button>
            <div className="mt-6 rounded-2xl bg-[#f5f8fc] p-4 text-center text-xs leading-5 text-[#737d8e]">
              Твой прогресс, результаты пробников и персональный план надежно сохраняются в аккаунте.
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
