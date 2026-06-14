"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Brand } from "@/components/brand";

export default function PhoneLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("+7");
  const [codeSent, setCodeSent] = useState(false);
  const [developmentCode, setDevelopmentCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function requestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/auth/phone/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const result = (await response.json()) as { error?: string; developmentCode?: string };
    setLoading(false);
    if (!response.ok) return setError(result.error ?? "Не удалось отправить код.");
    setDevelopmentCode(result.developmentCode ?? "");
    setCodeSent(true);
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true);
    setError("");
    const response = await fetch("/api/auth/phone/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code: form.get("code") }),
    });
    const result = (await response.json()) as { error?: string };
    setLoading(false);
    if (!response.ok) return setError(result.error ?? "Не удалось войти.");
    router.push("/dashboard");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-paper px-5 py-12">
      <section className="w-full max-w-md rounded-[28px] border border-line bg-white p-7 sm:p-9">
        <Brand />
        <Smartphone className="mt-10" />
        <h1 className="display mt-4 text-5xl">Вход по телефону</h1>
        <p className="mt-3 text-sm leading-6 text-muted">Отправим одноразовый код. Пароль не нужен.</p>
        {!codeSent ? (
          <form onSubmit={requestCode} className="mt-7">
            <label className="block"><span className="mb-2 block text-sm font-semibold">Номер Казахстана</span><input value={phone} onChange={(event) => setPhone(event.target.value.replace(/[^\d+]/g, "").slice(0, 12))} required pattern="\+7\d{10}" placeholder="+7XXXXXXXXXX" className="h-13 w-full rounded-xl border border-line px-4 text-sm outline-none focus:border-ink" /></label>
            <button disabled={loading} className="mt-6 flex h-13 w-full items-center justify-center gap-2 rounded-full bg-ink text-sm font-semibold text-white disabled:opacity-50">{loading ? "Отправляем..." : "Получить код"}{!loading && <ArrowRight size={16} />}</button>
          </form>
        ) : (
          <form onSubmit={verifyCode} className="mt-7">
            <label className="block"><span className="mb-2 block text-sm font-semibold">Код из SMS</span><input name="code" required inputMode="numeric" pattern="\d{6}" maxLength={6} defaultValue={developmentCode} className="h-13 w-full rounded-xl border border-line px-4 text-center font-mono text-lg tracking-[.35em] outline-none focus:border-ink" /></label>
            {developmentCode && <p className="mt-2 text-xs text-muted">Тестовый код подставлен автоматически.</p>}
            <button disabled={loading} className="mt-6 flex h-13 w-full items-center justify-center gap-2 rounded-full bg-ink text-sm font-semibold text-white disabled:opacity-50">{loading ? "Проверяем..." : "Войти"}{!loading && <ArrowRight size={16} />}</button>
            <button type="button" onClick={() => setCodeSent(false)} className="mt-3 w-full text-sm font-semibold text-muted">Изменить номер</button>
          </form>
        )}
        {error && <p className="mt-4 text-sm font-medium text-danger">{error}</p>}
        <Link href="/login" className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-muted"><ArrowLeft size={15} />Вход по email</Link>
      </section>
    </main>
  );
}
