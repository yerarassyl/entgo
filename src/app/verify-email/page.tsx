"use client";

import Link from "next/link";
import { CheckCircle2, MailCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Brand } from "@/components/brand";

function VerifyEmailContent() {
  const token = useSearchParams().get("token") ?? "";
  const [state, setState] = useState<"loading" | "done" | "error">("loading");
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!token) {
      const timer = window.setTimeout(() => {
        setState("error");
        setMessage("В ссылке нет токена подтверждения.");
      }, 0);
      return () => window.clearTimeout(timer);
    }
    void fetch("/api/auth/verify-email/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }).then(async (response) => {
      const result = (await response.json()) as { error?: string };
      setState(response.ok ? "done" : "error");
      setMessage(response.ok ? "Email подтверждён." : result.error ?? "Не удалось подтвердить email.");
    });
  }, [token]);
  return (
    <section className="w-full max-w-md rounded-[28px] border border-line bg-white p-8 text-center">
      <Brand />
      {state === "done" ? <CheckCircle2 className="mx-auto mt-10 text-success" size={34} /> : <MailCheck className="mx-auto mt-10" size={34} />}
      <h1 className="display mt-5 text-5xl">{state === "loading" ? "Проверяем ссылку" : state === "done" ? "Почта подтверждена" : "Ссылка не сработала"}</h1>
      <p className="mt-4 text-sm leading-6 text-muted">{state === "loading" ? "Это займёт несколько секунд." : message}</p>
      {state !== "loading" && <Link href="/dashboard" className="mt-7 flex h-13 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">Перейти в кабинет</Link>}
    </section>
  );
}

export default function VerifyEmailPage() {
  return <main className="grid min-h-screen place-items-center bg-paper px-5"><Suspense><VerifyEmailContent /></Suspense></main>;
}
