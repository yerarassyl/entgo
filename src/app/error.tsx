"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[app-error]", error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f7f4] px-5 text-center">
      <div className="max-w-md">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-muted">EntGo</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Страница временно не загрузилась</h1>
        <p className="mt-3 text-sm leading-6 text-muted">Данные не потерялись. Попробуйте обновить страницу или вернитесь в личный кабинет.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button onClick={() => reset()} className="rounded-full bg-[#2563eb] px-6 py-3 text-sm font-semibold text-white">Повторить</button>
          <Link href="/dashboard" className="rounded-full border border-line bg-white px-6 py-3 text-sm font-semibold">В кабинет</Link>
        </div>
      </div>
    </main>
  );
}
