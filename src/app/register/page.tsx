"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Brand } from "@/components/brand";
import { universityCatalog } from "@/data/universities";

const registerUniversities = [
  ...universityCatalog,
  {
    slug: "other",
    shortName: "Другой вуз",
    city: "Казахстан",
  },
];

type OnboardingData = {
  score: number;
  currentScore?: number;
  desiredUniversitySlug?: string;
  city?: string;
  date: string[];
  subjects: string[];
  time: string[];
  method: string[];
};

export default function RegisterPage() {
  const router = useRouter();
  const [onboarding, setOnboarding] = useState<OnboardingData>({
    score: 120,
    date: [],
    subjects: [],
    time: [],
    method: [],
  });
  const [hasOnboarding, setHasOnboarding] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [skipCity, setSkipCity] = useState(false);
  const [skipSchool, setSkipSchool] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem("entgo-onboarding");
    const timer = window.setTimeout(() => {
      if (raw) {
        setOnboarding(JSON.parse(raw) as OnboardingData);
        setHasOnboarding(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    const form = new FormData(event.currentTarget);
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          password: form.get("password"),
          consent: form.get("consent") === "on",
          desiredUniversitySlug: form.get("desiredUniversitySlug"),
          examDate: form.get("examDate") || null,
          city: skipCity ? null : form.get("city") || null,
          school: skipSchool ? null : form.get("school") || null,
          onboarding,
        }),
      });
      const result = (await response.json()) as {
        error?: string;
        verification?: { developmentPath?: string };
      };

      if (!response.ok) {
        setError(result.error ?? "Не удалось создать аккаунт.");
        return;
      }

      router.push("/premium?welcome=1");
    } catch {
      setError("Нет связи с сервером. Проверьте интернет и попробуйте снова.");
    } finally {
      setLoading(false);
    }
  }

  function googleAuth() {
    const university = document.querySelector<HTMLSelectElement>(
      'select[name="desiredUniversitySlug"]',
    )?.value;
    const examDate = document.querySelector<HTMLInputElement>(
      'input[name="examDate"]',
    )?.value;
    const city = skipCity ? "" : document.querySelector<HTMLInputElement>('input[name="city"]')?.value.trim();
    const school = skipSchool ? "" : document.querySelector<HTMLInputElement>('input[name="school"]')?.value.trim();
    if (!university) {
      setError("Сначала выберите желаемый университет.");
      return;
    }
    window.location.assign(
      `/api/auth/google?university=${encodeURIComponent(university)}&targetScore=${onboarding?.score ?? 120}${examDate ? `&examDate=${encodeURIComponent(examDate)}` : ""}${city ? `&city=${encodeURIComponent(city)}` : ""}${school ? `&school=${encodeURIComponent(school)}` : ""}`,
    );
  }

  return (
    <main className="product-auth-page min-h-screen bg-paper">
      <header className="border-b border-line bg-white">
        <div className="container-shell flex h-18 items-center justify-between">
          <Brand />
          <span className="text-xs font-bold uppercase tracking-[.14em] text-muted">Последний шаг</span>
        </div>
      </header>

      <section className="container-shell grid min-h-[calc(100vh-72px)] items-start gap-10 py-10 lg:grid-cols-[.85fr_1.15fr] lg:gap-16 lg:py-16">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-bold">
            <LockKeyhole size={14} /> Результат сохранится в аккаунте
          </div>
          <h1 className="display mt-7 text-5xl leading-[.95] sm:text-7xl">
            Создай аккаунт и <span className="italic">выбери подписку.</span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-muted">
            После регистрации выбери тариф. Оплата откроет полный пробник, темы роста, слабые места, разбор ошибок и план до цели в {onboarding.score} баллов.
          </p>
          {!hasOnboarding && <p className="mt-4 rounded-2xl bg-white p-4 text-sm leading-6 text-muted">Ты можешь зарегистрироваться сразу. После создания аккаунта выберешь подписку, а цель и параметры подготовки настроишь перед пробником.</p>}
          <div className="mt-8 space-y-3">
            {["Узнаешь, сколько баллов не хватает до гранта", "Увидишь темы, которые сильнее всего мешают результату", "Получишь персональный план роста"].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm font-semibold">
                <span className="grid size-6 place-items-center rounded-full bg-[#2563eb] text-white"><Check size={13} /></span>
                {item}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={submit} className="mx-auto w-full max-w-lg rounded-[28px] border border-line bg-white p-6 shadow-[0_24px_80px_rgba(0,0,0,.07)] sm:p-9">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.14em] text-muted">Регистрация перед оплатой</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-.03em]">Данные для входа</h2>
          </div>

          <div className="mt-7 space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold">Имя</span>
              <input name="name" required minLength={2} maxLength={80} autoComplete="name" placeholder="Например, Данияр" className="h-13 w-full rounded-xl border border-line px-4 text-sm outline-none focus:border-ink" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 flex justify-between text-sm font-semibold">Город <button type="button" aria-label={skipCity ? "Указать город" : "Не хочу отвечать: город"} onClick={() => setSkipCity((value) => !value)} className="text-xs font-normal text-muted underline">{skipCity ? "Указать город" : "Не хочу отвечать"}</button></span>
                <input key={onboarding.city ?? "city"} name="city" disabled={skipCity} defaultValue={onboarding.city ?? ""} maxLength={80} placeholder={skipCity ? "Не указано" : "Например, Алматы"} className="h-13 w-full rounded-xl border border-line px-4 text-sm outline-none disabled:bg-paper disabled:text-muted focus:border-ink" />
              </label>
              <label className="block">
                <span className="mb-2 flex justify-between text-sm font-semibold">Школа <button type="button" aria-label={skipSchool ? "Указать школу" : "Не хочу отвечать: школа"} onClick={() => setSkipSchool((value) => !value)} className="text-xs font-normal text-muted underline">{skipSchool ? "Указать школу" : "Не хочу отвечать"}</button></span>
                <input name="school" disabled={skipSchool} maxLength={120} placeholder={skipSchool ? "Не указано" : "Например, школа №25"} className="h-13 w-full rounded-xl border border-line px-4 text-sm outline-none disabled:bg-paper disabled:text-muted focus:border-ink" />
              </label>
            </div>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold">Желаемый университет</span>
              <select key={onboarding.desiredUniversitySlug ?? "empty"} name="desiredUniversitySlug" required defaultValue={onboarding.desiredUniversitySlug ?? ""} className="h-13 w-full rounded-xl border border-line bg-white px-4 text-sm outline-none focus:border-ink">
                <option value="" disabled>Выберите университет</option>
                {registerUniversities.map((university) => <option key={university.slug} value={university.slug}>{university.shortName} · {university.city}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold">
                Дата ЕНТ
                <span className="text-xs font-normal text-muted">необязательно</span>
              </span>
              <input name="examDate" type="date" min={new Date().toISOString().slice(0, 10)} className="h-13 w-full rounded-xl border border-line px-4 text-sm outline-none focus:border-ink" />
              <span className="mt-2 block text-xs leading-5 text-muted">Если дата ещё неизвестна, просто пропусти. Её можно добавить позже в настройках.</span>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold">Email</span>
              <input name="email" required type="email" maxLength={254} autoComplete="email" placeholder="you@example.com" className="h-13 w-full rounded-xl border border-line px-4 text-sm outline-none focus:border-ink" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold">Пароль</span>
              <div className="relative">
                <input name="password" required minLength={10} maxLength={128} pattern="(?=.*[A-Za-zА-Яа-яЁё])(?=.*\d).{10,}" title="Минимум 10 символов, одна буква и одна цифра" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="10+ символов, буква и цифра" className="h-13 w-full rounded-xl border border-line px-4 pr-12 text-sm outline-none focus:border-ink" />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-1.5 top-1.5 grid size-10 place-items-center rounded-lg text-muted hover:bg-paper" aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}>
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>
            <label className="flex cursor-pointer items-start gap-3 text-xs leading-5 text-muted">
              <input name="consent" required type="checkbox" className="mt-1 size-4 shrink-0 accent-black" />
              <span>Я принимаю условия использования и политику конфиденциальности.</span>
            </label>
          </div>

          {error && <p role="alert" className="mt-5 rounded-xl bg-[#fff1ef] px-4 py-3 text-sm font-medium text-danger">{error}</p>}

          <button disabled={loading} className="mt-7 flex h-14 w-full items-center justify-center gap-3 rounded-full bg-[#2563eb] px-6 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(37,99,235,.2)] disabled:opacity-50">
            {loading ? "Создаём аккаунт..." : "Создать аккаунт и выбрать подписку"} {!loading && <ArrowRight size={17} />}
          </button>
          <div className="my-5 flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-line" />или<span className="h-px flex-1 bg-line" /></div>
          <button type="button" onClick={googleAuth} className="flex h-14 w-full items-center justify-center rounded-full border border-line text-sm font-semibold hover:bg-paper">
            Продолжить через Google
          </button>
          <Link href="/onboarding" className="mx-auto mt-4 flex min-h-11 w-fit items-center gap-2 px-3 text-xs font-semibold text-muted hover:text-ink">
            <ArrowLeft size={14} /> {hasOnboarding ? "Изменить ответы" : "Сначала настроить цель"}
          </Link>
        </form>
      </section>
    </main>
  );
}
