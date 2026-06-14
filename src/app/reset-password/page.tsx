"use client";

import Link from "next/link";
import { ArrowRight, KeyRound } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { Brand } from "@/components/brand";

function ResetPasswordForm() {
  const token = useSearchParams().get("token") ?? "";
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true);
    setError("");
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password: form.get("password") }),
    });
    const result = (await response.json()) as { error?: string };
    setLoading(false);
    if (!response.ok) {
      setError(result.error ?? "Не удалось изменить пароль.");
      return;
    }
    setDone(true);
  }

  return (
    <section className="w-full max-w-md rounded-[28px] border border-line bg-white p-7 sm:p-9">
      <Brand />
      <KeyRound className="mt-10" />
      <h1 className="display mt-4 text-5xl">Новый пароль</h1>
      {done ? (
        <>
          <p className="mt-4 rounded-xl bg-[#edf9f2] p-4 text-sm text-success">Пароль изменён, все старые сессии завершены.</p>
          <Link href="/login" className="mt-6 flex h-13 items-center justify-center gap-2 rounded-full bg-ink text-sm font-semibold text-white">Войти <ArrowRight size={16} /></Link>
        </>
      ) : (
        <form onSubmit={submit} className="mt-7">
          <label className="block"><span className="mb-2 block text-sm font-semibold">Пароль, минимум 10 символов</span><input name="password" required type="password" minLength={10} maxLength={128} autoComplete="new-password" className="h-13 w-full rounded-xl border border-line px-4 text-sm outline-none focus:border-ink" /></label>
          {error && <p className="mt-4 text-sm font-medium text-danger">{error}</p>}
          <button disabled={loading || !token} className="mt-6 flex h-13 w-full items-center justify-center gap-2 rounded-full bg-ink text-sm font-semibold text-white disabled:opacity-40">{loading ? "Сохраняем..." : "Изменить пароль"}{!loading && <ArrowRight size={16} />}</button>
        </form>
      )}
    </section>
  );
}

export default function ResetPasswordPage() {
  return <main className="grid min-h-screen place-items-center bg-paper px-5 py-12"><Suspense><ResetPasswordForm /></Suspense></main>;
}
