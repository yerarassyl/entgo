"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import { FormEvent, useState } from "react";
import { Brand } from "@/components/brand";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [developmentResetPath, setDevelopmentResetPath] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true);
    setError("");
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email") }),
    });
    const result = (await response.json()) as {
      error?: string;
      message?: string;
      developmentResetPath?: string;
    };
    setLoading(false);
    if (!response.ok) {
      setError(result.error ?? "Не удалось отправить ссылку.");
      return;
    }
    setMessage(result.message ?? "Проверьте почту.");
    setDevelopmentResetPath(result.developmentResetPath ?? "");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-paper px-5 py-12">
      <section className="w-full max-w-md rounded-[28px] border border-line bg-white p-7 sm:p-9">
        <Brand />
        <Mail className="mt-10" />
        <h1 className="display mt-4 text-5xl">Вернём доступ</h1>
        <p className="mt-3 text-sm leading-6 text-muted">Укажите email аккаунта. Ссылка для создания нового пароля действует 30 минут.</p>
        <form onSubmit={submit} className="mt-7">
          <label className="block"><span className="mb-2 block text-sm font-semibold">Email</span><input name="email" required type="email" maxLength={254} autoComplete="email" className="h-13 w-full rounded-xl border border-line px-4 text-sm outline-none focus:border-ink" /></label>
          {error && <p className="mt-4 text-sm font-medium text-danger">{error}</p>}
          {message && <p className="mt-4 rounded-xl bg-[#edf9f2] p-4 text-sm text-success">{message}</p>}
          {developmentResetPath && <Link href={developmentResetPath} className="mt-3 block text-sm font-bold underline">Открыть тестовую ссылку</Link>}
          <button disabled={loading} className="mt-6 flex h-13 w-full items-center justify-center gap-2 rounded-full bg-ink text-sm font-semibold text-white disabled:opacity-50">{loading ? "Отправляем..." : "Получить ссылку"}{!loading && <ArrowRight size={16} />}</button>
        </form>
        <Link href="/login" className="mt-5 flex items-center justify-center gap-2 text-sm font-semibold text-muted"><ArrowLeft size={15} />Вернуться ко входу</Link>
      </section>
    </main>
  );
}
